"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useUserContext } from "@/context/userContext";

export default function CallbackPage() {
  const router = useRouter();
  const { setUser, loginWithGoogle } = useUserContext();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleCallback = () => {
      try {
        const hash = window.location.hash;
        if (!hash) {
          setErrorMsg("Không tìm thấy dữ liệu xác thực từ Google.");
          toast.error("Thiếu thông tin xác thực");
          return;
        }

        // Parse hash params
        const params = new URLSearchParams(hash.substring(1));
        const idToken = params.get("id_token");
        const accessToken = params.get("access_token");

        if (!idToken) {
          // Check if error exists in URL search params (e.g. access_denied)
          const searchParams = new URLSearchParams(window.location.search);
          const error = searchParams.get("error");
          if (error) {
            setErrorMsg(`Google từ chối yêu cầu: ${error}`);
          } else {
            setErrorMsg("Không thể xác minh mã thông báo ID từ Google.");
          }
          toast.error("Xác thực thất bại");
          return;
        }

        // Decode JWT ID Token
        const base64Url = idToken.split(".")[1];
        if (!base64Url) {
          throw new Error("Mã thông báo ID không đúng định dạng JWT");
        }

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
        );
        const payload = JSON.parse(jsonPayload);

        if (!payload.email) {
          throw new Error("Email không tồn tại trong thông tin Google cung cấp");
        }

        // Set user context
        setUser({
          id: payload.sub,
          name: payload.name || "Thành viên NDC",
          email: payload.email,
          avatarUrl: payload.picture,
          role: "member", // Default role
        });

        toast.success("Đăng nhập bằng Google thành công!");

        const email = payload.email.toLowerCase();
        const isValidNDCEmail = email.endsWith(".ndc.neu@gmail.com");

        if (isValidNDCEmail) {
          // Redirect to dashboard after a brief delay for UI smoothness
          setTimeout(() => {
            router.push("/dashboard");
          }, 1200);
        } else {
          // Redirect to home "/" for normal users
          setTimeout(() => {
            router.push("/");
          }, 1200);
        }

      } catch (err: any) {
        console.error("Callback authentication error:", err);
        setErrorMsg(err.message || "Đã xảy ra lỗi không xác định trong quá trình xác thực.");
        toast.error("Lỗi xử lý phản hồi đăng nhập");
      }
    };

    handleCallback();
  }, [router, setUser]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background ambient lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#8A151B]/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative text-center">
        {errorMsg ? (
          /* Error State UI */
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-950/50 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-500 animate-bounce" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight font-montserrat text-slate-100 mb-3">
              Xác thực Thất bại
            </h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={loginWithGoogle}
              className="w-full py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-[#8A151B] text-slate-200 hover:text-white font-semibold rounded-2xl transition-all duration-300 shadow-md animate-pulse"
            >
              Thử lại Đăng nhập
            </button>
          </div>
        ) : (
          /* Loading / Success State UI */
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#8A151B]/30 rounded-full blur-md animate-pulse"></div>
              <div className="relative w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-8 h-8 text-emerald-500 animate-pulse" />
              </div>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight font-montserrat text-slate-100 mb-2">
              Đang xác minh phiên làm việc
            </h2>
            <p className="text-sm text-slate-400 mb-8 max-w-xs leading-relaxed">
              Đang nhận dạng tài khoản Google của bạn...
            </p>

            {/* Premium custom loading spinner bar */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-[#8A151B] to-red-500 h-full rounded-full animate-loading-bar w-0"></div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
