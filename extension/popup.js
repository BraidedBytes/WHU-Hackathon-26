(async function () {
  const data = await chrome.storage.local.get(['spoilsport:watchlist', 'spoilsport:extraFilms',
    'spoilsport:mode', 'spoilsport:paused', 'spoilsport:debug']);
  const films = [...(data['spoilsport:watchlist'] || []), ...(data['spoilsport:extraFilms'] || [])]
    .filter((film) => film.status === 'want');
  document.getElementById('film-count').textContent = String(films.length);
  const list = document.getElementById('films');
  if (!films.length) {
    const item = document.createElement('li');
    item.className = 'muted';
    item.textContent = 'Add a film in the watchlist.';
    list.append(item);
  }
  for (const film of films) {
    const item = document.createElement('li');
    item.textContent = film.year ? `${film.title} (${film.year})` : film.title;
    list.append(item);
  }
  const mode = document.getElementById('mode');
  const paused = document.getElementById('paused');
  const debug = document.getElementById('debug');
  mode.value = data['spoilsport:mode'] || 'ai';
  paused.checked = Boolean(data['spoilsport:paused']);
  debug.checked = Boolean(data['spoilsport:debug']);
  mode.addEventListener('change', () => chrome.storage.local.set({ 'spoilsport:mode': mode.value }));
  paused.addEventListener('change', () => chrome.storage.local.set({ 'spoilsport:paused': paused.checked }));
  debug.addEventListener('change', () => chrome.storage.local.set({ 'spoilsport:debug': debug.checked }));
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id !== undefined) {
    const badge = await chrome.action.getBadgeText({ tabId: tabs[0].id });
    document.getElementById('page-count').textContent = badge || '0';
  }
})();
