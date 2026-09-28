# Spoilsport

Spoiler-safe film watchlist and chat for the WHU Hackathon.

## Run locally

1. Register at [The Movie Database](https://www.themoviedb.org/) and create an API credential. The app accepts the v4 read access token or a v3 API key.
2. Copy `.env.example` to `.env.local` and fill in:

   ```env
   TMDB_READ_TOKEN=your_tmdb_v4_read_token
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=your_fast_model
   ```

3. Start the app:

   ```bash
   npm install
   npm run dev
   ```

The app always runs at [http://localhost:3000](http://localhost:3000), matching the Chrome extension contract.

## Live demo

1. Start the app and install the unpacked [`extension`](extension/) in Chrome (see its README).
2. On the watchlist, click **Load demo films**. The extension badge should say **Extension connected · 2 films protected**.
3. Open the [sample film forum](http://localhost:3000/demo/forum). The extension blurs spoiler comments and clears safe ones. Use **Post a new spoiler comment** to demonstrate protection of late content.
4. Toggle AI / Keyword in the extension popup, then mark a film watched in the app to show the blur lift.

The OpenAI key stays in `.env.local`; the packaged extension contains no key.

## Extension contract

The watchlist is stored under `spoilsport:watchlist` and synced via `WATCHLIST_SYNC` on load and every change. The taste profile uses `spoilsport:profile`. Do not change these contracts without coordinating with the extension owner.
