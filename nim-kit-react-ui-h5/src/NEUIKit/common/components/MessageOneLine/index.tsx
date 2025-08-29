import React, { useMemo } from 'react'
import Icon from '../Icon'
import { EMOJI_ICON_MAP_CONFIG, emojiRegExp } from '@/NEUIKit/common/utils/emoji'
import './index.less'

export interface MessageOneLineProps {
  /**
   * 需要解析展示的文本
   */
  text?: string
}

interface TextItem {
  type: 'text' | 'emoji'
  value: string
  index: number
  key: string
}

/**
 * 解析文本和表情
 * @param text 文本内容
 * @returns 解析后的文本和表情数组
 */
const parseText = (text: string | undefined): TextItem[] => {
  if (!text) return []

  const regexEmoji = emojiRegExp
  const matches: TextItem[] = []
  let match
  let tempText = text

  // 先匹配表情
  while ((match = regexEmoji.exec(tempText)) !== null) {
    matches.push({
      type: 'emoji',
      value: match[0],
      index: match.index,
      key: `emoji-${match.index}`
    })

    // 替换已匹配的表情为空格，保持索引不变
    const fillText = ' '.repeat(match[0].length)
    tempText = tempText.substring(0, match.index) + fillText + tempText.substring(match.index + match[0].length)
  }

  // 用正则替换掉所有表情后处理剩余文本
  tempText = text.replace(regexEmoji, ' ')

  // 提取文本内容
  if (tempText) {
    const textParts = tempText.split(' ').filter((item) => item.trim())

    textParts.forEach((item) => {
      const index = tempText.indexOf(item)
      if (index !== -1) {
        matches.push({
          type: 'text',
          value: item,
          index,
          key: `text-${index}`
        })

        // 替换已处理的文本为空格，避免重复处理
        const fillText = ' '.repeat(item.length)
        tempText = tempText.substring(0, index) + fillText + tempText.substring(index + item.length)
      }
    })
  }

  // 按索引排序
  return matches.sort((a, b) => a.index - b.index)
}

/**
 * 单行消息组件，支持展示文本和表情混合内容
 */
const MessageOneLine: React.FC<MessageOneLineProps> = ({ text }) => {
  // 解析文本内容
  const textArr = useMemo(() => parseText(text), [text])

  return (
    <div className="nim-message-one-line">
      {textArr.map((item) => (
        <React.Fragment key={item.key}>
          {item.type === 'text' ? (
            <span className="nim-msg-text">{item.value}</span>
          ) : (
            <Icon
              type={EMOJI_ICON_MAP_CONFIG[item.value]}
              size={14}
              style={{
                margin: '3px',
                verticalAlign: 'bottom',
                display: 'inline-block'
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default MessageOneLine
