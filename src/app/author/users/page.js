"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Shield, ShieldOff, 
  ExternalLink, Clock, FileText, 
  Award, Mail, Calendar, Hash,
  ChevronRight, ArrowLeft, MoreVertical, Trash2
} from 'lucide-react';
import { getAllUsers, updateUser, deleteUser } from '@/services/user.service';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [stats, setStats] = useState({ timeSpent: "0h 0m", testsTaken: 0 });
  
  // Delete & Menu State
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    loadUsers();

    const handleStorageChange = (e) => {
        if (e.key === 'medbank_users_updated') {
        loadUsers();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = (user) => {
    setSelectedUser(user);
    // Fetch stats from localStorage (simulated backend lookup)
    const historyKey = `medbank_test_history_${user.id}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
    setUserHistory(history);

    // Calculate time
    const totalSeconds = history.reduce((acc, t) => acc + (t.elapsedTime || 0), 0);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    
    setStats({
      timeSpent: `${h}h ${m}m`,
      testsTaken: history.length
    });
  };

  const handleToggleBan = async (user) => {
    if (!confirm(`Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} this user?`)) return;
    
    const updatedUser = { ...user, isBanned: !user.isBanned };
    try {
      await updateUser(updatedUser);
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
      if (selectedUser?.id === user.id) setSelectedUser(updatedUser);
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const confirmDelete = (e, user) => {
    e.stopPropagation(); // Prevent row click
    setOpenMenuId(null);
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      if (selectedUser?.id === userToDelete.id) setSelectedUser(null);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-heading font-bold text-white tracking-tight">System <span className="cyber-gradient-text">Users</span></h1>
                <p className="text-gray-400 mt-2 text-sm">Monitor user activity, manage access, and review performance metrics</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by Name, Email or UID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:border-[#8B5CF6]/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="bg-[#0F0F12]/80 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                    <th className="px-8 py-5">User ID / Name</th>
                    <th className="px-8 py-5">Access Status</th>
                    <th className="px-8 py-5">Subscription</th>
                    <th className="px-8 py-5">Account Created</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center text-gray-500 italic">No users found matching your search</td>
                    </tr>
                  ) : filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="group hover:bg-white/5 transition-all cursor-pointer"
                      onClick={() => loadUserDetails(user)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br transition-all ${user.isBanned ? 'from-gray-700 to-gray-800' : 'from-[#8B5CF6]/20 to-[#06B6D4]/20'} flex items-center justify-center font-bold text-white`}>
                            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-[#8B5CF6] transition-colors">{user.name || 'Anonymous User'}</p>
                            <p className="text-[10px] font-mono text-gray-500 mt-0.5">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.isBanned ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${user.isBanned ? 'bg-red-500' : 'bg-green-500'}`} />
                          {user.isBanned ? 'Banned' : 'Active'}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.status === 'paid' ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                          {user.status === 'paid' ? <Award size={12} /> : <Calendar size={12} />}
                          {user.status === 'paid' ? 'Paid Member' : (user.status || 'Free Trial')}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-gray-400 font-mono">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === user.id ? null : user.id);
                            }}
                            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <MoreVertical size={20} />
                          </button>
                          
                          <AnimatePresence>
                            {openMenuId === user.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-[#1E1E24] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                              >
                                <button
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      loadUserDetails(user);
                                      setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2"
                                >
                                  <ChevronRight size={16} /> View Details
                                </button>
                                <button
                                  onClick={(e) => confirmDelete(e, user)}
                                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                                >
                                  <Trash2 size={16} /> Delete Account
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <ConfirmModal 
               isOpen={showDeleteConfirm}
               onClose={() => setShowDeleteConfirm(false)}
               onConfirm={handleDeleteUser}
               title="Delete User Account?"
               message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone and will remove all their data permanently.`}
               confirmText="Delete Account"
               isDangerous={true}
            />
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setSelectedUser(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Back to Users
            </button>

            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8">
              {/* Profile Card */}
              <div className="space-y-6">
                <div className="bg-[#0F0F12]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                  
                  <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] p-1 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                      <div className="w-full h-full rounded-[20px] bg-[#0F0F12] flex items-center justify-center text-3xl font-black text-white">
                        {selectedUser.name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedUser.name || 'Anonymous User'}</h2>
                      <p className="text-gray-500 font-mono text-xs mt-1">{selectedUser.id}</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                       <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center min-w-[100px]">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status</span>
                         <span className={`text-xs font-black uppercase ${selectedUser.isBanned ? 'text-red-500' : 'text-green-500'}`}>
                           {selectedUser.isBanned ? 'Banned' : 'Active'}
                         </span>
                       </div>
                       <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center min-w-[100px]">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tier</span>
                         <span className="text-xs font-black uppercase text-amber-500">
                           {selectedUser.status === 'paid' ? 'Paid' : 'Free Trial'}
                         </span>
                       </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Mail size={16} />
                        </div>
                        <span className="text-xs font-semibold text-gray-400">Email Address</span>
                      </div>
                      <span className="text-xs font-bold text-white">{selectedUser.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                          <Hash size={16} />
                        </div>
                        <span className="text-xs font-semibold text-gray-400">Unique ID</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-white uppercase">{selectedUser.id}</span>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <Clock size={20} className="text-[#8B5CF6] mb-2" />
                      <div className="text-xl font-bold text-white">{stats.timeSpent}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Time Active</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <FileText size={20} className="text-[#06B6D4] mb-2" />
                      <div className="text-xl font-bold text-white">{stats.testsTaken}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tests Generated</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleToggleBan(selectedUser)}
                    className={`w-full mt-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${selectedUser.isBanned ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'}`}
                  >
                    {selectedUser.isBanned ? <Shield size={18} /> : <ShieldOff size={18} />}
                    {selectedUser.isBanned ? 'RESTORE ACCESS' : 'REVOKE ACCESS / BAN'}
                  </button>
                </div>
              </div>

              {/* Activity Log */}
              <div className="space-y-6">
                <div className="bg-[#0F0F12]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-8 h-full">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <FileText className="text-[#8B5CF6]" size={20} />
                      User Test History
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {userHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Clock size={48} className="text-gray-700 mb-4" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No activity records found</p>
                      </div>
                    ) : (
                      userHistory.map((test, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-bold">
                              #{test.testNumber || (i + 1)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white uppercase tracking-tight">Test ID: {test.testId}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                                  <Calendar size={10} /> {new Date(test.date).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                                  <Clock size={10} /> {Math.floor(test.elapsedTime / 60)}m {test.elapsedTime % 60}s
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-10">
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Score</span>
                              <span className="text-lg font-black text-white">{Math.round((test.questions.filter(q => q.userAnswer === q.correct).length / test.questions.length) * 100)}%</span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${test.isSuspended ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
