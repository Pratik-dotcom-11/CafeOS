import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ChefHat,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  ArrowLeft,
  Flame,
  Coffee,
  Filter,
  Wifi,
  WifiOff,
  RotateCcw,
  History,
  CheckCircle2,
  X
} from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import { ToastContainer } from '../components/shared/ToastContainer';

export const KitchenLayout: React.FC = () => {
  const { orders, soundEnabled, toggleSound, reloadOrders } = useCafe();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeStation, setActiveStation] = useState<string>('all');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Digital clock
  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor network connectivity & window focus to resync missed events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleManualSync();
    };
    const handleOffline = () => setIsOnline(false);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleManualSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await reloadOrders();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const activeTickets = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#11100F] text-[#F3EFEA] flex flex-col font-sans select-none antialiased">
      <ToastContainer />

      {/* Operational KDS Top Bar */}
      <header className="h-16 bg-[#1A1816] border-b border-[#2C2825] px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30">
        {/* Left: Navigation & Active Counts */}
        <div className="flex items-center gap-3">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#272320] hover:bg-[#342F2B] text-stone-300 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black uppercase tracking-wider text-white">
                  Kitchen Display (KDS)
                </h1>
                {/* Connection Status Pill */}
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/70 text-rose-400 border border-rose-800 animate-pulse">
                    <WifiOff className="w-3 h-3" />
                    <span>Offline</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 font-mono">
                {activeTickets.length} active • {pendingCount} new • {preparingCount} cooking • {readyCount} ready
              </p>
            </div>
          </div>
        </div>

        {/* Center: Culinary Station Filters */}
        <div className="hidden lg:flex items-center gap-1 bg-[#25211E] p-1 rounded-xl border border-[#36302B]">
          {[
            { id: 'all', label: 'All Stations', icon: Filter },
            { id: 'biryani_curry', label: 'Dum & Curries', icon: Flame },
            { id: 'tandoor', label: 'Tandoor & Starters', icon: Flame },
            { id: 'beverages', label: 'Chai & Cold Bar', icon: Coffee },
          ].map((st) => {
            const Icon = st.icon;
            const active = activeStation === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStation(st.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-400'
                    : 'text-stone-400 hover:text-white hover:bg-[#322C27]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tactical Controls */}
        <div className="flex items-center gap-2">
          {/* Real-time Resync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Refresh authoritative orders from cloud database"
            className={`p-2 rounded-xl border border-[#36302B] bg-[#25211E] text-stone-300 hover:text-white hover:bg-[#322C27] transition-all ${
              isSyncing ? 'animate-spin text-orange-400' : ''
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Completed Orders / Recall Drawer Trigger */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25211E] border border-[#36302B] hover:bg-[#322C27] text-stone-300 text-xs font-bold transition-colors"
            title="View served / completed tickets"
          >
            <History className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Recall ({completedCount})</span>
          </button>

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25211E] border border-[#36302B] font-mono text-xs font-black text-orange-400">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{currentTime}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Kitchen Audio Bell Active' : 'Kitchen Audio Muted'}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-amber-950/60 text-amber-400 border-amber-800 ring-1 ring-amber-600/40'
                : 'bg-stone-900 text-stone-500 border-stone-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#25211E] border border-[#36302B] text-stone-300 hover:text-white hover:bg-[#322C27] transition-colors"
            title="Toggle Kitchen Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main KDS Board Viewport */}
      <main className="flex-1 p-3 sm:p-5 overflow-y-auto">
        <Outlet
          context={{
            activeStation,
            showHistoryModal,
            setShowHistoryModal,
          }}
        />
      </main>
    </div>
  );
};
export default KitchenLayout;
