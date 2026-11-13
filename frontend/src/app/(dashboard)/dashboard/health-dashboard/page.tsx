import { Suspense } from "react";
import { HealthDashboardPage } from "@/components/dashboard/HealthDashboardPage";

// HealthDashboardPage đọc bộ lọc từ URL bằng useSearchParams nên cần Suspense.
export default function Page() {
  return (
    <Suspense>
      <HealthDashboardPage />
    </Suspense>
  );
}
