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

  // Find which arrival flight each minor is currently assigned to.
  // Returns a map of minor ID ("M-1", etc.) to the assigned host name or id (e.g., "titular" or companion.id).
  const getMinorArrivalAssignments = () => {
    const assignments: Record<string, { assignedId: string; assignedName: string }> = {};
    
    // Check titular's arrival flight
    const titularArrival = vueloLlegadaPasajerosTitular || [];
    titularArrival.forEach(id => {
      if (id.startsWith("M-")) {
        assignments[id] = { assignedId: "titular", assignedName: `Titular (${nombreTitular})` };
      }
    });
    
    // Check companions' arrival flights
    companionsList.forEach(comp => {
      const compArrival = comp.vueloLlegadaPasajeros || [];
      compArrival.forEach(id => {
        if (id.startsWith("M-")) {
          assignments[id] = { assignedId: comp.id, assignedName: `${comp.firstName} ${comp.lastName}`.trim() };
        }
      });
    });
    
    return assignments;
  };

  // Find which departure flight each minor is currently assigned to.
  const getMinorDepartureAssignments = () => {
    const assignments: Record<string, { assignedId: string; assignedName: string }> = {};
    
    // Check titular's departure flight
    const titularDeparture = vueloRegresoPasajerosTitular || [];
    titularDeparture.forEach(id => {
      if (id.startsWith("M-")) {
        assignments[id] = { assignedId: "titular", assignedName: `Titular (${nombreTitular})` };
      }
    });
    
    // Check companions' departure flights
    companionsList.forEach(comp => {
      const compDeparture = comp.vueloRegresoPasajeros || [];
      compDeparture.forEach(id => {
        if (id.startsWith("M-")) {
          assignments[id] = { assignedId: comp.id, assignedName: `${comp.firstName} ${comp.lastName}`.trim() };
        }
      });
    });
    
    return assignments;
  };

  const renderMinorSelectorForSeparatedFlights = (
    flightType: "llegada" | "regreso", // "llegada" or "regreso"
    hostId: string, // "titular" or companion.id
    currentSelectedIds: string[],
    onUpdate: (newIds: string[]) => void
  ) => {
    // If there are no minors registered, do not show anything
    if (!minors || minors.length === 0) return null;

    const assignments = flightType === "llegada" ? getMinorArrivalAssignments() : getMinorDepartureAssignments();

    return (
      <div className={`mt-3 p-3 rounded-xl border space-y-2 bg-[#56B7A9]/5 border-[#56B7A9]/20`}>
        <label className="block text-[10px] font-extrabold text-[#56B7A9] uppercase tracking-wider">
          Asignar Menores al Vuelo de {flightType === "llegada" ? "Llegada" : "Regreso"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {minors.map((m, idx) => {
            const minorId = `M-${idx + 1}`;
            const minorName = (m.name && m.name.trim()) ? `${m.name} ${m.lastName}`.trim() : `Menor #${idx + 1} (${m.age} años)`;
            const isChecked = currentSelectedIds.includes(minorId);
            const assignmentInfo = assignments[minorId];
            const isAssignedElsewhere = assignmentInfo && assignmentInfo.assignedId !== hostId;

            return (
              <label
                key={minorId}
                className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-medium transition-all duration-200 ${
                  isChecked
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                    : isAssignedElsewhere
                      ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 text-slate-400"
                      : isDarkMode 
                        ? "bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800 cursor-pointer"
                        : "bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={!!isAssignedElsewhere}
                  onChange={() => {
                    if (isAssignedElsewhere) return;
                    const nextIds = isChecked
                      ? currentSelectedIds.filter((id) => id !== minorId)
                      : [...currentSelectedIds, minorId];
                    onUpdate(nextIds);
                  }}
                  className="w-3.5 h-3.5 accent-[#56B7A9] rounded"
                />
                <div className="flex flex-col truncate">
                  <span className="truncate">{minorName}</span>
                  {isAssignedElsewhere && (
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                      Asignado con: {assignmentInfo.assignedName}
                    </span>
                  )}
                </div>
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
          Itinerario de viaje
        </h3>
        <p className={`text-xs mt-0.5 ${t.textMuted}`}>
          Registra los datos de transporte de llegada y regreso para coordinar tu recepción en el aeropuerto y traslados al hotel sede.
        </p>
      </div>

      {/* Highlights YES/NO Flights Toggle */}
      <div className="p-4 border-2 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 border-[#56B7A9] bg-slate-500/5">
        <div>
          <p className="font-extrabold text-[#56B7A9] uppercase text-xs tracking-wider">
            ¿Ya tienes tu itinerario de viaje?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { if (hasFlights) setHasFlights(false); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              !hasFlights
                ? "bg-[#56B7A9] text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => { if (!hasFlights) setHasFlights(true); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              hasFlights
                ? "bg-[#56B7A9] text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            Si
          </button>
        </div>
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
            <div className={`${t.section} flex items-center justify-between gap-4 p-4 rounded-xl transition-colors duration-300 border border-[#56B7A9]`}>
              <div>
                <p className={`text-xs font-bold ${t.textHeading}`}>Vuelos separados ?</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { if (vuelosSeparados) setVuelosSeparados(false); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    !vuelosSeparados
                      ? "bg-[#56B7A9] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => { if (!vuelosSeparados) setVuelosSeparados(true); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    vuelosSeparados
                      ? "bg-[#56B7A9] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  Si
                </button>
              </div>
            </div>

            {!vuelosSeparados ? (
              // Together Block
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#56B7A9] p-4 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#56B7A9] inline-block"></span>
                    Itinerario Unificado de Llegada y Salida
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 p-3 bg-slate-500/5 rounded-xl border border-[#56B7A9]">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50 dark:border-slate-800">
                        <span className="font-bold text-blue-400 uppercase text-[10px] tracking-widest block">LLEGADA</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="togetherLlegadaType"
                              checked={vueloLlegadaAerolinea !== "Terrestre"}
                              onChange={() => {
                                if (vueloLlegadaAerolinea === "Terrestre") {
                                  setVueloLlegadaAerolinea("");
                                }
                              }}
                              className="accent-[#56B7A9]"
                            />
                            Vuelo
                          </label>
                          <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="togetherLlegadaType"
                              checked={vueloLlegadaAerolinea === "Terrestre"}
                              onChange={() => {
                                setVueloLlegadaAerolinea("Terrestre");
                                setVueloLlegadaNoVuelo("");
                              }}
                              className="accent-[#56B7A9]"
                            />
                            Vía Terrestre
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {vueloLlegadaAerolinea !== "Terrestre" && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Aerolínea / Transporte *</label>
                            <select
                              value={vueloLlegadaAerolinea}
                              onChange={e => setVueloLlegadaAerolinea(e.target.value)}
                              className={`w-full mt-1 p-2 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                                isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                              }`}
                            >
                              <option value="">Selecciona...</option>
                              <option value="Aeroméxico">Aeroméxico</option>
                              <option value="Volaris">Volaris</option>
                              <option value="Vivaaerobus">Vivaaerobus</option>
                              <option value="Privado">Privado</option>
                            </select>
                          </div>
                        )}
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
                              className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
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
                            className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Hora de Llegada</label>
                          <input
                            type="time"
                            value={vueloLlegadaHora}
                            onChange={e => setVueloLlegadaHora(e.target.value)}
                            className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-3 bg-slate-500/5 rounded-xl border border-[#56B7A9]">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50 dark:border-slate-800">
                        <span className="font-bold text-blue-400 uppercase text-[10px] tracking-widest block">REGRESO</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="togetherRegresoType"
                              checked={vueloRegresoAerolinea !== "Terrestre"}
                              onChange={() => {
                                if (vueloRegresoAerolinea === "Terrestre") {
                                  setVueloRegresoAerolinea("");
                                }
                              }}
                              className="accent-[#56B7A9]"
                            />
                            Vuelo
                          </label>
                          <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="togetherRegresoType"
                              checked={vueloRegresoAerolinea === "Terrestre"}
                              onChange={() => {
                                setVueloRegresoAerolinea("Terrestre");
                                setVueloRegresoNoVuelo("");
                              }}
                              className="accent-[#56B7A9]"
                            />
                            Vía Terrestre
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {vueloRegresoAerolinea !== "Terrestre" && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Aerolínea / Transporte *</label>
                            <select
                              value={vueloRegresoAerolinea}
                              onChange={e => setVueloRegresoAerolinea(e.target.value)}
                              className={`w-full mt-1 p-2 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                                isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                              }`}
                            >
                              <option value="">Selecciona...</option>
                              <option value="Aeroméxico">Aeroméxico</option>
                              <option value="Volaris">Volaris</option>
                              <option value="Vivaaerobus">Vivaaerobus</option>
                              <option value="Privado">Privado</option>
                            </select>
                          </div>
                        )}
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
                              className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
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
                            className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Hora de Salida</label>
                          <input
                            type="time"
                            value={vueloRegresoHora}
                            onChange={e => setVueloRegresoHora(e.target.value)}
                            className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
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
                <div className="border border-[#56B7A9] p-4 rounded-2xl space-y-4 bg-slate-500/5">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-blue-500">
                    🛫 Itinerario del Titular ({nombreTitular} {apellidosTitular})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-[#56B7A9]">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50 dark:border-slate-800">
                        <span className="font-bold text-[#56B7A9] text-[10px] uppercase block">LLEGADA</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="titularLlegadaType"
                              checked={vueloLlegadaAerolinea !== "Terrestre"}
                              onChange={() => {
                                if (vueloLlegadaAerolinea === "Terrestre") {
                                  setVueloLlegadaAerolinea("");
                                }
                              }}
                              className="accent-[#56B7A9]"
                            />
                            Vuelo
                          </label>
                          <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="titularLlegadaType"
                              checked={vueloLlegadaAerolinea === "Terrestre"}
                              onChange={() => {
                                setVueloLlegadaAerolinea("Terrestre");
                                setVueloLlegadaNoVuelo("");
                              }}
                              className="accent-[#56B7A9]"
                            />
                            Vía Terrestre
                          </label>
                        </div>
                      </div>

                      {vueloLlegadaAerolinea !== "Terrestre" && (
                        <>
                          <select
                            value={vueloLlegadaAerolinea}
                            onChange={e => setVueloLlegadaAerolinea(e.target.value)}
                            className={`w-full p-2 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                              isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                            }`}
                          >
                            <option value="">Selecciona aerolínea...</option>
                            <option value="Aeroméxico">Aeroméxico</option>
                            <option value="Volaris">Volaris</option>
                            <option value="Vivaaerobus">Vivaaerobus</option>
                            <option value="Privado">Privado</option>
                          </select>
                          {vueloLlegadaAerolinea && (
                            <input
                              type="text"
                              value={vueloLlegadaNoVuelo}
                              onChange={e => setVueloLlegadaNoVuelo(e.target.value)}
                              placeholder={vueloLlegadaAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "No. Vuelo"}
                              className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                            />
                          )}
                        </>
                      )}
                      <input
                        type="date"
                        min="2026-11-01"
                        max="2026-11-30"
                        value={vueloLlegadaFecha}
                        onChange={e => setVueloLlegadaFecha(e.target.value)}
                        className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                      />
                      <input
                        type="time"
                        value={vueloLlegadaHora}
                        onChange={e => setVueloLlegadaHora(e.target.value)}
                        className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                      />
                      {vueloLlegadaAerolinea && renderMinorSelectorForSeparatedFlights(
                        "llegada",
                        "titular",
                        vueloLlegadaPasajerosTitular || [],
                        (newIds) => {
                          const updated = ["titular", ...newIds.filter(id => id.startsWith("M-"))];
                          setVueloLlegadaPasajerosTitular(updated);
                          setVueloLlegadaPersonas(updated.length);
                        }
                      )}
                    </div>

                    <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-[#56B7A9]">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50 dark:border-slate-800">
                        <span className="font-bold text-[#56B7A9] text-[10px] uppercase block">SALIDA</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="titularRegresoType"
                              checked={vueloRegresoAerolinea !== "Terrestre"}
                              onChange={() => {
                                if (vueloRegresoAerolinea === "Terrestre") {
                                  setVueloRegresoAerolinea("");
                                }
                              }}
                              className="accent-[#56B7A9]"
                            />
                            Vuelo
                          </label>
                          <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="titularRegresoType"
                              checked={vueloRegresoAerolinea === "Terrestre"}
                              onChange={() => {
                                setVueloRegresoAerolinea("Terrestre");
                                setVueloRegresoNoVuelo("");
                              }}
                              className="accent-[#56B7A9]"
                            />
                            Vía Terrestre
                          </label>
                        </div>
                      </div>

                      {vueloRegresoAerolinea !== "Terrestre" && (
                        <>
                          <select
                            value={vueloRegresoAerolinea}
                            onChange={e => setVueloRegresoAerolinea(e.target.value)}
                            className={`w-full p-2 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                              isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                            }`}
                          >
                            <option value="">Selecciona aerolínea...</option>
                            <option value="Aeroméxico">Aeroméxico</option>
                            <option value="Volaris">Volaris</option>
                            <option value="Vivaaerobus">Vivaaerobus</option>
                            <option value="Privado">Privado</option>
                          </select>
                          {vueloRegresoAerolinea && (
                            <input
                              type="text"
                              value={vueloRegresoNoVuelo}
                              onChange={e => setVueloRegresoNoVuelo(e.target.value)}
                              placeholder={vueloRegresoAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "No. Vuelo"}
                              className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                            />
                          )}
                        </>
                      )}
                      <input
                        type="date"
                        min="2026-11-01"
                        max="2026-11-30"
                        value={vueloRegresoFecha}
                        onChange={e => setVueloRegresoFecha(e.target.value)}
                        className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                      />
                      <input
                        type="time"
                        value={vueloRegresoHora}
                        onChange={e => setVueloRegresoHora(e.target.value)}
                        className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                      />
                      {vueloRegresoAerolinea && renderMinorSelectorForSeparatedFlights(
                        "regreso",
                        "titular",
                        vueloRegresoPasajerosTitular || [],
                        (newIds) => {
                          const updated = ["titular", ...newIds.filter(id => id.startsWith("M-"))];
                          setVueloRegresoPasajerosTitular(updated);
                          setVueloRegresoPersonas(updated.length);
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* Companions flights */}
                {companionsList.map((comp, index) => (
                  <div key={comp.id} className="border border-[#56B7A9] p-4 rounded-2xl space-y-4 bg-slate-500/5">
                    <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-blue-400">
                      🛫 Itinerario de {comp.firstName} {comp.lastName} (Acompañante Adulto)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-[#56B7A9]">
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50 dark:border-slate-800">
                          <span className="font-bold text-blue-400 text-[10px] uppercase block">LLEGADA</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                              <input 
                                type="radio" 
                                name={`compLlegadaType-${comp.id}`}
                                checked={comp.vueloLlegadaAerolinea !== "Terrestre"}
                                onChange={() => {
                                  if (comp.vueloLlegadaAerolinea === "Terrestre") {
                                    updateCompanionItem(comp.id, "vueloLlegadaAerolinea", "");
                                  }
                                }}
                                className="accent-[#56B7A9]"
                              />
                              Vuelo
                            </label>
                            <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                              <input 
                                type="radio" 
                                name={`compLlegadaType-${comp.id}`}
                                checked={comp.vueloLlegadaAerolinea === "Terrestre"}
                                onChange={() => {
                                  updateCompanionItem(comp.id, "vueloLlegadaAerolinea", "Terrestre");
                                  updateCompanionItem(comp.id, "vueloLlegadaNoVuelo", "");
                                }}
                                className="accent-[#56B7A9]"
                              />
                              Vía Terrestre
                            </label>
                          </div>
                        </div>

                        {comp.vueloLlegadaAerolinea !== "Terrestre" && (
                          <>
                            <select
                              value={comp.vueloLlegadaAerolinea || ""}
                              onChange={e => updateCompanionItem(comp.id, "vueloLlegadaAerolinea", e.target.value)}
                              className={`w-full p-2 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                                isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                              }`}
                            >
                              <option value="">Selecciona aerolínea...</option>
                              <option value="Aeroméxico">Aeroméxico</option>
                              <option value="Volaris">Volaris</option>
                              <option value="Vivaaerobus">Vivaaerobus</option>
                              <option value="Privado">Privado</option>
                            </select>
                            {comp.vueloLlegadaAerolinea && (
                              <input
                                type="text"
                                value={comp.vueloLlegadaNoVuelo || ""}
                                onChange={e => updateCompanionItem(comp.id, "vueloLlegadaNoVuelo", e.target.value)}
                                placeholder={comp.vueloLlegadaAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "No. Vuelo"}
                                className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                              />
                            )}
                          </>
                        )}
                        <input
                          type="date"
                          min="2026-11-01"
                          max="2026-11-30"
                          value={comp.vueloLlegadaFecha || defaultStartDate}
                          onChange={e => updateCompanionItem(comp.id, "vueloLlegadaFecha", e.target.value)}
                          className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                        />
                        <input
                          type="time"
                          value={comp.vueloLlegadaHora || "12:00"}
                          onChange={e => updateCompanionItem(comp.id, "vueloLlegadaHora", e.target.value)}
                          className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                        />
                        {comp.vueloLlegadaAerolinea && renderMinorSelectorForSeparatedFlights(
                          "llegada",
                          comp.id,
                          comp.vueloLlegadaPasajeros || [],
                          (newIds) => {
                            const updated = [comp.id, ...newIds.filter(id => id.startsWith("M-"))];
                            updateCompanionItem(comp.id, "vueloLlegadaPasajeros", updated);
                          }
                        )}
                      </div>

                      <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-[#56B7A9]">
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/50 dark:border-slate-800">
                          <span className="font-bold text-blue-400 text-[10px] uppercase block">SALIDA</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                              <input 
                                type="radio" 
                                name={`compRegresoType-${comp.id}`}
                                checked={comp.vueloRegresoAerolinea !== "Terrestre"}
                                onChange={() => {
                                  if (comp.vueloRegresoAerolinea === "Terrestre") {
                                    updateCompanionItem(comp.id, "vueloRegresoAerolinea", "");
                                  }
                                }}
                                className="accent-[#56B7A9]"
                              />
                              Vuelo
                            </label>
                            <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                              <input 
                                type="radio" 
                                name={`compRegresoType-${comp.id}`}
                                checked={comp.vueloRegresoAerolinea === "Terrestre"}
                                onChange={() => {
                                  updateCompanionItem(comp.id, "vueloRegresoAerolinea", "Terrestre");
                                  updateCompanionItem(comp.id, "vueloRegresoNoVuelo", "");
                                }}
                                className="accent-[#56B7A9]"
                              />
                              Vía Terrestre
                            </label>
                          </div>
                        </div>

                        {comp.vueloRegresoAerolinea !== "Terrestre" && (
                          <>
                            <select
                              value={comp.vueloRegresoAerolinea || ""}
                              onChange={e => updateCompanionItem(comp.id, "vueloRegresoAerolinea", e.target.value)}
                              className={`w-full p-2 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                                isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                              }`}
                            >
                              <option value="">Selecciona aerolínea...</option>
                              <option value="Aeroméxico">Aeroméxico</option>
                              <option value="Volaris">Volaris</option>
                              <option value="Vivaaerobus">Vivaaerobus</option>
                              <option value="Privado">Privado</option>
                            </select>
                            {comp.vueloRegresoAerolinea && (
                              <input
                                type="text"
                                value={comp.vueloRegresoNoVuelo || ""}
                                onChange={e => updateCompanionItem(comp.id, "vueloRegresoNoVuelo", e.target.value)}
                                placeholder={comp.vueloRegresoAerolinea === "Privado" ? "Matrícula de la aeronave (ej. XA-XXX)" : "No. Vuelo"}
                                className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                              />
                            )}
                          </>
                        )}
                        <input
                          type="date"
                          min="2026-11-01"
                          max="2026-11-30"
                          value={comp.vueloRegresoFecha || defaultEndDate}
                          onChange={e => updateCompanionItem(comp.id, "vueloRegresoFecha", e.target.value)}
                          className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                        />
                        <input
                          type="time"
                          value={comp.vueloRegresoHora || "15:00"}
                          onChange={e => updateCompanionItem(comp.id, "vueloRegresoHora", e.target.value)}
                          className="w-full mt-1 p-2 bg-transparent border border-[#56B7A9] rounded-lg text-xs font-medium"
                        />
                        {comp.vueloRegresoAerolinea && renderMinorSelectorForSeparatedFlights(
                          "regreso",
                          comp.id,
                          comp.vueloRegresoPasajeros || [],
                          (newIds) => {
                            const updated = [comp.id, ...newIds.filter(id => id.startsWith("M-"))];
                            updateCompanionItem(comp.id, "vueloRegresoPasajeros", updated);
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
