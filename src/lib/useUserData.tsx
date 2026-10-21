import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { load, save, emptyData, type UserData } from "./store";

type Ctx = { data: UserData; update: (fn: (d: UserData) => UserData) => void; reset: () => void };

const UserDataContext = createContext<Ctx | null>(null);

const storage = typeof window !== "undefined" ? safeStorage() : undefined;

function safeStorage() {
  try {
    const s = window.localStorage;
    s.getItem("x");
    return s;
  } catch {
    return undefined;
  }
}

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<UserData>(() => load(storage));

  useEffect(() => save(storage, data), [data]);

  // Synchronise plusieurs onglets ouverts
  useEffect(() => {
    const onStorage = () => setData(load(storage));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (d: UserData) => UserData) => setData((d) => fn(d)), []);
  const reset = useCallback(() => setData(emptyData()), []);
  const value = useMemo(() => ({ data, update, reset }), [data, update, reset]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error("useUserData doit être utilisé dans UserDataProvider");
  return ctx;
}
