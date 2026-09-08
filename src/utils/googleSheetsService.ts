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

export function normalizeTherapistGender(val?: string): "Dama" | "Caballero" {
  if (!val) return "Dama";
  const s = String(val).trim().toLowerCase();
  if (/caballer|hombre|masculin|\bc\b|\bh\b|\bm\b/.test(s)) {
    return "Caballero";
  }
  if (/dama|mujer|femenin|\bd\b|\bf\b/.test(s)) {
    return "Dama";
  }
  return "Dama";
}

/**
 * Clean and normalize time formats:
 * - "9:00 a.m." -> "09:00 AM" (or "09:00 AM (60 min)" if duration provided)
 * - "10:15 a.m." -> "10:15 AM"
 * - "1:30 p.m." -> "01:30 PM"
 * - "Date(1899,11,30,9,0,0)" -> "09:00 AM"
 * - 0.375 (fractional day) -> "09:00 AM"
 */
/**
 * Canonical normalizer for time strings.
 * Always formats as standard HH:MM AM/PM (e.g. "09:00 AM", "10:15 AM", "01:30 PM")
 */
export function canonicalizeTimeKey(timeVal?: any): string {
  if (!timeVal) return "";
  // Replace non-breaking spaces and other special unicode whitespace
  let str = String(timeVal).replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, " ").trim();
  
  if (!str || str === "-" || str === "0" || str.toUpperCase() === "N/A" || str.toUpperCase() === "LIBRE" || str.toUpperCase() === "DISPONIBLE") {
    return "";
  }

  // 1. Check GViz Date(...) format: Date(1899,11,30,9,0,0)
  const gvizDate = str.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),?(\d*))?\)/i);
  if (gvizDate) {
    const h = parseInt(gvizDate[4] || "0", 10);
    const m = parseInt(gvizDate[5] || "0", 10);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12 < 10 ? "0" + h12 : h12}:${m < 10 ? "0" + m : m} ${period}`;
  }

  // 2. Fractional day e.g. 0.375 = 09:00 AM
  if (!isNaN(Number(str)) && Number(str) > 0 && Number(str) < 1) {
    const totalMinutes = Math.round(Number(str) * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12 < 10 ? "0" + h12 : h12}:${m < 10 ? "0" + m : m} ${period}`;
  }

  // 3. Extract HH:MM anywhere in string (e.g. "Sat Dec 30 1899 10:15:00 GMT...", "10:15 - 11:15", "10:15 am", "10:15")
  const match = str.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const lower = str.toLowerCase();
    
    let period: "AM" | "PM";
    if (lower.includes("pm") || lower.includes("p.m.") || lower.includes("p. m.") || lower.includes("tarde") || lower.includes("noche")) {
      period = "PM";
      if (h < 12) h += 12;
    } else if (lower.includes("am") || lower.includes("a.m.") || lower.includes("a. m.") || lower.includes("mañana")) {
      period = "AM";
      if (h === 12) h = 0;
    } else {
      if (h >= 12 && h <= 23) {
        period = "PM";
      } else if (h >= 7 && h <= 11) {
        period = "AM";
      } else if (h >= 1 && h <= 6) {
        // Daytime convention spa hours (1:00 to 6:00 is afternoon)
        period = "PM";
      } else {
        period = "AM";
      }
    }
    const h12 = h % 12 || 12;
    return `${h12 < 10 ? "0" + h12 : h12}:${m < 10 ? "0" + m : m} ${period}`;
  }

  return str;
}

/**
 * Utility to clean and format SPA time strings for consistent UI and database display.
 */
export function cleanTimeFormat(timeVal?: any, durationVal?: string): string {
  const canonical = canonicalizeTimeKey(timeVal);
  const cleanDuration = (durationVal || "").trim();
  if (cleanDuration && !cleanDuration.toLowerCase().includes("min")) {
    return `${canonical} (${cleanDuration} min)`;
  } else if (cleanDuration) {
    return `${canonical} (${cleanDuration})`;
  }
  return canonical;
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
 * Helper to generate default Pickleball or Bingo slots if sheet is offline or not configured
 */
export function generateDefaultPickleballSlots(count: number = 20): SpaReservationSlot[] {
  const slots: SpaReservationSlot[] = [];
  for (let i = 1; i <= count; i++) {
    const rowNum = 8 + i; // Starts at Row 9
    slots.push({
      rowIndex: rowNum,
      citaNo: String(i),
      timeSlot: `Lugar #${i}`,
      rawTime: `Lugar #${i}`,
      duration: "",
      therapistGender: "Dama",
      isBlocked: false,
      isOccupied: false,
      participantName: "",
      participantPaternal: "",
      participantMaternal: "",
      titularEmail: ""
    });
  }
  return slots;
}

export const generateDefaultBingoSlots = generateDefaultPickleballSlots;

/**
 * Fetch and parse Pickleball / Bingo reservation slots from a Google Spreadsheet
 * Starts at row 9:
 * - Col B (index 1): Nombre
 * - Col C (index 2): Apellido
 * - Col D (index 3): Titular / Acompañante
 * - Col G (index 6): Email del titular / RESERVADO (determina si está reservado/ocupado)
 */
export async function fetchPickleballSlotsFromSheet(
  sheetUrl: string,
  sheetTab: string = "Hoja 1",
  webhookUrl?: string,
  activityTypeParam: string = "PICKLEBALL"
): Promise<{ success: boolean; slots: SpaReservationSlot[]; totalCount: number; availableCount: number; blockedCount: number; occupiedCount: number; error?: string }> {
  const { sheetId, gid, tabName } = parseSheetTarget(sheetUrl, sheetTab);
  
  if (!sheetId) {
    const defaults = generateDefaultPickleballSlots(20);
    return {
      success: false,
      slots: defaults,
      totalCount: defaults.length,
      availableCount: defaults.filter(s => !s.isBlocked && !s.isOccupied).length,
      blockedCount: defaults.filter(s => s.isBlocked).length,
      occupiedCount: defaults.filter(s => s.isOccupied).length,
      error: "URL de Google Sheets no válida o vacía."
    };
  }

  // 1. Try server-side proxy
  try {
    const proxyRes = await fetch("/api/fetch-sheet-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetUrl, sheetTab: tabName || sheetTab || (gid ? `gid=${gid}` : "Hoja 1"), webhookUrl, activityType: activityTypeParam })
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
    console.debug("[Pickleball/BingoSheets] Proxy fetch fallback to client:", proxyErr);
  }

  // 2. Client-side fetch
  const endpoints: { url: string; isTabSpecific: boolean; description: string }[] = [];
  const cacheBuster = `&_t=${Date.now()}`;

  if (tabName) {
    endpoints.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}${cacheBuster}`,
      isTabSpecific: true,
      description: `Pestaña "${tabName}" (GViz)`
    });
  }
  if (gid) {
    endpoints.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}${cacheBuster}`,
      isTabSpecific: true,
      description: `GID "${gid}" (GViz)`
    });
  }
  endpoints.push({
    url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${cacheBuster}`,
    isTabSpecific: false,
    description: `Hoja predeterminada (GViz)`
  });

  let csvContent = "";
  let lastError = "";

  for (const ep of endpoints) {
    try {
      const response = await fetch(ep.url);
      const text = await response.text();

      if (text.startsWith("/*O_o*/") || text.includes("google.visualization.Query.setResponse") || text.includes('"status":"error"')) {
        lastError = `No se encontró la pestaña "${tabName || sheetTab}" en el archivo de Google Sheets.`;
        continue;
      }
      if (text.toLowerCase().includes("<!doctype html") || text.toLowerCase().includes("<html")) {
        lastError = "El archivo requiere permisos públicos de lectura ('Cualquier persona con el enlace').";
        continue;
      }
      if (response.ok && (text.includes(",") || text.includes("\n"))) {
        csvContent = text;
        break;
      }
    } catch (e: any) {
      lastError = e?.message || "Error de conexión";
    }
  }

  if (!csvContent) {
    const defaults = generateDefaultPickleballSlots(20);
    return {
      success: false,
      slots: defaults,
      totalCount: defaults.length,
      availableCount: defaults.length,
      blockedCount: 0,
      occupiedCount: 0,
      error: lastError || `No se pudo leer la pestaña "${tabName || sheetTab}". Se muestra plantilla.`
    };
  }

  try {
    const rows = parseCSV(csvContent);
    const parsedSlots: SpaReservationSlot[] = [];

    const isPlaceholder = (val: string) => {
      const v = val.trim().toUpperCase();
      return !v || v === "-" || v === "LIBRE" || v === "DISPONIBLE" || v === "N/A" || v === "NA" || v === "0" || v === "FALSE";
    };

    const isReservedWord = (val: string) => {
      const v = val.trim().toUpperCase();
      return v.includes("RESERV") || v.includes("BLOQUE") || v.includes("OCUPAD") || v.includes("STAFF") || v.includes("CERRADO");
    };

    // Data starts strictly at row 9 (index 8)
    const isGolf = (activityTypeParam || "").toUpperCase() === "GOLF";
    for (let i = 8; i < rows.length; i++) {
      const rowNum = i + 1; // 1-based row
      const row = rows[i] || [];

      const colA_num = (row[0] || "").trim();
      const colB_nombre = (row[1] || "").trim();
      const colC_apellido = (row[2] || "").trim();
      const colD_val = (row[3] || "").trim();
      const colG_val = (row[6] || "").trim();
      const emailOrStatus = isGolf ? colD_val : colG_val;

      // Check header
      if (colB_nombre.toUpperCase() === "NOMBRE" || colA_num.toUpperCase() === "NO.") {
        continue;
      }

      const hasParticipant = !isPlaceholder(colB_nombre) || !isPlaceholder(colC_apellido);
      const hasEmailOrReserved = !isPlaceholder(emailOrStatus);
      const isReserved = isReservedWord(emailOrStatus) || isReservedWord(colB_nombre);

      const isOccupied = hasParticipant || hasEmailOrReserved;
      const isBlocked = isReserved && !hasParticipant;

      parsedSlots.push({
        rowIndex: rowNum,
        citaNo: colA_num || String(parsedSlots.length + 1),
        timeSlot: `Lugar #${parsedSlots.length + 1}`,
        rawTime: `Lugar #${parsedSlots.length + 1}`,
        duration: "",
        therapistGender: "Dama",
        isBlocked,
        isOccupied,
        participantName: colB_nombre || undefined,
        participantPaternal: colC_apellido || undefined,
        participantMaternal: isGolf ? undefined : colD_val || undefined,
        titularEmail: emailOrStatus || undefined
      });
    }

    if (parsedSlots.length === 0) {
      const defaults = generateDefaultPickleballSlots(20);
      return {
        success: true,
        slots: defaults,
        totalCount: defaults.length,
        availableCount: defaults.length,
        blockedCount: 0,
        occupiedCount: 0
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
    const defaults = generateDefaultPickleballSlots(20);
    return {
      success: false,
      slots: defaults,
      totalCount: defaults.length,
      availableCount: defaults.length,
      blockedCount: 0,
      occupiedCount: 0,
      error: err?.message
    };
  }
}

/**
 * Fetch and parse SPA reservation slots from a Google Spreadsheet
 */
export async function fetchSpaSlotsFromSheet(
  sheetUrl: string,
  sheetTab: string = "Hoja 1",
  webhookUrl?: string
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
      occupiedCount: defaults.filter(s => s.isOccupied).length,
      error: "URL de Google Sheets no válida o vacía."
    };
  }

  // 1. Try server-side proxy first if in browser environment
  try {
    const proxyRes = await fetch("/api/fetch-sheet-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetUrl, sheetTab: tabName || sheetTab || (gid ? `gid=${gid}` : "Hoja 1"), webhookUrl })
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
  const cacheBuster = `&_t=${Date.now()}`;

  if (tabName) {
    endpoints.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}${cacheBuster}`,
      isTabSpecific: true,
      description: `Pestaña "${tabName}" (GViz)`
    });
    if (tabName.includes(" ")) {
      endpoints.push({
        url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName.replace(/\s+/g, ""))}${cacheBuster}`,
        isTabSpecific: true,
        description: `Pestaña "${tabName.replace(/\s+/g, "")}" (GViz)`
      });
    }
  }

  if (gid) {
    endpoints.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}${cacheBuster}`,
      isTabSpecific: true,
      description: `GID "${gid}" (GViz)`
    });
    endpoints.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}${cacheBuster}`,
      isTabSpecific: true,
      description: `GID "${gid}" (Export)`
    });
  }

  // Fallback endpoints if specific tab query fails or if no tab
  endpoints.push({
    url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${cacheBuster}`,
    isTabSpecific: false,
    description: `Hoja predeterminada (GViz)`
  });
  endpoints.push({
    url: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${cacheBuster}`,
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

    let lastKnownTime = "09:00 AM";
    let lastKnownDuration = "60 min";

    // Scan all rows
    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1; // 1-based row number
      const row = rows[i] || [];

      const colA_raw = (row[0] || "").trim();
      const colB_raw = (row[1] || "").trim();
      const colC_raw = (row[2] || "").trim();
      const colD_raw = (row[3] || "").trim();

      // Look for Horario across columns (J=index 9, I=index 8, K=index 10, H=index 7, G=index 6, L=index 11)
      let foundTime = "";
      let foundDuration = "";

      // Check if Column A has cita number (e.g. "1", "Cita 1", "Cita #1", "CITA 1")
      // CRITICAL: Do NOT match time strings like "10:15" as cita number 10!
      const hasTimePattern = /\b\d{1,2}:\d{2}/.test(colA_raw);
      if (hasTimePattern) {
        foundTime = colA_raw;
      }
      const citaNumMatch = !hasTimePattern ? colA_raw.match(/\b(?:Cita\s*#?|No\.?\s*)?(\d{1,3})\b/i) : null;
      const citaNumber = citaNumMatch ? parseInt(citaNumMatch[1], 10) : undefined;
      const isCitaRow = citaNumber !== undefined && citaNumber > 0 && citaNumber < 500;

      // Header row detection: Skip headers or rows before row 9 unless explicitly a cita row
      const isHeaderRow = !isCitaRow && (
        (colA_raw.toUpperCase() === "CITA" || colA_raw.toUpperCase() === "CITA NO." || colA_raw.toUpperCase() === "NO." || colA_raw.toUpperCase() === "NO" || colA_raw.toUpperCase().includes("HORARIO")) ||
        (colB_raw.toUpperCase() === "NOMBRE" || colB_raw.toUpperCase() === "NOMBRE(S)" || colB_raw.toUpperCase().includes("TITULAR"))
      );

      if (isHeaderRow) {
        continue;
      }

      // If neither a cita number is found and row number is less than 9, skip logos/titles/headers
      if (!isCitaRow && rowNum < 9) continue;

      // Check Column J (index 9)
      const col9 = (row[9] || "").trim();
      const col10 = (row[10] || "").trim();
      const col8 = (row[8] || "").trim();
      const col11 = (row[11] || "").trim();

      if (col9.match(/\d/i) && !col9.toLowerCase().includes("min") && !/^\$\d+/.test(col9)) {
        foundTime = col9;
        if (col10.match(/\d/i)) foundDuration = col10;
      } else if (col8.match(/\d/i) && !/^\$\d+/.test(col8) && !col8.toLowerCase().includes("cargo")) {
        foundTime = col8;
        if (col9.match(/\d/i)) foundDuration = col9;
      } else if (col10.match(/\d/i) && !col10.toLowerCase().includes("min")) {
        foundTime = col10;
        if (col11.match(/\d/i)) foundDuration = col11;
      } else {
        // Broad scan across columns 6 to 12
        for (let c = 6; c <= Math.min(12, row.length - 1); c++) {
          const val = (row[c] || "").trim();
          if (val.match(/\b\d{1,2}:\d{2}/) || val.match(/Date\(\d+/i) || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) < 1)) {
            foundTime = val;
            if (c + 1 < row.length && (row[c + 1] || "").match(/\d/)) {
              foundDuration = (row[c + 1] || "").trim();
            }
            break;
          }
        }
      }

      // If time was found on this row, update our running lastKnownTime
      if (foundTime) {
        lastKnownTime = cleanTimeFormat(foundTime, foundDuration);
        if (foundDuration) lastKnownDuration = foundDuration;
      }

      // Look for Género Terapeuta across columns M (12), L (11), N (13), K (10)
      let foundGender: "Dama" | "Caballero" = "Dama";
      for (let gCol = 10; gCol <= Math.min(14, row.length - 1); gCol++) {
        const gVal = (row[gCol] || "").trim();
        if (gVal) {
          const gen = normalizeTherapistGender(gVal);
          if (gen === "Caballero" || (gen === "Dama" && /dama|mujer|femenin|\bd\b/i.test(gVal))) {
            foundGender = gen;
            break;
          }
        }
      }

      // Check Column P (index 15), Column O (index 14), Column N (index 13), Column Q (index 16) for Email Titular or Block data
      const colO = (row[14] || "").trim();
      const colP = (row[15] || "").trim();
      const colN = (row[13] || "").trim();
      const colQ = (row[16] || "").trim();
      
      // Ignore non-blocking placeholder words like "DISPONIBLE", "LIBRE", "-", "N/A"
      const isPlaceholder = (val: string) => {
        const v = val.trim().toUpperCase();
        return !v || v === "-" || v === "LIBRE" || v === "DISPONIBLE" || v === "N/A" || v === "NA" || v === "0" || v === "FALSE";
      };

      const isExplicitBlock = (val: string) => {
        const v = val.trim().toUpperCase();
        return v.includes("BLOQUE") || v.includes("CERRADO") || v.includes("NO DISPONIBLE") || v.includes("FUERA DE SERVICIO") || v.includes("MANTENIMIENTO");
      };

      // Col P (Email Titular) or Col O (Observaciones/Bloqueo)
      const colP_hasData = !isPlaceholder(colP) && (colP.includes("@") || isExplicitBlock(colP) || colP.toUpperCase().includes("RESERV") || colP.toUpperCase().includes("OCUPAD"));
      const colO_hasData = !isPlaceholder(colO) && (colO.includes("@") || isExplicitBlock(colO));
      const colN_block = !isPlaceholder(colN) && (colN.includes("@") || isExplicitBlock(colN));
      const colQ_block = !isPlaceholder(colQ) && (colQ.includes("@") || isExplicitBlock(colQ));

      const emailOrBlockData = colP_hasData ? colP : (colO_hasData ? colO : (colN_block ? colN : (colQ_block ? colQ : "")));

      const isParticipantName = (name: string) => {
        const n = name.trim().toUpperCase();
        return n && !isPlaceholder(n) && n !== "NOMBRE" && n !== "TITULAR" && n !== "APELLIDO" && !isExplicitBlock(n);
      };

      const hasParticipant = isParticipantName(colB_raw) || isParticipantName(colC_raw);
      const hasEmailOrData = Boolean(emailOrBlockData);

      const isExplicitTherapist = Boolean(foundGender);
      const isBlankRow = !isCitaRow && !foundTime && !isExplicitTherapist && !hasParticipant && !hasEmailOrData;
      
      // Skip empty/blank rows
      if (isBlankRow) {
        continue;
      }

      // Valid appointment slot
      // Reglas precisas:
      // 1. Ocupado: Si hay participante registrado (Col B/C/D)
      // 2. Bloqueado: Si no hay participante, pero Col O o P tiene dato/email o palabra explícita de bloqueo
      // 3. Disponible: Si no hay participante y Col O/P está vacía (o tiene "LIBRE"/"DISPONIBLE")
      const isOccupied = hasParticipant;
      const isBlocked = !hasParticipant && hasEmailOrData;

      // Exact physical row index calculation: Row 9 onwards are exact physical rows in Google Sheets
      const finalRowIndex = rowNum >= 9 ? rowNum : (isCitaRow && citaNumber ? (citaNumber + 8) : rowNum);
      const finalCitaNo = isCitaRow && citaNumber ? String(citaNumber) : (rowNum >= 9 ? String(rowNum - 8) : (colA_raw || String(parsedSlots.length + 1)));

      parsedSlots.push({
        rowIndex: finalRowIndex,
        citaNo: finalCitaNo,
        timeSlot: lastKnownTime,
        rawTime: foundTime || lastKnownTime,
        duration: foundDuration || lastKnownDuration,
        therapistGender: foundGender,
        isBlocked,
        isOccupied,
        participantName: isParticipantName(colB_raw) ? colB_raw : undefined,
        participantPaternal: isParticipantName(colC_raw) ? colC_raw : undefined,
        participantMaternal: isParticipantName(colD_raw) ? colD_raw : undefined,
        titularEmail: emailOrBlockData || undefined
      });
    }

    if (parsedSlots.length === 0) {
      const defaults = generateDefaultSpaSlots();
      return {
        success: true,
        slots: defaults,
        totalCount: defaults.length,
        availableCount: defaults.filter(s => !s.isBlocked && !s.isOccupied).length,
        blockedCount: defaults.filter(s => s.isBlocked).length,
        occupiedCount: defaults.filter(s => s.isOccupied).length,
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
    "Horario (Col J/K)",
    "Duración",
    "Género Terapeuta (Col M/N)",
    "Email Titular / Bloqueo (Col P)",
    "Estatus Slot"
  ];

  const rows = slots.map(s => {
    let status = "DISPONIBLE";
    if (s.isBlocked) status = "BLOQUEADO (Dato en Col P)";
    else if (s.isOccupied) status = `OCUPADO - ${s.participantName || ''} ${s.participantPaternal || ''} (${s.titularEmail || ''})`.trim();

    return [
      s.rowIndex,
      `"${s.citaNo || ''}"`,
      `"${s.participantName || ''}"`,
      `"${s.participantPaternal || ''}"`,
      `"${s.participantMaternal || ''}"`,
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
  activityOrWebhook: Activity | string,
  reservations: ActivityReservationDetail[],
  optionsOrPrev?: {
    sheetTab?: string;
    previousReservations?: ActivityReservationDetail[];
    clearedRowIndices?: number[];
    titularEmail?: string;
  } | ActivityReservationDetail[],
  maybeEmail?: string,
  maybeTab?: string
): Promise<{ success: boolean; message: string; hasWebhook?: boolean; clearedCount?: number; error?: string; syncStatus?: "synced" | "failed_sheet" | "pending_sheet" }> {
  let webhookUrl = "";
  let sheetUrl = "";
  let activityId = "";
  let activityName = "Actividad SPA";
  let defaultTab = "Viernes";

  if (typeof activityOrWebhook === "string") {
    webhookUrl = activityOrWebhook;
  } else if (activityOrWebhook && typeof activityOrWebhook === "object") {
    webhookUrl = activityOrWebhook.googleSheetsWebhookUrl || "";
    sheetUrl = activityOrWebhook.googleSheetsUrl || "";
    activityId = activityOrWebhook.id;
    activityName = activityOrWebhook.name;
    defaultTab = activityOrWebhook.googleSheetsTab || "Viernes";
  }

  let clearedRowIndices: number[] = [];
  let previousReservations: ActivityReservationDetail[] = [];
  let titularEmail = maybeEmail || "";
  let targetTab = maybeTab || defaultTab;

  if (Array.isArray(optionsOrPrev)) {
    previousReservations = optionsOrPrev;
  } else if (optionsOrPrev && typeof optionsOrPrev === "object") {
    clearedRowIndices = optionsOrPrev.clearedRowIndices || [];
    previousReservations = optionsOrPrev.previousReservations || [];
    if (optionsOrPrev.titularEmail) titularEmail = optionsOrPrev.titularEmail;
    if (optionsOrPrev.sheetTab) targetTab = optionsOrPrev.sheetTab;
  }

  if (!titularEmail && reservations && reservations.length > 0) {
    titularEmail = (reservations[0]?.titularEmail || "").toUpperCase();
  } else if (titularEmail) {
    titularEmail = titularEmail.toUpperCase();
  }
  if ((!targetTab || targetTab === "Hoja 1") && reservations && reservations.length > 0 && reservations[0]?.sheetTab) {
    targetTab = reservations[0].sheetTab;
  }

  // Format all reservations to uppercase
  const uppercaseReservations = (reservations || []).map(r => ({
    ...r,
    personName: (r.personName || "").toString().trim().toUpperCase(),
    paternalName: (r.paternalName || "").toString().trim().toUpperCase(),
    maternalName: (r.maternalName || "").toString().trim().toUpperCase(),
    titularEmail: (r.titularEmail || titularEmail || "").toString().trim().toUpperCase()
  }));

  // If there are no new reservations AND no cleared rows AND no previous reservations to clear, nothing to do
  if (uppercaseReservations.length === 0 && clearedRowIndices.length === 0 && previousReservations.length === 0) {
    return { success: true, message: "No hay cambios en reservaciones." };
  }

  try {
    // If this activity doesn't have its own webhook URL, look for sibling activities that share the same spreadsheet
    if (!webhookUrl && sheetUrl) {
      try {
        const { DataStore } = await import("../dataStore");
        const allActs = DataStore.getActivities();
        const currentDocId = extractSpreadsheetId(sheetUrl);
        const sibling = allActs.find(a => 
          a.googleSheetsWebhookUrl && 
          (a.googleSheetsUrl === sheetUrl || (currentDocId && a.googleSheetsUrl && a.googleSheetsUrl.includes(currentDocId)))
        );
        if (sibling?.googleSheetsWebhookUrl) {
          webhookUrl = sibling.googleSheetsWebhookUrl;
        }
      } catch {
        // ignore
      }
    }

    const payload = {
      sheetUrl: sheetUrl || "",
      webhookUrl: webhookUrl || "",
      sheetTab: targetTab,
      activityId: activityId,
      activityName: activityName,
      reservations: uppercaseReservations,
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
        success: data.success,
        syncStatus: data.syncStatus,
        hasWebhook: data.hasWebhook,
        clearedCount: data.clearedCount || 0,
        message: data.message || (data.success ? "Reservación sincronizada con éxito en Google Sheets." : "Guardado en el sistema del evento."),
        error: !data.success ? data.message : undefined
      };
    } else {
      const errData = await res.json().catch(() => ({ error: "Error en el servidor al sincronizar con Google Sheets." }));
      return {
        success: false,
        syncStatus: "failed_sheet",
        message: "Guardado en el sistema del evento (sincronización con Google Sheets pendiente).",
        error: errData.error || "Error al conectar con servidor"
      };
    }
  } catch (err: any) {
    console.warn("Error al enviar reservación a Google Sheets:", err);
    return {
      success: false,
      syncStatus: "failed_sheet",
      message: "Guardado en el sistema del evento (sincronización con Google Sheets pendiente).",
      error: err?.message || "Error de red"
    };
  }
}

/**
 * Dispatch and save Pickleball or Bingo reservations to Google Sheets and backend sync API
 */
export const savePickleballReservationsToSheet = saveSpaReservationsToSheet;
export const fetchBingoSlotsFromSheet = (sheetUrl: string, sheetTab: string = "Hoja 1", webhookUrl?: string) => 
  fetchPickleballSlotsFromSheet(sheetUrl, sheetTab, webhookUrl, "BINGO");
export const saveBingoReservationsToSheet = saveSpaReservationsToSheet;
export const fetchMovieNightsSlotsFromSheet = (sheetUrl: string, sheetTab: string = "Hoja 1", webhookUrl?: string) => 
  fetchPickleballSlotsFromSheet(sheetUrl, sheetTab, webhookUrl, "MOVIE_NIGHTS");
export const saveMovieNightsReservationsToSheet = saveSpaReservationsToSheet;
export const fetchGolfSlotsFromSheet = (sheetUrl: string, sheetTab: string = "Hoja 1", webhookUrl?: string) => 
  fetchPickleballSlotsFromSheet(sheetUrl, sheetTab, webhookUrl, "GOLF");
export const saveGolfReservationsToSheet = saveSpaReservationsToSheet;

/**
 * Generate copy-pasteable Google Apps Script code for Golf sync
 * - Row 9 onwards
 * - Col B: Nombre
 * - Col C: Apellido
 * - Col D: Email del titular / RESERVADO
 * - Col F: Requiere bastones (SI/NO)
 * - Col G: Derecho o Zurdo (DERECHO/ZURDO/-)
 * - Col H: Regular o Stiff (REGULAR/STIFF/-)
 */
export function generateGolfAppsScriptCode(sheetTabName: string = "Hoja 1"): string {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT PARA SINCRONIZACIÓN DE ACTIVIDAD GOLF
 * Convención Nacional de Distribuidores
 * =========================================================================
 * 
 * ESTRUCTURA DE COLUMNAS (A partir de la Fila 9):
 * - Fila 9 en adelante: Slots / Lugares de Golf
 * - Columna B (2): Nombre de la persona registrada
 * - Columna C (3): Apellido(s) de la persona registrada
 * - Columna D (4): Email del titular / RESERVADO (Indica si el espacio está reservado/bloqueado)
 * - Columna F (6): Requiere bastones ("SI" / "NO")
 * - Columna G (7): Derecho o Zurdo ("DERECHO" / "ZURDO" / "-")
 * - Columna H (8): Tipo de varilla ("REGULAR" / "STIFF" / "-")
 * 
 * INSTRUCCIONES DE INSTALACIÓN / ACTUALIZACIÓN:
 * 1. En tu archivo de Google Sheets, abre el menú superior: Extensiones > Apps Script.
 * 2. Borra todo el código que aparezca en el editor y PEGA este script completo.
 * 3. En la esquina superior derecha, haz clic en el botón azul "Implementar" (Deploy) > "Nueva implementación" (New deployment)
 *    (o "Administrar implementaciones" > icono de lápiz/editar > "Nueva versión" si ya lo tenías implementado).
 *    - Tipo: "Aplicación web" (icono de engrane / Web app).
 *    - Descripción: "Sync Golf Convencion v1 - Renglón 9, Col B, C, D, F, G, H"
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

  // 4. Coincidencia parcial (ej. si la pestaña se llama "Golf Viernes" y el target es "Viernes")
  for (var i = 0; i < allSheets.length; i++) {
    var sheetNorm = normalizeText(allSheets[i].getName());
    if (normTarget.length >= 3 && (sheetNorm.indexOf(normTarget) !== -1 || normTarget.indexOf(sheetNorm) !== -1)) {
      return allSheets[i];
    }
  }

  // 5. Coincidencia por índice de hoja
  var indexMatch = cleanTarget.match(/(?:hoja|sheet|pestaña|pestana|tab)?\\s*(\\d+)$/i);
  if (indexMatch) {
    var sheetIdx = parseInt(indexMatch[1], 10) - 1;
    if (sheetIdx >= 0 && sheetIdx < allSheets.length) {
      return allSheets[sheetIdx];
    }
  }

  return allSheets[0];
}

function doGet(e) {
  if (e && e.parameter && (e.parameter.action || e.parameter.data)) {
    return handleRequest(e);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    version: "v1-golf",
    message: "Google Apps Script Webhook activo para actividad Golf (Renglón 9, Col B, C, D, F, G, H)."
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (t) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "El archivo de Google Sheets estaba ocupado. Intenta de nuevo."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = e && e.postData ? e.postData.contents : "";
    var data = {};
    if (rawData) {
      try {
        data = JSON.parse(rawData);
      } catch (pErr) {
        data = {};
      }
    } else if (e && e.parameter) {
      if (e.parameter.data) {
        try {
          data = JSON.parse(e.parameter.data);
        } catch (dErr) {
          data = e.parameter;
        }
      } else {
        data = e.parameter;
      }
    }

    if (typeof data.reservations === "string") {
      try { data.reservations = JSON.parse(data.reservations); } catch(rErr){}
    }
    if (typeof data.previousReservations === "string") {
      try { data.previousReservations = JSON.parse(data.previousReservations); } catch(rErr){}
    }
    if (typeof data.clearedRowIndices === "string") {
      try { data.clearedRowIndices = JSON.parse(data.clearedRowIndices); } catch(rErr){}
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Ping / Test de conexión
    if (data.action === "ping") {
      var targetTabName = data.sheetTab || "${sheetTabName || 'Hoja 1'}";
      var resolvedSheet = findSheetByTab(ss, targetTabName);
      var allTabsList = ss.getSheets().map(function(s) { return s.getName(); });

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        status: "ok",
        activityType: "GOLF",
        message: "¡Conexión exitosa con Google Apps Script de Golf!",
        spreadsheetTitle: ss.getName(),
        tabSolicitada: targetTabName,
        tabEncontrada: resolvedSheet.getName(),
        todasLasPestañas: allTabsList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var targetTabName = data.sheetTab || "${sheetTabName || 'Hoja 1'}";
    var sheet = findSheetByTab(ss, targetTabName);

    // 2. Consulta de slots en vivo de Golf (action === "getSlots")
    if (data.action === "getSlots") {
      var maxR = sheet.getMaxRows();
      var maxC = sheet.getMaxColumns();
      var lastR = Math.min(sheet.getLastRow(), maxR);
      var slots = [];

      if (lastR >= 9 && maxC >= 4) {
        var numRows = lastR - 8;
        var cols = Math.min(10, maxC);
        var values = sheet.getRange(9, 1, numRows, cols).getValues();

        for (var i = 0; i < values.length; i++) {
          var rowNum = i + 9;
          var row = values[i];

          var colA_no = (row[0] || "").toString().trim();
          var colB_nombre = (row[1] || "").toString().trim();
          var colC_apellido = (row[2] || "").toString().trim();
          var colD_email = (row[3] || "").toString().trim();
          var colF_bastones = cols >= 6 ? (row[5] || "").toString().trim() : "";
          var colG_mano = cols >= 7 ? (row[6] || "").toString().trim() : "";
          var colH_varilla = cols >= 8 ? (row[7] || "").toString().trim() : "";

          // Skip header if repeated
          if (colB_nombre.toUpperCase() === "NOMBRE" || colA_no.toUpperCase() === "NO.") {
            continue;
          }

          var normD = colD_email.toUpperCase();
          var hasParticipant = colB_nombre.length > 0 || colC_apellido.length > 0;
          var isReservedOrOccupied = normD.indexOf("RESERV") !== -1 || normD.indexOf("BLOQUE") !== -1 || normD.indexOf("OCUPAD") !== -1 || (colD_email.length > 0 && colD_email !== "-" && colD_email !== "LIBRE" && colD_email !== "DISPONIBLE");

          var isOccupied = hasParticipant || isReservedOrOccupied;
          var isBlocked = (normD.indexOf("RESERV") !== -1 || normD.indexOf("BLOQUE") !== -1) && !hasParticipant;

          slots.push({
            rowIndex: rowNum,
            citaNo: colA_no || String(slots.length + 1),
            timeSlot: "Lugar #" + (slots.length + 1),
            rawTime: "Lugar #" + (slots.length + 1),
            duration: "",
            therapistGender: "",
            isBlocked: isBlocked,
            isOccupied: isOccupied,
            participantName: colB_nombre,
            participantPaternal: colC_apellido,
            titularEmail: colD_email,
            notes: colF_bastones ? ("Requiere: " + colF_bastones + (colG_mano ? " / " + colG_mano : "") + (colH_varilla ? " / " + colH_varilla : "")) : ""
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        activityType: "GOLF",
        tabName: sheet.getName(),
        slots: slots,
        totalCount: slots.length,
        availableCount: slots.filter(function(s) { return !s.isBlocked && !s.isOccupied; }).length,
        blockedCount: slots.filter(function(s) { return s.isBlocked; }).length,
        occupiedCount: slots.filter(function(s) { return s.isOccupied; }).length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Guardado / Liberación de reservaciones de Golf
    if (sheet.getMaxColumns() < 8) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 8 - sheet.getMaxColumns());
    }

    var reservations = data.reservations || [];
    if (!Array.isArray(reservations) && data.rowIndex) {
      reservations = [data];
    }

    var clearedRowIndices = data.clearedRowIndices || [];
    var titularEmail = normalizeText(data.titularEmail || "");
    var previousReservations = data.previousReservations || [];

    // Pre-escanear hoja para resolución inteligente de filas existentes
    var maxRowsScan = Math.max(sheet.getLastRow(), sheet.getMaxRows(), 9);
    var numScanRows = maxRowsScan >= 9 ? maxRowsScan - 8 : 1;
    var scanVals = sheet.getRange(9, 1, numScanRows, Math.min(8, sheet.getMaxColumns())).getValues();

    // 1. Resolver y proteger la fila de destino (targetRow) para cada reservación
    var newRowIndices = [];
    var resolvedReservations = [];

    for (var k = 0; k < reservations.length; k++) {
      var res = reservations[k];
      var targetRow = Number(res.rowIndex);
      var pFirst = normalizeText(res.personName || "");
      var pLast = normalizeText(res.paternalName || res.personLastName || "");
      var pFull = (pFirst + " " + pLast).trim();

      // Si no se proporcionó fila válida, buscar primero si esta persona o correo ya tiene una fila registrada
      if (!targetRow || targetRow < 9) {
        for (var sIdx = 0; sIdx < scanVals.length; sIdx++) {
          var checkRow = sIdx + 9;
          if (newRowIndices.indexOf(checkRow) !== -1) continue;

          var curB = normalizeText(scanVals[sIdx][1] || "");
          var curC = normalizeText(scanVals[sIdx][2] || "");
          var curD = normalizeText(scanVals[sIdx][3] || "");
          var curFull = (curB + " " + curC).trim();

          var matchEmail = titularEmail && curD && curD === titularEmail;
          var matchName = (pFull && curFull && (pFull === curFull || curFull.indexOf(pFull) !== -1 || pFull.indexOf(curFull) !== -1)) ||
                          (pFirst && pLast && curB === pFirst && curC === pLast);

          if (matchEmail || matchName) {
            targetRow = checkRow;
            break;
          }
        }

        // Si no tenía fila previa, buscar la primera fila libre desde la fila 9
        if (!targetRow) {
          for (var sIdx = 0; sIdx < scanVals.length; sIdx++) {
            var checkRow = sIdx + 9;
            if (newRowIndices.indexOf(checkRow) !== -1) continue;
            var curB = (scanVals[sIdx][1] || "").toString().trim();
            var curD = (scanVals[sIdx][3] || "").toString().trim();
            if (!curB && !curD) {
              targetRow = checkRow;
              break;
            }
          }
        }

        // Si todas las filas están llenas, asignar siguiente fila al final
        if (!targetRow) {
          targetRow = Math.max(sheet.getLastRow() + 1, 9);
        }
      }

      if (targetRow && targetRow >= 9) {
        newRowIndices.push(targetRow);
        resolvedReservations.push({
          res: res,
          targetRow: targetRow
        });
      }
    }

    // Nombres de participantes para limpieza de registros duplicados
    var participantNamesToMatch = [];
    var allResToExtract = (reservations || []).concat(previousReservations || []);
    for (var k = 0; k < allResToExtract.length; k++) {
      var rItem = allResToExtract[k];
      var pF = normalizeText(rItem.personName || "");
      var pL = normalizeText(rItem.paternalName || "");
      if (pF || pL) {
        participantNamesToMatch.push({
          first: pF,
          last: pL,
          full: (pF + " " + pL).trim()
        });
      }
    }

    var clearedCount = 0;

    // Helper: Limpiar renglón en Golf (Col B, C, D, F, G, H)
    function clearGolfRow(targetSht, rowNum) {
      if (rowNum && rowNum >= 9 && rowNum <= targetSht.getMaxRows()) {
        targetSht.getRange(rowNum, 2).setValue(""); // Col B: Nombre
        targetSht.getRange(rowNum, 3).setValue(""); // Col C: Apellido
        targetSht.getRange(rowNum, 4).setValue(""); // Col D: Email Titular
        if (targetSht.getMaxColumns() >= 6) targetSht.getRange(rowNum, 6).setValue(""); // Col F: Requiere bastones
        if (targetSht.getMaxColumns() >= 7) targetSht.getRange(rowNum, 7).setValue(""); // Col G: Derecho / Zurdo
        if (targetSht.getMaxColumns() >= 8) targetSht.getRange(rowNum, 8).setValue(""); // Col H: Regular / Stiff
        return 1;
      }
      return 0;
    }

    // Helper: Limpieza exhaustiva en hoja dada protegiendo las filas activas
    function cleanSheetByMatching(targetSht, protectRowIndices) {
      var count = 0;
      var lastR = Math.min(targetSht.getLastRow(), targetSht.getMaxRows());
      if (lastR < 9) return 0;
      var numRows = lastR - 8;
      var numCols = Math.min(10, targetSht.getMaxColumns());
      var vals = targetSht.getRange(9, 1, numRows, numCols).getValues();

      for (var rIdx = 0; rIdx < vals.length; rIdx++) {
        var rowNum = rIdx + 9;
        if (protectRowIndices && protectRowIndices.indexOf(rowNum) !== -1) {
          continue;
        }

        var rB = normalizeText(vals[rIdx][1] || "");
        var rC = normalizeText(vals[rIdx][2] || "");
        var rD = numCols >= 4 ? normalizeText(vals[rIdx][3] || "") : "";
        var fullN = (rB + " " + rC).trim();

        if (!rB && !rC && !rD) continue;

        var shouldClear = false;
        if (titularEmail && rD && rD === titularEmail) {
          shouldClear = true;
        }

        if (!shouldClear && fullN) {
          for (var p = 0; p < participantNamesToMatch.length; p++) {
            var pObj = participantNamesToMatch[p];
            if (pObj.full && (fullN === pObj.full || fullN.indexOf(pObj.full) !== -1 || pObj.full.indexOf(fullN) !== -1)) {
              shouldClear = true;
              break;
            }
            if (pObj.first && pObj.last && rB === pObj.first && rC === pObj.last) {
              shouldClear = true;
              break;
            }
          }
        }

        if (shouldClear) {
          clearGolfRow(targetSht, rowNum);
          count++;
        }
      }
      return count;
    }

    // A) Limpiar reservaciones previas en otras pestañas
    if (previousReservations && previousReservations.length > 0) {
      for (var pIdx = 0; pIdx < previousReservations.length; pIdx++) {
        var prevItem = previousReservations[pIdx];
        if (prevItem.sheetTab && prevItem.sheetTab !== sheet.getName()) {
          var prevSheet = findSheetByTab(ss, prevItem.sheetTab);
          if (prevSheet && prevSheet.getName() !== sheet.getName()) {
            if (prevItem.rowIndex) {
              clearedCount += clearGolfRow(prevSheet, Number(prevItem.rowIndex));
            }
            clearedCount += cleanSheetByMatching(prevSheet, []);
          }
        }
      }
    }

    // B) Liberar renglones especificados (que no coincidan con las nuevas filas protegidas)
    for (var c = 0; c < clearedRowIndices.length; c++) {
      var rToClear = Number(clearedRowIndices[c]);
      if (newRowIndices.indexOf(rToClear) === -1) {
        clearedCount += clearGolfRow(sheet, rToClear);
      }
    }

    // C) Limpieza exhaustiva en la pestaña actual (evitando sobrescribir las filas protegidas)
    clearedCount += cleanSheetByMatching(sheet, newRowIndices);

    // D) Escribir las nuevas reservaciones en formato Golf (Col B, C, D, F, G, H en MAYÚSCULAS)
    var updatedRows = [];
    for (var i = 0; i < resolvedReservations.length; i++) {
      var item = resolvedReservations[i];
      var res = item.res;
      var targetRow = item.targetRow;

      if (targetRow && targetRow >= 9) {
        if (targetRow > sheet.getMaxRows()) {
          sheet.insertRowsAfter(sheet.getMaxRows(), targetRow - sheet.getMaxRows() + 5);
        }

        var nameVal = (res.personName || "").toString().trim().toUpperCase();
        var patVal = (res.paternalName || res.personLastName || "").toString().trim().toUpperCase();
        var emailContact = (res.titularEmail || titularEmail || "").toString().trim().toUpperCase();

        var ownClubs = res.golfOwnClubs === true || res.golfOwnClubs === "SI" || res.golfOwnClubs === "si" || res.golfOwnClubs === "true";
        var reqClubsVal = ownClubs ? "NO" : "SI";
        var handVal = ownClubs ? "-" : (res.golfHand || "DERECHO").toString().trim().toUpperCase();
        var shaftVal = ownClubs ? "-" : (res.golfShaft || "REGULAR").toString().trim().toUpperCase();

        // Columna B (2): Nombre
        sheet.getRange(targetRow, 2).setValue(nameVal);
        // Columna C (3): Apellido
        sheet.getRange(targetRow, 3).setValue(patVal);
        // Columna D (4): Email del titular
        sheet.getRange(targetRow, 4).setValue(emailContact);
        // Columna F (6): Requiere bastones (SI/NO)
        sheet.getRange(targetRow, 6).setValue(reqClubsVal);
        // Columna G (7): Derecho o Zurdo
        sheet.getRange(targetRow, 7).setValue(handVal);
        // Columna H (8): Tipo de varilla
        sheet.getRange(targetRow, 8).setValue(shaftVal);

        updatedRows.push({
          row: targetRow,
          name: (nameVal + " " + patVal).trim(),
          email: emailContact,
          requiereBastones: reqClubsVal,
          mano: handVal,
          varilla: shaftVal
        });
      }
    }

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      activityType: "GOLF",
      tabUsada: sheet.getName(),
      tabSolicitada: targetTabName,
      message: "Se registraron " + updatedRows.length + " lugar(es) de Golf y se liberaron " + clearedCount + " en Google Sheets.",
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
}
`
}

/**
 * Generate copy-pasteable Google Apps Script code for Pickleball or Bingo sync
 * - Row 9 onwards
 * - Col B: Nombre
 * - Col C: Apellido
 * - Col D: Titular o Acompañante
 * - Col G: Email del titular / RESERVADO
 */
export function generatePickleballAppsScriptCode(sheetTabName: string = "Hoja 1", activityTitle: string = "Pickleball"): string {
  const actNameUpper = (activityTitle || "Pickleball").toUpperCase();
  const actNameDisplay = activityTitle || "Pickleball";
  const isMovieNights = actNameUpper.indexOf("MOVIE") !== -1;

  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT PARA SINCRONIZACIÓN DE ACTIVIDAD ${actNameUpper}
 * Convención Nacional de Distribuidores
 * =========================================================================
 * 
 * ESTRUCTURA DE COLUMNAS (A partir de la Fila 9):
 * - Fila 9 en adelante: Slots / Lugares disponibles de ${actNameDisplay}
 * - Columna B (2): Nombre de la persona registrada (${isMovieNights ? "Menor de edad" : "Titular o Acompañante"})
 * - Columna C (3): Apellido(s) de la persona registrada
 * - Columna D (4): ${isMovieNights ? '"MENOR" (Registro exclusivo para menores de edad)' : '"TITULAR" o "ACOMPAÑANTE"'}
 * - Columna G (7): Email del titular responsable / RESERVADO (Indica si el espacio está reservado/bloqueado)
 * 
 * INSTRUCCIONES DE INSTALACIÓN / ACTUALIZACIÓN:
 * 1. En tu archivo de Google Sheets, abre el menú superior: Extensiones > Apps Script.
 * 2. Borra todo el código que aparezca en el editor y PEGA este script completo.
 * 3. En la esquina superior derecha, haz clic en el botón azul "Implementar" (Deploy) > "Nueva implementación" (New deployment)
 *    (o "Administrar implementaciones" > icono de lápiz/editar > "Nueva versión" si ya lo tenías implementado).
 *    - Tipo: "Aplicación web" (icono de engrane / Web app).
 *    - Descripción: "Sync ${actNameDisplay} Convencion v1 - Renglón 9, Col B, C, D, G"
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

  // 4. Coincidencia parcial (ej. si la pestaña se llama "Pickleball Viernes" y el target es "Viernes")
  for (var i = 0; i < allSheets.length; i++) {
    var sheetNorm = normalizeText(allSheets[i].getName());
    if (normTarget.length >= 3 && (sheetNorm.indexOf(normTarget) !== -1 || normTarget.indexOf(sheetNorm) !== -1)) {
      return allSheets[i];
    }
  }

  // 5. Coincidencia por índice de hoja
  var indexMatch = cleanTarget.match(/(?:hoja|sheet|pestaña|pestana|tab)?\\s*(\\d+)$/i);
  if (indexMatch) {
    var sheetIdx = parseInt(indexMatch[1], 10) - 1;
    if (sheetIdx >= 0 && sheetIdx < allSheets.length) {
      return allSheets[sheetIdx];
    }
  }

  return allSheets[0];
}

function doGet(e) {
  if (e && e.parameter && (e.parameter.action || e.parameter.data)) {
    return handleRequest(e);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    version: "v1-pickleball",
    message: "Google Apps Script Webhook activo para actividad Pickleball (Renglón 9, Col B, C, D, G)."
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (t) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "El archivo de Google Sheets estaba ocupado. Intenta de nuevo."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = e && e.postData ? e.postData.contents : "";
    var data = {};
    if (rawData) {
      try {
        data = JSON.parse(rawData);
      } catch (pErr) {
        data = {};
      }
    } else if (e && e.parameter) {
      if (e.parameter.data) {
        try {
          data = JSON.parse(e.parameter.data);
        } catch (dErr) {
          data = e.parameter;
        }
      } else {
        data = e.parameter;
      }
    }

    if (typeof data.reservations === "string") {
      try { data.reservations = JSON.parse(data.reservations); } catch(rErr){}
    }
    if (typeof data.previousReservations === "string") {
      try { data.previousReservations = JSON.parse(data.previousReservations); } catch(rErr){}
    }
    if (typeof data.clearedRowIndices === "string") {
      try { data.clearedRowIndices = JSON.parse(data.clearedRowIndices); } catch(rErr){}
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Ping / Test de conexión
    if (data.action === "ping") {
      var targetTabName = data.sheetTab || "${sheetTabName || 'Hoja 1'}";
      var resolvedSheet = findSheetByTab(ss, targetTabName);
      var allTabsList = ss.getSheets().map(function(s) { return s.getName(); });

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        status: "ok",
        activityType: "PICKLEBALL",
        message: "¡Conexión exitosa con Google Apps Script de Pickleball!",
        spreadsheetTitle: ss.getName(),
        tabSolicitada: targetTabName,
        tabEncontrada: resolvedSheet.getName(),
        todasLasPestañas: allTabsList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var targetTabName = data.sheetTab || "${sheetTabName || 'Hoja 1'}";
    var sheet = findSheetByTab(ss, targetTabName);

    // 2. Consulta de slots en vivo de Pickleball (action === "getSlots")
    if (data.action === "getSlots") {
      var maxR = sheet.getMaxRows();
      var maxC = sheet.getMaxColumns();
      var lastR = Math.min(sheet.getLastRow(), maxR);
      var slots = [];

      if (lastR >= 9 && maxC >= 7) {
        var numRows = lastR - 8;
        var cols = Math.min(10, maxC);
        var values = sheet.getRange(9, 1, numRows, cols).getValues();

        for (var i = 0; i < values.length; i++) {
          var rowNum = i + 9;
          var row = values[i];

          var colA_no = (row[0] || "").toString().trim();
          var colB_nombre = (row[1] || "").toString().trim();
          var colC_apellido = (row[2] || "").toString().trim();
          var colD_tipo = (row[3] || "").toString().trim();
          var colG_email = (row[6] || "").toString().trim();

          // Skip header if repeated
          if (colB_nombre.toUpperCase() === "NOMBRE" || colA_no.toUpperCase() === "NO.") {
            continue;
          }

          var normG = colG_email.toUpperCase();
          var hasParticipant = colB_nombre.length > 0 || colC_apellido.length > 0;
          var isReservedOrOccupied = normG.indexOf("RESERV") !== -1 || normG.indexOf("BLOQUE") !== -1 || normG.indexOf("OCUPAD") !== -1 || (colG_email.length > 0 && colG_email !== "-" && colG_email !== "LIBRE" && colG_email !== "DISPONIBLE");

          var isOccupied = hasParticipant || isReservedOrOccupied;
          var isBlocked = (normG.indexOf("RESERV") !== -1 || normG.indexOf("BLOQUE") !== -1) && !hasParticipant;

          slots.push({
            rowIndex: rowNum,
            citaNo: colA_no || String(slots.length + 1),
            timeSlot: "Lugar #" + (slots.length + 1),
            rawTime: "Lugar #" + (slots.length + 1),
            duration: "",
            therapistGender: "",
            isBlocked: isBlocked,
            isOccupied: isOccupied,
            participantName: colB_nombre,
            participantPaternal: colC_apellido,
            participantMaternal: colD_tipo,
            titularEmail: colG_email
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        activityType: "PICKLEBALL",
        tabName: sheet.getName(),
        slots: slots,
        totalCount: slots.length,
        availableCount: slots.filter(function(s) { return !s.isBlocked && !s.isOccupied; }).length,
        blockedCount: slots.filter(function(s) { return s.isBlocked; }).length,
        occupiedCount: slots.filter(function(s) { return s.isOccupied; }).length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Guardado / Liberación de reservaciones de Pickleball
    if (sheet.getMaxColumns() < 7) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 7 - sheet.getMaxColumns());
    }

    var reservations = data.reservations || [];
    if (!Array.isArray(reservations) && data.rowIndex) {
      reservations = [data];
    }

    var clearedRowIndices = data.clearedRowIndices || [];
    var titularEmail = normalizeText(data.titularEmail || "");
    var previousReservations = data.previousReservations || [];

    // Pre-escanear hoja para resolución inteligente de filas existentes
    var maxRowsScan = Math.max(sheet.getLastRow(), sheet.getMaxRows(), 9);
    var numScanRows = maxRowsScan >= 9 ? maxRowsScan - 8 : 1;
    var scanVals = sheet.getRange(9, 1, numScanRows, Math.min(7, sheet.getMaxColumns())).getValues();

    // 1. Resolver y proteger la fila de destino (targetRow) para cada reservación
    var newRowIndices = [];
    var resolvedReservations = [];

    for (var k = 0; k < reservations.length; k++) {
      var res = reservations[k];
      var targetRow = Number(res.rowIndex);
      var pFirst = normalizeText(res.personName || "");
      var pLast = normalizeText(res.paternalName || res.personLastName || "");
      var pFull = (pFirst + " " + pLast).trim();

      // Si no se proporcionó fila válida, buscar primero si esta persona o correo ya tiene una fila registrada
      if (!targetRow || targetRow < 9) {
        for (var sIdx = 0; sIdx < scanVals.length; sIdx++) {
          var checkRow = sIdx + 9;
          if (newRowIndices.indexOf(checkRow) !== -1) continue;

          var curB = normalizeText(scanVals[sIdx][1] || "");
          var curC = normalizeText(scanVals[sIdx][2] || "");
          var curG = normalizeText(scanVals[sIdx][6] || "");
          var curFull = (curB + " " + curC).trim();

          var matchEmail = titularEmail && curG && curG === titularEmail;
          var matchName = (pFull && curFull && (pFull === curFull || curFull.indexOf(pFull) !== -1 || pFull.indexOf(curFull) !== -1)) ||
                          (pFirst && pLast && curB === pFirst && curC === pLast);

          if (matchEmail || matchName) {
            targetRow = checkRow;
            break;
          }
        }

        // Si no tenía fila previa, buscar la primera fila libre desde la fila 9
        if (!targetRow) {
          for (var sIdx = 0; sIdx < scanVals.length; sIdx++) {
            var checkRow = sIdx + 9;
            if (newRowIndices.indexOf(checkRow) !== -1) continue;
            var curB = (scanVals[sIdx][1] || "").toString().trim();
            var curG = (scanVals[sIdx][6] || "").toString().trim();
            if (!curB && !curG) {
              targetRow = checkRow;
              break;
            }
          }
        }

        // Si todas las filas están llenas, asignar siguiente fila al final
        if (!targetRow) {
          targetRow = Math.max(sheet.getLastRow() + 1, 9);
        }
      }

      if (targetRow && targetRow >= 9) {
        newRowIndices.push(targetRow);
        resolvedReservations.push({
          res: res,
          targetRow: targetRow
        });
      }
    }

    // Nombres de participantes para limpieza
    var participantNamesToMatch = [];
    var allResToExtract = (reservations || []).concat(previousReservations || []);
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

    // Helper: Limpiar renglón en Pickleball (Col B, C, D, G)
    function clearPickleballRow(targetSht, rowNum) {
      if (rowNum && rowNum >= 9 && rowNum <= targetSht.getMaxRows()) {
        targetSht.getRange(rowNum, 2).setValue(""); // Col B: Nombre
        targetSht.getRange(rowNum, 3).setValue(""); // Col C: Apellido
        targetSht.getRange(rowNum, 4).setValue(""); // Col D: Tipo (Titular/Acompañante)
        targetSht.getRange(rowNum, 7).setValue(""); // Col G: Email Titular
        return 1;
      }
      return 0;
    }

    // Helper: Limpieza exhaustiva en hoja dada
    function cleanSheetByMatching(targetSht, protectRowIndices) {
      var count = 0;
      var lastR = Math.min(targetSht.getLastRow(), targetSht.getMaxRows());
      if (lastR < 9) return 0;
      var numRows = lastR - 8;
      var numCols = Math.min(10, targetSht.getMaxColumns());
      var vals = targetSht.getRange(9, 1, numRows, numCols).getValues();

      for (var rIdx = 0; rIdx < vals.length; rIdx++) {
        var rowNum = rIdx + 9;
        if (protectRowIndices && protectRowIndices.indexOf(rowNum) !== -1) {
          continue;
        }

        var rB = normalizeText(vals[rIdx][1] || "");
        var rC = normalizeText(vals[rIdx][2] || "");
        var rG = numCols >= 7 ? normalizeText(vals[rIdx][6] || "") : "";
        var fullN = (rB + " " + rC).trim();

        if (!rB && !rC && !rG) continue;

        var shouldClear = false;
        if (titularEmail && rG && rG === titularEmail) {
          shouldClear = true;
        }

        if (!shouldClear && fullN) {
          for (var p = 0; p < participantNamesToMatch.length; p++) {
            var pObj = participantNamesToMatch[p];
            if (pObj.full && (fullN === pObj.full || fullN.indexOf(pObj.full) !== -1 || pObj.full.indexOf(fullN) !== -1)) {
              shouldClear = true;
              break;
            }
            if (pObj.first && pObj.last && rB === pObj.first && rC === pObj.last) {
              shouldClear = true;
              break;
            }
          }
        }

        if (shouldClear) {
          targetSht.getRange(rowNum, 2).setValue(""); // Col B
          targetSht.getRange(rowNum, 3).setValue(""); // Col C
          targetSht.getRange(rowNum, 4).setValue(""); // Col D
          targetSht.getRange(rowNum, 7).setValue(""); // Col G
          count++;
        }
      }
      return count;
    }

    // A) Limpiar reservaciones previas en otras pestañas
    if (previousReservations && previousReservations.length > 0) {
      for (var pIdx = 0; pIdx < previousReservations.length; pIdx++) {
        var prevItem = previousReservations[pIdx];
        if (prevItem.sheetTab && prevItem.sheetTab !== sheet.getName()) {
          var prevSheet = findSheetByTab(ss, prevItem.sheetTab);
          if (prevSheet && prevSheet.getName() !== sheet.getName()) {
            if (prevItem.rowIndex) {
              clearedCount += clearPickleballRow(prevSheet, Number(prevItem.rowIndex));
            }
            clearedCount += cleanSheetByMatching(prevSheet, []);
          }
        }
      }
    }

    // B) Liberar renglones especificados (que no coincidan con las nuevas filas protegidas)
    for (var c = 0; c < clearedRowIndices.length; c++) {
      var rToClear = Number(clearedRowIndices[c]);
      if (newRowIndices.indexOf(rToClear) === -1) {
        clearedCount += clearPickleballRow(sheet, rToClear);
      }
    }

    // C) Limpieza exhaustiva en la pestaña actual
    clearedCount += cleanSheetByMatching(sheet, newRowIndices);

    // D) Escribir las nuevas reservaciones en formato Pickleball (Col B, C, D, G en MAYÚSCULAS)
    var updatedRows = [];
    for (var i = 0; i < resolvedReservations.length; i++) {
      var item = resolvedReservations[i];
      var res = item.res;
      var targetRow = item.targetRow;

      if (targetRow && targetRow >= 9) {
        if (targetRow > sheet.getMaxRows()) {
          sheet.insertRowsAfter(sheet.getMaxRows(), targetRow - sheet.getMaxRows() + 5);
        }

        var nameVal = (res.personName || "").toString().trim().toUpperCase();
        var patVal = (res.paternalName || res.personLastName || "").toString().trim().toUpperCase();
        var typeVal = res.personType === "minor" ? "MENOR" : (res.personType === "companion" ? "ACOMPAÑANTE" : "TITULAR");
        var emailContact = (res.titularEmail || titularEmail || "").toString().trim().toUpperCase();

        // Columna B (2): Nombre
        sheet.getRange(targetRow, 2).setValue(nameVal);
        // Columna C (3): Apellido
        sheet.getRange(targetRow, 3).setValue(patVal);
        // Columna D (4): Titular / Acompañante
        sheet.getRange(targetRow, 4).setValue(typeVal);
        // Columna G (7): Email del titular
        sheet.getRange(targetRow, 7).setValue(emailContact);

        updatedRows.push({
          row: targetRow,
          name: (nameVal + " " + patVal).trim(),
          type: typeVal,
          email: emailContact
        });
      }
    }

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      activityType: "PICKLEBALL",
      tabUsada: sheet.getName(),
      tabSolicitada: targetTabName,
      message: "Se registraron " + updatedRows.length + " lugar(es) de Pickleball y se liberaron " + clearedCount + " en Google Sheets.",
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
}
`;
}

export function generateMovieNightsAppsScriptCode(sheetTabName: string = "Hoja 1"): string {
  return generatePickleballAppsScriptCode(sheetTabName, "Movie Nights");
}

/**
 * Generate copy-pasteable Google Apps Script code for Google Sheets sync
 */
export function generateGoogleAppsScriptCode(sheetTabName: string = "Hoja 1", activityType: string = "SPA"): string {
  const normType = (activityType || "SPA").toUpperCase();
  if (normType === "GOLF") {
    return generateGolfAppsScriptCode(sheetTabName);
  }
  if (normType === "PICKLEBALL") {
    return generatePickleballAppsScriptCode(sheetTabName, "Pickleball");
  }
  if (normType === "BINGO") {
    return generatePickleballAppsScriptCode(sheetTabName, "Bingo");
  }
  if (normType === "MOVIE_NIGHTS" || normType === "MOVIE NIGHTS" || normType.includes("MOVIE")) {
    return generateMovieNightsAppsScriptCode(sheetTabName);
  }
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT PARA SINCRONIZACIÓN AUTOMÁTICA DE CITAS DE SPA
 * Convención Nacional de Distribuidores
 * =========================================================================
 * 
 * ESTRUCTURA DE COLUMNAS DE SPA (A partir de la Fila 9):
 * - Fila 9 en adelante: Citas de SPA
 * - Columna B (2): Nombre de la persona registrada (Titular o Acompañante)
 * - Columna C (3): Apellido Paterno
 * - Columna D (4): Apellido Materno
 * - Columna J (10) / Columna K (11): Horario de la Cita (ej. "09:00 - 10:00")
 * - Columna M (13): Género de Terapeuta ("Dama" / "Caballero")
 * - Columna P (16): Email del titular / RESERVADO (Indica si el espacio está reservado/bloqueado)
 * 
 * INSTRUCCIONES DE INSTALACIÓN / ACTUALIZACIÓN:
 * 1. En tu archivo de Google Sheets, abre el menú superior: Extensiones > Apps Script.
 * 2. Borra todo el código que aparezca en el editor y PEGA este script completo.
 * 3. En la esquina superior derecha, haz clic en el botón azul "Implementar" (Deploy) > "Nueva implementación" (New deployment)
 *    (o "Administrar implementaciones" > icono de lápiz/editar > "Nueva versión" si ya lo tenías implementado).
 *    - Tipo: "Aplicación web" (icono de engrane / Web app).
 *    - Descripción: "Sync SPA Convencion v8 - Renglón 9, Col B, C, D, J/K, M, P"
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
  if (e && e.parameter && (e.parameter.action || e.parameter.data)) {
    return handleRequest(e);
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    version: "v8-multiday-uppercase",
    message: "Google Apps Script Webhook activo y listo para sincronizar citas de Spa en vivo con soporte multi-día y mayúsculas."
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (t) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "El archivo de Google Sheets estaba ocupado procesando otra solicitud. Intenta de nuevo."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = e && e.postData ? e.postData.contents : "";
    var data = {};
    if (rawData) {
      try {
        data = JSON.parse(rawData);
      } catch (pErr) {
        data = {};
      }
    } else if (e && e.parameter) {
      if (e.parameter.data) {
        try {
          data = JSON.parse(e.parameter.data);
        } catch (dErr) {
          data = e.parameter;
        }
      } else {
        data = e.parameter;
      }
    }

    if (typeof data.reservations === "string") {
      try { data.reservations = JSON.parse(data.reservations); } catch(rErr){}
    }
    if (typeof data.previousReservations === "string") {
      try { data.previousReservations = JSON.parse(data.previousReservations); } catch(rErr){}
    }
    if (typeof data.clearedRowIndices === "string") {
      try { data.clearedRowIndices = JSON.parse(data.clearedRowIndices); } catch(rErr){}
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Ping / Test de conexión
    if (data.action === "ping") {
      var targetTabName = data.sheetTab || "${sheetTabName || 'Hoja 1'}";
      var resolvedSheet = findSheetByTab(ss, targetTabName);
      var allTabsList = ss.getSheets().map(function(s) { return s.getName(); });

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        status: "ok",
        message: "¡Conexión exitosa con Google Apps Script!",
        spreadsheetTitle: ss.getName(),
        tabSolicitada: targetTabName,
        tabEncontrada: resolvedSheet.getName(),
        todasLasPestañas: allTabsList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var targetTabName = data.sheetTab || "${sheetTabName || 'Hoja 1'}";
    var sheet = findSheetByTab(ss, targetTabName);

    // 2. Consulta de slots en vivo (action === "getSlots")
    if (data.action === "getSlots") {
      var maxR = sheet.getMaxRows();
      var maxC = sheet.getMaxColumns();
      var lastR = Math.min(sheet.getLastRow(), maxR);
      var slots = [];

      var lastKnownTime = "09:00 AM";
      var lastKnownDuration = "60 min";

      if (lastR >= 9 && maxC >= 10) {
        var numRows = lastR - 8;
        var cols = Math.min(16, maxC);
        var values = sheet.getRange(9, 1, numRows, cols).getValues();
        var displayValues = sheet.getRange(9, 1, numRows, cols).getDisplayValues();

        var isPlaceholderVal = function(v) {
          if (!v) return true;
          var str = v.toString().trim().toUpperCase();
          return !str || str === "-" || str === "LIBRE" || str === "DISPONIBLE" || str === "N/A" || str === "NA" || str === "0" || str === "FALSE" || str === "NINGUNA" || str === "NINGUNO" || str === "OK";
        };

        var isBlockVal = function(v) {
          if (!v) return false;
          var str = v.toString().trim().toUpperCase();
          return str.indexOf("BLOQUE") !== -1 || str.indexOf("RESERV") !== -1 || str.indexOf("OCUPAD") !== -1 || str.indexOf("STAFF") !== -1 || str.indexOf("NO DISPONIBLE") !== -1 || str.indexOf("CERRADO") !== -1;
        };

        var isNameVal = function(v) {
          if (!v) return false;
          var str = v.toString().trim().toUpperCase();
          if (isPlaceholderVal(str) || isBlockVal(str)) return false;
          if (str === "NOMBRE" || str === "TITULAR" || str === "APELLIDO" || str === "NOMBRE(S)" || str === "PARTICIPANTE" || str === "PATERNO" || str === "MATERNO") return false;
          return true;
        };

        var formatTimeHelper = function(val, displayVal) {
          // 1. PRIORIDAD MÁXIMA: Si displayVal tiene texto formateado visible en la celda (ej: "9:00 a.m.", "10:00 AM", "09:00"), extraerlo tal cual
          var dispStr = (displayVal !== null && displayVal !== undefined) ? displayVal.toString().trim() : "";
          if (dispStr && !isPlaceholderVal(dispStr)) {
            var dispClean = dispStr.replace(/\s*a\.?\s*m\.?/i, " AM").replace(/\s*p\.?\s*m\.?/i, " PM");
            var dMatch = dispClean.match(/\b(\d{1,2}):(\d{2})/);
            if (dMatch) {
              var dh = parseInt(dMatch[1], 10);
              var dm = parseInt(dMatch[2], 10);
              var dlower = dispClean.toLowerCase();
              var dperiod = "AM";
              if (dlower.indexOf("pm") !== -1 || dlower.indexOf("p.m.") !== -1 || dlower.indexOf("tarde") !== -1 || dlower.indexOf("noche") !== -1) {
                dperiod = "PM";
                if (dh < 12) dh += 12;
              } else if (dlower.indexOf("am") !== -1 || dlower.indexOf("a.m.") !== -1 || dlower.indexOf("mañana") !== -1) {
                dperiod = "AM";
                if (dh === 12) dh = 0;
              } else {
                if (dh >= 12 && dh <= 23) dperiod = "PM";
                else if (dh >= 7 && dh <= 11) dperiod = "AM";
                else if (dh >= 1 && dh <= 6) dperiod = "PM";
                else dperiod = "AM";
              }
              var dh12 = dh % 12 || 12;
              return (dh12 < 10 ? "0" + dh12 : dh12) + ":" + (dm < 10 ? "0" + dm : dm) + " " + dperiod;
            }
          }

          var target = dispStr || (val ? val.toString().trim() : "");
          if (!target || isPlaceholderVal(target)) return "";

          // 2. Si val es un objeto Date nativo de Apps Script (evitar desface horario usando Utilities.formatDate si está disponible o getHours)
          if (val instanceof Date) {
            try {
              var tz = (sheet && sheet.getParent) ? sheet.getParent().getSpreadsheetTimeZone() : Session.getScriptTimeZone();
              var formatted = Utilities.formatDate(val, tz, "hh:mm a");
              if (formatted) return formatted.toUpperCase();
            } catch(e) {}
            var h = val.getHours();
            var m = val.getMinutes();
            var period = h >= 12 ? "PM" : "AM";
            var h12 = h % 12 || 12;
            return (h12 < 10 ? "0" + h12 : h12) + ":" + (m < 10 ? "0" + m : m) + " " + period;
          }

          var clean = target.replace(/\s*a\.?\s*m\.?/i, " AM").replace(/\s*p\.?\s*m\.?/i, " PM");

          // 3. Fractional day e.g. 0.375
          if (!isNaN(Number(clean)) && Number(clean) > 0 && Number(clean) < 1) {
            var totalMins = Math.round(Number(clean) * 24 * 60);
            var fh = Math.floor(totalMins / 60);
            var fm = totalMins % 60;
            var fperiod = fh >= 12 ? "PM" : "AM";
            var fh12 = fh % 12 || 12;
            return (fh12 < 10 ? "0" + fh12 : fh12) + ":" + (fm < 10 ? "0" + fm : fm) + " " + fperiod;
          }

          // 4. Match HH:MM anywhere in string (e.g. "10:15", "10:15:00", "10:15 AM", "10:15 - 11:15")
          var mMatch = clean.match(/\b(\d{1,2}):(\d{2})/);
          if (mMatch) {
            var h = parseInt(mMatch[1], 10);
            var m = parseInt(mMatch[2], 10);
            var lower = clean.toLowerCase();
            var period = "AM";
            if (lower.indexOf("pm") !== -1 || lower.indexOf("p.m.") !== -1 || lower.indexOf("tarde") !== -1 || lower.indexOf("noche") !== -1) {
              period = "PM";
              if (h < 12) h += 12;
            } else if (lower.indexOf("am") !== -1 || lower.indexOf("a.m.") !== -1 || lower.indexOf("mañana") !== -1) {
              period = "AM";
              if (h === 12) h = 0;
            } else {
              if (h >= 12 && h <= 23) period = "PM";
              else if (h >= 7 && h <= 11) period = "AM";
              else if (h >= 1 && h <= 6) period = "PM"; // 1:00 PM to 6:00 PM for spa afternoon hours
              else period = "AM";
            }
            var h12 = h % 12 || 12;
            return (h12 < 10 ? "0" + h12 : h12) + ":" + (m < 10 ? "0" + m : m) + " " + period;
          }

          return "";
        };

        for (var i = 0; i < values.length; i++) {
          var rowNum = i + 9;
          var row = values[i];
          var displayRow = displayValues[i] || [];
          var rowJoined = row.join(" ").toUpperCase();
          
          // Skip any secondary header row
          if ((rowJoined.indexOf("CITA") !== -1 || rowJoined.indexOf("NOMBRE") !== -1 || rowJoined.indexOf("HORARIO") !== -1) && !/^\d+$/.test((row[0] || "").toString().trim())) {
            continue;
          }

          var colA_cita = (row[0] || "").toString().trim();
          var colB_nombre = (row[1] || "").toString().trim();
          var colC_paterno = (row[2] || "").toString().trim();
          var colD_materno = (row[3] || "").toString().trim();

          // Escaneo inteligente de Horario a lo largo de las columnas (Col J=9, I=8, K=10, H=7, G=6, L=11)
          var foundTime = "";
          var foundDur = "";

          // 1. Probar Columna J (Index 9)
          var t9 = formatTimeHelper(row[9], displayRow[9]);
          if (t9) {
            foundTime = t9;
            foundDur = (displayRow[10] || row[10] || "").toString().trim();
          }

          // 2. Probar Columna I (Index 8)
          if (!foundTime) {
            var t8 = formatTimeHelper(row[8], displayRow[8]);
            if (t8) {
              foundTime = t8;
              foundDur = (displayRow[9] || row[9] || "").toString().trim();
            }
          }

          // 3. Probar Columna K (Index 10)
          if (!foundTime) {
            var t10 = formatTimeHelper(row[10], displayRow[10]);
            if (t10) {
              foundTime = t10;
              foundDur = (displayRow[11] || row[11] || "").toString().trim();
            }
          }

          // 4. Probar cualquier otra columna de datos (G a L: 6 a 12)
          if (!foundTime) {
            for (var c = 6; c <= Math.min(12, cols - 1); c++) {
              var tc = formatTimeHelper(row[c], displayRow[c]);
              if (tc) {
                foundTime = tc;
                if (c + 1 < cols) {
                  foundDur = (displayRow[c + 1] || row[c + 1] || "").toString().trim();
                }
                break;
              }
            }
          }

          if (foundTime) {
            lastKnownTime = foundTime;
            if (foundDur && !isPlaceholderVal(foundDur)) lastKnownDuration = foundDur;
          }

          // Género Terapeuta: Escanear columnas M (12), L (11), N (13), K (10)
          var finalGender = "Dama";
          var candGender = "";
          for (var gCol = 10; gCol <= Math.min(14, cols - 1); gCol++) {
            var gVal = (displayRow[gCol] || row[gCol] || "").toString().trim().toLowerCase();
            if (gVal.match(/caballer|hombre|masculin|\bh\b/)) {
              candGender = "Caballero";
              break;
            } else if (gVal.match(/dama|mujer|femenin|\bd\b|\bm\b/)) {
              candGender = "Dama";
              break;
            }
          }
          if (candGender) {
            finalGender = candGender;
          }

          // Email o Bloqueo en Columna P (16) o Columna O (15) o Columna Q (17)
          var colP_val = cols >= 16 ? (displayRow[15] || row[15] || "").toString().trim() : "";
          var colO_val = cols >= 15 ? (displayRow[14] || row[14] || "").toString().trim() : "";
          var colQ_val = cols >= 17 ? (displayRow[16] || row[16] || "").toString().trim() : "";
          
          var emailOrBlockData = "";
          if (!isPlaceholderVal(colP_val)) {
            emailOrBlockData = colP_val;
          } else if (colO_val.indexOf("@") !== -1 || isBlockVal(colO_val)) {
            emailOrBlockData = colO_val;
          } else if (!isPlaceholderVal(colQ_val)) {
            emailOrBlockData = colQ_val;
          }

          var hasParticipant = isNameVal(colB_nombre) || isNameVal(colC_paterno);
          var hasEmailOrBlock = !isPlaceholderVal(emailOrBlockData);

          // Si el renglón no tiene número de cita, ni hora, ni nombre, ni datos, omitir
          if (!colA_cita && !foundTime && !hasParticipant && !hasEmailOrBlock && (cols < 12 || !row[12])) continue;

          var isBlocked = !hasParticipant && (isBlockVal(emailOrBlockData) || (hasEmailOrBlock && emailOrBlockData.indexOf("@") === -1));
          var isOccupied = hasParticipant || (hasEmailOrBlock && emailOrBlockData.indexOf("@") !== -1);

          slots.push({
            rowIndex: rowNum,
            citaNo: colA_cita || String(slots.length + 1),
            timeSlot: lastKnownTime + (lastKnownDuration ? " (" + lastKnownDuration + ")" : ""),
            rawTime: foundTime || lastKnownTime,
            duration: foundDur || lastKnownDuration,
            therapistGender: finalGender,
            isBlocked: isBlocked,
            isOccupied: isOccupied,
            participantName: colB_nombre,
            participantPaternal: colC_paterno,
            participantMaternal: colD_materno,
            titularEmail: emailOrBlockData
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
    var previousReservations = data.previousReservations || [];

    // Extraer renglones nuevos a ocupar
    var newRowIndices = [];
    for (var k = 0; k < reservations.length; k++) {
      if (reservations[k].rowIndex) {
        newRowIndices.push(Number(reservations[k].rowIndex));
      }
    }

    // Extraer nombres de participantes involucrados para limpieza exhaustiva
    var participantNamesToMatch = [];
    var allResToExtract = (reservations || []).concat(previousReservations || []);
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

    // Helper: Limpiar un renglón específico en una hoja dada
    function clearSpecificRow(targetSht, rowNum) {
      if (rowNum && rowNum >= 8 && rowNum <= targetSht.getMaxRows()) {
        targetSht.getRange(rowNum, 2).setValue("");  // Col B: Nombre
        targetSht.getRange(rowNum, 3).setValue("");  // Col C: Apellido Paterno
        targetSht.getRange(rowNum, 4).setValue("");  // Col D: Apellido Materno
        targetSht.getRange(rowNum, 15).setValue(""); // Col O: Email Titular / Bloqueo
        targetSht.getRange(rowNum, 16).setValue(""); // Col P: Email Titular / Bloqueo
        return 1;
      }
      return 0;
    }

    // Helper: Limpieza exhaustiva en una hoja dada por correo/participante
    function cleanSheetByMatching(targetSht, protectRowIndices) {
      var count = 0;
      var lastR = Math.min(targetSht.getLastRow(), targetSht.getMaxRows());
      if (lastR < 8) return 0;
      var numRows = lastR - 7;
      var numCols = Math.min(16, targetSht.getMaxColumns());
      var vals = targetSht.getRange(8, 1, numRows, numCols).getValues();

      for (var rIdx = 0; rIdx < vals.length; rIdx++) {
        var rowNum = rIdx + 8;
        if (protectRowIndices && protectRowIndices.indexOf(rowNum) !== -1) {
          continue;
        }

        var rB = normalizeText(vals[rIdx][1] || "");
        var rC = normalizeText(vals[rIdx][2] || "");
        var rO = numCols >= 15 ? normalizeText(vals[rIdx][14] || "") : "";
        var rP = numCols >= 16 ? normalizeText(vals[rIdx][15] || "") : "";
        var emailF = rP || rO;
        var fullN = (rB + " " + rC).trim();

        if (!rB && !rC && !emailF) continue;

        var shouldClear = false;
        if (titularEmail && emailF && emailF === titularEmail) {
          shouldClear = true;
        }

        if (!shouldClear && fullN) {
          for (var p = 0; p < participantNamesToMatch.length; p++) {
            var pObj = participantNamesToMatch[p];
            if (pObj.full && (fullN === pObj.full || fullN.indexOf(pObj.full) !== -1 || pObj.full.indexOf(fullN) !== -1)) {
              shouldClear = true;
              break;
            }
            if (pObj.first && pObj.last && rB === pObj.first && rC === pObj.last) {
              shouldClear = true;
              break;
            }
          }
        }

        if (shouldClear) {
          targetSht.getRange(rowNum, 2).setValue("");  // Col B
          targetSht.getRange(rowNum, 3).setValue("");  // Col C
          targetSht.getRange(rowNum, 4).setValue("");  // Col D
          targetSht.getRange(rowNum, 15).setValue(""); // Col O
          targetSht.getRange(rowNum, 16).setValue(""); // Col P
          count++;
        }
      }
      return count;
    }

    // A) Si hay reservaciones previas en OTRAS pestañas (cambio de día), limpiarlas en esas pestañas
    if (previousReservations && previousReservations.length > 0) {
      for (var pIdx = 0; pIdx < previousReservations.length; pIdx++) {
        var prevItem = previousReservations[pIdx];
        if (prevItem.sheetTab && prevItem.sheetTab !== sheet.getName()) {
          var prevSheet = findSheetByTab(ss, prevItem.sheetTab);
          if (prevSheet && prevSheet.getName() !== sheet.getName()) {
            if (prevItem.rowIndex) {
              clearedCount += clearSpecificRow(prevSheet, Number(prevItem.rowIndex));
            }
            clearedCount += cleanSheetByMatching(prevSheet, []);
          }
        }
      }
    }

    // B) Liberar renglones especificados explícitamente en la pestaña actual
    for (var c = 0; c < clearedRowIndices.length; c++) {
      clearedCount += clearSpecificRow(sheet, Number(clearedRowIndices[c]));
    }

    // C) Limpieza exhaustiva en la pestaña actual (evitando sobrescribir los nuevos slots)
    clearedCount += cleanSheetByMatching(sheet, newRowIndices);

    // D) Escribir las nuevas reservaciones en sus renglones correspondientes (TODO EN MAYÚSCULAS)
    var updatedRows = [];
    var maxSheetRows = sheet.getMaxRows();
    var lastRowNow = Math.min(sheet.getLastRow(), maxSheetRows);
    var colAData = [];
    if (lastRowNow >= 8) {
      colAData = sheet.getRange(8, 1, lastRowNow - 7, 1).getValues();
    }

    for (var i = 0; i < reservations.length; i++) {
      var res = reservations[i];
      var targetRow = 0;
      var targetCitaNo = (res.citaNo || "").toString().trim();
      var reqRow = Number(res.rowIndex);

      // Prioridad 1: Si reqRow viene especificado y es válido (>= 8), usar la fila exacta del slot seleccionado
      if (reqRow && reqRow >= 8) {
        targetRow = reqRow;
      }

      // Prioridad 2: Buscar en Columna A sólo si targetCitaNo es un número de cita explícito (NO una hora como 10:15)
      if (!targetRow && targetCitaNo && !targetCitaNo.includes(":") && colAData.length > 0) {
        var cleanCitaMatch = targetCitaNo.match(/^\\s*(?:Cita\\s*#?|No\\.?\\s*)?(\\d{1,3})\\s*$/i);
        var targetNum = cleanCitaMatch ? parseInt(cleanCitaMatch[1], 10) : null;

        if (targetNum !== null) {
          for (var rA = 0; rA < colAData.length; rA++) {
            var cellVal = (colAData[rA][0] || "").toString().trim();
            if (cellVal.includes(":")) continue; // Ignorar celdas con horas
            var cellNumMatch = cellVal.match(/^\\s*(?:Cita\\s*#?|No\\.?\\s*)?(\\d{1,3})\\s*$/i);
            var cellNum = cellNumMatch ? parseInt(cellNumMatch[1], 10) : null;

            if (cellVal === targetCitaNo || (cellNum !== null && cellNum === targetNum)) {
              targetRow = rA + 8; // Exact physical row in sheet
              break;
            }
          }
        }
      }

      // Prioridad 3: Si aún no se tiene fila pero se tiene citaNo numérica (Cita 1 -> Fila 9, Cita 2 -> Fila 10)
      if (!targetRow && targetCitaNo && !targetCitaNo.includes(":")) {
        var n = parseInt(targetCitaNo.replace(/\\D/g, ""), 10);
        if (!isNaN(n) && n > 0 && n < 500) {
          targetRow = n + 8;
        }
      }

      if (targetRow && targetRow >= 8) {
        // Expandir filas si el renglón excede el tamaño actual de la hoja
        if (targetRow > sheet.getMaxRows()) {
          sheet.insertRowsAfter(sheet.getMaxRows(), targetRow - sheet.getMaxRows() + 5);
        }

        // GUARDAR TODO EN MAYÚSCULAS
        var nameVal = (res.personName || "").toString().trim().toUpperCase();
        var patVal = (res.paternalName || "").toString().trim().toUpperCase();
        var matVal = (res.maternalName || "").toString().trim().toUpperCase();
        var emailContact = (res.titularEmail || titularEmail || "").toString().trim().toUpperCase();

        // Columna B (2): Nombre(s)
        sheet.getRange(targetRow, 2).setValue(nameVal);
        // Columna C (3): Apellido Paterno
        sheet.getRange(targetRow, 3).setValue(patVal);
        // Columna D (4): Apellido Materno
        sheet.getRange(targetRow, 4).setValue(matVal);
        // Columna O (15): Email / Bloqueo
        sheet.getRange(targetRow, 15).setValue(emailContact);
        // Columna P (16): Email / Bloqueo
        sheet.getRange(targetRow, 16).setValue(emailContact);

        updatedRows.push({
          row: targetRow,
          citaNo: res.citaNo || "",
          name: (nameVal + " " + patVal).trim(),
          email: emailContact
        });
      }
    }

    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      tabUsada: sheet.getName(),
      tabSolicitada: targetTabName,
      message: "Se grabaron " + updatedRows.length + " cita(s) en mayúsculas y se liberaron " + clearedCount + " slot(s) en la hoja de cálculo.",
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
}
`;
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


