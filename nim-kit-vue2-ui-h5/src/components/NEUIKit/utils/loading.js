import Vue from "vue";
import Loading from "../CommonComponents/Loading.vue";

let loadingInstance = null;
let loadingContainer = null;

const createLoading = () => {
  loadingContainer = document.createElement("div");
  document.body.appendChild(loadingContainer);

  const LoadingConstructor = Vue.extend(Loading);
  const instance = new LoadingConstructor();
  instance.$mount();
  loadingContainer.appendChild(instance.$el);
  return instance;
};

export const loading = {
  show(text = "") {
    if (!loadingInstance) {
      loadingInstance = createLoading();
    }
    if (loadingInstance && loadingInstance.show) {
      loadingInstance.show(text);
    }
  },
  hide() {
    if (loadingInstance && loadingInstance.hide) {
      loadingInstance.hide();
    }
  },
};
