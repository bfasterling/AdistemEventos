import React, { useState } from "react";
import { X, Download, Mail, Printer, DollarSign, Check, Copy, Info } from "lucide-react";
import { jsPDF } from "jspdf";
import LogoConvencion from "../assets/images/Logo_convencion_reducido.png";

interface ExtraCostsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExtraCostsModal({ isOpen, onClose }: ExtraCostsModalProps) {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Warm sand parchment background
      doc.setFillColor(236, 229, 218);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Top decorative blue banner (triangle / trapezoid)
      doc.setFillColor(15, 52, 120);
      // Top center banner
      doc.rect(pageWidth / 2 - 130, 0, 260, 48, "F");
      doc.triangle(pageWidth / 2 - 130, 48, pageWidth / 2 + 130, 48, pageWidth / 2, 70, "F");

      // "AVISO" in top banner
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("AVISO", pageWidth / 2, 34, { align: "center" });

      // Header Left: ROSEWOOD MANDARINA NAYARIT, MÉXICO
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(10, 37, 75);
      doc.text("ROSEWOOD", 45, 96);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 47, 100);
      doc.text("MANDARINA", 45, 108);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 95, 115);
      doc.text("NAYARIT, MÉXICO", 45, 118);

      // Header Center Emblem: CONVENCIÓN ADISTEM 2026
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(20, 55, 125);
      doc.text("CONVENCIÓN", pageWidth / 2, 94, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(15, 47, 100);
      doc.text("ADISTEM", pageWidth / 2, 110, { align: "center" });
      doc.setFontSize(17);
      doc.setTextColor(30, 70, 180);
      doc.text("2026", pageWidth / 2, 128, { align: "center" });

      // Header Right: 06 AL 09 NOVIEMBRE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(10, 37, 75);
      doc.text("06", pageWidth - 122, 105);
      doc.setFontSize(8.5);
      doc.setTextColor(80, 95, 115);
      doc.text("AL", pageWidth - 93, 100);
      doc.setFontSize(20);
      doc.setTextColor(10, 37, 75);
      doc.text("09", pageWidth - 78, 105);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 47, 100);
      doc.text("NOVIEMBRE", pageWidth - 98, 120, { align: "center" });

      // Main Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(10, 45, 105);
      doc.text("Costos adicionales por", pageWidth / 2, 160, { align: "center" });
      doc.text("días extra y acompañantes", pageWidth / 2, 182, { align: "center" });

      // Intro
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(12, 40, 90);
      doc.text("Estimado Convencionista:", pageWidth / 2, 210, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(25, 50, 95);
      const introText = "Estos costos aplican por persona extra, por noche adicional, ya sea por llegada anticipada o salida posterior a las fechas de la convención, en habitación doble o sencilla.";
      const splitIntro = doc.splitTextToSize(introText, pageWidth - 140);
      doc.text(splitIntro, pageWidth / 2, 226, { align: "center", lineHeightFactor: 1.35 });

      // BOX 1: DÍA EXTRA CARNET
      const box1Y = 270;
      const boxWidth = pageWidth - 130;
      const boxX = 65;

      doc.setFillColor(248, 246, 242);
      doc.setDrawColor(185, 175, 160);
      doc.setLineWidth(1);
      doc.roundedRect(boxX, box1Y, boxWidth, 54, 8, 8, "FD");

      // Row 1
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(10, 40, 95);
      doc.text("DÍA EXTRA CARNET DOBLE", boxX + 16, box1Y + 22);
      doc.setFontSize(11);
      doc.text("$30,200", boxX + boxWidth - 110, box1Y + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("+ IVA", boxX + boxWidth - 55, box1Y + 22);

      // Divider
      doc.setDrawColor(215, 205, 190);
      doc.line(boxX + 10, box1Y + 28, boxX + boxWidth - 10, box1Y + 28);

      // Row 2
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(10, 40, 95);
      doc.text("DÍA EXTRA CARNET SENCILLO", boxX + 16, box1Y + 44);
      doc.setFontSize(11);
      doc.text("$20,900", boxX + boxWidth - 110, box1Y + 44);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("+ IVA", boxX + boxWidth - 55, box1Y + 44);

      // SECTION 2: NIÑOS EXTRA
      const sec2Y = 340;
      // Header Blue Pill
      doc.setFillColor(15, 60, 140);
      doc.roundedRect(boxX, sec2Y, boxWidth, 24, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("NIÑOS EXTRA", pageWidth / 2, sec2Y + 16, { align: "center" });

      // Rows
      const table2Y = sec2Y + 24;
      doc.setFillColor(248, 246, 242);
      doc.setDrawColor(185, 175, 160);
      doc.roundedRect(boxX, table2Y, boxWidth, 75, 6, 6, "FD");

      // Row 1
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 40, 90);
      doc.text("NIÑOS DE 0 A 3 AÑOS", boxX + 16, table2Y + 18);
      doc.text("SIN COSTO", boxX + boxWidth - 160, table2Y + 18);
      doc.setFont("helvetica", "normal");
      doc.text("POR DÍA", boxX + boxWidth - 65, table2Y + 18);

      doc.setDrawColor(220, 212, 200);
      doc.line(boxX + 10, table2Y + 25, boxX + boxWidth - 10, table2Y + 25);

      // Row 2
      doc.setFont("helvetica", "bold");
      doc.text("NIÑOS DE 4 A 11 AÑOS", boxX + 16, table2Y + 42);
      doc.text("$4,100", boxX + boxWidth - 150, table2Y + 42);
      doc.setFont("helvetica", "normal");
      doc.text("POR DÍA + IVA", boxX + boxWidth - 85, table2Y + 42);

      doc.line(boxX + 10, table2Y + 49, boxX + boxWidth - 10, table2Y + 49);

      // Row 3
      doc.setFont("helvetica", "bold");
      doc.text("NIÑOS DE 12 A 17 AÑOS", boxX + 16, table2Y + 66);
      doc.text("$7,300", boxX + boxWidth - 150, table2Y + 66);
      doc.setFont("helvetica", "normal");
      doc.text("POR DÍA + IVA", boxX + boxWidth - 85, table2Y + 66);

      // Meal Plan Note 1
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(10, 40, 95);
      doc.text("*Incluye Meal Plan (sin alcohol)", boxX + 6, table2Y + 88);

      // SECTION 3: EXTRAS POR DÍA
      const sec3Y = 465;
      doc.setFillColor(15, 60, 140);
      doc.roundedRect(boxX, sec3Y, boxWidth, 24, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("EXTRAS POR DÍA", pageWidth / 2, sec3Y + 16, { align: "center" });

      const table3Y = sec3Y + 24;
      doc.setFillColor(248, 246, 242);
      doc.setDrawColor(185, 175, 160);
      doc.roundedRect(boxX, table3Y, boxWidth, 32, 6, 6, "FD");

      // Row 1
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 40, 90);
      doc.text("ADULTO EXTRA", boxX + 16, table3Y + 20);
      doc.text("$8,400", boxX + boxWidth - 165, table3Y + 20);
      doc.setFont("helvetica", "normal");
      doc.text("POR PERSONA + IVA", boxX + boxWidth - 110, table3Y + 20);

      // Meal Plan Note 2
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(10, 40, 95);
      doc.text("*Incluye Meal Plan (con alcohol)", boxX + 6, table3Y + 45);

      // SECTION 4: CAMA EXTRA
      const sec4Y = 550;
      doc.setFillColor(248, 246, 242);
      doc.setDrawColor(185, 175, 160);
      doc.roundedRect(boxX, sec4Y, boxWidth, 32, 6, 6, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 40, 90);
      doc.text("CAMA EXTRA", boxX + 16, sec4Y + 20);
      doc.text("$1,100", boxX + boxWidth - 165, sec4Y + 20);
      doc.setFont("helvetica", "normal");
      doc.text("POR DÍA + IVA", boxX + boxWidth - 95, sec4Y + 20);

      // Stellantis Brand footer line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 110, 125);
      doc.text("STELLANTIS    |    DODGE    |    FIAT    |    JEEP    |    RAM    |    PEUGEOT", pageWidth / 2, 630, { align: "center" });

      // BOTTOM CONTACT BOX (Deep navy blue)
      const botY = pageHeight - 65;
      doc.setFillColor(5, 28, 68);
      doc.rect(0, botY, pageWidth, 65, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("DUDAS Y/O", 45, botY + 26);
      doc.text("COMENTARIOS:", 45, botY + 38);

      // Contact 1: Anahí Ojeda
      doc.text("Anahí Ojeda", 190, botY + 26);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(180, 210, 255);
      doc.text("aog@adistem.com.mx", 190, botY + 40);

      // Contact 2: Gabriela Pérez
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Gabriela Pérez", 380, botY + 26);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(180, 210, 255);
      doc.text("gph@adistem.com.mx", 380, botY + 40);

      doc.save("Costos_Adicionales_Convencion_ADISTEM_2026.pdf");
    } catch (err) {
      console.error("Error generating extra costs PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[220] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[94vh] max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Action Bar */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                COSTOS ADICIONALES
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Días Extra y Acompañantes • Convención ADISTEM 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-[#0F3478] hover:bg-[#0A2555] active:scale-95 disabled:bg-blue-400 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Descargar documento en PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isGeneratingPdf ? "Descargando..." : "Descargar PDF"}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer hidden md:flex items-center justify-center"
              title="Imprimir documento"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition cursor-pointer ml-1"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container with exact visual fidelity to the provided PDF flyer */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-4 bg-slate-200 dark:bg-slate-950/80 flex justify-center">
          
          {/* THE EXACT FLYER CANVAS */}
          <div className="w-full max-w-[560px] h-fit bg-[#DDD3C4] text-[#0A2540] rounded-2xl shadow-2xl border border-[#C5B9A7] overflow-hidden relative select-text mb-4">
            
            {/* Subtle paper grain / textured overlay */}
            <div 
              className="absolute inset-0 opacity-[0.035] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
                backgroundSize: "16px 16px"
              }}
            />

            {/* TOP BLUE BANNER WITH "AVISO" */}
            <div className="relative flex justify-center">
              <div 
                className="bg-[#123674] text-white px-12 sm:px-16 pt-3 pb-4 shadow-md font-black tracking-widest text-xl sm:text-2xl text-center uppercase"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 84% 100%, 50% 86%, 16% 100%)"
                }}
              >
                AVISO
              </div>
            </div>

            <div className="px-5 sm:px-8 pt-4 pb-6 space-y-5 relative z-10">
              
              {/* Header 3-columns */}
              <div className="grid grid-cols-3 items-center pt-1">
                {/* Left: Rosewood Mandarina */}
                <div className="text-left space-y-0.5">
                  <h3 className="font-serif font-black text-xs sm:text-sm tracking-widest text-[#0A2540]">
                    ROSEWOOD
                  </h3>
                  <p className="font-sans font-bold text-[10px] sm:text-[11px] text-[#0A2540] tracking-wider">
                    MANDARINA
                  </p>
                  <p className="font-sans font-medium text-[8px] sm:text-[9px] text-slate-600 tracking-wider">
                    NAYARIT, MÉXICO
                  </p>
                </div>

                {/* Center: Convention Emblem */}
                <div className="flex flex-col items-center justify-center text-center">
                  <img 
                    src={LogoConvencion} 
                    alt="Convención ADISTEM 2026" 
                    className="w-16 sm:w-20 h-auto object-contain drop-shadow-xs"
                  />
                </div>

                {/* Right: Dates */}
                <div className="text-right space-y-0.5">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xl sm:text-2xl font-black text-[#0A2540] tracking-tighter">06</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase">AL</span>
                    <span className="text-xl sm:text-2xl font-black text-[#0A2540] tracking-tighter">09</span>
                  </div>
                  <p className="font-sans font-black text-[9px] sm:text-[10px] text-[#0A2540] tracking-widest uppercase">
                    NOVIEMBRE
                  </p>
                </div>
              </div>

              {/* Main Document Title */}
              <div className="text-center pt-1 space-y-0.5">
                <h1 className="text-lg sm:text-2xl font-black text-[#0A2E65] tracking-tight leading-snug">
                  Costos adicionales por<br />
                  días extra y acompañantes
                </h1>
              </div>

              {/* Paragraph intro */}
              <div className="text-center max-w-md mx-auto space-y-1.5">
                <p className="text-xs sm:text-sm font-extrabold text-[#0A2E65]">
                  Estimado Convencionista:
                </p>
                <p className="text-[11px] sm:text-xs font-semibold text-[#1B365D] leading-relaxed">
                  Estos costos aplican por persona extra, por noche adicional, ya sea por llegada anticipada o salida posterior a las fechas de la convención, en habitación doble o sencilla.
                </p>
              </div>

              {/* CARD 1: DÍA EXTRA CARNET DOBLE / SENCILLO */}
              <div className="bg-[#EBE4D8]/90 border border-[#C5BAA9] rounded-2xl p-3 sm:p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold text-[#0A2E65] px-1 sm:px-2">
                  <span className="font-black uppercase tracking-wide">DÍA EXTRA CARNET DOBLE</span>
                  <div className="font-mono text-right">
                    <span className="font-black text-sm sm:text-base text-[#0A2E65] mr-1.5">$30,200</span>
                    <span className="text-[10px] sm:text-xs text-slate-600 font-sans font-bold">+ IVA</span>
                  </div>
                </div>

                <div className="border-t border-[#C5BAA9]/80" />

                <div className="flex items-center justify-between text-xs sm:text-[13px] font-bold text-[#0A2E65] px-1 sm:px-2">
                  <span className="font-black uppercase tracking-wide">DÍA EXTRA CARNET SENCILLO</span>
                  <div className="font-mono text-right">
                    <span className="font-black text-sm sm:text-base text-[#0A2E65] mr-1.5">$20,900</span>
                    <span className="text-[10px] sm:text-xs text-slate-600 font-sans font-bold">+ IVA</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: NIÑOS EXTRA */}
              <div className="space-y-1">
                {/* Header Blue Pill */}
                <div className="bg-[#0F3987] text-white py-1.5 px-4 rounded-t-xl text-center shadow-xs">
                  <h3 className="font-black text-xs sm:text-sm tracking-wider uppercase">
                    NIÑOS EXTRA
                  </h3>
                </div>

                {/* Table Container */}
                <div className="bg-[#EBE4D8]/90 border border-[#C5BAA9] rounded-b-xl overflow-hidden shadow-xs divide-y divide-[#C5BAA9]/80">
                  {/* Row 1 */}
                  <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] sm:text-xs font-bold text-[#0A2E65]">
                    <span className="col-span-6 font-extrabold uppercase">NIÑOS DE 0 A 3 AÑOS</span>
                    <span className="col-span-3 text-center font-black text-[#0A2E65]">SIN COSTO</span>
                    <span className="col-span-3 text-right text-slate-600 font-sans font-semibold">POR DÍA</span>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] sm:text-xs font-bold text-[#0A2E65]">
                    <span className="col-span-6 font-extrabold uppercase">NIÑOS DE 4 A 11 AÑOS</span>
                    <span className="col-span-3 text-center font-black font-mono text-sm sm:text-base text-[#0A2E65]">$4,100</span>
                    <span className="col-span-3 text-right text-slate-600 font-sans font-semibold">POR DÍA <span className="text-[10px]">+ IVA</span></span>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] sm:text-xs font-bold text-[#0A2E65]">
                    <span className="col-span-6 font-extrabold uppercase">NIÑOS DE 12 A 17 AÑOS</span>
                    <span className="col-span-3 text-center font-black font-mono text-sm sm:text-base text-[#0A2E65]">$7,300</span>
                    <span className="col-span-3 text-right text-slate-600 font-sans font-semibold">POR DÍA <span className="text-[10px]">+ IVA</span></span>
                  </div>
                </div>

                <p className="text-[10px] sm:text-[11px] font-bold text-[#0A2E65] pl-1 italic">
                  *Incluye Meal Plan (sin alcohol)
                </p>
              </div>

              {/* SECTION 3: EXTRAS POR DÍA */}
              <div className="space-y-1 pt-1">
                {/* Header Blue Pill */}
                <div className="bg-[#0F3987] text-white py-1.5 px-4 rounded-t-xl text-center shadow-xs">
                  <h3 className="font-black text-xs sm:text-sm tracking-wider uppercase">
                    EXTRAS POR DÍA
                  </h3>
                </div>

                {/* Table Container */}
                <div className="bg-[#EBE4D8]/90 border border-[#C5BAA9] rounded-b-xl overflow-hidden shadow-xs">
                  <div className="grid grid-cols-12 items-center px-3 py-2 text-[11px] sm:text-xs font-bold text-[#0A2E65]">
                    <span className="col-span-5 font-extrabold uppercase">ADULTO EXTRA</span>
                    <span className="col-span-3 text-center font-black font-mono text-sm sm:text-base text-[#0A2E65]">$8,400</span>
                    <span className="col-span-4 text-right text-slate-600 font-sans font-semibold">POR PERSONA <span className="text-[10px]">+ IVA</span></span>
                  </div>
                </div>

                <p className="text-[10px] sm:text-[11px] font-bold text-[#0A2E65] pl-1 italic">
                  *Incluye Meal Plan (con alcohol)
                </p>
              </div>

              {/* SECTION 4: CAMA EXTRA */}
              <div className="bg-[#EBE4D8]/90 border border-[#C5BAA9] rounded-2xl p-3 sm:p-3.5 shadow-xs flex items-center justify-between text-xs sm:text-[13px] font-bold text-[#0A2E65]">
                <span className="font-black uppercase tracking-wide">CAMA EXTRA</span>
                <div className="flex items-center gap-3">
                  <span className="font-black font-mono text-sm sm:text-base text-[#0A2E65]">$1,100</span>
                  <span className="text-slate-600 font-sans font-semibold text-xs">POR DÍA <span className="text-[10px] font-bold">+ IVA</span></span>
                </div>
              </div>

              {/* STELLANTIS BRANDS STRIP */}
              <div className="pt-2 flex items-center justify-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-1 text-slate-600 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <span className="font-black tracking-widest text-slate-700">STELLANTIS</span>
                <span className="font-black italic text-slate-700">DODGE</span>
                <span className="font-bold text-slate-700">FIAT</span>
                <span className="font-black text-slate-700">Jeep</span>
                <span className="font-extrabold text-slate-700">RAM</span>
                <span className="font-bold text-slate-700">PEUGEOT</span>
              </div>

              {/* BOTTOM CONTACT BLUE FOOTER */}
              <div className="-mx-5 sm:-mx-8 -mb-6 mt-4 bg-[#051C44] text-white p-4 sm:p-5 rounded-b-2xl shadow-lg border-t border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  
                  {/* Col 1: Label */}
                  <div className="sm:col-span-4 text-center sm:text-left border-b sm:border-b-0 sm:border-r border-blue-800/80 pb-2 sm:pb-0 sm:pr-2">
                    <p className="font-black text-xs sm:text-[13px] tracking-wider uppercase leading-tight text-slate-100">
                      DUDAS Y/O<br className="hidden sm:inline" /> COMENTARIOS:
                    </p>
                  </div>

                  {/* Col 2: Contacts */}
                  <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Contact 1 */}
                    <div className="space-y-0.5 text-center sm:text-left">
                      <p className="font-extrabold text-white text-xs sm:text-[13px]">
                        Anahí Ojeda
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-sky-200">
                        <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                        <a href="mailto:aog@adistem.com.mx" className="hover:underline hover:text-white transition">
                          aog@adistem.com.mx
                        </a>
                        <button
                          onClick={() => handleCopyEmail("aog@adistem.com.mx")}
                          className="p-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Copiar correo"
                        >
                          {copiedEmail === "aog@adistem.com.mx" ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Contact 2 */}
                    <div className="space-y-0.5 text-center sm:text-left">
                      <p className="font-extrabold text-white text-xs sm:text-[13px]">
                        Gabriela Pérez
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-sky-200">
                        <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                        <a href="mailto:gph@adistem.com.mx" className="hover:underline hover:text-white transition">
                          gph@adistem.com.mx
                        </a>
                        <button
                          onClick={() => handleCopyEmail("gph@adistem.com.mx")}
                          className="p-0.5 text-slate-400 hover:text-white transition cursor-pointer"
                          title="Copiar correo"
                        >
                          {copiedEmail === "gph@adistem.com.mx" ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Bottom Close Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="hidden sm:inline">
            Convención ADISTEM 2026 • Tarifas sujetas a disponibilidad
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition cursor-pointer ml-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
