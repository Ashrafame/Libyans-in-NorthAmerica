import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/cairo";
import "./globals.css";
import { normalizeLocale, dirOf } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Libyans in North America",
    template: "%s · Libyans in North America",
  },
  description:
    "Connecting Libyan families across the United States and Canada — our people, skills, stories, and the work we do together.",
  openGraph: {
    title: "Libyans in North America",
    description: "One community across two countries — a home away from home.",
    images: ["/images/og.jpg"],
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0067b8",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const locale = normalizeLocale(headerList.get("x-lna-locale"));

  return (
    <html lang={locale} dir={dirOf(locale)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main">
          {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
        </a>
        {children}
      </body>
    </html>
  );
}
