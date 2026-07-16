import React from "react";
import { FileText, ChevronLeft, Save, CheckCircle, User, Users, ShieldAlert, Key, Plane } from "lucide-react";
import { jsPDF } from "jspdf";

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
  minors: Array<{ name: string; lastName: string; age: number; allergies: string }>;
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
  DataStore: any;
  handlePrev: () => void;
  handleSaveDraft: () => void;
  handleSaveRegistration: () => void;
  loggedGuest: any;
  activeAccessUser?: any;
  vueloLlegadaPasajerosTitular?: string[];
  vueloRegresoPasajerosTitular?: string[];
}

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
  handlePrev,
  handleSaveDraft,
  handleSaveRegistration,
  loggedGuest,
  activeAccessUser,
  vueloLlegadaPasajerosTitular,
  vueloRegresoPasajerosTitular
}: SummaryStepProps) {
  
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF("p", "pt", "a4");
      
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
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        const val1Text = String(val1 || "N/A");
        doc.text(val1Text, 140, y);
        
        if (label2 && val2 !== undefined) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(label2, 310, y);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          const val2Text = String(val2 || "N/A");
          doc.text(val2Text, 410, y);
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
          drawKeyValueRow("Parentesco:", comp.relationship, "Alergias:", comp.allergies || "Ninguna");
          y += 6;
        }
        
        if (numMinors > 0 && minors.length > 0) {
          checkPageOverflow(15);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Menores de edad (${numMinors} registrado(s))`, 45, y);
          y += 12;
          minors.slice(0, numMinors).forEach((m, idx) => {
            const mName = (m.name || m.lastName) ? `${m.name || ""} ${m.lastName || ""}`.trim() : `Menor #${idx + 1}`;
            drawKeyValueRow(`Menor #${idx + 1}:`, mName, "Edad:", m.age === 0 ? "0-11 meses" : `${m.age} años`);
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
          drawKeyValueRow("Fecha Llegada:", vueloLlegadaFecha || "N/A", "Hora Llegada:", vueloLlegadaHora || "N/A");
          
          y += 4;
          drawKeyValueRow("Regreso Vía:", vueloRegresoAerolinea || "Terrestre", isRegresoTerrestre ? "" : "No. Vuelo Regreso:", isRegresoTerrestre ? "" : vueloRegresoNoVuelo);
          drawKeyValueRow("Fecha Regreso:", vueloRegresoFecha || "N/A", "Hora Regreso:", vueloRegresoHora || "N/A");
          
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
          drawKeyValueRow("Fecha/Hora Llegada:", `${vueloLlegadaFecha || "N/A"} - ${vueloLlegadaHora || "N/A"}`, "Fecha/Hora Regreso:", `${vueloRegresoFecha || "N/A"} - ${vueloRegresoHora || "N/A"}`);
          
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
              drawKeyValueRow("Fecha/Hora Llegada:", `${comp.vueloLlegadaFecha || "N/A"} - ${comp.vueloLlegadaHora || "N/A"}`, "Fecha/Hora Regreso:", `${comp.vueloRegresoFecha || "N/A"} - ${comp.vueloRegresoHora || "N/A"}`);
              
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

      // Section 4: Datos de Cuenta
      drawSectionHeader("4. Cuenta de Acceso a la App");
      checkPageOverflow(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("DISPONIBLE PROXIMAMENTE", 45, y);
      y += 18;

      // Section 5: Política de Cancelación
      drawSectionHeader("5. Políticas de Cancelación");
      checkPageOverflow(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("DISPONIBLE PROXIMAMENTE", 45, y);
      y += 18;

      // Section 6: Datos Bancarios
      drawSectionHeader("6. Datos de Depósito o Transferencia");
      checkPageOverflow(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const textPart1 = "Enviar el comprobante de pago a : Maricarmen Velázquez al correo ";
      doc.text(textPart1, 45, y);
      const widthPart1 = doc.getTextWidth(textPart1);
      doc.setTextColor(86, 183, 169); // Green #56B7A9 color
      doc.text("mcv@adistem.com.mx", 45 + widthPart1, y);
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
    if (id === "titular") return `${nombreTitular} ${apellidosTitular}`.trim() || "Titular";
    if (id.startsWith("C-")) {
      const idx = parseInt(id.split("-")[1] || "1") - 1;
      const comp = companionsList[idx];
      if (comp) return `${comp.firstName} ${comp.lastName}`.trim();
    }
    if (id.startsWith("M-")) {
      const idx = parseInt(id.split("-")[1] || "1") - 1;
      const minor = minors[idx];
      if (minor) return (minor.name || minor.lastName) ? `${minor.name || ""} ${minor.lastName || ""}`.trim() : `Menor #${idx + 1}`;
    }
    const foundComp = companionsList.find(c => c.id === id);
    if (foundComp) return `${foundComp.firstName} ${foundComp.lastName}`.trim();
    
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
              <div><Label>Fecha:</Label> <Val>{vueloLlegadaFecha || "N/A"}</Val></div>
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
              <div><Label>Fecha:</Label> <Val>{vueloRegresoFecha || "N/A"}</Val></div>
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
              <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Llegada</span>
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
              <div><Label>Fecha:</Label> <Val>{vueloLlegadaFecha || "N/A"}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloLlegadaHora || "N/A"}</Val></div>
              {/* Minors with titular on arrival */}
              {vueloLlegadaPasajerosTitular && vueloLlegadaPasajerosTitular.filter(id => id.startsWith("M-")).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Menores acompañantes:</span>
                  <div className="text-[10px] text-[#56B7A9] font-extrabold">
                    {vueloLlegadaPasajerosTitular.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                  </div>
                </div>
              )}
            </div>

            <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
              <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Regreso</span>
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
              <div><Label>Fecha:</Label> <Val>{vueloRegresoFecha || "N/A"}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloRegresoHora || "N/A"}</Val></div>
              {/* Minors with titular on departure */}
              {vueloRegresoPasajerosTitular && vueloRegresoPasajerosTitular.filter(id => id.startsWith("M-")).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Menores acompañantes:</span>
                  <div className="text-[10px] text-[#56B7A9] font-extrabold">
                    {vueloRegresoPasajerosTitular.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Companions flights */}
        {hasCompanion && companionsList.map((comp) => (
          <div key={comp.id} className="p-3 bg-slate-500/5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-extrabold text-[#56B7A9] text-[10px] uppercase block tracking-wider">
              👥 Itinerario de {comp.firstName} {comp.lastName} (Acompañante)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
                <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Llegada</span>
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
                <div><Label>Fecha:</Label> <Val>{comp.vueloLlegadaFecha || "N/A"}</Val></div>
                <div><Label>Hora:</Label> <Val>{comp.vueloLlegadaHora || "N/A"}</Val></div>
                {/* Minors with companion on arrival */}
                {comp.vueloLlegadaPasajeros && comp.vueloLlegadaPasajeros.filter(id => id.startsWith("M-")).length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Menores acompañantes:</span>
                    <div className="text-[10px] text-[#56B7A9] font-extrabold">
                      {comp.vueloLlegadaPasajeros.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
                <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Regreso</span>
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
                <div><Label>Fecha:</Label> <Val>{comp.vueloRegresoFecha || "N/A"}</Val></div>
                <div><Label>Hora:</Label> <Val>{comp.vueloRegresoHora || "N/A"}</Val></div>
                {/* Minors with companion on departure */}
                {comp.vueloRegresoPasajeros && comp.vueloRegresoPasajeros.filter(id => id.startsWith("M-")).length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Menores acompañantes:</span>
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
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9]`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
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
                  <p className="mt-1 text-slate-700 dark:text-slate-300 font-medium text-xs leading-relaxed">
                    {requerimientosAdicionales}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Información del Acompañante y Menores */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9]`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#56B7A9]" />
            <span>2. Acompañantes y Menores</span>
          </div>
          <div className="space-y-4">
            {hasCompanion && companionsList.length > 0 ? (
              <div className="space-y-2.5">
                <span className="font-bold text-slate-500 text-[10px] uppercase block tracking-wider">Acompañante Adulto:</span>
                {companionsList.slice(0, 1).map((comp) => (
                  <div key={comp.id} className="pl-3 border-l-2 border-[#56B7A9] py-1 space-y-1 bg-slate-500/5 rounded-r-xl p-2">
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
                  Menores de edad (Cantidad: {numMinors}):
                </span>
                {minors.slice(0, numMinors).map((m, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-[#56B7A9] py-1 space-y-1 bg-slate-500/5 rounded-r-xl p-2">
                    <div>
                      <Label>Menor #{idx + 1}:</Label> 
                      <Val>{(m.name || m.lastName) ? `${m.name || ""} ${m.lastName || ""}`.trim() : `Menor #${idx + 1}`}</Val>
                    </div>
                    <div>
                      <Label>Edad:</Label> 
                      <Val>{m.age === 0 ? "0-11 meses" : `${m.age} años`}</Val>
                    </div>
                    {m.allergies && (
                      <div>
                        <Label>Alergias / Restricciones:</Label> 
                        <Val>{m.allergies}</Val>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {!hasCompanion && numMinors === 0 && (
              <div className="text-slate-500 italic py-6 text-center">
                Sin acompañantes o menores registrados.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Resumen de Vuelos / Itinerario de Viaje */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] md:col-span-2`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#56B7A9]" />
            <span>3. Itinerario de Vuelos de Llegada y Salida</span>
          </div>
          <div className="space-y-1">
            {renderFlightsSummary()}
          </div>
        </div>

        {/* Card 4: Contenido de Cuenta (Datos de acceso) */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] flex flex-col`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-[#56B7A9]" />
            <span>4. Contenido de Cuenta</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-500/5 rounded-xl border border-dashed border-[#56B7A9]/30 min-h-[110px]">
            <span className="font-black tracking-widest text-slate-500 dark:text-slate-400 text-sm">
              DISPONIBLE PROXIMAMENTE
            </span>
          </div>
        </div>

        {/* Card 5: Políticas de Cancelación */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] flex flex-col`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#56B7A9]" />
            <span>5. Política de Cancelación</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-500/5 rounded-xl border border-dashed border-[#56B7A9]/30 min-h-[110px]">
            <span className="font-black tracking-widest text-slate-500 dark:text-slate-400 text-sm">
              DISPONIBLE PROXIMAMENTE
            </span>
          </div>
        </div>

        {/* Card 6: Datos de Depósito / Transferencia Bancaria */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] md:col-span-2 flex flex-col`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Save className="w-4 h-4 text-[#56B7A9]" />
            <span>6. Datos de Depósito o Transferencia Bancaria</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-500/5 rounded-xl border border-dashed border-[#56B7A9]/30 min-h-[110px] text-center">
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-900 leading-relaxed max-w-xl mx-auto">
              Enviar el comprobante de pago a : Maricarmen Velázquez al correo{" "}
              <a href="mailto:mcv@adistem.com.mx" className="text-[#56B7A9] hover:underline transition-colors font-black">
                mcv@adistem.com.mx
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
          <button 
            onClick={handleSaveDraft}
            className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-extrabold rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Borrador</span>
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
    </div>
  );
}
