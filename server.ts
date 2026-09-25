import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import { CONCIERGE_SYSTEM_PROMPT, TOUR_CATALOG_SUMMARY } from './src/data/chatKnowledge';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google Gen AI client with required User-Agent
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Chatbot endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, prompt } = req.body;

  if (!prompt && (!messages || messages.length === 0)) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // If Gemini API is available, invoke gemini-3.8-flash
  if (ai) {
    try {
      // Build conversation contents
      const conversationHistory = (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // Append latest prompt if not already present
      if (prompt && (!messages || messages[messages.length - 1]?.content !== prompt)) {
        conversationHistory.push({
          role: 'user',
          parts: [{ text: prompt }],
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationHistory,
        config: {
          systemInstruction: CONCIERGE_SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';

      // Match recommended tour objects from catalog
      const lower = responseText.toLowerCase();
      const matchedTours = TOUR_CATALOG_SUMMARY.filter((tour) => {
        return (
          lower.includes(tour.title.toLowerCase()) ||
          lower.includes(tour.slug) ||
          (lower.includes('orange bay') && tour.slug.includes('orange-bay')) ||
          (lower.includes('dolphin house') && tour.slug.includes('dolphin')) ||
          (lower.includes('paradise island') && tour.slug.includes('paradise')) ||
          (lower.includes('quad') && tour.slug.includes('safari')) ||
          (lower.includes('scuba diving') && tour.slug.includes('diving')) ||
          (lower.includes('speedboat') && tour.slug.includes('speedboat')) ||
          (lower.includes('luxor') && tour.slug.includes('luxor')) ||
          (lower.includes('cairo') && tour.slug.includes('cairo')) ||
          (lower.includes('submarine') && tour.slug.includes('submarine')) ||
          (lower.includes('sharm el naga') && tour.slug.includes('sharm-el-naga'))
        );
      }).slice(0, 3);

      return res.json({
        text: responseText,
        recommendedTours: matchedTours,
      });
    } catch (err: any) {
      console.warn('Gemini generateContent error in /api/chat:', err);
      // Fall through to return friendly guidance
    }
  }

  // Graceful fallback if no API key or API call issue
  return res.status(503).json({
    error: 'Gemini service temporarily unavailable',
    fallback: true,
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
