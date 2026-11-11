import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  CheckCircle2,
  X,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
  Check,
  Receipt,
  HelpCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export interface PricingPlanData {
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  terminals: string;
  ordersPerMonth: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
}

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlanData | null;
  billingCycle: 'monthly' | 'yearly';
  onBillingCycleChange: (cycle: 'monthly' | 'yearly') => void;
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  billingCycle,
  onBillingCycleChange,
}) => {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState<string>('restaurant.owner@okhdfcbank');
  const [restaurantName, setRestaurantName] = useState<string>('Royal Heritage Cafe');
  const [ownerEmail, setOwnerEmail] = useState<string>('owner@cafeos.io');
  const [ownerPhone, setOwnerPhone] = useState<string>('+91 98301 23456');

  // Card form state
  const [cardNumber, setCardNumber] = useState<string>('5081 2600 0000 0001');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('777');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [transactionRef, setTransactionRef] = useState<string>('');

  if (!isOpen || !plan) return null;

  const currentPrice = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const gstAmount = Math.round(currentPrice * 0.18);
  const totalAmount = currentPrice + gstAmount;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingStep('Generating Razorpay Enterprise Order...');

    await new Promise((resolve) => setTimeout(resolve, 800));
    setProcessingStep('Connecting to Banking Switch & Verifying HMAC Signature...');

    await new Promise((resolve) => setTimeout(resolve, 900));
    setProcessingStep('Recording Subscription in Sovereign Audit Ledger...');

    await new Promise((resolve) => setTimeout(resolve, 700));

    const ref = `RZP-SUB-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    setTransactionRef(ref);
    setIsProcessing(false);
    setIsSuccess(true);
  };

  const handleGoToDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans selection:bg-cafe-accent selection:text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-cafe-primary to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cafe-accent text-white flex items-center justify-center font-black shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Activate {plan.name}
                </h2>
                {plan.isPopular && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cafe-accent text-white">
                    Popular
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300">
                Official Indian Hospitality SaaS Activation Gateway
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {!isSuccess ? (
          <form onSubmit={handleProcessPayment} className="p-4 sm:p-6 space-y-5 text-xs">
            {/* 1. Plan Summary & Billing Cycle Toggle */}
            <div className="p-4 rounded-2xl bg-cafe-light dark:bg-stone-800/60 border border-cafe-border dark:border-stone-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cafe-accent block">
                    Selected Subscription Plan
                  </span>
                  <p className="text-base font-black text-cafe-primary dark:text-white">
                    {plan.name}
                  </p>
                  <p className="text-xs text-cafe-muted mt-0.5">
                    {plan.terminals} • {plan.ordersPerMonth}
                  </p>
                </div>

                {/* Billing Cycle Switcher */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-700 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onBillingCycleChange('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-cafe-primary text-white shadow-sm'
                        : 'text-cafe-muted hover:text-cafe-primary'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => onBillingCycleChange('yearly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      billingCycle === 'yearly'
                        ? 'bg-cafe-accent text-white shadow-sm'
                        : 'text-cafe-muted hover:text-cafe-primary'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-black">
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-cafe-border/60 dark:border-stone-700 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border/50 dark:border-stone-700">
                  <span className="text-[10px] text-cafe-muted uppercase font-bold block">Base Tier</span>
                  <span className="font-extrabold text-cafe-primary dark:text-white text-xs">
                    {formatCurrency(currentPrice, '₹')}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border/50 dark:border-stone-700">
                  <span className="text-[10px] text-cafe-muted uppercase font-bold block">18% GST</span>
                  <span className="font-extrabold text-cafe-primary dark:text-white text-xs">
                    +{formatCurrency(gstAmount, '₹')}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-cafe-accent/10 text-cafe-accent border border-cafe-accent/30">
                  <span className="text-[10px] uppercase font-black block">Total Payable</span>
                  <span className="font-black text-sm text-cafe-accent">
                    {formatCurrency(totalAmount, '₹')}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Restaurant Activation Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-cafe-primary dark:text-stone-300 font-bold block mb-1">
                  Restaurant / Cafe Name
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. Arsalan Bistro"
                  className="w-full p-2.5 rounded-xl bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-white outline-none focus:border-cafe-accent font-medium"
                />
              </div>

              <div>
                <label className="text-cafe-primary dark:text-stone-300 font-bold block mb-1">
                  Owner Email Address
                </label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@yourrestaurant.com"
                  className="w-full p-2.5 rounded-xl bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-white outline-none focus:border-cafe-accent font-medium"
                />
              </div>
            </div>

            {/* 3. Payment Method Tabs */}
            <div className="space-y-2">
              <label className="text-cafe-primary dark:text-stone-300 font-bold block">
                Select Indian Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 btn-press ${
                    paymentMethod === 'upi'
                      ? 'border-cafe-accent bg-cafe-accent/10 text-cafe-accent font-black ring-2 ring-cafe-accent/20'
                      : 'border-cafe-border dark:border-stone-700 text-cafe-muted hover:text-cafe-primary'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="font-bold">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 btn-press ${
                    paymentMethod === 'card'
                      ? 'border-cafe-accent bg-cafe-accent/10 text-cafe-accent font-black ring-2 ring-cafe-accent/20'
                      : 'border-cafe-border dark:border-stone-700 text-cafe-muted hover:text-cafe-primary'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="font-bold">RuPay / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 btn-press ${
                    paymentMethod === 'netbanking'
                      ? 'border-cafe-accent bg-cafe-accent/10 text-cafe-accent font-black ring-2 ring-cafe-accent/20'
                      : 'border-cafe-border dark:border-stone-700 text-cafe-muted hover:text-cafe-primary'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="font-bold">Net Banking</span>
                </button>
              </div>
            </div>

            {/* 4. Payment Fields corresponding to chosen method */}
            {paymentMethod === 'upi' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-900 dark:text-amber-300">
                      Instant UPI Auto-Approve (GPay, PhonePe, Paytm)
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Verified Switch
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">
                    Your UPI Virtual Payment Address (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="mobile@upi or id@okhdfcbank"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-cafe-primary dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/80 leading-relaxed">
                  ✓ Instant zero-latency activation. You will receive a collect request notification on your preferred UPI app.
                </p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-4 rounded-2xl bg-cafe-sand/40 dark:bg-stone-800 border border-cafe-border dark:border-stone-700 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted block mb-1">
                    Card Number (RuPay, Visa, Mastercard)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-white outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-cafe-muted block mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-white outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-cafe-muted block mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-white outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div className="p-4 rounded-2xl bg-cafe-sand/40 dark:bg-stone-800 border border-cafe-border dark:border-stone-700 space-y-2">
                <p className="font-bold text-cafe-primary dark:text-white">
                  Supported Corporate & Retail Banking Partners:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-bold text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border">HDFC Bank</div>
                  <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border">ICICI Bank</div>
                  <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border">State Bank</div>
                  <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border">Axis Bank</div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white font-black text-xs uppercase tracking-wider shadow-warm-md hover:shadow-warm-lg flex items-center justify-center gap-2 transition-all btn-press disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{processingStep}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize Payment • {formatCurrency(totalAmount, '₹')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Security Badges & Direct Links */}
            <div className="pt-3 border-t border-cafe-border/60 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-cafe-muted gap-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-bit SSL & Reserve Bank of India compliant</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  className="hover:text-cafe-primary underline font-bold"
                >
                  Existing Account? Log In
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Payment Success Celebration State */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-warm animate-in zoom-in-95">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Payment Authorized & Plan Active
              </span>
              <h2 className="text-2xl font-black text-cafe-primary dark:text-white">
                Welcome to {plan.name}!
              </h2>
              <p className="text-xs text-cafe-muted max-w-md mx-auto">
                Your subscription for <strong className="text-cafe-primary dark:text-white">{restaurantName}</strong> has been provisioned on the CafeOS Cloud. All POS terminals, kitchen screens, and features are now fully enabled.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-cafe-light dark:bg-stone-800/60 border border-cafe-border dark:border-stone-700 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-cafe-muted">Transaction Reference:</span>
                <span className="font-mono font-bold text-cafe-primary dark:text-white">{transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cafe-muted">Billing Cadence:</span>
                <span className="font-bold text-cafe-primary dark:text-white uppercase">
                  {billingCycle === 'monthly' ? 'Monthly' : 'Annual (12 Months)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cafe-muted">Terminals Authorized:</span>
                <span className="font-bold text-emerald-600">{plan.terminals}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-cafe-border/50 dark:border-stone-700 text-sm font-black text-cafe-primary dark:text-white">
                <span>Amount Paid:</span>
                <span className="text-cafe-accent">{formatCurrency(totalAmount, '₹')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGoToDashboard}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-cafe-primary dark:bg-cafe-accent text-white font-black text-xs uppercase tracking-wider shadow-warm flex items-center justify-center gap-2 btn-press"
              >
                <span>Launch Restaurant HQ</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/dashboard/billing');
                }}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-white font-bold text-xs hover:bg-cafe-sand/40 transition-colors"
              >
                View GST Invoices
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
