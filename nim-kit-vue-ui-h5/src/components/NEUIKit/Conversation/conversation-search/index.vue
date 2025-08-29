<template>
  <div class="search-page-wrapper">
    <NavBar :title="t('searchTitleText')" />
    <div class="search-wrapper">
      <div class="search-input-wrapper">
        <div class="search-icon-wrapper">
          <Icon
            iconClassName="search-icon"
            :size="16"
            color="#A6ADB6"
            type="icon-sousuo"
          ></Icon>
        </div>
        <Input
          class="input"
          :modelValue="searchText"
          :inputStyle="{
            backgroundColor: '#F5F7FA',
          }"
          :focus="inputFocus"
          @input="onInput"
          @focus="onInputFocus"
          @blur="onInputBlur"
          :placeholder="t('searchText')"
        />
        <div v-if="searchText" class="clear-icon" @click="clearInput()">
          <Icon type="icon-shandiao" :size="16" />
        </div>
      </div>
    </div>
    <div v-if="searchResult.length > 0" class="search-result-wrapper">
      <div class="search-result-list">
        <div v-for="item in searchResult" :key="item.renderKey">
          <div class="result-title" v-if="item.title == 'friends'">
            {{ t("friendText") }}
          </div>
          <div class="result-title" v-else-if="item.title == 'groups'">
            {{ t("teamText") }}
          </div>
          <div v-else>
            <SearchResultItem :item="item" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="searchResult.length == 0 && searchText">
      <Empty :text="t('searchResultNullText')" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { autorun } from "mobx";
import { ref, onUnmounted, computed, onMounted, getCurrentInstance } from "vue";
import { t } from "../../utils/i18n";
import NavBar from "../../CommonComponents/NavBar.vue";
import Icon from "../../CommonComponents/Icon.vue";
import SearchResultItem from "./search-result-item.vue";
import Empty from "../../CommonComponents/Empty.vue";
import Input from "../../CommonComponents/Input.vue";

const inputFocus = ref(false);

const searchText = ref("");

const searchList = ref<{ id: string; list: any }[]>([]);
const { proxy } = getCurrentInstance()!; // 获取组件实例
const store = proxy?.$UIKitStore;

const searchListWatch = autorun(() => {
  const friends =
    store?.uiStore.friends
      .filter(
        (item) =>
          !proxy?.$UIKitStore.relationStore.blacklist.includes(item.accountId)
      )
      .map((item) => {
        const user = proxy?.$UIKitStore.userStore.users.get(item.accountId) || {
          accountId: "",
          name: "",
          createTime: Date.now(),
        };

        return {
          ...item,
          ...user,
        };
      }) || [];
  const teamList = store?.uiStore.teamList || [];
  searchList.value = [
    {
      id: "friends",
      list: friends,
    },
    {
      id: "groups",
      list: teamList,
    },
  ].filter((item) => !!item.list.length);
});

const searchResult = computed(() => {
  const res: { title?: string; renderKey: string }[] = [];
  if (searchText.value) {
    const finalSections = searchList.value
      .map((item) => {
        if (item.id === "friends") {
          return {
            ...item,
            list: item.list?.filter((item: any) => {
              return (
                item.alias?.includes(searchText.value) ||
                item.name?.includes(searchText.value) ||
                item.accountId?.includes(searchText.value)
              );
            }),
          };
        }

        if (item.id === "groups") {
          return {
            ...item,
            list: item.list?.filter((item: any) => {
              return (item.name || item.teamId).includes(searchText.value);
            }),
          };
        }

        return { ...item };
      })
      .filter((item) => !!item.list?.length);

    finalSections.forEach((item) => {
      if (item.id === "friends") {
        res.push({
          title: "friends",
          renderKey: "friends",
        });
        item.list.forEach((item: any) => {
          res.push({
            ...item,
            renderKey: item.accountId,
          });
        });
      } else if (item.id === "groups") {
        res.push({
          title: "groups",
          renderKey: "groups",
        });
        item.list.forEach((item: any) => {
          res.push({
            ...item,
            renderKey: item.teamId,
          });
        });
      }
    });
  }
  return res;
});

const onInputBlur = () => {
  inputFocus.value = false;
};

const onInputFocus = () => {
  inputFocus.value = true;
};

const onInput = (value) => {
  searchText.value = value;
};

const clearInput = () => {
  inputFocus.value = true;
  searchText.value = "";
};

onMounted(() => {
  inputFocus.value = true;
});

onUnmounted(() => {
  // 移除监听
  searchListWatch();
});
</script>

<style scoped>
.search-page-wrapper {
  height: 100%;
  background-color: #fff;
  overflow: auto;
  box-sizing: border-box;
}
/* 搜索区域样式 */
.search-wrapper {
  padding: 8px 10px;
}

/* 输入框容器 */
.search-input-wrapper {
  height: 40px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  background: #f3f5f7;
  border-radius: 5px;
  padding: 8px 10px;
}

/* 搜索图标容器 */
.search-icon-wrapper {
  margin-right: 5px;
  display: flex;
  align-items: center;
}

/* 表单输入项基础样式 */
.form-input-item {
  border-bottom: 1px solid #dcdfe5;
  padding: 10px 10px 5px 0;
  display: flex;
  height: 44px;
  align-items: center;
}

/* 表单输入项聚焦状态 */
.form-input-item.focus {
  border-color: #337eff;
}

/* 表单输入项错误状态 */
.form-input-item.error {
  border-color: #f56c6c;
}

/* 搜索结果标题 */
.result-title {
  height: 30px;
  color: #c0c0c1;
  font-size: 14px;
  border-bottom: 1px solid #c0c0c1;
}

/* 输入框 */
.input {
  flex: 1;
  height: 30px;
  border: none;
  outline: none;
}

/* 清除图标 */
.clear-icon {
  width: 40px;
  text-align: right;
}

/* 搜索结果容器 */
.search-result-wrapper {
  padding: 0 10px;
}
</style>
