"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { canAccessDashboardPath } from "@/constants/dashboard-modules";
import { useUserContext } from "@/context/userContext";

export function DashboardAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user } = useUserContext();

  useEffect(() => {
    if (!loading && user && !canAccessDashboardPath(pathname, user.modules)) {
      router.replace(ROUTES.dashboard);
    }
  }, [loading, pathname, router, user]);

  return children;
}
