import React from 'react';
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  Users,
  MapPin,
  Layers,
  Calendar,
  Sparkles,
  Car,
  Star,
  Image,
  Globe,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
  Database,
  Plus,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';

export type AdminTab =
  | 'dashboard'
  | 'tours'
  | 'tour_new'
  | 'tour_edit'
  | 'bookings'
  | 'customers'
  | 'destinations'
  | 'categories'
  | 'availability'
  | 'extras'
  | 'pickup'
  | 'reviews'
  | 'media'
  | 'seo'
  | 'settings';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab, param?: string) => void;
  onNavigateSite: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  onNavigateSite,
  children,
}) => {
  const { user, signOut } = useAuth();
  const supabaseConnected = isSupabaseConfigured();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'tours',
      label: 'Tours & Excursions',
      icon: Compass,
      children: [
        { id: 'tours', label: 'All Tours' },
        { id: 'tour_new', label: 'Add New Tour' },
      ],
    },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'destinations', label: 'Destinations', icon: MapPin },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'extras', label: 'Tour Extras', icon: Sparkles },
    { id: 'pickup', label: 'Pickup Locations', icon: Car },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'seo', label: 'SEO & Meta', icon: Globe },
    { id: 'settings', label: 'Settings & Supabase', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col antialiased selection:bg-[#0A6C74] selection:text-white">
      {/* Top Warning Banner if Supabase is in local fallback mode */}
      {!supabaseConnected && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Supabase Sandbox Mode:</strong> Currently utilizing local persistence with pre-seeded demo records. Connect your live Supabase project in{' '}
              <button
                type="button"
                onClick={() => onSelectTab('settings')}
                className="underline font-semibold hover:text-white"
              >
                Settings &gt; Supabase
              </button>{' '}
              to sync with your remote PostgreSQL instance.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded font-medium text-[11px] transition-colors"
          >
            Configure Keys
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-stone-950 border-r border-stone-800 flex flex-col justify-between shrink-0">
          <div>
            {/* Brand Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#0A6C74] font-bold block">
                  Admin Control Center
                </span>
                <h1 className="font-display font-bold text-base text-white tracking-wide">
                  Red Sea Voyages
                </h1>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0A6C74]/20 text-[#2dd4bf] border border-[#0A6C74]/30">
                CMS v4.0
              </span>
            </div>

            {/* Quick Action: New Tour */}
            <div className="p-3">
              <button
                type="button"
                onClick={() => onSelectTab('tour_new')}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-[#0A6C74] hover:bg-[#08565C] text-white rounded-md text-xs font-semibold shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Tour</span>
              </button>
            </div>

            {/* Navigation links */}
            <nav className="p-3 space-y-1 text-xs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id || (item.children && item.children.some((c) => c.id === activeTab));

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => onSelectTab(item.id as AdminTab)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isCurrent
                          ? 'bg-stone-800/90 text-white font-semibold'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isCurrent ? 'text-[#2dd4bf]' : 'text-stone-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isCurrent && <ChevronRight className="w-3.5 h-3.5 text-stone-500" />}
                    </button>

                    {/* Sub-items for Tours */}
                    {item.children && isCurrent && (
                      <div className="ml-7 pl-2 border-l border-stone-800 space-y-0.5 py-1">
                        {item.children.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => onSelectTab(sub.id as AdminTab)}
                            className={`w-full text-left py-1 px-2 rounded text-[11px] transition-colors ${
                              activeTab === sub.id
                                ? 'text-[#2dd4bf] font-medium bg-stone-800/40'
                                : 'text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Footer */}
          <div className="p-3 border-t border-stone-800 space-y-2">
            <div className="flex items-center space-x-2 px-2 py-1.5 rounded bg-stone-900/60">
              <div className="w-7 h-7 rounded-full bg-[#0A6C74] text-white flex items-center justify-center font-bold text-xs">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-stone-200 truncate">{user?.fullName || 'Admin Officer'}</p>
                <p className="text-[10px] text-stone-400 truncate">{user?.email || 'admin@redsea.com'}</p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wide bg-stone-800 text-stone-300 rounded font-semibold">
                {user?.role || 'admin'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-1">
              <button
                type="button"
                onClick={onNavigateSite}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded text-[11px] transition-colors"
                title="View Live Website"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Site</span>
              </button>

              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-stone-900 hover:bg-red-950/40 text-stone-400 hover:text-red-300 rounded text-[11px] transition-colors"
                title="Sign out of CMS"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-stone-900">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
