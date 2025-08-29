<template>
  <div>
    <div
      class="nav-bar-wrapper"
      :style="{
        backgroundColor: backgroundColor || '#ffffff',
        backgroundImage: `url(${title})`,
        height: '48px',
        alignItems: 'center',
      }"
    >
      <slot v-if="showLeft" name="left"></slot>
      <div v-else @click="back">
        <Icon type="icon-zuojiantou" :size="24"></Icon>
      </div>
      <div class="title-container">
        <div class="title">{{ title }}</div>
        <div class="subTitle" v-if="subTitle">{{ subTitle }}</div>
        <slot name="icon"></slot>
      </div>
      <div>
        <slot name="right"></slot>
      </div>
    </div>
    <div class="block"></div>
  </div>
</template>

<script lang="ts" setup>
import Icon from "./Icon.vue";

withDefaults(
  defineProps<{
    title?: string;
    subTitle?: string;
    backgroundColor?: string;
    showLeft?: boolean;
  }>(),
  {
    subTitle: "",
    backgroundColor: "",
  }
);

const back = () => {
  history.back();
};
</script>

<style scoped>
/* 导航栏容器 */
.nav-bar-wrapper {
  position: fixed;
  display: flex;
  justify-content: space-between;
  padding: 10px;
  z-index: 9999;
  color: #000;
  top: 0;
  left: 0;
  right: 0;
}

/* 标题容器 */
.title-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 230px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 主标题 */
.title {
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  white-space: nowrap;
  font-weight: 500;
}

/* 副标题 */
.subTitle {
  white-space: nowrap;
  font-weight: 500;
}

/* 占位块 */
.block {
  width: 100%;
  height: 45px;
}
</style>
