(function () {
  const KEY = 'spoilsport:watchlist';

  function validWatchlist(value) {
    return Array.isArray(value) ? value.filter((film) => film && typeof film.title === 'string' &&
      (film.status === 'want' || film.status === 'watched')) : [];
  }

  function saveAndAck(value) {
    const watchlist = validWatchlist(value);
    chrome.storage.local.set({ [KEY]: watchlist }, () => {
      window.postMessage({ source: 'spoilsport-extension', type: 'EXTENSION_ACK',
        count: watchlist.filter((film) => film.status === 'want').length }, window.location.origin);
    });
  }

  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored !== null) saveAndAck(JSON.parse(stored));
    else saveAndAck([]);
  } catch (_) {
    saveAndAck([]);
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.source !== 'spoilsport-webapp' ||
      event.data.type !== 'WATCHLIST_SYNC') return;
    saveAndAck(event.data.watchlist);
  });
})();
