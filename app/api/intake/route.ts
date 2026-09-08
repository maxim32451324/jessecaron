import type { NextRequest } from "next/server";
import { saveIntake } from "@/lib/intake";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, persisted: false, error: "invalid body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!name || !email) {
    return Response.json(
      { ok: false, persisted: false, error: "name and email required" },
      { status: 400 },
    );
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

  // A lead that was not stored is a lost lead — never report success for it.
  if (!result.persisted) {
    return Response.json({ ok: false, persisted: false, error: "not_persisted" }, { status: 500 });
  }

  return Response.json({ ok: true, persisted: true });
}
