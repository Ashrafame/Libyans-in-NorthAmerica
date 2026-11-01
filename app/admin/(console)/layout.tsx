import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarRange,
  FileText,
  Gauge,
  HeartHandshake,
  Inbox,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Palette,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Users,
  UserCog,
  Wallet,
} from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { canRead, type AdminSection } from "@/lib/rbac";
import { AdminLink } from "@/components/site/nav-link";
import { adminSignOut } from "@/lib/actions/admin";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Administrator",
  content_manager: "Content manager",
  events_manager: "Events manager",
  donations_manager: "Donations manager",
  viewer: "Observer",
};

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const groups: { label: string; items: { href: string; label: string; section: AdminSection; icon: ReactNode; exact?: boolean }[] }[] = [
    {
      label: "Overview",
      items: [{ href: "/admin", label: "Dashboard", section: "dashboard", icon: <Gauge size={16} />, exact: true }],
    },
    {
      label: "Site",
      items: [
        { href: "/admin/appearance", label: "Appearance", section: "appearance", icon: <Palette size={16} /> },
        { href: "/admin/content", label: "News & content", section: "content", icon: <FileText size={16} /> },
        { href: "/admin/events", label: "Events", section: "events", icon: <CalendarRange size={16} /> },
        { href: "/admin/members", label: "Members", section: "members", icon: <Users size={16} /> },
        { href: "/admin/proposals", label: "Suggestions", section: "proposals", icon: <Lightbulb size={16} /> },
      ],
    },
    {
      label: "Funds",
      items: [
        { href: "/admin/donations", label: "Donations", section: "donations", icon: <Wallet size={16} /> },
        { href: "/admin/funds", label: "Fund reports", section: "funds", icon: <ReceiptText size={16} /> },
        { href: "/admin/committee", label: "Committees", section: "committee", icon: <HeartHandshake size={16} /> },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/admin/volunteer", label: "Volunteer questions", section: "volunteer", icon: <Settings2 size={16} /> },
        { href: "/admin/admins", label: "Administrators", section: "admins", icon: <UserCog size={16} /> },
        { href: "/admin/audit", label: "Audit log", section: "audit", icon: <ShieldCheck size={16} /> },
      ],
    },
  ];

  return (
    <div className="admin-root">
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="admin-brand">
            <div className="admin-brand-mark">LNA</div>
            <div className="admin-brand-text">
              <strong>Community Console</strong>
              <span>Libyans in North America</span>
            </div>
          </div>

          {groups.map((group) => {
            const items = group.items.filter((item) => canRead(admin.role, item.section));
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                <div className="admin-nav-group">{group.label}</div>
                {items.map((item) => (
                  <AdminLink key={item.href} href={item.href} icon={item.icon} exact={item.exact}>
                    {item.label}
                  </AdminLink>
                ))}
              </div>
            );
          })}

          <div style={{ marginTop: "auto", paddingTop: 18 }}>
            <Link href="/" className="admin-link" title="Back to site" aria-label="Back to site" style={{ marginBottom: 4 }}>
              <LayoutGrid size={16} />
              <span>Back to site</span>
            </Link>
            <form action={adminSignOut}>
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="admin-link"
                style={{ width: "100%", background: "none", border: 0, cursor: "pointer", font: "inherit", textAlign: "start" }}
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </aside>

        <div className="admin-main">
          <div className="admin-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="admin-badge admin-badge-blue">{ROLE_LABEL[admin.role]}</span>
              <span style={{ fontSize: 12.5, color: "#8fa1af" }}>{admin.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/en" style={{ fontSize: 12.5, color: "#9fb2c0" }}>
                View public site
              </Link>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 99,
                  background: "#1c2a35",
                  border: "1px solid #2b3a46",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#9fd3f2",
                }}
              >
                {admin.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
          </div>

          <div className="admin-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
