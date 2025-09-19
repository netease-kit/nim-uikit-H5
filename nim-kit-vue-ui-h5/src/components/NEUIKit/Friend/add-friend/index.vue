<template>
  <div class="add-friend-wrapper">
    <NavBar :title="t('addFriendText')" />
    <div class="search-input-wrapper">
      <div class="search-icon">
        <Icon :size="20" color="#A6ADB6" type="icon-sousuo"></Icon>
      </div>
      <Input
        class="search-input"
        type="text"
        v-model="searchText"
        @input="onInputValueChange"
        @confirm="handleSearch"
        placeholder-class="placeholder"
        confirm-type="search"
        :placeholder="t('enterAccount')"
        :inputStyle="{
          backgroundColor: '#f2f4f5',
        }"
      />
    </div>
    <Empty
      :text="t('noExistUser')"
      v-if="searchResState == 'searchEmpty'"
    ></Empty>
    <div class="user-wrapper" v-else-if="searchResState === 'searchResult'">
      <Avatar
        class="user-avatar"
        :account="(userInfo && userInfo.accountId) || ''"
      />
      <div class="user-info">
        <div class="user-nick">
          {{ (userInfo && userInfo.name) || (userInfo && userInfo.accountId) }}
        </div>
        <div class="user-id">{{ userInfo && userInfo.accountId }}</div>
      </div>
      <!-- 如果是好友之间去聊天，如果不是好友，添加好友 -->
      <Button
        v-if="relation !== 'stranger'"
        class="go-chat-button"
        @click="gotoChat"
      >
        {{ t("chatButtonText") }}
      </Button>
      <Button v-else class="go-chat-button" @click="applyFriend">
        {{ t("addText") }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, getCurrentInstance } from "vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import Empty from "../../CommonComponents/Empty.vue";
import { t } from "../../utils/i18n";
import Button from "../../CommonComponents/Button.vue";
import { autorun } from "mobx";
import type { Relation } from "@xkit-yx/im-store-v2";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import type { V2NIMUser } from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService";
import Input from "../../CommonComponents/Input.vue";
import { useRouter } from "vue-router";
import { showToast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
const router = useRouter();
const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;

// 搜索结果状态
const searchResState = ref<"beginSearch" | "searchEmpty" | "searchResult">(
  "beginSearch"
);
const userInfo = ref<V2NIMUser>();
const relation = ref<Relation | undefined>("stranger");
const searchText = ref("");
const uninstallRelationWatch = autorun(() => {
  store?.uiStore.friends;
  if (userInfo.value?.accountId) {
    relation.value = store?.uiStore.getRelation(
      userInfo.value?.accountId
    ).relation;
  }
});

// 搜索好友
const handleSearch = async (value) => {
  try {
    const user = await store?.userStore.getUserActive(value);

    if (!user) {
      searchResState.value = "searchEmpty";
    } else {
      userInfo.value = user;

      relation.value = store?.uiStore.getRelation(user.accountId).relation;
      searchResState.value = "searchResult";
    }
  } catch (error) {
    searchResState.value = "searchEmpty";

    showToast({
      message: t("searchFailText"),
      type: "info",
    });
  }
};

// 添加好友
const applyFriend = async () => {
  const account = userInfo.value?.accountId;
  if (account) {
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
  }
};

// 去聊天
const gotoChat = async () => {
  const to = userInfo.value?.accountId;
  if (to) {
    try {
      const conversationId = nim?.V2NIMConversationIdUtil.p2pConversationId(to);
      await store?.uiStore.selectConversation(conversationId);

      router.push(neUiKitRouterPath.chat);
    } catch (error) {
      showToast({
        message: t("gotoChatFailText"),
        type: "info",
      });
    }
  }
};

const onInputValueChange = (event) => {
  const value = event.target.value;
  //删除搜索内容,页面回到最原始状态，搜索结果都清空
  if (value === "") {
    searchResState.value = "beginSearch";
  }
};

onUnmounted(() => {
  uninstallRelationWatch();
});
</script>

<style scoped>
.add-friend-wrapper {
  height: 100%;
  background-color: #fff;
}
.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f2f4f5;
  box-sizing: border-box;
  margin: 10px;
  padding: 3px 5px;
  border-radius: 3px;
}
.search-icon {
  color: #a6adb6;
  background-size: 100% 100%;
  width: 20px;
  height: 20px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-input {
  display: inline-block;
  background-color: #f2f4f5;
  flex: 1;
}

.placeholder {
  color: #a6adb6;
}

.user-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 10px;
  box-sizing: border-box;
}
.user-avatar {
  flex: 0 0 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-block;
}
.go-chat-button {
  height: 30px;
  font-size: 14px;
  line-height: 30px;
  margin: 5px;
  flex: 0 0 70px;
}
.user-info {
  flex: 1;
  margin-left: 15px;
  overflow: hidden;
  color: #000;
}
.user-nick {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.user-id {
  width: 100%;
  font-size: 14px;
  color: #b5b6b8;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
../../utils/router
