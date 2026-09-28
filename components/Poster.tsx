import Image from "next/image";

export function Poster({ path, title, fill = false }: { path: string | null; title: string; fill?: boolean }) {
  if (!path) return <div className="flex h-full min-h-32 items-center justify-center bg-gradient-to-br from-rose-950 via-zinc-900 to-violet-950 px-3 text-center"><span className="max-w-40 text-lg font-black leading-tight text-rose-100/80">{title}</span></div>;
  const src = `https://image.tmdb.org/t/p/w342${path}`;
  return fill
    ? <Image src={src} alt={`${title} poster`} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" />
    : <Image src={src} alt={`${title} poster`} width={80} height={120} className="h-28 w-[74px] rounded-lg object-cover" />;
}
