import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Middleware for JSON parsing with higher limit for base64 document images
app.use(express.json({ limit: "50mb" }));

// Initialize Google Gen AI client with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint for Gemini Vision OCR and document text extraction
app.post("/api/gemini-extract", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png", prompt, languageHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data in request body" });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

    const customPrompt =
      prompt ||
      `Transcribe and extract ALL visible text from this document image with highest accuracy, preserving paragraph structures, tables, lists, and numbers.
If the document contains Urdu, Arabic, or RTL script, extract the exact correct unicode letters and words cleanly without broken letter spacing or reversed text order.
Do NOT include meta commentary like "Here is the extracted text:". Return ONLY the exact document text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/png",
              data: cleanBase64,
            },
          },
          {
            text: languageHint ? `${customPrompt}\nPrimary Language Context: ${languageHint}` : customPrompt,
          },
        ],
      },
    });

    const extractedText = response.text || "";
    res.json({ text: extractedText, model: "gemini-3.6-flash" });
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to process document with Gemini AI",
    });
  }
});

async function startServer() {
  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
