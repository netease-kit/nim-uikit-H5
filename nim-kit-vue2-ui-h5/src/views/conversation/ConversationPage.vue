<template>
  <ConversationList />
</template>

<script>
import ConversationList from "@/components/NEUIKit/Conversation/conversation-list.vue";

export default {
  name: "ConversationPage",
  components: {
    ConversationList,
  },
};
</script>

<style scoped>
.conversation-container {
  height: 100%;
  overflow: hidden;
}
</style>
