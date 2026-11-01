"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createInboxMessage,
  listChildren,
  listVolunteerQuestions,
  replaceChildren,
  updateMember,
} from "@/lib/repo";
import {
  completePasswordReset,
  getCurrentMember,
  requestPasswordReset,
  resendVerificationCode,
  signInMember,
  signOutMember,
  signUpMember,
  verifyMemberCode,
} from "@/lib/auth";
import type { CountryCode, Locale, Member, OnboardingStep } from "@/lib/types";
import { citiesFor } from "@/lib/geo";

const EMAIL_ONLY = /^[A-Za-z][A-Za-z' -]*$/;

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function bool(form: FormData, key: string): boolean {
  return form.get(key) === "true" || form.get(key) === "on" || form.get(key) === "yes";
}

function localeFrom(form: FormData): Locale {
  return form.get("locale") === "ar" ? "ar" : "en";
}

function joinUrl(locale: Locale, query: string) {
  return `/${locale}/join${query ? `?${query}` : ""}`;
}

async function requireOnboardingMember(locale: Locale): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) redirect(`/${locale}/login?next=/${locale}/join`);
  if (member.status === "active" && member.step === "done") redirect(`/${locale}/members`);
  return member;
}

/* -------------------------------- account -------------------------------- */

export async function signupAction(form: FormData) {
  const locale = localeFrom(form);
  const email = str(form, "email").toLowerCase();
  const password = str(form, "password");
  const confirm = str(form, "confirmPassword");
  const pledge = bool(form, "pledge");
  const country = str(form, "country") as CountryCode;
  const stateCode = str(form, "stateCode");
  const city = str(form, "city");
  const postalCode = str(form, "postalCode");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(joinUrl(locale, "error=email_invalid"));
  if (password.length < 8) redirect(joinUrl(locale, "error=password_short"));
  if (password !== confirm) redirect(joinUrl(locale, "error=password_mismatch"));
  if (!pledge) redirect(joinUrl(locale, "error=pledge_required"));
  if (!country || !stateCode || !city) redirect(joinUrl(locale, "error=location_required"));

  const result = await signUpMember({
    email,
    password,
    locale,
    country,
    stateCode,
    city,
    postalCode: postalCode || citiesFor(country, stateCode).find((c) => c.name === city)?.zip || "",
  });

  if (!result.ok) redirect(joinUrl(locale, `error=${result.error}`));

  const store = await cookies();
  store.set("lna_pending_email", email, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 3600 });
  if (result.demoCode) {
    store.set("lna_dev_code", result.demoCode, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 900 });
  }
  redirect(joinUrl(locale, "verify=1"));
}

export async function verifyAction(form: FormData) {
  const locale = localeFrom(form);
  const store = await cookies();
  const email = str(form, "email") || store.get("lna_pending_email")?.value || "";
  const code = str(form, "code");
  if (!email) redirect(`/${locale}/join`);

  const result = await verifyMemberCode(email, code);
  if (!result.ok) {
    redirect(joinUrl(locale, `verify=1&error=${result.error}`));
  }
  store.delete("lna_pending_email");
  store.delete("lna_dev_code");
  redirect(joinUrl(locale, ""));
}

export async function resendCodeAction(form: FormData) {
  const locale = localeFrom(form);
  const store = await cookies();
  const email = str(form, "email") || store.get("lna_pending_email")?.value || "";
  const result = await resendVerificationCode(email);
  if (result.demoCode) {
    store.set("lna_dev_code", result.demoCode, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 900 });
  }
  redirect(joinUrl(locale, "verify=1&resent=1"));
}

/* -------------------------------- personal ------------------------------- */

export async function personalAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await requireOnboardingMember(locale);

  const firstName = str(form, "firstName");
  const fatherName = str(form, "fatherName");
  const lastName = str(form, "lastName");
  const address = str(form, "address");
  const birthDate = str(form, "birthDate");
  const phone = str(form, "phone");

  if (!firstName || !fatherName || !lastName) redirect(joinUrl(locale, "error=names_required"));
  if (![firstName, fatherName, lastName].every((name) => EMAIL_ONLY.test(name))) {
    redirect(joinUrl(locale, "error=english_only"));
  }
  if (!address || !birthDate || !phone) redirect(joinUrl(locale, "error=personal_required"));

  await updateMember(member.id, {
    firstName,
    fatherName,
    lastName,
    address,
    birthDate,
    phone,
    step: "family",
  });
  redirect(joinUrl(locale, ""));
}

/* --------------------------------- family -------------------------------- */

export async function familyAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await requireOnboardingMember(locale);

  const maritalStatus = str(form, "maritalStatus") as Member["maritalStatus"];
  if (!maritalStatus) redirect(joinUrl(locale, "error=marital_required"));

  let householdSize = 1;
  let sonsCount = 0;
  let daughtersCount = 0;
  let hasDependents = false;
  let spouseName: string | null = null;

  if (maritalStatus === "married") {
    spouseName = str(form, "spouseName") || null;
    householdSize = Math.max(2, Number(str(form, "householdSize")) || 2);
    hasDependents = householdSize > 2;
    if (householdSize > 2) {
      sonsCount = Math.max(0, Number(str(form, "sonsCount")) || 0);
      daughtersCount = Math.max(0, Number(str(form, "daughtersCount")) || 0);
      const missing = householdSize - 2 - sonsCount - daughtersCount;
      if (missing !== 0) redirect(joinUrl(locale, "error=children_count"));
    }
  } else if (maritalStatus === "widowed" || maritalStatus === "divorced") {
    hasDependents = bool(form, "hasDependents");
    if (hasDependents) {
      householdSize = Math.max(2, Number(str(form, "householdSize")) || 2);
      if (householdSize === 2) {
        const gender = str(form, "singleChildGender");
        if (gender === "male") sonsCount = 1;
        else if (gender === "female") daughtersCount = 1;
        else redirect(joinUrl(locale, "error=child_gender"));
      } else {
        sonsCount = Math.max(0, Number(str(form, "sonsCount")) || 0);
        daughtersCount = Math.max(0, Number(str(form, "daughtersCount")) || 0);
        const missing = householdSize - 1 - sonsCount - daughtersCount;
        if (missing !== 0) redirect(joinUrl(locale, "error=children_count"));
      }
    }
  }

  const totalChildren = sonsCount + daughtersCount;
  await updateMember(member.id, {
    maritalStatus,
    spouseName,
    householdSize,
    hasDependents,
    sonsCount,
    daughtersCount,
    step: totalChildren > 0 ? "children" : "professional",
  });

  if (totalChildren > 0) {
    // Drop stale child rows if the household was edited.
    const existing = await listChildren(member.id);
    if (existing.length > totalChildren) {
      await replaceChildren(
        member.id,
        existing.slice(0, totalChildren).map((child) => ({
          name: child.name,
          gender: child.gender,
          birthDate: child.birthDate,
          education: child.education,
          activities: child.activities,
          position: child.position,
        })),
      );
    }
    redirect(joinUrl(locale, "child=0"));
  }
  redirect(joinUrl(locale, ""));
}

/* -------------------------------- children ------------------------------- */

export async function childAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await requireOnboardingMember(locale);
  const index = Number(str(form, "index")) || 0;
  const name = str(form, "name");
  const birthDate = str(form, "birthDate");
  const education = str(form, "education");
  const activities = str(form, "activities");

  if (!name || !birthDate) redirect(joinUrl(locale, `child=${index}&error=child_required`));

  const total = member.sonsCount + member.daughtersCount;
  const gender = index < member.sonsCount ? "male" : "female";
  const position = gender === "male" ? index + 1 : index - member.sonsCount + 1;

  const existing = await listChildren(member.id);
  const match = existing.find((child) => child.gender === gender && child.position === position);

  const rows = existing.map((child) => ({
    name: child.name,
    gender: child.gender,
    birthDate: child.birthDate,
    education: child.education,
    activities: child.activities,
    position: child.position,
  }));

  const entry = {
    name,
    gender: gender as "male" | "female",
    birthDate,
    education: education || null,
    activities: activities || null,
    position,
  };

  if (match) {
    const at = rows.findIndex((row) => row.gender === gender && row.position === position);
    rows[at] = entry;
  } else {
    rows.push(entry);
  }

  await replaceChildren(member.id, rows);

  if (index + 1 < total) redirect(joinUrl(locale, `child=${index + 1}`));
  await updateMember(member.id, { step: "professional" });
  redirect(joinUrl(locale, ""));
}

/* ------------------------------- professional ---------------------------- */

export async function professionalAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await requireOnboardingMember(locale);
  const educationLevel = str(form, "educationLevel") || null;
  const currentJob = str(form, "currentJob");
  if (!currentJob) redirect(joinUrl(locale, "error=job_required"));
  await updateMember(member.id, { educationLevel, currentJob, step: "general" });
  redirect(joinUrl(locale, ""));
}

/* --------------------------------- general -------------------------------- */

export async function generalAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await requireOnboardingMember(locale);
  await updateMember(member.id, {
    hasCar: bool(form, "hasCar"),
    incomeSufficient: bool(form, "incomeSufficient"),
    hardshipNotes: str(form, "hardshipNotes") || null,
    step: "volunteering",
  });
  redirect(joinUrl(locale, ""));
}

/* ------------------------------- volunteering ---------------------------- */

export async function volunteeringAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await requireOnboardingMember(locale);
  const questions = await listVolunteerQuestions();
  const answers: Record<string, string> = {};

  for (const question of questions) {
    const value = str(form, `q_${question.key}`);
    if (!value) redirect(joinUrl(locale, "error=volunteer_required"));
    answers[question.key] = value;
  }

  await updateMember(member.id, {
    volunteerAnswers: answers,
    step: "done" as OnboardingStep,
    status: "active",
  });

  await createInboxMessage({
    memberId: member.id,
    kind: "announcement",
    subjectEn: "Your family record is complete",
    subjectAr: "بيانات عائلتك مكتملة",
    bodyEn:
      "Thank you for completing your family profile. You can now see the members' directory, the suggestion box, and your state's community fund.",
    bodyAr:
      "شكراً لإكمال ملف عائلتك. يمكنك الآن رؤية دليل المشتركين وصندوق المقترحات وصندوق الجالية في ولايتك.",
  });

  await signOutMember();
  redirect(`/${locale}/login?completed=1`);
}

/* ---------------------------------- back --------------------------------- */

export async function backAction(form: FormData) {
  const locale = localeFrom(form);
  const member = await requireOnboardingMember(locale);
  const target = str(form, "to") as OnboardingStep;
  const allowed: OnboardingStep[] = ["personal", "family", "children", "professional", "general", "volunteering"];
  if (!allowed.includes(target)) redirect(joinUrl(locale, ""));
  await updateMember(member.id, { step: target });
  redirect(
    joinUrl(
      locale,
      target === "children" ? `child=${Math.max(0, member.sonsCount + member.daughtersCount - 1)}` : "",
    ),
  );
}

/* --------------------------------- login --------------------------------- */

export async function loginAction(form: FormData) {
  const locale = localeFrom(form);
  const email = str(form, "email");
  const password = str(form, "password");
  const next = str(form, "next") || `/${locale}/members`;
  const result = await signInMember(email, password);

  if (!result.ok) redirect(`/${locale}/login?error=${result.error}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  if (result.member.status === "onboarding" || result.member.step !== "done") {
    redirect(`/${locale}/join`);
  }
  redirect(next.startsWith("/") ? next : `/${locale}/members`);
}

export async function forgotPasswordAction(form: FormData) {
  const locale = localeFrom(form);
  const email = str(form, "email");
  const origin = str(form, "origin") || "http://localhost:3000";
  const result = await requestPasswordReset(email, origin);
  if (result.ok && result.demoToken) {
    redirect(`/${locale}/forgot-password?sent=1&demo=${encodeURIComponent(result.demoToken)}`);
  }
  redirect(`/${locale}/forgot-password?sent=1`);
}

export async function resetPasswordAction(form: FormData) {
  const locale = localeFrom(form);
  const token = str(form, "token");
  const email = str(form, "email") || undefined;
  const password = str(form, "password");
  if (password.length < 8) redirect(`/${locale}/reset-password?token=${token}&error=short`);
  const result = await completePasswordReset(token, password, email);
  if (!result.ok) redirect(`/${locale}/reset-password?token=${token}&error=${result.error ?? "invalid"}`);
  redirect(`/${locale}/login?reset=1`);
}
