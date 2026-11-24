import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { logout } from "@/lib/actions/admin";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <header className="border-b border-slate-700/70 bg-slate-900/60">
        <nav className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm sm:px-6">
          <Link href="/admin" className="font-bold text-slate-100">
            Vibe Class 관리자
          </Link>
          <Link href="/admin" className="text-slate-400 hover:text-slate-100">
            게임 목록
          </Link>
          <Link href="/admin/comments" className="text-slate-400 hover:text-slate-100">
            댓글
          </Link>
          <Link href="/admin/about" className="text-slate-400 hover:text-slate-100">
            소개 섹션
          </Link>
          <Link href="/" target="_blank" className="text-slate-400 hover:text-slate-100">
            사이트 보기 ↗
          </Link>
          <form action={logout} className="ml-auto">
            <button type="submit" className="text-slate-500 hover:text-slate-200">
              로그아웃
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
