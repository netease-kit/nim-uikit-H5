<template>
  <div
    class="avatar"
    :style="{ width: avatarSize + 'px', height: avatarSize + 'px' }"
    @click="handleAvatarClick"
    @touchstart="startLongPress"
    @touchmove="cancelLongPress"
    @touchend="finishLongPress"
    @touchcancel="finishLongPress"
    @mousedown.left="startLongPress"
    @mouseup.left="finishLongPress"
    @mouseleave="finishLongPress"
  >
    <!-- 使用遮罩层避免android长按头像会出现保存图片的弹窗 -->
    <div class="img-mask"></div>
    <img
      loading="lazy"
      class="avatar-img"
      v-if="avatarUrl"
      :src="avatarUrl"
    />
    <div class="avatar-name-wrapper" :style="{ backgroundColor: color }">
      <div class="avatar-name-text" :style="{ fontSize: fontSize + 'px' }">
        {{ appellation }}
      </div>
    </div>
  </div>
</template>

<script>
import { getAvatarBackgroundColor } from "../utils";
import { autorun } from "../utils/store.js";
import { uiKitStore } from "../utils/init";
import { neUiKitRouterPath } from "../utils/uikitRouter";

export default {
  name: "UIKitAvatar",
  props: {
    account: {
      type: String,
      required: true,
    },
    teamId: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    size: {
      type: [String, Number],
      default: "",
    },
    gotoUserCard: {
      type: Boolean,
      default: false,
    },
    fontSize: {
      type: [String, Number],
      default: "",
    },
    isRedirect: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      user: null,
      isLongPress: false,
      uninstallUserInfoWatch: null,
      longPressTimer: null,
      resetLongPressTimer: null,
    };
  },
  computed: {
    avatarSize() {
      return this.size || 42;
    },
    appellation() {
      const value = uiKitStore.uiStore.getAppellation({
        account: this.account,
        teamId: this.teamId,
        ignoreAlias: false,
        nickFromMsg: "",
      });
      return value ? value.slice(-2) : "";
    },
    avatarUrl() {
      return this.avatar || (this.user && this.user.avatar);
    },
    color() {
      return getAvatarBackgroundColor(this.account);
    },
  },
  mounted() {
    this.uninstallUserInfoWatch = autorun(() => {
      uiKitStore.userStore.getUserActive(this.account).then((data) => {
        this.user = data;
      });
    });
  },
  beforeDestroy() {
    if (this.uninstallUserInfoWatch) {
      this.uninstallUserInfoWatch();
      this.uninstallUserInfoWatch = null;
    }
    this.clearLongPressTimers();
  },
  methods: {
    handleAvatarClick() {
      if (this.gotoUserCard && !this.isLongPress) {
        const navigate = this.isRedirect ? "replace" : "push";
        if (this.account === uiKitStore.userStore.myUserInfo.accountId) {
          this.$router[navigate](neUiKitRouterPath.myDetail);
        } else {
          this.$router[navigate]({
            path: neUiKitRouterPath.friendCard,
            query: {
              accountId: this.account,
            },
          });
        }
      }
    },
    startLongPress() {
      this.cancelLongPress();
      this.longPressTimer = setTimeout(() => {
        this.longPressTimer = null;
        this.isLongPress = true;
        this.$emit("onLongpress");
      }, 500);
    },
    cancelLongPress() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    },
    finishLongPress() {
      this.cancelLongPress();
      if (this.resetLongPressTimer) {
        clearTimeout(this.resetLongPressTimer);
      }
      this.resetLongPressTimer = setTimeout(() => {
        this.isLongPress = false;
        this.resetLongPressTimer = null;
      }, 200);
    },
    clearLongPressTimers() {
      this.cancelLongPress();
      if (this.resetLongPressTimer) {
        clearTimeout(this.resetLongPressTimer);
        this.resetLongPressTimer = null;
      }
    },
  },
};
</script>

<style scoped>
.avatar {
  overflow: hidden;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.img-mask {
  position: absolute;
  z-index: 10;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  opacity: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-name-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-name-text {
  color: #fff;
  size: 14px;
}
</style>
