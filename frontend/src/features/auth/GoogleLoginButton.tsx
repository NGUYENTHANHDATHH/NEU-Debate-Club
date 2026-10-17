"use client";

import React from "react";
import { API_BASE_URL } from "@/lib/api";

interface GoogleLoginButtonProps {
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ className }) => {
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const wrapperClassName =
    className ??
    "inline-flex min-h-11 items-center justify-center rounded-full border border-[#8A151B]/15 bg-white/90 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8A151B]/30 hover:shadow-[0_16px_34px_rgba(138,21,27,0.14)] dark:border-[#8A151B]/20 dark:bg-[#0A0A0A]/85 dark:text-white dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)] dark:hover:border-[#8A151B]/35 dark:hover:shadow-[0_18px_36px_rgba(0,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-60";

  const startGoogleLogin = React.useCallback(() => {
    const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const authUrl = `${API_BASE_URL}/auth/google/authorize?returnUrl=${encodeURIComponent(returnUrl)}`;

    setIsRedirecting(true);
    window.location.href = authUrl;
  }, []);

  return (
    <button
      type="button"
      onClick={startGoogleLogin}
      className={wrapperClassName}
      aria-label="Login with Google"
      disabled={isRedirecting}
    >
      <span className="whitespace-nowrap">
        {isRedirecting ? "Redirecting..." : "Login"}
      </span>
    </button>
  );
};

export default GoogleLoginButton;
