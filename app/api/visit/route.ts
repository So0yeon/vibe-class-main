import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

type StatsRow = { today_count: number; total_count: number };

function fallback() {
  return NextResponse.json({ today: 0, total: 0 });
}

export async function GET() {
  const supabase = getSupabaseClient({ revalidateSeconds: 0 });
  if (!supabase) return fallback();

  const { data, error } = await supabase.rpc("get_site_visitor_stats");
  if (error || !data?.[0]) return fallback();

  const row = data[0] as StatsRow;
  return NextResponse.json({ today: row.today_count, total: row.total_count });
}

export async function POST() {
  const supabase = getSupabaseClient({ revalidateSeconds: 0 });
  if (!supabase) return fallback();

  const { data, error } = await supabase.rpc("record_site_visit");
  if (error || !data?.[0]) return fallback();

  const row = data[0] as StatsRow;
  return NextResponse.json({ today: row.today_count, total: row.total_count });
}
