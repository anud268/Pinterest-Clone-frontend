import React, { useEffect, useState } from "react";
import Settings from "../Pages/Settings";
import { FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Scrollbar from "react-scrollbars-custom";

// 🔹 Skeleton Loader for Blocked Users
const BlockedUsersSkeleton = () => {
  return (
    <div className="p-2 w-full">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xm font-semibold text-gray-600">
              Blocked Users
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              <td className="px-6 py-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div className="h-4 w-40 bg-gray-300 rounded"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function BlockedUsers() {
  const [userDetials, setUserDetials] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.user);

  const fetchBlockedUsers = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:3500/blockedusers/${user._id}`
      );
      setUserDetials(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchBlockedUsers();
    }
  }, [user]);

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh',  }}>
    <div className="flex w-full">
      <div className="w-[20%]">
        <Settings page={"block"} />
      </div>
      <div className="w-[80%]">
        <div className="p-2 align-center h-full w-full">
          {loading ? (
            <BlockedUsersSkeleton /> // 🔹 Show skeleton while loading
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xm font-semibold text-gray-600">
                    Blocked Users
                  </th>
                </tr>
              </thead>
              <tbody className="w-full divide-gray-200">
                {userDetials.length > 0 ? (
                  userDetials.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-100 transition">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <Link
                          to={`/profile/${user._id}`}
                          className="text-lg font-semibold hover:underline flex items-center gap-3"
                        >
                          <div className="h-10 w-10 flex items-center justify-center bg-indigo-100 text-black rounded-full">
                            <FaUser size={20} />
                          </div>
                          <span className="font-medium text-gray-800">
                            {user.fullname}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-4 text-gray-500 font-bold">
                      No Blocked Users
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </Scrollbar>
  );
}
