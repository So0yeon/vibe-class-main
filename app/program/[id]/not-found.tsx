import Link from "next/link";

export default function ProgramNotFound() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-[#0f172a] px-4 py-20 text-center text-slate-200">
      <p className="text-5xl">🔍</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-100">
        존재하지 않거나 비공개 처리된 자료입니다
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        주소가 정확한지 확인하거나 목록으로 돌아가주세요.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-500/20 hover:text-cyan-200"
      >
        ← 목록으로 돌아가기
      </Link>
    </div>
  );
}
