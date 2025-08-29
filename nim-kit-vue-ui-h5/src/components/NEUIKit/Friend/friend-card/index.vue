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
          <Switch
            :checked="isInBlacklist"
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
          <Switch :checked="isInBlacklist" @change="handleSwitchChange" />
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

<script lang="ts" setup>
import UserCard from "../../CommonComponents/UserCard.vue";
import { onUnmounted, ref, getCurrentInstance, onMounted } from "vue";
import { t } from "../../utils/i18n";
import NavBar from "../../CommonComponents/NavBar.vue";
import { autorun } from "mobx";
import type { Relation } from "@xkit-yx/im-store-v2";
import type { V2NIMUser } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import Switch from "../../CommonComponents/Switch.vue";
import { toast } from "../../utils/toast";
import { modal } from "../../utils/modal";
import { showToast } from "../../utils/toast";
import { useRouter } from "vue-router";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import Icon from "../../CommonComponents/Icon.vue";

const router = useRouter();
const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;
const alias = ref<string>();
const accountId = ref<string>();

const userInfo = ref<V2NIMUser>();
const relation = ref<Relation>("stranger");
const isInBlacklist = ref(false);

let account = "";

const handleAliasClick = (e) => {
  e.stopPropagation();
  router.push({
    path: neUiKitRouterPath.friendInfoEdit,
    query: {
      accountId: account,
    },
  });
};

onMounted(() => {
  account = (router.currentRoute.value.query.accountId as string) || "";

  store?.userStore.getUserForceActive(account).then((res) => {
    userInfo.value = res;
    console.log("userInfo==================", res);
  });
  uninstallFriendWatch = autorun(() => {
    userInfo.value = store?.uiStore.getFriendWithUserNameCard(account);
  });

  uninstallRelationWatch = autorun(() => {
    const { relation: _relation, isInBlacklist: _isInBlacklist } =
      store?.uiStore.getRelation(account) as {
        relation: Relation;
        isInBlacklist: boolean;
      };
    relation.value = _relation;
    isInBlacklist.value = _isInBlacklist;
  });

  const friend = store?.friendStore.friends.get(account);

  alias.value = friend ? friend.alias : "";
});

let uninstallFriendWatch = () => {};
let uninstallRelationWatch = () => {};

const handleSwitchChange = async (value) => {
  const isAdd = value;
  isInBlacklist.value = value;
  try {
    if (isAdd) {
      await store?.relationStore.addUserToBlockListActive(account);
    } else {
      await store?.relationStore.removeUserFromBlockListActive(account);
    }
  } catch (error) {
    toast.info(isAdd ? t("setBlackFailText") : t("removeBlackFailText"));
  }
};

const deleteFriend = () => {
  modal.confirm({
    title: t("deleteFriendText"),
    content: `${t("deleteFriendConfirmText")}"${store?.uiStore.getAppellation({
      account,
    })}"?`,
    async onConfirm() {
      try {
        await store?.friendStore.deleteFriendActive(account);
        toast.info(t("deleteFriendSuccessText"));
      } catch (error) {
        toast.info(t("deleteFriendFailText"));
      }
    },
  });
};

const addFriend = async () => {
  try {
    await store?.friendStore.addFriendActive(account, {
      addMode: V2NIMConst.V2NIMFriendAddMode.V2NIM_FRIEND_MODE_TYPE_APPLY,
      postscript: "",
    });

    // 发送申请成功后解除黑名单
    await store?.relationStore.removeUserFromBlockListActive(account);

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
};

const gotoChat = async () => {
  const conversationId = nim.V2NIMConversationIdUtil.p2pConversationId(
    userInfo.value?.accountId || ""
  );
  await store?.uiStore.selectConversation(conversationId);
  router.push(neUiKitRouterPath.chat);
};

onUnmounted(() => {
  uninstallFriendWatch();
  uninstallRelationWatch();
});
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
