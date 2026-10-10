<template>
  <div class="create-team-container">
    <NavBar :title="t('createTeamText')">
      <template v-slot:right>
        <div @click="createTeam">
          {{ t("okText") }}
        </div>
      </template>
    </NavBar>
    <div class="create-team-content">
      <PersonSelect
        :personList="friendList"
        @checkboxChange="checkboxChange"
        :radio="false"
        :showBtn="false"
      >
      </PersonSelect>
    </div>
  </div>
</template>

<script>
import PersonSelect from "../../CommonComponents/PersonSelect.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { t } from "../../utils/i18n";
import { autorun } from "../../utils/store.js";
import { toast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { nim, uiKitStore } from "../../utils/init.js";

const teamAvatarArr = [
  "https://yx-web-nosdn.netease.im/common/2425b4cc058e5788867d63c322feb7ac/groupAvatar1.png",
  "https://yx-web-nosdn.netease.im/common/62c45692c9771ab388d43fea1c9d2758/groupAvatar2.png",
  "https://yx-web-nosdn.netease.im/common/d1ed3c21d3f87a41568d17197760e663/groupAvatar3.png",
  "https://yx-web-nosdn.netease.im/common/e677d8551deb96723af2b40b821c766a/groupAvatar4.png",
  "https://yx-web-nosdn.netease.im/common/fd6c75bb6abca9c810d1292e66d5d87e/groupAvatar5.png",
];

export default {
  name: "TeamCreate",
  components: {
    PersonSelect,
    NavBar,
  },
  data() {
    return {
      friendList: [],
      friendListWatch: null,
      p2pConversationId: "",
      flag: false,
      t,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    teamMembers() {
      return this.friendList
        .filter((item) => item.checked)
        .map((item) => item.accountId);
    },
  },
  mounted() {
    this.p2pConversationId = this.$route.query.p2pConversationId || "";

    this.friendListWatch = autorun(() => {
      const selectedAccounts = new Set(
        this.friendList
          .filter((item) => item.checked)
          .map((item) => item.accountId)
      );
      const list =
        this.store?.uiStore.friends.filter(
          (item) =>
            !this.store?.relationStore.blacklist.includes(item.accountId)
        ) || [];

      this.friendList = list
        .filter((item) => item.accountId !== this.p2pConversationId)
        .map((item) => ({
          accountId: item.accountId,
          checked: selectedAccounts.has(item.accountId),
        }));
    });
  },
  beforeDestroy() {
    if (this.friendListWatch) {
      this.friendListWatch();
      this.friendListWatch = null;
    }
  },
  methods: {
    checkboxChange(selectList) {
      this.friendList = this.friendList.map((item) => {
        return {
          accountId: item.accountId,
          checked: selectList.includes(item.accountId),
        };
      });
      if (selectList.length >= 200) {
        toast.info(t("maxSelectedText"));
      }
    },
    createTeamName(teamMembers) {
      const memberNickArr = [];
      teamMembers.forEach((item) => {
        const appellation = this.store?.uiStore.getAppellation({ account: item });
        if (appellation) {
          memberNickArr.push(appellation);
        }
      });

      const ownerName =
        this.store?.userStore.myUserInfo.name ||
        this.store?.userStore.myUserInfo.accountId;
      return `${ownerName}、${memberNickArr.join("、")}`.slice(0, 30);
    },
    createTeamAvatar() {
      return teamAvatarArr[Math.floor(Math.random() * teamAvatarArr.length)];
    },
    async createTeam() {
      try {
        if (this.flag) {
          return;
        }
        if (this.teamMembers.length === 0) {
          toast.info(t("friendSelect"));
          return;
        }
        if (this.teamMembers.length > 200) {
          toast.info(t("maxSelectedText"));
          return;
        }
        this.flag = true;

        const team = await this.store?.teamStore.createTeamActive({
          accounts: this.p2pConversationId
            ? [...this.teamMembers, this.p2pConversationId]
            : [...this.teamMembers],
          avatar: this.createTeamAvatar(),
          name: this.createTeamName(this.teamMembers),
        });
        const teamId = team?.teamId;
        if (teamId) {
          this.store?.uiStore.selectConversation(
            nim.V2NIMConversationIdUtil.teamConversationId(teamId)
          );
          this.$router.push(neUiKitRouterPath.chat);
        }

        toast.info(t("createTeamSuccessText"));
      } catch (error) {
        toast.info(t("createTeamFailedText"));
      } finally {
        this.flag = false;
      }
    },
  },
};
</script>

<style scoped>
.create-team-container {
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
  background-color: #fff;
}
.create-team-content {
  height: calc(100% - 60px);
}
.select-wrapper {
  flex: 1;
}

.create-btn {
  color: #fff;
  background-color: rgb(20, 146, 209);
  padding: 10px;
  font-size: 16px;
  text-align: center;
}

.team-input-wrapper {
  display: flex;
  align-items: center;
}
.team-input {
  margin: 10px;
  background-color: #f2f4f5;
  padding: 4px;
  border-radius: 5px;
  flex: 1;
}

.button {
  width: 65px;
  height: 30px;
  font-size: 12px;
  text-align: center;
  line-height: 30px;
  margin-right: 5px;
  padding: 0;
  color: #5c9bed;
}

.placeholder {
  color: #a6adb6;
}
</style>
