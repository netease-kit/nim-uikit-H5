import React from 'react'
import './index.less'

export interface EmptyProps {
  /**
   * 提示文本
   */
  text?: string
  /**
   * 图片URL
   */
  imageUrl?: string
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 自定义样式
   */
  style?: React.CSSProperties
}

const Empty: React.FC<EmptyProps> = ({
  text = '',
  imageUrl = 'https://yx-web-nosdn.netease.im/common/e0f58096f06c18cdd101f2614e6afb09/empty.png',
  className = '',
  style = {}
}) => {
  return (
    <div className={`empty-wrapper ${className}`} style={style}>
      <img className="empty-img" src={imageUrl} alt="empty" />
      {text && <div className="empty-text">{text}</div>}
    </div>
  )
}

export default Empty
