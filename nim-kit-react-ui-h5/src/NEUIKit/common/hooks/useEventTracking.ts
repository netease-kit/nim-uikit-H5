import { useEffect } from 'react'
import { EventTracking } from '@xkit-yx/utils'
import { NIM_APP_KEY } from '@/config'
import { version as imVersion } from 'nim-web-sdk-ng/package.json'
import { version } from '../../../../package.json'

export interface UseEventTrackingProps {
  component: string
}

// 上报信息
export const useEventTracking = ({ component }: UseEventTrackingProps): void => {
  useEffect(() => {
    const eventTracking = new EventTracking({
      appKey: NIM_APP_KEY, // NIM 的 appkey
      version: version, // 版本
      component: component, // 组件名
      imVersion: imVersion, // NIM 版本
      platform: 'H5', // 平台, 固定 H5
      os: '', // 系统环境, 不重要, 暂时先空字符串
      framework: '', // 跨端平台. 本项目 h5 原生的, 所以固定传空字符串
      language: 'React', // 语言及开发框架, 固定写 React
      container: 'H5' // 容器环境, 固定写 H5
    })

    eventTracking.track('init', '')
  }, [component])
}
