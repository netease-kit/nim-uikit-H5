import React, { useMemo } from 'react'
import Icon from '@/NEUIKit/common/components/Icon'
import { parseText } from '@/NEUIKit/common/utils/parseText'
import { EMOJI_ICON_MAP_CONFIG } from '@/NEUIKit/common/utils/emoji'
import type { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/src/types'
import './index.less'

interface MessageTextProps {
  msg: V2NIMMessageForUI
  fontSize?: number
  disableAit?: boolean
}

/**
 * 文本消息组件
 * 支持文本、@、表情和链接混排显示
 *
 * 注意：fontSize 不要在参数里写默认值。若写成 fontSize = 16，
 * 下面就变成了 16 || 22，表情图标的 22 兜底永远不生效（表情和文字一样大）；
 * vue 侧 prop 没有默认值，兜底 22 是生效的。两端统一：文字默认 16px、表情默认 22px。
 */
const MessageText: React.FC<MessageTextProps> = ({ msg, fontSize, disableAit = false }) => {
  // 解析文本
  const textArr = useMemo(() => {
    return parseText(msg?.text || '', disableAit ? undefined : msg?.serverExtension)
  }, [disableAit, msg?.serverExtension, msg?.text])

  return (
    <div className="msg-text" style={{ fontSize: `${fontSize || 16}px` }}>
      {textArr.map((item, index) => {
        if (item.type === 'text') {
          // 普通文本
          return (
            <span key={item.key} className="msg-text">
              {item.value}
            </span>
          )
        } else if (item.type === 'Ait') {
          // @消息
          return (
            <span key={item.key} className="msg-text" style={{ color: '#1861df' }}>
              {` ${item.value} `}
            </span>
          )
        } else if (item.type === 'emoji') {
          // 表情
          return (
            <Icon
              key={item.key}
              type={EMOJI_ICON_MAP_CONFIG[item.value]}
              size={fontSize || 22}
              style={{
                margin: '0 2px 2px 2px',
                verticalAlign: 'bottom'
              }}
            />
          )
        } else if (item.type === 'link') {
          // 链接
          return (
            <a
              key={item.key}
              href={item.value}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1861df',
                fontSize: `${fontSize}px`
              }}
            >
              {item.value}
            </a>
          )
        }
        return null
      })}
    </div>
  )
}

export default MessageText
