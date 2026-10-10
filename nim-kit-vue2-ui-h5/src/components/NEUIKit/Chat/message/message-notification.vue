<template>
  <div v-if="notificationContent" class="msg-noti">
    {{ notificationContent }}
  </div>
</template>

<script>
import { ALLOW_AT } from "../../utils/constants";
import { t } from "../../utils/i18n";
import { V2NIMConst } from "../../utils/sdk";
import { autorun } from "../../utils/store.js";
import { nim, uiKitStore } from "../../utils/init.js";

export default {
  props: {
    msg: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      notificationContent: "",
      notificationContentWatch: null,
      ALLOW_AT,
      V2NIMConst,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    teamId() {
      return this.msg.conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
        ? this.msg.receiverId
        : "";
    },
  },
  mounted() {
    this.notificationContentWatch = autorun(() => {
      this.notificationContent = this.getNotificationContent();
    });
  },
  beforeDestroy() {
    if (this.notificationContentWatch) {
      this.notificationContentWatch();
    }
  },
  methods: {
    getNotificationContent() {
      const attachment = this.msg.attachment;
      switch (attachment?.type) {
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_UPDATE_TINFO: {
        const team = attachment?.updatedTeamInfo || {};
        const content = [];

        if (team.avatar !== undefined) {
          content.push(t("updateTeamAvatar"));
        }
        if (team.name !== undefined) {
          content.push(`${t("updateTeamName")}“${team.name}”`);
        }
        if (team.intro !== undefined) {
          content.push(t("updateTeamIntro"));
        }
        if (team.inviteMode !== undefined) {
          content.push(
            `${t("updateTeamInviteMode")}“${
              team.inviteMode ===
              V2NIMConst.V2NIMTeamInviteMode.V2NIM_TEAM_INVITE_MODE_ALL
                ? t("teamAll")
                : t("teamOwnerAndManagerText")
            }”`
          );
        }
        if (team.updateInfoMode !== undefined) {
          content.push(
            `${t("updateTeamUpdateTeamMode")}“${
              team.updateInfoMode ===
              V2NIMConst.V2NIMTeamUpdateInfoMode.V2NIM_TEAM_UPDATE_INFO_MODE_ALL
                ? t("teamAll")
                : t("teamOwnerAndManagerText")
            }”`
          );
        }
        if (team.chatBannedMode !== void 0) {
          content.push(
            `${t("updateTeamMute")}${
              team.chatBannedMode ===
              V2NIMConst.V2NIMTeamChatBannedMode
                .V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN
                ? t("closeText")
                : t("openText")
            }`
          );
        }
        if (team.serverExtension) {
          let ext = {};
          try {
            ext = JSON.parse(team.serverExtension);
          } catch (error) {
            //
          }
          if (ext[ALLOW_AT] !== undefined) {
            content.push(
              `${t("updateAllowAt")}“${
                ext[ALLOW_AT] === "manager"
                  ? t("teamOwnerAndManagerText")
                  : t("teamAll")
              }”`
            );
          }
        }
        return content.length
          ? `${uiKitStore.uiStore.getAppellation({
              account: this.msg.senderId,
              teamId: this.teamId,
            })} ${content.join("、")}`
          : "";
      }
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_APPLY_PASS:
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_INVITE_ACCEPT: {
        return `${uiKitStore.uiStore.getAppellation({
          account: this.msg.senderId,
          teamId: this.teamId,
        })} ${t("joinTeamText")}`;
      }
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_INVITE: {
        const accounts = attachment?.targetIds || [];
        accounts.forEach(async (item) => {
          await uiKitStore.userStore.getUserActive(item);
        });
        const nicks = accounts
          .map((item) => {
            return uiKitStore.uiStore.getAppellation({
              account: item,
              teamId: this.teamId,
            });
          })
          .filter((item) => !!item)
          .join("、");

        return `${nicks} ${t("joinTeamText")}`;
      }
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_KICK: {
        const accounts = attachment?.targetIds || [];
        accounts.forEach(async (item) => {
          await uiKitStore.userStore.getUserActive(item);
        });
        const nicks = accounts
          .map((item) => {
            return uiKitStore.uiStore.getAppellation({
              account: item,
              teamId: this.teamId,
            });
          })
          .filter((item) => !!item)
          .join("、");

        return `${nicks} ${t("beRemoveTeamText")}`;
      }
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_ADD_MANAGER: {
        const accounts = attachment?.targetIds || [];
        accounts.forEach(async (item) => {
          await uiKitStore.userStore.getUserActive(item);
        });
        const nicks = accounts
          .map((item) => {
            return uiKitStore.uiStore.getAppellation({
              account: item,
              teamId: this.teamId,
            });
          })
          .filter((item) => !!item)
          .join("、");

        return `${nicks} ${t("beAddTeamManagersText")}`;
      }
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_REMOVE_MANAGER: {
        const accounts = attachment?.targetIds || [];
        accounts.forEach(async (item) => {
          await uiKitStore.userStore.getUserActive(item);
        });
        const nicks = accounts
          .map((item) => {
            return uiKitStore.uiStore.getAppellation({
              account: item,
              teamId: this.teamId,
            });
          })
          .filter((item) => !!item)
          .join("、");

        return `${nicks} ${t("beRemoveTeamManagersText")}`;
      }
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_LEAVE: {
        return `${uiKitStore.uiStore.getAppellation({
          account: this.msg.senderId,
          teamId: this.teamId,
        })} ${t("leaveTeamText")}`;
      }
      case V2NIMConst.V2NIMMessageNotificationType
        .V2NIM_MESSAGE_NOTIFICATION_TYPE_TEAM_OWNER_TRANSFER: {
        return `${uiKitStore.uiStore.getAppellation({
          account: (attachment?.targetIds || [])[0],
          teamId: this.teamId,
        })} ${t("newGroupOwnerText")}`;
      }
      default:
        return "";
      }
    }
  },
};
</script>

<style scoped>
.msg-noti {
  margin: 8px auto 0;
  text-align: center;
  font-size: 14px;
  color: #b3b7bc;
  max-width: 70%;
}
</style>
