import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Repo } from '../types';
import { fetchRepos } from './api';

// In-memory store — works in Expo Go without a native build.
// Swap for expo-secure-store once you have a custom dev client.
const memStore: Record<string, string> = {};
const SecureStore = {
  getItemAsync: async (key: string) => memStore[key] ?? null,
  setItemAsync: async (key: string, value: string) => { memStore[key] = value; },
  deleteItemAsync: async (key: string) => { delete memStore[key]; },
};


type RepoContextType = {
  token: string | null;
  selectedRepo: Repo | null;
  repos: Repo[];
  loading: boolean;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  selectRepo: (repo: Repo) => void;
  refreshRepos: () => Promise<void>;
};

const RepoContext = createContext<RepoContextType | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('github_pat').then((t) => {
      if (t) setTokenState(t);
      else setTokenState('__mock__'); // auto-load mock data in dev
    });
  }, []);

  const refreshRepos = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchRepos(token);
      setRepos(list);
      setSelectedRepo((prev) => prev ?? list[0] ?? null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) refreshRepos();
  }, [token]);

  const setToken = async (t: string) => {
    await SecureStore.setItemAsync('github_pat', t);
    setTokenState(t);
  };

  const clearToken = async () => {
    await SecureStore.deleteItemAsync('github_pat');
    setTokenState(null);
    setRepos([]);
  };

  return (
    <RepoContext.Provider
      value={{ token, selectedRepo, repos, loading, setToken, clearToken, selectRepo: setSelectedRepo, refreshRepos }}
    >
      {children}
    </RepoContext.Provider>
  );
}

export function useRepo() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useRepo must be used within RepoProvider');
  return ctx;
}
