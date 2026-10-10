<template>
  <div v-if="showUiKit" class="app-container">
    <router-view :key="$route.fullPath"></router-view>
    <TabBar />
  </div>
</template>

<script>
import Vue from "vue";
import TabBar from "./components/TabBar.vue";
import {
  clearKickedOfflineHandler,
  init,
} from "./components/NEUIKit/utils/init";
import { showToast } from "./components/NEUIKit/utils/toast";

export default {
  name: "App",
  components: {
    TabBar,
  },
  data() {
    return {
      showUiKit: false,
      nim: null,
      store: null,
      kickedOfflineHandler: null,
    };
  },

  methods: {
    initIMUiKit(opts) {
      const { nim, store } = init(opts.appkey);
      this.nim = nim;
      this.store = store;

      Vue.prototype.$NIM = nim;
      Vue.prototype.$UIKitStore = store;

      nim.V2NIMLoginService.login(opts.account, opts.token)
        .then(() => {
          this.navigateTo("/conversation");
        })
        .catch((error) => {
          this.showUiKit = true;
          localStorage.removeItem("__yx_im_options__h5");
          store.destroy();
          showToast({
            message:
              error.code === 102422
                ? "当前账号已被封禁"
                : error.message || "登录失败",
            type: "info",
          });
          this.navigateTo("/login");
        });
    },
    navigateTo(path) {
      if (this.$route.path !== path) {
        return this.$router.push(path);
      }
      return Promise.resolve();
    },
  },
  mounted() {
    try {
      this.initIMUiKit({
        appkey: "", //您在云信控制台注册的appkey
        account: "", //云信控制台上的account
        token: "",
      });
      this.showUiKit = true;
    } catch (error) {
      console.error("解析登录信息失败", error);
      this.showUiKit = true;
    }
  },
  beforeDestroy() {
    clearKickedOfflineHandler();
    if (this.store) {
      this.store.destroy();
    }
  },
};
</script>

<style>
.app-container {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}
</style>
