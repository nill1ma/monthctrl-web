"use client";

import { logout } from "@/app/services/auth/auth";
import { Button } from "@developmentsnil/awake-ui/button";
import "./styles.css";
import { usePathname } from "next/navigation";
import ToggleSwitch from "@/app/components/ui/ToggleSwitch/ToggleSwitch";
import { useLocale, type Locale } from "@/app/i18n/LocaleContext";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "pt", label: "PT" },
  { value: "es", label: "ES" },
];

export default function Header() {
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const isLoggedIn = pathname !== "/login";

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="header">
      <h1>Month Ctrl</h1>
      <div className="header-actions">
        <div className="locale-switcher">
          {LOCALES.map(({ value, label }) => (
            <button
              key={value}
              className={`locale-btn ${locale === value ? "locale-btn--active" : ""}`}
              onClick={() => setLocale(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <ToggleSwitch />
        <form action={handleLogout}>
          {isLoggedIn && (
            <Button variant="secondary" type="submit">
              Logout
            </Button>
          )}
        </form>
      </div>
    </header>
  );
}
