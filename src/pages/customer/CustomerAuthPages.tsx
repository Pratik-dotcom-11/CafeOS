import React, { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CafeLogo } from '../../components/common/CafeLogo';
import { validateSafeRedirect } from '../../utils/securityUtils';
import { GoogleSignInModal } from '../../components/customer/GoogleSignInModal';

export const CustomerLoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectUrl = validateSafeRedirect(redirectParam, '/customer');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleGoogleSignIn = () => {
    setErrorMsg(null);
    setIsGoogleModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoCustomerLogin = async () => {
    setEmail('rahul.sharma5054@gmail.com');
    setPassword('SecurePassword@2026');
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signIn('rahul.sharma5054@gmail.com', 'SecurePassword@2026');
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl border border-cafe-border p-6 sm:p-8 shadow-warm-lg space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <CafeLogo size={46} />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-cafe-primary tracking-tight">
            Welcome to CaféOS Dining
          </h1>
          <p className="text-xs text-cafe-muted">
            Track live kitchen tickets, save favorite restaurants, and earn 5% loyalty coins on every order.
          </p>
        </div>

        {/* Benefits Pill */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-2xl bg-cafe-sand/30 border border-cafe-border/60 text-center">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-cafe-muted">Rewards</p>
            <p className="text-xs font-black text-cafe-primary">5% Coins</p>
          </div>
          <div className="border-x border-cafe-border/60">
            <p className="text-[10px] font-extrabold uppercase text-cafe-muted">Live Tracking</p>
            <p className="text-xs font-black text-emerald-600">Real-Time</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase text-cafe-muted">Checkout</p>
            <p className="text-xs font-black text-cafe-accent">Instant 1-Tap</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border-2 border-stone-200 hover:border-stone-300 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 btn-press"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>

        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cafe-border/80" />
          </div>
          <span className="relative bg-white px-3 text-[10px] font-bold text-cafe-muted uppercase tracking-wider">
            Or sign in with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-cafe-primary block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent text-cafe-primary"
              />
              <Mail className="w-4 h-4 text-cafe-muted absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-cafe-primary">Password</label>
              <NavLink to="/forgot-password" className="text-[11px] font-bold text-cafe-accent hover:underline">
                Forgot?
              </NavLink>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent text-cafe-primary"
              />
              <Lock className="w-4 h-4 text-cafe-muted absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-cafe-primary hover:bg-cafe-accent text-white text-xs font-black tracking-wide shadow-warm transition-all flex items-center justify-center gap-2 disabled:opacity-50 btn-press"
          >
            {isLoading ? <span>Signing in...</span> : <span>Sign In & Continue</span>}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <button
          type="button"
          onClick={handleDemoCustomerLogin}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-2 btn-press"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
          <span>Quick 1-Click Demo Diner Login</span>
        </button>

        <div className="pt-2 text-center space-y-2 border-t border-cafe-border/60 text-xs text-cafe-muted">
          <p>
            Don't have a diner account?{' '}
            <NavLink to="/customer/register" className="font-bold text-cafe-accent hover:underline">
              Sign up for 100 free coins
            </NavLink>
          </p>
          <p className="text-[11px] text-cafe-muted/70">
            By signing in, you agree to our{' '}
            <NavLink to="/terms" className="underline hover:text-cafe-primary">Terms of Service</NavLink>{' '}
            and{' '}
            <NavLink to="/privacy" className="underline hover:text-cafe-primary">Privacy Policy</NavLink>.
          </p>
          <p className="pt-1">
            Restaurant staff or manager?{' '}
            <NavLink to="/login" className="font-bold text-cafe-primary hover:underline">
              Partner Portal Login &rarr;
            </NavLink>
          </p>
        </div>
      </motion.div>

      {/* Google Account Sign-In Modal */}
      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        redirectUrl={redirectUrl}
      />
    </div>
  );
};

export const CustomerRegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectUrl = validateSafeRedirect(redirectParam, '/customer');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleGoogleSignUp = () => {
    setErrorMsg(null);
    setIsGoogleModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim(), phone.trim() || undefined);
      navigate(redirectUrl, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl border border-cafe-border p-6 sm:p-8 shadow-warm-lg space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <CafeLogo size={42} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200">
            <Sparkles className="w-3 h-3 text-amber-600 fill-amber-600" />
            <span>Bonus 100 Loyalty Coins on Signup</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-cafe-primary tracking-tight">
            Create Diner Account
          </h1>
          <p className="text-xs text-cafe-muted">
            Order directly from royal kitchens, track orders live, and collect redeemable dining perks.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Fast Signup */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border-2 border-stone-200 hover:border-stone-300 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>

        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cafe-border/80" />
          </div>
          <span className="relative bg-white px-3 text-[10px] font-bold text-cafe-muted uppercase tracking-wider">
            Or create account with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-cafe-primary block mb-1">Your Full Name *</label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Priya Sharma"
                required
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent text-cafe-primary"
              />
              <User className="w-4 h-4 text-cafe-muted absolute left-3.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-cafe-primary block mb-1">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@domain.com"
                required
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent text-cafe-primary"
              />
              <Mail className="w-4 h-4 text-cafe-muted absolute left-3.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-cafe-primary block mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent text-cafe-primary"
              />
              <Phone className="w-4 h-4 text-cafe-muted absolute left-3.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-cafe-primary block mb-1">Create Password *</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/50 focus:bg-white focus:outline-none focus:border-cafe-accent text-cafe-primary"
              />
              <Lock className="w-4 h-4 text-cafe-muted absolute left-3.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black tracking-wide shadow-warm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <span>Creating Account...</span> : <span>Join & Claim 100 Coins</span>}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-cafe-muted border-t border-cafe-border/60">
          Already have an account?{' '}
          <NavLink to="/customer/login" className="font-bold text-cafe-accent hover:underline">
            Sign In
          </NavLink>
        </div>
      </motion.div>

      {/* Google Account Sign-In Modal */}
      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        redirectUrl={redirectUrl}
      />
    </div>
  );
};

