import React from 'react'
import { useNavigate, useLocation } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import UserCard from '@/NEUIKit/common/components/UserCard'
import Switch from '@/NEUIKit/common/components/Switch'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { toast } from '@/NEUIKit/common/utils/toast'
import { modal } from '@/NEUIKit/common/utils/modal'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import './index.less'

/**
 * 好友名片组件
 */
const FriendCard: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { store } = useStateContext()

  // 从URL参数中获取账号ID
  const query = new URLSearchParams(location.search)
  const account = query.get('accountId') || ''

  // 状态
  const userInfo = store.uiStore.getFriendWithUserNameCard(account)
  const { relation, isInBlacklist } = store.uiStore.getRelation(account)
  const alias = store.friendStore.friends.get(account)?.alias || ''

  // 处理备注点击
  const handleAliasClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`${neUiKitRouterPath.friendInfoEdit}?accountId=${account}`)
  }

  // 处理黑名单开关状态变更
  const handleSwitchChange = async (checked: boolean) => {
    // setIsInBlacklist(checked)
    try {
      if (checked) {
        await store.relationStore.addUserToBlockListActive(account)
      } else {
        await store.relationStore.removeUserFromBlockListActive(account)
      }
    } catch (error) {
      toast.info(checked ? t('setBlackFailText') : t('removeBlackFailText'))
    }
  }

  // 删除好友
  const deleteFriend = () => {
    modal.confirm({
      title: t('deleteFriendText'),
      content: `${t('deleteFriendConfirmText')}"${store.uiStore.getAppellation({
        account
      })}"?`,
      async onConfirm() {
        try {
          await store.friendStore.deleteFriendActive(account)
          toast.info(t('deleteFriendSuccessText'))
        } catch (error) {
          toast.info(t('deleteFriendFailText'))
        }
      }
    }).catch(() => {
      // 用户点击取消，不需要任何操作
    })
  }

  // 添加好友
  const addFriend = async () => {
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

  // 跳转到聊天页面
  const gotoChat = async () => {
    const conversationId = store.nim.V2NIMConversationIdUtil.p2pConversationId(userInfo?.accountId || '')
    await store.uiStore.selectConversation(conversationId)
    navigate(neUiKitRouterPath.chat)
  }

  return (
    <div className="nim-friend-card">
      <NavBar title={t('FriendPageText')} />

      <UserCard account={userInfo?.accountId} nick={userInfo?.name} />

      {relation === 'stranger' ? (
        <>
          <div className="userInfo-item-wrapper">
            <div className="userInfo-item">
              <div className="item-left">{t('addBlacklist')}</div>
              <Switch checked={isInBlacklist} onChange={handleSwitchChange} />
            </div>
          </div>

          <div className="button" style={{ marginTop: '10px' }} onClick={addFriend}>
            {t('addFriendText')}
          </div>
        </>
      ) : (
        <>
          <div className="userInfo-item-wrapper">
            <div className="userInfo-item" onClick={handleAliasClick}>
              <div className="item-left">{t('remarkText')}</div>
              <div className="item-right">
                <span className="item-right-alias">{alias}</span>
                <span className="item-right">
                  <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
                </span>
              </div>
            </div>

            <div className="userInfo-item">
              <div className="item-left">{t('genderText')}</div>
              <div className="item-right">{userInfo && userInfo.gender === 0 ? t('unknow') : userInfo && userInfo.gender === 1 ? t('man') : t('woman')}</div>
            </div>

            <div className="box-shadow"></div>

            <div className="userInfo-item">
              <div className="item-left">{t('birthText')}</div>
              <div className="item-right">{(userInfo && userInfo.birthday) || t('unknow')}</div>
            </div>

            <div className="box-shadow"></div>

            <div className="userInfo-item">
              <div className="item-left">{t('mobile')}</div>
              <div className="item-right">{(userInfo && userInfo.mobile) || t('unknow')}</div>
            </div>

            <div className="box-shadow"></div>

            <div className="userInfo-item">
              <div className="item-left">{t('email')}</div>
              <div className="item-right">{(userInfo && userInfo.email) || t('unknow')}</div>
            </div>

            <div className="userInfo-item">
              <div className="item-left">{t('sign')}</div>
              <div className="item-right">{(userInfo && userInfo.sign) || t('unknow')}</div>
            </div>
          </div>

          <div className="userInfo-item-wrapper">
            <div className="userInfo-item">
              <div className="item-left">{t('addBlacklist')}</div>
              <Switch checked={isInBlacklist} onChange={handleSwitchChange} />
            </div>
          </div>

          <div className="button" onClick={gotoChat}>
            {t('chatWithFriendText')}
          </div>

          <div className="box-shadow"></div>

          <div className="button button-red" onClick={deleteFriend}>
            {t('deleteFriendText')}
          </div>
        </>
      )}
    </div>
  )
})

export default FriendCard
