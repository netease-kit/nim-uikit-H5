<template>
  <div
    class="avatar"
    :style="{ width: avatarSize + 'px', height: avatarSize + 'px' }"
    @click="handleAvatarClick"
    @longpress="longpress"
    @touchend="touchend"
  >
    <!-- 使用遮罩层避免android长按头像会出现保存图片的弹窗 -->
    <div class="img-mask"></div>
    <image
      :lazy-load="true"
      class="avatar-img"
      v-if="avatarUrl"
      :src="avatarUrl"
      mode="aspectFill"
    />
    <div
      class="avatar-name-wrapper"
      :style="{ backgroundColor: color as string }"
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

<script lang="ts" setup>
import { autorun } from "mobx";
import { ref, computed, onUnmounted, getCurrentInstance } from "vue";
import { V2NIMUser } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService";
import Appellation from "../CommonComponents/Appellation.vue";
const props = withDefaults(
  defineProps<{
    account: string;
    teamId?: string;
    avatar?: string;
    size?: string;
    gotoUserCard?: boolean;
    fontSize?: string;
    isRedirect?: boolean;
  }>(),
  {
    teamId: "",
    avatar: "",
    size: "",
    gotoUserCard: false,
    fontSize: "",
    isRedirect: false,
  }
);

const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;

const $emit = defineEmits(["onLongpress"]);

const avatarSize = props.size || 42;
const user = ref<V2NIMUser>();
let isLongPress = false; // uniapp 长按事件也会触发点击事件，此时需要处理

const appellation = computed(() => {
  return store?.uiStore
    .getAppellation({
      account: props.account,
      teamId: props.teamId,
      ignoreAlias: false,
      nickFromMsg: "",
    })
    .slice(0, 2);
});

const uninstallUserInfoWatch = autorun(async () => {
  store?.userStore?.getUserActive(props.account).then((data) => {
    user.value = data;
  });
});

const avatarUrl = computed(() => {
  user.value = store?.userStore?.users?.get(props.account);
  return props.avatar || user.value?.avatar;
});

const key = `__yx_avatar_color_${props.account}__`;
let color = localStorage.getItem(key);
if (!color) {
  const colorMap: { [key: number]: string } = {
    0: "#60CFA7",
    1: "#53C3F3",
    2: "#537FF4",
    3: "#854FE2",
    4: "#BE65D9",
    5: "#E9749D",
    6: "#F9B751",
  };
  const _color = colorMap[Math.floor(Math.random() * 7)];
  localStorage.setItem(key, _color);
  color = _color;
}

const handleAvatarClick = () => {
  if (props.gotoUserCard && !isLongPress) {
    if (props.isRedirect) {
      if (props.account === store?.userStore?.myUserInfo.accountId) {
        // customRedirectTo({
        //   url: `/pages/user-card/my-detail/index`,
        // });
      } else {
        // customRedirectTo({
        //   url: `/pages/user-card/friend/index?account=${props.account}`,
        // });
      }
    } else {
      if (props.account === store?.userStore?.myUserInfo.accountId) {
        // customNavigateTo({
        //   url: `/pages/user-card/my-detail/index`,
        // });
      } else {
        // customNavigateTo({
        //   url: `/pages/user-card/friend/index?account=${props.account}`,
        // });
      }
    }
  }
};

const longpress = () => {
  isLongPress = true;
  $emit("onLongpress");
};

const touchend = () => {
  const timeOut = setTimeout(() => {
    isLongPress = false;
    clearTimeout(timeOut);
  }, 200);
};

onUnmounted(() => {
  uninstallUserInfoWatch();
});
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
