import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spoilsport — love films, lose spoilers",
  description: "A spoiler-safe film watchlist and chat.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-spoilsport-pathname") ?? "/";
  const protectApp = !pathname.startsWith("/demo");
  return (
    <html lang="en" suppressHydrationWarning>
      <body {...(protectApp ? { "data-spoilsport-ignore": "" } : {})}>{children}</body>
    </html>
  );
}
