import React, { ReactNode } from "react";
type ButtonVariant = "primary" | "ghost" | "outline";

export function ActionButton({
  children,
  icon,
  variant = "primary",
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:translate-y-px";
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-[#E11D48] text-white shadow-[0_10px_30px_-12px_rgba(225,29,72,0.45)] hover:bg-[#be123c]",
    ghost: "bg-transparent text-[#18181B] hover:bg-slate-100",
    outline:
      "border border-slate-200 bg-white text-[#18181B] hover:bg-slate-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
