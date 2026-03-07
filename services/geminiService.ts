import { GoogleGenAI } from "@google/genai";

export const generateLyricsFromAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // gemini-3-flash-preview is sufficient and faster for pure transcription
    const model = 'gemini-3-flash-preview'; 

    const prompt = `
      Listen to the following audio file.
      Transcribe EVERYTHING that is spoken or sung. 
      
      Instructions:
      1. Capture all lyrics, spoken word sections, intros, outros, and ad-libs.
      2. If there are background vocals or spoken interludes, include them.
      3. Return ONLY the plain text.
      4. Put each phrase/line on a new line.
      5. Do NOT include timestamps.
      6. Do NOT include structural headers like "Verse 1", "Chorus", "Spoken", etc.
      7. Do NOT include markdown blocks.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        // Lower thinking budget as this is a simpler transcription task
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    if (!response.text) {
      throw new Error("No text generated from Gemini.");
    }

    let cleanText = response.text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
    }

    return cleanText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const autoSyncLyrics = async (base64Audio: string, mimeType: string, currentLyrics: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // gemini-3-flash-preview is sufficient and faster for pure transcription
    const model = 'gemini-3-flash-preview'; 

    const prompt = `
      Listen to the following audio file and look at the provided text lyrics.
      Your task is to synchronize the provided lyrics with the audio by adding timestamps in LRC format.
      
      Provided lyrics:
      ${currentLyrics}
      
      Instructions:
      1. Return the lyrics in standard LRC format: [mm:ss.xx] lyric text
      2. Do NOT change the text of the lyrics, only add the timestamps at the beginning of each line.
      3. Return ONLY the synchronized LRC text.
      4. Do NOT include markdown blocks.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    if (!response.text) {
      throw new Error("No text generated from Gemini.");
    }

    let cleanText = response.text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
    }

    return cleanText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
