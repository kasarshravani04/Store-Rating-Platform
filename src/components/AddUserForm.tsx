import React, { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

interface AddUserFormProps {
  token: string;
  onUserAdded: () => void;
}

export default function AddUserForm({ token, onUserAdded }: AddUserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<UserRole>('USER');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validation Checkers
  const validateForm = (): string | null => {
    if (!name || name.length < 2 || name.length > 60) {
      return 'Name is required and must stand between 2 and 60 characters long.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return 'Please supply a standard valid email Address.';
    }
    if (!address || address.length > 400) {
      return 'Address is required and must be under 400 characters.';
    }
    if (password.length < 8 || password.length > 16) {
      return 'Password must be 8-16 characters.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter (A-Z).';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clientErr = validateForm();
    if (clientErr) {
      setErrorMsg(clientErr);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, password, address, role })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to register this account.');
      } else {
        setSuccessMsg(`User "${name}" has been registered safely as ${role}.`);
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setAddress('');
        setRole('USER');
        onUserAdded();
      }
    } catch {
      setErrorMsg('Network error encountered. Could not complete addition.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="add-user-card" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <UserPlus size={18} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Add New User Account
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" id="admin-add-user-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <span className={`text-[10px] ${name.length >= 2 && name.length <= 60 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {name.length}/2-60 chars
              </span>
            </div>
            <input
              id="admin-user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Christopher Nolan Miller Jr"
              className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              id="admin-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. christopher@mail.com"
              className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Temporary Password</label>
              <span className="text-[10px] text-slate-400">8-16, uppercase, special</span>
            </div>
            <input
              id="admin-user-pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Role Account Level</label>
            <select
              id="admin-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="USER" className="bg-slate-900 text-white">Normal Platform User</option>
              <option value="OWNER" className="bg-slate-900 text-white">Store Owner Account</option>
              <option value="ADMIN" className="bg-slate-900 text-white">System Administrator</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-300">Physical Address</label>
            <span className={`text-[10px] ${address.length <= 400 ? 'text-slate-400' : 'text-rose-400'}`}>
              {address.length}/400 chars
            </span>
          </div>
          <textarea
            id="admin-user-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Complete street address details..."
            className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
            required
          />
        </div>

        {errorMsg && (
          <div className="flex items-start gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-xs text-rose-300 animate-slide-in" id="add-user-error">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-emerald-300" id="add-user-success">
            <CheckCircle size={14} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="admin-add-user-submit-btn"
            disabled={loading}
            className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:brightness-110 shadow-md transition-all focus:outline-hidden disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register User'}
          </button>
        </div>
      </form>
    </div>
  );
}
