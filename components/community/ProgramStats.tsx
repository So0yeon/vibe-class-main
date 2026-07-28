"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { incrementView, likeProgram } from "@/lib/actions/community";

const LIKED_STORAGE_KEY = "vibeclass:likedPrograms";

function getLikedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIKED_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function rememberLikedId(id: string) {
  try {
    const ids = new Set(getLikedIds());
    ids.add(id);
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage를 쓸 수 없는 환경(사생활 보호 모드 등) - 조용히 무시
  }
}

const noopSubscribe = () => () => {};
const likedServerSnapshot = () => false;

/** SSR에서는 항상 false, 하이드레이션 이후에만 localStorage를 읽어 불일치 없이 동기화 */
function useIsLikedOnThisDevice(programId: string): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => getLikedIds().includes(programId),
    likedServerSnapshot,
  );
}

type Props = {
  programId: string;
  initialViews: number;
  initialLikes: number;
};

export function ProgramStats({
  programId,
  initialViews,
  initialLikes,
}: Props) {
  const [views, setViews] = useState(initialViews);
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [isPopping, setIsPopping] = useState(false);
  const [isLikePending, startLikeTransition] = useTransition();
  const hasRequestedView = useRef(false);

  const likedOnDevice = useIsLikedOnThisDevice(programId);
  const liked = likedOnDevice || optimisticLiked;

  useEffect(() => {
    if (hasRequestedView.current) return;
    hasRequestedView.current = true;

    startTransition(async () => {
      const result = await incrementView(programId);
      if (result) setViews(result.views);
    });
  }, [programId]);

  const handleLike = () => {
    if (liked || isLikePending) return;

    setOptimisticLiked(true);
    setLikes((prev) => prev + 1);
    setLikeError(null);
    setIsPopping(true);
    window.setTimeout(() => setIsPopping(false), 500);

    startLikeTransition(async () => {
      const result = await likeProgram(programId);
      if ("error" in result) {
        setOptimisticLiked(false);
        setLikes((prev) => Math.max(0, prev - 1));
        setLikeError(result.error);
        return;
      }
      setLikes(result.likes);
      rememberLikedId(programId);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleLike}
        disabled={liked || isLikePending}
        aria-pressed={liked}
        aria-label={`좋아요 ${likes}개, ${liked ? "이미 눌렀습니다" : "누르기"}`}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${
          liked
            ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
            : "border-slate-600/50 bg-slate-800/40 text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
        }`}
      >
        <span
          aria-hidden
          className={`inline-block ${isPopping ? "community-like-pop" : ""}`}
        >
          {liked ? "❤️" : "🤍"}
        </span>
        {likes.toLocaleString("ko-KR")}
      </button>

      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
        <span aria-hidden>👀</span>
        {views.toLocaleString("ko-KR")}
      </span>

      {likeError && (
        <span role="alert" className="text-xs text-red-400">
          {likeError}
        </span>
      )}
    </div>
  );
}
