"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { API_BASE_URL, exchangeGoogleIdToken } from "@/lib/api";

interface IUserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

interface IAuthSession {
  user: IUserProfile;
  token: string;
}

const authService = {
  getCurrentSession(): IAuthSession | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem("ndc_user");
    const token = localStorage.getItem("ndc_token");
    if (!data || !token) return null;
    try {
      return {
        user: JSON.parse(data),
        token,
      };
    } catch {
      return null;
    }
  },
  saveSession(user: IUserProfile, token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("ndc_user", JSON.stringify(user));
    localStorage.setItem("ndc_token", token);
  },
  clearAuthData(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("ndc_user");
    localStorage.removeItem("ndc_token");
  },
};

interface IUserContext {
  user: IUserProfile | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUserProfile | null>>;
  login: (email: string, password: string) => Promise<void>;
  completeGoogleLogin: (idToken: string) => Promise<IUserProfile>;
  logout: () => void;
}
interface IUserProviderProps {
  children: React.ReactNode;
}

const UserContext = React.createContext<IUserContext | undefined>(undefined);

export const UserProvider: React.FC<IUserProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<IUserProfile | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const hasProcessedAuthRef = React.useRef<boolean>(false);

  async function fetchUser() {
    try {
      setLoading(true);
      if (typeof window !== "undefined" && !hasProcessedAuthRef.current) {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get("token");
        const loginSuccess = urlParams.get("loginSuccess");
        const googleError = urlParams.get("googleError");

        if (tokenParam || googleError || loginSuccess) {
          hasProcessedAuthRef.current = true;
          if (googleError) {
            toast.error(`Đăng nhập Google thất bại: ${googleError}`, {
              id: "google-login-toast",
            });
          } else if (tokenParam && loginSuccess === "true") {
            localStorage.setItem("ndc_token", tokenParam);
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${tokenParam}` },
            });
            if (res.ok) {
              const body = await res.json();
              const u = body.data ?? body;
              const profile: IUserProfile = {
                id: u.id,
                name: u.fullName,
                email: u.email,
                avatarUrl: u.avatarUrl ?? undefined,
                role: u.role ?? undefined,
              };
              authService.saveSession(profile, tokenParam);
              setUser(profile);
              setToken(tokenParam);
              setIsAuthenticated(true);
              toast.success("Đăng nhập Google thành công.", {
                id: "google-login-toast",
              });
            }
          }

          urlParams.delete("token");
          urlParams.delete("loginSuccess");
          urlParams.delete("googleError");
          const newSearch = urlParams.toString();
          const cleanUrl =
            window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
          window.history.replaceState(null, "", cleanUrl);
        }
      }

      const response = authService.getCurrentSession();
      if (response) {
        setUser(response.user);
        setToken(response.token);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function login(_email: string, _password: string) {
    toast.error(
      "Đăng nhập bằng mật khẩu đã bị vô hiệu hóa. Vui lòng sử dụng Google Auth.",
    );
  }

  async function completeGoogleLogin(idToken: string) {
    const response = await exchangeGoogleIdToken(idToken);
    const backendUser = response.user;
    const profile: IUserProfile = {
      id: backendUser.id,
      name: backendUser.fullName,
      email: backendUser.email,
      avatarUrl: backendUser.avatarUrl ?? undefined,
      role: backendUser.role ?? undefined,
    };

    authService.saveSession(profile, response.token);
    setUser(profile);
    setToken(response.token);
    setIsAuthenticated(true);
    return profile;
  }

  function logout() {
    authService.clearAuthData();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    router.push("/");
  }

  React.useEffect(() => {
    if (user && token) {
      authService.saveSession(user, token);
      setIsAuthenticated(true);
    } else {
      if (!loading) {
        setIsAuthenticated(false);
      }
    }
  }, [user, token, loading]);

  // Fetch user on mount
  React.useEffect(() => {
    fetchUser();
  }, []);

  // Redirect to home "/" if trying to access any route under "/dashboard" and not authorized
  React.useEffect(() => {
    if (!loading && pathname.startsWith("/dashboard")) {
      const isAuthorized =
        isAuthenticated &&
        user?.email?.toLowerCase().endsWith(".ndc.neu@gmail.com");
      if (!isAuthorized) {
        router.push("/");
        toast.error("Chỉ thành viên NDC mới có quyền truy cập trang quản trị!");
      }
    }
  }, [isAuthenticated, user, loading, pathname, router]);

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        setUser,
        login,
        completeGoogleLogin,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): IUserContext => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
