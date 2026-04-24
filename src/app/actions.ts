"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function requireOwnProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");
  return { supabase, user, profile };
}

// ---- Form actions (must return void) ----

export async function createOwnProfile(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) throw new Error("Ange ett namn");

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/");

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    display_name: displayName,
    is_fake: false,
  });
  if (error) throw new Error(error.message);

  redirect("/");
}

export async function createFakeProfile(formData: FormData): Promise<void> {
  const { supabase, profile } = await requireOwnProfile();
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) throw new Error("Ange ett namn");

  const { error } = await supabase.from("profiles").insert({
    display_name: displayName,
    is_fake: true,
    managed_by: profile.id,
  });
  if (error) throw new Error(error.message);

  refresh();
}

export async function deleteFakeProfile(formData: FormData): Promise<void> {
  const { supabase, profile } = await requireOwnProfile();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Saknar ID");

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
    .eq("managed_by", profile.id);
  if (error) throw new Error(error.message);

  refresh();
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---- Async actions with return value (called via onClick/useTransition) ----

type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerFind(
  profileId: string,
): Promise<ActionResult> {
  const { supabase, profile } = await requireOwnProfile();

  if (profileId !== profile.id) {
    const { data: managed } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .eq("managed_by", profile.id)
      .maybeSingle();
    if (!managed) return { ok: false, error: "Du äger inte den profilen" };
  }

  const { data: last } = await supabase
    .from("finds")
    .select("plate_number")
    .eq("profile_id", profileId)
    .order("plate_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const next = (last?.plate_number ?? 0) + 1;

  const { error } = await supabase.from("finds").insert({
    profile_id: profileId,
    plate_number: next,
  });
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true };
}

export async function undoLastFind(
  profileId: string,
): Promise<ActionResult> {
  const { supabase, profile } = await requireOwnProfile();

  if (profileId !== profile.id) {
    const { data: managed } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .eq("managed_by", profile.id)
      .maybeSingle();
    if (!managed) return { ok: false, error: "Du äger inte den profilen" };
  }

  const { data: last } = await supabase
    .from("finds")
    .select("id")
    .eq("profile_id", profileId)
    .order("plate_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!last) return { ok: false, error: "Inget att ångra" };

  const { error } = await supabase.from("finds").delete().eq("id", last.id);
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true };
}
