import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode as QrIcon,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
  Check,
  Smartphone,
  Layers
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { CafeLogo } from '../../components/common/CafeLogo';

export const QrCodePage: React.FC = () => {
  const { restaurant, tables, addToast } = useCafe();

  const [selectedTable, setSelectedTable] = useState<string>('Table 04');
  const [includeTableParam, setIncludeTableParam] = useState<boolean>(true);
  const [qrColor, setQrColor] = useState<string>('#302019');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Construct target URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cafeos.app';
  const targetUrl = includeTableParam && selectedTable !== 'general'
    ? `${baseUrl}/menu/${restaurant.slug}?table=${encodeURIComponent(selectedTable)}`
    : `${baseUrl}/menu/${restaurant.slug}`;

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: qrColor,
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [targetUrl, qrColor]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    addToast('Link Copied', 'Direct QR Menu link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `CafeOS-QR-${restaurant.slug}-${selectedTable.replace(/\s+/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
    addToast('Downloaded', 'QR code image downloaded successfully', 'success');
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-cafe-primary dark:text-cafe-cream tracking-tight">
          Contactless QR Menu Generator
        </h1>
        <p className="text-xs text-cafe-muted mt-1">
          Generate, customize, and print high-resolution QR codes for dine-in tables, takeout counters, and marketing tents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Config Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-cafe-surface-dark p-6 rounded-3xl border border-cafe-border dark:border-cafe-border-dark shadow-warm space-y-5">
          <h2 className="text-base font-extrabold text-cafe-primary dark:text-cafe-cream">
            QR Configuration
          </h2>

          {/* Table Selector */}
          <div>
            <label className="text-xs font-bold text-cafe-muted block mb-1">
              Select Destination Target
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSelectedTable('general');
                  setIncludeTableParam(false);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                  selectedTable === 'general'
                    ? 'border-cafe-accent bg-cafe-cream text-cafe-primary dark:bg-stone-800 dark:text-white ring-1 ring-cafe-accent'
                    : 'border-cafe-border dark:border-stone-800 text-cafe-muted hover:bg-cafe-sand/40'
                }`}
              >
                Storefront / General
              </button>
              {tables.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTable(t.tableNumber);
                    setIncludeTableParam(true);
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                    selectedTable === t.tableNumber
                      ? 'border-cafe-accent bg-cafe-cream text-cafe-primary dark:bg-stone-800 dark:text-white ring-1 ring-cafe-accent'
                      : 'border-cafe-border dark:border-stone-800 text-cafe-muted hover:bg-cafe-sand/40'
                  }`}
                >
                  {t.tableNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <label className="text-xs font-bold text-cafe-muted block mb-2">
              Branded QR Color
            </label>
            <div className="flex items-center gap-3">
              {[
                { name: 'Coffee Brown', hex: '#302019' },
                { name: 'Accent Amber', hex: '#D97736' },
                { name: 'Secondary Bronze', hex: '#75452F' },
                { name: 'Dark Slate', hex: '#11100F' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setQrColor(c.hex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                    qrColor === c.hex
                      ? 'border-cafe-accent ring-2 ring-cafe-accent/30 font-bold'
                      : 'border-cafe-border text-cafe-muted'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generated URL & Copy */}
          <div className="p-4 rounded-2xl bg-cafe-light dark:bg-stone-800/60 border border-cafe-border/80 dark:border-stone-700 space-y-2">
            <span className="text-[11px] font-bold text-cafe-muted uppercase tracking-wider block">
              Direct Destination URL
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-700 rounded-xl text-cafe-primary dark:text-stone-200 select-all font-mono"
              />
              <button
                onClick={handleCopyUrl}
                className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-cafe-border dark:border-stone-700 hover:bg-cafe-sand/50 text-cafe-primary dark:text-stone-200 transition-colors shrink-0"
                title="Copy URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-cafe-accent text-white hover:bg-cafe-accent-hover transition-colors shrink-0"
                title="Test in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Download & Print Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 rounded-2xl bg-cafe-accent hover:bg-cafe-accent-hover text-white text-xs font-bold shadow-warm flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download High-Res PNG</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 rounded-2xl border border-cafe-border dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-cafe-sand/40 text-cafe-primary dark:text-stone-200 text-xs font-bold shadow-warm-sm flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Table Card</span>
            </button>
          </div>
        </div>

        {/* Right Preview Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="bg-white dark:bg-cafe-surface-dark rounded-3xl p-8 border border-cafe-border dark:border-cafe-border-dark shadow-warm-lg max-w-sm w-full text-center relative overflow-hidden">
            <CafeLogo size={48} className="mx-auto mb-3" />

            <h3 className="font-black text-lg text-cafe-primary dark:text-cafe-cream">
              {restaurant.name}
            </h3>
            <p className="text-xs text-cafe-muted mt-0.5">Scan to View Digital Menu & Order</p>

            {/* QR Render Canvas/Image */}
            <div className="my-6 p-4 bg-white rounded-2xl shadow-warm inline-block border border-cafe-border/80">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="CafeOS Table QR"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-cafe-muted">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="bg-cafe-sand/50 dark:bg-stone-800/60 py-2.5 px-4 rounded-xl border border-cafe-border/70 text-xs font-extrabold text-cafe-primary dark:text-stone-200">
              {selectedTable === 'general' ? 'Contactless Menu' : `Table No: ${selectedTable}`}
            </div>

            <p className="text-[10px] text-cafe-muted mt-3">
              Point phone camera • No app download required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

