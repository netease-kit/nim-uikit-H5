import React from 'react'
// 使用类型断言明确指定组件类型
import ToastDefault, { ToastType, ToastProps } from '../components/Toast'
// 使用兼容性适配层以支持 React 16/18 的渲染 API 差异
import { reactDomCompat } from '../../../utils/reactDomCompat'

// 明确声明组件类型
const ToastComponent: React.FC<ToastProps> = ToastDefault as React.FC<ToastProps>

export interface ToastOptions {
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
}

// 用于存储当前toast的容器
let container: HTMLDivElement | null = null

/**
 * 显示Toast提示
 * @param options Toast配置项或提示文本
 */
export const showToast = (options: ToastOptions | string) => {
  // 如果传入的是字符串，转换为对象格式
  const opt = typeof options === 'string' ? { message: options } : options

  // 创建容器
  if (!container) {
    container = document.createElement('div')
    document.body.appendChild(container)
  }

  // 使用兼容性适配层渲染组件
  reactDomCompat.render(
    React.createElement(ToastComponent, {
      message: opt.message,
      duration: opt.duration,
      type: opt.type || 'info',
      visible: true
    }),
    container
  )

  // 自动清理
  const duration = opt.duration || 2000
  setTimeout(() => {
    // 渲染一个不可见的组件，以触发淡出动画
    if (container) {
      reactDomCompat.render(
        React.createElement(ToastComponent, {
          message: opt.message,
          duration: opt.duration,
          type: opt.type || 'info',
          visible: false
        }),
        container
      )
    }

    // 动画结束后移除DOM元素
    setTimeout(() => {
      if (container) {
        // 使用兼容性适配层卸载组件
        reactDomCompat.unmount(container)
        document.body.removeChild(container)
        container = null
      }
    }, 300) // 等待动画完成
  }, duration)
}

/**
 * Toast快捷方法
 */
export const toast = {
  /**
   * 显示普通提示
   */
  info: (message: string, duration?: number) => showToast({ message, type: 'info', duration }),

  /**
   * 显示成功提示
   */
  success: (message: string, duration?: number) => showToast({ message, type: 'success', duration }),

  /**
   * 显示警告提示
   */
  warning: (message: string, duration?: number) => showToast({ message, type: 'warning', duration }),

  /**
   * 显示错误提示
   */
  error: (message: string, duration?: number) => showToast({ message, type: 'error', duration })
}
