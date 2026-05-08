import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API Key missing" });

  try {
    const { script, type } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    let prompt = "";
    if (type === 'twitter') {
      prompt = `以下の長尺動画の台本をもとに、X(Twitter)でバズりやすい、読者の興味を惹きつけるスレッド形式（ツリー形式）の投稿文を作成してください。適度に絵文字や改行を使って読みやすくしてください。\n\n【台本】\n${script}`;
    } else {
      prompt = `以下の長尺動画の台本から最も面白い部分を抽出し、60秒以内でテンポよく話せる縦型ショート動画（TikTok/YouTube Shorts）用の台本を作成してください。冒頭の2秒で強烈なフック（問いかけや結論など）を入れてください。\n\n【台本】\n${script}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Repurpose Error:", error);
    res.status(500).json({ error: error.message });
  }
}
