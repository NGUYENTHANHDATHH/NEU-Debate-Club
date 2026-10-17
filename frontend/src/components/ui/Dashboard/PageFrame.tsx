import React, { ReactNode } from "react";
export function PageFrame({
  eyebrow,
  title,
  description,
  children,
  action,
  aside,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200/60 bg-white px-6 py-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#71717A]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight text-[#18181B] md:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#71717A] md:text-base">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {aside ? <div>{aside}</div> : null}
        <div className="grid gap-6">{children}</div>
      </div>
    </div>
  );
}
