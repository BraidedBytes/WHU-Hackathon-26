const TMDB_BASE = "https://api.themoviedb.org/3";

export type TMDBSearchMovie = {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path: string | null;
  overview?: string;
};

export type TMDBSearchResponse = { results?: TMDBSearchMovie[] };

export type TMDBMovie = TMDBSearchMovie & {
  genres?: { name: string }[];
  credits?: { cast?: { name: string; character?: string }[] };
  keywords?: { keywords?: { name: string }[] };
};

export async function tmdb<T>(path: string): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN?.trim();
  if (!token) throw new Error("TMDB_READ_TOKEN is not configured");
  const url = new URL(`${TMDB_BASE}${path}`);
  const isV3Key = /^[a-f0-9]{32}$/i.test(token);
  if (isV3Key) url.searchParams.set("api_key", token);
  const response = await fetch(url, {
    headers: { ...(isV3Key ? {} : { Authorization: `Bearer ${token}` }), accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function yearOf(date?: string): number | null {
  const year = date ? Number(date.slice(0, 4)) : NaN;
  return Number.isFinite(year) ? year : null;
}
