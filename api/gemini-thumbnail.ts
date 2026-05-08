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
    const { title, tags } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `あなたはトップYouTuberのサムネイルデザイナーです。
以下の動画タイトルとタグをもとに、クリック率（CTR）を最大化するサムネイルの具体的な構図を提案してください。

タイトル: ${title}
タグ: ${tags.join(", ")}

以下のJSON形式で返してください。
{
  "concept": "サムネイル全体のコンセプトを一言で",
  "leftSide": "画面左側に配置する要素（人物の表情、ポーズなど）",
  "rightSide": "画面右側に配置する要素",
  "mainCopy": "サムネイルに入れる超デカ文字（7文字以内で最もフックになる言葉）",
  "subCopy": "必要であれば小さく入れる文字",
  "colors": "ベースカラーとアクセントカラーの提案"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concept: { type: Type.STRING },
            leftSide: { type: Type.STRING },
            rightSide: { type: Type.STRING },
            mainCopy: { type: Type.STRING },
            subCopy: { type: Type.STRING },
            colors: { type: Type.STRING }
          },
          required: ["concept", "leftSide", "rightSide", "mainCopy", "subCopy", "colors"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    const data = JSON.parse(jsonStr);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Gemini Thumbnail Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate thumbnail idea" });
  }
}
