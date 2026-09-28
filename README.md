# Spoilsport

Spoiler-safe film watchlist and chat for the WHU Hackathon.

## Run locally

1. Install dependencies with `npm ci`.
2. For live film search and AI classification, copy `.env.example` to `.env.local` and fill in:

   ```env
   TMDB_READ_TOKEN=your_tmdb_v4_read_token
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=your_chat_completions_model
   ```

   `.env.local` is ignored by Git. Edit it locally; never paste keys in chat or commit them. Use a restricted project key for the demo and rotate it afterward. The demo film button works without TMDB credentials; live search needs `TMDB_READ_TOKEN`, and AI mode and chat need `OPENAI_API_KEY` plus `OPENAI_MODEL`.

3. Start the app:

   ```bash
   npm run dev
   ```

The app always runs at [http://localhost:3000](http://localhost:3000), matching the Chrome extension contract.

## Live demo

1. Start the app and install the unpacked [`extension`](extension/) in Chrome (see its README).
2. On the watchlist, click **Load demo films**. The extension badge should say **Extension connected · 2 films protected**.
3. Open the [sample film forum](http://localhost:3000/demo/forum). With AI credentials configured, the extension blurs spoiler comments and clears safe ones. Without them, suspect comments remain blurred as unchecked; Keyword mode works without credentials. Use **Post a new spoiler comment** to demonstrate protection of late content.
4. Toggle AI / Keyword in the extension popup, then mark a film watched in the app to show the blur lift.

The OpenAI key stays in `.env.local`; the packaged extension contains no key.

## Extension contract

The watchlist is stored under `spoilsport:watchlist` and synced via `WATCHLIST_SYNC` on load and every change. The taste profile uses `spoilsport:profile`. Do not change these contracts without coordinating with the extension owner.
