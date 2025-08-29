import React, { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Appellation from '@/NEUIKit/common/components/Appellation'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import './search-result-item.less'

interface SearchResultItemProps {
  item: any
}

/**
 * 会话搜索结果项组件
 */
const SearchResultItem: React.FC<SearchResultItemProps> = observer(({ item }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()

  // 是否是云端会话
  const enableV2CloudConversation = store.sdkOptions?.enableV2CloudConversation

  // 是否是群
  const isTeam = !!item.teamId

  // 群头像
  const teamAvatar = useMemo(() => {
    if (item.teamId) {
      return item.avatar
    }
    return undefined
  }, [item])

  // 对话方ID
  const to = useMemo(() => {
    if (item.teamId) {
      return item.teamId
    }
    return item.accountId
  }, [item])

  // 群名
  const teamName = useMemo(() => {
    if (item.teamId) {
      return item.name
    }
    return ''
  }, [item])

  // 点击搜索结果
  const handleItemClick = async () => {
    try {
      let conversationType
      let receiverId

      if (item.accountId) {
        conversationType = V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
        receiverId = item.accountId
      } else if (item.teamId) {
        conversationType = V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
        receiverId = item.teamId
      } else {
        throw Error('unknown scene')
      }

      if (enableV2CloudConversation) {
        await store.conversationStore?.insertConversationActive(conversationType, receiverId)
      } else {
        await store?.localConversationStore?.insertConversationActive(conversationType, receiverId)
      }

      navigate(neUiKitRouterPath.chat)
    } catch (error) {
      toast.info(t('selectSessionFailText'))
    }
  }

  return (
    <div className="nim-search-result-list-item" onClick={handleItemClick}>
      <div className="result-item-avatar">
        <Avatar account={to} avatar={teamAvatar} />
      </div>

      {!isTeam ? (
        <div className="result-item-title">
          <Appellation account={to} />
          <div className="result-item-account">{to}</div>
        </div>
      ) : (
        <div className="result-item-title">{teamName}</div>
      )}
    </div>
  )
})

export default SearchResultItem
