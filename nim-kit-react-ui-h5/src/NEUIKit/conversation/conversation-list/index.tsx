import React, { useState, useEffect, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from '@/utils/router'
import Icon from '@/NEUIKit/common/components/Icon'
import NetworkAlert from '@/NEUIKit/common/components/NetworkAlert'
import Empty from '@/NEUIKit/common/components/Empty'
import ConversationItem from './conversation-item'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import type { V2NIMConversationForUI, V2NIMLocalConversationForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import './index.less'
import { useEventTracking } from '@/NEUIKit/common/hooks/useEventTracking'

/**
 * 会话列表组件
 */
const ConversationList: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()
  const listWrapperRef = useRef<HTMLDivElement>(null)

  // 是否是云端会话
  const enableV2CloudConversation = store.sdkOptions?.enableV2CloudConversation

  // 状态
  const conversationList = enableV2CloudConversation
    ? store.uiStore.conversations.sort((a: V2NIMConversationForUI, b: V2NIMConversationForUI) => b.sortOrder - a.sortOrder)
    : store.uiStore.localConversations.sort((a: V2NIMLocalConversationForUI, b: V2NIMLocalConversationForUI) => b.sortOrder - a.sortOrder)
  const [addDropdownVisible, setAddDropdownVisible] = useState(false)
  const [currentMoveSessionId, setCurrentMoveSessionId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 初始化不选中任何会话
    setCurrentMoveSessionId('')
  }, [])

  // 初始化埋点
  useEventTracking({
    component: 'ContactUIKit'
  })

  // 处理滚动事件
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (!target) return

    // 判断是否滚动到底部
    const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 1

    if (isBottom && !loading) {
      setLoading(true)
      const limit = store.localOptions.conversationLimit || 100

      try {
        // 加载更多会话
        if (enableV2CloudConversation) {
          const offset = store.uiStore.conversations[store.uiStore.conversations.length - 1]?.sortOrder
          await store.conversationStore?.getConversationListActive(offset, limit)
        } else {
          const offset = store.uiStore.localConversations[store.uiStore.localConversations.length - 1]?.sortOrder as number
          await store.localConversationStore?.getConversationListActive(offset, limit)
        }
      } catch (error) {
        console.error('加载更多会话失败:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  // 会话左滑处理
  const handleSessionItemLeftSlide = useCallback((conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI | null) => {
    // 点击也会触发左滑事件，但此时 conversation 为 null
    if (conversation) {
      setCurrentMoveSessionId(conversation.conversationId)
    } else {
      setCurrentMoveSessionId('')
    }
  }, [])

  // 点击会话
  const handleSessionItemClick = useCallback(async (conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI) => {
    setCurrentMoveSessionId('')

    try {
      await store.uiStore.selectConversation(conversation.conversationId)
      navigate(neUiKitRouterPath.chat)
    } catch (error) {
      toast.info(t('selectSessionFailText'))
    }
  }, [])

  // 删除会话
  const handleSessionItemDeleteClick = useCallback(async (conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI) => {
    try {
      if (enableV2CloudConversation) {
        await store.conversationStore?.deleteConversationActive(conversation.conversationId)
      } else {
        await store.localConversationStore?.deleteConversationActive(conversation.conversationId)
      }
      setCurrentMoveSessionId('')
    } catch (error) {
      toast.info(t('deleteSessionFailText'))
    }
  }, [])

  // 置顶会话
  const handleSessionItemStickTopChange = useCallback(async (conversation: V2NIMConversationForUI | V2NIMLocalConversationForUI) => {
    try {
      if (conversation.stickTop) {
        if (enableV2CloudConversation) {
          await store.conversationStore?.stickTopConversationActive(conversation.conversationId, false)
        } else {
          await store.localConversationStore?.stickTopConversationActive(conversation.conversationId, false)
        }
      } else {
        if (enableV2CloudConversation) {
          await store.conversationStore?.stickTopConversationActive(conversation.conversationId, true)
        } else {
          await store.localConversationStore?.stickTopConversationActive(conversation.conversationId, true)
        }
      }
    } catch (error) {
      toast.info(conversation.stickTop ? t('deleteStickTopFailText') : t('addStickTopFailText'))
    }
  }, [])

  // 显示/隐藏下拉菜单
  const showAddDropdown = () => {
    setAddDropdownVisible(true)
  }

  const hideAddDropdown = () => {
    setAddDropdownVisible(false)
  }

  // 下拉菜单点击
  const onDropdownClick = (urlType: 'addFriend' | 'createGroup') => {
    setAddDropdownVisible(false)

    if (urlType === 'addFriend') {
      navigate(neUiKitRouterPath.addFriend)
    } else {
      navigate(neUiKitRouterPath.teamCreate)
    }
  }

  // 跳转至搜索页面
  const goToSearchPage = () => {
    navigate(neUiKitRouterPath.conversationSearch)
  }

  // 渲染搜索框
  const renderSearchBar = () => {
    return (
      <>
        <div className="security-tip">
          <div>{t('securityTipText')}</div>
        </div>
        <div className="conversation-search" onClick={goToSearchPage}>
          <div className="search-input-wrapper">
            <div className="search-icon-wrapper">
              <Icon iconClassName="search-icon" size={16} style={{ color: '#A6ADB6' }} type="icon-sousuo" />
            </div>
            <div className="search-input">{t('searchText')}</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="nim-conversation-wrapper">
      {addDropdownVisible && <div className="dropdown-mark" onTouchStart={hideAddDropdown}></div>}

      <div className="navigation-bar">
        <div className="logo-box">
          <img src="https://yx-web-nosdn.netease.im/common/bbcd9929e31bfee02663fc0bcdabe1c5/yx-logo.png" className="logo-img" alt="Logo" />
          <div>{t('appText')}</div>
        </div>

        <div className="button-box">
          <div className="button-icon-add" onClick={showAddDropdown}>
            <Icon type="icon-More" size={24} />
          </div>

          {addDropdownVisible && (
            <div className="dropdown-container">
              <div className="add-menu-list">
                <div className="add-menu-item" onClick={() => onDropdownClick('addFriend')}>
                  <Icon type="icon-tianjiahaoyou" style={{ marginRight: '5px' }} />
                  {t('addFriendText')}
                </div>
                <div className="add-menu-item" onClick={() => onDropdownClick('createGroup')}>
                  <Icon type="icon-chuangjianqunzu" style={{ marginRight: '5px' }} />
                  {t('createTeamText')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="block"></div>
      <NetworkAlert />

      {!conversationList || conversationList.length === 0 ? (
        <div>
          {renderSearchBar()}
          <Empty text={t('conversationEmptyText')} />
        </div>
      ) : (
        <div className="conversation-list-wrapper" ref={listWrapperRef} onScroll={handleScroll}>
          {renderSearchBar()}

          {conversationList.map((conversation) => (
            <ConversationItem
              key={conversation.conversationId}
              conversation={conversation}
              showMoreActions={currentMoveSessionId === conversation.conversationId}
              onClick={handleSessionItemClick}
              onDelete={handleSessionItemDeleteClick}
              onStickyToTop={handleSessionItemStickTopChange}
              onLeftSlide={handleSessionItemLeftSlide}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default ConversationList
