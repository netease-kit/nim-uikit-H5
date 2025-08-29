import React, { useState, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'

import NavBar from '@/NEUIKit/common/components/NavBar'
import Avatar from '@/NEUIKit/common/components/Avatar'
import Icon from '@/NEUIKit/common/components/Icon'

import './team-info-edit.less'

/**
 * 群信息编辑组件
 */
const TeamInfoEdit: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store, nim } = useStateContext()
  const navigate = useNavigate()
  const location = useLocation()
  // 从 URL 查询参数获取群 ID
  const params = new URLSearchParams(location.search)
  const teamId = params.get('teamId') || ''
  const team = store.teamStore.teams.get(teamId)
  const avatar = team?.avatar

  // 点击头像
  const handleAvatarClick = useCallback(() => {
    navigate({
      pathname: neUiKitRouterPath.teamAvatarEdit,
      search: `?teamId=${teamId}`
    })
  }, [teamId])

  // 点击群名称
  const handleTitleClick = useCallback(() => {
    navigate({
      pathname: neUiKitRouterPath.teamIntroduceEdit,
      search: `?teamId=${teamId}&type=name`
    })
  }, [teamId])

  // 点击群介绍
  const handleIntroClick = useCallback(() => {
    navigate({
      pathname: neUiKitRouterPath.teamIntroduceEdit,
      search: `?teamId=${teamId}&type=intro`
    })
  }, [teamId])

  return (
    <div className="team-set-container-wrapper">
      <NavBar title={t('teamInfoText')} />
      {team && (
        <div className="team-set-container">
          <div className="team-set-card">
            <div className="team-set-item-flex" onClick={handleAvatarClick}>
              <div>{t('teamAvatar')}</div>
              <div className="team-set-item-flex">
                <Avatar account={team.teamId} avatar={avatar} />
                <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
              </div>
            </div>
            <div className="team-set-item-flex" onClick={handleTitleClick}>
              <div className="team-set-item-team-name">{t('teamTitle')}</div>
              <div className="team-set-item-right">
                <span className="team-set-item-name">{team.name}</span>
                <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
              </div>
            </div>
            <div className="team-set-item-flex" onClick={handleIntroClick}>
              <div className="team-set-item-team-intro">{t('teamIntro')}</div>
              <div className="team-set-item-right">
                <span className="team-set-item-name">{team.intro}</span>
                <Icon iconClassName="more-icon" style={{ color: '#999' }} type="icon-jiantou" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default TeamInfoEdit
