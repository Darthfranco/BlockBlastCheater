
import React from 'react';

interface BlockProps {
  color: string | null;
  size?: number;
  isPreview?: boolean;
  isValid?: boolean;
  isClearing?: boolean;
}

export const Block: React.FC<BlockProps> = ({ 
  color, 
  size = 40, 
  isPreview = false, 
  isValid = true,
  isClearing = false 
}) => {
  if (!color && !isPreview) {
    return (
      <div 
        className="bg-slate-900/40 border border-slate-800/60 rounded-[4px]"
        style={{ width: size, height: size }}
      />
    );
  }

  const baseStyle = {
    width: size,
    height: size,
    background: isPreview 
      ? (isValid ? color || '#22c55e' : '#ef4444') 
      : `linear-gradient(135deg, ${color}, ${adjustColor(color || '#334155', -20)})`,
    opacity: isPreview ? 0.5 : 1,
  };

  const statusClass = isClearing ? 'clearing-block' : '';
  const previewClass = isPreview ? 'scale-90 border-2 ' + (isValid ? 'border-green-400' : 'border-red-500') : 'block-3d';

  return (
    <div 
      className={`rounded-[6px] transition-all duration-150 flex items-center justify-center relative ${statusClass} ${previewClass}`}
      style={baseStyle}
    >
      {/* Gloss Effect */}
      <div className="absolute inset-0.5 border-t border-white/20 rounded-[4px] pointer-events-none" />
      <div className="absolute bottom-0.5 right-0.5 border-b border-black/20 rounded-[4px] pointer-events-none" />
    </div>
  );
};

// Helper to darken colors for gradients
function adjustColor(hex: string, amt: number) {
  let usePound = false;
  if (hex[0] === "#") {
    hex = hex.slice(1);
    usePound = true;
  }
  let num = parseInt(hex, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255; else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255; else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255; else if (g < 0) g = 0;
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}
