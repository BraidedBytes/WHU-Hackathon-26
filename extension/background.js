try { importScripts('config.js'); } catch (_) { globalThis.SPOILSPORT_CONFIG = {}; }
importScripts('lib/detect.js');

const verdictCache = new Map();
const API_URL = 'https://api.openai.com/v1/chat/completions';

function hash(value) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16);
}

async function openai(request) {
  const key = globalThis.SPOILSPORT_CONFIG?.OPENAI_API_KEY;
  if (!key) throw new Error('OpenAI key is not configured');
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 3000);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: abort.signal,
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    const body = await response.json();
    return JSON.parse(body.choices?.[0]?.message?.content || '{}');
  } finally {
    clearTimeout(timeout);
  }
}

async function classify(items) {
  if (!Array.isArray(items) || items.length > 20) throw new Error('Invalid classification batch');
  const settings = await chrome.storage.local.get(['spoilsport:watchlist', 'spoilsport:extraFilms']);
  const films = [...(settings['spoilsport:watchlist'] || []), ...(settings['spoilsport:extraFilms'] || [])];
  const pending = [];
  const results = new Map();
  for (const item of items) {
    if (typeof item.id !== 'string' || typeof item.text !== 'string' || !Array.isArray(item.filmIds)) continue;
    const filmIds = item.filmIds.map(Number).sort((a, b) => a - b);
    const rawKey = JSON.stringify([item.text.slice(0, 600), filmIds]);
    const key = hash(rawKey);
    const cached = verdictCache.get(key)?.find((entry) => entry.rawKey === rawKey)?.value;
    if (cached) results.set(item.id, { id: item.id, ...cached });
    else pending.push({ id: item.id, text: item.text.slice(0, 600), filmIds, key, rawKey });
  }
  if (pending.length) {
    const model = globalThis.SPOILSPORT_CONFIG?.MODEL;
    if (!model) throw new Error('OpenAI model is not configured');
    const request = SpoilsportDetect.buildClassifyRequest(pending, films, model);
    const response = await openai(request);
    if (!Array.isArray(response.results)) throw new Error('Malformed classifier response');
    for (const verdict of response.results) {
      const item = pending.find((candidate) => candidate.id === verdict.id);
      if (!item || typeof verdict.spoiler !== 'boolean' || typeof verdict.confidence !== 'number' ||
        verdict.confidence < 0 || verdict.confidence > 1 ||
        (verdict.filmId !== null && !item.filmIds.includes(verdict.filmId))) continue;
      const value = { spoiler: verdict.spoiler, filmId: verdict.filmId, confidence: verdict.confidence };
      const bucket = verdictCache.get(item.key) || [];
      bucket.push({ rawKey: item.rawKey, value });
      verdictCache.set(item.key, bucket);
      results.set(item.id, { id: item.id, ...value });
    }
  }
  return items.map((item) => results.get(item.id)).filter(Boolean);
}

async function expandTerms(film) {
  const key = `spoilsport:terms:${film.tmdbId}`;
  const existing = await chrome.storage.local.get(key);
  if (Array.isArray(existing[key])) return;
  try {
    const model = globalThis.SPOILSPORT_CONFIG?.MODEL;
    if (!model) throw new Error('OpenAI model is not configured');
    const result = await openai({
      model,
      messages: [
        { role: 'system', content: 'Return up to 20 specific names and terms people use when discussing this film\'s plot without naming the title: characters, nicknames, key places, factions, and objects. No generic words.' },
        { role: 'user', content: `Film: ${film.title} (${film.year || 'unknown year'})` },
      ],
      response_format: { type: 'json_schema', json_schema: {
        name: 'film_terms', strict: true, schema: { type: 'object', additionalProperties: false,
          required: ['terms'], properties: { terms: { type: 'array', items: { type: 'string' } } } },
      } },
    });
    const terms = Array.isArray(result.terms) ? result.terms.filter((term) => typeof term === 'string').slice(0, 20) : [];
    await chrome.storage.local.set({ [key]: terms });
  } catch (_) {
    // Retry at the next watchlist change; detection still uses known names.
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CLASSIFY') {
    classify(message.items).then(sendResponse).catch((error) => sendResponse({ error: error.message }));
    return true;
  }
  if (message?.type === 'SPOILER_COUNT' && sender.tab?.id !== undefined) {
    const count = Math.max(0, Number(message.count) || 0);
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#b91c1c' });
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: count ? String(count) : '' });
    sendResponse({ ok: true });
  }
  return false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes['spoilsport:watchlist']) return;
  verdictCache.clear();
  const films = changes['spoilsport:watchlist'].newValue || [];
  for (const film of films) if (film.status === 'want') expandTerms(film);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'spoilsport-shield', title: 'Shield me from spoilers for "%s"',
    contexts: ['selection'] });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'spoilsport-shield') return;
  const title = String(info.selectionText || '').trim().slice(0, 80);
  if (!title) return;
  const tmdbId = -Math.max(1, parseInt(hash(title), 16));
  const settings = await chrome.storage.local.get('spoilsport:extraFilms');
  const existing = settings['spoilsport:extraFilms'] || [];
  if (!existing.some((film) => film.tmdbId === tmdbId)) {
    const film = { tmdbId, title, originalTitle: title, status: 'want', characters: [], cast: [] };
    await chrome.storage.local.set({ 'spoilsport:extraFilms': [...existing, film] });
    expandTerms(film);
  }
  if (tab?.id !== undefined) chrome.tabs.sendMessage(tab.id, { type: 'RESCAN' }, () => void chrome.runtime.lastError);
});
