"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createAdmin,
  createCommitteeMember,
  createEvent,
  createFundReport,
  createPost,
  createVolunteerQuestion,
  deletePost,
  getAdminByEmail,
  getEvent,
  getPostById,
  getSettings,
  listProposals,
  recordAudit,
  saveSettings,
  sendFundReportToState,
  updateAdmin,
  updateEvent,
  updateMember,
  updatePost,
  updateProposal,
  listComments,
} from "@/lib/repo";
import { getCurrentAdmin, signInAdmin, signOutAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { canWrite, type AdminSection } from "@/lib/rbac";
import type { AdminRole, CountryCode, PostKind, SiteSettings } from "@/lib/types";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function num(form: FormData, key: string, fallback = 0) {
  const value = Number(str(form, key));
  return Number.isFinite(value) ? value : fallback;
}
function bool(form: FormData, key: string) {
  return form.get(key) === "on" || form.get(key) === "true";
}

async function guard(section: AdminSection, write = true) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (write && !canWrite(admin.role, section)) redirect(`/admin?denied=${section}`);
  return admin;
}

async function audit(
  admin: { id: string; name: string; role: AdminRole },
  action: "create" | "update" | "delete" | "publish" | "login" | "payout",
  entity: string,
  entityId: string,
  summary: string,
  meta?: Record<string, unknown>,
) {
  await recordAudit({
    actorId: admin.id,
    actorName: admin.name,
    actorRole: admin.role,
    action,
    entity,
    entityId,
    summary,
    meta: meta ?? null,
  });
}

/* -------------------------------- login ---------------------------------- */

export async function adminLoginAction(form: FormData) {
  const email = str(form, "email");
  const password = str(form, "password");
  const result = await signInAdmin(email, password);
  if (!result.ok) redirect(`/admin/login?error=${result.error}`);
  await audit(result.admin, "login", "admin", result.admin.id, "Signed in to the console");
  redirect("/admin");
}

export async function adminSignOut() {
  await signOutAdmin();
  redirect("/admin/login");
}

/* ------------------------------ appearance -------------------------------- */

const COLOR_KEYS = ["accentColor", "accentDarkColor", "inkColor", "canvasColor", "mutedColor"] as const;

export async function saveAppearanceAction(form: FormData) {
  const admin = await guard("appearance");
  const current = await getSettings();

  const patch: Partial<SiteSettings> = {
    titleEn: str(form, "titleEn") || current.titleEn,
    titleAr: str(form, "titleAr") || current.titleAr,
    taglineEn: str(form, "taglineEn"),
    taglineAr: str(form, "taglineAr"),
    heroImage: str(form, "heroImage") || current.heroImage,
    heroBadgeEn: str(form, "heroBadgeEn"),
    heroBadgeAr: str(form, "heroBadgeAr"),
    heroTitleEn: str(form, "heroTitleEn"),
    heroTitleAr: str(form, "heroTitleAr"),
    heroSubtitleEn: str(form, "heroSubtitleEn"),
    heroSubtitleAr: str(form, "heroSubtitleAr"),
    headingFontEn: str(form, "headingFontEn") || current.headingFontEn,
    headingFontAr: str(form, "headingFontAr") || current.headingFontAr,
    bodyFontEn: str(form, "bodyFontEn") || current.bodyFontEn,
    bodyFontAr: str(form, "bodyFontAr") || current.bodyFontAr,
    headingSize: num(form, "headingSize", current.headingSize),
    bodySize: num(form, "bodySize", current.bodySize),
    cardRadius: num(form, "cardRadius", current.cardRadius),
    buttonRadius: num(form, "buttonRadius", current.buttonRadius),
    inputRadius: num(form, "inputRadius", current.inputRadius),
    footerAboutEn: str(form, "footerAboutEn"),
    footerAboutAr: str(form, "footerAboutAr"),
    contactEmail: str(form, "contactEmail"),
    adminEmail: str(form, "adminEmail"),
    phones: str(form, "phones")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    facebookUrl: str(form, "facebookUrl"),
    xUrl: str(form, "xUrl"),
    tiktokUrl: str(form, "tiktokUrl"),
    instagramUrl: str(form, "instagramUrl"),
    youtubeUrl: str(form, "youtubeUrl"),
    membershipCtaEn: str(form, "membershipCtaEn"),
    membershipCtaAr: str(form, "membershipCtaAr"),
    monthlyCapCents: Math.max(100, num(form, "monthlyCapCents", current.monthlyCapCents)),
    tickerEnabled: bool(form, "tickerEnabled"),
  };

  for (const key of COLOR_KEYS) {
    const value = str(form, key);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) patch[key] = value;
  }

  if (admin.role === "super_admin") {
    patch.stripeAccountHolder = str(form, "stripeAccountHolder");
    patch.stripeAccountNumber = str(form, "stripeAccountNumber");
    patch.stripeRoutingNumber = str(form, "stripeRoutingNumber");
  }

  await saveSettings(patch, admin);
  await audit(admin, "update", "settings", "site", "Updated public appearance settings");
  revalidatePath("/", "layout");
  redirect("/admin/appearance?saved=1");
}

/* --------------------------------- content -------------------------------- */

const KINDS: PostKind[] = ["news", "guide", "jobs", "success", "idea"];

function postFields(form: FormData) {
  const kind = str(form, "kind") as PostKind;
  const country = str(form, "country") as CountryCode | "";
  return {
    titleEn: str(form, "titleEn"),
    titleAr: str(form, "titleAr"),
    excerptEn: str(form, "excerptEn"),
    excerptAr: str(form, "excerptAr"),
    bodyEn: str(form, "bodyEn"),
    bodyAr: str(form, "bodyAr"),
    coverImage: str(form, "coverImage") || null,
    kind: KINDS.includes(kind) ? kind : ("news" as PostKind),
    country: country === "US" || country === "CA" ? country : null,
    stateCode: str(form, "stateCode") || null,
    city: str(form, "city") || null,
    authorName: str(form, "authorName") || "Community Desk",
    featured: bool(form, "featured"),
  };
}

export async function savePostAction(form: FormData) {
  const admin = await guard("content");
  const id = str(form, "id");
  const publish = bool(form, "publish");
  const fields = postFields(form);
  if (!fields.titleEn || !fields.titleAr) redirect("/admin/content?error=required");

  if (id) {
    const existing = await getPostById(id);
    if (!existing) redirect("/admin/content");
    await updatePost(id, {
      ...fields,
      status: publish ? "published" : "draft",
      publishedAt: publish ? existing.publishedAt ?? new Date().toISOString() : null,
    });
    await audit(admin, publish ? "publish" : "update", "post", id, `${publish ? "Published" : "Saved draft"}: ${fields.titleEn}`);
    revalidatePath("/", "layout");
    redirect(`/admin/content/${id}?saved=1`);
  }

  const post = await createPost({ ...fields, status: publish ? "published" : "draft" });
  await audit(admin, publish ? "publish" : "create", "post", post.id, `Created story: ${fields.titleEn}`);
  revalidatePath("/", "layout");
  redirect(`/admin/content/${post.id}?saved=1`);
}

export async function deletePostAction(form: FormData) {
  const admin = await guard("content");
  const id = str(form, "id");
  const post = id ? await getPostById(id) : null;
  if (post) {
    await deletePost(id);
    await audit(admin, "delete", "post", id, `Deleted story: ${post.titleEn}`, { title: post.titleEn });
  }
  revalidatePath("/", "layout");
  redirect("/admin/content?deleted=1");
}

/* --------------------------------- events --------------------------------- */

export async function createEventAction(form: FormData) {
  const admin = await guard("events");
  const titleEn = str(form, "titleEn");
  const titleAr = str(form, "titleAr");
  if (!titleEn || !titleAr) redirect("/admin/events?error=required");

  const announceDays = Math.max(1, num(form, "announceDays", 7));
  const tickerDays = Math.max(1, num(form, "tickerDays", 14));
  const now = Date.now();

  const event = await createEvent({
    titleEn,
    titleAr,
    bodyEn: str(form, "bodyEn"),
    bodyAr: str(form, "bodyAr"),
    imageUrl: str(form, "imageUrl") || null,
    announceUntil: new Date(now + announceDays * 86_400_000).toISOString(),
    tickerEnabled: bool(form, "tickerEnabled"),
    tickerTextEn: str(form, "tickerTextEn") || titleEn,
    tickerTextAr: str(form, "tickerTextAr") || titleAr,
    tickerBgColor: str(form, "tickerBgColor") || "#0b4f6c",
    tickerTextColor: str(form, "tickerTextColor") || "#ffffff",
    tickerUntil: new Date(now + tickerDays * 86_400_000).toISOString(),
    createdBy: admin.name,
  });

  await audit(admin, "create", "event", event.id, `Created event: ${titleEn}`, {
    announceDays,
    tickerDays,
  });
  revalidatePath("/", "layout");
  redirect("/admin/events?saved=1");
}

export async function deleteEventAction(form: FormData) {
  const admin = await guard("events");
  const id = str(form, "id");
  const event = id ? await getEvent(id) : null;
  if (event) {
    await updateEvent(id, { deletedAt: new Date().toISOString(), deletedBy: admin.name });
    await audit(admin, "delete", "event", id, `Deleted event: ${event.titleEn}`, {
      title: event.titleEn,
      createdBy: event.createdBy,
    });
  }
  revalidatePath("/", "layout");
  redirect("/admin/events?deleted=1");
}

/* --------------------------------- members -------------------------------- */

export async function setMemberStatusAction(form: FormData) {
  const admin = await guard("members");
  const id = str(form, "id");
  const status = str(form, "status");
  if (id && (status === "active" || status === "suspended")) {
    await updateMember(id, { status });
    await audit(admin, "update", "member", id, `Set member status to ${status}`);
  }
  revalidatePath("/admin/members");
  redirect("/admin/members?saved=1");
}

/* -------------------------------- proposals ------------------------------- */

export async function setProposalStatusAction(form: FormData) {
  const admin = await guard("proposals");
  const id = str(form, "id");
  const status = str(form, "status");
  if (id && (status === "open" || status === "hidden")) {
    await updateProposal(id, { status });
    await audit(admin, "update", "proposal", id, `Set suggestion status to ${status}`);
  }
  revalidatePath("/admin/proposals");
  redirect("/admin/proposals?saved=1");
}

export async function deleteProposalAction(form: FormData) {
  const admin = await guard("proposals");
  const id = str(form, "id");
  const proposals = await listProposals({ includeHidden: true });
  const proposal = proposals.find((item) => item.id === id);
  if (proposal) {
    const comments = await listComments(id);
    await updateProposal(id, { status: "hidden" });
    await audit(admin, "delete", "proposal", id, `Deleted suggestion: ${proposal.title}`, {
      title: proposal.title,
      author: proposal.authorEmail,
      responses: comments.length,
    });
  }
  revalidatePath("/admin/proposals");
  redirect("/admin/proposals?deleted=1");
}

/* ---------------------------------- funds --------------------------------- */

export async function createFundReportAction(form: FormData) {
  const admin = await guard("funds");
  const country = str(form, "country") as CountryCode;
  const stateCode = str(form, "stateCode");
  const titleEn = str(form, "titleEn");
  const titleAr = str(form, "titleAr");
  if ((country !== "US" && country !== "CA") || !stateCode || !titleEn || !titleAr) {
    redirect("/admin/funds?error=required");
  }

  const report = await createFundReport({
    country,
    stateCode,
    titleEn,
    titleAr,
    bodyEn: str(form, "bodyEn"),
    bodyAr: str(form, "bodyAr"),
    amountCents: Math.max(0, num(form, "amountCents", 0)),
    periodLabel: str(form, "periodLabel") || new Date().getFullYear().toString(),
    publishedAt: new Date().toISOString(),
    createdBy: admin.name,
  });

  const recipients = await sendFundReportToState(report);
  await audit(admin, "publish", "fund_report", report.id, `Published fund report: ${titleEn}`, {
    stateCode,
    recipients,
  });
  revalidatePath("/admin/funds");
  redirect(`/admin/funds?published=${recipients}`);
}

export async function createCommitteeAction(form: FormData) {
  const admin = await guard("committee");
  const country = str(form, "country") as CountryCode;
  const stateCode = str(form, "stateCode");
  const name = str(form, "name");
  if ((country !== "US" && country !== "CA") || !stateCode || !name) redirect("/admin/committee?error=required");

  const member = await createCommitteeMember({
    country,
    stateCode,
    name,
    roleEn: str(form, "roleEn") || "Committee member",
    roleAr: str(form, "roleAr") || "عضو لجنة",
    bio: str(form, "bio") || null,
    sortOrder: num(form, "sortOrder", 10),
  });
  await audit(admin, "create", "committee", member.id, `Added committee member: ${name}`, { stateCode });
  revalidatePath("/admin/committee");
  redirect("/admin/committee?saved=1");
}

/* ------------------------------- volunteering ----------------------------- */

export async function createVolunteerQuestionAction(form: FormData) {
  const admin = await guard("volunteer");
  const promptEn = str(form, "promptEn");
  const promptAr = str(form, "promptAr");
  const type = str(form, "type") === "boolean" ? "boolean" : "single_select";
  const rawOptions = str(form, "options");
  if (!promptEn || !promptAr) redirect("/admin/volunteer?error=required");

  const options =
    type === "boolean"
      ? [
          { value: "yes", labelEn: "Yes", labelAr: "نعم" },
          { value: "no", labelEn: "No", labelAr: "لا" },
        ]
      : rawOptions
          .split("\n")
          .map((line, index) => {
            const [en, ar] = line.split("|").map((part) => part.trim());
            return { value: `option_${index + 1}`, labelEn: en || `Option ${index + 1}`, labelAr: ar || en || `خيار ${index + 1}` };
          })
          .filter((option) => option.labelEn);

  if (options.length < 2) redirect("/admin/volunteer?error=options");

  const question = await createVolunteerQuestion({
    key: `custom_${Date.now()}`,
    promptEn,
    promptAr,
    type,
    options,
    sortOrder: num(form, "sortOrder", 99),
    active: true,
  });
  await audit(admin, "create", "volunteer_question", question.id, `Added volunteer question: ${promptEn}`);
  revalidatePath("/admin/volunteer");
  redirect("/admin/volunteer?saved=1");
}

/* --------------------------------- admins --------------------------------- */

const ROLES: AdminRole[] = ["super_admin", "admin", "content_manager", "events_manager", "donations_manager", "viewer"];

export async function createAdminAction(form: FormData) {
  const admin = await guard("admins");
  const email = str(form, "email").toLowerCase();
  const name = str(form, "name");
  const role = str(form, "role") as AdminRole;
  const password = str(form, "password");

  if (!email || !name || !password || password.length < 8 || !ROLES.includes(role)) {
    redirect("/admin/admins?error=required");
  }
  const existing = await getAdminByEmail(email);
  if (existing) redirect("/admin/admins?error=taken");

  const created = await createAdmin({
    email,
    name,
    role,
    active: true,
    passwordHash: hashPassword(password),
  });
  await audit(admin, "create", "admin", created.id, `Created administrator: ${email}`, { role });
  revalidatePath("/admin/admins");
  redirect("/admin/admins?saved=1");
}

export async function toggleAdminAction(form: FormData) {
  const admin = await guard("admins");
  const id = str(form, "id");
  const active = bool(form, "active");
  if (id === admin.id) redirect("/admin/admins?error=self");
  await updateAdmin(id, { active });
  await audit(admin, "update", "admin", id, `${active ? "Activated" : "Disabled"} administrator account`);
  revalidatePath("/admin/admins");
  redirect("/admin/admins?saved=1");
}
