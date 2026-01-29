
import { GoogleGenAI, Type } from "@google/genai";
import { UIViewModel } from "../types";

const SYSTEM_INSTRUCTION = `
Rolle: "Polleninformation-Agent Dr. Schätz" (Dermatologische Praxis Österreich).
Auftrag: Erstelle ein medizinisches Bulletin zur Pollenlage basierend auf einer PLZ.
Format: Ausschließlich valides JSON.

STRIKTES VERBOT VON FORMATIERUNG:
- KEIN Markdown-Bolding verwenden! Benutze NIEMALS Doppelsternchen (z.B. **Text**) in den JSON-Werten.
- Die Texte müssen REINER TEXT sein.

DATEN-VORGABEN:
1. Recherche via Google Search für aktuelle Pollendaten in Österreich (pollenwarndienst.at, wetter.at etc.).
2. Skala: 0 (keine) bis 4 (sehr hoch).
3. KPI: Gesamt, Bäume, Gräser, Kräuter.
4. Datum: Aktuelles Datum.
`;

function cleanJsonResponse(text: string): string {
  if (!text) return "";
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    return text.substring(startIdx, endIdx + 1);
  }
  return text.trim();
}

export async function fetchPollenData(plz: string): Promise<UIViewModel> {
  // MUST create a new GoogleGenAI instance right before making an API call 
  // to ensure it uses the most up-to-date API key from the environment/bridge.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analysiere die aktuelle Pollenbelastung für PLZ ${plz} in Österreich. Liefere das Ergebnis als JSON gemäß Schema.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ui_version: { type: Type.STRING },
            header: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                timestamp_label: { type: Type.STRING },
                quality_badges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      severity: { type: Type.STRING }
                    },
                    required: ["label", "severity"]
                  }
                }
              },
              required: ["title", "subtitle", "timestamp_label"]
            },
            kpi_cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  value_label: { type: Type.STRING },
                  value_level: { type: Type.NUMBER },
                  severity: { type: Type.STRING },
                  hint: { type: Type.STRING }
                },
                required: ["id", "title", "value_label", "value_level", "severity"]
              }
            },
            summaries: {
              type: Type.OBJECT,
              properties: {
                today_one_liner: { type: Type.STRING },
                next_days_one_liner: { type: Type.STRING },
                midterm_one_liner: { type: Type.STRING }
              },
              required: ["today_one_liner", "next_days_one_liner", "midterm_one_liner"]
            },
            charts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  x: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      label: { type: Type.STRING },
                      values: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["type", "label", "values"]
                  },
                  y: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      label: { type: Type.STRING },
                      min: { type: Type.NUMBER },
                      max: { type: Type.NUMBER }
                    },
                    required: ["type", "label", "min", "max"]
                  },
                  series: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        values: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                      },
                      required: ["name", "values"]
                    }
                  }
                },
                required: ["id", "type", "title", "x", "y", "series"]
              }
            },
            tables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  columns: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        label: { type: Type.STRING }
                      },
                      required: ["key", "label"]
                    }
                  },
                  rows: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        pollen_type: { type: Type.STRING },
                        label: { type: Type.STRING },
                        inferred: { type: Type.STRING },
                        category: { type: Type.STRING }
                      },
                      required: ["pollen_type", "label"]
                    } 
                  }
                },
                required: ["id", "title", "columns", "rows"]
              }
            },
            recommendation_blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        detail: { type: Type.STRING },
                        priority: { type: Type.STRING }
                      },
                      required: ["title", "detail", "priority"]
                    }
                  }
                },
                required: ["id", "title", "items"]
              }
            },
            disclaimer: { type: Type.STRING },
            footnotes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["ui_version", "header", "kpi_cards", "summaries", "recommendation_blocks"]
        }
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Leere Antwort vom Modell.");
    
    const cleanedJson = cleanJsonResponse(resultText);
    const parsed = JSON.parse(cleanedJson) as UIViewModel;
    
    // Explicitly do not return grounding sources per user request
    parsed.groundingSources = [];

    return parsed;
  } catch (error: any) {
    console.error("fetchPollenData Error:", error);
    throw error;
  }
}
