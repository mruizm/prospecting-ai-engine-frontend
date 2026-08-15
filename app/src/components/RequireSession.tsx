import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";

export function RequireSession({ children }: { children: ReactNode }) {
  const { data, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="login-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!data?.authenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
