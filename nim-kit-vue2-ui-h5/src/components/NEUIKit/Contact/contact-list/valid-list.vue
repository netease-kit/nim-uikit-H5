<template>
  <div class="valid-list-container">
    <NavBar :title="t('validMsgText')" />
    <div class="valid-list-content">
      <Empty v-if="validMsg.length === 0" :text="t('validEmptyText')" />
      <template v-else>
        <div class="valid-item" v-for="msg in validMsg" :key="msg.timestamp">
          <!-- 好友申请 已同意 -->
          <template
            v-if="
              msg.status ===
              V2NIMConst.V2NIMFriendAddApplicationStatus
                .V2NIM_FRIEND_ADD_APPLICATION_STATUS_AGREED
            "
          >
            <div class="valid-item-left">
              <Avatar :account="msg.applicantAccountId" />
              <div class="valid-name-container">
                <div class="valid-name">
                  <Appellation :account="msg.applicantAccountId" />
                </div>
                <div class="valid-action">{{ t("applyFriendText") }}</div>
              </div>
            </div>
            <div class="valid-state">
              <Icon type="icon-yidu" />
              <span class="valid-state-text">{{ t("acceptResultText") }}</span>
            </div>
          </template>
          <!--好友申请 已拒绝 -->
          <template
            v-else-if="
              msg.status ===
              V2NIMConst.V2NIMFriendAddApplicationStatus
                .V2NIM_FRIEND_ADD_APPLICATION_STATUS_REJECTED
            "
          >
            <template v-if="isMeApplicant(msg)">
              <div class="valid-item-left">
                <Avatar :account="msg.recipientAccountId" />
                <div class="valid-name-container">
                  <div class="valid-name">
                    <Appellation :account="msg.recipientAccountId" />
                  </div>
                  <div class="valid-action">{{ t("beRejectResultText") }}</div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="valid-item-left">
                <Avatar :account="msg.applicantAccountId" />
                <div class="valid-name-container">
                  <div class="valid-name">
                    <Appellation :account="msg.applicantAccountId" />
                  </div>
                  <div class="valid-action">{{ t("applyFriendText") }}</div>
                </div>
              </div>
              <div class="valid-state">
                <Icon type="icon-shandiao" />
                <span class="valid-state-text">{{
                  t("rejectResultText")
                }}</span>
              </div>
            </template>
          </template>
          <!-- 好友申请 未处理 -->
          <template
            v-else-if="
              msg.status ===
              V2NIMConst.V2NIMFriendAddApplicationStatus
                .V2NIM_FRIEND_ADD_APPLICATION_STATUS_INIT
            "
          >
            <template v-if="!isMeApplicant(msg)">
              <div class="valid-item-left">
                <Avatar :account="msg.applicantAccountId" />
                <div class="valid-name-container">
                  <div class="valid-name">
                    <Appellation :account="msg.applicantAccountId" />
                  </div>
                  <div class="valid-action">{{ t("applyFriendText") }}</div>
                </div>
              </div>
              <div class="valid-buttons">
                <button
                  class="valid-button button-reject"
                  type="button"
                  :disabled="applyFriendLoading"
                  @click="handleRejectApplyFriendClick(msg)"
                >
                  {{ t("rejectText") }}
                </button>
                <button
                  class="valid-button button-accept"
                  type="button"
                  :disabled="applyFriendLoading"
                  @click="handleAcceptApplyFriendClick(msg)"
                >
                  {{ t("acceptText") }}
                </button>
              </div>
            </template>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
/** 验证消息页面 */
import { autorun } from "../../utils/store.js";
import Empty from "../../CommonComponents/Empty.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import { t } from "../../utils/i18n";
import { V2NIMConst } from "../../utils/sdk";
import Appellation from "../../CommonComponents/Appellation.vue";
import { toast } from "../../utils/toast";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  components: {
    Empty,
    Avatar,
    NavBar,
    Icon,
    Appellation,
  },
  data() {
    return {
      validMsg: [],
      applyFriendLoading: false,
      validMsgWatch: null,
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
    this.validMsgWatch = autorun(() => {
      this.validMsg = this.store?.sysMsgStore.friendApplyMsgs || [];
      this.store?.sysMsgStore.friendApplyMsgs?.forEach((item) => {
        this.store?.userStore.getUserActive(item.applicantAccountId);
      });
    });
  },
  beforeDestroy() {
    if (this.validMsgWatch) {
      this.validMsgWatch();
    }
  },
  methods: {
    isMeApplicant(data) {
      return (
        data.applicantAccountId === this.store.userStore.myUserInfo.accountId
      );
    },
    async handleRejectApplyFriendClick(msg) {
      if (this.applyFriendLoading) {
        return;
      }
      this.applyFriendLoading = true;
      try {
        await this.store.friendStore.rejectAddApplicationActive(msg);
        toast.info(t("rejectedText"));
      } catch (error) {
        toast.info(t("rejectFailedText"));
      } finally {
        this.applyFriendLoading = false;
      }
    },
    async handleAcceptApplyFriendClick(msg) {
      if (this.applyFriendLoading) {
        return;
      }
      this.applyFriendLoading = true;
      try {
        try {
          await this.store.friendStore.acceptAddApplicationActive(msg);
          toast.info(t("acceptedText"));
        } catch (error) {
          toast.info(t("acceptFailedText"));
          return;
        }

        const textMsg = nim.V2NIMMessageCreator.createTextMessage(
          t("passFriendAskText")
        );
        await this.store.msgStore.sendMessageActive({
          msg: textMsg,
          conversationId: nim.V2NIMConversationIdUtil.p2pConversationId(
            msg.operatorAccountId
          ),
        });
      } catch (error) {
        console.log("error", error);
      } finally {
        this.applyFriendLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.valid-list-container {
  height: 100vh;
  box-sizing: border-box;
  background-color: #fff;
  overflow-y: auto;
}

.valid-list-content {
  height: calc(100% - 60px - var(--status-bar-height));
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.valid-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.valid-name-container {
  display: flex;
  flex-direction: column;
  margin-left: 10px;
  flex: 1;
  padding-right: 20px;
}

.valid-name {
  font-size: 16px;
  color: #000;
  max-width: 35vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.valid-action {
  color: #888;
  font-size: 14px;
  max-width: 40vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.valid-item-left {
  display: flex;
  align-items: center;
}

.valid-buttons {
  display: flex;
  align-items: center;
}

.valid-button {
  margin: 0;
  padding: 0;
  width: 60px;
  height: 32px;
  line-height: 32px;
  font-family: inherit;
  font-size: 14px;
  text-align: center;
  border-radius: 3px;
  background-color: #fff;
  cursor: pointer;
}

.valid-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.button-reject {
  color: #000;
  border: 1px solid #d9d9d9;
  margin-right: 10px;
}

.button-accept {
  color: #337eef;
  border: 1px solid #337eef;
}

.valid-state {
  display: flex;
  align-items: center;
}

.valid-state-text {
  margin-left: 10px;
  color: #000;
}
</style>
