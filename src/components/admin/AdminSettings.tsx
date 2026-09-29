import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Key,
  Server
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  updateSupabaseCredentials,
  supabase,
  isSchemaMissingError,
  setSchemaMissing,
} from '../../services/supabaseClient';
import phase4Sql from '../../../supabase/migrations/20260922000000_phase4_schema.sql?raw';
import fixAdminAuthSql from '../../../supabase/migrations/20260928000000_fix_admin_auth_rls.sql?raw';

export const AdminSettings: React.FC = () => {
  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedFixSql, setCopiedFixSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [showFixSqlPreview, setShowFixSqlPreview] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      if (supabaseUrl && supabaseAnonKey) {
        updateSupabaseCredentials(supabaseUrl, supabaseAnonKey);
      }

      if (!isSupabaseConfigured()) {
        setTestResult({
          success: false,
          message: 'Invalid credentials format. Supabase URL must be https://<project-ref>.supabase.co and Anon Key must be provided.',
        });
        setIsTesting(false);
        return;
      }

      // Execute a real ping query to Supabase PostgreSQL
      const { data, error } = await supabase.from('destinations').select('id, name').limit(1);

      if (error) {
        if (isSchemaMissingError(error)) {
          setSchemaMissing(true);
          setTestResult({
            success: true,
            message: `Connection established to Supabase! However, the database tables (e.g. destinations, tours) have not been created yet in PostgreSQL. Copy and execute the Phase 4 SQL Migration below in your Supabase SQL Editor to finish setup.`,
          });
        } else {
          setTestResult({
            success: false,
            message: `Connection error: ${error.message} (Code: ${error.code || 'UNKNOWN'})`,
          });
        }
      } else {
        setSchemaMissing(false);
        setTestResult({
          success: true,
          message: `Connection successful! Connected to remote PostgreSQL database. Verified query response: ${data?.length || 0} destination(s) retrieved.`,
        });
      }
    } catch (err: any) {
      if (isSchemaMissingError(err)) {
        setSchemaMissing(true);
        setTestResult({
          success: true,
          message: `Connection established to Supabase! Tables have not been created yet in PostgreSQL. Copy the SQL script below and run it in your Supabase SQL Editor.`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Failed to connect: ${err.message || 'Unknown network error'}`,
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const copyMigrationSql = () => {
    navigator.clipboard.writeText(phase4Sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const copyFixSql = () => {
    navigator.clipboard.writeText(fixAdminAuthSql);
    setCopiedFixSql(true);
    setTimeout(() => setCopiedFixSql(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-white tracking-tight">
          System Architecture & Supabase Settings
        </h1>
        <p className="text-xs text-stone-400 mt-1">
          Verify database credentials, Storage bucket status, Row Level Security (RLS), and schema migrations.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="bg-stone-950 border border-stone-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSupabaseConfigured() ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">PostgreSQL & Storage Backend</h2>
              <p className="text-xs text-stone-400">
                {isSupabaseConfigured() ? 'Live Supabase integration active' : 'Local browser storage active'}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
            isSupabaseConfigured()
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {isSupabaseConfigured() ? 'Connected' : 'Local Storage'}
          </span>
        </div>

        {/* Credentials Form */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-stone-300 font-semibold block mb-1">
              Supabase Project URL (<code className="text-[#2dd4bf]">VITE_SUPABASE_URL</code>)
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded text-white font-mono text-xs focus:outline-none focus:border-[#0A6C74]"
            />
          </div>

          <div>
            <label className="text-stone-300 font-semibold block mb-1">
              Supabase Public Anon Key (<code className="text-[#2dd4bf]">VITE_SUPABASE_ANON_KEY</code>)
            </label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder={currentConfig.anonKey ? '••••••••••••••••••••••••••••••••••••••••••••' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}
              className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded text-white font-mono text-xs focus:outline-none focus:border-[#0A6C74]"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Safe for browser clients. Protected by PostgreSQL Row Level Security (RLS). Never enter your <code className="text-red-400">service_role</code> secret here.
            </p>
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded text-xs font-semibold shadow transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Connection...' : 'Save & Test Live Connection'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded text-xs flex items-start space-x-2 ${
              testResult.success
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                : 'bg-red-950/60 border border-red-800 text-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{testResult.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Auth & RLS Fix Card (Direct Solution for SQL Editor & Role Assignments) */}
      <div className="bg-stone-950 border border-[#0A6C74]/50 rounded-lg p-6 space-y-4 text-xs shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#0A6C74]/20 border border-[#0A6C74] flex items-center justify-center text-[#2dd4bf]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Admin Authorization & RLS Recursion Hotfix</h3>
              <p className="text-[11px] text-stone-400">
                Resolves infinite recursion in <code className="text-[#2dd4bf]">public.profiles</code> policies and guarantees admin logins succeed.
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Recommended Fix
          </span>
        </div>

        <p className="text-stone-300 leading-relaxed text-[11px]">
          If you assigned an administrator role in the Supabase SQL Editor and were redirected back to the login page, run this lightweight hotfix. It replaces recursive policies with strict non-recursive rules, secures <code className="text-[#2dd4bf]">is_admin()</code> with PL/pgSQL, backfills missing profile records, and provides the <code className="text-amber-400">set_admin_role_by_email('your-email')</code> helper.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-stone-800">
          <span className="text-stone-400 font-mono text-[11px]">
            File: <code>/supabase/migrations/20260928000000_fix_admin_auth_rls.sql</code>
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFixSqlPreview(!showFixSqlPreview)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 text-xs font-medium transition-colors"
            >
              {showFixSqlPreview ? 'Hide SQL Script' : 'View SQL Script'}
            </button>
            <button
              type="button"
              onClick={copyFixSql}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0A6C74] hover:bg-[#08545a] text-white rounded text-xs font-semibold shadow-sm transition-colors"
            >
              {copiedFixSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFixSql ? 'Copied Hotfix SQL!' : 'Copy Admin Role Fix SQL'}</span>
            </button>
          </div>
        </div>

        {showFixSqlPreview && (
          <div className="mt-4 p-4 bg-stone-900 rounded border border-stone-800 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-400 text-[11px]">
              <span>Admin Role & Non-Recursive RLS Hotfix (~120 lines)</span>
              <span>Run in Supabase Dashboard &gt; SQL Editor</span>
            </div>
            <pre className="max-h-64 overflow-y-auto p-3 bg-stone-950 rounded text-[11px] font-mono text-stone-300 leading-relaxed whitespace-pre select-all">
              {fixAdminAuthSql}
            </pre>
          </div>
        )}
      </div>

      {/* Database Schema & RLS Checklist */}
      <div className="bg-stone-950 border border-stone-800 rounded-lg p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#2dd4bf]" />
          <span>PostgreSQL Normalized Schema & Security Architecture</span>
        </h3>
        <p className="text-stone-400 leading-relaxed">
          The database schema follows strict 3rd Normal Form guidelines without monolithic tables. Every child entity (highlights, inclusions, exclusions, itinerary stops, FAQs, media, pickup fees, and extras) resides in its dedicated relational table with cascading referential integrity.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-stone-900/60 rounded border border-stone-800 space-y-1">
            <span className="font-semibold text-white block">Row Level Security (RLS)</span>
            <p className="text-stone-400 text-[11px]">
              Public anonymous visitors can only select <code className="text-[#2dd4bf]">status = 'published'</code>. Mutations require <code className="text-amber-400">role = 'admin'</code>.
            </p>
          </div>

          <div className="p-3 bg-stone-900/60 rounded border border-stone-800 space-y-1">
            <span className="font-semibold text-white block">Storage Bucket: tour-media</span>
            <p className="text-stone-400 text-[11px]">
              Public read access with MIME-type restriction (JPG, PNG, WebP, AVIF, MP4) up to 10MB per asset.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-stone-800/80">
          <span className="text-stone-400">
            Migration File: <code className="text-stone-300">/supabase/migrations/20260922000000_phase4_schema.sql</code>
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 text-xs font-medium transition-colors"
            >
              {showSqlPreview ? 'Hide SQL Script' : 'View SQL Script'}
            </button>
            <button
              type="button"
              onClick={copyMigrationSql}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0A6C74] hover:bg-[#08545a] text-white rounded text-xs font-semibold shadow-sm transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied Full SQL!' : 'Copy SQL Migration'}</span>
            </button>
          </div>
        </div>

        {showSqlPreview && (
          <div className="mt-4 p-4 bg-stone-900 rounded border border-stone-800 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-400 text-[11px]">
              <span>Phase 4 Complete PostgreSQL Schema (~770 lines)</span>
              <span>Execute in Supabase SQL Editor</span>
            </div>
            <pre className="max-h-72 overflow-y-auto p-3 bg-stone-950 rounded text-[11px] font-mono text-stone-300 leading-relaxed whitespace-pre select-all">
              {phase4Sql}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
