"use client";

import { IntlProvider } from "react-intl";
import { en } from "./en";
import { pt } from "./pt";
import { es } from "./es";
import { LocaleProvider, useLocale } from "./LocaleContext";

const messages = { en, pt, es };

function IntlWrapper({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  );
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <IntlWrapper>{children}</IntlWrapper>
    </LocaleProvider>
  );
}
