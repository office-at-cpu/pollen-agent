
import { GoogleGenAI, Type } from "@google/genai";
import { UIViewModel } from "../types";

const SYSTEM_INSTRUCTION = `
Rolle: "Polleninformation-Agent Dr. Schätz" & "UI-Renderer-Agent".
Kontext: Dermatologische Praxis in Österreich.
Aufgabe: Recherche aktueller Pollendaten für eine AT-PLZ und Rückgabe eines UI-fertigen JSON-ViewModels.

WICHTIGE REGELN FÜR DIE DATENSTRUKTUR:
1. Nutzen Sie Google Search für aktuelle Pollenwerte in Österreich (z.B. pollenwarndienst.at).
2. Skala: 0 (keine), 1 (gering), 2 (mittel), 3 (hoch), 4 (sehr hoch).
3. KPI-Karten: Erzeugen Sie IMMER 4 Karten: "Gesamtbelastung", "Bäume", "Gräser", "Kräuter".
4. Wetter-Einfluss: Gehen Sie in "summaries.midterm_one_liner" explizit auf den Einfluss von Regen, Wind oder Sonne ein.
5. Inferred-Regel: Falls Einzelarten fehlen, Werte der Gruppe erben und markieren.

6. DATUM-FORMAT (STRIKT):
   Verwenden Sie für ALLE Datumsangaben (timestamp_label, Chart-Achsen, Prognosen) ausschließlich das europäische Format: TT-MM-YYYY (z.B. 24-05-2024).

7. DATENQUELLEN-VERBOT (STRIKT):
   Nennen Sie im JSON-Output (insbesondere in 'footnotes', 'disclaimer' oder 'summaries') NIEMALS die konkreten Datenquellen, Providernamen oder URLs. Die Information soll wirken, als käme sie direkt aus der Expertise der Praxis.

8. ALLERGIKER-TIPPS (ESSENZIELL):
   Füllen Sie das Array "recommendation_blocks" IMMER mit mindestens 2 Blöcken:
   - Block 1 (id: "actions_today"): "Tipps für heute". Enthalten Sie 3-4 konkrete Maßnahmen (z.B. "Haare waschen", "Stoßlüften", "Wäsche trocknen").
   - Block 2 (id: "medical_help"): "Medizinischer Rat".
   Verwenden Sie für jedes Item im Feld "priority" strikt: 
   - "hoch" -> resultiert in "!!" (für kritische Tipps bei hoher Belastung)
   - "mittel" -> resultiert in "!" (für allgemeine Empfehlungen)
   - "niedrig" -> für ergänzende Hinweise.

SCHEMA-VORGABE (UI-ViewModel):
{
  "ui_version": "1.0",
  "header": { "title": "Polleninformation", "subtitle": "Standort: {ort} ({plz}), {bundesland}", "timestamp_label": "Aktualisiert: {TT-MM-YYYY HH:MM}", "quality_badges": [] },
  "kpi_cards": [
    { "id": "overall", "title": "Gesamtbelastung", "value_label": "...", "value_level": 0-4, "severity": "good|warn|bad", "hint": "..." }
  ],
  "charts": [
    {
      "id": "overall_3day",
      "type": "line",
      "title": "Prognose: Gesamtbelastung (3 Tage)",
      "x": { "type": "category", "label": "Datum", "values": ["TT-MM-YYYY"] },
      "series": []
    }
  ],
  "tables": [],
  "summaries": { "today_one_liner": "...", "next_days_one_liner": "...", "midterm_one_liner": "..." },
  "recommendation_blocks": [
    {
      "id": "actions_today",
      "title": "Tipps für heute",
      "items": [
        { "title": "Titel", "detail": "Beschreibung", "priority": "hoch|mittel|niedrig" }
      ]
    }
  ],
  "footnotes": [],
  "disclaimer": "..."
}
`;

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/, "").replace(/```$/, "");
  }
  return cleaned.trim();
}

export async function fetchPollenData(plz: string): Promise<UIViewModel> {
  // Use named parameter for apiKey as per @google/genai guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Directly await the generateContent call
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Postleitzahl: ${plz}. Analysieren Sie die Pollenlage für diesen Standort in Österreich. 
    WICHTIG: Verwenden Sie für alle Daten das europäische Format TT-MM-YYYY.
    WICHTIG: Generieren Sie im JSON unbedingt konkrete 'recommendation_blocks' mit Tipps für Allergiker.
    VERBOTEN: Nennen Sie keine Datenquellen oder URLs in den Textfeldern (footnotes, disclaimer, etc.).`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      // Recommended: Using responseSchema for expected output structure
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
                  }
                }
              }
            }
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
              }
            }
          },
          summaries: {
            type: Type.OBJECT,
            properties: {
              today_one_liner: { type: Type.STRING },
              next_days_one_liner: { type: Type.STRING },
              midterm_one_liner: { type: Type.STRING }
            }
          },
          disclaimer: { type: Type.STRING },
          footnotes: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
  });

  try {
    const resultText = response.text;
    
    if (!resultText) {
      throw new Error("Keine Antwort vom Modell erhalten.");
    }

    const cleanedJson = cleanJsonResponse(resultText);
    const data = JSON.parse(cleanedJson) as UIViewModel;
    
    // Extract Search Grounding URLs from groundingChunks as required by Gemini API guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      data.groundingSources = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title || 'Informationsquelle',
          uri: chunk.web.uri,
        }))
        .filter((source: any) => source.uri);
    }
    
    return data;
  } catch (error) {
    console.error("Gemini API Error or Parse Error:", error);
    throw new Error("Die Daten konnten nicht geladen werden. Bitte versuchen Sie es in Kürze erneut.");
  }
}
