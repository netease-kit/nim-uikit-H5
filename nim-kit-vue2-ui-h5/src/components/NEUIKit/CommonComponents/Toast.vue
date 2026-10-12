<template>
  <transition name="fade">
    <div v-if="visible" class="toast-container">
      <div class="toast-content" :class="type">
        <span class="toast-text">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: "ToastMessage",
  props: {
    message: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 2000,
    },
    type: {
      type: String,
      default: "info",
      validator(value) {
        return ["info", "success", "warning", "error"].includes(value);
      },
    },
  },
  data() {
    return {
      visible: false,
      timer: null,
    };
  },
  mounted() {
    this.show();
  },
  beforeDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  },
  methods: {
    show() {
      this.visible = true;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.visible = false;
      }, this.duration);
    },
  },
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  pointer-events: none;
}

.toast-content {
  padding: 10px 20px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 14px;
  text-align: center;
  max-width: 80vw;
  word-break: break-word;
}

.toast-text {
  line-height: 1.5;
}

/* 类型样式 */
.info {
  background-color: rgba(0, 0, 0, 0.75);
}

.success {
  background-color: rgba(82, 196, 26, 0.85);
}

.warning {
  background-color: rgba(250, 173, 20, 0.85);
}

.error {
  background-color: rgba(255, 77, 79, 0.85);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
