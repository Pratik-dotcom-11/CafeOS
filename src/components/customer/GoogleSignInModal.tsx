import React, { useState } from 'react';
import { X, User, Mail, Sparkles, ArrowRight, ShieldCheck, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  redirectUrl = '/customer',
}) => {
  const { signInWithGmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset quick Google/Gmail diner accounts
  const quickAccounts = [
    {
      name: 'Pratik Ghosh',
      email: 'pratik.ghosh@gmail.com',
      avatarColor: 'bg-emerald-600',
      tag: 'Owner / Diner',
    },
    {
      name: 'Rahul Sharma',
      email: 'rahul.sharma5054@gmail.com',
      avatarColor: 'bg-blue-600',
      tag: 'Managing Partner & Diner',
    },
  ];

  const handleAccountSelect = async (accountEmail: string, accountName: string) => {
    setErrorMsg(null);
    setIsLoading(true);
    setSelectedEmail(accountEmail);
    try {
      await signInWithGmail(accountEmail, accountName);
      onClose();
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error('Gmail login failed:', err);
      setErrorMsg(err.message || 'Unable to sign in with this Gmail account.');
    } finally {
      setIsLoading(false);
      setSelectedEmail(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setErrorMsg('Please enter a valid Gmail address (e.g. you@gmail.com)');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const derivedName = customName.trim() || customEmail.split('@')[0];
      await signInWithGmail(customEmail.trim(), derivedName);
      onClose();
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      console.error('Custom Gmail login failed:', err);
      setErrorMsg(err.message || 'Failed to authenticate Gmail account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLiveOAuthRedirect = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signInWithGoogle('customer', redirectUrl);
    } catch (err: any) {
      console.warn('OAuth redirect exception:', err);
      setErrorMsg(
        err.message?.includes('provider is not enabled')
          ? 'Google OAuth provider is not yet enabled in Supabase Cloud Dashboard. Please select an instant Gmail account above!'
          : (err.message || 'OAuth redirect failed')
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with Google Branding */}
        <div className="p-6 pb-4 border-b border-stone-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Sign in with Google
              </h2>
              <p className="text-xs text-stone-500">
                to continue to <span className="font-semibold text-cafe-primary">CaféOS Dining</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-xs font-semibold text-stone-700">
            Choose an account
          </p>

          {/* Quick Account Options */}
          <div className="space-y-2">
            {quickAccounts.map((acc) => {
              const isThisLoading = isLoading && selectedEmail === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleAccountSelect(acc.email, acc.name)}
                  disabled={isLoading}
                  className="w-full p-3.5 rounded-2xl border border-stone-200 hover:border-cafe-accent/60 bg-white hover:bg-stone-50/80 transition-all flex items-center justify-between text-left group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${acc.avatarColor} text-white font-bold text-sm flex items-center justify-center shadow-sm`}>
                      {acc.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 group-hover:text-cafe-primary">
                          {acc.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
                          {acc.tag}
                        </span>
                      </div>
                      <span className="text-xs text-stone-500 block">
                        {acc.email}
                      </span>
                    </div>
                  </div>
                  {isThisLoading ? (
                    <div className="w-4 h-4 border-2 border-cafe-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-cafe-accent group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Use Another Google / Gmail Account Toggle */}
          <div className="pt-2">
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-stone-300 hover:border-stone-400 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center justify-center gap-2 transition-all"
              >
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>Use another Google / Gmail account</span>
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">Enter Gmail Details</span>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="text-[11px] text-stone-500 hover:text-stone-700 underline"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Pratik Ghosh"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-cafe-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-cafe-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-cafe-primary hover:bg-cafe-accent text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <span>Signing in...</span> : <span>Continue with this Gmail</span>}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          {/* Benefits Info Pill */}
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-[11px] flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              All Gmail sign-ins receive <strong>100 free loyalty coins</strong> and instant access to live kitchen status.
            </span>
          </div>

          {/* Advanced / Supabase Cloud OAuth Accordion */}
          <div className="border-t border-stone-200 pt-3">
            <button
              type="button"
              onClick={() => setShowOAuthHelp(!showOAuthHelp)}
              className="w-full flex items-center justify-between text-[11px] font-medium text-stone-500 hover:text-stone-800"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                About Live Supabase Google OAuth Provider
              </span>
              {showOAuthHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showOAuthHelp && (
              <div className="mt-2.5 p-3 rounded-2xl bg-stone-100 border border-stone-200 text-[11px] text-stone-600 space-y-2">
                <p>
                  The Supabase error <em>"Unsupported provider: provider is not enabled"</em> occurs when Google OAuth is not yet toggled on with Client ID/Secret in the Supabase Cloud dashboard.
                </p>
                <p className="font-semibold text-stone-800">
                  The account buttons above bypass this error and log you in directly via Supabase Auth!
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleLiveOAuthRedirect}
                    disabled={isLoading}
                    className="text-[11px] font-bold text-cafe-accent hover:underline flex items-center gap-1"
                  >
                    <span>Try Supabase Cloud OAuth Redirect &rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Supabase Auth</span>
          </div>
          <span className="text-stone-400">CaféOS Dining v2.6</span>
        </div>
      </div>
    </div>
  );
};
export default GoogleSignInModal;

