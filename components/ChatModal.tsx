"use client";

import { FormEvent, useState } from "react";
import { ChatMessage, SearchResult, TasteProfile, WatchlistItem } from "@/lib/types";
import { Poster } from "./Poster";

type Film = SearchResult | WatchlistItem;

export function ChatModal({ film, profile, watchlist, onClose, onAdd }: {
  film: Film | null;
  profile: TasteProfile;
  watchlist: WatchlistItem[];
  onClose: () => void;
  onAdd: (id: number) => Promise<void>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(film ? `Is ${film.title} for me?` : "What should I watch?");
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next); setInput(""); setError(""); setLoading(true); setRecommendations([]);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, film, profile, watchlistTitles: watchlist.map((item) => item.title) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Chat failed");
      setMessages([...next, { role: "assistant", content: data.answer }]);
      setRecommendations(data.recommendations ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Chat failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass flex h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl sm:h-[80vh] sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-rose-400">Spoiler-safe chat</p><h2 className="text-lg font-bold">{film ? film.title : "Find your next film"}</h2></div>
          <button onClick={onClose} className="rounded-full bg-white/5 px-3 py-2 text-zinc-400 hover:text-white" aria-label="Close chat">✕</button>
        </header>
        <div className="scrollbar flex-1 space-y-4 overflow-y-auto p-5">
          {!messages.length && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-zinc-300">Ask about tone, pacing, themes, content notes—or get a personalised recommendation. Plot twists stay locked away.</div>}
          {messages.map((message, i) => <div key={i} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "ml-auto bg-rose-500 text-white" : "bg-zinc-800 text-zinc-100"}`}>{message.content}</div>)}
          {loading && <div className="w-fit animate-pulse rounded-2xl bg-zinc-800 px-4 py-3 text-sm text-zinc-400">Keeping it spoiler-free…</div>}
          {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          {!!recommendations.length && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{recommendations.map((movie) => <div key={movie.id} className="flex gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-3"><Poster path={movie.posterPath} title={movie.title} /><div className="min-w-0"><p className="font-bold">{movie.title}</p><p className="text-xs text-zinc-400">{movie.year ?? "Year unknown"}</p><button onClick={() => onAdd(movie.id)} disabled={watchlist.some((item) => item.tmdbId === movie.id)} className="mt-3 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40">{watchlist.some((item) => item.tmdbId === movie.id) ? "Added" : "+ Add"}</button></div></div>)}</div>}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-4"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask without fear…" className="min-w-0 flex-1 rounded-full border border-white/10 bg-zinc-900 px-5 py-3 outline-none focus:border-rose-400" /><button disabled={loading || !input.trim()} className="rounded-full bg-rose-500 px-5 font-bold text-white disabled:opacity-40">Send</button></form>
      </div>
    </div>
  );
}
