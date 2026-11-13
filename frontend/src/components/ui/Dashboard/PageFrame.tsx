import React, { ReactNode } from "react";
export function PageFrame({
  title,
  description,
  children,
  action,
  aside,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-3xl">
            <h1 className="text-2xl font-semibold tracking-tight text-balance text-[#18181B]">{title}</h1>
            {description ? <p className="mt-1 text-sm leading-6 text-[#71717A]">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {aside ? <div>{aside}</div> : null}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6">{children}</div>
      </div>
    </div>
  );
}
