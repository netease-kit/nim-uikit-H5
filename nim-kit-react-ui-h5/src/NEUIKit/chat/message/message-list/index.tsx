import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { caculateTimeago } from '@/NEUIKit/common/utils/date'
import { events, MSG_ID_FLAG } from '@/NEUIKit/common/utils/constants'
import emitter from '@/NEUIKit/common/utils/eventBus'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'

import MessageItem from '../message-item'
import { getMessageSelectKey } from '../message-multi-select/utils'
import './index.less'

interface MessageListProps {
  msgs: any[]
  conversationType: V2NIMConst.V2NIMConversationType
  to: string
  loadingOlder?: boolean
  hasOlder?: boolean
  replyMsgsMap?: {
    [key: string]: any
  }
  voiceTextMap?: Map<string, string>
  setVoiceText?: (messageClientId: string, text: string) => void
  anchorMessageClientId?: string
  anchorMode?: boolean
  loadingNewer?: boolean
  autoScrollToBottom?: boolean
  onLoadOlder?: (firstMsg?: any) => void | Promise<unknown>
  onLoadNewer?: (lastMsg?: any) => void | Promise<unknown>
  /**
   * show：是否需要展示“回到最新”入口（滚过最后一条正常消息的高度才算离开最新）
   * source：本次判定的触发来源
   * atLatest：视口是否真的在消息列表底部（仅能测量时透传），用于新消息提醒的计数与位置保持
   */
  onLatestVisibilityChange?: (show: boolean, source: LatestVisibilitySource, atLatest?: boolean) => void
  isMultiSelecting?: boolean
  isScrollLocked?: boolean
  selectedMessageIds?: string[]
  onToggleSelect?: (msg: any) => void
  onMultiSelect?: (msg: any) => void
}

export type LatestVisibilitySource = 'scroll' | 'layout' | 'restore' | 'programmatic'

export interface MessageListScrollSnapshot {
  anchorMessageClientId: string
  anchorOffsetTop: number
  scrollTop: number
}

export interface MessageListHandle {
  captureScrollPosition: () => MessageListScrollSnapshot | null
  restoreScrollPosition: (snapshot: MessageListScrollSnapshot | null) => void
}

const isNormalMsg = (item: any) => !(item.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && (item.timeValue !== undefined || ['beReCallMsg', 'reCallMsg'].includes(item.recallType || '')))

/**
 * 消息列表组件
 */
const MessageList = observer(
  forwardRef<MessageListHandle, MessageListProps>(({
    msgs = [],
    conversationType,
    to,
    loadingOlder = false,
    hasOlder = true,
    replyMsgsMap = {},
    voiceTextMap = new Map(),
    setVoiceText,
    anchorMessageClientId = '',
    anchorMode = false,
    loadingNewer = false,
    autoScrollToBottom = true,
    onLoadOlder,
    onLoadNewer,
    onLatestVisibilityChange,
    isMultiSelecting = false,
    isScrollLocked = false,
    selectedMessageIds = [],
    onToggleSelect,
    onMultiSelect
  }, ref) => {
    const { t } = useTranslation()
    const { store } = useStateContext()
    const messageListRef = useRef<HTMLDivElement>(null)
    const onLatestVisibilityChangeRef = useRef(onLatestVisibilityChange)
    const anchorScrollStateRef = useRef({
      anchorMessageClientId: '',
      scrolled: false
    })
    const pagingLockRef = useRef(false)
    const loadingOlderRef = useRef(loadingOlder)
    const loadingNewerRef = useRef(loadingNewer)
    const isMultiSelectingRef = useRef(isMultiSelecting)
    const isScrollLockedRef = useRef(isScrollLocked)
    const restoringScrollPositionRef = useRef(false)
    const shouldStickToBottomRef = useRef(true)
    const programmaticScrollFrameRef = useRef(0)
    // 锚定后的“沉降期”：锚定滚动成功后的一小段时间内持续把锚点保持在视口中心（见 startAnchorSettle）
    const ANCHOR_SETTLE_MS = 2000
    const anchorSettleFrameRef = useRef(0)
    const anchorSettleUntilRef = useRef(0)
    const anchorSettleIdRef = useRef('')
    const onLoadMoreRef = useRef<() => void>(() => undefined)
    const pendingPaginationRef = useRef<{
      direction: 'older' | 'newer'
      prevScrollHeight: number
      prevScrollTop: number
    } | null>(null)
    const [broadcastNewAudioSrc, setBroadcastNewAudioSrc] = useState('')
    isMultiSelectingRef.current = isMultiSelecting
    isScrollLockedRef.current = isScrollLocked

    useImperativeHandle(ref, () => ({
      captureScrollPosition: () => {
        const container = messageListRef.current
        if (!container) return null
        const containerTop = container.getBoundingClientRect().top
        const anchor = Array.from(
          container.querySelectorAll<HTMLElement>(`[id^="${MSG_ID_FLAG}"]`)
        ).find((element) => element.getBoundingClientRect().bottom > containerTop)
        return {
          anchorMessageClientId: anchor?.id.slice(MSG_ID_FLAG.length) || '',
          anchorOffsetTop: anchor ? anchor.getBoundingClientRect().top - containerTop : 0,
          scrollTop: container.scrollTop
        }
      },
      restoreScrollPosition: (snapshot) => {
        if (!snapshot) return
        restoringScrollPositionRef.current = true
        requestAnimationFrame(() => {
          const container = messageListRef.current
          if (!container) {
            restoringScrollPositionRef.current = false
            return
          }
          const anchor = snapshot.anchorMessageClientId
            ? document.getElementById(`${MSG_ID_FLAG}${snapshot.anchorMessageClientId}`)
            : null
          if (anchor) {
            const currentOffset = anchor.getBoundingClientRect().top - container.getBoundingClientRect().top
            container.scrollTop += currentOffset - snapshot.anchorOffsetTop
          } else {
            container.scrollTop = snapshot.scrollTop
          }
          updateLatestVisibility('restore')
          requestAnimationFrame(() => {
            restoringScrollPositionRef.current = false
          })
        })
      }
    }))

    useEffect(() => {
      onLatestVisibilityChangeRef.current = onLatestVisibilityChange
    }, [onLatestVisibilityChange])

    /**
     * 处理消息列表，插入时间分割线
     */
    const finalMsgs = msgs.reduce((result: any[], item, index) => {
      // 如果两条消息间隔超过5分钟，插入一条自定义时间消息
      if (index > 0 && item.createTime - msgs[index - 1].createTime > 5 * 60 * 1000) {
        result.push({
          ...item,
          messageClientId: 'time-' + item.createTime,
          messageType: V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM,
          sendingState: V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SUCCEEDED,
          timeValue: caculateTimeago(item.createTime),
          renderKey: `${item.createTime + 1}`
        })
      }
      result.push({
        ...item,
        renderKey: `${item.createTime}`
      })
      return result
    }, [])

    const getFirstNormalMsg = () => finalMsgs.find(isNormalMsg)

    const getLastNormalMsg = () => {
      const normalMsgs = finalMsgs.filter(isNormalMsg)
      return normalMsgs[normalMsgs.length - 1]
    }

    // 最后一条正常消息的标识。撤回时列表长度不变，但“最后一条正常消息”会换成更早的一条，
    // 需要据此重新建立观察，避免 ResizeObserver 一直挂在已被删除的节点上。
    const lastNormalMessageClientId = getLastNormalMsg()?.messageClientId || ''

    const latestMessageResizeObserverRef = useRef<ResizeObserver | null>(null)
    // “回到最新”入口上一次的判定结果（连带当时的滚动位置）
    const latestVisibilityRef = useRef<{ scrollTop: number; show: boolean } | null>(null)

    /**
     * 解析“回到最新”入口是否展示。
     * - 视口真的在底部（atLatest）时一定不展示；
     * - 用户滚动了位置时按产品口径重算：滚过最后一条正常消息的高度才算离开最新；
     * - 位置没变、只有内容变化时（撤回把最后一条换成更早的一条、图片加载完成等）沿用上一次判定，
     *   否则内容变化会在用户手指没动的情况下翻转判定，出现“撤回后回到最新箭头消失”。
     */
    const resolveLatestVisibility = (scrollTop: number, distanceFromBottom: number, atLatest: boolean) => {
      const previous = latestVisibilityRef.current
      let show: boolean
      if (atLatest) {
        show = false
      } else if (!previous || previous.scrollTop !== scrollTop) {
        const lastMsg = getLastNormalMsg()
        const lastElement = lastMsg?.messageClientId
          ? document.getElementById(`${MSG_ID_FLAG}${lastMsg.messageClientId}`)
          : null
        const latestMessageHeight = lastElement ? Math.max(lastElement.getBoundingClientRect().height, 1) : 0
        show = latestMessageHeight > 0 ? distanceFromBottom >= latestMessageHeight - 1 : distanceFromBottom > 1
      } else {
        show = previous.show
      }
      latestVisibilityRef.current = { scrollTop, show }
      return show
    }

    const updateLatestVisibility = (source: LatestVisibilitySource = 'layout') => {
      if (!messageListRef.current) {
        onLatestVisibilityChangeRef.current?.(false, source)
        return
      }
      if (anchorMode) {
        shouldStickToBottomRef.current = false
      }
      const container = messageListRef.current
      if (
        (source === 'programmatic' ||
          (source === 'layout' && shouldStickToBottomRef.current)) &&
        !isMultiSelectingRef.current &&
        !isScrollLockedRef.current &&
        !restoringScrollPositionRef.current
      ) {
        container.scrollTop = container.scrollHeight
      }
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      if (source === 'programmatic') {
        shouldStickToBottomRef.current = true
      } else if (source !== 'layout') {
        shouldStickToBottomRef.current = distanceFromBottom <= 1
      }
      // 位置口径：只表达“视口是否真的在列表底部”，不受消息内容高度影响，
      // 用于新消息提醒的计数与是否保持滚动位置。
      const atLatest = distanceFromBottom <= 1
      const show = resolveLatestVisibility(scrollTop, distanceFromBottom, atLatest)
      onLatestVisibilityChangeRef.current?.(show, source, atLatest)
    }

    const observeLatestMessage = () => {
      latestMessageResizeObserverRef.current?.disconnect()
      latestMessageResizeObserverRef.current = null
      const lastMsg = getLastNormalMsg()
      const lastElement = lastMsg?.messageClientId
        ? document.getElementById(`${MSG_ID_FLAG}${lastMsg.messageClientId}`)
        : null
      if (lastElement) {
        latestMessageResizeObserverRef.current = new ResizeObserver(() => {
          updateLatestVisibility('layout')
        })
        latestMessageResizeObserverRef.current.observe(lastElement)
      }
      updateLatestVisibility()
    }

    /**
     * 滚动到底部
     */
    const scrollToBottom = (event?: unknown) => {
      if (isMultiSelectingRef.current || isScrollLockedRef.current || restoringScrollPositionRef.current) {
        return
      }
      const options = event as { behavior?: ScrollBehavior } | undefined
      // 用户主动回到最新，结束锚点跟随
      stopAnchorSettle()
      if (messageListRef.current) {
        shouldStickToBottomRef.current = true
        cancelAnimationFrame(programmaticScrollFrameRef.current)
        programmaticScrollFrameRef.current = requestAnimationFrame(() => {
          programmaticScrollFrameRef.current = 0
        })
        const top = messageListRef.current.scrollHeight
        if (options?.behavior === 'smooth') {
          messageListRef.current.scrollTo({ top, behavior: 'smooth' })
        } else {
          messageListRef.current.scrollTop = top
        }
        updateLatestVisibility('programmatic')
      }
    }

    // 锚定后的“沉降期”：在这段时间内持续把锚点保持在视口中心。
    // 进入聊天页时消息列表会先渲染已有消息，随后被锚点分页整体替换（27→18→27 这类）并补拉更新消息，
    // 内容高度先缩后涨。若只在 +100ms 滚一次，中途的收缩会让浏览器把 scrollTop 夹到新的底部，
    // 内容再涨回来时锚点已经掉到视口外（scrollTop 停在中间），iOS 上尤其容易撞上。
    // 用户一触摸列表或主动回到最新就立刻停止，不做长期跟随。
    const centerAnchor = () => {
      const container = messageListRef.current
      const anchorId = anchorSettleIdRef.current
      if (!container || !anchorId) return
      const el = document.getElementById(`${MSG_ID_FLAG}${anchorId}`)
      if (!el) return
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const delta = Math.round(elRect.top + elRect.height / 2 - (containerRect.top + container.clientHeight / 2))
      if (Math.abs(delta) > 1) {
        container.scrollTop += delta
      }
    }

    const stopAnchorSettle = () => {
      if (anchorSettleFrameRef.current) {
        cancelAnimationFrame(anchorSettleFrameRef.current)
        anchorSettleFrameRef.current = 0
      }
      anchorSettleUntilRef.current = 0
    }

    const startAnchorSettle = (anchorId: string) => {
      stopAnchorSettle()
      anchorSettleIdRef.current = anchorId
      anchorSettleUntilRef.current = performance.now() + ANCHOR_SETTLE_MS
      const tick = () => {
        anchorSettleFrameRef.current = 0
        if (performance.now() > anchorSettleUntilRef.current) {
          stopAnchorSettle()
          return
        }
        centerAnchor()
        anchorSettleFrameRef.current = requestAnimationFrame(tick)
      }
      anchorSettleFrameRef.current = requestAnimationFrame(tick)
    }

    const scrollToAnchor = () => {
      if (!anchorMessageClientId) return false
      const el = document.getElementById(`${MSG_ID_FLAG}${anchorMessageClientId}`)
      if (!el) return false
      el.scrollIntoView({ block: 'center' })
      // 进入沉降期：页面刚打开时列表还会被锚点分页整体替换、并补拉更新消息，内容高度先缩后涨，
      // 只滚一次容易在收缩那一下被浏览器夹到底部而丢掉锚点位置
      startAnchorSettle(anchorMessageClientId)
      return true
    }

    const unlockPaginationAfterRender = () => {
      requestAnimationFrame(() => {
        const pending = pendingPaginationRef.current
        if (!pending || loadingOlderRef.current || loadingNewerRef.current) return

        if (messageListRef.current && pending.direction === 'older') {
          const nextScrollHeight = messageListRef.current.scrollHeight
          messageListRef.current.scrollTop = pending.prevScrollTop + (nextScrollHeight - pending.prevScrollHeight)
        }

        requestAnimationFrame(() => {
          if (loadingOlderRef.current || loadingNewerRef.current) return
          pagingLockRef.current = false
          pendingPaginationRef.current = null
        })
      })
    }

    const startPagination = (direction: 'older' | 'newer', load: () => void | Promise<unknown>) => {
      if (pagingLockRef.current || !messageListRef.current) return

      pagingLockRef.current = true
      pendingPaginationRef.current = {
        direction,
        prevScrollHeight: messageListRef.current.scrollHeight,
        prevScrollTop: messageListRef.current.scrollTop
      }

      const result = load()
      Promise.resolve(result).finally(() => {
        setTimeout(() => {
          if (!loadingOlderRef.current && !loadingNewerRef.current) {
            unlockPaginationAfterRender()
          }
        }, 0)
      })
    }

    /**
     * 加载更多消息
     */
    const onLoadMore = () => {
      if (pagingLockRef.current || loadingOlderRef.current || !onLoadOlder) return
      const msg = getFirstNormalMsg()
      if (!msg) return
      startPagination('older', () => onLoadOlder(msg))
    }

    useEffect(() => {
      onLoadMoreRef.current = onLoadMore
    })

    const handleScroll = () => {
      if (!messageListRef.current) return
      const source: LatestVisibilitySource = restoringScrollPositionRef.current
          ? 'restore'
          : programmaticScrollFrameRef.current
            ? 'programmatic'
            : 'scroll'
      updateLatestVisibility(source)
      if (pagingLockRef.current || loadingOlderRef.current || loadingNewerRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = messageListRef.current
      if (anchorMode && onLoadNewer && scrollHeight - scrollTop - clientHeight < 24) {
        const msg = getLastNormalMsg()
        if (msg) {
          startPagination('newer', () => onLoadNewer(msg))
        }
      }
      if (anchorMode && scrollTop < 24) {
        onLoadMore()
      }
    }

    /**
     * 处理点击消息列表
     */
    const handleTapMessageList = () => {
      // 用户触摸列表，结束锚点跟随
      stopAnchorSettle()
      // 点击消息列表时让输入框失焦
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement.id === 'msg-input') {
        activeElement.blur()
      }

      emitter.emit(events.CLOSE_PANEL)
    }

    useEffect(() => {
      loadingOlderRef.current = loadingOlder
      loadingNewerRef.current = loadingNewer
    }, [loadingOlder, loadingNewer])

    useEffect(() => {
      const pending = pendingPaginationRef.current
      if (!pending || loadingOlder || loadingNewer) return
      unlockPaginationAfterRender()
    }, [finalMsgs.length, loadingOlder, loadingNewer])

    // 组件挂载时初始化；滚动事件需要在切换 autoScrollToBottom 后立即重新注册
    useLayoutEffect(() => {
      const team = store.teamStore.teams.get(to)

      // 如果是群聊，加载群成员信息
      if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM) {
        store.teamMemberStore.getTeamMemberActive({
          teamId: to,
          queryOption: {
            limit: Math.max(team?.memberLimit || 0, 200),
            roleQueryType: 0
          }
        })
      }

      // 监听音频URL变化
      const handleAudioUrlChange = (url: string) => {
        setBroadcastNewAudioSrc(url)
      }

      // 监听加载更多
      const handleOnLoadMore = () => {
        onLoadMoreRef.current()
      }

      // 注册事件
      // emitter.on(events.AUDIO_URL_CHANGE, handleAudioUrlChange)
      emitter.on(events.ON_LOAD_MORE, handleOnLoadMore)
      if (autoScrollToBottom) {
        emitter.on(events.ON_SCROLL_BOTTOM, scrollToBottom)
      }

      // 初次加载完成后滚动到底部
      const timer = setTimeout(() => {
        if (anchorMessageClientId) {
          if (scrollToAnchor()) {
            anchorScrollStateRef.current = {
              anchorMessageClientId,
              scrolled: true
            }
          }
        } else if (autoScrollToBottom) {
          scrollToBottom()
        }
        updateLatestVisibility()
        clearTimeout(timer)
      }, 100)

      return () => {
        // emitter.off(events.AUDIO_URL_CHANGE, handleAudioUrlChange)
        emitter.off(events.ON_LOAD_MORE, handleOnLoadMore)
        if (autoScrollToBottom) {
          emitter.off(events.ON_SCROLL_BOTTOM, scrollToBottom)
        }
      }
    }, [autoScrollToBottom])

    // 滚动容器高度变化时（键盘弹起/收起、网络断开提示条等），若用户之前在底部附近则保持滚到底部
    useLayoutEffect(() => {
      const el = messageListRef.current
      if (!el) return

      // 记录上一次的状态，用于判断 resize 前用户是否在底部
      const prevStateRef = { clientHeight: 0, distanceFromBottom: 0 }

      const scrollToBottomIfNear = () => {
        const currentEl = messageListRef.current
        if (!currentEl) return
        const { scrollHeight, scrollTop, clientHeight } = currentEl
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight
        const prev = prevStateRef
        const wasNearBottom = prev.distanceFromBottom < 48
        const isNearBottom = distanceFromBottom < 48
        // 容器变矮（键盘弹起）时，之前用户在底部附近 → 需要保持滚到底部
        const containerShrunk = clientHeight < prev.clientHeight

        if (
          !isMultiSelectingRef.current &&
          !isScrollLockedRef.current &&
          !restoringScrollPositionRef.current &&
          (isNearBottom || (wasNearBottom && containerShrunk))
        ) {
          currentEl.scrollTop = scrollHeight
        }

        updateLatestVisibility()

        // 更新状态快照
        prev.clientHeight = clientHeight
        prev.distanceFromBottom = distanceFromBottom
      }

      let rafId = 0
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(scrollToBottomIfNear)
      })
      observer.observe(el)

      // H5 键盘弹起/收起时 visualViewport 变化，但容器 CSS 尺寸可能不变，ResizeObserver 不触发
      const onViewportResize = () => {
        requestAnimationFrame(scrollToBottomIfNear)
      }
      window.visualViewport?.addEventListener('resize', onViewportResize)

      return () => {
        observer.disconnect()
        cancelAnimationFrame(rafId)
        cancelAnimationFrame(programmaticScrollFrameRef.current)
        cancelAnimationFrame(anchorSettleFrameRef.current)
        anchorSettleFrameRef.current = 0
        anchorSettleUntilRef.current = 0
        window.visualViewport?.removeEventListener('resize', onViewportResize)
      }
    }, [])

    useLayoutEffect(() => {
      const frame = requestAnimationFrame(observeLatestMessage)
      return () => {
        cancelAnimationFrame(frame)
        latestMessageResizeObserverRef.current?.disconnect()
        latestMessageResizeObserverRef.current = null
      }
    }, [anchorMode, finalMsgs.length, lastNormalMessageClientId, loadingOlder, loadingNewer])

    useEffect(() => {
      if (!anchorMessageClientId) return
      if (anchorScrollStateRef.current.anchorMessageClientId !== anchorMessageClientId) {
        anchorScrollStateRef.current = {
          anchorMessageClientId,
          scrolled: false
        }
      }
      if (anchorScrollStateRef.current.scrolled) return

      const timer = setTimeout(() => {
        if (scrollToAnchor()) {
          anchorScrollStateRef.current = {
            anchorMessageClientId,
            scrolled: true
          }
        }
        clearTimeout(timer)
      }, 100)
    }, [anchorMessageClientId, finalMsgs.length])

    return (
      <div className="msg-list-wrapper" onTouchStart={handleTapMessageList} onClick={handleTapMessageList}>
        <div id="message-scroll-list" className="message-scroll-list" ref={messageListRef} onScroll={handleScroll}>
          {hasOlder && (
            <div className="view-more-text" onClick={onLoadMore}>
              {loadingOlder ? t('loadingMoreText') : t('viewMoreText')}
            </div>
          )}
          {!hasOlder && <div className="msg-tip">{t('noMoreText')}</div>}

          {finalMsgs.map((item, index) => (
            <MessageItem
              key={item.messageClientId || index}
              msg={item}
              index={index}
              replyMsgsMap={replyMsgsMap}
              broadcastNewAudioSrc={broadcastNewAudioSrc}
              voiceTextMap={voiceTextMap}
              setVoiceText={setVoiceText}
              isMultiSelecting={isMultiSelecting}
              selected={selectedMessageIds.includes(getMessageSelectKey(item))}
              onToggleSelect={onToggleSelect}
              onMultiSelect={onMultiSelect}
            />
          ))}

          {anchorMode && loadingNewer && <div className="msg-tip">{t('loadingMoreText')}</div>}
        </div>
      </div>
    )
  })
)

export default MessageList
