import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Search,
  Shield,
  Phone,
  Mail,
  Clock,
  Sparkles,
  X,
  CheckCircle2,
  Trash2,
  History,
  UserCheck,
  AlertCircle,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Employee } from '../../types';
import { employeeService, StaffMember, StaffAuditLog, RestaurantRole } from '../../services/employeeService';

export const EmployeesPage: React.FC = () => {
  const { restaurant, employees, addEmployee, updateEmployee, addToast } = useCafe();

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Edit Role modal
  const [editingMember, setEditingMember] = useState<Employee | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<Employee['role']>('Server');

  // Audit history
  const [auditLogs, setAuditLogs] = useState<StaffAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Server' as Employee['role'],
    shift: 'Morning (07:00 - 15:30)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  });

  const roles: ('all' | Employee['role'])[] = [
    'all',
    'Owner',
    'Manager',
    'Cashier',
    'Barista & Kitchen',
    'Server',
  ];

  const mapRoleToDb = (role: Employee['role']): RestaurantRole => {
    switch (role) {
      case 'Owner': return 'owner';
      case 'Manager': return 'manager';
      case 'Cashier': return 'cashier';
      case 'Barista & Kitchen': return 'kitchen';
      case 'Server': return 'server';
    }
  };

  const mapDbRoleToUi = (dbRole: string): Employee['role'] => {
    switch (dbRole) {
      case 'owner': return 'Owner';
      case 'manager': return 'Manager';
      case 'cashier': return 'Cashier';
      case 'kitchen': return 'Barista & Kitchen';
      case 'server': return 'Server';
      default: return 'Server';
    }
  };

  // Fetch audit logs when audit modal opens
  useEffect(() => {
    if (isAuditModalOpen && restaurant.id) {
      setLoadingAudit(true);
      employeeService
        .getStaffAuditLogs(restaurant.id)
        .then(setAuditLogs)
        .catch(console.error)
        .finally(() => setLoadingAudit(false));
    }
  }, [isAuditModalOpen, restaurant.id]);

  const filteredEmployees = employees.filter((e) => {
    const matchesRole = roleFilter === 'all' || e.role === roleFilter;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    try {
      if (restaurant.id) {
        await employeeService.inviteEmployee({
          restaurantId: restaurant.id,
          email: formData.email.trim(),
          fullName: formData.name.trim(),
          phone: formData.phone.trim(),
          role: mapRoleToDb(formData.role),
        });
      }

      addEmployee({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        status: 'active',
        shift: formData.shift,
        avatar: formData.avatar,
        joinedDate: 'Nov 2026',
      });

      addToast('Staff Registered', `${formData.name} added as ${formData.role}.`, 'success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Server',
        shift: 'Morning (07:00 - 15:30)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      addToast('Error', err.message || 'Could not add team member', 'error');
    }
  };

  const handleRoleChangeSubmit = async () => {
    if (!editingMember) return;
    try {
      if (restaurant.id && !editingMember.id.startsWith('emp-')) {
        await employeeService.updateEmployeeRole({
          restaurantId: restaurant.id,
          memberId: editingMember.id,
          newRole: mapRoleToDb(selectedNewRole),
        });
      }

      updateEmployee(editingMember.id, { role: selectedNewRole });
      addToast('Role Updated', `${editingMember.name} is now assigned as ${selectedNewRole}.`, 'success');
      setEditingMember(null);
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (emp: Employee) => {
    if (emp.role === 'Owner') {
      const ownerCount = employees.filter((e) => e.role === 'Owner').length;
      if (ownerCount <= 1) {
        addToast('Action Prohibited', 'Cannot delete the sole restaurant owner.', 'error');
        return;
      }
    }

    if (window.confirm(`Are you sure you want to revoke system access for ${emp.name}?`)) {
      try {
        if (restaurant.id && !emp.id.startsWith('emp-')) {
          await employeeService.removeEmployee({
            restaurantId: restaurant.id,
            memberId: emp.id,
          });
        }
        updateEmployee(emp.id, { status: 'off-duty' });
        addToast('Access Revoked', `${emp.name} removed from active roster.`, 'info');
      } catch (err: any) {
        addToast('Error', err.message || 'Could not remove member', 'error');
      }
    }
  };

  const getRoleBadge = (role: Employee['role']) => {
    switch (role) {
      case 'Owner':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'Manager':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'Barista & Kitchen':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800';
      case 'Cashier':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
            Staff, Roles & Permissions
          </h1>
          <p className="text-xs text-cafe-muted mt-1">
            Manage your kitchen staff, cashiers, servers, managers, and role-based access controls.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-cafe-border dark:border-stone-700 bg-white dark:bg-cafe-surface-dark hover:bg-cafe-sand/50 text-cafe-primary dark:text-cafe-cream text-xs font-bold shadow-warm-sm flex items-center gap-1.5 transition-all btn-press"
          >
            <History className="w-4 h-4 text-cafe-accent" />
            <span>Activity Audit Log</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Role Filter & Search */}
      <div className="bg-white dark:bg-cafe-surface-dark p-4 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                roleFilter === r
                  ? 'bg-cafe-accent text-white shadow-warm-sm'
                  : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-sand/40'
              }`}
            >
              {r === 'all' ? 'All Staff Roles' : r}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-cafe-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-cafe-accent"
          />
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border/80 dark:border-cafe-border-dark shadow-warm hover:shadow-warm-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-cafe-border/60"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-cafe-primary dark:text-cafe-cream">
                      {emp.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(emp.role)}`}>
                        {emp.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      emp.status === 'active'
                        ? 'bg-emerald-500'
                        : emp.status === 'on-break'
                        ? 'bg-amber-500'
                        : 'bg-stone-400'
                    }`}
                    title={`Status: ${emp.status}`}
                  />
                  <button
                    onClick={() => {
                      setEditingMember(emp);
                      setSelectedNewRole(emp.role);
                    }}
                    className="p-1.5 rounded-lg border border-cafe-border/60 hover:bg-cafe-sand/50 text-cafe-muted"
                    title="Change Role & Permissions"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cafe-accent" />
                  </button>
                </div>
              </div>

              {/* Contact info & shift */}
              <div className="mt-4 pt-3 border-t border-cafe-border/60 dark:border-cafe-border-dark space-y-2 text-xs text-cafe-muted">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cafe-accent" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cafe-accent" />
                  <span>{emp.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cafe-accent" />
                  <span>Shift: {emp.shift}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-cafe-border/60 dark:border-cafe-border-dark flex items-center justify-between text-[11px]">
              <span className="text-cafe-muted">Joined {emp.joinedDate}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextStatus = emp.status === 'active' ? 'on-break' : 'active';
                    updateEmployee(emp.id, { status: nextStatus });
                  }}
                  className="font-bold text-cafe-accent hover:underline"
                >
                  {emp.status === 'active' ? 'Take Break' : 'Set Active'}
                </button>
                <button
                  onClick={() => handleRemoveMember(emp)}
                  className="p-1 text-cafe-muted hover:text-rose-600 transition-colors"
                  title="Remove from roster"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-sm w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div>
                <h3 className="font-black text-sm text-cafe-primary dark:text-cafe-cream">
                  Modify Role & Access
                </h3>
                <p className="text-xs text-cafe-muted">{editingMember.name}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <label className="text-xs font-bold text-cafe-muted block">Select Assigned Role</label>
              {(['Owner', 'Manager', 'Cashier', 'Barista & Kitchen', 'Server'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedNewRole(r)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                    selectedNewRole === r
                      ? 'border-cafe-accent bg-cafe-accent text-white shadow-warm'
                      : 'border-cafe-border text-cafe-primary dark:text-stone-300 hover:bg-cafe-sand/40'
                  }`}
                >
                  <span>{r}</span>
                  {selectedNewRole === r && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-cafe-border dark:border-cafe-border-dark flex gap-2">
              <button
                onClick={() => setEditingMember(null)}
                className="flex-1 py-2 rounded-xl border border-cafe-border text-xs text-cafe-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChangeSubmit}
                className="flex-1 py-2 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm hover:bg-cafe-accent-hover transition-colors"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-md w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <h3 className="font-black text-base text-cafe-primary dark:text-cafe-cream">
                Invite Staff Member
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Email Address (Login / Invite)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@arsalankolkata.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98450 00000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-medium"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Barista & Kitchen">Barista & Kitchen</option>
                    <option value="Server">Server</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-cafe-muted">Assigned Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-medium"
                  >
                    <option value="Morning (07:00 - 15:30)">Morning</option>
                    <option value="Midday (11:00 - 19:30)">Midday</option>
                    <option value="Evening (14:30 - 23:30)">Evening</option>
                    <option value="Kitchen Shift (10:00 - 22:30)">Kitchen Shift</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cafe-border dark:border-cafe-border-dark">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-cafe-border text-xs text-cafe-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm hover:bg-cafe-accent-hover transition-colors"
                >
                  Confirm & Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Audit History Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-md w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cafe-accent" />
                <h3 className="font-extrabold text-sm text-cafe-primary dark:text-cafe-cream">
                  Operations & Staff Audit Log
                </h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-2 text-xs">
              {loadingAudit ? (
                <p className="py-6 text-center text-cafe-muted">Loading audit entries...</p>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-cafe-muted">
                  <Shield className="w-8 h-8 mx-auto text-cafe-muted/60 mb-2" />
                  <p>All staff modifications are securely logged.</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-cafe-light dark:bg-stone-800/80 border border-cafe-border/70 dark:border-stone-700"
                  >
                    <div className="flex justify-between font-bold text-cafe-primary dark:text-cafe-cream">
                      <span className="uppercase text-[11px] text-cafe-accent">{log.action.replace('_', ' ')}</span>
                      <span className="text-[10px] text-cafe-muted font-normal">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-cafe-muted mt-1 font-mono">
                        {log.details.fullName || log.details.email ? `${log.details.fullName || ''} (${log.details.email || ''}) - ` : ''}
                        {log.details.newRole ? `Role changed to ${log.details.newRole}` : JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-cafe-border dark:border-cafe-border-dark flex justify-end">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cafe-primary text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
