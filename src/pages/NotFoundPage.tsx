import React from 'react';
import { NavLink } from 'react-router-dom';
import { Coffee, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cafe-light dark:bg-cafe-dark flex flex-col items-center justify-center p-6 text-center space-y-4 antialiased">
      <div className="w-20 h-20 rounded-3xl bg-cafe-sand/60 dark:bg-stone-800 flex items-center justify-center text-cafe-accent mx-auto shadow-warm">
        <Coffee className="w-10 h-10" />
      </div>
      <span className="text-4xl font-black text-cafe-primary dark:text-cafe-cream">404</span>
      <h1 className="text-xl font-bold text-cafe-primary dark:text-cafe-cream">
        This Table or Page Doesn't Exist
      </h1>
      <p className="text-xs text-cafe-muted max-w-sm">
        The route you are trying to visit might have been moved or doesn't belong to this restaurant workspace.
      </p>
      <div className="pt-2 flex items-center gap-3">
        <NavLink
          to="/dashboard"
          className="px-5 py-2.5 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </NavLink>
        <NavLink
          to="/"
          className="px-5 py-2.5 rounded-2xl border border-cafe-border dark:border-stone-700 text-xs font-bold text-cafe-primary dark:text-stone-300 hover:bg-cafe-sand/40 transition-colors"
        >
          Home Showcase
        </NavLink>
      </div>
    </div>
  );
};

