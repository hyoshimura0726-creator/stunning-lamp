import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
  }

  try {
    const { existingTitles } = req.body;
    
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `あなたは人気YouTubeクリエイター（人生逆転、簿記1級合格、雑草魂がテーマ）の優秀な企画アシスタントです。
これまでの企画タイトルは以下の通りです：
${existingTitles || '（まだありません）'}

これらを踏まえ、視聴者が思わず応援したくなるような、新しくて魅力的なタイトル案を3つ提案してください。
タイトルとその提案理由（10文字〜20文字程度で簡潔に）を含めてください。`;

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
    const ideas = JSON.parse(jsonStr);
    res.json({ success: true, data: ideas });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate ideas" });
  }
}
