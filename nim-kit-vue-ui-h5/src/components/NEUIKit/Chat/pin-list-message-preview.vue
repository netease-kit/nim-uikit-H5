<template>
  <template
    v-if="msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT"
  >
    <div
      class="pin-message-preview pin-message-preview-text"
      @click="handleTextPreviewClick"
    >
      <MessageText :msg="msg" />
    </div>
    <PreviewText
      :visible="isPreviewVisible"
      :msg="msg"
      :onClose="() => (isPreviewVisible = false)"
    />
  </template>
  <template
    v-else-if="msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE"
  >
    <img
      class="pin-message-image"
      :src="imageThumbUrl"
      :style="imageRenderStyle"
      :lazy-load="true"
      mode="aspectFill"
      @click="handleImageTouch"
    />
    <PreviewImage
      :visible="isPreviewVisible"
      :image-url="imageUrl"
      :onClose="() => (isPreviewVisible = false)"
    />
  </template>
  <div
    v-else-if="msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO"
    class="pin-message-preview-audio"
  >
    <MessageAudio :msg="msg" mode="audio-in" />
  </div>
  <div
    v-else-if="msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO"
    class="pin-video-msg-wrapper"
    @click="handleVideoTouch"
  >
    <div class="pin-video-play-button">
      <div class="pin-video-play-icon"></div>
    </div>
    <img
      class="pin-message-image"
      :style="imageRenderStyle"
      :src="videoFirstFrameDataUrl"
      :lazy-load="true"
      mode="aspectFill"
    />
  </div>
  <div
    v-else-if="msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE"
    class="pin-message-preview-file"
  >
    <MessageFile :msg="msg" />
  </div>
  <div
    v-else-if="msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_LOCATION"
    class="pin-message-preview-location"
  >
    <MessageLocation :msg="msg" :is-self="msg.isSelf" />
  </div>
  <div
    v-else-if="mergedForwardPayload"
    class="pin-message-preview-merged-card"
    @click="openMergedForward"
  >
    <div class="pin-merged-forward-title">
      {{ mergedForwardTitle }}
    </div>
    <div class="pin-merged-forward-abstracts">
      <div
        v-for="(item, index) in mergedForwardPayload.data?.abstracts || []"
        :key="index"
      >
        <span class="pin-merged-forward-sender">{{ item.senderNick }}: </span>
        <span>{{ item.content }}</span>
      </div>
    </div>
  </div>
  <div v-else class="pin-message-preview">[{{ t("unknowMsgText") }}]</div>
  <MergedForwardModal
    v-if="mergedVisible"
    :visible="mergedVisible"
    :title="mergedForwardTitle"
    :msgs="mergedMsgs"
    @close="mergedVisible = false"
  />
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, ref } from "vue";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/src/types";
import MessageText from "./message/message-text.vue";
import MessageAudio from "./message/message-audio.vue";
import MessageFile from "./message/message-file.vue";
import MessageLocation from "./message/message-location.vue";
import PreviewImage from "../CommonComponents/PreviewImage.vue";
import PreviewText from "../CommonComponents/PreviewText.vue";
import MergedForwardModal from "./message/merged-forward/modal.vue";
import { t } from "../utils/i18n";
import { showToast } from "../utils/toast";
import { getImageAttachmentSize, getImageRenderStyle, getImageThumbUrl } from "../utils/image";
import { normalizeMergedForwardText, parseMergedForwardPayload } from "./message/merged-forward/utils";

const props = defineProps<{
  msg: V2NIMMessageForUI;
}>();

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore;
const isPreviewVisible = ref(false);
const mergedMsgs = ref<V2NIMMessageForUI[]>([]);
const mergedVisible = ref(false);

const mergedForwardPayload = computed(() => parseMergedForwardPayload(props.msg));

const mergedForwardTitle = computed(() => {
  const payload = mergedForwardPayload.value;
  const sessionName = payload?.data?.sessionName || payload?.data?.sessionId || "";
  return `${sessionName}${t("messageOfText")}`;
});

const openMergedForward = async () => {
  if (mergedMsgs.value.length) {
    mergedVisible.value = true;
    return;
  }
  const data = mergedForwardPayload.value?.data;
  try {
    if (!data?.url) throw new Error("url missing");
    const res = await fetch(data.url);
    if (!res.ok) throw new Error("fetch failed");
    const text = await res.text();
    const list = store?.msgStore.deserializeMergeMsgs(
      normalizeMergedForwardText(text)
    ) as V2NIMMessageForUI[];
    if (!list?.length) throw new Error("deserialize failed");
    mergedMsgs.value = list;
    mergedVisible.value = true;
  } catch {
    showToast({
      message: t("getMergedForwardMsgFailedText"),
      type: "error",
      duration: 1000,
    });
  }
};

const imageUrl = computed(() => {
  if (props.msg.messageStatus?.errorCode === 102426) {
    return "https://yx-web-nosdn.netease.im/common/c1f278b963b18667ecba4ee9a6e68047/img-fail.png";
  }
  return (props.msg.attachment as any)?.url || (props.msg.attachment as any)?.file || "";
});

const imageThumbUrl = computed(() => {
  const { width, height } = getImageAttachmentSize(props.msg.attachment);
  return getImageThumbUrl(imageUrl.value, width, height);
});

const imageRenderStyle = computed(() => {
  const { width, height } = getImageAttachmentSize(props.msg.attachment);
  return getImageRenderStyle(width, height, "compact");
});

const videoFirstFrameDataUrl = computed(() => {
  const url = (props.msg.attachment as any)?.url;
  return url ? `${url}${url.includes("?") ? "&" : "?"}vframe=1` : "";
});

const handleImageTouch = () => {
  if (imageUrl.value) {
    isPreviewVisible.value = true;
  }
};

const handleTextPreviewClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest("a")) return;
  isPreviewVisible.value = true;
};

const handleVideoTouch = () => {
  const url = (props.msg.attachment as any)?.url;
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};
</script>

<style scoped>
/* 外层不放 clamp（原因见下一条规则），这里只保留点击预览的手型光标 */
.pin-message-preview-text {
  cursor: pointer;
}

/*
 * 内层 .msg-text 是子组件 message-text.vue 的根节点，且自身带 overflow-y: auto（滚动容器）。
 * -webkit-line-clamp 只能截断「该元素自己布局出来的行」：子元素一旦成为滚动容器（overflow 非 visible），
 * 它的行就不属于祖先的行盒，祖先的 clamp 对它是无效的 —— Chrome 实测：只在外层加 clamp 时会 4 行全展开。
 * 所以三行截断统一落在 .msg-text 自己身上，不依赖外层。
 * 与 react 侧 pin-list/index.less 的 `.pin-message-preview-text > .msg-text` 对齐：
 * 用 :deep() 穿透 scoped，把 clamp 套到 .msg-text 自己身上（顺带用 overflow: hidden 覆盖它的 overflow-y）。
 * max-height 不写：clamp 生效时高度由浏览器按行数自己算（实测加不加都是 60px = 3 行），
 * 写死反而与 line-height 耦合，日后调行高忘改就会切到第三行。
 * 注意必须写成 `> :deep(...)` 只命中子组件根节点 —— message-text.vue 内部的文本片段也是 .msg-text，
 * 用后代选择器会把这些行内 span 变成块级，导致含 emoji / @ / 链接的多段文本被拆成多行。
 */
.pin-message-preview-text > :deep(.msg-text) {
  display: -webkit-box;
  overflow: hidden;
  line-height: 20px;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.pin-message-preview {
  color: #666;
  line-height: 20px;
}

.pin-message-preview-merged-card {
  padding: 12px 16px;
  border: 1px solid #edf0f3;
  border-radius: 8px;
  cursor: pointer;
  line-height: 18px;

  &:active {
    background-color: #f5f6f8;
  }
}

.pin-merged-forward-title {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 500;
  color: #1f2329;
}

.pin-merged-forward-abstracts {
  color: #656a72;
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pin-merged-forward-sender {
  display: inline-block;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  color: #3d4149;
}

.pin-message-image {
  display: block;
  max-width: 100%;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  background: #f5f6f8;
}

.pin-message-preview-audio {
  display: inline-flex;
  max-width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  background: #e8eaed;
}

.pin-message-preview-file {
  max-width: min(320px, 68vw);
}

.pin-message-preview-file :deep(.msg-file-wrapper) {
  max-width: 100%;
}

.pin-video-msg-wrapper {
  box-sizing: border-box;
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.pin-video-play-button {
  width: 42px;
  height: 42px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  z-index: 9;
}

.pin-video-play-icon {
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 15px solid #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-40%, -50%);
}
</style>
