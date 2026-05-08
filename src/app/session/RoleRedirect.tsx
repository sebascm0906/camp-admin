import { Navigate } from "react-router-dom";
import { useSession } from "./useSession";

function isPlatformAdmin(role: string | null | undefined) {
  return role === "platform_admin";
}

export function RoleRedirect() {
  const { session } = useSession();

  if (session.phase === "ready" && isPlatformAdmin(session.user.role)) {
    return <Navigate to="/platform" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
