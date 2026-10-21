import { Link } from "react-router-dom";
import { buttonClass } from "./UI/buttonClass";
import { useDocumentTitle } from "../lib/hooks";

export default function NotFound() {
    useDocumentTitle("Page not found");
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
            <img src="/assets/white & blue pinterest icon.png" alt="" className="mb-6 size-14" />
            <p className="text-sm font-bold tracking-widest text-brand-600 uppercase">Error 404</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">We couldn&apos;t find that page</h1>
            <p className="mt-3 max-w-sm text-ink-muted">
                The link may be broken, or the page may have been removed. Let&apos;s get you back to something inspiring.
            </p>
            <Link to="/home" className={buttonClass({ size: "lg", className: "mt-8" })}>
                Back to home
            </Link>
        </main>
    );
}
