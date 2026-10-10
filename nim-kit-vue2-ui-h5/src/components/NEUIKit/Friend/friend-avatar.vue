<template>
  <div
    class="avatar"
    :style="{ width: avatarSize + 'px', height: avatarSize + 'px' }"
    @touchstart="startLongPress"
    @touchmove="cancelLongPress"
    @touchend="finishLongPress"
    @touchcancel="finishLongPress"
    @mousedown.left="startLongPress"
    @mouseup.left="finishLongPress"
    @mouseleave="finishLongPress"
    @click="handleAvatarClick"
  >
    <!-- 使用遮罩层避免android长按头像会出现保存图片的弹窗 -->
    <div class="img-mask"></div>
    <img
      loading="lazy"
      class="avatar-img"
      v-if="avatarUrl"
      :src="avatarUrl"
    />
    <div
      v-else
      class="avatar-name-wrapper"
      :style="{ backgroundColor: color }"
    >
      <div class="avatar-name-text" :style="{ fontSize: fontSize + 'px' }">
        <Appellation
          :account="account"
          :team-id="teamId"
          :ignore-alias="false"
          color="#fff"
        ></Appellation>
      </div>
    </div>
  </div>
</template>

<script>
import { autorun } from "../utils/store.js";
import Appellation from "../CommonComponents/Appellation.vue";
import { nim, uiKitStore } from "../utils/init.js";
import { neUiKitRouterPath } from "../utils/uikitRouter";
const colorMap = {
  0: "#60CFA7",
  1: "#53C3F3",
  2: "#537FF4",
  3: "#854FE2",
  4: "#BE65D9",
  5: "#E9749D",
  6: "#F9B751",
};

export default {
  name: "FriendAvatar",
  components: {
    Appellation,
  },
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
      color: "",
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    avatarSize() {
      return this.size || 42;
    },
    avatarUrl() {
      const storeUser = this.store?.userStore?.users?.get(this.account);
      return this.avatar || storeUser?.avatar || this.user?.avatar;
    },
  },
  mounted() {
    const key = `__yx_avatar_color_${this.account}__`;
    this.color = localStorage.getItem(key);
    if (!this.color) {
      this.color = colorMap[Math.floor(Math.random() * 7)];
      localStorage.setItem(key, this.color);
    }

    this.uninstallUserInfoWatch = autorun(() => {
      this.store?.userStore?.getUserActive(this.account).then((data) => {
        this.user = data;
      });
    });
  },
  beforeDestroy() {
    if (this.uninstallUserInfoWatch) {
      this.uninstallUserInfoWatch();
    }
    this.clearLongPressTimers();
  },
  methods: {
    handleAvatarClick() {
      if (!this.gotoUserCard || this.isLongPress) {
        return;
      }
      const navigate = this.isRedirect ? "replace" : "push";
      if (this.account === uiKitStore.userStore.myUserInfo.accountId) {
        this.$router[navigate](neUiKitRouterPath.myDetail);
      } else {
        this.$router[navigate]({
          path: neUiKitRouterPath.friendCard,
          query: { accountId: this.account },
        });
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

<style scoped lang="scss">
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
