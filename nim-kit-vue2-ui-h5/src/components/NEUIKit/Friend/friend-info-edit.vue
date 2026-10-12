<template>
  <div class="group-set-container">
    <NavBar :title="t('remarkText')">
      <template v-slot:right>
        <div @click="handleSave">
          {{ t("saveText") }}
        </div>
      </template>
    </NavBar>
    <div class="group-name-input-container">
      <Input
        :model-value="alias"
        :allow-clear="true"
        :maxlength="15"
        @input="handleInput"
        @clear="alias = ''"
        :show-clear="true"
        :placeholder="t('friendEditPlaceholder')"
      />
      <div class="input-length">{{ inputLengthTips }}</div>
    </div>
  </div>
</template>

<script>
import NavBar from "../CommonComponents/NavBar.vue";
import { t } from "../utils/i18n";
import { toast } from "../utils/toast";
import Input from "../CommonComponents/Input.vue";
import { nim, uiKitStore } from "../utils/init.js";

export default {
  components: {
    NavBar,
    Input,
  },
  data() {
    return {
      alias: "",
      accountId: "",
      t,
      nim,
    };
  },
  computed: {
    store() {
      return uiKitStore;
    },
    inputLengthTips() {
      return `${this.alias ? this.alias.length : 0}/15`;
    },
  },
  mounted() {
    this.accountId = this.$route.query.accountId || "";
    const friend = this.store.friendStore.friends.get(this.accountId);
    this.alias = friend ? friend.alias : "";
  },
  methods: {
    handleSave() {
      if (this.alias === null) {
        this.alias = "";
      }
      if (this.alias && !this.alias.trim()) {
        toast.info(t("aliasConfirmText"));
        return;
      }

      this.store.friendStore
        .setFriendInfoActive(this.accountId, {
          alias: this.alias,
        })
        .then(() => {
          toast.info(t("updateTeamSuccessText"));
          this.$router.back();
        })
        .catch(() => {
          toast.info(t("updateTeamFailedText"));
        });
    },
    handleInput(event) {
      this.alias = event.target.value;
    },
  },
};
</script>

<style scoped>
.group-set-container {
  height: 100%;
  box-sizing: border-box;
  background-color: #eff1f4;
}

.group-name-input-container {
  background: #ffffff;
  border-radius: 8px;
  padding: 0 16px 5px;
  position: relative;
  margin: 10px 20px;
}
.input-length {
  position: absolute;
  right: 25px;
  bottom: 5px;
  font-size: 12px;
  color: #999999;
}
</style>
