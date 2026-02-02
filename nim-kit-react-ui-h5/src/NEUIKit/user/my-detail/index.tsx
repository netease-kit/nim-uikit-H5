import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { copyText } from '@/NEUIKit/common/utils'
import { toast } from '@/NEUIKit/common/utils/toast'
import { loading } from '@/NEUIKit/common/utils/loading'
import { V2NIMUser } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService'
import './index.less'

/**
 * 个人详情页面
 */
const MyDetail: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 群组列表本地状态
  const myUserInfo = store.userStore.myUserInfo

  // 处理导航跳转
  const navigatorToUserItem = (key: string) => {
    navigate(`${neUiKitRouterPath.myDetailEdit}?key=${key}`)
  }

  // 触发文件选择
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // 头像更改处理
  const onChangeAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error(t('FailAvatarText'))
      return
    }

    try {
      loading.show()

      // 更新用户头像
      await store.userStore.updateSelfUserProfileActive(
        {
          ...myUserInfo
        },
        file
      )
    } catch (error) {
      toast.error(t('FailAvatarText'))
    } finally {
      loading.hide()
      // 清空 input 值，允许选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 复制账号
  const copyAccount = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      copyText(myUserInfo?.accountId || '')
      toast.success(t('copySuccessText'))
    } catch (error) {
      toast.error(t('copyFailText'))
    }
  }

  // 获取性别文本
  const getGenderText = () => {
    if (!myUserInfo) return t('unknow')

    switch (myUserInfo.gender) {
      case 1:
        return t('man')
      case 2:
        return t('woman')
      default:
        return t('unknow')
    }
  }

  return (
    <div className="my-detail-wrapper">
      <NavBar title={t('PersonalPageText')} />

      <div className="my-detail-item-wrapper">
        {/* 头像 */}
        <div className="my-detail-item" onClick={triggerFileInput}>
          <div className="item-left">{t('avatarText')}</div>
          <div className="item-right">
            <Avatar avatar={myUserInfo?.avatar} account={myUserInfo?.accountId || ''} />
            <Icon iconClassName="arrow" type="icon-jiantou" size={15} style={{ color: '#A6ADB6' }} />
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={onChangeAvatar} />
          </div>
        </div>

        <div className="box-shadow"></div>

        {/* 昵称 */}
        <div className="my-detail-item" onClick={() => navigatorToUserItem('name')}>
          <div className="item-left">{t('name')}</div>
          <div className="item-right">
            <div className="nick">{myUserInfo?.name || myUserInfo?.accountId}</div>
            <Icon iconClassName="arrow" type="icon-jiantou" size={15} style={{ color: '#A6ADB6' }} />
          </div>
        </div>

        <div className="box-shadow"></div>

        {/* 账号 */}
        <div className="my-detail-item">
          <div className="item-left">{t('accountText')}</div>
          <div className="item-right">
            {myUserInfo?.accountId}
            <div onClick={copyAccount} className="arrow">
              <Icon size={15} style={{ color: '#A6ADB6' }} type="icon-fuzhi1" />
            </div>
          </div>
        </div>

        <div className="box-shadow"></div>

        {/* 性别 */}
        <div className="my-detail-item">
          <div className="item-left">{t('genderText')}</div>
          <div className="item-right">
            <div className="uni-input">{getGenderText()}</div>
          </div>
        </div>

        <div className="box-shadow"></div>

        {/* 生日 */}
        <div className="my-detail-item">
          <div className="item-left">{t('birthText')}</div>
          <div className="item-right">
            <div className="uni-input">{myUserInfo?.birthday || t('unknow')}</div>
          </div>
        </div>

        <div className="box-shadow"></div>

        {/* 手机 */}
        <div className="my-detail-item" onClick={() => navigatorToUserItem('mobile')}>
          <div className="item-left">{t('mobile')}</div>
          <div className="item-right">
            {myUserInfo?.mobile || t('unknow')}
            <Icon iconClassName="arrow" type="icon-jiantou" size={15} style={{ color: '#A6ADB6' }} />
          </div>
        </div>

        <div className="box-shadow"></div>

        {/* 邮箱 */}
        <div className="my-detail-item" onClick={() => navigatorToUserItem('email')}>
          <div className="item-left">{t('email')}</div>
          <div className="item-right">
            <div className="email">{myUserInfo?.email || t('unknow')}</div>
            <Icon iconClassName="arrow" type="icon-jiantou" size={15} style={{ color: '#A6ADB6' }} />
          </div>
        </div>
      </div>

      {/* 签名 */}
      <div className="my-detail-signature" onClick={() => navigatorToUserItem('sign')}>
        <div className="signature-key">{t('sign')}</div>
        <div className="signature-text">{myUserInfo?.sign || t('unknow')}</div>
        <Icon iconClassName="arrow" type="icon-jiantou" size={15} style={{ color: '#A6ADB6' }} />
      </div>
    </div>
  )
})

export default MyDetail
