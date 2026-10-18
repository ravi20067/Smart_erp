import { Navigate } from "react-router-dom";
import { useAuth } from "@/services/authContext";
import { getRoleFromToken } from "@/services/authutil";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

const ProtectedRoute = ({
    children,
    allowedRoles,
}: ProtectedRouteProps) => {

    const { isAuthenticated, role } = useAuth();
    const currentRole = role ?? getRoleFromToken();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!currentRole || !allowedRoles.includes(currentRole)) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;