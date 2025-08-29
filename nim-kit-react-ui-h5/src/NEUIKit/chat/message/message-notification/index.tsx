import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { ALLOW_AT } from '@/NEUIKit/common/utils/constants'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMTeam } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService'
import type { V2NIMMessageForUI, YxServerExt } from '@xkit-yx/im-store-v2/dist/types/types'
import type { V2NIMMessageNotificationAttachment } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMMessageService'
import './index.less'

interface MessageNotificationProps {
  msg: V2NIMMessageForUI
}

/**
 * 通知消息组件
 */
const MessageNotification: React.FC<MessageNotificationProps> = observer(({ msg }) => {
  const { t } = useTranslation()
  const { store } = useStateContext()

  const [notificationContent, setNotificationContent] = useState('')

  // 获取群组ID
  const teamId = msg.conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM ? msg.receiverId : ''

  // 计算通知内容
  useEffect(() => {
    const getNotificationContent = () => {
      const attachment = msg.attachment as V2NIMMessageNotificationAttachment

      switch (attachment?.type) {
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_UPDATE_TINFO: {
          const team = (attachment?.updatedTeamInfo || {}) as V2NIMTeam
          const content: string[] = []

          if (team.avatar !== undefined) {
            content.push(t('updateTeamAvatar'))
          }
          if (team.name !== undefined) {
            content.push(`${t('updateTeamName')}"${team.name}"`)
          }
          if (team.intro !== undefined) {
            content.push(t('updateTeamIntro'))
          }
          if (team.inviteMode !== undefined) {
            content.push(
              `${t('updateTeamInviteMode')}"${
                team.inviteMode === V2NIMConst.V2NIMTeamInviteMode.V2NIM_TEAM_INVITE_MODE_ALL ? t('teamAll') : t('teamOwnerAndManagerText')
              }"`
            )
          }
          if (team.updateInfoMode !== undefined) {
            content.push(
              `${t('updateTeamUpdateTeamMode')}"${
                team.updateInfoMode === V2NIMConst.V2NIMTeamUpdateInfoMode.V2NIM_TEAM_UPDATE_INFO_MODE_ALL ? t('teamAll') : t('teamOwnerAndManagerText')
              }"`
            )
          }
          if (team.chatBannedMode !== undefined) {
            content.push(
              `${t('updateTeamMute')}${
                team.chatBannedMode === V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN ? t('closeText') : t('openText')
              }`
            )
          }
          if (team.serverExtension) {
            let ext: YxServerExt = {}
            try {
              ext = JSON.parse(team.serverExtension)
            } catch (error) {
              // 解析失败，忽略
            }
            if (ext[ALLOW_AT] !== undefined) {
              content.push(`${t('updateAllowAt')}"${ext[ALLOW_AT] === 'manager' ? t('teamOwnerAndManagerText') : t('teamAll')}"`)
            }
          }

          return content.length
            ? `${store.uiStore.getAppellation({
                account: msg.senderId,
                teamId
              })} ${content.join('、')}`
            : ''
        }
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_APPLY_PASS:
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_INVITE_ACCEPT: {
          return `${store.uiStore.getAppellation({
            account: msg.senderId,
            teamId
          })} ${t('joinTeamText')}`
        }
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_INVITE: {
          const accounts: string[] = attachment?.targetIds || []

          // 获取用户信息
          accounts.forEach(async (item) => {
            await store.userStore.getUserActive(item)
          })

          const nicks = accounts
            .map((item) => {
              return store.uiStore.getAppellation({
                account: item,
                teamId
              })
            })
            .filter((item) => !!item)
            .join('、')

          return `${nicks} ${t('joinTeamText')}`
        }
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_KICK: {
          const accounts: string[] = attachment?.targetIds || []

          // 获取用户信息
          accounts.forEach(async (item) => {
            await store.userStore.getUserActive(item)
          })

          const nicks = accounts
            .map((item) => {
              return store.uiStore.getAppellation({
                account: item,
                teamId
              })
            })
            .filter((item) => !!item)
            .join('、')

          return `${nicks} ${t('beRemoveTeamText')}`
        }
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_ADD_MANAGER: {
          const accounts: string[] = attachment?.targetIds || []

          // 获取用户信息
          accounts.forEach(async (item) => {
            await store.userStore.getUserActive(item)
          })

          const nicks = accounts
            .map((item) => {
              return store.uiStore.getAppellation({
                account: item,
                teamId
              })
            })
            .filter((item) => !!item)
            .join('、')

          return `${nicks} ${t('beAddTeamManagersText')}`
        }
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_REMOVE_MANAGER: {
          const accounts: string[] = attachment?.targetIds || []

          // 获取用户信息
          accounts.forEach(async (item) => {
            await store.userStore.getUserActive(item)
          })

          const nicks = accounts
            .map((item) => {
              return store.uiStore.getAppellation({
                account: item,
                teamId
              })
            })
            .filter((item) => !!item)
            .join('、')

          return `${nicks} ${t('beRemoveTeamManagersText')}`
        }
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_LEAVE: {
          return `${store.uiStore.getAppellation({
            account: msg.senderId,
            teamId
          })} ${t('leaveTeamText')}`
        }
        case V2NIMConst.V2NIMMessageNotificationType.V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_OWNER_TRANSFER: {
          return `${store.uiStore.getAppellation({
            account: (attachment?.targetIds || [])[0],
            teamId
          })} ${t('newGroupOwnerText')}`
        }
        default:
          return ''
      }
    }

    setNotificationContent(getNotificationContent())
  }, [msg, teamId])

  // 如果没有通知内容，不渲染组件
  if (!notificationContent) {
    return null
  }

  return <div className="msg-noti">{notificationContent}</div>
})

export default MessageNotification
