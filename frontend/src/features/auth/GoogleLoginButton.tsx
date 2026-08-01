"use client";

import React from "react";
import { useUserContext } from "@/context/userContext";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface CredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (configuration: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-client-script") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Identity failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = "google-client-script";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity failed to load"));
    document.body.appendChild(script);
  });

  return googleScriptPromise;
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  const { completeGoogleLogin } = useUserContext();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    const buttonContainer = ref.current;
    void loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google || !buttonContainer) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response.credential) return;
            try {
              await completeGoogleLogin(response.credential);
              onSuccess?.();
            } catch (error) {
              console.error("Failed to complete Google login:", error);
            }
          },
        });
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          type: "standard",
        });
      })
      .catch((error: unknown) => console.error("Failed to load Google Identity:", error));

    return () => {
      cancelled = true;
      buttonContainer?.replaceChildren();
    };
  }, [completeGoogleLogin, onSuccess]);

  if (!clientId) {
    return <button disabled>Google login unavailable</button>;
  }

  return <div ref={ref} aria-label="Sign in with Google" />;
};

export default GoogleLoginButton;
