import React, { useEffect, useRef, useState } from 'react'
import './index.less'

export interface TooltipProps {
  /**
   * 内容
   */
  content?: React.ReactNode
  /**
   * 背景颜色
   * @default "#303133"
   */
  color?: string
  /**
   * 是否可见
   * @default false
   */
  visible?: boolean
  /**
   * 是否对齐
   * @default false
   */
  align?: boolean
  /**
   * 可见性变化回调
   */
  onVisibleChange?: (visible: boolean) => void
  /**
   * 子元素
   */
  children?: React.ReactNode
}

/**
 * 工具提示组件
 */
const Tooltip: React.FC<TooltipProps> = ({ content, color = '#303133', visible: propVisible = false, align = false, onVisibleChange, children }) => {
  // 状态
  const [isShow, setIsShow] = useState(propVisible)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top')

  // 引用
  const contentRef = useRef<HTMLDivElement>(null)
  const popperRef = useRef<HTMLDivElement>(null)
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartPositionRef = useRef<{ x: number; y: number } | null>(null)

  // 同步外部visible属性
  useEffect(() => {
    setIsShow(propVisible)
  }, [propVisible])

  // 通知外部isShow变化
  useEffect(() => {
    onVisibleChange?.(isShow)
  }, [isShow, onVisibleChange])

  // 添加全局点击监听
  useEffect(() => {
    const handleGlobalClick = () => {
      setIsShow(false)
    }

    window.addEventListener('click', handleGlobalClick)

    return () => {
      window.removeEventListener('click', handleGlobalClick)
    }
  }, [])

  // 计算tooltip位置
  const getPosition = () => {
    return new Promise<void>((resolve) => {
      const tooltipContent = contentRef.current
      const tooltipPopper = popperRef.current

      if (tooltipContent && tooltipPopper) {
        const contentRect = tooltipContent.getBoundingClientRect()
        const popperRect = tooltipPopper.getBoundingClientRect()
        const { top, width, height, left } = contentRect
        const windowWidth = window.innerWidth
        let newStyle: React.CSSProperties = {}

        // 判断是否显示在顶部还是底部
        if (top <= 300) {
          setPlacement('bottom')
        } else {
          setPlacement('top')
        }

        if (placement === 'top') {
          if (align) {
            // 计算左侧位置，确保不超出屏幕
            let leftPos = -100
            if (width < 90) {
              leftPos = -200
            }
            // 检查是否会超出屏幕左侧
            if (left + leftPos < 0) {
              leftPos = -left + 10 // 留10px边距
            }
            // 检查是否会超出屏幕右侧
            if (left + leftPos + popperRect.width > windowWidth) {
              leftPos = windowWidth - left - popperRect.width - 10
            }
            newStyle.left = `${leftPos}px`
          } else {
            let leftPos = 50
            // 检查是否会超出屏幕右侧
            if (left + leftPos + popperRect.width > windowWidth) {
              leftPos = windowWidth - left - popperRect.width - 10
            }
            newStyle.left = `${leftPos}px`
          }
          newStyle.bottom = `${height + 8}px`
        } else {
          if (align) {
            let leftPos = -100
            if (width < 100) {
              leftPos = -200
            }
            // 检查是否会超出屏幕左侧
            if (left + leftPos < 0) {
              leftPos = -left + 10
            }
            // 检查是否会超出屏幕右侧
            if (left + leftPos + popperRect.width > windowWidth) {
              leftPos = windowWidth - left - popperRect.width - 10
            }
            newStyle.left = `${leftPos}px`
          } else {
            let leftPos = 50
            // 检查是否会超出屏幕右侧
            if (left + leftPos + popperRect.width > windowWidth) {
              leftPos = windowWidth - left - popperRect.width - 10
            }
            newStyle.left = `${leftPos}px`
          }
          newStyle.top = `${height + 8}px`
        }

        setStyle(newStyle)
        resolve()
      }
    })
  }

  // 处理点击
  const handleClick = async () => {
    if (isShow) {
      return setIsShow(false)
    }
    await getPosition()
    setIsShow(true)
  }

  // 触摸处理函数
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPositionRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }

    touchTimerRef.current = setTimeout(() => {
      // 检查是否移动了太多
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const startPos = touchStartPositionRef.current

      if (startPos) {
        const moveDistance = Math.sqrt(Math.pow(currentX - startPos.x, 2) + Math.pow(currentY - startPos.y, 2))

        if (moveDistance < 10) {
          // 允许少量移动
          handleClick()
        }
      }
    }, 500) // 长按时间阈值：500ms
  }

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
    }
  }

  const handleTouchMove = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
    }
  }

  const close = (e: React.TouchEvent) => {
    e.stopPropagation()
    setIsShow(false)
  }

  // 阻止冒泡
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // 自定义样式
  const tooltipStyle = {
    '--theme-bg-color': color
  } as React.CSSProperties

  const popperStyle: React.CSSProperties = {
    ...style,
    visibility: isShow ? 'visible' : 'hidden',
    color: color === 'white' ? '' : '#fff',
    boxShadow: color === 'white' ? '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d' : '',
    backgroundColor: color
  }

  return (
    <div className="nim-tooltip" style={tooltipStyle}>
      <div ref={contentRef} className="nim-tooltip-content" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove}>
        {children}

        {isShow && <div className="nim-tooltip-mask" onTouchStart={close}></div>}

        <div ref={popperRef} className="nim-tooltip-popper" onClick={stopPropagation} style={popperStyle}>
          {content}
        </div>
      </div>
    </div>
  )
}

export default Tooltip
