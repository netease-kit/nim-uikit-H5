import React from 'react'
import { observer } from 'mobx-react-lite'
import Icon from '@/NEUIKit/common/components/Icon'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMConversationForUI, V2NIMLocalConversationForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import './conversation-item-read.less'

interface ConversationItemReadProps {
  conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI
}

/**
 * 会话消息已读状态组件
 */
const ConversationItemRead: React.FC<ConversationItemReadProps> = observer(({ conversation }) => {
  const { store } = useStateContext()

  // 是否需要显示 p2p 消息、p2p会话列表消息已读未读，默认 false
  const p2pMsgReceiptVisible = store.localOptions.p2pMsgReceiptVisible

  // 解析会话类型
  const conversationType = store.nim.V2NIMConversationIdUtil.parseConversationType(conversation.conversationId)

  // 计算旋转角度，表示已读状态
  const p2pMsgRotateDeg = (conversation?.msgReceiptTime || 0) >= (conversation?.lastMessage?.messageRefer?.createTime || 0) ? 360 : 0

  // 如果不是点对点会话或不显示已读状态，则不渲染
  if (conversationType !== V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P || !p2pMsgReceiptVisible) {
    return null
  }

  return (
    <div className="nim-p2p-msg-receipt-wrapper">
      {p2pMsgRotateDeg === 360 ? (
        <div className="icon-read-wrapper">
          <Icon type="icon-read" size={16} />
        </div>
      ) : (
        <div className="sector">
          <span className="cover-1" style={{ transform: `rotate(${p2pMsgRotateDeg}deg)` }}></span>
          <span className={p2pMsgRotateDeg >= 180 ? 'cover-2 cover-3' : 'cover-2'}></span>
        </div>
      )}
    </div>
  )
})

export default ConversationItemRead
