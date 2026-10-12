const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const babel = require("@babel/core");
const compiler = require("vue-template-compiler");

const sourceRoot = path.resolve(__dirname, "../src");

function read(relativeFile) {
  return fs.readFileSync(path.join(sourceRoot, relativeFile), "utf8");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function loadComponentOptions(relativeFile, mocks = {}) {
  const component = compiler.parseComponent(read(relativeFile));
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
  const transformed = babel.transformSync(read(relativeFile), {
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

function loadFriendApplications({ nim, store, toast }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions(
    "components/NEUIKit/Contact/contact-list/valid-list.vue",
    {
      "../../utils/store.js": { autorun: () => () => {} },
      "../../CommonComponents/Empty.vue": emptyComponent,
      "../../CommonComponents/Avatar.vue": emptyComponent,
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../utils/sdk": { V2NIMConst: {} },
      "../../CommonComponents/Appellation.vue": emptyComponent,
      "../../utils/toast": { toast },
      "../../utils/init.js": { nim, uiKitStore: store },
    }
  );
}

function loadMessageInput({ nim, store, toast }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions(
    "components/NEUIKit/Chat/message/message-input.vue",
    {
      "./face.vue": emptyComponent,
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../utils/constants": {
        ALLOW_AT: "allowAt",
        events: { ON_SCROLL_BOTTOM: "scroll-bottom" },
        REPLY_MSG_TYPE_MAP: {},
        AT_ALL_ACCOUNT: "all",
      },
      "../../utils/emoji": { emojiMap: {} },
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/MessageOneLine.vue": emptyComponent,
      "../../CommonComponents/Appellation.vue": emptyComponent,
      "../../utils": { replaceEmoji: (text) => text },
      "../../utils/store.js": { autorun: () => () => {} },
      "../../utils/eventBus": {
        __esModule: true,
        default: { emit() {}, on() {}, off() {} },
      },
      "../../CommonComponents/Input.vue": emptyComponent,
      "../../utils/toast": { toast },
      "../../utils/sdk": { V2NIMConst: {} },
      "../../CommonComponents/BottomPopup.vue": emptyComponent,
      "./mention-choose-list.vue": emptyComponent,
      "../../utils/init.js": { nim, uiKitStore: store },
    }
  );
}

test("Vue2 pages render the UIKit switch component instead of the reserved SVG tag", () => {
  const switchConsumers = [
    "components/NEUIKit/User/setting.vue",
    "components/NEUIKit/Chat/p2p-setting.vue",
    "components/NEUIKit/Friend/friend-card/index.vue",
    "components/NEUIKit/Team/team-setting/index.vue",
  ];

  for (const relativeFile of switchConsumers) {
    const component = compiler.parseComponent(read(relativeFile));
    const template = component.template.content;
    const script = component.script.content;

    assert.doesNotMatch(template, /<Switch\b/);
    assert.match(template, /<UIKitSwitch\b/);
    assert.match(script, /import\s+UIKitSwitch\s+from/);
    assert.match(script, /components:\s*\{[\s\S]*\bUIKitSwitch\b/);
  }
});

test("Vue component styles cannot leak into pages visited later", () => {
  const failures = walk(path.join(sourceRoot, "components/NEUIKit"))
    .filter((file) => file.endsWith(".vue"))
    .flatMap((file) => {
      const component = compiler.parseComponent(fs.readFileSync(file, "utf8"));
      return component.styles
        .filter((style) => style.content.trim() && !style.scoped)
        .map(() => path.relative(sourceRoot, file));
    });

  assert.deepEqual(failures, []);
});

test("navigation titles are not treated as background image URLs", () => {
  const source = read("components/NEUIKit/CommonComponents/NavBar.vue");
  assert.doesNotMatch(source, /backgroundImage\s*:/);
});

test("team nickname editor exposes its cancel navigation action", () => {
  const component = compiler.parseComponent(
    read("components/NEUIKit/Team/team-setting/team-nick-edit.vue")
  );
  assert.match(component.template.content, /<NavBar[^>]*:showLeft=["']true["']/);
  assert.match(component.template.content, /v-slot:left/);
});

function loadTeamNickEditor({ store, autorun, toast }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions(
    "components/NEUIKit/Team/team-setting/team-nick-edit.vue",
    {
      "../../utils/store.js": { autorun },
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/Input.vue": emptyComponent,
      "../../utils/toast": { toast },
      "../../utils/team.js": { ensureTeamMembers: async () => [] },
      "../../utils/init.js": { nim: {}, uiKitStore: store },
    }
  );
}

function loadProfileEditor({ store, showToast = () => {}, autorun = () => () => {} }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions("components/NEUIKit/User/detail-item-edit.vue", {
    "../utils/store.js": { autorun },
    "../CommonComponents/Icon.vue": emptyComponent,
    "../CommonComponents/NavBar.vue": emptyComponent,
    "../utils/i18n": { t: (key) => key },
    "../CommonComponents/Input.vue": emptyComponent,
    "../utils/toast": { showToast },
    "../utils/init.js": { nim: {}, uiKitStore: store },
  });
}

function loadP2pSettings({ store, toast }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions("components/NEUIKit/Chat/p2p-setting.vue", {
    "../CommonComponents/NavBar.vue": emptyComponent,
    "../CommonComponents/Avatar.vue": emptyComponent,
    "../CommonComponents/Icon.vue": emptyComponent,
    "../utils/store.js": { autorun: () => () => {} },
    "../utils/i18n": { t: (key) => key },
    "../utils/sdk": {
      V2NIMConst: {
        V2NIMP2PMessageMuteMode: {
          V2NIM_P2P_MESSAGE_MUTE_MODE_ON: 1,
          V2NIM_P2P_MESSAGE_MUTE_MODE_OFF: 0,
        },
      },
    },
    "../utils/toast": { toast },
    "../CommonComponents/Switch.vue": emptyComponent,
    "../utils/uikitRouter": { neUiKitRouterPath: {} },
    "../utils/init.js": { nim: {}, uiKitStore: store },
  });
}

function loadFriendCard({ store, toast }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions(
    "components/NEUIKit/Friend/friend-card/index.vue",
    {
      "../../CommonComponents/UserCard.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../utils/store.js": { autorun: () => () => {} },
      "../../utils/sdk": { V2NIMConst: {} },
      "../../CommonComponents/Switch.vue": emptyComponent,
      "../../utils/toast": { toast, showToast() {} },
      "../../utils/modal": { modal: { confirm() {} } },
      "../../utils/uikitRouter": { neUiKitRouterPath: {} },
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../utils/init.js": { nim: {}, uiKitStore: store },
    }
  );
}

function loadAddFriend({ nim = {}, store, showToast = () => {} }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions(
    "components/NEUIKit/Friend/add-friend/index.vue",
    {
      "../../CommonComponents/Avatar.vue": emptyComponent,
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../CommonComponents/Empty.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/Button.vue": emptyComponent,
      "../../utils/store.js": { autorun: () => () => {} },
      "../../utils/sdk": {
        V2NIMConst: {
          V2NIMFriendAddMode: {
            V2NIM_FRIEND_MODE_TYPE_APPLY: 1,
          },
        },
      },
      "../../CommonComponents/Input.vue": emptyComponent,
      "../../utils/toast": { showToast },
      "../../utils/uikitRouter": {
        neUiKitRouterPath: { chat: "/chat" },
      },
      "../../utils/init.js": { nim, uiKitStore: store },
    }
  );
}

function loadTeamMemberPage({ store, autorun, showToast = () => {} }) {
  const emptyComponent = { __esModule: true, default: {} };
  return loadComponentOptions(
    "components/NEUIKit/Team/team-member/index.vue",
    {
      "../../CommonComponents/Avatar.vue": emptyComponent,
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../utils/store.js": { autorun },
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/Appellation.vue": emptyComponent,
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../CommonComponents/Empty.vue": emptyComponent,
      "../../utils/sdk": {
        V2NIMConst: {
          V2NIMTeamMemberRole: {
            V2NIM_TEAM_MEMBER_ROLE_OWNER: 1,
            V2NIM_TEAM_MEMBER_ROLE_MANAGER: 2,
          },
          V2NIMTeamInviteMode: {
            V2NIM_TEAM_INVITE_MODE_ALL: 1,
          },
        },
      },
      "../../utils/modal": { showModal() {} },
      "../../utils/toast": { showToast },
      "../../utils/uikitRouter": { neUiKitRouterPath: {} },
      "../../utils/team.js": { ensureTeam: async () => null },
      "../../utils/init.js": { nim: {}, uiKitStore: store },
    }
  );
}

test("asynchronous switch controls expose disabled pending states", () => {
  const expectations = [
    ["components/NEUIKit/Chat/p2p-setting.vue", ["mutePending", "stickTopPending"]],
    ["components/NEUIKit/Friend/friend-card/index.vue", ["blacklistPending"]],
    [
      "components/NEUIKit/Team/team-setting/index.vue",
      ["stickTopPending", "teamMutePending", "teamBannedPending"],
    ],
  ];

  for (const [relativeFile, pendingStates] of expectations) {
    const template = compiler.parseComponent(read(relativeFile)).template.content;
    for (const pendingState of pendingStates) {
      assert.match(
        template,
        new RegExp(`<UIKitSwitch[\\s\\S]*?:disabled=["']${pendingState}["']`)
      );
    }
  }
});

test("single-chat switches ignore overlapping requests independently", async () => {
  let muteRequests = 0;
  let stickRequests = 0;
  let resolveMute;
  let resolveStick;
  const muteRequest = new Promise((resolve) => {
    resolveMute = resolve;
  });
  const stickRequest = new Promise((resolve) => {
    resolveStick = resolve;
  });
  const store = {
    relationStore: {
      setP2PMessageMuteModeActive: () => {
        muteRequests += 1;
        return muteRequest;
      },
    },
    localConversationStore: {
      stickTopConversationActive: () => {
        stickRequests += 1;
        return stickRequest;
      },
    },
  };
  const options = loadP2pSettings({ store, toast: { info() {} } });
  const context = {
    store,
    account: "friend",
    conversationId: "p2p:friend",
    enableV2CloudConversation: false,
    mutePending: false,
    stickTopPending: false,
  };

  const muteFirst = options.methods.changeSessionMute.call(context, false);
  const muteSecond = options.methods.changeSessionMute.call(context, true);
  const stickFirst = options.methods.changeStickTopInfo.call(context, true);
  const stickSecond = options.methods.changeStickTopInfo.call(context, false);
  assert.equal(muteRequests, 1);
  assert.equal(stickRequests, 1);

  resolveMute();
  resolveStick();
  await Promise.all([muteFirst, muteSecond, stickFirst, stickSecond]);
  assert.equal(context.mutePending, false);
  assert.equal(context.stickTopPending, false);
});

test("blacklist switch ignores overlapping requests", async () => {
  let requests = 0;
  let resolveRequest;
  const pending = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const store = {
    relationStore: {
      addUserToBlockListActive: () => {
        requests += 1;
        return pending;
      },
    },
  };
  const options = loadFriendCard({ store, toast: { info() {} } });
  const context = {
    store,
    account: "friend",
    isInBlacklist: false,
    blacklistPending: false,
  };

  const first = options.methods.handleSwitchChange.call(context, true);
  const second = options.methods.handleSwitchChange.call(context, true);
  assert.equal(requests, 1);
  resolveRequest();
  await Promise.all([first, second]);
  assert.equal(context.blacklistPending, false);
});

test("empty friend search resets the page without requesting a user", async () => {
  let requests = 0;
  const store = {
    userStore: {
      getUserActive: async () => {
        requests += 1;
      },
    },
  };
  const options = loadAddFriend({ store });
  const context = {
    store,
    searchResState: "searchResult",
    userInfo: { accountId: "old" },
    relation: "friend",
    searchRequestId: 0,
    searchPending: false,
  };

  await options.methods.handleSearch.call(context, "   ");

  assert.equal(requests, 0);
  assert.equal(context.searchResState, "beginSearch");
  assert.equal(context.userInfo, null);
});

test("a late friend search response cannot replace the latest result", async () => {
  let resolveOldSearch;
  const oldSearch = new Promise((resolve) => {
    resolveOldSearch = resolve;
  });
  const store = {
    userStore: {
      getUserActive: (accountId) =>
        accountId === "old" ? oldSearch : Promise.resolve({ accountId }),
    },
    uiStore: {
      getRelation: () => ({ relation: "stranger" }),
    },
  };
  const options = loadAddFriend({ store });
  const context = {
    store,
    searchResState: "beginSearch",
    userInfo: null,
    relation: "stranger",
    searchRequestId: 0,
    searchPending: false,
  };

  const first = options.methods.handleSearch.call(context, "old");
  const second = options.methods.handleSearch.call(context, "new");
  await second;
  resolveOldSearch({ accountId: "old" });
  await first;

  assert.equal(context.userInfo.accountId, "new");
  assert.equal(context.searchResState, "searchResult");
  assert.equal(context.searchPending, false);
});

test("editing a friend search invalidates the displayed and pending result", () => {
  const options = loadAddFriend({ store: {} });
  const context = {
    searchResState: "searchResult",
    userInfo: { accountId: "old" },
    relation: "friend",
    searchRequestId: 3,
    searchPending: true,
  };

  options.methods.onInputValueChange.call(context, {
    target: { value: "new" },
  });

  assert.equal(context.searchRequestId, 4);
  assert.equal(context.searchResState, "beginSearch");
  assert.equal(context.userInfo, null);
  assert.equal(context.relation, "stranger");
  assert.equal(context.searchPending, false);
});

test("friend search actions ignore overlapping clicks", async () => {
  let applyRequests = 0;
  let chatRequests = 0;
  let resolveApply;
  let resolveChat;
  const applyRequest = new Promise((resolve) => {
    resolveApply = resolve;
  });
  const chatRequest = new Promise((resolve) => {
    resolveChat = resolve;
  });
  const store = {
    friendStore: {
      addFriendActive: () => {
        applyRequests += 1;
        return applyRequest;
      },
    },
    relationStore: {
      removeUserFromBlockListActive: async () => {},
    },
    uiStore: {
      selectConversation: () => {
        chatRequests += 1;
        return chatRequest;
      },
    },
  };
  const nim = {
    V2NIMConversationIdUtil: {
      p2pConversationId: (accountId) => `p2p:${accountId}`,
    },
  };
  const options = loadAddFriend({ nim, store });
  const context = {
    store,
    nim,
    userInfo: { accountId: "friend" },
    actionPending: false,
    $router: { push() {} },
  };

  const applyFirst = options.methods.applyFriend.call(context);
  const applySecond = options.methods.applyFriend.call(context);
  assert.equal(applyRequests, 1);
  resolveApply();
  await Promise.all([applyFirst, applySecond]);

  const chatFirst = options.methods.gotoChat.call(context);
  const chatSecond = options.methods.gotoChat.call(context);
  assert.equal(chatRequests, 1);
  resolveChat();
  await Promise.all([chatFirst, chatSecond]);
  assert.equal(context.actionPending, false);
});

test("friend search action buttons expose their pending disabled state", () => {
  const template = compiler.parseComponent(
    read("components/NEUIKit/Friend/add-friend/index.vue")
  ).template.content;

  assert.equal(
    (template.match(/<Button[\s\S]*?:disabled=["']actionPending["']/g) || [])
      .length,
    2
  );
});

test("team member page fetches members when its cache starts empty", async () => {
  let refresh;
  let requests = 0;
  const members = [];
  const store = {
    teamStore: {
      teams: new Map([
        ["team-1", { teamId: "team-1", memberLimit: 500 }],
      ]),
    },
    teamMemberStore: {
      getTeamMember: () => members,
      getTeamMemberActive: async (options) => {
        requests += 1;
        assert.deepEqual(options, {
          teamId: "team-1",
          queryOption: { limit: 500, roleQueryType: 0 },
        });
        members.push({ accountId: "owner", memberRole: 1, joinTime: 1 });
        refresh();
      },
    },
  };
  const options = loadTeamMemberPage({
    store,
    autorun: (callback) => {
      refresh = callback;
      callback();
      return () => {};
    },
  });
  const context = {
    store,
    $route: { query: { teamId: "team-1" } },
    teamId: "",
    team: null,
    teamMembers: [],
    memberLoading: false,
    uninstallteamMembersWatch: null,
    loadTeamMembers: options.methods.loadTeamMembers,
  };

  options.mounted.call(context);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(requests, 1);
  assert.equal(context.teamMembers.length, 1);
  assert.equal(context.memberLoading, false);
});

test("team member page skips member requests without a team id", async () => {
  let requests = 0;
  const store = {
    teamStore: { teams: new Map() },
    teamMemberStore: {
      getTeamMember: () => [],
      getTeamMemberActive: async () => {
        requests += 1;
      },
    },
  };
  const options = loadTeamMemberPage({
    store,
    autorun: (callback) => {
      callback();
      return () => {};
    },
  });
  const context = {
    store,
    $route: { query: {} },
    teamId: "",
    team: null,
    teamMembers: [],
    memberLoading: false,
    uninstallteamMembersWatch: null,
    loadTeamMembers: options.methods.loadTeamMembers,
  };

  options.mounted.call(context);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(requests, 0);
  assert.equal(context.memberLoading, false);
});

test("team member page distinguishes loading from an empty result", () => {
  const template = compiler.parseComponent(
    read("components/NEUIKit/Team/team-member/index.vue")
  ).template.content;

  assert.match(template, /v-else-if=["']memberLoading["']/);
  assert.match(template, /t\(["']loadingMoreText["']\)/);
});

test("team nickname editor keeps a local draft when member data refreshes", () => {
  let refresh;
  let disposed = 0;
  let member = null;
  const store = {
    userStore: { myUserInfo: null },
    teamMemberStore: {
      getTeamMember: () => (member ? [member] : []),
    },
  };
  const options = loadTeamNickEditor({
    store,
    autorun: (callback) => {
      refresh = callback;
      callback();
      return () => {
        disposed += 1;
      };
    },
    toast: { info() {} },
  });
  const context = {
    store,
    $route: { query: { teamId: "team-1" } },
    teamId: "",
    inputValue: "",
    inputDirty: false,
    myMemberInfo: null,
    uninstallTeamMemberWatch: null,
  };

  assert.doesNotThrow(() => options.mounted.call(context));
  store.userStore.myUserInfo = { accountId: "self" };
  member = { accountId: "self", teamNick: "server nick" };
  refresh();
  assert.equal(context.inputValue, "server nick");

  options.methods.onInputChange.call(context, { target: { value: "local draft" } });
  member.teamNick = "new server nick";
  refresh();
  assert.equal(context.inputValue, "local draft");

  options.beforeDestroy.call(context);
  assert.equal(disposed, 1);
});

test("team nickname save ignores overlapping confirmation clicks", async () => {
  let requests = 0;
  let resolveRequest;
  let backs = 0;
  const pending = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const store = {
    teamMemberStore: {
      updateMyMemberInfoActive: () => {
        requests += 1;
        return pending;
      },
    },
  };
  const options = loadTeamNickEditor({
    store,
    autorun: () => () => {},
    toast: { info() {} },
  });
  const context = {
    store,
    teamId: "team-1",
    inputValue: "nickname",
    savePending: false,
    back: () => {
      backs += 1;
    },
  };

  const first = options.methods.onOk.call(context);
  const second = options.methods.onOk.call(context);
  assert.equal(requests, 1);
  resolveRequest();
  await Promise.all([first, second]);
  assert.equal(context.savePending, false);
  assert.equal(backs, 1);
});

test("profile editor rejects decimal phone values", async () => {
  const updates = [];
  const toasts = [];
  const store = {
    userStore: {
      updateSelfUserProfileActive: (profile) => {
        updates.push(profile);
        return Promise.resolve();
      },
    },
  };
  const options = loadProfileEditor({
    store,
    showToast: (value) => toasts.push(value),
  });
  const context = {
    key: "mobile",
    inputValue: "123.45",
    myUserInfo: { accountId: "self" },
    savePending: false,
    store,
    $router: { back() {} },
  };

  await options.methods.onUserInfoConfirm.call(context);
  assert.equal(updates.length, 0);
  assert.deepEqual(toasts, [{ message: "telErrorText", type: "info" }]);
});

test("profile editor anchors email validation and accepts numeric segments", async () => {
  const updates = [];
  const toasts = [];
  const store = {
    userStore: {
      updateSelfUserProfileActive: (profile) => {
        updates.push(profile);
        return Promise.resolve();
      },
    },
  };
  const options = loadProfileEditor({
    store,
    showToast: (value) => toasts.push(value),
  });
  const context = {
    key: "email",
    inputValue: "bad value@example.com",
    myUserInfo: { accountId: "self" },
    savePending: false,
    store,
    $router: { back() {} },
  };

  await options.methods.onUserInfoConfirm.call(context);
  assert.equal(updates.length, 0);
  assert.deepEqual(toasts, [{ message: "emailErrorText", type: "info" }]);

  context.inputValue = "first.123@example.com";
  await options.methods.onUserInfoConfirm.call(context);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].email, "first.123@example.com");
});

test("profile editor keeps a local draft when profile data refreshes", () => {
  let refresh;
  let disposed = 0;
  const store = { userStore: { myUserInfo: null } };
  const options = loadProfileEditor({
    store,
    autorun: (callback) => {
      refresh = callback;
      callback();
      return () => {
        disposed += 1;
      };
    },
  });
  const context = {
    store,
    $route: { query: { key: "name" } },
    key: "",
    inputValue: "",
    inputDirty: false,
    myUserInfo: null,
    uninstallMyUserInfoWatch: null,
  };

  assert.doesNotThrow(() => options.mounted.call(context));
  store.userStore.myUserInfo = { accountId: "self", name: "server name" };
  refresh();
  assert.equal(context.inputValue, "server name");

  options.methods.onInputChange.call(context, { target: { value: "local draft" } });
  store.userStore.myUserInfo = { accountId: "self", name: "new server name" };
  refresh();
  assert.equal(context.inputValue, "local draft");

  options.beforeDestroy.call(context);
  assert.equal(disposed, 1);
});

test("profile editor save ignores overlapping confirmation clicks", async () => {
  let requests = 0;
  let resolveRequest;
  let backs = 0;
  const pending = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const store = {
    userStore: {
      updateSelfUserProfileActive: () => {
        requests += 1;
        return pending;
      },
    },
  };
  const options = loadProfileEditor({ store });
  const context = {
    key: "name",
    inputValue: "nickname",
    myUserInfo: { accountId: "self" },
    savePending: false,
    store,
    $router: {
      back: () => {
        backs += 1;
      },
    },
  };

  const first = options.methods.onUserInfoConfirm.call(context);
  const second = options.methods.onUserInfoConfirm.call(context);
  assert.equal(requests, 1);
  resolveRequest();
  await Promise.all([first, second]);
  assert.equal(context.savePending, false);
  assert.equal(backs, 1);
});

test("automatic login preserves a valid deep link with its query parameters", async () => {
  const routes = [];
  const nim = {
    V2NIMLoginService: { login: async () => {} },
  };
  const store = { destroy() {} };
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions("App.vue", {
    vue: { __esModule: true, default: { prototype: {} } },
    "./components/TabBar.vue": emptyComponent,
    "./components/NEUIKit/utils/init": {
      init: () => ({ nim, store }),
      bindKickedOfflineHandler() {},
      clearKickedOfflineHandler() {},
    },
    "./components/NEUIKit/utils/i18n": { setLanguage() {} },
    "./components/NEUIKit/utils/toast": { showToast() {} },
  });
  const context = {
    $route: {
      path: "/team/setting",
      fullPath: "/team/setting?teamId=team-1",
    },
    showUiKit: false,
    nim: null,
    store: null,
    kickedOfflineHandler: null,
    navigateTo: (path) => routes.push(path),
  };
  const originalLocalStorage = global.localStorage;
  global.localStorage = { getItem: () => null, removeItem() {} };

  try {
    options.methods.initIMUiKit.call(context, {
      account: "account",
      token: "token",
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(routes, []);
    assert.equal(context.showUiKit, true);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});

test("accepting a friend application does not send a message when acceptance fails", async () => {
  let sentMessages = 0;
  const toastMessages = [];
  const nim = {
    V2NIMMessageCreator: {
      createTextMessage: (text) => ({ text }),
    },
    V2NIMConversationIdUtil: {
      p2pConversationId: (accountId) => `p2p:${accountId}`,
    },
  };
  const store = {
    friendStore: {
      acceptAddApplicationActive: async () => {
        throw new Error("accept failed");
      },
    },
    msgStore: {
      sendMessageActive: async () => {
        sentMessages += 1;
      },
    },
  };
  const options = loadFriendApplications({
    nim,
    store,
    toast: { info: (message) => toastMessages.push(message) },
  });
  const context = { applyFriendLoading: false, store };

  await options.methods.handleAcceptApplyFriendClick.call(context, {
    operatorAccountId: "applicant",
  });

  assert.equal(sentMessages, 0);
  assert.equal(context.applyFriendLoading, false);
  assert.deepEqual(toastMessages, ["acceptFailedText"]);
});

test("friend application actions ignore overlapping clicks", async () => {
  let acceptRequests = 0;
  let resolveAcceptance;
  const acceptance = new Promise((resolve) => {
    resolveAcceptance = resolve;
  });
  const nim = {
    V2NIMMessageCreator: {
      createTextMessage: (text) => ({ text }),
    },
    V2NIMConversationIdUtil: {
      p2pConversationId: (accountId) => `p2p:${accountId}`,
    },
  };
  const store = {
    friendStore: {
      acceptAddApplicationActive: () => {
        acceptRequests += 1;
        return acceptance;
      },
    },
    msgStore: {
      sendMessageActive: async () => {},
    },
  };
  const options = loadFriendApplications({
    nim,
    store,
    toast: { info() {} },
  });
  const context = { applyFriendLoading: false, store };
  const message = { operatorAccountId: "applicant" };

  const first = options.methods.handleAcceptApplyFriendClick.call(context, message);
  const second = options.methods.handleAcceptApplyFriendClick.call(context, message);

  assert.equal(acceptRequests, 1);
  resolveAcceptance();
  await Promise.all([first, second]);
  assert.equal(context.applyFriendLoading, false);
});

test("friend application rejection ignores overlapping clicks", async () => {
  let rejectRequests = 0;
  let resolveRejection;
  const rejection = new Promise((resolve) => {
    resolveRejection = resolve;
  });
  const store = {
    friendStore: {
      rejectAddApplicationActive: () => {
        rejectRequests += 1;
        return rejection;
      },
    },
  };
  const options = loadFriendApplications({
    nim: {},
    store,
    toast: { info() {} },
  });
  const context = { applyFriendLoading: false, store };

  const first = options.methods.handleRejectApplyFriendClick.call(context, {});
  const second = options.methods.handleRejectApplyFriendClick.call(context, {});

  assert.equal(rejectRequests, 1);
  resolveRejection();
  await Promise.all([first, second]);
  assert.equal(context.applyFriendLoading, false);
});

test("friend application actions use native buttons that disable while pending", () => {
  const component = compiler.parseComponent(
    read("components/NEUIKit/Contact/contact-list/valid-list.vue")
  );
  const template = component.template.content;

  assert.equal((template.match(/<button\b/g) || []).length, 2);
  assert.equal(
    (template.match(/:disabled=["']applyFriendLoading["']/g) || []).length,
    2
  );
  assert.doesNotMatch(template, /:loading=["']applyFriendLoading["']/);
});

test("team member picker reacts when friends and team members load after mount", () => {
  let refresh;
  let disposed = 0;
  const friends = [];
  const blacklist = [];
  const teamMembers = [];
  const store = {
    uiStore: { friends },
    relationStore: { blacklist },
    teamMemberStore: {
      getTeamMember: () => teamMembers,
    },
  };
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/Team/team-add/index.vue",
    {
      "../../CommonComponents/PersonSelect.vue": emptyComponent,
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../utils": { debounce: (callback) => callback },
      "../../utils/store.js": {
        autorun: (callback) => {
          refresh = callback;
          callback();
          return () => {
            disposed += 1;
          };
        },
      },
      "../../utils/toast": { toast: { info() {} } },
      "../../utils/team.js": { ensureTeamMembers: async () => [] },
      "../../utils/init.js": { nim: {}, uiKitStore: store },
    }
  );
  const context = {
    store,
    $route: { query: { teamId: "team-1" } },
    teamId: "",
    friendList: [],
    friendListWatch: null,
  };

  options.mounted.call(context);
  assert.equal(typeof refresh, "function");

  friends.push(
    { accountId: "available" },
    { accountId: "existing" },
    { accountId: "blocked" }
  );
  teamMembers.push({ accountId: "existing" });
  blacklist.push("blocked");
  refresh();

  assert.deepEqual(context.friendList, [
    { accountId: "available" },
    { accountId: "existing", disabled: true },
  ]);
  options.beforeDestroy.call(context);
  assert.equal(disposed, 1);
});

test("team creation reacts to late friend data and preserves current selections", () => {
  let refresh;
  let disposed = 0;
  const friends = [];
  const blacklist = [];
  const store = {
    uiStore: { friends },
    relationStore: { blacklist },
  };
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/Team/team-create/index.vue",
    {
      "../../CommonComponents/PersonSelect.vue": emptyComponent,
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../utils/store.js": {
        autorun: (callback) => {
          refresh = callback;
          callback();
          return () => {
            disposed += 1;
          };
        },
      },
      "../../utils/toast": { toast: { info() {} } },
      "../../utils/uikitRouter": { neUiKitRouterPath: { chat: "/chat" } },
      "../../utils/init.js": { nim: {}, uiKitStore: store },
    }
  );
  const context = {
    store,
    $route: { query: { p2pConversationId: "direct" } },
    p2pConversationId: "",
    friendList: [],
    friendListWatch: null,
  };

  options.mounted.call(context);
  assert.equal(typeof refresh, "function");

  friends.push(
    { accountId: "selected" },
    { accountId: "direct" },
    { accountId: "blocked" }
  );
  blacklist.push("blocked");
  refresh();
  assert.deepEqual(context.friendList, [
    { accountId: "selected", checked: false },
  ]);

  options.methods.checkboxChange.call(context, ["selected"]);
  friends.push({ accountId: "new-friend" });
  refresh();
  assert.deepEqual(context.friendList, [
    { accountId: "selected", checked: true },
    { accountId: "new-friend", checked: false },
  ]);

  options.beforeDestroy.call(context);
  assert.equal(disposed, 1);
});

test("kicked-offline listener registration replaces and clears stale handlers", () => {
  class RootStore {}
  const session = loadJavaScript("components/NEUIKit/utils/init.js", {
    "./store.js": { __esModule: true, default: RootStore },
    "./sdk": {
      V2NIM: {},
      V2NIMConst: {
        V2NIMTeamAgreeMode: {
          V2NIM_TEAM_AGREE_MODE_NO_AUTH: 0,
        },
      },
    },
  });

  assert.equal(typeof session.bindKickedOfflineHandler, "function");
  assert.equal(typeof session.clearKickedOfflineHandler, "function");

  const events = [];
  const sdk = {
    V2NIMLoginService: {
      on: (event, handler) => events.push(["on", event, handler]),
      off: (event, handler) => events.push(["off", event, handler]),
    },
  };
  const firstHandler = () => {};
  const secondHandler = () => {};

  session.bindKickedOfflineHandler(sdk, firstHandler);
  session.bindKickedOfflineHandler(sdk, secondHandler);
  session.clearKickedOfflineHandler();

  assert.deepEqual(events, [
    ["on", "onKickedOffline", firstHandler],
    ["off", "onKickedOffline", firstHandler],
    ["on", "onKickedOffline", secondHandler],
    ["off", "onKickedOffline", secondHandler],
  ]);
});

test("App routes kicked-offline registration through the shared lifecycle", async () => {
  let boundHandler = null;
  let directRegistrations = 0;
  const nim = {
    V2NIMLoginService: {
      login: async () => {},
      on: () => {
        directRegistrations += 1;
      },
      off() {},
    },
  };
  const store = { destroy() {} };
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions("App.vue", {
    vue: { __esModule: true, default: { prototype: {} } },
    "./components/TabBar.vue": emptyComponent,
    "./components/NEUIKit/utils/init": {
      init: () => ({ nim, store }),
      bindKickedOfflineHandler: (sdk, handler) => {
        assert.equal(sdk, nim);
        boundHandler = handler;
      },
      clearKickedOfflineHandler() {},
    },
    "./components/NEUIKit/utils/i18n": { setLanguage() {} },
    "./components/NEUIKit/utils/toast": { showToast() {} },
  });
  const context = {
    nim: null,
    store: null,
    kickedOfflineHandler: null,
    showUiKit: false,
    navigateTo: async () => {},
  };
  const originalLocalStorage = global.localStorage;
  global.localStorage = { getItem: () => null, removeItem() {} };

  try {
    options.methods.initIMUiKit.call(context, {
      account: "account",
      token: "token",
    });
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(boundHandler, context.kickedOfflineHandler);
    assert.equal(directRegistrations, 0);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});

test("SMS login routes kicked-offline registration through the shared lifecycle", async () => {
  let boundHandler = null;
  let directRegistrations = 0;
  const nim = {
    V2NIMLoginService: {
      login: async () => {},
      on: () => {
        directRegistrations += 1;
      },
      off() {},
    },
  };
  const store = { destroy() {} };
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/Login/components/login-form.vue",
    {
      vue: { __esModule: true, default: { prototype: {} } },
      "../i18n/zh-cn": {
        __esModule: true,
        default: { loginFailMsg: "登录失败", smsCodeFailMsg: "验证码失败" },
      },
      "../utils/api": {
        getLoginSmsCode: async () => {},
        loginRegisterByCode: async () => ({
          imAccid: "account",
          imToken: "token",
        }),
      },
      "./form-input.vue": emptyComponent,
      "../../utils/toast": { showToast() {} },
      "../../utils/init.js": {
        init: () => ({ nim, store }),
        bindKickedOfflineHandler: (sdk, handler) => {
          assert.equal(sdk, nim);
          boundHandler = handler;
        },
        clearKickedOfflineHandler() {},
      },
      "../../utils/uikitRouter": {
        neUiKitRouterPath: { login: "/login", conversation: "/conversation" },
      },
    }
  );
  const routes = [];
  const context = {
    mobileInputRule: { reg: /^13800138000$/ },
    smsCodeInputRule: { reg: /^1234$/ },
    loginForm: { mobile: "13800138000", smsCode: "1234" },
    loginPending: false,
    $router: { push: (path) => routes.push(path) },
  };
  const originalLocalStorage = global.localStorage;
  global.localStorage = { setItem() {}, removeItem() {} };

  try {
    await options.methods.submitLoginForm.call(context);

    assert.equal(typeof boundHandler, "function");
    assert.equal(directRegistrations, 0);
    assert.deepEqual(routes, ["/conversation"]);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});

test("logout clears the shared kicked-offline handler before destroying the store", async () => {
  const sequence = [];
  let modalOptions;
  const nim = {
    V2NIMLoginService: {
      logout: async () => sequence.push("logout"),
    },
  };
  const store = { destroy: () => sequence.push("destroy") };
  const emptyComponent = { __esModule: true, default: {} };
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
  const originalLocalStorage = global.localStorage;
  global.localStorage = {
    removeItem: () => sequence.push("clear-credentials"),
  };

  try {
    options.methods.handleLogout.call({
      store,
      $router: { push: (path) => sequence.push(["route", path]) },
    });
    await modalOptions.onConfirm();

    assert.deepEqual(sequence, [
      "logout",
      "unbind",
      "clear-credentials",
      "destroy",
      ["route", "/login"],
    ]);
  } finally {
    global.localStorage = originalLocalStorage;
  }
});

test("rejecting a non-image clears the chat file input for another selection", async () => {
  const messages = [];
  const input = {
    files: [{ name: "notes.txt", type: "text/plain" }],
    value: "C:\\fakepath\\notes.txt",
  };
  const options = loadMessageInput({
    nim: {},
    store: {},
    toast: { info: (message) => messages.push(message) },
  });

  await options.methods.onImageSelected.call(
    { $refs: { imageInput: input } },
    { target: input }
  );

  assert.equal(input.value, "");
  assert.deepEqual(messages, ["selectImageText"]);
});

test("cancelling chat image selection leaves the file input reusable", async () => {
  const input = { files: [], value: "previous-selection" };
  const options = loadMessageInput({
    nim: {},
    store: {},
    toast: { info() {} },
  });

  await options.methods.onImageSelected.call(
    { $refs: { imageInput: input } },
    { target: input }
  );

  assert.equal(input.value, "");
});

test("chat image sending ignores another selection while upload is pending", async () => {
  let sendRequests = 0;
  let resolveSend;
  const pendingSend = new Promise((resolve) => {
    resolveSend = resolve;
  });
  const nim = {
    V2NIMMessageCreator: {
      createImageMessage: (file) => ({ file }),
    },
  };
  const store = {
    msgStore: {
      sendMessageActive: () => {
        sendRequests += 1;
        return pendingSend;
      },
    },
  };
  const options = loadMessageInput({
    nim,
    store,
    toast: { info() {} },
  });
  const firstInput = {
    files: [{ name: "one.png", type: "image/png" }],
    value: "one.png",
  };
  const secondInput = {
    files: [{ name: "two.png", type: "image/png" }],
    value: "two.png",
  };
  const context = {
    store,
    conversationId: "p2p:friend",
    imageSending: false,
    $refs: { imageInput: firstInput },
    scrollBottom() {},
  };

  const first = options.methods.onImageSelected.call(context, {
    target: firstInput,
  });
  context.$refs.imageInput = secondInput;
  const second = options.methods.onImageSelected.call(context, {
    target: secondInput,
  });

  assert.equal(sendRequests, 1);
  resolveSend();
  await Promise.all([first, second]);
  assert.equal(context.imageSending, false);
  assert.equal(firstInput.value, "");
  assert.equal(secondInput.value, "");
});

test("chat image file control is disabled while muted or sending", () => {
  const component = compiler.parseComponent(
    read("components/NEUIKit/Chat/message/message-input.vue")
  );
  assert.match(
    component.template.content,
    /<input[\s\S]*type=["']file["'][\s\S]*:disabled=["']imageSending \|\| isTeamMute["']/
  );
});

function loadAvatarEditors() {
  const emptyComponent = { __esModule: true, default: {} };
  const profile = loadComponentOptions("components/NEUIKit/User/my-detail.vue", {
    "../CommonComponents/Avatar.vue": emptyComponent,
    "../CommonComponents/Icon.vue": emptyComponent,
    "../CommonComponents/NavBar.vue": emptyComponent,
    "../utils/i18n": { t: (key) => key },
    "../utils/store.js": { autorun: () => () => {} },
    "../utils/loading": { loading: { show() {}, hide() {} } },
    "../utils": { copyText() {} },
    "../utils/toast": { showToast() {} },
    "../utils/uikitRouter": { neUiKitRouterPath: {} },
    "../utils/init.js": { nim: {}, uiKitStore: {} },
  });
  const teamAvatar = loadComponentOptions(
    "components/NEUIKit/Team/team-setting/team-avatar-edit.vue",
    {
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../CommonComponents/Button.vue": emptyComponent,
      "../../utils/toast": { toast: { info() {} } },
      "../../utils/loading": { loading: { show() {}, hide() {} } },
      "../../utils/store.js": { autorun: () => () => {} },
      "../../utils/team.js": { ensureTeamMembers: async () => [] },
      "../../utils/init.js": { nim: {}, uiKitStore: {} },
    }
  );
  return { profile, teamAvatar };
}

test("invalid avatar files leave both profile and team inputs reusable", async () => {
  const profileInput = {
    files: [{ name: "profile.txt", type: "text/plain" }],
    value: "profile.txt",
  };
  const teamInput = {
    files: [{ name: "team.txt", type: "text/plain" }],
    value: "team.txt",
  };
  const { profile, teamAvatar } = loadAvatarEditors();

  await profile.methods.onChangeAvatar.call(
    { $refs: { fileInput: profileInput } },
    { target: profileInput }
  );
  await teamAvatar.methods.onChangeAvatar.call(
    { $refs: { fileInput: teamInput } },
    { target: teamInput }
  );

  assert.equal(profileInput.value, "");
  assert.equal(teamInput.value, "");
});

test("cancelling avatar selection leaves both file inputs reusable", async () => {
  const profileInput = { files: [], value: "previous-profile" };
  const teamInput = { files: [], value: "previous-team" };
  const { profile, teamAvatar } = loadAvatarEditors();

  await profile.methods.onChangeAvatar.call(
    { $refs: { fileInput: profileInput } },
    { target: profileInput }
  );
  await teamAvatar.methods.onChangeAvatar.call(
    { $refs: { fileInput: teamInput } },
    { target: teamInput }
  );

  assert.equal(profileInput.value, "");
  assert.equal(teamInput.value, "");
});

test("team avatar permissions tolerate late member data and update reactively", () => {
  let refresh;
  let disposed = 0;
  const members = [];
  const team = { teamId: "team-1", avatar: "avatar.png", updateInfoMode: 0 };
  const store = {
    userStore: { myUserInfo: { accountId: "self" } },
    teamStore: { teams: new Map([["team-1", team]]) },
    teamMemberStore: { getTeamMember: () => members },
  };
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/Team/team-setting/team-avatar-edit.vue",
    {
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/Icon.vue": emptyComponent,
      "../../CommonComponents/Button.vue": emptyComponent,
      "../../utils/toast": { toast: { info() {} } },
      "../../utils/loading": { loading: { show() {}, hide() {} } },
      "../../utils/store.js": {
        autorun: (callback) => {
          refresh = callback;
          callback();
          return () => {
            disposed += 1;
          };
        },
      },
      "../../utils/team.js": { ensureTeamMembers: async () => [] },
      "../../utils/init.js": { nim: {}, uiKitStore: store },
    }
  );
  const context = {
    store,
    $route: { query: { teamId: "team-1" } },
    teamId: "",
    avatar: "",
    hasPermission: false,
    teamInfoWatch: null,
  };

  assert.doesNotThrow(() => options.mounted.call(context));
  assert.equal(typeof refresh, "function");
  assert.equal(context.hasPermission, false);

  members.push({ accountId: "self", memberRole: 1 });
  refresh();
  assert.equal(context.avatar, "avatar.png");
  assert.equal(context.hasPermission, true);

  context.avatarArr = ["local-choice.png"];
  options.methods.setAvatar.call(context, 0);
  team.avatar = "remote-update.png";
  refresh();
  assert.equal(context.avatar, "local-choice.png");

  options.beforeDestroy.call(context);
  assert.equal(disposed, 1);
});

test("team text editor updates late permissions without overwriting a local draft", () => {
  let refresh;
  let disposed = 0;
  const members = [];
  const team = { teamId: "team-1", name: "Server name", intro: "", updateInfoMode: 0 };
  const store = {
    userStore: { myUserInfo: { accountId: "self" } },
    teamStore: { teams: new Map([["team-1", team]]) },
    teamMemberStore: { getTeamMember: () => members },
  };
  const emptyComponent = { __esModule: true, default: {} };
  const options = loadComponentOptions(
    "components/NEUIKit/Team/team-setting/team-introduce-edit.vue",
    {
      "../../CommonComponents/NavBar.vue": emptyComponent,
      "../../CommonComponents/Input.vue": emptyComponent,
      "../../utils/i18n": { t: (key) => key },
      "../../CommonComponents/Button.vue": emptyComponent,
      "../../utils/toast": { toast: { info() {} } },
      "../../utils/store.js": {
        autorun: (callback) => {
          refresh = callback;
          callback();
          return () => {
            disposed += 1;
          };
        },
      },
      "../../utils/team.js": { ensureTeamMembers: async () => [] },
      "../../utils/init.js": { nim: {}, uiKitStore: store },
    }
  );
  const context = {
    store,
    $route: { query: { teamId: "team-1", type: "name" } },
    teamId: "",
    type: "",
    inputValue: "",
    inputDirty: false,
    hasPermission: false,
    teamInfoWatch: null,
  };

  assert.doesNotThrow(() => options.mounted.call(context));
  assert.equal(typeof refresh, "function");
  assert.equal(context.inputValue, "Server name");
  assert.equal(context.hasPermission, false);

  options.methods.handleInput.call(context, { target: { value: "Draft" } });
  team.name = "Remote rename";
  members.push({ accountId: "self", memberRole: 1 });
  refresh();

  assert.equal(context.inputValue, "Draft");
  assert.equal(context.hasPermission, true);
  options.beforeDestroy.call(context);
  assert.equal(disposed, 1);
});
