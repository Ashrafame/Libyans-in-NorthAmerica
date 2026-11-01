import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { isDemoMode } from "@/lib/storage";
import { adminLoginAction } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Console sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  return (
    <div className="admin-root">
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="admin-brand" style={{ borderBottom: 0, padding: 0, marginBottom: 22 }}>
            <div className="admin-brand-mark">LNA</div>
            <div className="admin-brand-text">
              <strong>Community Console</strong>
              <span>Libyans in North America</span>
            </div>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Administration sign in</h1>
          <p className="admin-note" style={{ marginBottom: 22 }}>
            This console is independent of the public site and its appearance settings.
          </p>

          {error && (
            <div
              style={{
                border: "1px solid #552b2b",
                background: "#2b1717",
                color: "#f0a09a",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                marginBottom: 16,
              }}
            >
              {error === "inactive" ? "This administrator account is inactive." : "Those credentials were not accepted."}
            </div>
          )}

          <form action={adminLoginAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="admin-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="admin-input" required autoComplete="email" dir="ltr" />
            </div>
            <div className="admin-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="admin-input"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" style={{ justifyContent: "center", marginTop: 4 }}>
              <Lock size={14} />
              Sign in to console
            </button>
          </form>

          {isDemoMode && (
            <div className="admin-note" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #26323c" }}>
              Demo super admin: <span dir="ltr">admin@libyansna.org</span> / <span dir="ltr">Admin12345!</span>
              <br />
              Change this password after your first sign-in.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
