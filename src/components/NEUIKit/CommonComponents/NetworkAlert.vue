<template>
  <div v-if="!isConnected && text" class="network-alert">
    {{ text }}
  </div>
</template>

<script lang="ts" setup>
import { autorun } from "mobx";
import { ref, onMounted, onUnmounted, getCurrentInstance } from "vue";
import { t } from "../utils/i18n";
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'

const isConnected = ref(true);
const text = ref(t("connectingText"));
// this?.onNetworkStatusChange((res) => {
//   if (!res.isConnected) {
//     isConnected.value = false;
//     text.value = t('offlineText');
//   } else {
//     text.value = t('connectingText');
//   }
// });

const { proxy } = getCurrentInstance()!;  // 获取组件实例


onMounted(() => {
  if (
    proxy?.$UIKitStore?.connectStore?.connectStatus ===
    V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_CONNECTED
  ) {
    isConnected.value = true;
  } else if (
    proxy?.$UIKitStore?.connectStore?.connectStatus ===
    V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_DISCONNECTED
  ) {
    isConnected.value = false;
    text.value = t("offlineText");
  } else {
    isConnected.value = false;
    text.value = t("connectingText");
  }
});

const uninstallConnectWatch = autorun(() => {
  if (
        //@ts-ignore
    proxy?.$UIKitStore?.connectStore?.connectStatus ===
    V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_CONNECTED
  ) {
    isConnected.value = true;
  } else if (
        //@ts-ignore
    proxy?.$UIKitStore?.connectStore?.connectStatus ===
    V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_DISCONNECTED
  ) {
    isConnected.value = false;
    text.value = t("offlineText");
  } else {
    isConnected.value = false;
    text.value = t("connectingText");
  }
});

onUnmounted(() => {
  uninstallConnectWatch();
});
</script>

<style scoped>
.network-alert {
  font-size: 14px;
  background: #fee3e6;
  color: #fc596a;
  text-align: center;
  padding: 8px 0;
}
</style>
