import React, { useState, useEffect, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from '@/utils/router'
import RootStore from '@xkit-yx/im-store-v2'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { loading } from '@/NEUIKit/common/utils/loading'

import NavBar from '@/NEUIKit/common/components/NavBar'
import Icon from '@/NEUIKit/common/components/Icon'
import Button from '@/NEUIKit/common/components/Button'

import './team-avatar-edit.less'

/**
 * 群头像编辑组件
 */
const TeamAvatarEdit: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store } = useStateContext()
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 群ID
  const [teamId, setTeamId] = useState('')
  // 群头像
  const [avatar, setAvatar] = useState<string>('')
  // 是否有编辑权限
  const [hasPermission, setHasPermission] = useState(false)

  // 默认头像列表
  const avatarArr = [
    'https://yx-web-nosdn.netease.im/common/2425b4cc058e5788867d63c322feb7ac/groupAvatar1.png',
    'https://yx-web-nosdn.netease.im/common/62c45692c9771ab388d43fea1c9d2758/groupAvatar2.png',
    'https://yx-web-nosdn.netease.im/common/d1ed3c21d3f87a41568d17197760e663/groupAvatar3.png',
    'https://yx-web-nosdn.netease.im/common/e677d8551deb96723af2b40b821c766a/groupAvatar4.png',
    'https://yx-web-nosdn.netease.im/common/fd6c75bb6abca9c810d1292e66d5d87e/groupAvatar5.png'
  ]

  // 选择默认头像
  const setAvatarFromList = useCallback(
    (index: number) => {
      setAvatar(avatarArr[index])
    },
    [avatarArr]
  )

  // 触发文件选择器
  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  // 处理头像上传
  const onChangeAvatar = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.info(t('selectImageText'))
      return
    }

    try {
      loading.show()
      const result = await store?.storageStore.uploadFileActive(file)
      setAvatar(result)
    } catch (err) {
      toast.info(t('FailAvatarText'))
    } finally {
      loading.hide()
      // 清空 input 的值，这样用户可以重复选择同一个文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [])

  // 保存群头像
  const handleSave = useCallback(() => {
    store?.teamStore
      .updateTeamActive({
        teamId,
        info: {
          avatar: avatar
        }
      })
      .then(() => {
        toast.info(t('updateTeamSuccessText'))
        navigate(-1)
      })
      .catch(() => {
        toast.info(t('updateTeamFailedText'))
      })
  }, [teamId, avatar])

  // 初始化数据
  useEffect(() => {
    // 从 URL 查询参数获取群 ID
    const params = new URLSearchParams(location.search)
    const id = params.get('teamId') || ''
    setTeamId(id)

    const myAccount = store?.userStore.myUserInfo.accountId
    const team = store?.teamStore.teams.get(id)
    const updateInfoMode = team?.updateInfoMode
    setAvatar(team?.avatar || '')

    const myTeamMember = store?.teamMemberStore.getTeamMember(id, [myAccount])[0]

    // updateInfoMode 为 0 表示只有管理员和群主可以修改群信息；updateInfoMode 为 1 表示任何人都可以修改群信息
    if ((updateInfoMode === 0 && myTeamMember?.memberRole !== 0) || updateInfoMode === 1) {
      setHasPermission(true)
    }
  }, [])

  return (
    <div className="team-avatar-set-container">
      <NavBar title={t('updateAvatarText')} />
      <div className="team-avatar-container">
        {hasPermission ? (
          <div className="avatar" onClick={triggerFileInput}>
            {avatar && <img className="avatar-img avatar-img-edit" src={avatar} alt="avatar" />}
            <div className="choose-picture">
              <Icon size={24} type="choose-picture" />
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={onChangeAvatar} />
          </div>
        ) : (
          <div className="avatar">{avatar && <img className="avatar-img" src={avatar} alt="avatar" />}</div>
        )}
      </div>

      {hasPermission && (
        <div className="team-avatar-arr-container">
          <div className="tip">{t('chooseDefaultImage')}</div>
          <div className="avatar-arr">
            {avatarArr.map((src, index) => (
              <img key={index} className="avatar-img" src={src} alt={`avatar-${index}`} onClick={() => setAvatarFromList(index)} />
            ))}
          </div>
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

export default TeamAvatarEdit
