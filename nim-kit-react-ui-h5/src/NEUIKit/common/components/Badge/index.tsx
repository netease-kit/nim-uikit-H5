import React, { useMemo, CSSProperties } from 'react'
import './index.less'

export interface BadgeProps {
  /**
   * 数字
   */
  num: number
  /**
   * 最大显示数字
   */
  max?: number
  /**
   * 是否显示为小红点
   */
  dot?: boolean
  /**
   * 自定义样式
   */
  style?: CSSProperties
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 徽标内容
   */
  children?: React.ReactNode
  /**
   * 徽标位置偏移
   */
  offset?: [number, number]
}

/**
 * Badge 组件
 * 显示徽标数字或小红点
 */
const Badge: React.FC<BadgeProps> = ({ num, max = 99, dot = false, style = {}, className = '', children, offset = [0, 0] }) => {
  // 计算显示的文本
  const text = useMemo(() => {
    return num > 0 ? (num > max ? `${max}` : `${num}`) : ''
  }, [num, max])

  // 计算偏移样式
  const offsetStyle = useMemo(() => {
    return {
      right: -offset[0],
      top: offset[1],
      ...style
    }
  }, [offset, style])

  // 如果没有数字并且不需要显示小红点，只返回children
  if (num <= 0 && !dot) {
    return <>{children}</>
  }

  // 如果有children，则作为包装器使用
  if (children) {
    return (
      <div className="nim-badge-wrapper">
        {children}
        {dot ? (
          <div className="nim-badge-dot nim-badge-wrapper-dot" style={offsetStyle} />
        ) : text ? (
          <div className="nim-badge nim-badge-wrapper-content" style={offsetStyle}>
            {text}
          </div>
        ) : null}
      </div>
    )
  }

  // 否则作为独立徽标使用
  return (
    <div className={`nim-badge-container ${className}`}>
      {dot ? (
        <div className="nim-badge-dot" style={style} />
      ) : text ? (
        <div className="nim-badge" style={style}>
          {text}
        </div>
      ) : null}
      <div className="nim-badge-hidden">{num}</div>
    </div>
  )
}

export default Badge
