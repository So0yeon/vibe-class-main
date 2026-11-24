/**
 * 관리자 세션 쿠키 서명/검증. Web Crypto만 사용하므로 proxy.ts와 서버 코드
 * 양쪽에서 같은 코드를 쓴다.
 *
 * 쿠키 값: `${만료시각(ms)}.${HMAC-SHA256(만료시각) base64url}`
 * 서명 키는 ADMIN_SESSION_SECRET. 비밀값을 바꾸면 기존 로그인은 모두 풀린다.
 */

export const ADMIN_COOKIE = "vc_admin";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7일

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET이 설정되지 않았거나 너무 짧습니다 (32자 이상).",
    );
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

/** 길이가 달라도 비교 시간이 내용에 따라 달라지지 않도록 해시 후 비교 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

export async function createSessionValue(): Promise<string> {
  const expires = String(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  return `${expires}.${await hmac(expires)}`;
}

export async function verifySessionValue(
  value: string | undefined,
): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;

  const expires = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  try {
    return await safeEqual(signature, await hmac(expires));
  } catch {
    return false;
  }
}
