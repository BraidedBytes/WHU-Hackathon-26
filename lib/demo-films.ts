import type { WatchlistItem } from "@/lib/types";

// A self-contained watchlist for the local extension demo. Live search still uses TMDB.
export const demoFilms: WatchlistItem[] = [
  {
    tmdbId: 745,
    title: "The Sixth Sense",
    originalTitle: "The Sixth Sense",
    year: 1999,
    posterPath: null,
    overview: "A child psychologist helps a young boy who says he can see ghosts.",
    genres: ["Mystery", "Thriller"],
    characters: ["Malcolm Crowe", "Cole Sear"],
    cast: ["Bruce Willis", "Haley Joel Osment"],
    keywords: ["ghost", "psychologist"],
    status: "want",
    addedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    tmdbId: 299534,
    title: "Avengers: Endgame",
    originalTitle: "Avengers: Endgame",
    year: 2019,
    posterPath: null,
    overview: "The remaining Avengers seek a way to undo the destruction caused by Thanos.",
    genres: ["Action", "Science Fiction"],
    characters: ["Tony Stark", "Steve Rogers", "Natasha Romanoff", "Thanos"],
    cast: ["Robert Downey Jr.", "Chris Evans", "Scarlett Johansson"],
    keywords: ["Avengers", "Thanos"],
    status: "want",
    addedAt: "2026-01-01T00:00:00.000Z",
  },
];
