import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

export const Visualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    
    const render = () => {
      if (!analyser) {
        // If no analyser yet, just request next frame
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // Gradient
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#38bdf8'); // Light Blue
      gradient.addColorStop(0.5, '#818cf8'); // Purple
      gradient.addColorStop(1, '#c084fc'); // Pink/Purple

      ctx.fillStyle = gradient;

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;
        
        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(x, height - barHeight, barWidth, barHeight, 4);
        ctx.fill();

        x += barWidth + 2;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={200} 
      className="w-full h-48 rounded-xl bg-slate-900/50 backdrop-blur-sm shadow-inner border border-slate-700/50"
    />
  );
};