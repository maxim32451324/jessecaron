"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await getServerClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const full_name = String(formData.get("full_name") ?? "").trim();
  await supabase.from("profiles").update({ full_name }).eq("id", user.id);
  revalidatePath("/account");
}
