import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { toast } from '@/NEUIKit/common/utils/toast'
import { copyText } from '@/NEUIKit/common/utils'
import './index.less'

export interface UserCardProps {
  /**
   * 用户账号
   */
  account?: string
  /**
   * 用户昵称
   */
  nick?: string
  /**
   * 点击事件
   */
  onClick?: () => void
}

/**
 * 用户信息卡片组件
 */
const UserCard: React.FC<UserCardProps> = observer(({ account = '', nick = '', onClick }) => {
  const { t } = useTranslation()
  const { store } = useStateContext()
  const [alias, setAlias] = useState<string>('')

  // 直接从 store 中获取好友信息
  // observer 会自动观察 store 的变化并触发重新渲染
  useEffect(() => {
    if (!account || !store?.friendStore) return

    // 获取好友信息并设置别名
    const friend = store.friendStore.friends.get(account)
    setAlias(friend?.alias ? friend.alias : '')
  }, [account])

  // 复制账号
  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      copyText(account)
      toast.success(t('copySuccessText'))
    } catch (error) {
      toast.error(t('copyFailText'))
    }
  }

  return (
    <div className="user-card-wrapper" onClick={onClick}>
      <div className="user-card-avatar">{account && <Avatar size={70} account={account} />}</div>
      <div className="user-card-info">
        {alias ? (
          <>
            <div className="user-card-main">{alias}</div>
            <div className="user-card-deputy">
              {t('name')}:{nick || account}
            </div>
          </>
        ) : (
          <div className="user-card-main">{nick || account}</div>
        )}
        <div className="user-card-deputy">
          {t('accountText')}:{account}
          <div onClick={handleCopyAccount}>
            <Icon iconClassName="user-card-copy" type="icon-fuzhi1" size={20} style={{ color: '#A6ADB6' }} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default UserCard
