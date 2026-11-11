import React, { useState, useEffect } from 'react';
import {
  Grid,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  IndianRupee,
  Coffee,
  X,
  Sparkles,
  QrCode,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  History,
  Receipt
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { TableItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { tableService, TableOrderHistoryItem } from '../../services/tableService';

export const TablesPage: React.FC = () => {
  const { restaurant, tables, updateTableStatus, addTable, addToast } = useCafe();

  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [activeTableModal, setActiveTableModal] = useState<TableItem | null>(null);
  const [modalTab, setModalTab] = useState<'status' | 'qr' | 'history'>('status');
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  // Table order history state
  const [tableOrders, setTableOrders] = useState<TableOrderHistoryItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // New Table form
  const [newTableNum, setNewTableNum] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [newSection, setNewSection] = useState<TableItem['section']>('Main Dining');

  const filteredTables = tables.filter(
    (t) => selectedSection === 'all' || t.section === selectedSection
  );

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;
  const billingCount = tables.filter((t) => t.status === 'billing').length;

  useEffect(() => {
    if (activeTableModal && restaurant.id) {
      setLoadingOrders(true);
      tableService
        .getTableOrders(restaurant.id, activeTableModal.tableNumber)
        .then(setTableOrders)
        .catch(console.error)
        .finally(() => setLoadingOrders(false));
    }
  }, [activeTableModal, restaurant.id]);

  const handleCreateNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    try {
      if (restaurant.id) {
        await tableService.createTable({
          restaurant_id: restaurant.id,
          table_number: newTableNum.trim(),
          capacity: Number(newCapacity),
          section: newSection,
          status: 'available',
        });
      }
      addTable({
        tableNumber: newTableNum.trim(),
        capacity: Number(newCapacity),
        section: newSection,
        status: 'available',
      });
      addToast('Table Created', `${newTableNum.trim()} added to floor plan.`, 'success');
      setNewTableNum('');
      setIsAddTableOpen(false);
    } catch (err: any) {
      addToast('Table Exists', err.message || 'Could not add table', 'error');
    }
  };

  const handleDeleteTable = async (table: TableItem) => {
    if (table.status === 'occupied') {
      addToast(
        'Action Blocked',
        `Cannot delete ${table.tableNumber} while guests are seated. Please settle the bill first.`,
        'error'
      );
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${table.tableNumber} from the floor plan?`)) {
      try {
        if (restaurant.id) {
          await tableService.deleteTable(table.id);
        }
        // Also update local context
        updateTableStatus(table.id, 'available');
        setActiveTableModal(null);
        addToast('Table Removed', `${table.tableNumber} has been safely deleted.`, 'info');
      } catch (err: any) {
        addToast('Error', err.message || 'Failed to delete table', 'error');
      }
    }
  };

  const getStatusStyles = (status: TableItem['status']) => {
    switch (status) {
      case 'available':
        return {
          badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500',
          cardBorder: 'hover:border-emerald-300',
        };
      case 'occupied':
        return {
          badge: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
          dot: 'bg-orange-500 animate-pulse',
          cardBorder: 'border-orange-200 bg-orange-50/20 dark:border-orange-900 dark:bg-orange-950/20',
        };
      case 'billing':
        return {
          badge: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
          dot: 'bg-blue-500',
          cardBorder: 'border-blue-200 bg-blue-50/20 dark:border-blue-900 dark:bg-blue-950/20',
        };
      case 'reserved':
        return {
          badge: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
          dot: 'bg-purple-500',
          cardBorder: 'border-purple-200 bg-purple-50/20 dark:border-purple-900 dark:bg-purple-950/20',
        };
    }
  };

  const getTableQrUrl = (tableNum: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${origin}/menu/${restaurant.slug}?table=${encodeURIComponent(tableNum)}`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
            Floor Plan & Table Management
          </h1>
          <p className="text-xs text-cafe-muted mt-1">
            Monitor real-time table turnover, assign guests, inspect table bills, and generate QR menus.
          </p>
        </div>

        <button
          onClick={() => setIsAddTableOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 self-start sm:self-auto transition-all btn-press"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dining Table</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive">
          <div className="flex items-center justify-between text-xs font-bold text-cafe-muted">
            <span>Available</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <p className="font-display text-2xl font-black text-emerald-600 mt-2">{availableCount}</p>
          <span className="text-[11px] text-cafe-muted">Ready for guests</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive">
          <div className="flex items-center justify-between text-xs font-bold text-cafe-muted">
            <span>Occupied</span>
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
          </div>
          <p className="font-display text-2xl font-black text-orange-600 mt-2">{occupiedCount}</p>
          <span className="text-[11px] text-cafe-muted">Dining in progress</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive">
          <div className="flex items-center justify-between text-xs font-bold text-cafe-muted">
            <span>Billing Due</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <p className="font-display text-2xl font-black text-blue-600 mt-2">{billingCount}</p>
          <span className="text-[11px] text-cafe-muted">Bill requested</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm card-interactive">
          <div className="flex items-center justify-between text-xs font-bold text-cafe-muted">
            <span>Reserved</span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          </div>
          <p className="font-display text-2xl font-black text-purple-600 mt-2">{reservedCount}</p>
          <span className="text-[11px] text-cafe-muted">Upcoming bookings</span>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'Main Dining', 'Terrace & Patio', 'Bar Lounge', 'Private Dining'].map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSection === sec
                ? 'bg-cafe-primary text-white shadow-warm'
                : 'bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark text-cafe-muted hover:text-cafe-primary'
            }`}
          >
            {sec === 'all' ? 'All Sections' : sec}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const styles = getStatusStyles(table.status);

          return (
            <div
              key={table.id}
              onClick={() => {
                setActiveTableModal(table);
                setModalTab('status');
              }}
              className={`p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm cursor-pointer transition-all hover:shadow-warm-md flex flex-col justify-between ${styles.cardBorder}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-cafe-sand/70 dark:bg-stone-800 flex items-center justify-center font-black text-cafe-primary dark:text-cafe-cream text-sm">
                      {table.tableNumber.replace(/[^0-9]/g, '') || 'T'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-cafe-primary dark:text-cafe-cream">
                        {table.tableNumber}
                      </h3>
                      <p className="text-[11px] text-cafe-muted flex items-center gap-1">
                        <Users className="w-3 h-3 text-cafe-accent" />
                        {table.capacity} Guests
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${styles.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                    {table.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-cafe-muted mt-2">
                  Section: <strong>{table.section}</strong>
                </p>

                {/* Active Order Details if occupied */}
                {table.activeOrderTotal !== undefined && table.activeOrderTotal > 0 ? (
                  <div className="mt-3 p-3 rounded-2xl bg-cafe-sand/40 dark:bg-stone-800/60 border border-cafe-border/60 dark:border-stone-700">
                    <div className="flex justify-between text-xs">
                      <span className="text-cafe-muted">Active Bill</span>
                      <span className="font-extrabold text-cafe-accent text-sm">
                        {formatCurrency(table.activeOrderTotal, restaurant.currencySymbol)}
                      </span>
                    </div>
                    {table.occupiedSince && (
                      <p className="text-[11px] text-cafe-muted mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cafe-accent" />
                        Seated {table.occupiedSince}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 py-2.5 text-center border border-dashed border-cafe-border/70 dark:border-stone-700 rounded-2xl text-[11px] text-cafe-muted">
                    No active bill • Available
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-cafe-border/60 dark:border-cafe-border-dark flex items-center justify-between text-[11px] font-semibold text-cafe-muted">
                <span className="flex items-center gap-1 text-cafe-accent">
                  <QrCode className="w-3 h-3" />
                  QR Enabled
                </span>
                <span className="text-cafe-primary dark:text-cafe-cream font-bold">Manage &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Table Details & QR Modal */}
      {activeTableModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-md w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <div>
                <h3 className="font-black text-base text-cafe-primary dark:text-cafe-cream flex items-center gap-2">
                  <span>{activeTableModal.tableNumber}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cafe-sand dark:bg-stone-800 text-cafe-muted">
                    {activeTableModal.section}
                  </span>
                </h3>
                <p className="text-xs text-cafe-muted">
                  Max Capacity: {activeTableModal.capacity} Seats
                </p>
              </div>
              <button
                onClick={() => setActiveTableModal(null)}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-cafe-border/70 dark:border-stone-700 my-3">
              {[
                { id: 'status', label: 'Occupancy' },
                { id: 'qr', label: 'QR Menu' },
                { id: 'history', label: 'Order History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all ${
                    modalTab === tab.id
                      ? 'border-cafe-accent text-cafe-accent'
                      : 'border-transparent text-cafe-muted hover:text-cafe-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: State & Occupancy */}
            {modalTab === 'status' && (
              <div className="space-y-4 my-2">
                <div>
                  <label className="text-xs font-bold text-cafe-muted block mb-1.5">
                    Update Dining Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['available', 'occupied', 'billing', 'reserved'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          updateTableStatus(activeTableModal.id, st);
                          setActiveTableModal({ ...activeTableModal, status: st });
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-colors ${
                          activeTableModal.status === st
                            ? 'border-cafe-accent bg-cafe-accent text-white shadow-warm'
                            : 'border-cafe-border text-cafe-primary dark:text-stone-300 hover:bg-cafe-sand/40'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTableModal.activeOrderTotal ? (
                  <div className="p-3.5 rounded-2xl bg-cafe-sand/40 dark:bg-stone-800 text-xs space-y-1">
                    <span className="text-cafe-muted font-bold">Active Bill Settlement</span>
                    <p className="text-xl font-black text-cafe-accent">
                      {formatCurrency(activeTableModal.activeOrderTotal, restaurant.currencySymbol)}
                    </p>
                    {activeTableModal.occupiedSince && (
                      <p className="text-[11px] text-cafe-muted">Seated since {activeTableModal.occupiedSince}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs">
                    Table is currently unoccupied and ready for new guest parties.
                  </div>
                )}

                {/* Safe Delete Table Option */}
                <div className="pt-2 border-t border-cafe-border dark:border-stone-700">
                  <button
                    onClick={() => handleDeleteTable(activeTableModal)}
                    className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Table from Floor Plan</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Table-Specific QR Code */}
            {modalTab === 'qr' && (
              <div className="space-y-4 my-2 text-center">
                <div className="p-4 bg-white dark:bg-stone-900 rounded-2xl border border-cafe-border dark:border-stone-700 inline-block shadow-warm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      getTableQrUrl(activeTableModal.tableNumber)
                    )}`}
                    alt={`QR Code for ${activeTableModal.tableNumber}`}
                    className="w-40 h-40 mx-auto rounded-lg"
                  />
                  <p className="text-xs font-bold text-cafe-primary dark:text-cafe-cream mt-2">
                    Scan for {activeTableModal.tableNumber} Menu
                  </p>
                </div>

                <div className="text-left bg-cafe-light dark:bg-stone-800 p-2.5 rounded-xl border border-cafe-border text-[11px] font-mono break-all text-cafe-muted">
                  {getTableQrUrl(activeTableModal.tableNumber)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getTableQrUrl(activeTableModal.tableNumber));
                      setCopiedQr(true);
                      setTimeout(() => setCopiedQr(false), 2000);
                      addToast('URL Copied', 'Direct table menu link copied to clipboard.', 'success');
                    }}
                    className="flex-1 py-2 rounded-xl border border-cafe-border text-xs font-bold text-cafe-primary dark:text-stone-300 flex items-center justify-center gap-1 hover:bg-cafe-sand/40"
                  >
                    {copiedQr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedQr ? 'Copied' : 'Copy Menu URL'}</span>
                  </button>
                  <a
                    href={getTableQrUrl(activeTableModal.tableNumber)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-cafe-accent text-white text-xs font-bold flex items-center justify-center gap-1 shadow-warm hover:bg-cafe-accent-hover"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Customer View</span>
                  </a>
                </div>
              </div>
            )}

            {/* Tab 3: Order History */}
            {modalTab === 'history' && (
              <div className="space-y-3 my-2 text-xs">
                {loadingOrders ? (
                  <p className="py-6 text-center text-cafe-muted">Loading table history...</p>
                ) : tableOrders.length === 0 ? (
                  <div className="py-8 text-center text-cafe-muted">
                    <History className="w-8 h-8 mx-auto text-cafe-muted/60 mb-2" />
                    <p>No recent dine-in orders recorded for {activeTableModal.tableNumber}.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {tableOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-2xl bg-cafe-light dark:bg-stone-800/80 border border-cafe-border/70 dark:border-stone-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-cafe-primary dark:text-cafe-cream">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[10px] text-cafe-muted">• {ord.customerName}</span>
                          </div>
                          <p className="text-[11px] text-cafe-muted truncate max-w-[200px] mt-0.5">
                            {ord.itemsSummary}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-cafe-accent">
                            {formatCurrency(ord.total, restaurant.currencySymbol)}
                          </span>
                          <span className="block text-[10px] font-bold text-emerald-600 uppercase">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-cafe-border dark:border-cafe-border-dark flex justify-end">
              <button
                onClick={() => setActiveTableModal(null)}
                className="px-4 py-2 rounded-xl bg-cafe-primary text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Table Modal */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-6 max-w-sm w-full border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border dark:border-cafe-border-dark">
              <h3 className="font-black text-base text-cafe-primary dark:text-cafe-cream">
                Add Table to Floor
              </h3>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="p-1 rounded-lg hover:bg-cafe-sand/50 text-cafe-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTable} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Table Name / ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 11"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Capacity (Seats)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Floor Section</label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-medium"
                >
                  <option value="Main Dining">Main Dining</option>
                  <option value="Terrace & Patio">Terrace & Patio</option>
                  <option value="Bar Lounge">Bar Lounge</option>
                  <option value="Private Dining">Private Dining</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-cafe-border dark:border-cafe-border-dark">
                <button
                  type="button"
                  onClick={() => setIsAddTableOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-cafe-border text-xs text-cafe-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm hover:bg-cafe-accent-hover transition-colors"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
