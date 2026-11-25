"use client";

import { useSyncExternalStore } from "react";
import { kstDateKey } from "@/lib/season";

const subscribe = (cb: () => void) => {
  const id = window.setInterval(cb, 60_000);
  return () => window.clearInterval(id);
};

/**
 * 한국 날짜 키. 서버가 렌더링한 날짜(serverKey)로 하이드레이션한 뒤
 * 브라우저 시계 기준으로 바로 바꾸고, 자정을 넘기면 다시 그린다.
 * (캐시된 페이지가 어제 날짜로 남아 있어도 어드벤트 창이 제때 열린다)
 */
export function useKstToday(serverKey: string): string {
  return useSyncExternalStore(
    subscribe,
    () => kstDateKey(),
    () => serverKey,
  );
}
