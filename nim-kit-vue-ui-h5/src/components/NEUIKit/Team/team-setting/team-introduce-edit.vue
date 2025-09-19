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

<script lang="ts" setup>
import NavBar from "../../CommonComponents/NavBar.vue";
import Input from "../../CommonComponents/Input.vue";
import { ref, computed, getCurrentInstance, onMounted } from "vue";
import { t } from "../../utils/i18n";
import RootStore from "@xkit-yx/im-store-v2";
import { useRouter } from "vue-router";
import Button from "../../CommonComponents/Button.vue";
import { toast } from "../../utils/toast";

const router = useRouter();
const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore as RootStore;
let hasPermission = ref<boolean>(false);

const inputValue = ref<string>();
let teamId = "";
// 用于是修改群名称还是群介绍
const type = ref<string>();

const maxlength = computed(() => {
  return type.value === "name" ? 30 : 100;
});

const inputLengthTips = computed(() => {
  return `${inputValue.value ? inputValue.value?.length : 0}/${
    maxlength.value
  }`;
});

const handleClear = () => {
  inputValue.value = "";
};

// 保存群名称/介绍
const handleSave = () => {
  if (!inputValue.value && type.value === "name") {
    toast.info(t("teamTitleConfirmText"));
    return;
  }

  store.teamStore
    .updateTeamActive({
      teamId,
      info: {
        //@ts-ignore
        [type.value]: inputValue.value,
      },
    })
    .then(() => {
      toast.info(t("updateTeamSuccessText"));
      router.back();
    })
    .catch((err: any) => {
      switch (err?.code) {
        case 109432:
          toast.info(t("noPermission"));
          break;
        default:
          toast.info(t("updateTeamFailedText"));
          break;
      }
    });
};

const handleInput = (event) => {
  const value = event.target.value;
  inputValue.value = value ? value.replace(/\s*/g, "") : value;
};

onMounted(() => {
  teamId = (router.currentRoute.value.query.teamId as string) || "";
  let editType = (router.currentRoute.value.query.type as string) || "";

  type.value = editType;
  const myAccount = store.userStore.myUserInfo.accountId;
  const myTeamMember = store.teamMemberStore.getTeamMember(teamId, [
    myAccount,
  ])[0];
  const team = store.teamStore.teams.get(teamId);

  const updateInfoMode = team?.updateInfoMode;
  inputValue.value =
    editType == "name" ? team?.name.substring(0, 30) : team?.intro;
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
