import React, { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { caculateTimeago } from '@/NEUIKit/common/utils/date'
import { events } from '@/NEUIKit/common/utils/constants'
import emitter from '@/NEUIKit/common/utils/eventBus'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'

import MessageItem from '../message-item'
import './index.less'

interface MessageListProps {
  /**
   * 消息列表
   */
  msgs: any[]
  /**
   * 会话类型
   */
  conversationType: V2NIMConst.V2NIMConversationType
  /**
   * 对话方ID
   */
  to: string
  /**
   * 是否加载更多中
   */
  loadingMore?: boolean
  /**
   * 是否没有更多消息了
   */
  noMore?: boolean
  /**
   * 回复消息映射
   */
  replyMsgsMap?: {
    [key: string]: any
  }
}

/**
 * 消息列表组件
 */
const MessageList: React.FC<MessageListProps> = observer(({ msgs = [], conversationType, to, loadingMore = false, noMore = false, replyMsgsMap = {} }) => {
  const { t } = useTranslation()
  const { store, nim } = useStateContext()
  const messageListRef = useRef<HTMLDivElement>(null)
  const [broadcastNewAudioSrc, setBroadcastNewAudioSrc] = useState('')

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

  /**
   * 加载更多消息
   */
  const onLoadMore = () => {
    const msg = finalMsgs.filter(
      (item) => !(item.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && ['beReCallMsg', 'reCallMsg'].includes(item.recallType || ''))
    )[0]
    emitter.emit(events.GET_HISTORY_MSG, msg)
  }

  /**
   * 滚动到底部
   */
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }

  /**
   * 处理点击消息列表
   */
  const handleTapMessageList = () => {
    // 点击消息列表时让输入框失焦
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement.id === 'msg-input') {
      activeElement.blur()
    }

    emitter.emit(events.CLOSE_PANEL)
  }

  // 组件挂载时初始化
  useEffect(() => {
    let team = store.teamStore.teams.get(to)

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
      const msg = finalMsgs.filter(
        (item) => !(item.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && ['beReCallMsg', 'reCallMsg'].includes(item.recallType || ''))
      )[0]
      if (msg) {
        emitter.emit(events.GET_HISTORY_MSG, msg)
      }
    }

    // 注册事件
    // emitter.on(events.AUDIO_URL_CHANGE, handleAudioUrlChange)
    emitter.on(events.ON_LOAD_MORE, handleOnLoadMore)
    emitter.on(events.ON_SCROLL_BOTTOM, scrollToBottom)

    // 初次加载完成后滚动到底部
    const timer = setTimeout(() => {
      scrollToBottom()
      clearTimeout(timer)
    }, 100)

    return () => {
      // emitter.off(events.AUDIO_URL_CHANGE, handleAudioUrlChange)
      emitter.off(events.ON_LOAD_MORE, handleOnLoadMore)
      emitter.off(events.ON_SCROLL_BOTTOM, scrollToBottom)
    }
  }, [])

  return (
    <div className="msg-list-wrapper" onTouchStart={handleTapMessageList} onClick={handleTapMessageList}>
      <div id="message-scroll-list" className="message-scroll-list" ref={messageListRef}>
        {!noMore && (
          <div className="view-more-text" onClick={onLoadMore}>
            {t('viewMoreText')}
          </div>
        )}
        {noMore && <div className="msg-tip">{t('noMoreText')}</div>}

        {finalMsgs.map((item, index) => (
          <MessageItem key={item.messageClientId || index} msg={item} index={index} replyMsgsMap={replyMsgsMap} broadcastNewAudioSrc={broadcastNewAudioSrc} />
        ))}
      </div>
    </div>
  )
})

export default MessageList
