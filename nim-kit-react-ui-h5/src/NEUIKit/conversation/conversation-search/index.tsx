import React, { useState, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Icon from '@/NEUIKit/common/components/Icon'
import Input from '@/NEUIKit/common/components/Input'
import Empty from '@/NEUIKit/common/components/Empty'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import SearchResultItem from './search-result-item'
import './index.less'

/**
 * 会话搜索组件
 */
const ConversationSearch: React.FC = observer(() => {
  const { t } = useTranslation()
  const { store } = useStateContext()

  // 状态
  const [inputFocus, setInputFocus] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [searchList, setSearchList] = useState<{ id: string; list: any[] }[]>([])

  // 监听好友和群列表
  useEffect(() => {
    const friends = store.uiStore.friends
      .filter((item) => !store.relationStore.blacklist.includes(item.accountId))
      .map((item) => {
        const user = store.userStore.users.get(item.accountId) || {
          accountId: '',
          name: '',
          createTime: Date.now()
        }

        return {
          ...item,
          ...user
        }
      })

    const teamList = store.uiStore.teamList || []

    setSearchList(
      [
        {
          id: 'friends',
          list: friends
        },
        {
          id: 'groups',
          list: teamList
        }
      ].filter((item) => item.list.length > 0)
    )
  }, [store.uiStore.friends, store.relationStore.blacklist, store.userStore.users, store.uiStore.teamList])

  // 搜索结果
  const searchResult = useMemo(() => {
    const result: { title?: string; renderKey: string; [key: string]: any }[] = []

    if (searchText) {
      const finalSections = searchList
        .map((item) => {
          if (item.id === 'friends') {
            return {
              ...item,
              list: item.list?.filter((friend: any) => {
                return friend.alias?.includes(searchText) || friend.name?.includes(searchText) || friend.accountId?.includes(searchText)
              })
            }
          }

          if (item.id === 'groups') {
            return {
              ...item,
              list: item.list?.filter((team: any) => {
                return (team.name || team.teamId).includes(searchText)
              })
            }
          }

          return { ...item }
        })
        .filter((item) => item.list?.length > 0)

      finalSections.forEach((item) => {
        if (item.id === 'friends') {
          result.push({
            title: 'friends',
            renderKey: 'friends'
          })

          item.list.forEach((friend: any) => {
            result.push({
              ...friend,
              renderKey: friend.accountId
            })
          })
        } else if (item.id === 'groups') {
          result.push({
            title: 'groups',
            renderKey: 'groups'
          })

          item.list.forEach((team: any) => {
            result.push({
              ...team,
              renderKey: team.teamId
            })
          })
        }
      })
    }

    return result
  }, [searchList, searchText])

  // 处理输入框事件
  const onInputBlur = () => {
    setInputFocus(false)
  }

  const onInputFocus = () => {
    setInputFocus(true)
  }

  const onInput = (value: string) => {
    setSearchText(value)
  }

  const clearInput = () => {
    setInputFocus(true)
    setSearchText('')
  }

  // 初始化聚焦输入框
  useEffect(() => {
    setInputFocus(true)
  }, [])

  return (
    <div className="nim-search-page-wrapper">
      <NavBar title={t('searchTitleText')} />

      <div className="search-wrapper">
        <div className="search-input-wrapper">
          <div className="search-icon-wrapper">
            <Icon iconClassName="search-icon" size={16} style={{ color: '#A6ADB6' }} type="icon-sousuo" />
          </div>

          <Input
            className="input"
            value={searchText}
            inputStyle={{ backgroundColor: '#F5F7FA' }}
            // focus={inputFocus}
            onChange={onInput}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            placeholder={t('searchText')}
          />

          {searchText && (
            <div className="clear-icon" onClick={clearInput}>
              <Icon type="icon-shandiao" size={16} />
            </div>
          )}
        </div>
      </div>

      {searchResult.length > 0 && (
        <div className="search-result-wrapper">
          <div className="search-result-list">
            {searchResult.map((item) =>
              item.title ? (
                <div key={item.renderKey} className="result-title">
                  {item.title === 'friends' ? t('friendText') : t('teamText')}
                </div>
              ) : (
                <SearchResultItem key={item.renderKey} item={item} />
              )
            )}
          </div>
        </div>
      )}

      {searchResult.length === 0 && searchText && <Empty text={t('searchResultNullText')} />}
    </div>
  )
})

export default ConversationSearch
