// 全局类型声明

// Less 模块声明
declare module '*.less' {
  const content: { [className: string]: string }
  export default content
}

// CSS 模块声明
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// 图片资源声明
declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}
