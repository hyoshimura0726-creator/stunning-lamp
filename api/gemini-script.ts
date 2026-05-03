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

    const prompt = `あなたは人気YouTubeクリエイターの優秀な構成作家です。
以下の動画タイトルとタグをもとに、視聴者を惹きつける台本の構成案を作成してください。

タイトル: ${title}
タグ: ${tags.join(", ")}

以下の4つのセクションごとに、何を話すべきかの具体的なアイデア（数行の箇条書きなど）を提案してください。
1. フック (Hook): 最初の10秒で視聴者の心をつかむ言葉
2. イントロ (Intro): 動画の目的とメリットの提示
3. メイン (Body): 具体的な内容やストーリー展開
4. エンディング (CTA): チャンネル登録や高評価への誘導`;

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
              title: { type: Type.STRING, description: "セクション名（例: フック）" },
              content: { type: Type.STRING, description: "セクションで話す内容のHTML（<p>や<ul>を使って構造化してください）" }
            },
            required: ["title", "content"]
          }
        }
      }
    });

    const jsonStr = response.text?.trim() || "[]";
    const sections = JSON.parse(jsonStr);
    res.json({ success: true, data: sections });
  } catch (error: any) {
    console.error("Gemini Script Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate script" });
  }
}
