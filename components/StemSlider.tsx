import React, { useState } from 'react';
import { StemControl } from '../types';
import { Volume2, VolumeX, Activity, Download, Loader2 } from 'lucide-react';

interface Props {
  stem: StemControl;
  volume: number; // 0 to 1
  isMuted: boolean;
  disabled?: boolean;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onExport: (id: 'low' | 'mid' | 'high') => Promise<void>;
}

export const StemSlider: React.FC<Props> = ({ stem, volume, isMuted, disabled = false, onVolumeChange, onToggleMute, onExport }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = async () => {
    if (disabled) return;
    setIsExporting(true);
    await onExport(stem.id);
    setIsExporting(false);
  };

  return (
    <div className={`bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 transition-all shadow-lg flex flex-col gap-3 group relative overflow-hidden ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-slate-600'}`}>
      {/* Background Accent Gradient */}
      <div className={`absolute top-0 left-0 w-full h-1 ${stem.color} opacity-50`}></div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${stem.color} bg-opacity-20`}>
                <Activity className={`w-4 h-4 ${stem.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-100 text-sm tracking-wide">{stem.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{stem.frequencyRange}</p>
            </div>
        </div>
        <button 
            onClick={onToggleMute}
            disabled={disabled}
            className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} ${disabled ? 'cursor-not-allowed' : ''}`}
        >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className="relative h-32 flex justify-center py-2 bg-slate-900/50 rounded-lg inner-shadow border border-slate-800">
         <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none opacity-20">
             {[...Array(10)].map((_, i) => <div key={i} className="w-full h-[1px] bg-slate-500"></div>)}
         </div>
         <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          disabled={disabled}
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className={`h-full w-2 appearance-none bg-transparent vertical-range z-10 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          style={{
            writingMode: 'vertical-lr',
            WebkitAppearance: 'slider-vertical',
          }}
        />
      </div>
      
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="text-xs text-slate-500 font-mono">
           {Math.round((isMuted ? 0 : volume) * 100)}%
        </div>
        <button 
          onClick={handleExportClick}
          disabled={disabled || isExporting}
          className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-brand-accent hover:text-brand-dark rounded text-xs text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          {isExporting ? '...' : 'WAV'}
        </button>
      </div>
    </div>
  );
};