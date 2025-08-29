import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react'
import { useStateContext } from '../../hooks/useStateContext'
import './index.less'

export interface AppellationProps {
  /**
   * 用户账号
   */
  account: string
  /**
   * 群组ID
   */
  teamId?: string
  /**
   * 是否忽略备注名
   */
  ignoreAlias?: boolean
  /**
   * 消息中的昵称
   */
  nickFromMsg?: string
  /**
   * 文本颜色
   */
  color?: string
  /**
   * 字体大小
   */
  fontSize?: number
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 自定义样式
   */
  style?: React.CSSProperties
}

/**
 * 用户称谓组件
 * 根据不同场景显示用户的昵称、备注名等
 */
const Appellation: React.FC<AppellationProps> = observer(
  ({ account, teamId, ignoreAlias = false, nickFromMsg, color = '#000', fontSize = 16, className = '', style = {} }) => {
    const { store } = useStateContext()
    const [appellation, setAppellation] = useState<string>('')

    useEffect(() => {
      if (store?.uiStore) {
        // 获取用户称谓
        const name = store.uiStore.getAppellation({
          account,
          teamId,
          ignoreAlias,
          nickFromMsg
        })
        setAppellation(name)
      }
    }, [account, teamId, ignoreAlias, nickFromMsg, store?.uiStore])

    return (
      <span
        className={`nim-appellation ${className}`}
        style={{
          color,
          fontSize: `${fontSize}px`,
          ...style
        }}
      >
        {appellation}
      </span>
    )
  }
)

export default Appellation
