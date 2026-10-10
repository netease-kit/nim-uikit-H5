<template>
  <Avatar
    :account="account"
    :teamId="teamId"
    :avatar="avatar"
    :size="size"
    :gotoUserCard="gotoUserCard"
    :font-size="fontSize"
  />
</template>

<script>
import Avatar from "../../CommonComponents/Avatar.vue";

export default {
  name: "MessageAvatar",
  components: {
    Avatar,
  },
  props: {
    account: {
      type: String,
      required: true,
    },
    teamId: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    size: {
      type: [String, Number],
      default: "",
    },
    gotoUserCard: {
      type: Boolean,
      default: false,
    },
    fontSize: {
      type: [String, Number],
      default: "",
    },
  },
};
</script>

<style scoped></style>
