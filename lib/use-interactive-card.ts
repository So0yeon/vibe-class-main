"use client";

import { useCallback, useRef, type PointerEvent } from "react";

/**
 * 카드에 커서 스포트라이트(.spotlight)와 은은한 3D 기울기(.tilt)를 준다.
 * 마우스 같은 정밀 포인터에서만 기울이고, 터치에서는 스포트라이트만 남긴다.
 * 리렌더 없이 CSS 변수만 갱신한다.
 */
export function useInteractiveCard<T extends HTMLElement>(maxTilt = 5) {
  const ref = useRef<T>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent<T>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      if (e.pointerType === "mouse") {
        el.style.setProperty("--ry", `${(px - 0.5) * maxTilt * 2}deg`);
        el.style.setProperty("--rx", `${(0.5 - py) * maxTilt * 2}deg`);
        el.style.setProperty("--lift", "-6px");
      }
    },
    [maxTilt],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--lift", "0px");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
