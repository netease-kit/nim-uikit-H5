<template>
  <div v-if="personList.length > 0" class="friend-select-wrapper">
    <div class="member-wrapper">
      <!-- 单选模式 -->
      <div v-if="radio" class="radio-group">
        <div
          class="member-item"
          v-for="item in personList"
          :key="item.accountId"
        >
          <label class="radio-label">
            <input
              type="radio"
              class="radio-input"
              :value="item.accountId"
              :checked="selectAccount.includes(item.accountId)"
              :disabled="
                item.disabled ||
                (selectAccount.length >= max &&
                  !selectAccount.includes(item.accountId))
              "
              @change="handleRadioChange($event, item.accountId)"
            />
            <span class="radio-custom"></span>
            <Avatar class="user-avatar" size="36" :account="item.accountId" />
            <div class="user-name">
              <Appellation :account="item.accountId" :teamId="item.teamId" />
            </div>
          </label>
        </div>
      </div>
      <!-- 多选模式 -->
      <div v-else class="checkbox-group">
        <div
          class="member-item"
          v-for="item in personList"
          :key="item.accountId"
        >
          <!-- 修改多选模式部分 -->
          <label class="checkbox-label" @click.prevent="handleCheckboxChange($event, item.accountId)">
            <input
              type="checkbox"
              class="checkbox-input"
              :value="item.accountId"
              :checked="selectAccount.includes(item.accountId)"
              :disabled="
                item.disabled ||
                (selectAccount.length >= max &&
                  !selectAccount.includes(item.accountId))
              "
            />
            <span class="checkbox-custom"></span>
            <Avatar class="user-avatar" size="36" :account="item.accountId" />
            <div class="user-name">
              <Appellation :account="item.accountId" :teamId="item.teamId" />
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
  <Empty v-else :text="t('noFriendText')"></Empty>
</template>

<script lang="ts" setup>
import Avatar from "./Avatar.vue";
import Appellation from "./Appellation.vue";
import Empty from "./Empty.vue";
import { t } from "../utils/i18n";
import { ref, onMounted } from "vue";

export type PersonSelectItem = {
  accountId: string;
  teamId?: string;
  disabled?: boolean;
  checked?: boolean;
};

const props = withDefaults(
  defineProps<{
    personList: PersonSelectItem[];
    showBtn?: boolean;
    btnText?: string;
    radio?: boolean;
    max?: number;
  }>(),
  {
    showBtn: true,
    btnText: "",
    radio: false,
    max: Number.MAX_SAFE_INTEGER,
  }
);

const selectAccount = ref<string[]>([]);

onMounted(() => {
  selectAccount.value = props.personList
    .filter((item) => item.checked)
    .map((item) => item.accountId);
});

const $emit = defineEmits<{
  (event: "checkboxChange", selectList: string | string[]): void;
  (event: "onBtnClick"): void;
}>();

const onBtnClick = () => {
  $emit("onBtnClick");
};

const handleRadioChange = (event: Event, accountId: string) => {
  event.preventDefault(); // 添加这行，阻止默认行为

  const checked = (event.target as HTMLInputElement).checked;
  selectAccount.value = checked ? [accountId] : [];
  $emit("checkboxChange", selectAccount.value);
};

const handleCheckboxChange = (event: Event, accountId: string) => {
  event.preventDefault(); // 添加这行，阻止默认行为
  const newChecked = !selectAccount.value.includes(accountId);
  
  if (newChecked) {
    selectAccount.value = [...selectAccount.value, accountId];
  } else {
    selectAccount.value = selectAccount.value.filter((id) => id !== accountId);
  }
  $emit("checkboxChange", selectAccount.value);
};
</script>

<style scoped>
/* 好友选择容器 */
.friend-select-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 成员列表容器 */
.member-wrapper {
  overflow-y: auto;
  height: 100%;
  width: 100%;
  padding-top: 10px;
  display: flex;
  flex-direction: column; /* 添加这行 */
  overflow-y: auto;
  overflow-x: hidden;
}

/* 成员项 */
.member-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 20px;
}

/* 用户头像 */
.member-item .user-avatar {
  margin: 0 14px;
}

/* 用户名称 */
.member-item .user-name {
  max-width: 230px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #000;
  font-size: 16px;
}

/* 复选框 */
.member-item .checkbox {
  margin-right: 8px;
}

/* 确认按钮 */
.ok-btn {
  margin-bottom: 15px;
}

/* 自定义单选框样式 */
.radio-label,
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
}

.radio-input,
.checkbox-input {
  position: absolute;
  opacity: 0;
}

.radio-custom,
.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #dcdfe6;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s;
}

.checkbox-custom {
  border-radius: 2px;
}

.radio-input:checked + .radio-custom::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  background: #337eff;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.checkbox-input:checked + .checkbox-custom {
  background: #337eff;
  border-color: #337eff;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg) translate(0, -2px);
}

.radio-input:disabled + .radio-custom,
.checkbox-input:disabled + .checkbox-custom {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  cursor: not-allowed;
}
</style>
