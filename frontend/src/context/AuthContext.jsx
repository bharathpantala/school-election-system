import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me(token);
        if (active) setUser(me);
      } catch {
        if (active) {
          setToken(null);
          localStorage.removeItem("token");
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCurrentUser();
    return () => {
      active = false;
    };
  }, [token]);

  const login = async (username, password) => {
    const { access_token } = await api.login({ username, password });
    localStorage.setItem("token", access_token);
    setToken(access_token);
    const me = await api.me(access_token);
    setUser(me);
  };

  const signup = async (firstName, lastName, username, password, adminPermissionCode) => {
    await api.signup({
      first_name: firstName,
      last_name: lastName,
      username,
      password,
      admin_permission_code: adminPermissionCode,
    });
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, loading, login, signup, logout }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
