<template>
  <div class="wrapper">
    <NavBar title="关于" />
    <div class="logo-box">
      <img
        src="https://yx-web-nosdn.netease.im/common/fcd2d5e8d2897d4b2d965e06509f47d2/about-logo.png"
        class="logo-img"
      />
      <div>{{ t("appText") }}</div>
    </div>
    <div class="aboutInfo-item-wrapper">
      <div class="item">
        <div>{{ t("uikitVersion") }}</div>
        <div>10.0.0</div>
      </div>
      <div class="item">
        <div>{{ t("IMVersion") }}</div>
        <div>{{ imPkg.version }}</div>
      </div>
      <a
        :href="yunxinWebsite"
        :showUnderLine="false"
        color="#000000"
        target="_blank"
        rel="noopener noreferrer"
        class="item"
      >
        <div>{{ t("productInfoText") }}</div>
        <Icon iconClassName="icon-arrow" type="icon-jiantou"></Icon>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavBar from "../CommonComponents/NavBar.vue";
import { t } from "../utils/i18n";
//@ts-ignore
import imPkg from "nim-web-sdk-ng/package.json";

import Icon from "../CommonComponents/Icon.vue";
const yunxinWebsite = "https://yunxin.163.com/";
</script>

<style scoped>
.wrapper {
  background-color: rgb(245, 246, 247);
  background-color: #fff;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
}
.logo-box {
  text-align: center;
  margin: 22px auto;
  font-size: 20px;
  font-weight: 600;
  color: #000;
}
.logo-img {
  width: 72px;
  height: 72px;
}

.aboutInfo-item-wrapper .item {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px 12px 0;
  margin-left: 20px;
  font-size: 14px;
  color: #000;
  font-weight: normal;
  border-bottom: 1px solid #f5f8fc;
}
</style>
