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
        forwardConversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
      "
      class="avatar-wrapper"
    >
      <Avatar
        :account="
          (forwardToTeamInfo && forwardToTeamInfo.teamId) || ''
        "
        :avatar="forwardToTeamInfo && forwardToTeamInfo.avatar"
        size="36"
      />
      <div class="name">
        {{ (forwardToTeamInfo && forwardToTeamInfo.name) || "" }}
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

<script>
import { t } from "../../utils/i18n";
import Modal from "../../CommonComponents/Modal.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import { V2NIMConst } from "../../utils/sdk";
import Input from "../../CommonComponents/Input.vue";
import { nim, uiKitStore } from "../../utils/init.js";
export default {
  components: {
    Modal,
    Avatar,
    Input,
  },
  props: {
    forwardModalVisible: {
      type: Boolean,
      default: false,
    },
    forwardTo: {
      type: String,
      default: "",
    },
    forwardMsg: {
      type: Object,
      default: undefined,
    },
    forwardConversationType: {
      type: [Number, String],
      default: "",
    },
    forwardToTeamInfo: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      forwardComment: "",
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    forwardToNick() {
      return uiKitStore.uiStore.getAppellation({
        account: this.forwardTo,
      });
    },
    forwardFromNick() {
      return uiKitStore.uiStore.getAppellation({
        account: this.forwardMsg?.senderId,
      });
    },
  },
  methods: {
    handleForwardInputChange(event) {
      this.forwardComment = event.target.value;
    },
    handleCancel() {
      this.$emit("cancel");
    },
    handleConfirm() {
      this.$emit("confirm", this.forwardComment);
    },
  },
};
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
