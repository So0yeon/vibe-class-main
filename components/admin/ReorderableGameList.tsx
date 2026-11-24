"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { PublishToggle } from "@/components/admin/PublishToggle";
import { resetGameOrderByDate, saveGameOrder } from "@/lib/actions/admin";
import type { GameItem } from "@/lib/games";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function SortableRow({
  game,
  index,
  onMoveTop,
}: {
  game: GameItem;
  index: number;
  onMoveTop: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: game.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 bg-slate-800/40 px-2 py-2.5 sm:gap-3 sm:px-3 ${
        isDragging ? "relative z-10 bg-slate-700 shadow-xl ring-1 ring-cyan-500/50" : ""
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`${game.title} 순서 옮기기`}
        className="flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-slate-500 hover:bg-slate-700/60 hover:text-slate-200 active:cursor-grabbing"
      >
        <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden>
          {[3, 10, 17].map((y) => (
            <g key={y}>
              <circle cx="4" cy={y} r="1.6" />
              <circle cx="10" cy={y} r="1.6" />
            </g>
          ))}
        </svg>
      </button>
      <span className="w-6 shrink-0 text-right font-mono text-xs text-slate-500">
        {index + 1}
      </span>
      <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-slate-900">
        {game.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={game.thumbnail} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="flex h-full items-center justify-center text-lg opacity-50">🎮</div>
        )}
      </div>
      <Link href={`/admin/games/${game.id}`} className="min-w-0 flex-1 hover:underline" draggable={false}>
        <span className="block truncate text-sm font-medium text-slate-100">{game.title}</span>
        <span className="block truncate text-xs text-slate-500">
          {game.date ?? "날짜 없음"}
          {game.tags.length > 0 && ` · ${game.tags.join(", ")}`}
          {game.worksheets.length > 0 && ` · 활동지 ${game.worksheets.length}개`}
        </span>
      </Link>
      {index > 0 && (
        <button
          type="button"
          onClick={() => onMoveTop(game.id)}
          title="맨 위로"
          aria-label={`${game.title} 맨 위로`}
          className="hidden shrink-0 rounded px-1.5 py-1 text-slate-500 hover:bg-slate-700/60 hover:text-slate-200 sm:block"
        >
          ⤒
        </button>
      )}
      <PublishToggle id={game.id} published={game.published} />
    </li>
  );
}

export function ReorderableGameList({ games }: { games: GameItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(games);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resetting, startReset] = useTransition();
  const latestOrder = useRef<string[] | null>(null);
  const inFlight = useRef(false);

  // 서버에서 새 목록이 오면(추가/삭제/날짜순 정렬 후) 맞춰 준다
  const [prevGames, setPrevGames] = useState(games);
  if (games !== prevGames) {
    setPrevGames(games);
    setItems(games);
  }


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** 저장 중에 또 옮기면, 끝난 뒤 마지막 순서로 한 번 더 저장한다 */
  const flush = async () => {
    if (inFlight.current || !latestOrder.current) return;
    const order = latestOrder.current;
    latestOrder.current = null;
    inFlight.current = true;
    setStatus("saving");
    const result = await saveGameOrder(order);
    inFlight.current = false;
    if ("error" in result) {
      setStatus("error");
      setError(result.error);
      return;
    }
    if (latestOrder.current) {
      void flush();
    } else {
      setStatus("saved");
    }
  };

  const queueSave = (next: GameItem[]) => {
    setError(null);
    latestOrder.current = next.map((g) => g.id);
    setStatus("saving");
    void flush();
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((g) => g.id === active.id);
    const to = items.findIndex((g) => g.id === over.id);
    const next = arrayMove(items, from, to);
    setItems(next);
    queueSave(next);
  };

  const moveTop = (id: string) => {
    const from = items.findIndex((g) => g.id === id);
    if (from <= 0) return;
    const next = arrayMove(items, from, 0);
    setItems(next);
    queueSave(next);
  };

  const onResetByDate = () => {
    if (!confirm("전체 순서를 날짜가 최근인 순으로 다시 정렬할까요? 지금 순서는 사라집니다.")) return;
    setError(null);
    startReset(async () => {
      const result = await resetGameOrderByDate();
      if ("error" in result) {
        setStatus("error");
        setError(result.error);
        return;
      }
      setStatus("saved");
      router.refresh();
    });
  };

  const statusText: Record<SaveStatus, string> = {
    idle: "손잡이(⠿)를 끌어서 순서를 바꾸면 바로 저장됩니다.",
    saving: "저장 중…",
    saved: "순서를 저장했습니다.",
    error: "저장하지 못했습니다.",
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p
          role="status"
          className={`text-xs ${
            status === "error" ? "text-red-300" : status === "saved" ? "text-emerald-300" : "text-slate-500"
          }`}
        >
          {error ?? statusText[status]}
        </p>
        <button
          type="button"
          onClick={onResetByDate}
          disabled={resetting || status === "saving"}
          className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 disabled:opacity-50"
        >
          {resetting ? "정렬 중…" : "날짜순으로 다시 정렬"}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col divide-y divide-slate-700/70 overflow-hidden rounded-xl border border-slate-700/70">
            {items.map((game, index) => (
              <SortableRow key={game.id} game={game} index={index} onMoveTop={moveTop} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}
