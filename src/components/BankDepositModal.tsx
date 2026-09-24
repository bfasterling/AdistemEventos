import React, { useState } from "react";
import { X, Download, Mail, Printer, Copy, Check, Building, Landmark, CreditCard, FileCheck } from "lucide-react";
import { jsPDF } from "jspdf";
import LogoConvencion from "../assets/images/Logo_convencion_reducido.png";

interface BankDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BankDepositModal({ isOpen, onClose }: BankDepositModalProps) {
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [copiedConcept, setCopiedConcept] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const clabeNumber = "012180001086256976";
  const conceptText = "Nombre de la Distribuidora";

  const handleCopyClabe = () => {
    navigator.clipboard.writeText(clabeNumber);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2500);
  };

  const handleCopyConcept = () => {
    navigator.clipboard.writeText(conceptText);
    setCopiedConcept(true);
    setTimeout(() => setCopiedConcept(false), 2500);
  };

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

      // Header Left: ROSEWOOD MANDARINA NAYARIT, MÉXICO
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(10, 37, 75);
      doc.text("ROSEWOOD", 45, 68);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 47, 100);
      doc.text("MANDARINA", 45, 80);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 95, 115);
      doc.text("NAYARIT, MÉXICO", 45, 90);

      // Header Center Emblem: CONVENCIÓN ADISTEM 2026
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(20, 55, 125);
      doc.text("CONVENCIÓN", pageWidth / 2, 66, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(15, 47, 100);
      doc.text("ADISTEM", pageWidth / 2, 82, { align: "center" });
      doc.setFontSize(17);
      doc.setTextColor(30, 70, 180);
      doc.text("2026", pageWidth / 2, 100, { align: "center" });

      // Header Right: 06 AL 09 NOVIEMBRE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(10, 37, 75);
      doc.text("06", pageWidth - 122, 75);
      doc.setFontSize(8.5);
      doc.setTextColor(80, 95, 115);
      doc.text("AL", pageWidth - 93, 70);
      doc.setFontSize(20);
      doc.setTextColor(10, 37, 75);
      doc.text("09", pageWidth - 78, 75);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 47, 100);
      doc.text("NOVIEMBRE", pageWidth - 98, 90, { align: "center" });

      // Main Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(10, 45, 105);
      doc.text("FORMA DE PAGO", pageWidth / 2, 132, { align: "center" });
      doc.text("POR TRANSFERENCIA", pageWidth / 2, 154, { align: "center" });

      // Subtitle
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(15, 55, 120);
      doc.text("DATOS BANCARIOS:", pageWidth / 2, 184, { align: "center" });

      // Beneficiary & Bank
      doc.setFontSize(18);
      doc.setTextColor(10, 35, 85);
      doc.text("AMDIFIC, S.C.", pageWidth / 2, 214, { align: "center" });

      doc.setFontSize(15);
      doc.setTextColor(10, 50, 120);
      doc.text("BBVA", pageWidth / 2, 238, { align: "center" });

      // CLABE Box
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 60, 100);
      doc.text("Clabe Interbancaria:", pageWidth / 2, 268, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(10, 45, 125);
      doc.text("012180001086256976", pageWidth / 2, 292, { align: "center" });

      // Concepto
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(30, 60, 100);
      doc.text("Concepto de Pago:", pageWidth / 2, 326, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(10, 45, 125);
      doc.text('“Nombre de la Distribuidora”', pageWidth / 2, 348, { align: "center" });

      // Notice Box: Enviar Comprobante
      const noticeY = 380;
      const boxWidth = pageWidth - 140;
      const boxX = 70;

      doc.setFillColor(248, 246, 242);
      doc.setDrawColor(185, 175, 160);
      doc.roundedRect(boxX, noticeY, boxWidth, 90, 8, 8, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(10, 45, 105);
      doc.text("Enviar Comprobante de Pago y", pageWidth / 2, noticeY + 22, { align: "center" });
      doc.text("Constancia de Situación Fiscal actualizada", pageWidth / 2, noticeY + 38, { align: "center" });
      doc.setFontSize(10.5);
      doc.text("a Maricarmen Velazquez Molina al correo:", pageWidth / 2, noticeY + 54, { align: "center" });

      // Email pill
      doc.setFillColor(15, 60, 140);
      doc.roundedRect(pageWidth / 2 - 110, noticeY + 62, 220, 20, 10, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("mvc@adistem.com.mx", pageWidth / 2, noticeY + 76, { align: "center" });

      // BBVA Account Voucher Table Representation
      const voucherY = 485;
      const vWidth = boxWidth;
      const vX = boxX;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(170, 180, 195);
      doc.roundedRect(vX, voucherY, vWidth, 125, 4, 4, "FD");

      // BBVA text logo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 68, 129);
      doc.text("BBVA", vX + 16, voucherY + 24);

      // Voucher header right
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(40, 50, 60);
      doc.text("Estado de Cuenta", vX + vWidth - 14, voucherY + 16, { align: "right" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("CENTRALIZADORA DEBITO EMPR S I", vX + vWidth - 14, voucherY + 25, { align: "right" });
      doc.text("PAGINA 1 / 11", vX + vWidth - 14, voucherY + 34, { align: "right" });

      // Left Address Block
      doc.setFontSize(6.5);
      doc.setTextColor(50, 55, 65);
      doc.setFont("helvetica", "bold");
      doc.text("AMDIFIC SC", vX + 16, voucherY + 42);
      doc.setFont("helvetica", "normal");
      doc.text("AV PRESIDENTE MASARYK 67", vX + 16, voucherY + 50);
      doc.text("POLANCO IV SECCION, MIGUEL HIDALGO", vX + 16, voucherY + 58);
      doc.text("CIUDAD DE MEXICO  MEXICO  CP 11550", vX + 16, voucherY + 66);

      // Right mini-table
      const tX = vX + 190;
      doc.setFontSize(6.5);
      doc.text("Periodo: DEL 01/08/2026 AL 31/08/2026", tX, voucherY + 44);
      doc.text("Fecha de Corte: 31/08/2026", tX, voucherY + 52);
      doc.text("No. de Cuenta: 0108625697", tX, voucherY + 60);
      doc.text("No. de Cliente: B5977445", tX, voucherY + 68);
      doc.text("R.F.C: DIF151019P9A", tX, voucherY + 76);
      doc.setFont("helvetica", "bold");
      doc.text("No. Cuenta CLABE: 012180001086256976", tX, voucherY + 84);

      // SUCURSAL INFO
      doc.setFont("helvetica", "normal");
      doc.text("SUCURSAL: 0825 EMPRESAS CHURUBUSCO", vX + 16, voucherY + 86);
      doc.text("DIRECCION: AV RIO CHURUBUSCO 1072 COL. NUEVA ROSITA MEX DF", vX + 16, voucherY + 94);
      doc.text("PLAZA: CIUDAD DE MEXICO    TEL: (5)6044170", vX + 16, voucherY + 102);

      // Voucher bottom bar
      doc.setDrawColor(220, 225, 230);
      doc.line(vX + 10, voucherY + 108, vX + vWidth - 10, voucherY + 108);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text("Información Financiera", vX + 16, voucherY + 118);
      doc.text("MONEDA NACIONAL", vX + vWidth - 16, voucherY + 118, { align: "right" });

      // Stellantis Brand footer line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 110, 125);
      doc.text("STELLANTIS    |    DODGE    |    FIAT    |    JEEP    |    RAM    |    PEUGEOT", pageWidth / 2, 634, { align: "center" });

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

      doc.save("Datos_Transferencia_Convencion_ADISTEM_2026.pdf");
    } catch (err) {
      console.error("Error generating bank deposit PDF:", err);
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
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                FORMA DE PAGO POR TRANSFERENCIA
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Datos Bancarios Oficiales • Convención ADISTEM 2026
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

            <div className="px-5 sm:px-8 pt-6 pb-6 space-y-5 relative z-10">
              
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
                <h1 className="text-xl sm:text-2xl font-black text-[#0A2E65] tracking-tight leading-snug uppercase">
                  FORMA DE PAGO<br />
                  POR TRANSFERENCIA
                </h1>
              </div>

              {/* Section Header */}
              <div className="text-center pt-1">
                <h2 className="text-xs sm:text-sm font-black text-[#0F3987] tracking-widest uppercase">
                  DATOS BANCARIOS:
                </h2>
              </div>

              {/* Bank Details Central Box */}
              <div className="text-center space-y-3 max-w-md mx-auto">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0A2E65] tracking-wide">
                    AMDIFIC, S.C.
                  </h3>
                  <p className="text-base sm:text-lg font-black text-[#0F3987] tracking-wider mt-0.5">
                    BBVA
                  </p>
                </div>

                {/* CLABE Box with Copy Button */}
                <div className="bg-[#EBE4D8]/90 border border-[#C5BAA9] rounded-xl p-3 sm:p-4 shadow-xs space-y-1 relative group">
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    Clabe Interbancaria:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg sm:text-2xl font-black font-mono tracking-wider text-[#0A2E65] select-all">
                      {clabeNumber}
                    </span>
                    <button
                      onClick={handleCopyClabe}
                      className="p-1.5 bg-[#0F3478] hover:bg-[#0A2555] active:scale-95 text-white rounded-lg transition cursor-pointer shadow-xs"
                      title="Copiar CLABE"
                    >
                      {copiedClabe ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copiedClabe && (
                    <p className="text-[10px] font-bold text-emerald-700 animate-in fade-in">
                      ✓ ¡CLABE copiada al portapapeles!
                    </p>
                  )}
                </div>

                {/* Concept Box with Copy Button */}
                <div className="bg-[#EBE4D8]/90 border border-[#C5BAA9] rounded-xl p-3 sm:p-4 shadow-xs space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    Concepto de Pago:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base sm:text-lg font-black text-[#0A2E65]">
                      “{conceptText}”
                    </span>
                    <button
                      onClick={handleCopyConcept}
                      className="p-1.5 bg-[#0F3478] hover:bg-[#0A2555] active:scale-95 text-white rounded-lg transition cursor-pointer shadow-xs"
                      title="Copiar Concepto"
                    >
                      {copiedConcept ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Box: Enviar Comprobante */}
              <div className="bg-[#EBE4D8]/90 border border-[#C5BAA9] rounded-2xl p-4 sm:p-5 text-center shadow-xs space-y-2.5">
                <p className="text-xs sm:text-[13px] font-extrabold text-[#0A2E65] leading-relaxed">
                  Enviar Comprobante de Pago y<br />
                  <span className="font-black">Constancia de Situación Fiscal actualizada</span><br />
                  a Maricarmen Velazquez Molina al correo:
                </p>
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 bg-[#0F3987] hover:bg-[#0A2555] text-white px-4 py-2 rounded-full shadow-sm transition">
                    <Mail className="w-4 h-4 text-sky-300" />
                    <a href="mailto:mvc@adistem.com.mx" className="text-xs sm:text-sm font-bold tracking-wide hover:underline">
                      mvc@adistem.com.mx
                    </a>
                    <button
                      onClick={() => handleCopyEmail("mvc@adistem.com.mx")}
                      className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer ml-1"
                      title="Copiar correo"
                    >
                      {copiedEmail === "mvc@adistem.com.mx" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* BBVA Official Account Voucher Snippet Representation */}
              <div className="bg-white border border-slate-300 rounded-xl p-3.5 sm:p-4 text-slate-800 shadow-sm space-y-2 text-[10px] sm:text-[11px]">
                <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-black text-[#004481] tracking-tighter">
                      BBVA
                    </span>
                  </div>
                  <div className="text-right text-[9px] sm:text-[10px] leading-tight text-slate-600">
                    <p className="font-bold text-slate-800">Estado de Cuenta</p>
                    <p>CENTRALIZADORA DEBITO EMPR S I</p>
                    <p className="font-mono">PAGINA 1 / 11</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Left: Address Info */}
                  <div className="space-y-0.5 text-slate-600">
                    <p className="font-bold text-slate-800">AMDIFIC SC</p>
                    <p>AV PRESIDENTE MASARYK 67</p>
                    <p>POLANCO IV SECCION</p>
                    <p>MIGUEL HIDALGO</p>
                    <p>CIUDAD DE MEXICO  MEXICO  CP 11550</p>
                  </div>

                  {/* Right: Technical Account Details */}
                  <div className="space-y-0.5 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-[9px] sm:text-[10px]">
                    <p><span className="text-slate-400 font-sans font-medium">Periodo:</span> DEL 01/08/2026 AL 31/08/2026</p>
                    <p><span className="text-slate-400 font-sans font-medium">Fecha de Corte:</span> 31/08/2026</p>
                    <p><span className="text-slate-400 font-sans font-medium">No. de Cuenta:</span> 0108625697</p>
                    <p><span className="text-slate-400 font-sans font-medium">No. de Cliente:</span> B5977445</p>
                    <p><span className="text-slate-400 font-sans font-medium">R.F.C:</span> DIF151019P9A</p>
                    <p className="text-[#004481] font-bold"><span className="text-slate-500 font-sans font-medium">No. Cuenta CLABE:</span> 012180001086256976</p>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-100 space-y-0.5">
                  <p><strong className="text-slate-700">SUCURSAL:</strong> 0825 EMPRESAS CHURUBUSCO</p>
                  <p><strong className="text-slate-700">DIRECCION:</strong> AV RIO CHURUBUSCO 1072 COL. NUEVA ROSITA MEX DF</p>
                  <p><strong className="text-slate-700">PLAZA:</strong> CIUDAD DE MEXICO &nbsp; <strong className="text-slate-700">TELEFONO:</strong> (5)6044170</p>
                </div>

                <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-1 border-t border-slate-100">
                  <span>Información Financiera</span>
                  <span>MONEDA NACIONAL</span>
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
            Convención ADISTEM 2026 • Datos verificados
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
