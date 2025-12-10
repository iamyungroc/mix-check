import React from 'react';
import { AudioAnalysis, MixIssue } from '../types';
import { Music2, Radio, Zap, Activity, AlertTriangle, CheckCircle, XCircle, Sliders, ListMusic, TrendingUp, TrendingDown, Minus, Waves, AlertCircle } from 'lucide-react';

interface Props {
  analysis: AudioAnalysis | null;
  isLoading: boolean;
}

export const AnalysisPanel: React.FC<Props> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-700/50 animate-pulse">
        <div className="relative">
             <div className="w-24 h-24 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center text-brand-accent">
                 <Zap size={32} className="animate-bounce" />
             </div>
        </div>
        <p className="text-brand-accent font-mono text-lg mt-8 tracking-widest uppercase">RøcAudio Mix Brain</p>
        <p className="text-slate-400 text-sm mt-2">Comparing against 10,000+ genre references...</p>
        <div className="mt-4 flex gap-2 text-xs text-slate-500 font-mono">
            <span>CHECKING PHASE</span>
            <span>•</span>
            <span>MEASURING LUFS</span>
            <span>•</span>
            <span>EQ BALANCING</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-700/50 border-dashed">
        <Music2 className="w-16 h-16 text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-300">Mix Analysis Console</h3>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-md">
            Upload your master track to receive an instant, Grammy-level breakdown of your mix balance, dynamics, and mastering readiness.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-500 border-green-500';
      if (score >= 75) return 'text-yellow-500 border-yellow-500';
      return 'text-red-500 border-red-500';
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'Cut': return <TrendingDown size={16} />;
          case 'Boost': return <TrendingUp size={16} />;
          default: return <Minus size={16} />;
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Cut': return 'text-red-400 bg-red-500/10 border-red-500/30';
          case 'Boost': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
          default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      }
  };

  const getSpectrumGradient = (status: string) => {
    switch(status) {
        case 'Cut': return 'from-red-900/40 to-transparent'; 
        case 'Boost': return 'from-yellow-900/40 to-transparent';
        default: return 'from-emerald-900/20 to-transparent';
    }
  };

  const getTargetCurvePath = (presetName: string) => {
    const p = presetName ? presetName.toLowerCase() : '';
    // SVG Coordinate system: 0,0 is Top-Left. 
    // Y=0 is Max Volume (Top). Y=100 is Min Volume (Bottom).
    
    if (p.includes('v-shape') || p.includes('trap') || p.includes('hip hop') || p.includes('electronic')) {
       // V-Shape: Boost Lows, Dip Mids, Boost Highs
       return "M0,30 C20,30 30,70 50,70 S80,30 100,30";
    }
    if (p.includes('mid') || p.includes('rock') || p.includes('guitar')) {
       // Mid-Forward: Moderate Lows, Loud Mids, Moderate Highs
       return "M0,60 C20,60 30,30 50,30 S80,60 100,60";
    }
    if (p.includes('warm') || p.includes('jazz') || p.includes('soul') || p.includes('r&b')) {
       // Warm: Loud Lows, Moderate Mids, Rolled Highs
       return "M0,30 C30,30 50,50 50,50 S80,80 100,80";
    }
    if (p.includes('pop') || p.includes('mainstream')) {
       // Fletcher-Munson / Pop: Slight Smile. Boost Lows, Dip Mids, Boost Air.
       return "M0,40 C30,40 40,60 50,60 S80,20 100,20";
    }
    // Default Flat
    return "M0,50 L100,50";
  };

  const getCurrentCurvePath = () => {
      // Calculates a rough curve based on the Cut/Boost analysis
      const getY = (status: string) => {
          if (status === 'Cut') return 20;   // It IS loud, so it sits high up
          if (status === 'Boost') return 80; // It IS quiet, so it sits low down
          return 50;
      };

      const lowY = getY(analysis.mixBalance.low.status);
      const midY = getY(analysis.mixBalance.mid.status);
      const highY = getY(analysis.mixBalance.high.status);

      // Simple Bezier through 3 points
      return `M0,${lowY} C30,${lowY} 30,${midY} 50,${midY} S70,${highY} 100,${highY}`;
  };

  // Helper: Convert frequency string (e.g. "300Hz", "4kHz") to global percentage (0-100)
  const getFrequencyPercentage = (freqStr: string): number => {
    if (!freqStr) return -1;
    const match = freqStr.match(/([\d.]+)\s*(k?Hz)/i);
    if (!match) return -1;
    
    let freq = parseFloat(match[1]);
    if (match[2].toLowerCase().includes('k')) freq *= 1000;

    let percent = 0;
    
    // Low Band: 20 - 250 Hz (31.25% width)
    if (freq < 250) {
        const min = 20; const max = 250;
        const f = Math.max(freq, min);
        // Logarithmic scale within band
        const logPos = (Math.log(f) - Math.log(min)) / (Math.log(max) - Math.log(min));
        percent = logPos * 31.25;
    }
    // Mid Band: 250 - 4000 Hz (37.5% width) starting at 31.25%
    else if (freq < 4000) {
        const min = 250; const max = 4000;
        const logPos = (Math.log(freq) - Math.log(min)) / (Math.log(max) - Math.log(min));
        percent = 31.25 + (logPos * 37.5);
    }
    // High Band: 4000 - 20000 Hz (31.25% width) starting at 68.75%
    else {
        const min = 4000; const max = 20000;
        const f = Math.min(freq, max);
        const logPos = (Math.log(f) - Math.log(min)) / (Math.log(max) - Math.log(min));
        percent = 68.75 + (logPos * 31.25);
    }
    return Math.max(2, Math.min(98, percent)); // Clamp to keep inside
  };

  // New helper for glow styles
  const getSeverityStyles = (severity: string) => {
      switch(severity) {
          case 'critical': 
              return {
                  line: 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
                  marker: 'text-red-500 border-red-500 bg-red-950 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse',
                  badge: 'bg-red-900/50 text-red-200 border-red-800'
              };
          case 'warning': 
              return {
                  line: 'border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]',
                  marker: 'text-yellow-500 border-yellow-500 bg-yellow-950 shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-pulse',
                  badge: 'bg-yellow-900/50 text-yellow-200 border-yellow-800'
              };
          default: 
              return {
                  line: 'border-blue-400/50 shadow-[0_0_8px_rgba(56,189,248,0.3)]',
                  marker: 'text-blue-400 border-blue-400 bg-blue-950 shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-pulse',
                  badge: 'bg-blue-900/50 text-blue-200 border-blue-800'
              };
      }
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-accent" />
            <h2 className="text-lg font-bold text-white">Pre-Mastering Report</h2>
        </div>
        <div className="flex gap-2 text-xs font-mono">
            <span className="bg-slate-800 border border-slate-600 px-2 py-1 rounded text-slate-300">{analysis.genre}</span>
            <span className="bg-slate-800 border border-slate-600 px-2 py-1 rounded text-slate-300">{analysis.bpm} BPM</span>
            <span className="bg-slate-800 border border-slate-600 px-2 py-1 rounded text-slate-300 text-brand-purple">{analysis.key}</span>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-8">
        
        {/* Score & Summary Section */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Score Circle */}
            <div className={`relative w-32 h-32 flex-shrink-0 rounded-full border-8 flex items-center justify-center ${getScoreColor(analysis.masteringScore)}`}>
                <div className="text-center">
                    <span className="text-3xl font-bold block">{analysis.masteringScore}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Score</span>
                </div>
            </div>
            
            <div className="flex-grow space-y-2">
                <h3 className="text-white font-semibold text-lg">Engineer's Summary</h3>
                <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-brand-accent/50 pl-3">
                    {analysis.summary}
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                     <span className="text-xs text-slate-500 uppercase tracking-widest">References:</span>
                     {analysis.referenceTracks.map((ref, i) => (
                         <span key={i} className="text-xs bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded border border-brand-purple/20 flex items-center gap-1">
                             <ListMusic size={10} /> {ref}
                         </span>
                     ))}
                </div>
            </div>
        </div>

        {/* Frequency Spectrum Visualizer */}
        <div>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sliders size={14} /> Frequency Spectrum Balance
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Waves size={10} className="text-brand-accent"/> Target Curve:
                    </span>
                    <span className="text-xs font-mono text-brand-accent border border-brand-accent/20 bg-brand-accent/5 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(56,189,248,0.1)]">
                        {analysis.suggestedEqPreset || "Genre Standard"}
                    </span>
                </div>
            </div>
            
            {/* Spectrum Container */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden relative shadow-inner">
                {/* Visualizer Background Area */}
                <div className="h-56 flex w-full relative">
                    
                    {/* Actionable Fix Markers Layer (Z-Index 30) */}
                    {analysis.actionableFixes.map((fix, idx) => {
                        const pos = getFrequencyPercentage(fix.frequency);
                        if (pos < 0) return null;
                        
                        const styles = getSeverityStyles(fix.severity);
                        
                        return (
                            <div 
                                key={idx}
                                className="absolute top-0 bottom-0 w-4 -translate-x-1/2 group z-30 flex flex-col items-center pointer-events-auto hover:z-50"
                                style={{ left: `${pos}%` }}
                            >
                                {/* Indicator Line - More opaque on hover */}
                                <div className={`h-full w-px border-l border-dashed transition-all duration-300 ${styles.line} opacity-40 group-hover:opacity-80 group-hover:border-solid`}></div>
                                
                                {/* Top Marker Icon - Pulses with Glow */}
                                <div className={`absolute top-2 p-1.5 rounded-full border transform transition-all duration-300 group-hover:scale-110 cursor-help ${styles.marker}`}>
                                    {fix.severity === 'critical' ? <XCircle size={12} strokeWidth={3} /> : (fix.severity === 'warning' ? <AlertTriangle size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />)}
                                </div>

                                {/* Enhanced Tooltip */}
                                <div className="hidden group-hover:block absolute top-12 left-1/2 -translate-x-1/2 w-72 bg-slate-900/95 backdrop-blur-xl text-xs rounded-xl border border-slate-600 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                    {/* Tooltip Header */}
                                    <div className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            {fix.severity === 'critical' && <XCircle size={16} className="text-red-500" />}
                                            {fix.severity === 'warning' && <AlertTriangle size={16} className="text-yellow-500" />}
                                            {fix.severity === 'info' && <CheckCircle size={16} className="text-blue-500" />}
                                            <span className="font-bold text-slate-100 text-sm">{fix.frequency}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${styles.badge}`}>
                                            {fix.severity}
                                        </span>
                                    </div>
                                    
                                    {/* Tooltip Body */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Issue Detected</p>
                                            <p className="text-slate-200 font-medium leading-snug">{fix.issue}</p>
                                        </div>
                                        
                                        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                                            <p className="text-[10px] uppercase tracking-widest text-brand-accent mb-1 flex items-center gap-1">
                                                <Zap size={10} /> Recommended Fix
                                            </p>
                                            <p className="text-slate-300 leading-relaxed">{fix.fix}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Grid Lines */}
                    <div className="absolute inset-0 pointer-events-none z-10 opacity-10 flex flex-col justify-between py-4 px-6">
                         {[1,2,3,4,5].map(i => <div key={i} className="w-full h-px bg-slate-400 border-t border-dashed"></div>)}
                    </div>

                    {/* Low Band */}
                    <div className={`flex-1 relative border-r border-slate-800 bg-gradient-to-t ${getSpectrumGradient(analysis.mixBalance.low.status)}`}>
                        <div className="absolute bottom-2 left-2 z-20">
                            <span className="text-xs font-bold text-slate-400 block">LOW</span>
                            <span className="text-[10px] text-slate-600 block">20Hz - 250Hz</span>
                        </div>
                        {analysis.mixBalance.low.status === 'Cut' && (
                             <div className="absolute top-1/4 left-0 right-0 h-1/2 bg-red-500/10 animate-pulse-slow blur-2xl"></div>
                        )}
                        <div className="absolute top-4 right-2 z-20">
                             <span className={`flex items-center gap-1 text-[10px] font-bold ${getStatusColor(analysis.mixBalance.low.status)} px-2 py-0.5 rounded`}>
                                 {getStatusIcon(analysis.mixBalance.low.status)} {analysis.mixBalance.low.status}
                             </span>
                        </div>
                    </div>

                    {/* Mid Band */}
                    <div className={`flex-[1.2] relative border-r border-slate-800 bg-gradient-to-t ${getSpectrumGradient(analysis.mixBalance.mid.status)}`}>
                         <div className="absolute bottom-2 left-2 z-20">
                            <span className="text-xs font-bold text-slate-400 block">MID</span>
                            <span className="text-[10px] text-slate-600 block">250Hz - 4kHz</span>
                        </div>
                        {analysis.mixBalance.mid.status === 'Boost' && (
                             <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-yellow-500/10 animate-pulse-slow blur-2xl"></div>
                        )}
                         <div className="absolute top-4 right-2 z-20">
                             <span className={`flex items-center gap-1 text-[10px] font-bold ${getStatusColor(analysis.mixBalance.mid.status)} px-2 py-0.5 rounded`}>
                                 {getStatusIcon(analysis.mixBalance.mid.status)} {analysis.mixBalance.mid.status}
                             </span>
                        </div>
                    </div>

                    {/* High Band */}
                    <div className={`flex-1 relative bg-gradient-to-t ${getSpectrumGradient(analysis.mixBalance.high.status)}`}>
                        <div className="absolute bottom-2 left-2 z-20">
                            <span className="text-xs font-bold text-slate-400 block">HIGH</span>
                            <span className="text-[10px] text-slate-600 block">4kHz - 20kHz</span>
                        </div>
                         {analysis.mixBalance.high.status === 'Cut' && (
                             <div className="absolute top-1/4 left-0 right-0 h-1/2 bg-red-500/10 animate-pulse-slow blur-2xl"></div>
                        )}
                        <div className="absolute top-4 right-2 z-20">
                             <span className={`flex items-center gap-1 text-[10px] font-bold ${getStatusColor(analysis.mixBalance.high.status)} px-2 py-0.5 rounded`}>
                                 {getStatusIcon(analysis.mixBalance.high.status)} {analysis.mixBalance.high.status}
                             </span>
                        </div>
                    </div>

                    {/* Curves Overlay */}
                    <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                         
                         {/* Legend / Key within SVG area */}
                         <text x="2" y="5" className="text-[5px] fill-slate-500 font-mono">dB</text>

                         {/* TARGET CURVE (Dashed) */}
                         <path 
                           d={getTargetCurvePath(analysis.suggestedEqPreset)}
                           fill="none" 
                           stroke="#38bdf8" 
                           strokeWidth="0.8"
                           strokeDasharray="3,2"
                           className="opacity-60"
                         />
                         
                         {/* CURRENT MIX CURVE (Solid, based on Cut/Boost status) */}
                         <path 
                           d={getCurrentCurvePath()}
                           fill="none" 
                           stroke="url(#gradient)" 
                           strokeWidth="1.5"
                           className="drop-shadow-lg"
                         />
                         
                         {/* Defs */}
                         <defs>
                           <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                             <stop offset="0%" stopColor="#ef4444" stopOpacity={analysis.mixBalance.low.status === 'Good' ? 0.5 : 1} /> 
                             <stop offset="50%" stopColor="#eab308" stopOpacity={analysis.mixBalance.mid.status === 'Good' ? 0.5 : 1} />
                             <stop offset="100%" stopColor="#10b981" stopOpacity={analysis.mixBalance.high.status === 'Good' ? 0.5 : 1} />
                           </linearGradient>
                           <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                             <stop offset="0%" stopColor="#ffffff" />
                             <stop offset="100%" stopColor="#cbd5e1" />
                           </linearGradient>
                         </defs>
                    </svg>
                    
                    {/* Floating Legend */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-4 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/50 backdrop-blur text-[9px] font-mono z-20 pointer-events-none">
                         <div className="flex items-center gap-1">
                             <div className="w-3 h-0.5 bg-slate-200"></div>
                             <span className="text-slate-300">Measured Profile</span>
                         </div>
                         <div className="flex items-center gap-1">
                             <div className="w-3 h-0.5 border-t border-brand-accent border-dashed"></div>
                             <span className="text-brand-accent">{analysis.suggestedEqPreset ? 'Target: ' + analysis.suggestedEqPreset.split(' ')[0] : 'Target'}</span>
                         </div>
                    </div>
                </div>

                {/* Text Descriptions below Visualizer */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-700 bg-slate-800/50 border-t border-slate-700">
                     <div className="p-4">
                         <p className="text-xs text-slate-400 leading-relaxed">{analysis.mixBalance.low.description}</p>
                     </div>
                     <div className="p-4">
                         <p className="text-xs text-slate-400 leading-relaxed">{analysis.mixBalance.mid.description}</p>
                     </div>
                     <div className="p-4">
                         <p className="text-xs text-slate-400 leading-relaxed">{analysis.mixBalance.high.description}</p>
                     </div>
                </div>
            </div>
        </div>

        {/* Actionable Fixes List */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-700/50 overflow-hidden">
             <div className="p-3 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-yellow-400" /> Actionable Fixes
                 </h4>
                 <span className="text-[10px] text-slate-500">{analysis.actionableFixes.length} Issues Detected</span>
             </div>
             <div className="divide-y divide-slate-800">
                 {analysis.actionableFixes.map((fix, idx) => (
                     <div key={idx} className="p-4 flex gap-4 hover:bg-slate-800/50 transition-colors">
                         <div className="mt-1">
                             {fix.severity === 'critical' && <XCircle size={18} className="text-red-500" />}
                             {fix.severity === 'warning' && <AlertTriangle size={18} className="text-yellow-500" />}
                             {fix.severity === 'info' && <CheckCircle size={18} className="text-blue-500" />}
                         </div>
                         <div className="flex-grow">
                             <div className="flex justify-between items-start mb-1">
                                <h5 className="text-sm font-semibold text-slate-200">{fix.issue}</h5>
                                <span className="font-mono text-xs text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">{fix.frequency}</span>
                             </div>
                             <p className="text-xs text-slate-400 font-mono"><span className="text-green-500">FIX:</span> {fix.fix}</p>
                         </div>
                     </div>
                 ))}
             </div>
        </div>

        {/* Technical Tech Specs */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                 <h5 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Stereo Imaging</h5>
                 <p className="text-sm text-slate-300">{analysis.stereoAnalysis}</p>
            </div>
             <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                 <h5 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Dynamics / LUFS</h5>
                 <p className="text-sm text-slate-300">{analysis.dynamicAnalysis}</p>
            </div>
        </div>

      </div>
    </div>
  );
};