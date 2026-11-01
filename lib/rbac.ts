import type { AdminRole } from "./types";

export type AdminSection =
  | "dashboard"
  | "appearance"
  | "content"
  | "events"
  | "members"
  | "proposals"
  | "donations"
  | "funds"
  | "committee"
  | "volunteer"
  | "admins"
  | "audit";

const READ: Record<AdminSection, AdminRole[]> = {
  dashboard: ["super_admin", "admin", "content_manager", "events_manager", "donations_manager", "viewer"],
  appearance: ["super_admin", "admin"],
  content: ["super_admin", "admin", "content_manager", "viewer"],
  events: ["super_admin", "admin", "content_manager", "events_manager", "viewer"],
  members: ["super_admin", "admin", "viewer"],
  proposals: ["super_admin", "admin", "content_manager", "viewer"],
  donations: ["super_admin", "admin", "donations_manager", "viewer"],
  funds: ["super_admin", "admin", "donations_manager", "viewer"],
  committee: ["super_admin", "admin", "donations_manager", "viewer"],
  volunteer: ["super_admin", "admin", "content_manager"],
  admins: ["super_admin"],
  audit: ["super_admin"],
};

const WRITE_EXCEPTIONS: Partial<Record<AdminSection, AdminRole[]>> = {
  content: ["super_admin", "admin", "content_manager"],
  events: ["super_admin", "admin", "content_manager", "events_manager"],
  members: ["super_admin", "admin"],
  proposals: ["super_admin", "admin", "content_manager"],
  donations: ["super_admin", "admin", "donations_manager"],
  funds: ["super_admin", "admin", "donations_manager"],
  committee: ["super_admin", "admin", "donations_manager"],
  volunteer: ["super_admin", "admin", "content_manager"],
  appearance: ["super_admin", "admin"],
  admins: ["super_admin"],
};

export function canRead(role: AdminRole, section: AdminSection): boolean {
  return READ[section].includes(role);
}

export function canWrite(role: AdminRole, section: AdminSection): boolean {
  if (role === "viewer") return false;
  const list = WRITE_EXCEPTIONS[section] ?? READ[section];
  return list.includes(role);
}

export const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "content_manager",
  "events_manager",
  "donations_manager",
  "viewer",
];

export const SECTION_FOR_PATH: Record<string, AdminSection> = {
  "": "dashboard",
  appearance: "appearance",
  content: "content",
  events: "events",
  members: "members",
  proposals: "proposals",
  donations: "donations",
  funds: "funds",
  committee: "committee",
  volunteer: "volunteer",
  admins: "admins",
  audit: "audit",
};
