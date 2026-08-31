import React, { useState } from 'react';
import { 
  Building2, Palmtree, Receipt, Laptop, Headset, 
  Sparkles, Layers, Shield, Zap, Briefcase 
} from 'lucide-react';

interface AppLogoBadgeProps {
  logo?: string;
  name?: string;
  domain?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AppLogoBadge: React.FC<AppLogoBadgeProps> = ({
  logo,
  name = 'App',
  domain,
  size = 'md',
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  // Size mappings
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs rounded-md',
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-10 h-10 text-base rounded-xl',
    lg: 'w-12 h-12 text-xl rounded-xl',
    xl: 'w-16 h-16 text-2xl rounded-2xl'
  };

  const isImage = Boolean(
    logo &&
    !imgError &&
    (logo.startsWith('data:image/') ||
     logo.startsWith('http://') ||
     logo.startsWith('https://') ||
     logo.startsWith('/') ||
     logo.includes('.svg') ||
     logo.includes('.png') ||
     logo.includes('.jpg') ||
     logo.includes('.webp'))
  );

  // Helper for domain default icon fallback
  const renderFallbackIcon = () => {
    const d = (domain || '').toLowerCase();
    const n = (name || '').toLowerCase();

    if (d.includes('leave') || n.includes('leave') || n.includes('time-off') || n.includes('vacation')) {
      return <Palmtree className="w-1/2 h-1/2" />;
    }
    if (d.includes('expense') || n.includes('expense') || n.includes('receipt') || n.includes('claim')) {
      return <Receipt className="w-1/2 h-1/2" />;
    }
    if (d.includes('equipment') || n.includes('hardware') || n.includes('asset') || n.includes('laptop')) {
      return <Laptop className="w-1/2 h-1/2" />;
    }
    if (d.includes('service') || d.includes('ticket') || n.includes('ticket') || n.includes('helpdesk') || n.includes('itsm')) {
      return <Headset className="w-1/2 h-1/2" />;
    }
    if (n.includes('security') || n.includes('compliance') || n.includes('audit')) {
      return <Shield className="w-1/2 h-1/2" />;
    }
    return <Building2 className="w-1/2 h-1/2" />;
  };

  if (isImage) {
    return (
      <div 
        className={`relative overflow-hidden bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-xs ${sizeClasses[size]} ${className}`}
      >
        <img
          src={logo}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  // If logo is emoji or short text
  if (logo && logo.trim().length > 0) {
    return (
      <div
        className={`bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 flex items-center justify-center shrink-0 select-none shadow-xs font-bold leading-none ${sizeClasses[size]} ${className}`}
      >
        <span className="transform transition-transform hover:scale-110">{logo}</span>
      </div>
    );
  }

  // Default fallback icon
  return (
    <div
      className={`bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-xs ${sizeClasses[size]} ${className}`}
    >
      {renderFallbackIcon()}
    </div>
  );
};
