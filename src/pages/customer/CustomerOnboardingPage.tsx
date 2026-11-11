import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/customerService';
import { CafeLogo } from '../../components/common/CafeLogo';
import { validateSafeRedirect } from '../../utils/securityUtils';
import { User, Phone, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const CustomerOnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = validateSafeRedirect(searchParams.get('redirect'), '/customer');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      setPhone(user.user_metadata?.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/customer/login');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await customerService.updateCustomerProfile(user.id, {
        fullName: fullName.trim(),
        phoneNumber: phone.trim() || undefined,
      });

      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      console.warn('Profile onboarding notice:', err);
      // Navigate anyway if backend already synced
      navigate(redirectTarget, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-cafe-border p-6 sm:p-8 shadow-warm-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <CafeLogo size={46} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Account Verified</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-cafe-primary tracking-tight">
            Complete Your Diner Profile
          </h1>
          <p className="text-xs text-cafe-muted">
            Provide your preferred dining contact details to receive real-time order SMS & WhatsApp tracking updates.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-cafe-primary block mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent text-cafe-primary"
              />
              <User className="w-4 h-4 text-cafe-muted absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-cafe-primary block mb-1.5">
              Phone Number (Optional for SMS status alerts)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent text-cafe-primary"
              />
              <Phone className="w-4 h-4 text-cafe-muted absolute left-3.5 top-3 pointer-events-none" />
            </div>
            <p className="text-[10px] text-cafe-muted mt-1">
              Used strictly for order coordination and OTP verifications.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-cafe-primary hover:bg-cafe-accent text-white text-xs font-black tracking-wide shadow-warm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <span>Saving Profile...</span> : <span>Save & Continue to Dining</span>}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate(redirectTarget, { replace: true })}
            className="text-[11px] font-bold text-cafe-muted hover:text-cafe-primary underline"
          >
            Skip for now &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
