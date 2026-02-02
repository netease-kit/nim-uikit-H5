import React, { useState, useEffect } from 'react'
import { useNavigate } from '@/utils/router'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Empty from '@/NEUIKit/common/components/Empty'
import Avatar from '@/NEUIKit/common/components/Avatar'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { V2NIMTeam } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService'
import './index.less'

/**
 * 群组列表页面
 */
const TeamList: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()

  // 群组列表本地状态
  const [teamList, setTeamList] = useState<V2NIMTeam[]>([])

  // 从store获取群组列表数据
  useEffect(() => {
    setTeamList(store.uiStore.teamList || [])
  }, [store.uiStore.teamList])

  // 点击群组进入聊天
  const handleTeamClick = async (team: V2NIMTeam) => {
    // 选择会话
    await store.uiStore.selectConversation(store.nim.V2NIMConversationIdUtil.teamConversationId(team.teamId))

    // 跳转到聊天页面
    navigate(neUiKitRouterPath.chat)
  }

  return (
    <div className="team-list-container">
      <NavBar title={t('teamMenuText')} />

      <div className="team-list-content">
        {teamList.length === 0 ? (
          <Empty text={t('teamEmptyText')} />
        ) : (
          teamList.map((team) => (
            <div className="team-item" key={team.teamId} onClick={() => handleTeamClick(team)}>
              <Avatar account={team.teamId} avatar={team.avatar} />
              <span className="team-name">{team.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

export default TeamList
