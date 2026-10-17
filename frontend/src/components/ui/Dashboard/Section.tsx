import React, { ReactNode } from "react";

type SectionProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Section({
  title,
  subtitle,
  action,
  children,
  className,
}: SectionProps) {
  return (
    <section
      className={`rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] ${className ?? ""}`}
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#18181B]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#71717A]">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
