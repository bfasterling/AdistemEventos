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
  nochesAdicionalesFechas: string[];
  setNochesAdicionalesFechas: (val: string[]) => void;
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
  nochesAdicionalesFechas,
  setNochesAdicionalesFechas,
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

  const [reqNoches, setReqNoches] = React.useState(() => {
    return Array.isArray(nochesAdicionalesFechas) && nochesAdicionalesFechas.length > 0;
  });

  // Sync reqNoches if nochesAdicionalesFechas changes externally (e.g. on load)
  React.useEffect(() => {
    if (Array.isArray(nochesAdicionalesFechas) && nochesAdicionalesFechas.length > 0) {
      setReqNoches(true);
    } else {
      setReqNoches(false);
    }
  }, [nochesAdicionalesFechas]);

  // Parse existing requerimientosAdicionales
  const getParsedRequirements = (str: string) => {
    if (!str) return { hasCuna: false, hasElevador: false, hasMovilidad: false, hasOtro: false, commentPart: "" };
    
    const parts = str.split(" | Comentarios: ");
    let checkboxPart = "";
    let commentPart = "";
    
    if (parts.length > 1) {
      checkboxPart = parts[0];
      commentPart = parts[1];
    } else {
      const hasAnyCheckbox = ["Cuna", "Cerca de Elevador", "Facilidades de Movilidad", "Otro"].some(o => str.includes(o));
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
    const hasOtro = checkboxPart.includes("Otro");
    
    return { hasCuna, hasElevador, hasMovilidad, hasOtro, commentPart };
  };

  const { hasCuna, hasElevador, hasMovilidad, hasOtro, commentPart } = getParsedRequirements(requerimientosAdicionales);

  const updateRequirements = (options: { cuna: boolean; elevador: boolean; movilidad: boolean; otro: boolean; comments: string }, isBlur: boolean = false) => {
    const currentOptions = [];
    if (options.cuna) currentOptions.push("Cuna");
    if (options.elevador) currentOptions.push("Cerca de Elevador");
    if (options.movilidad) currentOptions.push("Facilidades de Movilidad");
    if (options.otro) currentOptions.push("Otro");
    
    const checkboxStr = currentOptions.join(", ");
    const commentStr = isBlur ? options.comments.trim() : options.comments;
    
    if (checkboxStr && commentStr !== "") {
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
      otro: option === "Otro" ? checked : hasOtro,
      comments: (option === "Otro" && !checked) ? "" : commentPart
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateRequirements({
      cuna: hasCuna,
      elevador: hasElevador,
      movilidad: hasMovilidad,
      otro: hasOtro,
      comments: e.target.value
    });
  };

  const toggleDate = (dateStr: string) => {
    if (nochesAdicionalesFechas.includes(dateStr)) {
      setNochesAdicionalesFechas(nochesAdicionalesFechas.filter(d => d !== dateStr));
    } else {
      setNochesAdicionalesFechas([...nochesAdicionalesFechas, dateStr]);
    }
  };

  const commentsValue = commentPart;
  const reqStar = <span className="text-red-500 font-extrabold text-sm ml-0.5">*</span>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl md:text-2xl font-extrabold flex items-center gap-2.5 ${t.textTitle}`}>
          <Bed className="w-6 h-6 text-blue-500" />
          Paso 1: Elección de Carnet
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room Type Combobox */}
        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Tipo de carnet {reqStar}
          </label>
          <select
            value={carnetTipoHabitacion === "Sencilla" ? "Sencillo" : carnetTipoHabitacion}
            onChange={(e) => setCarnetTipoHabitacion(e.target.value)}
            className={`w-full p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-700"
            }`}
          >
            <option value="Sencillo">Sencillo</option>
            <option value="Doble">Doble</option>
          </select>
        </div>

        {/* Bed Configuration Combobox */}
        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Configuración de Cama {reqStar}
          </label>
          <select
            value={configuracionHabitacion}
            onChange={(e) => setConfiguracionHabitacion(e.target.value)}
            className={`w-full p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
              isDarkMode
                ? "bg-slate-800 text-slate-100"
                : "bg-white text-slate-700"
            }`}
          >
            <option value="King Size">King Size</option>
            <option value="Queen/Queen">Queen/Queen</option>
          </select>
          <p className={`text-xs mt-1.5 ${t.textMuted}`}>
            Sujeto a disponibilidad del hotel.
          </p>
        </div>
      </div>

      {/* Requieres noches adicionales Question Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 border-2 border-[#56B7A9]/40 bg-[#56B7A9]/10 p-5 rounded-2xl">
        <div>
          <p className={`text-sm md:text-base font-extrabold ${t.textHeading} uppercase`}>¿REQUIERES NOCHES ADICIONALES?</p>
          <p className={`text-xs mt-0.5 ${t.textMuted}`}>Costo extra aplicable a tu carnet</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setReqNoches(false);
              setNochesAdicionalesFechas([]);
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-black transition cursor-pointer select-none ${
              !reqNoches
                ? "bg-red-500 text-white shadow-xs"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-750"
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => {
              setReqNoches(true);
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-black transition cursor-pointer select-none ${
              reqNoches
                ? "bg-[#56B7A9] text-white shadow-xs"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-750"
            }`}
          >
            Sí
          </button>
        </div>
      </div>

      {/* Date-Selection Panels if Yes is active */}
      {reqNoches && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Antes del Evento panel */}
          <div className="p-4 rounded-xl border border-[#56B7A9]/40 bg-[#56B7A9]/5 space-y-3">
            <h4 className="text-xs md:text-sm font-black uppercase text-[#56B7A9] tracking-wide">
              Previo al evento
            </h4>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 cursor-pointer text-sm font-black select-none ${isDarkMode ? "text-white" : "text-slate-950"}`}>
                <input
                  type="checkbox"
                  checked={nochesAdicionalesFechas.includes("2026-11-04")}
                  onChange={() => toggleDate("2026-11-04")}
                  className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-5 h-5 cursor-pointer"
                />
                <span>4 Nov</span>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer text-sm font-black select-none ${isDarkMode ? "text-white" : "text-slate-950"}`}>
                <input
                  type="checkbox"
                  checked={nochesAdicionalesFechas.includes("2026-11-05")}
                  onChange={() => toggleDate("2026-11-05")}
                  className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-5 h-5 cursor-pointer"
                />
                <span>5 Nov</span>
              </label>
            </div>
          </div>

          {/* Posterior al Evento panel */}
          <div className="p-4 rounded-xl border border-[#56B7A9]/40 bg-[#56B7A9]/5 space-y-3">
            <h4 className="text-xs md:text-sm font-black uppercase text-[#56B7A9] tracking-wide">
              Posterior al evento
            </h4>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 cursor-pointer text-sm font-black select-none ${isDarkMode ? "text-white" : "text-slate-950"}`}>
                <input
                  type="checkbox"
                  checked={nochesAdicionalesFechas.includes("2026-11-10")}
                  onChange={() => toggleDate("2026-11-10")}
                  className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-5 h-5 cursor-pointer"
                />
                <span>10 Nov</span>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer text-sm font-black select-none ${isDarkMode ? "text-white" : "text-slate-950"}`}>
                <input
                  type="checkbox"
                  checked={nochesAdicionalesFechas.includes("2026-11-11")}
                  onChange={() => toggleDate("2026-11-11")}
                  className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-5 h-5 cursor-pointer"
                />
                <span>11 Nov</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Additional Requirements Block */}
      <div className="space-y-2">
        <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
          Requerimientos adicionales
        </label>
        <div className="flex flex-wrap gap-5 p-4 bg-[#56B7A9]/10 rounded-xl border border-[#56B7A9]/40">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={hasCuna}
              onChange={(e) => handleCheckboxChange("Cuna", e.target.checked)}
              className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-4.5 h-4.5"
            />
            <span>Cuna</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={hasElevador}
              onChange={(e) => handleCheckboxChange("Cerca de Elevador", e.target.checked)}
              className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-4.5 h-4.5"
            />
            <span>Cerca de Elevador</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={hasMovilidad}
              onChange={(e) => handleCheckboxChange("Facilidades de Movilidad", e.target.checked)}
              className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-4.5 h-4.5"
            />
            <span>Facilidades de Movilidad</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold">
            <input
              type="checkbox"
              checked={hasOtro}
              onChange={(e) => handleCheckboxChange("Otro", e.target.checked)}
              className="rounded text-blue-600 border-[#56B7A9] focus:ring-blue-500 w-4.5 h-4.5"
            />
            <span>Otro</span>
          </label>
        </div>
      </div>

      {/* Conditionally shown Comments Block */}
      {hasOtro && (
        <div className="space-y-2">
          <label className={`block font-extrabold uppercase text-xs md:text-sm tracking-wide ${t.label}`}>
            Comentarios Especiales de Hospedaje
          </label>
          <textarea
            value={commentsValue}
            onChange={handleTextareaChange}
            onBlur={(e) => {
              updateRequirements({
                cuna: hasCuna,
                elevador: hasElevador,
                movilidad: hasMovilidad,
                otro: hasOtro,
                comments: e.target.value.toUpperCase()
              }, true);
            }}
            placeholder="Ej. Habitación piso alto, requerimientos de accesibilidad, etc."
            rows={2}
            className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base transition-colors duration-300 resize-none"
          />
        </div>
      )}

      {/* Buttons */}
      <div className={`border-t pt-5 flex justify-end ${t.border}`}>
        <button 
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm flex items-center gap-2"
        >
          <span>Siguiente: Información del Titular</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
