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
              @change="handleRadioChange($event, item)"
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
          <label
            class="checkbox-label"
            @click.prevent="handleCheckboxChange($event, item)"
          >
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
    <button v-if="showBtn" class="ok-btn" type="button" @click="onBtnClick">
      {{ btnText || t("okText") }}
    </button>
  </div>
  <Empty v-else :text="t('noFriendText')"></Empty>
</template>

<script>
import Avatar from "./Avatar.vue";
import Appellation from "./Appellation.vue";
import Empty from "./Empty.vue";
import { t } from "../utils/i18n";

export default {
  name: "PersonSelect",
  components: {
    Avatar,
    Appellation,
    Empty,
  },
  props: {
    personList: {
      type: Array,
      default() {
        return [];
      },
    },
    showBtn: {
      type: Boolean,
      default: true,
    },
    btnText: {
      type: String,
      default: "",
    },
    radio: {
      type: Boolean,
      default: false,
    },
    max: {
      type: Number,
      default: Number.MAX_SAFE_INTEGER,
    },
  },
  data() {
    return {
      selectAccount: [],
      t,
    };
  },
  watch: {
    personList: {
      immediate: true,
      handler(personList) {
        this.selectAccount = personList
          .filter((item) => item.checked)
          .map((item) => item.accountId);
      },
    },
  },
  methods: {
    onBtnClick() {
      this.$emit("onBtnClick", [...this.selectAccount]);
    },
    handleRadioChange(event, item) {
      event.preventDefault();
      if (item.disabled || this.max < 1) {
        return;
      }
      const checked = event.target.checked;
      this.selectAccount = checked ? [item.accountId] : [];
      this.$emit("checkboxChange", this.selectAccount);
    },
    handleCheckboxChange(event, item) {
      event.preventDefault();
      if (item.disabled) {
        return;
      }
      const accountId = item.accountId;
      const newChecked = !this.selectAccount.includes(accountId);

      if (newChecked) {
        if (this.selectAccount.length >= this.max) {
          return;
        }
        this.selectAccount = [...this.selectAccount, accountId];
      } else {
        this.selectAccount = this.selectAccount.filter((id) => id !== accountId);
      }
      this.$emit("checkboxChange", this.selectAccount);
    },
  },
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
