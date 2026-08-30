import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Globe, 
  Laptop, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Cloud,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { getPublicTestbedUrl, getLocalTestbedUrl, getRenderCloudUrl, isLocalhost } from '../utils/urlHelper';

interface ShareTestbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  appName?: string;
}

export const ShareTestbedModal: React.FC<ShareTestbedModalProps> = ({
  isOpen,
  onClose,
  domain,
  appName = 'Application'
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'public' | 'qr' | 'render' | 'localhost'>('public');

  if (!isOpen) return null;

  const publicUrl = getPublicTestbedUrl(domain);
  const localUrl = getLocalTestbedUrl(domain);
  const renderUrl = getRenderCloudUrl(domain);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Generate QR Code SVG via standard QR API / SVG
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}&bgcolor=0f172a&color=38bdf8`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Share & Test from Any Computer
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Multi-Device Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Test <strong>{appName}</strong> on any laptop, colleague's computer, or mobile phone
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('public')}
            className={`pb-2.5 px-2 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'public'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Public Cloud Link (Recommended)
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-2 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'qr'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Scan Phone QR
          </button>
          <button
            onClick={() => setActiveTab('render')}
            className={`pb-2.5 px-2 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'render'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Render Cloud
          </button>
          <button
            onClick={() => setActiveTab('localhost')}
            className={`pb-2.5 px-2 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'localhost'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Localhost Info
          </button>
        </div>

        {/* Tab 1: Public Cloud Link (Primary) */}
        {activeTab === 'public' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Public Share URL (Accessible Globally)
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/80 font-mono">
                  HTTPS Verified
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80">
                Send this link to test from other laptops, office computers, or external networks without VPN or local port forwarding:
              </p>
              
              <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 break-all select-all">
                <span className="truncate">{publicUrl}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(publicUrl, 'public')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20"
              >
                {copiedKey === 'public' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'public' ? 'Copied Public URL!' : 'Copy Shareable Link for Other Computers'}</span>
              </button>
              
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Tab</span>
              </a>
            </div>

            {/* Why localhost failed note */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Why doesn't localhost work on other computers?</strong>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  <code className="text-amber-300 font-mono">http://localhost:3000</code> is an internal loopback address pointing strictly to the current machine. When opened on another device, it searches for a server running on <em>that specific device</em>. The <strong>Public Cloud URL</strong> above runs on Google Cloud Run and can be opened anywhere.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Mobile QR Code */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-300">
              Point your smartphone or tablet camera at the QR code below to open and test the application instantly:
            </p>

            <div className="inline-block p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl">
              <img 
                src={qrCodeUrl} 
                alt="Testbed QR Code" 
                className="w-44 h-44 rounded-lg mx-auto"
                loading="lazy"
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-mono">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Scans to: {publicUrl.slice(0, 50)}...</span>
            </div>

            <button
              onClick={() => handleCopy(publicUrl, 'qr')}
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700"
            >
              {copiedKey === 'qr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'qr' ? 'Copied Public URL!' : 'Copy Link Instead'}</span>
            </button>
          </div>
        )}

        {/* Tab 3: Render Cloud Service */}
        {activeTab === 'render' && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-indigo-400" />
                  Render.com Web Service Endpoint
                </span>
                <span className="text-[10px] text-indigo-400 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700 font-mono">
                  Render Live
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80">
                Connected to Render PostgreSQL cluster (<code className="font-mono text-indigo-300">floe_f3rk</code>) & Render API:
              </p>
              
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-indigo-300 break-all select-all">
                <span>{renderUrl}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(renderUrl, 'render')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
              >
                {copiedKey === 'render' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'render' ? 'Copied Render URL!' : 'Copy Render URL'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Localhost Warning & Details */}
        {activeTab === 'localhost' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-950/30 rounded-xl border border-amber-800/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Localhost (This Machine Only)</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                This URL only connects within the local developer environment:
              </p>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-mono text-amber-300 break-all select-all">
                <span>{localUrl}</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>
                <strong>Network Explanation:</strong>
              </p>
              <ul className="list-disc list-inside text-[11px] space-y-1 text-slate-300">
                <li><code className="text-amber-300 font-mono">localhost</code> = loopback interface on this computer (IP 127.0.0.1).</li>
                <li>Other computers cannot reach your <code className="text-amber-300 font-mono">localhost:3000</code>.</li>
                <li>To test from other computers, always copy the <button onClick={() => setActiveTab('public')} className="text-emerald-400 underline font-semibold">Public Cloud Link</button>.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Domain: <strong className="text-slate-200">{domain}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
