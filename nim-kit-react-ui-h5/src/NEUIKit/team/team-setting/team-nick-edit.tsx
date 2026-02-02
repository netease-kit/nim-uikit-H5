import React, { useState, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from '@/utils/router'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import type { V2NIMTeamMember } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService'

import NavBar from '@/NEUIKit/common/components/NavBar'
import Icon from '@/NEUIKit/common/components/Icon'
import Input from '@/NEUIKit/common/components/Input'

import './team-nick-edit.less'

/**
 * 群昵称编辑组件
 */
const TeamNickEdit: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store } = useStateContext()
  const navigate = useNavigate()
  const location = useLocation()

  // 输入内容
  const [inputValue, setInputValue] = useState('')
  // 是否显示清除图标
  const [showClearIcon, setShowClearIcon] = useState(false)
  const params = new URLSearchParams(location.search)
  const id = params.get('teamId') || ''
  // 群ID
  const [teamId, setTeamId] = useState(id)
  // 我的成员信息
  // const [myMemberInfo, setMyMemberInfo] = useState<V2NIMTeamMember>()
  const myMemberInfo = store.teamMemberStore.getTeamMember(id, [store.userStore.myUserInfo.accountId])[0]

  // 输入变化
  const onInputChange = useCallback((value: string) => {
    setInputValue(value)
  }, [])

  // 输入框获取焦点
  const onInputFocus = useCallback(() => {
    setShowClearIcon(true)
  }, [])

  // 清除输入内容
  const clearInputValue = useCallback(() => {
    setInputValue('')
  }, [])

  // 返回
  const back = useCallback(() => {
    navigate(-1)
  }, [])

  // 确认修改
  const onOk = useCallback(() => {
    store.teamMemberStore
      .updateMyMemberInfoActive({
        teamId,
        memberInfo: {
          teamNick: inputValue.trim()
        }
      })
      .then(() => {
        back()
      })
      .catch(() => {
        toast.info(t('saveFailedText'))
      })
  }, [teamId, inputValue])

  // 初始化数据和自动更新
  useEffect(() => {
    setInputValue(myMemberInfo.teamNick || '')
  }, [myMemberInfo])

  return (
    <div className="team-nick-edit-wrapper">
      <NavBar
        title={t('nickInTeam')}
        leftContent={
          <div className="nav-bar-text" onClick={back}>
            {t('cancelText')}
          </div>
        }
        rightContent={<div onClick={onOk}>{t('okText')}</div>}
      />
      <div className="userInfo-item-wrapper">
        <Input
          className="input"
          // confirmType={t('okText')}
          onFocus={onInputFocus}
          maxLength={15}
          onChange={onInputChange}
          value={inputValue}
          placeholder={t('nickInTeam')}
        />
        <div onClick={clearInputValue}>{showClearIcon && <Icon iconClassName="clear-icon" type="icon-shandiao" />}</div>
      </div>
    </div>
  )
})

export default TeamNickEdit
