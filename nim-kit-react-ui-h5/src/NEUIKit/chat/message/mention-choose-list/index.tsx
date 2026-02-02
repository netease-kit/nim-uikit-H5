import React, { useState, useEffect, useMemo } from 'react'
import { useStateContext } from '../../../common/hooks/useStateContext'
import { autorun } from 'mobx'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import { AT_ALL_ACCOUNT, ALLOW_AT } from '../../../common/utils/constants'
import { useTranslation } from '../../../common/hooks/useTranslate'
import Avatar from '../../../common/components/Avatar'
import Icon from '../../../common/components/Icon'
import Appellation from '../../../common/components/Appellation'
import type {
  V2NIMTeam,
  V2NIMTeamMember,
} from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService'

import './index.less'

interface MentionChooseListProps {
  teamId: string
  onClose?: () => void
  onMemberClick: (member: any) => void
}

/**
 * @ 成员选择列表组件
 */
const MentionChooseList: React.FC<MentionChooseListProps> = ({ 
  teamId,
  onClose,
  onMemberClick
}) => {
  const { t } = useTranslation()
  const { store } = useStateContext()
  
  const [team, setTeam] = useState<V2NIMTeam>()
  const [teamMembers, setTeamMembers] = useState<V2NIMTeamMember[]>([])
  const [teamExt, setTeamExt] = useState('')

  // 群成员排序 群主 > 管理员 > 成员
  const sortGroupMembers = (members: V2NIMTeamMember[], teamId: string) => {
    const owner = members.filter(
      (item) =>
        item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER
    )
    
    const manager = members
      .filter(
        (item) =>
          item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
      )
      .sort((a, b) => a.joinTime - b.joinTime)
      
    const other = members
      .filter(
        (item) =>
          ![
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER,
            V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER,
          ].includes(item.memberRole)
      )
      .sort((a, b) => a.joinTime - b.joinTime)
      
    const result = [...owner, ...manager, ...other].map((item) => {
      return {
        ...item,
        name: store?.uiStore.getAppellation({
          account: item.accountId,
          teamId,
        }),
      }
    })
    
    return result
  }

  // 群成员不包括当前登录用户
  const teamMembersWithoutSelf = useMemo(() => {
    return teamMembers.filter(
      (item) => item.accountId !== store?.userStore.myUserInfo.accountId
    )
  }, [teamMembers, store?.userStore.myUserInfo.accountId])

  // 是否是群主
  const isGroupOwner = useMemo(() => {
    const myUser = store?.userStore.myUserInfo
    return (
      (team ? team.ownerAccountId : "") === (myUser ? myUser.accountId : "")
    )
  }, [team, store?.userStore.myUserInfo])

  // 是否是群管理员
  const isGroupManager = useMemo(() => {
    const myUser = store?.userStore.myUserInfo
    return teamMembers
      .filter(
        (item) =>
          item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER
      )
      .some((member) => member.accountId === (myUser ? myUser.accountId : ""))
  }, [teamMembers, store?.userStore.myUserInfo])

  // 是否允许@ 所有人
  const allowAtAll = useMemo(() => {
    let ext: any = {}
    try {
      ext = JSON.parse(teamExt || '{}')
    } catch (error) {
      //
    }
    if (ext[ALLOW_AT] === 'manager') {
      return isGroupOwner || isGroupManager
    }
    return true
  }, [teamExt, isGroupOwner, isGroupManager])

  // 处理成员点击
  const handleItemClick = (member: V2NIMTeamMember) => {
    const _member =
      member.accountId === AT_ALL_ACCOUNT
        ? member
        : {
            accountId: member.accountId,
            appellation: store?.uiStore.getAppellation({
              account: member.accountId,
              teamId: (member as V2NIMTeamMember).teamId,
              ignoreAlias: true,
            }),
          }

    onMemberClick(_member)
  }

  useEffect(() => {
    // 使用 autorun 监听群成员变化
    const teamMemberWatch = autorun(() => {
      if (teamId) {
        const members = store?.teamMemberStore.getTeamMember(teamId) as V2NIMTeamMember[] || []
        setTeamMembers(sortGroupMembers(members, teamId))
        
        const _team = store?.teamStore.teams.get(teamId)
        if (_team) {
          setTeam(_team)
          setTeamExt(_team?.serverExtension || '')
        }
      }
    })

    // 组件卸载时清除监听
    return () => {
      teamMemberWatch()
    }
  }, [teamId, store?.teamMemberStore, store?.teamStore])

  return (
    <div className="mention-member-list-wrapper">
      <div className="member-list-content">
        {/* Vue中的隐藏元素，用于触发响应式更新，React中可以省略 */}
        
        {/* @所有人选项 */}
        {allowAtAll && (
          <div 
            className="member-item"
            onClick={() => handleItemClick({
              accountId: AT_ALL_ACCOUNT,
              appellation: t('teamAll'),
            } as any)}
          >
            <Icon size={36} type="icon-team2" />
            <span className="member-name">
              {t('teamAll')}
            </span>
          </div>
        )}
        
        {/* 群成员列表 */}
        {teamMembersWithoutSelf.map(member => (
          <div 
            className="member-item" 
            key={member.accountId}
            onClick={() => handleItemClick(member)}
          >
            <Avatar account={member.accountId} size={36} />
            <div className="member-name">
              <Appellation
                account={member.accountId}
                teamId={member.teamId}
              />
            </div>
            {member.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_OWNER && (
              <div className="owner">
                {t('teamOwner')}
              </div>
            )}
            {member.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER && (
              <div className="manager">
                {t('teamManager')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MentionChooseList