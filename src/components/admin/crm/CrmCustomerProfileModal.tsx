import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Building,
  Calendar,
  CreditCard,
  HelpCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Plus,
  Tag,
  FileText,
  DollarSign,
  Star,
  ExternalLink,
  ChevronRight,
  Pin,
  Trash2,
  Edit2,
  Save,
  Check,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  getCrmCustomerDetail,
  addCustomerStaffNote,
  logCommunication,
  scheduleFollowUp,
  createCrmTask,
  completeFollowUp,
  updateCrmTaskStatus,
  addCustomerTag,
  removeCustomerTag,
  updateCrmCustomer,
  recordCustomerPayment,
} from '../../../services/crmService';
import {
  CrmCustomerDetail,
  CrmCommunicationChannel,
  CrmTaskPriority,
} from '../../../types/crm';
import { useToast } from '../../../contexts/ToastContext';

interface CrmCustomerProfileModalProps {
  customerEmailOrId: string;
  onClose: () => void;
  onUpdated?: () => void;
  onViewBookingDetails?: (ref: string) => void;
}

type TabType =
  | 'overview'
  | 'bookings'
  | 'payments'
  | 'inquiries'
  | 'communications'
  | 'notes'
  | 'tasks'
  | 'followups'
  | 'timeline'
  | 'reviews';

export const CrmCustomerProfileModal: React.FC<CrmCustomerProfileModalProps> = ({
  customerEmailOrId,
  onClose,
  onUpdated,
  onViewBookingDetails,
}) => {
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<CrmCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Edit Information
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editHotel, setEditHotel] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Add Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState('Captain Ahmed');
  const [newNotePinned, setNewNotePinned] = useState(false);

  // Add Communication State
  const [commChannel, setCommChannel] = useState<CrmCommunicationChannel>('whatsapp');
  const [commDirection, setCommDirection] = useState<'outbound' | 'inbound'>('outbound');
  const [commMessage, setCommMessage] = useState('');
  const [commSubject, setCommSubject] = useState('');

  // Add Task State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStaff, setTaskStaff] = useState('Captain Ahmed');
  const [taskPriority, setTaskPriority] = useState<CrmTaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );

  // Add Follow-up State
  const [isFupModalOpen, setIsFupModalOpen] = useState(false);
  const [fupNotes, setFupNotes] = useState('');
  const [fupDate, setFupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [fupStaff, setFupStaff] = useState('Captain Ahmed');

  // Payment Recording State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash at Marina Desk');
  const [paymentRef, setPaymentRef] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCrmCustomerDetail(customerEmailOrId);
      if (data) {
        setCustomer(data);
        setEditPhone(data.phone || '');
        setEditWhatsapp(data.whatsapp || '');
        setEditHotel(data.hotel || '');
        setEditCountry(data.country || '');
        setEditNotes(data.notes || '');
        setPaymentAmount(data.outstandingAmountEur || 0);
      }
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerEmailOrId]);

  const handleSaveInfo = async () => {
    if (!customer) return;
    try {
      await updateCrmCustomer(customer.id, {
        phone: editPhone,
        whatsapp: editWhatsapp,
        hotel: editHotel,
        country: editCountry,
        notes: editNotes,
      });
      showToast('Traveler information updated successfully.', 'success');
      setIsEditingInfo(false);
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to update info', 'error');
    }
  };

  const handleAddTag = async () => {
    if (!customer || !newTagInput.trim()) return;
    try {
      await addCustomerTag(customer.id, newTagInput.trim());
      setNewTagInput('');
      loadData();
      showToast(`Tag added to ${customer.fullName}.`, 'success');
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to add tag', 'error');
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!customer) return;
    try {
      await removeCustomerTag(customer.id, tag);
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove tag', 'error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !newNoteText.trim()) return;
    try {
      await addCustomerStaffNote(customer.id, newNoteAuthor, newNoteText.trim(), newNotePinned);
      setNewNoteText('');
      setNewNotePinned(false);
      showToast('Internal note recorded.', 'success');
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to save note', 'error');
    }
  };

  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !commMessage.trim()) return;
    try {
      await logCommunication({
        customerId: customer.id,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerName: customer.fullName,
        channel: commChannel,
        direction: commDirection,
        sender: commDirection === 'outbound' ? 'Red Sea Concierge' : customer.fullName,
        recipient: commDirection === 'outbound' ? customer.fullName : 'Red Sea Concierge',
        subject: commSubject.trim() || undefined,
        message: commMessage.trim(),
      });
      setCommMessage('');
      setCommSubject('');
      showToast('Communication logged to traveler activity record.', 'success');
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to log communication', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !taskTitle.trim()) return;
    try {
      await createCrmTask({
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        customerId: customer.id,
        customerName: customer.fullName,
        assignedStaff: taskStaff,
        priority: taskPriority,
        dueDate: taskDueDate,
        status: 'pending',
      });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      showToast('Staff task assigned.', 'success');
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to create task', 'error');
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !fupNotes.trim()) return;
    try {
      await scheduleFollowUp({
        customerId: customer.id,
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        notes: fupNotes.trim(),
        scheduledFor: fupDate,
        assignedStaff: fupStaff,
      });
      setIsFupModalOpen(false);
      setFupNotes('');
      showToast('Follow-up scheduled.', 'success');
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule follow-up', 'error');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || paymentAmount <= 0) return;
    try {
      await recordCustomerPayment(customer.id, paymentAmount, paymentMethod, paymentRef);
      setIsPaymentModalOpen(false);
      showToast(`Payment of €${paymentAmount.toFixed(2)} recorded.`, 'success');
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    }
  };

  const handleCompleteFup = async (fupId: string) => {
    try {
      await completeFollowUp(fupId);
      showToast('Follow-up marked as completed.', 'success');
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete follow-up', 'error');
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await updateCrmTaskStatus(taskId, nextStatus);
      showToast(`Task marked as ${nextStatus}.`, 'info');
      loadData();
      onUpdated?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto antialiased">
      <div className="bg-stone-900 border border-stone-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#0A6C74]/20 border border-[#0A6C74]/40 flex items-center justify-center text-[#2dd4bf] font-bold text-lg">
              {customer?.fullName?.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white font-display">
                  {customer ? customer.fullName : 'Customer Profile'}
                </h2>
                {customer?.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-stone-400 flex items-center space-x-3 mt-0.5">
                <span>{customer?.email}</span>
                {customer?.phone && (
                  <>
                    <span>•</span>
                    <span>{customer.phone}</span>
                  </>
                )}
                <span>•</span>
                <span className="text-[#2dd4bf]">Source: {customer?.customerSource || 'Website'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsFupModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-medium transition-colors flex items-center space-x-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Schedule Follow-up</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="px-2.5 py-1.5 bg-[#0A6C74]/20 hover:bg-[#0A6C74]/30 text-[#2dd4bf] border border-[#0A6C74]/40 rounded text-xs font-medium transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-stone-800 bg-stone-900/50 flex space-x-1 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Customer Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'bookings'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Booking History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
              {customer?.bookings?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'payments'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Payments</span>
            {(customer?.outstandingAmountEur || 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                Due €{customer?.outstandingAmountEur.toFixed(0)}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'inquiries'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Inquiries</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
              {customer?.inquiries?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('communications')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'communications'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Communications</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
              {customer?.communications?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'notes'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Notes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
              {customer?.staffNotes?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'tasks'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
              {customer?.tasks?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('followups')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'followups'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Follow-ups</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] text-stone-300">
              {customer?.followUps?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Activity Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-[#2dd4bf] text-[#2dd4bf] font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Reviews
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-stone-400">
              <Clock className="w-8 h-8 animate-spin mx-auto text-[#2dd4bf] mb-2" />
              <p className="text-sm">Loading comprehensive traveler record...</p>
            </div>
          ) : !customer ? (
            <div className="py-20 text-center text-stone-400">
              <AlertCircle className="w-10 h-10 mx-auto text-amber-400 mb-2" />
              <p className="text-sm">Customer profile could not be located.</p>
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW & CUSTOMER INFORMATION */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Financial & Booking Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-lg">
                      <span className="text-xs text-stone-400">Total Bookings</span>
                      <div className="text-xl font-bold text-white mt-1">
                        {customer.totalBookings}
                        <span className="text-xs font-normal text-stone-400 ml-1">
                          ({customer.completedBookings} completed)
                        </span>
                      </div>
                    </div>
                    <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-lg">
                      <span className="text-xs text-stone-400">Total Revenue</span>
                      <div className="text-xl font-bold text-emerald-400 mt-1">
                        €{customer.totalRevenueEur.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-lg">
                      <span className="text-xs text-stone-400">Outstanding Balance</span>
                      <div className={`text-xl font-bold mt-1 ${customer.outstandingAmountEur > 0 ? 'text-amber-400' : 'text-stone-400'}`}>
                        €{customer.outstandingAmountEur.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-lg">
                      <span className="text-xs text-stone-400">First Contact / Created</span>
                      <div className="text-xs font-semibold text-stone-200 mt-2">
                        {new Date(customer.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Cards */}
                  <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800">
                      <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                        <User className="w-4 h-4 text-[#2dd4bf]" />
                        <span>Traveler Profile & Contact Info</span>
                      </h3>
                      {!isEditingInfo ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingInfo(true)}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit Info</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingInfo(false)}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveInfo}
                            className="px-2.5 py-1 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded text-xs flex items-center space-x-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditingInfo ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-stone-500 block mb-0.5">Full Name</span>
                          <span className="text-white font-medium text-sm">{customer.fullName}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block mb-0.5">Email Address</span>
                          <a
                            href={`mailto:${customer.email}`}
                            className="text-[#2dd4bf] hover:underline font-mono"
                          >
                            {customer.email}
                          </a>
                        </div>
                        <div>
                          <span className="text-stone-500 block mb-0.5">Phone Number</span>
                          {customer.phone ? (
                            <a href={`tel:${customer.phone}`} className="text-stone-200 hover:text-white font-mono">
                              {customer.phone}
                            </a>
                          ) : (
                            <span className="text-stone-600 italic">Not recorded</span>
                          )}
                        </div>
                        <div>
                          <span className="text-stone-500 block mb-0.5">WhatsApp Number</span>
                          {customer.whatsapp ? (
                            <a
                              href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline font-mono flex items-center space-x-1"
                            >
                              <span>{customer.whatsapp}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-stone-600 italic">Not recorded</span>
                          )}
                        </div>
                        <div>
                          <span className="text-stone-500 block mb-0.5">Country / Nationality</span>
                          <span className="text-stone-200">{customer.country || 'International'}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block mb-0.5">Hurghada Hotel / Resort</span>
                          <span className="text-stone-200">{customer.hotel || 'To be confirmed'}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block mb-0.5">Acquisition Source</span>
                          <span className="text-stone-300">{customer.customerSource}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block mb-0.5">Latest Booking Date</span>
                          <span className="text-stone-300">{customer.latestBookingDate || 'None yet'}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block mb-0.5">Last Contact Log</span>
                          <span className="text-stone-300">
                            {customer.lastContactDate
                              ? new Date(customer.lastContactDate).toLocaleDateString('en-GB')
                              : 'Never'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="text-stone-400 block mb-1">Phone Number</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+20 100 123 4567"
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-stone-400 block mb-1">WhatsApp</label>
                          <input
                            type="text"
                            value={editWhatsapp}
                            onChange={(e) => setEditWhatsapp(e.target.value)}
                            placeholder="+20 100 123 4567"
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-stone-400 block mb-1">Country / Nationality</label>
                          <input
                            type="text"
                            value={editCountry}
                            onChange={(e) => setEditCountry(e.target.value)}
                            placeholder="e.g. Germany"
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-stone-400 block mb-1">Hurghada Hotel / Resort</label>
                          <input
                            type="text"
                            value={editHotel}
                            onChange={(e) => setEditHotel(e.target.value)}
                            placeholder="e.g. Steigenberger ALDAU Beach"
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-stone-400 block mb-1">Internal Notes</label>
                          <textarea
                            rows={2}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Preferences, family notes, dietary requests..."
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-1.5 text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Customer Tags Editor */}
                    <div className="mt-5 pt-4 border-t border-stone-800">
                      <span className="text-xs text-stone-400 block mb-2 font-medium">Customer Tags & Segmentation:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {customer.tags?.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs bg-stone-800 text-stone-200 border border-stone-700"
                          >
                            <span>{t}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(t)}
                              className="text-stone-400 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <div className="inline-flex items-center space-x-1">
                          <input
                            type="text"
                            placeholder="+ Add tag (e.g. VIP, Diver)"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-[#0A6C74]"
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-2 py-0.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded text-xs"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Dock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('communications')}
                      className="p-3 bg-stone-950/60 border border-stone-800 hover:border-stone-700 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="text-xs font-semibold text-white">Send WhatsApp / Message</div>
                          <div className="text-[11px] text-stone-400">Log multi-channel chats</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="p-3 bg-stone-950/60 border border-stone-800 hover:border-stone-700 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-amber-400" />
                        <div>
                          <div className="text-xs font-semibold text-white">Record Payment</div>
                          <div className="text-[11px] text-stone-400">Cash or card collection</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('timeline')}
                      className="p-3 bg-stone-950/60 border border-stone-800 hover:border-stone-700 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-[#2dd4bf]" />
                        <div>
                          <div className="text-xs font-semibold text-white">Full Event Timeline</div>
                          <div className="text-[11px] text-stone-400">Chronological history</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. BOOKING HISTORY */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Reservation History ({customer.bookings.length})
                    </h3>
                  </div>

                  {customer.bookings.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-lg">
                      <CalendarCheck className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                      <p className="text-xs">No bookings recorded yet for this traveler.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customer.bookings.map((b) => (
                        <div
                          key={b.bookingReference}
                          className="bg-stone-950/60 border border-stone-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-[#2dd4bf]">
                                {b.bookingReference}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  b.status === 'confirmed'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : b.status === 'completed'
                                    ? 'bg-teal-500/20 text-teal-300'
                                    : b.status === 'cancelled'
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-stone-700 text-stone-300'
                                }`}
                              >
                                {b.status}
                              </span>
                              <span className="text-xs text-stone-400">
                                {new Date(b.date).toLocaleDateString('en-GB', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-white mt-1">
                              {b.tourTitle || 'Tour Excursion'}
                            </div>
                            <div className="text-xs text-stone-400 mt-0.5 flex items-center space-x-3">
                              <span>Party: {b.party.adults} Adults {b.party.children > 0 ? `, ${b.party.children} Children` : ''}</span>
                              <span>•</span>
                              <span>Pickup: {b.pickup.hotelName || 'Central Meeting Point'}</span>
                              <span>•</span>
                              <span>Payment: {b.paymentMethod === 'pay_at_pickup' ? 'Pay at Pickup' : 'Card'}</span>
                            </div>
                          </div>

                          <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                            <div className="text-base font-bold text-emerald-400">
                              €{b.pricing.totalEur.toFixed(2)}
                            </div>
                            {onViewBookingDetails && (
                              <button
                                type="button"
                                onClick={() => onViewBookingDetails(b.bookingReference)}
                                className="text-xs text-[#2dd4bf] hover:underline flex items-center space-x-1 mt-1"
                              >
                                <span>View Voucher</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. PAYMENTS & BALANCE */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Financial Balance</h3>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Calculated from excursions booked, paid vouchers, and pier cash collections.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-stone-900 border border-stone-800 p-3 rounded">
                        <span className="text-xs text-stone-400">Total Invoiced Amount</span>
                        <div className="text-lg font-bold text-white mt-1">
                          €{customer.totalRevenueEur.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-stone-900 border border-stone-800 p-3 rounded">
                        <span className="text-xs text-stone-400">Paid to Date</span>
                        <div className="text-lg font-bold text-emerald-400 mt-1">
                          €{Math.max(0, customer.totalRevenueEur - customer.outstandingAmountEur).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-stone-900 border border-stone-800 p-3 rounded">
                        <span className="text-xs text-stone-400">Remaining Balance Due</span>
                        <div className={`text-lg font-bold mt-1 ${customer.outstandingAmountEur > 0 ? 'text-amber-400' : 'text-stone-400'}`}>
                          €{customer.outstandingAmountEur.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {customer.outstandingAmountEur > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-center space-x-2 text-xs text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Traveler has an outstanding payment of €{customer.outstandingAmountEur.toFixed(2)}. Dispatch staff should collect cash or card at morning hotel pickup or marina desk.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. INQUIRIES */}
              {activeTab === 'inquiries' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Concierge Inquiries ({customer.inquiries.length})</h3>
                  </div>

                  {customer.inquiries.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-lg">
                      <HelpCircle className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                      <p className="text-xs">No inquiries submitted by this customer.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customer.inquiries.map((inq) => (
                        <div key={inq.id} className="bg-stone-950/60 border border-stone-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{inq.subject}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-stone-800 text-stone-300">
                              {inq.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-300 mt-2 bg-stone-900/80 p-3 rounded border border-stone-800/80">
                            {inq.message}
                          </p>
                          <div className="text-[11px] text-stone-500 mt-2 flex items-center justify-between">
                            <span>Received: {new Date(inq.created_at).toLocaleString('en-GB')}</span>
                            <span>Phone: {inq.phone || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. COMMUNICATIONS */}
              {activeTab === 'communications' && (
                <div className="space-y-6">
                  {/* Log new message form */}
                  <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Log Traveler Communication
                    </h4>
                    <form onSubmit={handleLogCommunication} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-stone-400 block mb-1">Channel</label>
                          <select
                            value={commChannel}
                            onChange={(e) => setCommChannel(e.target.value as CrmCommunicationChannel)}
                            className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-white"
                          >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone Call</option>
                            <option value="pier_desk">Pier / Marina Desk</option>
                            <option value="website_chat">Website Chat</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-stone-400 block mb-1">Direction</label>
                          <select
                            value={commDirection}
                            onChange={(e) => setCommDirection(e.target.value as 'outbound' | 'inbound')}
                            className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-white"
                          >
                            <option value="outbound">Outbound (Sent by Staff)</option>
                            <option value="inbound">Inbound (Received from Guest)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-stone-400 block mb-1">Subject / Topic (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Pickup Confirmation"
                            value={commSubject}
                            onChange={(e) => setCommSubject(e.target.value)}
                            className="w-full bg-stone-900 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          placeholder="Message content or summary of phone conversation..."
                          value={commMessage}
                          onChange={(e) => setCommMessage(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0A6C74]"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded text-xs font-semibold flex items-center space-x-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Record Message</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Message History Feed */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      History ({customer.communications.length})
                    </h4>
                    {customer.communications.length === 0 ? (
                      <p className="text-xs text-stone-500 italic">No communication logged yet.</p>
                    ) : (
                      customer.communications.map((msg) => (
                        <div
                          key={msg.id}
                          className="bg-stone-950/60 border border-stone-800 rounded-lg p-3 text-xs"
                        >
                          <div className="flex items-center justify-between text-stone-400 mb-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white uppercase text-[10px] px-1.5 py-0.5 rounded bg-stone-800">
                                {msg.channel}
                              </span>
                              <span className="text-[11px]">
                                {msg.direction === 'outbound' ? 'Sent by' : 'From'}: <strong>{msg.sender}</strong>
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500">
                              {new Date(msg.timestamp).toLocaleString('en-GB')}
                            </span>
                          </div>
                          {msg.subject && (
                            <div className="font-medium text-stone-200 mb-1">
                              Subject: {msg.subject}
                            </div>
                          )}
                          <p className="text-stone-300 whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 6. INTERNAL STAFF NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="bg-stone-950/60 border border-stone-800 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Add Internal Staff Note</span>
                      <label className="flex items-center space-x-1.5 text-xs text-stone-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newNotePinned}
                          onChange={(e) => setNewNotePinned(e.target.checked)}
                          className="rounded border-stone-700 bg-stone-900 text-[#0A6C74]"
                        />
                        <span>Pin to top</span>
                      </label>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Special instructions, dietary restrictions, preferred tour guide..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0A6C74]"
                      required
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-stone-400">Author:</span>
                        <select
                          value={newNoteAuthor}
                          onChange={(e) => setNewNoteAuthor(e.target.value)}
                          className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200"
                        >
                          <option value="Captain Ahmed">Captain Ahmed</option>
                          <option value="Mina Samir">Mina Samir</option>
                          <option value="Captain Farouk">Captain Farouk</option>
                          <option value="Marina Dispatch Desk">Marina Dispatch Desk</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded text-xs font-semibold"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {customer.staffNotes.length === 0 ? (
                      <p className="text-xs text-stone-500 italic">No internal notes yet.</p>
                    ) : (
                      customer.staffNotes.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 rounded-lg border text-xs ${
                            n.isPinned
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-stone-950/60 border-stone-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-stone-400 mb-1">
                            <span className="font-semibold text-stone-200 flex items-center space-x-1">
                              {n.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
                              <span>{n.author}</span>
                            </span>
                            <span className="text-[10px]">
                              {new Date(n.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-stone-300 whitespace-pre-wrap">{n.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 7. TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Associated Staff Tasks</h3>
                    <button
                      type="button"
                      onClick={() => setIsTaskModalOpen(true)}
                      className="px-2.5 py-1 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded text-xs font-medium flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Task</span>
                    </button>
                  </div>

                  {customer.tasks.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                      <p className="text-xs">No active tasks assigned for this customer.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customer.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-stone-950/60 border border-stone-800 p-3.5 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(task.id, task.status)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                task.status === 'completed'
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-stone-700 hover:border-stone-500'
                              }`}
                            >
                              {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <div>
                              <div className={`font-medium ${task.status === 'completed' ? 'line-through text-stone-500' : 'text-white'}`}>
                                {task.title}
                              </div>
                              <div className="text-[11px] text-stone-400 flex items-center space-x-2 mt-0.5">
                                <span>Assigned: {task.assignedStaff}</span>
                                <span>•</span>
                                <span>Due: {task.dueDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                task.priority === 'urgent'
                                  ? 'bg-red-500/20 text-red-300'
                                  : task.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-stone-800 text-stone-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 8. FOLLOW-UPS */}
              {activeTab === 'followups' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Scheduled Follow-ups</h3>
                    <button
                      type="button"
                      onClick={() => setIsFupModalOpen(true)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule Follow-up</span>
                    </button>
                  </div>

                  {customer.followUps.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 border border-dashed border-stone-800 rounded-lg">
                      <Clock className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                      <p className="text-xs">No follow-ups currently scheduled for this traveler.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customer.followUps.map((fup) => {
                        const isOverdue = !fup.isCompleted && new Date(fup.scheduledFor).getTime() < Date.now();
                        return (
                          <div
                            key={fup.id}
                            className={`p-3.5 rounded-lg border flex items-center justify-between text-xs ${
                              fup.isCompleted
                                ? 'bg-stone-950/40 border-stone-800/80 opacity-70'
                                : isOverdue
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-stone-950/60 border-stone-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-semibold ${fup.isCompleted ? 'text-stone-400' : 'text-white'}`}>
                                  {fup.notes}
                                </span>
                                {isOverdue && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/30 text-red-200">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-400 mt-1">
                                Scheduled for: <strong>{new Date(fup.scheduledFor).toLocaleDateString('en-GB')}</strong> • Staff: {fup.assignedStaff}
                              </div>
                            </div>

                            {!fup.isCompleted ? (
                              <button
                                type="button"
                                onClick={() => handleCompleteFup(fup.id)}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-medium"
                              >
                                Mark Completed
                              </button>
                            ) : (
                              <span className="text-[11px] text-stone-500 flex items-center space-x-1">
                                <Check className="w-3.5 h-3.5 text-teal-400" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 9. ACTIVITY TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Unified Activity Stream</h3>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
                    {customer.timeline.map((ev) => (
                      <div key={ev.id} className="relative group text-xs">
                        <div
                          className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-stone-900 ${
                            ev.badgeColor === 'emerald'
                              ? 'bg-emerald-500'
                              : ev.badgeColor === 'amber'
                              ? 'bg-amber-500'
                              : ev.badgeColor === 'red'
                              ? 'bg-red-500'
                              : ev.badgeColor === 'purple'
                              ? 'bg-purple-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-xs">{ev.title}</span>
                            <span className="text-[11px] text-stone-500">
                              {new Date(ev.timestamp).toLocaleString('en-GB')}
                            </span>
                          </div>
                          <p className="text-stone-300 mt-1">{ev.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Traveler Reviews</h3>
                  <div className="py-10 text-center text-stone-500 border border-dashed border-stone-800 rounded-lg">
                    <Star className="w-8 h-8 mx-auto text-stone-600 mb-2" />
                    <p className="text-xs">No submitted excursion reviews found for this traveler record.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-xs text-stone-400">
          <span>Customer ID: {customer?.id}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Task Creation Modal Sub-dialog */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-lg p-5 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Add Task for {customer?.fullName}</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Check Soma Bay transfer rate"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional context..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Assign To</label>
                  <select
                    value={taskStaff}
                    onChange={(e) => setTaskStaff(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Captain Ahmed">Captain Ahmed</option>
                    <option value="Mina Samir">Mina Samir</option>
                    <option value="Captain Farouk">Captain Farouk</option>
                    <option value="Marina Dispatch">Marina Dispatch</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as CrmTaskPriority)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded font-medium"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Sub-dialog */}
      {isFupModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-lg p-5 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Schedule Traveler Follow-up</h3>
            <form onSubmit={handleScheduleFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Objective / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Call customer tomorrow about Luxor tour"
                  value={fupNotes}
                  onChange={(e) => setFupNotes(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={fupDate}
                    onChange={(e) => setFupDate(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Assigned Staff</label>
                  <select
                    value={fupStaff}
                    onChange={(e) => setFupStaff(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Captain Ahmed">Captain Ahmed</option>
                    <option value="Mina Samir">Mina Samir</option>
                    <option value="Captain Farouk">Captain Farouk</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsFupModalOpen(false)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Sub-dialog */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-lg p-5 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Record Traveler Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Amount to Record (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="Cash at Marina Desk">Cash at Marina Desk</option>
                  <option value="Cash to Hotel Driver">Cash to Hotel Driver</option>
                  <option value="Credit Card POS">Credit Card POS Terminal</option>
                  <option value="Bank Wire / Transfer">Bank Wire / Transfer</option>
                </select>
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Receipt / Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. POS-9842 or Voucher Ref"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
