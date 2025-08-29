import React, { useState, useRef, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import Icon from '@/NEUIKit/common/components/Icon'
// import { events } from '@/NEUIKit/common/utils/constants'
// import emitter from '@/NEUIKit/common/utils/eventBus'
import type { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/types'
import type { V2NIMMessageAudioAttachment } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMMessageService'
import './index.less'

interface MessageAudioProps {
  msg: V2NIMMessageForUI
  mode?: 'audio-in' | 'audio-out'
  broadcastNewAudioSrc?: string
}

/**
 * 音频消息组件
 */
const MessageAudio: React.FC<MessageAudioProps> = observer(({ msg, mode, broadcastNewAudioSrc }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioIconType, setAudioIconType] = useState('icon-yuyin3')
  const [animationFlag, setAnimationFlag] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  // 获取音频源
  const audioSrc = useMemo(() => {
    //@ts-ignore
    return msg?.attachment?.url || ''
  }, [msg])

  // 格式化音频时长
  const formatDuration = (duration: number) => {
    return Math.round(duration / 1000) || 1
  }

  // 音频消息宽度
  const audioContainerWidth = useMemo(() => {
    //@ts-ignore
    const duration = formatDuration(msg.attachment?.duration)
    const maxWidth = 180
    return 50 + 8 * (duration - 1) > maxWidth ? maxWidth : 50 + 8 * (duration - 1)
  }, [msg])

  // 音频时长
  const duration = useMemo(() => {
    return formatDuration((msg.attachment as V2NIMMessageAudioAttachment)?.duration)
  }, [msg])

  // 切换播放状态
  const togglePlay = () => {
    if (!audioRef.current) return

    if (isAudioPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsAudioPlaying(false)
    } else {
      // 发送事件通知其他音频停止播放
      // emitter.emit(events.AUDIO_PLAY_CHANGE, msg.messageClientId)
      audioRef.current.play().catch((error) => {
        console.warn('播放音频失败:', error)
      })
    }
  }

  // 播放事件处理
  const onAudioPlay = () => {
    setIsAudioPlaying(true)
    playAudioAnimation()
  }

  const onAudioStop = () => {
    setAnimationFlag(false)
    setIsAudioPlaying(false)
  }

  const onAudioEnded = () => {
    setAnimationFlag(false)
    setIsAudioPlaying(false)
  }

  const onAudioError = () => {
    setAnimationFlag(false)
    console.warn('音频播放出错')
  }

  // 播放音频动画
  const playAudioAnimation = () => {
    try {
      setAnimationFlag(true)
      let audioIcons = ['icon-yuyin1', 'icon-yuyin2', 'icon-yuyin3']

      const handler = () => {
        const icon = audioIcons.shift()
        if (icon) {
          setAudioIconType(icon)

          if (!audioIcons.length && animationFlag) {
            audioIcons = ['icon-yuyin1', 'icon-yuyin2', 'icon-yuyin3']
          }

          if (audioIcons.length) {
            setTimeout(handler, 300)
          }
        }
      }

      handler()
    } catch (error) {
      console.log('动画播放出错:', error)
    }
  }

  // 监听其他音频的播放事件
  // useEffect(() => {
  //   const handleAudioPlayChange = (messageId: string) => {
  //     if (messageId !== msg.messageClientId && isAudioPlaying) {
  //       if (audioRef.current) {
  //         audioRef.current.pause()
  //         audioRef.current.currentTime = 0
  //         setIsAudioPlaying(false)
  //         setAnimationFlag(false)
  //       }
  //     }
  //   }

  //   // emitter.on(events.AUDIO_PLAY_CHANGE, handleAudioPlayChange)

  //   return () => {
  //     // 组件卸载时停止播放
  //     // emitter.off(events.AUDIO_PLAY_CHANGE, handleAudioPlayChange)
  //     if (audioRef.current) {
  //       audioRef.current.pause()
  //       audioRef.current.currentTime = 0
  //     }
  //   }
  // }, [isAudioPlaying, msg.messageClientId])

  const containerClass = !msg.isSelf || mode === 'audio-in' ? 'audio-in' : 'audio-out'

  return (
    <div className={containerClass} style={{ width: audioContainerWidth + 'px' }} onClick={togglePlay}>
      <div className="audio-dur">{duration}s</div>
      <div className="audio-icon-wrapper">
        <Icon size={24} type={audioIconType} />
      </div>
      <audio src={audioSrc} ref={audioRef} onPlay={onAudioPlay} onPause={onAudioStop} onEnded={onAudioEnded} onError={onAudioError} />
    </div>
  )
})

export default MessageAudio
