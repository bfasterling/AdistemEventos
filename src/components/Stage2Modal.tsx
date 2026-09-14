import React from "react";
import { motion } from "motion/react";
import { X, ArrowRight } from "lucide-react";
import LogoConvencion from "../assets/images/Logo_convencion_reducido.png";

interface Stage2ModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onClose: () => void;
}

export const Stage2Modal: React.FC<Stage2ModalProps> = ({
  isOpen,
  onContinue,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stage2-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-[490px] my-auto rounded-3xl p-6 sm:p-8 md:p-9 shadow-2xl border border-[#CDBCA3] overflow-hidden"
        style={{
          backgroundColor: "#E6D7C3",
          backgroundImage: "radial-gradient(ellipse at center, #ECE0CF 0%, #E3D3BD 70%, #DECDB6 100%)",
          color: "#0B2545"
        }}
      >
        {/* Subtle decorative edge ring */}
        <div className="absolute inset-2 sm:inset-2.5 rounded-[22px] border border-[#0B2545]/15 pointer-events-none" />

        {/* Top Close Button ('X') - returns user to login */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/5 hover:bg-black/15 text-[#0B2545] flex items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B2545]/40"
          title="Cerrar y volver al inicio de sesión"
          aria-label="Cerrar modal y regresar al login"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </button>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* Logo Convención ADISTEM 2026 */}
          <div className="mb-2 sm:mb-3">
            <img 
              src={LogoConvencion} 
              alt="Convención ADISTEM 2026" 
              className="h-16 sm:h-20 md:h-22 w-auto object-contain drop-shadow-xs select-none"
            />
          </div>

          {/* Main Headline */}
          <h2 
            id="stage2-modal-title"
            className="text-2xl sm:text-3xl md:text-[34px] font-black text-[#0B2545] uppercase tracking-tight leading-none mb-2 font-display"
          >
            ¡ABRIMOS REGISTRO!
          </h2>

          {/* Pill Badge: ETAPA 2 with flanking lines */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 my-2.5 sm:my-3 w-full">
            <div className="h-[1.5px] flex-1 max-w-[50px] sm:max-w-[70px] bg-[#0B2545]/35"></div>
            <span className="bg-[#0B2545] text-white text-xs sm:text-sm font-black px-6 sm:px-8 py-1 rounded-full uppercase tracking-wider shadow-sm">
              ETAPA 2
            </span>
            <div className="h-[1.5px] flex-1 max-w-[50px] sm:max-w-[70px] bg-[#0B2545]/35"></div>
          </div>

          {/* Centered Box: A PARTIR DE HOY / LUNES 14 DE SEPTIEMBRE */}
          <div className="w-full border-[1.5px] sm:border-2 border-[#0B2545]/35 rounded-2xl p-4 sm:p-5 my-2.5 sm:my-3 bg-[#DDCDB6]/35 space-y-1">
            <p className="text-[10px] sm:text-xs font-black text-[#0B2545] uppercase tracking-widest">
              A PARTIR DE HOY
            </p>
            <p className="text-xl sm:text-2xl md:text-[26px] font-black text-[#0B2545] tracking-tight uppercase leading-tight">
              LUNES 14 DE SEPTIEMBRE
            </p>
            <p className="text-xs sm:text-sm md:text-base font-bold text-[#0B2545] pt-0.5">
              Registro a más Dueños por grupo.
            </p>
          </div>

          {/* Deadline Section */}
          <div className="my-1.5 sm:my-2 w-full">
            <p className="text-[10px] sm:text-xs font-black text-[#0B2545] uppercase tracking-widest mb-0.5">
              FECHA LÍMITE DE REGISTRO:
            </p>
            <p className="text-xl sm:text-2xl md:text-[26px] font-black text-[#0B2545] tracking-tight uppercase leading-tight">
              VIERNES 25 DE SEPTIEMBRE
            </p>
          </div>

          {/* Reminder / Footer Note */}
          <p className="text-[11px] sm:text-xs md:text-sm text-[#0B2545] font-medium leading-relaxed max-w-sm mx-auto mt-2 px-2">
            Recordamos que la <strong className="font-black text-[#0B2545]">disponibilidad es limitada</strong> y se asigna por orden de registro.
          </p>

          {/* Continuar Button */}
          <button
            type="button"
            onClick={onContinue}
            className="w-full mt-5 sm:mt-6 py-3.5 sm:py-4 px-6 rounded-2xl bg-[#0B2545] hover:bg-[#133560] active:scale-[0.99] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#0B2545]/30"
          >
            <span>Continuar</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
