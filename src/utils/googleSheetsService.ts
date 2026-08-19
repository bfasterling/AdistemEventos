import { SpaReservationSlot, Activity, ActivityReservationDetail } from "../types";

/**
 * Extract spreadsheet ID and GID from a Google Sheets URL
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export function extractGidFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/[#&?]gid=([0-9]+)/i);
  return match ? match[1] : null;
}

export function parseSheetTarget(sheetUrl: string, sheetTab?: string): {
  sheetId: string | null;
  gid: string | null;
  tabName: string | null;
} {
  const sheetId = extractSpreadsheetId(sheetUrl);
  if (!sheetId) return { sheetId: null, gid: null, tabName: null };

  let gid = extractGidFromUrl(sheetUrl);
  let tabName: string | null = (sheetTab || "").trim() || null;

  // Check if sheetTab is a numeric GID or format "gid=123"
  if (tabName) {
    const numericGidMatch = tabName.match(/^(?:gid=)?(\d+)$/i);
    if (numericGidMatch) {
      gid = numericGidMatch[1];
      tabName = null; // treat as GID instead of tab name
    }
  }

  return { sheetId, gid, tabName };
}

/**
 * Robust CSV parser that handles quotes, escaped quotes, commas, and newlines
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentLine.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i++; // skip \n of \r\n
      }
      currentLine.push(currentCell.trim());
      if (currentLine.length > 1 || (currentLine.length === 1 && currentLine[0] !== "")) {
        lines.push(currentLine);
      }
      currentLine = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell !== "" || currentLine.length > 0) {
    currentLine.push(currentCell.trim());
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Clean and normalize time formats:
 * - "9:00 a.m." -> "09:00 AM" (or "09:00 AM (60 min)" if duration provided)
 * - "10:15 a.m." -> "10:15 AM"
 * - "1:30 p.m." -> "01:30 PM"
 * - "Date(1899,11,30,9,0,0)" -> "09:00 AM"
 * - 0.375 (fractional day) -> "09:00 AM"
 */
export function cleanTimeFormat(timeVal?: any, durationVal?: string): string {
  if (!timeVal) return "Horario por definir";
  let val = String(timeVal).trim();

  // 1. Check Date(YYYY,M,D,H,M,S) from GViz
  const dateMatch = val.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),?(\d*))?\)/);
  if (dateMatch) {
    const h = parseInt(dateMatch[4] || "0", 10);
    const m = parseInt(dateMatch[5] || "0", 10);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    val = `${h12 < 10 ? "0" + h12 : h12}:${m < 10 ? "0" + m : m} ${period}`;
  } else if (!isNaN(Number(val)) && Number(val) > 0 && Number(val) < 1) {
    // 2. Fractional day (e.g. 0.375 = 9:00 AM)
    const totalMinutes = Math.round(Number(val) * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    val = `${h12 < 10 ? "0" + h12 : h12}:${m < 10 ? "0" + m : m} ${period}`;
  } else {
    // 3. Clean up strings like "9:00 a.m.", "9:00am", "9:00 a. m."
    val = val
      .replace(/\s*a\.?\s*m\.?/i, " AM")
      .replace(/\s*p\.?\s*m\.?/i, " PM");

    // Add leading zero if single digit hour: "9:00 AM" -> "09:00 AM"
    val = val.replace(/^(\d):(\d\d\s*(?:AM|PM|hrs|horas)?)$/i, "0$1:$2");
  }

  // Append duration if not already present in string
  const cleanDuration = (durationVal || "").trim();
  if (cleanDuration && !val.toLowerCase().includes("min") && !val.toLowerCase().includes(cleanDuration.toLowerCase())) {
    return `${val} (${cleanDuration})`;
  }

  return val;
}

/**
 * Helper to generate default SPA slots if sheet is offline or not configured
 */
export function generateDefaultSpaSlots(): SpaReservationSlot[] {
  const times = [
    "09:00 AM (60 min)", "10:15 AM (60 min)", "11:30 AM (60 min)",
    "01:30 PM (60 min)", "02:45 PM (60 min)", "04:00 PM (60 min)"
  ];
  const genders = ["Dama", "Dama", "Dama", "Caballero"];
  const slots: SpaReservationSlot[] = [];
  
  let row = 9;
  let cita = 1;
  times.forEach((time) => {
    genders.forEach((gender) => {
      // simulate blocked on first 2 slots as sample
      const isBlocked = cita <= 2;
      slots.push({
        rowIndex: row,
        citaNo: String(cita),
        timeSlot: time,
        rawTime: time.split(" ")[0],
        duration: "60 min",
        therapistGender: gender,
        isBlocked,
        isOccupied: false,
        participantName: "",
        participantPaternal: "",
        participantMaternal: "",
        titularEmail: ""
      });
      row++;
      cita++;
    });
  });
  return slots;
}

/**
 * Fetch and parse SPA reservation slots from a Google Spreadsheet
 */
export async function fetchSpaSlotsFromSheet(
  sheetUrl: string,
  sheetTab: string = "Hoja 1"
): Promise<{ success: boolean; slots: SpaReservationSlot[]; totalCount: number; availableCount: number; blockedCount: number; occupiedCount: number; error?: string }> {
  const { sheetId, gid, tabName } = parseSheetTarget(sheetUrl, sheetTab);
  
  if (!sheetId) {
    const defaults = generateDefaultSpaSlots();
    return {
      success: false,
      slots: defaults,
      totalCount: defaults.length,
      availableCount: defaults.filter(s => !s.isBlocked && !s.isOccupied).length,
      blockedCount: defaults.filter(s => s.isBlocked).length,
      occupiedCount: 0,
      error: "URL de Google Sheets no válida o vacía."
    };
  }

  // 1. Try server-side proxy first if in browser environment
  try {
    const proxyRes = await fetch("/api/fetch-sheet-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetUrl, sheetTab: tabName || sheetTab || (gid ? `gid=${gid}` : "Hoja 1") })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.success && Array.isArray(data.slots) && data.slots.length > 0) {
        return {
          success: true,
          slots: data.slots,
          totalCount: data.totalCount ?? data.slots.length,
          availableCount: data.availableCount ?? data.slots.filter((s: SpaReservationSlot) => !s.isBlocked && !s.isOccupied).length,
          blockedCount: data.blockedCount ?? data.slots.filter((s: SpaReservationSlot) => s.isBlocked).length,
          occupiedCount: data.occupiedCount ?? data.slots.filter((s: SpaReservationSlot) => s.isOccupied).length,
          error: data.error
        };
      }
    }
  } catch (proxyErr) {
    console.debug("[GoogleSheets] Proxy fetch skipped or unavailable, using direct client fetch:", proxyErr);
  }

  // 2. Client-side fetch with strict endpoint prioritization
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

  // Fallback endpoints if specific tab query fails or if no tab
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
  let matchedEndpointDesc = "";

  for (const ep of endpoints) {
    try {
      const response = await fetch(ep.url);
      const text = await response.text();

      // Check if GViz returned an error response
      if (text.startsWith("/*O_o*/") || text.includes("google.visualization.Query.setResponse") || text.includes('"status":"error"')) {
        if (text.toLowerCase().includes("table does not exist") || text.toLowerCase().includes("invalid query")) {
          lastError = `No se encontró la pestaña "${tabName || sheetTab}" en el archivo de Google Sheets.`;
        } else if (text.toLowerCase().includes("access_denied") || text.toLowerCase().includes("permission")) {
          lastError = "El archivo de Google Sheets no tiene permisos públicos. En Google Sheets haz clic en Compartir > 'Cualquier persona con el enlace puede ser Lector'.";
        } else {
          lastError = `Google Sheets reportó un detalle al consultar la pestaña "${tabName || sheetTab}".`;
        }
        continue;
      }

      // Check if response is HTML login / 404
      if (text.toLowerCase().includes("<!doctype html") || text.toLowerCase().includes("<html")) {
        lastError = "El archivo de Google Sheets requiere iniciar sesión o no es público. Por favor configúralo como 'Cualquier persona con el enlace'.";
        continue;
      }

      if (response.ok && (text.includes(",") || text.includes("\n"))) {
        csvContent = text;
        matchedEndpointDesc = ep.description;
        break;
      }
    } catch (e: any) {
      lastError = e?.message || "Error al conectar con Google Sheets";
    }
  }

  if (!csvContent) {
    const defaults = generateDefaultSpaSlots();
    return {
      success: false,
      slots: defaults,
      totalCount: defaults.length,
      availableCount: defaults.filter(s => !s.isBlocked && !s.isOccupied).length,
      blockedCount: defaults.filter(s => s.isBlocked).length,
      occupiedCount: 0,
      error: lastError || `No se pudo leer la pestaña "${tabName || sheetTab}" de Google Sheets. Se muestra plantilla sugerida.`
    };
  }

  try {
    const rows = parseCSV(csvContent);
    const parsedSlots: SpaReservationSlot[] = [];

    // Rows start from row 9 in 1-based indexing (which is index 8 in 0-based indexing)
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1; // 1-based row number
      
      // Skip top header block if rowNum < 8
      if (rowNum < 8) continue;

      const row = rows[i] || [];
      const colA_cita = (row[0] || "").trim();
      const colB_nombre = (row[1] || "").trim();
      const colC_paterno = (row[2] || "").trim();
      const colD_materno = (row[3] || "").trim();
      // Col J is index 9: Bloquear ('X', 'x', 'SI', 'SÍ', '1')
      const colJ_bloqueo = (row[9] || "").trim().toUpperCase();
      // Col K is index 10: Horario ('9:00 a.m.', '10:15 a.m.')
      const colK_horario = (row[10] || "").trim();
      // Col L is index 11: Duracion ('60 min')
      const colL_duracion = (row[11] || "").trim();
      // Col N is index 13: Genero Terapeuta ('Dama', 'Caballero', 'Femenino', 'Masculino')
      const colN_genero = (row[13] || "").trim();
      // Col P is index 15: Email del participante / titular
      const colP_email = (row[15] || "").trim();

      // Check if this row represents an appointment slot (has a citation number, a time, a therapist, or a block mark)
      const hasSlotInfo = colK_horario !== "" || colN_genero !== "" || colJ_bloqueo !== "" || /^\d+$/.test(colA_cita);

      if (hasSlotInfo) {
        // Evaluate blocked status (Col J)
        const isBlocked = 
          colJ_bloqueo === "X" || 
          colJ_bloqueo.startsWith("X") || 
          colJ_bloqueo === "SI" || 
          colJ_bloqueo === "SÍ" ||
          colJ_bloqueo === "YES" ||
          colJ_bloqueo === "1" ||
          colJ_bloqueo === "TRUE";

        // Evaluate occupied status (participant name or email present)
        const isOccupied = !isBlocked && (colB_nombre.length > 0 || colC_paterno.length > 0 || colP_email.length > 0);

        parsedSlots.push({
          rowIndex: rowNum,
          citaNo: colA_cita || String(parsedSlots.length + 1),
          timeSlot: cleanTimeFormat(colK_horario, colL_duracion),
          rawTime: colK_horario,
          duration: colL_duracion,
          therapistGender: colN_genero || "Terapeuta",
          isBlocked,
          isOccupied,
          participantName: colB_nombre,
          participantPaternal: colC_paterno,
          participantMaternal: colD_materno,
          titularEmail: colP_email
        });
      }
    }

    if (parsedSlots.length === 0) {
      const defaults = generateDefaultSpaSlots();
      return {
        success: true,
        slots: defaults,
        totalCount: defaults.length,
        availableCount: defaults.filter(s => !s.isBlocked && !s.isOccupied).length,
        blockedCount: defaults.filter(s => s.isBlocked).length,
        occupiedCount: 0,
        error: "No se encontraron renglones de citas a partir del renglón 9. Se muestra plantilla sugerida."
      };
    }

    const availableCount = parsedSlots.filter(s => !s.isBlocked && !s.isOccupied).length;
    const blockedCount = parsedSlots.filter(s => s.isBlocked).length;
    const occupiedCount = parsedSlots.filter(s => s.isOccupied).length;

    return {
      success: true,
      slots: parsedSlots,
      totalCount: parsedSlots.length,
      availableCount,
      blockedCount,
      occupiedCount
    };
  } catch (err: any) {
    console.warn("Error parsing CSV data from Google Sheets:", err);
    const defaults = generateDefaultSpaSlots();
    return {
      success: false,
      slots: defaults,
      totalCount: defaults.length,
      availableCount: defaults.filter(s => !s.isBlocked && !s.isOccupied).length,
      blockedCount: defaults.filter(s => s.isBlocked).length,
      occupiedCount: 0,
      error: err?.message || "Error al procesar los datos de la hoja de cálculo."
    };
  }
}

/**
 * Format CSV representation of SPA reservations matching Google Sheets columns
 */
export function generateSpaGoogleSheetCsv(activity: Activity, slots: SpaReservationSlot[]): string {
  const headers = [
    "No. Renglón",
    "Cita No. (Col A)",
    "Nombre (Col B)",
    "Apellido Paterno (Col C)",
    "Apellido Materno (Col D)",
    "Bloqueado (Col J)",
    "Horario (Col K)",
    "Duración (Col L)",
    "Género Terapeuta (Col N)",
    "Email Titular (Col P)",
    "Estatus Slot"
  ];

  const rows = slots.map(s => {
    let status = "DISPONIBLE";
    if (s.isBlocked) status = "BLOQUEADO (X)";
    else if (s.isOccupied) status = `OCUPADO - ${s.participantName || ''} ${s.participantPaternal || ''}`.trim();

    return [
      s.rowIndex,
      `"${s.citaNo || ''}"`,
      `"${s.participantName || ''}"`,
      `"${s.participantPaternal || ''}"`,
      `"${s.participantMaternal || ''}"`,
      s.isBlocked ? "X" : "",
      `"${s.timeSlot || ''}"`,
      `"${s.duration || ''}"`,
      `"${s.therapistGender || ''}"`,
      `"${s.titularEmail || ''}"`,
      `"${status}"`
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Dispatch and save SPA reservations to Google Sheets and backend sync API
 */
export async function saveSpaReservationsToSheet(
  activity: Activity,
  reservations: ActivityReservationDetail[],
  options?: {
    previousReservations?: ActivityReservationDetail[];
    clearedRowIndices?: number[];
    titularEmail?: string;
  }
): Promise<{ success: boolean; message: string; hasWebhook?: boolean; clearedCount?: number; error?: string }> {
  const clearedRowIndices = options?.clearedRowIndices || [];
  const titularEmail = options?.titularEmail || (reservations && reservations[0]?.titularEmail) || "";
  const previousReservations = options?.previousReservations || [];

  // If there are no new reservations AND no cleared rows AND no previous reservations to clear, nothing to do
  if ((!reservations || reservations.length === 0) && clearedRowIndices.length === 0 && previousReservations.length === 0) {
    return { success: true, message: "No hay cambios en reservaciones." };
  }

  try {
    let webhookUrl = activity.googleSheetsWebhookUrl || (activity.googleSheetsUrl?.includes("script.google.com") ? activity.googleSheetsUrl : "");

    // If this activity doesn't have its own webhook URL, look for sibling activities that share the same spreadsheet
    if (!webhookUrl && activity.googleSheetsUrl) {
      try {
        const { DataStore } = await import("../dataStore");
        const allActs = DataStore.getActivities();
        const currentDocId = extractSpreadsheetId(activity.googleSheetsUrl);
        const sibling = allActs.find(a => 
          a.googleSheetsWebhookUrl && 
          (a.googleSheetsUrl === activity.googleSheetsUrl || (currentDocId && a.googleSheetsUrl && a.googleSheetsUrl.includes(currentDocId)))
        );
        if (sibling?.googleSheetsWebhookUrl) {
          webhookUrl = sibling.googleSheetsWebhookUrl;
        }
      } catch {
        // ignore
      }
    }

    const payload = {
      sheetUrl: activity.googleSheetsUrl || "",
      webhookUrl: webhookUrl || "",
      sheetTab: activity.googleSheetsTab || "Hoja 1",
      activityId: activity.id,
      activityName: activity.name,
      reservations: reservations || [],
      previousReservations,
      clearedRowIndices,
      titularEmail
    };

    const res = await fetch("/api/save-sheet-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        hasWebhook: data.hasWebhook,
        clearedCount: data.clearedCount || 0,
        message: data.message || "Reservación sincronizada con éxito en Google Sheets."
      };
    } else {
      const errData = await res.json().catch(() => ({ error: "Error en el servidor al sincronizar con Google Sheets." }));
      return {
        success: false,
        message: "Guardado localmente. La sincronización con Google Sheets reportó un detalle.",
        error: errData.error
      };
    }
  } catch (err: any) {
    console.warn("Error al enviar reservación a Google Sheets:", err);
    return {
      success: true, // gracefully succeed so user registration is not blocked
      message: "Guardado en el sistema del evento.",
      error: err?.message
    };
  }
}

/**
 * Generate copy-pasteable Google Apps Script code for Google Sheets sync
 */
export function generateGoogleAppsScriptCode(sheetTabName: string = "Hoja 1"): string {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT PARA SINCRONIZACIÓN AUTOMÁTICA DE CITAS DE SPA
 * Convención Nacional de Distribuidores
 * =========================================================================
 * 
 * INSTRUCCIONES DE INSTALACIÓN / ACTUALIZACIÓN:
 * 1. En tu archivo de Google Sheets, abre el menú superior: Extensiones > Apps Script.
 * 2. Borra todo el código que aparezca en el editor y PEGA este script completo.
 * 3. En la esquina superior derecha, haz clic en el botón azul "Implementar" (Deploy) > "Nueva implementación" (New deployment)
 *    (o "Administrar implementaciones" > icono de lápiz/editar > "Nueva versión" si ya lo tenías implementado).
 *    - Tipo: "Aplicación web" (icono de engrane / Web app).
 *    - Descripción: "Sync Reservaciones Convencion v4 - Multi-Pestañas"
 *    - Ejecutar como: "Yo" (tu cuenta de Google).
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone).
 * 4. Haz clic en "Implementar", concede los permisos y COPIA la "URL de la aplicación web" (termina en /exec).
 * 5. Pega esa URL en el campo "Webhook de Google Apps Script" de la actividad en el BackOffice.
 * =========================================================================
 */

function normalizeText(str) {
  if (!str) return "";
  return str.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/\\s+/g, " ");
}

function findSheetByTab(ss, rawTabTarget) {
  if (!rawTabTarget) {
    return ss.getSheets()[0];
  }

  var cleanTarget = rawTabTarget.toString().replace(/^gid=/i, "").trim();
  var normTarget = normalizeText(cleanTarget);
  var allSheets = ss.getSheets();

  // 1. Coincidencia exacta por nombre
  var direct = ss.getSheetByName(cleanTarget) || ss.getSheetByName(rawTabTarget);
  if (direct) return direct;

  // 2. Coincidencia sin acentos ni mayúsculas/minúsculas
  for (var i = 0; i < allSheets.length; i++) {
    var sheetNorm = normalizeText(allSheets[i].getName());
    if (sheetNorm === normTarget) {
      return allSheets[i];
    }
  }

  // 3. Coincidencia por ID numérico de hoja (GID)
  if (/^\\d+$/.test(cleanTarget)) {
    for (var i = 0; i < allSheets.length; i++) {
      if (allSheets[i].getSheetId().toString() === cleanTarget) {
        return allSheets[i];
      }
    }
  }

  // 4. Coincidencia parcial (ej. si la pestaña se llama "SPA Viernes" y el target es "Viernes" o viceversa)
  for (var i = 0; i < allSheets.length; i++) {
    var sheetNorm = normalizeText(allSheets[i].getName());
    if (normTarget.length >= 3 && (sheetNorm.indexOf(normTarget) !== -1 || normTarget.indexOf(sheetNorm) !== -1)) {
      return allSheets[i];
    }
  }

  // 5. Coincidencia por número / índice de hoja (ej. "Hoja 2", "Pestaña 2", "2")
  var indexMatch = cleanTarget.match(/(?:hoja|sheet|pestaña|pestana|tab)?\\s*(\\d+)$/i);
  if (indexMatch) {
    var sheetIdx = parseInt(indexMatch[1], 10) - 1;
    if (sheetIdx >= 0 && sheetIdx < allSheets.length) {
      return allSheets[sheetIdx];
    }
  }

  // Fallback seguro a la primera hoja
  return allSheets[0];
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    version: "v4-multi-tab",
    message: "Google Apps Script Webhook activo y listo para sincronizar citas de Spa en todas las pestañas configuradas."
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (t) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "El archivo de Google Sheets estaba ocupado procesando otra solicitud simultánea. Intenta de nuevo."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = e.postData ? e.postData.contents : "";
    var data = {};
    if (rawData) {
      try {
        data = JSON.parse(rawData);
      } catch (pErr) {
        data = {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // 1. Ping / Test de conexión
    if (data.action === "ping") {
      var ssTest = SpreadsheetApp.getActiveSpreadsheet();
      var targetTabName = data.sheetTab || "${sheetTabName || 'Hoja 1'}";
      var resolvedSheet = findSheetByTab(ssTest, targetTabName);
      var allTabsList = ssTest.getSheets().map(function(s) { return s.getName(); });

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        status: "ok",
        message: "¡Conexión exitosa con Google Apps Script!",
        spreadsheetTitle: ssTest.getName(),
        tabSolicitada: targetTabName,
        tabEncontrada: resolvedSheet.getName(),
        todasLasPestañas: allTabsList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetTabName = data.sheetTab || "${sheetTabName || 'Hoja 1'}";
    var sheet = findSheetByTab(ss, targetTabName);

    // 2. Consulta de slots en vivo (action === "getSlots")
    if (data.action === "getSlots") {
      var maxR = sheet.getMaxRows();
      var maxC = sheet.getMaxColumns();
      var lastR = Math.min(sheet.getLastRow(), maxR);
      var slots = [];

      if (lastR >= 8 && maxC >= 14) {
        var numRows = lastR - 7;
        var cols = Math.min(16, maxC);
        var values = sheet.getRange(8, 1, numRows, cols).getValues();

        for (var i = 0; i < values.length; i++) {
          var rowNum = i + 8;
          var row = values[i];
          var colA_cita = (row[0] || "").toString().trim();
          var colB_nombre = (row[1] || "").toString().trim();
          var colC_paterno = (row[2] || "").toString().trim();
          var colD_materno = (row[3] || "").toString().trim();
          var colJ_bloqueo = (row[9] || "").toString().trim().toUpperCase();
          var colK_horario = (row[10] || "").toString().trim();
          var colL_duracion = (row[11] || "").toString().trim();
          var colN_genero = (row[13] || "").toString().trim();
          var colP_email = cols >= 16 ? (row[15] || "").toString().trim() : "";

          if (!colA_cita && !colK_horario && !colB_nombre && !colJ_bloqueo) continue;

          var isBlocked = colJ_bloqueo === "X" || colJ_bloqueo === "BLOQUEADO" || colJ_bloqueo === "SI" || colJ_bloqueo === "TRUE";
          var isOccupied = !isBlocked && (colB_nombre.length > 0 || colC_paterno.length > 0 || colP_email.length > 0);

          slots.push({
            rowIndex: rowNum,
            citaNo: colA_cita || String(slots.length + 1),
            timeSlot: colK_horario + (colL_duracion ? " (" + colL_duracion + ")" : ""),
            rawTime: colK_horario,
            duration: colL_duracion,
            therapistGender: colN_genero || "Terapeuta",
            isBlocked: isBlocked,
            isOccupied: isOccupied,
            participantName: colB_nombre,
            participantPaternal: colC_paterno,
            participantMaternal: colD_materno,
            titularEmail: colP_email
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        tabName: sheet.getName(),
        slots: slots,
        totalCount: slots.length,
        availableCount: slots.filter(function(s) { return !s.isBlocked && !s.isOccupied; }).length,
        blockedCount: slots.filter(function(s) { return s.isBlocked; }).length,
        occupiedCount: slots.filter(function(s) { return s.isOccupied; }).length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Guardado / Liberación de reservaciones (action === "updateSlots" o por defecto)
    // Garantizar que existan al menos 16 columnas para Columna P (Email Titular)
    if (sheet.getMaxColumns() < 16) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 16 - sheet.getMaxColumns());
    }

    var reservations = data.reservations || [];
    if (!Array.isArray(reservations) && data.rowIndex) {
      reservations = [data];
    }

    var clearedRowIndices = data.clearedRowIndices || [];
    var titularEmail = normalizeText(data.titularEmail || "");

    // Extraer renglones nuevos a ocupar
    var newRowIndices = [];
    for (var k = 0; k < reservations.length; k++) {
      if (reservations[k].rowIndex) {
        newRowIndices.push(Number(reservations[k].rowIndex));
      }
    }

    // Extraer nombres de participantes involucrados para limpieza exhaustiva
    var participantNamesToMatch = [];
    var allResToExtract = (reservations || []).concat(data.previousReservations || []);
    for (var k = 0; k < allResToExtract.length; k++) {
      var rItem = allResToExtract[k];
      var pFirst = normalizeText(rItem.personName || "");
      var pLast = normalizeText(rItem.paternalName || "");
      if (pFirst || pLast) {
        participantNamesToMatch.push({
          first: pFirst,
          last: pLast,
          full: (pFirst + " " + pLast).trim()
        });
      }
    }

    var clearedCount = 0;

    // A) Liberar renglones especificados explícitamente desde el sistema
    for (var c = 0; c < clearedRowIndices.length; c++) {
      var clearRow = Number(clearedRowIndices[c]);
      if (clearRow && clearRow >= 8 && clearRow <= sheet.getMaxRows()) {
        sheet.getRange(clearRow, 2).setValue("");  // Col B: Nombre
        sheet.getRange(clearRow, 3).setValue("");  // Col C: Apellido Paterno
        sheet.getRange(clearRow, 4).setValue("");  // Col D: Apellido Materno
        sheet.getRange(clearRow, 16).setValue(""); // Col P: Email Titular
        clearedCount++;
      }
    }

    // B) Limpieza exhaustiva en la pestaña (filas 8 en adelante):
    // Elimina slots anteriores que coincidan por Correo Titular O por Nombre de Participante
    var maxSheetRows = sheet.getMaxRows();
    var lastRow = Math.min(sheet.getLastRow(), maxSheetRows);

    if (lastRow >= 8) {
      var numRowsToScan = lastRow - 7;
      var colsToScan = Math.min(15, sheet.getMaxColumns() - 1);
      var valuesToScan = sheet.getRange(8, 2, numRowsToScan, colsToScan).getValues();

      for (var rIdx = 0; rIdx < valuesToScan.length; rIdx++) {
        var currentRowNum = rIdx + 8;

        // Si este renglón es uno de los nuevos slots seleccionados, conservarlo
        if (newRowIndices.indexOf(currentRowNum) !== -1) {
          continue;
        }

        var rowB_nombre = normalizeText(valuesToScan[rIdx][0]);
        var rowC_paterno = normalizeText(valuesToScan[rIdx][1]);
        var rowP_email = colsToScan >= 15 ? normalizeText(valuesToScan[rIdx][14]) : "";
        var rowFullName = (rowB_nombre + " " + rowC_paterno).trim();

        if (!rowB_nombre && !rowC_paterno && !rowP_email) {
          continue;
        }

        var shouldClear = false;

        // Coincidencia por correo titular
        if (titularEmail && rowP_email && rowP_email === titularEmail) {
          shouldClear = true;
        }

        // Coincidencia por nombre completo del participante
        if (!shouldClear && rowFullName) {
          for (var p = 0; p < participantNamesToMatch.length; p++) {
            var pObj = participantNamesToMatch[p];
            if (pObj.full && (rowFullName === pObj.full || rowFullName.indexOf(pObj.full) !== -1 || pObj.full.indexOf(rowFullName) !== -1)) {
              shouldClear = true;
              break;
            }
            if (pObj.first && pObj.last && rowB_nombre === pObj.first && rowC_paterno === pObj.last) {
              shouldClear = true;
              break;
            }
          }
        }

        if (shouldClear) {
          sheet.getRange(currentRowNum, 2).setValue("");  // Col B: Nombre
          sheet.getRange(currentRowNum, 3).setValue("");  // Col C: Apellido Paterno
          sheet.getRange(currentRowNum, 4).setValue("");  // Col D: Apellido Materno
          sheet.getRange(currentRowNum, 16).setValue(""); // Col P: Email Titular
          clearedCount++;
        }
      }
    }

    // C) Escribir las nuevas reservaciones en sus renglones correspondientes
    var updatedRows = [];
    for (var i = 0; i < reservations.length; i++) {
      var res = reservations[i];
      var row = Number(res.rowIndex);

      if (row && row >= 8) {
        // Expandir filas si el renglón excede el tamaño actual de la hoja
        if (row > sheet.getMaxRows()) {
          sheet.insertRowsAfter(sheet.getMaxRows(), row - sheet.getMaxRows() + 5);
        }

        // Columna B (2): Nombre(s)
        sheet.getRange(row, 2).setValue(res.personName || "");
        // Columna C (3): Apellido Paterno
        sheet.getRange(row, 3).setValue(res.paternalName || "");
        // Columna D (4): Apellido Materno
        sheet.getRange(row, 4).setValue(res.maternalName || "");
        // Columna P (16): Email de contacto / Titular
        sheet.getRange(row, 16).setValue(res.titularEmail || titularEmail || "");

        updatedRows.push({
          row: row,
          citaNo: res.citaNo || "",
          name: ((res.personName || "") + " " + (res.paternalName || "")).trim()
        });
      }
    }

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      tabUsada: sheet.getName(),
      tabSolicitada: targetTabName,
      message: "Se grabaron " + updatedRows.length + " cita(s) y se liberaron " + clearedCount + " slot(s) en la pestaña '" + sheet.getName() + "'.",
      updatedCount: updatedRows.length,
      clearedCount: clearedCount,
      updatedRows: updatedRows
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
}

/**
 * Test Google Apps Script Webhook directly
 */
export async function testGoogleAppsScriptWebhook(webhookUrl: string, sheetTab: string = "Hoja 1"): Promise<{ success: boolean; message: string; raw?: any }> {
  try {
    const res = await fetch("/api/test-sheet-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl, sheetTab })
    });
    const data = await res.json();
    return {
      success: data.success,
      message: data.message || (data.success ? "Conexión exitosa" : (data.error || "Error al conectar")),
      raw: data
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Error al probar el webhook",
      raw: err
    };
  }
}


