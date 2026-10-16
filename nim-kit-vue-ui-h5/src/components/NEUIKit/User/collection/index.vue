<template>
  <div class="collection-wrapper">
    <NavBar :title="t('collectionText')" backgroundColor="transparent" />
    <div v-if="loading" class="collection-loading">
      {{ t("loadingMoreText") }}
    </div>
    <Empty v-else-if="items.length === 0" :text="t('noCollectionsText')" />
    <div v-else ref="listRef" class="collection-list" @scroll="handleScroll">
      <div
        v-for="item in items"
        :key="item.collection.collectionId || item.collection.uniqueId"
        class="collection-list-item"
        @click="handleItemClick(item.msg)"
      >
        <div class="collection-list-item-header">
          <Avatar
            :account="item.msg.senderId"
            :teamId="getConversationTargetId(item.msg)"
            size="40"
          />
          <div class="collection-list-item-meta">
            <div class="collection-list-item-name">
              {{ getSenderName(item.msg) }}
            </div>
            <div class="collection-conversation-name">
              {{ t("collectionFromText") }} {{ getConversationName(item.msg) }}
            </div>
          </div>
          <div class="collection-list-more" @click.stop="openActionPopup(item)">
            <Icon type="icon-More" :size="22" />
          </div>
        </div>
        <div class="collection-list-item-content">
          <!-- 多包一层容器，和 react 侧结构一致：clamp 样式必须只作用在 MessageText 的根节点上。
               若把类名直接挂在 MessageText 上，后代选择器会连内部的文本片段 span 一起命中，
               它们被变成块级盒子后，表情就会被挤到下一行 -->
          <div
            v-if="
              item.msg.messageType ===
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
            "
            class="collection-message-preview collection-message-preview-text"
          >
            <MessageText :msg="item.msg" />
          </div>
          <img
            v-else-if="
              item.msg.messageType ===
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE
            "
            class="collection-message-image"
            :src="getCollectionImageThumbUrl(item.msg)"
            :style="getCollectionImageStyle(item.msg)"
          />
          <div
            v-else-if="
              item.msg.messageType ===
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO
            "
            class="collection-audio-preview"
            @click.stop
          >
            <div class="msg-bg msg-bg-in">
              <MessageAudio
                :msg="item.msg"
                mode="audio-in"
                broadcastNewAudioSrc=""
              />
            </div>
          </div>
          <div
            v-else-if="
              item.msg.messageType ===
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO
            "
            class="collection-video-message"
          >
            <div class="collection-video-play-button">
              <div class="collection-video-play-icon"></div>
            </div>
            <img
              class="collection-video-cover"
              :src="getVideoFirstFrameUrl(item.msg)"
              :style="getCollectionImageStyle(item.msg)"
            />
          </div>
          <div
            v-else-if="
              item.msg.messageType ===
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE
            "
            class="collection-file-preview"
            @click.stop
          >
            <MessageFile :msg="item.msg" />
          </div>
          <div
            v-else-if="
              item.msg.messageType ===
              V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_LOCATION
            "
            class="collection-location-preview"
            @click.stop
          >
            <MessageLocation :msg="item.msg" :is-self="item.msg.isSelf" />
          </div>
          <div
            v-else-if="isMergedForward(item.msg)"
            class="collection-merged-card"
          >
            <div class="collection-merged-title">
              {{ getMergedForwardTitle(item.msg) }}
            </div>
            <div class="collection-merged-abstracts">
              <div
                v-for="(abstract, idx) in getMergedForwardAbstracts(item.msg)"
                :key="idx"
              >
                <span class="collection-merged-sender">{{ abstract.senderNick }}: </span>
                <span>{{ abstract.content }}</span>
              </div>
            </div>
          </div>
          <div v-else class="collection-message-preview">
            {{ getMessagePreview(item.msg) }}
          </div>
        </div>
        <div class="collection-list-item-time">
          {{ formatCollectionTime(item.collectionTime) }}
        </div>
      </div>
      <div v-if="loadingMore" class="collection-load-more">
        {{ t("loadingMoreText") }}
      </div>
      <div v-else-if="!hasMore" class="collection-load-more">
        {{ t("noMoreText") }}
      </div>
    </div>

    <ActionSheet
      v-model="actionPopupVisible"
      :actions="actionSheetActions"
      @close="closeActionPopup"
    />

    <MessageForward
      v-if="forwardMsg"
      v-model="forwardVisible"
      :msgIdClient="forwardMsg.messageClientId"
      :conversation-id="forwardMsg.conversationId"
      :msg="forwardMsg"
      @close="closeForward"
    />

    <PreviewImage
      v-if="
        previewMsg?.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE
      "
      :visible="true"
      :imageUrl="getAttachmentUrl(previewMsg)"
      :onClose="closePreview"
    />

    <div
      v-else-if="
        previewMsg?.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO
      "
      class="collection-preview-mask"
    >
      <div class="collection-video-preview">
        <video :src="getAttachmentUrl(previewMsg)" controls autoplay />
      </div>
      <button class="collection-preview-close" @click="closePreview" type="button" aria-label="关闭">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="14" fill="#4C4C4C"/>
          <line x1="9" y1="9" x2="18.5" y2="18.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          <line x1="19" y1="9" x2="9.5" y2="18.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <PreviewText
      v-else-if="
        previewMsg?.messageType ===
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
      "
      :visible="true"
      :msg="previewMsg"
      :onClose="closePreview"
    />

    <MergedForwardModal
      v-if="mergedVisible"
      :visible="mergedVisible"
      :title="mergedForwardTitle"
      :msgs="mergedMsgs"
      @close="mergedVisible = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, onMounted, ref } from "vue";
import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import type {
  V2NIMCollection,
  V2NIMCollectionOption,
  V2NIMMessageFileAttachment,
} from "nim-web-sdk-ng/dist/esm/nim/src/V2NIMMessageService";
import type { V2NIMMessageForUI } from "@xkit-yx/im-store-v2/dist/types/src/types";
import dayjs from "dayjs";
import NavBar from "../../CommonComponents/NavBar.vue";
import Avatar from "../../CommonComponents/Avatar.vue";
import Empty from "../../CommonComponents/Empty.vue";
import Icon from "../../CommonComponents/Icon.vue";
import ActionSheet from "../../CommonComponents/ActionSheet.vue";
import PreviewImage from "../../CommonComponents/PreviewImage.vue";
import PreviewText from "../../CommonComponents/PreviewText.vue";
import MessageForward from "../../Chat/message/message-forward.vue";
import MessageText from "../../Chat/message/message-text.vue";
import MessageAudio from "../../Chat/message/message-audio.vue";
import MessageFile from "../../Chat/message/message-file.vue";
import MessageLocation from "../../Chat/message/message-location.vue";
import MergedForwardModal from "../../Chat/message/merged-forward/modal.vue";
import { t } from "../../utils/i18n";
import { copyText } from "../../utils";
import { buildFileDownloadUrl } from "../../utils/file";
import { showModal } from "../../utils/modal";
import { showToast } from "../../utils/toast";
import { getMsgContentTipByType } from "../../utils/msg";
import {
  getMessageCollectionConverter,
  MessageCollectionItem,
  normalizeMessageCollections,
} from "../../utils/collection";
import { getImageAttachmentSize, getImageRenderStyle, getImageThumbUrl } from "../../utils/image";
import { normalizeMergedForwardText, parseMergedForwardPayload } from "../../Chat/message/merged-forward/utils";

const PAGE_SIZE = 20;

const { proxy } = getCurrentInstance()!;
const store = proxy?.$UIKitStore;
const nim = proxy?.$NIM;
const items = ref<MessageCollectionItem[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const listRef = ref<HTMLElement>();
const lastCollection = ref<V2NIMCollection>();
const actionCollectionId = ref("");
const forwardVisible = ref(false);
const forwardMsg = ref<V2NIMMessageForUI>();
const previewMsg = ref<V2NIMMessageForUI>();
const mergedMsgs = ref<V2NIMMessageForUI[]>([]);
const mergedVisible = ref(false);
const mergedForwardTitle = ref("");
const converter = computed(() => getMessageCollectionConverter(nim));

const actionItem = computed(() =>
  items.value.find(
    (item) => item.collection.collectionId === actionCollectionId.value
  )
);
const actionPopupVisible = computed({
  get: () => !!actionItem.value,
  set: (value: boolean) => {
    if (!value) {
      closeActionPopup();
    }
  },
});
const actionSheetActions = computed(() => {
  const item = actionItem.value;
  if (!item) return [];
  const canForward = item.msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_AUDIO
    && item.msg.messageType !== V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_CALL;
  return [
    { text: t("deleteText"), onClick: () => handleDelete(item) },
    ...(item.msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT
      ? [{ text: t("copyText"), onClick: () => handleCopy(item.msg) }]
      : []),
    ...(canForward ? [{ text: t("forwardText"), onClick: () => handleForward(item.msg) }] : []),
  ];
});

const formatCollectionTime = (time: number) => {
  if (!time) return "";
  const _d = dayjs(time);
  const isCurrentDay = _d.isSame(dayjs(), "day");
  const isCurrentYear = _d.isSame(dayjs(), "year");
  if (isCurrentDay) {
    return _d.format("HH:mm");
  }
  if (isCurrentYear) {
    return _d.format(t("timeFormatSameYear"));
  }
  return _d.format(t("timeFormatDiffYear"));
};

const getAttachmentUrl = (msg?: V2NIMMessageForUI) => {
  return ((msg?.attachment as { url?: string } | undefined)?.url || "") as string;
};

const getCollectionImageThumbUrl = (msg?: V2NIMMessageForUI) => {
  const url = getAttachmentUrl(msg);
  const { width, height } = getImageAttachmentSize(msg?.attachment);
  return getImageThumbUrl(url, width, height);
};

const getCollectionImageStyle = (msg?: V2NIMMessageForUI) => {
  const { width, height } = getImageAttachmentSize(msg?.attachment);
  return getImageRenderStyle(width, height, "compact");
};

const getVideoFirstFrameUrl = (msg?: V2NIMMessageForUI) => {
  const url = getAttachmentUrl(msg);
  return url ? `${url}${url.includes("?") ? "&" : "?"}vframe=1` : "";
};

const getFileDownloadUrl = (msg: V2NIMMessageForUI) => {
  const attachment = msg.attachment as V2NIMMessageFileAttachment | undefined;
  return buildFileDownloadUrl(
    attachment?.url || "",
    attachment?.name || "",
    attachment?.ext || ""
  );
};

const getConversationTargetId = (msg: V2NIMMessageForUI) => {
  return nim.V2NIMConversationIdUtil.parseConversationTargetId(
    msg.conversationId
  );
};

const getConversationType = (msg: V2NIMMessageForUI) => {
  return (
    msg.conversationType ||
    (nim.V2NIMConversationIdUtil.parseConversationType(
      msg.conversationId
    ) as unknown as V2NIMConst.V2NIMConversationType)
  );
};

const getConversationName = (msg: V2NIMMessageForUI) => {
  const conversationType = getConversationType(msg);
  const targetId = getConversationTargetId(msg);
  if (
    conversationType ===
    V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
  ) {
    return store?.teamStore.teams.get(targetId)?.name || targetId;
  }
  return store?.uiStore.getAppellation({ account: targetId }) || targetId;
};

const getSenderName = (msg: V2NIMMessageForUI) => {
  const conversationType = getConversationType(msg);
  const targetId = getConversationTargetId(msg);
  return (
    store?.uiStore.getAppellation({
      account: msg.senderId,
      teamId:
        conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM
          ? targetId
          : "",
    }) || msg.senderId
  );
};

const getMessagePreview = (msg: V2NIMMessageForUI) => {
  if (msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE) {
    return (
      (msg.attachment as V2NIMMessageFileAttachment | undefined)?.name ||
      `[${t("fileMsgText")}]`
    );
  }
  return getMsgContentTipByType(msg);
};

const isMergedForward = (msg: V2NIMMessageForUI) => {
  return !!parseMergedForwardPayload(msg);
};

const getMergedForwardTitle = (msg: V2NIMMessageForUI) => {
  const payload = parseMergedForwardPayload(msg);
  const sessionName = payload?.data?.sessionName || payload?.data?.sessionId || "";
  return `${sessionName}${t("messageOfText")}`;
};

const getMergedForwardAbstracts = (msg: V2NIMMessageForUI) => {
  const payload = parseMergedForwardPayload(msg);
  return payload?.data?.abstracts || [];
};

const loadCollections = async (isLoadMore = false) => {
  if (isLoadMore && (!hasMore.value || loadingMore.value)) {
    return;
  }
  if (!isLoadMore && loading.value) {
    return;
  }

  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    hasMore.value = true;
    lastCollection.value = undefined;
  }

  try {
    const option: V2NIMCollectionOption = {
      collectionType: 0,
      limit: PAGE_SIZE,
      direction: V2NIMConst.V2NIMQueryDirection.V2NIM_QUERY_DIRECTION_DESC,
    };
    if (isLoadMore && lastCollection.value) {
      option.anchorCollection = lastCollection.value;
    }

    const collections = await store?.msgStore.getCollectionListByOptionActive(
      option
    );
    const collectionList = collections || [];
    lastCollection.value =
      collectionList[collectionList.length - 1] || lastCollection.value;
    const nextItems = normalizeMessageCollections(
      collectionList,
      converter.value
    );
    items.value = isLoadMore ? [...items.value, ...nextItems] : nextItems;
    hasMore.value = collectionList.length >= PAGE_SIZE;
  } catch {
    showToast({ message: t("getHistoryMsgFailedText"), type: "info" });
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const handleScroll = () => {
  const el = listRef.value;
  if (!el || loading.value || loadingMore.value || !hasMore.value) {
    return;
  }
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
    loadCollections(true);
  }
};

const openActionPopup = (item: MessageCollectionItem) => {
  actionCollectionId.value = item.collection.collectionId;
};

const closeActionPopup = () => {
  actionCollectionId.value = "";
};

const handleDelete = async (item: MessageCollectionItem) => {
  if (
    store?.connectStore.loginStatus !==
    V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
  ) {
    closeActionPopup();
    showToast({ message: t("offlineText"), type: "info" });
    return;
  }

  closeActionPopup();
  showModal({
    title: t("deleteText"),
    content: t("deleteCollectionConfirmText"),
    confirmText: t("deleteText"),
    onConfirm: async () => {
      try {
        await store?.msgStore.removeCollectionsActive([item.collection]);
        items.value = items.value.filter(
          (collectionItem) =>
            collectionItem.collection.collectionId !==
            item.collection.collectionId
        );
        showToast({ message: t("deleteMsgSuccessText"), type: "info" });
      } catch {
        showToast({ message: t("deleteCollectionFailedText"), type: "info" });
      }
    },
  });
};

const handleCopy = async (msg: V2NIMMessageForUI) => {
  try {
    if (
      msg.messageType !==
        V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ||
      !msg.text
    ) {
      throw new Error("Unsupported copy message");
    }
    await copyText(msg.text);
    showToast({ message: t("copySuccessText"), type: "info" });
  } catch {
    showToast({ message: t("copyFailText"), type: "info" });
  } finally {
    closeActionPopup();
  }
};

const handleForward = (msg: V2NIMMessageForUI) => {
  if (
    store?.connectStore.loginStatus !==
    V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
  ) {
    showToast({ message: t("offlineText"), type: "info" });
    return;
  }

  store?.uiStore.selectConversation(msg.conversationId);
  forwardMsg.value = msg;
  forwardVisible.value = true;
  closeActionPopup();
};

const closeForward = () => {
  forwardVisible.value = false;
  forwardMsg.value = undefined;
};

const openMergedForward = async (msg: V2NIMMessageForUI) => {
  const payload = parseMergedForwardPayload(msg);
  if (!payload?.data) return;
  const data = payload.data;
  const sessionName = data.sessionName || data.sessionId || "";
  const title = `${sessionName}${t("messageOfText")}`;

  if (mergedMsgs.value.length) {
    mergedForwardTitle.value = title;
    mergedVisible.value = true;
    return;
  }
  try {
    if (!data.url) throw new Error("url missing");
    const res = await fetch(data.url);
    if (!res.ok) throw new Error("fetch failed");
    const text = await res.text();
    const list = store?.msgStore.deserializeMergeMsgs(
      normalizeMergedForwardText(text)
    ) as V2NIMMessageForUI[];
    if (!list?.length) throw new Error("deserialize failed");
    mergedMsgs.value = list;
    mergedForwardTitle.value = title;
    mergedVisible.value = true;
  } catch {
    showToast({ message: t("getMergedForwardMsgFailedText"), type: "error" });
  }
};

const handleItemClick = (msg: V2NIMMessageForUI) => {
  if (parseMergedForwardPayload(msg)) {
    openMergedForward(msg);
    return;
  }

  if (
    msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ||
    msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_IMAGE ||
    msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_VIDEO
  ) {
    previewMsg.value = msg;
    return;
  }

  if (msg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_FILE) {
    const url = getFileDownloadUrl(msg);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
};

const closePreview = () => {
  previewMsg.value = undefined;
};

onMounted(() => {
  loadCollections();
});
</script>

<style scoped>
.collection-wrapper {
  min-height: 100vh;
  background: #E9EFF5;
}

.collection-loading {
  padding: 24px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.collection-list {
  height: calc(100vh - 50px);
  overflow-y: auto;
  padding: 10px 16px 16px;
  box-sizing: border-box;
}

.collection-list-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #DEE0E2;
}

.collection-list-item + .collection-list-item {
  margin-top: 10px;
}

.collection-list-item-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.collection-list-item-meta {
  flex: 1;
  min-width: 0;
}

.collection-list-item-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #222;
  font-size: 15px;
  line-height: 22px;
}

.collection-conversation-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #999;
  font-size: 12px;
  line-height: 18px;
}

.collection-list-item-content {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E4E9F2;
}

.collection-list-item-time {
  margin-top: 10px;
  color: #999;
  font-size: 12px;
  line-height: 18px;
  text-align: left;
}

.collection-message-preview {
  display: -webkit-box;
  overflow: hidden;
  color: #333;
  font-size: 14px;
  line-height: 20px;
  word-break: break-word;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.collection-merged-card {
  padding: 12px 16px;
  border: 1px solid #edf0f3;
  border-radius: 8px;
  line-height: 18px;
}

.collection-merged-title {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 500;
  color: #1f2329;
}

.collection-merged-abstracts {
  color: #656a72;
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.collection-merged-sender {
  display: inline-block;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  color: #3d4149;
}

.collection-message-preview-text > :deep(.msg-text) {
  display: -webkit-box;
  max-height: 60px;
  overflow: hidden;
  line-height: 20px;
  text-align: left;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.collection-message-image {
  display: block;
  max-width: 100%;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f6f8;
}

.collection-video-message {
  position: relative;
  display: inline-block;
}

.collection-video-cover {
  display: block;
  max-width: 100%;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f6f8;
}

.collection-video-play-button {
  width: 40px;
  height: 40px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.2);
  border: 2px solid #fff;
  border-radius: 50%;
  z-index: 1;
}

.collection-video-play-icon {
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 14px solid #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-40%, -50%);
}

.collection-file-preview {
  display: inline-block;
  max-width: 100%;
}

.collection-file-preview :deep(.msg-file-in) {
  margin-left: 0;
}

.collection-file-preview :deep(.msg-file-out) {
  margin-right: 0;
}

.collection-audio-preview {
  display: inline-block;
}

.collection-location-preview :deep(.message-location) {
  margin-left: 0;
  margin-right: 0;
  max-width: 100%;
}

.collection-audio-preview .msg-bg {
  display: inline-block;
  max-width: 63vw;
  padding: 12px 16px;
  overflow: hidden;
}

.collection-audio-preview .msg-bg-in {
  margin-left: 0;
  border-radius: 0 8px 8px 8px;
  background-color: #e8eaed;
}

.collection-list-more {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.collection-load-more {
  padding: 14px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.collection-preview-mask {
  position: fixed;
  z-index: 9999;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  background: #000;
}

.collection-video-preview {
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.collection-video-preview video {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
  background: #000;
}

.collection-preview-close {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
