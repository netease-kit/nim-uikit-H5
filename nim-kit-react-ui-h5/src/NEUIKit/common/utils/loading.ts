import React from 'react'
import LoadingComponent, { LoadingRef } from '../components/Loading'
// 使用兼容性适配层以支持 React 16/18 的渲染 API 差异
import { reactDomCompat } from '../../../utils/reactDomCompat'

// 存储加载实例的容器
let loadingContainer: HTMLDivElement | null = null
let loadingInstance: LoadingRef | null = null

/**
 * 创建Loading实例
 * @returns Loading实例
 */
const createLoading = (): LoadingRef => {
  // 创建DOM容器
  loadingContainer = document.createElement('div')
  document.body.appendChild(loadingContainer)

  // 创建引用对象
  const loadingRef = React.createRef<LoadingRef>()

  // 使用兼容性适配层渲染组件
  reactDomCompat.render(
    React.createElement(LoadingComponent, { ref: loadingRef }), 
    loadingContainer
  )

  // 返回实例（注意：这依赖于实例在渲染后立即可用）
  // 理想情况下，我们应该用Promise和requestAnimationFrame来确保这一点
  // 但为了保持与Vue版本的相似性，我们简化处理
  return {
    show: (text = '') => {
      loadingRef.current?.show(text)
    },
    hide: () => {
      loadingRef.current?.hide()
    }
  }
}

/**
 * Loading服务
 * 提供显示和隐藏全局Loading的方法
 */
export const loading = {
  /**
   * 显示加载中提示
   * @param text 提示文本
   */
  show(text = '') {
    if (!loadingInstance) {
      loadingInstance = createLoading()
    }
    loadingInstance.show(text)
  },

  /**
   * 隐藏加载中提示
   */
  hide() {
    loadingInstance?.hide()
  },

  /**
   * 销毁Loading实例
   */
  destroy() {
    if (loadingContainer) {
      // 使用兼容性适配层卸载组件
      reactDomCompat.unmount(loadingContainer)

      if (document.body.contains(loadingContainer)) {
        document.body.removeChild(loadingContainer)
      }
    }

    loadingContainer = null
    loadingInstance = null
  }
}
