import { useSelector } from "react-redux";
import NotFound from "./NotFound";
import ProtectedRoute from "./ProtectedRoute";
import { selectUser } from "./Redex/Slice/UserSlice";

// Admin pages: must be signed in (handled by ProtectedRoute) and have the admin role.
// The backend enforces the same rule on every admin endpoint.
export default function AdminProtectedRoute({ children }) {
    const user = useSelector(selectUser);
    return <ProtectedRoute>{user?.role === "admin" ? children : <NotFound />}</ProtectedRoute>;
}
