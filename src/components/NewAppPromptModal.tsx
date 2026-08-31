import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, ArrowRight, Palmtree, Receipt, Laptop, Headset, 
  Building2, Upload, Check, Palette
} from 'lucide-react';
import { DOMAINS } from '../data/domains';
import { AppLogoBadge } from './AppLogoBadge';

interface NewAppPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDomainId?: string;
  onSubmit: (appName: string, appLogo: string, domainId: string) => void;
}

const QUICK_ICONS = ['🌴', '🏖️', '💳', '🧾', '🎧', '💻', '🏢', '🚀', '🛡️', '📋', '⚡', '🎯', '📊', '🌿'];

export const NewAppPromptModal: React.FC<NewAppPromptModalProps> = ({
  isOpen,
  onClose,
  initialDomainId = 'dom-leave',
  onSubmit
}) => {
  const [selectedDomainId, setSelectedDomainId] = useState(initialDomainId);
  const [appName, setAppName] = useState('');
  const [appLogo, setAppLogo] = useState('🌴');
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [urlInput, setUrlInput] = useState('');

  // Find active domain
  const activeDomain = DOMAINS.find(d => d.id === selectedDomainId) || DOMAINS[0];

  useEffect(() => {
    if (isOpen) {
      const d = DOMAINS.find(item => item.id === initialDomainId) || DOMAINS[0];
      setSelectedDomainId(d.id);
      
      const defaultIcon = d.id.includes('leave') ? '🌴' : 
                          d.id.includes('expense') ? '💳' : 
                          d.id.includes('equipment') ? '💻' : 
                          d.id.includes('itsm') || d.id.includes('service') ? '🎧' : '🏢';
      
      setAppLogo(defaultIcon);
      setAppName(d.default_ir.name);
    }
  }, [isOpen, initialDomainId]);

  if (!isOpen) return null;

  const handleDomainChange = (domainId: string) => {
    setSelectedDomainId(domainId);
    const d = DOMAINS.find(item => item.id === domainId);
    if (d) {
      setAppName(d.default_ir.name);
      const icon = d.id.includes('leave') ? '🌴' : 
                   d.id.includes('expense') ? '💳' : 
                   d.id.includes('equipment') ? '💻' : 
                   d.id.includes('itsm') || d.id.includes('service') ? '🎧' : '🏢';
      setAppLogo(icon);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAppLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = appName.trim() || activeDomain.default_ir.name;
    onSubmit(finalName, appLogo, selectedDomainId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Application</h3>
              <p className="text-xs text-slate-400">Choose your application name, logo, and workflow template</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          {/* Live Preview Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 flex items-center gap-4 shadow-inner">
            <AppLogoBadge logo={appLogo} name={appName || activeDomain.default_ir.name} domain={activeDomain.key} size="lg" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Application Preview</span>
              <h4 className="text-base font-bold text-white truncate">{appName || activeDomain.default_ir.name}</h4>
              <p className="text-xs text-slate-400 truncate">{activeDomain.display_name} • PostgreSQL 15 Backend</p>
            </div>
          </div>

          {/* 1. App Name Input Prompt */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
              Application Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. Acme Global Leave & PTO Portal"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium shadow-xs"
            />
            <p className="text-[11px] text-slate-400">
              Give your workplace application a descriptive name for your team or organization.
            </p>
          </div>

          {/* 2. App Logo / Icon Prompt */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                Application Logo / Icon
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    activeTab === 'presets' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quick Icons
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    activeTab === 'upload' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    activeTab === 'url' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {/* Quick Icon Selector */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-7 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {QUICK_ICONS.map((icon, idx) => {
                  const isSelected = appLogo === icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAppLogo(icon)}
                      className={`h-10 rounded-lg flex items-center justify-center text-lg transition-all border ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-white scale-105 shadow-xs'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/60 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5">
                <Upload className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-white">Click to upload company logo</span>
                <span className="text-[11px] text-slate-400">PNG, SVG, JPG up to 2MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {/* URL Tab */}
            {activeTab === 'url' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (urlInput.trim()) {
                      setAppLogo(urlInput.trim());
                      setUrlInput('');
                    }
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* 3. Choose Template Domain */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
              Workflow Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DOMAINS.map((dom) => {
                const isSelected = dom.id === selectedDomainId;
                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => handleDomainChange(dom.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {dom.key === 'leave-management' ? '🌴' : 
                       dom.key === 'expense-management' ? '💳' : 
                       dom.key === 'it-equipment' ? '💻' : '🎧'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{dom.display_name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{dom.default_ir.entities.length} tables • {dom.default_ir.workflows[0]?.nodes.length || 4} states</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <span>Continue to Requirements Agent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
