import React from 'react'
import ModalDefault, { ModalProps } from '../components/Modal'
// 使用兼容性适配层以支持 React 16/18 的渲染 API 差异
import { reactDomCompat } from '../../../utils/reactDomCompat'

// 明确声明组件类型
const ModalComponent: React.FC<ModalProps> = ModalDefault as React.FC<ModalProps>

interface ModalOptions {
  /**
   * 对话框标题
   */
  title: string
  /**
   * 对话框内容
   */
  content?: React.ReactNode
  /**
   * 确认按钮文本
   * @default "确定"
   */
  confirmText?: string
  /**
   * 取消按钮文本
   * @default "取消"
   */
  cancelText?: string
  /**
   * 确认回调
   */
  onConfirm?: () => void
  /**
   * 取消回调
   */
  onCancel?: () => void
}

/**
 * 显示模态对话框
 * @param options 对话框配置
 */
export const showModal = (options: ModalOptions) => {
  // 创建容器
  const container = document.createElement('div')
  document.body.appendChild(container)

  const { title, content, confirmText, cancelText, onConfirm, onCancel } = options

  // 销毁对话框
  const destroy = () => {
    // 使用兼容性适配层卸载组件
    reactDomCompat.unmount(container)

    // 移除容器
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  // 使用兼容性适配层渲染组件
  reactDomCompat.render(
    React.createElement(ModalComponent, {
      title: title,
      children: content,
      confirmText: confirmText,
      cancelText: cancelText,
      visible: true,
      onConfirm: () => {
        onConfirm?.()
        destroy()
      },
      onCancel: () => {
        onCancel?.()
        destroy()
      }
    }),
    container
  )

  // 返回销毁函数
  return destroy
}

/**
 * Modal 服务
 * 提供便捷的调用方法
 */
export const modal = {
  /**
   * 显示确认对话框
   * @param options 对话框选项或标题字符串
   * @returns Promise对象，确认时resolve，取消时reject
   */
  confirm: (options: ModalOptions | string): Promise<void> => {
    const opts = typeof options === 'string' ? { title: options } : options

    return new Promise<void>((resolve, reject) => {
      showModal({
        ...opts,
        onConfirm: () => {
          opts.onConfirm?.()
          resolve()
        },
        onCancel: () => {
          opts.onCancel?.()
          reject(new Error('User cancelled'))
        }
      })
    })
  }
}
