import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/stores/auth-store";
import type { AppRole } from "@/stores/auth-store";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: AppRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { session, role, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
