import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, ApiUser, authApi, setToken, TOKEN_KEY } from "@/lib/api";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserFromToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    if (data.token) setToken(data.token);
    setUser(data);
  }, []);

  const register = useCallback(
    async (data: { username: string; email: string; password: string; fullName: string }) => {
      const result = await authApi.register(data);
      if (result.token) setToken(result.token);
      setUser(result);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Stateless JWT — clear client session even if API fails
    }
    setToken(null);
    setUser(null);
  }, []);

  const setUserFromToken = useCallback(
    async (token: string) => {
      setToken(token);
      await refreshUser();
    },
    [refreshUser]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      setUserFromToken,
    }),
    [user, loading, login, register, logout, refreshUser, setUserFromToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAuthOptional() {
  return useContext(AuthContext);
}

export { ApiError };
