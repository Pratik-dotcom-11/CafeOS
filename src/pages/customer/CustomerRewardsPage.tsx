import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  Gift,
  CheckCircle2,
  Crown,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { customerService, CustomerRewardTransaction } from '../../services/customerService';

export const CustomerRewardsPage: React.FC = () => {
  const { user } = useAuth();
  const { rewards } = useCustomer();

  const [transactions, setTransactions] = useState<CustomerRewardTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTx() {
      if (!user) return;
      try {
        setIsLoading(true);
        const data = await customerService.getRewardTransactions(user.id);
        setTransactions(data);
      } catch (err) {
        console.warn('Error loading reward transactions', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTx();
  }, [user]);

  const currentCoins = rewards?.pointsBalance ?? 100;
  const currentTier = rewards?.tier ?? 'Bronze';

  const tierLevels = [
    { name: 'Bronze', min: 0, coinsPct: '5%', perk: 'Standard 5% Dining Coins' },
    { name: 'Silver', min: 500, coinsPct: '7.5%', perk: '7.5% Coins + Free Birthday Chai' },
    { name: 'Gold', min: 1000, coinsPct: '10%', perk: '10% Coins + Free Delivery on all cafes' },
    { name: 'VIP', min: 2500, coinsPct: '15%', perk: '15% Coins + VIP Table Booking Priority' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-cafe-primary tracking-tight">
          CaféOS Dining Coins & Loyalty Tier
        </h1>
        <p className="text-xs text-cafe-muted mt-0.5">
          Earn 5% to 15% cashback coins on every direct order. Redeem instantly at checkout.
        </p>
      </div>

      {/* Main Loyalty Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#302019] via-[#4A2D20] to-[#1E140F] text-white p-6 sm:p-8 shadow-warm-lg">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 fill-amber-300" />
              <span>{currentTier} Tier Diner</span>
            </span>

            <p className="text-xs text-cafe-cream/80">Available Redeemable Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {currentCoins}
              </span>
              <span className="text-lg font-bold text-amber-400">Coins</span>
              <span className="text-xs text-white/60 ml-2">(= ₹{currentCoins} discount)</span>
            </div>
          </div>

          <div className="sm:text-right space-y-2">
            <NavLink
              to="/customer/restaurants"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-black tracking-wide shadow-warm transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Redeem on Order</span>
            </NavLink>
            <p className="text-[11px] text-cafe-cream/70">1 Coin = ₹1 instant deduction</p>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-cafe-cream">
            <span>Tier Progress: {currentTier}</span>
            <span>{currentTier === 'VIP' ? 'Max VIP Achieved' : `Next Milestone: 500 Coins (Silver)`}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cafe-accent transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((currentCoins / 500) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tier Perks Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-cafe-primary">Loyalty Membership Tiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tierLevels.map((t) => {
            const isCurrent = t.name.toLowerCase() === currentTier.toLowerCase();
            return (
              <div
                key={t.name}
                className={`p-5 rounded-3xl bg-white border transition-all space-y-3 ${
                  isCurrent ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-warm' : 'border-cafe-border shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-cafe-primary">{t.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200">
                      Current
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1 text-cafe-muted">
                  <p className="font-extrabold text-cafe-accent text-base">{t.coinsPct} Cashback</p>
                  <p className="text-[11px] leading-tight">{t.perk}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coin Activity History */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-cafe-primary">Coins Transaction Ledger</h2>

        {isLoading ? (
          <div className="h-44 rounded-3xl bg-white border border-cafe-border animate-pulse" />
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-cafe-border text-xs text-cafe-muted">
            No coin activity recorded yet. Place an order to start earning!
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-cafe-border overflow-hidden shadow-warm divide-y divide-cafe-border/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 font-black flex items-center justify-center shrink-0">
                    🪙
                  </div>
                  <div>
                    <p className="font-bold text-cafe-primary">{tx.description}</p>
                    <p className="text-[11px] text-cafe-muted">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-black text-sm ${
                      tx.pointsDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.pointsDelta >= 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} Coins
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerRewardsPage;

