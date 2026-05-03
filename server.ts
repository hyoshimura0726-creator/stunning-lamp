import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import urlHandler from "./api/auth/url.js";
import callbackHandler from "./api/auth/callback.js";
import youtubeHandler from "./api/youtube.js";
import geminiHandler from "./api/gemini.js";
import geminiScriptHandler from "./api/gemini-script.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount API Handlers
  app.get("/api/auth/url", urlHandler as any);
  app.get("/api/auth/callback", callbackHandler as any);
  app.get("/api/youtube", youtubeHandler as any);
  app.post("/api/gemini", geminiHandler as any);
  app.post("/api/gemini-script", geminiScriptHandler as any);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();