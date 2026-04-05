import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readJson, writeJson } from "../utils/storage";

const SESSION_KEY = "notethemood.session";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // The session is persisted so a refresh keeps the user signed in.
  const [session, setSession] = useState(() => readJson(SESSION_KEY, null));

  useEffect(() => {
    writeJson(SESSION_KEY, session);
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      setSession,
      logout: () => setSession(null),
      isAuthenticated: Boolean(session?.token && session?.userId),
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return value;
}
