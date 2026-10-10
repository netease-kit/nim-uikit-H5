import Vue from "vue";
import Modal from "../CommonComponents/Modal.vue";

let container = null;
export const showModal = (options) => {
  if (!container) {
    container = document.createElement("div");
    document.body.appendChild(container);
  }

  const {
    title,
    content,
    confirmText = "确定",
    cancelText = "取消",
    onConfirm,
    onCancel,
  } = options;

  const vm = new Vue({
    render(h) {
      return h(Modal, {
        props: {
          title,
          content,
          confirmText,
          cancelText,
          visible: true,
        },
        on: {
          confirm: () => {
            destroy();
            if (onConfirm) {
              onConfirm();
            }
          },
          cancel: () => {
            destroy();
            if (onCancel) {
              onCancel();
            }
          },
        },
      });
    },
  });

  vm.$mount(container);
  const modalElement = vm.$el;

  const destroy = () => {
    try {
      vm.$destroy();
    } catch (error) {
      console.log(error);
    }
    if (modalElement && modalElement.parentNode) {
      modalElement.parentNode.removeChild(modalElement);
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  };
};

export const modal = {
  confirm: (options) => {
    const opt = typeof options === "string" ? { title: options } : options;
    return new Promise((resolve) => {
      showModal({
        ...opt,
        onConfirm: () => {
          if (opt.onConfirm) {
            opt.onConfirm();
          }
          resolve();
        },
        onCancel: () => {
          if (opt.onCancel) {
            opt.onCancel();
          }
          resolve(false);
        },
      });
    });
  },
};
