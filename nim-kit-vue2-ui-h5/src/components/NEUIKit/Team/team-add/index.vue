<template>
  <div class="team-add-wrapper">
    <NavBar :title="t('friendSelectText')">
      <template v-slot:right>
        <div @click="addTeamMember">
          {{ t("okText") }}
        </div>
      </template>
    </NavBar>
    <div class="team-member-select">
      <PersonSelect
        :personList="friendList"
        :showBtn="false"
        @checkboxChange="checkboxChange"
      >
      </PersonSelect>
    </div>
  </div>
</template>

<script>
import PersonSelect from "../../CommonComponents/PersonSelect.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { t } from "../../utils/i18n";
import { debounce } from "../../utils";
import { autorun } from "../../utils/store.js";
import { toast } from "../../utils/toast";
import { nim, uiKitStore } from "../../utils/init.js";
import { ensureTeamMembers } from "../../utils/team.js";

export default {
  name: "TeamAdd",
  components: {
    PersonSelect,
    NavBar,
  },
  data() {
    return {
      friendList: [],
      friendListWatch: null,
      teamId: "",
      newTeamMember: [],
      t,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
  },
  mounted() {
    this.teamId = this.$route.query.teamId || "";

    this.friendListWatch = autorun(() => {
      const team = this.store?.teamStore?.teams?.get(this.teamId);
      const friendList =
        this.store?.uiStore.friends.filter(
          (item) =>
            !this.store?.relationStore.blacklist.includes(item.accountId)
        ) || [];
      const teamMembers = (
        this.store?.teamMemberStore.getTeamMember(this.teamId) || []
      ).map((item) => item.accountId);

      this.friendList = friendList.map((item) => {
        if (teamMembers.includes(item.accountId)) {
          return { accountId: item.accountId, disabled: true };
        }
        return { accountId: item.accountId };
      });
      ensureTeamMembers(this.store, this.teamId, team).catch(() => {
        toast.info(t("networkError"));
      });
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
      this.newTeamMember = selectList;
    },
    addTeamMember: debounce(function () {
      if (this.newTeamMember.length > 200) {
        toast.info(t("maxSelectedText"));
        return;
      }
      if (this.newTeamMember.length === 0) {
        toast.info(t("friendSelect"));
        return;
      }

      this.store?.teamMemberStore
        .addTeamMemberActive({
          teamId: this.teamId,
          accounts: this.newTeamMember,
        })
        .then(() => {
          this.$router.back();
        })
        .catch((err) => {
          switch (err ? err.code : "") {
            case 109306:
              toast.info(t("noPermission"));
              break;
            default:
              toast.info(t("addTeamMemberFailText"));
              break;
          }
        });
    }, 800),
  },
};
</script>

<style scoped>
.team-add-wrapper {
  height: 100%;
  box-sizing: border-box;
  background-color: #fff;
  overflow: hidden;
}

.team-member-select {
  height: calc(100% - 44px);
  overflow: hidden;
}
</style>
