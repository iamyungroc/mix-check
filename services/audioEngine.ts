/**
 * RøcAudio Professional Playback Engine
 * Focus: High Fidelity Playback, Spectrum Analysis & Frequency Splitting
 */

class AudioEngine {
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  
  // Nodes
  private sourceNode: AudioBufferSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Stem / Crossover Nodes
  private lowFilter: BiquadFilterNode | null = null;
  private midLowFilter: BiquadFilterNode | null = null;
  private midHighFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;

  private lowGain: GainNode | null = null;
  private midGain: GainNode | null = null;
  private highGain: GainNode | null = null;
  
  // Playback state
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isPlaying: boolean = false;
  
  constructor() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.context = new AudioContextClass();
    }
  }

  getContext(): AudioContext | null {
    return this.context;
  }

  async loadFile(file: File): Promise<AudioBuffer> {
    if (!this.context) throw new Error("AudioContext not supported");
    
    this.stop();
    this.buffer = null;

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffer = audioBuffer;
      this.pausedAt = 0;
      this.startTime = 0;
      return audioBuffer;
    } catch (error) {
      console.error("Audio decoding failed:", error);
      throw new Error("Failed to decode audio data.");
    }
  }

  play() {
    if (!this.context || !this.buffer) return;
    
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    if (!this.isPlaying) {
      this.sourceNode = this.context.createBufferSource();
      this.sourceNode.buffer = this.buffer;
      
      // Create Master Chain
      this.masterGain = this.context.createGain();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.85;

      // --- Crossover Network Setup ---
      
      // 1. Low Band (< 250Hz)
      this.lowFilter = this.context.createBiquadFilter();
      this.lowFilter.type = 'lowpass';
      this.lowFilter.frequency.value = 250;
      this.lowGain = this.context.createGain();

      // 2. Mid Band (250Hz - 4kHz)
      // We need a bandpass effect. We can chain a HighPass @ 250 and LowPass @ 4000
      this.midLowFilter = this.context.createBiquadFilter();
      this.midLowFilter.type = 'highpass';
      this.midLowFilter.frequency.value = 250;
      
      this.midHighFilter = this.context.createBiquadFilter();
      this.midHighFilter.type = 'lowpass';
      this.midHighFilter.frequency.value = 4000;
      
      this.midGain = this.context.createGain();

      // 3. High Band (> 4kHz)
      this.highFilter = this.context.createBiquadFilter();
      this.highFilter.type = 'highpass';
      this.highFilter.frequency.value = 4000;
      this.highGain = this.context.createGain();


      // --- Routing ---
      
      // Split Source to Filters
      this.sourceNode.connect(this.lowFilter);
      this.sourceNode.connect(this.midLowFilter);
      this.sourceNode.connect(this.highFilter);

      // Low Chain
      this.lowFilter.connect(this.lowGain);
      this.lowGain.connect(this.masterGain);

      // Mid Chain
      this.midLowFilter.connect(this.midHighFilter);
      this.midHighFilter.connect(this.midGain);
      this.midGain.connect(this.masterGain);

      // High Chain
      this.highFilter.connect(this.highGain);
      this.highGain.connect(this.masterGain);

      // Master Output
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.context.destination);

      const offset = this.pausedAt;
      this.sourceNode.start(0, offset);
      this.startTime = this.context.currentTime - offset;
      this.isPlaying = true;
    }
  }

  pause() {
    if (!this.context || !this.isPlaying || !this.sourceNode) return;
    
    const elapsed = this.context.currentTime - this.startTime;
    this.pausedAt = elapsed;
    
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.isPlaying = false;
  }

  stop() {
    this.pause();
    this.pausedAt = 0;
  }

  seek(time: number) {
    if (!this.context || !this.buffer) return;
    
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    
    this.pausedAt = time;
    
    if (wasPlaying) {
      this.play();
    }
  }

  // --- Stem Controls ---

  setStemVolume(stem: 'low' | 'mid' | 'high', value: number) {
    if (!this.context) return;
    
    // Ensure nodes exist (if paused, we might need to store these values to apply on next play)
    // For simplicity in this demo, this works best while playing or we assume nodes exist if we initialized once.
    // Ideally, we'd store state in the class and apply it in play().
    
    // We will just set the value on the node if it exists. 
    // If not playing, the React state holds the value and play() should use it (ToDo: Refactor for persistent state)
    // For now, this works in real-time.

    const time = this.context.currentTime;
    const rampTime = 0.1;

    if (stem === 'low' && this.lowGain) {
        this.lowGain.gain.setTargetAtTime(value, time, rampTime);
    } else if (stem === 'mid' && this.midGain) {
        this.midGain.gain.setTargetAtTime(value, time, rampTime);
    } else if (stem === 'high' && this.highGain) {
        this.highGain.gain.setTargetAtTime(value, time, rampTime);
    }
  }

  getAnalyser() {
    return this.analyser;
  }

  getCurrentTime() {
    if (!this.context || !this.isPlaying) return this.pausedAt;
    return this.context.currentTime - this.startTime;
  }

  getDuration() {
    return this.buffer ? this.buffer.duration : 0;
  }
}

export const audioEngine = new AudioEngine();