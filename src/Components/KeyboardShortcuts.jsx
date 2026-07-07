import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const KeyboardShortcuts = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.user)


    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore when typing
            const target = e.target;

            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            // Shift
            if (e.shiftKey && e.key.toLowerCase() === "k") {
                e.preventDefault();
                navigate("/settings/shortkeys");
                return;
            }

            switch (e.key.toLowerCase()) {
                case "h":
                    navigate("/home");
                    break;

                case "p":
                    navigate(`/profile/${user._id}`);
                    break;

                case "s":
                    navigate("/settings");
                    break;

                case "c":
                    navigate("/create");
                    break;

                case "e":
                    navigate("/explore");
                    break;

                case "/":
                    e.preventDefault();
                    document.getElementById("search")?.focus();
                    break;



                case "escape":
                    // Close modal
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate, user?._id]);

    return null;
};

export default KeyboardShortcuts;