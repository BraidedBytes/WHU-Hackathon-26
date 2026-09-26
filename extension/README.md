# Spoilsport extension

1. Copy `config.example.js` to `config.js` and set a restricted OpenAI API key. The file is gitignored. The default model is `gpt-4o-mini`.
2. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select this `extension` directory.
3. Open `http://localhost:3000` so the watchlist syncs. The app should receive `EXTENSION_ACK` and show its connected state.
4. Open `/demo/forum` or another site. Suspect blocks blur before classification; the popup controls AI/Keyword mode and pause.

Without a key, the extension still loads and keeps suspected spoilers blurred with a reveal control. To run the detector tests: `node --test extension/test/*.test.mjs` from the repository root. Once the web UI provides `/demo/testset.json`, run `node extension/scripts/eval.mjs`. Align the script's hardcoded two-film watchlist with that fixture before relying on its accuracy numbers.

On this Mac, `node extension/scripts/smoke.mjs` runs a disposable Chrome for Testing profile and local pages to check first-paint masking, ACK, fail-closed blur, the popup, Keyword mode, ignored content, and `watched` status. Set `SPOILSPORT_CHROME` if Chrome for Testing lives elsewhere. The smoke test copies the extension and blanks its key, so it never calls the live classifier.

Run `node extension/scripts/package.mjs` to create a ZIP in `dist/` for sharing. The ZIP contains a blank `config.js`, not your local API key. Recipients can load the unpacked ZIP in Chrome; AI classification requires their own key or a server-side proxy.

The extension sends candidate snippets and protected-film context to OpenAI. It does not send page URLs or browsing history. Revoke the demo key after the event; a key bundled with an unpacked extension is readable by anyone with the extension files.
