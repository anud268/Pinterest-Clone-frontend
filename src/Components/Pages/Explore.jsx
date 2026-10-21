import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoCompassOutline } from "react-icons/io5";
import { api, errorMessage } from "../../lib/api";
import { useDocumentTitle } from "../../lib/hooks";
import { imageSrcSet, imageUrl } from "../../lib/image";
import Button from "../UI/Button";
import { buttonClass } from "../UI/buttonClass";
import EmptyState from "../UI/EmptyState";

const today = () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

function ExploreSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading categories">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton aspect-[4/3] rounded-3xl" />
      ))}
    </div>
  );
}

function ExploreCard({ card, featured }) {
  return (
    <Link
      to={`/explore/${encodeURIComponent(card.title)}`}
      className={`group relative block overflow-hidden rounded-3xl bg-surface focus-visible:outline-offset-4 ${
        featured ? "aspect-[4/3] sm:col-span-2 sm:aspect-[21/9]" : "aspect-[4/3]"
      }`}
    >
      <img
        src={imageUrl(card.image, featured ? 1400 : 800)}
        srcSet={imageSrcSet(card.image, featured ? [800, 1400, 2000] : [480, 800, 1200])}
        sizes={featured ? "(max-width: 640px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
        alt=""
        loading={featured ? "eager" : "lazy"}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden="true" />
      <span className="absolute inset-x-0 bottom-0 p-5 text-center text-white sm:p-7">
        {card.subtitle && <span className="block text-sm font-medium text-white/85 sm:text-base">{card.subtitle}</span>}
        <span className={`mt-1 block font-extrabold tracking-tight ${featured ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>
          {card.title}
        </span>
      </span>
    </Link>
  );
}

export default function Explore() {
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useDocumentTitle("Explore");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    api
      .get("/fetchcards", { signal: controller.signal })
      .then(({ data }) => {
        setCards(data.cards);
        setStatus("ready");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(err));
        setStatus("error");
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="mx-auto max-w-6xl pt-4">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold text-ink-muted">{today()}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-5xl">Stay inspired</h1>
      </header>

      {status === "loading" && <ExploreSkeleton />}
      {status === "error" && (
        <EmptyState
          icon={<IoAlertCircleOutline />}
          title="We couldn't load Explore"
          description={error}
          action={<Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
        />
      )}
      {status === "ready" && cards.length === 0 && (
        <EmptyState
          icon={<IoCompassOutline />}
          title="Nothing to explore yet"
          description="Curated categories will appear here once an admin adds them."
          action={<Link to="/home" className={buttonClass({ variant: "secondary" })}>Go to your feed</Link>}
        />
      )}
      {status === "ready" && cards.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, i) => (
              <ExploreCard key={card._id} card={card} featured={i === 0 && cards.length > 2} />
            ))}
          </div>
          <section className="py-16 text-center">
            <IoCheckmarkCircleOutline className="mx-auto text-4xl text-ink" aria-hidden="true" />
            <p className="mt-2 text-sm text-ink-muted">That&apos;s all for today!</p>
            <p className="text-xl font-bold tracking-tight">Come back tomorrow for more inspiration</p>
            <Link to="/home" className={buttonClass({ variant: "secondary", className: "mt-6" })}>
              Go to home feed
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
