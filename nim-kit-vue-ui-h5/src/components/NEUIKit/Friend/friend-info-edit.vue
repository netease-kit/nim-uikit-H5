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

<script lang="ts" setup>
import NavBar from "../CommonComponents/NavBar.vue";
import { ref, computed, getCurrentInstance } from "vue";
import { t } from "../utils/i18n";
import { toast } from "../utils/toast";
import RootStore from "@xkit-yx/im-store-v2";
import { useRouter } from "vue-router";
import { onMounted } from "vue";
import Input from "../CommonComponents/Input.vue";
const router = useRouter();

const alias = ref<string>();
let accountId = "";

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore as RootStore;

const inputLengthTips = computed(() => {
  return `${alias.value ? alias.value?.length : 0}/${15}`;
});

// 保存备注名称
const handleSave = () => {
  // alias.value 为 null 和空字符串表示删除备注，在此对 alias.value 为 null 的转换成空字符串，否则 sdk 会报错
  console.log(alias.value);
  if (alias.value === null) {
    alias.value = "";
  }
  // 不允许全是空格
  if (alias.value && !alias.value.trim()) {
    toast.info(t("aliasConfirmText"));

    return;
  }

  store.friendStore
    .setFriendInfoActive(accountId, {
      alias: alias.value,
    })
    .then(() => {
      toast.info(t("updateTeamSuccessText"));
      router.back();
    })
    .catch(() => {
      toast.info(t("updateTeamFailedText"));
    });
};

const handleInput = (value: string) => {
  alias.value = value;
};

onMounted(() => {
  accountId = (router.currentRoute.value.query.accountId as string) || "";

  const friend = store.friendStore.friends.get(accountId);

  alias.value = friend ? friend.alias : "";
});
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
