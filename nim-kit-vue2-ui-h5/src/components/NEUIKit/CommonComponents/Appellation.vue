<template>
  <span
    class="appellation"
    :style="{ color: color, fontSize: fontSize + 'px' }"
    >{{ appellation }}</span
  >
</template>

<script>
import { autorun } from "../utils/store.js";
import { uiKitStore } from "../utils/init";

export default {
  name: "AppellationText",
  props: {
    account: {
      type: String,
      required: true,
    },
    teamId: {
      type: String,
      default: undefined,
    },
    ignoreAlias: {
      type: Boolean,
      default: false,
    },
    nickFromMsg: {
      type: String,
      default: undefined,
    },
    color: {
      type: String,
      default: "#000",
    },
    fontSize: {
      type: Number,
      default: 16,
    },
  },
  data() {
    return {
      appellation: "",
      disposeAppellationWatch: null,
    };
  },
  mounted() {
    this.disposeAppellationWatch = autorun(() => {
      this.appellation = uiKitStore.uiStore.getAppellation({
        account: this.account,
        teamId: this.teamId,
        ignoreAlias: this.ignoreAlias,
        nickFromMsg: this.nickFromMsg,
      });
    });
  },
  beforeDestroy() {
    if (this.disposeAppellationWatch) {
      this.disposeAppellationWatch();
      this.disposeAppellationWatch = null;
    }
  },
};
</script>

<style scoped>
.appellation {
  color: #000;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
