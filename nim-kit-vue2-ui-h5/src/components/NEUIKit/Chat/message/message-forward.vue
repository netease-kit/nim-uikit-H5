<template>
  <div class="message-forward-root">
    <BottomPopup
      v-model="visible"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      :showConfirm="false"
      :showCancel="true"
      :title="t('forwardText')"
    >
      <div class="forward-container">
        <div class="tab-container">
          <div
            class="tab-item"
            :class="{ active: currentTab === 'friend' }"
            @click="switchTab('friend')"
          >
            {{ t("sendToFriend") }}
          </div>
          <div
            class="tab-item"
            :class="{ active: currentTab === 'team' }"
            @click="switchTab('team')"
          >
            {{ t("sendToTeam") }}
          </div>
        </div>

        <div class="list-container">
          <!-- 好友列表 -->
          <div v-if="currentTab === 'friend'" class="friend-list">
            <div
              v-for="friend in friendList"
              :key="friend.accountId"
              class="list-item"
              :class="{ selected: selectedId === friend.accountId }"
              @click="
                () =>
                  selectItem(
                    friend.accountId,
                    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
                  )
              "
            >
              <Avatar :account="friend.accountId" size="40" />
              <div class="item-info">
                <Appellation :account="friend.accountId" />
              </div>
            </div>
          </div>

          <!-- 群聊列表 -->
          <div v-else class="team-list">
            <div
              v-for="team in teamList"
              :key="team.teamId"
              class="list-item"
              :class="{ selected: selectedId === team.teamId }"
              @click="
                () =>
                  selectItem(
                    team.teamId,
                    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
                  )
              "
            >
              <Avatar :account="team.teamId" :avatar="team.avatar" size="40" />
              <div class="item-info">
                <div class="team-name">{{ team.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BottomPopup>
    <ForwardModal
      :forward-modal-visible="forwardModalVisible"
      :forward-to="forwardTo"
      :forward-msg="forwardMsg"
      :forward-conversation-type="forwardConversationType"
      :forward-to-team-info="forwardToTeamInfo"
      @confirm="handleForwardConfirm"
      @cancel="handleForwardCancel"
    />
  </div>
</template>

<script>
import BottomPopup from "../../CommonComponents/BottomPopup.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Appellation from "../../CommonComponents/Appellation.vue";
import { t } from "../../utils/i18n";
import { autorun } from "../../utils/store.js";
import ForwardModal from "./message-forward-modal.vue";
import { V2NIMConst } from "../../utils/sdk";
import { toast } from "../../utils/toast";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  model: {
    prop: "modelValue",
    event: "update:modelValue",
  },
  components: {
    BottomPopup,
    Avatar,
    Appellation,
    ForwardModal,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    msgIdClient: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      forwardConversationType:
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P,
      forwardTo: "",
      forwardMsg: null,
      forwardToTeamInfo: null,
      forwardModalVisible: false,
      currentTab: "friend",
      selectedId: "",
      friendList: [],
      teamList: [],
      friendListWatch: null,
      teamListWatch: null,
      t,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    visible: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
    conversationId() {
      return this.store?.uiStore.selectedConversation;
    },
  },
  mounted() {
    this.friendListWatch = autorun(() => {
      const data =
        this.store?.uiStore.friends
          .filter(
            (item) =>
              !this.store?.relationStore.blacklist.includes(item.accountId)
          )
          .map((item) => ({
            accountId: item.accountId,
            appellation: this.store?.uiStore.getAppellation({
              account: item.accountId,
            }),
          })) || [];

      this.friendList = data;
    });

    this.teamListWatch = autorun(() => {
      this.teamList = this.store?.uiStore.teamList || [];
    });
  },
  beforeDestroy() {
    if (this.friendListWatch) {
      this.friendListWatch();
    }
    if (this.teamListWatch) {
      this.teamListWatch();
    }
  },
  methods: {
    handleForwardConfirm(forwardComment) {
      this.forwardModalVisible = false;

      if (!this.forwardMsg) {
        toast.info(t("getForwardMessageFailed"));
        return;
      }

      const forwardConversationId = nim.V2NIMConversationIdUtil[
        this.forwardConversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
          ? "p2pConversationId"
          : "teamConversationId"
      ](this.forwardTo);

      this.store?.msgStore
        .forwardMsgActive(this.forwardMsg, forwardConversationId, forwardComment)
        .then(() => {
          toast.info(t("forwardSuccessText"));
        })
        .catch(() => {
          toast.info(t("forwardFailedText"));
        })
        .finally(() => {
          this.$emit("close");
        });
    },
    handleForwardCancel() {
      this.forwardModalVisible = false;
    },
    switchTab(tab) {
      this.currentTab = tab;
      this.selectedId = "";
    },
    selectItem(forwardTo, conversationType) {
      this.selectedId = forwardTo;
      this.forwardConversationType = conversationType;
      if (forwardTo && this.msgIdClient) {
        this.forwardTo = forwardTo;
        this.forwardMsg = this.store?.msgStore.getMsg(this.conversationId, [
          this.msgIdClient,
        ])?.[0];

        this.forwardModalVisible = true;
        if (
          conversationType ===
          V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
        ) {
          this.forwardToTeamInfo = this.store?.teamStore.teams.get(forwardTo);
        } else {
          this.forwardToTeamInfo = null;
        }
      }
    },
    handleConfirm() {
      if (!this.selectedId) {
        return;
      }
      this.$emit("forward", this.selectedId, this.currentTab);
      this.visible = false;
    },
    handleCancel() {
      this.visible = false;
    },
  },
};
</script>

<style scoped>
.forward-container {
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-container {
  display: flex;
  padding: 0 10px 10px 10px;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  color: #666;
  font-size: 14px;
}

.tab-item.active {
  color: #337eff;
  position: relative;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background-color: #337eff;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
}

.list-item:hover {
  background-color: #f5f5f5;
}

.list-item.selected {
  background-color: #e6f2ff;
}

.item-info {
  margin-left: 12px;
  flex: 1;
}

.team-name {
  font-size: 14px;
  color: #333;
}
</style>
