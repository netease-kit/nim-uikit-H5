import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from 'react-router-dom'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMTeam, V2NIMTeamMember } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { showModal } from '@/NEUIKit/common/utils/modal'
import { showToast } from '@/NEUIKit/common/utils/toast'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'

import NavBar from '@/NEUIKit/common/components/NavBar'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Appellation from '@/NEUIKit/common/components/Appellation'
import Icon from '@/NEUIKit/common/components/Icon'
import Empty from '@/NEUIKit/common/components/Empty'

import './index.less'

/**
 * 群成员组件
 */
const TeamMember: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store } = useStateContext()
  const navigate = useNavigate()
  const location = useLocation()
  // 从 URL 查询参数获取群 ID
  const params = new URLSearchParams(location.search)
  const teamId = params.get('teamId') || ''

  // 对群成员进行排序，群主在前，管理员在后，其他成员按加入时间排序
  const sortTeamMembers = (members: V2NIMTeamMember[]) => {
    const owner = members.filter((item) => item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER)
    const manager = members
      .filter((item) => item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER)
      .sort((a, b) => a.joinTime - b.joinTime)
    const other = members
      .filter(
        (item) =>
          ![V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER, V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER].includes(
            item.memberRole
          )
      )
      .sort((a, b) => a.joinTime - b.joinTime)
    return [...owner, ...manager, ...other]
  }

  // 群成员列表
  const teamMembers = useMemo(() => {
    const members = store.teamMemberStore.getTeamMember(teamId) as V2NIMTeamMember[]
    if (members) {
      return sortTeamMembers(members)
    } else {
      return []
    }
  }, [store.teamMemberStore.getTeamMember(teamId)])

  // 群信息
  const team = store.teamStore.teams.get(teamId)

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

  // 是否显示添加按钮
  const isShowAddBtn = useMemo(() => {
    if (team?.inviteMode === V2NIMConst.V2NIMTeamInviteMode.V2NIM_TEAM_INVITE_MODE_ALL) {
      return true
    }
    return isTeamOwner || isTeamManager
  }, [team?.inviteMode, isTeamOwner, isTeamManager])

  // 是否显示移除按钮
  const isShowRemoveBtn = useCallback(
    (target: V2NIMTeamMember) => {
      if (target.accountId === store?.userStore.myUserInfo.accountId) {
        return false
      }
      if (isTeamOwner) {
        return true
      }
      if (isTeamManager) {
        return (
          target.memberRole !== V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER &&
          target.memberRole !== V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
        )
      }
      return false
    },
    [isTeamOwner, isTeamManager]
  )

  // 跳转到添加成员页面
  const goAddMember = useCallback(() => {
    navigate({
      pathname: neUiKitRouterPath.teamAdd,
      search: `?teamId=${teamId}`
    })
  }, [teamId])

  // 移除群成员
  const removeTeamMember = useCallback(
    (account: string) => {
      showModal({
        title: t('confirmRemoveText'),
        content: t('removeMemberExplain'),
        confirmText: t('removeText'),
        onConfirm: () => {
          store?.teamMemberStore
            .removeTeamMemberActive({
              teamId,
              accounts: [account]
            })
            .then(() => {
              showToast({
                message: t('removeSuccessText'),
                type: 'info'
              })
            })
            .catch((error: any) => {
              switch (error?.code) {
                // 没权限
                case 109306:
                  showToast({
                    message: t('noPermission'),
                    type: 'info'
                  })
                  break
                default:
                  showToast({
                    message: t('removeFailText'),
                    type: 'info'
                  })
                  break
              }
            })
        }
      })
    },
    [teamId]
  )

  return (
    <div className="team-member-container">
      <NavBar title={t('teamMemberText')} />

      {isShowAddBtn && (
        <div className="add-item" onClick={goAddMember}>
          <span className="add-item-label">{t('addMemberText')}</span>
          <Icon style={{ color: '#999' }} type="icon-jiantou" />
        </div>
      )}

      {teamMembers.length > 0 ? (
        <div>
          {teamMembers.map((item) => (
            <div className="team-item" key={item.accountId}>
              <div className="team-member">
                <Avatar gotoUserCard={true} account={item.accountId} teamId={item.teamId} size="40" />
                <Appellation className="user-name" account={item.accountId} teamId={item.teamId} fontSize={14} />
                {item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER && <div className="user-tag">{t('teamOwner')}</div>}
                {item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER && <div className="user-tag">{t('manager')}</div>}
              </div>

              {isShowRemoveBtn(item) && (
                <div className="btn-remove" onClick={() => removeTeamMember(item.accountId)}>
                  {t('removeText')}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty text={t('noTeamMember')} />
      )}
    </div>
  )
})

export default TeamMember
