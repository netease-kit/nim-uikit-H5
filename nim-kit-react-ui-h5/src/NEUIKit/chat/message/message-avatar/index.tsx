import React from 'react'
import Avatar from '@/NEUIKit/common/components/Avatar'

interface MessageAvatarProps {
  account: string
  teamId?: string
  avatar?: string
  size?: string
  gotoUserCard?: boolean
  fontSize?: string
}

/**
 * 消息头像组件
 */
const MessageAvatar: React.FC<MessageAvatarProps> = ({ account, teamId, avatar, size, gotoUserCard, fontSize }) => {
  return <Avatar account={account} teamId={teamId} avatar={avatar} size={size} gotoUserCard={gotoUserCard} fontSize={fontSize} />
}

export default MessageAvatar
