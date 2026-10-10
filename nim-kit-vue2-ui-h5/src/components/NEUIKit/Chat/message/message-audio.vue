<template>
  <div
    :class="!msg.isSelf || mode === 'audio-in' ? 'audio-in' : 'audio-out'"
    :style="{ width: audioContainerWidth + 'px' }"
    @click="togglePlay"
  >
    <div class="audio-dur">{{ duration }}s</div>
    <div
      class="audio-icon-wrapper"
      :class="!msg.isSelf || mode === 'audio-in' ? 'audio-icon-in' : ''"
    >
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

<script>
import Icon from "../../CommonComponents/Icon.vue";

export default {
  name: "MessageAudio",
  components: {
    Icon,
  },
  props: {
    msg: {
      type: Object,
      required: true,
    },
    mode: {
      type: String,
      default: "",
    },
    broadcastNewAudioSrc: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      audioIconType: "icon-yuyin3",
      animationFlag: false,
      isAudioPlaying: false,
      animationTimer: null,
    };
  },
  watch: {
    broadcastNewAudioSrc(newAudioSrc) {
      if (newAudioSrc && newAudioSrc !== this.audioSrc) {
        this.stopAudio();
      }
    },
  },
  computed: {
    audioSrc() {
      return this.msg?.attachment?.url || "";
    },
    audioContainerWidth() {
      const duration = this.formatDuration(this.msg.attachment?.duration);
      const maxWidth = 180;
      return 50 + 8 * (duration - 1) > maxWidth
        ? maxWidth
        : 50 + 8 * (duration - 1);
    },
    duration() {
      return this.formatDuration(this.msg.attachment?.duration);
    },
  },
  beforeDestroy() {
    this.stopAudio();
  },
  methods: {
    formatDuration(duration) {
      return Math.round(duration / 1000) || 1;
    },
    togglePlay() {
      if (!this.$refs.audioRef) {
        return;
      }

      if (this.isAudioPlaying) {
        this.stopAudio();
      } else {
        const playPromise = this.$refs.audioRef.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch((error) => {
            console.warn("播放音频失败:", error);
          });
        }
      }
    },
    onAudioPlay() {
      this.isAudioPlaying = true;
      this.$emit("audio-play", this.audioSrc);
      this.playAudioAnimation();
    },
    onAudioStop() {
      this.isAudioPlaying = false;
      this.stopAudioAnimation();
    },
    onAudioEnded() {
      this.isAudioPlaying = false;
      this.stopAudioAnimation();
    },
    onAudioError() {
      this.isAudioPlaying = false;
      this.stopAudioAnimation();
      console.warn("音频播放出错");
    },
    stopAudio() {
      const audio = this.$refs.audioRef;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      this.isAudioPlaying = false;
      this.stopAudioAnimation();
    },
    stopAudioAnimation() {
      this.animationFlag = false;
      this.audioIconType = "icon-yuyin3";
      if (this.animationTimer) {
        clearTimeout(this.animationTimer);
        this.animationTimer = null;
      }
    },
    playAudioAnimation() {
      try {
        this.stopAudioAnimation();
        this.animationFlag = true;
        let audioIcons = ["icon-yuyin1", "icon-yuyin2", "icon-yuyin3"];
        const handler = () => {
          if (!this.animationFlag) {
            return;
          }
          const icon = audioIcons.shift();
          if (icon) {
            this.audioIconType = icon;
            if (!audioIcons.length && this.animationFlag) {
              audioIcons = ["icon-yuyin1", "icon-yuyin2", "icon-yuyin3"];
            }
            if (audioIcons.length) {
              this.animationTimer = setTimeout(handler, 300);
            }
          }
        };
        handler();
      } catch (error) {
        console.log("动画播放出错:", error);
      }
    },
  },
};
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
  height: 24px;
  display: flex;
  align-items: center;
}

.audio-icon-in {
  transform: rotateY(180deg);
}
</style>
