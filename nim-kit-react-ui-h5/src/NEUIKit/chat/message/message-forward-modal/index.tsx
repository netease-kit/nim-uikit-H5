import React, { useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import Modal from '@/NEUIKit/common/components/Modal'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Input from '@/NEUIKit/common/components/Input'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import './index.less'

interface ForwardToTeamInfo {
  teamId: string
  name: string
  avatar: string
}

interface MessageForwardModalProps {
  forwardModalVisible: boolean
  forwardTo: string
  forwardMsg: V2NIMMessageForUI | undefined
  forwardConversationType: V2NIMConst.V2NIMConversationType
  forwardToTeamInfo?: ForwardToTeamInfo
  onConfirm: (comment: string) => void
  onCancel: () => void
}

/**
 * 消息转发模态框组件
 */
const MessageForwardModal: React.FC<MessageForwardModalProps> = observer(
  ({ forwardModalVisible, forwardTo, forwardMsg, forwardConversationType, forwardToTeamInfo, onConfirm, onCancel }) => {
    const { t } = useTranslation()
    const { store } = useStateContext()

    // 转发评论
    const [forwardComment, setForwardComment] = useState('')

    // 处理输入变化
    const handleForwardInputChange = (value: string) => {
      setForwardComment(value)
    }

    // 处理取消
    const handleCancel = () => {
      onCancel()
    }

    // 处理确认
    const handleConfirm = () => {
      onConfirm(forwardComment)
    }

    // 转发消息的接收方昵称
    const forwardToNick = useMemo(() => {
      return store.uiStore.getAppellation({
        account: forwardTo
      })
    }, [forwardTo])

    // 转发消息的发送方昵称
    const forwardFromNick = useMemo(() => {
      return store.uiStore.getAppellation({
        account: forwardMsg?.senderId as string
      })
    }, [forwardMsg?.senderId])

    return (
      <Modal
        title={t('sendToText')}
        visible={forwardModalVisible}
        confirmText={t('sendText')}
        cancelText={t('cancelText')}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      >
        <div className="message-forward-modal-wrapper">
          {forwardConversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM ? (
            <div className="avatar-wrapper">
              <Avatar account={forwardToTeamInfo?.teamId || ''} avatar={forwardToTeamInfo?.avatar} size="36" />
              <div className="name">{forwardToTeamInfo?.name || ''}</div>
            </div>
          ) : (
            <div className="avatar-wrapper">
              <Avatar account={forwardTo} size="36" />
              <div className="name">
                <span>{forwardToNick}</span>
              </div>
            </div>
          )}

          <div className="description">{`[${t('forwardText')}] ${forwardFromNick} ${t('sessionRecordText')}`}</div>

          <Input
            id="forward-input"
            className="forward-input"
            value={forwardComment}
            onChange={handleForwardInputChange}
            placeholder={t('forwardComment')}
            inputStyle={{ height: '22px' }}
          />
        </div>
      </Modal>
    )
  }
)

export default MessageForwardModal
