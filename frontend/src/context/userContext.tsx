"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import {
  API_BASE_URL,
  exchangeGoogleIdToken,
  exchangeLoginCode,
  fetchAccessibleModules,
} from "@/lib/api";
import type { AdminModuleKey } from "@/constants/dashboard-modules";

interface IUserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  department?: string;
  modules?: AdminModuleKey[];
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
        const authCode = urlParams.get("authCode");
        const loginSuccess = urlParams.get("loginSuccess");
        const googleError = urlParams.get("googleError");

        if (authCode || googleError || loginSuccess) {
          hasProcessedAuthRef.current = true;
          // Remove the single-use code from the address bar before redeeming it.
          const cleanParams = new URLSearchParams(urlParams);
          ["authCode", "token", "loginSuccess", "googleError"].forEach((key) =>
            cleanParams.delete(key),
          );
          const cleanSearch = cleanParams.toString();
          window.history.replaceState(
            null,
            "",
            window.location.pathname + (cleanSearch ? `?${cleanSearch}` : "") + window.location.hash,
          );

          if (googleError) {
            toast.error(`Đăng nhập Google thất bại: ${googleError}`, {
              id: "google-login-toast",
            });
          } else if (authCode && loginSuccess === "true") {
            try {
              const auth = await exchangeLoginCode(authCode);
              const u = auth.user;
              const profile: IUserProfile = {
                id: u.id ?? "",
                name: u.fullName,
                email: u.email,
                avatarUrl: u.avatarUrl ?? undefined,
                role: u.role ?? undefined,
                department: u.department ?? undefined,
                modules: await fetchAccessibleModules(auth.token).catch(() => []),
              };
              authService.saveSession(profile, auth.token);
              setUser(profile);
              setToken(auth.token);
              setIsAuthenticated(true);
              toast.success("Đăng nhập Google thành công.", {
                id: "google-login-toast",
              });
            } catch (exchangeError) {
              toast.error(
                exchangeError instanceof Error
                  ? exchangeError.message
                  : "Không thể hoàn tất đăng nhập.",
                { id: "google-login-toast" },
              );
            }
          }
        }
      }

      const response = authService.getCurrentSession();
      if (response) {
        // Hiện ngay phiên đã lưu rồi xác thực lại ở nền: menu và trang không phải chờ /auth/me + /auth/modules.
        setUser(response.user);
        setToken(response.token);
        setIsAuthenticated(true);
        setLoading(false);
        // Khách (Google ngoài CLB) không có /auth/me: token khách chỉ được máy chủ kiểm tra lúc đăng ký sự kiện.
        if (response.user.role === "guest") return;
        const [meResponse, modules] = await Promise.all([
          fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${response.token}` },
          }),
          fetchAccessibleModules(response.token).catch(() => response.user.modules ?? []),
        ]);
        if (!meResponse.ok) {
          authService.clearAuthData();
          throw new Error("Stored session is no longer authorized");
        }
        const body = await meResponse.json();
        const backendUser = body.data ?? body;
        const profile: IUserProfile = {
          id: backendUser.id,
          name: backendUser.fullName,
          email: backendUser.email,
          avatarUrl: backendUser.avatarUrl ?? undefined,
          role: backendUser.role ?? undefined,
          department: backendUser.department ?? undefined,
          modules,
        };
        authService.saveSession(profile, response.token);
        setUser(profile);
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

  async function login() {
    toast.error(
      "Đăng nhập bằng mật khẩu đã bị vô hiệu hóa. Vui lòng sử dụng Google Auth.",
    );
  }

  async function completeGoogleLogin(idToken: string) {
    const response = await exchangeGoogleIdToken(idToken);
    const backendUser = response.user;
    const profile: IUserProfile = {
      id: backendUser.id ?? "",
      name: backendUser.fullName,
      email: backendUser.email,
      avatarUrl: backendUser.avatarUrl ?? undefined,
      role: backendUser.role ?? undefined,
      department: backendUser.department ?? undefined,
      modules: await fetchAccessibleModules(response.token).catch(() => []),
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
      // Khách đăng nhập được ở header nhưng không phải thành viên: không vào trang quản trị.
      const isAuthorized = isAuthenticated && user && user.role !== "guest";
      if (!isAuthorized) {
        router.push("/");
        toast.error("Chỉ tài khoản đã đăng ký mới có quyền truy cập trang quản trị!");
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
