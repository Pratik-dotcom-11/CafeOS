import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { paymentService, RazorpayOrderPayload } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatters';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderPayload: RazorpayOrderPayload;
  currencySymbol?: string;
  onSuccess: (paymentId: string, reference: string) => void;
  onFailure: (errorMessage: string) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  orderPayload,
  currencySymbol = '₹',
  onSuccess,
  onFailure,
}) => {
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'test-fail'>('upi');
  const [upiId, setUpiId] = useState<string>('success@razorpay');
  const [cardNumber, setCardNumber] = useState<string>('5081 2600 0000 0001'); // Standard RuPay Test Card
  const [expiry, setExpiry] = useState<string>('12/28');
  const [cvv, setCvv] = useState<string>('777');
  const [cardHolder, setCardHolder] = useState<string>(orderPayload.notes.customerName || 'Test Customer');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalRupees = orderPayload.amount / 100;

  // 1. Process Successful Sandbox Payment with Cryptographic HMAC Signature
  const handleApprovePayment = async (method: 'upi' | 'card') => {
    setIsProcessing(true);
    setStatusMessage('Connecting to Razorpay Sandbox & Generating HMAC Signature...');

    try {
      // Generate simulated sandbox payment details with genuine HMAC signature
      const sim = await paymentService.simulateSandboxPayment(orderPayload.id, method);

      setStatusMessage('Verifying Cryptographic Signature with Server Ledger...');

      // Server-side verification & atomic ledger entry
      const result = await paymentService.verifyAndCapturePayment({
        orderId: orderPayload.notes.orderId,
        amount: totalRupees,
        paymentMethod: method,
        razorpayOrderId: sim.razorpay_order_id,
        razorpayPaymentId: sim.razorpay_payment_id,
        razorpaySignature: sim.razorpay_signature,
        metadata: {
          test_mode: true,
          method_used: method,
          payer_upi: method === 'upi' ? upiId : undefined,
          card_last4: method === 'card' ? cardNumber.slice(-4) : undefined,
        },
      });

      setStatusMessage('Payment Verified & Recorded in Audit Ledger!');
      setTimeout(() => {
        onSuccess(result.paymentId || sim.razorpay_payment_id, sim.razorpay_payment_id);
      }, 700);
    } catch (err: any) {
      console.error('Sandbox verification failed:', err);
      setIsProcessing(false);
      setStatusMessage(null);
      onFailure(err.message || 'Payment verification failed');
    }
  };

  // 2. Simulate Payment Failure (Insufficient Funds / Bank Decline)
  const handleSimulateFailure = async (reason: string) => {
    setIsProcessing(true);
    setStatusMessage(`Simulating Gateway Decline: ${reason}...`);

    try {
      const mockPayId = `pay_fail_${Date.now()}`;
      await paymentService.recordPaymentFailure({
        orderId: orderPayload.notes.orderId,
        paymentReference: mockPayId,
        reason: reason,
        metadata: { test_mode: true, simulation: true },
      });

      setIsProcessing(false);
      setStatusMessage(null);
      onFailure(`Payment Declined: ${reason}. Please retry or choose another payment method.`);
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage(null);
      onFailure(err.message || 'Payment failed');
    }
  };

  // 3. Simulate Tampered Signature (Security Audit Verification)
  const handleSimulateTamperedSignature = async () => {
    setIsProcessing(true);
    setStatusMessage('Simulating Tampered Payload to test Anti-Fraud Protection...');

    try {
      await paymentService.verifyAndCapturePayment({
        orderId: orderPayload.notes.orderId,
        amount: totalRupees,
        paymentMethod: 'upi',
        razorpayOrderId: orderPayload.id,
        razorpayPaymentId: `pay_fake_${Date.now()}`,
        razorpaySignature: 'forged_tampered_signature_99999999999999999999999999999999',
      });
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage(null);
      alert(`🛡️ SECURITY AUDIT CONFIRMED:\n\nThe server rejected the forged signature successfully!\n\nError: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl shadow-2xl border border-cafe-border dark:border-stone-800 overflow-hidden flex flex-col">
        {/* Header with Razorpay Branding */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center font-black text-xl tracking-tight text-white border border-white/20">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide">Razorpay Gateway</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 uppercase tracking-wider">
                  Test Sandbox
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Ticket {orderPayload.notes.orderNumber || orderPayload.receipt}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-blue-200 uppercase font-bold tracking-wider block">
              Payable Total
            </span>
            <span className="font-display text-xl font-black">
              {formatCurrency(totalRupees, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-3 border-b border-cafe-border/70 dark:border-stone-800 bg-cafe-sand/20 dark:bg-stone-800/40 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upi')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'upi'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-stone-900'
                : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>UPI Apps / QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'card'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-stone-900'
                : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-stone-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>RuPay / Card</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test-fail')}
            className={`py-3 px-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'test-fail'
                ? 'border-b-2 border-rose-600 text-rose-600 dark:text-rose-400 bg-white dark:bg-stone-900'
                : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-stone-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Failure Sandbox</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'upi' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                <div className="w-20 h-20 bg-white rounded-xl p-1.5 shadow-sm border border-blue-200 flex items-center justify-center shrink-0">
                  <QrCode className="w-16 h-16 text-blue-950" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-blue-950 dark:text-blue-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scan UPI QR Code</span>
                  </span>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    Works with Google Pay, PhonePe, Paytm, BHIM & Cred.
                  </p>
                  <p className="text-[10px] text-cafe-muted">
                    Razorpay Order ID: <code className="font-mono text-blue-600">{orderPayload.id}</code>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-muted block mb-1">
                  Or enter Virtual Payment Address (UPI VPA)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="mobile@upi or user@okhdfcbank"
                    className="flex-1 px-3.5 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-stone-700 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setUpiId('success@razorpay')}
                    className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100"
                  >
                    Use Test VPA
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleApprovePayment('upi')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-warm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <span>Approve & Authorize {formatCurrency(totalRupees, currencySymbol)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'card' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Sandbox Notice:</strong> Never enter real banking credentials. Use the standard prefilled RuPay test card.
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-cafe-muted">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-mono bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-stone-700 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-cafe-muted">Valid Thru</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs font-mono bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-stone-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-cafe-muted">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs font-mono bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-stone-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-cafe-muted">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-stone-700 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleApprovePayment('card')}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-warm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying 3DS OTP...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay {formatCurrency(totalRupees, currencySymbol)} with RuPay 3DS</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'test-fail' && (
            <div className="space-y-3">
              <p className="text-xs text-cafe-muted">
                Test how the application gracefully handles payment declines, banking timeouts, and tampered signatures without creating false paid tickets.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSimulateFailure('PAYMENT_DECLINED: Insufficient funds in customer bank account')}
                  className="w-full p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 text-rose-800 dark:text-rose-300 text-xs font-bold text-left flex items-center justify-between"
                >
                  <span>1. Simulate Insufficient Funds Decline</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleSimulateFailure('GATEWAY_TIMEOUT: UPI NPCI bank switch timeout')}
                  className="w-full p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 text-amber-800 dark:text-amber-300 text-xs font-bold text-left flex items-center justify-between"
                >
                  <span>2. Simulate NPCI Bank Network Timeout</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSimulateTamperedSignature}
                  className="w-full p-3 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-50 text-purple-800 dark:text-purple-300 text-xs font-bold text-left flex items-center justify-between"
                >
                  <span>3. Simulate Forged Signature (Tamper Test)</span>
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                </button>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-cafe-sand/30 dark:bg-stone-900 border-t border-cafe-border/70 dark:border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-cafe-muted">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">256-bit TLS Encrypted & Razorpay Sandbox Certified</span>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-stone-300 font-bold hover:bg-cafe-sand text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

