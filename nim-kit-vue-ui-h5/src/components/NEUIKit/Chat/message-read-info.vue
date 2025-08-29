<template>
  <div class="msg-page-wrapper">
    <div class="msg-nav">
      <NavBar :title="t('msgReadPageTitleText')" :showLeft="true">
        <template v-slot:left>
          <div @click="backToConversation">
            <Icon type="icon-zuojiantou" :size="22"></Icon>
          </div>
        </template>
      </NavBar>
    </div>
    <div class="msg-alert">
      <NetworkAlert />
    </div>
    <div class="msg-read-header">
      <div
        class="msg-read-header-item"
        :class="selectedType === 'read' ? 'active' : ''"
        @click="selectedType = 'read'"
      >
        {{ `${t("readText")}(${readCount})` }}
      </div>
      <div
        class="msg-read-header-item"
        :class="selectedType === 'unread' ? 'active' : ''"
        @click="selectedType = 'unread'"
      >
        {{ `${t("unreadText")}(${unReadCount})` }}
      </div>
    </div>
    <div v-show="selectedType === 'read'" class="list-wrapper">
      <div
        v-if="readList.length"
        class="list-item"
        v-for="item in readList"
        :key="item"
      >
        <div class="avatar-wrapper">
          <Avatar
            size="40"
            :account="item"
            :goto-user-card="true"
            :teamId="teamId"
            :goto-team-card="false"
          />
        </div>
        <Appellation :account="item" :teamId="teamId"></Appellation>
      </div>
      <div v-else>
        <Empty :text="t('allUnReadText')"></Empty>
      </div>
    </div>
    <div v-show="selectedType === 'unread'" class="list-wrapper">
      <div
        v-if="unReadList.length"
        class="list-item"
        v-for="item in unReadList"
        :key="item"
      >
        <div class="avatar-wrapper">
          <Avatar
            size="40"
            :account="item"
            :goto-user-card="true"
            :teamId="teamId"
            :goto-team-card="false"
          />
        </div>
        <Appellation :account="item" :teamId="teamId"></Appellation>
      </div>
      <div v-else>
        <Empty :text="t('allReadText')"></Empty>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** 消息已读未读详情页面 */
import { onMounted, ref } from "vue";
import NetworkAlert from "../CommonComponents/NetworkAlert.vue";
import NavBar from "./message/nav-bar.vue";
import Icon from "../CommonComponents/Icon.vue";
import { t } from "../utils/i18n";
import Avatar from "../CommonComponents/Avatar.vue";
import Appellation from "../CommonComponents/Appellation.vue";
import Empty from "../CommonComponents/Empty.vue";
import { useRouter } from "vue-router";
import { getCurrentInstance } from "vue";

const readCount = ref(0);
const unReadCount = ref(0);
const readList = ref<string[]>([]);
const unReadList = ref<string[]>([]);
const selectedType = ref<string>("read");
const teamId = ref<string>("");
const router = useRouter();

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;
const backToConversation = () => {
  router.back();
};

onMounted(() => {
  const messageClientId = router.currentRoute.value.query
    ?.messageClientId as string;
  const conversationId = router.currentRoute.value.query
    ?.conversationId as string;
  if (messageClientId && conversationId) {
    teamId.value =
      nim.V2NIMConversationIdUtil.parseConversationTargetId(conversationId);
    const msg =
      store && store.msgStore.getMsg(conversationId, [messageClientId]);
    if (msg?.length) {
      // 获取当前消息的已读未读详情
      store?.msgStore.getTeamMessageReceiptDetailsActive(msg[0]).then((res) => {
        readCount.value = res?.readReceipt.readCount;
        unReadCount.value = res?.readReceipt.unreadCount;
        readList.value = res?.readAccountList;
        setTimeout(() => {
          unReadList.value = res?.unreadAccountList;
        });
      });
    }
  }
});
</script>

<style scoped>
.msg-page-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  background-color: #fff;
}
.msg-nav {
  flex-basis: 45px;
}
.msg-read-header {
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  margin-top: 5px;
}
.msg-read-header-item {
  flex: 1;
  text-align: center;
  line-height: 40px;
  color: #000;
  margin-bottom: 10px;
}
.active {
  border-bottom: 1px solid #007aff;
}
.list-wrapper {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
}
.list-item {
  height: 50px;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 20px;
}
.avatar-wrapper {
  margin-right: 10px;
}
</style>
