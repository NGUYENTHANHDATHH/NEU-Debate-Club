"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { exchangeGoogleIdToken } from "@/lib/api";

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
  loginWithGoogle: () => void;
  logout: () => void;
}
interface IUserProviderProps {
  children: React.ReactNode;
}

const UserContext = React.createContext<IUserContext | undefined>(undefined);

export const UserProvider: React.FC<IUserProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const [user, setUser] = React.useState<IUserProfile | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  const isCallbackRoute = pathname === "/callback";

  async function fetchUser() {
    try {
      setLoading(true);
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

  async function login(email: string, password: string) {
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

  function loginWithGoogle() {
    if (typeof window === "undefined") return;
    const clientId =
      "1003932552081-k2kefin57d8o0b7affc829d8isch6kte.apps.googleusercontent.com";
    const redirectUri = window.location.origin + "/callback";
    const scope = "openid profile email";
    const responseType = "id_token token";
    const nonce = Math.random().toString(36).substring(2);

    const oauth2Url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${encodeURIComponent(responseType)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `nonce=${encodeURIComponent(nonce)}`;

    window.location.href = oauth2Url;
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

  // Fetch user on mount if not on the callback route
  React.useEffect(() => {
    if (!isCallbackRoute) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [pathname, isCallbackRoute]);

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
        loginWithGoogle,
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
