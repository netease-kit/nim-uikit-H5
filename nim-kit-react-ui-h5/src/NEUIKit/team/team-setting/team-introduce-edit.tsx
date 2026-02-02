import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from '@/utils/router'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'

import NavBar from '@/NEUIKit/common/components/NavBar'
import Input from '@/NEUIKit/common/components/Input'
import Button from '@/NEUIKit/common/components/Button'

import './team-introduce-edit.less'

/**
 * 群名称/介绍编辑组件
 */
const TeamIntroduceEdit: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store } = useStateContext()
  const navigate = useNavigate()
  const location = useLocation()

  // 群ID
  const [teamId, setTeamId] = useState('')
  // 输入内容
  const [inputValue, setInputValue] = useState<string>('')
  // 是否有编辑权限
  const [hasPermission, setHasPermission] = useState(false)
  // 编辑类型：name 或 intro
  const [type, setType] = useState<string>('')

  // 根据类型确定最大长度
  const maxLength = useMemo(() => {
    return type === 'name' ? 30 : 100
  }, [type])

  // 输入长度提示
  const inputLengthTips = useMemo(() => {
    return `${inputValue ? inputValue.length : 0}/${maxLength}`
  }, [inputValue, maxLength])

  // 清除输入
  const handleClear = useCallback(() => {
    setInputValue('')
  }, [])

  // 处理输入变化
  const handleInput = useCallback((value: string) => {
    setInputValue(value ? value.replace(/\s*/g, '') : value)
  }, [])

  // 保存群名称/介绍
  const handleSave = useCallback(() => {
    if (!inputValue && type === 'name') {
      toast.info(t('teamTitleConfirmText'))
      return
    }

    store.teamStore
      .updateTeamActive({
        teamId,
        info: {
          [type]: inputValue
        }
      })
      .then(() => {
        toast.info(t('updateTeamSuccessText'))
        navigate(-1)
      })
      .catch((err: any) => {
        switch (err?.code) {
          case 109432:
            toast.info(t('noPermission'))
            break
          default:
            toast.info(t('updateTeamFailedText'))
            break
        }
      })
  }, [teamId, type, inputValue])

  // 初始化数据
  useEffect(() => {
    // 从 URL 查询参数获取群 ID 和编辑类型
    const params = new URLSearchParams(location.search)
    const id = params.get('teamId') || ''
    const editType = params.get('type') || ''

    setTeamId(id)
    setType(editType)

    const myAccount = store.userStore.myUserInfo.accountId
    const myTeamMember = store.teamMemberStore.getTeamMember(id, [myAccount])[0]
    const team = store.teamStore.teams.get(id)

    if (!team) return

    const updateInfoMode = team.updateInfoMode
    setInputValue(editType === 'name' ? team.name.substring(0, 30) : team.intro)

    // updateInfoMode 为 0 表示只有管理员和群主可以修改群信息
    // updateInfoMode 为 1 表示任何人都可以修改群信息
    if ((updateInfoMode === 0 && myTeamMember.memberRole !== 0) || updateInfoMode === 1) {
      setHasPermission(true)
    }
  }, [])

  return (
    <div className="team-introduce-set-container">
      <NavBar title={type === 'name' ? t('teamTitle') : t('teamIntro')} />

      {hasPermission ? (
        <div className="team-name-input-container">
          <Input
            value={inputValue}
            // allowClear={true}
            maxLength={maxLength}
            showClear={true}
            onChange={handleInput}
            onClear={handleClear}
            inputStyle={{ height: '40px' }}
          />
          <div className="input-length">{inputLengthTips}</div>
        </div>
      ) : (
        <div className="team-name-input-container">
          <div className="input">{inputValue}</div>
        </div>
      )}

      {hasPermission && (
        <Button
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            color: '#5ca1e6',
            padding: '10px',
            fontSize: '16px',
            textAlign: 'center',
            position: 'fixed',
            bottom: '20px',
            height: '40px',
            width: 'calc(100% - 40px)',
            boxSizing: 'border-box',
            margin: '0 20px'
          }}
          onClick={handleSave}
        >
          {t('saveText')}
        </Button>
      )}
    </div>
  )
})

export default TeamIntroduceEdit
