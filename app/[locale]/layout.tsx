import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { dirOf, isLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/repo";
import { getCurrentMember } from "@/lib/auth";
import { settingsCssVariables } from "@/lib/settings";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DocumentLocale } from "@/components/site/document-locale";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [settings, member] = await Promise.all([getSettings(), getCurrentMember()]);

  return (
    <div className="site-shell" lang={locale} dir={dirOf(locale)}>
      {/* Injected here (not in the root layout) so a client-side language
          switch immediately swaps fonts, colours, and radii for the new locale. */}
      <style>{`:root{${settingsCssVariables(settings, locale)}}`}</style>
      <DocumentLocale locale={locale} />
      <SiteHeader locale={locale} settings={settings} member={member} />
      <main id="main" className="site-main">
        {children}
      </main>
      <SiteFooter locale={locale} settings={settings} />
    </div>
  );
}
