import type { JSX } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: JSX.Element;
  allowedRoles: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role_id");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role || "")) {
    // Redirección según rol
    return role === "0"
      ? <Navigate to="/admin" replace />
      : <Navigate to="/" replace />;
  }

  return children;
};
