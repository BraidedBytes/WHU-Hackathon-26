import { NextRequest, NextResponse } from "next/server";
import { tmdb, yearOf, type TMDBSearchResponse } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  try {
    const data = await tmdb<TMDBSearchResponse>(`/search/movie?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`);
    const results = (data.results ?? []).slice(0, 8).map((movie) => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      year: yearOf(movie.release_date),
      posterPath: movie.poster_path,
      overview: movie.overview ?? "",
    }));
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 500 });
  }
}
