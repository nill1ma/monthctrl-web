
"use client";

import { logout } from "@/app/services/auth/auth";
import { Button } from "@developmentsnil/awake-ui/button";
import "./styles.css";
import { usePathname } from "next/navigation";
import ToggleSwitch from "@/app/components/ui/ToggleSwitch/ToggleSwitch";

export default function Header() {
  async function handleLogout() {
    await logout();
  }

 const pathname = usePathname();

 const isLoggedIn = pathname !== '/login'

  return (
    <header className="header">
      <h1>Month Ctrl</h1>
      <div className="header-actions">
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