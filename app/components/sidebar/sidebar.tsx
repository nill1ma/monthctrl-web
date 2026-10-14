"use client";

import Link from "next/link";
import { useIntl } from "react-intl";
import "./styles.css";

export default function Sidebar() {
  const { formatMessage } = useIntl();

  return (
    <aside className="sidebar">
      <ul>
        <Link href="/list"><li className="sidebar-link">{formatMessage({ id: "sidebar.list" })}</li></Link>
        <Link href="/create"><li className="sidebar-link">{formatMessage({ id: "sidebar.create" })}</li></Link>
        <Link href="/profile"><li className="sidebar-link">{formatMessage({ id: "sidebar.profile" })}</li></Link>
      </ul>
    </aside>
  );
}
