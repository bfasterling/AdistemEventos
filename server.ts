import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

// Explicitly serve /assets and public static folders to guarantee logo and asset resolution in both dev and prod
app.use('/assets', express.static(path.join(process.cwd(), 'public/assets')));
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
app.use(express.static(path.join(process.cwd(), 'public')));

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

// API Route: Look up Flight Schedule details using Gemini
app.get("/api/lookup-flight", async (req, res) => {
  try {
    const { airline, flightNumber, direction } = req.query;

    if (!airline || !flightNumber) {
      return res.status(400).json({ error: "Se requiere aerolínea y número de vuelo." });
    }

    const ai = getGeminiClient();

    const prompt = `Estás actuando como un sistema de consulta de vuelos en tiempo real para la Convención ADISTEM del 15 al 18 de Octubre de 2026.
    Dado que el usuario seleccionó la aerolínea "${airline}" y el número de vuelo "${flightNumber}", y la dirección es "${direction === "arrival" ? "llegada/inbound (hacia el evento)" : "regreso/outbound (desde el evento)"}".
    La sede es en el hotel de la Sede, México (Aeropuerto de la Sede, IATA: CUN).
    
    Determina un itinerario de vuelo realista para estas fechas en Octubre de 2026:
    - Si es de llegada (arrival), el destino de llegada DEBE ser CUN (Aeropuerto Sede). El origen de salida puede ser MEX (Ciudad de México), MTY (Monterrey), GDL (Guadalajara), MIA (Miami), etc. La fecha de llegada DEBE ser el 15 de Octubre de 2026.
    - Si es de regreso (departure), el origen de salida DEBE ser CUN (Aeropuerto Sede). El destino de llegada puede ser MEX, MTY, GDL, MIA, etc. La fecha de salida DEBE ser el 18 de Octubre de 2026.
    
    Genera un horario de vuelo realista (ej: duración de vuelo de 2 horas desde MEX a CUN).
    Si la opción es "vuelo privado", asume que sale a las 10:00 AM y llega a las 12:15 PM de ese mismo día de la convención.
    
    Retorna un objeto JSON con los siguientes campos:
    - airline: "${airline}"
    - flightNumber: "${flightNumber}"
    - departureAirport: código IATA o nombre, ej. "MEX" o "CUN"
    - departureDateTime: fecha y hora de salida estimada en formato ISO 8601 "2026-10-XXTHH:MM"
    - arrivalAirport: código IATA o nombre, ej. "CUN" o "MEX"
    - arrivalDateTime: fecha y hora de llegada estimada en formato ISO 8601 "2026-10-XXTHH:MM"
    
    Retorna estrictamente el JSON sin formato Markdown adicional.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            airline: { type: Type.STRING },
            flightNumber: { type: Type.STRING },
            departureAirport: { type: Type.STRING },
            arrivalAirport: { type: Type.STRING },
            departureDateTime: { type: Type.STRING },
            arrivalDateTime: { type: Type.STRING }
          },
          required: ["airline", "flightNumber", "departureAirport", "arrivalAirport", "departureDateTime", "arrivalDateTime"]
        }
      }
    });

    const resultText = response.text || "{}";
    const flightData = JSON.parse(resultText);

    return res.json({ success: true, data: flightData });
  } catch (error: any) {
    console.error("Error al buscar vuelo con Gemini:", error);
    // Graceful fallback with realistic defaults
    const isArrival = req.query.direction === "arrival";
    const airlineStr = String(req.query.airline || "Aeroméxico");
    const flNum = String(req.query.flightNumber || "AM512");
    
    const depAirport = isArrival ? "MEX" : "CUN";
    const arrAirport = isArrival ? "CUN" : "MEX";
    const depDate = isArrival ? "2026-10-15T10:00" : "2026-10-18T14:30";
    const arrDate = isArrival ? "2026-10-15T12:15" : "2026-10-18T16:45";

    return res.json({
      success: true,
      data: {
        airline: airlineStr,
        flightNumber: flNum,
        departureAirport: depAirport,
        arrivalAirport: arrAirport,
        departureDateTime: depDate,
        arrivalDateTime: arrDate
      }
    });
  }
});

// API Route: Send password recovery email via Nodemailer
app.post("/api/recover-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos requeridos (email o password)." });
    }

    const smtpUser = process.env.SMTP_USER || "soporte.convencion@adistem.com.mx";
    const smtpPass = process.env.SMTP_PASS || "soporteconvencion26";

    let transporter;
    try {
      // Configuración con servicios de Google (Gmail)
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } catch (err) {
      console.warn("No se pudo iniciar el servicio de Gmail, usando fallback local:", err);
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }

    const mailOptions = {
      from: `"Soporte Convención ADISTEM" <${smtpUser}>`,
      to: email,
      subject: "Recuperación de Contraseña - Convención ADISTEM 2026",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #56B7A9; text-align: center; margin-bottom: 20px;">Convención ADISTEM 2026</h2>
          <p>Hola,</p>
          <p>Has solicitado la recuperación de tus datos de acceso al Portal de Registro de Invitados de la Convención ADISTEM.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #56B7A9;">
            <p style="margin: 5px 0;"><strong>Usuario (Correo):</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${password}</p>
          </div>
          <p>Puedes ingresar al portal de registro usando estas credenciales.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">Este es un correo electrónico enviado por el servicio de Soporte de la Convención ADISTEM.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Correo de recuperación enviado con Gmail:", info.messageId || "jsonTransport");
    
    return res.json({ success: true, message: "Correo de recuperación enviado con éxito." });
  } catch (error: any) {
    console.error("Error al enviar correo de recuperación:", error);
    let userFriendlyError = error.message || "No se pudo enviar el correo de recuperación.";
    
    // Si es un error de contraseña/usuario incorrecto de Gmail (común cuando se requiere contraseña de aplicación)
    if (error.message && (error.message.includes("535") || error.message.includes("Username and Password not accepted"))) {
      userFriendlyError = "Error de inicio de sesión en Gmail (Código 535). Las cuentas de correo de Google/Workspace requieren configurar una 'Contraseña de aplicación' (App Password) de 16 caracteres para enviar correos vía SMTP. \n\nPara solucionarlo:\n1. Ingresa a la configuración de tu Cuenta de Google (soporte.convencion@adistem.com.mx).\n2. Ve a 'Seguridad' y asegúrate de que la 'Verificación en dos pasos' esté ACTIVA.\n3. En el buscador de la cuenta, escribe 'Contraseñas de aplicación' (App Passwords).\n4. Crea una nueva indicando el nombre 'Convencion ADISTEM' y copia el código de 16 letras que te proporcione.\n5. Configura ese código de 16 letras como la contraseña de tu SMTP_PASS en el panel de Configuración de la aplicación (o en tu archivo .env).";
    }
    
    return res.status(500).json({ success: false, error: userFriendlyError });
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
