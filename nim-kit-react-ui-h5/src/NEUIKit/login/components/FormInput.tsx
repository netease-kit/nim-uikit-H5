import React, { useState } from 'react'
import classNames from 'classnames'
import Input from '@/NEUIKit/common/components/Input'
import './FormInput.less'

interface Rule {
  reg: RegExp
  message: string
  trigger: string
}

interface FormInputProps {
  className?: string
  type?: string
  value: string
  placeholder?: string
  allowClear?: boolean
  rule?: Rule
  addonBefore?: React.ReactNode
  addonAfter?: React.ReactNode
  onChange: (value: string) => void
}

/**
 * 表单输入组件
 */
const FormInput: React.FC<FormInputProps> = ({
  className = '',
  type = 'text',
  value = '',
  placeholder = '',
  allowClear = false,
  rule = null,
  addonBefore,
  addonAfter,
  onChange
}) => {
  // 输入框焦点状态
  const [inputFocus, setInputFocus] = useState(false)
  // 输入错误状态
  const [inputError, setInputError] = useState(false)

  // 计算输入框样式类名
  const inputClass = classNames(className, 'form-input-item', { focus: inputFocus, error: inputError })

  // 处理输入变化
  const handleInput = (inputValue: string) => {
    let processedValue = inputValue

    // 如果是电话号码输入，只保留数字
    if (type === 'tel') {
      processedValue = inputValue.replace(/\D/g, '')
    }

    onChange(processedValue)
  }

  // 处理失焦事件
  const handleBlur = () => {
    setInputFocus(false)

    // 如果有规则且触发方式是失焦，则进行验证
    if (rule && rule.trigger === 'blur') {
      setInputError(!rule.reg.test(value || ''))
    }
  }

  // 处理聚焦事件
  const handleFocus = () => {
    setInputFocus(true)
  }

  // 清除输入
  const clearInput = () => {
    onChange('')
    setInputFocus(true)
  }

  return (
    <div className="login-form-input-wrapper">
      <div className={inputClass}>
        {addonBefore}
        <Input
          className="input"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          showClear={allowClear}
          onClear={clearInput}
        />
        {addonAfter}
      </div>
      {inputError && rule && <div className="error-tips">{rule.message}</div>}
    </div>
  )
}

export default FormInput
