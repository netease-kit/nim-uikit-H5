import React, { useEffect } from 'react'
import './index.less'

export interface PreviewImageProps {
  /**
   * 是否可见
   */
  visible: boolean
  /**
   * 图片URL
   */
  imageUrl: string
  /**
   * 关闭回调
   */
  onClose?: () => void
}

/**
 * 图片预览组件
 */
const PreviewImage: React.FC<PreviewImageProps> = ({ visible, imageUrl, onClose }) => {
  // 当组件可见时，禁止背景滚动
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    // 组件卸载时恢复滚动
    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  // 处理关闭事件
  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  // 阻止图片点击事件冒泡
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!visible) {
    return null
  }

  return (
    <div className="nim-preview-image-container" onClick={handleClose}>
      <div className="nim-preview-image-wrapper">
        <img src={imageUrl} className="nim-preview-image" onClick={handleImageClick} alt="预览图片" />
        <div className="nim-close-button" onClick={handleClose}>
          ×
        </div>
      </div>
    </div>
  )
}

export default PreviewImage
