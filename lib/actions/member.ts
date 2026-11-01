"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createComment,
  createProposal,
  getProposal,
  markInboxRead,
  updateMember,
} from "@/lib/repo";
import { getCurrentMember } from "@/lib/auth";
import type { Locale } from "@/lib/types";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function localeFrom(form: FormData): Locale {
  return form.get("locale") === "ar" ? "ar" : "en";
}

async function memberOrRedirect(locale: Locale) {
  const member = await getCurrentMember();
  if (!member) redirect(`/${locale}/login?next=/${locale}/members`);
  return member;
}

export async function createProposalAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await memberOrRedirect(locale);
  const title = str(form, "title");
  const body = str(form, "body");
  if (title.length < 5 || body.length < 20) {
    redirect(`/${locale}/members/proposals?error=short`);
  }
  const proposal = await createProposal({ member, title, body });
  revalidatePath(`/${locale}/members/proposals`);
  redirect(`/${locale}/members/proposals/${proposal.id}`);
}

export async function createCommentAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await memberOrRedirect(locale);
  const proposalId = str(form, "proposalId");
  const body = str(form, "body");
  const proposal = await getProposal(proposalId);
  if (!proposal || proposal.status !== "open") redirect(`/${locale}/members/proposals`);
  if (body.length < 2) redirect(`/${locale}/members/proposals/${proposalId}?error=short`);
  await createComment({ proposalId, member, body });
  revalidatePath(`/${locale}/members/proposals/${proposalId}`);
  redirect(`/${locale}/members/proposals/${proposalId}#responses`);
}

export async function markInboxReadAction(form: FormData) {
  const locale = localeFrom(form);
  await memberOrRedirect(locale);
  const id = str(form, "id");
  if (id) await markInboxRead(id);
  revalidatePath(`/${locale}/members/inbox`);
  redirect(`/${locale}/members/inbox`);
}

export async function updateProfileAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await memberOrRedirect(locale);
  await updateMember(member.id, {
    firstName: str(form, "firstName") || member.firstName,
    fatherName: str(form, "fatherName") || member.fatherName,
    lastName: str(form, "lastName") || member.lastName,
    address: str(form, "address") || null,
    phone: str(form, "phone") || null,
    currentJob: str(form, "currentJob") || null,
    educationLevel: str(form, "educationLevel") || null,
    hardshipNotes: str(form, "hardshipNotes") || null,
  });
  revalidatePath(`/${locale}/members/profile`);
  redirect(`/${locale}/members/profile?saved=1`);
}
