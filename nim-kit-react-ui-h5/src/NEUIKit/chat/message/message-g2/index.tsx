import React, { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import Icon from '@/NEUIKit/common/components/Icon'
import { convertSecondsToTime } from '@/NEUIKit/common/utils'
import { g2StatusMap } from '@/NEUIKit/common/utils/constants'
import type { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import './index.less'

interface MessageG2Props {
  msg: V2NIMMessageForUI
}

/**
 * 音视频通话记录消息组件
 */
const MessageG2: React.FC<MessageG2Props> = observer(({ msg }) => {
  // 获取通话时长
  const duration = useMemo(() => {
    //@ts-ignore
    return convertSecondsToTime(msg.attachment?.durations[0]?.duration)
  }, [msg.attachment])

  // 获取通话状态
  const status = useMemo(() => {
    //@ts-ignore
    return g2StatusMap[msg.attachment?.status]
  }, [msg.attachment])

  // 根据通话类型决定图标
  const iconType = useMemo(() => {
    //@ts-ignore
    return msg.attachment?.type == 1 ? 'icon-yuyin8' : 'icon-shipin8'
  }, [msg.attachment])

  return (
    <div className="g2-message-wrapper">
      <Icon type={iconType} size={28} />
      <div className="g2-message-status">{status}</div>
      {duration && <div className="g2-message-duration">{duration}</div>}
    </div>
  )
})

export default MessageG2
