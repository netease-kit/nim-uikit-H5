import React from 'react'
import ReactDOM from 'react-dom/client'
import LoadingComponent, { LoadingRef } from '../components/Loading'

// 存储加载实例的容器
let loadingContainer: HTMLDivElement | null = null
let loadingRoot: ReactDOM.Root | null = null
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

  // 创建React根并渲染组件
  loadingRoot = ReactDOM.createRoot(loadingContainer)
  loadingRoot.render(React.createElement(LoadingComponent, { ref: loadingRef }))

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
    if (loadingRoot) {
      loadingRoot.unmount()
    }

    if (loadingContainer && document.body.contains(loadingContainer)) {
      document.body.removeChild(loadingContainer)
    }

    loadingContainer = null
    loadingRoot = null
    loadingInstance = null
  }
}
