import RootStore from "./store.js";
import { V2NIM, V2NIMConst } from "./sdk";

let uiKitStore = null;
let nim = null;
let kickedOfflineBinding = null;

export const clearKickedOfflineHandler = () => {
  if (!kickedOfflineBinding) {
    return;
  }

  const { sdk, handler } = kickedOfflineBinding;
  sdk.V2NIMLoginService.off("onKickedOffline", handler);
  kickedOfflineBinding = null;
};

export const bindKickedOfflineHandler = (sdk, handler) => {
  clearKickedOfflineHandler();
  sdk.V2NIMLoginService.on("onKickedOffline", handler);
  kickedOfflineBinding = { sdk, handler };
};

export const init = (appkey) => {
  const enableV2CloudConversation =
    localStorage.getItem("enableV2CloudConversation") === "on";

  nim = V2NIM.getInstance(
    {
      appkey: appkey,
      needReconnect: true,
      debugLevel: "debug",
      apiVersion: "v2",
      enableV2CloudConversation,
    },
    {
      V2NIMLoginServiceConfig: {
        lbsUrls: ["https://lbs.netease.im/lbs/webconf.jsp"],
        linkUrl: "weblink.netease.im",
      },
    }
  );

  uiKitStore = new RootStore(
    nim,
    {
      addFriendNeedVerify: false,
      p2pMsgReceiptVisible: true,
      teamMsgReceiptVisible: true,
      teamAgreeMode:
        V2NIMConst.V2NIMTeamAgreeMode.V2NIM_TEAM_AGREE_MODE_NO_AUTH,
      sendMsgBefore: async (options) => {
        return { ...options };
      },
    },
    "H5"
  );

  return {
    nim,
    store: uiKitStore,
  };
};

export { nim, uiKitStore };
