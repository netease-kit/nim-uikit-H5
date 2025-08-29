import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import dayjs from 'dayjs'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Appellation from '@/NEUIKit/common/components/Appellation'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMConversationForUI, V2NIMLocalConversationForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import ConversationItemRead from './conversation-item-read'
import LastMsgContent from './conversation-item-last-msg-content'
import './conversation-item.less'

interface ConversationItemProps {
  conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI
  showMoreActions?: boolean
  onClick?: (conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI) => void
  onDelete?: (conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI) => void
  onStickyToTop?: (conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI) => void
  onLeftSlide?: (conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI | null) => void
}

/**
 * 会话列表项组件
 */
const ConversationItem: React.FC<ConversationItemProps> = observer(
  ({ conversation, showMoreActions = false, onClick, onDelete, onStickyToTop, onLeftSlide }) => {
    const { t } = useTranslation()
    const { store } = useStateContext()

    // 触摸相关状态
    const [startX, setStartX] = useState(0)
    const [startY, setStartY] = useState(0)

    // 更多操作按钮
    const moreActions = [
      {
        name: conversation.stickTop ? t('deleteStickTopText') : t('addStickTopText'),
        class: 'action-top',
        type: 'action-top'
      },
      {
        name: t('deleteSessionText'),
        class: 'action-delete',
        type: 'action-delete'
      }
    ]

    // 处理操作按钮点击
    const handleActionClick = (type: string, e: React.MouseEvent) => {
      e.stopPropagation()

      if (type === 'action-top') {
        onStickyToTop?.(conversation)
      } else {
        onDelete?.(conversation)
      }
    }

    // 获取会话目标ID
    const to = store.nim.V2NIMConversationIdUtil.parseConversationTargetId(conversation.conversationId)

    // 获取群头像
    const teamAvatar = conversation.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM ? conversation.avatar : undefined

    // 获取会话名称
    const sessionName = conversation.name || conversation.conversationId

    // 格式化时间
    const formatDate = (): string => {
      const time = conversation.lastMessage?.messageRefer.createTime || conversation.updateTime

      if (!time) {
        return ''
      }

      const _d = dayjs(time)
      const isCurrentDay = _d.isSame(dayjs(), 'day')
      const isCurrentYear = _d.isSame(dayjs(), 'year')

      return _d.format(isCurrentDay ? 'HH:mm' : isCurrentYear ? 'MM-DD HH:mm' : 'YYYY-MM-DD HH:mm')
    }

    // 未读数量显示格式化
    const max = 99
    const unread = conversation.unreadCount > 0 ? (conversation.unreadCount > max ? `${max}+` : `${conversation.unreadCount}`) : ''

    // 是否静音
    const isMute = !!conversation.mute

    // 是否有@消息
    const beMentioned = !!conversation.aitMsgs?.length

    // 是否显示消息已读状态
    const showSessionUnread = (() => {
      const myUserAccountId = store.nim.V2NIMLoginService.getLoginUser()

      if (conversation.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P) {
        return (
          conversation?.lastMessage?.messageRefer.senderId === myUserAccountId &&
          conversation?.lastMessage?.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL &&
          conversation?.lastMessage?.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_NOTIFICATION &&
          conversation?.lastMessage?.sendingState === V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_SUCCEEDED &&
          conversation?.lastMessage?.lastMessageState !== V2NIMConst.V2NIMLastMessageState.V2NIM_MESSAGE_STATUS_REVOKE
        )
      }

      return false
    })()

    // 处理触摸开始
    const handleTouchStart = (event: React.TouchEvent) => {
      setStartX(event.changedTouches[0].pageX)
      setStartY(event.changedTouches[0].pageY)
    }

    // 处理触摸移动
    const handleTouchMove = (event: React.TouchEvent) => {
      const moveEndX = event.changedTouches[0].pageX
      const moveEndY = event.changedTouches[0].pageY
      const X = moveEndX - startX + 20
      const Y = moveEndY - startY

      if (Math.abs(X) > Math.abs(Y) && X > 0) {
        // 右滑，收起操作栏
        onLeftSlide?.(null)
      } else if (Math.abs(X) > Math.abs(Y) && X < 0) {
        // 左滑，展示操作栏
        onLeftSlide?.(conversation)
      }
    }

    // 处理会话项点击
    const handleConversationItemClick = () => {
      if (showMoreActions) {
        // 如果当前显示操作栏，点击应该收起
        onLeftSlide?.(null)
        return
      }
      onClick?.(conversation)
    }

    // CSS 类名
    const containerClassName = ['nim-conversation-item-container', showMoreActions ? 'show-action-list' : '', conversation.stickTop ? 'stick-on-top' : '']
      .filter(Boolean)
      .join(' ')

    return (
      <div className={containerClassName} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onClick={handleConversationItemClick}>
        <div className="conversation-item-content">
          <div className="conversation-item-left">
            {unread && <div className="unread">{isMute ? <div className="dot"></div> : <div className="badge">{unread}</div>}</div>}
            <Avatar account={to} avatar={teamAvatar} />
          </div>

          <div className="conversation-item-right">
            <div className="conversation-item-top">
              {conversation.type === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P ? (
                <Appellation className="conversation-item-title" account={to} />
              ) : (
                <span className="conversation-item-title">{sessionName}</span>
              )}
              <span className="conversation-item-time">{formatDate()}</span>
            </div>

            <div className="conversation-item-desc">
              <span className="conversation-item-desc-span">
                {beMentioned && <span className="beMentioned">{`[${t('someoneText')}@${t('meText')}]`}</span>}

                {showSessionUnread && <ConversationItemRead conversation={conversation} />}

                {conversation.lastMessage && (
                  <span className="conversation-item-desc-content">
                    <LastMsgContent lastMessage={conversation.lastMessage} />
                  </span>
                )}
              </span>

              <div className="conversation-item-state">
                {isMute && <Icon iconClassName="conversation-item-desc-state" style={{ color: '#ccc' }} type="icon-xiaoximiandarao" />}
              </div>
            </div>
          </div>
        </div>

        <div className="right-action-list">
          {moreActions.map((action) => (
            <div key={action.type} className={`right-action-item ${action.class}`} onClick={(e) => handleActionClick(action.type, e)}>
              {action.name}
            </div>
          ))}
        </div>
      </div>
    )
  }
)

export default ConversationItem
