import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'

import NavBar from '@/NEUIKit/common/components/NavBar'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Icon from '@/NEUIKit/common/components/Icon'
import Switch from '@/NEUIKit/common/components/Switch'

import './index.less'

/**
 * P2P设置组件Props接口
 */
export interface P2pSettingProps {
  /**
   * 聊天对象账号
   */
  accountId?: string
}

/**
 * 会话对象接口
 */
export interface Conversation {
  /**
   * 会话ID
   */
  conversationId: string

  /**
   * 是否置顶
   */
  stickTop?: boolean

  /**
   * 会话类型
   */
  conversationType?: V2NIMConst.V2NIMConversationType

  /**
   * 消息已读回执时间
   */
  msgReceiptTime?: number
}

/**
 * 单聊设置组件
 *
 * 显示单聊设置界面，包括对方用户信息、消息免打扰设置和会话置顶设置等
 *
 * @example
 * ```tsx
 * // 通过路由使用组件（推荐方式）
 * router.push({
 *   path: '/p2p-setting',
 *   query: { accountId: 'user123' }
 * })
 *
 * // 直接使用组件
 * <P2pSetting accountId="user123" />
 * ```
 */
const P2pSetting: React.FC<P2pSettingProps> = observer(({ accountId: propAccountId }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { store, nim } = useStateContext()

  // 获取要编辑的字段key（从URL参数中）
  const query = new URLSearchParams(location.search)
  const accountIdFromQuery: string = query.get('accountId') || ''
  const account = propAccountId || accountIdFromQuery || ''
  const enableV2CloudConversation = store.sdkOptions?.enableV2CloudConversation
  const conversationId = nim.V2NIMConversationIdUtil.p2pConversationId(account)
  // 获得具体会话
  const conversation = enableV2CloudConversation
    ? store.conversationStore?.conversations.get(conversationId)
    : store.localConversationStore?.conversations.get(conversationId)
  // 获得是否静音, 是否置顶, 和昵称等信息
  const isMute = store.relationStore.mutes.includes(account)
  const isStickTop = conversation?.stickTop || false
  const myNick = store.uiStore.getAppellation({
    account: account
  })

  /**
   * 添加群成员 - 创建群聊
   */
  const addTeamMember = () => {
    const to = nim.V2NIMConversationIdUtil.parseConversationTargetId(conversationId)
    navigate(`${neUiKitRouterPath.teamCreate}?p2pConversationId=${to}`)
  }

  /**
   * 修改会话免打扰
   */
  const changeSessionMute = async (value: boolean) => {
    try {
      await store.relationStore.setP2PMessageMuteModeActive(
        account,
        !value ? V2NIMConst.V2NIMP2PMessageMuteMode.V2NIM_P2P_MESSAGE_MUTE_MODE_ON : V2NIMConst.V2NIMP2PMessageMuteMode.V2NIM_P2P_MESSAGE_MUTE_MODE_OFF
      )
    } catch (error) {
      toast.info(!value ? t('sessionMuteFailText') : t('sessionUnMuteFailText'))
    }
  }

  /**
   * 修改置顶
   */
  const changeStickTopInfo = async (value: boolean) => {
    const checked = value
    try {
      if (enableV2CloudConversation) {
        await store.conversationStore?.stickTopConversationActive(conversationId, checked)
      } else {
        await store.localConversationStore?.stickTopConversationActive(conversationId, checked)
      }
    } catch (error) {
      toast.info(checked ? t('addStickTopFailText') : t('deleteStickTopFailText'))
    }
  }

  // 处理返回按钮点击
  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="p2p-set-container-wrapper">
      <NavBar title={t('setText')} onBack={handleBack} />
      <div className="p2p-set-container">
        {/* 用户信息卡片 */}
        <div className="p2p-set-card">
          <div className="p2p-set-item">
            <div className="p2p-set-my-info">
              <Avatar account={account} />
              <div className="p2p-set-my-nick">{myNick}</div>
            </div>
            <div className="member-add" onClick={addTeamMember}>
              <Icon type="icon-tianjiaanniu" />
            </div>
          </div>
        </div>

        {/* 设置选项卡片 */}
        <div className="p2p-set-card">
          {/* 消息免打扰开关 */}
          <div className="p2p-set-item p2p-set-item-flex-sb">
            <div>{t('sessionMuteText')}</div>
            <Switch checked={!isMute} onChange={changeSessionMute} />
          </div>

          {/* 会话置顶开关 */}
          <div className="p2p-set-item p2p-set-item-flex-sb">
            <div>{t('stickTopText')}</div>
            <Switch checked={isStickTop} onChange={changeStickTopInfo} />
          </div>
        </div>
      </div>
    </div>
  )
})

export default P2pSetting
