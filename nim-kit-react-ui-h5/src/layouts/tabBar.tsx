import React, { useEffect, useState } from 'react'
import { NavLink } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import { autorun } from 'mobx'
import { t } from '@/NEUIKit/common/utils/i18n'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'

// 导入图标
import conversationIcon from '@/NEUIKit/static/conversation.png'
import conversationSelectedIcon from '@/NEUIKit/static/conversation-selected.png'
import contactsIcon from '@/NEUIKit/static/contact.png'
import contactsSelectedIcon from '@/NEUIKit/static/contact-selected.png'
import meIcon from '@/NEUIKit/static/me.png'
import meSelectedIcon from '@/NEUIKit/static/me-selected.png'

import './tabBar.less'

/**
 * TabBar 组件 - 底部导航栏
 */
const TabBar: React.FC = observer(() => {
  const { store } = useStateContext()

  const [conversationUnread, setConversationUnread] = useState(false)
  const [contactsUnread, setContactsUnread] = useState(false)

  // 监听未读消息变化
  useEffect(() => {
    const disposer = autorun(() => {
      // 判断是否是云端会话
      const enableV2CloudConversation = store.sdkOptions?.enableV2CloudConversation

      // 会话未读数
      setConversationUnread(enableV2CloudConversation ? !!store.conversationStore?.totalUnreadCount : !!store.localConversationStore?.totalUnreadCount)

      // 通讯录验证消息未读数
      setContactsUnread(!!store.sysMsgStore.getTotalUnreadMsgsCount())
    })

    return () => disposer()
  }, [store.conversationStore?.totalUnreadCount, store.localConversationStore?.totalUnreadCount, store.sysMsgStore.getTotalUnreadMsgsCount()])

  return (
    <nav className="tab-bar-wrapper">
      <NavLink to="/conversation" className="tab-item">
        {({ isActive }) => (
          <div className="tab-item-content">
            <div className="icon-wrapper">
              <img src={isActive ? conversationSelectedIcon : conversationIcon} className="tab-icon" alt="message" />
              {conversationUnread && <span className="unread-dot"></span>}
            </div>
            <span>{t('messageText')}</span>
          </div>
        )}
      </NavLink>

      <NavLink to="/contacts" className="tab-item">
        {({ isActive }) => (
          <div className="tab-item-content">
            <div className="icon-wrapper">
              <img src={isActive ? contactsSelectedIcon : contactsIcon} className="tab-icon" alt="contacts" />
              {contactsUnread && <span className="unread-dot"></span>}
            </div>
            <span>{t('contactText')}</span>
          </div>
        )}
      </NavLink>

      <NavLink to="/my" className="tab-item">
        {({ isActive }) => (
          <div className="tab-item-content">
            <img src={isActive ? meSelectedIcon : meIcon} className="tab-icon" alt="my" />
            <span>{t('mineText')}</span>
          </div>
        )}
      </NavLink>
    </nav>
  )
})

export default TabBar
