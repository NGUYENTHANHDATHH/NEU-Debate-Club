import { Suspense } from "react";
import { MyFinancePage } from "@/components/dashboard/MyFinancePage";

// MyFinancePage đọc ?pay=<id> (PayOS trả về) bằng useSearchParams nên cần Suspense.
export default function Page() {
  return (
    <Suspense>
      <MyFinancePage />
    </Suspense>
  );
}
