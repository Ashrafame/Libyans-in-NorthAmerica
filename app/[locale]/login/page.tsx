import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { getCurrentMember } from "@/lib/auth";
import { isDemoMode } from "@/lib/storage";
import { loginAction } from "@/lib/actions/join";

export const metadata: Metadata = { title: "Sign in" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
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
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  const next = (Array.isArray(query.next) ? query.next[0] : query.next) ?? "";
  const completed = Boolean(query.completed);
  const reset = Boolean(query.reset);

  const member = await getCurrentMember();
  if (member && member.status === "active" && member.step === "done") {
    redirect(next && next.startsWith("/") ? next : `/${locale}/members`);
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div>
          <span
            className="hero-badge"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)", color: "#eaf2f7" }}
          >
            {locale === "ar" ? "مساحة الأعضاء" : "Members' area"}
          </span>
          <h2>
            {locale === "ar"
              ? "دليل العائلات، المقترحات، وصندوق ولايتك في مكان واحد."
              : "The family directory, the suggestion box, and your state's fund — in one place."}
          </h2>
          <p>{t("login.subtitle")}</p>
        </div>
        <div className="row" style={{ gap: 8, fontSize: 12.5, color: "rgba(234,242,247,.7)", position: "relative", zIndex: 1 }}>
          <Lock size={14} />
          {locale === "ar" ? "دخول آمن ومشفّر" : "Secure, encrypted sign-in"}
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <h1>{t("login.title")}</h1>
          <p className="section-sub">{t("login.subtitle")}</p>

          {completed && (
            <div className="alert alert-success" style={{ marginTop: 18 }}>
              {t("join.completeBody")}
            </div>
          )}
          {reset && (
            <div className="alert alert-success" style={{ marginTop: 18 }}>
              {t("reset.done")}
            </div>
          )}
          {error && (
            <div className="alert alert-error" style={{ marginTop: 18 }}>
              {error === "suspended" ? t("login.suspended") : error === "unverified" ? t("join.verifyBody", { email: "" }) : t("login.invalid")}
            </div>
          )}

          <form action={loginAction} className="auth-form">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="next" value={next} />
            <div className="field">
              <label htmlFor="email">{t("login.email")}</label>
              <input id="email" name="email" type="email" className="input" required autoComplete="email" dir="ltr" />
            </div>
            <div className="field">
              <div className="spread">
                <label htmlFor="password">{t("login.password")}</label>
                <Link href={`/${locale}/forgot-password`} className="tiny" style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {t("login.forgot")}
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              {t("login.button")}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>

          {isDemoMode && (
            <div className="alert alert-info" style={{ marginTop: 18 }}>
              <strong>{locale === "ar" ? "حساب تجريبي" : "Demo account"}:</strong>{" "}
              <span dir="ltr">ahmed.mansouri@example.com</span> / <span dir="ltr">Member12345!</span>
            </div>
          )}

          <div className="auth-foot">
            <span>
              {t("login.noAccount")}{" "}
              <Link href={`/${locale}/join`} style={{ color: "var(--accent)", fontWeight: 600 }}>
                {t("login.createAccount")}
              </Link>
            </span>
            <Link href="/admin" className="tiny" style={{ color: "var(--steel-soft)" }}>
              {t("login.adminLink")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
