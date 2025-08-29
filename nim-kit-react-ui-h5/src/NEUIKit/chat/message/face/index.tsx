import React, { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { emojiMap } from '@/NEUIKit/common/utils/emoji'
import { calculateMatrix } from '@/NEUIKit/common/utils/matrix'
import './index.less'

interface FaceProps {
  /** 表情点击事件回调 */
  onEmojiClick?: (emoji: { key: string; type: string }) => void
  /** 删除表情事件回调 */
  onEmojiDelete?: () => void
  /** 发送表情事件回调 */
  onEmojiSend?: () => void
}

/**
 * 表情选择组件
 */
const Face: React.FC<FaceProps> = observer(({ onEmojiClick, onEmojiDelete, onEmojiSend }) => {
  const { t } = useTranslation()

  // 七个表情一行
  const emojiColNum = 7

  // 表情列表
  const emojiArr = useMemo(() => Object.keys(emojiMap), [])

  // 计算表情矩阵
  const emojiMatrix = useMemo(() => calculateMatrix(emojiArr, emojiColNum), [emojiArr])

  // 处理表情点击
  const handleEmojiClick = (key: string) => {
    onEmojiClick?.({ key, type: emojiMap[key] })
  }

  // 处理删除表情
  const handleEmojiDelete = () => {
    onEmojiDelete?.()
  }

  // 处理发送表情
  const handleEmojiSend = () => {
    onEmojiSend?.()
  }

  return (
    <div className="nim-msg-face-wrapper">
      <div className="msg-face">
        {emojiMatrix.map((emojiRow, rowIndex) => (
          <div key={rowIndex} className="msg-face-row">
            {emojiRow.map((key) => (
              <div key={key} className="msg-face-item" onClick={() => handleEmojiClick(key)}>
                <Icon size={27} type={emojiMap[key]} />
              </div>
            ))}

            {/* 最后一行放置三个看不到的占位图标 */}
            {rowIndex + 1 === Math.ceil(emojiArr.length / emojiColNum) && (
              <>
                <Icon iconClassName="msg-face-delete" size={27} type="icon-tuigejian" />
                <Icon iconClassName="msg-face-delete" size={27} type="icon-tuigejian" />
                <Icon iconClassName="msg-face-delete" size={27} type="icon-tuigejian" />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="emoji-block"></div>

      <div className="msg-face-control">
        <div className="msg-delete-btn" onClick={handleEmojiDelete}>
          <Icon type="icon-tuigejian" size={25} style={{ color: '#000' }} />
        </div>
        <div className="msg-send-btn" onClick={handleEmojiSend}>
          {t('sendText')}
        </div>
      </div>
    </div>
  )
})

export default Face
