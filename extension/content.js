(function () {
  if (location.origin === 'http://localhost:3000' && !location.pathname.startsWith('/demo')) return;

  const Detect = globalThis.SpoilsportDetect;
  const BLOCKS = 'p, li, blockquote, h1, h2, h3, h4, h5, h6, td, dd, figcaption, .comment, [data-expected]';
  const overlays = new Map();
  let settings = {};
  let films = [];
  let matchers = [];
  let queue = [];
  let inFlight = 0;
  let generation = 0;
  let nextId = 1;
  let scanTimer;
  let batchTimer;
  let observer;

  if (document.documentElement) document.documentElement.classList.add('ss-active');
  else {
    const earlyRoot = new MutationObserver(() => {
      if (!document.documentElement) return;
      document.documentElement.classList.add('ss-active');
      earlyRoot.disconnect();
    });
    earlyRoot.observe(document, { childList: true });
  }

  function enabled() {
    return !settings['spoilsport:paused'] && films.some((film) => film.status === 'want');
  }

  function positionOverlay(block, overlay) {
    if (!block.isConnected) { overlay.remove(); overlays.delete(block); return; }
    const rect = block.getBoundingClientRect();
    overlay.style.top = `${window.scrollY + rect.top + Math.min(rect.height / 2, 28)}px`;
    overlay.style.left = `${window.scrollX + rect.left + 8}px`;
  }

  function positionOverlays() {
    for (const [block, overlay] of overlays) positionOverlay(block, overlay);
  }

  function removeOverlay(block) {
    overlays.get(block)?.remove();
    overlays.delete(block);
  }

  function showOverlay(block, label, reveal = false) {
    let overlay = overlays.get(block);
    if (!overlay) {
      overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'ss-overlay';
      overlay.addEventListener('click', () => {
        if (!overlay.dataset.reveal) return;
        block.dataset.spoilsportState = 'revealed';
        removeOverlay(block);
        reportCount();
      });
      document.body.append(overlay);
      overlays.set(block, overlay);
    }
    overlay.textContent = label;
    overlay.dataset.reveal = reveal ? 'true' : '';
    overlay.classList.toggle('ss-checking', !reveal);
    positionOverlay(block, overlay);
  }

  function reportCount() {
    const count = document.querySelectorAll('[data-spoilsport-state="spoiler"]').length;
    chrome.runtime.sendMessage({ type: 'SPOILER_COUNT', count }, () => void chrome.runtime.lastError);
  }

  function debugVerdict(block, verdict) {
    if (!settings['spoilsport:debug'] || !block.hasAttribute('data-expected')) return;
    const expected = block.getAttribute('data-expected').toLowerCase();
    const wantsSpoiler = expected === 'spoiler' || expected === 'true' || expected === '1';
    block.dataset.spoilsportDebug = (wantsSpoiler === (verdict === 'spoiler')) ? 'pass' : 'fail';
  }

  function settle(block, verdict, filmId) {
    if (!block.isConnected) { removeOverlay(block); return; }
    block.dataset.spoilsportState = verdict;
    debugVerdict(block, verdict);
    if (verdict === 'safe') removeOverlay(block);
    else if (verdict === 'spoiler') {
      const title = films.find((film) => Number(film.tmdbId) === Number(filmId))?.title || 'a protected film';
      showOverlay(block, `Careful, this spoils ${title}. Reveal anyway?`, true);
    } else showOverlay(block, "Couldn't check this one. Reveal?", true);
  }

  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      let finished = false;
      const timer = setTimeout(() => {
        if (!finished) { finished = true; reject(new Error('Classification timed out')); }
      }, 19_000);
      chrome.runtime.sendMessage(message, (response) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (chrome.runtime.lastError || response?.error) reject(new Error(response?.error || chrome.runtime.lastError.message));
        else resolve(response);
      });
    });
  }

  function pump() {
    while (inFlight < 3 && queue.length) {
      const batch = queue.splice(0, 20);
      const currentGeneration = generation;
      inFlight++;
      sendMessage({ type: 'CLASSIFY', items: batch.map(({ id, text, filmIds }) => ({ id, text, filmIds })) })
        .then((response) => {
          if (currentGeneration !== generation) return;
          const results = Array.isArray(response) ? new Map(response.map((item) => [item.id, item])) : new Map();
          for (const item of batch) {
            const result = results.get(item.id);
            if (!result || typeof result.spoiler !== 'boolean' ||
              typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
              settle(item.block, 'unchecked');
            } else if (result.spoiler && result.confidence >= 0.5) {
              settle(item.block, 'spoiler', result.filmId);
            } else settle(item.block, 'safe');
          }
          reportCount();
        })
        .catch(() => {
          if (currentGeneration !== generation) return;
          for (const item of batch) settle(item.block, 'unchecked');
          reportCount();
        })
        .finally(() => { inFlight--; pump(); });
    }
  }

  function enqueue(block, text, filmIds) {
    queue.push({ id: String(nextId++), text: text.slice(0, 600), filmIds, block });
    clearTimeout(batchTimer);
    batchTimer = setTimeout(pump, 150);
  }

  function scan() {
    if (!document.body || !enabled()) return;
    const candidates = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const element = walker.currentNode.parentElement;
      if (!element || element.closest('script, style, input, textarea, [contenteditable], .ss-overlay, [data-spoilsport-ignore]')) continue;
      const block = element.closest(BLOCKS);
      if (block && !block.hasAttribute('data-spoilsport-state') && !block.closest('[data-spoilsport-ignore]')) {
        candidates.add(block);
      }
    }
    for (const block of candidates) {
      const text = block.textContent.trim();
      if (text.length < 15) { block.dataset.spoilsportState = 'safe'; continue; }
      const filmIds = Detect.prefilter(text, matchers);
      if (!filmIds.length) { block.dataset.spoilsportState = 'safe'; debugVerdict(block, 'safe'); continue; }
      block.dataset.spoilsportState = 'suspect';
      showOverlay(block, 'checking…');
      if (settings['spoilsport:mode'] === 'keyword') settle(block, 'spoiler', filmIds[0]);
      else enqueue(block, text, filmIds);
    }
    if (settings['spoilsport:mode'] === 'keyword') reportCount();
  }

  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 300);
  }

  function reset() {
    generation++;
    queue = [];
    clearTimeout(batchTimer);
    for (const overlay of overlays.values()) overlay.remove();
    overlays.clear();
    for (const block of document.querySelectorAll('[data-spoilsport-state]')) {
      delete block.dataset.spoilsportState;
      delete block.dataset.spoilsportDebug;
    }
    document.documentElement.classList.toggle('ss-active', enabled());
    reportCount();
    scan();
  }

  async function reload() {
    settings = await chrome.storage.local.get(null);
    const watchlist = Array.isArray(settings['spoilsport:watchlist']) ? settings['spoilsport:watchlist'] : [];
    const extraFilms = Array.isArray(settings['spoilsport:extraFilms']) ? settings['spoilsport:extraFilms'] : [];
    films = [...watchlist, ...extraFilms];
    const terms = {};
    for (const film of films) terms[film.tmdbId] = settings[`spoilsport:terms:${film.tmdbId}`] || [];
    matchers = Detect.buildMatchers(films, terms);
    reset();
  }

  function start() {
    observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.type === 'attributes')) reset();
      else scheduleScan();
    });
    observer.observe(document.body, { childList: true, subtree: true,
      attributes: true, attributeFilter: ['data-spoilsport-ignore'] });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && Object.keys(changes).some((key) => key.startsWith('spoilsport:') &&
        key !== 'spoilsport:pageCount')) reload();
    });
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'RESCAN') reload();
    });
    window.addEventListener('scroll', positionOverlays, { passive: true });
    window.addEventListener('resize', positionOverlays);
    reload();
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
