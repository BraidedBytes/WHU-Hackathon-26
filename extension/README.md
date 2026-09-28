# Spoilsport Chrome extension

The extension is ready to load without a second API key. AI classification uses the web app at `http://localhost:3000`, which reads `OPENAI_API_KEY` and `OPENAI_MODEL` from the gitignored `.env.local` file.

1. Run `npm run dev` from the repo root. Keep port 3000.
2. Open `chrome://extensions` in Chrome, enable Developer mode, choose **Load unpacked**, and select this `extension` directory.
3. Open `http://localhost:3000`, click **Load demo films**, and check for **Extension connected**.
4. Open `http://localhost:3000/demo/forum`. Film spoilers should blur; ordinary comments should clear. Use the extension popup to compare AI and Keyword modes or pause the shield.

After changing extension files, click the reload icon on its card at `chrome://extensions`, then refresh the app and forum tabs.

`node --test extension/test/*.test.mjs` runs detector tests. With the app running, `node extension/scripts/eval.mjs` evaluates the demo fixture. `node extension/scripts/package.mjs` creates a key-free ZIP in `dist/` for sharing.

The extension sends only candidate text snippets and protected-film context to the local app. The app sends that content to OpenAI. It never sends page URLs or browsing history.
