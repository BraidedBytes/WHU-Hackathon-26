# Spoilsport Chrome extension — agent execution brief

## Mission and ownership

Build a demo-ready Chrome Manifest V3 extension that shields a user's **unwatched** watchlist films from spoilers on other websites. The live demo matters more than polish: suspected text must be blurred before it can be read, safe text should become readable quickly, and a failed classifier must leave text blurred.

The web UI team owns the Next.js app at `http://localhost:3000`. Extension work belongs in `/extension` only. This file is the requested coordination brief in `/extensions`; do not move extension implementation into this directory or edit the web UI. Coordinate through the frozen contract below. There is roughly 1h45 of build time; freeze features 30 minutes before the demo.

## Frozen web UI contract

The app writes `localStorage["spoilsport:watchlist"]` as a JSON array of:

```js
{
  tmdbId, title, originalTitle, year, posterPath, overview,
  genres: [], characters: [], cast: [], keywords: [],
  status: "want" | "watched", addedAt
}
```

On load and after each change, the app posts:

```js
window.postMessage(
  { source: "spoilsport-webapp", type: "WATCHLIST_SYNC", watchlist },
  window.location.origin
);
```

The extension responds with:

```js
window.postMessage(
  { source: "spoilsport-extension", type: "EXTENSION_ACK", count },
  window.location.origin
);
```

`count` is the number of films with `status === "want"`. Only those films are protected; changing a film to `"watched"` lifts its shield. `sync.js` must read localStorage immediately on injection, since the app may have posted before the listener was ready, then listen for messages only when `event.source === window`, `data.source === "spoilsport-webapp"`, and `data.type === "WATCHLIST_SYNC"`. Persist valid arrays to `chrome.storage.local["spoilsport:watchlist"]`, then ACK.

The app may put `data-spoilsport-ignore` on `body` or an ancestor after hydration. Always test `element.closest("[data-spoilsport-ignore]")` before processing. Never blur app pages outside `/demo`; the demo pages are deliberately scannable. The web UI owners provide `/demo/forum`, `/demo/testset.json`, and the connection indicator; the extension agent must verify against them without changing them.

## Implementation boundaries

- Manifest V3; plain JavaScript; no bundler or npm dependencies inside `/extension`.
- Files: `manifest.json`, `config.example.js`, `lib/detect.js`, `sync.js`, `content.js`, `content.css`, `background.js`, `popup.html`, `popup.js`, `scripts/eval.mjs`. Add a tiny bootstrap file only if needed to prevent first-paint leakage.
- `lib/detect.js` is a **classic script** with no `import` or `export`; expose `buildMatchers`, `prefilter`, and `buildClassifyRequest` through `globalThis.SpoilsportDetect`. It must work in a manifest content script, `background.js` via `importScripts`, and Node via side-effect import.
- Keep the API key and fast model name in gitignored `/extension/config.js` as `globalThis.SPOILSPORT_CONFIG = { OPENAI_API_KEY: "...", MODEL: "..." }`. Commit only `config.example.js`. Use a restricted demo key and revoke it after the demo; an extension-bundled key is visible to whoever has the extension files.
- Manifest permissions: `storage`, `contextMenus`; host permissions: `https://api.openai.com/*`, `http://localhost:3000/*`; action popup: `popup.html`. `background.js` is a classic service worker and calls `importScripts("config.js", "lib/detect.js")`.
- Inject `sync.js` on `http://localhost:3000/*` at `document_start`. Inject `lib/detect.js`, `content.js`, and `content.css` on `<all_urls>`. The original sketch proposed `document_idle` for detection, but that can visibly flash a spoiler. Start protection at `document_start` (or add an equivalent early bootstrap), wait for `body` before walking it, and conservatively mask eligible blocks until the first scan resolves them. Keep this early mask effective for newly inserted blocks until they are checked. Verify the actual browser behavior; do not claim no flash based only on code inspection.
- The only website content sent to OpenAI is trimmed candidate snippet text, at most 600 characters per item. The classifier may also receive the protected films' title, year, overview, and characters as context. Never send page URLs, browsing history, or whole-page HTML.

## Detection and classification

`buildMatchers(films, extraTermsById)` protects only `"want"` films. Terms are title, original title, full character names, cast names, and cached AI expansions. For a multiword character name, also add its final word if it has at least five characters and is not a common word. Match multiword terms without case sensitivity and single-word proper nouns with case sensitivity, so `Quick` does not match `quick`. Use Unicode letter and number boundaries: `(?<![\p{L}\p{N}])` and `(?![\p{L}\p{N}])` with `u`. Return one matcher record per film; it may hold separate regular expressions to preserve the two case rules. `prefilter(text, matchers)` returns matching TMDB IDs.

In `content.js`, walk text nodes and map each to its nearest `p, li, blockquote, h1, h2, h3, h4, h5, h6, td, dd, figcaption, .comment, [data-expected]` block. Deduplicate blocks. Skip text shorter than 15 characters, scripts/styles, inputs/textareas, contenteditable content, extension overlays, ignored ancestors, and blocks already marked `data-spoilsport-state`. All extension CSS classes begin with `ss-`.

Blur a prefilter hit **immediately**, before messaging the worker: state `suspect`, `filter: blur(6px)`, `user-select: none`, and a subtle `checking…` label. In `keyword` mode, every suspect becomes `spoiler` with no AI call; this intentionally blurs harmless mentions and misses spoilers without a matched term. In `ai` mode, debounce 150 ms, send at most 20 items per batch and run at most three batches concurrently:

```js
{ type: "CLASSIFY", items: [{ id, text, filmIds }] }
```

The worker responds with `[{ id, spoiler, filmId, confidence }]`. A `spoiler: true` result with `confidence >= 0.5` stays blurred and gets `Careful, this spoils {Film title}. Reveal anyway?`. Clicking reveals only that block (`revealed`). A complete, valid acquittal becomes `safe` and unblurs. Request failure, timeout, missing result, or malformed result becomes `unchecked`, stays blurred, and offers `Couldn't check this one. Reveal?`. Fail closed in every uncertain case. Cache classifier results in memory by a hash of snippet text plus film IDs.

The worker uses OpenAI Chat Completions with `response_format: json_schema`, returning `{ results: [{ id: string, spoiler: boolean, filmId: integer | null, confidence: number }] }`. Target under two seconds per batch. Use this system prompt as written, replacing only the film-list placeholder:

```text
You judge whether short snippets of web text spoil a film for someone who has NOT
seen it.
SPOILER = reveals plot developments beyond the premise: twists, secret identities,
deaths, who wins or loses, endings, character fates, major late-film events,
surprise cameos.
NOT a spoiler = mentioning the film, opinions, praise of performances, cast lists
("Actor as Character"), release, box-office or awards news, trailer talk, and the
premise as stated in the official overview.
Snippets may refer to a film ONLY through character names, actor names or plot
elements. Use the film list to recognise that.
Films to protect: {JSON array of { id, title, year, overview, characters }}
For each snippet return: spoiler (true/false), filmId of the spoiled film or null,
confidence 0–1. If a snippet plausibly reveals a real plot development, mark it
as a spoiler.
```

Observe `document.body` for child-list changes with subtree enabled, debounce 300 ms, and scan new or unprocessed blocks. On watchlist, mode, or pause changes, clear extension states and rescan. When paused, remove the extension's blur and overlays. Use `chrome.storage.local["spoilsport:mode"]` (`"ai"` default or `"keyword"`), `"spoilsport:paused"` (boolean), and `"spoilsport:debug"` (boolean). After each batch, send the confirmed spoiler count to the worker for a per-tab badge.

## Popup and stretch work

The popup shows protected film titles and years, their count, AI/Keyword mode, pause, a debug toggle, `Spoilers blocked on this page: N`, and an `Open watchlist` link to `http://localhost:3000`. Keep it functional before styling it.

**P1 after the main path works:** On watchlist changes, expand terms once per film with the model: up to 20 specific character names/nicknames, places, factions, or objects that could identify plot discussion without the title; no generic words. Cache as `chrome.storage.local["spoilsport:terms:{tmdbId}"]`. Add the per-tab badge. When debug is enabled and a block has `data-expected`, outline it green for a matching verdict and red otherwise.

**P2 only if time remains:** A selection context menu `Shield me from spoilers for "%s"` creates a local-only film with a negative hash TMDB ID, title equal to the selection, `status: "want"`, and empty characters. Store it in `"spoilsport:extraFilms"`, expand terms, merge it into matchers, and rescan the tab. It does not need to appear in the web UI.

## Build sequence and handoffs

1. **Sync and first blur:** Manifest, example config, classic detector, `sync.js`, and an early content script. Use a hardcoded two-film watchlist only for this first check. Prove ACK and instant blur on `/demo/forum` and a Wikipedia film page.
2. **AI verdict path:** Worker classifier, cache, safe unblur, spoiler overlay, reveal, timeout/error handling. Verify a network failure remains blurred.
3. **Real state:** Replace the hardcoded list with storage; add mutation rescans, ignore rules, mode/pause controls, popup film list, and count. Verify web app changes propagate without reload.
4. **Tune:** `scripts/eval.mjs` on Node 18+ side-effect imports `config.js` and `lib/detect.js`, loads `http://localhost:3000/demo/testset.json` (`[{ id, text, film, expected }]`), uses a hardcoded demo watchlist in the app's shape, and runs the same prefilter and classifier. Print accuracy by expected label and every wrong item with its text. Add debug outlines and tune the prompt.
5. **Stretch:** P1 term expansion and badge, then P2 context menu. Stop adding features at T minus 30 minutes and run the acceptance checks.

Tell the web UI owners only about contract mismatches or failing demo fixtures. Do not change their code. Keep each milestone loadable as an unpacked extension so the team always has a demoable build.

## Demo acceptance checks

- Opening the web app shows `Extension connected`; the popup lists the `want` films. Changing a film to `watched` removes its protection promptly.
- On `/demo/forum` in AI mode, watchlist spoilers, including ones that do not name the film, stay blurred; safe comments become readable in about three seconds; spoilers for the control film stay visible.
- In Keyword mode, mentions blur and indirect spoilers slip through, demonstrating the baseline.
- On a Wikipedia page for a protected film, Plot paragraphs blur and the cast list remains readable.
- Web app pages outside `/demo` never blur; `[data-spoilsport-ignore]` works even when added after hydration.
- On a throttled or disconnected network, suspects remain blurred with the `Couldn't check` reveal control.
- During a hard reload and during late comment insertion, no spoiler text flashes before masking.
- The network inspector shows snippets and the necessary film context going to `api.openai.com`, with no page URL or browsing history.
