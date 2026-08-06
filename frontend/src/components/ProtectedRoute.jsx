import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// allowedRoles: array เช่น ["teacher", "admin"] หรือ ["student"]
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink/50">กำลังโหลด...</div>;
  }

  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
