import React from "react";
import { Bed, ChevronRight } from "lucide-react";
import { DataStore } from "../dataStore";

interface LodgingStepProps {
  t: any;
  isDarkMode: boolean;
  carnetTipoHabitacion: string;
  setCarnetTipoHabitacion: (val: string) => void;
  configuracionHabitacion: string;
  setConfiguracionHabitacion: (val: string) => void;
  nochesAdicionales: number;
  setNochesAdicionales: (val: number) => void;
  requerimientosAdicionales: string;
  setRequerimientosAdicionales: (val: string) => void;
  calculateTotalHotelCost: () => number;
  handleNext: () => void;
  setIsLoginMode: (val: boolean) => void;
}

export default function LodgingStep({
  t,
  isDarkMode,
  carnetTipoHabitacion,
  setCarnetTipoHabitacion,
  configuracionHabitacion,
  setConfiguracionHabitacion,
  nochesAdicionales,
  setNochesAdicionales,
  requerimientosAdicionales,
  setRequerimientosAdicionales,
  calculateTotalHotelCost,
  handleNext,
  setIsLoginMode
}: LodgingStepProps) {
  const config = DataStore.getEventConfig();
  const hotels = DataStore.getHotels();
  const hotelSedeName = config?.hotelSede || "Sin asignar";
  const hotel = hotels.find((h) => h.name === hotelSedeName) || hotels[0];

  // Parse existing requerimientosAdicionales
  const getParsedRequirements = (str: string) => {
    if (!str) return { hasCuna: false, hasElevador: false, hasMovilidad: false, commentPart: "" };
    
    const parts = str.split(" | Comentarios: ");
    let checkboxPart = "";
    let commentPart = "";
    
    if (parts.length > 1) {
      checkboxPart = parts[0];
      commentPart = parts[1];
    } else {
      const hasAnyCheckbox = ["Cuna", "Cerca de Elevador", "Facilidades de Movilidad"].some(o => str.includes(o));
      if (hasAnyCheckbox) {
        checkboxPart = str;
        commentPart = "";
      } else {
        checkboxPart = "";
        commentPart = str;
      }
    }
    
    const hasCuna = checkboxPart.includes("Cuna");
    const hasElevador = checkboxPart.includes("Cerca de Elevador");
    const hasMovilidad = checkboxPart.includes("Facilidades de Movilidad");
    
    return { hasCuna, hasElevador, hasMovilidad, commentPart };
  };

  const { hasCuna, hasElevador, hasMovilidad, commentPart } = getParsedRequirements(requerimientosAdicionales);

  const updateRequirements = (options: { cuna: boolean; elevador: boolean; movilidad: boolean; comments: string }) => {
    const currentOptions = [];
    if (options.cuna) currentOptions.push("Cuna");
    if (options.elevador) currentOptions.push("Cerca de Elevador");
    if (options.movilidad) currentOptions.push("Facilidades de Movilidad");
    
    const checkboxStr = currentOptions.join(", ");
    const commentStr = options.comments.trim();
    
    if (checkboxStr && commentStr) {
      setRequerimientosAdicionales(`${checkboxStr} | Comentarios: ${commentStr}`);
    } else if (checkboxStr) {
      setRequerimientosAdicionales(checkboxStr);
    } else {
      setRequerimientosAdicionales(commentStr);
    }
  };

  const handleCheckboxChange = (option: string, checked: boolean) => {
    updateRequirements({
      cuna: option === "Cuna" ? checked : hasCuna,
      elevador: option === "Cerca de Elevador" ? checked : hasElevador,
      movilidad: option === "Facilidades de Movilidad" ? checked : hasMovilidad,
      comments: commentPart
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateRequirements({
      cuna: hasCuna,
      elevador: hasElevador,
      movilidad: hasMovilidad,
      comments: e.target.value
    });
  };

  const commentsValue = commentPart;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
          <Bed className="w-5 h-5 text-blue-500" />
          Paso 1: Elección de Carnet y Hospedaje Sede
        </h3>
        <p className={`text-xs mt-0.5 ${t.textMuted}`}>
          Selecciona tu tipo de carnet de habitación y la configuración de cama para el hotel sede. El costo base del carnet cubre la estadía oficial de 3 noches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room Type Combobox */}
        <div>
          <label className={`block font-bold uppercase mb-1.5 text-[11px] ${t.label}`}>
            Tipo de carnet *
          </label>
          <select
            value={carnetTipoHabitacion === "Sencilla" ? "Sencillo" : carnetTipoHabitacion}
            onChange={(e) => setCarnetTipoHabitacion(e.target.value)}
            className={`w-full p-2.5 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-700"
            }`}
          >
            <option value="Sencillo">Sencillo</option>
            <option value="Doble">Doble</option>
          </select>
          <p className={`text-[10px] mt-1 ${t.textMuted}`}>
            Selecciona la categoría de habitación oficial de Stellantis México.
          </p>
        </div>

        {/* Bed Configuration Combobox */}
        <div>
          <label className={`block font-bold uppercase mb-1.5 text-[11px] ${t.label}`}>
            Configuración de Cama *
          </label>
          <select
            value={configuracionHabitacion}
            onChange={(e) => setConfiguracionHabitacion(e.target.value)}
            className={`w-full p-2.5 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-700"
            }`}
          >
            <option value="King Size">King Size</option>
            <option value="Queen/Queen">Queen/Queen</option>
          </select>
          <p className={`text-[10px] mt-1 ${t.textMuted}`}>
            Sujeto a disponibilidad del hotel sede {hotelSedeName}.
          </p>
        </div>
      </div>

      {/* Additional Nights and Comments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Narrow Nights Selector */}
        <div className="md:col-span-1 max-w-[160px]">
          <label className={`block font-bold uppercase mb-1.5 text-[11px] ${t.label}`}>
            Noches Adicionales
          </label>
          <input
            type="number"
            min={0}
            max={10}
            value={nochesAdicionales}
            onChange={(e) => {
              const val = Math.min(10, Math.max(0, Number(e.target.value)));
              setNochesAdicionales(val);
            }}
            className="w-full p-2.5 bg-transparent border border-[#56B7A9] rounded-xl text-xs font-bold transition-colors duration-300"
          />
        </div>

        <div className="md:col-span-2">
          <label className={`block font-bold uppercase mb-1.5 text-[11px] ${t.label}`}>
            Comentarios Especiales de Hospedaje
          </label>
          <textarea
            value={commentsValue}
            onChange={handleTextareaChange}
            placeholder="Ej. Habitación piso alto, requerimientos de accesibilidad, etc."
            rows={2}
            className="w-full p-2.5 bg-transparent border border-[#56B7A9] rounded-xl text-xs transition-colors duration-300 resize-none"
          />
        </div>
      </div>

      {/* Additional Requirements Multi-select */}
      <div className="space-y-2">
        <label className={`block font-bold uppercase text-[11px] ${t.label}`}>
          Requerimientos adicionales
        </label>
        <div className="flex flex-wrap gap-4 p-3 bg-[#56B7A9]/10 rounded-xl border border-[#56B7A9]/40">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={hasCuna}
              onChange={(e) => handleCheckboxChange("Cuna", e.target.checked)}
              className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-4 h-4"
            />
            <span>Cuna</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={hasElevador}
              onChange={(e) => handleCheckboxChange("Cerca de Elevador", e.target.checked)}
              className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-4 h-4"
            />
            <span>Cerca de Elevador</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={hasMovilidad}
              onChange={(e) => handleCheckboxChange("Facilidades de Movilidad", e.target.checked)}
              className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-4 h-4"
            />
            <span>Facilidades de Movilidad</span>
          </label>
        </div>
      </div>

      {/* 
        SECCIÓN DESACTIVADA TEMPORALMENTE: "Estimación de Hospedaje Sede"
        Esta sección se volverá a activar posteriormente. No borrar.
        
        <div className="p-4 bg-slate-500/5 rounded-xl border border-dashed border-[#56B7A9]/40 space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-400">Estimación de Hospedaje Sede</h4>
          <p className="text-xs text-slate-500">
            Estimación de tarifas y costos asociados a su estadía oficial de 3 noches más noches adicionales seleccionadas.
          </p>
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Estimado:</span>
            <span className="text-sm font-black text-[#56B7A9]">${calculateTotalHotelCost ? calculateTotalHotelCost().toLocaleString() : 0} MXN</span>
          </div>
        </div>
      */}

      {/* Buttons */}
      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <button 
          onClick={() => setIsLoginMode(true)}
          className={t.btnSec}
        >
          Regresar al Login
        </button>
        <button 
          onClick={handleNext}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
        >
          <span>Siguiente: Información del Titular</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
