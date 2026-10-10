import { V2NIMConst } from "nim-web-sdk-ng/dist/esm/nim";
import V2NIM from "nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK";
import imPackage from "nim-web-sdk-ng/package.json";

export { V2NIM, V2NIMConst };
export const imSdkVersion = imPackage.version;
