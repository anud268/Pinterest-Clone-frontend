import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import NotFound from "./NotFound";
import axios from "axios";
import { addUser } from "./Redex/Slice/UserSlice";

export default function AdminProtectedRoute({ children }) {
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(!user || !user._id);

    useEffect(() => {
        const verifyUser = async () => {
            if (user && user._id) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await axios.get('http://localhost:3500/fetchuser', { withCredentials: true });
                if (data && data._id) {
                    dispatch(addUser(data));
                }
            } catch (error) {
                console.error("Error verifying admin route:", error);
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, [user, dispatch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-neutral-950 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <NotFound />;
    }

    return children;
}