import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export function ProtectedRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  return <Outlet />;
}
