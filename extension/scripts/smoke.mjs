import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const extension = resolve(import.meta.dirname, '..');
const chromePath = process.env.SPOILSPORT_CHROME ||
  join(process.env.HOME, 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const profile = await mkdtemp(join(tmpdir(), 'spoilsport-smoke-'));
const unpacked = join(profile, 'extension-under-test');
const watchlist = [{ tmdbId: 745, title: 'The Sixth Sense', originalTitle: 'The Sixth Sense',
  year: 1999, overview: 'A psychologist helps a boy who sees ghosts.',
  characters: ['Malcolm Crowe'], cast: ['Bruce Willis'], status: 'want' }];
const app = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(`<body><script>
    window.addEventListener('message', event => {
      if (event.data?.type === 'EXTENSION_ACK') document.body.dataset.ack = event.data.count;
    });
    const watchlist = ${JSON.stringify(watchlist)};
    localStorage.setItem('spoilsport:watchlist', JSON.stringify(watchlist));
    window.postMessage({source:'spoilsport-webapp',type:'WATCHLIST_SYNC',watchlist}, location.origin);
  </script></body>`);
});
const page = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end('<body><p id="spoiler">Malcolm Crowe was dead the entire time, a major ending twist.</p><script>document.body.dataset.firstMask=getComputedStyle(document.querySelector("#spoiler")).filter</script><p id="safe">The weather forecast says it will be sunny and warm this weekend.</p></body>');
});

const listen = (server, port) => new Promise((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(port, resolveListen);
});
const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
let chrome;
try {
  await cp(extension, unpacked, { recursive: true,
    filter: (source) => source !== join(extension, 'config.js') });
  await writeFile(join(unpacked, 'config.js'),
    "globalThis.SPOILSPORT_CONFIG = { OPENAI_API_KEY: '', MODEL: 'gpt-4o-mini' };\n");
  await listen(app, 3000);
  await listen(page, 3210);
  chrome = spawn(chromePath, [
    '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    `--user-data-dir=${profile}`, '--remote-debugging-port=0',
    `--disable-extensions-except=${unpacked}`, `--load-extension=${unpacked}`,
    'about:blank',
  ], { stdio: 'ignore' });
  let port;
  for (let tries = 0; tries < 100; tries++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; }
    catch { await delay(100); }
  }
  if (!port) throw new Error('Chrome DevTools did not start');
  const version = await fetch(`http://localhost:${port}/json/version`).then((response) => response.json());
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => { ws.onopen = resolveOpen; ws.onerror = reject; });
  let nextId = 1;
  const pending = new Map();
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message));
    else callback.resolve(message.result);
  };
  const command = (method, params = {}, sessionId) => new Promise((resolveCommand, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: resolveCommand, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const tab = async (url) => {
    const target = await command('Target.createTarget', { url });
    const attached = await command('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    return attached.sessionId;
  };
  const evaluate = async (session, expression) => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true }, session);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };

  const appSession = await tab('http://localhost:3000/');
  await delay(700);
  const ack = await evaluate(appSession, 'document.body.dataset.ack');
  const pageSession = await tab('http://localhost:3210/');
  await delay(4300);
  const targets = await command('Target.getTargets');
  const state = await evaluate(pageSession, `({ firstMask: document.body.dataset.firstMask,
    spoiler: document.querySelector('#spoiler').dataset.spoilsportState,
    safe: document.querySelector('#safe').dataset.spoilsportState,
    blurred: getComputedStyle(document.querySelector('#spoiler')).filter,
    safeFilter: getComputedStyle(document.querySelector('#safe')).filter })`);
  console.log(JSON.stringify({ ack, ...state,
    extensionTargets: targets.targetInfos.filter((target) => target.url.startsWith('chrome-extension://'))
      .map((target) => ({ type: target.type, url: target.url })) }, null, 2));
  if (ack !== '1' || state.firstMask === 'none' || state.spoiler !== 'unchecked' || state.safe !== 'safe' ||
    state.blurred === 'none' || state.safeFilter !== 'none') process.exitCode = 1;

  const worker = targets.targetInfos.find((target) => target.url.endsWith('/background.js'));
  if (!worker) throw new Error('Spoilsport service worker did not load');
  const extensionOrigin = `chrome-extension://${new URL(worker.url).host}`;
  const popupSession = await tab(`${extensionOrigin}/popup.html`);
  await command('Page.navigate', { url: `${extensionOrigin}/popup.html` }, popupSession);
  await delay(1500);
  const popupFilms = await evaluate(popupSession, "document.querySelector('#film-count').textContent");
  await evaluate(popupSession, `(() => {
    const mode = document.querySelector('#mode');
    mode.value = 'keyword';
    mode.dispatchEvent(new Event('change'));
  })()`);
  await delay(500);
  const keywordState = await evaluate(pageSession, "document.querySelector('#spoiler').dataset.spoilsportState");
  console.log(JSON.stringify({ popupFilms, keywordState }, null, 2));
  if (popupFilms !== '1' || keywordState !== 'spoiler') process.exitCode = 1;

  await evaluate(pageSession, "document.body.setAttribute('data-spoilsport-ignore', '')");
  await delay(450);
  const ignoredFilter = await evaluate(pageSession, "getComputedStyle(document.querySelector('#spoiler')).filter");
  console.log(`ignored after hydration: ${ignoredFilter}`);
  if (ignoredFilter !== 'none') process.exitCode = 1;

  await evaluate(appSession, `(() => {
    const watchlist = ${JSON.stringify(watchlist)};
    watchlist[0].status = 'watched';
    localStorage.setItem('spoilsport:watchlist', JSON.stringify(watchlist));
    window.postMessage({source:'spoilsport-webapp',type:'WATCHLIST_SYNC',watchlist}, location.origin);
  })()`);
  await delay(450);
  const watched = await evaluate(pageSession, `({ filter: getComputedStyle(document.querySelector('#spoiler')).filter,
    active: document.documentElement.classList.contains('ss-active') })`);
  const watchedAck = await evaluate(appSession, 'document.body.dataset.ack');
  console.log(JSON.stringify({ watchedAck, watched }, null, 2));
  if (watchedAck !== '0' || watched.filter !== 'none' || watched.active) process.exitCode = 1;
  ws.close();
} finally {
  chrome?.kill('SIGTERM');
  app.close();
  page.close();
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
