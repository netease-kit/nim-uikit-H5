import React, { useState, useEffect, useRef, ReactNode } from 'react'
import classNames from 'classnames'
import './index.less'

export interface Rule {
  reg: RegExp
  message: string
  trigger: 'blur' | 'change'
}

export interface FormInputProps {
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 输入框类型
   */
  type?: string
  /**
   * 输入框值
   */
  value?: string
  /**
   * 默认值
   */
  defaultValue?: string
  /**
   * 占位文本
   */
  placeholder?: string
  /**
   * 是否可清除
   */
  allowClear?: boolean
  /**
   * 校验规则
   */
  rule?: Rule
  /**
   * 最大长度
   */
  maxLength?: number
  /**
   * 前置内容
   */
  addonBefore?: ReactNode
  /**
   * 后置内容
   */
  addonAfter?: ReactNode
  /**
   * 值变化回调
   */
  onChange?: (value: string) => void
  /**
   * 输入事件回调
   */
  onInput?: (value: string) => void
  /**
   * 聚焦事件回调
   */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  /**
   * 失焦事件回调
   */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

/**
 * 表单输入框组件
 */
const FormInput: React.FC<FormInputProps> = ({
  className = '',
  type = 'text',
  value,
  defaultValue = '',
  placeholder = '',
  allowClear = false,
  rule = null,
  maxLength = 140,
  addonBefore,
  addonAfter,
  onChange,
  onInput,
  onFocus,
  onBlur
}) => {
  // 使用内部状态管理输入值，支持非受控和受控模式
  const [inputValue, setInputValue] = useState(value !== undefined ? value : defaultValue)
  const [inputFocus, setInputFocus] = useState(false)
  const [inputError, setInputError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 当外部value变化时更新内部状态
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value)
    }
  }, [value])

  // 计算输入框容器的类名
  const containerClass = classNames('nim-form-input-item', className, {
    focus: inputFocus,
    error: inputError
  })

  // 处理输入事件
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // 检查是否超过最大长度
    if (maxLength && newValue.length > maxLength) {
      return
    }

    // 更新内部状态（非受控模式）
    if (value === undefined) {
      setInputValue(newValue)
    }

    // 触发回调
    if (onInput) {
      onInput(newValue)
    }

    if (onChange) {
      onChange(newValue)
    }

    // 如果规则触发器是change，则验证
    if (rule && rule.trigger === 'change') {
      setInputError(!rule.reg.test(newValue))
    }
  }

  // 处理聚焦事件
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setInputFocus(true)

    if (onFocus) {
      onFocus(e)
    }
  }

  // 处理失焦事件
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setInputFocus(false)

    // 如果规则触发器是blur，则验证
    if (rule && rule.trigger === 'blur') {
      setInputError(!rule.reg.test(inputValue || ''))
    }

    if (onBlur) {
      onBlur(e)
    }
  }

  // 清空输入
  const clearInput = () => {
    const newValue = ''

    // 更新内部状态（非受控模式）
    if (value === undefined) {
      setInputValue(newValue)
    }

    // 聚焦输入框
    inputRef.current?.focus()

    // 触发回调
    if (onInput) {
      onInput(newValue)
    }

    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="nim-form-input-wrapper">
      <div className={containerClass}>
        {addonBefore && <div className="nim-addon-before">{addonBefore}</div>}

        <input
          ref={inputRef}
          className="nim-input"
          type={type}
          value={inputValue || ''}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
        />

        <div className="nim-clear-icon" onClick={clearInput}>
          {allowClear && inputValue && (
            <svg className="nim-clear-svg" viewBox="0 0 1024 1024" width="16" height="16">
              <path d="M512 421.490332L331.083365 240.573697c-24.916408-24.916408-62.291021-24.916408-90.509249 0-24.916408 24.916408-24.916408 65.592842 0 90.509249L421.490751 512 240.574116 692.916635c-24.916408 24.916408-24.916408 65.592842 0 90.509249 24.916408 24.916408 65.592842 24.916408 90.509249 0L512 602.509668l180.916635 180.916216c24.916408 24.916408 65.592842 24.916408 90.5084 0 24.916408-24.916408 24.916408-65.592842 0-90.509249L602.508719 512l180.916216-180.916635c24.916408-24.916408 24.916408-65.592842 0-90.509249-24.916408-24.916408-65.592842-24.916408-90.5084 0L512 421.490332z" />
            </svg>
          )}
        </div>

        {addonAfter && <div className="nim-addon-after">{addonAfter}</div>}
      </div>

      {inputError && rule && <div className="nim-error-tips">{rule.message}</div>}
    </div>
  )
}

export default FormInput
