import React, { useState } from 'react';
import {
  LayoutDashboard,
  Target,
  Users,
  HelpCircle,
  CheckSquare,
  Clock,
  MessageCircle,
  Layers,
  Activity,
  Plus,
} from 'lucide-react';
import { CrmDashboardView } from './CrmDashboardView';
import { CrmLeadsView } from './CrmLeadsView';
import { CrmCustomersView } from './CrmCustomersView';
import { CrmInquiriesView } from './CrmInquiriesView';
import { CrmTasksView } from './CrmTasksView';
import { CrmFollowUpsView } from './CrmFollowUpsView';
import { CrmConversationsView } from './CrmConversationsView';
import { CrmSegmentsView } from './CrmSegmentsView';
import { CrmTimelineView } from './CrmTimelineView';
import { CrmGlobalSearch } from './CrmGlobalSearch';
import { CrmCustomerProfileModal } from './CrmCustomerProfileModal';
import { CrmCustomerSummary, CrmLead } from '../../../types/crm';
import { Booking } from '../../../types/booking';

export type CrmSubTab =
  | 'dashboard'
  | 'leads'
  | 'customers'
  | 'inquiries'
  | 'tasks'
  | 'followups'
  | 'conversations'
  | 'segments'
  | 'timeline';

interface CrmHubProps {
  currentSubTab?: CrmSubTab;
  onSelectSubTab?: (tab: CrmSubTab) => void;
  onViewBookingDetails?: (ref: string) => void;
  onNavigateTab?: (adminTab: string) => void;
}

export const CrmHub: React.FC<CrmHubProps> = ({
  currentSubTab = 'dashboard',
  onSelectSubTab,
  onViewBookingDetails,
  onNavigateTab,
}) => {
  const [internalTab, setInternalTab] = useState<CrmSubTab>(currentSubTab);
  const activeTab = onSelectSubTab ? currentSubTab : internalTab;

  const handleTabChange = (tab: CrmSubTab) => {
    if (onSelectSubTab) {
      onSelectSubTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Global search modal selection
  const [modalCustomerEmailOrId, setModalCustomerEmailOrId] = useState<string | null>(null);

  const navItems: { id: CrmSubTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads Pipeline', icon: Target },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inquiries', label: 'Inquiries', icon: HelpCircle },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'followups', label: 'Follow-ups', icon: Clock },
    { id: 'conversations', label: 'Conversations', icon: MessageCircle },
    { id: 'segments', label: 'Customer Segments', icon: Layers },
    { id: 'timeline', label: 'Activity Timeline', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Top CRM Command Header with Navigation Tabs & Global Search */}
      <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0A6C74]/20 text-[#2dd4bf] border border-[#0A6C74]/40">
                Tour Operator CRM Platform
              </span>
              <span className="text-stone-500">•</span>
              <span className="text-xs text-stone-400">Red Sea Excursions & Yacht Charters</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
              Customer Relationship Management (CRM)
            </h1>
          </div>

          {/* Integrated Universal Search Bar */}
          <div className="w-full lg:w-96">
            <CrmGlobalSearch
              onSelectCustomer={(c: CrmCustomerSummary) => setModalCustomerEmailOrId(c.id)}
              onSelectLead={() => handleTabChange('leads')}
              onSelectBooking={(b: Booking) => {
                if (onViewBookingDetails) {
                  onViewBookingDetails(b.bookingReference);
                } else if (onNavigateTab) {
                  onNavigateTab('bookings');
                }
              }}
            />
          </div>
        </div>

        {/* Tab Navigation Pill Strip */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-t border-stone-800/80 pt-3 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0A6C74] text-white font-semibold shadow-sm ring-1 ring-[#2dd4bf]/30'
                    : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-stone-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active View */}
      <div>
        {activeTab === 'dashboard' && (
          <CrmDashboardView
            onNavigateTab={(tab) => {
              if (tab === 'crm_leads') handleTabChange('leads');
              else if (tab === 'crm_customers') handleTabChange('customers');
              else if (tab === 'crm_followups') handleTabChange('followups');
              else if (tab === 'crm_tasks') handleTabChange('tasks');
              else if (tab === 'crm_inquiries') handleTabChange('inquiries');
              else if (onNavigateTab) onNavigateTab(tab);
            }}
            onOpenNewLead={() => handleTabChange('leads')}
            onOpenNewFollowUp={() => handleTabChange('followups')}
          />
        )}

        {activeTab === 'leads' && (
          <CrmLeadsView
            onConvertLeadToBooking={() => {
              if (onNavigateTab) onNavigateTab('bookings');
            }}
          />
        )}

        {activeTab === 'customers' && (
          <CrmCustomersView onViewBookingDetails={onViewBookingDetails} />
        )}

        {activeTab === 'inquiries' && (
          <CrmInquiriesView
            onNavigateTab={(tab) => {
              if (tab === 'crm_leads') handleTabChange('leads');
              else if (tab === 'crm_customers') handleTabChange('customers');
              else if (onNavigateTab) onNavigateTab(tab);
            }}
          />
        )}

        {activeTab === 'tasks' && <CrmTasksView />}

        {activeTab === 'followups' && <CrmFollowUpsView />}

        {activeTab === 'conversations' && <CrmConversationsView />}

        {activeTab === 'segments' && <CrmSegmentsView />}

        {activeTab === 'timeline' && <CrmTimelineView />}
      </div>

      {/* Global Customer Profile Modal */}
      {modalCustomerEmailOrId && (
        <CrmCustomerProfileModal
          customerEmailOrId={modalCustomerEmailOrId}
          onClose={() => setModalCustomerEmailOrId(null)}
          onViewBookingDetails={onViewBookingDetails}
        />
      )}
    </div>
  );
};
