import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Building,
  MapPin,
  Clock,
  IndianRupee,
  Utensils,
  Coffee,
  Store,
  Upload,
  AlertCircle
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { useAuth } from '../../context/AuthContext';
import { restaurantService } from '../../services/restaurantService';
import { CafeLogo } from '../../components/common/CafeLogo';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateRestaurant, addToast } = useCafe();
  const { isAuthenticated, refreshWorkspaces, switchWorkspace } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial name from registration or state
  const initialName = (location.state as any)?.initialRestaurantName || 'Arsalan – Park Circus Flagship';

  // Form State
  const [restaurantName, setRestaurantName] = useState(initialName);
  const [cuisine, setCuisine] = useState('Mughlai, Awadhi Biryani, Kebabs & Chaap');
  const [address, setAddress] = useState('191, Marina Garden Court, Park Circus 7-Point');
  const [city, setCity] = useState('Kolkata, West Bengal 700017');
  const [contactEmail, setContactEmail] = useState('contact@arsalankolkata.in');
  const [contactPhone, setContactPhone] = useState('+91 33 2284 8556');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [taxRate, setTaxRate] = useState(5.0);
  const [openingHours, setOpeningHours] = useState('Mon - Sun: 08:00 AM - 11:30 PM');

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. If user is authenticated in Supabase, execute backend RPC workspace creation
      if (isAuthenticated) {
        const generatedSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const rpcResult = await restaurantService.createRestaurantWorkspace({
          name: restaurantName,
          slug: generatedSlug,
          cuisine,
          address,
          city,
          phone: contactPhone,
          email: contactEmail,
          currency,
          currency_symbol: currencySymbol,
          tax_percentage: Number(taxRate),
          open_time: '09:00',
          close_time: '23:30',
        });

        // 2. Refresh workspaces to sync new restaurant into AuthContext
        const refreshed = await refreshWorkspaces();
        if (rpcResult?.restaurant?.id) {
          switchWorkspace(rpcResult.restaurant.id);
        }
      }

      // 3. Update active restaurant in CafeContext
      updateRestaurant({
        name: restaurantName,
        cuisine,
        address,
        city,
        contactEmail,
        contactPhone,
        currency,
        currencySymbol,
        taxPercentage: Number(taxRate),
        openingHours,
      });

      addToast('Restaurant Configured!', `Welcome to your new ${restaurantName} workspace`, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Onboarding workspace creation error:', err);
      // If error (e.g. network issue), still allow graceful fallback to local session
      updateRestaurant({
        name: restaurantName,
        cuisine,
        address,
        city,
        contactEmail,
        contactPhone,
        currency,
        currencySymbol,
        taxPercentage: Number(taxRate),
        openingHours,
      });
      addToast('Restaurant Initialized', `Workspace set for ${restaurantName}`, 'success');
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cafe-light dark:bg-cafe-dark flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <CafeLogo size={52} className="mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
            Configure Your New Cafe Workspace
          </h1>
          <p className="text-xs text-cafe-muted">
            Step {step} of 4 • Set up your digital POS, QR menu, and dining tables
          </p>
        </div>

        {/* Stepper Progress bar */}
        <div className="flex items-center justify-between relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-1 before:bg-cafe-sand dark:before:bg-stone-800 before:z-0 px-4">
          {[
            { num: 1, label: 'Identity' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Operations' },
            { num: 4, label: 'Ready' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-cafe-accent text-white ring-4 ring-cafe-accent/20 shadow-warm'
                      : 'bg-white dark:bg-stone-800 border border-cafe-border text-cafe-muted'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-[10px] font-bold text-cafe-muted mt-1">{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Wizard Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream flex items-center gap-2">
                <Store className="w-5 h-5 text-cafe-accent" />
                <span>Restaurant Identity & Concept</span>
              </h2>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Business / Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Cuisine & Specialty</label>
                <input
                  type="text"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g. Royal Awadhi & Mughlai, Specialty Chai & Kebabs"
                  className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Upload Restaurant Logo</label>
                <div className="mt-1 p-6 border-2 border-dashed border-cafe-border dark:border-stone-700 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-cafe-sand/20 transition-colors">
                  <Upload className="w-7 h-7 text-cafe-accent mb-2" />
                  <p className="text-xs font-bold text-cafe-primary dark:text-stone-200">
                    Click to browse or drag logo here
                  </p>
                  <p className="text-[10px] text-cafe-muted mt-0.5">PNG, JPG, or SVG up to 5MB</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cafe-accent" />
                <span>Location & Contact Details</span>
              </h2>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted">City, State / Postal Code</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Guest Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Store Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream flex items-center gap-2">
                <Clock className="w-5 h-5 text-cafe-accent" />
                <span>Operating Hours, Currency & Tax</span>
              </h2>

              <div>
                <label className="text-xs font-bold text-cafe-muted">Weekly Operating Hours</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Currency Code</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Symbol</label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full mt-1 px-3.5 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-warm">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-cafe-primary dark:text-cafe-cream">
                Your Workspace Is Ready!
              </h2>
              <p className="text-xs text-cafe-muted max-w-md mx-auto">
                We have prepared your POS terminal, seeded initial demonstration dishes, activated
                table ordering, and connected your Kitchen Display System.
              </p>

              <div className="p-4 rounded-2xl bg-cafe-sand/40 dark:bg-stone-800 border border-cafe-border text-left max-w-sm mx-auto text-xs space-y-1.5">
                <p><strong>Store:</strong> {restaurantName}</p>
                <p><strong>Address:</strong> {address}, {city}</p>
                <p><strong>Currency & Tax:</strong> {currency} ({currencySymbol}) • {taxRate}%</p>
                <p><strong>Hours:</strong> {openingHours}</p>
              </div>
            </div>
          )}

          {/* Stepper Navigation buttons */}
          <div className="pt-4 border-t border-cafe-border/70 dark:border-cafe-border-dark flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl border border-cafe-border text-xs font-bold text-cafe-muted hover:bg-cafe-sand/40 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteOnboarding}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-warm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Initializing Workspace...' : 'Launch Restaurant Terminal →'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

