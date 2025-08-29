import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import emitter from '@/NEUIKit/common/utils/eventBus'
import Welcome from './components/Welcome'
import LoginForm from './components/LoginForm'

import './index.less'

/**
 * 登录组件
 */
const Login: React.FC = observer(() => {
  // 步骤状态：0 欢迎页，1 登录页
  const [step, setStep] = useState(0)

  useEffect(() => {
    // 监听登录事件，切换到登录页面
    const handleLogin = () => {
      setStep(1)
    }

    // 注册事件监听
    emitter.on('login', handleLogin)

    // 组件卸载时清理事件监听
    return () => {
      emitter.off('login', handleLogin)
    }
  }, [])

  return (
    <div className="login-wrapper">
      {step === 0 && <Welcome />}
      {step === 1 && <LoginForm />}
    </div>
  )
})

export default Login
