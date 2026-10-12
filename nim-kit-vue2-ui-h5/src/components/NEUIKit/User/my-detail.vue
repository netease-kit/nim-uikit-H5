<template>
  <div class="wrapper">
    <NavBar :title="t('PersonalPageText')" />
    <div class="userInfo-item-wrapper">
      <div class="userInfo-item" @click="triggerFileInput">
        <div class="item-left">{{ t("avatarText") }}</div>
        <div class="item-right">
          <Avatar
            :avatar="myUserInfo && myUserInfo.avatar"
            :account="myUserInfo?.accountId || ''"
          ></Avatar>
          <Icon
            :size="15"
            color="#A6ADB6"
            iconClassName="arrow"
            type="icon-jiantou"
          ></Icon>
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            accept="image/*"
            @change="onChangeAvatar"
          />
        </div>
      </div>

      <div class="box-shadow"></div>
      <div class="userInfo-item" @click="() => navigatorToUserItem('name')">
        <div class="item-left">{{ t("name") }}</div>
        <div class="item-right">
          <div class="nick">
            {{
              (myUserInfo && myUserInfo.name) ||
              (myUserInfo && myUserInfo.accountId)
            }}
          </div>
          <Icon
            :size="15"
            color="#A6ADB6"
            iconClassName="arrow"
            type="icon-jiantou"
          >
          </Icon>
        </div>
      </div>
      <div class="box-shadow"></div>
      <div class="userInfo-item">
        <div class="item-left">{{ t("accountText") }}</div>
        <div class="item-right">
          {{ myUserInfo && myUserInfo.accountId }}
          <div @click.stop="copyAccount" class="arrow">
            <Icon :size="15" color="#A6ADB6" type="icon-fuzhi1"></Icon>
          </div>
        </div>
      </div>
      <div class="box-shadow"></div>
      <div class="userInfo-item">
        <div class="item-left">{{ t("genderText") }}</div>
        <div class="item-right">
          <div class="uni-input">
            {{
              myUserInfo && myUserInfo.gender === 0
                ? t("unknow")
                : myUserInfo && myUserInfo.gender === 1
                ? t("man")
                : t("woman")
            }}</div
          >
        </div>
      </div>

      <div class="box-shadow"></div>
      <div class="userInfo-item">
        <div class="item-left">{{ t("birthText") }}</div>
        <div class="item-right">
          <input
            class="birthday-input"
            type="date"
            :value="(myUserInfo && myUserInfo.birthday) || ''"
            @change="onBirthdayChange"
          />
        </div>
      </div>
      <div class="box-shadow"></div>
      <div class="userInfo-item" @click="() => navigatorToUserItem('mobile')">
        <div class="item-left">{{ t("mobile") }}</div>
        <div class="item-right">
          {{ (myUserInfo && myUserInfo.mobile) || t("unknow")
          }}<Icon
            :size="15"
            color="#A6ADB6"
            iconClassName="arrow"
            type="icon-jiantou"
          ></Icon>
        </div>
      </div>
      <div class="box-shadow"></div>
      <div class="userInfo-item" @click="() => navigatorToUserItem('email')">
        <div class="item-left">{{ t("email") }}</div>
        <div class="item-right">
          <div class="email">
            {{ (myUserInfo && myUserInfo.email) || t("unknow") }}
          </div>
          <Icon
            :size="15"
            color="#A6ADB6"
            iconClassName="arrow"
            type="icon-jiantou"
          ></Icon>
        </div>
      </div>
    </div>
    <div class="signature" @click="() => navigatorToUserItem('sign')">
      <div class="signature-key">{{ t("sign") }}</div>
      <div class="signature-text">
        {{ (myUserInfo && myUserInfo.sign) || t("unknow") }}
      </div>
      <Icon
        :size="15"
        color="#A6ADB6"
        iconClassName="arrow"
        type="icon-jiantou"
      >
      </Icon>
    </div>
  </div>
</template>

<script>
import Avatar from "../CommonComponents/Avatar.vue";
import Icon from "../CommonComponents/Icon.vue";
import NavBar from "../CommonComponents/NavBar.vue";
import { t } from "../utils/i18n";
import { autorun } from "../utils/store.js";
import { loading } from "../utils/loading";
import { copyText } from "../utils";
import { showToast } from "../utils/toast";
import { neUiKitRouterPath } from "../utils/uikitRouter";
import { nim, uiKitStore } from "../utils/init.js";

export default {
  components: {
    Avatar,
    Icon,
    NavBar,
  },
  data() {
    return {
      myUserInfo: null,
      uninstallMyUserInfoWatch: null,
      t,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
  },
  mounted() {
    this.uninstallMyUserInfoWatch = autorun(() => {
      this.myUserInfo = this.store?.userStore.myUserInfo;
    });
  },
  beforeDestroy() {
    if (this.uninstallMyUserInfoWatch) {
      this.uninstallMyUserInfoWatch();
    }
  },
  methods: {
    navigatorToUserItem(key) {
      this.$router.push({
        path: neUiKitRouterPath.myDetailEdit,
        query: {
          key,
        },
      });
    },
    triggerFileInput() {
      this.$refs.fileInput?.click();
    },
    async onChangeAvatar(event) {
      const target = event.target;
      const file = target.files?.[0];
      if (!file) {
        target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        showToast({
          message: t("FailAvatarText"),
          type: "info",
        });
        target.value = "";
        return;
      }

      try {
        loading.show();
        await this.store?.userStore.updateSelfUserProfileActive(
          {
            ...this.myUserInfo,
          },
          file
        );
      } catch (error) {
        showToast({
          message: t("FailAvatarText"),
          type: "info",
        });
      } finally {
        loading.hide();
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
      }
    },
    async onBirthdayChange(event) {
      const birthday = event.target.value;
      if (!birthday || !this.myUserInfo || !this.store?.userStore) {
        return;
      }

      try {
        await this.store.userStore.updateSelfUserProfileActive({
          ...this.myUserInfo,
          birthday,
        });
      } catch (error) {
        showToast({
          message: t("saveText") + t("birthText") + t("failText"),
          type: "info",
        });
      }
    },
    copyAccount() {
      try {
        copyText(this.myUserInfo?.accountId || "");
        showToast({
          message: t("copySuccessText"),
          type: "info",
          duration: 2000,
        });
      } catch (error) {
        showToast({
          message: t("copyFailText"),
          type: "info",
          duration: 2000,
        });
      }
    },
  },
};
</script>

<style scoped>
/* 主容器 */
.wrapper {
  height: 100%;
  box-sizing: border-box;
  background-color: rgb(246, 248, 250);
}

/* 用户信息项容器 */
.userInfo-item-wrapper {
  margin: 10px 15px;
  overflow: hidden;
  border-radius: 5px;
}

/* 用户信息项 */
.userInfo-item {
  display: flex;
  height: 50px;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: #fff;
}

/* 用户信息项左侧 */
.item-left {
  font-size: 16px;
  flex: 0 0 50px;
  color: #000;
}

/* 用户信息项右侧 */
.item-right {
  flex: 1;
  text-align: right;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: #a6adb6;
  overflow: hidden;
}

.birthday-input {
  border: 0;
  background: transparent;
  color: #a6adb6;
  font: inherit;
  text-align: right;
}

/* 邮箱文本 */
.email {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: right;
}

/* 昵称文本 */
.nick {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #a6adb6;
}

/* 箭头图标 */
.arrow {
  margin-left: 15px;
  line-height: 0;
}

/* 分隔线 */
.box-shadow {
  height: 1px;
  background: none;
  box-shadow: 0 1px 0 rgb(233, 231, 231);
}

/* 签名容器 */
.signature {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin: 10px 15px;
  background-color: #fff;
  border-radius: 5px;
  box-sizing: border-box;
}

/* 签名标题 */
.signature-key {
  flex: 0 0 80px;
  color: #000;
  font-size: 16px;
}

/* 签名文本 */
.signature-text {
  text-align: right;
  font-size: 15px;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #a6adb6;
}

/* 签名箭头 */
.signature .arrow {
  margin-left: 15px;
  flex: 0 0 10px;
  color: #a6adb6;
  font-size: 15px;
}
</style>
