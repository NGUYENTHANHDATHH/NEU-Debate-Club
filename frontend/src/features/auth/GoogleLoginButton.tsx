"use client";

import React from "react";
import { useUserContext } from "@/context/userContext";

// Import client config (local JSON provided in repo)
import clientConfig from "../../../client_secret_1003932552081-k2kefin57d8o0b7affc829d8isch6kte.apps.googleusercontent.com.json";

declare global {
  interface Window {
    google: any;
  }
}

const GoogleLoginButton: React.FC = () => {
  const { setUser } = useUserContext();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const clientId = clientConfig?.web?.client_id;
    if (!clientId) return;

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
          callback: (response: any) => {
            const credential = response?.credential;
            if (!credential) return;
            try {
              const base64Url = credential.split(".")[1];
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map(function (c) {
                    return (
                      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                    );
                  })
                  .join(""),
              );
              const payload = JSON.parse(jsonPayload);

              setUser({
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                avatarUrl: payload.picture,
              });
            } catch (err) {
              console.error("Failed to parse Google credential:", err);
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
        callback: (response: any) => {
          const credential = response?.credential;
          if (!credential) return;
          try {
            const base64Url = credential.split(".")[1];
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

            setUser({
              id: payload.sub,
              name: payload.name,
              email: payload.email,
              avatarUrl: payload.picture,
            });
          } catch (err) {
            console.error("Failed to parse Google credential:", err);
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
  }, [setUser]);

  return <div ref={ref} />;
};

export default GoogleLoginButton;
