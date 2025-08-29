import React, { ReactNode } from 'react'
import { history } from 'umi'
import Icon from '../Icon'
import './index.less'

export interface NavBarProps {
  title?: string
  subTitle?: string
  backgroundColor?: string
  showLeft?: boolean
  leftContent?: ReactNode
  rightContent?: ReactNode
  iconContent?: ReactNode
  onBack?: () => void
}

const NavBar: React.FC<NavBarProps> = ({
  title = '',
  subTitle = '',
  backgroundColor = '#ffffff',
  showLeft = false,
  leftContent,
  rightContent,
  iconContent,
  onBack
}) => {
  // 处理返回事件
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      history.back()
    }
  }

  return (
    <div className="nav-bar-wrapper">
      <div
        className="nav-bar-container"
        style={{
          backgroundColor,
          height: '48px',
          alignItems: 'center'
        }}
      >
        {/* 左侧内容 */}
        {showLeft ? (
          leftContent
        ) : (
          <div className="nav-left" onClick={handleBack}>
            <Icon type="icon-zuojiantou" size={24} />
          </div>
        )}

        {/* 中间标题 */}
        <div className="title-container">
          <div className="title">{title}</div>
          {subTitle && <div className="subTitle">{subTitle}</div>}
          {iconContent}
        </div>

        {/* 右侧内容 */}
        <div className="nav-right">{rightContent}</div>
      </div>
      <div className="block"></div>
    </div>
  )
}

export default NavBar
