import { Outlet, useNavigate, useLocation } from '@/utils/router'
import V2NIM from 'nim-web-sdk-ng'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { LocalOptions } from '@xkit-yx/im-store-v2/dist/types/types'
import { Provider } from '@/NEUIKit/common/contextManager/Provider'
import { toast } from '@/NEUIKit/common/utils/toast'
import { NIM_APP_KEY, NIM_DEBUG_LEVEL, NIM_LBS_URLS, NIM_LINK_URL } from '@/config'
import zh from '../NEUIKit/common/locales/zh'
import en from '@/NEUIKit/common/locales/en'
import TabBar from './tabBar'
import './base.less'
import './global.less'
import './index.less'
import { V2NIMError } from 'nim-web-sdk-ng/dist/esm/types'
import { defaultLocalOptions } from '@/NEUIKit/common/utils/init'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')
  // 使用 useRef 确保即使在 StrictMode 下也只执行一次
  const isInitializedRef = React.useRef(false)
  const isLoggingInRef = React.useRef(false)

  const canShowBottomNav = ['/', '/conversation', '/contacts', '/my'].includes(location.pathname)

  // 使用 useRef 确保 getInstance 只执行一次（即使在 StrictMode 下组件重新挂载）
  const nimInstanceRef = React.useRef<ReturnType<typeof V2NIM.getInstance> | null>(null)
  
  if (!nimInstanceRef.current) {
    const enableV2CloudConversation = localStorage.getItem('enableV2CloudConversation') === 'on'
    nimInstanceRef.current = V2NIM.getInstance(
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
  }
  
  const nimInstance = nimInstanceRef.current

  // 避免每次渲染都创建新对象, 配置对象只创建一次
  const languageMap = useMemo(() => ({ zh, en }), [])

  // 初始化 UIKit 并登录 NIM
  const initIMUiKit = useCallback(async (opts: string) => {
    let account = ''
    let token = ''
    try {
      const options = JSON.parse(opts)
      account = options.account
      token = options.token
    } catch (err) {
      console.log('LoginInfo JSON parse error', err)
      // 登录信息无效，清除并跳转到登录页
      localStorage.removeItem('__yx_im_options__h5')
      navigate('/login')
      return
    }
    if (!account) {
      // 登录信息无效，清除并跳转到登录页
      localStorage.removeItem('__yx_im_options__h5')
      navigate('/login')
      return
    }

    try {
      await nimInstance.V2NIMLoginService.login(account, token, {
        // 强制模式默认设置为 false, 逻辑: 当自动登录时, 若多端登录遇到冲突, 不会挤掉其他端, 本次登录会 code: 417 失败
        forceMode: false,
        // 演示为静态登录模式-固定账号密码
        authType: 0
      })
      // IM 登录成功后跳转到会话页面
      navigate('/conversation')
      // this.showUiKit = true
    } catch (err) {
      const error = err as V2NIMError
      console.error('NIM Login failed!', error.toString())
      // 302 账号密码不可用, 需要重新输入, 417 多端登录冲突, 需要重新强制登录
      if (error.code === 302 || error.code === 417) {
        toast.error(`NIM Login failed: ${error.message}`)
        navigate('/login')
        return
      }

      toast.error(`NIM Login failed: ${error.code},${error.message}}`)
    }
  }, [nimInstance, navigate])

  // 初始化检查 - 只执行一次（即使在 StrictMode 下）
  useEffect(() => {
    // 使用 ref 防止在 StrictMode 下重复执行
    if (isInitializedRef.current || isLoggingInRef.current) {
      return
    }

    // 标记正在初始化
    isInitializedRef.current = true

    setLanguage(localStorage.getItem('switchToEnglishFlag') === 'en' ? 'en' : 'zh')
    const loginInfo = localStorage.getItem('__yx_im_options__h5')
    if (!loginInfo) {
      // 未登录，跳转到登录页
      navigate('/login')
      return
    }

    // 标记正在登录
    isLoggingInRef.current = true

    try {
      // 重新初始化 IM
      initIMUiKit(loginInfo).finally(() => {
        isLoggingInRef.current = false
      })
    } catch (err) {
      console.log('LoginInfo JSON parse error', err)
      // 登录信息无效，清除并跳转到登录页
      localStorage.removeItem('__yx_im_options__h5')
      navigate('/login')
      isLoggingInRef.current = false
    }
  }, [initIMUiKit])

  // 本地默认行为参数
  const localOptions: Partial<LocalOptions> = useMemo(() => {
    return {
      ...defaultLocalOptions
    }
  }, [])

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
