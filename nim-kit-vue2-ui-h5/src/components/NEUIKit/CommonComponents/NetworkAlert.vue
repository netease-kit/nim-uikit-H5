<template>
  <div v-if="!isConnected && text" class="network-alert">
    {{ text }}
  </div>
</template>

<script>
import { autorun } from "../utils/store.js";
import { uiKitStore } from "../utils/init";
import { t } from "../utils/i18n";
import { V2NIMConst } from "../utils/sdk";

export default {
  name: "NetworkAlert",
  data() {
    return {
      isConnected: true,
      text: t("connectingText"),
      disposeConnectWatch: null,
    };
  },
  mounted() {
    this.updateConnectStatus();
    this.disposeConnectWatch = autorun(() => {
      this.updateConnectStatus();
    });
  },
  beforeDestroy() {
    if (this.disposeConnectWatch) {
      this.disposeConnectWatch();
      this.disposeConnectWatch = null;
    }
  },
  methods: {
    updateConnectStatus() {
      const connectStatus =
        uiKitStore &&
        uiKitStore.connectStore &&
        uiKitStore.connectStore.connectStatus;

      if (
        connectStatus ===
        V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_CONNECTED
      ) {
        this.isConnected = true;
      } else if (
        connectStatus ===
        V2NIMConst.V2NIMConnectStatus.V2NIM_CONNECT_STATUS_DISCONNECTED
      ) {
        this.isConnected = false;
        this.text = t("offlineText");
      } else {
        this.isConnected = false;
        this.text = t("connectingText");
      }
    },
  },
};
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
