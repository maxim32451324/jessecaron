import { NextResponse, type NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(`${request.nextUrl.origin}/`, { status: 303 });
}
