import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Switch from '@/NEUIKit/common/components/Switch'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { toast } from '@/NEUIKit/common/utils/toast'
import { modal } from '@/NEUIKit/common/utils/modal'
import './index.less'

/**
 * 用户设置页面
 */
const Setting: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()

  // 状态
  const [enableV2CloudConversation, setEnableV2CloudConversation] = useState(false)
  const [switchToEnglishFlag, setSwitchToEnglishFlag] = useState(false)

  // 初始化状态
  useEffect(() => {
    const storedCloudConv = localStorage.getItem('enableV2CloudConversation')
    const storedLanguage = localStorage.getItem('switchToEnglishFlag')

    setEnableV2CloudConversation(storedCloudConv === 'on')
    setSwitchToEnglishFlag(storedLanguage === 'en')
  }, [])

  // 处理云端会话设置变更
  const handleCloudConversationChange = (value: boolean) => {
    setEnableV2CloudConversation(value)
    localStorage.setItem('enableV2CloudConversation', value ? 'on' : 'off')
    toast.info('切换后刷新页面生效')
  }

  // 处理语言设置变更
  const handleLanguageChange = (value: boolean) => {
    setSwitchToEnglishFlag(value)
    localStorage.setItem('switchToEnglishFlag', value ? 'en' : 'zh')
    toast.info('切换后刷新页面生效')
  }

  // 处理退出登录
  const handleLogout = () => {
    modal.confirm({
      title: t('tipText'),
      content: t('logoutConfirmText'),
      onCancel: () => {},
      onConfirm: () => {
        // 清除本地存储
        localStorage.removeItem('__yx_im_options__h5')
        // 销毁store
        store.destroy()
        // 跳转到登录页
        navigate(neUiKitRouterPath.login)
      }
    })
  }

  return (
    <div className="setting-wrapper">
      <NavBar title={t('setText')} />

      <div className="setting-item-wrapper">
        {/* 云端会话开关 */}
        <div className="setting-item">
          <div className="item-left">{t('enableV2CloudConversationText')}</div>
          <div className="item-right">
            <Switch checked={enableV2CloudConversation} onChange={handleCloudConversationChange} />
          </div>
        </div>

        {/* 分隔线 */}
        <div className="box-shadow"></div>

        {/* 语言切换开关 */}
        <div className="setting-item">
          <div className="item-left">{t('SwitchToEnglishText')}</div>
          <div className="item-right">
            <Switch checked={switchToEnglishFlag} onChange={handleLanguageChange} />
          </div>
        </div>
      </div>

      {/* 退出登录按钮 */}
      <div className="logout-btn" onClick={handleLogout}>
        {t('logoutText')}
      </div>
    </div>
  )
})

export default Setting
