"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { demoFixtures, lateDemoComment } from '@/lib/demo-fixtures';

export function DemoForum() {
  const [protectedCount, setProtectedCount] = useState(0);
  const [ack, setAck] = useState<number | null>(null);
  const [showLateComment, setShowLateComment] = useState(false);

  useEffect(() => {
    function sync() {
      let watchlist = [];
      try {
        const stored = JSON.parse(localStorage.getItem('spoilsport:watchlist') ?? '[]');
        if (Array.isArray(stored)) watchlist = stored;
      } catch { /* Keep the demo readable if localStorage is malformed. */ }
      setProtectedCount(watchlist.filter((film: { status?: string }) => film.status === 'want').length);
      window.postMessage({ source: 'spoilsport-webapp', type: 'WATCHLIST_SYNC', watchlist }, window.location.origin);
    }
    function onMessage(event: MessageEvent) {
      if (event.origin === window.location.origin && event.data?.source === 'spoilsport-extension' &&
          event.data?.type === 'EXTENSION_ACK' && typeof event.data.count === 'number') setAck(event.data.count);
    }
    window.addEventListener('message', onMessage);
    window.addEventListener('storage', sync);
    sync();
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const rows = showLateComment ? [...demoFixtures, lateDemoComment] : demoFixtures;

  return <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-7">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-6">
      <Link href="/" className="text-lg font-black tracking-tight text-white">S <span className="text-rose-400">spoilsport</span></Link>
      <span className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-xs uppercase tracking-[.18em] text-zinc-400">The film forum · live demo</span>
    </header>

    <section className="grid gap-8 py-10 lg:grid-cols-[1fr_290px]">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-rose-400">The internet, with a spoiler shield</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">A forum you can scroll without fear.</h1>
        <p className="mt-5 max-w-2xl text-zinc-400">These are sample film comments. Watch the extension blur plot reveals while leaving ordinary discussion readable.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => setShowLateComment(true)} disabled={showLateComment} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{showLateComment ? 'New comment posted' : 'Post a new spoiler comment'}</button>
          <Link href="/" className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white hover:bg-white/5">Back to watchlist</Link>
        </div>

        <div className="mt-10 grid gap-4">
          {rows.map((item, index) => <article key={item.id} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl">
            <div className="mb-3 flex items-center gap-3 text-xs text-zinc-500"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 font-bold text-zinc-200">{['A', 'M', 'J', 'R'][index % 4]}</span><span>FilmFan{index + 1}</span><span>·</span><span>{item.film}</span><span>·</span><span>{index + 2} min ago</span></div>
            <p data-expected={item.expected} className="text-base leading-relaxed text-zinc-100">{item.text}</p>
            <div className="mt-4 flex gap-5 text-xs text-zinc-500"><span>♡ {12 + index * 3}</span><span>Reply</span><span>Share</span></div>
          </article>)}
        </div>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-8">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-zinc-500">Live shield status</p>
          <p className="mt-4 text-2xl font-black">{ack !== null ? 'Extension connected' : 'Extension not detected'}</p>
          <p className="mt-2 text-sm text-zinc-400">{protectedCount} unwatched films in this browser · {ack === null ? 'No ACK yet' : `${ack} synced to extension`}</p>
          {protectedCount === 0 && <Link href="/" className="mt-4 inline-block text-sm font-bold text-rose-300">Load the demo watchlist →</Link>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 text-sm text-zinc-400">
          <p className="font-bold text-white">Show the judges</p>
          <ol className="mt-3 list-inside list-decimal space-y-2"><li>Load the two demo films from the watchlist.</li><li>Open this forum in Chrome with the extension.</li><li>Toggle AI / Keyword in the popup.</li><li>Mark a film watched and watch its blur disappear.</li></ol>
        </div>
      </aside>
    </section>
  </main>;
}
