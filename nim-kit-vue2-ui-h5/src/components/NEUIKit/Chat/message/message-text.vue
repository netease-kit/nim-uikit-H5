<template>
  <div class="msg-text" :style="{ fontSize: (fontSize || 16) + 'px' }">
    <span v-for="(item, index) in textArr" :key="item.key || index">
      <template v-if="item.type === 'text'">
        <span class="msg-text">{{ item.value }}</span>
      </template>
      <template v-else-if="item.type === 'Ait'">
        <span class="msg-text" :style="{ color: '#1861df' }">
          {{ " " + item.value + " " }}
        </span>
      </template>
      <template v-else-if="item.type === 'emoji'">
        <Icon
          :type="EMOJI_ICON_MAP_CONFIG[item.value]"
          :size="fontSize || 22"
          :style="{ margin: '0 2px 2px 2px', verticalAlign: 'bottom' }"
        />
      </template>
      <template v-else-if="item.type === 'link'">
        <a
          :href="item.value"
          target="_blank"
          rel="noopener noreferrer"
          :style="{ color: '#1861df', fontSize: (fontSize || 16) + 'px' }"
        >
          {{ item.value }}
        </a>
      </template>
    </span>
  </div>
</template>

<script>
import Icon from "../../CommonComponents/Icon.vue";
import { parseText } from "../../utils/parseText";
import { EMOJI_ICON_MAP_CONFIG } from "../../utils/emoji";

export default {
  components: {
    Icon,
  },
  props: {
    msg: {
      type: Object,
      required: true,
    },
    fontSize: {
      type: Number,
      default: undefined,
    },
  },
  data() {
    return {
      EMOJI_ICON_MAP_CONFIG,
    };
  },
  computed: {
    textArr() {
      return parseText(this.msg?.text || "", this.msg?.serverExtension);
    },
  },
};
</script>

<style scoped>
.msg-text {
  color: #000;
  text-align: left;
  overflow-y: auto;
  word-break: break-all;
  word-wrap: break-word;
  white-space: break-spaces;
}
</style>
