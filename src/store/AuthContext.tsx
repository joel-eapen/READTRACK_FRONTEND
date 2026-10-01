import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AuthUser {
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "readtrack.auth";

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const signIn = useCallback((email: string) => {
    const next = { email };
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
