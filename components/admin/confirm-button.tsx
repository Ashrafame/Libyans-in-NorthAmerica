"use client";

export function ConfirmButton({
  children,
  className = "admin-btn admin-btn-danger admin-btn-sm",
  message = "Are you sure?",
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  message?: string;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
