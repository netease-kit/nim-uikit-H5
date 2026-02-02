import React, { useState, useEffect, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useLocation } from '@/utils/router'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { debounce } from '@xkit-yx/utils'
import { toast } from '@/NEUIKit/common/utils/toast'

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
 * 添加群成员组件
 */
const TeamAdd: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store } = useStateContext()
  const navigate = useNavigate()
  const location = useLocation()

  // 好友列表
  const [friendList, setFriendList] = useState<PersonSelectItem[]>([])
  // 新添加的群成员
  const [newTeamMember, setNewTeamMember] = useState<string[]>([])
  // 群组ID
  const [teamId, setTeamId] = useState<string>('')

  // 初始化数据
  useEffect(() => {
    // 从URL查询参数获取群组ID
    const params = new URLSearchParams(location.search)
    const id = params.get('teamId') || ''
    setTeamId(id)

    // 获取好友列表
    const _friendList = store.uiStore.friends.filter((item) => !store?.relationStore.blacklist.includes(item.accountId)) || []

    // 获取当前群成员列表
    const res = store.teamMemberStore.getTeamMember(id) || []
    const _teamMembers = res.map((item) => item.accountId)

    // 过滤已经是群成员的好友
    const formattedFriendList = _friendList.map((item) => {
      if (_teamMembers.includes(item.accountId)) {
        return { accountId: item.accountId, disabled: true }
      } else {
        return { accountId: item.accountId }
      }
    })

    setFriendList(formattedFriendList)
  }, [store.uiStore.friends, store.relationStore.blacklist])

  // 处理选择变化
  const handleCheckboxChange = useCallback((selectList: string | string[]) => {
    if (Array.isArray(selectList)) {
      setNewTeamMember(selectList)
    }
  }, [])

  // 添加群成员
  const addTeamMember = useCallback(
    debounce(() => {
      // 群成员数量限制
      if (newTeamMember.length > 200) {
        toast.info(t('maxSelectedText'))
        return
      }

      if (newTeamMember.length === 0) {
        toast.info(t('friendSelect'))
        return
      }

      store?.teamMemberStore
        .addTeamMemberActive({ teamId, accounts: newTeamMember })
        .then(() => {
          // 添加成功，返回上一页
          navigate(-1)
        })
        .catch((err: any) => {
          // 处理错误
          switch (err?.code) {
            case 109306:
              toast.info(t('noPermission'))
              break
            default:
              toast.info(t('addTeamMemberFailText'))
              break
          }
        })
    }, 800),
    [newTeamMember, teamId]
  )

  return (
    <div className="team-add-wrapper">
      <NavBar
        title={t('friendSelectText')}
        rightContent={
          <div className="add-button" onClick={addTeamMember}>
            {t('okText')}
          </div>
        }
      />
      <div className="team-member-select">
        <PersonSelect personList={friendList} showBtn={false} onCheckboxChange={handleCheckboxChange} />
      </div>
    </div>
  )
})

export default TeamAdd
