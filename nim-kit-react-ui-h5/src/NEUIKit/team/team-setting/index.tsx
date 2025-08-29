import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from 'react-router-dom'
import RootStore from '@xkit-yx/im-store-v2'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { modal } from '@/NEUIKit/common/utils/modal'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'

import NavBar from '@/NEUIKit/common/components/NavBar'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Icon from '@/NEUIKit/common/components/Icon'
import Switch from '@/NEUIKit/common/components/Switch'

import './index.less'

/**
 * 群设置组件
 */
const TeamSetting: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store, nim } = useStateContext()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const teamId = params.get('teamId') || ''
  // 是否启用云端会话
  const enableV2CloudConversation = (store as RootStore)?.sdkOptions?.enableV2CloudConversation
  const conversationId = nim.V2NIMConversationIdUtil.teamConversationId(teamId)
  const teamMembers = store.teamMemberStore.getTeamMember(teamId)
  const conversation = enableV2CloudConversation
    ? store.conversationStore?.conversations.get(conversationId)
    : store.localConversationStore?.conversations.get(conversationId)
  // 群信息
  const team = store.teamStore.teams.get(teamId)

  // 群消息免打扰模式
  const [teamMuteMode, setTeamMuteMode] = useState<V2NIMConst.V2NIMTeamMessageMuteMode>()

  // 是否是群主
  const isTeamOwner = useMemo(() => {
    const myUser = store.userStore.myUserInfo
    return (team ? team.ownerAccountId : '') === (myUser ? myUser.accountId : '')
  }, [team, store.userStore.myUserInfo])

  // 是否是管理员
  const isTeamManager = useMemo(() => {
    const myUser = store.userStore.myUserInfo
    return teamMembers
      .filter((item) => item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER)
      .some((member) => member.accountId === (myUser ? myUser.accountId : ''))
  }, [teamMembers, store.userStore.myUserInfo])

  // 是否可以添加成员
  const canAddMember = useMemo(() => {
    if (team?.inviteMode === V2NIMConst.V2NIMTeamInviteMode.V2NIM_TEAM_INVITE_MODE_ALL) {
      return true
    }
    return isTeamOwner || isTeamManager
  }, [team?.inviteMode, isTeamOwner, isTeamManager])

  // 点击群信息
  const handleInfoClick = useCallback(() => {
    navigate({
      pathname: neUiKitRouterPath.teamInfoEdit,
      search: `?teamId=${teamId}`
    })
  }, [teamId])

  // 跳转到群内昵称设置
  const goNickInTeam = useCallback(() => {
    navigate({
      pathname: neUiKitRouterPath.teamNick,
      search: `?teamId=${teamId}`
    })
  }, [teamId])

  // 添加群成员
  const addTeamMember = useCallback(() => {
    navigate({
      pathname: neUiKitRouterPath.teamAdd,
      search: `?teamId=${teamId}`
    })
  }, [teamId])

  // 跳转到群成员列表
  const gotoTeamMember = useCallback(() => {
    navigate({
      pathname: neUiKitRouterPath.teamMember,
      search: `?teamId=${teamId}`
    })
  }, [teamId])

  // 解散群确认
  const showDismissConfirm = useCallback(() => {
    modal.confirm({
      title: t('dismissTeamText'),
      content: t('dismissTeamConfirmText'),
      onConfirm: () => {
        store.teamStore
          .dismissTeamActive(teamId)
          .then(() => {
            toast.info(t('dismissTeamSuccessText'))
            navigate({
              pathname: neUiKitRouterPath.conversation
            })
          })
          .catch(() => {
            toast.info(t('dismissTeamFailedText'))
          })
      }
    })
  }, [teamId])

  // 退出群确认
  const showLeaveConfirm = useCallback(() => {
    modal.confirm({
      title: t('leaveTeamTitle'),
      content: t('leaveTeamConfirmText'),
      onConfirm: () => {
        store.teamStore
          .leaveTeamActive(teamId)
          .then(() => {
            toast.info(t('leaveTeamSuccessText'))
            navigate({
              pathname: neUiKitRouterPath.conversation
            })
          })
          .catch(() => {
            toast.info(t('leaveTeamFailedText'))
          })
      }
    })
  }, [teamId])

  // 修改置顶状态
  const changeStickTopInfo = useCallback(
    async (value: boolean) => {
      const conversationId = nim.V2NIMConversationIdUtil.teamConversationId(teamId)
      try {
        if (enableV2CloudConversation) {
          await store.conversationStore?.stickTopConversationActive(conversationId, value)
        } else {
          await store.localConversationStore?.stickTopConversationActive(conversationId, value)
        }
      } catch (error) {
        toast.info(value ? t('addStickTopFailText') : t('deleteStickTopFailText'))
      }
    },
    [teamId, enableV2CloudConversation]
  )

  // 修改群消息免打扰
  const changeTeamMute = useCallback(
    (value: boolean) => {
      store.teamStore
        .setTeamMessageMuteModeActive(
          teamId,
          V2NIMConst.V2NIMTeamType.V2NIM_TEAM_TYPE_ADVANCED,
          value ? V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_OFF : V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_ON
        )
        .then(() => {
          setTeamMuteMode(
            value ? V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_OFF : V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_ON
          )
        })
        .catch((error: any) => {
          switch (error?.code) {
            // 无权限
            case 109432:
              toast.info(t('noPermission'))
              break
            default:
              toast.info(value ? t('sessionMuteFailText') : t('sessionUnMuteFailText'))
              break
          }
        })
    },
    [teamId]
  )

  // 设置群禁言
  const setTeamChatBanned = useCallback(
    async (value: boolean) => {
      try {
        await store.teamStore.setTeamChatBannedActive({
          teamId,
          chatBannedMode: value
            ? V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_BANNED_NORMAL
            : V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN
        })
      } catch (error: any) {
        switch (error?.code) {
          // 无权限
          case 109432:
            toast.info(t('noPermission'))
            break
          default:
            toast.info(value ? t('muteAllTeamFailedText') : t('sessionUnMuteFailText'))
            break
        }
      }
    },
    [teamId]
  )

  // 初始化数据和自动更新
  useEffect(() => {
    // 查询当前群是否开启免打扰
    store.teamStore.getTeamMessageMuteModeActive(teamId, 1).then((res: V2NIMConst.V2NIMTeamMessageMuteMode) => {
      setTeamMuteMode(res)
    })
  }, [])

  return (
    <div className="team-set-container-wrapper">
      <NavBar title={t('setText')} />
      {team && (
        <div className="team-set-container">
          <div className="team-set-card">
            <div className="team-set-item">
              <div className="team-info-item" onClick={handleInfoClick}>
                <Avatar account={team.teamId} avatar={team.avatar} />
                <div className="team-info-title team-title">{team.name}</div>
                <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
              </div>
            </div>
            <div className="team-set-item">
              <div className="team-members-item">
                <div className="team-members-info-item" onClick={gotoTeamMember}>
                  <div className="team-members-info">
                    <div className="team-info-title">{t('teamMemberText')}</div>
                    <div className="team-info-subtitle">{team.memberCount}</div>
                  </div>
                  <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
                </div>
                <div className="member-list">
                  {canAddMember && (
                    <div className="member-add">
                      <div onClick={addTeamMember} style={{ display: 'flex' }}>
                        <Icon type="icon-tianjiaanniu" />
                      </div>
                    </div>
                  )}
                  {teamMembers.map((member) => (
                    <div className="member-item" key={member.accountId}>
                      <Avatar account={member.accountId} size="32" fontSize="10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="team-set-card">
            <div className="team-set-item team-set-item-flex">
              <div>{t('stickTopText')}</div>
              <Switch checked={!!conversation?.stickTop} onChange={changeStickTopInfo} />
            </div>
            <div className="team-set-item team-set-item-flex">
              <div>{t('sessionMuteText')}</div>
              <Switch checked={teamMuteMode !== V2NIMConst.V2NIMTeamMessageMuteMode.V2NIM_TEAM_MESSAGE_MUTE_MODE_ON} onChange={changeTeamMute} />
            </div>
            <div className="team-set-item team-set-item-flex" onClick={goNickInTeam}>
              <div>{t('nickInTeam')}</div>
              <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
            </div>
          </div>
          {(isTeamOwner || isTeamManager) && (
            <div className="team-set-card">
              <div className="team-set-item team-set-item-flex">
                <div>{t('teamBannedText')}</div>
                <Switch checked={team.chatBannedMode !== V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN} onChange={setTeamChatBanned} />
              </div>
            </div>
          )}
          {isTeamOwner ? (
            <div className="team-set-button" onClick={showDismissConfirm}>
              {t('dismissTeamText')}
            </div>
          ) : (
            <div className="team-set-button" onClick={showLeaveConfirm}>
              {t('leaveTeamTitle')}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default TeamSetting
