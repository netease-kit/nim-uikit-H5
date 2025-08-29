<template>
  <div class="user-info-wrapper">
    <div class="card-wrapper" @click="gotoMyDetail">
      <UserCard
        :account="myUserInfo && myUserInfo.accountId"
        :nick="myUserInfo && myUserInfo.name"
      ></UserCard>
      <Icon iconClassName="arrow" type="icon-jiantou"></Icon>
    </div>
    <div class="box-shadow"></div>
    <div class="userInfo-item-wrapper">
      <div class="userInfo-item" @click="gotoSetting">
        <div class="item-left">
          <Icon iconClassName="guanyu" type="icon-shezhi1"></Icon>
          {{ t("setText") }}
        </div>
        <Icon iconClassName="icon-arrow" type="icon-jiantou"></Icon>
      </div>
      <div class="shadow"></div>
      <div class="userInfo-item" @click="gotoAbout">
        <div class="item-left">
          <Icon iconClassName="guanyu" type="icon-guanyu"></Icon>
          {{ t("commsEaseText") }}
        </div>
        <Icon iconClassName="icon-arrow" type="icon-jiantou"></Icon>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UserCard from "../CommonComponents/UserCard.vue";
import { onUnmounted, ref } from "vue";
import Icon from "../CommonComponents/Icon.vue";
import { autorun } from "mobx";
import { t } from "../utils/i18n";
import type { V2NIMUser } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService";
import { onMounted, getCurrentInstance } from "vue";
import RootStore from "@xkit-yx/im-store-v2";
import { useRouter } from "vue-router";
import { neUiKitRouterPath } from "../utils/uikitRouter";

const router = useRouter();
const { proxy } = getCurrentInstance()!;

const store = proxy?.$UIKitStore as RootStore;
const myUserInfo = ref<V2NIMUser>();

const uninstallMyUserInfoWatch = autorun(() => {
  myUserInfo.value = store?.userStore.myUserInfo;
});

onMounted(() => {
  myUserInfo.value = store?.userStore.myUserInfo;
});

const gotoSetting = () => {
  router.push(neUiKitRouterPath.userSetting);
};
const gotoAbout = () => {
  router.push(neUiKitRouterPath.aboutNetease);
};

const gotoMyDetail = () => {
  router.push(neUiKitRouterPath.myDetail);
};

onUnmounted(() => {
  uninstallMyUserInfoWatch();
});
</script>

<style>
.user-info-wrapper {
  background-color: #fff;
  height: 100%;
}
/* 卡片容器 */
.card-wrapper {
  background-color: rgb(255, 253, 253);
  padding-top: var(--status-bar-height);
  padding-right: 10px;
  position: relative;
}

/* 卡片箭头图标 */
.card-wrapper .arrow {
  position: absolute;
  right: 10px;
  top: calc(50% - 8px);
}

/* 阴影分隔线 */
.box-shadow {
  height: 5px;
  background: none;
  box-shadow: 0 5px 0 rgb(245, 246, 247);
}

/* 头像容器 */
.avatar-wrapper {
  background-color: #fff;
  display: flex;
  height: 140px;
  align-items: center;
}

/* 昵称 */
.avatar-wrapper .nick {
  font-size: 20px;
}

/* 账号信息 */
.avatar-wrapper .account {
  font-size: 14px;
  display: flex;
  align-items: center;
  color: #a6adb6;
}

/* 复制图标 */
.avatar-wrapper .copy-icon {
  color: #a6adb6;
  font-family: iconfont;
  background-size: 100% 100%;
  width: 60px;
  height: 60px;
  font-size: 40px;
  padding-left: 15px;
  display: inline-block;
}

/* 用户信息项容器 */
.userInfo-item-wrapper {
  background-color: #fff;
  margin-top: 8px;
  color: #000;
}

/* 用户信息项 */
.userInfo-item {
  display: flex;
  height: 50px;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 20px;
}

/* 用户信息项左侧 */
.userInfo-item .item-left {
  font-size: 16px;
  display: flex;
  align-items: center;
}

/* 关于图标 */
.userInfo-item .item-left .guanyu {
  margin-right: 5px;
}

/* 分隔线阴影 */
.shadow {
  height: 1px;
  background: none;
  box-shadow: 0 1px 0 rgb(245, 246, 247);
}

/* 箭头图标 */
.icon-arrow {
  font-size: 16px;
}
</style>
