import { Suspense } from "react";
import { PublicationsPage } from "@/components/dashboard/PublicationsPage";

// PublicationsPage đọc ?new=1 bằng useSearchParams nên cần Suspense.
export default function Page() {
  return (
    <Suspense>
      <PublicationsPage />
    </Suspense>
  );
}
