import type { NextRequest } from "next/server";
import { saveIntake } from "@/lib/intake";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!name || !email) {
    return Response.json({ error: "name and email required" }, { status: 400 });
  }

  const result = await saveIntake({
    name,
    email,
    phone: String(body.phone ?? ""),
    sport: String(body.sport ?? ""),
    level: String(body.level ?? ""),
    format: String(body.format ?? ""),
    message: String(body.message ?? ""),
  });

  return Response.json({ ok: true, persisted: result.persisted });
}
