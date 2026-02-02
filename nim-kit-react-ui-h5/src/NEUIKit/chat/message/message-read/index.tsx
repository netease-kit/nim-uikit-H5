import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import './index.less'

interface MessageReadProps {
  msg: V2NIMMessageForUI
}

/**
 * 消息已读未读组件
 */
const MessageRead: React.FC<MessageReadProps> = observer(({ msg }) => {
  const { t } = useTranslation()
  const { store, nim } = useStateContext()
  const navigate = useNavigate()

  /** 是否需要显示群组消息已读未读，默认 false */
  const teamManagerVisible = store.localOptions.teamMsgReceiptVisible

  /** 是否需要显示 p2p 消息、p2p会话列表消息已读未读，默认 false */
  const p2pMsgReceiptVisible = store.localOptions.p2pMsgReceiptVisible

  /** 会话类型 */
  const conversationType = nim.V2NIMConversationIdUtil.parseConversationType(msg.conversationId) as unknown as V2NIMConst.V2NIMConversationType

  /**是否是云端会话 */
  const enableV2CloudConversation = store.sdkOptions?.enableV2CloudConversation

  // 获取会话
  const conversation = enableV2CloudConversation
    ? store.conversationStore?.conversations.get(msg.conversationId)
    : store.localConversationStore?.conversations.get(msg.conversationId)

  // 单聊消息已读未读状态
  const p2pMsgRotateDeg = msg?.createTime <= (conversation?.msgReceiptTime || 0) ? 360 : 0

  /** 跳转到已读未读详情 */
  const jumpToTeamMsgReadInfo = () => {
    if (store.connectStore.connectStatus !== V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_CONNECTED) {
      toast.info(t('offlineText'))
      return
    }

    // 跳转到消息已读未读详情页
    if (msg.messageClientId && msg.conversationId) {
      navigate(`${neUiKitRouterPath.messageReadInfo}?messageClientId=${msg.messageClientId}&conversationId=${msg.conversationId}`)
    }
  }

  /** 群消息已读未读状态 */
  const teamMsgRotateDeg = useMemo(() => {
    if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM) {
      const percentage = (msg?.yxRead || 0) / ((msg?.yxUnread || 0) + (msg?.yxRead || 0)) || 0
      return percentage * 360
    }
    return 0
  }, [conversationType, msg?.yxRead, msg?.yxUnread])

  // 如果消息不是发送成功状态，不显示已读状态
  if (msg.sendingState !== V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SUCCEEDED) {
    return null
  }

  return (
    <div className="msg-read-wrapper">
      {/* P2P 消息已读状态 */}
      {conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P && p2pMsgReceiptVisible && (
        <>
          {p2pMsgRotateDeg === 360 ? (
            <div className="icon-read-wrapper">
              <Icon type="icon-read" size={18} />
            </div>
          ) : (
            <div className="sector">
              <span className="cover-1" style={{ transform: `rotate(${p2pMsgRotateDeg}deg)` }} />
              <span className={p2pMsgRotateDeg >= 180 ? 'cover-2 cover-3' : 'cover-2'} />
            </div>
          )}
        </>
      )}

      {/* 群组消息已读状态 */}
      {conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM && teamManagerVisible && (
        <>
          {teamMsgRotateDeg === 360 ? (
            <div className="icon-read-wrapper">
              <Icon type="icon-read" size={18} />
            </div>
          ) : (
            <div className="sector" onClick={jumpToTeamMsgReadInfo}>
              <span className="cover-1" style={{ transform: `rotate(${teamMsgRotateDeg}deg)` }} />
              <span className={teamMsgRotateDeg >= 180 ? 'cover-2 cover-3' : 'cover-2'} />
            </div>
          )}
        </>
      )}
    </div>
  )
})

export default MessageRead
