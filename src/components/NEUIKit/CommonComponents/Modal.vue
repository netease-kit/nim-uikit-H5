<template>
  <div class="modal" v-if="visible">
    <div class="mask" @click="handleMaskClick"></div>
    <div class="content">
      <div class="title">{{ title }}</div>
      <div class="slot-content"><slot></slot></div>
      <div class="buttons">
        <div class="button cancel" @click="handleCancelClick">
          {{ cancelText }}
        </div>
        <div class="button confirm" @click="handleConfirmClick">
          {{ confirmText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    title: string;
    confirmText: string;
    cancelText: string;
    visible: boolean;
  }>(),
  {}
);

const emit = defineEmits(["confirm", "cancel"]);

const handleMaskClick = () => {
  emit("cancel");
};

const handleConfirmClick = () => {
  emit("confirm");
};

const handleCancelClick = () => {
  emit("cancel");
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  z-index: 99999999999;
}

.mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  touch-action: none;
  z-index: 9999;
}

.content {
  width: 276px;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  z-index: 99999;
  color: #000;
}

.slot-content {
  padding: 16px 16px 0 16px;
}

.title {
  font-size: 16px;
  font-weight: 500;
  text-align: left;
  margin: 16px 0 0 16px;
}

.buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 52px;
  border-top: 1px solid #e1e6e8;
  position: relative;
  bottom: 0;
  margin-top: 16px;
}

.cancel {
  color: #666666;
  height: 52px;
  line-height: 52px;
  border-right: 1px solid #e1e6e8;
}

.confirm {
  color: #337eff;
}

.button {
  flex: 1;
  text-align: center;
  font-size: 16px;
}
</style>
