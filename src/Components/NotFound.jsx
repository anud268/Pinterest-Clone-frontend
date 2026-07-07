import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-100">
            <h1 className="text-8xl font-bold text-red-500">404</h1>
            <h2 className="text-3xl font-semibold text-black mt-4">Page Not Found</h2>
            <p className="text-gray-600 mt-2">
                Sorry, the page you're looking for doesn't exist.
            </p>

            <Link
                to="/home"
                className="mt-6 px-6 py-3 bg-red-500 !text-white rounded-lg hover:bg-red-600 transition"
            >
                Go to Home
            </Link>
        </div>
    );
}