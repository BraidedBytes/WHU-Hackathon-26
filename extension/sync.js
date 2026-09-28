(function () {
  const KEY = 'spoilsport:watchlist';

  function validWatchlist(value) {
    return Array.isArray(value) ? value.filter((film) => film && typeof film.title === 'string' &&
      (film.status === 'want' || film.status === 'watched')) : [];
  }

  function saveAndAck(value) {
    const watchlist = validWatchlist(value);
    function ack() {
      window.postMessage({ source: 'spoilsport-extension', type: 'EXTENSION_ACK',
        count: watchlist.filter((film) => film.status === 'want').length }, window.location.origin);
    }
    chrome.storage.local.get(KEY, (stored) => {
      if (Array.isArray(stored[KEY]) && JSON.stringify(stored[KEY]) === JSON.stringify(watchlist)) ack();
      else chrome.storage.local.set({ [KEY]: watchlist }, ack);
    });
  }

  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored !== null) saveAndAck(JSON.parse(stored));
    else saveAndAck([]);
  } catch {
    saveAndAck([]);
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.source !== 'spoilsport-webapp' ||
      event.data.type !== 'WATCHLIST_SYNC') return;
    saveAndAck(event.data.watchlist);
  });
})();
