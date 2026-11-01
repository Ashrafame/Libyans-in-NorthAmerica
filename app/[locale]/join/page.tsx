import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, Lock, ShieldCheck, Users } from "lucide-react";
import type { Locale, Member } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { getCurrentMember } from "@/lib/auth";
import { isDemoMode } from "@/lib/storage";
import { listChildren, listVolunteerQuestions, getSettings } from "@/lib/repo";
import { LocationPicker } from "@/components/join/location-picker";
import { FamilyForm } from "@/components/join/family-form";
import {
  backAction,
  childAction,
  familyAction,
  generalAction,
  personalAction,
  professionalAction,
  resendCodeAction,
  signupAction,
  verifyAction,
  volunteeringAction,
} from "@/lib/actions/join";

export const metadata: Metadata = { title: "Become a member" };

type Search = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const STEP_ORDER = ["personal", "family", "children", "professional", "general", "volunteering"] as const;
type StepKey = (typeof STEP_ORDER)[number];

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Search;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const query = await searchParams;
  const errorKey = first(query.error);
  const email = first(query.email);

  const member = await getCurrentMember();
  const settings = await getSettings();

  const isVerifying = Boolean(first(query.verify)) || member?.status === "pending_verification";
  const cookieStore = await cookies();
  const demoCode = isDemoMode ? cookieStore.get("lna_dev_code")?.value : undefined;
  const pendingEmail = cookieStore.get("lna_pending_email")?.value;

  if (!member || isVerifying) {
    if (member?.status === "active" && member.step === "done" && !isVerifying) {
      redirect(`/${locale}/members`);
    }
    if (isVerifying) {
      return (
        <VerificationScreen
          locale={locale}
          email={member?.email ?? email ?? pendingEmail ?? ""}
          demoCode={demoCode}
          errorKey={errorKey}
          resent={Boolean(first(query.resent))}
        />
      );
    }
    return <AccountScreen locale={locale} errorKey={errorKey} tagline={settings.taglineEn} taglineAr={settings.taglineAr} />;
  }

  if (member.status === "active" && member.step === "done") {
    redirect(`/${locale}/members`);
  }

  const hasChildren = member.sonsCount + member.daughtersCount > 0;
  const steps = STEP_ORDER.filter((step) => step !== "children" || hasChildren);
  const currentStep: StepKey = (member.step === "verify" ? "personal" : (member.step as StepKey)) ?? "personal";
  const stepIndex = Math.max(0, steps.indexOf(currentStep));
  const total = steps.length;

  const childIndex = Number(first(query.child) ?? 0);
  const children = hasChildren ? await listChildren(member.id) : [];
  const totalChildren = member.sonsCount + member.daughtersCount;
  const safeChildIndex = Math.min(Math.max(0, Number.isFinite(childIndex) ? childIndex : 0), Math.max(0, totalChildren - 1));
  const childGender: "male" | "female" = safeChildIndex < member.sonsCount ? "male" : "female";
  const childPosition = childGender === "male" ? safeChildIndex + 1 : safeChildIndex - member.sonsCount + 1;
  const existingChild = children.find((c) => c.gender === childGender && c.position === childPosition);

  return (
    <div className="wizard-shell">
      <div className="wizard">
        <div className="wizard-top">
          <div className="spread">
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                {t("nav.join")}
              </div>
              <h1 style={{ fontSize: "clamp(24px,3vw,32px)" }}>{t("join.title")}</h1>
            </div>
            <span className="tag">
              {t("join.stepOf", { current: stepIndex + 1, total })}
            </span>
          </div>

          <div className="wizard-steps">
            {steps.map((step, index) => (
              <span
                key={step}
                className="wizard-step"
                data-state={index < stepIndex ? "done" : index === stepIndex ? "current" : "todo"}
              >
                <span className="wizard-step-index">{index < stepIndex ? <Check size={10} /> : index + 1}</span>
                {t(`join.step.${step}` as "join.step.personal")}
              </span>
            ))}
          </div>
          <div className="progress">
            <div style={{ width: `${((stepIndex + 1) / total) * 100}%` }} />
          </div>
        </div>

        <div className="wizard-card">
          {errorKey && <div className="alert alert-error" style={{ marginBottom: 20 }}>{errorMessage(errorKey, locale)}</div>}

          {currentStep === "personal" && (
            <>
              <div className="wizard-card-head">
                <h1>{t("join.personalTitle")}</h1>
                <p className="section-sub">{t("join.personalBody")}</p>
              </div>
              <form action={personalAction}>
                <input type="hidden" name="locale" value={locale} />
                <div className="form-grid">
                  <Field label={t("join.firstName")} name="firstName" defaultValue={member.firstName} required pattern="[A-Za-z' ]+" />
                  <Field label={t("join.fatherName")} name="fatherName" defaultValue={member.fatherName} required pattern="[A-Za-z' ]+" />
                  <Field label={t("join.lastName")} name="lastName" defaultValue={member.lastName} required pattern="[A-Za-z' ]+" />
                  <Field label={t("join.phone")} name="phone" defaultValue={member.phone} required type="tel" dir="ltr" />
                  <Field label={t("join.address")} name="address" defaultValue={member.address} required span />
                  <Field label={t("join.birthDate")} name="birthDate" defaultValue={member.birthDate} required type="date" />
                  <div className="field">
                    <span className="field-label">{locale === "ar" ? "الموقع" : "Location"}</span>
                    <span className="input" style={{ background: "var(--muted)", color: "var(--steel)" }}>
                      {[member.city, member.stateCode, member.country].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </div>
                <p className="field-hint" style={{ marginTop: 12 }}>
                  {t("join.englishOnly")} {t("members.adminNote")}
                </p>
                <div className="form-actions">
                  <span />
                  <button type="submit" className="btn btn-primary">
                    {t("common.next")}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          )}

          {currentStep === "family" && (
            <>
              <div className="wizard-card-head">
                <h1>{t("join.familyTitle")}</h1>
                <p className="section-sub">{t("join.householdHint")}</p>
              </div>
              <FamilyForm
                locale={locale}
                initial={{
                  maritalStatus: member.maritalStatus,
                  spouseName: member.spouseName,
                  householdSize: member.householdSize,
                  hasDependents: member.hasDependents,
                  sonsCount: member.sonsCount,
                  daughtersCount: member.daughtersCount,
                }}
              />
            </>
          )}

          {currentStep === "children" && (
            <>
              <div className="wizard-card-head">
                <h1>{t("join.childrenTitle")}</h1>
                <p className="section-sub">
                  {t("join.childOf", { current: safeChildIndex + 1, total: totalChildren })} — {t("join.childrenBody")}
                </p>
              </div>
              <form action={childAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="to" value="family" />
                <input type="hidden" name="index" value={safeChildIndex} />
                <div className="form-grid">
                  <Field label={t("join.childName")} name="name" defaultValue={existingChild?.name} required span />
                  <Field label={t("join.birthDate")} name="birthDate" defaultValue={existingChild?.birthDate} required type="date" />
                  <div className="field">
                    <span className="field-label">{locale === "ar" ? "الجنس" : "Gender"}</span>
                    <span className="input" style={{ background: "var(--muted)", color: "var(--steel)" }}>
                      {childGender === "male" ? t("join.male") : t("join.female")}
                    </span>
                  </div>
                  <Field
                    label={t("join.childEducation")}
                    name="education"
                    defaultValue={existingChild?.education}
                    placeholder={t("common.optional")}
                    span
                  />
                  <Field
                    label={t("join.childActivities")}
                    name="activities"
                    defaultValue={existingChild?.activities}
                    placeholder={t("common.optional")}
                    span
                  />
                </div>
                <div className="form-actions">
                  <div className="row" style={{ gap: 10 }}>
                    {safeChildIndex > 0 ? (
                      <Link href={`/${locale}/join?child=${safeChildIndex - 1}`} className="btn btn-secondary">
                        {t("common.back")}
                      </Link>
                    ) : (
                      <button type="submit" formAction={backAction} className="btn btn-secondary">
                        {t("common.back")}
                      </button>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {safeChildIndex + 1 < totalChildren ? t("common.next") : t("common.save")}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          )}

          {currentStep === "professional" && (
            <>
              <div className="wizard-card-head">
                <h1>{t("join.professionalTitle")}</h1>
                <p className="section-sub">{t("join.professionalBody")}</p>
              </div>
              <form action={professionalAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="to" value={hasChildren ? "children" : "family"} />
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="educationLevel">{t("join.education")}</label>
                    <select id="educationLevel" name="educationLevel" className="select" defaultValue={member.educationLevel ?? ""}>
                      <option value="">{t("common.optional")}</option>
                      {(locale === "ar"
                        ? ["ثانوية", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه", "أخرى"]
                        : ["High school", "Diploma", "Bachelor's degree", "Master's degree", "Doctorate", "Other"]
                      ).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field label={t("join.currentJob")} name="currentJob" defaultValue={member.currentJob} required />
                </div>
                <div className="form-actions">
                  <button type="submit" formAction={backAction} className="btn btn-secondary">
                    {t("common.back")}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {t("common.next")}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          )}

          {currentStep === "general" && (
            <>
              <div className="wizard-card-head">
                <h1>{t("join.generalTitle")}</h1>
                <p className="section-sub">{t("join.generalBody")}</p>
              </div>
              <form action={generalAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="to" value="professional" />
                <div className="form-grid">
                  <YesNo label={t("join.hasCar")} name="hasCar" defaultValue={member.hasCar} locale={locale} />
                  <YesNo
                    label={t("join.incomeSufficient")}
                    name="incomeSufficient"
                    defaultValue={member.incomeSufficient}
                    locale={locale}
                  />
                  <div className="field span-2">
                    <label htmlFor="hardshipNotes">{t("join.hardship")}</label>
                    <textarea
                      id="hardshipNotes"
                      name="hardshipNotes"
                      className="textarea"
                      defaultValue={member.hardshipNotes ?? ""}
                      rows={4}
                      placeholder={t("common.optional")}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <div className="stack" style={{ gap: 4 }}>
                    <button type="submit" formAction={backAction} className="btn btn-secondary">
                      {t("common.back")}
                    </button>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {t("common.next")}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          )}

          {currentStep === "volunteering" && (
            <VolunteeringStep
              locale={locale}
              member={member}
              questions={await listVolunteerQuestions()}
            />
          )}
        </div>

        <p className="tiny muted" style={{ marginTop: 16, textAlign: "center" }}>
          {t("join.finishNote")}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ sub components ---------------------------- */

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  pattern,
  dir,
  placeholder,
  span,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  type?: string;
  pattern?: string;
  dir?: "ltr" | "rtl";
  placeholder?: string;
  span?: boolean;
}) {
  return (
    <div className={`field${span ? " span-2" : ""}`}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        className="input"
        defaultValue={defaultValue ?? ""}
        required={required}
        pattern={pattern}
        dir={dir}
        placeholder={placeholder}
      />
    </div>
  );
}

function YesNo({
  label,
  name,
  defaultValue,
  locale,
}: {
  label: string;
  name: string;
  defaultValue: boolean | null;
  locale: Locale;
}) {
  const t = createTranslator(locale);
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} className="select" defaultValue={defaultValue === null ? "" : String(defaultValue)} required>
        <option value="" disabled>
          —
        </option>
        <option value="true">{t("common.yes")}</option>
        <option value="false">{t("common.no")}</option>
      </select>
    </div>
  );
}

function AccountScreen({
  locale,
  errorKey,
  tagline,
  taglineAr,
}: {
  locale: Locale;
  errorKey?: string;
  tagline: string;
  taglineAr: string;
}) {
  const t = createTranslator(locale);
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div>
          <span className="hero-badge" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)", color: "#eaf2f7" }}>
            {locale === "ar" ? "عضوية العائلة" : "Family membership"}
          </span>
          <h2>{t("join.title")}</h2>
          <p>{locale === "ar" ? taglineAr : tagline}</p>
        </div>
        <div className="stack" style={{ gap: 14, position: "relative", zIndex: 1 }}>
          {[
            { icon: <Users size={16} />, text: locale === "ar" ? "دليل عائلات موثّق في كل ولاية ومقاطعة" : "A verified family directory in every state and province" },
            { icon: <ShieldCheck size={16} />, text: locale === "ar" ? "بياناتك خاصة ولا تُنشر علناً" : "Your information stays private, never published" },
            { icon: <BadgeCheck size={16} />, text: locale === "ar" ? "حساب واحد لكل عائلة" : "One account per family" },
          ].map((item) => (
            <div key={item.text} className="row" style={{ gap: 10, fontSize: 13.5, color: "rgba(234,242,247,.85)" }}>
              <span style={{ color: "#e8c98f" }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <h1>{t("join.accountTitle")}</h1>
          <p className="section-sub">{t("join.locationBody")}</p>

          {errorKey && (
            <div className="alert alert-error" style={{ marginTop: 20 }}>
              {errorMessage(errorKey, locale)}
            </div>
          )}

          <form action={signupAction} className="auth-form">
            <input type="hidden" name="locale" value={locale} />
            <div className="wizard-card-head" style={{ marginBottom: 0 }}>
              <h2 style={{ fontSize: 16 }}>{t("join.locationTitle")}</h2>
            </div>
            <LocationPicker locale={locale} />

            <hr className="rule" style={{ marginBlock: 6 }} />

            <div className="field">
              <label htmlFor="email">{t("join.email")}</label>
              <input id="email" name="email" type="email" className="input" required autoComplete="email" dir="ltr" />
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="password">{t("join.password")}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">{t("join.confirmPassword")}</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <p className="field-hint">{t("join.passwordHint")}</p>

            <div className="checkbox-row">
              <input id="pledge" name="pledge" type="checkbox" value="true" required />
              <label htmlFor="pledge">{t("join.pledge")}</label>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg">
              {t("join.createAccount")}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          <div className="auth-foot">
            <span>{t("join.terms")}</span>
            <span>
              {locale === "ar" ? "لديك حساب بالفعل؟" : "Already a member?"}{" "}
              <Link href={`/${locale}/login`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                {t("nav.login")}
              </Link>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function VerificationScreen({
  locale,
  email,
  demoCode,
  errorKey,
  resent,
}: {
  locale: Locale;
  email: string;
  demoCode?: string;
  errorKey?: string;
  resent?: boolean;
}) {
  const t = createTranslator(locale);
  return (
    <div className="wizard-shell">
      <div className="wizard" style={{ maxWidth: 560 }}>
        <div className="wizard-card">
          <div className="wizard-card-head">
            <span className="tag tag-accent" style={{ marginBottom: 14 }}>
              {locale === "ar" ? "خطوة الأمان" : "Security step"}
            </span>
            <h1>{t("join.verifyTitle")}</h1>
            <p className="section-sub">{t("join.verifyBody", { email })}</p>
          </div>

          {demoCode && (
            <div className="alert alert-warn" style={{ marginBottom: 16 }}>
              {t("join.demoCode", { code: demoCode })}
            </div>
          )}

          {resent && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              {t("join.resent")}
            </div>
          )}

          {errorKey && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {errorKey === "expired" ? t("join.expiredCode") : errorMessage(errorKey, locale)}
            </div>
          )}

          <form action={verifyAction} className="stack">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="email" value={email} />
            <div className="field">
              <label htmlFor="code">{t("join.verifyPlaceholder")}</label>
              <input
                id="code"
                name="code"
                className="input"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                minLength={6}
                required
                autoComplete="one-time-code"
                dir="ltr"
                style={{ letterSpacing: "0.6em", fontSize: 22, textAlign: "center", paddingBlock: 14 }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              {t("join.verifyButton")}
            </button>
          </form>

          <form action={resendCodeAction} style={{ marginTop: 14, textAlign: "center" }}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="email" value={email} />
            <button type="submit" className="btn btn-ghost">
              {t("join.resend")}
            </button>
          </form>

          <p className="tiny muted" style={{ textAlign: "center", marginTop: 8 }}>
            {locale === "ar"
              ? "إن لم يصل الرمز، ابحث عنه في مجلد الرسائل غير المرغوب فيها (Junk / Spam)."
              : "If it has not arrived, check your Junk or Spam folder."}
          </p>
        </div>
      </div>
    </div>
  );
}

function VolunteeringStep({
  locale,
  member,
  questions,
}: {
  locale: Locale;
  member: Member;
  questions: Awaited<ReturnType<typeof listVolunteerQuestions>>;
}) {
  const t = createTranslator(locale);
  return (
    <>
      <div className="wizard-card-head">
        <h1>{t("join.volunteeringTitle")}</h1>
        <p className="section-sub">{t("join.volunteeringBody")}</p>
      </div>
      <form action={volunteeringAction}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="to" value="general" />
        <div className="stack" style={{ gap: 26 }}>
          {questions.map((question) => (
            <fieldset key={question.id} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="field-label" style={{ marginBottom: 10 }}>
                {locale === "ar" ? question.promptAr : question.promptEn}
              </legend>
              <div className={question.options.length > 2 ? "stack" : "radio-grid"} style={{ gap: 10 }}>
                {question.options.map((option) => (
                  <label key={option.value} className="choice">
                    <input
                      type="radio"
                      name={`q_${question.key}`}
                      value={option.value}
                      defaultChecked={member.volunteerAnswers[question.key] === option.value}
                      required
                    />
                    <span>{locale === "ar" ? option.labelAr : option.labelEn}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" formAction={backAction} className="btn btn-secondary">
            {t("common.back")}
          </button>
          <button type="submit" className="btn btn-primary btn-lg">
            {t("join.finish")}
            <Check size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </>
  );
}

function errorMessage(key: string, locale: Locale): string {
  const t = createTranslator(locale);
  const map: Record<string, string> = {
    email_taken: t("join.emailTaken"),
    password_short: t("join.passwordShort"),
    password_mismatch: t("join.passwordMismatch"),
    pledge_required: t("join.pledgeRequired"),
    invalid: t("join.invalidCode"),
    expired: t("join.expiredCode"),
    email_invalid: locale === "ar" ? "أدخل بريداً إلكترونياً صحيحاً." : "Enter a valid email address.",
    location_required:
      locale === "ar" ? "اختر الدولة والولاية والمدينة أولاً." : "Select your country, state, and city first.",
    names_required: locale === "ar" ? "الاسم الأول واسم الأب واللقب مطلوبة." : "First name, father's name, and family name are required.",
    english_only: locale === "ar" ? "الأسماء يجب أن تكون بحروف إنجليزية فقط." : "Names must use English letters only.",
    personal_required: locale === "ar" ? "أكمل العنوان وتاريخ الميلاد ورقم الهاتف." : "Complete the address, birth date, and phone number.",
    marital_required: locale === "ar" ? "اختر حالتك الاجتماعية." : "Select your marital status.",
    children_count:
      locale === "ar" ? "عدد الأبناء لا يطابق حجم الأسرة." : "The number of children does not match the household size.",
    child_gender: locale === "ar" ? "اختر جنس الابن." : "Select your child's gender.",
    child_required: locale === "ar" ? "اسم الابن وتاريخ ميلاده مطلوبان." : "Your child's name and birth date are required.",
    job_required: locale === "ar" ? "اذكر عملك الحالي." : "Tell us your current work.",
    volunteer_required: locale === "ar" ? "أجب عن جميع أسئلة التطوع." : "Answer all the volunteering questions.",
    server_error: locale === "ar" ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "Something went wrong. Please try again.",
  };
  return map[key] ?? t("join.invalidCode");
}
