import { Outlet } from 'umi'
import classNames from 'classnames'
import V2NIM from 'nim-web-sdk-ng'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import { LocalOptions } from '@xkit-yx/im-store-v2/dist/types/types'
import { Provider } from '@/NEUIKit/common/contextManager/Provider'
import { toast } from '@/NEUIKit/common/utils/toast'
import { NIM_ACCOUNT_DEFAULT, NIM_APP_KEY, NIM_DEBUG_LEVEL, NIM_LBS_URLS, NIM_LINK_URL, NIM_TOKEN_DEFAULT } from '@/config'
import zh from '../NEUIKit/common/locales/zh'
import en from '@/NEUIKit/common/locales/en'
import TabBar from './tabBar'
import './base.less'
import './global.less'
import './index.less'
import { V2NIMError } from 'nim-web-sdk-ng/dist/esm/types'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')

  const canShowBottomNav = ['/', '/conversation', '/contacts', '/my'].includes(location.pathname)

  const nimInstance = useMemo(() => {
    const enableV2CloudConversation = localStorage.getItem('enableV2CloudConversation') === 'on'
    const nim = V2NIM.getInstance(
      {
        appkey: NIM_APP_KEY,
        debugLevel: NIM_DEBUG_LEVEL,
        apiVersion: 'v2', // 写死, 固定 v2
        enableV2CloudConversation: enableV2CloudConversation
      },
      {
        V2NIMLoginServiceConfig: {
          lbsUrls: NIM_LBS_URLS,
          linkUrl: NIM_LINK_URL
        }
      }
    )
    return nim
  }, [])

  // 避免每次渲染都创建新对象, 配置对象只创建一次
  const languageMap = useMemo(() => ({ zh, en }), [])

  // 初始化 UIKIT 并登录 NIM
  const initIMUiKit = async () => {
    let account = NIM_ACCOUNT_DEFAULT
    let token = NIM_TOKEN_DEFAULT

    try {
      await nimInstance.V2NIMLoginService.login(account, token, {
        // 强制模式默认设置为 false, 逻辑: 当自动登录时, 若多端登录遇到冲突, 不会挤掉其他端, 本次登录会 code: 417 失败
        forceMode: false,
        // 演示为静态登录模式-固定账号密码
        authType: 0
      })
      // IM 登录成功后跳转到会话页面
      navigate('/conversation')
    } catch (err) {
      const error = err as V2NIMError
      console.error('NIM Login failed!', error.toString())
      toast.error(`NIM Login failed: ${error.code},${error.message}}`)
    }
  }

  // 初始化检查
  useEffect(() => {
    setLanguage(localStorage.getItem('switchToEnglishFlag') === 'en' ? 'en' : 'zh')
    initIMUiKit()
  }, [])

  // 本地默认行为参数
  const localOptions: Partial<LocalOptions> = useMemo(() => {
    return {
      // 群组被邀请模式，默认不需要验证
      teamAgreeMode: V2NIMConst.V2NIMTeamAgreeMode.V2NIM_TEAM_AGREE_MODE_NO_AUTH,
      // 单聊消息是否显示已读未读
      p2pMsgReceiptVisible: true,
      // 群聊消息是否显示已读未读
      teamMsgReceiptVisible: true,
      // 是否需要@消息
      needMention: true,
      // 是否开启群管理员
      teamManagerVisible: true,
      // 是否显示在线离线状态
      loginStateVisible: false,
      // 是否允许转让群主
      allowTransferTeamOwner: true,
      // AI 功能是否开启
      aiVisible: true
    }
  }, [])

  console.log('=========nim====', nimInstance)

  return (
    <div className="layout-container">
      <Provider
        localeConfig={languageMap[language]}
        localOptions={localOptions}
        locale={language}
        // @ts-expect-error
        nim={nimInstance}
        singleton={true}
      >
        <div className={'main-content'}>
          <Outlet />
        </div>

        {canShowBottomNav && <TabBar />}
      </Provider>
    </div>
  )
}

export default Layout
