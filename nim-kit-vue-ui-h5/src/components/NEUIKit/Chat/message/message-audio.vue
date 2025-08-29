<template>
  <div
    :class="!msg.isSelf || mode === 'audio-in' ? 'audio-in' : 'audio-out'"
    :style="{ width: audioContainerWidth + 'px' }"
    @click="togglePlay"
  >
    <div class="audio-dur">{{ duration }}s</div>
    <div class="audio-icon-wrapper">
      <Icon :size="24" :key="audioIconType" :type="audioIconType" />
    </div>
    <audio
      :src="audioSrc"
      ref="audioRef"
      @play="onAudioPlay"
      @pause="onAudioStop"
      @ended="onAudioEnded"
      @error="onAudioError"
    ></audio>
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted, computed, onMounted } from "vue";
import Icon from "../../CommonComponents/Icon.vue";
import { events } from "../../utils/constants";
import emitter from "../../utils/eventBus";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/types";
import type { V2NIMMessageAudioAttachment } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMMessageService";

const props = withDefaults(
  defineProps<{
    msg: V2NIMMessageForUI;
    mode?: "audio-in" | "audio-out";
    broadcastNewAudioSrc?: string;
  }>(),
  {}
);

const audioRef = ref<HTMLAudioElement | null>(null);
const audioIconType = ref("icon-yuyin3");
const animationFlag = ref(false);
const isAudioPlaying = ref<boolean>(false);

// 获取音频源
const audioSrc = computed(() => {
  //@ts-ignore
  return props.msg?.attachment?.url || "";
});

// 格式化音频时长
const formatDuration = (duration: number) => {
  return Math.round(duration / 1000) || 1;
};

// 音频消息宽度
const audioContainerWidth = computed(() => {
  //@ts-ignore
  const duration = formatDuration(props.msg.attachment?.duration);
  const maxWidth = 180;
  return 50 + 8 * (duration - 1) > maxWidth
    ? maxWidth
    : 50 + 8 * (duration - 1);
});

// 音频时长
const duration = computed(() => {
  return formatDuration(
    (props.msg.attachment as V2NIMMessageAudioAttachment)?.duration
  );
});

// 切换播放状态
const togglePlay = () => {
  if (!audioRef.value) return;

  if (isAudioPlaying.value) {
    audioRef.value.pause();
    audioRef.value.currentTime = 0;
    isAudioPlaying.value = false;
  } else {
    // 发送事件通知其他音频停止播放
    emitter.emit(events.AUDIO_PLAY_CHANGE, props.msg.messageClientId);
    audioRef.value.play().catch((error) => {
      console.warn("播放音频失败:", error);
    });
  }
};

// 播放事件处理
function onAudioPlay() {
  isAudioPlaying.value = true;
  playAudioAnimation();
}

function onAudioStop() {
  animationFlag.value = false;
  isAudioPlaying.value = false;
}

function onAudioEnded() {
  animationFlag.value = false;
  isAudioPlaying.value = false;
}

function onAudioError() {
  animationFlag.value = false;
  console.warn("音频播放出错");
}

// 播放音频动画
const playAudioAnimation = () => {
  try {
    animationFlag.value = true;
    let audioIcons = ["icon-yuyin1", "icon-yuyin2", "icon-yuyin3"];
    const handler = () => {
      const icon = audioIcons.shift();
      if (icon) {
        audioIconType.value = icon;
        if (!audioIcons.length && animationFlag.value) {
          audioIcons = ["icon-yuyin1", "icon-yuyin2", "icon-yuyin3"];
        }
        if (audioIcons.length) {
          setTimeout(handler, 300);
        }
      }
    };
    handler();
  } catch (error) {
    console.log("动画播放出错:", error);
  }
};

// 组件卸载时停止播放
onUnmounted(() => {
  // 移除事件监听
  emitter.off(events.AUDIO_PLAY_CHANGE);
  if (audioRef.value) {
    audioRef.value.pause();
    audioRef.value.currentTime = 0;
  }
});

onMounted(() => {
  // 监听其他音频的播放事件
  emitter.on(events.AUDIO_PLAY_CHANGE, (messageId) => {
    if (messageId !== props.msg.messageClientId && isAudioPlaying.value) {
      if (audioRef.value) {
        audioRef.value.pause();
        audioRef.value.currentTime = 0;
        isAudioPlaying.value = false;
        animationFlag.value = false;
      }
    }
  });
});
</script>

<style scoped>
.audio-dur {
  height: 24px;
  line-height: 24px;
  color: #000;
}
.audio-in,
.audio-out {
  width: 50px;
  display: flex;
  cursor: pointer;
  justify-content: flex-end;
  align-items: center;
}

.audio-in {
  flex-direction: row-reverse;
}
.audio-icon-wrapper {
  /* transform: rotate(180deg); */
}
.audio-icon-wrapper {
  height: 24px;
  display: flex;
  align-items: center;
}
</style>
