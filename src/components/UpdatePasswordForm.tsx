import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

interface UpdatePasswordFormProps {
  token: string;
}

export default function UpdatePasswordForm({ token }: UpdatePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate password locally before sending
  const validatePasswordStrength = (pwd: string): string | null => {
    if (pwd.length < 8 || pwd.length > 16) {
      return 'Password must be 8-16 characters long.';
    }
    const hasUpper = /[A-Z]/.test(pwd);
    const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    if (!hasUpper) return 'Password must include at least one uppercase letter (A-Z).';
    if (!hasSpec) return 'Password must include at least one special character.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorObj(null);
    setSuccess(null);

    const validationError = validatePasswordStrength(newPassword);
    if (validationError) {
      setErrorObj(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorObj(data.error || 'Failed to update your password.');
      } else {
        setSuccess('Your password has been updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch {
      setErrorObj('A network issue occurred. Please check your connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="update-password-card" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full">
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <Lock className="text-purple-400" size={18} />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Update Secure Password</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" id="update-pwd-form">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              id="current-password-input"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full text-xs pl-3 pr-10 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              id="toggle-cur-pwd-btn"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-hidden"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              New Password
            </label>
            <span className="text-[10px] text-slate-400 font-mono">8-16 chars</span>
          </div>
          <div className="relative">
            <input
              id="new-password-input"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full text-xs pl-3 pr-10 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              id="toggle-new-pwd-btn"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-hidden"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {errorObj && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-xs text-rose-300 animate-fade-in" id="pwd-error-msg">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{errorObj}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-300" id="pwd-success-msg">
            <CheckCircle size={14} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          id="submit-update-pwd-btn"
          disabled={loading}
          className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:brightness-110 font-semibold text-xs transition-all focus:outline-hidden disabled:opacity-50"
        >
          {loading ? 'Changing Password...' : 'Save New Password'}
        </button>
      </form>
    </div>
  );
}
