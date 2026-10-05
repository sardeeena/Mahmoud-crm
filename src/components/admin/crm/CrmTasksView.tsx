import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Trash2,
  Check,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Bookmark,
  Building,
} from 'lucide-react';
import {
  getCrmTasks,
  createCrmTask,
  updateCrmTaskStatus,
  deleteCrmTask,
  getCrmCustomers,
  getLeads,
} from '../../../services/crmService';
import {
  CrmTask,
  CrmTaskPriority,
  CrmTaskStatus,
  CrmCustomerSummary,
  CrmLead,
} from '../../../types/crm';
import { useToast } from '../../../contexts/ToastContext';

export const CrmTasksView: React.FC = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [customers, setCustomers] = useState<CrmCustomerSummary[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CrmTaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | CrmTaskPriority>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCustomerId, setTaskCustomerId] = useState('');
  const [taskLeadId, setTaskLeadId] = useState('');
  const [taskBookingRef, setTaskBookingRef] = useState('');
  const [taskStaff, setTaskStaff] = useState('Captain Ahmed');
  const [taskPriority, setTaskPriority] = useState<CrmTaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);

  // Delete State
  const [taskToDelete, setTaskToDelete] = useState<CrmTask | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, c, l] = await Promise.all([getCrmTasks(), getCrmCustomers(), getLeads()]);
      setTasks(t);
      setCustomers(c);
      setLeads(l);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.bookingReference && t.bookingReference.toLowerCase().includes(q)) ||
        t.assignedStaff.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesStaff = staffFilter === 'all' || t.assignedStaff === staffFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesStaff;
    });
  }, [tasks, search, statusFilter, priorityFilter, staffFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setSaving(true);
    try {
      let custName: string | null = null;
      if (taskCustomerId) {
        const found = customers.find((c) => c.id === taskCustomerId);
        if (found) custName = found.fullName;
      } else if (taskLeadId) {
        const found = leads.find((l) => l.id === taskLeadId);
        if (found) custName = found.name;
      }

      await createCrmTask({
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        customerId: taskCustomerId || null,
        customerName: custName,
        leadId: taskLeadId || null,
        bookingReference: taskBookingRef.trim() || null,
        assignedStaff: taskStaff,
        dueDate: taskDueDate,
        priority: taskPriority,
        status: 'pending',
      });

      showToast('Staff task added to queue.', 'success');
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskCustomerId('');
    setTaskLeadId('');
    setTaskBookingRef('');
    setTaskStaff('Captain Ahmed');
    setTaskPriority('medium');
    setTaskDueDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  };

  const handleToggleStatus = async (task: CrmTask, nextStatus: CrmTaskStatus) => {
    try {
      await updateCrmTaskStatus(task.id, nextStatus);
      showToast(`Task status updated to ${nextStatus}.`, 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteCrmTask(taskToDelete.id);
      showToast('Task removed.', 'info');
      setTaskToDelete(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.dueDate).getTime() < Date.now()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white tracking-tight flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-[#2dd4bf]" />
            <span>Staff Tasks & Action Items</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Dispatch items, quotes delivery, marina permits, and traveler service requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-xs text-stone-400">Total Tasks</div>
          <div className="text-2xl font-bold text-white mt-1">{tasks.length}</div>
          <span className="text-[11px] text-stone-500">In staff queue</span>
        </div>

        <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-xs text-stone-400">Pending & In Progress</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">
            {tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length}
          </div>
          <span className="text-[11px] text-stone-500">Awaiting completion</span>
        </div>

        <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-xs text-stone-400">Overdue Tasks</div>
          <div className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? 'text-red-400' : 'text-stone-400'}`}>
            {overdueCount}
          </div>
          <span className="text-[11px] text-stone-500">Past target date</span>
        </div>

        <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
          <div className="text-xs text-stone-400">Completed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {tasks.filter((t) => t.status === 'completed').length}
          </div>
          <span className="text-[11px] text-stone-500">Actioned successfully</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks by title, traveler, booking ref, or staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#0A6C74]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700/80 rounded-lg px-2.5 py-2 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Staff</option>
            <option value="Captain Ahmed">Captain Ahmed</option>
            <option value="Mina Samir">Mina Samir</option>
            <option value="Captain Farouk">Captain Farouk</option>
            <option value="Marina Dispatch">Marina Dispatch</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-stone-950/60 border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#2dd4bf] mb-2" />
            <p className="text-sm">Loading staff tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            <CheckSquare className="w-10 h-10 mx-auto text-stone-600 mb-2" />
            <p className="text-sm font-medium text-stone-400">No tasks found</p>
            <p className="text-xs text-stone-500 mt-1">Queue is clear or no tasks match filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Task Details</th>
                  <th className="py-3 px-4">Related Entity</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredTasks.map((t) => {
                  const isOverdue =
                    t.status !== 'completed' &&
                    t.status !== 'cancelled' &&
                    new Date(t.dueDate).getTime() < Date.now();

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-stone-800/30 transition-colors ${
                        t.status === 'completed' ? 'opacity-65' : ''
                      }`}
                    >
                      {/* Status Toggle Box */}
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={t.status}
                          onChange={(e) => handleToggleStatus(t, e.target.value as CrmTaskStatus)}
                          className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 border focus:outline-none ${
                            t.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : t.status === 'in_progress'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : t.status === 'cancelled'
                              ? 'bg-stone-800 text-stone-400 border-stone-700'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`font-semibold ${
                            t.status === 'completed' ? 'line-through text-stone-500' : 'text-white'
                          }`}
                        >
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                            {t.description}
                          </div>
                        )}
                      </td>

                      {/* Associated Customer / Lead / Booking */}
                      <td className="py-3.5 px-4">
                        {t.customerName ? (
                          <div className="flex items-center space-x-1.5 text-stone-200">
                            <User className="w-3.5 h-3.5 text-[#2dd4bf]" />
                            <span>{t.customerName}</span>
                          </div>
                        ) : t.bookingReference ? (
                          <div className="text-[11px] font-mono text-emerald-400">
                            Ref: {t.bookingReference}
                          </div>
                        ) : (
                          <span className="text-stone-600 text-[11px] italic">General operations</span>
                        )}
                      </td>

                      {/* Staff */}
                      <td className="py-3.5 px-4">
                        <span className="text-stone-300 font-medium">{t.assignedStaff}</span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.priority === 'urgent'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : t.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : t.priority === 'medium'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-500" />
                          <span
                            className={
                              isOverdue
                                ? 'text-red-400 font-bold'
                                : 'text-stone-300'
                            }
                          >
                            {t.dueDate}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] px-1 py-0.2 bg-red-500/20 text-red-300 rounded font-semibold">
                              LATE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setTaskToDelete(t)}
                          className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-[#2dd4bf]" />
                <span>Create Staff Task</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call customer tomorrow regarding Luxor private guide"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Detailed Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Log specific requirements, vehicle arrangements, or tour voucher numbers..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 block mb-1">Assign to Staff</label>
                  <select
                    value={taskStaff}
                    onChange={(e) => setTaskStaff(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Captain Ahmed">Captain Ahmed (Lead Guide)</option>
                    <option value="Mina Samir">Mina Samir (Reservations)</option>
                    <option value="Captain Farouk">Captain Farouk (Diving Officer)</option>
                    <option value="Marina Dispatch">Marina Dispatch Desk</option>
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

                <div>
                  <label className="text-stone-400 block mb-1">Booking Ref (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. RST-2026-AB1234"
                    value={taskBookingRef}
                    onChange={(e) => setTaskBookingRef(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-400 block mb-1">Link to Customer (Optional)</label>
                  <select
                    value={taskCustomerId}
                    onChange={(e) => {
                      setTaskCustomerId(e.target.value);
                      if (e.target.value) setTaskLeadId('');
                    }}
                    className="w-full bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="">-- None (General Operations) --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#0A6C74] hover:bg-[#07535a] text-white rounded font-medium"
                >
                  {saving ? 'Saving...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Task Deletion</span>
            </h3>
            <p className="text-xs text-stone-300">
              Are you sure you want to delete the task &ldquo;{taskToDelete.title}&rdquo;?
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
