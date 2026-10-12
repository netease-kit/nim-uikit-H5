<template>
  <div class="team-set-container">
    <NavBar :title="t('updateAvatarText')" />
    <div class="team-avatar-container">
      <div v-if="hasPermission" @click="triggerFileInput" class="avatar">
        <img
          loading="lazy"
          class="avatar-img avatar-img-edit"
          v-if="avatar"
          :src="avatar"
        />
        <div class="choose-picture">
          <Icon :size="24" type="choose-picture" />
        </div>
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          style="display: none"
          @change="onChangeAvatar"
        />
      </div>
      <div v-else class="avatar">
        <img
          loading="lazy"
          class="avatar-img"
          v-if="avatar"
          :src="avatar"
        />
      </div>
    </div>
    <div v-show="hasPermission" class="team-avatar-arr-container">
      <div class="tip">{{ `${t("chooseDefaultImage")}` }}</div>
      <div class="avatar-arr">
        <img
          loading="lazy"
          class="avatar-img"
          :src="avatarArr[0]"
          @click="setAvatar(0)"
        />
        <img
          loading="lazy"
          class="avatar-img"
          :src="avatarArr[1]"
          @click="setAvatar(1)"
        />
        <img
          loading="lazy"
          class="avatar-img"
          :src="avatarArr[2]"
          @click="setAvatar(2)"
        />
        <img
          loading="lazy"
          class="avatar-img"
          :src="avatarArr[3]"
          @click="setAvatar(3)"
        />
        <img
          loading="lazy"
          class="avatar-img"
          :src="avatarArr[4]"
          @click="setAvatar(4)"
        />
      </div>
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
import { t } from "../../utils/i18n";
import Icon from "../../CommonComponents/Icon.vue";
import Button from "../../CommonComponents/Button.vue";
import { toast } from "../../utils/toast";
import { loading } from "../../utils/loading";
import { autorun } from "../../utils/store.js";
import { nim, uiKitStore } from "../../utils/init.js";
import { ensureTeamMembers } from "../../utils/team.js";

const avatarArr = [
  "https://yx-web-nosdn.netease.im/common/2425b4cc058e5788867d63c322feb7ac/groupAvatar1.png",
  "https://yx-web-nosdn.netease.im/common/62c45692c9771ab388d43fea1c9d2758/groupAvatar2.png",
  "https://yx-web-nosdn.netease.im/common/d1ed3c21d3f87a41568d17197760e663/groupAvatar3.png",
  "https://yx-web-nosdn.netease.im/common/e677d8551deb96723af2b40b821c766a/groupAvatar4.png",
  "https://yx-web-nosdn.netease.im/common/fd6c75bb6abca9c810d1292e66d5d87e/groupAvatar5.png",
];

export default {
  components: {
    NavBar,
    Icon,
    Button,
  },
  data() {
    return {
      avatar: "",
      avatarDirty: false,
      hasPermission: false,
      teamId: "",
      teamInfoWatch: null,
      avatarArr,
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

    this.teamInfoWatch = autorun(() => {
      const myAccount = this.store?.userStore.myUserInfo?.accountId;
      const team = this.store?.teamStore.teams.get(this.teamId);
      const updateInfoMode = team?.updateInfoMode;
      const myTeamMember = this.store?.teamMemberStore.getTeamMember(
        this.teamId,
        myAccount ? [myAccount] : []
      )[0];

      if (!this.avatarDirty) {
        this.avatar = team?.avatar || "";
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
    setAvatar(index) {
      this.avatarDirty = true;
      this.avatar = this.avatarArr[index];
    },
    triggerFileInput() {
      this.$refs.fileInput?.click();
    },
    async onChangeAvatar(event) {
      const target = event.target;
      const file = target.files?.[0];
      if (!file) {
        target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.info("请选择图片文件");
        target.value = "";
        return;
      }

      try {
        loading.show();
        const result = await this.store?.storageStore.uploadFileActive(file);
        this.avatarDirty = true;
        this.avatar = result;
      } catch (err) {
        toast.info(t("FailAvatarText"));
      } finally {
        loading.hide();
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = "";
        }
      }
    },
    handleSave() {
      this.store?.teamStore
        .updateTeamActive({
          teamId: this.teamId,
          info: {
            avatar: this.avatar,
          },
        })
        .then(() => {
          toast.info(t("updateTeamSuccessText"));
          this.$router.back();
        })
        .catch(() => {
          toast.info(t("updateTeamFailedText"));
        });
    },
  },
};
</script>

<style scoped>
.team-set-container {
  height: 100%;
  box-sizing: border-box;
  background-color: #eff1f4;
  overflow: hidden;
}

.team-avatar-container {
  background: #ffffff;
  height: 128px;
  border-radius: 8px;
  padding: 16px;
  margin: 10px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.avatar {
  position: relative;
  width: 80px;
  height: 80px;
}
.avatar > .avatar-img-edit {
  display: inline-block;
  width: 80px;
  height: 80px;
  border-radius: 50%;
}
.avatar-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
}
.choose-picture {
  position: absolute;
  right: 0;
  bottom: 10px;
}
.team-avatar-arr-container {
  height: 114px;
  background: #ffffff;
  border-radius: 8px;
  padding: 0 16px;
  margin: 0 20px;
  overflow: auto;
}
.tip {
  font-size: 16px;
  font-weight: normal;
  margin-top: 15px;
  margin-bottom: 24px;
  color: #000;
}
.avatar-arr {
  display: flex;
  justify-content: space-around;
}
.avatar-arr .avatar-img {
  width: 32px;
  height: 32px;
}
</style>
