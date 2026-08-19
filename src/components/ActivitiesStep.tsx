import React, { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Sparkles, Clock, Info, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { ActivityReservationDetail, SpaReservationSlot } from "../types";
import { fetchSpaSlotsFromSheet } from "../utils/googleSheetsService";

interface ActivitiesStepProps {
  t: any;
  isDarkMode: boolean;
  nombreTitular: string;
  apellidosTitular?: string;
  correoTitular?: string;
  hasCompanion: boolean;
  companionsList: Array<{
    id: string;
    firstName: string;
    lastName: string;
    selectedActivities?: string[];
  }>;
  selectedActivities: string[];
  setSelectedActivities: React.Dispatch<React.SetStateAction<string[]>>;
  activityReservations?: ActivityReservationDetail[];
  setActivityReservations?: React.Dispatch<React.SetStateAction<ActivityReservationDetail[]>>;
  updateCompanionItem: (id: string, field: string, val: any) => void;
  checkActivityConflict: (personId: string, candidateActivity: any, selectedActs: string[]) => boolean;
  DataStore: any;
  handleNext: () => void;
  handlePrev: () => void;
}

export default function ActivitiesStep({
  t,
  isDarkMode,
  nombreTitular,
  apellidosTitular = "",
  correoTitular = "",
  hasCompanion,
  companionsList,
  selectedActivities,
  setSelectedActivities,
  activityReservations = [],
  setActivityReservations,
  updateCompanionItem,
  checkActivityConflict,
  DataStore,
  handleNext,
  handlePrev
}: ActivitiesStepProps) {
  const activitiesList = DataStore.getActivities ? DataStore.getActivities() : [];
  const [slotsState, setSlotsState] = useState<Record<string, { loading: boolean; slots: SpaReservationSlot[]; error?: string }>>({});

  // Fetch / Sync slots for SPA activities when they have a Google Sheets URL
  useEffect(() => {
    activitiesList.forEach((act: any) => {
      const actType = (act.activityType || (act.category ? act.category.toUpperCase() : "OTRO"));
      const isSpa = actType === "SPA" || act.category === "spa";

      if (isSpa && act.googleSheetsUrl && !slotsState[act.id]) {
        setSlotsState(prev => ({
          ...prev,
          [act.id]: { loading: true, slots: act.sheetSlots || [] }
        }));

        fetchSpaSlotsFromSheet(act.googleSheetsUrl, act.googleSheetsTab)
          .then(res => {
            setSlotsState(prev => ({
              ...prev,
              [act.id]: {
                loading: false,
                slots: res.slots,
                error: res.error
              }
            }));
          })
          .catch(err => {
            setSlotsState(prev => ({
              ...prev,
              [act.id]: {
                loading: false,
                slots: act.sheetSlots || [],
                error: err?.message
              }
            }));
          });
      } else if (isSpa && !act.googleSheetsUrl && act.sheetSlots && !slotsState[act.id]) {
        setSlotsState(prev => ({
          ...prev,
          [act.id]: { loading: false, slots: act.sheetSlots || [] }
        }));
      }
    });
  }, [activitiesList]);

  // Helper to handle slot selection
  const handleSelectSlot = (
    act: any,
    personType: "titular" | "companion",
    personId: string,
    personName: string,
    personLastName: string,
    email: string,
    rowIndexStr: string
  ) => {
    if (!setActivityReservations) return;

    if (!rowIndexStr) {
      // Clear reservation
      setActivityReservations(prev => prev.filter(r => !(r.activityId === act.id && r.personId === personId)));
      return;
    }

    const rowIndex = Number(rowIndexStr);
    const activitySlots = slotsState[act.id]?.slots || act.sheetSlots || [];
    const chosenSlot = activitySlots.find(s => s.rowIndex === rowIndex);

    if (!chosenSlot) return;

    const cleanPersonName = (personName || "").trim();
    const cleanPersonLastName = (personLastName || "").trim();
    const lastNameParts = cleanPersonLastName ? cleanPersonLastName.split(" ") : [];

    const newReservation: ActivityReservationDetail = {
      activityId: act.id,
      activityName: act.name || act.title,
      personType,
      personId,
      personName: cleanPersonName,
      paternalName: lastNameParts[0] ? lastNameParts[0].trim() : "",
      maternalName: lastNameParts.length > 1 ? lastNameParts.slice(1).join(" ").trim() : "",
      titularEmail: (email || "").trim(),
      slotTime: chosenSlot.timeSlot,
      therapistGender: chosenSlot.therapistGender,
      rowIndex: chosenSlot.rowIndex,
      citaNo: chosenSlot.citaNo
    };

    setActivityReservations(prev => {
      const filtered = prev.filter(r => !(r.activityId === act.id && r.personId === personId));
      return [...filtered, newReservation];
    });
  };

  // Helper to remove reservation when an activity is unchecked
  const handleUncheckActivity = (actId: string, personId: string) => {
    if (setActivityReservations) {
      setActivityReservations(prev => prev.filter(r => !(r.activityId === actId && r.personId === personId)));
    }
  };

  const handleNextWithValidation = () => {
    // Check if any selected SPA activity is missing slot selection
    let missingSlotCount = 0;
    activitiesList.forEach((act: any) => {
      const actType = (act.activityType || (act.category ? act.category.toUpperCase() : "OTRO"));
      const isSpa = actType === "SPA" || act.category === "spa";

      if (isSpa) {
        const slots = slotsState[act.id]?.slots || act.sheetSlots || [];
        const hasAvailableSlots = slots.some(s => !s.isBlocked && !s.isOccupied);

        if (hasAvailableSlots) {
          // Check titular
          if (selectedActivities.includes(act.id)) {
            const hasTitularRes = activityReservations.some(r => r.activityId === act.id && r.personId === "titular");
            if (!hasTitularRes) missingSlotCount++;
          }
          // Check companions
          if (hasCompanion) {
            companionsList.forEach(comp => {
              if (comp.selectedActivities?.includes(act.id)) {
                const hasCompRes = activityReservations.some(r => r.activityId === act.id && r.personId === comp.id);
                if (!hasCompRes) missingSlotCount++;
              }
            });
          }
        }
      }
    });

    if (missingSlotCount > 0) {
      // Auto-assign first available slot or prompt user
      console.log(`Nota: Hay ${missingSlotCount} selecciones de Spa sin horario específico asignado.`);
    }

    handleNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl md:text-2xl font-extrabold flex items-center gap-2.5 ${t.textTitle}`}>
          <Calendar className="w-6 h-6 text-blue-500" />
          Paso 5: Registro de Actividades Especiales
        </h3>
        <p className={`text-xs mt-1 font-medium ${t.textMuted}`}>
          Selecciona las actividades recreativas y sesiones especiales (Spa, Golf, Buceo) deseadas para el titular y acompañante. En actividades de Spa, elige el horario y terapeuta disponible.
        </p>
      </div>

      <div className="space-y-4">
        {activitiesList.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border border-dashed transition-all duration-300 ${
            isDarkMode 
              ? "bg-slate-900/40 border-slate-800 text-slate-400" 
              : "bg-slate-50 border-slate-200 text-slate-500 shadow-xs"
          }`}>
            <p className="font-extrabold text-sm text-amber-500 uppercase tracking-wide">
              Todavía no se encuentran actividades disponibles, próximamente se podrán seleccionar aquí
            </p>
          </div>
        ) : (
          activitiesList.map((act: any) => {
            const slotsRemaining = Math.max(0, (act.capacity || 20) - (act.registeredCount || 0));
            const isFull = slotsRemaining === 0;
            const actType = (act.activityType || (act.category ? act.category.toUpperCase() : 'OTRO'));
            const isSpa = actType === "SPA" || act.category === "spa";

            // Check if selected for Titular
            const isSelectedForTitular = selectedActivities.includes(act.id);
            
            // Check for schedule conflict for Titular
            const hasConflictForTitular = !isSelectedForTitular && 
              checkActivityConflict("titular", act, selectedActivities);

            const activitySlots = slotsState[act.id]?.slots || act.sheetSlots || [];
            const isLoadingSlots = slotsState[act.id]?.loading || false;

            // Titular reservation details
            const titularReservation = activityReservations.find(
              r => r.activityId === act.id && r.personId === "titular"
            );

            // Filter available slots for Titular
            const availableSlotsForTitular = activitySlots.filter(s => {
              if (s.isBlocked) return false;
              if (s.isOccupied) {
                const isOccupiedByThisTitular = 
                  (titularReservation && titularReservation.rowIndex === s.rowIndex) ||
                  (!!s.titularEmail && !!correoTitular && (s.titularEmail || "").trim().toLowerCase() === (correoTitular || "").trim().toLowerCase() && 
                   (!s.participantName || s.participantName.toLowerCase().includes((nombreTitular || "").toLowerCase())));
                if (!isOccupiedByThisTitular) return false;
              }
              // Check if currently picked by a companion in this registration form
              const pickedByComp = activityReservations.some(
                r => r.activityId === act.id && r.personId !== "titular" && r.rowIndex === s.rowIndex
              );
              return !pickedByComp;
            });

            return (
              <div 
                key={act.id} 
                className={`p-6 rounded-2xl border transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-slate-900/60 border-slate-800" 
                    : "bg-white border-slate-200 shadow-xs hover:shadow-md"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                        isSpa
                          ? "bg-purple-50 text-purple-700 border-purple-200" 
                          : actType === "GOLF" || act.category === "golf"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : actType === "BUCEO"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {actType}
                      </span>

                      {(act.eventDay || act.dateTime) && (
                        <span className={`text-xs font-bold ${t.textMuted} flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md`}>
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {act.eventDay || "Día del evento"}
                        </span>
                      )}

                      {(act.timeRange || act.dateTime) && (
                        <span className={`text-xs font-bold ${t.textMuted} flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md`}>
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {act.timeRange || act.dateTime}
                        </span>
                      )}

                      <span className={`text-xs font-extrabold ${isFull ? "text-rose-500" : "text-emerald-600"}`}>
                        {isFull ? "⚠️ Lista de Espera" : `✓ ${slotsRemaining} cupos libres`}
                      </span>
                    </div>

                    <h4 className={`text-base md:text-lg font-black uppercase tracking-tight ${t.textHeading}`}>
                      {act.name || act.title}
                    </h4>
                    
                    <p className={`text-xs md:text-sm leading-relaxed ${t.textMuted}`}>
                      {act.description}
                    </p>

                    {act.rules && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2 rounded-xl flex items-center gap-1.5 font-medium">
                        <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span><strong>Nota:</strong> {act.rules}</span>
                      </p>
                    )}
                  </div>

                  {/* Checkbox selectors for guests */}
                  <div className="p-4 bg-slate-500/5 rounded-2xl border border-slate-200/50 dark:border-slate-800 min-w-[260px] space-y-2.5 text-xs md:text-sm font-sans shrink-0">
                    <span className="font-bold text-slate-500 uppercase text-[10px] md:text-xs tracking-wider block border-b border-slate-200 dark:border-slate-800 pb-1.5">
                      Inscripción de Participantes
                    </span>
                    
                    {/* Titular check */}
                    <div className="flex items-center justify-between gap-2.5 py-0.5 text-xs md:text-sm">
                      <span className="font-bold truncate max-w-[150px]">{nombreTitular || "Titular"}</span>
                      <div className="flex items-center gap-1.5">
                        {hasConflictForTitular ? (
                          <span className="text-[10px] text-rose-500 font-black uppercase bg-rose-500/5 px-2 py-0.5 rounded">
                            Conflicto Horario
                          </span>
                        ) : (
                          <input 
                            type="checkbox"
                            checked={isSelectedForTitular}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedActivities(prev => [...prev, act.id]);
                              } else {
                                setSelectedActivities(prev => prev.filter(id => id !== act.id));
                                handleUncheckActivity(act.id, "titular");
                              }
                            }}
                            className="w-4.5 h-4.5 accent-blue-600 cursor-pointer rounded"
                          />
                        )}
                        {isSelectedForTitular && isFull && (
                          <span className="text-[10px] text-amber-500 font-black uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                            Espera
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Adult companions check */}
                    {hasCompanion && companionsList.map((comp, idx) => {
                      const isSelectedForComp = comp.selectedActivities?.includes(act.id);
                      const hasConflictForComp = !isSelectedForComp && 
                        checkActivityConflict(comp.id, act, comp.selectedActivities || []);

                      return (
                        <div key={comp.id} className="flex items-center justify-between gap-2.5 py-1 border-t border-slate-200/50 dark:border-slate-800 pt-2 font-sans text-xs md:text-sm">
                          <span className="font-bold truncate max-w-[150px]">{comp.firstName || `Acompañante ${idx + 1}`}</span>
                          <div className="flex items-center gap-1.5">
                            {hasConflictForComp ? (
                              <span className="text-[10px] text-rose-500 font-black uppercase bg-rose-500/5 px-2 py-0.5 rounded">
                                Conflicto Horario
                              </span>
                            ) : (
                              <input 
                                type="checkbox"
                                checked={isSelectedForComp}
                                onChange={e => {
                                  const updatedActs = e.target.checked
                                    ? [...(comp.selectedActivities || []), act.id]
                                    : (comp.selectedActivities || []).filter(id => id !== act.id);
                                  updateCompanionItem(comp.id, "selectedActivities", updatedActs);
                                  if (!e.target.checked) {
                                    handleUncheckActivity(act.id, comp.id);
                                  }
                                }}
                                className="w-4.5 h-4.5 accent-blue-600 cursor-pointer rounded"
                              />
                            )}
                            {isSelectedForComp && isFull && (
                              <span className="text-[10px] text-amber-500 font-black uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                                Espera
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SPA Slot Selectors for Titular & Companions */}
                {isSpa && (isSelectedForTitular || (hasCompanion && companionsList.some(c => c.selectedActivities?.includes(act.id)))) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                        Selección de Horario y Terapeuta (Slots de Spa)
                      </span>
                    </div>

                    {/* Titular SPA Slot Selection */}
                    {isSelectedForTitular && (
                      <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            Horario / Terapeuta para Titular: {nombreTitular || "Titular"} {apellidosTitular}
                          </label>
                          {titularReservation && (
                            <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-black px-2 py-0.5 rounded-md">
                              {titularReservation.citaNo ? `Cita #${titularReservation.citaNo}` : "Confirmado"}
                            </span>
                          )}
                        </div>

                        {isLoadingSlots ? (
                          <div className="text-xs text-purple-700 font-semibold animate-pulse flex items-center gap-1.5 py-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Consultando disponibilidad en Google Sheets...
                          </div>
                        ) : availableSlotsForTitular.length === 0 ? (
                          <div className="text-xs text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            No hay slots de cita disponibles en la hoja de Spa (se registrará en lista de espera).
                          </div>
                        ) : (
                          <select
                            value={titularReservation ? `${titularReservation.rowIndex}` : ""}
                            onChange={e => handleSelectSlot(
                              act,
                              "titular",
                              "titular",
                              nombreTitular || "Titular",
                              apellidosTitular,
                              correoTitular,
                              e.target.value
                            )}
                            className="w-full text-xs font-bold p-2.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
                          >
                            <option value="">-- Selecciona el horario y terapeuta que deseas --</option>
                            {availableSlotsForTitular.map(slot => (
                              <option key={slot.rowIndex} value={slot.rowIndex}>
                                {slot.citaNo ? `[Cita #${slot.citaNo}] ` : ""}{slot.timeSlot} — Terapeuta: {slot.therapistGender} ({slot.duration || "60 min"})
                              </option>
                            ))}
                          </select>
                        )}

                        {titularReservation && (
                          <div className="text-[11px] text-purple-900 dark:text-purple-300 font-bold flex items-center gap-1 pt-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              Cita seleccionada: <strong>{titularReservation.slotTime}</strong> con terapeuta <strong>{titularReservation.therapistGender}</strong> {titularReservation.citaNo ? `(Cita #${titularReservation.citaNo})` : `(Renglón ${titularReservation.rowIndex})`}.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Companion(s) SPA Slot Selection */}
                    {hasCompanion && companionsList.map((comp, idx) => {
                      const isSelectedForComp = comp.selectedActivities?.includes(act.id);
                      if (!isSelectedForComp) return null;

                      const compReservation = activityReservations.find(
                        r => r.activityId === act.id && r.personId === comp.id
                      );

                      const availableSlotsForComp = activitySlots.filter(s => {
                        if (s.isBlocked) return false;
                        if (s.isOccupied) {
                          const isOccupiedByThisComp = 
                            (compReservation && compReservation.rowIndex === s.rowIndex) ||
                            (!!s.titularEmail && !!correoTitular && (s.titularEmail || "").trim().toLowerCase() === (correoTitular || "").trim().toLowerCase() && 
                             !!comp.firstName && !!s.participantName && s.participantName.toLowerCase().includes(comp.firstName.toLowerCase()));
                          if (!isOccupiedByThisComp) return false;
                        }
                        // Check if currently picked by titular or other companions
                        const pickedByOther = activityReservations.some(
                          r => r.activityId === act.id && r.personId !== comp.id && r.rowIndex === s.rowIndex
                        );
                        return !pickedByOther;
                      });

                      return (
                        <div key={comp.id} className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              Horario / Terapeuta para Acompañante: {comp.firstName || `Acompañante ${idx + 1}`} {comp.lastName}
                            </label>
                            {compReservation && (
                              <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-black px-2 py-0.5 rounded-md">
                                {compReservation.citaNo ? `Cita #${compReservation.citaNo}` : "Confirmado"}
                              </span>
                            )}
                          </div>

                          {isLoadingSlots ? (
                            <div className="text-xs text-purple-700 font-semibold animate-pulse flex items-center gap-1.5 py-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Consultando disponibilidad en Google Sheets...
                            </div>
                          ) : availableSlotsForComp.length === 0 ? (
                            <div className="text-xs text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              No hay slots de cita disponibles para este acompañante (se registrará en lista de espera).
                            </div>
                          ) : (
                            <select
                              value={compReservation ? `${compReservation.rowIndex}` : ""}
                              onChange={e => handleSelectSlot(
                                act,
                                "companion",
                                comp.id,
                                comp.firstName || `Acompañante ${idx + 1}`,
                                comp.lastName || "",
                                correoTitular,
                                e.target.value
                              )}
                              className="w-full text-xs font-bold p-2.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-hidden cursor-pointer"
                            >
                              <option value="">-- Selecciona el horario y terapeuta para el acompañante --</option>
                              {availableSlotsForComp.map(slot => (
                                <option key={slot.rowIndex} value={slot.rowIndex}>
                                  {slot.citaNo ? `[Cita #${slot.citaNo}] ` : ""}{slot.timeSlot} — Terapeuta: {slot.therapistGender} ({slot.duration || "60 min"})
                                </option>
                              ))}
                            </select>
                          )}

                          {compReservation && (
                            <div className="text-[11px] text-purple-900 dark:text-purple-300 font-bold flex items-center gap-1 pt-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Cita seleccionada: <strong>{compReservation.slotTime}</strong> con terapeuta <strong>{compReservation.therapistGender}</strong> {compReservation.citaNo ? `(Cita #${compReservation.citaNo})` : `(Renglón ${compReservation.rowIndex})`}.
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <button 
          onClick={handlePrev}
          className={`${t.btnSec} text-sm py-3 px-6 flex items-center gap-1.5 cursor-pointer`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Atrás</span>
        </button>
        <button 
          onClick={handleNextWithValidation}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm flex items-center gap-2"
        >
          <span>Siguiente: Resumen</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
