import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

let genAI: GoogleGenAI | null = null;

function getGenAIClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

app.post("/api/ai/scan-receipt", async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    let base64Data = image;
    let mimeType = "image/jpeg";

    if (image.startsWith("data:")) {
      const parts = image.split(";base64,");
      if (parts.length === 2) {
        mimeType = parts[0].substring(5); // e.g. "image/png"
        base64Data = parts[1];
      }
    }

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    const promptText = `
      Analisis foto struk pembelian atau nota belanja berikut dan ekstrak informasi transaksi penting secara detail.
      
      Kembalikan data dalam format JSON murni dengan struktur persis seperti berikut:
      {
        "amount": <number, total pengeluaran final/grand total dalam Rupiah, bulatkan ke bilangan bulat terdekat>,
        "type": "expense",
        "category": "<pilih salah satu dari: 'Makan', 'Transportasi', 'Tagihan', 'Bisnis', 'Investasi', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Pembayaran Hutang', 'Lainnya'>",
        "description": "<string, ringkasan nama merchant/toko dan item utama yang dibeli, maksimal 5-7 kata dalam Bahasa Indonesia>",
        "date": "<string, tanggal transaksi dalam format YYYY-MM-DD>"
      }

      Aturan penting:
      - PASTIKAN kategori hanya yang tertera di list di atas. Jangan buat kategori baru.
      - Jika struk berkaitan dengan pembayaran cicilan, kartu kredit, hutang atau pinjaman, masukkan ke kategori "Pembayaran Hutang".
      - Jika tanggal tidak tertera di struk, pakailah tanggal hari ini ("2026-05-20" atau silakan sesuaikan).
    `;

    const textPart = {
      text: promptText
    };

    const client = getGenAIClient();
    const result = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, textPart],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.text;
    res.json(JSON.parse(responseText || '{}'));
  } catch (error: any) {
    console.error("AI Scan Receipt Error:", error);
    if (error.message === "Gemini API key not configured") {
        return res.status(500).json({ error: "API Key Gemini belum dikonfigurasi. Silakan atur API key Anda." });
    }
    if (error.message && error.message.toLowerCase().includes("api key not valid")) {
      return res.status(401).json({ error: "API Key Gemini tidak valid. Silakan periksa pengaturan API key Anda." });
    }
    res.status(500).json({ error: "Gagal memindai struk/nota dengan AI" });
  }
});

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
    const client = getGenAIClient();
    const result = await client.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.text;
    res.json(JSON.parse(responseText || '[]'));
  } catch (error: any) {
    console.error("AI Insight Error:", error);
    if (error.message === "Gemini API key not configured") {
        return res.status(500).json({ error: "API Key Gemini belum dikonfigurasi. Silakan atur API key Anda." });
    }
    if (error.message && error.message.toLowerCase().includes("api key not valid")) {
      return res.status(401).json({ error: "API Key Gemini tidak valid. Silakan periksa pengaturan API key Anda." });
    }
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
