import React from 'react'
import emitter from '@/NEUIKit/common/utils/eventBus'

import './Welcome.less'

/**
 * 登录欢迎页组件
 */
const Welcome: React.FC = () => {
  // 点击登录按钮，触发登录事件
  const handleClick = () => {
    emitter.emit('login')
  }

  return (
    <div className="login-welcome-wrapper">
      <img src="https://yx-web-nosdn.netease.im/common/da126b0fcc419b142224ced81456e179/yx-welcome.png" className="welcome-img" alt="Welcome" />
      <button className="login-btn" onClick={handleClick}>
        注册/登录
      </button>
      <div className="bottom-box">
        <img src="https://yx-web-nosdn.netease.im/common/9303d9be2ea5f90c48397326ae5dfd45/welcome-bottom.png" className="welcome-img-bottom" alt="Bottom" />
      </div>
    </div>
  )
}

export default Welcome
