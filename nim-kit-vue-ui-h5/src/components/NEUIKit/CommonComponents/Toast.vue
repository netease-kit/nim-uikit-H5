<template>
  <transition name="fade">
    <div v-if="visible" class="toast-container">
      <div class="toast-content" :class="type">
        <span class="toast-text">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
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
    validator: (value: string) => {
      return ["info", "success", "warning", "error"].includes(value);
    },
  },
});

const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

const show = () => {
  visible.value = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    visible.value = false;
  }, props.duration);
};

onMounted(() => {
  show();
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* 必须高于全屏弹层（FullScreenModal 是 10000），否则在转发选择器等全屏弹层里
     弹出的提示会被盖住，表现为“操作了但没有任何提示”。react 侧 Toast 用的也是 10002 */
  z-index: 10002;
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

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
