import { useEffect } from 'react'
import React from 'react'
import { EventTracking } from '@xkit-yx/utils'
import { NIM_APP_KEY } from '@/config'
import impkg from 'nim-web-sdk-ng/package.json'
import pkg from '../../../../package.json'

export interface UseEventTrackingProps {
  component: string
}

/**
 * 检测当前 React 版本
 * @returns React16 | React17 | React18 | React
 */
const getReactVersion = (): string => {
  const reactVersion = React.version
  if (!reactVersion) {
    return 'React'
  }

  const majorVersion = parseInt(reactVersion.split('.')[0], 10)
  
  if (majorVersion === 16) {
    return 'React16'
  } else if (majorVersion === 17) {
    return 'React17'
  } else if (majorVersion === 18) {
    return 'React18'
  } else if (majorVersion >= 19) {
    return `React${majorVersion}`
  }
  
  return 'React'
}

// 上报信息
export const useEventTracking = ({ component }: UseEventTrackingProps): void => {
  // 使用 useRef 确保即使在 StrictMode 下也只执行一次
  const hasTrackedRef = React.useRef(false)

  useEffect(() => {
    // 如果已经上报过，直接返回
    if (hasTrackedRef.current) {
      return
    }
    

    // 标记已上报
    hasTrackedRef.current = true

    const eventTracking = new EventTracking({
      appKey: NIM_APP_KEY, // NIM 的 appkey
      version: pkg.version, // 版本
      component: component, // 组件名
      imVersion: impkg.version, // NIM 版本
      platform: 'H5', // 平台, 固定 H5
      os: '', // 系统环境, 不重要, 暂时先空字符串
      framework: '', // 跨端平台. 本项目 h5 原生的, 所以固定传空字符串
      language: getReactVersion(), // 语言及开发框架, 动态检测 React 版本
      container: 'H5' // 容器环境, 固定写 H5
    })

    eventTracking.track('init', '')
  }, [component])
}
