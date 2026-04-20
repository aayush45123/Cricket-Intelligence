import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ci_token"));
  const [loading, setLoading] = useState(true);

  /* On mount — verify token and load user */
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok) setUser(result.data.user);
        else logout();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Login failed");
    localStorage.setItem("ci_token", result.token);
    setToken(result.token);
    setUser(result.data.user);
    return result.data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Registration failed");
    localStorage.setItem("ci_token", result.token);
    setToken(result.token);
    setUser(result.data.user);
    return result.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ci_token");
    setToken(null);
    setUser(null);
  }, []);

  /* Authenticated fetch — automatically injects token */
  const authFetch = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.status === 401) logout();
      return { ok: res.ok, status: res.status, data };
    },
    [token, logout],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        authFetch,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
