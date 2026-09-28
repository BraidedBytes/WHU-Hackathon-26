import Image from "next/image";

export function Poster({ path, title, fill = false }: { path: string | null; title: string; fill?: boolean }) {
  if (!path) return <div className="flex h-full min-h-32 items-center justify-center bg-zinc-800 px-3 text-center text-xs text-zinc-500">No poster</div>;
  const src = `https://image.tmdb.org/t/p/w342${path}`;
  return fill
    ? <Image src={src} alt={`${title} poster`} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" />
    : <Image src={src} alt={`${title} poster`} width={80} height={120} className="h-28 w-[74px] rounded-lg object-cover" />;
}
