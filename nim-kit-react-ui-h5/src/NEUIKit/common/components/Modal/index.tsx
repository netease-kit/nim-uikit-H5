import React from 'react'
import './index.less'

export interface ModalProps {
  /**
   * 对话框标题
   */
  title: string
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
   * 是否可见
   */
  visible: boolean
  /**
   * 确认按钮点击回调
   */
  onConfirm?: () => void
  /**
   * 取消按钮点击回调
   */
  onCancel?: () => void
  /**
   * 对话框内容
   */
  children?: React.ReactNode
}

/**
 * 模态对话框组件
 */
const Modal: React.FC<ModalProps> = ({ title, confirmText = '确定', cancelText = '取消', visible, onConfirm, onCancel, children }) => {
  // 如果不可见，则不渲染
  if (!visible) {
    return null
  }

  // 处理遮罩点击事件
  const handleMaskClick = () => {
    onCancel?.()
  }

  // 处理确认按钮点击事件
  const handleConfirmClick = () => {
    onConfirm?.()
  }

  // 处理取消按钮点击事件
  const handleCancelClick = () => {
    onCancel?.()
  }

  const handleContentClick = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // 阻止冒泡
    evt.stopPropagation()
  }

  return (
    <div className="nim-modal">
      <div className="nim-mask" onClick={handleMaskClick}></div>
      <div className="nim-content">
        <div className="nim-title">{title}</div>
        <div className="nim-slot-content" onClick={handleContentClick}>
          {children}
        </div>
        <div className="nim-buttons">
          <div className="nim-button nim-cancel" onClick={handleCancelClick}>
            {cancelText}
          </div>
          <div className="nim-button nim-confirm" onClick={handleConfirmClick}>
            {confirmText}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal
