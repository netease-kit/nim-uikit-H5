import React, { useState, useEffect } from 'react'
import { useNavigate } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Empty from '@/NEUIKit/common/components/Empty'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { friendGroupByPy } from '@/NEUIKit/common/utils/friend'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import './index.less'

interface FriendItem {
  accountId: string
  appellation: string
}

interface FriendGroup {
  key: string
  data: FriendItem[]
}

/**
 * 好友列表组件
 */
const FriendList: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()
  const [friendGroupList, setFriendGroupList] = useState<FriendGroup[]>([])

  // 点击好友项跳转到好友名片页
  const handleFriendItemClick = (friend: FriendItem) => {
    navigate(`${neUiKitRouterPath.friendCard}?accountId=${friend.accountId}`)
  }

  // 处理好友列表数据，并在好友列表或黑名单变化时更新
  useEffect(() => {
    // 使用 MobX observer 自动响应数据变化
    // 筛选出非黑名单好友
    const friendList = store.uiStore.friends || []
    const blacklist = store.relationStore.blacklist || []

    const friendData = friendList
      .filter((item) => !blacklist.includes(item.accountId))
      .map((item) => ({
        accountId: item.accountId,
        appellation:
          store.uiStore.getAppellation({
            account: item.accountId
          }) || item.accountId
      }))

    // 按拼音分组
    setFriendGroupList(
      friendGroupByPy(
        friendData,
        {
          firstKey: 'appellation'
        },
        false
      )
    )
  }, [store.uiStore.friends, store.relationStore.blacklist])

  return (
    <div className="friend-list-container">
      <div className="friend-group-list">
        {friendGroupList.length === 0 ? (
          <Empty text={t('noFriendText')} />
        ) : (
          friendGroupList.map((friendGroup) => (
            <div className="friend-group-item" key={friendGroup.key}>
              <div className="friend-group-title">{friendGroup.key}</div>
              {friendGroup.data.map((friend) => (
                <div className="friend-item" key={friend.accountId} onClick={() => handleFriendItemClick(friend)}>
                  <Avatar account={friend.accountId} />
                  <div className="friend-name">{friend.appellation}</div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
})

export default FriendList
