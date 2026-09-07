import React, { useState } from "react";
import { X, Download, Mail, Printer, ShieldAlert, Check, Copy, ExternalLink } from "lucide-react";
import { jsPDF } from "jspdf";
import LogoConvencion from "../assets/images/Logo_convencion_reducido.png";

interface CancellationPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CancellationPolicyModal({ isOpen, onClose }: CancellationPolicyModalProps) {
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

      // Background soft tint
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Top decorative accents
      doc.setFillColor(224, 242, 254);
      doc.triangle(0, 0, 160, 0, 0, 120, "F");
      doc.setFillColor(186, 230, 253);
      doc.triangle(pageWidth, 0, pageWidth - 160, 0, pageWidth, 120, "F");

      // Header Left
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.setTextColor(10, 37, 64);
      doc.text("ROSEWOOD", 45, 52);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 47, 100);
      doc.text("MANDARINA", 45, 66);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("NAYARIT, MÉXICO", 45, 78);

      // Header Center Emblem
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(10, 37, 64);
      doc.text("CONVENCIÓN", pageWidth / 2, 45, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(15, 50, 109);
      doc.text("ADISTEM", pageWidth / 2, 62, { align: "center" });
      doc.setFontSize(15);
      doc.setTextColor(30, 64, 175);
      doc.text("2026", pageWidth / 2, 79, { align: "center" });

      // Header Right: 06 AL 09 NOVIEMBRE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(10, 37, 64);
      doc.text("06", pageWidth - 125, 58);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("AL", pageWidth - 94, 52);
      doc.setFontSize(22);
      doc.setTextColor(10, 37, 64);
      doc.text("09", pageWidth - 78, 58);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 47, 100);
      doc.text("NOVIEMBRE", pageWidth - 100, 74, { align: "center" });

      // Separator line
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(1);
      doc.line(45, 95, pageWidth - 45, 95);

      // Main Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(10, 46, 101);
      doc.text("POLÍTICA DE CANCELACIÓN", pageWidth / 2, 138, { align: "center" });

      // Intro text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(15, 35, 70);
      const introText = "El carnet deberá estar liquidado al 100% a más tardar el 15 de octubre de 2026. De no completarse el pago en esa fecha, el lugar se liberará y pasará al siguiente Distribuidor en lista de espera.";
      const splitIntro = doc.splitTextToSize(introText, pageWidth - 110);
      doc.text(splitIntro, pageWidth / 2, 172, { align: "center", lineHeightFactor: 1.4 });

      // Section Title: Fechas de corte
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(10, 46, 101);
      doc.text("Fechas de corte para cancelaciones:", pageWidth / 2, 235, { align: "center" });

      // 3 Cards Layout
      const cardY = 258;
      const cardWidth = 160;
      const cardHeight = 135;
      const gap = 16;
      const startX = (pageWidth - (cardWidth * 3 + gap * 2)) / 2;

      const cardsData = [
        {
          num: "1",
          text: "Cancelaciones recibidas\nhasta el 30 de septiembre\nde 2026:\n\nreembolso completo,\nsin penalización."
        },
        {
          num: "2",
          text: "Cancelaciones recibidas\nentre el 1 y el 15 de\noctubre de 2026:\n\npenalización del 50% del\ncosto total confirmado."
        },
        {
          num: "3",
          text: "Cancelaciones recibidas\na partir del 16 de octubre\nde 2026:\n\npenalización del 100% del\ncosto total confirmado,\nno reembolsable."
        }
      ];

      cardsData.forEach((c, idx) => {
        const cx = startX + idx * (cardWidth + gap);
        // Rounded card background (Navy blue)
        doc.setFillColor(10, 46, 101);
        doc.roundedRect(cx, cardY, cardWidth, cardHeight, 12, 12, "F");

        // Top Badge circle (Navy with white number)
        doc.setFillColor(10, 46, 101);
        doc.circle(cx + cardWidth / 2, cardY, 13, "F");
        doc.setDrawColor(248, 250, 252);
        doc.setLineWidth(2);
        doc.circle(cx + cardWidth / 2, cardY, 13, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(c.num, cx + cardWidth / 2, cardY + 4, { align: "center" });

        // Card Text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        const lines = doc.splitTextToSize(c.text, cardWidth - 24);
        doc.text(lines, cx + cardWidth / 2, cardY + 34, { align: "center", lineHeightFactor: 1.35 });
      });

      // Contact Box
      const boxY = 425;
      const boxWidth = pageWidth - 140;
      const boxHeight = 110;
      const boxX = (pageWidth - boxWidth) / 2;

      // Box outline
      doc.setDrawColor(10, 46, 101);
      doc.setLineWidth(1.5);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 14, 14, "FD");

      // Box Title Pill
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(10, 46, 101);
      doc.text("Toda cancelación deberá solicitarse por escrito a:", pageWidth / 2, boxY + 24, { align: "center" });

      // Contact 1: Anahí Ojeda
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Anahí Ojeda", boxX + 110, boxY + 54);

      // Email Pill 1
      doc.setFillColor(238, 246, 255);
      doc.setDrawColor(186, 230, 253);
      doc.setLineWidth(1);
      doc.roundedRect(boxX + 220, boxY + 39, 185, 22, 11, 11, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(10, 46, 101);
      doc.text("aog@adistem.com.mx", boxX + 312, boxY + 53, { align: "center" });

      // "y/o"
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text("y/o", boxX + 80, boxY + 86);

      // Contact 2: Gabriela Pérez
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Gabriela Pérez", boxX + 110, boxY + 86);

      // Email Pill 2
      doc.setFillColor(238, 246, 255);
      doc.setDrawColor(186, 230, 253);
      doc.setLineWidth(1);
      doc.roundedRect(boxX + 220, boxY + 71, 185, 22, 11, 11, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(10, 46, 101);
      doc.text("gph@adistem.com.mx", boxX + 312, boxY + 85, { align: "center" });

      // Disclaimer Text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 35, 70);
      doc.text("La fecha y hora de recepción de ese correo es la que determina la ventana aplicable.", pageWidth / 2, 570, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text("No se tramitan cancelaciones por otro medio.", pageWidth / 2, 588, { align: "center" });

      // Bottom Brand Footer
      const footerHeight = 44;
      doc.setFillColor(8, 35, 77);
      doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("STELLANTIS    |    DODGE    |    FIAT    |    JEEP    |    RAM    |    PEUGEOT", pageWidth / 2, pageHeight - 18, { align: "center" });

      doc.save("Politica_de_Cancelacion_Convencion_ADISTEM_2026.pdf");
    } catch (err) {
      console.error("Error generating cancellation policy PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[220] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[92vh] max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Action Bar */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                POLÍTICA DE CANCELACIÓN
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Documento Oficial • Convención ADISTEM 2026 (Rosewood Mandarina)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
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

        {/* Scrollable Container with exact visual fidelity to the provided PDF */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 bg-slate-100 dark:bg-slate-950/70 flex justify-center">
          <div className="w-full max-w-[700px] h-fit bg-gradient-to-b from-[#F0F5FA] via-white to-[#F0F5FA] text-[#0A2540] rounded-2xl shadow-xl border border-slate-300/80 overflow-hidden relative select-text mb-4">
            
            {/* Top decorative gradient corners */}
            <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-br from-sky-200/50 to-transparent pointer-events-none rounded-br-full" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-sky-200/50 to-transparent pointer-events-none rounded-bl-full" />

            <div className="p-6 sm:p-10 space-y-7 relative z-10">
              
              {/* Header 3-columns */}
              <div className="grid grid-cols-3 items-center border-b border-slate-200/80 pb-5">
                {/* Left: Rosewood Mandarina */}
                <div className="text-left space-y-0.5">
                  <h3 className="font-serif font-black text-sm sm:text-base tracking-widest text-[#0A2540]">
                    ROSEWOOD
                  </h3>
                  <p className="font-sans font-bold text-[11px] sm:text-xs text-[#0A2540] tracking-wider">
                    MANDARINA
                  </p>
                  <p className="font-sans font-medium text-[9px] sm:text-[10px] text-slate-500 tracking-wider">
                    NAYARIT, MÉXICO
                  </p>
                </div>

                {/* Center: Emblem */}
                <div className="flex flex-col items-center justify-center text-center">
                  <img 
                    src={LogoConvencion} 
                    alt="Convención ADISTEM 2026" 
                    className="w-16 sm:w-20 h-auto object-contain drop-shadow-xs"
                  />
                </div>

                {/* Right: Dates */}
                <div className="text-right space-y-0.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tighter">06</span>
                    <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase">AL</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tighter">09</span>
                  </div>
                  <p className="font-sans font-black text-[10px] sm:text-xs text-[#0A2540] tracking-widest uppercase">
                    NOVIEMBRE
                  </p>
                </div>
              </div>

              {/* Main Document Title */}
              <div className="text-center pt-1">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0A2E65] tracking-tight uppercase">
                  POLÍTICA DE CANCELACIÓN
                </h1>
              </div>

              {/* Paragraph intro */}
              <div className="text-center max-w-xl mx-auto">
                <p className="text-xs sm:text-sm font-semibold text-[#0A2540] leading-relaxed">
                  El carnet deberá estar liquidado al <strong className="font-black text-[#0A2E65]">100%</strong> a más tardar el{" "}
                  <strong className="font-black text-[#0A2E65]">15 de octubre de 2026</strong>. De no completarse el pago en esa fecha, el lugar se liberará y pasará al siguiente Distribuidor en lista de espera.
                </p>
              </div>

              {/* Section Cutoff Dates */}
              <div className="space-y-4 pt-1">
                <h3 className="text-center text-sm sm:text-base font-black text-[#0A2E65] tracking-tight">
                  Fechas de corte para cancelaciones:
                </h3>

                {/* 3 Step Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3">
                  {/* Card 1 */}
                  <div className="relative pt-4 flex flex-col">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0A2E65] text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white z-10">
                      1
                    </div>
                    <div className="flex-1 bg-[#0A2E65] text-white p-4 pt-6 rounded-2xl text-center shadow-md flex flex-col justify-center min-h-[140px]">
                      <p className="text-xs sm:text-[13px] leading-snug font-medium">
                        Cancelaciones recibidas{" "}
                        <strong className="font-bold underline decoration-sky-300">hasta el 30 de septiembre de 2026:</strong>{" "}
                        reembolso completo, sin penalización.
                      </p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="relative pt-4 flex flex-col">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0A2E65] text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white z-10">
                      2
                    </div>
                    <div className="flex-1 bg-[#0A2E65] text-white p-4 pt-6 rounded-2xl text-center shadow-md flex flex-col justify-center min-h-[140px]">
                      <p className="text-xs sm:text-[13px] leading-snug font-medium">
                        Cancelaciones recibidas{" "}
                        <strong className="font-bold underline decoration-sky-300">entre el 1 y el 15 de octubre de 2026:</strong>{" "}
                        penalización del 50% del costo total confirmado.
                      </p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="relative pt-4 flex flex-col">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#0A2E65] text-white font-black text-sm flex items-center justify-center shadow-md border-2 border-white z-10">
                      3
                    </div>
                    <div className="flex-1 bg-[#0A2E65] text-white p-4 pt-6 rounded-2xl text-center shadow-md flex flex-col justify-center min-h-[140px]">
                      <p className="text-xs sm:text-[13px] leading-snug font-medium">
                        Cancelaciones recibidas{" "}
                        <strong className="font-bold underline decoration-sky-300">a partir del 16 de octubre de 2026:</strong>{" "}
                        penalización del 100% del costo total confirmado, no reembolsable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Written Request Box */}
              <div className="relative pt-3">
                <div className="border-1.5 border-[#0A2E65] rounded-2xl p-5 sm:p-6 bg-white/80 shadow-xs space-y-4">
                  
                  {/* Top embedded pill badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F0F5FA] px-4 py-0.5 rounded-full border border-[#0A2E65]/40 text-[#0A2E65] font-black text-[11px] sm:text-xs uppercase tracking-wide">
                    Toda cancelación deberá solicitarse por escrito a:
                  </div>

                  {/* Contact 1 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2 sm:gap-4 text-center sm:text-left pt-2">
                    <span className="font-black text-sm sm:text-base text-[#0A2E65] min-w-[140px] text-center sm:text-right">
                      Anahí Ojeda
                    </span>
                    <div className="inline-flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-[#0A2E65] text-xs sm:text-sm font-bold shadow-2xs hover:bg-sky-100 transition mx-auto sm:mx-0">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a href="mailto:aog@adistem.com.mx" className="hover:underline">
                        aog@adistem.com.mx
                      </a>
                      <button 
                        onClick={() => handleCopyEmail("aog@adistem.com.mx")} 
                        className="p-1 hover:text-blue-800 transition cursor-pointer"
                        title="Copiar correo"
                      >
                        {copiedEmail === "aog@adistem.com.mx" ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Divider y/o */}
                  <div className="text-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      y/o
                    </span>
                  </div>

                  {/* Contact 2 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
                    <span className="font-black text-sm sm:text-base text-[#0A2E65] min-w-[140px] text-center sm:text-right">
                      Gabriela Pérez
                    </span>
                    <div className="inline-flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-[#0A2E65] text-xs sm:text-sm font-bold shadow-2xs hover:bg-sky-100 transition mx-auto sm:mx-0">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a href="mailto:gph@adistem.com.mx" className="hover:underline">
                        gph@adistem.com.mx
                      </a>
                      <button 
                        onClick={() => handleCopyEmail("gph@adistem.com.mx")} 
                        className="p-1 hover:text-blue-800 transition cursor-pointer"
                        title="Copiar correo"
                      >
                        {copiedEmail === "gph@adistem.com.mx" ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-center space-y-1 pt-1 text-slate-700">
                <p className="text-xs sm:text-[13px] font-medium leading-relaxed">
                  La fecha y hora de recepción de ese correo es la que determina la ventana aplicable.
                </p>
                <p className="text-xs sm:text-[13px] font-black text-[#0A2E65]">
                  No se tramitan cancelaciones por otro medio.
                </p>
              </div>

              {/* Bottom Brand Bar */}
              <div className="-mx-6 -mb-6 sm:-mx-10 sm:-mb-10 mt-6 bg-[#08234D] text-white py-3.5 px-4 sm:px-6 rounded-b-2xl flex items-center justify-around flex-wrap gap-3 sm:gap-6 border-t border-slate-700 shadow-inner">
                <span className="font-extrabold text-[11px] sm:text-xs tracking-wider">STELLANTIS</span>
                <span className="text-slate-600 text-[10px] hidden sm:inline">•</span>
                <span className="font-black italic text-[11px] sm:text-xs tracking-wider">DODGE</span>
                <span className="text-slate-600 text-[10px] hidden sm:inline">•</span>
                <span className="font-bold text-[11px] sm:text-xs tracking-widest">FIAT</span>
                <span className="text-slate-600 text-[10px] hidden sm:inline">•</span>
                <span className="font-black text-[11px] sm:text-xs tracking-wider">Jeep</span>
                <span className="text-slate-600 text-[10px] hidden sm:inline">•</span>
                <span className="font-extrabold text-[11px] sm:text-xs tracking-wider">RAM</span>
                <span className="text-slate-600 text-[10px] hidden sm:inline">•</span>
                <span className="font-bold text-[11px] sm:text-xs tracking-wider uppercase">PEUGEOT</span>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="hidden sm:inline">
            Convención ADISTEM 2026 • Todos los derechos reservados
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
