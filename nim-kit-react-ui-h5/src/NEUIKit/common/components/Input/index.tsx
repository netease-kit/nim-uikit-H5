import React, { useRef, useState } from 'react'
import classNames from 'classnames'
import './index.less'

export interface InputProps {
  /**
   * 输入框值
   */
  value?: string | number
  /**
   * 输入框默认值（非受控）
   */
  defaultValue?: string | number
  /**
   * 输入框类型
   */
  type?: string
  /**
   * 占位文本
   */
  placeholder?: string
  /**
   * 是否禁用
   */
  disabled?: boolean
  /**
   * 最大长度
   */
  maxLength?: number
  /**
   * 是否显示清除图标
   */
  showClear?: boolean
  /**
   * 输入框样式
   */
  inputStyle?: React.CSSProperties
  /**
   * 输入框ID
   */
  id?: string
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 值变化事件
   */
  onChange?: (value: string) => void
  /**
   * 聚焦事件
   */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
  /**
   * 失焦事件
   */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  /**
   * 清除事件
   */
  onClear?: () => void
  /**
   * 按下回车键事件
   */
  onConfirm?: (value: string | number) => void
}

/**
 * 基础输入框组件
 */
const Input: React.FC<InputProps> = ({
  value,
  defaultValue = '',
  type = 'text',
  placeholder = '请输入',
  disabled = false,
  maxLength,
  showClear = false,
  inputStyle = {},
  id = '',
  className = '',
  onChange,
  onFocus,
  onBlur,
  onClear,
  onConfirm
}) => {
  const el = useRef<HTMLInputElement>(null)
  // 当前实际值
  const currentValue = typeof value !== 'undefined' ? value : typeof defaultValue !== 'undefined' ? defaultValue : ''

  // 是否正在使用中文输入. 防止 input 受控组件无法输入中文, 参见 https://www.tangshuang.net/7840.html
  let inputing = false

  // 处理输入事件
  const handleChange = (event: React.ChangeEvent<HTMLInputElement> | React.CompositionEvent<HTMLInputElement>) => {
    const newValue = (event.target as HTMLInputElement).value

    onChange?.(newValue)
  }

  // 清空输入
  const clearInput = () => {
    onChange?.('')
    onClear?.()
  }

  const forceSetValue = () => {
    if (typeof value !== 'undefined' && el.current) {
      const input = el.current
      input.value = value.toString()
      input.setAttribute('value', value.toString())
    }
  }

  // 处理按键事件
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 检测是否按下回车键
    if (event.key === 'Enter') {
      event.preventDefault() // 阻止默认的换行行为
      onConfirm?.(currentValue) // 触发发送事件
    }
  }

  return (
    <div className={classNames('nim-input-wrapper', { 'is-disabled': disabled }, className)}>
      <input
        id={id}
        type={type}
        defaultValue={currentValue}
        ref={(input) => {
          if (!input) return
          // @ts-ignore
          el.current = input // 实际可变的, 但是 ts 不允许, 说是只读属性.
          forceSetValue()
        }}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        style={inputStyle}
        className="nim-input"
        onFocus={(evt) => {
          onFocus?.(evt)
        }}
        onBlur={(evt) => {
          // react 又干了些多余的事，在每次 focus 和 blur 时，都会去检查组件受控情况和 value 值，
          // 导致非受控组件的内部状态每次都是初始值（当第一次进来 defaultValue 为空时，那么这个 input 就一直都是空）。
          // 所以加了 onFocus 和 onBlur 两个属性，在里面通过一个延时操作，在 react 完成自己的检查之后，我再去修改真实 DOM，解决这个问题。
          // setTimeout(forceSetValue, 150)
          onBlur?.(evt)
        }}
        onCompositionStart={() => {
          inputing = true
        }}
        onCompositionEnd={(evt) => {
          inputing = false
          handleChange(evt)
        }}
        onChange={(evt) => {
          // 如果当前正在使用中文输入, 则不用处理这个 onChange 事件.
          if (!inputing) {
            handleChange(evt)
          }
        }}
        onKeyDown={handleKeyPress}
      />
      {showClear && currentValue && (
        <span className="nim-clear-icon" onClick={clearInput}>
          ×
        </span>
      )}
    </div>
  )
}

export default Input
