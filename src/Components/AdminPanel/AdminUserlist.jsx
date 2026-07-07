import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SlOptions } from 'react-icons/sl';
import { GoHomeFill } from 'react-icons/go';
import { HiOutlineArrowLeftStartOnRectangle, HiMagnifyingGlass } from 'react-icons/hi2';
import { FiUsers, FiUserCheck, FiUserX } from 'react-icons/fi';
import Scrollbar from 'react-scrollbars-custom';

const API_BASE_URL = 'http://localhost:3500';

export default function AdminUserlist() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingUserId, setProcessingUserId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get(`${API_BASE_URL}/userlist`);
      console.log('User list:', data);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const blockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to change this user\'s status?')) {
      return;
    }

    try {
      setProcessingUserId(userId);
      const { data } = await axios.post(`${API_BASE_URL}/adminblock`, { id: userId });
      console.log('Block user response:', data);
      
      // Update the user's status in the state
      const updatedUsers = users.map(user => 
        user._id === userId 
          ? { ...user, adminblock: !user.adminblock }
          : user
      );
      
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user => 
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      setError('Failed to update user status. Please try again.');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.fullname.toLowerCase().includes(term.toLowerCase()) ||
        user.email?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  const blockedCount = users.filter(user => user.adminblock).length;
  const activeCount = users.length - blockedCount;

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh', background:"gray",  }}>
    <div className="flex min-h-screen w-full bg-neutral-950">
      {/* Sidebar */}
      <div className="bg-stone-950 text-xl min-h-screen w-80 pt-10 border-r border-white/20 flex-shrink-0">
        <nav className="fixed w-80">
          <Link to="/home" className="block">
            <div className="pl-20 p-5 font-bold hover:bg-blue-200/10 cursor-pointer flex items-center text-white transition-colors">
              <HiOutlineArrowLeftStartOnRectangle className="mr-3" />
              Home
            </div>
          </Link>
          <Link to="/admin" className="block">
            <div className="pl-20 p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white transition-colors">
              Posts
            </div>
          </Link>
          <Link to="/admin/userlist" className="block">
            <div className="pl-20 p-5 font-bold bg-blue-200/20 cursor-pointer text-white">
              User List
            </div>
          </Link>
          <Link to="/admin/explore" className="block">
            <div className="pl-20 p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white transition-colors">
              Explore
            </div>
          </Link>
          <Link to="/admin/tags" className="block">
            <div className="pl-20 p-5 font-bold hover:bg-blue-200/10 cursor-pointer text-white transition-colors">
              Tags
            </div>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto ">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
              <FiUserCheck size={16} />
              <span>{activeCount} Active</span>
            </div>
            <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
              <FiUserX size={16} />
              <span>{blockedCount} Blocked</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
              <FiUsers size={16} />
              <span>{users.length} Total</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-4 text-red-200 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading users...</span>
          </div>
        ) : (
          <>
            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg">
                  {searchTerm ? 'No users found matching your search' : 'No users found'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-400 hover:text-blue-300 underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const isBlocked = user.adminblock;
                  const isProcessing = processingUserId === user._id;

                  return (
                    <div
                      key={user._id}
                      className={`border rounded-xl overflow-hidden shadow-lg transition-all duration-200 ${
                        isBlocked 
                          ? 'border-red-500/50 bg-red-500/10' 
                          : 'border-gray-600 bg-neutral-800 hover:bg-neutral-700'
                      }`}
                    >
                      <div className="flex justify-between items-center px-6 py-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${
                              isBlocked ? 'bg-red-500' : 'bg-green-500'
                            }`}></div>
                            <h3 className="text-white text-lg font-semibold">
                              {user.fullname}
                            </h3>
                            {isBlocked && (
                              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          {user.email && (
                            <p className="text-gray-400 text-sm ml-6">
                              {user.email}
                            </p>
                          )}
                          {user.createdAt && (
                            <p className="text-gray-500 text-xs ml-6 mt-1">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => blockUser(user._id)}
                            disabled={isProcessing}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 min-w-20 ${
                              isBlocked
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isProcessing ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              </div>
                            ) : (
                              isBlocked ? 'Unblock' : 'Block'
                            )}
                          </button>
                          
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors">
                            <SlOptions size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Results Summary */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 text-center text-gray-400 text-sm">
                Showing {filteredUsers.length} of {users.length} users
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </Scrollbar>
  );
}