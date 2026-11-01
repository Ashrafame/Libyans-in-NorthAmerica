import { isDemoMode, seedLocalDatabase, storage } from "./storage";
import { createSeedDatabase } from "./seed";
import { newId } from "./crypto";
import { DEFAULT_SETTINGS, mergeSettings } from "./settings";
import type {
  AdminUser,
  Child,
  CommitteeMember,
  CommunityEvent,
  Donation,
  FundReport,
  InboxMessage,
  Member,
  Post,
  Proposal,
  ProposalComment,
  SiteSettings,
  VolunteerQuestion,
  AuditLog,
} from "./types";

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!isDemoMode) return;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const existing = await storage.all<SiteSettings>("settings");
    if (existing.length > 0) return;
    await seedLocalDatabase(createSeedDatabase());
  })();
  return seedPromise;
}

const byNewest = (key: keyof AuditLog | string) => (a: Record<string, unknown>, b: Record<string, unknown>) =>
  String(b[key] ?? "").localeCompare(String(a[key] ?? ""));

/* ------------------------------- settings ------------------------------- */

export async function getSettings(): Promise<SiteSettings> {
  await ensureSeeded();
  const rows = await storage.all<SiteSettings>("settings");
  const row = rows.find((r) => r.id === "site") ?? rows[0];
  return mergeSettings(row);
}

export async function saveSettings(
  patch: Partial<SiteSettings>,
  actor: { id: string; name: string },
): Promise<SiteSettings> {
  await ensureSeeded();
  const current = await getSettings();
  const next: SiteSettings = {
    ...current,
    ...patch,
    id: "site",
    updatedAt: new Date().toISOString(),
    updatedBy: actor.name,
  };
  const rows = await storage.all<SiteSettings>("settings");
  if (rows.length === 0) {
    await storage.insert("settings", next);
  } else {
    await storage.update<SiteSettings>("settings", rows[0].id, next);
  }
  return next;
}

/* -------------------------------- members -------------------------------- */

export async function getMemberById(id: string): Promise<Member | null> {
  await ensureSeeded();
  return storage.find<Member>("members", id);
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  await ensureSeeded();
  const all = await storage.all<Member>("members");
  const target = email.trim().toLowerCase();
  return all.find((m) => m.email.toLowerCase() === target) ?? null;
}

export async function createMember(input: Partial<Member> & { email: string }): Promise<Member> {
  await ensureSeeded();
  const now = new Date().toISOString();
  const { email: rawEmail, ...rest } = input;
  const member: Member = {
    id: newId(),
    email: rawEmail.trim().toLowerCase(),
    passwordHash: null,
    verificationCode: null,
    verificationSentAt: null,
    status: "pending_verification",
    step: "verify",
    locale: "en",
    country: null,
    stateCode: null,
    city: null,
    postalCode: null,
    firstName: null,
    fatherName: null,
    lastName: null,
    address: null,
    birthDate: null,
    phone: null,
    maritalStatus: null,
    spouseName: null,
    householdSize: null,
    hasDependents: null,
    sonsCount: 0,
    daughtersCount: 0,
    educationLevel: null,
    currentJob: null,
    hasCar: null,
    incomeSufficient: null,
    hardshipNotes: null,
    volunteerAnswers: {},
    termsAcceptedAt: null,
    verifiedAt: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...rest,
  };
  return storage.insert("members", member);
}

export async function updateMember(id: string, patch: Partial<Member>): Promise<Member> {
  return storage.update<Member>("members", id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function listMembers(options?: {
  country?: string;
  stateCode?: string;
  search?: string;
  status?: string;
}): Promise<Member[]> {
  await ensureSeeded();
  const all = await storage.all<Member>("members");
  const search = options?.search?.trim().toLowerCase();
  return all
    .filter((m) => (options?.country ? m.country === options.country : true))
    .filter((m) => (options?.stateCode ? m.stateCode === options.stateCode : true))
    .filter((m) => (options?.status ? m.status === options.status : true))
    .filter((m) => {
      if (!search) return true;
      const haystack = [m.firstName, m.fatherName, m.lastName, m.email, m.city, m.currentJob]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listActiveMembers(): Promise<Member[]> {
  const all = await listMembers({ status: "active" });
  return all;
}

/* -------------------------------- children ------------------------------- */

export async function listChildren(memberId: string): Promise<Child[]> {
  await ensureSeeded();
  const all = await storage.all<Child>("children");
  return all
    .filter((c) => c.memberId === memberId)
    .sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
}

export async function replaceChildren(memberId: string, children: Omit<Child, "id" | "memberId" | "createdAt">[]) {
  await ensureSeeded();
  const existing = await listChildren(memberId);
  for (const row of existing) await storage.remove("children", row.id);
  for (const child of children) {
    await storage.insert<Child>("children", {
      ...child,
      id: newId(),
      memberId,
      createdAt: new Date().toISOString(),
    });
  }
}

/* --------------------------------- posts --------------------------------- */

export type PostFilters = {
  kind?: string;
  country?: string;
  stateCode?: string;
  city?: string;
  search?: string;
  includeDrafts?: boolean;
  limit?: number;
};

export async function listPosts(filters: PostFilters = {}): Promise<Post[]> {
  await ensureSeeded();
  const all = await storage.all<Post>("posts");
  const search = filters.search?.trim().toLowerCase();
  const rows = all
    .filter((p) => (filters.includeDrafts ? true : p.status === "published"))
    .filter((p) => (filters.kind ? p.kind === filters.kind : true))
    .filter((p) => (filters.country ? p.country === filters.country : true))
    .filter((p) => (filters.stateCode ? p.stateCode === filters.stateCode : true))
    .filter((p) => (filters.city ? p.city === filters.city : true))
    .filter((p) => {
      if (!search) return true;
      return [p.titleEn, p.titleAr, p.excerptEn, p.excerptAr, p.authorName]
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));
  return filters.limit ? rows.slice(0, filters.limit) : rows;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  await ensureSeeded();
  const all = await storage.all<Post>("posts");
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getPostById(id: string): Promise<Post | null> {
  return storage.find<Post>("posts", id);
}

export async function createPost(input: Partial<Post> & { titleEn: string; titleAr: string }): Promise<Post> {
  await ensureSeeded();
  const now = new Date().toISOString();
  const slugBase =
    input.slug?.trim() ||
    input.titleEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 70);
  const all = await storage.all<Post>("posts");
  let slug = slugBase || `post-${Date.now()}`;
  let n = 2;
  while (all.some((p) => p.slug === slug)) slug = `${slugBase}-${n++}`;
  const { titleEn, titleAr, slug: _ignoredSlug, ...rest } = input;
  const post: Post = {
    id: newId(),
    kind: "news",
    titleEn,
    titleAr,
    excerptEn: "",
    excerptAr: "",
    bodyEn: "",
    bodyAr: "",
    coverImage: null,
    country: null,
    stateCode: null,
    city: null,
    authorName: "Community Desk",
    status: "draft",
    featured: false,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    ...rest,
    slug,
  };
  return storage.insert("posts", post);
}

export async function updatePost(id: string, patch: Partial<Post>): Promise<Post> {
  return storage.update<Post>("posts", id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deletePost(id: string): Promise<void> {
  await storage.remove("posts", id);
}

/* --------------------------------- events -------------------------------- */

export async function listEvents(includeDeleted = false): Promise<CommunityEvent[]> {
  await ensureSeeded();
  const all = await storage.all<CommunityEvent>("events");
  return all
    .filter((e) => (includeDeleted ? true : !e.deletedAt))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEvent(id: string): Promise<CommunityEvent | null> {
  return storage.find<CommunityEvent>("events", id);
}

export async function createEvent(input: Omit<CommunityEvent, "id" | "createdAt" | "deletedAt" | "deletedBy">) {
  await ensureSeeded();
  return storage.insert<CommunityEvent>("events", {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
    deletedAt: null,
    deletedBy: null,
  });
}

export async function updateEvent(id: string, patch: Partial<CommunityEvent>) {
  return storage.update<CommunityEvent>("events", id, patch);
}

/* ------------------------------- proposals ------------------------------- */

export async function listProposals(options?: { memberId?: string; includeHidden?: boolean }): Promise<Proposal[]> {
  await ensureSeeded();
  const all = await storage.all<Proposal>("proposals");
  return all
    .filter((p) => (options?.includeHidden ? true : p.status === "open"))
    .filter((p) => (options?.memberId ? p.memberId === options.memberId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProposal(id: string): Promise<Proposal | null> {
  return storage.find<Proposal>("proposals", id);
}

export async function createProposal(input: {
  member: { id: string; firstName: string | null; lastName: string | null; email: string };
  title: string;
  body: string;
}): Promise<Proposal> {
  await ensureSeeded();
  const proposal: Proposal = {
    id: newId(),
    memberId: input.member.id,
    authorName: [input.member.firstName, input.member.lastName].filter(Boolean).join(" ") || input.member.email,
    authorEmail: input.member.email,
    title: input.title,
    body: input.body,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  return storage.insert("proposals", proposal);
}

export async function updateProposal(id: string, patch: Partial<Proposal>) {
  return storage.update<Proposal>("proposals", id, patch);
}

export async function listComments(proposalId: string): Promise<ProposalComment[]> {
  await ensureSeeded();
  const all = await storage.all<ProposalComment>("proposal_comments");
  return all.filter((c) => c.proposalId === proposalId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listAllComments(): Promise<ProposalComment[]> {
  await ensureSeeded();
  return storage.all<ProposalComment>("proposal_comments");
}

export async function createComment(input: {
  proposalId: string;
  member: { id: string; firstName: string | null; lastName: string | null; email: string };
  body: string;
}): Promise<ProposalComment> {
  await ensureSeeded();
  const comment: ProposalComment = {
    id: newId(),
    proposalId: input.proposalId,
    memberId: input.member.id,
    authorName: [input.member.firstName, input.member.lastName].filter(Boolean).join(" ") || input.member.email,
    authorEmail: input.member.email,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  return storage.insert("proposal_comments", comment);
}

/* -------------------------------- donations ------------------------------- */

export async function listDonations(options?: {
  country?: string;
  stateCode?: string;
  status?: string;
  limit?: number;
}): Promise<Donation[]> {
  await ensureSeeded();
  const all = await storage.all<Donation>("donations");
  const rows = all
    .filter((d) => (options?.country ? d.country === options.country : true))
    .filter((d) => (options?.stateCode ? d.stateCode === options.stateCode : true))
    .filter((d) => (options?.status ? d.status === options.status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return options?.limit ? rows.slice(0, options.limit) : rows;
}

export async function createDonation(input: Partial<Donation> & {
  donorName: string;
  donorEmail: string;
  country: Donation["country"];
  stateCode: string;
  amountCents: number;
}): Promise<Donation> {  await ensureSeeded();
  const donation: Donation = {
    id: newId(),
    memberId: null,
    currency: "usd",
    status: "pending",
    stripeSessionId: null,
    note: null,
    createdAt: new Date().toISOString(),
    ...input,
  };
  return storage.insert("donations", donation);
}

export async function updateDonation(id: string, patch: Partial<Donation>) {
  return storage.update<Donation>("donations", id, patch);
}

export async function findDonationBySession(stripeSessionId: string): Promise<Donation | null> {
  await ensureSeeded();
  const all = await storage.all<Donation>("donations");
  return all.find((d) => d.stripeSessionId === stripeSessionId) ?? null;
}

export async function getDonationById(id: string): Promise<Donation | null> {
  await ensureSeeded();
  return storage.find<Donation>("donations", id);
}

export async function donationTotals(): Promise<{
  all: number;
  byCountry: Record<string, number>;
  byState: Record<string, number>;
  count: number;
}> {
  const donations = await listDonations({ status: "succeeded" });
  const byCountry: Record<string, number> = {};
  const byState: Record<string, number> = {};
  let all = 0;
  for (const d of donations) {
    all += d.amountCents;
    byCountry[d.country] = (byCountry[d.country] ?? 0) + d.amountCents;
    byState[d.stateCode] = (byState[d.stateCode] ?? 0) + d.amountCents;
  }
  return { all, byCountry, byState, count: donations.length };
}

export async function listFundReports(stateCode?: string): Promise<FundReport[]> {
  await ensureSeeded();
  const all = await storage.all<FundReport>("fund_reports");
  return all
    .filter((r) => (stateCode ? r.stateCode === stateCode : true))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function createFundReport(input: Omit<FundReport, "id">): Promise<FundReport> {
  await ensureSeeded();
  return storage.insert("fund_reports", { ...input, id: newId() });
}

export async function listCommittee(stateCode?: string): Promise<CommitteeMember[]> {
  await ensureSeeded();
  const all = await storage.all<CommitteeMember>("committee");
  return all
    .filter((c) => (stateCode ? c.stateCode === stateCode : true))
    .sort((a, b) => a.stateCode.localeCompare(b.stateCode) || a.sortOrder - b.sortOrder);
}

export async function createCommitteeMember(input: Omit<CommitteeMember, "id" | "createdAt">) {
  await ensureSeeded();
  return storage.insert("committee", { ...input, id: newId(), createdAt: new Date().toISOString() });
}

/* ---------------------------------- inbox -------------------------------- */

export async function listInbox(memberId: string): Promise<InboxMessage[]> {
  await ensureSeeded();
  const all = await storage.all<InboxMessage>("inbox");
  return all.filter((m) => m.memberId === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createInboxMessage(input: Omit<InboxMessage, "id" | "createdAt" | "readAt">) {
  await ensureSeeded();
  return storage.insert("inbox", {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
    readAt: null,
  });
}

export async function markInboxRead(id: string) {
  return storage.update<InboxMessage>("inbox", id, { readAt: new Date().toISOString() });
}

export async function sendFundReportToState(report: FundReport): Promise<number> {
  const members = await listActiveMembers();
  const recipients = members.filter(
    (m) => m.country === report.country && m.stateCode === report.stateCode,
  );
  for (const member of recipients) {
    await createInboxMessage({
      memberId: member.id,
      kind: "fund_report",
      subjectEn: report.titleEn,
      subjectAr: report.titleAr,
      bodyEn: report.bodyEn,
      bodyAr: report.bodyAr,
    });
  }
  return recipients.length;
}

/* --------------------------------- admins -------------------------------- */

export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  await ensureSeeded();
  const all = await storage.all<AdminUser>("admins");
  const target = email.trim().toLowerCase();
  return all.find((a) => a.email.toLowerCase() === target) ?? null;
}

export async function getAdminById(id: string): Promise<AdminUser | null> {
  await ensureSeeded();
  return storage.find<AdminUser>("admins", id);
}

export async function listAdmins(): Promise<AdminUser[]> {
  await ensureSeeded();
  const all = await storage.all<AdminUser>("admins");
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createAdmin(input: Omit<AdminUser, "id" | "createdAt" | "lastLoginAt">) {
  await ensureSeeded();
  return storage.insert<AdminUser>("admins", {
    ...input,
    email: input.email.trim().toLowerCase(),
    id: newId(),
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  });
}

export async function updateAdmin(id: string, patch: Partial<AdminUser>) {
  return storage.update<AdminUser>("admins", id, patch);
}

/* --------------------------------- audit --------------------------------- */

export async function recordAudit(input: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
  await ensureSeeded();
  return storage.insert<AuditLog>("audit_logs", {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
  });
}

export async function listAudit(limit = 200): Promise<AuditLog[]> {
  await ensureSeeded();
  const all = await storage.all<AuditLog>("audit_logs");
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

/* --------------------------- volunteer questions ------------------------- */

export async function listVolunteerQuestions(includeInactive = false): Promise<VolunteerQuestion[]> {
  await ensureSeeded();
  const all = await storage.all<VolunteerQuestion>("volunteer_questions");
  return all
    .filter((q) => (includeInactive ? true : q.active))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createVolunteerQuestion(input: Omit<VolunteerQuestion, "id" | "createdAt">) {
  await ensureSeeded();
  return storage.insert("volunteer_questions", { ...input, id: newId(), createdAt: new Date().toISOString() });
}

/* ------------------------------ misc helpers ----------------------------- */

export async function communityStats() {
  const [members, posts, events, donations] = await Promise.all([
    listMembers(),
    listPosts({ includeDrafts: true }),
    listEvents(),
    listDonations({ status: "succeeded" }),
  ]);
  const active = members.filter((m) => m.status === "active");
  const states = new Set(active.map((m) => `${m.country}:${m.stateCode}`));
  return {
    members: active.length,
    families: active.length,
    states: states.size,
    countries: 2,
    posts: posts.filter((p) => p.status === "published").length,
    events: events.length,
    donationsTotal: donations.reduce((sum, d) => sum + d.amountCents, 0),
  };
}

export { DEFAULT_SETTINGS, byNewest };
