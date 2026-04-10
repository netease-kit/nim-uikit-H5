import React, { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMLastMessage } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMConversationService'
import { EMOJI_ICON_MAP_CONFIG, emojiRegExp } from '@/NEUIKit/common/utils/emoji'
import './conversation-item-last-msg-content.less'

interface LastMsgContentProps {
  lastMessage: V2NIMLastMessage
}

interface ParsedItem {
  type: 'emoji' | 'text'
  value: string
  index: number
}

/**
 * 会话列表最后一条消息内容组件
 */
const LastMsgContent: React.FC<LastMsgContentProps> = observer(({ lastMessage }) => {
  const { t } = useTranslation()

  // 翻译消息类型
  const translateMsg = (key: string): string => {
    const textMap: Record<string, string> = {
      textMsgText: t('textMsgText'),
      customMsgText: t('customMsgText'),
      audioMsgText: t('audioMsgText'),
      videoMsgText: t('videoMsgText'),
      fileMsgText: t('fileMsgText'),
      callMsgText: t('callMsgText'),
      geoMsgText: t('geoMsgText'),
      imgMsgText: t('imgMsgText'),
      notiMsgText: t('notiMsgText'),
      robotMsgText: t('robotMsgText'),
      tipMsgText: t('tipMsgText'),
      unknowMsgText: t('unknowMsgText')
    }

    return `[${textMap[key] || ''}]`
  }

  // 解析文本和表情
  const parseTextWithEmoji = (text: string): ParsedItem[] => {
    if (!text) return []

    const matches: ParsedItem[] = []
    let match
    const regexEmoji = emojiRegExp
    
    // 重置正则表达式的lastIndex
    regexEmoji.lastIndex = 0
    
    // 使用一个临时变量记录已处理的位置
    let lastIndex = 0
    
    // 找出所有表情符号，并记录它们之间的文本
    while ((match = regexEmoji.exec(text)) !== null) {
      // 如果表情前面有文本，记录下来
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index)
        if (textBefore) {
          matches.push({
            type: 'text',
            value: textBefore,
            index: lastIndex
          })
        }
      }
      
      // 记录表情
      matches.push({
        type: 'emoji',
        value: match[0],
        index: match.index
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // 如果最后还有剩余文本，记录下来
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex)
      if (remainingText) {
        matches.push({
          type: 'text',
          value: remainingText,
          index: lastIndex
        })
      }
    }

    // 按索引排序
    return matches.sort((a, b) => a.index - b.index)
  }

  // 解析文本内容
  const textArr = useMemo(() => {
    return parseTextWithEmoji(lastMessage.text as string)
  }, [lastMessage.text])

  // 根据消息状态和类型显示不同内容
  if (lastMessage.lastMessageState === V2NIMConst.V2NIMLastMessageState.V2NIM_MESSAGE_STATUS_REVOKE) {
    return <div>{t('recall')}</div>
  }

  if (lastMessage.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_NOTIFICATION) {
    return <div>{t('conversationNotificationText')}</div>
  }

  if (lastMessage.sendingState === V2NIMConst.V2NIMMessageSendingState.V2NIM_MESSAGE_SENDING_STATE_FAILED) {
    return <div>{t('conversationSendFailText')}</div>
  }

  switch (lastMessage.messageType) {
    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE:
      return <div>{translateMsg('fileMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE:
      return <div>{translateMsg('imgMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM:
      return <div>{lastMessage.text || translateMsg('customMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO:
      return <div>{translateMsg('audioMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL:
      return <div>{translateMsg('callMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_LOCATION:
      return <div>{translateMsg('geoMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_ROBOT:
      return <div>{translateMsg('robotMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TIPS:
      return <div>{translateMsg('tipMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO:
      return <div>{translateMsg('videoMsgText')}</div>

    case V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT:
      return (
        <div className="msg-conversation-text-wrap">
          {textArr.map((item, index) =>
            item.type === 'text' ? (
              <span key={index} className="msg-conversation-text">
                {item.value}
              </span>
            ) : (
              <span key={index} className="msg-conversation-text-emoji">
                <Icon type={EMOJI_ICON_MAP_CONFIG[item.value]} size={16} />
              </span>
            )
          )}
        </div>
      )

    default:
      return <div>{translateMsg('unknowMsgText')}</div>
  }
})

export default LastMsgContent
