"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/types";

/**
 * The <html> element lives in the root layout, which is shared across locale
 * navigations. When the visitor switches language with a client-side link the
 * root layout is not re-rendered, so we sync lang/dir from the active locale.
 */
export function DocumentLocale({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
