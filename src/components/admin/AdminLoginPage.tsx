import React, { useState } from 'react';
import { Lock, Mail, Compass, AlertCircle, ArrowLeft, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToSite: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onBackToSite,
}) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@redseavoyages.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await signIn(email, password);
    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setErrorMsg(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@redseavoyages.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-between text-stone-100 p-4 sm:p-6 antialiased selection:bg-[#0A6C74] selection:text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <button
          type="button"
          onClick={onBackToSite}
          className="flex items-center space-x-1.5 text-xs text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Public Website</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-stone-400 uppercase tracking-widest font-mono">
            {isSupabaseConfigured() ? 'Supabase Auth Protected' : 'Sandbox Admin Auth'}
          </span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 shadow-2xl space-y-6">
          {/* Brand & Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#0A6C74]/20 border border-[#0A6C74]/40 text-[#2dd4bf] flex items-center justify-center mx-auto mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#0A6C74]">
              Staff & Operations Portal
            </span>
            <h1 className="text-2xl font-bold font-display text-white tracking-tight">
              Admin CMS Login
            </h1>
            <p className="text-xs text-stone-400">
              Sign in with your verified administrator credentials to manage tours, itineraries, bookings, and Supabase media.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-stone-300 font-semibold block mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@redseavoyages.com"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white text-xs placeholder-stone-600 focus:outline-none focus:border-[#0A6C74]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-stone-300 font-semibold">
                  Password
                </label>
                <span className="text-[10px] text-stone-500">Encrypted via Supabase</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white text-xs placeholder-stone-600 focus:outline-none focus:border-[#0A6C74]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access CMS Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="p-3 bg-stone-950/80 rounded-lg border border-stone-800/80 space-y-2 text-center">
            <div className="flex items-center justify-center space-x-1 text-stone-400 text-[11px]">
              <Key className="w-3 h-3 text-amber-400" />
              <span>Demo Administrator Access:</span>
            </div>
            <div className="text-[11px] font-mono text-stone-300 bg-stone-900 py-1 px-2 rounded">
              admin@redseavoyages.com / admin123
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-[11px] text-[#2dd4bf] hover:underline block mx-auto font-medium"
            >
              Auto-fill Demo Credentials
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-stone-500">
        Red Sea Voyages CMS • Supabase Database & Auth Protected
      </div>
    </div>
  );
};
