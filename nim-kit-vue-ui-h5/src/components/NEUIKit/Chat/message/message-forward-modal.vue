<template>
  <Modal
    :title="t('sendToText')"
    :visible="forwardModalVisible"
    :confirmText="t('sendText')"
    :cancelText="t('cancelText')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <div
      v-if="
        props.forwardConversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      "
      class="avatar-wrapper"
    >
      <Avatar
        :account="
          (props.forwardToTeamInfo && props.forwardToTeamInfo.teamId) || ''
        "
        :avatar="props.forwardToTeamInfo && props.forwardToTeamInfo.avatar"
        size="36"
      />
      <div class="name">
        {{ (props.forwardToTeamInfo && props.forwardToTeamInfo.name) || "" }}
      </div>
    </div>
    <div v-else class="avatar-wrapper">
      <Avatar :account="forwardTo" size="36" />
      <div class="name">
        <span>{{ forwardToNick }}</span>
      </div>
    </div>
    <div class="description">
      {{ "[" + t("forwardText") + "]" }}
      {{ forwardFromNick }}
      {{ t("sessionRecordText") }}
    </div>
    <Input
      class="forward-input"
      @input="handleForwardInputChange"
      :placeholder="t('forwardComment')"
      :inputStyle="{ height: '22px' }"
    />
  </Modal>
</template>

<script lang="ts" setup>
import { t } from "../../utils/i18n";
import { ref, computed, getCurrentInstance } from "vue";
import Modal from "../../CommonComponents/Modal.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/types";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import Input from "../../CommonComponents/Input.vue";
interface ForwardToTeamInfo {
  teamId: string;
  name: string;
  avatar: string;
}

const props = withDefaults(
  defineProps<{
    forwardModalVisible: boolean;
    forwardTo: string;
    forwardMsg: V2NIMMessageForUI | undefined;
    forwardConversationType: V2NIMConst.V2NIMConversationType;
    forwardToTeamInfo?: ForwardToTeamInfo;
  }>(),
  {}
);

const emit = defineEmits(["confirm", "cancel"]);

const forwardComment = ref("");

const { proxy } = getCurrentInstance()!; // 获取组件实例

const handleForwardInputChange = (value) => {
  forwardComment.value = value;
};

const handleCancel = () => {
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm", forwardComment.value);
};

// 转发消息的接收方昵称
const forwardToNick = computed(() => {
  return proxy?.$UIKitStore.uiStore.getAppellation({
    account: props.forwardTo,
  });
});

// 转发消息的发送方昵称
const forwardFromNick = computed(() => {
  return proxy?.$UIKitStore.uiStore.getAppellation({
    account: props.forwardMsg?.senderId as string,
  });
});
</script>

<style scoped>
/* 描述文本 */
.description {
  font-size: 14px;
  height: 32px;
  color: #000;
  background-color: #f2f4f5;
  margin: 10px 0px;
  padding: 0 16px;
  line-height: 32px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 转发输入框 */
.forward-input {
  height: 32px;
  border: 1px solid #e1e6e8;
  border-radius: 4px;
  padding: 5px 8px;
  box-sizing: border-box;
}

/* 头像容器 */
.avatar-wrapper {
  display: flex;
  align-items: center;
  height: 36px;
  margin: 0px 10px;
}

/* 用户名称 */
.avatar-wrapper .name {
  margin-left: 10px;
  font-size: 14px;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
