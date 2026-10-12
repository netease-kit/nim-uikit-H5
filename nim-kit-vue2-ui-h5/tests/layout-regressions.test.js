const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const sourceRoot = path.resolve(__dirname, "../src");

function read(relativeFile) {
  return fs.readFileSync(path.join(sourceRoot, relativeFile), "utf8");
}

function styleBlock(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(
    new RegExp(`\\.${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`)
  );
  assert.ok(match, `Expected .${selector} styles to exist`);
  return match[1];
}

test("chat layout allows flex content to shrink without horizontal overflow", () => {
  const chat = read("components/NEUIKit/Chat/index.vue");
  const messageList = read("components/NEUIKit/Chat/message/message-list.vue");
  const messageItem = read("components/NEUIKit/Chat/message/message-item.vue");
  const messageInput = read("components/NEUIKit/Chat/message/message-input.vue");

  for (const [source, selector] of [
    [chat, "msg-page-wrapper-h5"],
    [messageList, "msg-list-wrapper"],
    [messageList, "message-scroll-list"],
    [messageItem, "msg-common"],
    [messageItem, "msg-content"],
    [messageInput, "message-input-root"],
    [messageInput, "input-root"],
    [messageInput, "input-inner"],
  ]) {
    assert.match(
      styleBlock(source, selector),
      /min-width:\s*0/,
      `.${selector} must be allowed to shrink on narrow screens`
    );
  }

  assert.match(
    styleBlock(messageList, "message-scroll-list"),
    /overflow-x:\s*hidden/,
    ".message-scroll-list must not create a horizontal scroll range"
  );
});
