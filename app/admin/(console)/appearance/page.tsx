import { getCurrentAdmin } from "@/lib/auth";
import { canRead } from "@/lib/rbac";
import { getSettings } from "@/lib/repo";
import { formatDate } from "@/lib/format";
import { saveAppearanceAction } from "@/lib/actions/admin";
import { AField, ATextarea, AdminHead, AdminNotice, AdminPanel } from "@/components/admin/ui";

export default async function AppearancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const query = await searchParams;
  const saved = Boolean(query.saved);
  const settings = await getSettings();

  if (!canRead(admin.role, "appearance")) {
    return <AdminNotice tone="error">Your role does not have access to appearance settings.</AdminNotice>;
  }

  return (
    <>
      <AdminHead
        title="Site appearance"
        sub="These controls change the public site only. The console keeps its own fixed design and is never affected."
      />

      {saved && <AdminNotice tone="ok">Appearance settings saved.</AdminNotice>}

      <form action={saveAppearanceAction}>
        <AdminPanel title="Identity" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-2">
            <AField label="Site title (English)" name="titleEn" defaultValue={settings.titleEn} required />
            <AField label="Site title (Arabic)" name="titleAr" defaultValue={settings.titleAr} required />
            <AField label="Tagline (English)" name="taglineEn" defaultValue={settings.taglineEn} />
            <AField label="Tagline (Arabic)" name="taglineAr" defaultValue={settings.taglineAr} />
            <AField label="Membership CTA (English)" name="membershipCtaEn" defaultValue={settings.membershipCtaEn} />
            <AField label="Membership CTA (Arabic)" name="membershipCtaAr" defaultValue={settings.membershipCtaAr} />
          </div>
        </AdminPanel>

        <AdminPanel title="Hero" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-2">
            <AField
              label="Hero image URL"
              name="heroImage"
              defaultValue={settings.heroImage}
              span
              hint="Use a path such as /images/hero.jpg or a full https URL."
            />
            <AField label="Hero badge (English)" name="heroBadgeEn" defaultValue={settings.heroBadgeEn} />
            <AField label="Hero badge (Arabic)" name="heroBadgeAr" defaultValue={settings.heroBadgeAr} />
            <AField label="Hero title (English)" name="heroTitleEn" defaultValue={settings.heroTitleEn} />
            <AField label="Hero title (Arabic)" name="heroTitleAr" defaultValue={settings.heroTitleAr} />
            <ATextarea label="Hero subtitle (English)" name="heroSubtitleEn" defaultValue={settings.heroSubtitleEn} rows={3} />
            <ATextarea label="Hero subtitle (Arabic)" name="heroSubtitleAr" defaultValue={settings.heroSubtitleAr} rows={3} />
          </div>
        </AdminPanel>

        <AdminPanel title="Colours" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-3">
            {[
              { name: "accentColor", label: "Accent", value: settings.accentColor },
              { name: "accentDarkColor", label: "Accent (dark)", value: settings.accentDarkColor },
              { name: "inkColor", label: "Text colour", value: settings.inkColor },
              { name: "canvasColor", label: "Page background", value: settings.canvasColor },
              { name: "mutedColor", label: "Muted surface", value: settings.mutedColor },
            ].map((color) => (
              <div className="admin-field" key={color.name}>
                <label htmlFor={color.name}>{color.label}</label>
                <div className="admin-color-row">
                  <input id={color.name} name={color.name} type="color" defaultValue={color.value} />
                  <input
                    className="admin-input"
                    value={color.value}
                    readOnly
                    dir="ltr"
                    style={{ fontFamily: "monospace", fontSize: 12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Typography" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-2">
            <AField label="Heading font (English)" name="headingFontEn" defaultValue={settings.headingFontEn} hint="Default: Tahoma" />
            <AField label="Heading font (Arabic)" name="headingFontAr" defaultValue={settings.headingFontAr} hint="Default: Cairo" />
            <AField label="Body font (English)" name="bodyFontEn" defaultValue={settings.bodyFontEn} hint="Default: Tahoma" />
            <AField label="Body font (Arabic)" name="bodyFontAr" defaultValue={settings.bodyFontAr} hint="Default: Cairo" />
            <AField label="Heading size (px)" name="headingSize" type="number" defaultValue={settings.headingSize} />
            <AField label="Body size (px)" name="bodySize" type="number" defaultValue={settings.bodySize} />
          </div>
        </AdminPanel>

        <AdminPanel title="Cards & buttons" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-3">
            <AField label="Card radius (px)" name="cardRadius" type="number" defaultValue={settings.cardRadius} />
            <AField label="Button radius (px)" name="buttonRadius" type="number" defaultValue={settings.buttonRadius} />
            <AField label="Input radius (px)" name="inputRadius" type="number" defaultValue={settings.inputRadius} />
          </div>
        </AdminPanel>

        <AdminPanel title="Footer & contact" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-2">
            <ATextarea label="Footer text (English)" name="footerAboutEn" defaultValue={settings.footerAboutEn} rows={3} />
            <ATextarea label="Footer text (Arabic)" name="footerAboutAr" defaultValue={settings.footerAboutAr} rows={3} />
            <AField label="Public contact email" name="contactEmail" type="email" defaultValue={settings.contactEmail} />
            <AField label="Administration email" name="adminEmail" type="email" defaultValue={settings.adminEmail} />
            <ATextarea label="Phone numbers (one per line)" name="phones" defaultValue={settings.phones.join("\n")} rows={3} span />
          </div>
        </AdminPanel>

        <AdminPanel title="Social media" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-2">
            <AField label="Facebook URL" name="facebookUrl" defaultValue={settings.facebookUrl} />
            <AField label="X URL" name="xUrl" defaultValue={settings.xUrl} />
            <AField label="Instagram URL" name="instagramUrl" defaultValue={settings.instagramUrl} />
            <AField label="TikTok URL" name="tiktokUrl" defaultValue={settings.tiktokUrl} />
            <AField label="YouTube URL" name="youtubeUrl" defaultValue={settings.youtubeUrl} />
          </div>
        </AdminPanel>

        <AdminPanel title="Community fund" style={{ marginBottom: 16 }}>
          <div className="admin-grid admin-grid-2">
            <AField
              label="Monthly contribution cap (cents)"
              name="monthlyCapCents"
              type="number"
              defaultValue={settings.monthlyCapCents}
              hint="1000 = $10.00 per family per month."
            />
            <div className="admin-field">
              <label htmlFor="tickerEnabled">Scrolling notice</label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#cfdae3", marginTop: 6 }}>
                <input type="checkbox" name="tickerEnabled" defaultChecked={settings.tickerEnabled} />
                Show event tickers on the public site
              </label>
            </div>
          </div>
        </AdminPanel>

        {admin.role === "super_admin" && (
          <AdminPanel title="Bank account on file" style={{ marginBottom: 16 }}>
            <p className="admin-note" style={{ marginBottom: 14 }}>
              Visible to the super admin only. These details are never exposed on the public site.
            </p>
            <div className="admin-grid admin-grid-2">
              <AField label="Account holder" name="stripeAccountHolder" defaultValue={settings.stripeAccountHolder} />
              <AField label="Account number" name="stripeAccountNumber" defaultValue={settings.stripeAccountNumber} />
              <AField label="Routing number" name="stripeRoutingNumber" defaultValue={settings.stripeRoutingNumber} />
            </div>
          </AdminPanel>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span className="admin-note">
            Last updated by {settings.updatedBy ?? "—"} on {formatDate(settings.updatedAt, "en")}
          </span>
          <button type="submit" className="admin-btn admin-btn-primary">
            Save appearance
          </button>
        </div>
      </form>
    </>
  );
}
