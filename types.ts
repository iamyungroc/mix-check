export interface MixIssue {
  severity: 'critical' | 'warning' | 'info';
  frequency: string;
  issue: string;
  fix: string;
}

export interface FrequencyBandAnalysis {
  band: 'Low' | 'Low-Mid' | 'High-Mid' | 'High';
  status: 'Good' | 'Cut' | 'Boost';
  description: string;
}

export interface AudioAnalysis {
  genre: string;
  bpm: string | number;
  key: string;
  masteringScore: number; // 0 to 100
  suggestedEqPreset: string; // e.g. "V-Shape (Hip Hop)", "Mid-Forward"
  mixBalance: {
    low: FrequencyBandAnalysis;
    mid: FrequencyBandAnalysis;
    high: FrequencyBandAnalysis;
  };
  stereoAnalysis: string;
  dynamicAnalysis: string;
  referenceTracks: string[]; // "Sounds similar to..."
  actionableFixes: MixIssue[];
  summary: string;
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface StemControl {
  id: 'low' | 'mid' | 'high';
  name: string;
  color: string;
  frequencyRange: string;
}