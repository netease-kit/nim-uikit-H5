import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { createPortal } from 'react-dom'
import './index.less'

export interface LoadingRef {
  /**
   * 显示加载提示
   * @param text 提示文本
   */
  show: (text?: string) => void
  /**
   * 隐藏加载提示
   */
  hide: () => void
}

export interface LoadingProps {
  /**
   * 加载提示文本
   */
  text?: string
}

/**
 * 加载提示组件
 */
const Loading = forwardRef<LoadingRef, LoadingProps>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState(props.text || '')

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    show: (loadingText = '') => {
      setText(loadingText)
      setVisible(true)
    },
    hide: () => {
      setVisible(false)
      setText('')
    }
  }))

  if (!visible) {
    return null
  }

  // 使用Portal渲染到body
  return createPortal(
    <div className="nim-loading-mask">
      <div className="nim-loading-spinner">
        <svg className="nim-loading-circular" viewBox="25 25 50 50">
          <circle className="nim-loading-path" cx="50" cy="50" r="20" fill="none" />
        </svg>
        {text && <p className="nim-loading-text">{text}</p>}
      </div>
    </div>,
    document.body
  )
})

Loading.displayName = 'Loading'

export default Loading
