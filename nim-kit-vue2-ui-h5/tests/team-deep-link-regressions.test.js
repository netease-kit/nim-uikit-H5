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

function loadJavaScript(relativeFile) {
  const transformed = babel.transformSync(read(relativeFile), {
    babelrc: false,
    configFile: false,
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  }).code;
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", transformed)(
    require,
    loadedModule,
    loadedModule.exports
  );
  return loadedModule.exports;
}

function loadTeamHelper() {
  const helperPath = "components/NEUIKit/utils/team.js";
  assert.equal(
    fs.existsSync(path.join(sourceRoot, helperPath)),
    true,
    "team member loader is missing"
  );
  return loadJavaScript(helperPath);
}

function createTeamPageMocks(
  store,
  ensureTeamMembers,
  ensureTeam = async () => null
) {
  const emptyComponent = { __esModule: true, default: {} };
  return {
    "../../CommonComponents/PersonSelect.vue": emptyComponent,
    "../../CommonComponents/NavBar.vue": emptyComponent,
    "../../CommonComponents/Avatar.vue": emptyComponent,
    "../../CommonComponents/Icon.vue": emptyComponent,
    "../../CommonComponents/Input.vue": emptyComponent,
    "../../CommonComponents/Button.vue": emptyComponent,
    "../../CommonComponents/Switch.vue": emptyComponent,
    "../../CommonComponents/Appellation.vue": emptyComponent,
    "../../CommonComponents/Empty.vue": emptyComponent,
    "../../utils": { debounce: (callback) => callback },
    "../../utils/i18n": { t: (key) => key },
    "../../utils/loading": { loading: { show() {}, hide() {} } },
    "../../utils/modal": { modal: { confirm() {} }, showModal() {} },
    "../../utils/sdk": {
      V2NIMConst: {
        V2NIMTeamMemberRole: {
          V2NIM_TEAM_MEMBER_ROLE_OWNER: 1,
          V2NIM_TEAM_MEMBER_ROLE_MANAGER: 2,
        },
        V2NIMTeamInviteMode: { V2NIM_TEAM_INVITE_MODE_ALL: 1 },
        V2NIMTeamMessageMuteMode: {
          V2NIM_TEAM_MESSAGE_MUTE_MODE_ON: 1,
          V2NIM_TEAM_MESSAGE_MUTE_MODE_OFF: 0,
        },
        V2NIMTeamChatBannedMode: {
          V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN: 0,
        },
      },
    },
    "../../utils/store.js": {
      autorun: (callback) => {
        callback();
        return () => {};
      },
    },
    "../../utils/team.js": { ensureTeam, ensureTeamMembers },
    "../../utils/toast": { toast: { info() {} }, showToast() {} },
    "../../utils/uikitRouter": { neUiKitRouterPath: {} },
    "../../utils/init.js": {
      nim: {
        V2NIMConversationIdUtil: {
          teamConversationId: (teamId) => `team:${teamId}`,
        },
      },
      uiKitStore: store,
    },
  };
}

test("router view is recreated when only route query parameters change", () => {
  const template = compiler.parseComponent(read("App.vue")).template.content;

  assert.match(template, /<router-view\s+:key=["']\$route\.fullPath["']/);
});

test("every team deep-link page ensures member data on first entry", async () => {
  const team = {
    teamId: "team-1",
    memberCount: 2,
    memberLimit: 500,
    updateInfoMode: 0,
  };
  const store = {
    sdkOptions: { enableV2CloudConversation: false },
    userStore: { myUserInfo: { accountId: "self" } },
    teamStore: {
      teams: new Map([[team.teamId, team]]),
      getTeamMessageMuteModeActive: async () => 0,
    },
    teamMemberStore: { getTeamMember: () => [] },
    uiStore: { friends: [] },
    relationStore: { blacklist: [] },
    localConversationStore: { conversations: new Map() },
  };
  const pages = [
    "components/NEUIKit/Team/team-setting/index.vue",
    "components/NEUIKit/Team/team-add/index.vue",
    "components/NEUIKit/Team/team-setting/team-avatar-edit.vue",
    "components/NEUIKit/Team/team-setting/team-introduce-edit.vue",
    "components/NEUIKit/Team/team-setting/team-nick-edit.vue",
  ];

  for (const relativeFile of pages) {
    const calls = [];
    const ensureTeamMembers = async (...args) => {
      calls.push(args);
      return [];
    };
    const options = loadComponentOptions(
      relativeFile,
      createTeamPageMocks(store, ensureTeamMembers)
    );
    const context = {
      ...options.data(),
      store,
      enableV2CloudConversation: false,
      $route: {
        query: { teamId: team.teamId, type: "name" },
      },
    };

    options.mounted.call(context);
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(calls.length, 1, `${relativeFile} did not ensure team members`);
    assert.equal(calls[0][0], store);
    assert.equal(calls[0][1], team.teamId);
    assert.equal(calls[0][2], team);
  }
});

test("team member and team info pages ensure team details on first entry", async () => {
  const store = {
    userStore: { myUserInfo: { accountId: "self" } },
    teamStore: { teams: new Map() },
    teamMemberStore: {
      getTeamMember: () => [],
      getTeamMemberActive: async () => ({ memberList: [] }),
    },
  };
  const pages = [
    "components/NEUIKit/Team/team-member/index.vue",
    "components/NEUIKit/Team/team-setting/team-info-edit.vue",
  ];

  for (const relativeFile of pages) {
    const calls = [];
    const ensureTeam = async (...args) => {
      calls.push(args);
      return null;
    };
    const options = loadComponentOptions(
      relativeFile,
      createTeamPageMocks(store, async () => [], ensureTeam)
    );
    const context = {
      ...options.data(),
      store,
      $route: { query: { teamId: "team-1" } },
      loadTeamMembers: options.methods?.loadTeamMembers,
    };

    options.mounted.call(context);
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(calls.length, 1, `${relativeFile} did not ensure team info`);
    assert.deepEqual(calls[0], [store, "team-1"]);
  }
});

test("team member page waits for team details before choosing its member limit", async () => {
  const sequence = [];
  const team = { teamId: "team-1", memberLimit: 3000 };
  const store = {
    userStore: { myUserInfo: { accountId: "self" } },
    teamStore: { teams: new Map() },
    teamMemberStore: {
      getTeamMember: () => [],
      getTeamMemberActive: async (options) => {
        sequence.push("members");
        assert.equal(options.queryOption.limit, 3000);
        return { memberList: [] };
      },
    },
  };
  const ensureTeam = async () => {
    sequence.push("team");
    return team;
  };
  const options = loadComponentOptions(
    "components/NEUIKit/Team/team-member/index.vue",
    createTeamPageMocks(store, async () => [], ensureTeam)
  );
  const context = {
    ...options.data(),
    store,
    $route: { query: { teamId: "team-1" } },
    loadTeamMembers: options.methods.loadTeamMembers,
  };

  options.mounted.call(context);
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(sequence, ["team", "members"]);
  assert.equal(context.team, team);
});

test("team member loader skips invalid requests and complete caches", async () => {
  const { ensureTeamMembers } = loadTeamHelper();
  let requests = 0;
  const members = [{ accountId: "one" }, { accountId: "two" }];
  const store = {
    teamMemberStore: {
      getTeamMember: () => members,
      getTeamMemberActive: async () => {
        requests += 1;
      },
    },
  };

  assert.deepEqual(await ensureTeamMembers(store, "", { memberCount: 3 }), []);
  assert.equal(requests, 0);
  assert.equal(
    await ensureTeamMembers(store, "team-1", { memberCount: 2 }),
    members
  );
  assert.equal(requests, 0);
});

test("team member loader fills partial caches and deduplicates in-flight requests", async () => {
  const { ensureTeamMembers } = loadTeamHelper();
  let requests = 0;
  let resolveRequest;
  const pending = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const store = {
    teamMemberStore: {
      getTeamMember: () => [{ accountId: "one" }],
      getTeamMemberActive: (options) => {
        requests += 1;
        assert.deepEqual(options, {
          teamId: "team-1",
          queryOption: { limit: 500, roleQueryType: 0 },
        });
        return pending;
      },
    },
  };

  const first = ensureTeamMembers(store, "team-1", {
    memberCount: 2,
    memberLimit: 500,
  });
  const second = ensureTeamMembers(store, "team-1", {
    memberCount: 2,
    memberLimit: 500,
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests, 1);
  resolveRequest({ memberList: [{ accountId: "one" }, { accountId: "two" }] });
  assert.deepEqual(await first, await second);
});

test("team member loader clears a failed request so a later visit can retry", async () => {
  const { ensureTeamMembers } = loadTeamHelper();
  let requests = 0;
  const store = {
    teamMemberStore: {
      getTeamMember: () => [],
      getTeamMemberActive: async () => {
        requests += 1;
        if (requests === 1) {
          throw new Error("offline");
        }
        return { memberList: [{ accountId: "self" }] };
      },
    },
  };

  await assert.rejects(
    ensureTeamMembers(store, "team-1", { memberCount: 1 }),
    /offline/
  );
  assert.deepEqual(
    await ensureTeamMembers(store, "team-1", { memberCount: 1 }),
    [{ accountId: "self" }]
  );
  assert.equal(requests, 2);
});

test("team loader fills missing team details and deduplicates in-flight requests", async () => {
  const { ensureTeam } = loadTeamHelper();
  assert.equal(typeof ensureTeam, "function", "team detail loader is missing");
  let requests = 0;
  let resolveRequest;
  const pending = new Promise((resolve) => {
    resolveRequest = resolve;
  });
  const store = {
    teamStore: {
      teams: new Map(),
      getTeamActive: (teamId, type) => {
        requests += 1;
        assert.equal(teamId, "team-1");
        assert.equal(type, 1);
        return pending;
      },
    },
  };

  const first = ensureTeam(store, "team-1");
  const second = ensureTeam(store, "team-1");
  await Promise.resolve();
  assert.equal(requests, 1);
  resolveRequest({ teamId: "team-1", name: "Loaded team" });
  assert.deepEqual(await first, await second);
});

test("member loader fetches team details before choosing the member query limit", async () => {
  const { ensureTeamMembers } = loadTeamHelper();
  const sequence = [];
  const team = { teamId: "team-1", memberCount: 2, memberLimit: 3000 };
  const store = {
    teamStore: {
      teams: new Map(),
      getTeamActive: async () => {
        sequence.push("team");
        return team;
      },
    },
    teamMemberStore: {
      getTeamMember: () => [],
      getTeamMemberActive: async (options) => {
        sequence.push("members");
        assert.equal(options.queryOption.limit, 3000);
        return { memberList: [] };
      },
    },
  };

  await ensureTeamMembers(store, "team-1");

  assert.deepEqual(sequence, ["team", "members"]);
});

test("team settings skip SDK lookups when the route has no team id", async () => {
  let muteRequests = 0;
  let memberRequests = 0;
  const store = {
    sdkOptions: { enableV2CloudConversation: false },
    teamStore: {
      teams: new Map(),
      getTeamMessageMuteModeActive: async () => {
        muteRequests += 1;
      },
    },
    teamMemberStore: { getTeamMember: () => [] },
    localConversationStore: { conversations: new Map() },
  };
  const options = loadComponentOptions(
    "components/NEUIKit/Team/team-setting/index.vue",
    createTeamPageMocks(store, async () => {
      memberRequests += 1;
      return [];
    })
  );
  const context = {
    ...options.data(),
    store,
    enableV2CloudConversation: false,
    $route: { query: {} },
  };

  options.mounted.call(context);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(muteRequests, 0);
  assert.equal(memberRequests, 0);
});

test("team settings consume mute-state lookup failures", () => {
  let caughtFailures = 0;
  const store = {
    sdkOptions: { enableV2CloudConversation: false },
    teamStore: {
      teams: new Map([["team-1", { teamId: "team-1", memberCount: 0 }]]),
      getTeamMessageMuteModeActive: () => ({
        then: () => ({
          catch: () => {
            caughtFailures += 1;
          },
        }),
      }),
    },
    teamMemberStore: { getTeamMember: () => [] },
    localConversationStore: { conversations: new Map() },
  };
  const options = loadComponentOptions(
    "components/NEUIKit/Team/team-setting/index.vue",
    createTeamPageMocks(store, async () => [])
  );
  const context = {
    ...options.data(),
    store,
    enableV2CloudConversation: false,
    $route: { query: { teamId: "team-1" } },
  };

  options.mounted.call(context);

  assert.equal(caughtFailures, 1);
});
