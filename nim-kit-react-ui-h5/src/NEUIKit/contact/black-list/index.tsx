import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Empty from '@/NEUIKit/common/components/Empty'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Appellation from '@/NEUIKit/common/components/Appellation'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import './index.less'

/**
 * 黑名单列表页面
 */
const BlackList: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store } = useStateContext()
  const [blacklist, setBlacklist] = useState<string[]>([])

  // 使用 MobX observer 自动跟踪黑名单列表变化
  // const blacklist = store?.relationStore?.blacklist || []

  // 处理好友列表数据，并在好友列表或黑名单变化时更新
  useEffect(() => {
    setBlacklist(store.relationStore.blacklist || [])
  }, [store.relationStore.blacklist])

  // 移出黑名单
  const handleRemoveFromBlacklist = async (account: string) => {
    try {
      await store?.relationStore.removeUserFromBlockListActive(account)
      toast.info(t('removeBlackSuccessText'))
    } catch (error) {
      toast.info(t('removeBlackFailText'))
    }
  }

  return (
    <div className="black-list-container">
      <NavBar title={t('blacklistText')} />

      <div className="black-list-content">
        <div className="black-list-subtitle">{t('blacklistSubTitle')}</div>

        {blacklist.length === 0 ? (
          <Empty text={t('blacklistEmptyText')} />
        ) : (
          blacklist.map((item) => (
            <div className="black-item" key={item}>
              <div className="item-left">
                <Avatar account={item} gotoUserCard={true} />
                <Appellation className="black-name" account={item} />
              </div>
              <div className="black-button" onClick={() => handleRemoveFromBlacklist(item)}>
                {t('removeBlacklist')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

export default BlackList
