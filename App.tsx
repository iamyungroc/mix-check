import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Play, Pause, RotateCcw, Wand2, AlertCircle, HardDrive, Cpu, ShieldCheck, Activity, Info, Layers } from 'lucide-react';
import { Visualizer } from './components/Visualizer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { StemSlider } from './components/StemSlider';
import { AudioAnalysis, StemControl } from './types';
import { audioEngine } from './services/audioEngine';
import { analyzeAudioContent } from './services/geminiService';

// Stem Definitions
const STEM_DEFS: StemControl[] = [
    { id: 'low', name: 'Low / Bass', color: 'bg-red-500', frequencyRange: '20Hz - 250Hz' },
    { id: 'mid', name: 'Mids / Vocals', color: 'bg-yellow-500', frequencyRange: '250Hz - 4kHz' },
    { id: 'high', name: 'Highs / Air', color: 'bg-green-500', frequencyRange: '4kHz - 20kHz' },
];

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stem State
  const [stemVolumes, setStemVolumes] = useState({ low: 1, mid: 1, high: 1 });
  const [stemMutes, setStemMutes] = useState({ low: false, mid: false, high: false });

  const requestRef = useRef<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setLoadingAudio(true);
      setErrorMsg(null);
      setAnalysis(null);
      
      try {
        const buffer = await audioEngine.loadFile(uploadedFile);
        setDuration(buffer.duration);
        setIsPlaying(false);
        setCurrentTime(0);
      } catch (err) {
        console.error(err);
        setFile(null);
        setErrorMsg("Failed to decode audio file. Please use WAV or high-quality MP3.");
      } finally {
        setLoadingAudio(false);
      }
    }
  };

  const handlePlayPause = () => {
    if (!file) return;
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
      // Re-apply volumes on play (simple sync)
      setTimeout(() => {
          Object.entries(stemVolumes).forEach(([key, vol]) => {
              const k = key as 'low' | 'mid' | 'high';
              audioEngine.setStemVolume(k, stemMutes[k] ? 0 : vol);
          });
      }, 50);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    audioEngine.seek(time);
  };

  const handleStemVolumeChange = (id: 'low' | 'mid' | 'high', val: number) => {
      const newVols = { ...stemVolumes, [id]: val };
      setStemVolumes(newVols);
      if (!stemMutes[id]) {
          audioEngine.setStemVolume(id, val);
      }
  };

  const handleStemMute = (id: 'low' | 'mid' | 'high') => {
      const newMutes = { ...stemMutes, [id]: !stemMutes[id] };
      setStemMutes(newMutes);
      audioEngine.setStemVolume(id, newMutes[id] ? 0 : stemVolumes[id]);
  };
  
  const handleExportStem = async (id: 'low' | 'mid' | 'high') => {
      // Mock export for now
      alert(`Exporting ${id.toUpperCase()} stem... (Feature coming in v1.1)`);
      await new Promise(r => setTimeout(r, 1000));
  };

  const runAnalysis = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const result = await analyzeAudioContent(base64String, file.type);
        setAnalysis(result);
        setIsAnalyzing(false);
      };
      reader.onerror = () => {
        setErrorMsg("Failed to read file for analysis.");
        setIsAnalyzing(false);
      };
    } catch (e) {
      console.error(e);
      setErrorMsg("Analysis failed. Please check connection.");
      setIsAnalyzing(false);
    }
  };

  const updateProgress = useCallback(() => {
    if (isPlaying) {
      setCurrentTime(audioEngine.getCurrentTime());
      requestRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateProgress);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, updateProgress]);

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="min-h-screen bg-brand-dark text-slate-200 font-sans selection:bg-brand-accent selection:text-white pb-20 flex flex-col">
      
      {/* Header */}
      <header className="bg-brand-dark/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-accent to-brand-purple rounded-lg flex items-center justify-center shadow-lg shadow-brand-accent/20">
               <Activity className="text-white w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight leading-none">RøcAudio MixCheckR</h1>
                <p className="text-[10px] text-brand-accent font-mono tracking-widest uppercase">intelligent Mix Review Assistant v1.0 beta</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex text-xs text-slate-500 font-mono gap-4">
                 <span className="flex items-center gap-1"><Cpu size={12}/> 64-BIT ENGINE</span>
                 <span className="flex items-center gap-1 text-green-500"><ShieldCheck size={12}/> STUDIO SECURE</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 flex-grow w-full">
        
        {/* Top: Player & Visualizer */}
        <div className="bg-brand-panel p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
             {/* Subtle BG Graphic */}
             <div className="absolute -top-10 -right-10 opacity-5">
                 <HardDrive size={200} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                 
                 {/* Left: Controls */}
                 <div className="col-span-1 space-y-6">
                    <div className="flex items-center justify-between">
                         <h2 className="text-lg font-semibold flex items-center gap-2">
                             <HardDrive className="text-brand-accent" size={18} /> Source
                         </h2>
                         {file && <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 max-w-[150px] truncate">{file.name}</span>}
                    </div>

                    {!file ? (
                         <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-all group">
                            <Upload className="w-8 h-8 mb-3 text-slate-400 group-hover:text-brand-accent transition-colors" />
                            <p className="text-sm text-slate-300 font-medium">Load Mix (WAV/MP3)</p>
                            <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                        </label>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-6">
                                <button onClick={handleStop} className="p-3 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                    <RotateCcw size={20} />
                                </button>
                                <button 
                                    onClick={handlePlayPause}
                                    disabled={loadingAudio}
                                    className="p-6 rounded-full bg-gradient-to-tr from-brand-accent to-brand-purple text-white hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-brand-accent/20"
                                >
                                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                </button>
                                <div className="text-slate-400 font-mono text-sm w-20 text-center">
                                    {formatTime(currentTime)}
                                </div>
                            </div>
                            
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                step="0.01"
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-accent hover:h-2 transition-all"
                            />
                        </div>
                    )}
                 </div>

                 {/* Right: Visualizer */}
                 <div className="col-span-1 md:col-span-2 flex flex-col justify-end">
                      <Visualizer />
                      <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono uppercase">
                          <span>20 Hz</span>
                          <span>100 Hz</span>
                          <span>1 kHz</span>
                          <span>5 kHz</span>
                          <span>20 kHz</span>
                      </div>
                 </div>
             </div>

             {errorMsg && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-900/50">
                    <AlertCircle size={16} />
                    {errorMsg}
                </div>
            )}
        </div>
        
        {/* STEM SPLITTER SECTION */}
        {file && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {/* Stem Info / Title */}
                 <div className="col-span-1 flex flex-col justify-center p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                     <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                         <Layers className="text-brand-accent" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-200">Stem Isolation Console</h3>
                     <p className="text-sm text-slate-500 mt-2">
                         Isolate specific frequency bands to check for mix clashes.
                     </p>
                 </div>
                 
                 {/* Sliders */}
                 {STEM_DEFS.map((stem) => (
                     <StemSlider 
                        key={stem.id}
                        stem={stem}
                        volume={stemVolumes[stem.id]}
                        isMuted={stemMutes[stem.id]}
                        disabled={!file}
                        onVolumeChange={(val) => handleStemVolumeChange(stem.id, val)}
                        onToggleMute={() => handleStemMute(stem.id)}
                        onExport={() => handleExportStem(stem.id)}
                     />
                 ))}
            </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center py-4">
            <button
                disabled={!file || isAnalyzing}
                onClick={runAnalysis}
                className={`group relative px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all overflow-hidden
                    ${!file 
                        ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                        : isAnalyzing 
                            ? 'bg-slate-800 cursor-wait' 
                            : 'bg-gradient-to-r from-brand-accent via-brand-purple to-brand-accent bg-[length:200%_auto] hover:animate-pulse hover:shadow-[0_0_40px_rgba(129,140,248,0.4)] hover:scale-105'
                    }
                `}
            >
                {isAnalyzing ? (
                    <span className="flex items-center gap-3">
                        <Wand2 className="animate-spin" /> Analyzing Dynamics & EQ...
                    </span>
                ) : (
                    <span className="flex items-center gap-3">
                        <Wand2 /> Run Professional Mix Diagnosis
                    </span>
                )}
            </button>
        </div>

        {/* Analysis Panel */}
        <div className="min-h-[600px]">
            <AnalysisPanel analysis={analysis} isLoading={isAnalyzing} />
        </div>

      </main>

       {/* Footer */}
       <footer className="border-t border-slate-800 bg-brand-dark py-12 mt-auto relative z-10 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm gap-8 relative">
            
            {/* Left Section */}
            <div className="flex items-center gap-2 z-20">
                <ShieldCheck size={16} />
                <span className="font-semibold text-slate-400">RøcAudio Engineering Company</span>
            </div>

            {/* Right Section */}
            <div className="font-mono text-xs flex gap-4 z-20">
                <span>© 2025 ALL RIGHTS RESERVED</span>
                <span>•</span>
                <span>RØCAUDIO ANALYZER V3.0</span>
            </div>
         </div>
       </footer>

    </div>
  );
};

export default App;