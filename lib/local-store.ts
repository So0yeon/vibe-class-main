"use client";

/**
 * localStorage에 저장하는 작은 클라이언트 상태 (찜, 최근 본 자료, 눈 효과 등).
 * useSyncExternalStore로 읽어서 SSR에서는 기본값, 하이드레이션 이후 실제 값을 쓴다.
 * 다른 탭에서 바뀐 값도 storage 이벤트로 따라간다.
 */

import { useMemo, useSyncExternalStore } from "react";

function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 사생활 보호 모드 등 저장할 수 없는 환경 - 조용히 무시
  }
}

function createRawStore(key: string) {
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  return {
    subscribe,
    read: () => safeRead(key),
    write: (value: string) => {
      safeWrite(key, value);
      listeners.forEach((l) => l());
    },
  };
}

const serverNull = () => null;

/** 문자열 id 목록 저장소 */
export function createIdListStore(key: string, maxItems = 200) {
  const raw = createRawStore(key);

  const parse = (value: string | null): string[] => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((v) => typeof v === "string")
        : [];
    } catch {
      return [];
    }
  };

  const get = () => parse(raw.read());
  const set = (ids: string[]) =>
    raw.write(JSON.stringify(ids.slice(0, maxItems)));

  function useIds(): string[] {
    const value = useSyncExternalStore(raw.subscribe, raw.read, serverNull);
    return useMemo(() => parse(value), [value]);
  }

  return {
    useIds,
    get,
    has: (id: string) => get().includes(id),
    /** 있으면 빼고 없으면 맨 앞에 넣는다. 넣었으면 true */
    toggle(id: string): boolean {
      const ids = get();
      if (ids.includes(id)) {
        set(ids.filter((v) => v !== id));
        return false;
      }
      set([id, ...ids]);
      return true;
    },
    /** 맨 앞으로 옮기거나 추가한다 (최근 본 목록용) */
    touch(id: string) {
      set([id, ...get().filter((v) => v !== id)]);
    },
    add(id: string) {
      const ids = get();
      if (!ids.includes(id)) set([...ids, id]);
    },
    clear: () => set([]),
  };
}

/** on/off 설정 저장소. 저장값이 없으면 getDefault()를 쓴다 */
export function createFlagStore(key: string, getDefault: () => boolean) {
  const raw = createRawStore(key);
  const read = () => {
    const value = raw.read();
    if (value === "1") return true;
    if (value === "0") return false;
    return getDefault();
  };

  function useFlag(serverValue = false): boolean {
    return useSyncExternalStore(raw.subscribe, read, () => serverValue);
  }

  return {
    useFlag,
    get: read,
    set: (on: boolean) => raw.write(on ? "1" : "0"),
  };
}

export const favoritesStore = createIdListStore("vibeclass:favorites");
export const recentStore = createIdListStore("vibeclass:recent", 12);
export const openedDoorsStore = createIdListStore(
  "vibeclass:advent-opened",
  60,
);

const prefersReducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export const snowStore = createFlagStore(
  "vibeclass:snow",
  () => !prefersReducedMotion(),
);

/** 작은 JSON 값 저장소 (바이비 키우기 상태, 게임 최고 점수 등) */
export function createJsonStore<T>(key: string, fallback: T) {
  const raw = createRawStore(key);

  const parse = (value: string | null): T => {
    if (!value) return fallback;
    try {
      return { ...fallback, ...JSON.parse(value) };
    } catch {
      return fallback;
    }
  };

  const get = () => parse(raw.read());

  function useValue(): T {
    const value = useSyncExternalStore(raw.subscribe, raw.read, serverNull);
    return useMemo(() => parse(value), [value]);
  }

  return {
    useValue,
    get,
    set: (value: T) => raw.write(JSON.stringify(value)),
    update: (fn: (prev: T) => T) => raw.write(JSON.stringify(fn(get()))),
  };
}
