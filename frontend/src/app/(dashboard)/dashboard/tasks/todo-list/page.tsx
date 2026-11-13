import { Suspense } from "react";
import { TodoListPage } from "@/components/dashboard/TodoListPage";

export default function Page() {
  return (
    <Suspense>
      <TodoListPage />
    </Suspense>
  );
}
