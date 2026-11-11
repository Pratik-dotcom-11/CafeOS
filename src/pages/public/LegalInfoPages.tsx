import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, FileText, Building2, ArrowLeft, Lock, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';
import { CafeLogo } from '../../components/common/CafeLogo';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cafe-light text-cafe-primary antialiased selection:bg-cafe-accent selection:text-white flex flex-col justify-between">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cafe-border/80 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5">
            <CafeLogo size={36} />
            <span className="font-black text-xl tracking-tight">
              Café<span className="text-cafe-accent">OS</span>
            </span>
          </NavLink>
          <NavLink
            to="/"
            className="text-xs font-bold text-cafe-muted hover:text-cafe-primary flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </NavLink>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 space-y-8">
        <div className="space-y-3 border-b border-cafe-border pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DPDP Act 2023 Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-cafe-primary">
            CaféOS Privacy Policy
          </h1>
          <p className="text-xs text-cafe-muted">
            Last updated: November 10, 2026 • Effective Date: January 1, 2026
          </p>
        </div>

        <section className="space-y-4 text-xs sm:text-sm text-cafe-muted leading-relaxed">
          <h2 className="text-base font-extrabold text-cafe-primary">1. Information We Collect</h2>
          <p>
            CaféOS Hospitality Cloud ("we", "us", "our") collects personal information necessary to deliver seamless dining and restaurant management services:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Diner Account Data:</strong> Name, verified email address, phone number, and delivery addresses provided during registration or Google OAuth sign-in.</li>
            <li><strong>Transactional Data:</strong> Ordered dishes, customizations, total bill amounts, payment status, and order status timelines.</li>
            <li><strong>Restaurant Partner Data:</strong> Business name, FSSAI license numbers, GSTIN registration, menu structures, employee profiles, and branch locations.</li>
            <li><strong>Technical Data:</strong> Browser type, operating system, IP address, and encrypted session tokens for secure authentication.</li>
          </ul>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-cafe-muted leading-relaxed">
          <h2 className="text-base font-extrabold text-cafe-primary">2. How We Use Your Data</h2>
          <p>
            We strictly use collected information to execute customer orders, sync live tickets with kitchen displays, credit loyalty coins, and enable restaurant partners to fulfill dining requests:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Dispatching live real-time notifications when kitchen staff accept or complete your order.</li>
            <li>Processing secure UPI, debit/credit card, and net banking transactions through RBI-licensed payment gateways.</li>
            <li>Facilitating verified customer reviews and post-order feedback.</li>
            <li>Preventing fraudulent orders and enforcing role-based restaurant data boundaries.</li>
          </ul>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-cafe-muted leading-relaxed">
          <h2 className="text-base font-extrabold text-cafe-primary">3. Data Security & Row-Level Isolation</h2>
          <p>
            All application data is encrypted in transit using TLS 1.3 and at rest with AES-256 encryption. We utilize PostgreSQL Row-Level Security (RLS) ensuring that restaurant partners can never access other establishments' confidential sales data or customers' private personal information without authorization.
          </p>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-cafe-muted leading-relaxed">
          <h2 className="text-base font-extrabold text-cafe-primary">4. Contact Our Data Protection Officer</h2>
          <p>
            For privacy inquiries, data deletion requests, or consent revocation under the Digital Personal Data Protection Act, please contact:
          </p>
          <div className="p-4 rounded-2xl bg-white border border-cafe-border space-y-1 text-xs">
            <p className="font-bold text-cafe-primary">CaféOS Privacy Grievance Officer</p>
            <p>Email: <a href="mailto:privacy@cafeos.app" className="text-cafe-accent underline">privacy@cafeos.app</a></p>
            <p>Address: Park Street Commercial District, Kolkata, West Bengal 700016, India</p>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-cafe-border bg-white text-center text-xs text-cafe-muted">
        <p>© 2026 CaféOS Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cafe-light text-cafe-primary antialiased selection:bg-cafe-accent selection:text-white flex flex-col justify-between">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cafe-border/80 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5">
            <CafeLogo size={36} />
            <span className="font-black text-xl tracking-tight">
              Café<span className="text-cafe-accent">OS</span>
            </span>
          </NavLink>
          <NavLink
            to="/"
            className="text-xs font-bold text-cafe-muted hover:text-cafe-primary flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </NavLink>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 space-y-8">
        <div className="space-y-3 border-b border-cafe-border pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Platform Service Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-cafe-primary">
            CaféOS Terms of Service
          </h1>
          <p className="text-xs text-cafe-muted">
            Last updated: November 10, 2026 • Applicable to Diners and Restaurant Partners
          </p>
        </div>

        <section className="space-y-4 text-xs sm:text-sm text-cafe-muted leading-relaxed">
          <h2 className="text-base font-extrabold text-cafe-primary">1. Agreement to Terms</h2>
          <p>
            By accessing or using the CaféOS platform (including our Customer Portal, Restaurant Backoffice, POS Cashier Terminal, Table QR Menus, and Kitchen Display System), you agree to be bound by these Terms of Service.
          </p>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-cafe-muted leading-relaxed">
          <h2 className="text-base font-extrabold text-cafe-primary">2. Customer Orders, Payments & Loyalty Coins</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Order Placement:</strong> When a customer submits an order, it is transmitted directly to the selected restaurant's live order queue.</li>
            <li><strong>Cancellation Policy:</strong> Orders can only be cancelled before kitchen acceptance. Once preparation has commenced, cancellations are at the sole discretion of the restaurant manager.</li>
            <li><strong>Loyalty Coins:</strong> Diners earn 5% cashback in CaféOS Coins upon successful completion of eligible orders. Coins can be redeemed across participating partner restaurants and cannot be converted to physical cash.</li>
          </ul>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-cafe-muted leading-relaxed">
          <h2 className="text-base font-extrabold text-cafe-primary">3. Restaurant Partner Obligations</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Restaurants are solely responsible for food preparation quality, accurate pricing, dietary allergen indicators, and compliance with local FSSAI regulations.</li>
            <li>Restaurant owners must safeguard staff login credentials and grant access roles according to least privilege.</li>
            <li>Unauthorized attempts to extract confidential peer data or bypass multi-tenant barriers will result in immediate termination of the restaurant workspace.</li>
          </ul>
        </section>

        <section className="space-y-4 text-xs sm:text-sm text-cafe-muted leading-relaxed">
          <h2 className="text-base font-extrabold text-cafe-primary">4. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts in Kolkata, West Bengal.
          </p>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-cafe-border bg-white text-center text-xs text-cafe-muted">
        <p>© 2026 CaféOS Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cafe-light text-cafe-primary antialiased selection:bg-cafe-accent selection:text-white flex flex-col justify-between">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cafe-border/80 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5">
            <CafeLogo size={36} />
            <span className="font-black text-xl tracking-tight">
              Café<span className="text-cafe-accent">OS</span>
            </span>
          </NavLink>
          <div className="flex items-center gap-4">
            <NavLink
              to="/customer"
              className="text-xs font-bold text-cafe-accent hover:underline hidden sm:block"
            >
              Customer Portal
            </NavLink>
            <NavLink
              to="/"
              className="text-xs font-bold text-cafe-muted hover:text-cafe-primary flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </NavLink>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-cafe-accent">
            Built for Modern Hospitality
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-cafe-primary">
            About CaféOS India
          </h1>
          <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
            Unifying dining discovery, high-speed touch POS, contactless table ordering, live kitchen chimes, and recipe costing into a single cloud operating system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-6 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-2">
            <p className="text-2xl sm:text-3xl font-black text-cafe-primary">2,400+</p>
            <p className="text-xs font-bold text-cafe-muted uppercase tracking-wider">Restaurants Powered</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-2">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">99.98%</p>
            <p className="text-xs font-bold text-cafe-muted uppercase tracking-wider">Kitchen Uptime</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-2">
            <p className="text-2xl sm:text-3xl font-black text-cafe-accent">₹140 Cr+</p>
            <p className="text-xs font-bold text-cafe-muted uppercase tracking-wider">Annual GMV Processed</p>
          </div>
        </div>

        <section className="p-8 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-4">
          <h2 className="text-lg font-black text-cafe-primary">Our Mission</h2>
          <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
            Independent restaurateurs and fine dining cafes deserve technology as sophisticated as global fast-food conglomerates—without exorbitant commission cuts. CaféOS provides enterprise-grade table QR ordering, live kitchen display boards, and automated raw ingredient recipe deductions right out of the box, with zero hardware lock-in.
          </p>
        </section>

        <section className="p-8 rounded-3xl bg-white border border-cafe-border shadow-warm space-y-4">
          <h2 className="text-lg font-black text-cafe-primary">Engineering & Architecture</h2>
          <p className="text-xs sm:text-sm text-cafe-muted leading-relaxed">
            Built using modern web technologies: React, TypeScript, Tailwind CSS, Supabase PostgreSQL with real-time replication, and Razorpay UPI checkout. Our multi-tenant architecture ensures strict isolation between partner workspaces while allowing diners to seamlessly explore restaurants nationwide.
          </p>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-cafe-border bg-white text-center text-xs text-cafe-muted">
        <p>© 2026 CaféOS Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

