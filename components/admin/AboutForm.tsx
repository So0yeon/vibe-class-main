"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveAbout } from "@/lib/actions/admin";
import type { AboutContent } from "@/lib/about";
import { FileDrop } from "@/components/admin/FileDrop";
import { uploadFile } from "@/components/admin/upload";

const inputClass =
  "w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none";

function ImageField({
  label,
  hint,
  value,
  onChange,
  onError,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onError: (e: unknown) => void;
}) {
  const [busy, setBusy] = useState(false);

  const onFiles = async ([file]: File[]) => {
    setBusy(true);
    try {
      onChange(await uploadFile("about", file));
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={`${label} 미리보기`} className="max-h-48 w-fit rounded-lg border border-slate-600 object-contain" />
      )}
      <div className="flex gap-2">
        <FileDrop accept="image/*" busy={busy} onFiles={onFiles} className="flex-1 py-3">
          {busy ? "올리는 중…" : value ? "다른 이미지로 바꾸기" : "이미지를 끌어다 놓거나 클릭해서 고르세요"}
        </FileDrop>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-lg border border-slate-600 px-3 text-sm text-slate-400 hover:text-red-300"
          >
            빼기
          </button>
        )}
      </div>
      <span className="text-xs text-slate-500">{hint}</span>
    </div>
  );
}

export function AboutForm({ about }: { about: AboutContent }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const [title, setTitle] = useState(about.title);
  const [body, setBody] = useState(about.paragraphs.join("\n\n"));
  const [banner, setBanner] = useState<string | null>(
    about.bannerImage === "/og-image.png" ? null : about.bannerImage,
  );
  const [profile, setProfile] = useState<string | null>(about.profileImage);

  const onError = (e: unknown) =>
    setMessage({ kind: "error", text: e instanceof Error ? e.message : String(e) });

  const onSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveAbout({
        title,
        paragraphs: body.split(/\n\s*\n/),
        bannerImage: banner,
        profileImage: profile,
      });
      if ("error" in result) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setMessage({ kind: "ok", text: "저장했습니다." });
      router.refresh();
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
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">제목</span>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-300">내용</span>
        <textarea className={`${inputClass} min-h-48`} value={body} onChange={(e) => setBody(e.target.value)} />
        <span className="text-xs text-slate-500">빈 줄로 문단을 나눕니다.</span>
      </label>

      <ImageField
        label="배너 이미지"
        hint="비워 두면 사이트 기본 배너가 쓰입니다."
        value={banner}
        onChange={setBanner}
        onError={onError}
      />
      <ImageField
        label="프로필 이미지"
        hint="선택 사항입니다."
        value={profile}
        onChange={setProfile}
        onError={onError}
      />

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

      <div className="border-t border-slate-700 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
