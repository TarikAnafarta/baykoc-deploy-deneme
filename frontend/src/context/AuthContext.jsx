import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apiUrl } from '../utils/api';

const defaultAuthValue = {
  token: '',
  user: null,
  isAuthenticated: false,
  loadingUser: false,
  setAuthData: () => {},
  clearAuth: () => {},
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const prefetchedUserRef = useRef(false);
  const lastFetchedTokenRef = useRef(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchCurrentUser(currentToken) {
      if (!currentToken) {
        setUser(null);
        setLoadingUser(false);
        prefetchedUserRef.current = false;
        lastFetchedTokenRef.current = null;
        return;
      }
      if (prefetchedUserRef.current) {
        prefetchedUserRef.current = false;
        lastFetchedTokenRef.current = currentToken;
        setLoadingUser(false);
        return;
      }
      if (lastFetchedTokenRef.current === currentToken) {
        return;
      }
      lastFetchedTokenRef.current = currentToken;
      setLoadingUser(true);
      try {
        const response = await fetch(apiUrl('/api/users/me/'), {
          headers: {
            Authorization: `Token ${currentToken}`,
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error('Unauthorized');
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        if (error.name === 'AbortError') return;
        localStorage.removeItem('authToken');
        setToken('');
        setUser(null);
        prefetchedUserRef.current = false;
        lastFetchedTokenRef.current = null;
      } finally {
        setLoadingUser(false);
      }
    }

    fetchCurrentUser(token);

    return () => {
      abortController.abort();
    };
  }, [token]);

  const setAuthData = useCallback((nextToken, userPayload = null) => {
    if (nextToken) {
      localStorage.setItem('authToken', nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem('authToken');
      setToken('');
      prefetchedUserRef.current = false;
      lastFetchedTokenRef.current = null;
    }
    setUser(userPayload);
    prefetchedUserRef.current = Boolean(userPayload);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken('');
    setUser(null);
    prefetchedUserRef.current = false;
    lastFetchedTokenRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loadingUser,
      setAuthData,
      clearAuth,
    }),
    [token, user, loadingUser, setAuthData, clearAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext) || defaultAuthValue;
}
