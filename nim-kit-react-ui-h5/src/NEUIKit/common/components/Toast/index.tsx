import React, { useEffect, useState } from 'react'
import './index.less'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastProps {
  /**
   * 提示文本
   */
  message: string
  /**
   * 展示时间，单位毫秒
   * @default 2000
   */
  duration?: number
  /**
   * 提示类型
   * @default "info"
   */
  type?: ToastType
  /**
   * 是否可见
   * @default false
   */
  visible?: boolean
}

/**
 * Toast 提示组件
 */
const Toast: React.FC<ToastProps> = ({ message, duration = 2000, type = 'info', visible = false }) => {
  const [isVisible, setIsVisible] = useState(visible)

  useEffect(() => {
    setIsVisible(visible)
  }, [visible])

  // 组件挂载时显示，并设置定时器自动关闭
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (isVisible) {
      timer = setTimeout(() => {
        setIsVisible(false)
      }, duration)
    }

    // 组件卸载时清除定时器
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [isVisible, duration])

  // 使用CSS类名控制动画
  const className = `nim-toast-container ${isVisible ? 'nim-fade-in' : 'nim-fade-out'}`

  return (
    <div className={className} style={{ display: isVisible ? 'block' : 'none' }}>
      <div className={`nim-toast-content ${type}`}>
        <span className="nim-toast-text">{message}</span>
      </div>
    </div>
  )
}

export default Toast
