import { Suspense } from "react";
import { ReadNotificationPage } from "@/components/dashboard/NotificationPages";

export default function Page() {
  return (
    <Suspense>
      <ReadNotificationPage />
    </Suspense>
  );
}
