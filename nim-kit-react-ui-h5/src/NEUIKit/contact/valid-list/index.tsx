import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Empty from '@/NEUIKit/common/components/Empty'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Icon from '@/NEUIKit/common/components/Icon'
import Appellation from '@/NEUIKit/common/components/Appellation'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { V2NIMFriendAddApplicationForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import { V2NIMMessage } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMMessageService'
import './index.less'

/**
 * 验证消息列表页面
 */
const ValidList: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store } = useStateContext()

  // 操作状态
  const [applyFriendLoading, setApplyFriendLoading] = useState(false)
  // 验证消息列表
  const [validMsgList, setValidMsgList] = useState<V2NIMFriendAddApplicationForUI[]>([])

  // 从store中获取验证消息数据并处理
  useEffect(() => {
    const friendApplyMsgs = store.sysMsgStore.friendApplyMsgs || []

    // 加载用户信息
    friendApplyMsgs.forEach((item) => {
      store.userStore.getUserActive(item.applicantAccountId)
    })

    setValidMsgList(friendApplyMsgs)
  }, [store.sysMsgStore.friendApplyMsgs])

  // 判断是否是自己发起的申请
  const isMeApplicant = (data: V2NIMFriendAddApplicationForUI) => {
    return data.applicantAccountId === store.userStore.myUserInfo.accountId
  }

  // 拒绝好友申请
  const handleRejectApplyFriendClick = async (msg: V2NIMFriendAddApplicationForUI) => {
    setApplyFriendLoading(true)
    try {
      await store.friendStore.rejectAddApplicationActive(msg)
      toast.info(t('rejectedText'))
    } catch (error) {
      toast.info(t('rejectFailedText'))
    } finally {
      setApplyFriendLoading(false)
    }
  }

  // 接受好友申请
  const handleAcceptApplyFriendClick = async (msg: V2NIMFriendAddApplicationForUI) => {
    setApplyFriendLoading(true)
    try {
      // 接受申请
      try {
        await store.friendStore.acceptAddApplicationActive(msg)
        toast.info(t('acceptedText'))
      } catch (error) {
        toast.info(t('acceptFailedText'))
        return
      }

      // 发送通过好友申请的消息
      const textMsg = store.nim.V2NIMMessageCreator.createTextMessage(t('passFriendAskText')) as unknown as V2NIMMessage

      await store.msgStore.sendMessageActive({
        msg: textMsg,
        conversationId: store.nim.V2NIMConversationIdUtil.p2pConversationId(msg.operatorAccountId)
      })
    } catch (error) {
      console.log('HandleAcceptApplyFriendClick error', error)
    } finally {
      setApplyFriendLoading(false)
    }
  }

  // 渲染验证消息项
  const renderValidItem = (msg: V2NIMFriendAddApplicationForUI) => {
    // 申请已同意
    if (msg.status === V2NIMConst.V2NIMFriendAddApplicationStatus.V2NIM_FRIEND_ADD_APPLICATION_STATUS_AGREED) {
      return (
        <>
          <div className="valid-item-left">
            <Avatar account={msg.applicantAccountId} />
            <div className="valid-name-container">
              <div className="valid-name">
                <Appellation account={msg.applicantAccountId} />
              </div>
              <div className="valid-action">{t('applyFriendText')}</div>
            </div>
          </div>
          <div className="valid-state">
            <Icon type="icon-yidu" />
            <span className="valid-state-text">{t('acceptResultText')}</span>
          </div>
        </>
      )
    }
    // 申请已拒绝
    else if (msg.status === V2NIMConst.V2NIMFriendAddApplicationStatus.V2NIM_FRIEND_ADD_APPLICATION_STATUS_REJECTED) {
      // 我是申请人
      if (isMeApplicant(msg)) {
        return (
          <div className="valid-item-left">
            <Avatar account={msg.recipientAccountId} />
            <div className="valid-name-container">
              <div className="valid-name">
                <Appellation account={msg.recipientAccountId} />
              </div>
              <div className="valid-action">{t('beRejectResultText')}</div>
            </div>
          </div>
        )
      }
      // 我是接收人
      else {
        return (
          <>
            <div className="valid-item-left">
              <Avatar account={msg.applicantAccountId} />
              <div className="valid-name-container">
                <div className="valid-name">
                  <Appellation account={msg.applicantAccountId} />
                </div>
                <div className="valid-action">{t('applyFriendText')}</div>
              </div>
            </div>
            <div className="valid-state">
              <Icon type="icon-shandiao" />
              <span className="valid-state-text">{t('rejectResultText')}</span>
            </div>
          </>
        )
      }
    }
    // 申请已过期, 不过鉴于 web 无数据库, 也不会能存在过期的申请, 所以这里不做处理
    // else if (msg.status === V2NIMConst.V2NIMFriendAddApplicationStatus.V2NIM_FRIEND_ADD_APPLICATION_STATUS_EXPIRED) {

    // }
    // 申请未处理
    else if (msg.status === V2NIMConst.V2NIMFriendAddApplicationStatus.V2NIM_FRIEND_ADD_APPLICATION_STATUS_INIT) {
      // 我不是申请人（需要我处理的申请）
      if (!isMeApplicant(msg)) {
        return (
          <>
            <div className="valid-item-left">
              <Avatar account={msg.applicantAccountId} />
              <div className="valid-name-container">
                <div className="valid-name">
                  <Appellation account={msg.applicantAccountId} />
                </div>
                <div className="valid-action">{t('applyFriendText')}</div>
              </div>
            </div>
            <div className="valid-buttons">
              <div className="valid-button button-reject" onClick={() => handleRejectApplyFriendClick(msg)}>
                {t('rejectText')}
              </div>
              <div className="valid-button button-accept" onClick={() => handleAcceptApplyFriendClick(msg)}>
                {t('acceptText')}
              </div>
            </div>
          </>
        )
      }
    }

    // 默认情况，返回空
    return null
  }

  return (
    <div className="valid-list-container">
      <NavBar title={t('validMsgText')} />

      <div className="valid-list-content">
        {validMsgList.length === 0 ? (
          <Empty text={t('validEmptyText')} />
        ) : (
          validMsgList.map((msg) => (
            <div className="valid-item" key={msg.timestamp}>
              {renderValidItem(msg)}
            </div>
          ))
        )}
      </div>
    </div>
  )
})

export default ValidList
