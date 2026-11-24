"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteGame, saveGame } from "@/lib/actions/admin";
import {
  GRADE_ORDER,
  SUBJECT_ORDER,
  type GameItem,
  type WorksheetFile,
} from "@/lib/games";
import { FileDrop } from "@/components/admin/FileDrop";
import { uploadFile } from "@/components/admin/upload";

type Props = { game: GameItem | null };

const inputClass =
  "w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function ChipToggle({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onChange(on ? selected.filter((s) => s !== opt) : [...selected, opt])
            }
            className={`rounded-md border px-3 py-1 text-sm transition ${
              on
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                : "border-slate-600 bg-slate-900/40 text-slate-400 hover:text-slate-200"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function GameForm({ game }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [title, setTitle] = useState(game?.title ?? "");
  const [description, setDescription] = useState(game?.description ?? "");
  const [url, setUrl] = useState(game?.url ?? "");
  const [thumbnail, setThumbnail] = useState<string | null>(game?.thumbnail ?? null);
  const [tags, setTags] = useState<string[]>(game?.tags ?? []);
  const [customTag, setCustomTag] = useState("");
  const [grades, setGrades] = useState<string[]>(game?.grades ?? ["전학년"]);
  const [unit, setUnit] = useState(game?.unit ?? "");
  const [playTime, setPlayTime] = useState(game?.playTime ?? "");
  const [date, setDate] = useState(game?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [published, setPublished] = useState(game?.published ?? false);
  const [worksheets, setWorksheets] = useState<WorksheetFile[]>(game?.worksheets ?? []);

  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingSheets, setUploadingSheets] = useState(0);

  const subjectOptions = [...new Set([...SUBJECT_ORDER, ...tags])];
  const gradeOptions = [...new Set([...GRADE_ORDER, ...grades])];
  const uploading = uploadingThumb || uploadingSheets > 0;

  const showError = (e: unknown) =>
    setMessage({ kind: "error", text: e instanceof Error ? e.message : String(e) });

  const onThumbnail = async ([file]: File[]) => {
    setUploadingThumb(true);
    setMessage(null);
    try {
      setThumbnail(await uploadFile("thumbnail", file));
    } catch (e) {
      showError(e);
    } finally {
      setUploadingThumb(false);
    }
  };

  const onWorksheets = async (files: File[]) => {
    setMessage(null);
    setUploadingSheets((n) => n + files.length);
    await Promise.all(
      files.map(async (file) => {
        try {
          const fileUrl = await uploadFile("worksheet", file);
          const name = file.name.replace(/\.[^.]+$/, "");
          setWorksheets((prev) => [...prev, { name, url: fileUrl }]);
        } catch (e) {
          showError(e);
        } finally {
          setUploadingSheets((n) => n - 1);
        }
      }),
    );
  };

  const moveWorksheet = (index: number, delta: number) => {
    setWorksheets((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setCustomTag("");
  };

  const onSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveGame({
        id: game?.id,
        title,
        description,
        thumbnailUrl: thumbnail,
        url,
        tags,
        date,
        published,
        worksheets,
        grades,
        unit,
        playTime,
      });
      if ("error" in result) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "ok", text: "저장했습니다." });
      if (!game) router.replace(`/admin/games/${result.id}`);
      else router.refresh();
    });
  };

  const onDelete = () => {
    if (!game) return;
    if (!confirm(`'${game.title}'을(를) 삭제할까요? 썸네일과 활동지 파일도 함께 지워집니다.`)) return;
    startTransition(async () => {
      const result = await deleteGame(game.id);
      if ("error" in result) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      router.replace("/admin");
    });
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <Field label="제목 *">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>

      <Field label="설명">
        <textarea
          className={`${inputClass} min-h-24`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <Field label="게임 주소" hint="'플레이하기' 버튼이 열 주소입니다.">
        <input
          className={inputClass}
          type="url"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">썸네일</span>
        {thumbnail ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt="썸네일 미리보기"
              className="aspect-[16/10] w-full max-w-xs rounded-lg border border-slate-600 object-cover"
            />
            <div className="flex gap-2 sm:flex-col">
              <FileDrop accept="image/*" busy={uploadingThumb} onFiles={onThumbnail} className="py-2">
                {uploadingThumb ? "올리는 중…" : "다른 이미지로 바꾸기"}
              </FileDrop>
              <button
                type="button"
                onClick={() => setThumbnail(null)}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-400 hover:text-red-300"
              >
                썸네일 빼기
              </button>
            </div>
          </div>
        ) : (
          <FileDrop accept="image/*" busy={uploadingThumb} onFiles={onThumbnail}>
            {uploadingThumb ? "올리는 중…" : "이미지를 끌어다 놓거나 클릭해서 고르세요 (최대 10MB)"}
          </FileDrop>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">과목</span>
        <ChipToggle options={subjectOptions} selected={tags} onChange={setTags} />
        <div className="flex gap-2">
          <input
            className={`${inputClass} max-w-48`}
            placeholder="다른 과목 추가"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-lg border border-slate-600 px-3 text-sm text-slate-300 hover:border-slate-500"
          >
            추가
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">학년</span>
        <ChipToggle options={gradeOptions} selected={grades} onChange={setGrades} />
        <span className="text-xs text-slate-500">아무것도 고르지 않으면 &apos;전학년&apos;으로 표시됩니다.</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="단원">
          <input className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} />
        </Field>
        <Field label="플레이 시간" hint="예: 10분">
          <input className={inputClass} value={playTime} onChange={(e) => setPlayTime(e.target.value)} />
        </Field>
        <Field label="날짜">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">활동지</span>
        {worksheets.length > 0 && (
          <ul className="flex flex-col gap-2">
            {worksheets.map((ws, i) => (
              <li key={ws.url} className="flex items-center gap-2">
                <span aria-hidden>📄</span>
                <input
                  className={inputClass}
                  value={ws.name}
                  aria-label="활동지 이름"
                  onChange={(e) =>
                    setWorksheets((prev) =>
                      prev.map((w, j) => (j === i ? { ...w, name: e.target.value } : w)),
                    )
                  }
                />
                <a
                  href={ws.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-cyan-400 hover:underline"
                >
                  열기
                </a>
                <button type="button" onClick={() => moveWorksheet(i, -1)} className="shrink-0 px-1 text-slate-400 hover:text-slate-100" aria-label="위로">↑</button>
                <button type="button" onClick={() => moveWorksheet(i, 1)} className="shrink-0 px-1 text-slate-400 hover:text-slate-100" aria-label="아래로">↓</button>
                <button
                  type="button"
                  onClick={() => setWorksheets((prev) => prev.filter((_, j) => j !== i))}
                  className="shrink-0 px-1 text-slate-400 hover:text-red-300"
                  aria-label="빼기"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <FileDrop multiple busy={false} onFiles={onWorksheets}>
          {uploadingSheets > 0
            ? `올리는 중… (${uploadingSheets}개 남음)`
            : "활동지 파일을 끌어다 놓거나 클릭해서 고르세요 (여러 개 가능, 파일당 최대 50MB)"}
        </FileDrop>
        <span className="text-xs text-slate-500">사이트에 보이는 버튼 이름은 위 칸에서 고칠 수 있습니다.</span>
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-slate-600 bg-slate-900/40 px-4 py-3">
        <input
          type="checkbox"
          className="h-4 w-4 accent-cyan-500"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        <span className="text-sm text-slate-200">사이트에 공개</span>
      </label>

      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-lg px-4 py-2 text-sm ${
            message.kind === "error"
              ? "border border-red-500/30 bg-red-950/40 text-red-300"
              : "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-700 pt-5">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
        >
          {pending ? "저장 중…" : uploading ? "파일 올리는 중…" : "저장"}
        </button>
        {game?.published && (
          <Link href={`/program/${game.id}`} target="_blank" className="text-sm text-cyan-400 hover:underline">
            사이트에서 보기 ↗
          </Link>
        )}
        {game && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="ml-auto rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-50"
          >
            삭제
          </button>
        )}
      </div>
    </form>
  );
}
