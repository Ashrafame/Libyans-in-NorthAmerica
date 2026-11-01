"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import type { Locale } from "@/lib/types";

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || `/${locale}`;
  const params = useSearchParams();
  const other: Locale = locale === "ar" ? "en" : "ar";
  const segments = pathname.split("/");
  segments[1] = other;
  const query = params.toString();
  return (
    <Link href={`${segments.join("/")}${query ? `?${query}` : ""}`} className="lang-switch" aria-label={label}>
      <Languages size={15} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
