import React, { useState, useRef } from 'react';
import { 
  X, Sparkles, Upload, Image as ImageIcon, Check, RefreshCw, 
  Building2, Palmtree, Receipt, Laptop, Headset, Shield, Smile, Globe
} from 'lucide-react';
import { AppLogoBadge } from './AppLogoBadge';

interface BrandingEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  appLogo?: string;
  domain?: string;
  onSave: (name: string, logo: string) => void;
}

const PRESET_LOGOS = [
  { icon: '🌴', label: 'Time-Off / Leave', domainHint: 'leave' },
  { icon: '🏖️', label: 'Vacation & PTO', domainHint: 'leave' },
  { icon: '💳', label: 'Expense & Cards', domainHint: 'expense' },
  { icon: '🧾', label: 'Receipts & Claims', domainHint: 'expense' },
  { icon: '🎧', label: 'IT Helpdesk', domainHint: 'service' },
  { icon: '🎫', label: 'Support Tickets', domainHint: 'service' },
  { icon: '💻', label: 'Laptops & Devices', domainHint: 'equipment' },
  { icon: '📦', label: 'Inventory & Assets', domainHint: 'equipment' },
  { icon: '🏢', label: 'Enterprise HQ', domainHint: 'core' },
  { icon: '🚀', label: 'Operations Launch', domainHint: 'core' },
  { icon: '🛡️', label: 'Security & Audit', domainHint: 'compliance' },
  { icon: '📋', label: 'HR Compliance', domainHint: 'hr' },
  { icon: '⚡', label: 'Fast Workflow', domainHint: 'speed' },
  { icon: '🎯', label: 'OKRs & Objectives', domainHint: 'goals' },
  { icon: '📊', label: 'Finance & Analytics', domainHint: 'finance' },
  { icon: '🌿', label: 'Eco & Sustainability', domainHint: 'green' }
];

export const BrandingEditorModal: React.FC<BrandingEditorModalProps> = ({
  isOpen,
  onClose,
  appName: initialName,
  appLogo: initialLogo,
  domain,
  onSave
}) => {
  const [name, setName] = useState(initialName);
  const [logo, setLogo] = useState(initialLogo || '🌴');
  const [activeLogoTab, setActiveLogoTab] = useState<'presets' | 'upload' | 'url' | 'custom_text'>('presets');
  const [urlInput, setUrlInput] = useState('');
  const [customTextInput, setCustomTextInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File size must be under 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setLogo(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleApplyCustomText = () => {
    if (customTextInput.trim()) {
      setLogo(customTextInput.trim().slice(0, 4));
      setCustomTextInput('');
    }
  };

  const handleSave = () => {
    onSave(name.trim() || initialName, logo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Application Identity & Branding</h3>
              <p className="text-xs text-slate-400">Configure your application's name and logo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Live Preview Box */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-4">
            <AppLogoBadge logo={logo} name={name} domain={domain} size="lg" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Live Preview</span>
              <h4 className="text-base font-bold text-white truncate">{name || 'My Application'}</h4>
              <p className="text-xs text-slate-400">Ready for automated workflow compilation & deployment</p>
            </div>
          </div>

          {/* Application Name Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Application Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Global Leave & PTO Portal"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Logo Selection Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Choose or Upload Logo
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveLogoTab('presets')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    activeLogoTab === 'presets' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLogoTab('upload')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    activeLogoTab === 'upload' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLogoTab('url')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    activeLogoTab === 'url' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLogoTab('custom_text')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    activeLogoTab === 'custom_text' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Emoji / Text
                </button>
              </div>
            </div>

            {/* Tab 1: Preset Icons & Emojis */}
            {activeLogoTab === 'presets' && (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {PRESET_LOGOS.map((item, idx) => {
                  const isSelected = logo === item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLogo(item.icon)}
                      title={item.label}
                      className={`h-11 rounded-lg flex items-center justify-center text-xl transition-all border ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-white scale-105 shadow-xs'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      {item.icon}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Custom File Upload */}
            {activeLogoTab === 'upload' && (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-slate-950 flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Click to upload company logo</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">PNG, SVG, JPG, or WebP up to 2MB</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {uploadError && (
                  <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
                )}
              </div>
            )}

            {/* Tab 3: Image URL */}
            {activeLogoTab === 'url' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/logo.png or svg"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    disabled={!urlInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Apply URL
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Enter a direct link to any hosted SVG, PNG, or HTTPS image logo.</p>
              </div>
            )}

            {/* Tab 4: Custom Emoji or Monogram */}
            {activeLogoTab === 'custom_text' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTextInput}
                    onChange={(e) => setCustomTextInput(e.target.value)}
                    placeholder="e.g. 🏢, 🏖️, or 2-letter monogram like FL"
                    maxLength={4}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomText}
                    disabled={!customTextInput.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Set Icon
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Type any emoji character or short 2-4 letter company abbreviation.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Branding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
