import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  ChevronDown,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  X,
  MessageCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  customerService,
  CustomerSupportTicket,
  CustomerSupportMessage
} from '../../services/customerService';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';

export const CustomerSupportPage: React.FC = () => {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<CustomerSupportTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('order_issue');
  const [subject, setSubject] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Thread Modal
  const [activeTicket, setActiveTicket] = useState<CustomerSupportTicket | null>(null);
  const [threadMessages, setThreadMessages] = useState<CustomerSupportMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState<boolean>(false);
  const [replyInput, setReplyInput] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setIsLoading(true);
        const [ticketData, orderData] = await Promise.all([
          customerService.getSupportTickets(user.id),
          orderService.getCustomerOrders(user.id),
        ]);
        setTickets(ticketData);
        setOrders(orderData);
      } catch (err) {
        console.warn('Error loading support data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleOpenThread = async (ticket: CustomerSupportTicket) => {
    setActiveTicket(ticket);
    try {
      setThreadLoading(true);
      const msgs = await customerService.getSupportTicketMessages(ticket.id);
      setThreadMessages(msgs);
    } catch (err) {
      console.warn('Could not load thread messages', err);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !user || !replyInput.trim()) return;
    setIsSendingReply(true);
    try {
      const newMsg = await customerService.sendSupportTicketMessage(
        activeTicket.id,
        user.id,
        replyInput.trim(),
        'customer'
      );
      setThreadMessages([...threadMessages, newMsg]);
      setReplyInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;
    setIsSubmitting(true);
    try {
      const matchedOrder = orders.find((o) => o.id === selectedOrderId);
      const newTicket = await customerService.createSupportTicket({
        userId: user.id,
        category,
        subject: subject.trim(),
        message: message.trim(),
        orderId: selectedOrderId || undefined,
        restaurantId: matchedOrder?.restaurantId,
      });
      setTickets([newTicket, ...tickets]);
      setIsModalOpen(false);
      setSubject('');
      setMessage('');
      setSelectedOrderId('');
      setCategory('order_issue');
      setSuccessMsg(`Ticket ${newTicket.ticketNumber} created successfully! Our team will respond shortly.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    order_issue: 'Order Issue',
    missing_item: 'Missing Item in Order',
    incorrect_item: 'Incorrect Dish / Item',
    payment_issue: 'Payment or Billing Inquiry',
    account_issue: 'Account & Loyalty Coins',
    other: 'General Inquiry / Feedback',
  };

  const faqs = [
    {
      q: 'How does live kitchen preparation tracking work?',
      a: 'CaféOS connects directly to the chefs’ kitchen display terminals. The moment an order is confirmed, you see real-time updates as chefs accept, begin cooking, and mark your meal ready.',
    },
    {
      q: 'Can I cancel an order once placed?',
      a: 'Orders can be cancelled directly through the Live Order Tracker while they are in "Pending" status. Once the kitchen chefs start cooking, cancellation is restricted to avoid food wastage.',
    },
    {
      q: 'How are loyalty coins earned and redeemed?',
      a: 'You automatically earn 5% coins on all direct orders. 1 Coin = ₹1 instant discount. Coins can be redeemed during checkout with no minimum expiration.',
    },
    {
      q: 'What should I do if an item in my delivery is missing?',
      a: 'Please use the "Submit Support Request" button below and select your order number. Our manager will immediately investigate with the kitchen and arrange a refund or instant replacement.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-cafe-primary tracking-tight">Customer Care & Support</h1>
          <p className="text-xs text-cafe-muted mt-0.5">
            We are here to help. Report order issues or contact our dedicated dining support team.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Ticket</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-cafe-border shadow-warm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-cafe-primary">Direct Dining Helpline</h3>
            <p className="text-xs text-cafe-accent font-black mt-0.5">+91 98451 34911</p>
            <p className="text-[11px] text-cafe-muted mt-0.5">Available 7:00 AM – 11:00 PM Daily</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-cafe-border shadow-warm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-cafe-primary">Email Customer Care</h3>
            <p className="text-xs text-cafe-primary font-bold mt-0.5">support@cafeos.in</p>
            <p className="text-[11px] text-cafe-muted mt-0.5">Average response within 15 minutes</p>
          </div>
        </div>
      </div>

      {/* My Support Tickets */}
      {user && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-cafe-primary">My Support Inquiries</h2>
            <span className="text-xs text-cafe-muted font-bold">{tickets.length} Total</span>
          </div>

          {isLoading ? (
            <div className="h-32 rounded-3xl bg-white border border-cafe-border animate-pulse" />
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-cafe-border text-xs text-cafe-muted">
              You have no active support requests. Need assistance? Click "Submit Ticket" above.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-3xl bg-white border border-cafe-border shadow-sm space-y-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-cafe-accent">{t.ticketNumber}</span>
                      {t.category && (
                        <span className="px-2 py-0.5 rounded-md bg-cafe-light text-[10px] font-bold text-cafe-primary">
                          {categoryLabels[t.category] || t.category}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        t.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-cafe-primary">{t.subject}</h4>
                  <p className="text-xs text-cafe-muted leading-relaxed line-clamp-2">{t.message}</p>

                  {t.resolutionNotes && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
                      <strong>Resolution:</strong> {t.resolutionNotes}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-cafe-border/50 text-xs">
                    <span className="text-[11px] text-cafe-muted">
                      Created {new Date(t.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenThread(t)}
                      className="px-3.5 py-1.5 rounded-xl bg-cafe-light hover:bg-cafe-sand text-cafe-primary font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-cafe-accent" />
                      <span>View Conversation Thread</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-cafe-primary">Frequently Asked Questions</h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-cafe-border overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs text-cafe-primary hover:bg-cafe-light/30 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-cafe-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-cafe-muted leading-relaxed border-t border-cafe-border/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-cafe-border shadow-warm-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-cafe-primary">Submit Support Ticket</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-cafe-light text-cafe-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-cafe-primary block mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/40 focus:bg-white focus:outline-none focus:border-cafe-accent"
                >
                  <option value="order_issue">Order Issue (General)</option>
                  <option value="missing_item">Missing Item in Order</option>
                  <option value="incorrect_item">Incorrect Dish / Item</option>
                  <option value="payment_issue">Payment or Billing Issue</option>
                  <option value="account_issue">Account & Loyalty Coins</option>
                  <option value="other">Other Inquiry / Feedback</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-primary block mb-1">Related Order (Optional)</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/40 focus:bg-white focus:outline-none focus:border-cafe-accent"
                >
                  <option value="">No specific order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} – {new Date(o.createdAt).toLocaleDateString()} (₹{o.total})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-primary block mb-1">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="e.g. Missing naan bread in Order #CF-T105"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/40 focus:bg-white focus:outline-none focus:border-cafe-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cafe-primary block mb-1">Description / Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Please describe what happened so our team can immediately resolve it..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-cafe-border bg-cafe-light/40 focus:bg-white focus:outline-none focus:border-cafe-accent"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-cafe-border text-xs font-bold text-cafe-muted hover:bg-cafe-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm hover:bg-cafe-accent-hover disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Send Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Conversation Thread Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 border border-cafe-border shadow-warm-lg flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cafe-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-cafe-accent">{activeTicket.ticketNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      activeTicket.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {activeTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-sm font-black text-cafe-primary mt-0.5">{activeTicket.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="p-1 rounded-full hover:bg-cafe-light text-cafe-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {/* Initial Ticket Message */}
              <div className="p-3.5 rounded-2xl bg-cafe-light/60 border border-cafe-border text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px] text-cafe-muted font-bold">
                  <span>Initial Issue Description</span>
                  <span>{new Date(activeTicket.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-cafe-primary leading-relaxed">{activeTicket.message}</p>
              </div>

              {/* Thread Messages */}
              {threadLoading ? (
                <div className="text-center py-4 text-xs text-cafe-muted">Loading messages...</div>
              ) : threadMessages.length === 0 ? (
                <div className="text-center py-4 text-xs text-cafe-muted">
                  Our customer care team is reviewing your ticket and will reply here.
                </div>
              ) : (
                threadMessages.map((msg) => {
                  const isStaff = msg.senderRole === 'staff' || msg.senderRole === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-1 ${
                          isStaff
                            ? 'bg-amber-50 border border-amber-200 text-cafe-primary'
                            : 'bg-cafe-accent text-white'
                        }`}
                      >
                        <div
                          className={`text-[10px] font-bold flex items-center justify-between gap-3 ${
                            isStaff ? 'text-amber-800' : 'text-white/80'
                          }`}
                        >
                          <span>{isStaff ? 'Restaurant Support Team' : 'You'}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Bar */}
            <form onSubmit={handleSendThreadReply} className="pt-3 border-t border-cafe-border flex items-center gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Type your reply message..."
                disabled={activeTicket.status === 'closed' || isSendingReply}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-cafe-border bg-cafe-light/40 focus:bg-white focus:outline-none focus:border-cafe-accent"
              />
              <button
                type="submit"
                disabled={!replyInput.trim() || isSendingReply || activeTicket.status === 'closed'}
                className="px-4 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingReply ? 'Sending...' : 'Reply'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSupportPage;
