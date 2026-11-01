import { NextResponse } from "next/server";
import { createSupabaseServerClient, supabaseConfigured } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/en/reset-password";

  if (code && supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/en", url.origin));
}
