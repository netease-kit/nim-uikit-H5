<template>
  <a
    class="msg-file-wrapper"
    target="_blank"
    rel="noopener noreferrer"
    :href="downloadUrl"
    :download="name"
    :showUnderLine="false"
  >
    <div
      :class="!msg.isSelf ? 'msg-file msg-file-in' : 'msg-file msg-file-out'"
    >
      <Icon :type="iconType" :size="32"></Icon>
      <div class="msg-file-content">
        <div class="msg-file-title">
          <div class="msg-file-title-prefix">{{ name }}</div>
          <div class="msg-file-title-suffix">{{ ext }}</div>
        </div>
        <div class="msg-file-size">{{ parseFileSize(size) }}</div>
      </div>
    </div>
  </a>
</template>

<script>
import {
  buildDownloadUrl,
  getFileType,
  parseFileSize,
} from "../../utils";
import Icon from "../../CommonComponents/Icon.vue";

const fileIconMap = {
  pdf: "icon-PPT",
  word: "icon-Word",
  excel: "icon-Excel",
  ppt: "icon-PPT",
  zip: "icon-RAR1",
  txt: "icon-qita",
  img: "icon-tupian2",
  audio: "icon-yinle",
  video: "icon-shipin",
};

export default {
  components: {
    Icon,
  },
  props: {
    msg: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      fileIconMap,
      parseFileSize,
    };
  },
  computed: {
    attachment() {
      return this.msg.attachment || {};
    },
    name() {
      return this.attachment.name || "";
    },
    url() {
      return this.attachment.url || "";
    },
    ext() {
      return this.attachment.ext || "";
    },
    size() {
      return this.attachment.size || 0;
    },
    iconType() {
      return this.fileIconMap[getFileType(this.ext)] || "icon-weizhiwenjian";
    },
    downloadUrl() {
      return buildDownloadUrl(this.url, this.name);
    },
  },
};
</script>

<style scoped>
.msg-file-wrapper {
  height: fit-content;
  display: block;
}
/* 文件消息基础样式 */
.msg-file {
  height: 56px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  border: 1px solid #dee0e2;
}

/* 接收的文件消息 */
.msg-file-in {
  margin-left: 8px;
}

/* 发送的文件消息 */
.msg-file-out {
  margin-right: 8px;
}

/* 文件内容区域 */
.msg-file-content {
  margin-left: 15px;
  max-width: 300px;
  min-width: 0;
}

/* 文件标题区域 */
.msg-file-title {
  color: #000;
  font-size: 14px;
  font-weight: 400;
  display: flex;
}

/* 文件名前缀 */
.msg-file-title-prefix {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}

/* 文件名后缀 */
.msg-file-title-suffix {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 40px;
}

/* 文件名 */
.msg-file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 文件大小 */
.msg-file-size {
  color: #999;
  font-size: 10px;
  margin-top: 4px;
}
</style>
