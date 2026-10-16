import React, { useState, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from '@/utils/router'
import Icon from '@/NEUIKit/common/components/Icon'
import Tooltip, { TooltipRef } from '@/NEUIKit/common/components/Tooltip'
import MessageForward from '@/NEUIKit/chat/message/message-forward'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { events, msgRecallTime } from '@/NEUIKit/common/utils/constants'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { copyText } from '@/NEUIKit/common/utils'
import { toast } from '@/NEUIKit/common/utils/toast'
import { showModal } from '@/NEUIKit/common/utils/modal'
import emitter from '@/NEUIKit/common/utils/eventBus'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/src/types'
import { canOperatePin, getMessageRefer, isMessagePinned } from '@/NEUIKit/chat/message-pin/utils'
import { syncConversationLastMessageAfterDelete } from '@/NEUIKit/chat/message/message-multi-select/utils'
import { canCollectMessage, createMessageCollectionParams, getMessageCollectionConverter, isCollectionLimitError } from '@/NEUIKit/common/utils/collection'
import { isMergedForwardMsg } from '@/NEUIKit/chat/message/merged-forward/utils'
import './index.less'

interface MessageBubbleProps {
  msg: V2NIMMessageForUI
  tooltipVisible?: boolean
  bgVisible?: boolean
  placement?: string
  children?: React.ReactNode
  /**
   * 语音转文字结果映射
   */
  voiceTextMap?: Map<string, string>
  /**
   * 设置语音转文字结果
   */
  setVoiceText?: (messageClientId: string, text: string) => void
  isMultiSelecting?: boolean
  onMultiSelect?: (msg: V2NIMMessageForUI) => void
  readonly?: boolean
}

/**
 * 消息气泡组件
 */
const MessageBubble: React.FC<MessageBubbleProps> = observer(({ msg, tooltipVisible = true, bgVisible = true, placement = 'top', children, voiceTextMap = new Map(), setVoiceText, isMultiSelecting = false, onMultiSelect, readonly = false }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store, nim } = useStateContext()
  const tooltipRef = useRef<TooltipRef>(null)
  const readonlyCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readonlyTouchStartPositionRef = useRef<{ x: number; y: number } | null>(null)

  // const isFriend = store.uiStore.friends
  //   .filter((item) => !store.relationStore.blacklist.includes(item.accountId))
  //   .map((item) => item.accountId)
  //   .some((item) => item === msg.receiverId)
  const [isUnknownMsg, setIsUnknownMsg] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const pinned = isMessagePinned(msg)
  const messageStatusErrorCode = msg.messageStatus?.errorCode
  const isMessageStatusFailed = messageStatusErrorCode !== undefined && messageStatusErrorCode !== 200

  // 判断是否为未知消息类型
  useEffect(() => {
    setIsUnknownMsg(
      !(
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_LOCATION ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL ||
        isMergedForwardMsg(store, msg)
      )
    )
  }, [msg.messageType, msg.attachment, msg.text, store])

  // 关闭tooltip
  const closeTooltip = () => {
    tooltipRef.current?.close()
  }

  // 复制消息
  const handleCopy = () => {
    closeTooltip()
    // 给个延迟，不然页面会删一下
    const timer = setTimeout(() => {
      try {
        copyText(msg.text as string)
        toast.info(t('copySuccessText'))
      } catch (err) {
        toast.info(t('copyFailText'))
      } finally {
        clearTimeout(timer)
      }
    }, 200)
  }

  const clearReadonlyCopyTimer = () => {
    if (readonlyCopyTimerRef.current) {
      clearTimeout(readonlyCopyTimerRef.current)
      readonlyCopyTimerRef.current = null
    }
  }

  const startReadonlyCopyTimer = (x: number, y: number) => {
    readonlyTouchStartPositionRef.current = { x, y }
    clearReadonlyCopyTimer()
    readonlyCopyTimerRef.current = setTimeout(() => {
      handleCopy()
      readonlyCopyTimerRef.current = null
    }, 500)
  }

  const cancelReadonlyCopyTimerOnMove = (x: number, y: number) => {
    const startPos = readonlyTouchStartPositionRef.current
    if (!startPos) {
      clearReadonlyCopyTimer()
      return
    }

    const moveDistance = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
    if (moveDistance > 10) {
      clearReadonlyCopyTimer()
    }
  }

  const handleReadonlyCopyTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const touch = event.touches[0]
    if (!touch) return
    startReadonlyCopyTimer(touch.clientX, touch.clientY)
  }

  const handleReadonlyCopyTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) {
      clearReadonlyCopyTimer()
      return
    }
    cancelReadonlyCopyTimerOnMove(touch.clientX, touch.clientY)
  }

  const handleReadonlyCopyPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.pointerType === 'mouse' && event.button !== 0) return
    startReadonlyCopyTimer(event.clientX, event.clientY)
  }

  const handleReadonlyCopyPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    cancelReadonlyCopyTimerOnMove(event.clientX, event.clientY)
  }

  const handleReadonlyCopyContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    clearReadonlyCopyTimer()
    handleCopy()
  }

  const getReadonlyCopyProps = () => ({
    className: 'msg-bg-readonly-copy',
    onPointerDown: handleReadonlyCopyPointerDown,
    onPointerMove: handleReadonlyCopyPointerMove,
    onPointerUp: clearReadonlyCopyTimer,
    onPointerCancel: clearReadonlyCopyTimer,
    onTouchStart: handleReadonlyCopyTouchStart,
    onTouchMove: handleReadonlyCopyTouchMove,
    onTouchEnd: clearReadonlyCopyTimer,
    onTouchCancel: clearReadonlyCopyTimer,
    onContextMenu: handleReadonlyCopyContextMenu
  })

  const renderBubbleContent = (className: string, props?: React.HTMLAttributes<HTMLDivElement>) => {
    const extraClassName = props?.className || ''
    const imageClassName = msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE ? 'msg-bg-image' : ''
    const contentProps = {
      ...props,
      className: bgVisible ? `msg-bg ${className} ${imageClassName} ${extraClassName}` : extraClassName
    }

    return <div {...contentProps}>{children}</div>
  }

  const renderReadonlyBubble = (className: string) => {
    if (msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT) {
      return renderBubbleContent(className)
    }

    return renderBubbleContent(className, getReadonlyCopyProps())
  }

  const renderTooltipBubble = (className: string) => {
    return bgVisible ? renderBubbleContent(className) : <>{children}</>
  }

  const scrollBottom = () => {
    emitter.emit(events.ON_SCROLL_BOTTOM)
  }

  // 重发消息
  const handleResendMsg = async () => {
    store.msgStore.removeMsg(msg.conversationId, [msg.messageClientId])

    // 恢复回复消息状态，确保重发失败回复消息时保持回复关系
    const threadReply = (msg as any).threadReply
    if (threadReply) {
      store.msgStore.replyMsgActive(threadReply)
    }

    try {
      switch (msg.messageType) {
        case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE:
        case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO:
        case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE:
          await store.msgStore.sendMessageActive({
            msg: msg,
            conversationId: msg.conversationId,
            progress: () => true,
            sendBefore: () => {
              scrollBottom()
            }
          })
          break
        case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT:
          await store.msgStore.sendMessageActive({
            msg: msg,
            conversationId: msg.conversationId,
            sendBefore: () => {
              scrollBottom()
            }
          })
          break
        default:
          await store.msgStore.sendMessageActive({
            msg: msg,
            conversationId: msg.conversationId,
            sendBefore: () => {
              scrollBottom()
            }
          })
          break
      }
    } catch (error) {
      toast.info(t('resendMsgFailText'))
    } finally {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollBottom())
      })
    }
  }

  // 转发消息
  const handleForwardMsg = () => {
    closeTooltip()
    setShowForward(true)
  }

  const handleMultiSelect = () => {
    closeTooltip()
    onMultiSelect?.(msg)
  }

  const isPinLimitError = (error: unknown) => {
    const err = error as { code?: number; errorCode?: number; messageStatus?: { errorCode?: number } }
    return err?.code === 107319 || err?.errorCode === 107319 || err?.messageStatus?.errorCode === 107319
  }

  const handlePinMsg = async () => {
    closeTooltip()

    if (store.connectStore.loginStatus !== V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED) {
      toast.info(t('offlineText'))
      return
    }

    try {
      if (pinned) {
        await store.msgStore.unpinMessageActive(getMessageRefer(msg))
      } else {
        await store.msgStore.pinMessageActive(msg)
      }
    } catch (error) {
      toast.info(!pinned && isPinLimitError(error) ? t(107319) : pinned ? t('unpinFailedText') : t('pinFailedText'))
    }
  }

  const handleCollectMsg = async () => {
    closeTooltip()

    if (store.connectStore.loginStatus !== V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED) {
      toast.info(t('offlineText'))
      return
    }

    try {
      const converter = getMessageCollectionConverter(nim)
      if (!converter) throw new Error('V2NIMMessageConverter unavailable')

      const conversationType = nim.V2NIMConversationIdUtil.parseConversationType(msg.conversationId)
      const isTeamMessage = conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      const teamId = isTeamMessage ? nim.V2NIMConversationIdUtil.parseConversationTargetId(msg.conversationId) : undefined
      const conversation = store.sdkOptions?.enableV2CloudConversation
        ? store.conversationStore?.conversations.get(msg.conversationId)
        : store.localConversationStore?.conversations.get(msg.conversationId)

      await store.msgStore.addCollectionActive(createMessageCollectionParams(msg, converter, {
        conversationName: conversation?.name,
        senderName: store.uiStore.getAppellation({ account: msg.senderId, teamId }),
        avatar: store.userStore.users.get(msg.senderId)?.avatar,
      }))
      toast.info(t('addCollectionSuccessText'))
    } catch (error) {
      toast.info(isCollectionLimitError(error) ? t('collectionLimitText') : t('addCollectionFailedText'))
    }
  }

  // 回复消息
  const handleReplyMsg = async () => {
    store.msgStore.replyMsgActive(msg)
    closeTooltip()
    emitter.emit(events.REPLY_MSG, msg)
  }

  // 撤回消息
  const handleRecallMsg = () => {
    const diff = Date.now() - msg.createTime
    if (diff > msgRecallTime) {
      toast.info(t('msgRecallTimeErrorText'))
      closeTooltip()
      return
    }
    showModal({
      title: t('recallText'),
      content: t('recall3'),
      confirmText: t('recallText'),
      onConfirm: () => {
        store.msgStore.reCallMsgActive(msg).catch(() => {
          toast.info(t('recallMsgFailText'))
        })
        closeTooltip()
      },
      onCancel: () => {
        closeTooltip()
      }
    })
  }

  // 删除消息
  const handleDeleteMsg = () => {
    showModal({
      title: t('deleteText'),
      content: t('delete'),
      confirmText: t('deleteText'),
      onConfirm: async () => {
        try {
          await store.msgStore.deleteMsgActive([msg])
          toast.info(t('deleteMsgSuccessText'))
          syncConversationLastMessageAfterDelete(store, msg.conversationId)
        } catch {
          toast.info(t('deleteMsgFailText'))
        }
        closeTooltip()
      },
      onCancel: () => {
        closeTooltip()
      }
    })
  }

  // 添加好友
  const addFriend = () => {
    // 移除 URL 中的 anchorMessageClientId，防止从好友页返回后仍锚点到标记消息
    const hashQuery = window.location.hash.split('?')[1] || ''
    const params = new URLSearchParams(hashQuery)
    if (params.get('anchorMessageClientId')) {
      const convId = params.get('conversationId')
      if (convId) {
        window.history.replaceState(
          window.history.state,
          '',
          `#${neUiKitRouterPath.chat}?conversationId=${convId}`
        )
      }
    }
    navigate(`${neUiKitRouterPath.friendCard}?accountId=${msg.receiverId}`)
  }

  // 用于追踪组件是否已卸载，避免在卸载后更新状态或显示toast
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 语音转文字
  const handleVoiceToText = async () => {
    closeTooltip()
    
    // 检查网络状态
    if (store.connectStore.loginStatus !== V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED) {
      toast.info(t('offlineText'))
      return
    }

    // 检查消息附件
    const attachment = msg.attachment as any
    if (!attachment?.url || !attachment?.duration) {
      toast.info(t('voiceToTextFailText'))
      return
    }

    try {
      const text = await nim.V2NIMMessageService.voiceToText({
        voiceUrl: attachment.url,
        duration: attachment.duration,
        mimeType: 'aac',
        sampleRate: '16000',
        sceneName: attachment.sceneName
      })

      // 组件已卸载，静默忽略结果
      if (!isMountedRef.current) {
        return
      }

      if (text && setVoiceText) {
        setVoiceText(msg.messageClientId as string, text)
      } else {
        toast.info(t('voiceToTextFailText'))
      }
    } catch (error) {
      // 组件已卸载，静默忽略错误
      if (!isMountedRef.current) {
        return
      }
      toast.info(t('voiceToTextFailText'))
    }
  }

  // 判断语音消息是否已转换过文字
  const isVoiceConverted = msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO && 
    voiceTextMap.has(msg.messageClientId as string)
  const getActionGroupStyle = (count: number) => ({ '--action-columns': Math.max(1, Math.min(count, 4)) } as React.CSSProperties)
  // 操作面板的列数由按钮数量决定（--action-columns），少算一个按钮面板就会因为列数不足而换行。
  // 因此这里每一项都必须和下方实际渲染的条件保持一致，顺序也与渲染顺序一致。
  const normalActionCount =
    (msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ? 1 : 0) + // 复制
    (msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL ? 1 : 0) + // 回复
    (msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO && msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL ? 1 : 0) + // 转发
    (canOperatePin(msg) || isMergedForwardMsg(store, msg) ? 1 : 0) + // 标记/取消标记
    1 + // 删除
    (msg.isSelf && msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL ? 1 : 0) + // 撤回（话单消息不展示）
    1 + // 多选
    (msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO && !isVoiceConverted ? 1 : 0) + // 语音转文字
    (canCollectMessage(msg) || isMergedForwardMsg(store, msg) ? 1 : 0) // 收藏

  // 渲染正常消息的操作菜单
  const renderActionMenu = () => {
    if (isUnknownMsg) {
      return (
        <div className="msg-action-groups-unknown" style={getActionGroupStyle(2)}>
          <div className="msg-action-btn" onClick={handleDeleteMsg}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-shanchu" />
            <span className="msg-action-btn-text">{t('deleteText')}</span>
          </div>
          <div className="msg-action-btn" onClick={handleMultiSelect}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-multi-select" />
            <span className="msg-action-btn-text">{t('multiSelectText')}</span>
          </div>
        </div>
      )
    }

    return (
      <div className="msg-action-groups" style={getActionGroupStyle(normalActionCount)}>
        {msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT && (
          <div className="msg-action-btn" onClick={handleCopy}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-fuzhi1" />
            <span className="msg-action-btn-text">{t('copyText')}</span>
          </div>
        )}

        {msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL && (
          <div className="msg-action-btn" onClick={handleReplyMsg}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-huifu" />
            <span className="msg-action-btn-text">{t('replyText')}</span>
          </div>
        )}

        {msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO &&
          msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL && (
            <div className="msg-action-btn" onClick={handleForwardMsg}>
              <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-zhuanfa" />
              <span className="msg-action-btn-text">{t('forwardText')}</span>
            </div>
          )}

        {(canOperatePin(msg) || isMergedForwardMsg(store, msg)) && (
          <div className="msg-action-btn" onClick={handlePinMsg}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-pin" />
            <span className="msg-action-btn-text">{pinned ? t('unpinText') : t('pinText')}</span>
          </div>
        )}

        <div className="msg-action-btn" onClick={handleDeleteMsg}>
          <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-shanchu" />
          <span className="msg-action-btn-text">{t('deleteText')}</span>
        </div>

        {msg.isSelf && msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL && (
          <div className="msg-action-btn" onClick={handleRecallMsg}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-chehui" />
            <span className="msg-action-btn-text">{t('recallText')}</span>
          </div>
        )}

        <div className="msg-action-btn" onClick={handleMultiSelect}>
          <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-multi-select" />
          <span className="msg-action-btn-text">{t('multiSelectText')}</span>
        </div>

        {/* 语音消息转文字按钮 - 仅当语音消息未转换时显示 */}
        {msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO && !isVoiceConverted && (
          <div className="msg-action-btn" onClick={handleVoiceToText}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-voice-to-text" />
            <span className="msg-action-btn-text">{t('voiceToTextText')}</span>
          </div>
        )}

        {(canCollectMessage(msg) || isMergedForwardMsg(store, msg)) && (
          <div className="msg-action-btn" onClick={handleCollectMsg}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-collection" />
            <span className="msg-action-btn-text">{t('collectionText')}</span>
          </div>
        )}
      </div>
    )
  }

  // 渲染发送中状态的消息
  const renderSendingMessage = () => (
    <div className="msg-status-wrapper">
      <Icon size={21} style={{ color: '#337EFF' }} iconClassName="msg-status-icon icon-loading" type="icon-a-Frame8" />
      {readonly || isMultiSelecting ? (
        readonly ? renderReadonlyBubble('msg-bg-out') : renderBubbleContent('msg-bg-out')
      ) : (
        <Tooltip
          color="white"
          align={msg.isSelf}
          content={
            <div className="msg-action-groups" style={getActionGroupStyle(msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ? 3 : 2)}>
              {msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT && (
                <div className="msg-action-btn" onClick={handleCopy}>
                  <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-fuzhi1" />
                  <span className="msg-action-btn-text">{t('copyText')}</span>
                </div>
              )}
              <div className="msg-action-btn" onClick={handleDeleteMsg}>
                <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-shanchu" />
                <span className="msg-action-btn-text">{t('deleteText')}</span>
              </div>
              <div className="msg-action-btn" onClick={handleMultiSelect}>
                <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-multi-select" />
                <span className="msg-action-btn-text">{t('multiSelectText')}</span>
              </div>
            </div>
          }
          children={renderTooltipBubble('msg-bg-out')}
        ></Tooltip>
      )}
    </div>
  )

  // 渲染发送失败的消息
  const renderFailedMessage = () => (
    <div className="msg-failed-wrapper">
      <div className="msg-failed">
        <div className="msg-status-wrapper" onClick={handleResendMsg}>
          <div className="icon-fail">!</div>
        </div>
        {readonly || isMultiSelecting ? (
          readonly ? renderReadonlyBubble('msg-bg-out') : renderBubbleContent('msg-bg-out')
        ) : (
          <Tooltip
            color="white"
            align={msg.isSelf}
            content={
              <div
                className="msg-action-groups"
                style={getActionGroupStyle(msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ? 3 : 2)}
              >
                {msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT && (
                  <div className="msg-action-btn" onClick={handleCopy}>
                    <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-fuzhi1" />
                    <span className="msg-action-btn-text">{t('copyText')}</span>
                  </div>
                )}
                <div className="msg-action-btn" onClick={handleDeleteMsg}>
                  <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-shanchu" />
                  <span className="msg-action-btn-text">{t('deleteText')}</span>
                </div>
                <div className="msg-action-btn" onClick={handleMultiSelect}>
                  <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-multi-select" />
                  <span className="msg-action-btn-text">{t('multiSelectText')}</span>
                </div>
              </div>
            }
            children={renderTooltipBubble('msg-bg-out')}
          ></Tooltip>
        )}
      </div>

      {messageStatusErrorCode === 102426 && <div className="in-blacklist">{t('sendFailWithInBlackText')}</div>}

      {messageStatusErrorCode === 104404 && (
        <div className="friend-delete">
          {t('sendFailWithDeleteText')}
          <span onClick={addFriend} className="friend-verification">
            {t('friendVerificationText')}
          </span>
        </div>
      )}
    </div>
  )

  // 非自己发送的消息
  if (!msg.isSelf) {
    return (
      <>
        {readonly || isMultiSelecting || msg.recallType ? (
          readonly ? renderReadonlyBubble('msg-bg-in') : renderBubbleContent('msg-bg-in')
        ) : (
          <Tooltip
            ref={tooltipRef}
            color="white"
            content={renderActionMenu()}
            children={renderTooltipBubble('msg-bg-in')}
          ></Tooltip>
        )}
        {!readonly && showForward && <MessageForward visible={showForward} msgIdClient={msg.messageClientId} onClose={() => setShowForward(false)} />}
      </>
    )
  }

  // 发送中的消息
  if (msg.sendingState === V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SENDING) {
    return renderSendingMessage()
  }

  // 发送失败的消息
  if (
    msg.sendingState === V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_FAILED ||
    isMessageStatusFailed
  ) {
    return renderFailedMessage()
  }

  // 正常发送成功的消息
  if (tooltipVisible && !msg.recallType) {
    return (
      <>
        {readonly || isMultiSelecting ? (
          readonly ? renderReadonlyBubble('msg-bg-out') : renderBubbleContent('msg-bg-out')
        ) : (
          <Tooltip
            ref={tooltipRef}
            color="white"
            align={msg.isSelf}
            content={renderActionMenu()}
            children={renderTooltipBubble('msg-bg-out')}
          ></Tooltip>
        )}
        {!readonly && showForward && <MessageForward visible={showForward} msgIdClient={msg.messageClientId} onClose={() => setShowForward(false)} />}
      </>
    )
  }

  // 无气泡的消息
  return (
    <>
      {renderTooltipBubble('msg-bg-out')}
      {!readonly && showForward && <MessageForward visible={showForward} msgIdClient={msg.messageClientId} onClose={() => setShowForward(false)} />}
    </>
  )
})

export default MessageBubble
