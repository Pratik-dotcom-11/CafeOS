import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Store, ShieldCheck, AlertCircle, CheckCircle2, Phone } from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { useAuth } from '../../context/AuthContext';
import { CafeLogo } from '../../components/common/CafeLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useCafe();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessEmailSent, setIsSuccessEmailSent] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await signUp(email, password, name, phone);

      // If session is returned immediately (auto-confirm)
      if (data?.session) {
        addToast('Account Created', 'Welcome to CafeOS! Initializing your workspace...', 'success');
        navigate('/onboarding', { state: { initialRestaurantName: restaurantName } });
      } else {
        // Confirmation email dispatched
        setIsSuccessEmailSent(true);
        addToast('Verification Sent', `Confirmation email dispatched to ${email}`, 'success');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.message || 'Registration failed. Please check your details.';
      setErrorMessage(msg);
      addToast('Registration Failed', msg, 'error');
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
          Create Your Café<span className="text-cafe-accent">OS</span> Account
        </h2>
        <p className="mt-1 text-xs text-cafe-muted">
          Enterprise restaurant management for Indian cafes, fine dining, & QSR chains.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-cafe-surface-dark py-8 px-6 sm:px-10 shadow-warm-lg rounded-3xl border border-cafe-border dark:border-cafe-border-dark space-y-5">
          {isSuccessEmailSent ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="font-extrabold text-base text-cafe-primary dark:text-cafe-cream">
                Confirm Your Email
              </h3>
              <p className="text-xs text-cafe-muted leading-relaxed">
                We've sent a secure verification link to <strong>{email}</strong>. Once confirmed, sign in to launch your restaurant terminal.
              </p>
              <div className="pt-2">
                <NavLink
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold inline-block shadow-warm transition-all"
                >
                  Proceed to Sign In &rarr;
                </NavLink>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Registration Notice</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-cafe-muted">Owner / Manager Name</label>
                  <div className="relative mt-1">
                    <User className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Singhal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl text-cafe-primary dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-accent/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-cafe-muted">Restaurant / Brand Name</label>
                  <div className="relative mt-1">
                    <Store className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arsalan Park Circus"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl text-cafe-primary dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-accent/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-cafe-muted">Work Email</label>
                    <div className="relative mt-1">
                      <Mail className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="owner@arsalankolkata.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl text-cafe-primary dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-accent/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-cafe-muted">Mobile Number</label>
                    <div className="relative mt-1">
                      <Phone className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl text-cafe-primary dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-accent/30"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-cafe-muted">Password</label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl text-cafe-primary dark:text-cafe-cream focus:outline-none focus:ring-2 focus:ring-cafe-accent/30"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Includes automatic 14-day Pro tier with live POS & KDS terminal</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-extrabold text-xs uppercase tracking-wider shadow-warm transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>Registering workspace...</span>
                  ) : (
                    <>
                      <span>Create Restaurant Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="pt-4 border-t border-cafe-border/70 dark:border-cafe-border-dark text-center text-xs text-cafe-muted">
            <span>Already have an account? </span>
            <NavLink to="/login" className="font-bold text-cafe-accent hover:underline">
              Sign In to Terminal &rarr;
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
