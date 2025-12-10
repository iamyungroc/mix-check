import { GoogleGenAI, Type } from "@google/genai";
import { AudioAnalysis } from '../types';

// Initialize RøcAudio Intelligence
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAudioContent = async (base64Audio: string, mimeType: string): Promise<AudioAnalysis> => {
  try {
    // We use the Pro model for complex reasoning about audio engineering
    const modelId = 'gemini-2.5-flash'; 

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `Act as a World-Class Mixing & Mastering Engineer (Grammy level). Perform a "Pre-Mastering Quality Check" on this audio file.

            Your Goal: Determine if this mix is ready for mastering. Compare it against the BEST RATED mixes in its specific genre globally.

            Tasks:
            1. PRECISELY Identify the Genre, BPM (Tempo), and Musical Key.
            2. Assign a "Mastering Readiness Score" (0-100). 
               - <80 means it needs fixing before mastering. 
               - >90 means ready for transfer.
            3. Identify the ideal "EQ Curve Preset" for this genre (e.g., "V-Shape (Trap)", "Fletcher-Munson (Pop)", "Mid-Focused (Rock)", "Warm & Round (Jazz)").
            4. Analyze Frequency Balance in 3 bands (Low, Mid, High) relative to that target preset. Decide if they need a Cut, Boost, or are Good.
            5. Identify "Critical Issues" that will ruin a master (e.g., "Vocals sibilant", "Kick clashes with Bass", "Mud in 200-400Hz", "Phase issues").
            6. Suggest "Reference Tracks" this sounds similar to.
            7. Provide specific, technical "Actionable Fixes" (e.g., "Cut 3dB at 300Hz on the snare", "Compress vocals with faster attack").

            Output purely JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            genre: { type: Type.STRING },
            bpm: { type: Type.STRING },
            key: { type: Type.STRING },
            masteringScore: { type: Type.INTEGER, description: "Score 0-100 based on mix quality" },
            suggestedEqPreset: { type: Type.STRING, description: "The ideal EQ curve profile for this genre (e.g. 'V-Shape (Trap)')" },
            summary: { type: Type.STRING, description: "Professional executive summary of the mix status." },
            mixBalance: {
              type: Type.OBJECT,
              properties: {
                low: { 
                  type: Type.OBJECT,
                  properties: {
                    band: { type: Type.STRING, enum: ["Low"] },
                    status: { type: Type.STRING, enum: ["Good", "Cut", "Boost"] },
                    description: { type: Type.STRING }
                  }
                },
                mid: { 
                    type: Type.OBJECT,
                    properties: {
                      band: { type: Type.STRING, enum: ["Low-Mid"] }, // Schema limitation, just using string mapping
                      status: { type: Type.STRING, enum: ["Good", "Cut", "Boost"] },
                      description: { type: Type.STRING }
                    }
                  },
                high: { 
                    type: Type.OBJECT,
                    properties: {
                      band: { type: Type.STRING, enum: ["High"] },
                      status: { type: Type.STRING, enum: ["Good", "Cut", "Boost"] },
                      description: { type: Type.STRING }
                    }
                  },
              }
            },
            stereoAnalysis: { type: Type.STRING, description: "Width and Phase correlation assessment" },
            dynamicAnalysis: { type: Type.STRING, description: "Transient punch and LUFS/Headroom assessment" },
            referenceTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableFixes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING, enum: ["critical", "warning", "info"] },
                  frequency: { type: Type.STRING, description: "e.g. 200Hz, 5kHz" },
                  issue: { type: Type.STRING },
                  fix: { type: Type.STRING, description: "Specific instruction" }
                }
              }
            }
          },
          required: ["genre", "bpm", "key", "masteringScore", "suggestedEqPreset", "summary", "mixBalance", "stereoAnalysis", "dynamicAnalysis", "referenceTracks", "actionableFixes"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AudioAnalysis;
    }
    
    throw new Error("No analysis data returned");

  } catch (error) {
    console.error("RøcAudio Analysis Error:", error);
    // Return a dummy object so UI doesn't crash, but logged error is key
    return {
      genre: "Unknown",
      bpm: "--",
      key: "--",
      masteringScore: 0,
      suggestedEqPreset: "Flat / Neutral",
      mixBalance: {
        low: { band: 'Low', status: 'Good', description: "Analysis Failed" },
        mid: { band: 'Low-Mid', status: 'Good', description: "Analysis Failed" },
        high: { band: 'High', status: 'Good', description: "Analysis Failed" }
      },
      stereoAnalysis: "Unknown",
      dynamicAnalysis: "Unknown",
      referenceTracks: [],
      actionableFixes: [],
      summary: "Could not connect to RøcAudio Intelligence. Check internet connection."
    };
  }
};