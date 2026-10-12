const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const babel = require("@babel/core");

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "src");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function loadJavaScript(relativeFile, mocks = {}) {
  const transformed = babel.transformSync(read(path.join(sourceRoot, relativeFile)), {
    babelrc: false,
    configFile: false,
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  }).code;
  const loadedModule = { exports: {} };
  const localRequire = (request) => {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) {
      return mocks[request];
    }
    throw new Error(`Missing test mock for ${request}`);
  };
  new Function("require", "module", "exports", transformed)(
    localRequire,
    loadedModule,
    loadedModule.exports
  );
  return loadedModule.exports;
}

test("replaceable runtime packages are implemented inside the project", () => {
  const replaceablePackages = [
    "@xkit-yx/utils",
    "core-js",
    "dayjs",
    "mitt",
    "vue-virtual-scroller",
  ];
  const packageJson = JSON.parse(read(path.join(projectRoot, "package.json")));
  const directRuntimeDependencies = Object.keys(packageJson.dependencies || {});
  const externalImports = walk(sourceRoot)
    .filter((file) => /\.(?:js|vue)$/.test(file))
    .flatMap((file) => {
      const source = read(file);
      return replaceablePackages
        .filter((packageName) =>
          new RegExp(`(?:from\\s+|require\\()(["'])${packageName.replace(
            "/",
            "\\/"
          )}\\1`).test(source)
        )
        .map((packageName) => ({
          file: path.relative(sourceRoot, file),
          packageName,
        }));
    });

  assert.deepEqual(
    directRuntimeDependencies.filter((name) => replaceablePackages.includes(name)),
    []
  );
  assert.deepEqual(externalImports, []);
});

test("the IM SDK is accessed through one readable local boundary", () => {
  const sdkImports = walk(sourceRoot)
    .filter((file) => /\.(?:js|vue)$/.test(file))
    .filter((file) => /from\s+["']nim-web-sdk-ng(?:\/[^"']*)?["']/.test(read(file)))
    .map((file) => path.relative(sourceRoot, file))
    .sort();

  assert.deepEqual(sdkImports, ["components/NEUIKit/utils/sdk.js"]);
});

test("internal file helpers classify extensions and format sizes", () => {
  const utils = loadJavaScript("components/NEUIKit/utils/index.js");

  assert.equal(typeof utils.getFileType, "function");
  assert.equal(typeof utils.parseFileSize, "function");
  assert.equal(utils.getFileType("photo.jpeg"), "img");
  assert.equal(utils.getFileType(".PDF"), "pdf");
  assert.equal(utils.getFileType("notes.txt"), "txt");
  assert.equal(utils.getFileType("archive.7z"), "zip");
  assert.equal(utils.getFileType("unknown.bin"), "");
  assert.equal(utils.parseFileSize(0), "0B");
  assert.equal(utils.parseFileSize(1024), "1KB");
  assert.equal(utils.parseFileSize(1536), "2KB");
});

test("internal debounce keeps the latest call and calling context", async () => {
  const { debounce } = loadJavaScript("components/NEUIKit/utils/index.js");
  assert.equal(typeof debounce, "function");

  const calls = [];
  const context = { id: "team-page" };
  const debounced = debounce(function (value) {
    calls.push([this.id, value]);
  }, 10);

  debounced.call(context, "first");
  debounced.call(context, "second");
  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.deepEqual(calls, [["team-page", "second"]]);
});

test("internal event emitter supports subscribe, unsubscribe and wildcard listeners", () => {
  const { createEmitter } = loadJavaScript("components/NEUIKit/utils/index.js");
  assert.equal(typeof createEmitter, "function");

  const emitter = createEmitter();
  const received = [];
  const handler = (payload) => received.push(["event", payload]);
  const wildcard = (type, payload) => received.push([type, payload]);

  emitter.on("refresh", handler);
  emitter.on("*", wildcard);
  emitter.emit("refresh", { page: 2 });
  emitter.off("refresh", handler);
  emitter.emit("refresh", { page: 3 });

  assert.deepEqual(received, [
    ["event", { page: 2 }],
    ["refresh", { page: 2 }],
    ["refresh", { page: 3 }],
  ]);
});

test("internal conversation time formatter preserves the previous UI formats", () => {
  const { formatConversationTime } = loadJavaScript(
    "components/NEUIKit/utils/date.js",
    { "./i18n": { t: (key) => key } }
  );
  assert.equal(typeof formatConversationTime, "function");

  const now = new Date(2026, 8, 8, 18, 30).getTime();
  assert.equal(
    formatConversationTime(new Date(2026, 8, 8, 9, 5).getTime(), now),
    "09:05"
  );
  assert.equal(
    formatConversationTime(new Date(2026, 6, 2, 9, 5).getTime(), now),
    "07-02 09:05"
  );
  assert.equal(
    formatConversationTime(new Date(2025, 11, 31, 23, 59).getTime(), now),
    "2025-12-31 23:59"
  );
  assert.equal(formatConversationTime(undefined, now), "");
});

test("internal telemetry builds and sends the same non-blocking init event", async () => {
  const reporter = loadJavaScript("components/NEUIKit/utils/reporter.js", {
    "./sdk": { imSdkVersion: "10.9.70" },
  });
  assert.equal(typeof reporter.createTrackingPayload, "function");

  const calls = [];
  const result = await reporter.trackInit(
    "ChatUIKit",
    "app-key",
    async (...args) => {
      calls.push(args);
      return { ok: true };
    },
    () => 123456
  );

  assert.equal(result, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "https://statistic.live.126.net/statics/report/xkit/action");
  const request = calls[0][1];
  assert.equal(request.method, "POST");
  assert.deepEqual(JSON.parse(request.body), {
    appKey: "app-key",
    version: "10.1.0",
    component: "ChatUIKit",
    timeStamp: 123456,
    imVersion: "10.9.70",
    platform: "H5",
    reportType: "init",
    data: "",
    channel: "netease",
    os: "",
    framework: "",
    language: "Vue2",
    container: "H5",
  });
});
