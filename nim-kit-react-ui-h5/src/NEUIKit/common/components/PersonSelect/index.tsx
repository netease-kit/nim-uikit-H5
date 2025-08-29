import React, { useEffect, useState } from 'react'
import Avatar from '../Avatar'
import Appellation from '../Appellation'
import Empty from '../Empty'
import { t } from '../../utils/i18n'
import './index.less'

export interface PersonSelectItem {
  /**
   * 用户账号ID
   */
  accountId: string
  /**
   * 群组ID（可选）
   */
  teamId?: string
  /**
   * 是否禁用
   */
  disabled?: boolean
  /**
   * 是否选中
   */
  checked?: boolean
}

export interface PersonSelectProps {
  /**
   * 联系人列表
   */
  personList: PersonSelectItem[]
  /**
   * 是否显示按钮
   * @default true
   */
  showBtn?: boolean
  /**
   * 按钮文本
   * @default ""
   */
  btnText?: string
  /**
   * 是否为单选模式
   * @default false
   */
  radio?: boolean
  /**
   * 最大可选数量
   * @default Number.MAX_SAFE_INTEGER
   */
  max?: number
  /**
   * 选择变化事件
   */
  onCheckboxChange?: (selectList: string | string[]) => void
  /**
   * 按钮点击事件
   */
  onBtnClick?: () => void
}

/**
 * 联系人选择组件
 */
const PersonSelect: React.FC<PersonSelectProps> = ({
  personList,
  showBtn = true,
  btnText = '',
  radio = false,
  max = Number.MAX_SAFE_INTEGER,
  onCheckboxChange,
  onBtnClick
}) => {
  // 已选择的账号列表
  const [selectAccount, setSelectAccount] = useState<string[]>([])

  // 初始化选中状态
  useEffect(() => {
    const initialSelectedAccounts = personList.filter((item) => item.checked).map((item) => item.accountId)
    setSelectAccount(initialSelectedAccounts)
  }, [personList])

  // 处理单选变化
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>, accountId: string) => {
    event.preventDefault()
    const checked = event.target.checked
    const newSelectAccount = checked ? [accountId] : []
    setSelectAccount(newSelectAccount)
    onCheckboxChange?.(newSelectAccount)
  }

  // 处理多选变化
  const handleCheckboxChange = (event: React.MouseEvent, accountId: string) => {
    event.preventDefault()
    const isSelected = selectAccount.includes(accountId)
    let newSelectAccount: string[]

    if (isSelected) {
      // 如果已选中，则取消选择
      newSelectAccount = selectAccount.filter((id) => id !== accountId)
    } else {
      // 如果未选中，且未超过最大数量，则添加选择
      if (selectAccount.length < max) {
        newSelectAccount = [...selectAccount, accountId]
      } else {
        return // 已达最大选择数量
      }
    }

    setSelectAccount(newSelectAccount)
    onCheckboxChange?.(newSelectAccount)
  }

  // 处理按钮点击
  const handleBtnClick = () => {
    onBtnClick?.()
  }

  // 如果没有联系人，则显示空状态
  if (personList.length === 0) {
    return <Empty text={t('noFriendText')} />
  }

  return (
    <div className="nim-friend-select-wrapper">
      <div className="nim-member-wrapper">
        {/* 单选模式 */}
        {radio ? (
          <div className="nim-radio-group">
            {personList.map((item) => (
              <div className="nim-member-item" key={item.accountId}>
                <label className="nim-radio-label">
                  <input
                    type="radio"
                    className="nim-radio-input"
                    value={item.accountId}
                    checked={selectAccount.includes(item.accountId)}
                    disabled={item.disabled || (selectAccount.length >= max && !selectAccount.includes(item.accountId))}
                    onChange={(e) => handleRadioChange(e, item.accountId)}
                  />
                  <span className="nim-radio-custom"></span>
                  <Avatar className="nim-user-avatar" size={36} account={item.accountId} teamId={item.teamId} />
                  <div className="nim-user-name">
                    <Appellation account={item.accountId} teamId={item.teamId} />
                  </div>
                </label>
              </div>
            ))}
          </div>
        ) : (
          /* 多选模式 */
          <div className="nim-checkbox-group">
            {personList.map((item) => (
              <div className="nim-member-item" key={item.accountId}>
                <label className="nim-checkbox-label" onClick={(e) => handleCheckboxChange(e, item.accountId)}>
                  <input
                    type="checkbox"
                    className="nim-checkbox-input"
                    value={item.accountId}
                    checked={selectAccount.includes(item.accountId)}
                    disabled={item.disabled || (selectAccount.length >= max && !selectAccount.includes(item.accountId))}
                    readOnly
                  />
                  <span className="nim-checkbox-custom"></span>
                  <Avatar className="nim-user-avatar" size={36} account={item.accountId} teamId={item.teamId} />
                  <div className="nim-user-name">
                    <Appellation account={item.accountId} teamId={item.teamId} />
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 确认按钮 */}
      {showBtn && btnText && (
        <div className="nim-ok-btn">
          <button onClick={handleBtnClick}>{btnText}</button>
        </div>
      )}
    </div>
  )
}

export default PersonSelect
