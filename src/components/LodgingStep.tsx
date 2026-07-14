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

  let baseRatePerNight = hotel ? hotel.costSencilla : 4500;
  if (carnetTipoHabitacion === "Sencillo Extra" || carnetTipoHabitacion === "Sencilla Extra") {
    baseRatePerNight = hotel ? hotel.costSencilloExtra : 5000;
  } else if (carnetTipoHabitacion === "Doble") {
    baseRatePerNight = hotel ? hotel.costDoble : 5500;
  } else if (carnetTipoHabitacion === "Doble Extra") {
    baseRatePerNight = hotel ? hotel.costDobleExtra : 6000;
  }

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
            Tipo de Cuarto / Carnet *
          </label>
          <select
            value={carnetTipoHabitacion}
            onChange={(e) => setCarnetTipoHabitacion(e.target.value)}
            className={`w-full p-2.5 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
              isDarkMode
                ? "bg-slate-800 border-slate-700 text-slate-100"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <option value="Sencilla">Sencilla (Estándar)</option>
            <option value="Sencilla Extra">Sencilla Extra (Premium)</option>
            <option value="Doble">Doble (Estándar)</option>
            <option value="Doble Extra">Doble Extra (Premium)</option>
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
            className={`w-full p-2.5 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
              isDarkMode
                ? "bg-slate-800 border-slate-700 text-slate-100"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <option value="King">1 Cama King Size</option>
            <option value="Queen/Queen">2 Camas Queen Size</option>
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
            max={3}
            value={nochesAdicionales}
            onChange={(e) => {
              const val = Math.min(3, Math.max(0, Number(e.target.value)));
              setNochesAdicionales(val);
            }}
            className={`${t.input} transition-colors duration-300 font-bold`}
          />
          <p className={`text-[10px] mt-1 ${t.textMuted}`}>
            Máximo 3 noches adicionales.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className={`block font-bold uppercase mb-1.5 text-[11px] ${t.label}`}>
            Requerimientos o Comentarios Especiales de Hospedaje
          </label>
          <textarea
            value={requerimientosAdicionales}
            onChange={(e) => setRequerimientosAdicionales(e.target.value)}
            placeholder="Ej. Habitación piso alto, requerimientos de accesibilidad, etc."
            rows={2}
            className={`${t.input} py-2 transition-colors duration-300 resize-none`}
          />
        </div>
      </div>

      {/* Pricing Estimator Panel */}
      <div className={`p-5 rounded-2xl transition-colors duration-300 ${
        isDarkMode 
          ? "bg-slate-900 border border-slate-800 text-slate-100" 
          : "bg-slate-950 text-white"
      }`}>
        <h4 className="font-bold text-blue-400 text-xs font-sans flex items-center justify-between border-b border-white/15 pb-2">
          <span>Estimación de Hospedaje Sede ({hotelSedeName})</span>
          <span className="text-white text-[9px] bg-blue-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">
            ADISTEM
          </span>
        </h4>
        <div className="space-y-2 pt-2.5 text-[11px] font-sans">
          <div className="flex justify-between">
            <span>Costo por Noche ({carnetTipoHabitacion}):</span>
            <span className="font-semibold text-blue-200">
              ${baseRatePerNight.toLocaleString()} MXN / noche
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Estadía Oficial Obligatoria (3 noches):</span>
            <span>${(3 * baseRatePerNight).toLocaleString()} MXN</span>
          </div>
          {nochesAdicionales > 0 && (
            <div className="flex justify-between text-amber-300">
              <span>Noches adicionales solicitadas ({nochesAdicionales}):</span>
              <span>
                +${(nochesAdicionales * baseRatePerNight).toLocaleString()} MXN
              </span>
            </div>
          )}
          <div className="border-t border-white/10 pt-2 flex justify-between text-xs font-bold">
            <span>Importe Total Estimado Sede:</span>
            <span className="text-emerald-400 font-black text-sm">
              ${calculateTotalHotelCost().toLocaleString()} MXN
            </span>
          </div>
        </div>
      </div>

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
