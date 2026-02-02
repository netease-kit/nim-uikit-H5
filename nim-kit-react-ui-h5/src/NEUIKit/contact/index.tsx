import React, { useEffect, useState } from 'react'
import { useNavigate } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import Icon from '@/NEUIKit/common/components/Icon'
import Badge from '@/NEUIKit/common/components/Badge'
import FriendList from './friend-list'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import './index.less'
import { useEventTracking } from '../common/hooks/useEventTracking'

/**
 * 通讯录列表页面
 */
const ContactList: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()

  const unreadSysMsgCount = store.sysMsgStore.getTotalUnreadMsgsCount() || 0

  // 下拉菜单可见状态
  const [addDropdownVisible, setAddDropdownVisible] = useState(false)

  useEventTracking({
    component: 'ContactUIKit'
  })

  // 处理下拉菜单项点击
  const onDropdownClick = (urlType: 'addFriend' | 'createGroup') => {
    const urlMap = {
      // 添加好友
      addFriend: neUiKitRouterPath.addFriend,
      // 创建群聊
      createGroup: neUiKitRouterPath.teamCreate
    }
    setAddDropdownVisible(false)
    navigate(urlMap[urlType])
  }

  // 跳转到验证消息列表页面
  const handleValidMsgClick = () => {
    store.sysMsgStore.setAllApplyMsgRead()
    navigate(neUiKitRouterPath.validlist)
  }

  // 跳转到黑名单列表页面
  const handleBlacklistClick = () => {
    navigate(neUiKitRouterPath.blacklist)
  }

  // 跳转到群列表页面
  const handleGroupContactClick = () => {
    navigate(neUiKitRouterPath.teamlist)
  }

  // 显示下拉菜单
  const showAddDropdown = () => {
    setAddDropdownVisible(true)
  }

  // 隐藏下拉菜单
  const hideAddDropdown = () => {
    setAddDropdownVisible(false)
  }

  return (
    <div className="contact-list-container">
      {/* 下拉菜单遮罩层 */}
      {addDropdownVisible && <div className="dropdown-mark" onTouchStart={hideAddDropdown} />}

      {/* 导航栏 */}
      <div className="navigation-bar">
        <div className="logo-box">
          <div>{t('contactText')}</div>
        </div>
        <div className="button-box">
          <div onClick={showAddDropdown}>
            <Icon type="icon-More" size={24} />
          </div>
          {addDropdownVisible && (
            <div className="dropdown-container">
              <div className="add-menu-list">
                <div className="add-menu-item" onClick={() => onDropdownClick('addFriend')}>
                  <div style={{ marginRight: '5px' }}>
                    <Icon type="icon-tianjiahaoyou" />
                  </div>
                  {t('addFriendText')}
                </div>
                <div className="add-menu-item" onClick={() => onDropdownClick('createGroup')}>
                  <div style={{ marginRight: '5px' }}>
                    <Icon type="icon-chuangjianqunzu" />
                  </div>
                  {t('createTeamText')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 联系人列表 */}
      <div className="contact-list">
        <div className="contact-item-content">
          {/* 验证消息 */}
          <div className="contact-item" onClick={handleValidMsgClick}>
            <Icon iconClassName="contact-item-icon contact-valid-icon" size={42} type="icon-yanzheng" style={{ color: '#fff' }} />
            <Badge num={unreadSysMsgCount} style={{ position: 'absolute', top: '5px', left: '45px' }} />
            <span className="contact-item-title">{t('validMsgText')}</span>
            <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
          </div>

          {/* 黑名单 */}
          <div className="contact-item" onClick={handleBlacklistClick}>
            <Icon iconClassName="contact-item-icon contact-blacklist-icon" size={42} type="icon-lahei2" style={{ color: '#fff' }} />
            <span className="contact-item-title">{t('blacklistText')}</span>
            <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
          </div>

          {/* 群聊 */}
          <div className="contact-item" onClick={handleGroupContactClick}>
            <Icon iconClassName="contact-item-icon contact-group-icon" size={42} type="icon-team2" style={{ color: '#fff' }} />
            <span className="contact-item-title">{t('teamMenuText')}</span>
            <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
          </div>
        </div>

        {/* 好友列表 */}
        <FriendList />
      </div>
    </div>
  )
})

export default ContactList
