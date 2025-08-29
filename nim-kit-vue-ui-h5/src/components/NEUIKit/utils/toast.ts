import { createVNode, render } from 'vue';
import Toast from '../CommonComponents/Toast.vue';

let container: HTMLDivElement | null = null;

export interface ToastOptions {
  message: string;
  duration?: number;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const showToast = (options: ToastOptions | string) => {
  // 如果传入的是字符串，转换为对象格式
  const opt = typeof options === 'string' ? { message: options } : options;

  // 创建容器
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
  }

  // 创建 vnode
  const vnode = createVNode(Toast, {
    message: opt.message,
    duration: opt.duration,
    type: opt.type || 'info',
  });

  // 渲染组件
  render(vnode, container);

  // 清理函数
  const destroy = () => {
    if (container) {
      render(null, container);
      document.body.removeChild(container);
      container = null;
    }
  };

  // 设置自动销毁
  setTimeout(destroy, (opt.duration || 2000) + 300); // 加300ms确保动画完成
};

// 便捷方法
export const toast = {
  info: (message: string, duration?: number) => showToast({ message, type: 'info', duration }),
  success: (message: string, duration?: number) => showToast({ message, type: 'success', duration }),
  warning: (message: string, duration?: number) => showToast({ message, type: 'warning', duration }),
  error: (message: string, duration?: number) => showToast({ message, type: 'error', duration }),
};