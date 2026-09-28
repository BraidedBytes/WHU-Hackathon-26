export type WatchlistItem = {
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  genres: string[];
  characters: string[];
  cast: string[];
  keywords: string[];
  status: "want" | "watched";
  addedAt: string;
};

export type SearchResult = {
  id: number;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
};

export type TasteProfile = {
  favouriteFilms: SearchResult[];
  genres: string[];
  dislikes: string;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
