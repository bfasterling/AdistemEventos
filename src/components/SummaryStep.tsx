import React, { useState } from "react";
import { FileText, ChevronLeft, Save, CheckCircle, User, Users, ShieldAlert, Key, Plane, Sparkles, Clock, Calendar, Eye, DollarSign, Landmark } from "lucide-react";
import { jsPDF } from "jspdf";
import { ActivityReservationDetail } from "../types";
import { getCuotasSaldoForGroup, formatCuotaCurrency } from "../data/cuotasData";
import CancellationPolicyModal from "./CancellationPolicyModal";
import ExtraCostsModal from "./ExtraCostsModal";
import BankDepositModal from "./BankDepositModal";

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

interface SummaryStepProps {
  t: any;
  isDarkMode: boolean;
  draftSuccess: boolean;
  carnetTipoHabitacion: string;
  configuracionHabitacion: string;
  nochesAdicionales: number;
  requerimientosAdicionales: string;
  calculateTotalHotelCost: () => number;
  nombreTitular: string;
  apellidosTitular: string;
  grupo: string;
  distribuidora: string;
  correoTitular: string;
  celularTitular: string;
  alergiasTitular: string;
  sexo: string;
  hasCompanion: boolean;
  companionsList: Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    sex?: string;
    allergies: string;
    vueloLlegadaAerolinea?: string;
    vueloLlegadaNoVuelo?: string;
    vueloLlegadaFecha?: string;
    vueloLlegadaHora?: string;
    vueloRegresoAerolinea?: string;
    vueloRegresoNoVuelo?: string;
    vueloRegresoFecha?: string;
    vueloRegresoHora?: string;
    selectedActivities?: string[];
    vueloLlegadaPasajeros?: string[];
    vueloRegresoPasajeros?: string[];
  }>;
  numMinors: number;
  minors: Array<{ name: string; lastName: string; age: number; allergies: string; tipo?: 'adult' | 'minor'; parentezco?: string }>;
  hasFlights: boolean;
  vuelosSeparados: boolean;
  vueloLlegadaAerolinea: string;
  vueloLlegadaNoVuelo: string;
  vueloLlegadaFecha: string;
  vueloLlegadaHora: string;
  vueloRegresoAerolinea: string;
  vueloRegresoNoVuelo: string;
  vueloRegresoFecha: string;
  vueloRegresoHora: string;
  selectedActivities: string[];
  activityReservations?: ActivityReservationDetail[];
  DataStore: any;
  handlePrev: () => void;
  handleSaveDraft: () => void;
  handleSaveRegistration: () => void;
  loggedGuest: any;
  activeAccessUser?: any;
  vueloLlegadaPasajerosTitular?: string[];
  vueloRegresoPasajerosTitular?: string[];
}

const formatDateDMY = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  let trimmed = String(dateStr || "").trim();
  if (trimmed === "N/A" || !trimmed) return "N/A";

  // Sanitize legacy November 15 default dates if present
  if (trimmed.includes("2026-11-15") || trimmed === "15/11/2026" || trimmed === "15/11/26") {
    trimmed = "2026-11-04";
  }

  const parts = trimmed.split("-");
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1];
    let d = parts[2];
    let dNum = parseInt(d, 10);
    if (m === "11" && (dNum < 4 || dNum > 11)) {
      d = "04";
      dNum = 4;
    }
    const monthNames: Record<string, string> = {
      "11": "Noviembre",
      "10": "Octubre",
      "12": "Diciembre"
    };
    const monthName = monthNames[m] || "Noviembre";
    return `${dNum} de ${monthName} de ${y}`;
  }
  return trimmed;
};

const MONTH_NORM: Record<string, string> = {
  ene: "Ene",
  enero: "Ene",
  jan: "Ene",
  january: "Ene",
  feb: "Feb",
  febrero: "Feb",
  february: "Feb",
  mar: "Mar",
  marzo: "Mar",
  march: "Mar",
  abr: "Abr",
  abril: "Abr",
  apr: "Abr",
  april: "Abr",
  may: "May",
  mayo: "May",
  jun: "Jun",
  junio: "Jun",
  june: "Jun",
  jul: "Jul",
  julio: "Jul",
  july: "Jul",
  ago: "Ago",
  agosto: "Ago",
  aug: "Ago",
  august: "Ago",
  sep: "Sep",
  sept: "Sep",
  septiembre: "Sep",
  september: "Sep",
  oct: "Oct",
  octubre: "Oct",
  october: "Oct",
  nov: "Nov",
  noviembre: "Nov",
  november: "Nov",
  dic: "Dic",
  diciembre: "Dic",
  dec: "Dic",
  december: "Dic"
};

const standardizeDateString = (rawStr?: string): string => {
  if (!rawStr) return "";
  let text = String(rawStr).trim();
  if (!text) return "";

  // 1. Convert ISO dates like 2026-11-08 to "8 Nov"
  text = text.replace(/\b(\d{4})-(\d{2})-(\d{2})(?:T.*)?\b/g, (_match, _y, m, d) => {
    const monthIndex = parseInt(m, 10);
    const dayNum = parseInt(d, 10);
    const monthNames = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthAbbr = monthNames[monthIndex] || m;
    return `${dayNum} ${monthAbbr}`;
  });

  // 2. Month-first patterns like "Nov 8", "Noviembre 8", "Nov. 8", "Nov 08", "Nov 8th", "Nov, 8", "Nov 8, 2026" -> "8 Nov"
  const monthFirstRegex = /\b(Ene(?:ro)?|Feb(?:rero)?|Mar(?:zo)?|Abr(?:il)?|May(?:o)?|Jun(?:io)?|Jul(?:io)?|Ago(?:sto)?|Sep(?:t|tiembre)?|Oct(?:ubre)?|Nov(?:iembre)?|Dic(?:iembre)?|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.,]?\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?\b/gi;
  text = text.replace(monthFirstRegex, (_match, mStr, dStr) => {
    const normM = MONTH_NORM[mStr.toLowerCase()] || mStr;
    const dayNum = parseInt(dStr, 10);
    return `${dayNum} ${normM}`;
  });

  // 3. Day-first patterns like "08 Nov", "8 de Noviembre", "8 de Nov", "8 Noviembre", "8th Nov" -> "8 Nov"
  const dayFirstRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:de\s+)?(Ene(?:ro)?|Feb(?:rero)?|Mar(?:zo)?|Abr(?:il)?|May(?:o)?|Jun(?:io)?|Jul(?:io)?|Ago(?:sto)?|Sep(?:t|tiembre)?|Oct(?:ubre)?|Nov(?:iembre)?|Dic(?:iembre)?|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.,]?(?:\s*,\s*\d{4}|\s+\d{4})?\b/gi;
  text = text.replace(dayFirstRegex, (_match, dStr, mStr) => {
    const normM = MONTH_NORM[mStr.toLowerCase()] || mStr;
    const dayNum = parseInt(dStr, 10);
    return `${dayNum} ${normM}`;
  });

  // 4. Normalize separators like " - ", " -- ", " — ", etc.
  text = text.replace(/\s*[-–—]{1,4}\s*/g, " — ");

  return text.trim();
};

const cleanRepeatedDateText = (str?: string): string => {
  if (!str) return "";
  let trimmed = standardizeDateString(str);
  if (!trimmed) return "";

  // Split on dash/hyphen/slash/al/a separators (including multiple dashes like -- or ---)
  const sepRegex = /\s*(?:[—–-]|\bal\b|\ba\b|\/)\s*/i;
  const parts = trimmed.split(sepRegex).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const normParts = parts.map(p => standardizeDateString(p).toLowerCase().replace(/\s+/g, " "));
    const allSame = normParts.every(p => p === normParts[0]);
    if (allSame) {
      return parts[0];
    }
  }

  // Check if string contains duplicate pattern like "X — X"
  const doubleDashMatch = trimmed.match(/^(.+?)\s*(?:[—–-])\s*(.+?)$/);
  if (doubleDashMatch) {
    const p1 = standardizeDateString(doubleDashMatch[1]);
    const p2 = standardizeDateString(doubleDashMatch[2]);
    if (p1.toLowerCase().replace(/\s+/g, " ") === p2.toLowerCase().replace(/\s+/g, " ")) {
      return p1;
    }
  }

  return trimmed;
};

const formatActivityDateDisplay = (act?: any): string => {
  if (!act) return "";
  let datePart = cleanRepeatedDateText(act.eventDay || "");
  
  if (!datePart && act.daysConfig && act.daysConfig.length > 0) {
    if (act.daysConfig.length === 1) {
      datePart = cleanRepeatedDateText(act.daysConfig[0].label || act.daysConfig[0].date || "");
    } else {
      datePart = act.daysConfig.map((d: any) => cleanRepeatedDateText(d.label || d.date)).filter(Boolean).join(" / ");
    }
  }

  const rawTime = (act.timeRange || act.dateTime || "").trim();
  const timePart = cleanRepeatedDateText(rawTime);

  const normDate = datePart.toLowerCase().replace(/\s+/g, " ").trim();
  const normTime = timePart.toLowerCase().replace(/\s+/g, " ").trim();

  if (datePart && timePart) {
    if (normDate === normTime) {
      return datePart;
    }
    if (normTime.includes(normDate)) {
      return timePart;
    }
    if (normDate.includes(normTime)) {
      return datePart;
    }
    return `${datePart} ${timePart}`;
  }
  return datePart || timePart || "";
};

const formatActivityReservationDetail = (res?: any, act?: any): string => {
  const isGolf = act && ((act.type && act.type.toUpperCase() === "GOLF") || (act.name && act.name.toUpperCase().includes("GOLF")));
  const golfDetail = (isGolf && res)
    ? (res.golfOwnClubs ? " • Bastones: Propios" : ` • Bastones: Préstamo (${res.golfHand || 'Derecho'}, Varilla ${res.golfShaft || 'Regular'})`)
    : '';

  if (!res) {
    return formatActivityDateDisplay(act);
  }

  const cleanDay = cleanRepeatedDateText(res.dayLabel);
  const rawSlot = cleanRepeatedDateText(res.slotTime || "");
  const normDay = cleanDay.toLowerCase().replace(/\s+/g, " ").trim();
  const normSlot = rawSlot.toLowerCase().replace(/\s+/g, " ").trim();

  let mainTime = "";
  if (cleanDay && rawSlot) {
    if (normDay === normSlot || normSlot === "lugar asignado" || normSlot === "confirmado") {
      mainTime = cleanDay;
    } else if (normSlot.startsWith(normDay)) {
      mainTime = rawSlot;
    } else {
      mainTime = `${cleanDay} — ${rawSlot}`;
    }
  } else {
    mainTime = cleanDay || rawSlot || formatActivityDateDisplay(act) || "Confirmado";
  }

  mainTime = cleanRepeatedDateText(mainTime);

  const therapist = res.therapistGender ? ` • Terapeuta: ${res.therapistGender}` : "";
  return `${mainTime}${therapist}${golfDetail}`;
};

const formatActivityReservationDetailPDF = (res?: any, act?: any): string => {
  const isGolf = act && ((act.type && act.type.toUpperCase() === "GOLF") || (act.name && act.name.toUpperCase().includes("GOLF")));
  const golfDetail = (isGolf && res)
    ? (res.golfOwnClubs ? " - Bastones: Propios" : ` - Bastones: Préstamo (${res.golfHand || 'Derecho'}, Varilla ${res.golfShaft || 'Regular'})`)
    : '';

  if (!res) {
    return formatActivityDateDisplay(act) || "Confirmado";
  }

  const cleanDay = cleanRepeatedDateText(res.dayLabel);
  const rawSlot = cleanRepeatedDateText(res.slotTime || "");
  const normDay = cleanDay.toLowerCase().replace(/\s+/g, " ").trim();
  const normSlot = rawSlot.toLowerCase().replace(/\s+/g, " ").trim();

  let mainTime = "";
  if (cleanDay && rawSlot) {
    if (normDay === normSlot || normSlot === "lugar asignado" || normSlot === "confirmado") {
      mainTime = cleanDay;
    } else if (normSlot.startsWith(normDay)) {
      mainTime = rawSlot;
    } else {
      mainTime = `${cleanDay} - ${rawSlot}`;
    }
  } else {
    mainTime = cleanDay || rawSlot || formatActivityDateDisplay(act) || "Confirmado";
  }

  mainTime = cleanRepeatedDateText(mainTime);

  const therapist = res.therapistGender ? ` - Terapeuta: ${res.therapistGender}` : "";
  return `${mainTime}${therapist}${golfDetail}`;
};

export default function SummaryStep({
  t,
  isDarkMode,
  draftSuccess,
  carnetTipoHabitacion,
  configuracionHabitacion,
  nochesAdicionales,
  requerimientosAdicionales,
  nombreTitular,
  apellidosTitular,
  grupo,
  distribuidora,
  correoTitular,
  celularTitular,
  alergiasTitular,
  sexo,
  hasCompanion,
  companionsList,
  numMinors,
  minors,
  hasFlights,
  vuelosSeparados,
  vueloLlegadaAerolinea,
  vueloLlegadaNoVuelo,
  vueloLlegadaFecha,
  vueloLlegadaHora,
  vueloRegresoAerolinea,
  vueloRegresoNoVuelo,
  vueloRegresoFecha,
  vueloRegresoHora,
  selectedActivities = [],
  activityReservations = [],
  DataStore,
  handlePrev,
  handleSaveDraft,
  handleSaveRegistration,
  loggedGuest,
  activeAccessUser,
  vueloLlegadaPasajerosTitular,
  vueloRegresoPasajerosTitular
}: SummaryStepProps) {
  
  const isDoble = !!carnetTipoHabitacion && carnetTipoHabitacion.toLowerCase().includes("doble");
  const isQueenQueen = !!configuracionHabitacion && configuracionHabitacion.toLowerCase().includes("queen");
  const isDobleQueenQueen = isDoble && isQueenQueen;

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showCancellationPolicyModal, setShowCancellationPolicyModal] = useState(false);
  const [showExtraCostsModal, setShowExtraCostsModal] = useState(false);
  const [showBankDepositModal, setShowBankDepositModal] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF("p", "pt", "a4");
      
      // Override doc.text to automatically convert all printed text to uppercase
      const originalText = doc.text;
      doc.text = function (this: any, text: any, x: any, y: any, options?: any) {
        let uppercasedText = text;
        if (typeof text === "string") {
          uppercasedText = text.toUpperCase();
        } else if (Array.isArray(text)) {
          uppercasedText = text.map(t => typeof t === "string" ? t.toUpperCase() : t);
        }
        return originalText.call(this, uppercasedText, x, y, options);
      } as any;
      
      // Load logo
      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await loadImage("/assets/Logo_convencion_reducido.png");
      } catch (err) {
        console.error("No se pudo cargar el logo para el PDF", err);
      }
      
      let y = 110;
      
      const checkPageOverflow = (neededHeight: number) => {
        if (y + neededHeight > 760) {
          doc.addPage();
          drawHeader(false);
        }
      };

      const drawHeader = (isFirstPage: boolean) => {
        if (isFirstPage) {
          if (logoImg) {
            try {
              doc.addImage(logoImg, "PNG", 40, 35, 100, 42);
            } catch (e) {
              console.error("Error drawing image in pdf", e);
            }
          } else {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(86, 183, 169);
            doc.text("ADISTEM", 40, 60);
          }
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(86, 183, 169);
          doc.text("CONVENCIÓN ADISTEM 2026", 160, 52);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text("Resumen Oficial de Registro", 160, 68);
          
          doc.setDrawColor(86, 183, 169);
          doc.setLineWidth(1.5);
          doc.line(40, 90, 555, 90);
          y = 110;
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(86, 183, 169);
          doc.text("CONVENCIÓN ADISTEM 2026", 40, 40);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text("Resumen de Registro", 555, 40, { align: "right" });
          
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.line(40, 45, 555, 45);
          y = 65;
        }
      };

      const drawSectionHeader = (title: string) => {
        checkPageOverflow(45);
        y += 10;
        doc.setFillColor(86, 183, 169);
        doc.rect(40, y, 515, 18, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text(title.toUpperCase(), 50, y + 12);
        y += 28;
      };

      const drawKeyValueRow = (label1: string, val1: string, label2?: string, val2?: string) => {
        checkPageOverflow(16);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(label1, 45, y);
        
        const label1Width = doc.getTextWidth(label1.toUpperCase());
        const val1X = Math.max(140, 45 + label1Width + 8);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        const val1Text = String(val1 || "N/A");
        doc.text(val1Text, val1X, y);
        
        if (label2 && val2 !== undefined) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(label2, 310, y);
          
          const label2Width = doc.getTextWidth(label2.toUpperCase());
          const val2X = Math.max(420, 310 + label2Width + 8);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          const val2Text = String(val2 || "N/A");
          doc.text(val2Text, val2X, y);
        }
        y += 15;
      };

      const drawTextAreaBlock = (label: string, text: string) => {
        if (!text) return;
        checkPageOverflow(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(label, 45, y);
        y += 12;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        
        const lines = doc.splitTextToSize(text, 500);
        for (const line of lines) {
          checkPageOverflow(13);
          doc.text(line, 50, y);
          y += 11;
        }
        y += 4;
      };

      // Draw first page header
      drawHeader(true);

      // Section 1: Titular y Hospedaje
      drawSectionHeader("1. Datos del Titular y Hospedaje");
      drawKeyValueRow("Nombre Completo:", `${nombreTitular} ${apellidosTitular}`, "Sexo:", sexo === "M" ? "Masculino" : "Femenino");
      drawKeyValueRow("Grupo:", grupo, "Razón Social:", distribuidora);
      drawKeyValueRow("Correo:", correoTitular, "Celular:", celularTitular);
      if (alergiasTitular) {
        drawKeyValueRow("Alergias / Restricciones:", alergiasTitular);
      }
      
      y += 6;
      checkPageOverflow(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Detalles de Hospedaje Sede", 45, y);
      y += 12;
      
      drawKeyValueRow("Tipo de carnet:", carnetTipoHabitacion, "Configuración de cama:", configuracionHabitacion);
      drawKeyValueRow("Noches adicionales:", `${nochesAdicionales || 0} noche(s)`);
      if (requerimientosAdicionales) {
        drawTextAreaBlock("Requerimientos especiales / Comentarios:", requerimientosAdicionales);
      }

      // Section 2: Acompañantes y Menores
      if (hasCompanion || numMinors > 0) {
        drawSectionHeader("2. Acompañantes y Menores");
        if (hasCompanion && companionsList.length > 0) {
          const comp = companionsList[0];
          checkPageOverflow(15);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text("Acompañante Adulto", 45, y);
          y += 12;
          drawKeyValueRow("Nombre completo:", `${comp.firstName} ${comp.lastName}`, "Sexo:", comp.sex === "M" ? "Masculino" : "Femenino");
          drawKeyValueRow("Parentesco:", comp.relationship);
          drawKeyValueRow("Alergias / Restricciones:", comp.allergies || "Ninguna");
          y += 6;
        }
        
        if (numMinors > 0 && minors.length > 0) {
          checkPageOverflow(15);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(isDobleQueenQueen ? `Acompañantes Adicionales (${numMinors} registrado(s))` : `Menores de edad (${numMinors} registrado(s))`, 45, y);
          y += 12;
          minors.slice(0, numMinors).forEach((m, idx) => {
            const mName = (m.name || m.lastName) ? `${m.name || ""} ${m.lastName || ""}`.trim() : (isDobleQueenQueen ? `Adicional #${idx + 1}` : `Menor #${idx + 1}`);
            const isAdult = m.tipo === "adult";
            const condLabel = isAdult 
              ? "Adulto" 
              : `${m.parentezco ? `${m.parentezco}, ` : ""}${m.age === 0 ? "0-11 meses" : `${m.age} años`}${m.age >= 12 ? " (Plan adulto)" : ""}`;
            drawKeyValueRow(isDobleQueenQueen ? `Adicional #${idx + 1}:` : `Menor #${idx + 1}:`, mName, "Condición / Edad:", condLabel);
            if (m.allergies) {
              drawKeyValueRow("Alergias / Restricciones:", m.allergies);
            }
          });
        }
      }

      // Section 3: Vuelos
      drawSectionHeader("3. Itinerario de Vuelos");
      if (!hasFlights) {
        checkPageOverflow(20);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text("No se ha registrado itinerario de vuelos.", 45, y);
        y += 15;
      } else {
        if (!vuelosSeparados) {
          const isLlegadaTerrestre = (vueloLlegadaAerolinea || "Terrestre") === "Terrestre";
          const isRegresoTerrestre = (vueloRegresoAerolinea || "Terrestre") === "Terrestre";
          
          checkPageOverflow(15);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(86, 183, 169);
          doc.text("Itinerario de Vuelos Unificado", 45, y);
          y += 12;
          
          drawKeyValueRow("Llegada Vía:", vueloLlegadaAerolinea || "Terrestre", isLlegadaTerrestre ? "" : "No. Vuelo Llegada:", isLlegadaTerrestre ? "" : vueloLlegadaNoVuelo);
          drawKeyValueRow("Fecha Llegada:", formatDateDMY(vueloLlegadaFecha), "Hora Llegada:", vueloLlegadaHora || "N/A");
          
          y += 4;
          drawKeyValueRow("Regreso Vía:", vueloRegresoAerolinea || "Terrestre", isRegresoTerrestre ? "" : "No. Vuelo Regreso:", isRegresoTerrestre ? "" : vueloRegresoNoVuelo);
          drawKeyValueRow("Fecha Regreso:", formatDateDMY(vueloRegresoFecha), "Hora Regreso:", vueloRegresoHora || "N/A");
          
          y += 4;
          checkPageOverflow(25);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text("Pasajeros en este itinerario:", 45, y);
          y += 12;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          const passengersStr = [
            getPassengerName("titular"),
            ...companionsList.map(c => getPassengerName(c.id)),
            ...minors.slice(0, numMinors).map((m, idx) => getPassengerName(`M-${idx + 1}`))
          ].join(", ");
          
          const passLines = doc.splitTextToSize(passengersStr, 500);
          for (const line of passLines) {
            checkPageOverflow(14);
            doc.text(line, 50, y);
            y += 12;
          }
          y += 4;
          
        } else {
          checkPageOverflow(15);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(86, 183, 169);
          doc.text("Itinerarios de Vuelo Separados", 45, y);
          y += 12;

          // Titular flight summary
          checkPageOverflow(50);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`Titular: ${nombreTitular} ${apellidosTitular}`, 45, y);
          y += 11;
          
          const isLlegadaT = (vueloLlegadaAerolinea || "Terrestre") === "Terrestre";
          const isRegresoT = (vueloRegresoAerolinea || "Terrestre") === "Terrestre";
          
          drawKeyValueRow("Llegada:", isLlegadaT ? "Terrestre" : `${vueloLlegadaAerolinea} (${vueloLlegadaNoVuelo})`, "Regreso:", isRegresoT ? "Terrestre" : `${vueloRegresoAerolinea} (${vueloRegresoNoVuelo})`);
          drawKeyValueRow("Fecha/Hora Llegada:", `${formatDateDMY(vueloLlegadaFecha)} - ${vueloLlegadaHora || "N/A"}`, "Fecha/Hora Regreso:", `${formatDateDMY(vueloRegresoFecha)} - ${vueloRegresoHora || "N/A"}`);
          
          // Minors with titular if any
          const arrMinorsTitular = vueloLlegadaPasajerosTitular ? vueloLlegadaPasajerosTitular.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ") : "";
          const depMinorsTitular = vueloRegresoPasajerosTitular ? vueloRegresoPasajerosTitular.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ") : "";
          if (arrMinorsTitular || depMinorsTitular) {
            drawKeyValueRow("Menores Llegada:", arrMinorsTitular || "Ninguno", "Menores Regreso:", depMinorsTitular || "Ninguno");
          }
          y += 6;

          // Companions flight summaries
          if (hasCompanion && companionsList.length > 0) {
            companionsList.forEach(comp => {
              checkPageOverflow(50);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8);
              doc.setTextColor(100, 116, 139);
              doc.text(`Acompañante: ${comp.firstName} ${comp.lastName}`, 45, y);
              y += 11;
              
              const cLlegadaT = (comp.vueloLlegadaAerolinea || "Terrestre") === "Terrestre";
              const cRegresoT = (comp.vueloRegresoAerolinea || "Terrestre") === "Terrestre";
              
              drawKeyValueRow("Llegada:", cLlegadaT ? "Terrestre" : `${comp.vueloLlegadaAerolinea} (${comp.vueloLlegadaNoVuelo})`, "Regreso:", cRegresoT ? "Terrestre" : `${comp.vueloRegresoAerolinea} (${comp.vueloRegresoNoVuelo})`);
              drawKeyValueRow("Fecha/Hora Llegada:", `${formatDateDMY(comp.vueloLlegadaFecha)} - ${comp.vueloLlegadaHora || "N/A"}`, "Fecha/Hora Regreso:", `${formatDateDMY(comp.vueloRegresoFecha)} - ${comp.vueloRegresoHora || "N/A"}`);
              
              const arrMinorsComp = comp.vueloLlegadaPasajeros ? comp.vueloLlegadaPasajeros.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ") : "";
              const depMinorsComp = comp.vueloRegresoPasajeros ? comp.vueloRegresoPasajeros.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ") : "";
              if (arrMinorsComp || depMinorsComp) {
                drawKeyValueRow("Menores Llegada:", arrMinorsComp || "Ninguno", "Menores Regreso:", depMinorsComp || "Ninguno");
              }
              y += 6;
            });
          }
        }
      }

      // Section: Actividades
      const allActivitiesList = DataStore?.getActivities ? DataStore.getActivities() : [];
      const hasAnyActivities = selectedActivities.length > 0 || (hasCompanion && companionsList.some(c => c.selectedActivities && c.selectedActivities.length > 0));

      if (hasAnyActivities) {
        drawSectionHeader("Actividades");

        // Titular activities
        if (selectedActivities.length > 0) {
          checkPageOverflow(30);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(86, 183, 169);
          doc.text(`Titular: ${nombreTitular} ${apellidosTitular}`, 45, y);
          y += 11;

          selectedActivities.forEach(actId => {
            const act = allActivitiesList.find((a: any) => a.id === actId);
            const res = activityReservations?.find(r => r.activityId === actId && (r.personId === "titular" || r.personType === "titular"));
            const actTitle = act ? (act.name || act.title) : actId;
            const slotInfo = formatActivityReservationDetailPDF(res, act);

            drawKeyValueRow("Actividad:", actTitle, "Horario / Slot:", slotInfo || "Confirmado");
          });
          y += 6;
        }

        // Companion activities
        if (hasCompanion && companionsList.length > 0) {
          companionsList.forEach(comp => {
            if (comp.selectedActivities && comp.selectedActivities.length > 0) {
              checkPageOverflow(30);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8);
              doc.setTextColor(86, 183, 169);
              doc.text(`Acompañante: ${comp.firstName} ${comp.lastName}`, 45, y);
              y += 11;

              comp.selectedActivities.forEach(actId => {
                const act = allActivitiesList.find((a: any) => a.id === actId);
                const res = activityReservations?.find(r => r.activityId === actId && (r.personId === comp.id || (r.personType === "companion" && r.personName?.toLowerCase() === comp.firstName?.toLowerCase())));
                const actTitle = act ? (act.name || act.title) : actId;
                const slotInfo = formatActivityReservationDetailPDF(res, act);

                drawKeyValueRow("Actividad:", actTitle, "Horario / Slot:", slotInfo || "Confirmado");
              });
              y += 6;
            }
          });
        }
      }

      // Section 4: Saldo Cuotas
      const cuotasInfoPDF = getCuotasSaldoForGroup(grupo);
      drawSectionHeader("4. Saldo Cuotas");
      checkPageOverflow(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(10, 46, 101);
      doc.text(`Saldo de cuotas disponibles al 31 de Agosto 2026 para el grupo : ${grupo || "Sin especificar"}`, 45, y);
      y += 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(86, 183, 169);
      doc.text(`Monto Total Disponible: ${formatCuotaCurrency(cuotasInfoPDF.total)}`, 45, y);
      y += 12;

      if (cuotasInfoPDF.items.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        cuotasInfoPDF.items.forEach(it => {
          checkPageOverflow(12);
          doc.text(`• ${it.razonSocial}: ${formatCuotaCurrency(it.cuota)}`, 55, y);
          y += 10;
        });
      }
      y += 6;

      // Section 5: Política de Cancelación
      drawSectionHeader("5. Políticas de Cancelación");
      checkPageOverflow(45);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("• HASTA EL 30 DE SEPTIEMBRE DE 2026: REEMBOLSO COMPLETO, SIN PENALIZACIÓN.", 45, y);
      y += 12;
      doc.text("• ENTRE EL 1 Y EL 15 DE OCTUBRE DE 2026: PENALIZACIÓN DEL 50% DEL COSTO TOTAL CONFIRMADO.", 45, y);
      y += 12;
      doc.text("• A PARTIR DEL 16 DE OCTUBRE DE 2026: PENALIZACIÓN DEL 100% DEL COSTO TOTAL CONFIRMADO, NO REEMBOLSABLE.", 45, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("TODA CANCELACIÓN DEBERÁ SOLICITARSE POR ESCRITO A: AOG@ADISTEM.COM.MX Y/O GPH@ADISTEM.COM.MX", 45, y);
      y += 18;

      // Section 6: Datos Bancarios
      drawSectionHeader("6. Datos de Depósito o Transferencia");
      checkPageOverflow(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const textPart1 = "Enviar el comprobante de pago a : Maricarmen Velázquez al correo ";
      doc.text(textPart1, 45, y);
      const widthPart1 = doc.getTextWidth(textPart1.toUpperCase());
      doc.setTextColor(86, 183, 169); // Green #56B7A9 color
      doc.text("mcv@adistem.com.mx", 45 + widthPart1 + 6, y);
      y += 18;

      // Add footers on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(40, 800, 555, 800);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("Este documento es un comprobante de registro oficial para la Convención ADISTEM 2026.", 40, 815);
        doc.text(`Página ${i} de ${totalPages}`, 555, 815, { align: "right" });
      }

      // Download the PDF file
      const fileName = `Resumen_Registro_${nombreTitular}_${apellidosTitular}.pdf`.replace(/\s+/g, "_");
      doc.save(fileName);
      
    } catch (error) {
      console.error("Error al generar PDF", error);
      alert("Hubo un error al preparar el PDF del resumen. Por favor intente de nuevo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const Val = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#56B7A9] font-extrabold text-xs md:text-sm inline-block mx-1">
      {children}
    </span>
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
      {children}
    </span>
  );

  const getPassengerName = (id: string) => {
    if (id === "titular") return `${nombreTitular || ""} ${apellidosTitular || ""}`.trim() || "Titular";
    if (id.startsWith("C-")) {
      const idx = parseInt(id.split("-")[1] || "1") - 1;
      const comp = companionsList[idx];
      if (comp) return `${comp.firstName || ""} ${comp.lastName || ""}`.trim() || `Acompañante #${idx + 1}`;
    }
    if (id.startsWith("M-")) {
      const idx = parseInt(id.split("-")[1] || "1") - 1;
      const minor = minors[idx];
      if (minor) return (minor.name || minor.lastName) ? `${minor.name || ""} ${minor.lastName || ""}`.trim() : `Menor #${idx + 1}`;
    }
    const foundComp = companionsList.find(c => c.id === id);
    if (foundComp) return `${foundComp.firstName || ""} ${foundComp.lastName || ""}`.trim() || "Acompañante";
    
    return id;
  };

  const renderFlightsSummary = () => {
    if (!hasFlights) {
      return (
        <div className="p-4 bg-slate-500/5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center italic text-slate-500">
          No se ha registrado itinerario de vuelos.
        </div>
      );
    }

    if (!vuelosSeparados) {
      const isLlegadaTerrestre = (vueloLlegadaAerolinea || "Terrestre") === "Terrestre";
      const isRegresoTerrestre = (vueloRegresoAerolinea || "Terrestre") === "Terrestre";
      return (
        <div className="space-y-3">
          <div className="p-3 bg-[#56B7A9]/5 rounded-xl border border-[#56B7A9]/25 space-y-2">
            <span className="font-extrabold text-blue-500 text-[10px] uppercase block tracking-wider">✈️ Vuelo de Llegada (Unificado)</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><Label>{isLlegadaTerrestre ? "Vía:" : "Aerolínea:"}</Label> <Val>{vueloLlegadaAerolinea || "Terrestre"}</Val></div>
              {!isLlegadaTerrestre && (
                <div><Label>No. Vuelo:</Label> <Val>{vueloLlegadaNoVuelo || "N/A"}</Val></div>
              )}
              <div><Label>Fecha:</Label> <Val>{formatDateDMY(vueloLlegadaFecha)}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloLlegadaHora || "N/A"}</Val></div>
            </div>
          </div>

          <div className="p-3 bg-[#56B7A9]/5 rounded-xl border border-[#56B7A9]/25 space-y-2">
            <span className="font-extrabold text-blue-500 text-[10px] uppercase block tracking-wider">✈️ Vuelo de Regreso (Unificado)</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><Label>{isRegresoTerrestre ? "Vía:" : "Aerolínea:"}</Label> <Val>{vueloRegresoAerolinea || "Terrestre"}</Val></div>
              {!isRegresoTerrestre && (
                <div><Label>No. Vuelo:</Label> <Val>{vueloRegresoNoVuelo || "N/A"}</Val></div>
              )}
              <div><Label>Fecha:</Label> <Val>{formatDateDMY(vueloRegresoFecha)}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloRegresoHora || "N/A"}</Val></div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-500/5 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <Label>Pasajeros en este itinerario:</Label>
            <p className="mt-1 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
              {getPassengerName("titular")}
              {companionsList.map(c => `, ${getPassengerName(c.id)}`)}
              {minors.slice(0, numMinors).map((m, idx) => `, ${getPassengerName(`M-${idx + 1}`)}`)}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Titular flights */}
        <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="font-extrabold text-[#56B7A9] text-[10px] uppercase block tracking-wider">
            👤 Itinerario de {nombreTitular} {apellidosTitular} (Titular)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
              <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block text-center">Llegada</span>
              {(() => {
                const isTerrestre = (vueloLlegadaAerolinea || "Terrestre") === "Terrestre";
                return (
                  <>
                    <div><Label>{isTerrestre ? "Vía:" : "Aerolínea:"}</Label> <Val>{vueloLlegadaAerolinea || "Terrestre"}</Val></div>
                    {!isTerrestre && (
                      <div><Label>No. Vuelo:</Label> <Val>{vueloLlegadaNoVuelo || "N/A"}</Val></div>
                    )}
                  </>
                );
              })()}
              <div><Label>Fecha:</Label> <Val>{formatDateDMY(vueloLlegadaFecha)}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloLlegadaHora || "N/A"}</Val></div>
              {/* Minors with titular on arrival */}
              {vueloLlegadaPasajerosTitular && vueloLlegadaPasajerosTitular.filter(id => id.startsWith("M-")).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Acompañantes adicionales en este vuelo:</span>
                  <div className="text-[10px] text-[#56B7A9] font-extrabold">
                    {vueloLlegadaPasajerosTitular.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                  </div>
                </div>
              )}
            </div>

            <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
              <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block text-center">Salida</span>
              {(() => {
                const isTerrestre = (vueloRegresoAerolinea || "Terrestre") === "Terrestre";
                return (
                  <>
                    <div><Label>{isTerrestre ? "Vía:" : "Aerolínea:"}</Label> <Val>{vueloRegresoAerolinea || "Terrestre"}</Val></div>
                    {!isTerrestre && (
                      <div><Label>No. Vuelo:</Label> <Val>{vueloRegresoNoVuelo || "N/A"}</Val></div>
                    )}
                  </>
                );
              })()}
              <div><Label>Fecha:</Label> <Val>{formatDateDMY(vueloRegresoFecha)}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloRegresoHora || "N/A"}</Val></div>
              {/* Minors with titular on departure */}
              {vueloRegresoPasajerosTitular && vueloRegresoPasajerosTitular.filter(id => id.startsWith("M-")).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Acompañantes adicionales en este vuelo:</span>
                  <div className="text-[10px] text-[#56B7A9] font-extrabold">
                    {vueloRegresoPasajerosTitular.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Companions flights */}
        {hasCompanion && companionsList.map((comp, compIdx) => (
          <div key={(comp.id && !comp.id.startsWith("M-")) ? comp.id : `C-${compIdx + 1}`} className="p-3 bg-slate-500/5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-extrabold text-[#56B7A9] text-[10px] uppercase block tracking-wider">
              👥 Itinerario de {comp.firstName} {comp.lastName} (Acompañante)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
                <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block text-center">Llegada</span>
                {(() => {
                  const isTerrestre = (comp.vueloLlegadaAerolinea || "Terrestre") === "Terrestre";
                  return (
                    <>
                      <div><Label>{isTerrestre ? "Vía:" : "Aerolínea:"}</Label> <Val>{comp.vueloLlegadaAerolinea || "Terrestre"}</Val></div>
                      {!isTerrestre && (
                        <div><Label>No. Vuelo:</Label> <Val>{comp.vueloLlegadaNoVuelo || "N/A"}</Val></div>
                      )}
                    </>
                  );
                })()}
                <div><Label>Fecha:</Label> <Val>{formatDateDMY(comp.vueloLlegadaFecha)}</Val></div>
                <div><Label>Hora:</Label> <Val>{comp.vueloLlegadaHora || "N/A"}</Val></div>
                {/* Minors with companion on arrival */}
                {comp.vueloLlegadaPasajeros && comp.vueloLlegadaPasajeros.filter(id => id.startsWith("M-")).length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Acompañantes adicionales en este vuelo:</span>
                    <div className="text-[10px] text-[#56B7A9] font-extrabold">
                      {comp.vueloLlegadaPasajeros.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
                <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block text-center">Salida</span>
                {(() => {
                  const isTerrestre = (comp.vueloRegresoAerolinea || "Terrestre") === "Terrestre";
                  return (
                    <>
                      <div><Label>{isTerrestre ? "Vía:" : "Aerolínea:"}</Label> <Val>{comp.vueloRegresoAerolinea || "Terrestre"}</Val></div>
                      {!isTerrestre && (
                        <div><Label>No. Vuelo:</Label> <Val>{comp.vueloRegresoNoVuelo || "N/A"}</Val></div>
                      )}
                    </>
                  );
                })()}
                <div><Label>Fecha:</Label> <Val>{formatDateDMY(comp.vueloRegresoFecha)}</Val></div>
                <div><Label>Hora:</Label> <Val>{comp.vueloRegresoHora || "N/A"}</Val></div>
                {/* Minors with companion on departure */}
                {comp.vueloRegresoPasajeros && comp.vueloRegresoPasajeros.filter(id => id.startsWith("M-")).length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Acompañantes adicionales en este vuelo:</span>
                    <div className="text-[10px] text-[#56B7A9] font-extrabold">
                      {comp.vueloRegresoPasajeros.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100">
      <div>
        <h3 className={`text-lg font-black flex items-center gap-2 ${t.textTitle}`}>
          <FileText className="w-5 h-5 text-blue-500" />
          Resumen de Registro
        </h3>
        <p className={`text-xs mt-0.5 ${t.textMuted}`}>
          Por favor revisa cuidadosamente toda la información antes de guardar y finalizar tu registro.
        </p>
      </div>

      {draftSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-xl text-center flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>¡Borrador de registro guardado con éxito! Podrás completarlo en cualquier inicio de sesión posterior.</span>
        </div>
      )}

      {/* Grid containing the cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Información del Titular (incluyendo requerimientos de hospedaje) */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] uppercase`}>
          <div className="font-black text-[#56B7A9] uppercase text-[13px] md:text-sm tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-[#56B7A9]" />
            <span>1. Información del Titular y Hospedaje</span>
          </div>
          <div className="space-y-2.5">
            <div>
              <Label>Nombre completo:</Label> 
              <Val>{nombreTitular} {apellidosTitular}</Val>
            </div>
            <div>
              <Label>Sexo:</Label> 
              <Val>{sexo === "M" ? "Masculino" : "Femenino"}</Val>
            </div>
            <div>
              <Label>Grupo:</Label> 
              <Val>{grupo}</Val>
            </div>
            <div>
              <Label>Razón Social:</Label> 
              <Val>{distribuidora}</Val>
            </div>
            <div>
              <Label>Contacto:</Label> 
              <Val>{correoTitular}</Val> • <Val>{celularTitular}</Val>
            </div>
            {alergiasTitular && (
              <div>
                <Label>Alergias / Restricciones:</Label> 
                <Val>{alergiasTitular}</Val>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Detalles de Hospedaje Sede</span>
              <div>
                <Label>Tipo de carnet:</Label> 
                <Val>{carnetTipoHabitacion}</Val>
              </div>
              <div>
                <Label>Configuración de cama:</Label> 
                <Val>{configuracionHabitacion}</Val>
              </div>
              <div>
                <Label>Noches adicionales:</Label> 
                <Val>{nochesAdicionales || 0} noche(s)</Val>
              </div>
              {requerimientosAdicionales && (
                <div className="mt-1.5 p-2.5 bg-slate-500/5 rounded-xl border border-slate-350 dark:border-slate-800">
                  <Label>Requerimientos especiales / Comentarios:</Label>
                  <p className="mt-1 text-slate-700 dark:text-slate-300 font-medium text-xs leading-relaxed uppercase">
                    {requerimientosAdicionales}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Información del Acompañante y Menores */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] uppercase`}>
          <div className="font-black text-[#56B7A9] uppercase text-[13px] md:text-sm tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#56B7A9]" />
            <span>2. Acompañantes y Menores</span>
          </div>
          <div className="space-y-4">
            {hasCompanion && companionsList.length > 0 ? (
              <div className="space-y-2.5">
                <span className="font-bold text-slate-500 text-[10px] uppercase block tracking-wider">Acompañante Adulto:</span>
                {companionsList.slice(0, 1).map((comp, compIdx) => (
                  <div key={(comp.id && !comp.id.startsWith("M-")) ? comp.id : `C-${compIdx + 1}`} className="pl-3 border-l-2 border-[#56B7A9] py-1 space-y-1 bg-slate-500/5 rounded-r-xl p-2 uppercase">
                    <div>
                      <Label>Nombre:</Label> 
                      <Val>{comp.firstName} {comp.lastName}</Val>
                    </div>
                    <div>
                      <Label>Sexo:</Label> 
                      <Val>{comp.sex === "M" ? "Masculino" : "Femenino"}</Val>
                    </div>
                    <div>
                      <Label>Parentesco:</Label> 
                      <Val>{comp.relationship}</Val>
                    </div>
                    {comp.allergies && (
                      <div>
                        <Label>Alergias:</Label> 
                        <Val>{comp.allergies}</Val>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {numMinors > 0 ? (
              <div className="space-y-2.5 pt-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase block tracking-wider">
                  {isDobleQueenQueen ? `Acompañantes adicionales (Cantidad: ${numMinors}):` : `Menores de edad (Cantidad: ${numMinors}):`}
                </span>
                {minors.slice(0, numMinors).map((m, idx) => {
                  const isAdult = m.tipo === "adult";
                  return (
                    <div key={idx} className="pl-3 border-l-2 border-[#56B7A9] py-1 space-y-1 bg-slate-500/5 rounded-r-xl p-2 uppercase">
                      <div>
                        <Label>{isDobleQueenQueen ? `Adicional #${idx + 1}:` : `Menor #${idx + 1}:`}</Label> 
                        <Val>{(m.name || m.lastName) ? `${m.name || ""} ${m.lastName || ""}`.trim() : (isDobleQueenQueen ? `Adicional #${idx + 1}` : `Menor #${idx + 1}`)}</Val>
                      </div>
                      <div>
                        <Label>Condición / Edad:</Label> 
                        <Val>{isAdult ? "Adulto" : `Menor de edad (${m.age === 0 ? "0-11 meses" : `${m.age} años`})`}</Val>
                      </div>
                      {!isAdult && m.parentezco && (
                        <div>
                          <Label>Parentesco:</Label> 
                          <Val>{m.parentezco}</Val>
                        </div>
                      )}
                      {!isAdult && m.age >= 12 && (
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          * 12 años o mayor entra en costo de plan de alimentación adulto
                        </div>
                      )}
                      {m.allergies && (
                        <div>
                          <Label>Alergias / Restricciones:</Label> 
                          <Val>{m.allergies}</Val>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!hasCompanion && numMinors === 0 && (
              <div className="text-slate-500 italic py-6 text-center uppercase">
                Sin acompañantes o menores registrados.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Resumen de Vuelos / Itinerario de Viaje */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] md:col-span-2 uppercase`}>
          <div className="font-black text-[#56B7A9] uppercase text-[13px] md:text-sm tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#56B7A9]" />
            <span>3. Itinerario de Vuelos de Llegada y Salida</span>
          </div>
          <div className="space-y-1">
            {renderFlightsSummary()}
          </div>
        </div>

        {/* Card: Actividades */}
        {(selectedActivities.length > 0 || (hasCompanion && companionsList.some(c => c.selectedActivities && c.selectedActivities.length > 0))) && (
          <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] md:col-span-2`}>
            <div className="font-black text-[#56B7A9] uppercase text-[13px] md:text-sm tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#56B7A9]" />
              <span>Actividades</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Titular activities */}
              {selectedActivities.length > 0 && (
                <div className="p-3.5 bg-slate-500/5 rounded-xl border border-[#56B7A9]/30 space-y-2.5">
                  <span className="font-extrabold text-[#56B7A9] text-xs uppercase block tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Titular: {nombreTitular} {apellidosTitular}
                  </span>
                  <div className="space-y-2">
                    {selectedActivities.map(actId => {
                      const acts = DataStore?.getActivities ? DataStore.getActivities() : [];
                      const act = acts.find((a: any) => a.id === actId);
                      const res = activityReservations?.find(r => r.activityId === actId && (r.personId === "titular" || r.personType === "titular"));
                      const detailText = formatActivityReservationDetail(res, act);
                      return (
                        <div key={actId} className="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 dark:text-slate-100">{act?.name || act?.title || actId}</span>
                          </div>
                          {res ? (
                            <div className="text-xs md:text-sm text-[#56B7A9] font-extrabold flex items-center gap-1.5 flex-wrap">
                              <Clock className="w-3.5 h-3.5 text-[#56B7A9] shrink-0" />
                              <span>{detailText}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 font-medium">
                              {detailText}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Companion activities */}
              {hasCompanion && companionsList.map((comp, idx) => {
                if (!comp.selectedActivities || comp.selectedActivities.length === 0) return null;
                const compKey = (comp.id && !comp.id.startsWith("M-")) ? comp.id : `C-${idx + 1}`;
                return (
                  <div key={compKey} className="p-3.5 bg-slate-500/5 rounded-xl border border-[#56B7A9]/30 space-y-2.5">
                    <span className="font-extrabold text-[#56B7A9] text-xs uppercase block tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Acompañante: {comp.firstName || `Acompañante ${idx + 1}`} {comp.lastName}
                    </span>
                    <div className="space-y-2">
                      {comp.selectedActivities.map(actId => {
                        const acts = DataStore?.getActivities ? DataStore.getActivities() : [];
                        const act = acts.find((a: any) => a.id === actId);
                        const res = activityReservations?.find(r => r.activityId === actId && (r.personId === comp.id || (r.personType === "companion" && r.personName?.toLowerCase() === comp.firstName?.toLowerCase())));
                        const detailText = formatActivityReservationDetail(res, act);
                        return (
                          <div key={actId} className="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-800 dark:text-slate-100">{act?.name || act?.title || actId}</span>
                            </div>
                            {res ? (
                              <div className="text-xs md:text-sm text-[#56B7A9] font-extrabold flex items-center gap-1.5 flex-wrap">
                                <Clock className="w-3.5 h-3.5 text-[#56B7A9] shrink-0" />
                                <span>{detailText}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 font-medium">
                                {detailText}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Card 4: Saldo Cuotas */}
        {(() => {
          const cuotasInfo = getCuotasSaldoForGroup(grupo);
          return (
            <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] flex flex-col`}>
              <div className="font-black text-[#56B7A9] uppercase text-[13px] md:text-sm tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#56B7A9]" />
                <span>4. SALDO CUOTAS</span>
              </div>
              <div className="flex-1 flex flex-col gap-3.5">
                {grupo ? (
                  <>
                    <div className="text-left space-y-0.5">
                      <span className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Saldo de cuotas disponibles al 31 de Agosto 2026 para el grupo :
                      </span>
                      <p className="text-base md:text-lg font-black text-[#0A2E65] dark:text-[#56B7A9]">
                        {grupo}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-5 bg-slate-500/5 rounded-xl border border-dashed border-[#56B7A9]/40 min-h-[90px] text-center">
                      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Monto Total Disponible
                      </span>
                      <span className="text-2xl md:text-3xl font-black text-[#0A2E65] dark:text-[#56B7A9] tracking-tight">
                        {formatCuotaCurrency(cuotasInfo.total)}
                      </span>
                    </div>

                    {cuotasInfo.items.length > 0 ? (
                      <div className="text-left space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Razón(es) Social(es) del Grupo ({cuotasInfo.items.length}):
                        </p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {cuotasInfo.items.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="flex justify-between items-center text-xs py-1.5 px-2.5 rounded-lg bg-slate-500/5 hover:bg-slate-500/10 transition-colors"
                            >
                              <div className="flex flex-col min-w-0 mr-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={item.razonSocial}>
                                  {item.razonSocial}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  RFC: {item.rfc}
                                </span>
                              </div>
                              <span className="font-black text-[#0A2E65] dark:text-[#56B7A9] text-xs shrink-0">
                                {formatCuotaCurrency(item.cuota)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 text-center">
                        Este grupo no cuenta con cuotas de distribución asignadas en el padrón oficial.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center p-6 bg-slate-500/5 rounded-xl border border-dashed border-[#56B7A9]/30 min-h-[100px] text-center">
                    <span className="font-bold text-slate-500 dark:text-slate-400 text-xs">
                      Selecciona un grupo en el Paso 1 para consultar el saldo de cuotas disponible.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Card 5: Políticas de Cancelación / Costos Extra */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] flex flex-col`}>
          <div className="font-black text-[#56B7A9] uppercase text-[13px] md:text-sm tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#56B7A9]" />
            <span>5. Politica de cancelacion / Costos Extra</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-500/5 rounded-xl border border-dashed border-[#56B7A9]/30 min-h-[110px] text-center gap-3">
            <p className="text-[11px] md:text-xs font-semibold text-slate-600 dark:text-slate-400 max-w-sm">
              Conoce las fechas límite, penalizaciones aplicables, procedimiento para cancelaciones y costos adicionales.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCancellationPolicyModal(true)}
                className="px-5 py-2.5 bg-[#0A2E65] hover:bg-[#08234D] active:scale-95 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer hover:shadow-lg"
              >
                <Eye className="w-4 h-4 text-sky-300" />
                <span>Ver Política de Cancelación</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExtraCostsModal(true)}
                className="px-5 py-2.5 bg-[#0A2E65] hover:bg-[#08234D] active:scale-95 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer hover:shadow-lg"
              >
                <DollarSign className="w-4 h-4 text-emerald-300" />
                <span>Costos Extra</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 6: Datos de Depósito / Transferencia Bancaria */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] md:col-span-2 flex flex-col`}>
          <div className="font-black text-[#56B7A9] uppercase text-[13px] md:text-sm tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Save className="w-4 h-4 text-[#56B7A9]" />
            <span>6. DATOS PARA DEPOSITO O TRANSFERENCIA BANCARIA</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-500/5 rounded-xl border border-dashed border-[#56B7A9]/30 min-h-[110px] text-center gap-3">
            <p className="text-[11px] md:text-xs font-semibold text-slate-600 dark:text-slate-400 max-w-sm">
              Consulta los datos bancarios oficiales para realizar tu depósito o transferencia bancaria, cuenta CLABE e instrucciones fiscales.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowBankDepositModal(true)}
                className="px-5 py-2.5 bg-[#0A2E65] hover:bg-[#08234D] active:scale-95 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer hover:shadow-lg"
              >
                <Landmark className="w-4 h-4 text-sky-300" />
                <span>Datos para depósito</span>
              </button>
            </div>
            <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-500 leading-relaxed max-w-xl mx-auto pt-1">
              Enviar el comprobante de pago y Constancia de Situación Fiscal actualizada a: Maricarmen Velazquez Molina al correo{" "}
              <a href="mailto:mvc@adistem.com.mx" className="text-[#56B7A9] hover:underline transition-colors font-extrabold">
                mvc@adistem.com.mx
              </a>
            </p>
          </div>
        </div>

      </div>

      {/* Buttons Block */}
      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <div className="flex gap-2">
          <button 
            onClick={handlePrev}
            className={t.btnSec + " flex items-center gap-1.5 text-xs font-bold"}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingPdf ? "Preparando PDF..." : "Descargar Resumen en PDF"}</span>
          </button>

          <button 
            onClick={handleSaveRegistration}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition cursor-pointer text-xs flex items-center justify-center gap-2 animate-pulse"
          >
            <Save className="w-4 h-4" />
            <span>{loggedGuest ? "Guardar y Finalizar" : "Completar y Finalizar"}</span>
          </button>
        </div>
      </div>

      {/* Modal Política de Cancelación */}
      <CancellationPolicyModal 
        isOpen={showCancellationPolicyModal}
        onClose={() => setShowCancellationPolicyModal(false)}
      />

      {/* Modal Costos Extra */}
      <ExtraCostsModal 
        isOpen={showExtraCostsModal}
        onClose={() => setShowExtraCostsModal(false)}
      />

      {/* Modal Datos para Depósito */}
      <BankDepositModal 
        isOpen={showBankDepositModal}
        onClose={() => setShowBankDepositModal(false)}
      />
    </div>
  );
}
