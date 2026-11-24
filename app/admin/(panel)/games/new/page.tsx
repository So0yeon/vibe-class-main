import Link from "next/link";
import { GameForm } from "@/components/admin/GameForm";

export default function NewGamePage() {
  return (
    <>
      <Link href="/admin" className="mb-4 inline-block text-sm text-slate-400 hover:text-slate-200">
        ← 목록으로
      </Link>
      <h1 className="mb-6 text-xl font-bold text-slate-100">새 게임</h1>
      <GameForm game={null} />
    </>
  );
}
