import React, { useState, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import Icon from '@/NEUIKit/common/components/Icon'
import Tooltip from '@/NEUIKit/common/components/Tooltip'
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
import type { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import './index.less'

interface MessageBubbleProps {
  msg: V2NIMMessageForUI
  tooltipVisible?: boolean
  bgVisible?: boolean
  placement?: string
  children?: React.ReactNode
}

/**
 * 消息气泡组件
 */
const MessageBubble: React.FC<MessageBubbleProps> = observer(({ msg, tooltipVisible = true, bgVisible = true, placement = 'top', children }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store, nim } = useStateContext()
  const tooltipRef = useRef<any>(null)

  // const isFriend = store.uiStore.friends
  //   .filter((item) => !store.relationStore.blacklist.includes(item.accountId))
  //   .map((item) => item.accountId)
  //   .some((item) => item === msg.receiverId)
  const [isUnknownMsg, setIsUnknownMsg] = useState(false)
  const [showForward, setShowForward] = useState(false)

  // 判断是否为未知消息类型
  useEffect(() => {
    setIsUnknownMsg(
      !(
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO ||
        msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL
      )
    )
  }, [msg.messageType])

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

  const scrollBottom = () => {
    emitter.emit(events.ON_SCROLL_BOTTOM)
  }

  // 重发消息
  const handleResendMsg = async () => {
    store.msgStore.removeMsg(msg.conversationId, [msg.messageClientId])

    try {
      switch (msg.messageType) {
        case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE:
        case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO:
          store.msgStore.sendMessageActive({
            msg: msg,
            conversationId: msg.conversationId,
            progress: () => true,
            sendBefore: () => {
              scrollBottom()
            }
          })
          break
        case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT:
          store.msgStore.sendMessageActive({
            msg: msg,
            conversationId: msg.conversationId,
            sendBefore: () => {
              scrollBottom()
            }
          })
          break
        default:
          store.msgStore.sendMessageActive({
            msg: msg,
            conversationId: msg.conversationId,
            sendBefore: () => {
              scrollBottom()
            }
          })
          break
      }
      scrollBottom()
    } catch (error) {
      // console.log(error)
    }
  }

  // 转发消息
  const handleForwardMsg = () => {
    setShowForward(true)
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
      onConfirm: () => {
        store.msgStore
          .deleteMsgActive([msg])
          .then(() => {
            toast.info(t('deleteMsgSuccessText'))
          })
          .catch(() => {
            toast.info(t('deleteMsgFailText'))
          })
        closeTooltip()
      },
      onCancel: () => {
        closeTooltip()
      }
    })
  }

  // 添加好友
  const addFriend = () => {
    navigate(`${neUiKitRouterPath.friendCard}?accountId=${msg.receiverId}`)
  }

  // 渲染正常消息的操作菜单
  const renderActionMenu = () => {
    if (isUnknownMsg) {
      return (
        <div className="msg-action-groups-unknown">
          <div className="msg-action-btn" onClick={handleDeleteMsg}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-shanchu" />
            <span className="msg-action-btn-text">{t('deleteText')}</span>
          </div>
        </div>
      )
    }

    return (
      <div className="msg-action-groups">
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

        <div className="msg-action-btn" onClick={handleDeleteMsg}>
          <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-shanchu" />
          <span className="msg-action-btn-text">{t('deleteText')}</span>
        </div>

        {msg.isSelf && (
          <div className="msg-action-btn" onClick={handleRecallMsg}>
            <Icon size={18} style={{ color: '#656A72' }} iconClassName="msg-action-btn-icon" type="icon-chehui" />
            <span className="msg-action-btn-text">{t('recallText')}</span>
          </div>
        )}
      </div>
    )
  }

  // 渲染发送中状态的消息
  const renderSendingMessage = () => (
    <div className="msg-status-wrapper">
      <Icon size={21} style={{ color: '#337EFF' }} iconClassName="msg-status-icon icon-loading" type="icon-a-Frame8" />
      <Tooltip
        // placement={placement}
        // ref={tooltipRef}
        color="white"
        align={msg.isSelf}
        content={
          <div className="msg-action-groups">
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
          </div>
        }
        children={bgVisible ? <div className="msg-bg msg-bg-out">{children}</div> : <>{children}</>}
      ></Tooltip>
    </div>
  )

  // 渲染发送失败的消息
  const renderFailedMessage = () => (
    <div className="msg-failed-wrapper">
      <div className="msg-failed">
        <div className="msg-status-wrapper" onClick={handleResendMsg}>
          <div className="icon-fail">!</div>
        </div>
        <Tooltip
          color="white"
          align={msg.isSelf}
          content={
            <div
              className="msg-action-groups"
              style={{
                width: msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ? '112px' : '56px'
              }}
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
            </div>
          }
          children={bgVisible ? <div className="msg-bg msg-bg-out">{children}</div> : <>{children}</>}
        ></Tooltip>
      </div>

      {msg.messageStatus.errorCode === 102426 && <div className="in-blacklist">{t('sendFailWithInBlackText')}</div>}

      {msg.messageStatus.errorCode === 104404 && (
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
        <Tooltip
          color="white"
          content={renderActionMenu()}
          children={bgVisible ? <div className="msg-bg msg-bg-in">{children}</div> : <>{children}</>}
        ></Tooltip>
        {showForward && <MessageForward visible={showForward} msgIdClient={msg.messageClientId} onClose={() => setShowForward(false)} />}
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
    msg.messageStatus.errorCode === 102426 ||
    msg.messageStatus.errorCode === 104404
  ) {
    return renderFailedMessage()
  }

  // 正常发送成功的消息
  if (tooltipVisible) {
    return (
      <>
        <Tooltip
          color="white"
          align={msg.isSelf}
          content={renderActionMenu()}
          children={bgVisible ? <div className="msg-bg msg-bg-out">{children}</div> : <>{children}</>}
        ></Tooltip>
        {showForward && <MessageForward visible={showForward} msgIdClient={msg.messageClientId} onClose={() => setShowForward(false)} />}
      </>
    )
  }

  // 无气泡的消息
  return (
    <>
      {bgVisible ? <div className="msg-bg msg-bg-out">{children}</div> : <>{children}</>}
      {showForward && <MessageForward visible={showForward} msgIdClient={msg.messageClientId} onClose={() => setShowForward(false)} />}
    </>
  )
})

export default MessageBubble
