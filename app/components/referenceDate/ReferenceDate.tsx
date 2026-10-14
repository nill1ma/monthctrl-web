"use client";

import { useLocale } from "@/app/i18n/LocaleContext";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-ES",
};

export default function ReferenceDate({ reference, format = "long" }: { reference: string; format?: "long" | "short" }) {
  const { locale } = useLocale();
  const [year, month] = reference.split("-");
  return new Date(`${year}-${Number(month)}`).toLocaleString(LOCALE_MAP[locale] ?? "en-US", {
    month: format,
    year: "numeric",
  });
}
