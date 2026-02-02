
/**
 * React DOM 兼容性适配层
 * 
 * 本模块为项目提供统一的 ReactDOM 渲染接口。
 */

/** ========== react 16 的兼容代码开始 ========= */
// import React from 'react'
// import ReactDOM from 'react-dom'

// // 类型定义
// export interface CompatRenderer {
//   render: (element: React.ReactElement, container: HTMLElement) => void
//   unmount: (container: HTMLElement) => void
// }

// // React DOM 兼容性渲染器. 使用 React 16 的传统渲染方法
// export const reactDomCompat: CompatRenderer = {
//   /**
//    * 渲染 React 元素到指定容器
//    * @param element React 元素
//    * @param container DOM 容器
//    */
//   render: (element: React.ReactElement, container: HTMLElement) => {
//     ReactDOM.render(element, container)
//   },

//   /**
//    * 卸载指定容器中的 React 组件
//    * @param container DOM 容器
//    */
//   unmount: (container: HTMLElement) => {
//     ReactDOM.unmountComponentAtNode(container)
//   }
// }
/** ========== react 16 的兼容代码结束 ========= */



/** ========== react 18 的兼容代码开始 ========= */
import React from 'react'
import { createRoot } from 'react-dom/client'
// 类型定义
export interface CompatRenderer {
  render: (element: React.ReactElement, container: HTMLElement) => void
  unmount: (container: HTMLElement) => void
}

// 存储 root 对象的容器属性名
const ROOT_CONTAINER_SYMBOL = '__react_root__'

export const reactDomCompat: CompatRenderer = {
  render: (element: React.ReactElement, container: HTMLElement) => {
    let root = (container as any)[ROOT_CONTAINER_SYMBOL]
    if (!root) {
      root = createRoot(container)
      ;(container as any)[ROOT_CONTAINER_SYMBOL] = root
    }
    root.render(element)
  },
  
  unmount: (container: HTMLElement) => {
    const root = (container as any)[ROOT_CONTAINER_SYMBOL]
    if (root) {
      root.unmount()
      delete (container as any)[ROOT_CONTAINER_SYMBOL]
    }
  }
}
/** ========== react 18 的兼容代码结束 ========= */
