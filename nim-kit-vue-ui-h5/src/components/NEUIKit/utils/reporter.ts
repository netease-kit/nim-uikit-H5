import { EventTracking } from "@xkit-yx/utils";
import imPkg from "nim-web-sdk-ng/package.json";

export const trackInit = (
  component: "ChatUIKit" | "ContactUIKit" | "ConversationUIKit" | "SearchUIKit",
  appKey: string
): void => {
  const eventTracking = new EventTracking({
    appKey: appKey,
    version: "10.1.0",
    component,
    imVersion: imPkg.version,
    platform: "H5",
    os: "",
    framework: "",
    language: "Vue3",
    container: "H5",
  });
  eventTracking.track("init", "");
};
