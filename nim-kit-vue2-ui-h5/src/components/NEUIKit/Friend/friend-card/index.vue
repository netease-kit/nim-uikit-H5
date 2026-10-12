<template>
  <div class="wrapper">
    <NavBar :title="t('FriendPageText')" />
    <UserCard
      :account="userInfo && userInfo.accountId"
      :nick="userInfo && userInfo.name"
    ></UserCard>
    <template v-if="relation === 'stranger'">
      <div class="userInfo-item-wrapper">
        <div class="userInfo-item">
          <div class="item-left">{{ t("addBlacklist") }}</div>
          <UIKitSwitch
            :checked="isInBlacklist"
            :disabled="blacklistPending"
            @change="(checked) => handleSwitchChange(checked)"
          />
        </div>
      </div>

      <div class="button" :style="{ marginTop: '10px' }" @click="addFriend">
        {{ t("addFriendText") }}
      </div>
    </template>
    <template v-else>
      <div class="userInfo-item-wrapper">
        <div class="userInfo-item" @click="handleAliasClick">
          <div class="item-left">{{ t("remarkText") }}</div>
          <div class="item-right">
            <span class="item-right-alias">{{ alias }}</span>
            <span class="item-right">
              <Icon
                iconClassName="more-icon"
                color="#999"
                type="icon-jiantou"
              />
            </span>
          </div>
        </div>
        <div class="userInfo-item">
          <div class="item-left">{{ t("genderText") }}</div>
          <div class="item-right">
            {{
              userInfo && userInfo.gender === 0
                ? t("unknow")
                : userInfo && userInfo.gender === 1
                ? t("man")
                : t("woman")
            }}
          </div>
        </div>
        <div class="box-shadow"></div>
        <div class="userInfo-item">
          <div class="item-left">{{ t("birthText") }}</div>
          <div class="item-right">
            {{ (userInfo && userInfo.birthday) || t("unknow") }}
          </div>
        </div>
        <div class="box-shadow"></div>
        <div class="userInfo-item">
          <div class="item-left">{{ t("mobile") }}</div>
          <div class="item-right">
            {{ (userInfo && userInfo.mobile) || t("unknow") }}
          </div>
        </div>
        <div class="box-shadow"></div>
        <div class="userInfo-item">
          <div class="item-left">{{ t("email") }}</div>
          <div class="item-right">
            {{ (userInfo && userInfo.email) || t("unknow") }}
          </div>
        </div>
        <div class="userInfo-item">
          <div class="item-left">{{ t("sign") }}</div>
          <div class="item-right">
            {{ (userInfo && userInfo.sign) || t("unknow") }}
          </div>
        </div>
      </div>
      <div class="userInfo-item-wrapper">
        <div class="userInfo-item">
          <div class="item-left">{{ t("addBlacklist") }}</div>
          <UIKitSwitch
            :checked="isInBlacklist"
            :disabled="blacklistPending"
            @change="handleSwitchChange"
          />
        </div>
      </div>
      <div class="button" @click="gotoChat">{{ t("chatWithFriendText") }}</div>
      <div class="box-shadow"></div>
      <div class="button button-red" @click="deleteFriend">
        {{ t("deleteFriendText") }}
      </div>
    </template>
  </div>
</template>

<script>
import UserCard from "../../CommonComponents/UserCard.vue";
import { t } from "../../utils/i18n";
import NavBar from "../../CommonComponents/NavBar.vue";
import { autorun } from "../../utils/store.js";
import { V2NIMConst } from "../../utils/sdk";
import UIKitSwitch from "../../CommonComponents/Switch.vue";
import { toast } from "../../utils/toast";
import { modal } from "../../utils/modal";
import { showToast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import Icon from "../../CommonComponents/Icon.vue";
import { nim, uiKitStore } from "../../utils/init.js";
export default {
  name: "FriendCard",
  components: {
    UserCard,
    NavBar,
    UIKitSwitch,
    Icon,
  },
  data() {
    return {
      alias: "",
      userInfo: null,
      relation: "stranger",
      isInBlacklist: false,
      blacklistPending: false,
      account: "",
      uninstallFriendWatch: null,
      uninstallRelationWatch: null,
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
  },
  mounted() {
    this.account = this.$route.query.accountId || "";

    this.store?.userStore.getUserForceActive(this.account).then((res) => {
      this.userInfo = res;
    });
    this.uninstallFriendWatch = autorun(() => {
      this.userInfo = this.store?.uiStore.getFriendWithUserNameCard(this.account);
    });
    this.uninstallRelationWatch = autorun(() => {
      const relationInfo = this.store?.uiStore.getRelation(this.account) || {};
      this.relation = relationInfo.relation || "stranger";
      this.isInBlacklist = !!relationInfo.isInBlacklist;
    });

    const friend = this.store?.friendStore.friends.get(this.account);
    this.alias = friend ? friend.alias : "";
  },
  beforeDestroy() {
    if (this.uninstallFriendWatch) {
      this.uninstallFriendWatch();
    }
    if (this.uninstallRelationWatch) {
      this.uninstallRelationWatch();
    }
  },
  methods: {
    handleAliasClick(event) {
      event.stopPropagation();
      this.$router.push({
        path: neUiKitRouterPath.friendInfoEdit,
        query: {
          accountId: this.account,
        },
      });
    },
    async handleSwitchChange(value) {
      if (this.blacklistPending) {
        return;
      }
      this.blacklistPending = true;
      const isAdd = value;
      const previousValue = this.isInBlacklist;
      this.isInBlacklist = value;
      try {
        if (isAdd) {
          await this.store?.relationStore.addUserToBlockListActive(this.account);
        } else {
          await this.store?.relationStore.removeUserFromBlockListActive(
            this.account
          );
        }
      } catch (error) {
        this.isInBlacklist = previousValue;
        toast.info(isAdd ? t("setBlackFailText") : t("removeBlackFailText"));
      } finally {
        this.blacklistPending = false;
      }
    },
    deleteFriend() {
      modal.confirm({
        title: t("deleteFriendText"),
        content: `${t("deleteFriendConfirmText")}"${this.store?.uiStore.getAppellation({
          account: this.account,
        })}"?`,
        onConfirm: async () => {
          try {
            await this.store?.friendStore.deleteFriendActive(this.account);
            toast.info(t("deleteFriendSuccessText"));
          } catch (error) {
            toast.info(t("deleteFriendFailText"));
          }
        },
      });
    },
    async addFriend() {
      try {
        await this.store?.friendStore.addFriendActive(this.account, {
          addMode: V2NIMConst.V2NIMFriendAddMode.V2NIM_FRIEND_MODE_TYPE_APPLY,
          postscript: "",
        });
        await this.store?.relationStore.removeUserFromBlockListActive(
          this.account
        );
        showToast({
          message: t("applyFriendSuccessText"),
          type: "info",
        });
      } catch (error) {
        showToast({
          message: t("applyFriendFailText"),
          type: "info",
        });
      }
    },
    async gotoChat() {
      const conversationId = nim.V2NIMConversationIdUtil.p2pConversationId(
        this.userInfo?.accountId || ""
      );
      await this.store?.uiStore.selectConversation(conversationId);
      this.$router.push(neUiKitRouterPath.chat);
    },
  },
};
</script>

<style scoped>
.wrapper {
  background-color: rgb(245, 246, 247);
  height: 100%;
  box-sizing: border-box;
  padding-bottom: 50px;
  overflow: auto;
}

.userInfo-item-wrapper {
  background-color: #fff;
  margin: 10px 0;
}

.userInfo-item {
  display: flex;
  height: 50px;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
}

.item-left {
  font-size: 16px;
  color: #000;
}

.item-right {
  font-size: 15px;
  width: 200px;
  text-align: right;
  color: #a6adb6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.button {
  display: block;
  width: 100%;
  background-color: #fff;
  color: rgb(25, 146, 239);
  text-align: center;
  height: 50px;
  font-size: 16px;
  line-height: 50px;
}

.button-red {
  color: #e6605c;
}

.box-shadow {
  height: 1px;
  background: none;
  padding: 0 25px;
  box-shadow: 0 0.5px 0 rgb(247, 244, 244);
}

.item-right-alias {
  margin-right: 5px;
}
</style>
