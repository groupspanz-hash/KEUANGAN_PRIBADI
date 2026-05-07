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
      You are a Smart Financial AI Assistant. Analyze the following user data and provide 3-5 concise, actionable financial insights.
      User Profile: ${JSON.stringify(userProfile)}
      Recent Transactions: ${JSON.stringify(transactions)}
      
      Respond with a JSON array of insights. Each insight should have:
      - title (string)
      - content (string)
      - type (one of: "warning", "tip", "positive")
      
      Example:
      [
        {"title": "Spending Alert", "content": "You've spent 25% more on food than last week.", "type": "warning"},
        {"title": "Savings Tip", "content": "Switching to a generic brand for groceries could save you $50/month.", "type": "tip"}
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
