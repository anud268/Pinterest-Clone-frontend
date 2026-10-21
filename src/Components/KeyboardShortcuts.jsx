import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "./Redex/Slice/UserSlice";

// The list shown to users lives in lib/constants.js (SHORTCUTS); keep both in sync.
const isTyping = (target) =>
    target instanceof HTMLElement &&
    (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);

const KeyboardShortcuts = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Leave browser/OS shortcuts (Ctrl+C, Cmd+S...) and typing alone
            if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isTyping(e.target)) return;
            if (document.querySelector("dialog[open]")) return;

            if (e.shiftKey && e.key.toLowerCase() === "k") {
                e.preventDefault();
                navigate("/settings/shortkeys");
                return;
            }
            if (e.shiftKey) return;

            const routes = {
                h: "/home",
                e: "/explore",
                c: "/create",
                s: "/settings",
                p: user?._id ? `/profile/${user._id}` : null,
            };
            const key = e.key.toLowerCase();

            if (key === "/") {
                e.preventDefault();
                document.getElementById("search")?.focus();
            } else if (routes[key]) {
                e.preventDefault();
                navigate(routes[key]);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate, user?._id]);

    return null;
};

export default KeyboardShortcuts;
