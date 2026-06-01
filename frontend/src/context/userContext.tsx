"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

interface IUserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

const authService = {
  getCurrentUser(): IUserProfile | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem("ndc_user");
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  saveCurrentUser(user: IUserProfile): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("ndc_user", JSON.stringify(user));
  },
  clearAuthData(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("ndc_user");
  },
};

interface IUserContext {
  user: IUserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUserProfile | null>>;
  login: (email: string, password: string) => Promise<void>;
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
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  const isCallbackRoute = pathname === "/callback";

  async function fetchUser() {
    try {
      setLoading(true);
      const response = authService.getCurrentUser();
      if (response) {
        setUser(response);
        setIsAuthenticated(true);
      } else {
        setUser(null);
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
    toast.error("Đăng nhập bằng mật khẩu đã bị vô hiệu hóa. Vui lòng sử dụng Google Auth.");
  }

  function loginWithGoogle() {
    if (typeof window === "undefined") return;
    const clientId = "1003932552081-k2kefin57d8o0b7affc829d8isch6kte.apps.googleusercontent.com";
    const redirectUri = window.location.origin + "/callback";
    const scope = "openid profile email";
    const responseType = "id_token token";
    const nonce = Math.random().toString(36).substring(2);

    const oauth2Url = `https://accounts.google.com/o/oauth2/v2/auth?` +
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
    setIsAuthenticated(false);
    router.push("/");
  }

  // Reactively sync user changes to localStorage and update authentication status
  React.useEffect(() => {
    if (user) {
      authService.saveCurrentUser(user);
      setIsAuthenticated(true);
    } else {
      if (!loading) {
        authService.clearAuthData();
        setIsAuthenticated(false);
      }
    }
  }, [user, loading]);

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
        loading,
        isAuthenticated,
        setUser,
        login,
        loginWithGoogle,
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
