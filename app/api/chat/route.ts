import { NextRequest, NextResponse } from "next/server";
import { tmdb, yearOf } from "@/lib/tmdb";

const SYSTEM = `You are Spoilsport, a film-loving friend who helps people decide whether a film is for them without ever spoiling it.
Hard rules:
- Reveal nothing beyond the premise in the provided official overview: no twists, reveals, deaths, endings, character fates, surprise cameos, or "wait until the scene where…".
- If asked for spoilers, decline cheerfully and offer something spoiler-free instead.
- If unsure whether something is a spoiler, leave it out.
Talk about: tone, mood, pacing, genre, themes, performances, score, visuals, runtime, content notes (violence, gore, sexual content) stated plainly, and 2–3 comparable films.
Personalise using the user's profile and watchlist ("you loved X; this shares its slow-burn tension").
End every film briefing with: "Match: likely / maybe / unlikely" plus one sentence why.
Keep answers under 120 words unless asked for more.
When recommending, end with: {"recommendations":[{"title":"...","year":2024}]}`;

function extractRecommendations(answer: string) {
  const match = answer.match(/\{\s*"recommendations"\s*:\s*\[[\s\S]*?\]\s*\}\s*$/);
  if (!match) return { clean: answer, requested: [] as { title: string; year?: number }[] };
  try {
    const parsed = JSON.parse(match[0]);
    return { clean: answer.slice(0, match.index).trim(), requested: Array.isArray(parsed.recommendations) ? parsed.recommendations : [] };
  } catch { return { clean: answer, requested: [] as { title: string; year?: number }[] }; }
}

export async function POST(request: NextRequest) {
  try {
    const key = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;
    if (!key || !model) throw new Error("OPENAI_API_KEY or OPENAI_MODEL is not configured");
    const { messages, film, profile, watchlistTitles } = await request.json();
    const safeFilm = film ? { title: film.title, originalTitle: film.originalTitle, year: film.year, overview: film.overview, genres: film.genres ?? [] } : null;
    const safeProfile = profile ? { favouriteFilms: (profile.favouriteFilms ?? []).map((item: any) => ({ title: item.title, year: item.year })), genres: profile.genres ?? [], dislikes: profile.dislikes ?? "" } : null;
    const context = `Film context: ${JSON.stringify(safeFilm)}\nUser profile: ${JSON.stringify(safeProfile)}\nWatchlist titles: ${JSON.stringify(watchlistTitles ?? [])}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, reasoning_effort: "low", messages: [{ role: "system", content: `${SYSTEM}\n\n${context}` }, ...(messages ?? [])] }),
    });
    if (!response.ok) throw new Error(`OpenAI request failed (${response.status})`);
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "I couldn't form an answer just now.";
    const { clean, requested } = extractRecommendations(raw);
    const recommendations = [];
    for (const rec of requested.slice(0, 5)) {
      if (!rec?.title) continue;
      const found = await tmdb(`/search/movie?query=${encodeURIComponent(rec.title)}&include_adult=false&language=en-US&page=1`);
      const normalized = rec.title.trim().toLowerCase();
      const movie = (found.results ?? []).find((item: any) => {
        const titleMatches = [item.title, item.original_title].some((title) => String(title).trim().toLowerCase() === normalized);
        const itemYear = yearOf(item.release_date);
        return titleMatches && (!rec.year || !itemYear || Math.abs(itemYear - rec.year) <= 1);
      });
      if (movie) recommendations.push({ id: movie.id, title: movie.title, originalTitle: movie.original_title, year: yearOf(movie.release_date), posterPath: movie.poster_path, overview: movie.overview ?? "" });
    }
    return NextResponse.json({ answer: clean, recommendations });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Chat failed" }, { status: 500 });
  }
}
