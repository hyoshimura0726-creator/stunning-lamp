import { GoogleGenAI, Type } from "@google/genai";
import { TitleIdea, VideoIdea } from "../types";

export async function generateTitleIdeasWithGemini(existingIdeas: VideoIdea[]): Promise<TitleIdea[]> {
  const existingTitles = existingIdeas.map(idea => idea.title).join(", ");
  
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ existingTitles })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate ideas');
    }

    const json = await response.json();
    return json.data as TitleIdea[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [
      { title: "Gemini連携エラー", reason: "サーバーのAPIキー設定を確認してください" }
    ];
  }
}
