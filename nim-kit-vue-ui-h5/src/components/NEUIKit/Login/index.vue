<template>
  <div class="page-wrapper">
    <div v-show="step === 0">
      <Welcome />
    </div>
    <div v-show="step === 1">
      <LoginForm />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import LoginForm from "./components/login-form.vue";
import Welcome from "./components/welcome.vue";
import emitter from "../utils/eventBus";

const step = ref(0); // 0: 欢迎页 1: 登录页
onMounted(() => {
  emitter.on("login", () => {
    step.value = 1;
  });
});

onUnmounted(() => {
  emitter.off("login");
});
</script>

<style>
.page-wrapper {
  height: 100%;
  overflow: hidden;
  background-color: #fff;
}
</style>
