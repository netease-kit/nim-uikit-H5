<template>
  <div class="contact-list-container">
    <div
      class="dropdown-mark"
      v-if="addDropdownVisible"
      @touchstart="hideAddDropdown"
    />
    <div class="navigation-bar">
      <div class="logo-box">
        <div>{{ t("contactText") }}</div>
      </div>
      <div :class="buttonClass">
        <div @click="showAddDropdown">
          <Icon type="icon-More" :size="24" />
        </div>
        <div v-if="addDropdownVisible" class="dropdown-container">
          <div class="add-menu-list">
            <div class="add-menu-item" @click="onDropdownClick('addFriend')">
              <div :style="{ marginRight: '5px' }">
                <Icon type="icon-tianjiahaoyou" />
              </div>
              {{ t("addFriendText") }}
            </div>
            <div class="add-menu-item" @click="onDropdownClick('createGroup')">
              <div :style="{ marginRight: '5px' }">
                <Icon type="icon-chuangjianqunzu" />
              </div>
              {{ t("createTeamText") }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="contact-list">
      <div class="contact-item-content">
        <div class="contact-item" @click="handleValidMsgClick">
          <Icon
            iconClassName="contact-item-icon contact-valid-icon"
            :size="42"
            type="icon-yanzheng"
            color="#fff"
          />
          <Badge
            :num="unreadSysMsgCount"
            :style="{ position: 'absolute', top: '5px', left: '45px' }"
          />
          <span class="contact-item-title"> {{ t("validMsgText") }}</span>
          <Icon iconClassName="more-icon" color="#999" type="icon-jiantou" />
        </div>
        <div class="contact-item" @click="handleBlacklistClick">
          <Icon
            iconClassName="contact-item-icon contact-blacklist-icon"
            :size="42"
            type="icon-lahei2"
            color="#fff"
          />
          <span class="contact-item-title"> {{ t("blacklistText") }}</span>
          <Icon iconClassName="more-icon" color="#999" type="icon-jiantou" />
        </div>
        <div class="contact-item" @click="handleGroupContactClick">
          <Icon
            iconClassName="contact-item-icon contact-group-icon"
            :size="42"
            type="icon-team2"
            color="#fff"
          />
          <span class="contact-item-title"> {{ t("teamMenuText") }}</span>
          <Icon iconClassName="more-icon" color="#999" type="icon-jiantou" />
        </div>
      </div>
      <FriendList />
    </div>
  </div>
</template>

<script>
/** 通讯录主界面 */

import Icon from "../../CommonComponents/Icon.vue";
import Badge from "../../CommonComponents/Badge.vue";
import FriendList from "./friend-list.vue";
import { autorun } from "../../utils/store.js";
import { t } from "../../utils/i18n";
import { neUiKitRouterPath } from "../../utils/uikitRouter";
import { trackInit } from "../../utils/reporter";
import { nim, uiKitStore } from "../../utils/init.js";
export default {
  name: "ContactList",
  components: {
    Icon,
    Badge,
    FriendList,
  },
  data() {
    return {
      addDropdownVisible: false,
      unreadSysMsgCount: 0,
      unreadWatch: null,
      buttonClass: "button-box",
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
    trackInit("ContactUIKit", nim?.options?.appkey);
    this.unreadWatch = autorun(() => {
      this.unreadSysMsgCount =
        this.store?.sysMsgStore.getTotalUnreadMsgsCount() || 0;
    });
  },
  beforeDestroy() {
    this.addDropdownVisible = false;
    if (this.unreadWatch) {
      this.unreadWatch();
    }
  },
  methods: {
    onDropdownClick(urlType) {
      const urlMap = {
        addFriend: neUiKitRouterPath.addFriend,
        createGroup: neUiKitRouterPath.teamCreate,
      };
      this.addDropdownVisible = false;
      this.$router.push(urlMap[urlType]);
    },
    handleValidMsgClick() {
      this.store?.sysMsgStore.setAllApplyMsgRead();
      this.$router.push(neUiKitRouterPath.validlist);
    },
    handleBlacklistClick() {
      this.$router.push(neUiKitRouterPath.blacklist);
    },
    handleGroupContactClick() {
      this.$router.push(neUiKitRouterPath.teamlist);
    },
    showAddDropdown() {
      this.addDropdownVisible = true;
    },
    hideAddDropdown() {
      this.addDropdownVisible = false;
    },
  },
};
</script>

<style scoped>
/* 主容器 */
.contact-list-container {
  height: 100%;
  box-sizing: border-box;
  background-color: #fff;
  overflow: auto;
}

/* 导航栏 */
.navigation-bar {
  height: 60px;
  border-bottom: 1px solid #e9eff5;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--status-bar-height);
}

/* Logo 容器 */
.logo-box {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 500;
  color: #000;
}

/* 联系人列表 */
.contact-list {
  height: calc(100% - 60px - var(--status-bar-height));
  box-sizing: border-box;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 60px;
  background-color: #fff;
}

/* 联系人项目内容 */
.contact-item-content {
  padding-bottom: 5px;
  background-color: #eff1f4;
}

/* 联系人项目 */
.contact-item {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  position: relative;
}

/* 联系人项目边框 */
.contact-item:not(:last-child) {
  border-bottom: 1px solid #f5f8fc;
}

/* 联系人图标基础样式 */
.contact-item-icon {
  height: 42px;
  width: 42px;
  border-radius: 50%;
  text-align: center;
  line-height: 39px;
  font-size: 20px;
  color: #fff;
}

/* 验证图标 */
.contact-valid-icon {
  background-color: #60cfa7;
}

/* 黑名单图标 */
.contact-blacklist-icon {
  background-color: #53c3f4;
}

/* 群组图标 */
.contact-group-icon {
  background-color: #be65d9;
}

/* 联系人标题 */
.contact-item-title {
  margin-left: 12px;
  font-size: 16px;
  color: #000;
  flex: 1;
}

/* 更多图标 */
.more-icon {
  margin: 0 16px;
  color: #999999;
}

/* 下拉遮罩 */
.dropdown-mark {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

/* 下拉容器 */
.dropdown-container {
  position: absolute;
  right: 30px;
  min-width: 122px;
  min-height: 40px;
  background-color: #fff;
  border: 1px solid #e6e6e6;
  box-shadow: 0px 4px 7px rgba(133, 136, 140, 0.25);
  border-radius: 8px;
  z-index: 99;
}

/* 添加菜单列表 */
.add-menu-list {
  padding: 15px 10px;
  color: #000;
}

/* 添加菜单项 */
.add-menu-item {
  white-space: nowrap;
  font-size: 16px;
  padding-left: 5px;
  margin-bottom: 10px;
  height: 30px;
  line-height: 30px;
  display: flex;
  align-items: center;
}

/* 最后一个菜单项 */
.add-menu-item:last-child {
  margin-bottom: 0;
}
</style>
