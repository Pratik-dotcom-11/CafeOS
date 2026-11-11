import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Award,
  Sparkles,
  Home,
  Briefcase,
  Navigation,
  X,
  Edit2,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { customerService, CustomerAddress, CustomerProfile } from '../../services/customerService';

export const CustomerProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const {
    addresses,
    selectedAddress,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    rewards,
  } = useCustomer();

  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [recipientName, setRecipientName] = useState(profile?.full_name || '');
  const [recipientPhone, setRecipientPhone] = useState(profile?.phone || '+91 98451 34911');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Kolkata');
  const [state, setState] = useState('West Bengal');
  const [postalCode, setPostalCode] = useState('700016');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load dedicated customer_profiles row
  useEffect(() => {
    async function loadCustProfile() {
      if (!user) return;
      try {
        const cp = await customerService.getCustomerProfile(user.id);
        if (cp) {
          setCustomerProfile(cp);
          setEditFullName(cp.fullName || '');
          setEditPhone(cp.phoneNumber || '');
        } else {
          setEditFullName(profile?.full_name || user.user_metadata?.full_name || '');
          setEditPhone(profile?.phone || user.user_metadata?.phone || '');
        }
      } catch (err) {
        console.warn('Could not fetch customer_profiles:', err);
      }
    }
    loadCustProfile();
  }, [user, profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const updated = await customerService.updateCustomerProfile(user.id, {
        fullName: editFullName.trim(),
        phoneNumber: editPhone.trim() || undefined,
      });
      setCustomerProfile(updated);
      await refreshProfile();
      setIsEditProfileOpen(false);
    } catch (err) {
      console.error('Failed to update customer profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientPhone || !addressLine1 || !postalCode) return;
    setIsSubmitting(true);
    try {
      await addAddress({
        label,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        isDefault,
      });
      setIsModalOpen(false);
      setAddressLine1('');
      setAddressLine2('');
      setLandmark('');
    } catch (err) {
      console.error('Failed to save address', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = customerProfile?.fullName || profile?.full_name || user?.user_metadata?.full_name || 'CaféOS Diner';
  const displayPhone = customerProfile?.phoneNumber || profile?.phone || user?.user_metadata?.phone || '+91 98451 34911';
  const displayAvatar = customerProfile?.profileImage || profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-cafe-primary tracking-tight">
          My Account & Delivery Destinations
        </h1>
        <p className="text-xs text-cafe-muted mt-0.5">
          Manage your contact credentials and saved delivery addresses for 1-click checkout.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-white border border-cafe-border shadow-warm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-20 h-20 rounded-3xl object-cover border-2 border-cafe-border shadow-warm shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cafe-accent to-amber-700 text-white font-black text-2xl flex items-center justify-center shadow-warm shrink-0">
            {(displayName || user?.email || 'U')[0].toUpperCase()}
          </div>
        )}

        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-black text-cafe-primary">
              {displayName}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 mx-auto sm:mx-0">
              <Award className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>{rewards?.tier ?? 'Bronze'} Diner</span>
            </span>

            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-cafe-accent hover:underline mx-auto sm:ml-2 sm:mx-0"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-cafe-muted font-medium">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5 text-cafe-accent shrink-0" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Phone className="w-3.5 h-3.5 text-cafe-accent shrink-0" />
              <span>{displayPhone}</span>
            </div>
          </div>
        </div>

        {/* Loyalty Balance Mini Widget */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center sm:text-right shrink-0">
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Loyalty Coin Balance</p>
          <p className="text-2xl font-black text-amber-900 mt-0.5 flex items-center justify-center sm:justify-end gap-1">
            <Sparkles className="w-5 h-5 text-amber-600 fill-amber-600" />
            <span>{rewards?.pointsBalance ?? 100}</span>
          </p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-cafe-border space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-cafe-border pb-3">
              <h3 className="text-base font-black text-cafe-primary">Edit Diner Profile</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-xl text-cafe-muted hover:bg-cafe-sand/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-cafe-primary block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-primary block mb-1">Phone Number (For Delivery Updates)</label>
                <input
                  type="tel"
                  placeholder="+91 98451 34911"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted block mb-1">Account Email (Verified via Google)</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-stone-100 text-stone-500 cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-cafe-muted hover:bg-cafe-sand/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved Delivery Addresses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-cafe-primary">Saved Delivery Addresses</h2>
            <p className="text-xs text-cafe-muted">Select or add addresses for fast delivery orders.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-cafe-border space-y-3">
            <MapPin className="w-10 h-10 text-cafe-muted/40 mx-auto" />
            <h3 className="text-sm font-black text-cafe-primary">No delivery addresses saved</h3>
            <p className="text-xs text-cafe-muted max-w-sm mx-auto">
              Add your home, office, or dining location for direct doorstep delivery.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => {
              const isDef = addr.isDefault;
              return (
                <div
                  key={addr.id}
                  className={`p-5 rounded-3xl bg-white border transition-all space-y-3 flex flex-col justify-between ${
                    isDef ? 'border-cafe-accent ring-2 ring-cafe-accent/20 shadow-warm' : 'border-cafe-border shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cafe-light text-cafe-primary flex items-center justify-center font-bold">
                          {addr.label === 'Home' ? <Home className="w-4 h-4" /> : addr.label === 'Work' ? <Briefcase className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-extrabold text-cafe-primary">{addr.label}</span>
                      </div>

                      {isDef ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          Default Destination
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-[11px] font-bold text-cafe-accent hover:underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-cafe-muted leading-relaxed">
                      <p className="font-bold text-cafe-primary">{addr.recipientName} ({addr.recipientPhone})</p>
                      <p>{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      {addr.landmark && <p className="text-[11px]">Near: {addr.landmark}</p>}
                      <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-cafe-border/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-cafe-muted font-medium">Doorstep Dispatch Ready</span>
                    <button
                      type="button"
                      onClick={() => deleteAddress(addr.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-cafe-border space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-cafe-border pb-3">
              <h3 className="text-base font-black text-cafe-primary">Add Delivery Address</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-cafe-muted hover:bg-cafe-sand/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['Home', 'Work', 'Other'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLabel(t)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      label === t
                        ? 'bg-cafe-accent text-white border-cafe-accent shadow-sm'
                        : 'bg-cafe-light text-cafe-muted border-cafe-border hover:bg-cafe-sand/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 98451 34911"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-cafe-muted block mb-1">Address Line 1 (Flat/House No, Building) *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. 402, Royal Palms, 12th Main"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">Area / Street</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Park Street or Salt Lake"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">Landmark</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Metro Station"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="700016"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-cafe-accent focus:ring-cafe-accent"
                />
                <span className="text-xs font-semibold text-cafe-primary">Set as my default delivery destination</span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-cafe-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-cafe-muted hover:bg-cafe-sand/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm"
                >
                  {isSubmitting ? 'Saving Address...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
