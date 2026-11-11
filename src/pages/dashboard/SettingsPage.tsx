import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Clock,
  IndianRupee,
  Bell,
  Shield,
  Save,
  Check,
  Sparkles,
  Store,
  Upload,
  Printer,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { restaurantService } from '../../services/restaurantService';

export const SettingsPage: React.FC = () => {
  const { restaurant, updateRestaurant, soundEnabled, toggleSound, addToast } = useCafe();

  const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'tax' | 'notifications' | 'hardware'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Local form state initialized from current restaurant profile
  const [formData, setFormData] = useState({
    name: restaurant.name,
    tagline: restaurant.tagline,
    description: restaurant.description,
    cuisine: restaurant.cuisine,
    address: restaurant.address,
    city: restaurant.city,
    contactEmail: restaurant.contactEmail,
    contactPhone: restaurant.contactPhone,
    openingHours: restaurant.openingHours,
    currency: restaurant.currency || 'INR',
    currencySymbol: restaurant.currencySymbol || '₹',
    taxPercentage: restaurant.taxPercentage || 5.0,
    deliveryAvailable: restaurant.deliveryAvailable,
    takeawayAvailable: restaurant.takeawayAvailable,
    logo: restaurant.logo,
    bannerImage: restaurant.bannerImage,
    // Hardware & Tax IDs from restaurant_settings
    gstin: '19AAAAA0000A1Z5',
    fssaiLicense: '11223344556677',
    printerIp: '192.168.1.120',
    receiptHeader: 'Arsalan – Park Circus Flagship\n191, Marina Garden Court, Park Circus, Kolkata',
    receiptFooter: 'Thank you for dining with us! Visit again.\nFSSAI Lic No: 11223344556677',
  });

  // Load live DB settings if available
  useEffect(() => {
    if (restaurant.id) {
      restaurantService.getRestaurantSettings(restaurant.id).then((stg) => {
        if (stg) {
          setFormData((prev) => ({
            ...prev,
            gstin: stg.tax_id_number || prev.gstin,
            printerIp: stg.printer_ip || prev.printerIp,
            receiptHeader: stg.receipt_header || prev.receiptHeader,
            receiptFooter: stg.receipt_footer || prev.receiptFooter,
          }));
        }
      }).catch(console.error);
    }
  }, [restaurant.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update in Supabase restaurants table
      if (restaurant.id) {
        await restaurantService.updateRestaurant(restaurant.id, {
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description,
          cuisine: formData.cuisine,
          address: formData.address,
          city: formData.city,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          opening_hours: formData.openingHours,
          currency: formData.currency,
          currency_symbol: formData.currencySymbol,
          tax_percentage: Number(formData.taxPercentage),
          delivery_available: formData.deliveryAvailable,
          takeaway_available: formData.takeawayAvailable,
          logo_url: formData.logo,
          banner_url: formData.bannerImage,
          updated_at: new Date().toISOString(),
        });

        // 2. Update hardware & GST settings in restaurant_settings table
        await restaurantService.updateRestaurantSettings(restaurant.id, {
          tax_id_number: formData.gstin,
          printer_ip: formData.printerIp,
          receipt_header: formData.receiptHeader,
          receipt_footer: formData.receiptFooter,
        });
      }

      // 3. Update in local context
      updateRestaurant({
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        cuisine: formData.cuisine,
        address: formData.address,
        city: formData.city,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        openingHours: formData.openingHours,
        currency: formData.currency,
        currencySymbol: formData.currencySymbol,
        taxPercentage: Number(formData.taxPercentage),
        deliveryAvailable: formData.deliveryAvailable,
        takeawayAvailable: formData.takeawayAvailable,
        logo: formData.logo,
        bannerImage: formData.bannerImage,
      });

      addToast('Configuration Saved', 'Restaurant profile, GST tax rates, and settings persisted.', 'success');
    } catch (err: any) {
      addToast('Error Saving', err.message || 'Failed to save configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
          Restaurant Settings & Configuration
        </h1>
        <p className="text-xs text-cafe-muted mt-1">
          Customize your storefront identity, operational hours, Indian GST rates, and thermal hardware.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-cafe-border dark:border-cafe-border-dark pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'Storefront Profile', icon: Store },
          { id: 'hours', label: 'Hours & Dining Mode', icon: Clock },
          { id: 'tax', label: 'GST & Currency', icon: IndianRupee },
          { id: 'hardware', label: 'Thermal Printer & Receipt', icon: Printer },
          { id: 'notifications', label: 'Sound & Alerts', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-cafe-primary text-white shadow-sm dark:bg-cafe-accent'
                  : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-sand/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm space-y-4">
            <h2 className="text-sm font-extrabold text-cafe-primary dark:text-cafe-cream">
              Restaurant Branding & Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Cuisine & Concept</label>
                <input
                  type="text"
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-cafe-muted">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-cafe-muted">Description / Story</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">City & Pin Code</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Official Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Contact Phone (Helpline)</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Brand Logo URL</label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Cover Banner Image URL</label>
                <input
                  type="url"
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Hours & Dining */}
        {activeTab === 'hours' && (
          <div className="bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm space-y-4">
            <h2 className="text-sm font-extrabold text-cafe-primary dark:text-cafe-cream">
              Operating Hours & Dining Channels
            </h2>

            <div>
              <label className="text-xs font-bold text-cafe-muted">Store Operating Hours</label>
              <input
                type="text"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                placeholder="e.g. Mon - Sun: 8:00 AM - 11:30 PM"
                className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
              />
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.takeawayAvailable}
                  onChange={(e) => setFormData({ ...formData, takeawayAvailable: e.target.checked })}
                  className="rounded text-cafe-accent focus:ring-cafe-accent"
                />
                <div>
                  <span className="text-xs font-bold text-cafe-primary dark:text-cafe-cream block">
                    Takeaway / Pick-Up Ordering Enabled
                  </span>
                  <span className="text-[11px] text-cafe-muted">
                    Allow customers to place takeout orders online or via QR menu.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.deliveryAvailable}
                  onChange={(e) => setFormData({ ...formData, deliveryAvailable: e.target.checked })}
                  className="rounded text-cafe-accent focus:ring-cafe-accent"
                />
                <div>
                  <span className="text-xs font-bold text-cafe-primary dark:text-cafe-cream block">
                    Direct Delivery Enabled
                  </span>
                  <span className="text-[11px] text-cafe-muted">
                    Enable delivery address inputs and doorstep delivery dispatch.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Tax & GST */}
        {activeTab === 'tax' && (
          <div className="bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-cafe-primary dark:text-cafe-cream">
                  Goods & Services Tax (GST) & Currency
                </h2>
                <p className="text-xs text-cafe-muted">Indian Restaurant Tax (5% GST split: 2.5% CGST + 2.5% SGST)</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                Indian Tax Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Currency Code</label>
                <input
                  type="text"
                  value={formData.currency}
                  readOnly
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-sand/50 dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Currency Symbol</label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  readOnly
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-sand/50 dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-black text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Standard GST Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.taxPercentage}
                  onChange={(e) => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-cafe-muted">GSTIN (Tax Identification Number)</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">FSSAI License Number</label>
                <input
                  type="text"
                  value={formData.fssaiLicense}
                  onChange={(e) => setFormData({ ...formData, fssaiLicense: e.target.value })}
                  placeholder="e.g. 11223344556677"
                  className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-cafe-sand/40 dark:bg-stone-800 border border-cafe-border/60 text-xs space-y-1">
              <span className="font-bold text-cafe-primary dark:text-cafe-cream">GST Computation Rule:</span>
              <p className="text-[11px] text-cafe-muted">
                Each billed invoice automatically computes <strong>{+(formData.taxPercentage / 2).toFixed(2)}% CGST</strong> (Central GST) and <strong>{+(formData.taxPercentage / 2).toFixed(2)}% SGST</strong> (State GST) on the net subtotal.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Thermal Hardware & Receipts */}
        {activeTab === 'hardware' && (
          <div className="bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm space-y-4">
            <h2 className="text-sm font-extrabold text-cafe-primary dark:text-cafe-cream">
              POS Thermal Printer & Receipt Layout
            </h2>

            <div>
              <label className="text-xs font-bold text-cafe-muted">Thermal Printer Network IP</label>
              <input
                type="text"
                value={formData.printerIp}
                onChange={(e) => setFormData({ ...formData, printerIp: e.target.value })}
                placeholder="192.168.1.120:9100"
                className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-mono"
              />
              <span className="text-[11px] text-cafe-muted mt-1 block">
                Standard ESC/POS thermal printer on local restaurant subnet.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-cafe-muted">Receipt Header Text</label>
              <textarea
                rows={2}
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-cafe-muted">Receipt Footer Text</label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-mono"
              />
            </div>
          </div>
        )}

        {/* Tab 5: Sound & Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm space-y-4">
            <h2 className="text-sm font-extrabold text-cafe-primary dark:text-cafe-cream">
              Audio Chimes & Notification Rules
            </h2>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-stone-700">
              <div>
                <span className="font-extrabold text-xs text-cafe-primary dark:text-cafe-cream block">
                  Kitchen Display (KDS) & POS Chime Bell
                </span>
                <span className="text-[11px] text-cafe-muted">
                  Audible chime alerts when new orders arrive or are marked ready.
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  soundEnabled
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-extrabold uppercase tracking-wider shadow-warm flex items-center gap-2 transition-all btn-press"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Persisting...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
