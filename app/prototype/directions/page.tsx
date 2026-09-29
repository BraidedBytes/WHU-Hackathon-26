"use client";

// THROWAWAY PROTOTYPE — Three interface directions, switchable via ?variant=,
// on one route. Static demo data only; no storage, service calls, or mutations.
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./prototype.css";

type Variant = "a" | "b" | "c";

const variants: { key: Variant; name: string }[] = [
  { key: "a", name: "Shield control room" },
  { key: "b", name: "Guided film journey" },
  { key: "c", name: "Conversation workspace" },
];

const films = [
  { title: "Dune: Part Two", year: "2024", kind: "Protected", mark: "D2" },
  { title: "The Batman", year: "2022", kind: "Protected", mark: "TB" },
  { title: "Arrival", year: "2016", kind: "Watched", mark: "AR" },
];

function FilmMark({ mark, index }: { mark: string; index: number }) {
  return <span className={`film-mark film-mark-${index}`}>{mark}</span>;
}

function Watchlist({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`watchlist ${compact ? "watchlist-compact" : ""}`}>
      {films.map((film, index) => (
        <div className="film-row" key={film.title}>
          <FilmMark mark={film.mark} index={index} />
          <div className="film-copy"><strong>{film.title}</strong><span>{film.year}</span></div>
          <span className={`film-state ${film.kind === "Watched" ? "watched" : ""}`}>{film.kind}</span>
        </div>
      ))}
    </div>
  );
}

function Profile() {
  return (
    <div className="profile-body">
      <div className="profile-title">Your taste, in a few clues</div>
      <div className="profile-tags"><span>Thoughtful sci-fi</span><span>Mystery</span><span>Slow burn</span></div>
      <p>Favourite films: <b>Arrival</b>, <b>Blade Runner 2049</b></p>
      <p className="quiet">Skip: graphic horror</p>
    </div>
  );
}

function Recommendation() {
  return (
    <div className="recommendation">
      <div className="question">What should I watch tonight?</div>
      <div className="answer"><span className="answer-symbol">✳</span><div><strong>Try Moon (2009).</strong><p>It has the reflective sci-fi mood you liked in Arrival, with a quieter, more intimate scale. I’ll keep the story details to myself.</p><span className="answer-foot">Matched to your taste · Spoiler-safe</span></div></div>
    </div>
  );
}

function Popup({ mini = false }: { mini?: boolean }) {
  return (
    <div className={`popup-mock ${mini ? "popup-mini" : ""}`}>
      <div className="popup-top"><b><span className="popup-symbol">S</span> spoilsport</b><span className="popup-live">● Active</span></div>
      <div className="popup-count"><strong>2</strong><span>films protected<br />across the web</span></div>
      <div className="popup-films"><span>Dune: Part Two</span><span>The Batman</span></div>
      <div className="popup-bottom"><span>Protection mode</span><strong>AI</strong></div>
      <div className="popup-bottom"><span>Hidden on this page</span><strong>3 passages</strong></div>
    </div>
  );
}

function ShieldSample() {
  return (
    <div className="shield-sample">
      <div className="shield-top"><span>FILM FORUM / LIVE PREVIEW</span><span>3 passages hidden</span></div>
      <p><b>FilmFan88</b> · The opening sequence sets the tone beautifully. The sound design is unreal.</p>
      <p className="shield-hidden"><b>ReelTalk</b> · <span>Potential plot reveal hidden for Dune: Part Two</span><button type="button">Reveal</button></p>
      <p><b>SceneWatcher</b> · The cinematography alone is worth seeing on a big screen.</p>
    </div>
  );
}

function VariantA() {
  return (
    <div className="prototype-page variant-a">
      <div className="a-shell">
        <header className="a-header"><div className="a-brand"><span>S</span><b>spoilsport</b></div><nav>Watchlist <span>·</span> Taste <span>·</span> Ask</nav><div className="a-connection"><i /> Extension connected</div></header>
        <section className="a-hero"><div><p className="a-kicker">Your film life, protected</p><h1>Watch the film.<br /><em>Keep the surprise.</em></h1><p>Add a film once. Spoilsport keeps its plot out of your way as you browse.</p><button type="button" className="a-primary">Add a film <span>＋</span></button></div><div className="a-hero-shield"><span>LIVE SHIELD</span><div className="a-redaction">A plot reveal goes here</div><strong>Potential spoiler hidden</strong><p>Safe conversation stays readable.</p></div></section>
        <div className="a-grid"><section className="a-panel a-watch"><div className="panel-heading"><div><small>01 / WATCHLIST</small><h2>Films on your radar</h2></div><span className="a-count">2 protected</span></div><Watchlist /><button type="button" className="a-link">Search films</button></section><section className="a-panel a-profile"><div className="panel-heading"><div><small>02 / TASTE</small><h2>Make it personal</h2></div><span>↗</span></div><Profile /></section><section className="a-panel a-chat"><div className="panel-heading"><div><small>03 / DISCOVER</small><h2>Ask without spoilers</h2></div></div><Recommendation /><div className="a-input">Ask for a film or a mood <span>↑</span></div></section><aside className="a-panel a-popup"><div className="panel-heading"><div><small>IN THE BROWSER</small><h2>Your extension</h2></div></div><Popup mini /></aside></div>
      </div>
    </div>
  );
}

function VariantB() {
  return (
    <div className="prototype-page variant-b">
      <div className="b-shell">
        <header className="b-header"><b>spoilsport<span>✳</span></b><span>Film discovery without the plot reveals</span><button type="button">Open watchlist</button></header>
        <section className="b-opening"><div className="b-open-copy"><span className="b-section-label">01 — Protect the films you plan to watch</span><h1>Good films deserve<br />a clean slate.</h1><p>Your watchlist tells the extension what to shield. You still see the conversations that are safe to read.</p><button type="button">Add a film to protect</button></div><div className="b-film-stack"><div className="b-stack-header">Your watchlist <span>2 protected</span></div><Watchlist compact /></div></section>
        <section className="b-proof"><div><span className="b-section-label">02 — Browse without the reveal</span><h2>The conversation is still yours.</h2><p>Only passages that may give away a protected film stay covered.</p></div><ShieldSample /><div className="b-popup-wrap"><span>EXTENSION / CURRENT PAGE</span><Popup mini /></div></section>
        <section className="b-discover"><div><span className="b-section-label">03 — Find your next film</span><h2>A recommendation that knows your taste.</h2><Profile /></div><div className="b-chat-wrap"><Recommendation /><div className="b-input">Ask what to watch <span>Send</span></div></div></section>
      </div>
    </div>
  );
}

function VariantC() {
  return (
    <div className="prototype-page variant-c">
      <div className="c-shell">
        <aside className="c-sidebar"><div className="c-brand">S<span>spoilsport</span></div><div className="c-nav"><b>Tonight</b><span>My watchlist <i>3</i></span><span>Taste profile</span><span>Extension</span></div><div className="c-side-bottom"><span className="c-status-dot" /> Your shield is active<br /><small>2 films protected</small></div></aside>
        <main className="c-main"><header className="c-top"><span>Your film desk</span><span>Tuesday, 29 September</span></header><div className="c-welcome"><span>YOUR PRIVATE SCREENING ROOM</span><h1>Find the next film.<br />Keep its secrets.</h1><p>Your protected list follows you into the browser. Your taste shapes what comes next.</p></div><div className="c-content"><section className="c-conversation"><div className="c-section-head"><h2>Ask Spoilsport</h2><span>Story details stay out</span></div><Recommendation /><div className="c-prompts"><button type="button">Something like Arrival</button><button type="button">A slow mystery</button></div><div className="c-compose">Ask about a film or a mood <span>↑</span></div></section><div className="c-column"><section className="c-watch"><div className="c-section-head"><h2>Watchlist</h2><span>2 protected</span></div><Watchlist compact /><button type="button" className="c-add">+ Add a film</button></section><section className="c-profile"><div className="c-section-head"><h2>Taste profile</h2><span>Edit</span></div><Profile /></section></div></div><div className="c-popup-block"><div><h2>Protection follows your watchlist.</h2><p>Open the extension to see what is hidden on the page you’re reading.</p></div><Popup mini /></div></main>
      </div>
    </div>
  );
}

function Prototype() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("variant");
  const current: Variant = raw === "b" || raw === "c" ? raw : "a";
  const [showNotes, setShowNotes] = useState(false);

  function change(direction: number) {
    const index = variants.findIndex((variant) => variant.key === current);
    const next = variants[(index + direction + variants.length) % variants.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next.key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowLeft") change(-1);
      if (event.key === "ArrowRight") change(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const currentIndex = variants.findIndex((variant) => variant.key === current);
  const previous = variants[(currentIndex + variants.length - 1) % variants.length];
  const next = variants[(currentIndex + 1) % variants.length];

  return <>
    {current === "a" && <VariantA />}
    {current === "b" && <VariantB />}
    {current === "c" && <VariantC />}
    <div className="prototype-marker">THROWAWAY DESIGN PROBE <button type="button" onClick={() => setShowNotes(!showNotes)}>{showNotes ? "Hide" : "Show"} comparison</button></div>
    {showNotes && <div className="prototype-notes"><b>Compare the layout, not the sample copy.</b><p>A: protection status and four tools at a glance. B: a clear path from watchlist to browsing to discovery. C: recommendation chat as a workspace, with the watchlist beside it.</p><p>All three use the same demo films and static states. Nothing here calls TMDB or AI.</p></div>}
    {process.env.NODE_ENV !== "production" && <div className="prototype-switcher" aria-label="Prototype variants"><a href={"?variant=" + previous.key} aria-label="Previous variant">←</a><span>{current.toUpperCase()} — {variants.find((variant) => variant.key === current)?.name}</span><a href={"?variant=" + next.key} aria-label="Next variant">→</a></div>}
  </>;
}

export default function PrototypePage() {
  return <Suspense fallback={null}><Prototype /></Suspense>;
}
