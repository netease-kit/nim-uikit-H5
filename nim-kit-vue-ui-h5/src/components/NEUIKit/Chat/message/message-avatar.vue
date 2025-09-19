<template>
  <Avatar
    :account="account"
    :teamId="teamId"
    :size="size"
    :gotoUserCard="gotoUserCard"
  />
</template>

<script lang="ts" setup>
import Avatar from "../../CommonComponents/Avatar.vue";

const props = defineProps<{
  account: string;
  teamId?: string;
  avatar?: string;
  size?: string;
  gotoUserCard?: boolean;
  fontSize?: string;
}>();
</script>

<style scoped></style>
