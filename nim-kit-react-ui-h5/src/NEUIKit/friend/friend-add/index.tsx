import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Input from '@/NEUIKit/common/components/Input'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Icon from '@/NEUIKit/common/components/Icon'
import Empty from '@/NEUIKit/common/components/Empty'
import Button from '@/NEUIKit/common/components/Button'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { V2NIMUser } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { Relation } from '@xkit-yx/im-store-v2'
import './index.less'

type SearchState = 'beginSearch' | 'searchEmpty' | 'searchResult'

/**
 * 添加好友组件
 */
const FriendAdd: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()

  // 状态
  const [searchText, setSearchText] = useState('')
  const [searchResState, setSearchResState] = useState<SearchState>('beginSearch')
  const [userInfo, setUserInfo] = useState<V2NIMUser>()
  const [relation, setRelation] = useState<Relation>('stranger')

  // 监听好友关系变化
  useEffect(() => {
    if (userInfo?.accountId) {
      const relationInfo = store.uiStore.getRelation(userInfo.accountId)
      setRelation(relationInfo.relation)
    }
  }, [userInfo])

  // 搜索框输入变化处理
  const onInputValueChange = (value: string) => {
    setSearchText(value)

    // 删除搜索内容,页面回到最原始状态，搜索结果都清空
    if (value === '') {
      setSearchResState('beginSearch')
    }
  }

  // 搜索好友
  const handleSearch = async () => {
    if (!searchText.trim()) return

    try {
      const user = await store.userStore.getUserActive(searchText)

      if (!user) {
        setSearchResState('searchEmpty')
      } else {
        setUserInfo(user)

        const relationInfo = store.uiStore.getRelation(user.accountId)
        setRelation(relationInfo.relation)
        setSearchResState('searchResult')
      }
    } catch (error) {
      setSearchResState('searchEmpty')
      toast.info(t('searchFailText'))
    }
  }

  // 添加好友
  const applyFriend = async () => {
    const account = userInfo?.accountId
    if (account) {
      try {
        await store.friendStore.addFriendActive(account, {
          addMode: V2NIMConst.V2NIMFriendAddMode.V2NIM_FRIEND_MODE_TYPE_APPLY,
          postscript: ''
        })

        // 发送申请成功后解除黑名单
        await store.relationStore.removeUserFromBlockListActive(account)

        toast.info(t('applyFriendSuccessText'))
      } catch (error) {
        toast.info(t('applyFriendFailText'))
      }
    }
  }

  // 去聊天
  const gotoChat = async () => {
    const to = userInfo?.accountId
    if (to) {
      try {
        const conversationId = store.nim.V2NIMConversationIdUtil.p2pConversationId(to)
        await store.uiStore.selectConversation(conversationId)

        navigate(neUiKitRouterPath.chat)
      } catch (error) {
        toast.info(t('gotoChatFailText'))
      }
    }
  }

  return (
    <div className="nim-friend-add">
      <NavBar title={t('addFriendText')} />

      <div className="search-input-wrapper">
        <div className="search-icon">
          <Icon size={20} style={{ color: '#A6ADB6' }} type="icon-sousuo" />
        </div>
        <Input
          id="friend-add"
          className="search-input"
          type="text"
          value={searchText}
          onChange={onInputValueChange}
          onConfirm={handleSearch}
          placeholder={t('enterAccount')}
          inputStyle={{
            backgroundColor: '#f2f4f5'
          }}
        />
      </div>

      {searchResState === 'searchEmpty' && <Empty text={t('noExistUser')} />}

      {searchResState === 'searchResult' && (
        <div className="user-wrapper">
          <Avatar className="user-avatar" account={userInfo?.accountId || ''} />
          <div className="user-info">
            <div className="user-nick">{(userInfo && userInfo.name) || (userInfo && userInfo.accountId)}</div>
            <div className="user-id">{userInfo && userInfo.accountId}</div>
          </div>

          {/* 如果是好友之间去聊天，如果不是好友，添加好友 */}
          {relation !== 'stranger' ? (
            <Button className="go-chat-button" onClick={gotoChat}>
              {t('chatButtonText')}
            </Button>
          ) : (
            <Button className="go-chat-button" onClick={applyFriend}>
              {t('addText')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
})

export default FriendAdd
