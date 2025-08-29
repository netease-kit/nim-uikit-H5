import React from 'react'
import './index.less'

export interface SwitchProps {
  /**
   * 开关是否选中
   */
  checked: boolean
  /**
   * 是否禁用
   */
  disabled?: boolean
  /**
   * 选中状态改变事件
   */
  onChange?: (checked: boolean) => void
}

/**
 * 开关组件
 */
const Switch: React.FC<SwitchProps> = ({ checked, disabled = false, onChange }) => {
  // 处理开关状态变化
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked
    onChange?.(value)
  }

  return (
    <label className={`nim-switch-wrapper ${disabled ? 'nim-disabled' : ''}`}>
      <input type="checkbox" className="nim-switch-input" checked={checked} disabled={disabled} onChange={handleChange} />
      <div className="nim-switch-core"></div>
    </label>
  )
}

export default Switch
