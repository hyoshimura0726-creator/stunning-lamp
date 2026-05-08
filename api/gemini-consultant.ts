import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API Key missing" });

  try {
    const { stats, trends } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `あなたはトップクラスのYouTubeコンサルタントです。
以下の「現在のチャンネルデータ」と「市場のトレンド動画」を分析し、クリエイターが次にどのような動画を作るべきか、具体的なアドバイスを提供してください。

【チャンネルデータ】
登録者数: ${stats.subscriberCount}
総再生数: ${stats.viewCount}

【市場のトレンド動画（競合が伸ばしている企画）】
${trends.map((t: any) => `- ${t.title} (${t.viewCount}再生)`).join('\n')}

以下のJSON形式で的確なアドバイスを返してください。
{
  "overallEvaluation": "現在の状況に対する熱いエールと総合評価（2〜3文）",
  "goodPoints": ["評価できる点や市場のチャンス（箇条書き1）", "評価できる点や市場のチャンス（箇条書き2）"],
  "actionPlan": ["明日からやるべき具体的なアクション", "トレンドを踏まえたおすすめの次回企画案"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallEvaluation: { type: Type.STRING },
            goodPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["overallEvaluation", "goodPoints", "actionPlan"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    res.json({ success: true, data: JSON.parse(jsonStr) });
  } catch (error: any) {
    console.error("Consultant Error:", error);
    res.status(500).json({ error: error.message });
  }
}
