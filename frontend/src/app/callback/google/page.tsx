"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserContext } from "@/context/userContext";

function parseGoogleHash(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { completeGoogleLogin } = useUserContext();

  React.useEffect(() => {
    const params = parseGoogleHash();
    const idToken = params.get("id_token");
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    const returnUrl = sessionStorage.getItem("ndc_google_return_url") || "/";

    async function finishLogin() {
      if (error) {
        toast.error(
          errorDescription || "Đăng nhập Google bị hủy hoặc thất bại.",
        );
        router.replace(returnUrl);
        return;
      }

      if (!idToken) {
        toast.error("Không nhận được token đăng nhập từ Google.");
        router.replace(returnUrl);
        return;
      }

      try {
        await completeGoogleLogin(idToken);
        toast.success("Đăng nhập Google thành công.");
        router.replace(returnUrl);
      } catch (loginError) {
        console.error("Failed to exchange Google token:", loginError);
        toast.error("Không thể hoàn tất đăng nhập Google.");
        router.replace(returnUrl);
      } finally {
        sessionStorage.removeItem("ndc_google_return_url");
        sessionStorage.removeItem("ndc_google_nonce");
      }
    }

    void finishLogin();
  }, [completeGoogleLogin, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
      <div className="max-w-sm text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8A151B] mb-3">
          Google Login
        </p>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Đang xử lý đăng nhập
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vui lòng chờ trong giây lát, hệ thống sẽ đưa bạn về trang trước đó.
        </p>
      </div>
    </div>
  );
}
