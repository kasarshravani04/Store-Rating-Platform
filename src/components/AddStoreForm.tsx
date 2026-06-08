import React, { useState, useEffect } from 'react';
import { Store, CheckCircle, AlertCircle } from 'lucide-react';

interface AddStoreFormProps {
  token: string;
  onStoreAdded: () => void;
}

interface OwnerOption {
  id: string;
  name: string;
}

export default function AddStoreForm({ token, onStoreAdded }: AddStoreFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<OwnerOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchOwners();
  }, [token]);

  const fetchOwners = async () => {
    try {
      const response = await fetch('/api/admin/owners', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOwners(data);
        if (data.length > 0) {
          setOwnerId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load store owners:', e);
    }
  };

  const validateForm = (): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Store name is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return 'Please supply a standard valid email Address for the store.';
    }
    if (!address || address.length > 400) {
      return 'Address is required and must stand below 400 characters.';
    }
    if (!ownerId) {
      return 'Please assign a verified Store Owner to this shop.';
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
      const response = await fetch('/api/admin/add-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, address, ownerId })
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to create this store.');
      } else {
        setSuccessMsg(`Store "${name}" has been registered successfully!`);
        setName('');
        setEmail('');
        setAddress('');
        onStoreAdded();
      }
    } catch {
      setErrorMsg('Network error encountered. Could not complete addition.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="add-store-card" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <Store size={18} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Register New Store
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" id="admin-add-store-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Store Name</label>
            <input
              id="admin-store-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sterling Grocery Mart"
              className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Store Email</label>
            <input
              id="admin-store-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. contact@sterlinggrocery.com"
              className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Store Owner</label>
            {owners.length === 0 ? (
              <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                No Store Owners are currently registered in the database. Please create a Store Owner user first.
              </div>
            ) : (
              <select
                id="admin-store-owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              >
                {owners.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
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
            id="admin-store-address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Complete street address details..."
            className="w-full text-xs px-3 py-2 bg-slate-900/45 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
            required
          />
        </div>

        {errorMsg && (
          <div className="flex items-start gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-xs text-rose-300" id="add-store-error">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-emerald-300 animate-fade-in" id="add-store-success">
            <CheckCircle size={14} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="admin-add-store-submit-btn"
            disabled={loading || owners.length === 0}
            className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:brightness-110 shadow-md transition-all focus:outline-hidden disabled:opacity-50"
          >
            {loading ? 'Registering Store...' : 'Register Store'}
          </button>
        </div>
      </form>
    </div>
  );
}
