<template>
  <div class="team-set-container">
    <NavBar :title="t('updateAvatarText')" />
    <div class="team-avatar-container">
      <div v-if="hasPermission" @click="triggerFileInput" class="avatar">
        <img
          :lazy-load="true"
          class="avatar-img avatar-img-edit"
          v-if="avatar"
          :src="avatar"
          mode="aspectFill"
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
          :lazy-load="true"
          class="avatar-img"
          v-if="avatar"
          :src="avatar"
          mode="aspectFill"
        />
      </div>
    </div>
    <div v-show="hasPermission" class="team-avatar-arr-container">
      <div class="tip">{{ `${t("chooseDefaultImage")}` }}</div>
      <div class="avatar-arr">
        <img
          :lazy-load="true"
          class="avatar-img"
          :src="avatarArr[0]"
          mode="aspectFill"
          @click="setAvatar(0)"
        />
        <img
          :lazy-load="true"
          class="avatar-img"
          :src="avatarArr[1]"
          mode="aspectFill"
          @click="setAvatar(1)"
        />
        <img
          :lazy-load="true"
          class="avatar-img"
          :src="avatarArr[2]"
          mode="aspectFill"
          @click="setAvatar(2)"
        />
        <img
          :lazy-load="true"
          class="avatar-img"
          :src="avatarArr[3]"
          mode="aspectFill"
          @click="setAvatar(3)"
        />
        <img
          :lazy-load="true"
          class="avatar-img"
          :src="avatarArr[4]"
          mode="aspectFill"
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

<script lang="ts" setup>
import NavBar from "../../CommonComponents/NavBar.vue";
import { ref, getCurrentInstance, onMounted } from "vue";
import { t } from "../../utils/i18n";
import Icon from "../../CommonComponents/Icon.vue";
import RootStore from "@xkit-yx/im-store-v2";
import { useRouter } from "vue-router";
import Button from "../../CommonComponents/Button.vue";
import { toast } from "../../utils/toast";
import { loading } from "../../utils/loading";

const router = useRouter();
const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore as RootStore;
const avatar = ref<string>();
let hasPermission = ref<boolean>(false);

const avatarArr = [
  "https://yx-web-nosdn.netease.im/common/2425b4cc058e5788867d63c322feb7ac/groupAvatar1.png",
  "https://yx-web-nosdn.netease.im/common/62c45692c9771ab388d43fea1c9d2758/groupAvatar2.png",
  "https://yx-web-nosdn.netease.im/common/d1ed3c21d3f87a41568d17197760e663/groupAvatar3.png",
  "https://yx-web-nosdn.netease.im/common/e677d8551deb96723af2b40b821c766a/groupAvatar4.png",
  "https://yx-web-nosdn.netease.im/common/fd6c75bb6abca9c810d1292e66d5d87e/groupAvatar5.png",
];
let teamId = "";

const setAvatar = (index: number) => {
  avatar.value = avatarArr[index];
};
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onChangeAvatar = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // 验证文件类型
  if (!file.type.startsWith("image/")) {
    toast.info(t("请选择图片文件"));
    return;
  }

  try {
    loading.show();
    const result = await store?.storageStore.uploadFileActive(file);
    avatar.value = result;
  } catch (err) {
    toast.info(t("FailAvatarText"));
  } finally {
    loading.hide();
    // 清空 input 的值，这样用户可以重复选择同一个文件
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
};

// 保存群头像
const handleSave = () => {
  store?.teamStore
    .updateTeamActive({
      teamId,
      info: {
        avatar: avatar.value,
      },
    })
    .then(() => {
      toast.info(t("updateTeamSuccessText"));
      router.back();
    })
    .catch(() => {
      toast.info(t("updateTeamFailedText"));
    });
};

onMounted(() => {
  teamId = (router.currentRoute.value.query.teamId as string) || "";

  const myAccount = store?.userStore.myUserInfo.accountId;

  const team = store?.teamStore.teams.get(teamId);
  const updateInfoMode = team?.updateInfoMode;
  avatar.value = team?.avatar || "";
  const myTeamMember = store?.teamMemberStore.getTeamMember(teamId, [
    myAccount,
  ])[0];
  // updateInfoMode 为 0 表示只有管理员和群主可以修改群信息；updateInfoMode 为 1 表示任何人都可以修改群信息
  if (
    (updateInfoMode === 0 && myTeamMember.memberRole !== 0) ||
    updateInfoMode === 1
  ) {
    hasPermission.value = true;
  }
});
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
.avatar-img {
  width: 32px;
  height: 32px;
}
</style>
