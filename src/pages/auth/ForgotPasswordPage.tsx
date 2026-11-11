import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { useAuth } from '../../context/AuthContext';
import { CafeLogo } from '../../components/common/CafeLogo';

export const ForgotPasswordPage: React.FC = () => {
  const { addToast } = useCafe();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await resetPassword(email.trim());
      setSubmitted(true);
      addToast('Reset Link Sent', `Password reset instructions dispatched to ${email}`, 'success');
    } catch (err: any) {
      console.error('Password reset error:', err);
      const msg = err.message || 'Unable to send recovery email. Please verify the address.';
      setErrorMessage(msg);
      addToast('Reset Failed', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cafe-light dark:bg-cafe-dark flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <NavLink to="/" className="inline-flex items-center gap-2 mb-2">
          <CafeLogo size={52} />
        </NavLink>
        <h2 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-cafe-muted">
          Enter your restaurant work email and we will send you secure recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-cafe-surface-dark py-8 px-6 sm:px-10 shadow-warm-lg rounded-3xl border border-cafe-border dark:border-cafe-border-dark space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Recovery Notice</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-extrabold text-base text-cafe-primary dark:text-cafe-cream">
                Check Your Inbox
              </h3>
              <p className="text-xs text-cafe-muted">
                We've sent a password recovery link to <strong>{email}</strong>.
              </p>
              <NavLink
                to="/login"
                className="inline-block mt-4 text-xs font-bold text-cafe-accent hover:underline"
              >
                Return to Login &rarr;
              </NavLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-cafe-muted">Account Email</label>
                <div className="relative mt-1">
                  <Mail className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="julian@artisanbrewcafe.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-extrabold text-xs uppercase tracking-wider shadow-warm transition-all"
              >
                Send Password Reset Link
              </button>

              <div className="pt-2 text-center">
                <NavLink
                  to="/login"
                  className="text-xs font-bold text-cafe-muted hover:text-cafe-primary dark:hover:text-white inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </NavLink>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

