import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Input from '@/NEUIKit/common/components/Input'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import './index.less'

/**
 * 好友信息编辑组件
 */
const FriendEdit: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { store } = useStateContext()

  // 从URL参数中获取好友账号ID
  const query = new URLSearchParams(location.search)
  const accountId = query.get('accountId') || ''

  // 备注状态
  const [alias, setAlias] = useState<string>('')

  // 初始化好友备注信息
  useEffect(() => {
    if (accountId) {
      const friend = store.friendStore.friends.get(accountId)
      setAlias(friend?.alias ? friend.alias : '')
    }
  }, [accountId, store.friendStore.friends])

  // 计算输入长度提示
  const inputLengthTips = `${alias ? alias.length : 0}/15`

  // 处理输入变化
  const handleInput = (value: string) => {
    setAlias(value)
  }

  // 处理清除输入
  const handleClear = () => {
    setAlias('')
  }

  // 保存备注名称
  const handleSave = () => {
    // alias 为 null 和空字符串表示删除备注，在此对 alias 为 null 的转换成空字符串
    const trimmedAlias = alias === null ? '' : alias

    // 不允许全是空格
    if (trimmedAlias && !trimmedAlias.trim()) {
      toast.info(t('aliasConfirmText'))
      return
    }

    store.friendStore
      .setFriendInfoActive(accountId, {
        alias: trimmedAlias
      })
      .then(() => {
        toast.info(t('updateTeamSuccessText'))
        navigate(-1)
      })
      .catch(() => {
        toast.info(t('updateTeamFailedText'))
      })
  }

  return (
    <div className="nim-friend-edit">
      <NavBar title={t('remarkText')} rightContent={<div onClick={handleSave}>{t('saveText')}</div>} />

      <div className="group-name-input-container">
        <Input
          id="friend-remark-input"
          value={alias}
          maxLength={15}
          onChange={handleInput}
          onClear={handleClear}
          showClear={true}
          placeholder={t('friendEditPlaceholder')}
        />
        <div className="input-length">{inputLengthTips}</div>
      </div>
    </div>
  )
})

export default FriendEdit
