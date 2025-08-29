import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { toast } from '@/NEUIKit/common/utils/toast'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'

import NavBar from '@/NEUIKit/common/components/NavBar'
import PersonSelect from '@/NEUIKit/common/components/PersonSelect'

import './index.less'

interface PersonSelectItem {
  accountId: string
  teamId?: string
  disabled?: boolean
  checked?: boolean
}

/**
 * 创建群组组件
 */
const TeamCreate: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store, nim } = useStateContext()
  const navigate = useNavigate()
  const location = useLocation()

  // 好友列表
  const [friendList, setFriendList] = useState<PersonSelectItem[]>([])
  // p2p 会话 ID
  const [p2pConversationId, setP2pConversationId] = useState('')
  // 防止重复创建标志
  const [flag, setFlag] = useState(false)

  // 选中的团队成员
  const teamMembers = useMemo(() => {
    return friendList.filter((item) => item.checked).map((item) => item.accountId)
  }, [friendList])

  // 初始化数据
  useEffect(() => {
    // 从 URL 查询参数获取 p2p 会话 ID
    const params = new URLSearchParams(location.search)
    const conversationId = params.get('p2pConversationId') || ''
    setP2pConversationId(conversationId)

    // 获取好友列表
    const list = store?.uiStore.friends.filter((item) => !store?.relationStore.blacklist.includes(item.accountId)) || []

    // 过滤掉当前会话的用户
    const formattedList = list.map((item) => ({ accountId: item.accountId })).filter((item) => item.accountId !== conversationId)

    setFriendList(formattedList)
  }, [])

  // 处理选择变化
  const checkboxChange = useCallback((selectList: string | string[]) => {
    if (Array.isArray(selectList)) {
      if (selectList.length >= 200) {
        toast.info(t('maxSelectedText'))
        return
      }

      setFriendList((prevList) =>
        prevList.map((item) => ({
          accountId: item.accountId,
          checked: selectList.includes(item.accountId)
        }))
      )
    }
  }, [])

  // 创建群名称
  const createTeamName = useCallback(
    (members: string[]) => {
      const memberNickArr: string[] = []

      members.forEach((item) => {
        const appellation = store?.uiStore.getAppellation({ account: item })
        if (appellation) {
          memberNickArr.push(appellation)
        }
      })

      const ownerName = store?.userStore.myUserInfo.name || store?.userStore.myUserInfo.accountId
      const teamName = (ownerName + '、' + memberNickArr.join('、')).slice(0, 30)

      return teamName
    },
    [store.userStore.myUserInfo]
  )

  // 创建群头像
  const createTeamAvatar = useCallback(() => {
    const teamAvatarArr = [
      'https://yx-web-nosdn.netease.im/common/2425b4cc058e5788867d63c322feb7ac/groupAvatar1.png',
      'https://yx-web-nosdn.netease.im/common/62c45692c9771ab388d43fea1c9d2758/groupAvatar2.png',
      'https://yx-web-nosdn.netease.im/common/d1ed3c21d3f87a41568d17197760e663/groupAvatar3.png',
      'https://yx-web-nosdn.netease.im/common/e677d8551deb96723af2b40b821c766a/groupAvatar4.png',
      'https://yx-web-nosdn.netease.im/common/fd6c75bb6abca9c810d1292e66d5d87e/groupAvatar5.png'
    ]

    const index = Math.floor(Math.random() * 5)
    return teamAvatarArr[index]
  }, [])

  // 创建群组
  const createTeam = useCallback(async () => {
    try {
      if (flag) return

      if (teamMembers.length === 0) {
        toast.info(t('friendSelect'))
        return
      }

      if (teamMembers.length > 200) {
        toast.info(t('maxSelectedText'))
        return
      }

      setFlag(true)

      const accounts = p2pConversationId ? [...teamMembers, p2pConversationId] : [...teamMembers]

      const team = await store?.teamStore.createTeamActive({
        accounts,
        avatar: createTeamAvatar(),
        name: createTeamName(teamMembers)
      })

      const teamId = team?.teamId

      if (teamId) {
        store?.uiStore.selectConversation(nim.V2NIMConversationIdUtil.teamConversationId(teamId))

        navigate(neUiKitRouterPath.chat)
      }

      toast.info(t('createTeamSuccessText'))
    } catch (error) {
      toast.info(t('createTeamFailedText'))
    } finally {
      setFlag(false)
    }
  }, [flag, teamMembers, p2pConversationId])

  return (
    <div className="create-team-container">
      <NavBar
        title={t('createTeamText')}
        rightContent={
          <div className="create-team-button" onClick={createTeam}>
            {t('okText')}
          </div>
        }
      />
      <div className="create-team-content">
        <PersonSelect personList={friendList} onCheckboxChange={checkboxChange} radio={false} showBtn={false} max={200} />
      </div>
    </div>
  )
})

export default TeamCreate
