import { GoogleGenAI, Type } from "@google/genai";
import { TitleIdea, VideoIdea } from "../types";

export async function generateTitleIdeasWithGemini(existingIdeas: VideoIdea[]): Promise<TitleIdea[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const existingTitles = existingIdeas.map(idea => idea.title).join(", ");
  const prompt = `あなたは人気YouTubeクリエイター（人生逆転、簿記1級合格、雑草魂がテーマ）の優秀な企画アシスタントです。
これまでの企画タイトルは以下の通りです：
${existingTitles}

これらを踏まえ、視聴者が思わず応援したくなるような、新しくて魅力的なタイトル案を3つ提案してください。
タイトルとその提案理由（10文字〜20文字程度で簡潔に）を含めてください。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "提案するYouTube動画のタイトル",
              },
              reason: {
                type: Type.STRING,
                description: "そのタイトルを提案する理由。簡潔に。",
              },
            },
            required: ["title", "reason"]
          },
        },
      },
    });

    const jsonStr = response.text?.trim() || "[]";
    const ideas: TitleIdea[] = JSON.parse(jsonStr);
    return ideas;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [
      { title: "Gemini連携エラー", reason: "APIキーを確認してください" }
    ];
  }
}
