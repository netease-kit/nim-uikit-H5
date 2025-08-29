<template>
  <div v-if="visible" class="preview-image-container" @click="handleClose">
    <div class="preview-image-wrapper">
      <img :src="imageUrl" class="preview-image" @click.stop />
      <div class="close-button" @click="handleClose">×</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  onClose: {
    type: Function,
    default: undefined,
  },
});

const emit = defineEmits(["update:visible"]);

const handleClose = () => {
  if (props.onClose) {
    props.onClose();
  }
};
</script>

<style scoped>
.preview-image-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.preview-image-wrapper {
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.preview-image {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
}

.close-button {
  position: fixed;
  top: 20px;
  right: 0;
  width: 30px;
  height: 30px;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  z-index: 999;
}
</style>
