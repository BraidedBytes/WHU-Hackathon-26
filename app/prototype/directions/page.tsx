"use client";

// THROWAWAY PROTOTYPE — a Flim-inspired visual direction for Spoilsport.
// All interactions use in-memory demo data. No TMDB, AI, storage, or extension writes.
import { FormEvent, useRef, useState } from "react";
import "./prototype.css";

type Film = {
  title: string;
  year: number;
  frame: number;
  status: "want" | "watched";
};

const startingFilms: Film[] = [
  { title: "The Sixth Sense", year: 1999, frame: 1, status: "want" },
  { title: "Avengers: Endgame", year: 2019, frame: 2, status: "want" },
  { title: "Arrival", year: 2016, frame: 3, status: "watched" },
];

const sampleFilms: Film[] = [
  { title: "Dune: Part Two", year: 2024, frame: 0, status: "want" },
  { title: "The Batman", year: 2022, frame: 2, status: "want" },
  { title: "Moon", year: 2009, frame: 3, status: "want" },
];

const tasteOptions = ["Thoughtful sci-fi", "Mystery", "Atmospheric", "Comedy", "Animation", "Horror"];

function Frame({ number, className = "" }: { number: number; className?: string }) {
  return <div className={"ss-frame ss-frame-" + number + " " + className} role="img" aria-label="Original cinematic concept imagery" />;
}

function ExtensionPopup({ protectedFilms, hiddenCount, onClose }: { protectedFilms: Film[]; hiddenCount: number; onClose?: () => void }) {
  return (
    <div className="ss-popup">
      <div className="ss-popup-head"><strong><span className="ss-popup-logo">S</span> spoilsport</strong>{onClose && <button type="button" aria-label="Close extension preview" onClick={onClose}>×</button>}</div>
      <div className="ss-popup-count"><span>{protectedFilms.length.toString().padStart(2, "0")}</span><p>films protected<br />on your watchlist</p></div>
      <div className="ss-popup-rule" />
      <div className="ss-popup-label">PROTECTED FILMS</div>
      {protectedFilms.length ? <div className="ss-popup-list">{protectedFilms.map((film) => <div key={film.title}><span>{film.title}</span><span>●</span></div>)}</div> : <p className="ss-popup-empty">Add a film to start protection.</p>}
      <div className="ss-popup-rule" />
      <div className="ss-popup-foot"><span>Mode</span><b>AI</b></div>
      <div className="ss-popup-foot"><span>Hidden on this page</span><b>{hiddenCount.toString().padStart(2, "0")}</b></div>
    </div>
  );
}

export default function DirectionsPrototype() {
  const [films, setFilms] = useState<Film[]>(startingFilms);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [taste, setTaste] = useState(["Thoughtful sci-fi", "Mystery", "Atmospheric"]);
  const [editingTaste, setEditingTaste] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("What should I watch tonight?");
  const searchRef = useRef<HTMLInputElement>(null);
  const protectedFilms = films.filter((film) => film.status === "want");
  const sixthSenseProtected = protectedFilms.some((film) => film.title === "The Sixth Sense");
  const matches = sampleFilms.filter((film) =>
    !films.some((saved) => saved.title === film.title) &&
    film.title.toLowerCase().includes(search.toLowerCase())
  );

  function addFilm(film: Film) {
    setFilms((current) => [...current, film]);
    setSearch("");
    setSearchOpen(false);
  }

  function toggleWatched(title: string) {
    setFilms((current) => current.map((film) => film.title === title
      ? { ...film, status: film.status === "want" ? "watched" : "want" }
      : film));
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim()) setAsked(question.trim());
    setQuestion("");
  }

  function focusSearch() {
    setSearchOpen(true);
    searchRef.current?.focus();
  }

  return (
    <div className="ss-prototype">
      <header className="ss-nav">
        <a className="ss-nav-brand" href="#top"><span className="ss-play">▶</span> SPOILSPORT</a>
        <nav aria-label="Prototype navigation"><a href="#watchlist">WATCHLIST</a><a href="#discover">DISCOVER</a><a href="#shield">THE SHIELD</a></nav>
        <button type="button" className="ss-nav-status" onClick={() => setPopupOpen(true)}><span className="ss-live-dot" /> SHIELD ACTIVE <b>{protectedFilms.length.toString().padStart(2, "0")}</b></button>
      </header>

      <main id="top">
        <section className="ss-intro" aria-label="Spoilsport introduction">
          <div className="ss-intro-title"><h1>spoilsport<span>.</span></h1><div><p>LOVE FILMS.<br />LOSE SPOILERS.</p><span>Your watchlist keeps the plot out of your way.</span></div></div>
          <div className="ss-stage">
            <Frame number={0} className="ss-floating ss-floating-one" />
            <Frame number={1} className="ss-floating ss-floating-two" />
            <Frame number={2} className="ss-floating ss-floating-three" />
            <Frame number={3} className="ss-floating ss-floating-four" />
            <div className="ss-redaction"><div className="ss-redaction-meta"><span>FILM FORUM / COMMENT 04</span><span>PROTECTED BY SPOILSPORT</span></div><div className="ss-redaction-copy"><span>A story detail stays covered here.</span></div><div className="ss-redaction-caption"><span className="ss-live-dot" /> A possible reveal, hidden until you choose</div></div>
            <div className="ss-stage-note">SCENES REMAIN YOURS TO DISCOVER</div>
            <div className="ss-search-dock">
              <span className="ss-search-icon">⌕</span>
              <input ref={searchRef} value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => setSearch(event.target.value)} placeholder="Find a film to protect" aria-label="Find a film to protect" />
              <button type="button" onClick={focusSearch}>SEARCH <span>↗</span></button>
              {searchOpen && <div className="ss-search-results"><div className="ss-search-results-head"><span>DEMO FILMS</span><button type="button" onClick={() => setSearchOpen(false)}>CLOSE</button></div>{matches.length ? matches.map((film) => <button type="button" key={film.title} onClick={() => addFilm(film)}><span>{film.title} <small>{film.year}</small></span><b>ADD +</b></button>) : <p>No demo films match. Try “Dune”, “Batman”, or “Moon”.</p>}</div>}
            </div>
          </div>
        </section>

        <section id="watchlist" className="ss-watchlist-section">
          <div className="ss-section-top"><div><span className="ss-eyebrow">01 / YOUR WATCHLIST</span><h2>The films ahead of you.</h2></div><p>{protectedFilms.length} protected · {films.length - protectedFilms.length} watched<br />Mark one watched and its shield lifts.</p></div>
          <div className="ss-film-grid">{films.map((film) => <article key={film.title} className="ss-film"><Frame number={film.frame} /><div className="ss-film-info"><div><span>{film.year} / {film.status === "want" ? "PROTECTED" : "WATCHED"}</span><h3>{film.title}</h3></div><button type="button" onClick={() => toggleWatched(film.title)}>{film.status === "want" ? "Mark watched ↗" : "Protect again ↗"}</button></div></article>)}</div>
          <div className="ss-watchlist-bottom"><span>THE WATCHLIST SETS THE SHIELD. NOTHING TO CONFIGURE FOR EACH PAGE.</span><button type="button" onClick={focusSearch}>ADD ANOTHER FILM <span>＋</span></button></div>
        </section>

        <section id="discover" className="ss-discover-section">
          <div className="ss-discover-heading"><span className="ss-eyebrow">02 / DISCOVER WITHOUT REVEALS</span><h2>Know what to watch.<br /><i>Not what happens.</i></h2></div>
          <div className="ss-discover-grid"><div className="ss-taste"><span className="ss-small-heading">YOUR TASTE PROFILE</span><p>A few preferences make the advice yours.</p><div className="ss-taste-tags">{taste.map((item) => <span key={item}>{item}</span>)}</div><div className="ss-taste-favourites">FAVOURITE FILMS <strong>Arrival, Blade Runner 2049</strong></div><button type="button" onClick={() => setEditingTaste(!editingTaste)}>{editingTaste ? "DONE" : "EDIT TASTE"} ↗</button>{editingTaste && <div className="ss-taste-options">{tasteOptions.map((item) => <button type="button" key={item} className={taste.includes(item) ? "selected" : ""} onClick={() => setTaste((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}>{item}</button>)}</div>}</div><div className="ss-chat"><div className="ss-chat-heading"><span>ASK SPOILSPORT</span><span>STORY DETAILS STAY OUT</span></div><div className="ss-chat-user">{asked}</div><div className="ss-chat-answer"><span className="ss-chat-symbol">✳</span><div><h3>Try <em>Moon</em> (2009).</h3><p>It shares the reflective sci-fi mood you loved in <i>Arrival</i>, with a quieter, more intimate scale. No plot details needed.</p><span>BASED ON YOUR TASTE / SPOILER-SAFE</span></div></div><form onSubmit={submitQuestion}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about a film or a mood" aria-label="Ask about a film or a mood" /><button type="submit" aria-label="Ask Spoilsport">↑</button></form></div></div>
        </section>

        <section id="shield" className="ss-shield-section">
          <div className="ss-shield-left"><span className="ss-eyebrow">03 / THE EXTENSION</span><h2>Read the web.<br />Keep the reveal out.</h2><p>Possible spoilers for protected films stay obscured. Safe discussion remains readable, including comments added after the page loads.</p><button type="button" onClick={() => setPopupOpen(true)}>VIEW EXTENSION STATUS ↗</button></div>
          <div className="ss-forum"><div className="ss-forum-head"><span>FILM FORUM</span><span>LIVE PAGE PREVIEW</span></div><div className="ss-forum-comment"><b>FilmFan88</b><p>The performances are fantastic. Worth watching on a big screen.</p></div><div className="ss-forum-comment"><b>SceneWatcher</b>{sixthSenseProtected && !revealed ? <div className="ss-forum-blur"><span>Potential reveal for The Sixth Sense</span><button type="button" onClick={() => setRevealed(true)}>REVEAL</button></div> : <p>{sixthSenseProtected ? "Sample passage revealed for this session." : "This film is watched, so the sample passage is readable."}</p>}</div><div className="ss-forum-comment"><b>New comment just added</b><p className="ss-forum-soft">Checked without refreshing the page.</p></div></div>
          <div className="ss-inline-popup"><ExtensionPopup protectedFilms={protectedFilms} hiddenCount={sixthSenseProtected && !revealed ? 1 : 0} /></div>
        </section>
      </main>

      <footer className="ss-footer"><span>spoilsport.</span><span>PROTOTYPE ONLY · ORIGINAL CONCEPT IMAGERY · NO LIVE SERVICE CALLS</span></footer>
      {popupOpen && <div className="ss-popup-overlay" onClick={() => setPopupOpen(false)}><div onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Extension status preview"><ExtensionPopup protectedFilms={protectedFilms} hiddenCount={sixthSenseProtected && !revealed ? 1 : 0} onClose={() => setPopupOpen(false)} /></div></div>}
    </div>
  );
}
