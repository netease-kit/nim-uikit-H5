const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const babel = require("@babel/core");
const compiler = require("vue-template-compiler");

const projectRoot = path.resolve(__dirname, "..");
const vue2SourceRoot = path.join(projectRoot, "src");
const vue3SourceRoot = path.resolve(projectRoot, "../im-kit-vue-ui-h5/src");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function relativeFiles(root, extension) {
  return walk(root)
    .filter((file) => file.endsWith(extension))
    .map((file) => path.relative(root, file))
    .sort();
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function loadComponentOptions(relativeFile, mocks = {}) {
  const source = read(path.join(vue2SourceRoot, relativeFile));
  const component = compiler.parseComponent(source);
  const transformed = babel.transformSync(component.script.content, {
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
  return loadedModule.exports.default;
}

function loadJavaScript(relativeFile, mocks = {}) {
  const source = read(path.join(vue2SourceRoot, relativeFile));
  const transformed = babel.transformSync(source, {
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

test("Vue2 migration preserves every Vue component", () => {
  assert.deepEqual(relativeFiles(vue2SourceRoot, ".vue"), relativeFiles(vue3SourceRoot, ".vue"));
});

test("Vue2 project contains JavaScript source only", () => {
  const typeScriptFiles = walk(vue2SourceRoot).filter((file) => /\.tsx?$/.test(file));
  assert.deepEqual(typeScriptFiles, []);
});

test("Vue2 components share the MobX runtime bundled by the local store", () => {
  const externalMobxImports = walk(vue2SourceRoot)
    .filter((file) => /\.(?:js|vue)$/.test(file))
    .map((file) => ({ file, source: read(file) }))
    .filter(({ source }) => /from\s+["']mobx["']/.test(source))
    .map(({ file }) => path.relative(vue2SourceRoot, file));

  assert.deepEqual(externalMobxImports, []);
  assert.match(
    read(path.join(vue2SourceRoot, "components/NEUIKit/utils/store.js")),
    /export\s*\{\s*Kt\s+as\s+autorun\s*\}/
  );
});

test("the standalone MobX package is no longer a runtime dependency", () => {
  const packageJson = JSON.parse(read(path.join(projectRoot, "package.json")));
  assert.equal(packageJson.dependencies.mobx, undefined);
});

test("Vue2 components contain no Vue3 or TypeScript-only component syntax", () => {
  const unsupported =
    /<script[^>]*(?:setup|lang=["']ts["'])|\b(?:createApp|createRouter|createWebHashHistory|defineProps|defineEmits|defineExpose|withDefaults|getCurrentInstance|onMounted|onUnmounted|onBeforeUnmount)\s*\(/;
  const failures = relativeFiles(vue2SourceRoot, ".vue").filter((relativeFile) =>
    unsupported.test(read(path.join(vue2SourceRoot, relativeFile)))
  );
  assert.deepEqual(failures, []);
});

test("every Vue2 single-file component template compiles without errors", () => {
  const failures = [];

  for (const relativeFile of relativeFiles(vue2SourceRoot, ".vue")) {
    const source = read(path.join(vue2SourceRoot, relativeFile));
    const component = compiler.parseComponent(source, { pad: "line" });
    if (!component.template) {
      failures.push(`${relativeFile}: missing template`);
      continue;
    }

    const result = compiler.compile(component.template.content, { outputSourceRange: true });
    for (const error of result.errors) {
      failures.push(`${relativeFile}: ${typeof error === "string" ? error : error.msg}`);
    }
  }

  assert.deepEqual(failures, []);
});

test("H5 templates use native HTML elements", () => {
  const unsupportedTag = /<(?:view|text|image|scroll-view|picker)(?:\s|>)/;
  const failures = relativeFiles(vue2SourceRoot, ".vue").filter((relativeFile) => {
    const source = read(path.join(vue2SourceRoot, relativeFile));
    const component = compiler.parseComponent(source);
    return component.template && unsupportedTag.test(component.template.content);
  });
  assert.deepEqual(failures, []);
});

test("H5 templates do not depend on the non-standard longpress event", () => {
  const failures = relativeFiles(vue2SourceRoot, ".vue").filter((relativeFile) =>
    /@longpress\s*=/.test(read(path.join(vue2SourceRoot, relativeFile)))
  );
  assert.deepEqual(failures, []);
});

test("H5 templates do not retain ignored uni-app element attributes", () => {
  const unsupportedAttribute =
    /(?:\s|:)(?:scroll-y|scroll-top|scroll-into-view|confirm-type|confirm-hold|cursor-spacing|adjust-position|lazy-load|mode)\s*=(?!=)/;
  const failures = relativeFiles(vue2SourceRoot, ".vue").filter((relativeFile) => {
    const source = read(path.join(vue2SourceRoot, relativeFile));
    const component = compiler.parseComponent(source);
    return (
      component.template && unsupportedAttribute.test(component.template.content)
    );
  });
  assert.deepEqual(failures, []);
});

test("H5 templates do not use the mini-program lowercase icon element", () => {
  const failures = relativeFiles(vue2SourceRoot, ".vue").filter((relativeFile) => {
    const source = read(path.join(vue2SourceRoot, relativeFile));
    const component = compiler.parseComponent(source);
    return component.template && /<icon(?:\s|>)/.test(component.template.content);
  });
  assert.deepEqual(failures, []);
});

test("birthday editing uses a native date input with a change handler", () => {
  const source = read(
    path.join(vue2SourceRoot, "components/NEUIKit/User/my-detail.vue")
  );
  assert.match(source, /<input[\s\S]*type=["']date["'][\s\S]*@change=["']onBirthdayChange["']/);
  assert.match(source, /\bonBirthdayChange\s*\(event\)\s*\{/);
});

test("UIKitInput preserves the native inputRef contract used by message input", () => {
  const options = loadComponentOptions("components/NEUIKit/CommonComponents/Input.vue");
  const nativeInput = { selectionStart: 3 };
  assert.equal(options.computed.inputRef.call({ $refs: { inputRef: nativeInput } }), nativeInput);
});

test("UIKitInput maps Enter to confirm and leaves other keys untouched", () => {
  const options = loadComponentOptions("components/NEUIKit/CommonComponents/Input.vue");
  const emitted = [];
  let prevented = 0;
  const context = {
    modelValue: "hello",
    $emit: (...args) => emitted.push(args),
  };
  options.methods.handleKeypress.call(context, {
    key: "Enter",
    preventDefault: () => {
      prevented += 1;
    },
  });
  options.methods.handleKeypress.call(context, {
    key: "a",
    preventDefault: () => {
      prevented += 1;
    },
  });
  assert.equal(prevented, 1);
  assert.deepEqual(emitted, [["confirm", "hello"]]);
});

test("UIKitInput clear keeps the input event payload contract", () => {
  const options = loadComponentOptions("components/NEUIKit/CommonComponents/Input.vue");
  const emitted = [];
  const nativeInput = { value: "before-clear" };
  options.methods.clearInput.call({
    $refs: { inputRef: nativeInput },
    $emit: (...args) => emitted.push(args),
  });

  assert.equal(nativeInput.value, "");
  assert.deepEqual(emitted[0], ["update:modelValue", ""]);
  assert.equal(emitted[1][0], "input");
  assert.equal(emitted[1][1].target.value, "");
  assert.deepEqual(emitted[2], ["clear"]);
});

test("TabBar subscribes after the SDK store becomes available", () => {
  const image = { __esModule: true, default: "icon.png" };
  let reactionCount = 0;
  let disposeCount = 0;
  const options = loadComponentOptions("components/TabBar.vue", {
    "./NEUIKit/static/conversation.png": image,
    "./NEUIKit/static/conversation-selected.png": image,
    "./NEUIKit/static/contact.png": image,
    "./NEUIKit/static/contact-selected.png": image,
    "./NEUIKit/static/me.png": image,
    "./NEUIKit/static/me-selected.png": image,
    "./NEUIKit/utils/store.js": {
      autorun: (callback) => {
        reactionCount += 1;
        callback();
        return () => {
          disposeCount += 1;
        };
      },
    },
    "./NEUIKit/utils/i18n": { t: (key) => key },
  });
  const context = {
    $UIKitStore: null,
    conversationUnread: false,
    contactsUnread: false,
    disposeUnreadAutorun: null,
  };

  options.methods.refreshUnreadWatch.call(context);
  assert.equal(reactionCount, 0);

  context.$UIKitStore = {
    sdkOptions: { enableV2CloudConversation: false },
    localConversationStore: { totalUnreadCount: 3 },
    sysMsgStore: { getTotalUnreadMsgsCount: () => 2 },
  };
  options.methods.refreshUnreadWatch.call(context);
  assert.equal(reactionCount, 1);
  assert.equal(context.conversationUnread, true);
  assert.equal(context.contactsUnread, true);

  options.methods.refreshUnreadWatch.call(context);
  assert.equal(disposeCount, 1);
});

test("login form forwards allowClear to the shared input", () => {
  const source = read(
    path.join(vue2SourceRoot, "components/NEUIKit/Login/components/form-input.vue")
  );
  assert.match(source, /:show-clear=["']allowClear["']/);
});

test("login actions use native buttons with request disabled states", () => {
  const source = read(
    path.join(vue2SourceRoot, "components/NEUIKit/Login/components/login-form.vue")
  );
  assert.match(
    source,
    /<button[\s\S]*class=["']sms-addon-after["'][\s\S]*:disabled=["'][^"']*smsRequestPending/
  );
  assert.match(
    source,
    /<button[\s\S]*class=["']login-btn["'][\s\S]*:disabled=["']loginPending["']/
  );
});

test("message avatar forwards every visual prop to UIKitAvatar", () => {
  const source = read(
    path.join(vue2SourceRoot, "components/NEUIKit/Chat/message/message-avatar.vue")
  );
  assert.match(source, /:avatar=["']avatar["']/);
  assert.match(source, /:font-size=["']fontSize["']/);
});

test("person selection ignores disabled items and enforces the maximum", () => {
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/CommonComponents/PersonSelect.vue",
    {
      "./Avatar.vue": emptyComponent,
      "./Appellation.vue": emptyComponent,
      "./Empty.vue": emptyComponent,
      "../utils/i18n": { t: (key) => key },
    }
  );
  const emitted = [];
  const context = {
    max: 1,
    selectAccount: [],
    $emit: (...args) => emitted.push(args),
  };
  const event = { preventDefault() {} };

  options.methods.handleCheckboxChange.call(context, event, {
    accountId: "disabled-user",
    disabled: true,
  });
  assert.deepEqual(context.selectAccount, []);

  options.methods.handleCheckboxChange.call(context, event, { accountId: "first-user" });
  options.methods.handleCheckboxChange.call(context, event, { accountId: "second-user" });
  assert.deepEqual(context.selectAccount, ["first-user"]);
  assert.deepEqual(emitted, [["checkboxChange", ["first-user"]]]);
});

test("person selection synchronizes asynchronously loaded preselected items", () => {
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/CommonComponents/PersonSelect.vue",
    {
      "./Avatar.vue": emptyComponent,
      "./Appellation.vue": emptyComponent,
      "./Empty.vue": emptyComponent,
      "../utils/i18n": { t: (key) => key },
    }
  );
  const context = { selectAccount: [] };
  options.watch.personList.handler.call(context, [
    { accountId: "existing-user", checked: true },
    { accountId: "available-user", checked: false },
  ]);
  assert.deepEqual(context.selectAccount, ["existing-user"]);
});

test("person selection renders and emits its optional confirm action", () => {
  const source = read(
    path.join(vue2SourceRoot, "components/NEUIKit/CommonComponents/PersonSelect.vue")
  );
  assert.match(source, /v-if=["']showBtn["']/);
  assert.match(source, /\{\{\s*btnText\s*\|\|\s*t\(["']okText["']\)\s*\}\}/);

  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/CommonComponents/PersonSelect.vue",
    {
      "./Avatar.vue": emptyComponent,
      "./Appellation.vue": emptyComponent,
      "./Empty.vue": emptyComponent,
      "../utils/i18n": { t: (key) => key },
    }
  );
  const emitted = [];
  options.methods.onBtnClick.call({
    selectAccount: ["selected-user"],
    $emit: (...args) => emitted.push(args),
  });
  assert.deepEqual(emitted, [["onBtnClick", ["selected-user"]]]);
});

test("audio messages broadcast playback and stop when another message starts", () => {
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/Chat/message/message-audio.vue",
    { "../../CommonComponents/Icon.vue": emptyComponent }
  );
  const emitted = [];
  const playingContext = {
    audioSrc: "current.mp3",
    isAudioPlaying: false,
    playAudioAnimation() {},
    $emit: (...args) => emitted.push(args),
  };
  options.methods.onAudioPlay.call(playingContext);
  assert.deepEqual(emitted, [["audio-play", "current.mp3"]]);

  let pauseCount = 0;
  const audio = {
    currentTime: 8,
    pause() {
      pauseCount += 1;
    },
  };
  const siblingContext = {
    audioSrc: "current.mp3",
    isAudioPlaying: true,
    animationFlag: true,
    animationTimer: null,
    $refs: { audioRef: audio },
    stopAudio() {
      options.methods.stopAudio.call(this);
    },
    stopAudioAnimation() {
      options.methods.stopAudioAnimation.call(this);
    },
  };
  const watcher = options.watch && options.watch.broadcastNewAudioSrc;
  const handler = watcher && (watcher.handler || watcher);
  handler.call(siblingContext, "another.mp3");
  assert.equal(pauseCount, 1);
  assert.equal(audio.currentTime, 0);
  assert.equal(siblingContext.isAudioPlaying, false);
  assert.equal(siblingContext.animationFlag, false);
});

test("message list forwards audio playback and blocks duplicate history loads", () => {
  const source = read(
    path.join(vue2SourceRoot, "components/NEUIKit/Chat/message/message-list.vue")
  );
  assert.match(source, /@audio-play=["']handleAudioPlay["']/);
  assert.match(source, /v-show=["']loadingMore["'][\s\S]*loadingMoreText/);

  const emptyComponent = { __esModule: true, default: {} };
  const emitted = [];
  const emitter = {
    emit: (...args) => emitted.push(args),
    on() {},
    off() {},
  };
  const options = loadComponentOptions(
    "components/NEUIKit/Chat/message/message-list.vue",
    {
      "./message-item.vue": emptyComponent,
      "../../utils/date": { caculateTimeago: () => "" },
      "../../utils/i18n": { t: (key) => key },
      "../../utils/sdk": {
        V2NIMConst: {
          V2NIMMessageType: { V2NIM_MESSAGE_TYPE_CUSTOM: 100 },
        },
      },
      "../../utils/store.js": { autorun: () => () => {} },
      "../../utils/eventBus": { __esModule: true, default: emitter },
      "../../utils/constants": { events: { GET_HISTORY_MSG: "history" } },
      "../../utils/init.js": { nim: {}, uiKitStore: {} },
    }
  );
  const context = {
    loadingMore: true,
    noMore: false,
    finalMsgs: [{ messageClientId: "message-1", messageType: 1 }],
  };
  options.methods.onLoadMore.call(context);
  assert.deepEqual(emitted, []);

  const audioContext = { broadcastNewAudioSrc: "" };
  options.methods.handleAudioPlay.call(audioContext, "playing.mp3");
  assert.equal(audioContext.broadcastNewAudioSrc, "playing.mp3");
});

test("Tooltip removes the same global click listener when Vue2 destroys it", () => {
  const options = loadComponentOptions(
    "components/NEUIKit/CommonComponents/Tooltip.vue"
  );
  let addedHandler;
  let removedHandler;
  const originalWindow = global.window;
  global.window = {
    addEventListener(type, handler) {
      if (type === "click") addedHandler = handler;
    },
    removeEventListener(type, handler) {
      if (type === "click") removedHandler = handler;
    },
  };
  try {
    const context = {
      isShow: true,
      touchTimer: null,
      handleWindowClick: options.methods.handleWindowClick,
      getPosition() {},
    };
    options.mounted.call(context);
    options.beforeDestroy.call(context);
    assert.equal(addedHandler, options.methods.handleWindowClick);
    assert.equal(removedHandler, addedHandler);
  } finally {
    global.window = originalWindow;
  }
});

test("Avatar redirect mode replaces history instead of pushing another page", () => {
  const emptyModule = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/CommonComponents/Avatar.vue",
    {
      "../utils": { getAvatarBackgroundColor: () => "#000" },
      "../utils/store.js": { autorun: () => () => {} },
      "../utils/init": {
        uiKitStore: { userStore: { myUserInfo: { accountId: "self" } } },
      },
      "../utils/uikitRouter": {
        neUiKitRouterPath: { myDetail: "/my", friendCard: "/friend" },
      },
      "./unused": emptyModule,
    }
  );
  const calls = [];
  options.methods.handleAvatarClick.call({
    gotoUserCard: true,
    isLongPress: false,
    isRedirect: true,
    account: "other",
    $router: {
      push: (route) => calls.push(["push", route]),
      replace: (route) => calls.push(["replace", route]),
    },
  });
  assert.equal(calls[0][0], "replace");
  assert.deepEqual(calls[0][1], {
    path: "/friend",
    query: { accountId: "other" },
  });
});

test("FriendAvatar honors card navigation and redirect mode", () => {
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/Friend/friend-avatar.vue",
    {
      "../utils/store.js": { autorun: () => () => {} },
      "../CommonComponents/Appellation.vue": emptyComponent,
      "../utils/init.js": {
        nim: {},
        uiKitStore: { userStore: { myUserInfo: { accountId: "self" } } },
      },
      "../utils/uikitRouter": {
        neUiKitRouterPath: { myDetail: "/my", friendCard: "/friend" },
      },
    }
  );
  const calls = [];
  options.methods.handleAvatarClick.call({
    gotoUserCard: true,
    isLongPress: false,
    isRedirect: true,
    account: "other",
    $router: {
      push: (route) => calls.push(["push", route]),
      replace: (route) => calls.push(["replace", route]),
    },
  });
  assert.deepEqual(calls, [
    ["replace", { path: "/friend", query: { accountId: "other" } }],
  ]);
});

test("emoji aliases are converted to message tokens, never icon class names", () => {
  const { replaceEmoji } = loadJavaScript("components/NEUIKit/utils/index.js");
  assert.equal(replaceEmoji("[Laugh] [大笑]"), "[大笑] [大笑]");
  assert.equal(
    replaceEmoji("[Wave]", { "[Wave]": "[招手]" }),
    "[招手]"
  );
});

test("emoji replacement leaves text unchanged for an empty custom map", () => {
  const { replaceEmoji } = loadJavaScript("components/NEUIKit/utils/index.js");
  assert.equal(replaceEmoji("plain [text]", {}), "plain [text]");
});

test("download links encode names and preserve URL fragments", () => {
  const { buildDownloadUrl } = loadJavaScript(
    "components/NEUIKit/utils/index.js"
  );
  assert.equal(buildDownloadUrl("", "report.pdf"), "");
  assert.equal(
    buildDownloadUrl("https://example.test/file", "a & b#.pdf"),
    "https://example.test/file?download=a%20%26%20b%23.pdf"
  );
  assert.equal(
    buildDownloadUrl("https://example.test/file?token=1#preview", "报告.pdf"),
    "https://example.test/file?token=1&download=%E6%8A%A5%E5%91%8A.pdf#preview"
  );
});

test("emoji panel keeps distinct entries for huff, angry, sleep and sleeping", () => {
  const { emojiMap } = loadJavaScript("components/NEUIKit/utils/emoji.js", {
    "./i18n": { t: (key) => `[${key}]` },
  });
  assert.equal(emojiMap["[huff]"], "icon-a-37");
  assert.equal(emojiMap["[Angry]"], "icon-a-38");
  assert.equal(emojiMap["[Sleep]"], "icon-a-26");
  assert.equal(emojiMap["[Sleeping]"], "icon-a-65");
});

test("message input deletes the trailing emoji token instead of the first match", () => {
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/Chat/message/message-input.vue",
    {
      "./face.vue": emptyComponent,
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../utils/constants": {
        ALLOW_AT: "allowAt",
        events: {},
        REPLY_MSG_TYPE_MAP: {},
        AT_ALL_ACCOUNT: "all",
      },
      "../../utils/emoji": { emojiMap: { "[大笑]": "icon-a-1" } },
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/MessageOneLine.vue": emptyComponent,
      "../../CommonComponents/Appellation.vue": emptyComponent,
      "../../utils": { replaceEmoji: (value) => value },
      "../../utils/store.js": { autorun: () => () => {} },
      "../../utils/eventBus": {
        __esModule: true,
        default: { emit() {}, on() {}, off() {} },
      },
      "../../CommonComponents/Input.vue": emptyComponent,
      "../../utils/toast": { toast: { info() {} } },
      "../../utils/sdk": { V2NIMConst: {} },
      "../../CommonComponents/BottomPopup.vue": emptyComponent,
      "./mention-choose-list.vue": emptyComponent,
      "../../utils/init.js": { nim: {}, uiKitStore: {} },
    }
  );
  const context = { inputText: "[大笑]正文[大笑]" };
  options.methods.handleEmojiDelete.call(context);
  assert.equal(context.inputText, "[大笑]正文");
});

function loadLoginFormOptions({ getSmsCode, loginByCode, init, showToast }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions("components/NEUIKit/Login/components/login-form.vue", {
    vue: { __esModule: true, default: { prototype: {} } },
    "../i18n/zh-cn": {
      __esModule: true,
      default: {
        mobileErrorMsg: "手机号错误",
        smsCodeFailMsg: "验证码获取失败",
        smsCodeNetworkErrorMsg: "短信网络错误",
        loginNetworkErrorMsg: "登录网络错误",
        loginFailMsg: "登录失败",
      },
    },
    "../utils/api": {
      getLoginSmsCode: getSmsCode,
      loginRegisterByCode: loginByCode,
    },
    "./form-input.vue": emptyComponent,
    "../../utils/toast": { showToast },
    "../../utils/init.js": { init },
    "../../utils/uikitRouter": {
      neUiKitRouterPath: { login: "/login", conversation: "/conversation" },
    },
  });
}

test("SMS countdown blocks duplicate backend requests before validation", async () => {
  let requestCount = 0;
  const options = loadLoginFormOptions({
    getSmsCode: async () => {
      requestCount += 1;
    },
    loginByCode: async () => ({}),
    init: () => ({}),
    showToast() {},
  });
  await options.methods.startSmsCount.call({
    mobileInputRule: { reg: /^13800138000$/ },
    loginForm: { mobile: "13800138000" },
    smsCount: 59,
    smsTimer: null,
  });
  assert.equal(requestCount, 0);
});

test("SMS request blocks a second click while the backend is pending", async () => {
  let requestCount = 0;
  let resolveRequest;
  const request = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const options = loadLoginFormOptions({
    getSmsCode: () => {
      requestCount += 1;
      return request;
    },
    loginByCode: async () => ({}),
    init: () => ({}),
    showToast() {},
  });
  const context = {
    mobileInputRule: { reg: /^13800138000$/ },
    loginForm: { mobile: "13800138000" },
    smsCount: 60,
    smsTimer: null,
    smsRequestPending: false,
  };

  const first = options.methods.startSmsCount.call(context);
  const second = options.methods.startSmsCount.call(context);
  assert.equal(requestCount, 1);
  resolveRequest();
  await Promise.all([first, second]);
  clearInterval(context.smsTimer);
});

test("login request blocks a second submit while authentication is pending", async () => {
  let requestCount = 0;
  let resolveRequest;
  const request = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const nim = {
    V2NIMLoginService: {
      async login() {},
      on() {},
      off() {},
    },
  };
  const options = loadLoginFormOptions({
    getSmsCode: async () => {},
    loginByCode: () => {
      requestCount += 1;
      return request;
    },
    init: () => ({ nim, store: { destroy() {} } }),
    showToast() {},
  });
  const context = {
    mobileInputRule: { reg: /^13800138000$/ },
    smsCodeInputRule: { reg: /^1234$/ },
    loginForm: { mobile: "13800138000", smsCode: "1234" },
    loginPending: false,
    $router: { push() {} },
  };
  const originalLocalStorage = global.localStorage;
  global.localStorage = { setItem() {}, removeItem() {} };
  try {
    const first = options.methods.submitLoginForm.call(context);
    const second = options.methods.submitLoginForm.call(context);
    assert.equal(requestCount, 1);
    resolveRequest({ imAccid: "account", imToken: "token" });
    await Promise.all([first, second]);
    assert.equal(context.loginPending, false);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});

test("SDK login failure clears cached credentials and shows an error", async () => {
  const toasts = [];
  let destroyed = 0;
  const nim = {
    V2NIMLoginService: {
      login: async () => {
        throw new Error("SDK unavailable");
      },
      on() {},
      off() {},
    },
  };
  const store = {
    destroy() {
      destroyed += 1;
    },
  };
  const options = loadLoginFormOptions({
    getSmsCode: async () => {},
    loginByCode: async () => ({ imAccid: "account", imToken: "bad-token" }),
    init: () => ({ nim, store }),
    showToast: (value) => toasts.push(value),
  });
  const values = new Map();
  const originalLocalStorage = global.localStorage;
  global.localStorage = {
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  try {
    await options.methods.submitLoginForm.call({
      mobileInputRule: { reg: /^13800138000$/ },
      smsCodeInputRule: { reg: /^1234$/ },
      loginForm: { mobile: "13800138000", smsCode: "1234" },
      $router: { push() {} },
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(values.has("__yx_im_options__h5"), false);
    assert.equal(destroyed, 1);
    assert.deepEqual(toasts, [{ message: "SDK unavailable", type: "info" }]);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});

test("empty optional profile fields can be saved without throwing", () => {
  const emptyComponent = { __esModule: true, default: {} };
  const updates = [];
  const options = loadComponentOptions(
    "components/NEUIKit/User/detail-item-edit.vue",
    {
      "../utils/store.js": { autorun: () => () => {} },
      "../CommonComponents/Icon.vue": emptyComponent,
      "../CommonComponents/NavBar.vue": emptyComponent,
      "../utils/i18n": { t: (key) => key },
      "../CommonComponents/Input.vue": emptyComponent,
      "../utils/toast": { showToast() {} },
      "../utils/init.js": { nim: {}, uiKitStore: {} },
    }
  );
  const context = {
    key: "mobile",
    inputValue: undefined,
    myUserInfo: { accountId: "self" },
    store: {
      userStore: {
        updateSelfUserProfileActive: (profile) => {
          updates.push(profile);
          return Promise.resolve();
        },
      },
    },
    $router: { back() {} },
  };

  assert.doesNotThrow(() => options.methods.onUserInfoConfirm.call(context));
  assert.equal(updates[0].mobile, "");
});

test("logout closes the SDK session before destroying local state", async () => {
  const emptyComponent = { __esModule: true, default: {} };
  const sequence = [];
  let modalOptions;
  const store = {
    destroy() {
      sequence.push("destroy");
    },
  };
  const nim = {
    V2NIMLoginService: {
      async logout() {
        sequence.push("logout");
      },
    },
  };
  const options = loadComponentOptions("components/NEUIKit/User/setting.vue", {
    "../CommonComponents/NavBar.vue": emptyComponent,
    "../CommonComponents/Switch.vue": emptyComponent,
    "../utils/i18n": { t: (key) => key },
    "../utils/toast": { showToast() {} },
    "../utils/uikitRouter": { neUiKitRouterPath: { login: "/login" } },
    "../utils/modal": {
      showModal: (value) => {
        modalOptions = value;
      },
    },
    "../utils/init.js": {
      nim,
      uiKitStore: store,
      clearKickedOfflineHandler: () => sequence.push("unbind"),
    },
  });
  const values = new Map([["__yx_im_options__h5", "cached"]]);
  const originalLocalStorage = global.localStorage;
  global.localStorage = {
    removeItem: (key) => {
      values.delete(key);
      sequence.push("clear");
    },
  };
  try {
    options.methods.handleLogout.call({
      store,
      $router: {
        push(path) {
          sequence.push(["push", path]);
        },
      },
    });
    await modalOptions.onConfirm();
    assert.equal(values.has("__yx_im_options__h5"), false);
    assert.deepEqual(sequence, [
      "logout",
      "unbind",
      "clear",
      "destroy",
      ["push", "/login"],
    ]);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});

test("modal cancellation resolves cleanly for callback-style callers", async () => {
  let modalEvents;
  class FakeVue {
    constructor(options) {
      this.options = options;
      this.$el = { parentNode: null };
    }
    $mount(container) {
      this.$el.parentNode = container;
      this.options.render((component, config) => {
        modalEvents = config.on;
        return { component, config };
      });
    }
    $destroy() {}
  }
  const container = {
    parentNode: null,
    removeChild() {},
  };
  const originalDocument = global.document;
  global.document = {
    createElement: () => container,
    body: {
      appendChild(node) {
        node.parentNode = this;
      },
      removeChild() {},
    },
  };
  try {
    const { modal } = loadJavaScript("components/NEUIKit/utils/modal.js", {
      vue: { __esModule: true, default: FakeVue },
      "../CommonComponents/Modal.vue": { __esModule: true, default: {} },
    });
    let cancelled = 0;
    const resultPromise = modal.confirm({
      title: "危险操作",
      onCancel: () => {
        cancelled += 1;
      },
    });
    modalEvents.cancel();
    assert.equal(await resultPromise, false);
    assert.equal(cancelled, 1);
  } finally {
    global.document = originalDocument;
  }
});

test("toast cleanup removes the Vue2 mounted root element", () => {
  const removed = [];
  const body = {
    appendChild(node) {
      node.parentNode = this;
    },
    removeChild(node) {
      removed.push(node);
      node.parentNode = null;
    },
  };
  const container = { parentNode: null };
  let mountedRoot;
  class FakeVue {
    constructor() {
      this.$el = { kind: "toast-root", parentNode: null };
      mountedRoot = this.$el;
    }
    $mount(target) {
      if (target.parentNode) {
        target.parentNode.removeChild(target);
      }
      body.appendChild(this.$el);
    }
    $destroy() {}
  }
  const originalDocument = global.document;
  const originalSetTimeout = global.setTimeout;
  global.document = {
    createElement: () => container,
    body,
  };
  global.setTimeout = (callback) => {
    callback();
    return 1;
  };
  try {
    const { showToast } = loadJavaScript("components/NEUIKit/utils/toast.js", {
      vue: { __esModule: true, default: FakeVue },
      "../CommonComponents/Toast.vue": { __esModule: true, default: {} },
    });
    showToast({ message: "test", duration: 0 });
    assert.ok(removed.includes(mountedRoot));
  } finally {
    global.document = originalDocument;
    global.setTimeout = originalSetTimeout;
  }
});

function loadAppOptions({ init, showToast, setLanguage = () => {} }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions("App.vue", {
    vue: { __esModule: true, default: { prototype: {} } },
    "./components/TabBar.vue": emptyComponent,
    "./components/NEUIKit/utils/init": { init },
    "./components/NEUIKit/utils/i18n": { setLanguage },
    "./components/NEUIKit/utils/toast": { showToast },
  });
}

test("corrupt cached login data still renders and redirects to login", () => {
  const options = loadAppOptions({ init: () => ({}), showToast() {} });
  const removed = [];
  const originalLocalStorage = global.localStorage;
  const originalConsoleError = console.error;
  global.localStorage = {
    getItem: (key) => (key === "__yx_im_options__h5" ? "not-json" : null),
    removeItem: (key) => removed.push(key),
  };
  console.error = () => {};
  try {
    const routes = [];
    const context = {
      showUiKit: false,
      navigateTo: (path) => routes.push(path),
    };
    options.methods.checkLoginStatus.call(context);
    assert.equal(context.showUiKit, true);
    assert.deepEqual(routes, ["/login"]);
    assert.deepEqual(removed, ["__yx_im_options__h5"]);
  } finally {
    global.localStorage = originalLocalStorage;
    console.error = originalConsoleError;
  }
});

test("automatic SDK login failure clears state and returns to login", async () => {
  const toasts = [];
  const routes = [];
  let destroyed = 0;
  const nim = {
    V2NIMLoginService: {
      login: async () => {
        throw new Error("token expired");
      },
      on() {},
      off() {},
    },
  };
  const store = { destroy: () => (destroyed += 1) };
  const options = loadAppOptions({
    init: () => ({ nim, store }),
    showToast: (value) => toasts.push(value),
  });
  const values = new Map([["__yx_im_options__h5", "cached"]]);
  const originalLocalStorage = global.localStorage;
  global.localStorage = {
    getItem: () => null,
    removeItem: (key) => values.delete(key),
  };
  try {
    const context = {
      showUiKit: false,
      nim: null,
      store: null,
      kickedOfflineHandler: null,
      navigateTo: (path) => routes.push(path),
    };
    options.methods.initIMUiKit.call(context, {
      account: "account",
      token: "expired-token",
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(context.showUiKit, true);
    assert.equal(values.has("__yx_im_options__h5"), false);
    assert.equal(destroyed, 1);
    assert.deepEqual(routes, ["/login"]);
    assert.deepEqual(toasts, [{ message: "token expired", type: "info" }]);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});

function loadChatOptions(showToast = () => {}) {
  const emptyComponent = { __esModule: true, default: {} };
  const emptyComponents = {
    "../CommonComponents/NetworkAlert.vue": emptyComponent,
    "./message/nav-bar.vue": emptyComponent,
    "../CommonComponents/Icon.vue": emptyComponent,
    "./message/message-list.vue": emptyComponent,
    "./message/message-input.vue": emptyComponent,
  };
  return loadComponentOptions("components/NEUIKit/Chat/index.vue", {
    ...emptyComponents,
    "../utils/reporter": { trackInit() {} },
    "../utils/store.js": { autorun: () => () => {} },
    "../utils/constants": {
      HISTORY_LIMIT: 15,
      events: { GET_HISTORY_MSG: "history", ON_SCROLL_BOTTOM: "bottom" },
    },
    "../utils/i18n": { t: (key) => key },
    "../utils/sdk": {
      V2NIMConst: { V2NIMConversationType: {}, V2NIMConnectStatus: {}, V2NIMLoginStatus: {} },
    },
    "../utils/eventBus": {
      __esModule: true,
      default: { on() {}, off() {}, emit() {} },
    },
    "../utils/modal": { showModal() {} },
    "../utils/toast": { showToast },
    "../utils/uikitRouter": { neUiKitRouterPath: {} },
    "../utils/init.js": {
      nim: {
        V2NIMConversationIdUtil: {},
        V2NIMMessageService: { on() {}, off() {} },
        V2NIMTeamService: { on() {}, off() {} },
      },
      uiKitStore: {},
    },
  });
}

test("chat history loading resets when no conversation is selected", async () => {
  const options = loadChatOptions();
  const context = {
    noMore: false,
    loadingMore: false,
    conversationId: "",
    store: { msgStore: {} },
    handleHistoryMsgReceipt() {},
  };
  assert.deepEqual(await options.methods.getHistory.call(context, Date.now()), []);
  assert.equal(context.loadingMore, false);
});

test("event-driven history loading consumes failures and reports them", async () => {
  const toasts = [];
  const options = loadChatOptions((value) => toasts.push(value));
  let catchAttached = false;
  const historyPromise = {
    catch(handler) {
      catchAttached = true;
      handler(new Error("history failed"));
      return Promise.resolve([]);
    },
  };
  const result = options.methods.loadMoreMsgs.call(
    { getHistory: () => historyPromise },
    { createTime: 123, messageServerId: "server-id" }
  );
  assert.ok(result && typeof result.then === "function");
  assert.equal(catchAttached, true);
  assert.deepEqual(await result, []);
  assert.deepEqual(toasts, [
    { message: "getHistoryMsgFailedText", type: "info" },
  ]);
});

test("controlled switch restores its prop value until the parent confirms", () => {
  const options = loadComponentOptions(
    "components/NEUIKit/CommonComponents/Switch.vue"
  );
  const emitted = [];
  const target = { checked: true };
  options.methods.handleChange.call(
    {
      checked: false,
      $emit: (...args) => emitted.push(args),
      $nextTick: (callback) => callback(),
    },
    { target }
  );
  assert.deepEqual(emitted, [["change", true]]);
  assert.equal(target.checked, false);
});

test("friend blacklist toggle rolls back when the SDK request fails", async () => {
  const emptyComponent = { __esModule: true, default: {} };
  const toasts = [];
  const options = loadComponentOptions(
    "components/NEUIKit/Friend/friend-card/index.vue",
    {
      "../../CommonComponents/UserCard.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../utils/store.js": { autorun: () => () => {} },
      "../../utils/sdk": { V2NIMConst: {} },
      "../../CommonComponents/Switch.vue": emptyComponent,
      "../../utils/toast": {
        toast: { info: (value) => toasts.push(value) },
        showToast() {},
      },
      "../../utils/modal": { modal: { confirm() {} } },
      "../../utils/uikitRouter": { neUiKitRouterPath: {} },
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../utils/init.js": { nim: {}, uiKitStore: {} },
    }
  );
  const context = {
    account: "friend",
    isInBlacklist: false,
    store: {
      relationStore: {
        addUserToBlockListActive: async () => {
          throw new Error("failed");
        },
        removeUserFromBlockListActive: async () => {},
      },
    },
  };
  await options.methods.handleSwitchChange.call(context, true);
  assert.equal(context.isInBlacklist, false);
  assert.deepEqual(toasts, ["setBlackFailText"]);
});

test("Vue2 route table preserves every Vue3 route path", () => {
  const routePattern = /path:\s*neUiKitRouterPath\.([A-Za-z0-9_]+)/g;
  const collect = (source) => [...source.matchAll(routePattern)].map((match) => match[1]).sort();
  const vue2Routes = read(path.join(vue2SourceRoot, "router/index.js"));
  const vue3Routes = read(path.join(vue3SourceRoot, "router/index.ts"));
  assert.deepEqual(collect(vue2Routes), collect(vue3Routes));
});
