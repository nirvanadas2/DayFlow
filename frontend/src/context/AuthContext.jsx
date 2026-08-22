import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

const STORAGE_TOKEN = "dayflow_token";
const STORAGE_USER = "dayflow_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  });
  // Only relevant on first load, while we confirm a stored token is still valid.
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me(token)
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem(STORAGE_USER, JSON.stringify(freshUser));
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_USER);
      })
      .finally(() => setLoading(false));
    // Only run once on mount — this is a one-time "is the stored token still good" check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(STORAGE_TOKEN, nextToken);
    localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser));
  };

  const login = useCallback(async (identifier, password) => {
    const data = await api.login({ identifier, password });
    persist(data.token, data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await api.signup(payload);
    persist(data.token, data.user);
    return data.user;
  }, []);

  const changePassword = useCallback(
    async (newPassword) => {
      await api.changePassword({ newPassword }, token);
      setUser((prev) => {
        const next = { ...prev, mustChangePassword: false };
        localStorage.setItem(STORAGE_USER, JSON.stringify(next));
        return next;
      });
    },
    [token]
  );

  // Used by the Check In/Check Out button so the topnav/employee-grid dot
  // flips color immediately, without waiting on a full profile refetch.
  const updateAttendanceStatus = useCallback((status) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, attendanceStatus: status };
      localStorage.setItem(STORAGE_USER, JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, signup, changePassword, updateAttendanceStatus, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
