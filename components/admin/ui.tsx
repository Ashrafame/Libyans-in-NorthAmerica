import type { ReactNode } from "react";

export function AdminHead({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

export function AdminPanel({
  title,
  actions,
  children,
  style,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section className="admin-panel" style={style}>
      {(title || actions) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {title && <h2 style={{ fontSize: 14, fontWeight: 600, color: "#cfdae3" }}>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function AField({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  hint,
  span,
  dir,
  children,
}: {
  label: string;
  name?: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  span?: boolean;
  dir?: "ltr" | "rtl";
  children?: ReactNode;
}) {
  return (
    <div className="admin-field" style={span ? { gridColumn: "1 / -1" } : undefined}>
      <label htmlFor={name}>{label}</label>
      {children ?? (
        <input
          id={name}
          name={name}
          type={type}
          className="admin-input"
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          dir={dir}
        />
      )}
      {hint && <span className="admin-note">{hint}</span>}
    </div>
  );
}

export function ATextarea({
  label,
  name,
  defaultValue,
  rows = 4,
  span,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  span?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="admin-field" style={span ? { gridColumn: "1 / -1" } : undefined}>
      <label htmlFor={name}>{label}</label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        className="admin-textarea"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ASelect({
  label,
  name,
  defaultValue,
  options,
  span,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  span?: boolean;
}) {
  return (
    <div className="admin-field" style={span ? { gridColumn: "1 / -1" } : undefined}>
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} className="admin-select" defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function StatusBadge({
  tone = "default",
  children,
}: {
  tone?: "default" | "green" | "amber" | "red" | "blue";
  children: ReactNode;
}) {
  const className =
    tone === "green"
      ? "admin-badge admin-badge-green"
      : tone === "amber"
        ? "admin-badge admin-badge-amber"
        : tone === "red"
          ? "admin-badge admin-badge-red"
          : tone === "blue"
            ? "admin-badge admin-badge-blue"
            : "admin-badge";
  return <span className={className}>{children}</span>;
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "28px 18px",
        textAlign: "center",
        color: "#8fa1af",
        fontSize: 13,
        border: "1px dashed #26323c",
        borderRadius: 8,
      }}
    >
      {children}
    </div>
  );
}

export function AdminNotice({ tone, children }: { tone: "ok" | "error" | "info"; children: ReactNode }) {
  const colors =
    tone === "ok"
      ? { border: "#22503c", background: "#142b22", color: "#9fe0bd" }
      : tone === "error"
        ? { border: "#552b2b", background: "#2b1717", color: "#f0a09a" }
        : { border: "#24485f", background: "#142733", color: "#a9d9f5" };
  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: colors.color,
        padding: "10px 14px",
        borderRadius: 8,
        fontSize: 12.5,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}
