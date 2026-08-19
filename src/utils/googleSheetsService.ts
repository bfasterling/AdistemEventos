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

      // Check if Column A has cita number (e.g. "1", "Cita 1", "Cita #1", "CITA 1")
      const citaNumMatch = colA_raw.match(/\d+/);
      const citaNumber = citaNumMatch ? parseInt(citaNumMatch[0], 10) : undefined;
      const isCitaRow = citaNumber !== undefined;

      // Header row detection: Only skip if explicitly header titles without cita number
      const isHeaderRow = !isCitaRow && (
        (colA_raw.toUpperCase() === "CITA" || colA_raw.toUpperCase() === "CITA NO." || colA_raw.toUpperCase() === "NO." || colA_raw.toUpperCase() === "NO") ||
        (colB_raw.toUpperCase() === "NOMBRE" || colB_raw.toUpperCase() === "NOMBRE(S)")
      );

      if (isHeaderRow) {
        continue;
      }

      // If neither a cita number is found and row number is less than 8, skip logos/titles
      if (!isCitaRow && rowNum < 8) continue;

      // Look for Horario in Col J (index 9), Col K (index 10), Col I (index 8), Col H (index 7)
      let foundTime = "";
      let foundDuration = "";

      const col9 = (row[9] || "").trim();
      const col10 = (row[10] || "").trim();
      const col8 = (row[8] || "").trim();
      const col7 = (row[7] || "").trim();
      const col11 = (row[11] || "").trim();

      if (col9.match(/\d|am|pm|date/i) && !col9.toLowerCase().includes("min") && !/^\$\d+/.test(col9)) {
        foundTime = col9;
        if (col10.match(/\d/i)) foundDuration = col10;
      } else if (col10.match(/\d|am|pm|date/i) && !col10.toLowerCase().includes("min")) {
        foundTime = col10;
        if (col11.match(/\d/i)) foundDuration = col11;
      } else if (col8.match(/\d|am|pm|date/i) && !/^\$\d+/.test(col8) && !col8.toLowerCase().includes("cargo")) {
        foundTime = col8;
        if (col9.match(/\d/i)) foundDuration = col9;
      } else if (col7.match(/\d|am|pm|date/i) && !/^\$\d+/.test(col7)) {
        foundTime = col7;
        if (col8.match(/\d/i)) foundDuration = col8;
      }

      // If time was found on this row, update our running lastKnownTime
      if (foundTime) {
        lastKnownTime = cleanTimeFormat(foundTime, foundDuration);
        if (foundDuration) lastKnownDuration = foundDuration;
      }

      // Look for Género Terapeuta in Col M (index 12), Col L (index 11), Col N (index 13)
      const col12 = (row[12] || "").trim();
      const col13 = (row[13] || "").trim();
      const colGenderCandidate = col12 || col13 || col11;
      const foundGender = normalizeTherapistGender(colGenderCandidate);

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
        return v.includes("BLOQUE") || v.includes("RESERV") || v.includes("OCUPAD") || v.includes("STAFF") || v.includes("NO DISPONIBLE") || v.includes("CERRADO");
      };

      // Col P or Col O containing ANY non-placeholder data triggers block/occupation
      const colP_hasData = !isPlaceholder(colP);
      const colO_hasData = !isPlaceholder(colO);
      const colN_block = !isPlaceholder(colN) && (colN.includes("@") || isExplicitBlock(colN));
      const colQ_block = !isPlaceholder(colQ) && (colQ.includes("@") || isExplicitBlock(colQ));

      const emailOrBlockData = colP_hasData ? colP : (colO_hasData ? colO : (colN_block ? colN : (colQ_block ? colQ : "")));

      const isParticipantName = (name: string) => {
        const n = name.trim().toUpperCase();
        return n && !isPlaceholder(n) && n !== "NOMBRE" && n !== "TITULAR" && n !== "APELLIDO" && !isExplicitBlock(n);
      };

      const hasParticipant = isParticipantName(colB_raw) || isParticipantName(colC_raw);
      const hasEmailOrData = Boolean(emailOrBlockData);

      // Check if this row is a valid appointment slot
      const hasSlotInfo = isCitaRow || foundTime !== "" || colGenderCandidate !== "" || hasEmailOrData || hasParticipant || (rowNum >= 8 && rowNum <= 100);

      if (hasSlotInfo) {
        // Regla: Bloqueado si la columna O o P tiene dato/email pero no hay nombre de participante registrado, o si tiene palabra explícita de bloqueo
        const isBlocked = (hasEmailOrData && !hasParticipant) || (hasEmailOrData && isExplicitBlock(emailOrBlockData));
        const isOccupied = hasParticipant || hasEmailOrData;

        // Exact physical row index calculation: Cita 1 corresponds to Row 9 in Google Sheets
        const finalRowIndex = isCitaRow && citaNumber ? (citaNumber + 8) : (rowNum >= 8 ? rowNum : rowNum + 8);
        const finalCitaNo = isCitaRow && citaNumber ? String(citaNumber) : (colA_raw || String(parsedSlots.length + 1));

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
): Promise<{ success: boolean; message: string; hasWebhook?: boolean; clearedCount?: number; error?: string }> {
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
 *    - Descripción: "Sync Reservaciones Convencion v8 - Mayúsculas y Limpieza Cruzada de Días"
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

      if (lastR >= 8 && maxC >= 10) {
        var numRows = lastR - 7;
        var cols = Math.min(16, maxC);
        var values = sheet.getRange(8, 1, numRows, cols).getValues();

        for (var i = 0; i < values.length; i++) {
          var rowNum = i + 8;
          var row = values[i];
          var rowJoined = row.join(" ").toUpperCase();
          
          // Skip header row
          if ((rowJoined.indexOf("CITA") !== -1 || rowJoined.indexOf("NOMBRE") !== -1 || rowJoined.indexOf("HORARIO") !== -1) && !/^\\d+$/.test((row[0] || "").toString().trim())) {
            continue;
          }

          var colA_cita = (row[0] || "").toString().trim();
          var colB_nombre = (row[1] || "").toString().trim();
          var colC_paterno = (row[2] || "").toString().trim();
          var colD_materno = (row[3] || "").toString().trim();

          // Detección flexible de Horario y Terapeuta
          var col9 = (row[9] || "").toString().trim();
          var col10 = (row[10] || "").toString().trim();
          var col8 = (row[8] || "").toString().trim();
          var col11 = (row[11] || "").toString().trim();
          var col12 = (row[12] || "").toString().trim();
          var col13 = (row[13] || "").toString().trim();

          var foundTime = "";
          var foundDur = "";

          if (col9.match(/\\d|am|pm|date/i) && col9.toLowerCase().indexOf("min") === -1 && !/^\\$\\d+/.test(col9)) {
            foundTime = col9;
            if (col10.match(/\\d/i)) foundDur = col10;
          } else if (col10.match(/\\d|am|pm|date/i) && col10.toLowerCase().indexOf("min") === -1) {
            foundTime = col10;
            if (col11.match(/\\d/i)) foundDur = col11;
          } else if (col8.match(/\\d|am|pm|date/i) && !/^\\$\\d+/.test(col8) && col8.toLowerCase().indexOf("cargo") === -1) {
            foundTime = col8;
            if (col9.match(/\\d/i)) foundDur = col9;
          }

          if (foundTime) {
            lastKnownTime = foundTime;
            if (foundDur) lastKnownDuration = foundDur;
          }

          // Género Terapeuta: estrictamente Dama o Caballero
          var candGender = (col12 || col13 || col11 || "").toLowerCase();
          var finalGender = "Dama";
          if (candGender.match(/caballer|hombre|masculin|\\bc\\b|\\bh\\b|\\bm\\b/)) {
            finalGender = "Caballero";
          }

          // Email o Bloqueo en Columna O (15) o Columna P (16)
          var colO_val = cols >= 15 ? (row[14] || "").toString().trim() : "";
          var colP_val = cols >= 16 ? (row[15] || "").toString().trim() : "";
          var emailOrBlockData = colP_val || colO_val;

          if (!colA_cita && !foundTime && !colB_nombre && !emailOrBlockData) continue;

          // Regla: Bloqueado/Ocupado si la columna O o P tiene un email o dato, o si hay nombre
          var hasEmailOrData = emailOrBlockData.length > 0;
          var hasParticipant = colB_nombre.length > 0 || colC_paterno.length > 0;
          var isBlocked = hasEmailOrData && !hasParticipant;
          var isOccupied = hasParticipant || hasEmailOrData;

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

      // Prioridad 1: Buscar la fila exacta en la Columna A que coincida con el número de Cita
      if (targetCitaNo && colAData.length > 0) {
        var targetNumMatch = targetCitaNo.match(/\\d+/);
        var targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null;

        for (var rA = 0; rA < colAData.length; rA++) {
          var cellVal = (colAData[rA][0] || "").toString().trim();
          var cellNumMatch = cellVal.match(/\\d+/);
          var cellNum = cellNumMatch ? parseInt(cellNumMatch[0], 10) : null;

          if (cellVal === targetCitaNo || (targetNum !== null && cellNum !== null && cellNum === targetNum)) {
            targetRow = rA + 8; // Exact physical row in sheet
            break;
          }
        }
      }

      // Prioridad 2: Si no se encontró por Columna A, usar rowIndex si es válido (>= 8)
      if (!targetRow && reqRow && reqRow >= 8) {
        targetRow = reqRow;
      }

      // Prioridad 3: Si aún no se tiene fila pero se tiene citaNo numérica (Cita 1 -> Fila 9, Cita 2 -> Fila 10)
      if (!targetRow && targetCitaNo) {
        var n = parseInt(targetCitaNo.replace(/\\D/g, ""), 10);
        if (!isNaN(n) && n > 0) {
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


