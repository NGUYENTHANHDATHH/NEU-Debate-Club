import { Suspense } from "react";
import { FinancePage } from "@/components/dashboard/FinancePage";

// FinancePage đọc ?new=1 bằng useSearchParams nên cần Suspense.
export default function Page() {
  return (
    <Suspense>
      <FinancePage />
    </Suspense>
  );
}
