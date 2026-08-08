import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/client";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: string;
  branchId: string | null;
  permissions: string[];
}

interface AuthContextValue {
  employee: Employee | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kh_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<Employee>("/auth/me")
      .then(setEmployee)
      .catch(() => localStorage.removeItem("kh_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<{ token: string; employee: Employee }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem("kh_token", result.token);
    setEmployee(result.employee);
  }

  function logout() {
    localStorage.removeItem("kh_token");
    setEmployee(null);
  }

  function hasPermission(key: string) {
    return employee?.permissions.includes(key) ?? false;
  }

  return (
    <AuthContext.Provider value={{ employee, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
