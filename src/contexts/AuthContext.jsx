import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import {
  AUTH_EXPIRED_EVENT,
  clearStoredAuth,
  getStoredAuth,
  getTokenExpiryTimeMs,
  persistAuth,
} from '../auth/authStorage';

const AuthContext = createContext(null);

// Usage: bọc ở root <AuthProvider><App /></AuthProvider>, dùng hook useAuth() trong component con.

function normalizeLoginResponse(response) {
  const data = response?.data?.data ?? {};
  const user = data.user || {};

  return {
    accessToken: data.access_token || '',
    tokenType: data.token_type || 'Bearer',
    expiresIn: data.expires_in || '',
    user: {
      username: user.username || '',
      role: user.role || '',
    },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredAuth());

  const login = useCallback(async (username, password) => {
    const response = await authApi.login({ username, password });
    const nextSession = normalizeLoginResponse(response);

    if (!nextSession.accessToken || !nextSession.user.role) {
      throw new Error('Dữ liệu đăng nhập không hợp lệ');
    }

    persistAuth(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setSession(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleExpiredSession = () => {
      setSession(null);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!session?.accessToken) return undefined;

    const expiresAtMs = getTokenExpiryTimeMs(session.accessToken);
    if (!expiresAtMs) return undefined;

    const remainingMs = expiresAtMs - Date.now();
    if (remainingMs <= 0) {
      logout();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      logout();
    }, remainingMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [logout, session?.accessToken]);

  const value = useMemo(() => ({
    user: session?.user || null,
    role: session?.user?.role || '',
    isAuthenticated: Boolean(session?.accessToken),
    accessToken: session?.accessToken || '',
    login,
    logout,
  }), [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng trong AuthProvider');
  }

  return context;
}
