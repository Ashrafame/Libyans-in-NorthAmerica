"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  children,
  exact = false,
  onClick,
}: {
  href: string;
  children: ReactNode;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className="nav-link" data-active={active ? "true" : "false"} onClick={onClick}>
      {children}
    </Link>
  );
}

export function SideLink({
  href,
  children,
  icon,
  exact = false,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className="side-link" data-active={active ? "true" : "false"}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export function AdminLink({
  href,
  children,
  icon,
  exact = false,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const label = typeof children === "string" ? children : undefined;
  return (
    <Link
      href={href}
      className="admin-link"
      data-active={active ? "true" : "false"}
      title={label}
      aria-label={label}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
