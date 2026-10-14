'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'ADMIN' | 'PRO_SANTE';
  type_profession?: string;
  numero_rpps?: string | null;
  doit_changer_mdp?: boolean;
}

interface AppContextType {
  user: User | null;
  loadingUser: boolean;
  cartCount: number;
  refreshUser: () => Promise<void>;
  refreshCartCount: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  loadingUser: true,
  cartCount: 0,
  refreshUser: async () => {},
  refreshCartCount: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const refreshCartCount = async () => {
    try {
      const res = await fetch('/api/panier');
      if (res.ok) {
        const data = await res.json();
        setCartCount(data.total_articles || 0);
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setCartCount(0);
      window.location.href = '/';
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user) {
      refreshCartCount();
    } else {
      setCartCount(0);
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user,
        loadingUser,
        cartCount,
        refreshUser,
        refreshCartCount,
        logout,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
