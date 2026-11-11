import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, Utensils, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { customerService, CustomerReview } from '../../services/customerService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName?: string;
  orderId: string;
  orderNumber?: string;
  orderItems?: Array<{ productId?: string; productName: string }>;
  onReviewSubmitted?: (review: CustomerReview) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  orderId,
  orderNumber,
  orderItems = [],
  onReviewSubmitted,
}) => {
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const starLabels: Record<number, string> = {
    1: 'Needs Improvement',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Exceptional & Delicious',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in to submit a review');
      return;
    }
    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a rating between 1 and 5 stars');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const review = await customerService.createReview({
        customerId: user.id,
        restaurantId,
        orderId,
        productId: selectedProductId || undefined,
        rating,
        reviewText: reviewText.trim() || undefined,
      });

      setIsSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted(review);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Review submission error:', err);
      const msg = err.message?.includes('uq_customer_review_order')
        ? 'You have already submitted a review for this completed order.'
        : err.message || 'Failed to submit review. Only completed orders can be reviewed.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-6 border border-cafe-border dark:border-stone-800 shadow-warm-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-cafe-primary dark:text-cafe-cream">
              Rate Your Dining Experience
            </h3>
            <p className="text-xs text-cafe-muted mt-0.5">
              {restaurantName || 'Restaurant'} • Order {orderNumber || orderId.slice(0, 8)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cafe-light dark:hover:bg-stone-800 text-cafe-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-cafe-primary dark:text-white">Review Published!</h4>
            <p className="text-xs text-cafe-muted">
              Thank you for sharing your feedback. Your verified diner rating has been recorded.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Interactive Star Rating */}
            <div className="text-center space-y-2 py-2 bg-cafe-light/50 dark:bg-stone-800/50 rounded-2xl p-4 border border-cafe-border/50">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-stone-300 dark:text-stone-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-black text-cafe-accent">
                {starLabels[hoverRating || rating]}
              </p>
            </div>

            {/* Optional Dish Selection */}
            {orderItems.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cafe-primary dark:text-cafe-cream flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-cafe-accent" />
                  <span>Reviewing Specific Dish (Optional)</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-cafe-border dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-cafe-primary dark:text-cafe-cream font-medium focus:outline-none focus:border-cafe-accent"
                >
                  <option value="">Entire Order & Restaurant Overall</option>
                  {orderItems
                    .filter((it) => it.productId)
                    .map((it, idx) => (
                      <option key={`${it.productId}-${idx}`} value={it.productId}>
                        {it.productName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Written Review */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-cafe-primary dark:text-cafe-cream flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cafe-accent" />
                  <span>Written Feedback</span>
                </span>
                <span className="text-[11px] text-cafe-muted font-normal">
                  {reviewText.length}/500
                </span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Tell us what you loved about the food, flavors, presentation, or delivery speed..."
                className="w-full p-3 rounded-2xl border border-cafe-border dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-cafe-primary dark:text-cafe-cream placeholder:text-cafe-muted focus:outline-none focus:border-cafe-accent transition-all resize-none font-medium"
              />
            </div>

            {/* Verification Badge */}
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified Diner Badge will appear on your review</span>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-cafe-border dark:border-stone-700 text-xs font-bold text-cafe-muted hover:text-cafe-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Post Verified Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

