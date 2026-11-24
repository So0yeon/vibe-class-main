import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionValue } from "@/lib/admin/session";

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(ADMIN_COOKIE)?.value);
}

/**
 * 관리자 페이지와 모든 관리자 Server Action 첫 줄에서 호출한다.
 * proxy.ts가 /admin 페이지를 막지만, Server Action은 어느 경로로든 POST될 수
 * 있으므로 여기서 다시 확인해야 한다.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
