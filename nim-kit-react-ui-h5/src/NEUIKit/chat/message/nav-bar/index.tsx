import React from 'react'
import { ReactNode } from 'react'
import Icon from '@/NEUIKit/common/components/Icon'
import './index.less'

/**
 * 导航栏组件属性接口
 */
export interface NavBarProps {
  /**
   * 导航栏标题
   */
  title: string

  /**
   * 导航栏副标题（可选）
   */
  subTitle?: string

  /**
   * 导航栏背景颜色（可选），默认为白色 #ffffff
   */
  backgroundColor?: string

  /**
   * 是否显示左侧区域（可选），默认为 true
   */
  showLeft?: boolean

  /**
   * 子元素（可选）
   */
  children?: ReactNode

  /**
   * 左侧自定义内容（可选），替换默认的返回按钮
   */
  leftContent?: ReactNode

  /**
   * 右侧自定义内容（可选）
   */
  rightContent?: ReactNode

  /**
   * 标题旁边的图标内容（可选）
   */
  iconContent?: ReactNode

  /**
   * 点击返回按钮的回调函数（可选）
   */
  onBack?: () => void
}

/**
 * 导航栏组件
 *
 * @example
 * ```tsx
 * // 基本用法
 * <NavBar
 *   title="聊天"
 *   onBack={() => console.log('返回')}
 * />
 *
 * // 带副标题
 * <NavBar
 *   title="聊天"
 *   subTitle="在线"
 *   onBack={() => console.log('返回')}
 * />
 *
 * // 自定义右侧内容
 * <NavBar
 *   title="聊天"
 *   rightContent={<Icon type="icon-more" size={22} />}
 *   onBack={() => console.log('返回')}
 * />
 * ```
 */
const NavBar: React.FC<NavBarProps> = ({
  title,
  subTitle = '',
  backgroundColor = '#ffffff',
  showLeft = true,
  leftContent,
  rightContent,
  iconContent,
  onBack = () => {}
}) => {
  return (
    <div
      className="msg-nav-bar-wrapper"
      style={{
        backgroundColor,
        height: '50px',
        alignItems: 'center'
      }}
    >
      {/* 左侧区域 */}
      {showLeft &&
        (leftContent ? (
          leftContent
        ) : (
          <div onClick={onBack}>
            <Icon type="icon-zuojiantou" size={22} />
          </div>
        ))}

      {/* 标题区域 */}
      <div className="title-container">
        <div className="title">{title}</div>
        {subTitle && <div className="subTitle">{subTitle}</div>}
        {iconContent}
      </div>

      {/* 右侧区域 */}
      <div>{rightContent}</div>
    </div>
  )
}

export default NavBar
