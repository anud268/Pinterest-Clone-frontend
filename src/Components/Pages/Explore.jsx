import { useDispatch } from "react-redux";
import Sidebar from "../Part/Sidebar";
import { showSidebar } from "../Redex/Slice/navbarSlice";
import { useEffect, useState } from "react";
import axios from "axios";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import Scrollbar from "react-scrollbars-custom";

// ✅ Skeleton Loader Component
const ExploreSkeleton = () => {
  return (
    <div className="grid grid-cols-2 w-3/4 m-auto gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded-4xl shadow-md overflow-hidden"
        >
          {/* Fake Image */}
          <div className="w-full h-64 bg-gray-200"></div>

          {/* Fake Text */}
          <div className="p-4 place-items-center">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Explore() {
  const dispatch = useDispatch();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCards = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3500/fetchcards`);
      setCards(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh', }}>
      <div className="w-full">
        <div
          className="w-full min-h-screen bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            dispatch(showSidebar(false));
          }}
        >
          {/* Sidebar */}
          <div className="fixed top-0 left-0 z-40">
            <Sidebar section="explore" />
          </div>

          {/* Main Content */}
          <div className="pt-20 px-4 ">
            <div className="max-w-7xl mx-auto">
              <p className="text-center text-xl font-bold text-neutral-800 tracking-tight ">
                {new Date()
                  .toISOString()
                  .slice(0, 10)
                  .split("-")
                  .reverse()
                  .join("-")}
              </p>
              <h1 className="text-center !text-4xl font-bold text-neutral-800 tracking-tight mb-8">
                Stay Inspired
              </h1>

              {/* ✅ Show Skeleton if Loading */}
              {loading ? (
                <ExploreSkeleton />
              ) : (
                <div className="grid grid-cols-2 w-3/4 m-auto gap-6">
                  {cards.map((card, i) => (
                    <div
                      key={i}
                      className="bg-white relative rounded-4xl cursor-pointer shadow-md overflow-hidden transition-transform hover:scale-105"
                    >
                      <Link to={`/explore/${card.title}`}>
                        <img
                          src={card.image}
                          alt="image not found"
                          className="w-full h-84 brightness-75 object-cover"
                        />
                        <div className="absolute z-10 bottom-5 w-full tracking-tight">
                          <p className="text-center text-white text-shadow-xl text-md">
                            {card.subtitle}
                          </p>
                          <p className="text-center font-bold text-shadow-xl text-white text-3xl">
                            {card.title}
                          </p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div>
          <div className="text-neutral-800 tracking-tight font-bold w-full bg-gray-100 text-center py-20 ">
            <p className="flex justify-center text-4xl">
              <IoCheckmarkCircleOutline />
            </p>
            <p className="font-normal">That's all for today!</p>
            <p className="font-semibold text-2xl">
              Come back tomorrow for more inspiration
            </p>
            <p
              onClick={() => {
                navigate("/home");
              }}
              className="mt-10"
            >
              <span className="bg-gray-200 cursor-pointer p-2 px-4 rounded-2xl">
                Go to home feed
              </span>
            </p>
          </div>
        </div>
      </div>
    </Scrollbar>
  );
}
