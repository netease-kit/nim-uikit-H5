<template>
  <div class="team-set-container">
    <NavBar :title="type == 'name' ? t('teamTitle') : t('teamIntro')" />
    <div v-if="hasPermission" class="team-name-input-container">
      <Input
        :model-value="inputValue"
        :allow-clear="true"
        :maxlength="maxlength"
        :showClear="true"
        @input="handleInput"
        @clear="handleClear"
        :style="{ height: '40px' }"
      />
      <div class="input-length">{{ inputLengthTips }}</div>
    </div>
    <div v-else class="team-name-input-container">
      <div class="input">{{ inputValue }}</div>
    </div>
    <Button
      :customStyle="{
        background: '#ffffff',
        borderRadius: '8px',
        color: '#5ca1e6',
        padding: '10px',
        fontSize: '16px',
        textAlign: 'center',
        position: 'fixed',
        bottom: '20px',
        height: '40px',
        width: 'calc(100% - 40px)',
        boxSizing: 'border-box',
        margin: '0 20px',
      }"
      v-show="hasPermission"
      @click="handleSave"
    >
      {{ t("saveText") }}
    </Button>
  </div>
</template>

<script>
import NavBar from "../../CommonComponents/NavBar.vue";
import Input from "../../CommonComponents/Input.vue";
import { t } from "../../utils/i18n";
import Button from "../../CommonComponents/Button.vue";
import { toast } from "../../utils/toast";
import { autorun } from "../../utils/store.js";
import { nim, uiKitStore } from "../../utils/init.js";
import { ensureTeamMembers } from "../../utils/team.js";

export default {
  components: {
    NavBar,
    Input,
    Button,
  },
  data() {
    return {
      hasPermission: false,
      inputValue: "",
      inputDirty: false,
      teamId: "",
      type: "",
      teamInfoWatch: null,
      t,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    maxlength() {
      return this.type === "name" ? 30 : 100;
    },
    inputLengthTips() {
      return `${this.inputValue ? this.inputValue.length : 0}/${this.maxlength}`;
    },
  },
  mounted() {
    this.teamId = this.$route.query.teamId || "";
    const editType = this.$route.query.type || "";

    this.type = editType;
    this.teamInfoWatch = autorun(() => {
      const myAccount = this.store?.userStore.myUserInfo?.accountId;
      const myTeamMember = this.store?.teamMemberStore.getTeamMember(
        this.teamId,
        myAccount ? [myAccount] : []
      )[0];
      const team = this.store?.teamStore.teams.get(this.teamId);
      const updateInfoMode = team?.updateInfoMode;

      if (!this.inputDirty) {
        this.inputValue =
          editType === "name"
            ? team?.name?.substring(0, 30) || ""
            : team?.intro || "";
      }
      this.hasPermission =
        updateInfoMode === 1 ||
        (updateInfoMode === 0 &&
          !!myTeamMember &&
          myTeamMember.memberRole !== 0);
      ensureTeamMembers(this.store, this.teamId, team).catch(() => {
        toast.info(t("networkError"));
      });
    });
  },
  beforeDestroy() {
    if (this.teamInfoWatch) {
      this.teamInfoWatch();
      this.teamInfoWatch = null;
    }
  },
  methods: {
    handleClear() {
      this.inputDirty = true;
      this.inputValue = "";
    },
    handleSave() {
      if (!this.inputValue && this.type === "name") {
        toast.info(t("teamTitleConfirmText"));
        return;
      }

      this.store.teamStore
        .updateTeamActive({
          teamId: this.teamId,
          info: {
            [this.type]: this.inputValue,
          },
        })
        .then(() => {
          toast.info(t("updateTeamSuccessText"));
          this.$router.back();
        })
        .catch((err) => {
          switch (err?.code) {
            case 109432:
              toast.info(t("noPermission"));
              break;
            default:
              toast.info(t("updateTeamFailedText"));
              break;
          }
        });
    },
    handleInput(event) {
      const value = event.target.value;
      this.inputDirty = true;
      this.inputValue = value ? value.replace(/\s*/g, "") : value;
    },
  },
};
</script>

<style scoped>
.team-set-container {
  height: 100vh;
  box-sizing: border-box;
  background-color: #eff1f4;
}

.team-name-input-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 0 16px 5px;
  position: relative;
  margin: 10px 20px;
}
.input-length {
  position: absolute;
  right: 25px;
  bottom: 0px;
  font-size: 12px;
  color: #999999;
}
.input {
  padding: 10px 10px 5px 0px;
  height: 30px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
