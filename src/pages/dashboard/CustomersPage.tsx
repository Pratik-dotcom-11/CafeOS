import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Star,
  Award,
  IndianRupee,
  ShoppingBag,
  Sparkles,
  Phone,
  Mail,
  Heart,
  MessageSquare,
  ShieldAlert,
  Reply,
  CheckCircle2,
  AlertCircle,
  X,
  Filter
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { customerService, CustomerReview } from '../../services/customerService';

export const CustomersPage: React.FC = () => {
  const { customers, restaurant, addToast } = useCafe();

  const [activeMainTab, setActiveMainTab] = useState<'crm' | 'reviews'>('crm');

  // CRM State
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reviews State
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'all'>('all');
  const [replyModalReview, setReplyModalReview] = useState<CustomerReview | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [reportModalReview, setReportModalReview] = useState<CustomerReview | null>(null);
  const [reportReason, setReportReason] = useState<string>('Inappropriate or spam review');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Load reviews when tab changes or restaurant changes
  useEffect(() => {
    if (activeMainTab === 'reviews' && restaurant?.id) {
      loadReviews();
    }
  }, [activeMainTab, restaurant?.id]);

  const loadReviews = async () => {
    if (!restaurant?.id) return;
    try {
      setReviewsLoading(true);
      const data = await customerService.getRestaurantReviews(restaurant.id);
      setReviews(data);
    } catch (err) {
      console.warn('Could not load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const filteredReviews = reviews.filter((r) => {
    if (reviewRatingFilter !== 'all' && r.rating !== reviewRatingFilter) {
      return false;
    }
    return true;
  });

  const getTierBadge = (tier: Customer['tier']) => {
    switch (tier) {
      case 'VIP':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-black';
      case 'Gold':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200 font-bold';
      case 'Silver':
        return 'bg-stone-100 text-stone-800 border-stone-300 font-bold';
      default:
        return 'bg-orange-50 text-orange-800 border-orange-200';
    }
  };

  const handleIssueReward = (customer: Customer) => {
    addToast('Reward Credited', `Issued 100 bonus loyalty points to ${customer.name}`, 'success');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalReview || !replyText.trim()) return;
    setIsSubmittingAction(true);
    try {
      await customerService.respondToReview(replyModalReview.id, replyText);
      addToast('Reply Published', 'Your official restaurant response has been published.', 'success');
      setReplyModalReview(null);
      setReplyText('');
      loadReviews();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to submit response', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReportReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalReview) return;
    setIsSubmittingAction(true);
    try {
      await customerService.reportReview(reportModalReview.id, reportReason);
      addToast('Review Flagged', 'Review reported to admin moderation for policy review.', 'warning');
      setReportModalReview(null);
      loadReviews();
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to report review', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : (restaurant.rating || 4.8).toFixed(1);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
            Guest CRM & Review Moderation
          </h1>
          <p className="text-xs text-cafe-muted mt-1">
            Manage customer relationships, track diner feedback, and respond to verified reviews.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-cafe-light dark:bg-stone-800 p-1.5 rounded-2xl border border-cafe-border dark:border-stone-700">
          <button
            type="button"
            onClick={() => setActiveMainTab('crm')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeMainTab === 'crm'
                ? 'bg-cafe-accent text-white shadow-warm'
                : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Loyalty CRM ({customers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeMainTab === 'reviews'
                ? 'bg-cafe-accent text-white shadow-warm'
                : 'text-cafe-muted hover:text-cafe-primary dark:hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Diner Reviews ({reviews.length})</span>
          </button>
        </div>
      </div>

      {activeMainTab === 'crm' ? (
        <>
          {/* Filter and Search */}
          <div className="bg-white dark:bg-cafe-surface-dark p-4 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {['all', 'VIP', 'Gold', 'Silver', 'Bronze'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    tierFilter === t
                      ? 'bg-cafe-accent text-white shadow-warm-sm'
                      : 'text-cafe-muted hover:text-cafe-primary hover:bg-cafe-sand/40'
                  }`}
                >
                  {t === 'all' ? 'All Customers' : `${t} Members`}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-cafe-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-cafe-light dark:bg-stone-800 border border-cafe-border dark:border-cafe-border-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-cafe-accent"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-cafe-border dark:border-cafe-border-dark bg-cafe-sand/30 dark:bg-stone-800/50 text-cafe-muted font-bold">
                    <th className="py-3.5 px-6">Customer</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Tier Status</th>
                    <th className="py-3.5 px-4">Order History</th>
                    <th className="py-3.5 px-4">Total Revenue</th>
                    <th className="py-3.5 px-4">Favorite Dish</th>
                    <th className="py-3.5 px-4">Last Visit</th>
                    <th className="py-3.5 px-6 text-right">Loyalty Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-border/60 dark:divide-cafe-border-dark/60">
                  {filteredCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      className="hover:bg-cafe-sand/20 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-bold text-cafe-primary dark:text-cafe-cream text-sm">
                          {cust.name}
                        </p>
                        <span className="text-[11px] text-cafe-accent font-semibold">
                          ★ {cust.loyaltyPoints} Reward Points
                        </span>
                      </td>
                      <td className="py-4 px-4 text-cafe-muted">
                        <p className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-cafe-accent" />
                          <span>{cust.email}</span>
                        </p>
                        <p className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-cafe-accent" />
                          <span>{cust.phone}</span>
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] border ${getTierBadge(cust.tier)}`}>
                          {cust.tier} Member
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-cafe-primary dark:text-cafe-cream">
                        {cust.totalOrders} visits
                      </td>
                      <td className="py-4 px-4 font-black text-sm text-cafe-accent">
                        {formatCurrency(cust.totalSpent)}
                      </td>
                      <td className="py-4 px-4 text-cafe-primary dark:text-stone-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{cust.favoriteItem}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-cafe-muted font-medium">
                        {cust.lastVisit}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleIssueReward(cust)}
                          className="px-3 py-1.5 rounded-xl bg-cafe-sand/60 dark:bg-stone-800 hover:bg-cafe-accent hover:text-white border border-cafe-border dark:border-stone-700 text-cafe-primary dark:text-stone-200 text-xs font-bold transition-colors"
                        >
                          +100 Pts
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* REVIEWS MODERATION VIEW */
        <div className="space-y-6">
          {/* Reviews Scorecard & Policy Notice */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-stone-800 shadow-warm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center font-black shrink-0">
                <Star className="w-8 h-8 fill-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-cafe-muted uppercase tracking-wider block">
                  Overall Diner Rating
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-cafe-primary dark:text-white">
                    {averageRating}
                  </span>
                  <span className="text-xs text-cafe-muted font-bold">/ 5.0</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                  Based on {reviews.length} verified dining experiences
                </p>
              </div>
            </div>

            <div className="md:col-span-2 p-5 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Verified Diner Review Moderation Guidelines</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                To maintain authentic diner trust, restaurant staff cannot edit or alter customer review ratings or text. You can submit official owner responses to address customer feedback or report fraudulent reviews for administrative review.
              </p>
            </div>
          </div>

          {/* Star Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-cafe-surface-dark p-3.5 rounded-2xl border border-cafe-border dark:border-stone-800 shadow-warm">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setReviewRatingFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  reviewRatingFilter === 'all'
                    ? 'bg-cafe-accent text-white shadow-warm-sm'
                    : 'text-cafe-muted hover:text-cafe-primary'
                }`}
              >
                All Stars ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setReviewRatingFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    reviewRatingFilter === st
                      ? 'bg-cafe-accent text-white shadow-warm-sm'
                      : 'text-cafe-muted hover:text-cafe-primary'
                  }`}
                >
                  <span>{st}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={loadReviews}
              className="text-xs font-bold text-cafe-accent hover:underline shrink-0 px-2"
            >
              Refresh Reviews
            </button>
          </div>

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-32 rounded-3xl bg-white border border-cafe-border animate-pulse" />
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-cafe-surface-dark rounded-3xl border border-cafe-border dark:border-stone-800 space-y-2">
              <MessageSquare className="w-8 h-8 text-cafe-muted mx-auto" />
              <h3 className="text-sm font-black text-cafe-primary dark:text-white">
                No reviews found for this filter
              </h3>
              <p className="text-xs text-cafe-muted">
                Completed orders will display reviews here once submitted by diners.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-3xl bg-white dark:bg-cafe-surface-dark border border-cafe-border dark:border-stone-800 shadow-warm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cafe-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cafe-accent text-white font-black text-sm flex items-center justify-center">
                        {rev.customer?.fullName ? rev.customer.fullName.charAt(0).toUpperCase() : 'D'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-cafe-primary dark:text-white">
                            {rev.customer?.fullName || 'Verified Diner'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            Verified Purchase
                          </span>
                          {rev.isReported && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                              Reported
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-cafe-muted mt-0.5">
                          Order Ref: {rev.orderId.slice(0, 8)} •{' '}
                          {new Date(rev.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-stone-700">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-black text-cafe-primary dark:text-white ml-1">
                        {rev.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Product Tag */}
                  {rev.product?.name && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-cafe-sand/60 text-xs font-bold text-cafe-accent">
                      Dish: {rev.product.name}
                    </span>
                  )}

                  {/* Customer Review Text (Read-Only) */}
                  {rev.reviewText && (
                    <p className="text-xs text-cafe-primary dark:text-stone-200 leading-relaxed font-medium">
                      "{rev.reviewText}"
                    </p>
                  )}

                  {/* Existing Owner Response */}
                  {rev.ownerReply && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-stone-800 border border-amber-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-400">
                        <span>Official Restaurant Response</span>
                        {rev.ownerReplyAt && (
                          <span>{new Date(rev.ownerReplyAt).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                      <p className="text-xs text-cafe-primary dark:text-stone-200 italic">
                        "{rev.ownerReply}"
                      </p>
                    </div>
                  )}

                  {/* Moderation Actions Bar */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    {!rev.isReported && (
                      <button
                        type="button"
                        onClick={() => setReportModalReview(rev)}
                        className="px-3 py-1.5 rounded-xl border border-cafe-border hover:bg-rose-50 hover:text-rose-700 text-cafe-muted text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setReplyModalReview(rev);
                        setReplyText(rev.ownerReply || '');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-1.5 transition-all"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>{rev.ownerReply ? 'Edit Response' : 'Reply as Owner'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Owner Reply Modal */}
          {replyModalReview && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-6 border border-cafe-border dark:border-stone-800 shadow-warm-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-cafe-primary dark:text-white">
                    Official Owner Response
                  </h3>
                  <button
                    type="button"
                    onClick={() => setReplyModalReview(null)}
                    className="p-1 rounded-full hover:bg-cafe-light text-cafe-muted"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-cafe-light/60 text-xs text-cafe-muted space-y-1">
                  <span className="font-bold text-cafe-primary">
                    Review by {replyModalReview.customer?.fullName || 'Verified Diner'}:
                  </span>
                  <p className="italic">"{replyModalReview.reviewText || `${replyModalReview.rating} Stars`}"</p>
                </div>

                <form onSubmit={handleSendReply} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-cafe-primary block mb-1">
                      Your Response (Visible publicly to diners)
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Thank the diner or address any points raised with hospitality..."
                      className="w-full p-3 rounded-xl border border-cafe-border text-xs focus:outline-none focus:border-cafe-accent"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReplyModalReview(null)}
                      className="px-4 py-2 rounded-xl border border-cafe-border text-xs font-bold text-cafe-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAction || !replyText.trim()}
                      className="px-5 py-2 rounded-xl bg-cafe-accent text-white text-xs font-bold shadow-warm disabled:opacity-50"
                    >
                      {isSubmittingAction ? 'Publishing...' : 'Publish Response'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Report Review Modal */}
          {reportModalReview && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-6 border border-cafe-border dark:border-stone-800 shadow-warm-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-rose-700">Report Inappropriate Review</h3>
                  <button
                    type="button"
                    onClick={() => setReportModalReview(null)}
                    className="p-1 rounded-full hover:bg-cafe-light text-cafe-muted"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleReportReview} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-cafe-primary block mb-1">
                      Reason for Report
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-cafe-border rounded-xl focus:outline-none"
                    >
                      <option value="Inappropriate or abusive language">Inappropriate or abusive language</option>
                      <option value="Spam or promotional content">Spam or promotional content</option>
                      <option value="Factually inaccurate dining claim">Factually inaccurate dining claim</option>
                      <option value="Conflict of interest or fake review">Conflict of interest or fake review</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReportModalReview(null)}
                      className="px-4 py-2 rounded-xl border border-cafe-border text-xs font-bold text-cafe-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAction}
                      className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-warm disabled:opacity-50"
                    >
                      {isSubmittingAction ? 'Reporting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
