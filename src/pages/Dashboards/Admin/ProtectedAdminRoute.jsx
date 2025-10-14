import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children }) {
  const admin = JSON.parse(localStorage.getItem("admin"));

  if (!admin || admin.role.toLowerCase() !== "admin") {
    return <Navigate to="/farmalynk-one-admin-login" replace />;
  }

  return children;
}
