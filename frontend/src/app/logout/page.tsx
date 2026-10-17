"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/userContext";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useUserContext();

  React.useEffect(() => {
    logout();
    router.replace("/");
  }, [logout, router]);

  return null;
}
