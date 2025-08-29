<template>
  <div class="g2-message-wrapper">
    <Icon :type="iconType" :size="28"></Icon>
    <div class="g2-message-status">{{ status }}</div>
    <div v-if="duration" class="g2-message-duration">{{ duration }}</div>
  </div>
</template>

<script lang="ts" setup>
import Icon from "../../CommonComponents/Icon.vue";
import { convertSecondsToTime } from "../../utils";
import { g2StatusMap } from "../../utils/constants";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/types";

const props = withDefaults(defineProps<{ msg: V2NIMMessageForUI }>(), {});

const duration = convertSecondsToTime(
  //@ts-ignore
  props.msg.attachment?.durations[0]?.duration
);
//@ts-ignore
const status = g2StatusMap[props.msg.attachment?.status];
const iconType =
  //@ts-ignore
  props.msg.attachment?.type == 1 ? "icon-yuyin8" : "icon-shipin8";
</script>

<style scoped>
/* 音视频消息容器 */
.g2-message-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 音视频消息状态 */
.g2-message-status {
  margin: 0 7px;
}

/* 音视频消息时长 */
.g2-message-duration {
  color: #666;
}
</style>
