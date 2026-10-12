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

<script>
import LoginForm from "./components/login-form.vue";
import Welcome from "./components/welcome.vue";
import emitter from "../utils/eventBus";

export default {
  name: "LoginPage",
  components: {
    LoginForm,
    Welcome,
  },
  data() {
    return {
      step: 0,
      handleLogin: null,
    };
  },
  mounted() {
    this.handleLogin = () => {
      this.step = 1;
    };
    emitter.on("login", this.handleLogin);
  },
  beforeDestroy() {
    if (this.handleLogin) {
      emitter.off("login", this.handleLogin);
    }
  },
};
</script>

<style scoped>
.page-wrapper {
  height: 100%;
  overflow: hidden;
  background-color: #fff;
}
</style>
