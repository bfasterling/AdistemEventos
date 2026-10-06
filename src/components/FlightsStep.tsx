import React, { useEffect } from "react";
import { Plane, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DataStore } from "../dataStore";

const getPrefixForAirline = (airline: string): string => {
  const lower = (airline || "").trim().toLowerCase();
  if (lower === "aeroméxico" || lower === "aeromexico") return "AM-";
  if (lower === "volaris") return "Y4-";
  if (lower === "vivaaerobus" || lower === "viva") return "VB-";
  return "";
};

const getCleanFlightNumberAndPrefix = (rawNum: string, airline: string): { prefix: string, displayVal: string } => {
  const currentPrefix = getPrefixForAirline(airline);
  let cleanNum = (rawNum || "").trim();

  // Strip any existing prefixes "AM-", "Y4-", "VB-" (case-insensitive) to be clean
  if (cleanNum.toUpperCase().startsWith("AM-")) {
    cleanNum = cleanNum.substring(3).trim();
  } else if (cleanNum.toUpperCase().startsWith("Y4-")) {
    cleanNum = cleanNum.substring(3).trim();
  } else if (cleanNum.toUpperCase().startsWith("VB-")) {
    cleanNum = cleanNum.substring(3).trim();
  }

  return {
    prefix: currentPrefix,
    displayVal: cleanNum
  };
};

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
    relationship?: string;
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
  minors: Array<{ name: string; lastName: string; age: number; sex: string; allergies: string; tipo?: "adult" | "minor"; parentezco?: string }>;
  handleNext: () => void;
  handlePrev: () => void;
  carnetTipoHabitacion?: string;
  hasCompanion: boolean;
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
  handlePrev,
  carnetTipoHabitacion,
  hasCompanion
}: FlightsStepProps) {
  const reqStar = <span className="text-red-500 font-extrabold text-sm ml-0.5">*</span>;
  const config = DataStore.getEventConfig();
  const defaultStartDate = config?.eventStartDate || "2026-11-04";
  const defaultEndDate = config?.eventEndDate || "2026-11-09";

  const ensureNovember4to11 = (dateStr: string, fallbackDay: string = "04"): string => {
    if (!dateStr) return `2026-11-${fallbackDay}`;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      let [year, month, day] = parts;
      if (year !== "2026") year = "2026";
      if (month !== "11") month = "11";
      let dayNum = parseInt(day, 10);
      if (isNaN(dayNum) || dayNum < 4 || dayNum > 11) {
        day = fallbackDay;
      } else {
        day = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      }
      return `${year}-${month}-${day}`;
    }
    return `2026-11-${fallbackDay}`;
  };

  // Ensure flight dates are strictly synchronized to 2026-11-04 to 2026-11-11
  useEffect(() => {
    const sanitizedArrival = ensureNovember4to11(vueloLlegadaFecha, "04");
    if (vueloLlegadaFecha !== sanitizedArrival) {
      setVueloLlegadaFecha(sanitizedArrival);
    }
    const sanitizedDeparture = ensureNovember4to11(vueloRegresoFecha, "09");
    if (vueloRegresoFecha !== sanitizedDeparture) {
      setVueloRegresoFecha(sanitizedDeparture);
    }
    companionsList.forEach(c => {
      if (c.vueloLlegadaFecha) {
        const sArr = ensureNovember4to11(c.vueloLlegadaFecha, "04");
        if (c.vueloLlegadaFecha !== sArr) {
          updateCompanionItem(c.id, "vueloLlegadaFecha", sArr);
        }
      }
      if (c.vueloRegresoFecha) {
        const sDep = ensureNovember4to11(c.vueloRegresoFecha, "09");
        if (c.vueloRegresoFecha !== sDep) {
          updateCompanionItem(c.id, "vueloRegresoFecha", sDep);
        }
      }
    });
  }, []);

  const renderCustomDatePicker = (
    value: string,
    onChange: (val: string) => void,
    defaultValue: string = "2026-11-04"
  ) => {
    const getDayFromDate = (dateStr: string): string => {
      const val = dateStr || defaultValue;
      const parts = val.split('-');
      if (parts.length === 3 && parts[1] === "11" && parts[0] === "2026") {
        const d = parseInt(parts[2], 10);
        if (d >= 4 && d <= 11) {
          return parts[2];
        }
      }
      return "04";
    };

    const currentDay = getDayFromDate(value);

    return (
      <div className="flex gap-2 mt-1.5 w-full">
        <div className="w-[35%]">
          <select
            value={currentDay}
            onChange={e => {
              onChange(`2026-11-${e.target.value}`);
            }}
            className={`block w-full py-3.5 px-3 bg-transparent border border-[#56B7A9] rounded-lg text-xs sm:text-sm md:text-base font-bold focus:outline-none cursor-pointer ${
              isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"
            }`}
          >
            <option value="04" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>4</option>
            <option value="05" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>5</option>
            <option value="06" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>6</option>
            <option value="07" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>7</option>
            <option value="08" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>8</option>
            <option value="09" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>9</option>
            <option value="10" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>10</option>
            <option value="11" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>11</option>
          </select>
        </div>
        <div className="w-[65%]">
          <input
            type="text"
            readOnly
            value="Noviembre 2026"
            className={`block w-full py-3.5 px-3 border border-[#56B7A9]/60 rounded-lg text-xs sm:text-sm md:text-base font-bold focus:outline-none select-none ${isDarkMode ? "bg-slate-900 text-white" : "bg-white text-black"}`}
          />
        </div>
      </div>
    );
  };

  const isDoble = carnetTipoHabitacion === "Doble" || carnetTipoHabitacion === "Doble Extra";
  const canSeparateFlights = isDoble && hasCompanion;

  React.useEffect(() => {
    if (!canSeparateFlights && vuelosSeparados) {
      setVuelosSeparados(false);
    }
  }, [canSeparateFlights, vuelosSeparados, setVuelosSeparados]);

  const allPeople = [
    { id: "titular", name: `${nombreTitular || ""} ${apellidosTitular || ""}`.trim() || "Titular", type: "Titular" },
    ...(hasCompanion ? companionsList.map((c, idx) => ({ 
      id: (c.id && !c.id.startsWith("M-")) ? c.id : `C-${idx + 1}`, 
      name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || `Acompañante Adulto #${idx + 1}`, 
      type: "Acompañante" 
    })) : []),
    ...minors.map((m, idx) => {
      const mName = (m.name || "").trim();
      const mLastName = (m.lastName || "").trim();
      const mFullName = `${mName} ${mLastName}`.trim();
      const isAdult = m.tipo === "adult";
      return {
        id: `M-${idx + 1}`,
        name: mFullName ? mFullName : (isAdult ? `Acompañante Adicional #${idx + 1} (Adulto)` : `Menor #${idx + 1} (${m.age === 0 ? "0-11 meses" : `${m.age || 0} años`})`),
        type: isAdult ? "Acompañante Adicional" : "Menor"
      };
    })
  ];

  // Guarantee strict uniqueness of person IDs
  const uniquePeople = allPeople.filter((p, index, self) =>
    index === self.findIndex((t) => t.id === p.id)
  );

  const renderPassengerSelector = (
    label: string,
    selectedIds: string[],
    onChange: (newIds: string[]) => void
  ) => {
    return (
      <div className={`mt-4 p-4 rounded-xl border space-y-2.5 ${
        isDarkMode ? "bg-slate-850/50 border-blue-500/10" : "bg-blue-500/5 border-blue-500/10"
      }`}>
        <label className="block text-xs md:text-sm font-extrabold text-blue-500 uppercase tracking-wide">
          {label} ({selectedIds.length} pasajeros)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1.5">
          {uniquePeople.map((p) => {
            const isChecked = selectedIds.includes(p.id);
            return (
              <label
                key={p.id}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs md:text-sm font-semibold cursor-pointer transition-all duration-200 ${
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
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
                <span className="truncate">{p.name} <span className="opacity-60 text-[10px] md:text-xs font-normal">({p.type})</span></span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  // Reassign an additional companion / minor between Titular and Companion flights
  const assignMinorToFlight = (
    flightType: "llegada" | "regreso",
    minorId: string,
    targetHost: "titular" | "companion"
  ) => {
    const primaryComp = companionsList[0];
    if (!primaryComp) return;

    if (flightType === "llegada") {
      let newTitularArrival = [...(vueloLlegadaPasajerosTitular || ["titular"])];
      let newCompArrival = [...(primaryComp.vueloLlegadaPasajeros || [primaryComp.id])];

      if (targetHost === "titular") {
        if (!newTitularArrival.includes(minorId)) newTitularArrival.push(minorId);
        newCompArrival = newCompArrival.filter(id => id !== minorId);
      } else {
        newTitularArrival = newTitularArrival.filter(id => id !== minorId);
        if (!newCompArrival.includes(minorId)) newCompArrival.push(minorId);
      }

      // Ensure base IDs remain
      if (!newTitularArrival.includes("titular")) newTitularArrival.unshift("titular");
      if (!newCompArrival.includes(primaryComp.id)) newCompArrival.unshift(primaryComp.id);

      setVueloLlegadaPasajerosTitular(newTitularArrival);
      setVueloLlegadaPersonas(newTitularArrival.length);
      updateCompanionItem(primaryComp.id, "vueloLlegadaPasajeros", newCompArrival);
    } else {
      let newTitularDeparture = [...(vueloRegresoPasajerosTitular || ["titular"])];
      let newCompDeparture = [...(primaryComp.vueloRegresoPasajeros || [primaryComp.id])];

      if (targetHost === "titular") {
        if (!newTitularDeparture.includes(minorId)) newTitularDeparture.push(minorId);
        newCompDeparture = newCompDeparture.filter(id => id !== minorId);
      } else {
        newTitularDeparture = newTitularDeparture.filter(id => id !== minorId);
        if (!newCompDeparture.includes(minorId)) newCompDeparture.push(minorId);
      }

      // Ensure base IDs remain
      if (!newTitularDeparture.includes("titular")) newTitularDeparture.unshift("titular");
      if (!newCompDeparture.includes(primaryComp.id)) newCompDeparture.unshift(primaryComp.id);

      setVueloRegresoPasajerosTitular(newTitularDeparture);
      setVueloRegresoPersonas(newTitularDeparture.length);
      updateCompanionItem(primaryComp.id, "vueloRegresoPasajeros", newCompDeparture);
    }
  };

  // Find which arrival flight each additional companion / minor is currently assigned to.
  const getMinorArrivalAssignments = () => {
    const assignments: Record<string, { assignedId: string; assignedName: string }> = {};
    const primaryComp = companionsList[0];
    const cName = primaryComp ? `${(primaryComp.firstName || "").trim()} ${(primaryComp.lastName || "").trim()}`.trim() || "Acompañante Principal" : "Acompañante Principal";
    const tName = `${(nombreTitular || "").trim()} ${(apellidosTitular || "").trim()}`.trim() || "Titular";

    minors.forEach((m, idx) => {
      const minorId = `M-${idx + 1}`;
      const inComp = primaryComp?.vueloLlegadaPasajeros?.includes(minorId);
      const inTitular = vueloLlegadaPasajerosTitular?.includes(minorId);

      if (inComp) {
        assignments[minorId] = { assignedId: primaryComp.id, assignedName: cName };
      } else {
        assignments[minorId] = { assignedId: "titular", assignedName: `Titular (${tName})` };
      }
    });

    return assignments;
  };

  // Find which departure flight each additional companion / minor is currently assigned to.
  const getMinorDepartureAssignments = () => {
    const assignments: Record<string, { assignedId: string; assignedName: string }> = {};
    const primaryComp = companionsList[0];
    const cName = primaryComp ? `${(primaryComp.firstName || "").trim()} ${(primaryComp.lastName || "").trim()}`.trim() || "Acompañante Principal" : "Acompañante Principal";
    const tName = `${(nombreTitular || "").trim()} ${(apellidosTitular || "").trim()}`.trim() || "Titular";

    minors.forEach((m, idx) => {
      const minorId = `M-${idx + 1}`;
      const inComp = primaryComp?.vueloRegresoPasajeros?.includes(minorId);
      const inTitular = vueloRegresoPasajerosTitular?.includes(minorId);

      if (inComp) {
        assignments[minorId] = { assignedId: primaryComp.id, assignedName: cName };
      } else {
        assignments[minorId] = { assignedId: "titular", assignedName: `Titular (${tName})` };
      }
    });

    return assignments;
  };

  const renderMinorSelectorForSeparatedFlights = (
    flightType: "llegada" | "regreso", // "llegada" or "regreso"
    hostId: string, // "titular" or companion.id
    currentSelectedIds?: string[],
    onUpdate?: (newIds: string[]) => void
  ) => {
    // If there are no additional companions or minors registered, do not show anything
    if (!minors || minors.length === 0) return null;

    const assignments = flightType === "llegada" ? getMinorArrivalAssignments() : getMinorDepartureAssignments();
    const isTitularHost = hostId === "titular";

    return (
      <div className="mt-4 p-4 rounded-xl border space-y-2.5 bg-[#56B7A9]/5 border-[#56B7A9]/20">
        <label className="block text-xs md:text-sm font-extrabold text-[#56B7A9] uppercase tracking-wide">
          Acompañantes adicionales en este vuelo de {flightType === "llegada" ? "Llegada" : "Salida"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1.5">
          {minors.map((m, idx) => {
            const minorId = `M-${idx + 1}`;
            const mName = (m.name || "").trim();
            const mLastName = (m.lastName || "").trim();
            const mFullName = `${mName} ${mLastName}`.trim();
            const isAdult = m.tipo === "adult" || (!m.tipo && m.age >= 18);
            const minorName = mFullName ? mFullName : (isAdult ? `Acompañante Adicional #${idx + 1} (Adulto)` : `Menor #${idx + 1} (${m.age === 0 ? "0-11 meses" : `${m.age || 0} años`})`);
            
            const assignmentInfo = assignments[minorId];
            const isChecked = isTitularHost
              ? (assignmentInfo?.assignedId === "titular")
              : (assignmentInfo?.assignedId === hostId);

            return (
              <label
                key={minorId}
                onClick={(e) => {
                  e.preventDefault();
                  // Directly assign to this host's flight
                  assignMinorToFlight(flightType, minorId, isTitularHost ? "titular" : "companion");
                }}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isChecked
                    ? "bg-emerald-500/15 border-emerald-500/40 text-slate-800 dark:text-slate-100 shadow-xs ring-1 ring-emerald-500/30"
                    : isDarkMode 
                      ? "bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-[#56B7A9]"
                      : "bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-[#56B7A9]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="w-4 h-4 accent-[#56B7A9] rounded pointer-events-none"
                />
                <div className="flex flex-col truncate">
                  <span className="truncate">{minorName}</span>
                  {isChecked ? (
                    <span className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                      ✓ Viaja en este vuelo
                    </span>
                  ) : (
                    <span className="text-[10px] md:text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      Viaja con: {assignmentInfo.assignedName} (Clic para cambiar a este vuelo)
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
        <h3 className={`text-xl md:text-2xl font-extrabold flex items-center gap-2.5 ${t.textTitle}`}>
          <Plane className="w-6 h-6 text-blue-500" />
          Itinerario de viaje
        </h3>
        <p className={`text-sm mt-1.5 ${t.textMuted}`}>
          Sube tus vuelos para coordinar tu traslado del <strong>Aeropuerto Internacional de Puerto Vallarta (PVR)</strong> al hotel sede y de regreso.
        </p>
      </div>

      {/* Highlights YES/NO Flights Toggle */}
      <div className="p-5 border-2 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 border-[#56B7A9]/40 bg-[#56B7A9]/10 dark:bg-[#56B7A9]/10">
        <div>
          <p className={`font-extrabold uppercase text-sm md:text-base tracking-wide ${isDarkMode ? "text-white" : "text-black"}`}>
            ¿YA TIENES TU ITINERARIO DE VIAJE?
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { if (hasFlights) setHasFlights(false); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-black transition cursor-pointer ${
              !hasFlights
                ? "bg-red-500 text-white shadow-xs"
                : "bg-slate-500 dark:bg-slate-600 text-white"
            }`}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => { if (!hasFlights) setHasFlights(true); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-black transition cursor-pointer ${
              hasFlights
                ? "bg-[#56B7A9] text-white shadow-xs"
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
            className="space-y-6 overflow-hidden pt-2 text-sm md:text-base"
          >
            {/* Separate flights toggle */}
            {canSeparateFlights && (
              <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border-2 transition-all duration-300 border-[#56B7A9]/40 bg-[#56B7A9]/10 dark:bg-[#56B7A9]/10">
                <div>
                  <p className={`text-sm md:text-base font-extrabold ${t.textHeading} uppercase`}>¿VIAJAN EN VUELOS SEPARADOS?</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => { if (vuelosSeparados) setVuelosSeparados(false); }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-black transition cursor-pointer ${
                      !vuelosSeparados
                        ? "bg-red-500 text-white"
                        : "bg-slate-500 dark:bg-slate-600 text-white"
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (!vuelosSeparados) setVuelosSeparados(true); }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-black transition cursor-pointer ${
                      vuelosSeparados
                        ? "bg-[#56B7A9] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    Si
                  </button>
                </div>
              </div>
            )}

            {!vuelosSeparados ? (
              // Together Block
              <div key="together-flights-block" className="space-y-4">
                <div className="border-2 border-dashed border-[#56B7A9] p-3.5 sm:p-5 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-xs md:text-sm uppercase tracking-wide text-blue-500 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#56B7A9] inline-block"></span>
                    Itinerario Unificado de Llegada y Salida
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="min-w-0 space-y-4 p-3 sm:p-4 bg-slate-500/5 rounded-xl border border-[#56B7A9]">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                        <span className="font-extrabold text-[#56B7A9] uppercase text-xs md:text-sm tracking-wider block">LLEGADA</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="togetherLlegadaType"
                              checked={vueloLlegadaAerolinea !== "Terrestre"}
                              onChange={() => {
                                if (vueloLlegadaAerolinea === "Terrestre") {
                                  setVueloLlegadaAerolinea("");
                                }
                              }}
                              className="w-4 h-4 accent-[#56B7A9]"
                            />
                            Vuelo
                          </label>
                          <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="togetherLlegadaType"
                              checked={vueloLlegadaAerolinea === "Terrestre"}
                              onChange={() => {
                                setVueloLlegadaAerolinea("Terrestre");
                                setVueloLlegadaNoVuelo("");
                              }}
                              className="w-4 h-4 accent-[#56B7A9]"
                            />
                            Vía Terrestre
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {vueloLlegadaAerolinea !== "Terrestre" && (
                          <div>
                            <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Aerolínea / Transporte {reqStar}</label>
                            <select
                              value={vueloLlegadaAerolinea}
                              onChange={e => {
                                const val = e.target.value;
                                setVueloLlegadaAerolinea(val);
                                const { displayVal } = getCleanFlightNumberAndPrefix(vueloLlegadaNoVuelo, val);
                                const newPrefix = getPrefixForAirline(val);
                                setVueloLlegadaNoVuelo(newPrefix + displayVal);
                              }}
                              className={`w-full mt-1.5 p-3 border border-[#56B7A9] text-sm md:text-base font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
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
                        {vueloLlegadaAerolinea && vueloLlegadaAerolinea !== "Terrestre" && (() => {
                          const { prefix, displayVal } = getCleanFlightNumberAndPrefix(vueloLlegadaNoVuelo, vueloLlegadaAerolinea);
                          return (
                            <div>
                              <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">
                                {vueloLlegadaAerolinea === "Privado" ? <>Matrícula de la aeronave {reqStar}</> : <>Número de Vuelo {reqStar}</>}
                              </label>
                              <div className="flex mt-1.5 rounded-lg border border-[#56B7A9] overflow-hidden">
                                {prefix && (
                                  <span className={`px-3 py-3 font-extrabold text-sm md:text-base select-none border-r border-[#56B7A9] flex items-center justify-center min-w-[50px] ${
                                    isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {prefix}
                                  </span>
                                )}
                                <input
                                  type="text"
                                  value={displayVal}
                                  onChange={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "");
                                    setVueloLlegadaNoVuelo(prefix + clean);
                                  }}
                                  onBlur={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "").toUpperCase();
                                    setVueloLlegadaNoVuelo(prefix + clean);
                                  }}
                                  placeholder={vueloLlegadaAerolinea === "Privado" ? "XA-XXX" : "504"}
                                  className={`w-full p-3 bg-transparent text-sm md:text-base font-bold focus:outline-none ${
                                    isDarkMode ? "text-slate-100" : "text-slate-700"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Fecha de Llegada (Noviembre 2026) {reqStar}</label>
                          {renderCustomDatePicker(vueloLlegadaFecha, setVueloLlegadaFecha, "2026-11-04")}
                        </div>
                        <div className="min-w-0">
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Hora de Llegada {reqStar}</label>
                          <input
                            type="time"
                            value={vueloLlegadaHora}
                            onChange={e => setVueloLlegadaHora(e.target.value)}
                            className="block w-[95%] sm:w-full max-w-full min-w-0 box-border mt-1.5 py-3 px-1.5 sm:px-3 bg-transparent border border-[#56B7A9] rounded-lg text-xs sm:text-sm md:text-base font-medium focus:outline-none mx-auto sm:mx-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-slate-500/5 rounded-xl border border-[#56B7A9]">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                        <span className="font-extrabold text-[#56B7A9] uppercase text-xs md:text-sm tracking-wider block">REGRESO</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="togetherRegresoType"
                              checked={vueloRegresoAerolinea !== "Terrestre"}
                              onChange={() => {
                                if (vueloRegresoAerolinea === "Terrestre") {
                                  setVueloRegresoAerolinea("");
                                }
                              }}
                              className="w-4 h-4 accent-[#56B7A9]"
                            />
                            Vuelo
                          </label>
                          <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="togetherRegresoType"
                              checked={vueloRegresoAerolinea === "Terrestre"}
                              onChange={() => {
                                setVueloRegresoAerolinea("Terrestre");
                                setVueloRegresoNoVuelo("");
                              }}
                              className="w-4 h-4 accent-[#56B7A9]"
                            />
                            Vía Terrestre
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {vueloRegresoAerolinea !== "Terrestre" && (
                          <div>
                            <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Aerolínea / Transporte {reqStar}</label>
                            <select
                              value={vueloRegresoAerolinea}
                              onChange={e => {
                                const val = e.target.value;
                                setVueloRegresoAerolinea(val);
                                const { displayVal } = getCleanFlightNumberAndPrefix(vueloRegresoNoVuelo, val);
                                const newPrefix = getPrefixForAirline(val);
                                setVueloRegresoNoVuelo(newPrefix + displayVal);
                              }}
                              className={`w-full mt-1.5 p-3 border border-[#56B7A9] text-sm md:text-base font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
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
                        {vueloRegresoAerolinea && vueloRegresoAerolinea !== "Terrestre" && (() => {
                          const { prefix, displayVal } = getCleanFlightNumberAndPrefix(vueloRegresoNoVuelo, vueloRegresoAerolinea);
                          return (
                            <div>
                              <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">
                                {vueloRegresoAerolinea === "Privado" ? <>Matrícula de la aeronave {reqStar}</> : <>Número de Vuelo {reqStar}</>}
                              </label>
                              <div className="flex mt-1.5 rounded-lg border border-[#56B7A9] overflow-hidden">
                                {prefix && (
                                  <span className={`px-3 py-3 font-extrabold text-sm md:text-base select-none border-r border-[#56B7A9] flex items-center justify-center min-w-[50px] ${
                                    isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {prefix}
                                  </span>
                                )}
                                <input
                                  type="text"
                                  value={displayVal}
                                  onChange={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "");
                                    setVueloRegresoNoVuelo(prefix + clean);
                                  }}
                                  onBlur={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "").toUpperCase();
                                    setVueloRegresoNoVuelo(prefix + clean);
                                  }}
                                  placeholder={vueloRegresoAerolinea === "Privado" ? "XA-XXX" : "505"}
                                  className={`w-full p-3 bg-transparent text-sm md:text-base font-bold focus:outline-none ${
                                    isDarkMode ? "text-slate-100" : "text-slate-700"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Fecha de Salida (Noviembre 2026) {reqStar}</label>
                          {renderCustomDatePicker(vueloRegresoFecha, setVueloRegresoFecha, "2026-11-11")}
                        </div>
                        <div className="min-w-0">
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Hora de Salida {reqStar}</label>
                          <input
                            type="time"
                            value={vueloRegresoHora}
                            onChange={e => setVueloRegresoHora(e.target.value)}
                            className="block w-[95%] sm:w-full max-w-full min-w-0 box-border mt-1.5 py-3 px-1.5 sm:px-3 bg-transparent border border-[#56B7A9] rounded-lg text-xs sm:text-sm md:text-base font-medium focus:outline-none mx-auto sm:mx-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Separate Block (Titular + Companions)
              <div key="separate-flights-block" className="space-y-6">
                {/* Asignación de Vuelos para Acompañantes Adicionales */}
                {minors && minors.length > 0 && (() => {
                  const primaryComp = companionsList[0];
                  const primaryCompName = primaryComp ? `${(primaryComp.firstName || "").trim()} ${(primaryComp.lastName || "").trim()}`.trim() || "Acompañante Principal" : "Acompañante Principal";
                  const titularFullName = `${(nombreTitular || "").trim()} ${(apellidosTitular || "").trim()}`.trim() || "Titular";
                  const arrivalAssignments = getMinorArrivalAssignments();
                  const departureAssignments = getMinorDepartureAssignments();

                  return (
                    <div className="border-2 border-[#56B7A9] p-4 sm:p-5 rounded-2xl space-y-4 bg-[#56B7A9]/10">
                      <div className="flex items-center gap-2.5">
                        <Users className="w-5 h-5 text-[#56B7A9]" />
                        <div>
                          <h4 className="font-extrabold text-xs md:text-sm uppercase tracking-wide text-slate-800 dark:text-slate-100">
                            Asignación de Vuelos para Acompañantes Adicionales
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Selecciona en qué vuelo viaja cada acompañante adicional tanto de llegada como de salida (en el del Titular o en el del Acompañante Principal):
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-1">
                        {minors.map((m, idx) => {
                          const minorId = `M-${idx + 1}`;
                          const isAdult = m.tipo === "adult" || (!m.tipo && m.age >= 18);
                          const mFullName = `${(m.name || "").trim()} ${(m.lastName || "").trim()}`.trim();
                          const displayName = mFullName || (isAdult ? `Acompañante Adicional #${idx + 1}` : `Menor #${idx + 1}`);
                          const tagLabel = isAdult ? "Adulto Adicional" : (m.parentezco ? `${m.parentezco} (${m.age === 0 ? "0-11 meses" : `${m.age} años`})` : `Menor (${m.age === 0 ? "0-11 meses" : `${m.age} años`})`);

                          const isArrivalTitular = arrivalAssignments[minorId]?.assignedId === "titular";
                          const isDepartureTitular = departureAssignments[minorId]?.assignedId === "titular";

                          return (
                            <div key={minorId} className="p-3.5 sm:p-4 rounded-xl border border-[#56B7A9]/30 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
                              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                <span className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#56B7A9]"></span>
                                  {displayName}
                                </span>
                                <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full ${isAdult ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"}`}>
                                  {tagLabel}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {/* VUELO DE LLEGADA */}
                                <div className="space-y-1.5">
                                  <label className="block text-[11px] font-extrabold uppercase text-[#56B7A9] tracking-wider">
                                    🛬 Vuelo de Llegada:
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => assignMinorToFlight("llegada", minorId, "titular")}
                                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                        isArrivalTitular
                                          ? "bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 font-black shadow-xs ring-1 ring-blue-500/30"
                                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <input type="radio" checked={isArrivalTitular} readOnly className="accent-blue-500 pointer-events-none" />
                                        <span className="truncate">Vuelo Titular</span>
                                      </div>
                                      <p className="text-[10px] opacity-75 truncate mt-0.5 ml-4">({titularFullName})</p>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => assignMinorToFlight("llegada", minorId, "companion")}
                                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                        !isArrivalTitular
                                          ? "bg-[#56B7A9]/20 border-[#56B7A9] text-[#2c7a6e] dark:text-[#56B7A9] font-black shadow-xs ring-1 ring-[#56B7A9]/40"
                                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#56B7A9]"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <input type="radio" checked={!isArrivalTitular} readOnly className="accent-[#56B7A9] pointer-events-none" />
                                        <span className="truncate">Vuelo Acompañante</span>
                                      </div>
                                      <p className="text-[10px] opacity-75 truncate mt-0.5 ml-4">({primaryCompName})</p>
                                    </button>
                                  </div>
                                </div>

                                {/* VUELO DE SALIDA */}
                                <div className="space-y-1.5">
                                  <label className="block text-[11px] font-extrabold uppercase text-[#56B7A9] tracking-wider">
                                    🛫 Vuelo de Salida / Regreso:
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => assignMinorToFlight("regreso", minorId, "titular")}
                                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                        isDepartureTitular
                                          ? "bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 font-black shadow-xs ring-1 ring-blue-500/30"
                                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <input type="radio" checked={isDepartureTitular} readOnly className="accent-blue-500 pointer-events-none" />
                                        <span className="truncate">Vuelo Titular</span>
                                      </div>
                                      <p className="text-[10px] opacity-75 truncate mt-0.5 ml-4">({titularFullName})</p>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => assignMinorToFlight("regreso", minorId, "companion")}
                                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                        !isDepartureTitular
                                          ? "bg-[#56B7A9]/20 border-[#56B7A9] text-[#2c7a6e] dark:text-[#56B7A9] font-black shadow-xs ring-1 ring-[#56B7A9]/40"
                                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#56B7A9]"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <input type="radio" checked={!isDepartureTitular} readOnly className="accent-[#56B7A9] pointer-events-none" />
                                        <span className="truncate">Vuelo Acompañante</span>
                                      </div>
                                      <p className="text-[10px] opacity-75 truncate mt-0.5 ml-4">({primaryCompName})</p>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Titular flight block */}
                <div className="border border-[#56B7A9] p-3.5 sm:p-5 rounded-2xl space-y-5 bg-slate-500/5">
                  <h4 className="font-extrabold text-xs md:text-sm uppercase tracking-wide text-blue-500">
                    🛫 Itinerario del Titular ({nombreTitular} {apellidosTitular})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="min-w-0 space-y-3.5 bg-white/5 p-3 sm:p-4 rounded-xl border border-[#56B7A9]">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                        <span className="font-extrabold text-[#56B7A9] text-xs md:text-sm uppercase block">LLEGADA</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="titularLlegadaType"
                              checked={vueloLlegadaAerolinea !== "Terrestre"}
                              onChange={() => {
                                if (vueloLlegadaAerolinea === "Terrestre") {
                                  setVueloLlegadaAerolinea("");
                                }
                              }}
                              className="w-4 h-4 accent-[#56B7A9]"
                            />
                            Vuelo
                          </label>
                          <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="titularLlegadaType"
                              checked={vueloLlegadaAerolinea === "Terrestre"}
                              onChange={() => {
                                setVueloLlegadaAerolinea("Terrestre");
                                setVueloLlegadaNoVuelo("");
                              }}
                              className="w-4 h-4 accent-[#56B7A9]"
                            />
                            Vía Terrestre
                          </label>
                        </div>
                      </div>

                      {vueloLlegadaAerolinea !== "Terrestre" && (
                        <div>
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Aerolínea / Transporte {reqStar}</label>
                          <select
                            value={vueloLlegadaAerolinea}
                            onChange={e => {
                              const val = e.target.value;
                              setVueloLlegadaAerolinea(val);
                              const { displayVal } = getCleanFlightNumberAndPrefix(vueloLlegadaNoVuelo, val);
                              const newPrefix = getPrefixForAirline(val);
                              setVueloLlegadaNoVuelo(newPrefix + displayVal);
                            }}
                            className={`w-full mt-1.5 p-3 border border-[#56B7A9] text-sm md:text-base font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                              isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                            }`}
                          >
                            <option value="">Selecciona aerolínea...</option>
                            <option value="Aeroméxico">Aeroméxico</option>
                            <option value="Volaris">Volaris</option>
                            <option value="Vivaaerobus">Vivaaerobus</option>
                            <option value="Privado">Privado</option>
                          </select>
                        </div>
                      )}
                      
                      {vueloLlegadaAerolinea && vueloLlegadaAerolinea !== "Terrestre" && (() => {
                        const { prefix, displayVal } = getCleanFlightNumberAndPrefix(vueloLlegadaNoVuelo, vueloLlegadaAerolinea);
                        return (
                          <div>
                            <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">
                              {vueloLlegadaAerolinea === "Privado" ? <>Matrícula de la aeronave {reqStar}</> : <>Número de Vuelo {reqStar}</>}
                            </label>
                            <div className="flex mt-1.5 rounded-lg border border-[#56B7A9] overflow-hidden">
                              {prefix && (
                                <span className={`px-3 py-3 font-extrabold text-sm md:text-base select-none border-r border-[#56B7A9] flex items-center justify-center min-w-[50px] ${
                                  isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {prefix}
                                </span>
                              )}
                              <input
                                type="text"
                                value={displayVal}
                                onChange={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "");
                                    setVueloLlegadaNoVuelo(prefix + clean);
                                }}
                                onBlur={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "").toUpperCase();
                                    setVueloLlegadaNoVuelo(prefix + clean);
                                }}
                                placeholder={vueloLlegadaAerolinea === "Privado" ? "XA-XXX" : "504"}
                                className={`w-full p-3 bg-transparent text-sm md:text-base font-bold focus:outline-none ${
                                  isDarkMode ? "text-slate-100" : "text-slate-700"
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      <div className="min-w-0">
                        <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Fecha de Llegada (Noviembre 2026) {reqStar}</label>
                        {renderCustomDatePicker(vueloLlegadaFecha, setVueloLlegadaFecha, "2026-11-04")}
                      </div>

                      <div className="min-w-0">
                        <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Hora de Llegada {reqStar}</label>
                        <input
                          type="time"
                          value={vueloLlegadaHora}
                          onChange={e => setVueloLlegadaHora(e.target.value)}
                          className="block w-[95%] sm:w-full max-w-full min-w-0 box-border mt-1.5 py-3 px-1.5 sm:px-3 bg-transparent border border-[#56B7A9] rounded-lg text-xs sm:text-sm md:text-base font-medium focus:outline-none mx-auto sm:mx-0"
                        />
                      </div>

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

                    <div className="space-y-3.5 bg-white/5 p-4 rounded-xl border border-[#56B7A9]">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                        <span className="font-extrabold text-[#56B7A9] text-xs md:text-sm uppercase block">SALIDA</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="titularRegresoType"
                              checked={vueloRegresoAerolinea !== "Terrestre"}
                              onChange={() => {
                                if (vueloRegresoAerolinea === "Terrestre") {
                                  setVueloRegresoAerolinea("");
                                }
                              }}
                              className="w-4 h-4 accent-[#56B7A9]"
                            />
                            Vuelo
                          </label>
                          <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="titularRegresoType"
                              checked={vueloRegresoAerolinea === "Terrestre"}
                              onChange={() => {
                                setVueloRegresoAerolinea("Terrestre");
                                setVueloRegresoNoVuelo("");
                              }}
                              className="w-4 h-4 accent-[#56B7A9]"
                            />
                            Vía Terrestre
                          </label>
                        </div>
                      </div>

                      {vueloRegresoAerolinea !== "Terrestre" && (
                        <div>
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Aerolínea / Transporte {reqStar}</label>
                          <select
                            value={vueloRegresoAerolinea}
                            onChange={e => {
                              const val = e.target.value;
                              setVueloRegresoAerolinea(val);
                              const { displayVal } = getCleanFlightNumberAndPrefix(vueloRegresoNoVuelo, val);
                              const newPrefix = getPrefixForAirline(val);
                              setVueloRegresoNoVuelo(newPrefix + displayVal);
                            }}
                            className={`w-full mt-1.5 p-3 border border-[#56B7A9] text-sm md:text-base font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                              isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                            }`}
                          >
                            <option value="">Selecciona aerolínea...</option>
                            <option value="Aeroméxico">Aeroméxico</option>
                            <option value="Volaris">Volaris</option>
                            <option value="Vivaaerobus">Vivaaerobus</option>
                            <option value="Privado">Privado</option>
                          </select>
                        </div>
                      )}

                      {vueloRegresoAerolinea && vueloRegresoAerolinea !== "Terrestre" && (() => {
                        const { prefix, displayVal } = getCleanFlightNumberAndPrefix(vueloRegresoNoVuelo, vueloRegresoAerolinea);
                        return (
                          <div>
                            <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">
                              {vueloRegresoAerolinea === "Privado" ? <>Matrícula de la aeronave {reqStar}</> : <>Número de Vuelo {reqStar}</>}
                            </label>
                            <div className="flex mt-1.5 rounded-lg border border-[#56B7A9] overflow-hidden">
                              {prefix && (
                                <span className={`px-3 py-3 font-extrabold text-sm md:text-base select-none border-r border-[#56B7A9] flex items-center justify-center min-w-[50px] ${
                                  isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {prefix}
                                </span>
                              )}
                              <input
                                type="text"
                                value={displayVal}
                                onChange={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "");
                                    setVueloRegresoNoVuelo(prefix + clean);
                                }}
                                onBlur={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "").toUpperCase();
                                    setVueloRegresoNoVuelo(prefix + clean);
                                }}
                                placeholder={vueloRegresoAerolinea === "Privado" ? "XA-XXX" : "505"}
                                className={`w-full p-3 bg-transparent text-sm md:text-base font-bold focus:outline-none ${
                                  isDarkMode ? "text-slate-100" : "text-slate-700"
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      <div className="min-w-0">
                        <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Fecha de Salida (Noviembre 2026) {reqStar}</label>
                        {renderCustomDatePicker(vueloRegresoFecha, setVueloRegresoFecha, "2026-11-11")}
                      </div>

                      <div className="min-w-0">
                        <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Hora de Salida {reqStar}</label>
                        <input
                          type="time"
                          value={vueloRegresoHora}
                          onChange={e => setVueloRegresoHora(e.target.value)}
                          className="block w-[95%] sm:w-full max-w-full min-w-0 box-border mt-1.5 py-3 px-1.5 sm:px-3 bg-transparent border border-[#56B7A9] rounded-lg text-xs sm:text-sm md:text-base font-medium focus:outline-none mx-auto sm:mx-0"
                        />
                      </div>

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
                {companionsList.map((comp, index) => {
                  const compKey = (comp.id && !comp.id.startsWith("M-")) ? comp.id : `C-${index + 1}`;
                  return (
                  <div key={compKey} className="border border-[#56B7A9] p-3.5 sm:p-5 rounded-2xl space-y-5 bg-slate-500/5">
                    <h4 className="font-extrabold text-xs md:text-sm uppercase tracking-wide text-blue-500">
                      🛫 Itinerario de Acompañante / {comp.relationship || "Acompañante"} ({comp.firstName} {comp.lastName})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="min-w-0 space-y-3.5 bg-white/5 p-3 sm:p-4 rounded-xl border border-[#56B7A9]">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                          <span className="font-extrabold text-[#56B7A9] text-xs md:text-sm uppercase block">LLEGADA</span>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                              <input 
                                type="radio" 
                                name={`compLlegadaType-${comp.id}`}
                                checked={comp.vueloLlegadaAerolinea !== "Terrestre"}
                                onChange={() => {
                                  if (comp.vueloLlegadaAerolinea === "Terrestre") {
                                    updateCompanionItem(comp.id, "vueloLlegadaAerolinea", "");
                                  }
                                }}
                                className="w-4 h-4 accent-[#56B7A9]"
                              />
                              Vuelo
                            </label>
                            <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                              <input 
                                type="radio" 
                                name={`compLlegadaType-${comp.id}`}
                                checked={comp.vueloLlegadaAerolinea === "Terrestre"}
                                onChange={() => {
                                  updateCompanionItem(comp.id, "vueloLlegadaAerolinea", "Terrestre");
                                  updateCompanionItem(comp.id, "vueloLlegadaNoVuelo", "");
                                }}
                                className="w-4 h-4 accent-[#56B7A9]"
                              />
                              Vía Terrestre
                            </label>
                          </div>
                        </div>

                        {comp.vueloLlegadaAerolinea !== "Terrestre" && (
                          <div>
                            <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Aerolínea / Transporte {reqStar}</label>
                            <select
                              value={comp.vueloLlegadaAerolinea || ""}
                              onChange={e => {
                                const val = e.target.value;
                                updateCompanionItem(comp.id, "vueloLlegadaAerolinea", val);
                                const { displayVal } = getCleanFlightNumberAndPrefix(comp.vueloLlegadaNoVuelo || "", val);
                                const newPrefix = getPrefixForAirline(val);
                                updateCompanionItem(comp.id, "vueloLlegadaNoVuelo", newPrefix + displayVal);
                              }}
                              className={`w-full mt-1.5 p-3 border border-[#56B7A9] text-sm md:text-base font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                                isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                              }`}
                            >
                              <option value="">Selecciona aerolínea...</option>
                              <option value="Aeroméxico">Aeroméxico</option>
                              <option value="Volaris">Volaris</option>
                              <option value="Vivaaerobus">Vivaaerobus</option>
                              <option value="Privado">Privado</option>
                            </select>
                          </div>
                        )}

                        {comp.vueloLlegadaAerolinea && comp.vueloLlegadaAerolinea !== "Terrestre" && (() => {
                          const { prefix, displayVal } = getCleanFlightNumberAndPrefix(comp.vueloLlegadaNoVuelo || "", comp.vueloLlegadaAerolinea);
                          return (
                            <div>
                              <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">
                                {comp.vueloLlegadaAerolinea === "Privado" ? <>Matrícula de la aeronave {reqStar}</> : <>Número de Vuelo {reqStar}</>}
                              </label>
                              <div className="flex mt-1.5 rounded-lg border border-[#56B7A9] overflow-hidden">
                                {prefix && (
                                  <span className={`px-3 py-3 font-extrabold text-sm md:text-base select-none border-r border-[#56B7A9] flex items-center justify-center min-w-[50px] ${
                                    isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {prefix}
                                  </span>
                                )}
                                <input
                                  type="text"
                                  value={displayVal}
                                  onChange={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "");
                                    updateCompanionItem(comp.id, "vueloLlegadaNoVuelo", prefix + clean);
                                  }}
                                  onBlur={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "").toUpperCase();
                                    updateCompanionItem(comp.id, "vueloLlegadaNoVuelo", prefix + clean);
                                  }}
                                  placeholder={comp.vueloLlegadaAerolinea === "Privado" ? "XA-XXX" : "504"}
                                  className={`w-full p-3 bg-transparent text-sm md:text-base font-bold focus:outline-none ${
                                    isDarkMode ? "text-slate-100" : "text-slate-700"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        <div className="min-w-0">
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Fecha de Llegada (Noviembre 2026) {reqStar}</label>
                          {renderCustomDatePicker(comp.vueloLlegadaFecha || defaultStartDate, (val) => updateCompanionItem(comp.id, "vueloLlegadaFecha", val), defaultStartDate)}
                        </div>

                        <div className="min-w-0">
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Hora de Llegada {reqStar}</label>
                          <input
                            type="time"
                            value={comp.vueloLlegadaHora || "12:00"}
                            onChange={e => updateCompanionItem(comp.id, "vueloLlegadaHora", e.target.value)}
                            className="block w-[95%] sm:w-full max-w-full min-w-0 box-border mt-1.5 py-3 px-1.5 sm:px-3 bg-transparent border border-[#56B7A9] rounded-lg text-xs sm:text-sm md:text-base font-medium focus:outline-none mx-auto sm:mx-0"
                          />
                        </div>

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

                      <div className="min-w-0 space-y-3.5 bg-white/5 p-3 sm:p-4 rounded-xl border border-[#56B7A9]">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                          <span className="font-extrabold text-[#56B7A9] text-xs md:text-sm uppercase block">SALIDA</span>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                              <input 
                                type="radio" 
                                name={`compRegresoType-${comp.id}`}
                                checked={comp.vueloRegresoAerolinea !== "Terrestre"}
                                onChange={() => {
                                  if (comp.vueloRegresoAerolinea === "Terrestre") {
                                    updateCompanionItem(comp.id, "vueloRegresoAerolinea", "");
                                  }
                                }}
                                className="w-4 h-4 accent-[#56B7A9]"
                              />
                              Vuelo
                            </label>
                            <label className="flex items-center gap-1.5 text-xs md:text-sm font-bold cursor-pointer">
                              <input 
                                type="radio" 
                                name={`compRegresoType-${comp.id}`}
                                checked={comp.vueloRegresoAerolinea === "Terrestre"}
                                onChange={() => {
                                  updateCompanionItem(comp.id, "vueloRegresoAerolinea", "Terrestre");
                                  updateCompanionItem(comp.id, "vueloRegresoNoVuelo", "");
                                }}
                                className="w-4 h-4 accent-[#56B7A9]"
                              />
                              Vía Terrestre
                            </label>
                          </div>
                        </div>

                        {comp.vueloRegresoAerolinea !== "Terrestre" && (
                          <div>
                            <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Aerolínea / Transporte {reqStar}</label>
                            <select
                              value={comp.vueloRegresoAerolinea || ""}
                              onChange={e => {
                                const val = e.target.value;
                                updateCompanionItem(comp.id, "vueloRegresoAerolinea", val);
                                const { displayVal } = getCleanFlightNumberAndPrefix(comp.vueloRegresoNoVuelo || "", val);
                                const newPrefix = getPrefixForAirline(val);
                                updateCompanionItem(comp.id, "vueloRegresoNoVuelo", newPrefix + displayVal);
                              }}
                              className={`w-full mt-1.5 p-3 border border-[#56B7A9] text-sm md:text-base font-bold focus:outline-none transition-colors duration-300 rounded-lg ${
                                isDarkMode ? "bg-slate-850 text-slate-100" : "bg-white text-slate-700"
                              }`}
                            >
                              <option value="">Selecciona aerolínea...</option>
                              <option value="Aeroméxico">Aeroméxico</option>
                              <option value="Volaris">Volaris</option>
                              <option value="Vivaaerobus">Vivaaerobus</option>
                              <option value="Privado">Privado</option>
                            </select>
                          </div>
                        )}

                        {comp.vueloRegresoAerolinea && comp.vueloRegresoAerolinea !== "Terrestre" && (() => {
                          const { prefix, displayVal } = getCleanFlightNumberAndPrefix(comp.vueloRegresoNoVuelo || "", comp.vueloRegresoAerolinea);
                          return (
                            <div>
                              <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">
                                {comp.vueloRegresoAerolinea === "Privado" ? <>Matrícula de la aeronave {reqStar}</> : <>Número de Vuelo {reqStar}</>}
                              </label>
                              <div className="flex mt-1.5 rounded-lg border border-[#56B7A9] overflow-hidden">
                                {prefix && (
                                  <span className={`px-3 py-3 font-extrabold text-sm md:text-base select-none border-r border-[#56B7A9] flex items-center justify-center min-w-[50px] ${
                                    isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {prefix}
                                  </span>
                                )}
                                <input
                                  type="text"
                                  value={displayVal}
                                  onChange={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "");
                                    updateCompanionItem(comp.id, "vueloRegresoNoVuelo", prefix + clean);
                                  }}
                                  onBlur={e => {
                                    const clean = e.target.value.replace(new RegExp(`^${prefix}`, "i"), "").toUpperCase();
                                    updateCompanionItem(comp.id, "vueloRegresoNoVuelo", prefix + clean);
                                  }}
                                  placeholder={comp.vueloRegresoAerolinea === "Privado" ? "XA-XXX" : "505"}
                                  className={`w-full p-3 bg-transparent text-sm md:text-base font-bold focus:outline-none ${
                                    isDarkMode ? "text-slate-100" : "text-slate-700"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        <div className="min-w-0">
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Fecha de Salida (Noviembre 2026) {reqStar}</label>
                          {renderCustomDatePicker(comp.vueloRegresoFecha || defaultEndDate, (val) => updateCompanionItem(comp.id, "vueloRegresoFecha", val), defaultEndDate)}
                        </div>

                        <div className="min-w-0">
                          <label className="block text-xs md:text-sm font-bold text-slate-500 uppercase">Hora de Salida {reqStar}</label>
                          <input
                            type="time"
                            value={comp.vueloRegresoHora || "15:00"}
                            onChange={e => updateCompanionItem(comp.id, "vueloRegresoHora", e.target.value)}
                            className="block w-[95%] sm:w-full max-w-full min-w-0 box-border mt-1.5 py-3 px-1.5 sm:px-3 bg-transparent border border-[#56B7A9] rounded-lg text-xs sm:text-sm md:text-base font-medium focus:outline-none mx-auto sm:mx-0"
                          />
                        </div>

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
                  );
                })}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <button 
          onClick={handlePrev}
          className={`${t.btnSec} text-sm py-3 px-6 flex items-center gap-1.5`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Atrás</span>
        </button>
        <button 
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm flex items-center gap-2"
        >
          <span>Siguiente: Actividades</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
