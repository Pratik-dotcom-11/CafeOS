import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Coffee,
  UtensilsCrossed,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { useAuth } from '../../context/AuthContext';
import { CafeLogo } from '../../components/common/CafeLogo';
import { validateSafeRedirect } from '../../utils/securityUtils';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useCafe();
  const { signIn, signInWithGoogle, workspaces } = useAuth();

  const [email, setEmail] = useState('rahul.sharma5054@gmail.com');
  const [password, setPassword] = useState('SecurePassword@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await signIn(email, password);
      addToast('Welcome Back!', `Signed in as ${data.user?.email}`, 'success');

      const rawRedirect = (location.state as any)?.from?.pathname;
      const safeRedirect = validateSafeRedirect(rawRedirect, '/dashboard');
      navigate(safeRedirect, { replace: true });
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
      addToast('Sign In Failed', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const rawRedirect = (location.state as any)?.from?.pathname || '/dashboard';
      const safeRedirect = validateSafeRedirect(rawRedirect, '/dashboard');
      await signInWithGoogle('restaurant', safeRedirect);
    } catch (err: any) {
      console.error('Restaurant Google sign-in exception:', err);
      setErrorMessage(err.message || 'Google authentication encountered an issue.');
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'owner' | 'kds' | 'superadmin') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (role === 'owner') {
        setEmail('rahul.sharma5054@gmail.com');
        setPassword('SecurePassword@2026');
        await signIn('rahul.sharma5054@gmail.com', 'SecurePassword@2026');
        addToast('Demo Terminal Active', 'Signed into Arsalan Park Circus, Kolkata (Owner)', 'success');
        navigate('/dashboard');
      } else if (role === 'kds') {
        setEmail('rahul.sharma5054@gmail.com');
        setPassword('SecurePassword@2026');
        await signIn('rahul.sharma5054@gmail.com', 'SecurePassword@2026');
        addToast('Kitchen Terminal Active', 'Opening Live Kitchen Display System', 'info');
        navigate('/kitchen');
      } else {
        addToast('Super Admin Console', 'Opening SaaS Super Admin Cockpit', 'info');
        navigate('/super-admin');
      }
    } catch (err: any) {
      console.warn('Quick demo sign-in fallback:', err);
      if (role === 'owner') navigate('/dashboard');
      else if (role === 'kds') navigate('/kitchen');
      else navigate('/super-admin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cafe-light dark:bg-cafe-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <NavLink to="/" className="inline-flex items-center gap-2 mb-2">
          <CafeLogo size={52} />
        </NavLink>
        <h2 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
          Welcome back to Café<span className="text-cafe-accent">OS</span>
        </h2>
        <p className="mt-1 text-xs text-cafe-muted">
          The all-in-one operating system for modern cafes and dining rooms.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-cafe-surface-dark py-8 px-6 sm:px-10 shadow-warm-lg rounded-3xl border border-cafe-border dark:border-cafe-border-dark space-y-6">
          {/* Quick Demo Selector */}
          <div className="p-3.5 rounded-2xl bg-cafe-sand/40 dark:bg-stone-800/60 border border-cafe-border/60 dark:border-stone-700 text-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-cafe-muted block">
              ⚡ Quick Demo 1-Click Launch:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('owner')}
                className="py-1.5 px-2 rounded-xl bg-white dark:bg-stone-700 border border-cafe-border dark:border-stone-600 text-[11px] font-bold text-cafe-primary dark:text-stone-200 hover:border-cafe-accent transition-colors btn-press"
              >
                Manager POS
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('kds')}
                className="py-1.5 px-2 rounded-xl bg-white dark:bg-stone-700 border border-cafe-border dark:border-stone-600 text-[11px] font-bold text-orange-600 hover:border-orange-500 transition-colors btn-press"
              >
                Kitchen KDS
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('superadmin')}
                className="py-1.5 px-2 rounded-xl bg-white dark:bg-stone-700 border border-cafe-border dark:border-stone-600 text-[11px] font-bold text-purple-600 hover:border-purple-500 transition-colors btn-press"
              >
                Super Admin
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Notice</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Restaurant Staff & Owner Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 border border-cafe-border dark:border-stone-700 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Continue with Google (Staff / Owner)</span>
          </button>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cafe-border/80 dark:border-stone-700" />
            </div>
            <span className="relative bg-white dark:bg-cafe-surface-dark px-3 text-[10px] font-bold text-cafe-muted uppercase tracking-wider">
              Or sign in with email credentials
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-cafe-muted">Email Address</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl text-cafe-primary dark:text-cafe-cream font-medium focus:outline-none focus:ring-2 focus:ring-cafe-accent/30"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cafe-muted">Password</label>
                <NavLink
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-cafe-accent hover:underline"
                >
                  Forgot password?
                </NavLink>
              </div>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-cafe-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl text-cafe-primary dark:text-cafe-cream font-medium focus:outline-none focus:ring-2 focus:ring-cafe-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-muted hover:text-cafe-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-cafe-primary dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-cafe-accent focus:ring-cafe-accent"
                />
                <span>Remember this terminal</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-extrabold text-xs uppercase tracking-wider shadow-warm transition-all flex items-center justify-center gap-2 btn-press"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-cafe-border/70 dark:border-cafe-border-dark text-center text-xs text-cafe-muted space-y-2">
            <div>
              <span>New restaurant owner? </span>
              <NavLink to="/onboarding" className="font-bold text-cafe-accent hover:underline">
                Start Restaurant Setup Wizard &rarr;
              </NavLink>
            </div>
            <div className="text-[11px] text-cafe-muted/80">
              <span>Looking for food ordering & dining? </span>
              <NavLink to="/customer/login" className="font-bold text-cafe-primary dark:text-stone-300 hover:text-cafe-accent underline">
                Customer Dining Portal &rarr;
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

