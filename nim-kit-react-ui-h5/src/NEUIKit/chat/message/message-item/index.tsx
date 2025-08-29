import React, { useState, useMemo, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import Avatar from '@/NEUIKit/common/components/Avatar'
import MessageBubble from '@/NEUIKit/chat/message/message-bubble'
import MessageFile from '@/NEUIKit/chat/message/message-file'
import MessageText from '@/NEUIKit/chat/message/message-text'
import MessageAudio from '@/NEUIKit/chat/message/message-audio'
import MessageNotification from '@/NEUIKit/chat/message/message-notification'
import MessageG2 from '@/NEUIKit/chat/message/message-g2'
import MessageRead from '@/NEUIKit/chat/message/message-read'
import ReplyMessage from '@/NEUIKit/chat/message/message-reply'
import PreviewImage from '@/NEUIKit/common/components/PreviewImage'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { events, MSG_ID_FLAG } from '@/NEUIKit/common/utils/constants'
import emitter from '@/NEUIKit/common/utils/eventBus'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import './index.less'

interface MessageItemProps {
  msg: V2NIMMessageForUI & { timeValue?: number }
  index: number
  replyMsgsMap?: {
    [key: string]: V2NIMMessageForUI
  }
  broadcastNewAudioSrc: string
}

/**
 * 消息项组件，根据不同的消息类型展示不同的消息内容
 */
const MessageItem: React.FC<MessageItemProps> = observer(({ msg, index, replyMsgsMap = {}, broadcastNewAudioSrc }) => {
  const { t } = useTranslation()
  const { store, nim } = useStateContext()

  // 图片预览状态
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)

  // 回复消息
  const replyMsg = useMemo(() => {
    return replyMsgsMap && replyMsgsMap[msg.messageClientId]
  }, [msg.messageClientId, replyMsgsMap])

  // 会话类型
  const conversationType = nim.V2NIMConversationIdUtil.parseConversationType(msg.conversationId) as unknown as V2NIMConst.V2NIMConversationType

  // 会话对象
  const to = nim.V2NIMConversationIdUtil.parseConversationTargetId(msg.conversationId)

  // 昵称展示顺序 群昵称 > 备注 > 个人昵称 > 帐号
  const appellation = store.uiStore.getAppellation({
    account: msg.senderId,
    teamId: conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM ? to : ''
  })

  // 群ID
  const teamId = useMemo(() => {
    if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM) {
      return to
    }
    return ''
  }, [conversationType, to])

  // 获取视频首帧
  const videoFirstFrameDataUrl = useMemo(() => {
    //@ts-ignore
    const url = msg.attachment?.url
    return url ? `${url}${url.includes('?') ? '&' : '?'}vframe=1` : ''
  }, [msg.attachment])

  // 图片URL
  const imageUrl = useMemo(() => {
    if (!(msg && msg.attachment)) {
      return ''
    }
    // 被拉黑
    if (msg.messageStatus?.errorCode === 102426) {
      return 'https://yx-web-nosdn.netease.im/common/c1f278b963b18667ecba4ee9a6e68047/img-fail.png'
    }
    if ('url' in msg.attachment) return msg.attachment.url
    if ('file' in msg.attachment) return URL.createObjectURL(msg.attachment.file as File)

    return ''
  }, [msg.attachment, msg.messageStatus?.errorCode])

  const thumbnail = useMemo(() => {
    // 图片如果过大, 超过 20MB, 那么无法再 NOS 里得到媒体信息,
    // 那么此时宽高都取不到, 回退到原图加载
    // @ts-ignore
    const width = msg.attachment?.width || 0
    // @ts-ignore
    const height = msg.attachment?.height || 0

    return width > 230 || height > 200
      ? // @ts-ignore
        nim.cloudStorage.getThumbUrl(imageUrl, {
          width: 230,
          height: 200
        })
      : imageUrl
  }, [imageUrl])

  // 点击图片预览
  const handleImageTouch = (url: string) => {
    if (url) {
      setIsPreviewVisible(true)
    }
  }

  // 点击视频播放
  const handleVideoTouch = (msg: V2NIMMessageForUI) => {
    //@ts-ignore
    const url = msg.attachment?.url
    if (url) {
      // 在新窗口打开视频
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // 重新编辑消息
  const handleReeditMsg = (msg: V2NIMMessageForUI) => {
    emitter.emit(events.ON_REEDIT_MSG, msg)
  }

  // 消息置顶类判断
  const isPinned =
    msg.pinState && !(msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && msg.timeValue !== undefined) && !msg.recallType

  return (
    <div className={`msg-item-wrapper ${isPinned ? 'msg-pin' : ''}`} id={MSG_ID_FLAG + msg.messageClientId} key={msg.createTime}>
      {/* 消息时间间隔提示 */}
      {msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && msg.timeValue !== undefined ? (
        <div className="msg-time">{msg.timeValue}</div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && msg.recallType === 'reCallMsg' && msg.canEdit ? (
        /* 撤回消息-可重新编辑 */
        <div
          className="msg-common"
          style={{
            flexDirection: !msg.isSelf ? 'row' : 'row-reverse'
          }}
        >
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <MessageBubble msg={msg} bgVisible={true}>
            <span className="recall-text">{t('recall2')}</span>
            <span className="msg-recall-btn" onClick={() => handleReeditMsg(msg)}>
              {t('reeditText')}
            </span>
          </MessageBubble>
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && msg.recallType === 'reCallMsg' && !msg.canEdit ? (
        /* 撤回消息-不可重新编辑 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <MessageBubble msg={msg} bgVisible={true}>
            <div className="recall-text">{t('you') + t('recall')}</div>
          </MessageBubble>
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && msg.recallType === 'beReCallMsg' ? (
        /* 撤回消息-对方撤回 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <div className="msg-content">
            {!msg.isSelf && <div className="msg-name">{appellation}</div>}
            <div className={msg.isSelf ? 'self-msg-recall' : 'msg-recall'}>
              <span className="msg-recall2">{!msg.isSelf ? t('recall2') : `${t('you') + t('recall')}`}</span>
            </div>
          </div>
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ? (
        /* 文本消息 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <div className="msg-content">
            {!msg.isSelf && <div className="msg-name">{appellation}</div>}
            <MessageBubble msg={msg} tooltipVisible={true} bgVisible={true}>
              {!!replyMsg && <ReplyMessage replyMsg={replyMsg} />}
              <MessageText msg={msg} />
            </MessageBubble>
          </div>
          {msg?.isSelf && <MessageRead msg={msg} />}
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE ? (
        /* 图片消息 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <div className="msg-content">
            {!msg.isSelf && <div className="msg-name">{appellation}</div>}
            <MessageBubble msg={msg} tooltipVisible={true} bgVisible={true}>
              <div onClick={() => handleImageTouch(imageUrl)}>
                {msg.sendingState === V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SENDING ? (
                  <div className="msg-image">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <img className="msg-image" loading="lazy" src={thumbnail} alt="图片" />
                )}
              </div>
            </MessageBubble>
            {/* 图片预览 */}
            {isPreviewVisible && <PreviewImage visible={isPreviewVisible} imageUrl={imageUrl} onClose={() => setIsPreviewVisible(false)} />}
          </div>
          {msg?.isSelf && <MessageRead msg={msg} />}
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO ? (
        /* 视频消息 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <div className="msg-content">
            {!msg.isSelf && <div className="msg-name">{appellation}</div>}
            <MessageBubble msg={msg} tooltipVisible={true} bgVisible={true}>
              <div className="video-msg-wrapper" onClick={() => handleVideoTouch(msg)}>
                <div className="video-play-button">
                  <div className="video-play-icon"></div>
                </div>
                <img className="msg-image" loading="lazy" src={videoFirstFrameDataUrl} alt="视频封面" />
              </div>
            </MessageBubble>
          </div>
          {msg?.isSelf && <MessageRead msg={msg} />}
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL ? (
        /* 音视频通话消息 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <div className="msg-content">
            {!msg.isSelf && <div className="msg-name">{appellation}</div>}
            <MessageBubble msg={msg} tooltipVisible={true} bgVisible={true}>
              <MessageG2 msg={msg} />
            </MessageBubble>
          </div>
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE ? (
        /* 文件消息 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <div className="msg-content">
            {!msg.isSelf && <div className="msg-name">{appellation}</div>}
            <MessageBubble msg={msg} tooltipVisible={true} bgVisible={false}>
              <MessageFile msg={msg} />
            </MessageBubble>
          </div>
          {msg?.isSelf && <MessageRead msg={msg} />}
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO ? (
        /* 语音消息 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <div className="msg-content">
            {!msg.isSelf && <div className="msg-name">{appellation}</div>}
            <MessageBubble msg={msg} tooltipVisible={true} bgVisible={true}>
              <MessageAudio msg={msg} broadcastNewAudioSrc={broadcastNewAudioSrc} />
            </MessageBubble>
          </div>
          {msg?.isSelf && <MessageRead msg={msg} />}
        </div>
      ) : msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_NOTIFICATION ? (
        /* 通知消息 */
        <MessageNotification msg={msg} />
      ) : (
        /* 未知消息类型 */
        <div className="msg-common" style={{ flexDirection: !msg.isSelf ? 'row' : 'row-reverse' }}>
          <Avatar account={msg.senderId} teamId={teamId} gotoUserCard={true} />
          <div className="msg-content">
            {!msg.isSelf && <div className="msg-name">{appellation}</div>}
            <MessageBubble msg={msg} tooltipVisible={true} bgVisible={true}>
              [{t('unknowMsgText')}]
            </MessageBubble>
          </div>
        </div>
      )}
    </div>
  )
})

export default MessageItem
