import { NextRequest, NextResponse } from "next/server";
import { tmdb, yearOf } from "@/lib/tmdb";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid movie id" }, { status: 400 });
    const movie = await tmdb(`/movie/${id}?append_to_response=credits,keywords&language=en-US`);
    const topCast = (movie.credits?.cast ?? []).slice(0, 15);
    const blocked = /^(self|himself|herself)$/i;
    const characters = topCast
      .flatMap((person: any) => String(person.character ?? "").replace(/\s*\(voice\)\s*/gi, "").split(" / "))
      .map((name: string) => name.trim())
      .filter((name: string) => name && !blocked.test(name));
    return NextResponse.json({
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      year: yearOf(movie.release_date),
      posterPath: movie.poster_path,
      overview: movie.overview ?? "",
      genres: (movie.genres ?? []).map((genre: any) => genre.name),
      characters: [...new Set(characters)].slice(0, 15),
      cast: topCast.map((person: any) => person.name).filter(Boolean),
      keywords: (movie.keywords?.keywords ?? []).map((keyword: any) => keyword.name),
      status: "want",
      addedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Movie lookup failed" }, { status: 500 });
  }
}
