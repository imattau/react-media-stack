import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 4179;
const debugPort = 9229;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const browser = process.env.CHROMIUM_BIN || 'chromium';

const server = spawn(npm, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
const chrome = spawn(browser, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--remote-debugging-port=${debugPort}`, 'about:blank',
], { stdio: 'ignore' });

const stop = () => { server.kill('SIGTERM'); chrome.kill('SIGTERM'); };
process.on('exit', stop);

async function waitFor(url) {
  for (let i = 0; i < 80; i++) {
    try { return await (await fetch(url)).json(); } catch { await delay(100); }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

try {
  const targets = await waitFor(`http://127.0.0.1:${debugPort}/json/list`);
  const target = targets.find((entry) => entry.type === 'page') || targets[0];
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });

  await call('Runtime.enable');
  await call('Page.enable');
  await call('Page.navigate', { url: `http://127.0.0.1:${port}/` });

  const evaluate = async (expression) => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  let rendered = false;
  for (let i = 0; i < 100; i++) {
    rendered = await evaluate('document.querySelectorAll(".media-stack-viewport").length > 0');
    if (rendered) break;
    await delay(100);
  }
  if (!rendered) {
    const diagnostics = await evaluate('JSON.stringify({ url: location.href, title: document.title, body: document.body?.innerText?.slice(0, 500) })');
    throw new Error(`Feed did not render: ${diagnostics}`);
  }
  assert.equal(rendered, true, 'feed viewport renders');
  assert.equal(await evaluate('document.querySelectorAll(".media-stack-item-wrapper").length >= 3'), true, 'feed renders multiple items');

  // Exercise repeated scroll/resize-style activity and verify DOM stays bounded.
  await evaluate(`(async () => {
    const viewport = document.querySelector('.media-stack-viewport');
    for (let i = 0; i < 30; i++) {
      viewport.scrollTop = i % 3 === 0 ? 0 : viewport.scrollHeight;
      viewport.dispatchEvent(new Event('scroll'));
      await new Promise(r => setTimeout(r, 10));
    }
    return true;
  })()`);
  assert.equal(await evaluate('document.querySelectorAll("video").length <= 3'), true, 'virtualized video count remains bounded');
  console.log('headless feed checks passed');
  socket.close();
} finally {
  stop();
}
