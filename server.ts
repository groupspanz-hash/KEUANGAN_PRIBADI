import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini API setup for insights
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

app.post("/api/ai/insights", async (req, res) => {
  try {
    const { transactions, userProfile } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const prompt = `
      Anda adalah Asisten Keuangan AI Pintar. Analisis data pengguna berikut dan berikan 3-5 wawasan keuangan yang ringkas dan dapat ditindaklanjuti.
      Profil Pengguna: ${JSON.stringify(userProfile)}
      Transaksi Terakhir: ${JSON.stringify(transactions)}
      
      Berikan respon dalam bentuk array JSON berisi wawasan. Setiap wawasan harus memiliki:
      - title (string, dalam Bahasa Indonesia)
      - content (string, dalam Bahasa Indonesia)
      - type (salah satu dari: "warning", "tip", "positive")
      
      Contoh:
      [
        {"title": "Peringatan Pengeluaran", "content": "Anda telah menghabiskan 25% lebih banyak untuk makanan dibandingkan minggu lalu.", "type": "warning"},
        {"title": "Tip Menabung", "content": "Beralih ke merek generik untuk kebutuhan bulanan dapat menghemat Rp500.000/bulan.", "type": "tip"}
      ]
    `;

    const model = "gemini-3-flash-preview";
    const result = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.text;
    res.json(JSON.parse(responseText));
  } catch (error) {
    console.error("AI Insight Error:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

async function startServer() {
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
