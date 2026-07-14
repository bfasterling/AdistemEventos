import React from "react";
import { Plane, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DataStore } from "../dataStore";

interface FlightsStepProps {
  t: any;
  isDarkMode: boolean;
  hasFlights: boolean;
  setHasFlights: (val: boolean) => void;
  vuelosSeparados: boolean;
  setVuelosSeparados: (val: boolean) => void;
  vueloLlegadaAerolinea: string;
  setVueloLlegadaAerolinea: (val: string) => void;
  vueloLlegadaNoVuelo: string;
  setVueloLlegadaNoVuelo: (val: string) => void;
  vueloLlegadaFecha: string;
  setVueloLlegadaFecha: (val: string) => void;
  vueloLlegadaHora: string;
  setVueloLlegadaHora: (val: string) => void;
  vueloLlegadaPersonas: number;
  setVueloLlegadaPersonas: (val: number) => void;
  vueloLlegadaPasajerosTitular: string[];
  setVueloLlegadaPasajerosTitular: (val: string[] | ((prev: string[]) => string[])) => void;
  vueloRegresoAerolinea: string;
  setVueloRegresoAerolinea: (val: string) => void;
  vueloRegresoNoVuelo: string;
  setVueloRegresoNoVuelo: (val: string) => void;
  vueloRegresoFecha: string;
  setVueloRegresoFecha: (val: string) => void;
  vueloRegresoHora: string;
  setVueloRegresoHora: (val: string) => void;
  vueloRegresoPersonas: number;
  setVueloRegresoPersonas: (val: number) => void;
  vueloRegresoPasajerosTitular: string[];
  setVueloRegresoPasajerosTitular: (val: string[] | ((prev: string[]) => string[])) => void;
  nombreTitular: string;
  apellidosTitular: string;
  companionsList: Array<{
    id: string;
    firstName: string;
    lastName: string;
    vueloLlegadaAerolinea?: string;
    vueloLlegadaNoVuelo?: string;
    vueloLlegadaFecha?: string;
    vueloLlegadaHora?: string;
    vueloLlegadaPasajeros?: string[];
    vueloRegresoAerolinea?: string;
    vueloRegresoNoVuelo?: string;
    vueloRegresoFecha?: string;
    vueloRegresoHora?: string;
    vueloRegresoPasajeros?: string[];
  }>;
  updateCompanionItem: (id: string, field: string, val: any) => void;
  minors: Array<{ name: string; lastName: string; age: number; sex: string; allergies: string }>;
  handleNext: () => void;
  handlePrev: () => void;
}

export default function FlightsStep({
  t,
  isDarkMode,
  hasFlights,
  setHasFlights,
  vuelosSeparados,
  setVuelosSeparados,
  vueloLlegadaAerolinea,
  setVueloLlegadaAerolinea,
  vueloLlegadaNoVuelo,
  setVueloLlegadaNoVuelo,
  vueloLlegadaFecha,
  setVueloLlegadaFecha,
  vueloLlegadaHora,
  setVueloLlegadaHora,
  vueloLlegadaPersonas,
  setVueloLlegadaPersonas,
  vueloLlegadaPasajerosTitular,
  setVueloLlegadaPasajerosTitular,
  vueloRegresoAerolinea,
  setVueloRegresoAerolinea,
  vueloRegresoNoVuelo,
  setVueloRegresoNoVuelo,
  vueloRegresoFecha,
  setVueloRegresoFecha,
  vueloRegresoHora,
  setVueloRegresoHora,
  vueloRegresoPersonas,
  setVueloRegresoPersonas,
  vueloRegresoPasajerosTitular,
  setVueloRegresoPasajerosTitular,
  nombreTitular,
  apellidosTitular,
  companionsList,
  updateCompanionItem,
  minors,
  handleNext,
  handlePrev
}: FlightsStepProps) {
  const config = DataStore.getEventConfig();
  const defaultStartDate = config?.eventStartDate || "2026-11-15";
  const defaultEndDate = config?.eventEndDate || "2026-11-18";

  const allPeople = [
    { id: "titular", name: `${nombreTitular} ${apellidosTitular}`.trim() || "Titular", type: "Titular" },
    ...companionsList.map((c, idx) => ({ id: c.id || `C-${idx + 1}`, name: `${c.firstName} ${c.lastName}`.trim() || `Acompañante Adulto #${idx + 1}`, type: "Acompañante" })),
    ...minors.map((m, idx) => ({ id: `M-${idx + 1}`, name: (m.name && m.name.trim()) ? `${m.name} ${m.lastName}`.trim() : `Menor #${idx + 1} (${m.age} años)`, type: "Menor" }))
  ];

  const renderPassengerSelector = (
    label: string,
    selectedIds: string[],
    onChange: (newIds: string[]) => void
  ) => {
    return (
      <div className={`mt-3 p-3 rounded-xl border space-y-2 ${
        isDarkMode ? "bg-slate-850/50 border-blue-500/10" : "bg-blue-500/5 border-blue-500/10"
      }`}>
        <label className="block text-[10px] font-extrabold text-blue-500 uppercase tracking-wider">
          {label} ({selectedIds.length} pasajeros)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {allPeople.map((p) => {
            const isChecked = selectedIds.includes(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-medium cursor-pointer transition-all duration-200 ${
                  isChecked
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-300"
                    : isDarkMode 
                      ? "bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800"
                      : "bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const nextIds = isChecked
                      ? selectedIds.filter((id) => id !== p.id)
                      : [...selectedIds, p.id];
                    onChange(nextIds);
                  }}
                  className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                />
                <span className="truncate">{p.name} <span className="opacity-60 text-[9px] font-normal">({p.type})</span></span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
          <Plane className="w-5 h-5 text-blue-500" />
          Paso 4: Aerolíneas / Transporte
        </h3>
        <p className={`text-xs mt-0.5 ${t.textMuted}`}>
          Registra los datos de transporte de llegada y regreso para coordinar tu recepción en el aeropuerto y traslados al hotel sede.
        </p>
      </div>

      {/* Highlights YES/NO Flights Toggle */}
      <div className={`p-4 border-2 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 ${
        hasFlights
          ? "bg-emerald-500/10 border-emerald-500 shadow-sm"
          : "bg-rose-500/5 border-rose-500/20"
      }`}>
        <div>
          <p className={`text-xs font-black uppercase tracking-wider ${hasFlights ? "text-emerald-500" : "text-rose-500"}`}>
            {hasFlights ? "✓ ¡Vuelos/Transporte Confirmados!" : "⚠ Vuelos/Transporte Pendientes"}
          </p>
          <p className={`text-[11px] ${t.textMuted}`}>
            ¿Ya posees vuelos o transporte terrestre confirmados para la convención?
          </p>
        </div>
        <button 
          onClick={() => setHasFlights(!hasFlights)}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer shrink-0 ${
            hasFlights 
              ? 'bg-emerald-600 text-white shadow-xs' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
          }`}
        >
          {hasFlights ? "Ya registrado" : "Sí, registrar vuelos"}
        </button>
      </div>

      <AnimatePresence>
        {hasFlights && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden pt-2 text-xs"
          >
            {/* Separate flights toggle */}
            <div className={`${t.section} flex items-center justify-between gap-4 p-4 rounded-xl transition-colors duration-300`}>
              <div>
                <p className={`text-xs font-bold ${t.textHeading}`}>¿Los pasajeros viajan en vuelos separados?</p>
                <p className={`text-[11px] ${t.textMuted}`}>
                  Si viajan juntos, registra un único itinerario para todos.
                </p>
              </div>
              <input 
                type="checkbox"
                checked={vuelosSeparados}
                onChange={e => setVuelosSeparados(e.target.checked)}
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
            </div>

            {!vuelosSeparados ? (
              // Together Block
              <div className="space-y-4">
                <div className={`border-2 border-dashed border-blue-500/20 p-4 rounded-2xl space-y-4`}>
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                    Itinerario Unificado de Llegada y Salida
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 p-3 bg-slate-500/5 rounded-xl border border-slate-500/10">
                      <span className="font-bold text-blue-400 uppercase text-[10px] tracking-widest block">LLEGADA</span>
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Aerolínea / Transporte *</label>
                          <select
                            value={vueloLlegadaAerolinea}
                            onChange={e => setVueloLlegadaAerolinea(e.target.value)}
                            className={`w-full mt-1 p-2 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                              isDarkMode ? "bg-slate-850 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            <option value="">Selecciona...</option>
                            <option value="Aeroméxico">Aeroméxico</option>
                            <option value="Volaris">Volaris</option>
                            <option value="Vivaaerobus">Vivaaerobus</option>
                            <option value="Privado">Privado</option>
                            <option value="Terrestre">Terrestre</option>
                          </select>
                        </div>
                        {vueloLlegadaAerolinea && vueloLlegadaAerolinea !== "Terrestre" && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              {vueloLlegadaAerolinea === "Privado" ? "Matrícula de la aeronave *" : "Número de Vuelo *"}
                            </label>
                            <input
                              type="text"
                              value={vueloLlegadaNoVuelo}
                              onChange={e => setVueloLlegadaNoVuelo(e.target.value)}
                              placeholder={vueloLlegadaAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "AM-504"}
                              className={`${t.inputWhite} mt-1`}
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha de Llegada (Noviembre 2026)</label>
                          <input
                            type="date"
                            min="2026-11-01"
                            max="2026-11-30"
                            value={vueloLlegadaFecha}
                            onChange={e => setVueloLlegadaFecha(e.target.value)}
                            className={`${t.inputWhite} mt-1`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Hora de Llegada</label>
                          <input
                            type="time"
                            value={vueloLlegadaHora}
                            onChange={e => setVueloLlegadaHora(e.target.value)}
                            className={`${t.inputWhite} mt-1`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-3 bg-slate-500/5 rounded-xl border border-slate-500/10">
                      <span className="font-bold text-blue-400 uppercase text-[10px] tracking-widest block">REGRESO</span>
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Aerolínea / Transporte *</label>
                          <select
                            value={vueloRegresoAerolinea}
                            onChange={e => setVueloRegresoAerolinea(e.target.value)}
                            className={`w-full mt-1 p-2 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                              isDarkMode ? "bg-slate-850 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            <option value="">Selecciona...</option>
                            <option value="Aeroméxico">Aeroméxico</option>
                            <option value="Volaris">Volaris</option>
                            <option value="Vivaaerobus">Vivaaerobus</option>
                            <option value="Privado">Privado</option>
                            <option value="Terrestre">Terrestre</option>
                          </select>
                        </div>
                        {vueloRegresoAerolinea && vueloRegresoAerolinea !== "Terrestre" && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              {vueloRegresoAerolinea === "Privado" ? "Matrícula de la aeronave *" : "Número de Vuelo *"}
                            </label>
                            <input
                              type="text"
                              value={vueloRegresoNoVuelo}
                              onChange={e => setVueloRegresoNoVuelo(e.target.value)}
                              placeholder={vueloRegresoAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "AM-505"}
                              className={`${t.inputWhite} mt-1`}
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Fecha de Salida (Noviembre 2026)</label>
                          <input
                            type="date"
                            min="2026-11-01"
                            max="2026-11-30"
                            value={vueloRegresoFecha}
                            onChange={e => setVueloRegresoFecha(e.target.value)}
                            className={`${t.inputWhite} mt-1`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Hora de Salida</label>
                          <input
                            type="time"
                            value={vueloRegresoHora}
                            onChange={e => setVueloRegresoHora(e.target.value)}
                            className={`${t.inputWhite} mt-1`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Separate Block (Titular + Companions)
              <div className="space-y-6">
                {/* Titular flight block */}
                <div className="border border-blue-500/20 p-4 rounded-2xl space-y-4 bg-slate-500/5">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-blue-500">
                    🛫 Vuelo del Titular ({nombreTitular} {apellidosTitular})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-emerald-400 text-[10px] uppercase block mb-1">LLEGADA</span>
                      <select
                        value={vueloLlegadaAerolinea}
                        onChange={e => setVueloLlegadaAerolinea(e.target.value)}
                        className={`w-full p-2 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                          isDarkMode ? "bg-slate-850 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <option value="">Selecciona...</option>
                        <option value="Aeroméxico">Aeroméxico</option>
                        <option value="Volaris">Volaris</option>
                        <option value="Vivaaerobus">Vivaaerobus</option>
                        <option value="Privado">Privado</option>
                        <option value="Terrestre">Terrestre</option>
                      </select>
                      {vueloLlegadaAerolinea && vueloLlegadaAerolinea !== "Terrestre" && (
                        <input
                          type="text"
                          value={vueloLlegadaNoVuelo}
                          onChange={e => setVueloLlegadaNoVuelo(e.target.value)}
                          placeholder={vueloLlegadaAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "No. Vuelo"}
                          className={`${t.inputWhite} mt-1`}
                        />
                      )}
                      <input
                        type="date"
                        min="2026-11-01"
                        max="2026-11-30"
                        value={vueloLlegadaFecha}
                        onChange={e => setVueloLlegadaFecha(e.target.value)}
                        className={`${t.inputWhite} mt-1`}
                      />
                      <input
                        type="time"
                        value={vueloLlegadaHora}
                        onChange={e => setVueloLlegadaHora(e.target.value)}
                        className={`${t.inputWhite} mt-1`}
                      />
                      {vueloLlegadaAerolinea && renderPassengerSelector(
                        "¿Quiénes viajan en el vuelo de llegada del titular?",
                        vueloLlegadaPasajerosTitular || [],
                        (newIds) => {
                          setVueloLlegadaPasajerosTitular(newIds);
                          setVueloLlegadaPersonas(newIds.length);
                        }
                      )}
                    </div>

                    <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-emerald-400 text-[10px] uppercase block mb-1">SALIDA</span>
                      <select
                        value={vueloRegresoAerolinea}
                        onChange={e => setVueloRegresoAerolinea(e.target.value)}
                        className={`w-full p-2 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                          isDarkMode ? "bg-slate-850 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <option value="">Selecciona...</option>
                        <option value="Aeroméxico">Aeroméxico</option>
                        <option value="Volaris">Volaris</option>
                        <option value="Vivaaerobus">Vivaaerobus</option>
                        <option value="Privado">Privado</option>
                        <option value="Terrestre">Terrestre</option>
                      </select>
                      {vueloRegresoAerolinea && vueloRegresoAerolinea !== "Terrestre" && (
                        <input
                          type="text"
                          value={vueloRegresoNoVuelo}
                          onChange={e => setVueloRegresoNoVuelo(e.target.value)}
                          placeholder={vueloRegresoAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "No. Vuelo"}
                          className={`${t.inputWhite} mt-1`}
                        />
                      )}
                      <input
                        type="date"
                        min="2026-11-01"
                        max="2026-11-30"
                        value={vueloRegresoFecha}
                        onChange={e => setVueloRegresoFecha(e.target.value)}
                        className={`${t.inputWhite} mt-1`}
                      />
                      <input
                        type="time"
                        value={vueloRegresoHora}
                        onChange={e => setVueloRegresoHora(e.target.value)}
                        className={`${t.inputWhite} mt-1`}
                      />
                      {vueloRegresoAerolinea && renderPassengerSelector(
                        "¿Quiénes viajan en el vuelo de regreso del titular?",
                        vueloRegresoPasajerosTitular || [],
                        (newIds) => {
                          setVueloRegresoPasajerosTitular(newIds);
                          setVueloRegresoPersonas(newIds.length);
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* Companions flights */}
                {companionsList.map((comp, index) => (
                  <div key={comp.id} className="border border-blue-500/10 p-4 rounded-2xl space-y-4 bg-slate-500/5">
                    <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-blue-400">
                      🛫 Vuelo de {comp.firstName} {comp.lastName} (Acompañante Adulto #{index + 1})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-blue-400 text-[10px] uppercase block mb-1">LLEGADA</span>
                        <select
                          value={comp.vueloLlegadaAerolinea || ""}
                          onChange={e => updateCompanionItem(comp.id, "vueloLlegadaAerolinea", e.target.value)}
                          className={`w-full p-2 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                            isDarkMode ? "bg-slate-850 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <option value="">Selecciona...</option>
                          <option value="Aeroméxico">Aeroméxico</option>
                          <option value="Volaris">Volaris</option>
                          <option value="Vivaaerobus">Vivaaerobus</option>
                          <option value="Privado">Privado</option>
                          <option value="Terrestre">Terrestre</option>
                        </select>
                        {comp.vueloLlegadaAerolinea && comp.vueloLlegadaAerolinea !== "Terrestre" && (
                          <input
                            type="text"
                            value={comp.vueloLlegadaNoVuelo || ""}
                            onChange={e => updateCompanionItem(comp.id, "vueloLlegadaNoVuelo", e.target.value)}
                            placeholder={comp.vueloLlegadaAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "No. Vuelo"}
                            className={`${t.inputWhite} mt-1`}
                          />
                        )}
                        <input
                          type="date"
                          min="2026-11-01"
                          max="2026-11-30"
                          value={comp.vueloLlegadaFecha || defaultStartDate}
                          onChange={e => updateCompanionItem(comp.id, "vueloLlegadaFecha", e.target.value)}
                          className={`${t.inputWhite} mt-1`}
                        />
                        <input
                          type="time"
                          value={comp.vueloLlegadaHora || "12:00"}
                          onChange={e => updateCompanionItem(comp.id, "vueloLlegadaHora", e.target.value)}
                          className={`${t.inputWhite} mt-1`}
                        />
                        {comp.vueloLlegadaAerolinea && renderPassengerSelector(
                          `¿Quiénes viajan en el vuelo de llegada de ${comp.firstName}?`,
                          comp.vueloLlegadaPasajeros || [comp.id],
                          (newIds) => {
                            updateCompanionItem(comp.id, "vueloLlegadaPasajeros", newIds);
                          }
                        )}
                      </div>

                      <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-blue-400 text-[10px] uppercase block mb-1">SALIDA</span>
                        <select
                          value={comp.vueloRegresoAerolinea || ""}
                          onChange={e => updateCompanionItem(comp.id, "vueloRegresoAerolinea", e.target.value)}
                          className={`w-full p-2 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                            isDarkMode ? "bg-slate-850 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <option value="">Selecciona...</option>
                          <option value="Aeroméxico">Aeroméxico</option>
                          <option value="Volaris">Volaris</option>
                          <option value="Vivaaerobus">Vivaaerobus</option>
                          <option value="Privado">Privado</option>
                          <option value="Terrestre">Terrestre</option>
                        </select>
                        {comp.vueloRegresoAerolinea && comp.vueloRegresoAerolinea !== "Terrestre" && (
                          <input
                            type="text"
                            value={comp.vueloRegresoNoVuelo || ""}
                            onChange={e => updateCompanionItem(comp.id, "vueloRegresoNoVuelo", e.target.value)}
                            placeholder={comp.vueloRegresoAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "No. Vuelo"}
                            className={`${t.inputWhite} mt-1`}
                          />
                        )}
                        <input
                          type="date"
                          min="2026-11-01"
                          max="2026-11-30"
                          value={comp.vueloRegresoFecha || defaultEndDate}
                          onChange={e => updateCompanionItem(comp.id, "vueloRegresoFecha", e.target.value)}
                          className={`${t.inputWhite} mt-1`}
                        />
                        <input
                          type="time"
                          value={comp.vueloRegresoHora || "15:00"}
                          onChange={e => updateCompanionItem(comp.id, "vueloRegresoHora", e.target.value)}
                          className={`${t.inputWhite} mt-1`}
                        />
                        {comp.vueloRegresoAerolinea && renderPassengerSelector(
                          `¿Quiénes viajan en el vuelo de regreso de ${comp.firstName}?`,
                          comp.vueloRegresoPasajeros || [comp.id],
                          (newIds) => {
                            updateCompanionItem(comp.id, "vueloRegresoPasajeros", newIds);
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <button 
          onClick={handlePrev}
          className={t.btnSec + " flex items-center gap-1.5"}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        <button 
          onClick={handleNext}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
        >
          <span>Siguiente: Actividades</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
