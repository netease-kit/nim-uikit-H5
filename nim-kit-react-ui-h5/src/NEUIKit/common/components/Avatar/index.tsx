import React, { useState, useEffect, useRef } from 'react'
import { history } from 'umi'
import { useStateContext } from '../../hooks/useStateContext'
import { getAvatarBackgroundColor } from '../../utils'
import './index.less'

export interface AvatarProps {
  /**
   * 用户账号
   */
  account: string
  /**
   * 群组ID
   */
  teamId?: string
  /**
   * 头像URL
   */
  avatar?: string
  /**
   * 头像大小
   */
  size?: number | string
  /**
   * 是否点击跳转到用户名片
   */
  gotoUserCard?: boolean
  /**
   * 字体大小
   */
  fontSize?: number | string
  /**
   * 是否重定向
   */
  isRedirect?: boolean
  /**
   * 长按事件处理函数
   */
  onLongpress?: () => void
  /**
   * 点击事件处理函数
   */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 自定义样式
   */
  style?: React.CSSProperties
}

const Avatar: React.FC<AvatarProps> = ({
  account,
  teamId = '',
  avatar = '',
  size = 42,
  gotoUserCard = false,
  fontSize = '',
  isRedirect = false,
  onLongpress,
  onClick,
  className = '',
  style = {}
}) => {
  const { store, nim } = useStateContext()
  // 直接得到 user
  const user = store.userStore.users.get(account)
  const avatarUrl =
    avatar || user?.avatar
      ? // @ts-ignore
        nim.cloudStorage.getThumbUrl(avatar || user?.avatar, {
          width: 42,
          height: 42
        })
      : ''
  const [isLongPress, setIsLongPress] = useState<boolean>(false)

  const avatarSize = typeof size === 'number' ? size : parseInt(size) || 42
  const fontSizeValue = fontSize ? (typeof fontSize === 'number' ? fontSize : parseInt(fontSize)) : Math.floor(avatarSize / 3)

  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartTimeRef = useRef<number>(0)

  // 销毁组件时需要销毁定时器
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current)
      }
      if (touchStartTimeRef.current) {
        clearTimeout(touchStartTimeRef.current)
      }
    }
  }, [])

  // 获取用户称谓（昵称或账号的前两个字符）
  const getAppellation = () => {
    if (!store?.uiStore) return account.slice(0, 2)

    const appellation = store.uiStore.getAppellation({
      account,
      teamId,
      ignoreAlias: false,
      nickFromMsg: ''
    })

    return appellation ? appellation.slice(0, 2) : account.slice(0, 2)
  }

  // 获取头像背景颜色
  const color = getAvatarBackgroundColor(account)

  // 处理头像点击
  const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e)
      return
    }

    if (gotoUserCard && !isLongPress) {
      if (account === store.userStore.myUserInfo.accountId) {
        // 跳转到我的详情页
        history.push('/user/my-detail')
      } else {
        // 跳转到好友名片页
        history.push(`/friend/friend-card?accountId=${account}`)
      }
    }
  }

  // 处理触摸开始
  const handleTouchStart = () => {
    touchStartTimeRef.current = Date.now()
    touchTimeoutRef.current = setTimeout(() => {
      setIsLongPress(true)
      if (onLongpress) {
        onLongpress()
      }
    }, 500) // 长按阈值为500ms
  }

  // 处理触摸结束
  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current)
    }

    setTimeout(() => {
      setIsLongPress(false)
    }, 200)
  }

  return (
    <div
      className={`avatar ${className}`}
      style={{
        width: `${avatarSize}px`,
        height: `${avatarSize}px`,
        ...style
      }}
      onClick={handleAvatarClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 使用遮罩层避免android长按头像会出现保存图片的弹窗 */}
      <div className="img-mask"></div>

      {avatarUrl ? (
        <img className="avatar-img" src={avatarUrl} alt="avatar" />
      ) : (
        <div className="avatar-name-wrapper" style={{ backgroundColor: color }}>
          <div className="avatar-name-text" style={{ fontSize: `${fontSizeValue}px` }}>
            {getAppellation()}
          </div>
        </div>
      )}
    </div>
  )
}

export default Avatar
