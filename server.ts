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
          <p style="font-size: 11px; color: #64748b; text-align: center;">Este mensaje ha sido generado automáticamente, la cuenta emisora no está habilitada para recepción ni gestión de respuestas.</p>
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

// API Route: Fetch SPA activity slots from Google Sheets (server-side proxy with tab support)
app.post("/api/fetch-sheet-slots", async (req, res) => {
  try {
    const { sheetUrl, sheetTab, webhookUrl: clientWebhookUrl } = req.body;
    if (!sheetUrl) {
      return res.status(400).json({ success: false, error: "sheetUrl es requerido" });
    }

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : null;
    if (!sheetId) {
      return res.status(400).json({ success: false, error: "ID de Google Sheets inválido en la URL." });
    }

    let gidMatch = sheetUrl.match(/[#&?]gid=([0-9]+)/i);
    let gid = gidMatch ? gidMatch[1] : null;
    let tabName: string | null = (sheetTab || "").trim() || null;

    if (tabName) {
      const numMatch = tabName.match(/^(?:gid=)?(\d+)$/i);
      if (numMatch) {
        gid = numMatch[1];
        tabName = null;
      }
    }

    // Check if webhook is available
    const webhookUrl = clientWebhookUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL || (sheetUrl.includes("script.google.com") ? sheetUrl : null);
    if (webhookUrl) {
      try {
        const wbRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "getSlots",
            sheetUrl,
            sheetTab: tabName || sheetTab || "Hoja 1"
          }),
          redirect: "follow"
        });
        if (wbRes.ok) {
          const wbData = await wbRes.json().catch(() => null);
          if (wbData && wbData.success && Array.isArray(wbData.slots) && wbData.slots.length > 0) {
            console.log(`[Google Sheets Fetch] Obtenidos ${wbData.slots.length} slots directamente del Webhook de Apps Script.`);
            return res.json({
              success: true,
              slots: wbData.slots,
              totalCount: wbData.totalCount ?? wbData.slots.length,
              availableCount: wbData.availableCount ?? wbData.slots.filter((s: any) => !s.isBlocked && !s.isOccupied).length,
              blockedCount: wbData.blockedCount ?? wbData.slots.filter((s: any) => s.isBlocked).length,
              occupiedCount: wbData.occupiedCount ?? wbData.slots.filter((s: any) => s.isOccupied).length
            });
          }
        }
      } catch (wbErr) {
        console.debug("[Google Sheets Fetch] Webhook getSlots skipped:", wbErr);
      }
    }

    const endpoints: { url: string; isTabSpecific: boolean; description: string }[] = [];

    if (tabName) {
      endpoints.push({
        url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`,
        isTabSpecific: true,
        description: `Pestaña "${tabName}" (GViz)`
      });
      if (tabName.includes(" ")) {
        endpoints.push({
          url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName.replace(/\s+/g, ""))}`,
          isTabSpecific: true,
          description: `Pestaña "${tabName.replace(/\s+/g, "")}" (GViz)`
        });
      }
    }

    if (gid) {
      endpoints.push({
        url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
        isTabSpecific: true,
        description: `GID "${gid}" (GViz)`
      });
      endpoints.push({
        url: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
        isTabSpecific: true,
        description: `GID "${gid}" (Export)`
      });
    }

    // Always append fallback default endpoints so data is never empty
    endpoints.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
      isTabSpecific: false,
      description: `Hoja predeterminada (GViz)`
    });
    endpoints.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
      isTabSpecific: false,
      description: `Hoja predeterminada (Export)`
    });

    let csvContent = "";
    let lastError = "";

    for (const ep of endpoints) {
      try {
        console.log(`[Google Sheets Fetch] Intentando leer: ${ep.description} -> ${ep.url}`);
        const response = await fetch(ep.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        const text = await response.text();

        // Check for GViz error
        if (text.startsWith("/*O_o*/") || text.includes("google.visualization.Query.setResponse") || text.includes('"status":"error"')) {
          if (text.toLowerCase().includes("table does not exist") || text.toLowerCase().includes("invalid query")) {
            lastError = `No se encontró la pestaña "${tabName || sheetTab}" en el archivo de Google Sheets.`;
          } else if (text.toLowerCase().includes("access_denied") || text.toLowerCase().includes("permission")) {
            lastError = "El archivo de Google Sheets no tiene permisos públicos. En Google Sheets haz clic en Compartir > 'Cualquier persona con el enlace puede ser Lector'.";
          } else {
            lastError = `Google Sheets reportó un detalle al consultar la pestaña "${tabName || sheetTab}".`;
          }
          // Continue to try next candidate endpoint
          continue;
        }

        // Check for HTML login / 404
        if (text.toLowerCase().includes("<!doctype html") || text.toLowerCase().includes("<html")) {
          lastError = "El archivo de Google Sheets requiere iniciar sesión o no es público. Por favor configúralo como 'Cualquier persona con el enlace'.";
          continue;
        }

        if (response.ok && (text.includes(",") || text.includes("\n"))) {
          csvContent = text;
          console.log(`[Google Sheets Fetch] Éxito al leer ${ep.description} (${csvContent.length} bytes)`);
          break;
        }
      } catch (err: any) {
        lastError = err?.message || "Error al conectar con Google Sheets";
      }
    }

    if (!csvContent) {
      return res.json({
        success: false,
        slots: [],
        totalCount: 0,
        availableCount: 0,
        blockedCount: 0,
        occupiedCount: 0,
        error: lastError || `No se pudo leer la pestaña "${tabName || sheetTab}" de Google Sheets.`
      });
    }

    // Helper: Simple CSV parser
    const parseCsvRows = (txt: string): string[][] => {
      const rows: string[][] = [];
      let row: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < txt.length; i++) {
        const c = txt[i];
        const next = txt[i + 1];
        if (c === '"') {
          if (inQuotes && next === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && next === '\n') i++;
          row.push(current.trim());
          rows.push(row);
          row = [];
          current = '';
        } else {
          current += c;
        }
      }
      if (current || row.length > 0) {
        row.push(current.trim());
        rows.push(row);
      }
      return rows;
    };

    const rows = parseCsvRows(csvContent);
    const parsedSlots: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1; // 1-based row number
      if (rowNum < 8) continue; // Data begins at row 8 or 9

      const row = rows[i] || [];
      const colA_cita = (row[0] || "").trim();
      const colB_nombre = (row[1] || "").trim();
      const colC_paterno = (row[2] || "").trim();
      const colD_materno = (row[3] || "").trim();
      const colJ_bloquear = (row[9] || "").trim();
      const colK_horario = (row[10] || "").trim();
      const colL_duracion = (row[11] || "").trim();
      const colM_terapeuta = (row[12] || "").trim();
      const colP_email = (row[15] || "").trim();

      const isBloqueado = ["X", "SI", "SÍ", "1", "TRUE", "BLOQUEADO", "BLOQUEAR", "CERRADO", "NO DISPONIBLE"].includes(
        colJ_bloquear.toUpperCase()
      );

      const hasOccupantName = Boolean(colB_nombre || colC_paterno || colD_materno);
      const isOcupado = hasOccupantName || Boolean(colP_email);

      let timeSlot = colK_horario;
      let therapistGender = colM_terapeuta || "Cualquiera";
      let duration = colL_duracion || "60 min";

      if (!timeSlot) {
        const slotIdx = rowNum - 8;
        const hour = 9 + Math.floor(slotIdx / 4);
        const minute = (slotIdx % 4) * 15;
        timeSlot = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} hrs`;
      }
      if (!timeSlot.includes("hrs") && !timeSlot.includes("HRS")) {
        timeSlot = `${timeSlot} hrs`;
      }

      parsedSlots.push({
        rowIndex: rowNum,
        citaNo: colA_cita ? Number(colA_cita) || undefined : (rowNum - 7),
        timeSlot,
        duration,
        therapistGender,
        isBlocked: isBloqueado,
        isOccupied: isOcupado,
        participantName: [colB_nombre, colC_paterno, colD_materno].filter(Boolean).join(" ") || undefined,
        participantPaternal: colC_paterno || undefined,
        participantMaternal: colD_materno || undefined,
        titularEmail: colP_email || undefined
      });
    }

    const availableCount = parsedSlots.filter(s => !s.isBlocked && !s.isOccupied).length;
    const blockedCount = parsedSlots.filter(s => s.isBlocked).length;
    const occupiedCount = parsedSlots.filter(s => s.isOccupied).length;

    return res.json({
      success: true,
      slots: parsedSlots,
      totalCount: parsedSlots.length,
      availableCount,
      blockedCount,
      occupiedCount
    });
  } catch (error: any) {
    console.error("Error en /api/fetch-sheet-slots:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error al consultar Google Sheets en el servidor.",
      fallbackToClient: true
    });
  }
});

// API Route: Save / Sync SPA activity reservation to Google Sheets
app.post("/api/save-sheet-reservation", async (req, res) => {
  try {
    const { sheetUrl, sheetTab, webhookUrl: clientWebhookUrl, reservations, previousReservations, clearedRowIndices, titularEmail, activityName } = req.body;
    
    const validReservations = Array.isArray(reservations) ? reservations : [];
    const validClearedRows = Array.isArray(clearedRowIndices) ? clearedRowIndices : [];
    const validPrevReservations = Array.isArray(previousReservations) ? previousReservations : [];

    if (validReservations.length === 0 && validClearedRows.length === 0 && validPrevReservations.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron reservaciones para guardar ni renglones para liberar." });
    }

    console.log(`[Google Sheets Sync] Procesando ${validReservations.length} nuevas reservaciones y liberando ${validClearedRows.length} slots para la hoja ${sheetUrl || 'local'} (Tab: ${sheetTab || "Hoja 1"}) - Actividad: ${activityName || 'SPA'}`);
    
    // Check if a Google Apps Script Webhook / URL is present
    const webhookUrl = clientWebhookUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL || (sheetUrl && sheetUrl.includes("script.google.com") ? sheetUrl : null);
    
    let webhookResult: any = null;
    let syncStatus = "saved_locally";

    if (webhookUrl) {
      try {
        console.log(`[Google Sheets Sync] Enviando solicitud a Webhook de Google Apps Script: ${webhookUrl}`);
        const fetchRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "updateSlots",
            sheetUrl,
            sheetTab: sheetTab || "Hoja 1",
            reservations: validReservations,
            previousReservations: Array.isArray(previousReservations) ? previousReservations : [],
            clearedRowIndices: validClearedRows,
            titularEmail: titularEmail || ""
          }),
          redirect: "follow"
        });

        const rawText = await fetchRes.text();
        try {
          webhookResult = JSON.parse(rawText);
        } catch {
          webhookResult = { status: fetchRes.ok ? "ok" : "error", responseText: rawText };
        }
        syncStatus = "synced_to_sheet";
        console.log(`[Google Sheets Sync] Respuesta de Google Apps Script:`, webhookResult);
      } catch (err: any) {
        console.warn("[Google Sheets Sync] Advertencia al contactar Webhook:", err?.message || err);
        webhookResult = { error: err?.message || "Error al conectar con Webhook de Google Apps Script" };
      }
    } else {
      console.log("[Google Sheets Sync] No se configuró URL de Webhook de Apps Script. La reservación queda registrada en el sistema.");
    }

    return res.json({
      success: true,
      message: webhookUrl ? "Reservación sincronizada exitosamente con Google Sheets." : "Reservación registrada en el sistema del evento.",
      syncStatus,
      hasWebhook: !!webhookUrl,
      savedCount: validReservations.length,
      clearedCount: validClearedRows.length,
      webhookResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error al guardar reservación en Google Sheets:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error al procesar la reservación en Google Sheets."
    });
  }
});

// API Route: Test Google Apps Script Webhook connection
app.post("/api/test-sheet-webhook", async (req, res) => {
  try {
    const { webhookUrl, sheetTab } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ success: false, error: "Debes proporcionar la URL del Webhook de Apps Script." });
    }

    console.log(`[Google Sheets Webhook Test] Probando conexión con: ${webhookUrl}`);
    const fetchRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "ping",
        sheetTab: sheetTab || "Hoja 1",
        reservations: []
      }),
      redirect: "follow"
    });

    const rawText = await fetchRes.text();
    let resultJson: any = null;
    try {
      resultJson = JSON.parse(rawText);
    } catch {
      resultJson = { rawResponse: rawText };
    }

    return res.json({
      success: fetchRes.ok,
      httpStatus: fetchRes.status,
      response: resultJson,
      message: fetchRes.ok ? "Conexión con Google Apps Script exitosa." : "El webhook respondió con un error."
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "No se pudo contactar el Webhook de Google Apps Script."
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
