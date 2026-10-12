<template>
  <div>
    <div class="navigation-bar"></div>
    <div class="login-form-container">
      <div class="login-tabs">
        <span
          v-for="item in loginTabs.list"
          :key="item.key"
          :class="['login-tab', { active: loginTabs.active === item.key }]"
          @click="loginTabs.active = item.key"
        >
          <span>{{ item.title }}</span>
        </span>
      </div>
      <div class="login-tips">{{ i18n.loginTips }}</div>
      <div class="login-form">
        <FormInput
          className="login-form-input"
          type="tel"
          :value="loginForm.mobile"
          @updateModelValue="(val) => (loginForm.mobile = val)"
          :placeholder="i18n.mobilePlaceholder"
          :allow-clear="true"
          :rule="mobileInputRule"
        >
          <template #addonBefore>
            <span class="phone-addon-before">+86</span>
          </template>
        </FormInput>
        <FormInput
          className="login-form-input"
          type="tel"
          :value="loginForm.smsCode"
          @updateModelValue="(val) => (loginForm.smsCode = val)"
          :placeholder="i18n.smsCodePlaceholder"
          :rule="smsCodeInputRule"
        >
          <template #addonAfter>
            <button
              class="sms-addon-after"
              :class="{ disabled: smsCount > 0 && smsCount < 60 }"
              :disabled="
                smsRequestPending || (smsCount > 0 && smsCount < 60)
              "
              type="button"
              @click="startSmsCount()"
            >
              {{ smsText }}
            </button>
          </template>
        </FormInput>
      </div>
    </div>
    <button
      class="login-btn"
      :disabled="loginPending"
      @click="submitLoginForm()"
    >
      {{ i18n.loginBtnTitle }}
    </button>
  </div>
</template>

<script>
import Vue from "vue";
import i18n from "../i18n/zh-cn";
import { getLoginSmsCode, loginRegisterByCode } from "../utils/api";
import FormInput from "./form-input.vue";
import { showToast } from "../../utils/toast";
import {
  bindKickedOfflineHandler,
  clearKickedOfflineHandler,
  init,
} from "../../utils/init.js";
import { neUiKitRouterPath } from "../../utils/uikitRouter";

export default {
  components: {
    FormInput,
  },
  data() {
    return {
      i18n,
      mobileInputRule: {
        reg: /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/,
        message: i18n.mobileErrorMsg,
        trigger: "blur",
      },
      smsCodeInputRule: {
        reg: /^\d+$/,
        message: i18n.smsErrorMsg,
        trigger: "blur",
      },
      smsCount: 60,
      loginTabs: {
        active: 0,
        list: [{ key: 0, title: i18n.loginTitle }],
      },
      loginForm: {
        mobile: "",
        smsCode: "",
      },
      smsTimer: null,
      smsRequestPending: false,
      loginPending: false,
    };
  },
  computed: {
    smsText() {
      if (this.smsCount > 0 && this.smsCount < 60) {
        return this.smsCount + i18n.smsCodeBtnTitleCount;
      }
      return i18n.smsCodeBtnTitle;
    },
  },
  beforeDestroy() {
    if (this.smsTimer) {
      clearInterval(this.smsTimer);
    }
  },
  methods: {
    async startSmsCount() {
      if (
        this.smsRequestPending ||
        (this.smsCount > 0 && this.smsCount < 60)
      ) {
        return;
      }
      if (!this.mobileInputRule.reg.test(this.loginForm.mobile)) {
        showToast({
          message: i18n.mobileErrorMsg,
          type: "info",
        });
        return;
      }
      this.smsRequestPending = true;
      try {
        await getLoginSmsCode({ mobile: this.loginForm.mobile });
      } catch (error) {
        let msg =
          error.errMsg || error.msg || error.message || i18n.smsCodeFailMsg;
        if (msg.startsWith("request:fail")) {
          msg = i18n.smsCodeNetworkErrorMsg;
        }
        showToast({
          message: msg,
          type: "info",
        });
        return;
      } finally {
        this.smsRequestPending = false;
      }

      this.smsCount--;
      if (this.smsTimer) {
        clearInterval(this.smsTimer);
      }
      this.smsTimer = setInterval(() => {
        if (this.smsCount > 0) {
          this.smsCount--;
        } else {
          clearInterval(this.smsTimer);
          this.smsTimer = null;
          this.smsCount = 60;
        }
      }, 1000);
    },
    async submitLoginForm() {
      if (this.loginPending) {
        return;
      }
      if (
        !this.mobileInputRule.reg.test(this.loginForm.mobile) ||
        !this.smsCodeInputRule.reg.test(this.loginForm.smsCode)
      ) {
        showToast({
          message: i18n.mobileOrSmsCodeErrorMsg,
          type: "info",
        });
        return;
      }
      this.loginPending = true;
      try {
        const res = await loginRegisterByCode(this.loginForm);
        localStorage.setItem(
          "__yx_im_options__h5",
          JSON.stringify({
            account: res.imAccid,
            token: res.imToken,
          })
        );

        const { nim, store } = init();
        Vue.prototype.$NIM = nim;
        Vue.prototype.$UIKitStore = store;

        const handleKickedOffline = () => {
          showToast({
            message: "您已被踢下线",
            type: "info",
          });
          this.$router.push(neUiKitRouterPath.login);
          localStorage.removeItem("__yx_im_options__h5");
          store.destroy();
          clearKickedOfflineHandler();
        };

        try {
          await nim.V2NIMLoginService.login(res.imAccid, res.imToken);
          bindKickedOfflineHandler(nim, handleKickedOffline);
          this.$router.push(neUiKitRouterPath.conversation);
        } catch (error) {
          localStorage.removeItem("__yx_im_options__h5");
          store.destroy();
          showToast({
            message:
              error.code === 102422
                ? "当前账号已被封禁"
                : error.message || i18n.loginFailMsg,
            type: "info",
          });
        }
      } catch (error) {
        let msg =
          error.errMsg || error.msg || error.message || i18n.smsCodeFailMsg;
        if (msg.startsWith("request:fail")) {
          msg = i18n.loginNetworkErrorMsg;
        }
        showToast({
          message: msg,
          type: "info",
        });
      } finally {
        this.loginPending = false;
      }
    },
  },
};
</script>

<style scoped>
.navigation-bar {
  height: 80px;
}

.login-form-container {
  padding: 0 30px;
}

.login-tab {
  display: inline-block;
  font-size: 22px;
  line-height: 31px;
  color: #666b73;
  margin-right: 20px;
  margin-bottom: 20px;
}

.login-tab.active {
  color: #222222;
  font-weight: bold;
}

.login-tab-active-line {
  display: block;
  width: 80px;
  height: 2px;
  background: #337eff;
  margin: 5px auto;
  border-radius: 2px;
}

.login-tips {
  font-size: 14px;
  line-height: 20px;
  color: #999999;
  margin-bottom: 20px;
}

.phone-addon-before {
  color: #999999;
  border-right: 1px solid #999999;
  padding: 0 5px;
}

.sms-addon-after {
  color: #337eff;
  border: 0;
  padding: 0;
  background: transparent;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
}

.sms-addon-after.disabled,
.sms-addon-after:disabled {
  color: #666b73;
  cursor: not-allowed;
}

.login-form-input {
  margin-bottom: 20px;
  color: #333;
}

.login-btn {
  border: none;
  height: 50px;
  width: 90%;
  background: #337eff;
  border-radius: 8px;
  color: #fff;
  margin-top: 54px;
  position: relative;
  font-size: 16px;
  left: 50%;
  transform: translateX(-50%);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
