"use server";

import { redirect } from "next/navigation";
import { signOutAdmin, signOutMember } from "@/lib/auth";

export async function memberSignOutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  await signOutMember();
  redirect(`/${locale}`);
}

export async function adminSignOutAction() {
  await signOutAdmin();
  redirect("/admin/login");
}
