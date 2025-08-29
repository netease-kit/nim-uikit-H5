import React from 'react'
import NavBar from '@/NEUIKit/common/components/NavBar'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useNavigate } from 'react-router-dom'
import imPkg from 'nim-web-sdk-ng/package.json'
import './index.less'

// 由于无法直接导入SDK的package.json，这里使用一个假版本号
// 实际项目中应该动态获取或从环境变量中读取
const SDK_VERSION = imPkg.version
const UIKIT_VERSION = '10.0.0'
const YUNXIN_WEBSITE = 'https://yunxin.163.com/'

/**
 * 关于网易云信页面
 */
const AboutNetease: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // 处理返回按钮点击
  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="about-netease-wrapper">
      <NavBar title={t('commsEaseText')} onBack={handleBack} />

      {/* Logo区域 */}
      <div className="about-logo-box">
        <img src="https://yx-web-nosdn.netease.im/common/fcd2d5e8d2897d4b2d965e06509f47d2/about-logo.png" className="about-logo-img" alt="网易云信Logo" />
        <div>{t('appText')}</div>
      </div>

      {/* 信息列表 */}
      <div className="about-info-item-wrapper">
        {/* UIKit版本 */}
        <div className="about-item">
          <div>{t('uikitVersion')}</div>
          <div>{UIKIT_VERSION}</div>
        </div>

        {/* IM SDK版本 */}
        <div className="about-item">
          <div>{t('IMVersion')}</div>
          <div>{SDK_VERSION}</div>
        </div>

        {/* 产品信息链接 */}
        <a href={YUNXIN_WEBSITE} target="_blank" rel="noopener noreferrer" className="about-item">
          <div>{t('productInfoText')}</div>
          <Icon iconClassName="about-icon-arrow" type="icon-jiantou" />
        </a>
      </div>
    </div>
  )
}

export default AboutNetease
