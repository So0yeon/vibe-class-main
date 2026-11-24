import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 │ Vibe Class",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-[#0f172a] text-slate-200">{children}</div>;
}
