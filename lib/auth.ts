import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  hashPassword,
  newVerificationCode,
  readSession,
  signSession,
  verifyPassword,
} from "./crypto";
import {
  createAdmin,
  createMember,
  getAdminByEmail,
  getAdminById,
  getMemberByEmail,
  getMemberById,
  updateAdmin,
  updateMember,
} from "./repo";
import { hasSupabase } from "./storage";
import type { AdminUser, CountryCode, Locale, Member, MemberStatus, OnboardingStep } from "./types";

const MEMBER_COOKIE = "lna_member";
const ADMIN_COOKIE = "lna_admin";
const SESSION_DAYS = 30;
const ADMIN_SESSION_HOURS = 12;
const CODE_TTL_MS = 30 * 60 * 1000;

export type MemberSession = { memberId: string; exp: number };
export type AdminSession = { adminId: string; exp: number };

export function supabaseConfigured() {
  return hasSupabase();
}

function supabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}
function supabaseAnonKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

/** Server client bound to the Next.js cookie store. Usable in actions/routes. */
export async function createSupabaseServerClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(items) {
        for (const item of items) {
          try {
            store.set(item.name, item.value, item.options);
          } catch {
            /* called from a server component — cookies are read-only there */
          }
        }
      },
    },
  });
}

/* ------------------------------------------------------------------ */
/* Member accounts                                                     */
/* ------------------------------------------------------------------ */

export type SignupResult =
  | { ok: true; demoCode?: string }
  | { ok: false; error: "email_taken" | "server_error"; message?: string };

export async function signUpMember(input: {
  email: string;
  password: string;
  locale: Locale;
  country: CountryCode;
  stateCode: string;
  city: string;
  postalCode: string;
}): Promise<SignupResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await getMemberByEmail(email);
  if (existing) return { ok: false, error: "email_taken" };

  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({ email, password: input.password });
    if (error) {
      if (/registered|exists/i.test(error.message)) return { ok: false, error: "email_taken" };
      return { ok: false, error: "server_error", message: error.message };
    }
    const authId = data.user?.id;
    await createMember({
      id: authId,
      email,
      locale: input.locale,
      country: input.country,
      stateCode: input.stateCode,
      city: input.city,
      postalCode: input.postalCode,
    });
    return { ok: true };
  }

  const code = newVerificationCode();
  await createMember({
    email,
    passwordHash: hashPassword(input.password),
    verificationCode: code,
    verificationSentAt: new Date().toISOString(),
    locale: input.locale,
    country: input.country,
    stateCode: input.stateCode,
    city: input.city,
    postalCode: input.postalCode,
  });
  console.info(`[LibyansNA] Verification code for ${email}: ${code}`);
  return { ok: true, demoCode: code };
}

export type VerificationResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "expired" | "not_found" | "server_error"; message?: string };

export async function verifyMemberCode(email: string, code: string): Promise<VerificationResult> {
  const normalized = email.trim().toLowerCase();

  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ email: normalized, token: code.trim(), type: "signup" });
    if (error) return { ok: false, error: "invalid", message: error.message };
    const member = await getMemberByEmail(normalized);
    if (!member) return { ok: false, error: "not_found" };
    await updateMember(member.id, {
      status: member.status === "suspended" ? "suspended" : "onboarding",
      step: member.step === "verify" ? "personal" : member.step,
      verifiedAt: new Date().toISOString(),
      verificationCode: null,
    });
    await setMemberCookie(member.id);
    return { ok: true };
  }

  const member = await getMemberByEmail(normalized);
  if (!member) return { ok: false, error: "not_found" };
  if (!member.verificationCode) return { ok: false, error: "invalid" };
  const sentAt = member.verificationSentAt ? new Date(member.verificationSentAt).getTime() : 0;
  if (Date.now() - sentAt > CODE_TTL_MS) return { ok: false, error: "expired" };
  if (member.verificationCode !== code.trim()) return { ok: false, error: "invalid" };

  await updateMember(member.id, {
    status: "onboarding",
    step: "personal",
    verifiedAt: new Date().toISOString(),
    verificationCode: null,
  });
  await setMemberCookie(member.id);
  return { ok: true };
}

export async function resendVerificationCode(email: string): Promise<{ ok: boolean; demoCode?: string }> {
  const member = await getMemberByEmail(email);
  if (!member) return { ok: false };

  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: member.email });
    return { ok: !error };
  }

  const code = newVerificationCode();
  await updateMember(member.id, {
    verificationCode: code,
    verificationSentAt: new Date().toISOString(),
  });
  console.info(`[LibyansNA] New verification code for ${member.email}: ${code}`);
  return { ok: true, demoCode: code };
}

export type SignInResult =
  | { ok: true; member: Member }
  | { ok: false; error: "invalid" | "suspended" | "unverified" };

export async function signInMember(email: string, password: string): Promise<SignInResult> {
  const normalized = email.trim().toLowerCase();

  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) return { ok: false, error: "invalid" };
    const member = await getMemberByEmail(normalized);
    if (!member) return { ok: false, error: "invalid" };
    if (member.status === "suspended") return { ok: false, error: "suspended" };
    await updateMember(member.id, { lastLoginAt: new Date().toISOString() });
    await setMemberCookie(member.id);
    return { ok: true, member };
  }

  const member = await getMemberByEmail(normalized);
  if (!member || !verifyPassword(password, member.passwordHash)) return { ok: false, error: "invalid" };
  if (member.status === "suspended") return { ok: false, error: "suspended" };
  if (member.status === "pending_verification") return { ok: false, error: "unverified" };
  await updateMember(member.id, { lastLoginAt: new Date().toISOString() });
  await setMemberCookie(member.id);
  return { ok: true, member };
}

export async function signOutMember() {
  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(MEMBER_COOKIE);
}

async function setMemberCookie(memberId: string) {
  const store = await cookies();
  store.set(
    MEMBER_COOKIE,
    signSession({ memberId, exp: Date.now() + SESSION_DAYS * 86400_000 }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 86400,
    },
  );
}

/** Resolves the signed-in member (verified through Supabase when configured). */
export async function getCurrentMember(): Promise<Member | null> {
  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) {
      return getMemberByEmail(data.user.email);
    }
    return null;
  }
  const store = await cookies();
  const session = readSession<MemberSession>(store.get(MEMBER_COOKIE)?.value);
  if (!session?.memberId) return null;
  return getMemberById(session.memberId);
}

export async function requireMember(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) throw new Error("UNAUTHENTICATED");
  return member;
}

export function statusAfterOnboarding(member: Member): MemberStatus {
  return member.status === "suspended" ? "suspended" : "active";
}

export function nextStepFor(step: OnboardingStep): OnboardingStep {
  const order: OnboardingStep[] = [
    "verify",
    "personal",
    "family",
    "children",
    "professional",
    "general",
    "volunteering",
    "done",
  ];
  const index = order.indexOf(step);
  return order[Math.min(index + 1, order.length - 1)];
}

/* ------------------------------------------------------------------ */
/* Password reset                                                      */
/* ------------------------------------------------------------------ */

export async function requestPasswordReset(
  email: string,
  origin: string,
): Promise<{ ok: true; demoToken?: string } | { ok: false }> {
  const normalized = email.trim().toLowerCase();
  const member = await getMemberByEmail(normalized);
  if (!member) return { ok: true };

  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${origin}/auth/callback?next=/en/reset-password`,
    });
    return { ok: true };
  }

  const token = newVerificationCode() + newVerificationCode().slice(0, 6);
  await updateMember(member.id, {
    verificationCode: `reset:${token}`,
    verificationSentAt: new Date().toISOString(),
  });
  console.info(`[LibyansNA] Password reset link for ${member.email}: ${origin}/en/reset-password?token=${token}`);
  return { ok: true, demoToken: token };
}

export async function completePasswordReset(
  token: string,
  password: string,
  email?: string,
): Promise<{ ok: boolean; error?: "invalid" | "expired" }> {
  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    return { ok: !error, error: error ? "invalid" : undefined };
  }
  const { listMembers } = await import("./repo");
  const everyone = await listMembers();
  const target =
    (email ? everyone.find((m) => m.email === email.trim().toLowerCase()) : null) ??
    everyone.find((m) => m.verificationCode === `reset:${token}`) ??
    null;
  if (!target) return { ok: false, error: "invalid" };
  if (target.verificationCode !== `reset:${token}`) return { ok: false, error: "invalid" };
  const sentAt = target.verificationSentAt ? new Date(target.verificationSentAt).getTime() : 0;
  if (Date.now() - sentAt > CODE_TTL_MS) return { ok: false, error: "expired" };
  await updateMember(target.id, {
    passwordHash: hashPassword(password),
    verificationCode: null,
  });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Administrator accounts (separate console session)                   */
/* ------------------------------------------------------------------ */

async function setAdminCookie(adminId: string) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, signSession({ adminId, exp: Date.now() + ADMIN_SESSION_HOURS * 3600_000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_HOURS * 3600,
  });
}

export async function signInAdmin(email: string, password: string) {
  const admin = await getAdminByEmail(email);
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return { ok: false as const, error: "invalid" as const };
  }
  if (!admin.active) return { ok: false as const, error: "inactive" as const };
  await updateAdmin(admin.id, { lastLoginAt: new Date().toISOString() });
  await setAdminCookie(admin.id);
  return { ok: true as const, admin };
}

export async function signOutAdmin() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const store = await cookies();
  const session = readSession<AdminSession>(store.get(ADMIN_COOKIE)?.value);
  if (!session?.adminId) return null;
  const admin = await getAdminById(session.adminId);
  if (!admin || !admin.active) return null;
  return admin;
}

export async function ensureFirstAdmin() {
  const existing = await getAdminByEmail("admin@libyansna.org");
  if (existing) return existing;
  return createAdmin({
    email: "admin@libyansna.org",
    name: "Site Director",
    passwordHash: hashPassword("Admin12345!"),
    role: "super_admin",
    active: true,
  });
}

/** Only used by the one-time bootstrap route. */
export async function createSupabaseAdminClient() {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
