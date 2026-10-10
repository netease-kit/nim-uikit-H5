import { imSdkVersion } from "./sdk";

const TRACKING_URL =
  "https://statistic.live.126.net/statics/report/xkit/action";

export const createTrackingPayload = (component, appKey, now = Date.now) => ({
  appKey,
  version: "10.0.0",
  component,
  timeStamp: now(),
  imVersion: imSdkVersion,
  platform: "H5",
  reportType: "init",
  data: "",
  channel: "netease",
  os: "",
  framework: "",
  language: "Vue2",
  container: "H5",
});

export const trackInit = async (
  component,
  appKey,
  fetchImpl = typeof fetch === "function" ? fetch : null,
  now = Date.now
) => {
  if (!fetchImpl) {
    return false;
  }

  try {
    const response = await fetchImpl(TRACKING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createTrackingPayload(component, appKey, now)),
      keepalive: true,
    });
    return response ? response.ok !== false : true;
  } catch (error) {
    return false;
  }
};
