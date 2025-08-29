import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '../../hooks/useTranslate'
import './index.less'

export interface BottomPopupProps {
  /**
   * 控制弹窗显示隐藏
   */
  visible: boolean
  /**
   * 是否显示头部
   */
  showHeader?: boolean
  /**
   * 是否显示取消按钮
   */
  showCancel?: boolean
  /**
   * 是否显示确定按钮
   */
  showConfirm?: boolean
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 确认按钮点击事件
   */
  onConfirm?: () => void
  /**
   * 取消按钮点击事件
   */
  onCancel?: () => void
  /**
   * 关闭弹窗事件
   */
  onClose?: () => void
  /**
   * 弹窗内容
   */
  children?: React.ReactNode
}

/**
 * 底部弹出层组件
 */
const BottomPopup: React.FC<BottomPopupProps> = ({
  visible,
  showHeader = true,
  showCancel = true,
  showConfirm = true,
  className = '',
  onConfirm,
  onCancel,
  onClose,
  children
}) => {
  const { t } = useTranslation()
  const [shouldRender, setShouldRender] = useState(false)

  // 处理显示/隐藏逻辑
  useEffect(() => {
    if (visible) {
      setShouldRender(true)
    } else {
      // 延迟移除DOM，等待动画完成
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [visible])

  // 阻止弹窗显示时的页面滚动
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  const handleConfirm = () => {
    onConfirm?.()
    onClose?.()
  }

  const handleCancel = () => {
    onCancel?.()
    onClose?.()
  }

  if (!shouldRender) {
    return null
  }

  // 将弹窗渲染到 body 下，避免被其他元素的样式影响
  return createPortal(
    <div className={`nim-bottom-popup ${visible ? 'nim-bottom-popup-show' : 'nim-bottom-popup-hide'} ${className}`}>
      <div className="nim-popup-mask" onClick={handleCancel}></div>
      <div className="nim-popup-content">
        {showHeader && (
          <div className="nim-popup-header">
            {showCancel && (
              <div className="nim-cancel-btn" onClick={handleCancel}>
                {t('cancelText') || '取消'}
              </div>
            )}
            {showConfirm && (
              <div className="nim-confirm-btn" onClick={handleConfirm}>
                {t('okText') || '确定'}
              </div>
            )}
          </div>
        )}
        <div className="nim-popup-body">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default BottomPopup
