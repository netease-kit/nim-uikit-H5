import "./assets/main.css";
import router from "./router";
import { createApp } from "vue";
import App from "./App.vue";
import "./global.css";
const app = createApp(App);
app.use(router);
app.mount("#app");

export default app;
