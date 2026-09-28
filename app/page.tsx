"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChatModal } from "@/components/ChatModal";
import { Poster } from "@/components/Poster";
import { SearchResult, TasteProfile, WatchlistItem } from "@/lib/types";

const WATCHLIST_KEY = "spoilsport:watchlist";
const PROFILE_KEY = "spoilsport:profile";
const GENRES = ["Action", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller"];
const EMPTY_PROFILE: TasteProfile = { favouriteFilms: [], genres: [], dislikes: "" };

async function searchMovies(q: string): Promise<SearchResult[]> {
  const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Search failed");
  return data.results;
}

export default function Home() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [profile, setProfile] = useState<TasteProfile>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [ack, setAck] = useState<number | null>(null);
  const [chatFilm, setChatFilm] = useState<SearchResult | WatchlistItem | null | undefined>(undefined);
  const [profileOpen, setProfileOpen] = useState(false);
  const [favQuery, setFavQuery] = useState("");
  const [favResults, setFavResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    try {
      const savedWatchlist = JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? "[]");
      const savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null");
      if (Array.isArray(savedWatchlist)) setWatchlist(savedWatchlist);
      if (savedProfile) setProfile({ ...EMPTY_PROFILE, ...savedProfile });
    } catch { setError("Saved data could not be read, so we started fresh."); }
    setHydrated(true);
    const listener = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.source === "spoilsport-extension" && event.data?.type === "EXTENSION_ACK" && typeof event.data.count === "number") setAck(event.data.count);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    const payload = { source: "spoilsport-webapp", type: "WATCHLIST_SYNC", watchlist };
    window.postMessage(payload, window.location.origin);
    console.info("[Spoilsport] WATCHLIST_SYNC", payload);
  }, [watchlist, hydrated]);

  useEffect(() => { if (hydrated) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }, [profile, hydrated]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const timeout = setTimeout(() => searchMovies(query).then(setResults).catch((e) => setError(e.message)).finally(() => setSearching(false)), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const protectedCount = useMemo(() => watchlist.filter((item) => item.status === "want").length, [watchlist]);

  async function addMovie(id: number) {
    if (watchlist.some((item) => item.tmdbId === id)) return;
    setBusyId(id); setError("");
    try {
      const response = await fetch(`/api/tmdb/movie/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not add film");
      setWatchlist((current) => current.some((item) => item.tmdbId === id) ? current : [data, ...current]);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not add film"); }
    finally { setBusyId(null); }
  }

  async function loadDemoFilms() {
    setDemoLoading(true); setError("");
    try {
      const ids = [745, 299534];
      const films = await Promise.all(ids.map(async (id) => {
        const response = await fetch(`/api/tmdb/movie/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load demo films");
        return data as WatchlistItem;
      }));
      setWatchlist((current) => [
        ...films.map((film) => ({ ...(current.find((item) => item.tmdbId === film.tmdbId) ?? film), status: "want" as const })),
        ...current.filter((item) => !ids.includes(item.tmdbId)),
      ]);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load demo films"); }
    finally { setDemoLoading(false); }
  }

  async function findFavourites(event: FormEvent) {
    event.preventDefault();
    if (!favQuery.trim()) return;
    try { setFavResults(await searchMovies(favQuery)); } catch (err) { setError(err instanceof Error ? err.message : "Search failed"); }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 sm:px-7">
      <nav className="flex items-center justify-between py-5">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-xl">S</span><div><p className="text-lg font-black tracking-tight">spoilsport</p><p className="text-[10px] uppercase tracking-[.2em] text-zinc-500">love films, lose spoilers</p></div></div>
        <div className="flex items-center gap-2">
          {ack !== null && <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:block"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />Extension connected · {ack} films protected</div>}
          <button onClick={() => setProfileOpen((open) => !open)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10">Taste profile</button>
        </div>
      </nav>

      <section className="py-12 text-center sm:py-20">
        <p className="mb-4 text-xs font-bold uppercase tracking-[.28em] text-rose-400">Your spoiler shield starts here</p>
        <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-7xl">Know what to watch.<br /><span className="text-zinc-500">Not what happens.</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-zinc-400">Build your watchlist, protect it across the web, and ask anything about a film—without ruining a single scene.</p>
        <div className="relative mx-auto mt-8 max-w-2xl text-left">
          <div className="glass flex items-center rounded-2xl p-2 shadow-2xl"><span className="px-3 text-zinc-500">⌕</span><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for a film…" className="w-full bg-transparent px-1 py-3 outline-none placeholder:text-zinc-600" />{searching && <span className="animate-pulse px-3 text-xs text-zinc-500">Searching…</span>}</div>
          {!!results.length && <div className="glass absolute z-30 mt-2 max-h-[430px] w-full overflow-y-auto rounded-2xl p-2 shadow-2xl">{results.map((movie) => <div key={movie.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5"><Poster path={movie.posterPath} title={movie.title} /><div className="min-w-0 flex-1"><p className="truncate font-bold">{movie.title}</p><p className="text-sm text-zinc-500">{movie.year ?? "Year unknown"}</p><p className="mt-1 line-clamp-2 text-xs text-zinc-400">{movie.overview || "No overview available."}</p></div><div className="flex shrink-0 flex-col gap-2"><button onClick={() => addMovie(movie.id)} disabled={busyId === movie.id || watchlist.some((item) => item.tmdbId === movie.id)} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black disabled:opacity-40">{watchlist.some((item) => item.tmdbId === movie.id) ? "Added" : busyId === movie.id ? "Adding…" : "+ Add"}</button><button onClick={() => setChatFilm(movie)} className="rounded-full border border-white/10 px-3 py-2 text-xs hover:bg-white/10">Ask</button></div></div>)}</div>}
        </div>
        <button onClick={() => setChatFilm(null)} className="mt-4 text-sm font-bold text-rose-300 hover:text-rose-200">✦ What should I watch?</button>
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-sm font-bold text-zinc-200">Ready for the judges?</span>
          <button onClick={loadDemoFilms} disabled={!hydrated || demoLoading} className="rounded-full bg-rose-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{demoLoading ? "Loading films…" : "1. Load demo films"}</button>
          <a href="/demo/forum" className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/10">2. Open spoiler forum →</a>
        </div>
        {error && <p className="mx-auto mt-4 max-w-xl rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      </section>

      {profileOpen && <section className="glass mb-12 rounded-3xl p-5 sm:p-7">
        <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-400">Taste profile</p><h2 className="mt-1 text-2xl font-black">Make it personal</h2></div><button onClick={() => setProfileOpen(false)} className="text-zinc-500">✕</button></div>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div><label className="text-sm font-bold">Three favourite films</label><div className="mt-3 flex flex-wrap gap-2">{profile.favouriteFilms.map((movie) => <button key={movie.id} onClick={() => setProfile((p) => ({ ...p, favouriteFilms: p.favouriteFilms.filter((film) => film.id !== movie.id) }))} className="rounded-full bg-violet-400/15 px-3 py-2 text-xs text-violet-200">{movie.title} ×</button>)}</div><form onSubmit={findFavourites} className="mt-3 flex gap-2"><input value={favQuery} onChange={(e) => setFavQuery(e.target.value)} placeholder="Search a favourite…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none" /><button className="rounded-xl bg-white px-4 text-sm font-bold text-black">Find</button></form>{!!favResults.length && <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 p-2">{favResults.slice(0, 5).map((movie) => <button key={movie.id} disabled={profile.favouriteFilms.length >= 3 || profile.favouriteFilms.some((film) => film.id === movie.id)} onClick={() => { setProfile((p) => ({ ...p, favouriteFilms: [...p.favouriteFilms, movie].slice(0, 3) })); setFavResults([]); setFavQuery(""); }} className="flex w-full justify-between rounded-lg p-2 text-left text-sm hover:bg-white/5 disabled:opacity-30"><span>{movie.title}</span><span className="text-zinc-500">{movie.year}</span></button>)}</div>}</div>
          <div><label className="text-sm font-bold">Favourite genres</label><div className="mt-3 flex flex-wrap gap-2">{GENRES.map((genre) => <button key={genre} onClick={() => setProfile((p) => ({ ...p, genres: p.genres.includes(genre) ? p.genres.filter((g) => g !== genre) : [...p.genres, genre] }))} className={`rounded-full border px-3 py-2 text-xs ${profile.genres.includes(genre) ? "border-rose-400 bg-rose-400/15 text-rose-200" : "border-white/10 text-zinc-400"}`}>{genre}</button>)}</div><label className="mt-6 block text-sm font-bold">Things I dislike</label><textarea value={profile.dislikes} onChange={(e) => setProfile((p) => ({ ...p, dislikes: e.target.value }))} placeholder="e.g. gore, very slow pacing, jump scares…" className="mt-3 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 text-sm outline-none" /></div>
        </div>
      </section>}

      <section className="pb-20">
        <div className="mb-6 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-zinc-500">Protected library</p><h2 className="mt-1 text-3xl font-black">Your watchlist <span className="text-zinc-600">{watchlist.length}</span></h2></div>{watchlist.length > 0 && <p className="text-sm text-zinc-500">{protectedCount} still to watch</p>}</div>
        {!hydrated ? <p className="text-zinc-500">Loading watchlist…</p> : !watchlist.length ? <div className="rounded-3xl border border-dashed border-white/10 py-16 text-center"><p className="text-4xl">🎞️</p><p className="mt-3 font-bold">No films yet</p><p className="mt-1 text-sm text-zinc-500">Search above to start your spoiler shield.</p></div> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{watchlist.map((movie) => <article key={movie.tmdbId} className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 poster-shadow"><div className="relative aspect-[2/3]"><Poster path={movie.posterPath} title={movie.title} fill /><div className="absolute inset-0 flex items-end bg-gradient-to-t from-black via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100"><button onClick={() => setWatchlist((items) => items.filter((item) => item.tmdbId !== movie.tmdbId))} className="rounded-full bg-black/70 px-3 py-2 text-xs text-red-300">Remove</button></div><span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold backdrop-blur ${movie.status === "watched" ? "bg-emerald-400/80 text-black" : "bg-black/70 text-white"}`}>{movie.status === "watched" ? "WATCHED" : "PROTECTED"}</span></div><div className="p-3"><h3 className="truncate font-bold">{movie.title}</h3><p className="text-xs text-zinc-500">{movie.year ?? "Year unknown"}</p><div className="mt-3 grid gap-2"><button onClick={() => setChatFilm(movie)} className="rounded-full bg-white py-2 text-xs font-bold text-black">Ask about this film</button><button onClick={() => setWatchlist((items) => items.map((item) => item.tmdbId === movie.tmdbId ? { ...item, status: item.status === "want" ? "watched" : "want" } : item))} className="rounded-full border border-white/10 py-2 text-xs text-zinc-300">{movie.status === "want" ? "✓ Mark watched" : "↩ Want to watch"}</button></div></div></article>)}</div>}
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-zinc-600">This product uses the TMDB API but is not endorsed or certified by TMDB.</footer>
      {chatFilm !== undefined && <ChatModal film={chatFilm} profile={profile} watchlist={watchlist} onClose={() => setChatFilm(undefined)} onAdd={addMovie} />}
    </main>
  );
}
