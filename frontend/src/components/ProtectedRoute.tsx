import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
  requiredPermission?: string | string[];
}

// Client-side gate for UX only (redirecting, hiding nav) — the backend
// still independently enforces every permission on every request.
export function ProtectedRoute({ children, requiredPermission }: Props) {
  const { employee, loading, hasPermission } = useAuth();

  if (loading) {
    return <div className="p-8 text-navy-700">Loading…</div>;
  }

  if (!employee) {
    return <Navigate to="/login" replace />;
  }

  const permissionKeys = requiredPermission
    ? Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission]
    : [];
  const hasAccess = permissionKeys.length === 0 || permissionKeys.some(hasPermission);

  if (!hasAccess) {
    return (
      <div className="p-8 text-navy-700">
        You don't have access to this page.
      </div>
    );
  }

  return <>{children}</>;
}
