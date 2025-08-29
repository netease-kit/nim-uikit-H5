import { CSSProperties } from 'react'

export interface IconProps {
  /**
   * 图标类型，对应图标文件名（不含后缀）
   */
  type: string
  /**
   * 图标大小（宽高相等时使用）
   * @default 16
   */
  size?: number
  /**
   * 图标宽度，优先级高于size
   */
  width?: number
  /**
   * 图标高度，优先级高于size
   */
  height?: number
  /**
   * 图标容器的类名
   */
  className?: string
  /**
   * 图标容器的样式
   */
  style?: CSSProperties
  /**
   * 点击事件
   */
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
}