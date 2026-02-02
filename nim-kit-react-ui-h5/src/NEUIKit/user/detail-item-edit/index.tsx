import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Icon from '@/NEUIKit/common/components/Icon'
import Input from '@/NEUIKit/common/components/Input'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { V2NIMUser } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService'
import './index.less'

/**
 * 用户详情项编辑组件
 */
const DetailItemEdit: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { store } = useStateContext()

  // 获取要编辑的字段key（从URL参数中）
  const query = new URLSearchParams(location.search)
  const key: any = query.get('key') || ''

  // 状态
  const [inputValue, setInputValue] = useState('')
  const [showClearIcon, setShowClearIcon] = useState(false)
  // const [myUserInfo, setMyUserInfo] = useState<V2NIMUser | undefined>()
  const myUserInfo = store.userStore.myUserInfo

  // 各字段最大长度限制
  const maxlengthMap = {
    name: 15,
    mobile: 11,
    sign: 50,
    email: 30
  }

  // 监听用户信息变化并更新输入值
  useEffect(() => {
    if (key && myUserInfo) {
      let value = myUserInfo[key as keyof V2NIMUser] as string

      // 如果昵称没有值，则默认显示账号
      if (key === 'name' && !value) {
        value = myUserInfo.accountId
      }

      setInputValue(value || '')
    }
  }, [key])

  // 输入值变化处理
  const onInputChange = (str: string) => {
    setInputValue(str)
  }

  // 输入框获取焦点处理
  const onInputFocus = () => {
    setShowClearIcon(true)
  }

  // 清空输入值
  const clearInputValue = () => {
    setInputValue('')
  }

  // 确认修改用户信息
  const onUserInfoConfirm = () => {
    const value = inputValue

    // 手机号格式验证
    if (key === 'mobile' && !/^\d+(\.\d+)?$/.test(value) && value.trim() !== '') {
      toast.info(t('telErrorText'))
      return
    }

    // 邮箱格式验证
    if (key === 'email' && !/[a-zA-Z0-9]+([-_.][A-Za-zd]+)*@([a-zA-Z0-9]+[-.])+[A-Za-zd]{2,5}$/.test(value) && value.trim() !== '') {
      toast.info(t('emailErrorText'))
      return
    }

    // 保存用户信息
    if (key && myUserInfo) {
      store.userStore
        .updateSelfUserProfileActive({ ...myUserInfo, [key]: value })
        .then(() => {
          // 保存成功后返回上一页
          navigate(-1)
        })
        .catch(() => {
          toast.info(`${t('saveText')}${t(key)}${t('failText')}`)
        })
    }
  }

  return (
    <div className="nim-detail-item-edit">
      <NavBar
        title={t(key)}
        rightContent={
          <div className="nav-bar-text" onClick={onUserInfoConfirm}>
            {t('okText')}
          </div>
        }
      />

      <div className="user-info-item-wrapper">
        <Input
          value={inputValue}
          onChange={onInputChange}
          onFocus={onInputFocus}
          maxLength={maxlengthMap[key as keyof typeof maxlengthMap]}
          className="detail-input"
        />
        {showClearIcon && (
          <div onClick={clearInputValue}>
            <Icon iconClassName="clear-icon" type="icon-shandiao" />
          </div>
        )}
      </div>
    </div>
  )
})

export default DetailItemEdit
