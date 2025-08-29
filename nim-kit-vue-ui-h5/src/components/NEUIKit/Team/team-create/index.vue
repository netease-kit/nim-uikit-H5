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

<script lang="ts" setup>
import PersonSelect, {
  type PersonSelectItem,
} from "../../CommonComponents/PersonSelect.vue";
import { ref, computed, onMounted, getCurrentInstance } from "vue";
import NavBar from "../../CommonComponents/NavBar.vue";
import { t } from "../../utils/i18n";
import { useRouter } from "vue-router";
import { toast } from "../../utils/toast";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
const router = useRouter();

const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;
const friendList = ref<PersonSelectItem[]>([]);

const teamMembers = computed(() => {
  return friendList.value
    .filter((item) => item.checked)
    .map((item) => item.accountId);
});

let p2pConversationId = "";

onMounted(() => {
  p2pConversationId =
    (router.currentRoute.value.query.p2pConversationId as string) || "";

  const list =
    store?.uiStore.friends.filter(
      (item) => !store?.relationStore.blacklist.includes(item.accountId)
    ) || [];
  friendList.value = list
    .map((item) => ({ accountId: item.accountId }))
    .filter((item) => {
      return item.accountId !== p2pConversationId;
    });
});

const checkboxChange = (selectList) => {
  friendList.value = friendList.value.map((item) => {
    return {
      accountId: item.accountId,
      checked: selectList.includes(item.accountId),
    };
  });
  if (selectList.length >= 200) {
    toast.info(t("maxSelectedText"));
    return;
  }
};

const createTeamName = (teamMembers: string[]) => {
  const _memberNickArr: string[] = [];
  teamMembers.map((item) => {
    let appellation = store?.uiStore.getAppellation({ account: item });
    if (appellation) {
      _memberNickArr.push(appellation);
    }
  });

  const _ownerName =
    store?.userStore.myUserInfo.name || store?.userStore.myUserInfo.accountId;
  const _teamName = (_ownerName + "、" + _memberNickArr.join("、")).slice(
    0,
    30
  );
  return _teamName;
};

const createTeamAvatar = () => {
  const teamAvatarArr = [
    "https://yx-web-nosdn.netease.im/common/2425b4cc058e5788867d63c322feb7ac/groupAvatar1.png",
    "https://yx-web-nosdn.netease.im/common/62c45692c9771ab388d43fea1c9d2758/groupAvatar2.png",
    "https://yx-web-nosdn.netease.im/common/d1ed3c21d3f87a41568d17197760e663/groupAvatar3.png",
    "https://yx-web-nosdn.netease.im/common/e677d8551deb96723af2b40b821c766a/groupAvatar4.png",
    "https://yx-web-nosdn.netease.im/common/fd6c75bb6abca9c810d1292e66d5d87e/groupAvatar5.png",
  ];
  const _index = Math.floor(Math.random() * 5);
  return teamAvatarArr[_index];
};

let flag = false;

const createTeam = async () => {
  try {
    if (flag) return;
    if (teamMembers?.value?.length == 0) {
      toast.info(t("friendSelect"));
      return;
    }

    if (teamMembers?.value?.length > 200) {
      toast.info(t("maxSelectedText"));
      return;
    }
    flag = true;

    const team = await store?.teamStore.createTeamActive({
      accounts: p2pConversationId
        ? [...teamMembers.value, p2pConversationId]
        : [...teamMembers.value],
      avatar: createTeamAvatar(),
      name: createTeamName(teamMembers.value),
    });
    let teamId = team?.teamId;
    if (teamId) {
      store?.uiStore.selectConversation(
        nim.V2NIMConversationIdUtil.teamConversationId(teamId)
      );
      router.push(neUiKitRouterPath.chat);
    }

    toast.info(t("createTeamSuccessText"));
  } catch (error) {
    toast.info(t("createTeamFailedText"));
  } finally {
    flag = false;
  }
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
