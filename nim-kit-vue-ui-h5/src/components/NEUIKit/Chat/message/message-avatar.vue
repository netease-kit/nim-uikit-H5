<template>
  <Avatar
    :account="account"
    :teamId="teamId"
    :size="size"
    :gotoUserCard="gotoUserCard"
  />
</template>

<script lang="ts" setup>
import { getCurrentInstance } from "vue";
import Avatar from "../../CommonComponents/Avatar.vue";

const props = defineProps<{
  account: string;
  teamId?: string;
  avatar?: string;
  size?: string;
  gotoUserCard?: boolean;
  fontSize?: string;
}>();

const { proxy } = getCurrentInstance()!; // 获取组件实例

const store = proxy?.$UIKitStore;
</script>

<style scoped></style>
