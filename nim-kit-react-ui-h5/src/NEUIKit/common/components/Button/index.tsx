import React from 'react'
import classNames from 'classnames'
import './index.less'

export type ButtonType = 'default' | 'primary' | 'success' | 'warning' | 'danger'

export interface ButtonProps {
  /**
   * 按钮类型
   */
  type?: ButtonType
  /**
   * 是否禁用
   */
  disabled?: boolean
  /**
   * 是否为块级元素
   */
  block?: boolean
  /**
   * 是否为圆角按钮
   */
  round?: boolean
  /**
   * 是否为朴素按钮
   */
  plain?: boolean
  /**
   * 自定义样式
   */
  style?: React.CSSProperties
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 点击事件
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  /**
   * 子元素
   */
  children?: React.ReactNode
}

/**
 * 按钮组件
 */
const Button: React.FC<ButtonProps> = ({
  type = 'default',
  disabled = false,
  block = false,
  round = false,
  plain = false,
  style = {},
  className = '',
  onClick,
  children
}) => {
  // 处理点击事件
  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!disabled && onClick) {
      onClick(event)
    }
  }

  // 计算组件类名
  const buttonClass = classNames(
    'nim-button',
    `nim-button--${type}`,
    {
      'nim-button--disabled': disabled,
      'nim-button--block': block,
      'nim-button--round': round,
      'nim-button--plain': plain
    },
    className
  )

  return (
    <button className={buttonClass} style={style} disabled={disabled} onClick={handleClick}>
      {children}
    </button>
  )
}

export default Button
