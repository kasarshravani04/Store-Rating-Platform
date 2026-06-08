import React, { useState, useEffect } from 'react';
import {
  Shield,
  Store as StoreIcon,
  Users,
  Search,
  Star,
  LogOut,
  SlidersHorizontal,
  PlusCircle,
  KeyRound,
  RefreshCw,
  Mail,
  MapPin,
  Lock,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import StarRating from './components/StarRating';
import AddUserForm from './components/AddUserForm';
import AddStoreForm from './components/AddStoreForm';
import UpdatePasswordForm from './components/UpdatePasswordForm';
import { User, Store, Rating, AdminStats, UserRole } from './types';

export default function App() {
  // Authentication & session variables
  const [token, setToken] = useState<string | null>(localStorage.getItem('secure_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('secure_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Flow State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Input states for Login/Register Form
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active View Tab on Dashboards
  const [adminTab, setAdminTab] = useState<'STATS' | 'USERS' | 'STORES' | 'SECURITY'>('STATS');
  const [userTab, setUserTab] = useState<'STORES' | 'SECURITY'>('STORES');
  const [ownerTab, setOwnerTab] = useState<'STORE' | 'SECURITY'>('STORE');

  // Admin Data states
  const [adminStats, setAdminStats] = useState<AdminStats>({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminStores, setAdminStores] = useState<Store[]>([]);
  
  // Admin queries / filters
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterAddress, setFilterAddress] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  // Sorting columns for tables
  const [usersSortField, setUsersSortField] = useState<keyof User | 'rating'>('name');
  const [usersSortDirection, setUsersSortDirection] = useState<'asc' | 'desc'>('asc');
  const [storesSortField, setStoresSortField] = useState<keyof Store>('name');
  const [storesSortDirection, setStoresSortDirection] = useState<'asc' | 'desc'>('asc');

  // Normal User States
  const [storesList, setStoresList] = useState<(Store & { userSubmittedRating: number | null })[]>([]);
  const [searchStoreName, setSearchStoreName] = useState('');
  const [searchStoreAddress, setSearchStoreAddress] = useState('');
  const [userRatingMessage, setUserRatingMessage] = useState<string | null>(null);

  // Owner Dashboard stats
  const [ownerData, setOwnerData] = useState<{
    store: Store | null;
    averageRating: number;
    ratingsReceived: Rating[];
  }>({ store: null, averageRating: 0, ratingsReceived: [] });

  // Refresh Trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Effects
  useEffect(() => {
    if (!token) return;

    if (currentUser?.role === 'ADMIN') {
      fetchAdminStats();
      fetchAdminUsers();
    } else if (currentUser?.role === 'USER') {
      fetchUserStores();
    } else if (currentUser?.role === 'OWNER') {
      fetchOwnerDashboard();
    }
  }, [token, currentUser, refreshTrigger, filterName, filterEmail, filterAddress, filterRole]);

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    // Frontend validations based on constraints
    if (authMode === 'REGISTER') {
      if (authName.length < 2 || authName.length > 60) {
        setAuthError('Name must be between 2 and 60 characters.');
        return;
      }
      if (authAddress.length > 400) {
        setAuthError('Address length cannot exceed 400 characters.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(authEmail)) {
        setAuthError('Standard email validation rules failed. Please review.');
        return;
      }
      if (authPassword.length < 8 || authPassword.length > 16) {
        setAuthError('Password must be between 8 and 16 characters long.');
        return;
      }
      if (!/[A-Z]/.test(authPassword)) {
        setAuthError('Password must contain at least one uppercase letter.');
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(authPassword)) {
        setAuthError('Password must contain at least one special character.');
        return;
      }
    }

    setAuthLoading(true);
    const endpoint = authMode === 'LOGIN' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'LOGIN' 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, address: authAddress, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication parameters are invalid.');
      } else {
        // Success
        localStorage.setItem('secure_token', data.token);
        localStorage.setItem('secure_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
        
        // Reset local form states
        setAuthPassword('');
        setAuthName('');
        setAuthAddress('');
        setAuthEmail('');
        
        // Navigate
        if (data.user.role === 'ADMIN') setAdminTab('STATS');
        else if (data.user.role === 'USER') setUserTab('STORES');
        else if (data.user.role === 'OWNER') setOwnerTab('STORE');
      }
    } catch {
      setAuthError('Connection failed. Verify API server is healthy.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout method
  const handleLogout = () => {
    localStorage.removeItem('secure_token');
    localStorage.removeItem('secure_user');
    setToken(null);
    setCurrentUser(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthError(null);
    setAuthSuccess(null);
  };

  // --- API RETRIEVAL HELPERS ---
  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const q = new URLSearchParams({
        name: filterName,
        email: filterEmail,
        address: filterAddress,
        role: filterRole
      }).toString();

      const res = await fetch(`/api/admin/users?${q}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const usersData = await res.json();
        setAdminUsers(usersData);
      }

      // Also get stores to populate store listings within admin
      const storesRes = await fetch('/api/stores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        setAdminStores(storesData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserStores = async () => {
    try {
      const query = new URLSearchParams({
        name: searchStoreName,
        address: searchStoreAddress
      }).toString();

      const res = await fetch(`/api/stores?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStoresList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOwnerDashboard = async () => {
    try {
      const res = await fetch('/api/owner/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOwnerData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- RATINGS ACTION HANDLER ---
  const submitUserRating = async (storeId: string, ratingValue: number) => {
    setUserRatingMessage(null);
    try {
      const res = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ storeId, rating: ratingValue })
      });
      const data = await res.json();
      if (res.ok) {
        setUserRatingMessage('Rating submitted successfully!');
        setRefreshTrigger(prev => prev + 1);
        setTimeout(() => setUserRatingMessage(null), 3000);
      } else {
        setUserRatingMessage(data.error || 'Could not post rating value.');
      }
    } catch {
      setUserRatingMessage('Connection error during rating upload.');
    }
  };

  // --- SORTING CONTROLLER ---
  const toggleUserSort = (field: keyof User | 'rating') => {
    if (usersSortField === field) {
      setUsersSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setUsersSortField(field);
      setUsersSortDirection('asc');
    }
  };

  const toggleStoreSort = (field: keyof Store) => {
    if (storesSortField === field) {
      setStoresSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStoresSortField(field);
      setStoresSortDirection('asc');
    }
  };

  // Computed Sorted Data Sets
  const sortedUsers = [...adminUsers].sort((a, b) => {
    let valA: any = a[usersSortField as keyof User] ?? '';
    let valB: any = b[usersSortField as keyof User] ?? '';

    if (usersSortField === 'rating') {
      valA = (a as any).rating ?? 0;
      valB = (b as any).rating ?? 0;
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return usersSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return usersSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedStores = [...adminStores].sort((a, b) => {
    let valA = a[storesSortField];
    let valB = b[storesSortField];

    if (typeof valA === 'string') valA = valA.toLowerCase() as any;
    if (typeof valB === 'string') valB = valB.toLowerCase() as any;

    if (valA < valB) return storesSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return storesSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // User tab stores search trigger
  const handleStoreSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUserStores();
  };

  const resetStoreSearch = () => {
    setSearchStoreName('');
    setSearchStoreAddress('');
    setTimeout(() => setRefreshTrigger(p => p + 1), 50);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden flex font-sans text-slate-200" id="frosted-glass-viewport">
      {/* Dynamic Background Blur Mesh Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[160px] opacity-10 pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-400 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      {!token ? (
        // AUTHENTICATION SCREEN Flow (LOGIN / REGISTER WITH GLASS CARD)
        <div className="flex-1 flex items-center justify-center p-4 z-10" id="auth-flow-panel">
          <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/15 transition-all shadow-2xl">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-3 animate-pulse">
                <Sparkles className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white headline">
                Store Rating Platform
              </h2>
              <p className="text-xs text-slate-400 mt-1 uppercase text-center tracking-widest">
                {authMode === 'LOGIN' ? 'Secure JWT Access Hub' : 'Register New Normal User Account'}
              </p>
            </div>

            {/* Selection tab */}
            <div className="flex border-b border-white/10 mb-6">
              <button
                id="btn-switch-login"
                type="button"
                className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider text-center ${
                  authMode === 'LOGIN' ? 'text-purple-400 border-b-2 border-purple-500 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => {
                  setAuthMode('LOGIN');
                  setAuthError(null);
                }}
              >
                Sign In
              </button>
              <button
                id="btn-switch-register"
                type="button"
                className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider text-center ${
                  authMode === 'REGISTER' ? 'text-purple-400 border-b-2 border-purple-500 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => {
                  setAuthMode('REGISTER');
                  setAuthError(null);
                }}
              >
                Join Platform (Sign Up)
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4" id="gateway-secure-form">
              {authMode === 'REGISTER' && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                      <span className={`text-[10px] ${authName.length >= 2 && authName.length <= 60 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {authName.length}/2-60 chars
                      </span>
                    </div>
                    <input
                      id="input-auth-name"
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Christopher Nolan Miller Jr"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-300">Physical Address</label>
                      <span className={`text-[10px] ${authAddress.length <= 400 ? 'text-slate-400' : 'text-rose-400'}`}>
                        {authAddress.length}/400 max
                      </span>
                    </div>
                    <textarea
                      id="input-auth-address"
                      rows={2}
                      value={authAddress}
                      onChange={(e) => setAuthAddress(e.target.value)}
                      placeholder="Enter Complete Street Address..."
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 resize-none"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail size={14} />
                  </span>
                  <input
                    id="input-auth-email"
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. candidate@domain.com"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  {authMode === 'REGISTER' && <span className="text-[9px] text-slate-400 font-mono">8-16, uppercase, 1 special</span>}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={14} />
                  </span>
                  <input
                    id="input-auth-pwd"
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {authError && (
                <div className="flex items-start gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg p-3" id="auth-error">
                  <span className="font-bold shrink-0">⚠️ Error:</span>
                  <span>{authError}</span>
                </div>
              )}

              <button
                id="btn-auth-submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-blue-600 hover:brightness-110 active:scale-98 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? 'Verifying Secure Token...' : authMode === 'LOGIN' ? 'Sign In' : 'Assemble Profile & Register'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center text-slate-400 text-[11px] font-mono">
              Role-Based Multi-tenant Access: Admin, Store Owner, & Customers
            </div>
          </div>
        </div>
      ) : (
        // MAIN SESSION DASHBOARD CONTAINER
        <div className="flex-1 flex z-10 w-full" id="session-workspace-wrapper">
          {/* Sidebar Navigation component wrapper */}
          <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col shrink-0">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="font-black text-white text-lg">S</span>
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight text-white leading-0">Store Rating</h1>
                  <span className="text-[9px] uppercase tracking-wider text-purple-400 font-bold">Portal v1.8</span>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">Authenticated</span>
                </div>
                <p className="text-xs font-bold text-white max-w-[190px] truncate">{currentUser?.name}</p>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold px-2 py-0.5 rounded uppercase tracking-wider mt-1.5 inline-block font-mono">
                  {currentUser?.role} Account
                </span>
              </div>

              {/* Sidebar Navigation elements per User role */}
              {currentUser?.role === 'ADMIN' && (
                <nav className="space-y-1.5" id="nav-group-admin">
                  <button
                    id="tab-admin-stats"
                    onClick={() => setAdminTab('STATS')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                      adminTab === 'STATS' ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <TrendingUp size={14} className="text-purple-400" />
                    Dashboard Overview
                  </button>
                  <button
                    id="tab-admin-users"
                    onClick={() => setAdminTab('USERS')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                      adminTab === 'USERS' ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Users size={14} className="text-purple-400" />
                    Manage Users
                  </button>
                  <button
                    id="tab-admin-stores"
                    onClick={() => setAdminTab('STORES')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                      adminTab === 'STORES' ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <StoreIcon size={14} className="text-purple-400" />
                    Manage Stores
                  </button>
                  <button
                    id="tab-admin-security"
                    onClick={() => setAdminTab('SECURITY')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                      adminTab === 'SECURITY' ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <KeyRound size={14} className="text-purple-400" />
                    Security Settings
                  </button>
                </nav>
              )}

              {currentUser?.role === 'USER' && (
                <nav className="space-y-1.5" id="nav-group-user">
                  <button
                    id="tab-user-stores"
                    onClick={() => setUserTab('STORES')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                      userTab === 'STORES' ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <StoreIcon size={14} className="text-purple-400" />
                    Explore Stores
                  </button>
                  <button
                    id="tab-user-security"
                    onClick={() => setUserTab('SECURITY')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                      userTab === 'SECURITY' ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <KeyRound size={14} className="text-purple-400" />
                    Security Settings
                  </button>
                </nav>
              )}

              {currentUser?.role === 'OWNER' && (
                <nav className="space-y-1.5" id="nav-group-owner">
                  <button
                    id="tab-owner-dashboard"
                    onClick={() => setOwnerTab('STORE')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                      ownerTab === 'STORE' ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <StoreIcon size={14} className="text-purple-400" />
                    Owner Dashboard
                  </button>
                  <button
                    id="tab-owner-security"
                    onClick={() => setOwnerTab('SECURITY')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all ${
                      ownerTab === 'SECURITY' ? 'bg-white/10 text-white font-bold border border-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <KeyRound size={14} className="text-purple-400" />
                    Security Settings
                  </button>
                </nav>
              )}
            </div>

            {/* Logout control on bottom */}
            <div className="mt-auto p-6 border-t border-white/10">
              <button
                id="btn-sidebar-logout"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-all cursor-pointer"
              >
                <LogOut size={13} />
                Disconnect Session
              </button>
            </div>
          </aside>

          {/* Core content stream segment */}
          <main className="flex-1 flex flex-col overflow-y-auto">
            <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between shrink-0">
              <div className="flex flex-col">
                <h2 className="text-xs text-slate-400 uppercase tracking-widest font-bold">Secure Access Segment</h2>
                <p className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Portal Console Terminal</span>
                  <span className="text-[10px] bg-green-500/10 text-emerald-400 border border-green-500/20 font-bold tracking-wider uppercase px-2 py-0.5 rounded font-mono">
                    JWT SECURED ACTIVE
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRefreshTrigger(p => p + 1)}
                  type="button"
                  className="p-2 bg-slate-800/80 border border-white/10 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Trigger Manual Synchronize Refresh"
                  id="btn-sync-refresh"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                </button>
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-400 font-mono">System Time</div>
                  <div className="text-xs font-bold text-white font-mono">2026-06-08 06:14 UTC</div>
                </div>
              </div>
            </header>

            {/* Content stream workspace body */}
            <div className="p-8 space-y-6">
              
              {/* --- VIEW ROUTER: SYSTEM ADMINISTRATOR --- */}
              {currentUser?.role === 'ADMIN' && (
                <div className="space-y-6 animate-fade-in" id="admin-workspace-segment">
                  
                  {/* TAB 1: DASHBOARD STATS */}
                  {adminTab === 'STATS' && (
                    <>
                      {/* STATS METRIC TILES */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Total System Clients</span>
                            <span className="text-3xl font-black text-white">{adminStats.totalUsers}</span>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            <Users size={22} />
                          </div>
                        </div>

                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Registered Stores</span>
                            <span className="text-3xl font-black text-white">{adminStats.totalStores}</span>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <StoreIcon size={22} />
                          </div>
                        </div>

                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Ratings Recorded</span>
                            <span className="text-3xl font-black text-white">{adminStats.totalRatings}</span>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Star size={22} />
                          </div>
                        </div>
                      </div>

                      {/* QUICK ACTION ROW CARDS */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AddUserForm token={token!} onUserAdded={() => setRefreshTrigger(p => p + 1)} />
                        <AddStoreForm token={token!} onStoreAdded={() => setRefreshTrigger(p => p + 1)} />
                      </div>
                    </>
                  )}

                  {/* TAB 2: MANAGE USERS */}
                  {adminTab === 'USERS' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Users size={16} className="text-purple-400" />
                          System User Registry
                        </h3>

                        {/* Custom Filters section for Admin */}
                        <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <input
                            id="filter-user-name"
                            type="text"
                            placeholder="Filter Name..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className="px-2 py-1.5 bg-slate-950/80 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden"
                          />
                          <input
                            id="filter-user-email"
                            type="text"
                            placeholder="Filter Email..."
                            value={filterEmail}
                            onChange={(e) => setFilterEmail(e.target.value)}
                            className="px-2 py-1.5 bg-slate-950/80 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden"
                          />
                          <input
                            id="filter-user-address"
                            type="text"
                            placeholder="Filter Address..."
                            value={filterAddress}
                            onChange={(e) => setFilterAddress(e.target.value)}
                            className="px-2 py-1.5 bg-slate-950/80 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden"
                          />
                          <select
                            id="filter-user-role"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-2 py-1.5 bg-slate-950/80 border border-white/10 rounded-lg text-slate-100 focus:outline-hidden"
                          >
                            <option value="">All Roles</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                            <option value="OWNER">OWNER</option>
                          </select>
                        </div>
                      </div>

                      {/* Filter active state helper */}
                      {(filterName || filterEmail || filterAddress || filterRole) && (
                        <div className="flex items-center gap-2 mb-4 text-xs">
                          <span className="text-slate-400 font-mono">Active Filters:</span>
                          <button
                            id="clear-admin-user-filters"
                            className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 font-mono text-[10px] rounded uppercase"
                            onClick={() => {
                              setFilterName('');
                              setFilterEmail('');
                              setFilterAddress('');
                              setFilterRole('');
                            }}
                          >
                            Reset filter criteria
                          </button>
                        </div>
                      )}

                      {/* Sortable Users Table registry */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-mono">
                              <th className="p-3 pb-4">
                                <button
                                  type="button"
                                  onClick={() => toggleUserSort('name')}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  User Name
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                              <th className="p-3 pb-4">
                                <button
                                  type="button"
                                  onClick={() => toggleUserSort('email')}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  Email Address
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                              <th className="p-3 pb-4">
                                <button
                                  type="button"
                                  onClick={() => toggleUserSort('address')}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  Physical Location
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                              <th className="p-3 pb-4">
                                <button
                                  type="button"
                                  onClick={() => toggleUserSort('role')}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  Account Role Name
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                              <th className="p-3 pb-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleUserSort('rating')}
                                  className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                                >
                                  Store Average Rating
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {sortedUsers.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                  No registered user accounts match the selected parameters.
                                </td>
                              </tr>
                            ) : (
                              sortedUsers.map(u => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-3 font-semibold text-white">
                                    <div className="flex flex-col">
                                      <span>{u.name}</span>
                                      <span className="text-[10px] text-purple-400 font-mono">{u.id}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-200 font-mono">{u.email}</td>
                                  <td className="p-3 text-slate-300 max-w-xs truncate" title={u.address}>
                                    {u.address}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      u.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                      u.role === 'OWNER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                      'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                    }`}>
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    {u.role === 'OWNER' ? (
                                      <div className="flex items-center justify-end gap-1 font-bold text-amber-400 font-mono">
                                        <Star size={12} className="fill-amber-400" />
                                        <span>{u.rating !== undefined ? u.rating.toFixed(1) : 'No Store'}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MANAGE STORES */}
                  {adminTab === 'STORES' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <StoreIcon size={16} className="text-purple-400" />
                          Registered Commercial Stores
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                          Count: {sortedStores.length} stores listed
                        </span>
                      </div>

                      {/* Sortable Stores Table register */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-mono">
                              <th className="p-3 pb-4">
                                <button
                                  type="button"
                                  onClick={() => toggleStoreSort('name')}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  Store Outlet Name
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                              <th className="p-3 pb-4">
                                <button
                                  type="button"
                                  onClick={() => toggleStoreSort('email')}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  Public Email Address
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                              <th className="p-3 pb-4">
                                <button
                                  type="button"
                                  onClick={() => toggleStoreSort('address')}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  Geo-Location Address
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                              <th className="p-3 pb-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleStoreSort('rating')}
                                  className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                                >
                                  Average Overall Rating
                                  <ArrowUpDown size={12} />
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {sortedStores.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400">
                                  No commercial stores registered. Please create one on the overview.
                                </td>
                              </tr>
                            ) : (
                              sortedStores.map(s => (
                                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-3 font-semibold text-white">
                                    <div className="flex flex-col">
                                      <span>{s.name}</span>
                                      <span className="text-[10px] text-purple-400 font-mono">{s.id}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-200 font-mono">{s.email}</td>
                                  <td className="p-3 text-slate-300 max-w-sm truncate" title={s.address}>
                                    {s.address}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="font-bold font-mono text-emerald-400">{s.rating.toFixed(1)}</span>
                                      <StarRating rating={s.rating} size={13} interactive={false} />
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: SECURITY PANELS */}
                  {adminTab === 'SECURITY' && (
                    <div className="max-w-xl mx-auto">
                      <UpdatePasswordForm token={token!} />
                    </div>
                  )}

                </div>
              )}

              {/* --- VIEW ROUTER: NORMAL PLATFORM USER --- */}
              {currentUser?.role === 'USER' && (
                <div className="space-y-6 animate-fade-in" id="normal-user-workspace-segment">
                  
                  {/* TAB 1: EXPLORE & RATINGS SUBMISSION */}
                  {userTab === 'STORES' && (
                    <div className="space-y-6">
                      
                      {/* Search and Locate Stores Filter Form */}
                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                          <Search size={16} className="text-purple-400" />
                          <h3 className="text-xs font-semibold text-white uppercase tracking-widest">
                            Search Local Registered Stores
                          </h3>
                        </div>

                        <form onSubmit={handleStoreSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="user-store-search-form">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Store Name Query</label>
                            <input
                              id="search-store-name"
                              type="text"
                              value={searchStoreName}
                              onChange={(e) => setSearchStoreName(e.target.value)}
                              placeholder="e.g. Apex Electronics Hub"
                              className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Physical Address Query</label>
                            <input
                              id="search-store-address"
                              type="text"
                              value={searchStoreAddress}
                              onChange={(e) => setSearchStoreAddress(e.target.value)}
                              placeholder="e.g. Portland Garden Boulevard"
                              className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden"
                            />
                          </div>

                          <div className="flex items-end gap-2">
                            <button
                              type="submit"
                              id="btn-trigger-search"
                              className="flex-1 py-1.5 bg-gradient-to-r from-purple-500 to-blue-600 hover:brightness-110 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Search Outlet
                            </button>
                            <button
                              type="button"
                              onClick={resetStoreSearch}
                              id="btn-reset-search"
                              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-slate-300 text-xs transition-all cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Toast notification response helper */}
                      {userRatingMessage && (
                        <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 rounded-lg p-3 text-xs w-fit" id="user-rating-toast">
                          <Sparkles size={14} className="animate-spin-slow shrink-0" />
                          <span>{userRatingMessage}</span>
                        </div>
                      )}

                      {/* Stores Listings Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="user-stores-listings">
                        {storesList.length === 0 ? (
                          <div className="col-span-2 p-12 text-center bg-white/5 border border-white/10 rounded-2xl">
                            <StoreIcon size={32} className="text-slate-500 mx-auto mb-2" />
                            <p className="text-slate-300 text-sm">No registered stores found matching search criteria.</p>
                            <button
                              type="button"
                              onClick={resetStoreSearch}
                              className="text-xs text-purple-400 hover:underline mt-2 font-mono"
                            >
                              Reset active filters and load all stores
                            </button>
                          </div>
                        ) : (
                          storesList.map(item => (
                            <div
                              key={item.id}
                              className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-all shadow-md group"
                              id={`store-card-${item.id}`}
                            >
                              {/* Store Header Info */}
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="text-white font-bold text-base leading-snug">{item.name}</h4>
                                    <span className="text-[10px] font-mono text-purple-400">{item.id}</span>
                                  </div>

                                  <div className="flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg font-mono font-bold text-xs text-amber-400">
                                    <Star size={12} className="fill-amber-400 text-amber-500" />
                                    <span>{item.rating.toFixed(1)} Avg</span>
                                  </div>
                                </div>

                                {/* Address Details */}
                                <div className="space-y-1.5 pb-4 border-b border-white/5">
                                  <p className="text-xs text-slate-400 flex items-start gap-1.5">
                                    <MapPin size={13} className="shrink-0 text-slate-500" />
                                    <span className="leading-relaxed">{item.address}</span>
                                  </p>
                                  <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                                    <Mail size={13} className="shrink-0 text-slate-500" />
                                    <span>{item.email}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Interactive Ratings Area */}
                              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-xl mt-4 border border-white/5">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                                    {item.userSubmittedRating !== null ? 'Your Active Rating score' : 'Submit your Rating'}
                                  </span>
                                  <div className="font-mono text-xs text-white">
                                    {item.userSubmittedRating !== null ? (
                                      <span className="text-emerald-400 font-bold">Rated {item.userSubmittedRating} of 5</span>
                                    ) : (
                                      <span className="text-slate-400">Not rated yet</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-center">
                                  {/* Interactive Star component */}
                                  <StarRating
                                    rating={item.userSubmittedRating || 0}
                                    interactive={true}
                                    onRatingChange={(newVal) => submitUserRating(item.id, newVal)}
                                    size={20}
                                  />
                                  <span className="text-[9px] text-slate-500 font-mono mt-1">Tap/Click stars to rating 1 to 5</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: NORMAL USER SECURITY */}
                  {userTab === 'SECURITY' && (
                    <div className="max-w-xl mx-auto">
                      <UpdatePasswordForm token={token!} />
                    </div>
                  )}
                </div>
              )}

              {/* --- VIEW ROUTER: STORE OWNER ROLE --- */}
              {currentUser?.role === 'OWNER' && (
                <div className="space-y-6 animate-fade-in" id="owner-workspace-segment">
                  
                  {/* TAB 1: OWNER STORE INSIGHTS */}
                  {ownerTab === 'STORE' && (
                    <div id="owner-store-dashboard" className="space-y-6">
                      
                      {ownerData.store ? (
                        <>
                          {/* Store Metrics Stats header card */}
                          <div className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1 leading-tight">{ownerData.store.name}</h3>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <MapPin size={12} className="text-slate-500" />
                                <span>{ownerData.store.address}</span>
                              </p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 font-mono mt-1">
                                <Mail size={12} className="text-slate-500" />
                                <span>{ownerData.store.email}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Average Star Rating</span>
                                <div className="flex items-center gap-1.5 justify-center">
                                  <span className="text-2xl font-black text-amber-400 font-mono">{ownerData.averageRating.toFixed(1)}</span>
                                  <StarRating rating={ownerData.averageRating} interactive={false} size={16} />
                                </div>
                              </div>

                              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center font-mono">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Total Ratings</span>
                                <span className="text-2xl font-black text-white">{ownerData.ratingsReceived.length} Submissions</span>
                              </div>
                            </div>
                          </div>

                          {/* Ratings table listing */}
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                              <MessageSquare size={16} className="text-purple-400" />
                              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                                Client Feedback Log
                              </h4>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-mono">
                                    <th className="p-3 pb-4">Client User Name</th>
                                    <th className="p-3 pb-4">Rating Index</th>
                                    <th className="p-3 pb-4">Submission Star Score</th>
                                    <th className="p-3 pb-4 text-right">Registered Date</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {ownerData.ratingsReceived.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="p-8 text-center text-slate-400">
                                        No customer rating submissions recorded for your store profile yet.
                                      </td>
                                    </tr>
                                  ) : (
                                    ownerData.ratingsReceived.map(r => (
                                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3">
                                          <div className="flex flex-col">
                                            <span className="font-semibold text-white">{r.userName}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">User ID: {r.userId}</span>
                                          </div>
                                        </td>
                                        <td className="p-3 text-slate-400 font-mono text-[11px]">{r.id}</td>
                                        <td className="p-3">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-200 font-mono">{r.rating} / 5</span>
                                            <StarRating rating={r.rating} size={12} interactive={false} />
                                          </div>
                                        </td>
                                        <td className="p-3 text-right text-slate-400 font-mono">
                                          {new Date(r.createdAt).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-12 text-center bg-white/5 border border-white/10 rounded-2xl max-w-xl mx-auto">
                          <StoreIcon size={32} className="text-slate-500 mx-auto mb-2" />
                          <h4 className="text-white font-bold mb-1">No Stores Associated</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Your account profile is ready, but the System Administrator has not assigned a registered commercial store to you yet. Please request the administrator to map their newly created store to your User ID.
                          </p>
                          <div className="mt-4 p-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-xs rounded-lg inline-block">
                            Submit your ID to Admin: {currentUser?.id}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: OWNER SECURITY */}
                  {ownerTab === 'SECURITY' && (
                    <div className="max-w-xl mx-auto">
                      <UpdatePasswordForm token={token!} />
                    </div>
                  )}

                </div>
              )}
              
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
