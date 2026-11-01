export type Locale = "en" | "ar";
export type Dir = "ltr" | "rtl";

export type CountryCode = "US" | "CA";
export type MaritalStatus = "married" | "widowed" | "divorced" | "single";

/**
 * Lifecycle of a family account:
 *  pending_verification -> onboarding -> active
 *  suspended can be set by administrators at any time.
 */
export type MemberStatus = "pending_verification" | "onboarding" | "active" | "suspended";

export const ONBOARDING_STEPS = [
  "verify",
  "personal",
  "family",
  "children",
  "professional",
  "general",
  "volunteering",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number] | "done";

export interface Member {
  id: string;
  email: string;
  passwordHash: string | null;
  verificationCode: string | null;
  verificationSentAt: string | null;
  status: MemberStatus;
  step: OnboardingStep;
  locale: Locale;

  country: CountryCode | null;
  stateCode: string | null;
  city: string | null;
  postalCode: string | null;

  firstName: string | null;
  fatherName: string | null;
  lastName: string | null;
  address: string | null;
  birthDate: string | null;
  phone: string | null;

  maritalStatus: MaritalStatus | null;
  spouseName: string | null;
  householdSize: number | null;
  hasDependents: boolean | null;
  sonsCount: number;
  daughtersCount: number;

  educationLevel: string | null;
  currentJob: string | null;

  hasCar: boolean | null;
  incomeSufficient: boolean | null;
  hardshipNotes: string | null;

  volunteerAnswers: Record<string, string>;

  termsAcceptedAt: string | null;
  verifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Child {
  id: string;
  memberId: string;
  name: string;
  gender: "male" | "female";
  birthDate: string | null;
  education: string | null;
  activities: string | null;
  position: number;
  createdAt: string;
}

export type AdminRole =
  | "super_admin"
  | "admin"
  | "content_manager"
  | "events_manager"
  | "donations_manager"
  | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export type PostKind = "news" | "guide" | "jobs" | "success" | "idea";
export type PostStatus = "draft" | "published";

export interface Post {
  id: string;
  slug: string;
  kind: PostKind;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  bodyEn: string;
  bodyAr: string;
  coverImage: string | null;
  country: CountryCode | null;
  stateCode: string | null;
  city: string | null;
  authorName: string;
  status: PostStatus;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityEvent {
  id: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  imageUrl: string | null;
  announceUntil: string;
  tickerEnabled: boolean;
  tickerTextEn: string;
  tickerTextAr: string;
  tickerBgColor: string;
  tickerTextColor: string;
  tickerUntil: string;
  createdAt: string;
  createdBy: string;
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface Proposal {
  id: string;
  memberId: string;
  authorName: string;
  authorEmail: string;
  title: string;
  body: string;
  status: "open" | "hidden";
  createdAt: string;
}

export interface ProposalComment {
  id: string;
  proposalId: string;
  memberId: string;
  authorName: string;
  authorEmail: string;
  body: string;
  createdAt: string;
}

export type DonationStatus = "pending" | "succeeded" | "failed";

export interface Donation {
  id: string;
  memberId: string | null;
  donorName: string;
  donorEmail: string;
  country: CountryCode;
  stateCode: string;
  amountCents: number;
  currency: string;
  status: DonationStatus;
  stripeSessionId: string | null;
  note: string | null;
  createdAt: string;
}

export interface FundReport {
  id: string;
  country: CountryCode;
  stateCode: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  amountCents: number;
  periodLabel: string;
  publishedAt: string;
  createdBy: string;
}

export interface CommitteeMember {
  id: string;
  country: CountryCode;
  stateCode: string;
  name: string;
  roleEn: string;
  roleAr: string;
  bio: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface InboxMessage {
  id: string;
  memberId: string;
  kind: "fund_report" | "announcement" | "system";
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
  readAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: AdminRole | "system";
  action: "create" | "update" | "delete" | "publish" | "login" | "payout";
  entity: string;
  entityId: string;
  summary: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface SiteSettings {
  id: "site";
  titleEn: string;
  titleAr: string;
  taglineEn: string;
  taglineAr: string;

  accentColor: string;
  accentDarkColor: string;
  inkColor: string;
  canvasColor: string;
  mutedColor: string;

  headingFontEn: string;
  headingFontAr: string;
  bodyFontEn: string;
  bodyFontAr: string;
  headingSize: number;
  bodySize: number;

  cardRadius: number;
  buttonRadius: number;
  inputRadius: number;

  heroImage: string;
  heroBadgeEn: string;
  heroBadgeAr: string;
  heroTitleEn: string;
  heroTitleAr: string;
  heroSubtitleEn: string;
  heroSubtitleAr: string;

  footerAboutEn: string;
  footerAboutAr: string;
  contactEmail: string;
  adminEmail: string;
  phones: string[];

  facebookUrl: string;
  xUrl: string;
  tiktokUrl: string;
  instagramUrl: string;
  youtubeUrl: string;

  membershipCtaEn: string;
  membershipCtaAr: string;

  monthlyCapCents: number;
  stripeAccountHolder: string;
  stripeAccountNumber: string;
  stripeRoutingNumber: string;

  tickerEnabled: boolean;

  updatedAt: string;
  updatedBy: string | null;
}

export interface VolunteerQuestion {
  id: string;
  key: string;
  promptEn: string;
  promptAr: string;
  type: "boolean" | "single_select";
  options: { value: string; labelEn: string; labelAr: string }[];
  sortOrder: number;
  active: boolean;
}

export const DEFAULT_VOLUNTEER_QUESTIONS: Omit<VolunteerQuestion, "id" | "createdAt">[] = [
  {
    key: "active_member",
    promptEn: "Would you like to be an active member of the community when your people need you?",
    promptAr: "هل ترغب أن تكون عضواً فعالاً في الجالية حين يحتاجك أبناء وطنك؟",
    type: "boolean",
    options: [
      { value: "yes", labelEn: "Yes", labelAr: "نعم" },
      { value: "no", labelEn: "No", labelAr: "لا" },
    ],
    sortOrder: 1,
    active: true,
  },
  {
    key: "teamwork",
    promptEn: "Do you prefer working with a team or completing work on your own?",
    promptAr: "هل تحب العمل الجماعي أم تفضّل أن تؤدي العمل بنفسك؟",
    type: "single_select",
    options: [
      { value: "team", labelEn: "I love working with a team", labelAr: "أحب العمل الجماعي" },
      { value: "solo", labelEn: "I prefer working on my own", labelAr: "أحب أن أعمل بمفردي" },
    ],
    sortOrder: 2,
    active: true,
  },
  {
    key: "travel",
    promptEn: "Where can you volunteer?",
    promptAr: "أين يمكنك التطوع؟",
    type: "single_select",
    options: [
      { value: "city", labelEn: "In my city only", labelAr: "في مدينتي فقط" },
      { value: "state", labelEn: "In my city or state", labelAr: "في مدينتي أو ولايتي فقط" },
      {
        value: "anywhere",
        labelEn: "I can travel to other states",
        labelAr: "يمكنني السفر للتطوع في ولايات أخرى",
      },
    ],
    sortOrder: 3,
    active: true,
  },
];
