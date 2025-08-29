import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'

import NetworkAlert from '@/NEUIKit/common/components/NetworkAlert'
import NavBar from '@/NEUIKit/chat/message/nav-bar'
import Icon from '@/NEUIKit/common/components/Icon'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Appellation from '@/NEUIKit/common/components/Appellation'
import Empty from '@/NEUIKit/common/components/Empty'

import './index.less'

/**
 * 消息已读未读详情页面
 */
const MessageReadInfo: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { store, nim } = useStateContext()

  const [readCount, setReadCount] = useState(0)
  const [unReadCount, setUnReadCount] = useState(0)
  const [readList, setReadList] = useState<string[]>([])
  const [unReadList, setUnReadList] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<'read' | 'unread'>('read')

  // 获取要编辑的字段key（从URL参数中）
  const query = new URLSearchParams(location.search)
  const messageClientId: string = query.get('messageClientId') || ''
  const conversationId: string = query.get('conversationId') || ''
  const teamId = nim.V2NIMConversationIdUtil.parseConversationTargetId(conversationId)
  const msg = store.msgStore.getMsg(conversationId, [messageClientId])?.[0]

  /**
   * 初始化数据
   */
  useEffect(() => {
    if (msg) {
      // 获取当前消息的已读未读详情
      store?.msgStore.getTeamMessageReceiptDetailsActive(msg).then((res) => {
        setReadCount(res?.readReceipt.readCount || 0)
        setUnReadCount(res?.readReceipt.unreadCount || 0)
        setReadList(res?.readAccountList || [])

        setUnReadList(res?.unreadAccountList || [])
      })
    }
  }, [msg])

  /**
   * 返回到会话页面
   */
  const backToConversation = () => {
    navigate(-1)
  }

  return (
    <div className="msg-page-wrapper">
      <div className="msg-nav">
        <NavBar
          title={t('msgReadPageTitleText')}
          showLeft={true}
          leftContent={
            <div onClick={backToConversation}>
              <Icon type="icon-zuojiantou" size={22} />
            </div>
          }
        />
      </div>

      <div className="msg-alert">
        <NetworkAlert />
      </div>

      <div className="msg-read-header">
        <div className={`msg-read-header-item ${selectedType === 'read' ? 'active' : ''}`} onClick={() => setSelectedType('read')}>
          {`${t('readText')}(${readCount})`}
        </div>
        <div className={`msg-read-header-item ${selectedType === 'unread' ? 'active' : ''}`} onClick={() => setSelectedType('unread')}>
          {`${t('unreadText')}(${unReadCount})`}
        </div>
      </div>

      {/* 已读列表 */}
      <div className="list-wrapper" style={{ display: selectedType === 'read' ? 'block' : 'none' }}>
        {readList.length > 0 ? (
          readList.map((item) => (
            <div className="list-item" key={item}>
              <div className="avatar-wrapper">
                <Avatar size={40} account={item} gotoUserCard={true} teamId={teamId} />
              </div>
              <Appellation account={item} teamId={teamId} />
            </div>
          ))
        ) : (
          <Empty text={t('allUnReadText')} />
        )}
      </div>

      {/* 未读列表 */}
      <div className="list-wrapper" style={{ display: selectedType === 'unread' ? 'block' : 'none' }}>
        {unReadList.length > 0 ? (
          unReadList.map((item) => (
            <div className="list-item" key={item}>
              <div className="avatar-wrapper">
                <Avatar size={40} account={item} gotoUserCard={true} teamId={teamId} />
              </div>
              <Appellation account={item} teamId={teamId} />
            </div>
          ))
        ) : (
          <Empty text={t('allReadText')} />
        )}
      </div>
    </div>
  )
}

export default MessageReadInfo
