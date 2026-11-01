import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import { createTranslator } from "@/lib/i18n";
import { resetPasswordAction } from "@/lib/actions/join";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
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
  const token = typeof query.token === "string" ? query.token : "";
  const error = typeof query.error === "string" ? query.error : undefined;

  return (
    <div className="container-narrow" style={{ paddingBlock: "clamp(48px,7vw,90px)" }}>
      <div className="wizard-card" style={{ maxWidth: 520, marginInline: "auto" }}>
        <h1 style={{ fontSize: 28 }}>{t("reset.title")}</h1>

        {error && (
          <div className="alert alert-error" style={{ marginTop: 18 }}>
            {error === "short" ? t("join.passwordShort") : t("reset.invalid")}
          </div>
        )}

        <form action={resetPasswordAction} className="auth-form">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="token" value={token} />
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
            <span className="field-hint">{t("join.passwordHint")}</span>
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {t("reset.button")}
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
