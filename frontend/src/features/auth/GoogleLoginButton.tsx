"use client";

import React from "react";
import { useUserContext } from "@/context/userContext";

// Read client ID from environment (NEXT_PUBLIC_* is exposed to the client)
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google: any;
  }
}

const GoogleLoginButton: React.FC = () => {
  const { completeGoogleLogin } = useUserContext();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!clientId) {
      console.warn("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID env var");
      return;
    }

    const existing = document.getElementById("google-client-script");
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-client-script";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            const credential = response?.credential;
            if (!credential) return;
            try {
              await completeGoogleLogin(credential);
            } catch (err) {
              console.error("Failed to complete Google login:", err);
            }
          },
        });

        if (ref.current) {
          window.google.accounts.id.renderButton(ref.current, {
            theme: "outline",
            size: "medium",
            type: "standard",
          });
        }
      };
      document.body.appendChild(script);
    } else if (window.google && ref.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          const credential = response?.credential;
          if (!credential) return;
          try {
            await completeGoogleLogin(credential);
          } catch (err) {
            console.error("Failed to complete Google login:", err);
          }
        },
      });

      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "medium",
        type: "standard",
      });
    }

    return () => {};
  }, [completeGoogleLogin]);

  return <div ref={ref} />;
};

export default GoogleLoginButton;
