import Script from "next/script";

/**
 * Cloudflare Web Analytics 로더. 이 컴포넌트 한 곳에서만 관리하며
 * app/layout.tsx에서 한 번만 렌더링한다. 프로덕션 빌드 + 토큰이
 * 설정된 경우에만 로드되어 로컬 개발(next dev)에서는 절대 로드되지 않는다.
 */
export function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

  if (!token || process.env.NODE_ENV !== "production") return null;

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
