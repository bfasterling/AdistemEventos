import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers with generous limits for file uploads/screenshots
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initializer for Gemini client to prevent crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY no está configurada. Por favor, añádela en la pestaña Secrets del panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Route: Extract Flight Details using Gemini
app.post("/api/extract-flight", async (req, res) => {
  try {
    const { textContent, base64Image, mimeType } = req.body;

    if (!textContent && !base64Image) {
      return res.status(400).json({ error: "Se requiere contenido de texto o una imagen en base64 del itinerario." });
    }

    const ai = getGeminiClient();

    let contents: any[] = [];

    if (base64Image && mimeType) {
      // Remove data URL prefix if present
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }

    contents.push({
      text: `Analiza esta imagen o texto de un itinerario de vuelo y extrae la información de vuelo relevante de llegada y salida.
      Si solo hay un vuelo (ej. llegada), extrae ese.
      Debes retornar un objeto JSON con los siguientes campos:
      - airline: nombre de la aerolínea (string o "")
      - flightNumber: número de vuelo, ej. "AM512" (string o "")
      - departureAirport: código IATA o nombre del aeropuerto de origen, ej. "MEX" (string o "")
      - departureDateTime: fecha y hora de salida estimada en formato ISO 8601 o "AAAA-MM-DDTHH:MM" (string o "")
      - arrivalAirport: código IATA o nombre del aeropuerto de destino, ej. "CUN" (string o "")
      - arrivalDateTime: fecha y hora de llegada estimada en formato ISO 8601 o "AAAA-MM-DDTHH:MM" (string o "")

      Texto proporcionado del itinerario (si aplica):
      ${textContent || ""}

      Sé preciso. Si no encuentras alguno de los campos, pon una cadena vacía. Retorna el resultado estructurado de acuerdo al esquema.`
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            airline: { type: Type.STRING },
            flightNumber: { type: Type.STRING },
            departureAirport: { type: Type.STRING },
            departureDateTime: { type: Type.STRING },
            arrivalAirport: { type: Type.STRING },
            arrivalDateTime: { type: Type.STRING }
          },
          required: ["airline", "flightNumber", "departureAirport", "departureDateTime", "arrivalAirport", "arrivalDateTime"]
        }
      }
    });

    const resultText = response.text || "{}";
    const extractedData = JSON.parse(resultText);

    return res.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error("Error al extraer vuelo con Gemini:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error al procesar la lectura asistida del vuelo."
    });
  }
});

// Check API key configuration endpoint
app.get("/api/gemini-config", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!apiKey && apiKey !== "MY_GEMINI_API_KEY";
  res.json({ isConfigured });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Vite middleware integration for asset serving
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
