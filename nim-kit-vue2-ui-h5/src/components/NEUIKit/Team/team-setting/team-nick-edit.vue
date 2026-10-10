<template>
  <div class="wrapper">
    <NavBar :title="t('nickInTeam')" :showLeft="true">
      <template v-slot:left>
        <div class="nav-bar-text" @click="back">{{ t("cancelText") }}</div>
      </template>
      <template v-slot:right>
        <div
          class="nav-bar-action"
          :class="{ disabled: savePending }"
          :aria-disabled="savePending"
          @click="onOk"
        >
          {{ t("okText") }}
        </div>
      </template>
    </NavBar>
    <div class="userInfo-item-wrapper">
      <Input
        class="input"
        @focus="onInputFocus"
        :maxlength="15"
        @input="onInputChange"
        v-model="inputValue"
        :placeholder="t('nickInTeam')"
      />
      <div @click="clearInputValue">
        <Icon
          v-show="showClearIcon"
          iconClassName="clear-icon"
          type="icon-shandiao"
        ></Icon>
      </div>
    </div>
  </div>
</template>

<script>
// 此组件用于修改群昵称
import { autorun } from "../../utils/store.js";
import Icon from "../../CommonComponents/Icon.vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { t } from "../../utils/i18n";
import Input from "../../CommonComponents/Input.vue";
import { toast } from "../../utils/toast";
import { nim, uiKitStore } from "../../utils/init.js";
import { ensureTeamMembers } from "../../utils/team.js";

export default {
  components: {
    Icon,
    NavBar,
    Input,
  },
  data() {
    return {
      inputValue: "",
      inputDirty: false,
      savePending: false,
      showClearIcon: false,
      myMemberInfo: null,
      teamId: "",
      uninstallTeamMemberWatch: null,
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
    this.uninstallTeamMemberWatch = autorun(() => {
      const myAccountId = this.store?.userStore.myUserInfo?.accountId;
      this.myMemberInfo = myAccountId
        ? this.store?.teamMemberStore.getTeamMember(this.teamId, [myAccountId])[0]
        : null;
      if (!this.inputDirty) {
        this.inputValue = this.myMemberInfo?.teamNick || "";
      }
      const team = this.store?.teamStore?.teams?.get(this.teamId);
      ensureTeamMembers(this.store, this.teamId, team).catch(() => {
        toast.info(t("networkError"));
      });
    });
  },
  beforeDestroy() {
    if (this.uninstallTeamMemberWatch) {
      this.uninstallTeamMemberWatch();
    }
  },
  methods: {
    onInputChange(event) {
      this.inputDirty = true;
      this.inputValue = event.target.value;
    },
    onInputFocus() {
      this.showClearIcon = true;
    },
    clearInputValue() {
      this.inputDirty = true;
      this.inputValue = "";
    },
    async onOk() {
      if (this.savePending) {
        return;
      }
      this.savePending = true;
      try {
        await this.store?.teamMemberStore.updateMyMemberInfoActive({
          teamId: this.teamId,
          memberInfo: {
            teamNick: this.inputValue.trim(),
          },
        });
        this.back();
      } catch (error) {
        toast.info(t("saveFailedText"));
      } finally {
        this.savePending = false;
      }
    },
    back() {
      this.$router.back();
    },
  },
};
</script>

<style scoped>
.wrapper {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  background-color: rgb(245, 246, 247);
}
.nav-bar-text {
  color: rgb(20, 146, 209);
}

.nav-bar-action.disabled {
  color: #a6adb6;
  pointer-events: none;
}

.userInfo-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  margin: 15px;
  border-radius: 5px;
}
.input {
  display: inline-block;
  width: 85%;
  padding: 6px;
}

.clear-icon {
  margin-right: 5px;
  z-index: 999;
}
</style>
