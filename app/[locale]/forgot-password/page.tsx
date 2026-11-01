import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { isDemoMode } from "@/lib/storage";
import { forgotPasswordAction } from "@/lib/actions/join";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = createTranslator(locale);
  const query = await searchParams;
  const sent = Boolean(query.sent);
  const demo = typeof query.demo === "string" ? query.demo : undefined;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  return (
    <div className="container-narrow" style={{ paddingBlock: "clamp(48px,7vw,90px)" }}>
      <div className="wizard-card" style={{ maxWidth: 520, marginInline: "auto" }}>
        <h1 style={{ fontSize: 28 }}>{t("forgot.title")}</h1>
        <p className="section-sub">{t("forgot.subtitle")}</p>

        {sent && (
          <div className="alert alert-success" style={{ marginTop: 20 }}>
            {t("forgot.sent")}
            {isDemoMode && demo && (
              <div style={{ marginTop: 10 }}>
                <Link href={`/${locale}/reset-password?token=${encodeURIComponent(demo)}`} className="link-arrow">
                  {locale === "ar" ? "افتح رابط إعادة التعيين (وضع التجربة)" : "Open the reset link (demo mode)"}
                  {locale === "ar" ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                </Link>
              </div>
            )}
          </div>
        )}

        <form action={forgotPasswordAction} className="auth-form">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="origin" value={origin} />
          <div className="field">
            <label htmlFor="email">{t("login.email")}</label>
            <input id="email" name="email" type="email" className="input" required autoComplete="email" dir="ltr" />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {t("forgot.button")}
          </button>
        </form>

        <div className="auth-foot">
          <Link href={`/${locale}/login`} style={{ color: "var(--accent)", fontWeight: 600 }}>
            {t("forgot.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
