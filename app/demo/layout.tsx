import { DemoReady } from "@/components/DemoReady";

export default function DemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}<DemoReady /></>;
}
