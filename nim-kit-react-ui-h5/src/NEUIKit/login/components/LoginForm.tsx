import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import FormInput from './FormInput'
import i18n from '../i18n/zh-CN'
import { getLoginSmsCode, loginRegisterByCode } from '../utils/api'
import { toast } from '@/NEUIKit/common/utils/toast'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { init } from '@/NEUIKit/common/utils/init'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'

import './LoginForm.less'

/**
 * 登录表单组件
 */
const LoginForm: React.FC = () => {
  const navigate = useNavigate()
  const { store } = useStateContext()

  // 短信倒计时
  const [smsCount, setSmsCount] = useState(60)

  // 登录选项卡
  const [loginTabs] = useState({
    active: 0,
    list: [{ key: 0, title: i18n.loginTitle }]
  })

  // 表单数据
  const [loginForm, setLoginForm] = useState({
    mobile: '',
    smsCode: ''
  })

  // 手机号输入规则
  const mobileInputRule = {
    reg: /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/,
    message: i18n.mobileErrorMsg,
    trigger: 'blur'
  }

  // 验证码输入规则
  const smsCodeInputRule = {
    reg: /^\d+$/,
    message: i18n.smsErrorMsg,
    trigger: 'blur'
  }

  // 计算短信按钮文字
  const smsText = useMemo(() => {
    if (smsCount > 0 && smsCount < 60) {
      return smsCount + i18n.smsCodeBtnTitleCount
    } else {
      return i18n.smsCodeBtnTitle
    }
  }, [smsCount])

  // 更新手机号
  const handleMobileChange = (value: string) => {
    setLoginForm((prev) => ({ ...prev, mobile: value }))
  }

  // 更新短信验证码
  const handleSmsCodeChange = (value: string) => {
    setLoginForm((prev) => ({ ...prev, smsCode: value }))
  }

  // 获取验证码
  const startSmsCount = async () => {
    // 如果倒计时已经开始，不重复发送
    if (smsCount > 0 && smsCount < 60) {
      return
    }

    // 验证手机号
    if (!mobileInputRule.reg.test(loginForm.mobile)) {
      toast.info(i18n.mobileErrorMsg)
      return
    }

    try {
      // 发送验证码请求
      await getLoginSmsCode({ mobile: loginForm.mobile })

      // 开始倒计时
      setSmsCount((prev) => prev - 1)
      const timer = setInterval(() => {
        setSmsCount((prev) => {
          if (prev > 0) {
            return prev - 1
          } else {
            clearInterval(timer)
            return 60
          }
        })
      }, 1000)
    } catch (error: any) {
      // 处理错误
      let msg = error.errMsg || error.msg || error.message || i18n.smsCodeFailMsg
      if (msg.startsWith('request:fail') || msg.startsWith('Failed to fetch')) {
        msg = i18n.smsCodeNetworkErrorMsg
      }
      toast.error(msg)
    }
  }

  // 提交登录表单
  const submitLoginForm = async () => {
    // 表单验证
    if (!mobileInputRule.reg.test(loginForm.mobile) || !smsCodeInputRule.reg.test(loginForm.smsCode)) {
      toast.info(i18n.mobileOrSmsCodeErrorMsg)
      return
    }

    try {
      // 登录请求
      const res = await loginRegisterByCode(loginForm)

      // 存储登录信息到 localStorage
      localStorage.setItem(
        '__yx_im_options__h5',
        JSON.stringify({
          account: res.imAccid,
          token: res.imToken
        })
      )

      // 初始化 SDK
      const { nim } = init()

      // 执行 IM 登录
      nim.V2NIMLoginService.login(res.imAccid, res.imToken, {
        // 强制模式设置为 true, 多端登录冲突时会挤掉其他端而让本端登上
        forceMode: true,
        // 演示为静态登录模式-固定账号密码
        authType: 0
      }).then(() => {
        // IM 登录成功后跳转到会话页面
        navigate(neUiKitRouterPath.conversation)
      })
    } catch (error: any) {
      // 处理错误
      let msg = error.errMsg || error.msg || error.message || i18n.loginFailMsg
      if (msg.startsWith('request:fail')) {
        msg = i18n.loginNetworkErrorMsg
      }
      toast.info(msg)
    }
  }

  return (
    <div className="login-form-wrapper">
      <div className="navigation-bar"></div>
      <div className="login-form-container">
        <div className="login-tabs">
          {loginTabs.list.map((item) => (
            <span key={item.key} className={`login-tab ${loginTabs.active === item.key ? 'active' : ''}`}>
              <span>{item.title}</span>
            </span>
          ))}
        </div>
        <div className="login-tips">{i18n.loginTips}</div>
        <div className="login-form">
          <FormInput
            className="login-form-input"
            type="tel"
            value={loginForm.mobile}
            onChange={handleMobileChange}
            placeholder={i18n.mobilePlaceholder}
            allowClear={true}
            rule={mobileInputRule}
            addonBefore={<span className="phone-addon-before">+86</span>}
          />
          <FormInput
            className="login-form-input"
            type="tel"
            value={loginForm.smsCode}
            onChange={handleSmsCodeChange}
            placeholder={i18n.smsCodePlaceholder}
            rule={smsCodeInputRule}
            addonAfter={
              <span className={`sms-addon-after ${smsCount > 0 && smsCount < 60 ? 'disabled' : ''}`} onClick={startSmsCount}>
                {smsText}
              </span>
            }
          />
        </div>
      </div>
      <button className="login-btn" onClick={submitLoginForm}>
        {i18n.loginBtnTitle}
      </button>
    </div>
  )
}

export default LoginForm
