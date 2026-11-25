"use client";

/**
 * 서로 멀리 떨어진 클라이언트 컴포넌트끼리 주고받는 가벼운 이벤트.
 * (예: 어디서든 토스트 띄우기, 내비게이션의 빠른 검색 열기)
 */

export type ToastDetail = { message: string; tone?: "default" | "gold" };

const TOAST = "vc:toast";
const OPEN_PALETTE = "vc:open-palette";

export function toast(message: string, tone: ToastDetail["tone"] = "default") {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST, { detail: { message, tone } }),
  );
}

export function onToast(handler: (detail: ToastDetail) => void) {
  const listener = (e: Event) =>
    handler((e as CustomEvent<ToastDetail>).detail);
  window.addEventListener(TOAST, listener);
  return () => window.removeEventListener(TOAST, listener);
}

export function openPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE));
}

export function onOpenPalette(handler: () => void) {
  window.addEventListener(OPEN_PALETTE, handler);
  return () => window.removeEventListener(OPEN_PALETTE, handler);
}
