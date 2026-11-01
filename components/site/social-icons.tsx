import type { SiteSettings } from "@/lib/types";

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.4V21h3.1Z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15.2V8.8l5.2 3.2L10 15.2Z" />
    </svg>
  );
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.8a5.4 5.4 0 0 1-3.1-1V15a5.7 5.7 0 1 1-4.9-5.6v2.9a2.8 2.8 0 1 0 2 2.7V2h2.9a5.4 5.4 0 0 0 5.2 4.9v-1.1h-2.1Z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 3h3l-6.6 7.6L21.7 21h-6l-4.7-6.1L5.6 21h-3l7-8.1L2.6 3h6.1l4.3 5.6L17.5 3Zm-1 16.2h1.7L7.6 4.7H5.8l10.7 14.5Z" />
    </svg>
  );
}

export function SocialIcons({ settings, size = 16 }: { settings: SiteSettings; size?: number }) {
  const items = [
    { href: settings.facebookUrl, label: "Facebook", icon: <FacebookIcon size={size} /> },
    { href: settings.xUrl, label: "X", icon: <XIcon size={size} /> },
    { href: settings.instagramUrl, label: "Instagram", icon: <InstagramIcon size={size} /> },
    { href: settings.tiktokUrl, label: "TikTok", icon: <TikTokIcon size={size} /> },
    { href: settings.youtubeUrl, label: "YouTube", icon: <YoutubeIcon size={size} /> },
  ].filter((item) => Boolean(item.href));

  return (
    <div className="social-row">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
