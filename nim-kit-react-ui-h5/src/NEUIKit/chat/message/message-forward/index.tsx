import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import BottomPopup from '@/NEUIKit/common/components/BottomPopup'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Appellation from '@/NEUIKit/common/components/Appellation'
import MessageForwardModal from '@/NEUIKit/chat/message/message-forward-modal'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMTeam } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService'
import './index.less'

interface MessageForwardProps {
  visible: boolean
  msgIdClient: string // 转发的消息ID
  onClose: () => void
}

/**
 * 消息转发组件
 */
const MessageForward: React.FC<MessageForwardProps> = observer(({ visible, msgIdClient, onClose }) => {
  const { t } = useTranslation()
  const { store, nim } = useStateContext()

  // 当前选中的标签页
  const [currentTab, setCurrentTab] = useState<'friend' | 'team'>('friend')
  // 选中的ID
  const [selectedId, setSelectedId] = useState<string>('')
  // 好友列表
  const [friendList, setFriendList] = useState<{ accountId: string; appellation: string }[]>([])
  // 群聊列表
  const teamList = store.uiStore.teamList

  // 转发相关状态
  const [forwardModalVisible, setForwardModalVisible] = useState(false)
  const [forwardTo, setForwardTo] = useState('')
  const [forwardMsg, setForwardMsg] = useState<any>()
  const [forwardConversationType, setForwardConversationType] = useState<V2NIMConst.V2NIMConversationType>(
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
  )
  const [forwardToTeamInfo, setForwardToTeamInfo] = useState<V2NIMTeam>()

  // 获取当前会话ID
  const conversationId = store.uiStore.selectedConversation

  // 监听好友列表
  useEffect(() => {
    const data = store.uiStore.friends
      .filter((item) => !store.relationStore.blacklist.includes(item.accountId))
      .map((item) => ({
        accountId: item.accountId,
        appellation: store.uiStore.getAppellation({
          account: item.accountId
        })
      }))

    if (data.length) {
      setFriendList(data)
    }
  }, [store.uiStore.friends, store.relationStore.blacklist])

  // 切换标签页
  const switchTab = (tab: 'friend' | 'team') => {
    setCurrentTab(tab)
    setSelectedId('')
  }

  // 选择项目
  const selectItem = (_forwardTo: string, conversationType: V2NIMConst.V2NIMConversationType) => {
    setSelectedId(_forwardTo)
    setForwardConversationType(conversationType)

    if (_forwardTo && msgIdClient) {
      setForwardTo(_forwardTo)
      const msg = store.msgStore.getMsg(conversationId, [msgIdClient])?.[0]
      setForwardMsg(msg)

      setForwardModalVisible(true)

      if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM) {
        const teamInfo = store.teamStore.teams.get(_forwardTo)
        setForwardToTeamInfo(teamInfo)
      }
    }
  }

  // 处理取消
  const handleCancel = () => {
    onClose()
  }

  // 处理转发确认
  const handleForwardConfirm = (forwardComment: string) => {
    setForwardModalVisible(false)

    if (!forwardMsg) {
      toast.info(t('getForwardMessageFailed'))
      return
    }

    const methodName = forwardConversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P ? 'p2pConversationId' : 'teamConversationId'

    const forwardConversationId = nim.V2NIMConversationIdUtil[methodName](forwardTo)

    store.msgStore
      .forwardMsgActive(forwardMsg, forwardConversationId, forwardComment)
      .then(() => {
        toast.info(t('forwardSuccessText'))
      })
      .catch(() => {
        toast.info(t('forwardFailedText'))
      })
      .finally(() => {
        onClose()
      })
  }

  // 处理转发取消
  const handleForwardCancel = () => {
    setForwardModalVisible(false)
  }

  return (
    <>
      <BottomPopup visible={visible} onConfirm={handleCancel} onCancel={handleCancel} showConfirm={false} showCancel={true}>
        <div className="forward-container-wrapper">
          <div className="tab-container">
            <div className={`tab-item ${currentTab === 'friend' ? 'active' : ''}`} onClick={() => switchTab('friend')}>
              {t('sendToFriend')}
            </div>
            <div className={`tab-item ${currentTab === 'team' ? 'active' : ''}`} onClick={() => switchTab('team')}>
              {t('sendToTeam')}
            </div>
          </div>

          <div className="list-container">
            {/* 好友列表 */}
            {currentTab === 'friend' && (
              <div className="friend-list">
                {friendList.map((friend) => (
                  <div
                    key={friend.accountId}
                    className={`list-item ${selectedId === friend.accountId ? 'selected' : ''}`}
                    onClick={() => selectItem(friend.accountId, V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P)}
                  >
                    <Avatar account={friend.accountId} size="40" />
                    <div className="item-info">
                      <Appellation account={friend.accountId} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 群聊列表 */}
            {currentTab === 'team' && (
              <div className="team-list">
                {teamList.map((team) => (
                  <div
                    key={team.teamId}
                    className={`list-item ${selectedId === team.teamId ? 'selected' : ''}`}
                    onClick={() => selectItem(team.teamId, V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM)}
                  >
                    <Avatar account={team.teamId} avatar={team.avatar} size="40" />
                    <div className="item-info">
                      <div className="team-name">{team.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomPopup>

      <MessageForwardModal
        forwardModalVisible={forwardModalVisible}
        forwardTo={forwardTo}
        forwardMsg={forwardMsg}
        forwardConversationType={forwardConversationType}
        forwardToTeamInfo={forwardToTeamInfo}
        onConfirm={handleForwardConfirm}
        onCancel={handleForwardCancel}
      />
    </>
  )
})

export default MessageForward
