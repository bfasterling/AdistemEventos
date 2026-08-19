import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  User, 
  Users, 
  X,
  Lock,
  ArrowRight
} from "lucide-react";
import { Activity, ActivityReservationDetail, ActivityDayConfig, SpaReservationSlot } from "../types";
import { fetchSpaSlotsFromSheet, saveSpaReservationsToSheet, normalizeTherapistGender } from "../utils/googleSheetsService";

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
  onSaveReservationSuccess?: (updatedReservations: ActivityReservationDetail[]) => void;
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
  onSaveReservationSuccess,
  updateCompanionItem,
  checkActivityConflict,
  DataStore,
  handleNext,
  handlePrev
}: ActivitiesStepProps) {
  const activitiesList: Activity[] = DataStore.getActivities ? DataStore.getActivities() : [];

  // Active day selection per activity: { [activityId]: dayId }
  const [selectedDayByActivity, setSelectedDayByActivity] = useState<Record<string, string>>({});

  // Active pending time selection: { [activityId]: string (e.g. "09:00 AM (60 min)") }
  const [selectedTimeByActivity, setSelectedTimeByActivity] = useState<Record<string, string>>({});

  // Active pending therapist / slot selection: { [activityId]: number (rowIndex) }
  const [selectedSlotRowByActivity, setSelectedSlotRowByActivity] = useState<Record<string, number>>({});

  // Active pending participant selection: { [activityId]: "titular" | string (companionId) }
  const [selectedParticipantByActivity, setSelectedParticipantByActivity] = useState<Record<string, string>>({});

  // Cache of slots fetched by key: `${activityId}_${sheetTab}`
  const [slotsCache, setSlotsCache] = useState<Record<string, { loading: boolean; slots: SpaReservationSlot[]; error?: string }>>({});

  // Booking in progress state: { [activityId]: boolean }
  const [bookingLoading, setBookingLoading] = useState<Record<string, boolean>>({});
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<Record<string, string>>({});

  // Initialize day and participant for activities
  useEffect(() => {
    activitiesList.forEach(act => {
      const isSpa = (act.activityType || act.category || "").toUpperCase() === "SPA";
      if (isSpa) {
        const days = act.daysConfig && act.daysConfig.length > 0 
          ? act.daysConfig 
          : [{ id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }];

        // Check if user already has a reservation for this activity
        const existingRes = activityReservations.find(r => r.activityId === act.id);

        if (existingRes && existingRes.dayId) {
          if (!selectedDayByActivity[act.id]) {
            setSelectedDayByActivity(prev => ({ ...prev, [act.id]: existingRes.dayId! }));
          }
          if (!selectedParticipantByActivity[act.id]) {
            setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: existingRes.personId }));
          }
        } else if (!selectedDayByActivity[act.id] && days.length > 0) {
          setSelectedDayByActivity(prev => ({ ...prev, [act.id]: days[0].id }));
        }

        if (!selectedParticipantByActivity[act.id]) {
          setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: "titular" }));
        }
      }
    });
  }, [activitiesList, activityReservations]);

  // Fetch slots whenever the active day for a SPA activity changes
  useEffect(() => {
    activitiesList.forEach(act => {
      const isSpa = (act.activityType || act.category || "").toUpperCase() === "SPA";
      if (!isSpa || !act.googleSheetsUrl) return;

      const days = act.daysConfig && act.daysConfig.length > 0 
        ? act.daysConfig 
        : [{ id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }];

      const activeDayId = selectedDayByActivity[act.id] || days[0]?.id;
      const activeDay = days.find(d => d.id === activeDayId) || days[0];
      const targetTab = activeDay?.googleSheetsTab || act.googleSheetsTab || "Viernes";
      const cacheKey = `${act.id}_${targetTab}`;

      if (!slotsCache[cacheKey]) {
        setSlotsCache(prev => ({
          ...prev,
          [cacheKey]: { loading: true, slots: [] }
        }));

        fetchSpaSlotsFromSheet(act.googleSheetsUrl, targetTab)
          .then(res => {
            setSlotsCache(prev => ({
              ...prev,
              [cacheKey]: {
                loading: false,
                slots: res.slots || [],
                error: res.error
              }
            }));
          })
          .catch(err => {
            setSlotsCache(prev => ({
              ...prev,
              [cacheKey]: {
                loading: false,
                slots: [],
                error: err?.message || "Error al conectar con la pestaña del Sheets."
              }
            }));
          });
      }
    });
  }, [activitiesList, selectedDayByActivity, slotsCache]);

  // Helper to get active day config for an activity
  const getActiveDay = (act: Activity): ActivityDayConfig => {
    const days = act.daysConfig && act.daysConfig.length > 0 
      ? act.daysConfig 
      : [{ id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }];
    const activeDayId = selectedDayByActivity[act.id] || days[0]?.id;
    return days.find(d => d.id === activeDayId) || days[0];
  };

  // Helper to get current slots for an activity and its selected day
  const getCurrentDaySlots = (act: Activity): { loading: boolean; slots: SpaReservationSlot[]; error?: string } => {
    const activeDay = getActiveDay(act);
    const targetTab = activeDay?.googleSheetsTab || act.googleSheetsTab || "Viernes";
    const cacheKey = `${act.id}_${targetTab}`;
    return slotsCache[cacheKey] || { loading: false, slots: [] };
  };

  // Manual refresh of slots for a day
  const handleRefreshDaySlots = (act: Activity) => {
    const activeDay = getActiveDay(act);
    const targetTab = activeDay?.googleSheetsTab || act.googleSheetsTab || "Viernes";
    const cacheKey = `${act.id}_${targetTab}`;

    setSlotsCache(prev => ({
      ...prev,
      [cacheKey]: { loading: true, slots: prev[cacheKey]?.slots || [] }
    }));

    fetchSpaSlotsFromSheet(act.googleSheetsUrl, targetTab)
      .then(res => {
        setSlotsCache(prev => ({
          ...prev,
          [cacheKey]: {
            loading: false,
            slots: res.slots || [],
            error: res.error
          }
        }));
      })
      .catch(err => {
        setSlotsCache(prev => ({
          ...prev,
          [cacheKey]: {
            loading: false,
            slots: [],
            error: err?.message || "Error al conectar con la pestaña."
          }
        }));
      });
  };

  // Toggle activity ON or OFF
  const handleToggleActivity = (act: Activity, newState: boolean) => {
    if (newState) {
      // Switch to ON: default enroll titular
      if (!selectedActivities.includes(act.id)) {
        setSelectedActivities(prev => [...prev, act.id]);
      }
      const days = act.daysConfig && act.daysConfig.length > 0 
        ? act.daysConfig 
        : [{ id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }];
      if (days.length > 0 && !selectedDayByActivity[act.id]) {
        setSelectedDayByActivity(prev => ({ ...prev, [act.id]: days[0].id }));
      }
      if (!selectedParticipantByActivity[act.id]) {
        setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: "titular" }));
      }
    } else {
      // Switch to OFF: remove from titular & companions & clear reservations
      setSelectedActivities(prev => prev.filter(id => id !== act.id));
      if (hasCompanion) {
        companionsList.forEach(comp => {
          if (comp.selectedActivities?.includes(act.id)) {
            const filtered = (comp.selectedActivities || []).filter(id => id !== act.id);
            updateCompanionItem(comp.id, "selectedActivities", filtered);
          }
        });
      }

      // If user had a reservation in Google Sheets, trigger background release
      const existingReservations = activityReservations.filter(r => r.activityId === act.id);
      if (existingReservations.length > 0 && act.googleSheetsWebhookUrl) {
        saveSpaReservationsToSheet(
          act.googleSheetsWebhookUrl,
          [],
          existingReservations,
          (correoTitular || "").trim(),
          existingReservations[0]?.sheetTab || act.googleSheetsTab || "Viernes"
        ).catch(console.warn);
      }

      if (setActivityReservations) {
        setActivityReservations(prev => prev.filter(r => r.activityId !== act.id));
      }
      setSelectedTimeByActivity(prev => {
        const next = { ...prev };
        delete next[act.id];
        return next;
      });
      setSelectedSlotRowByActivity(prev => {
        const next = { ...prev };
        delete next[act.id];
        return next;
      });
      setBookingSuccessMsg(prev => {
        const next = { ...prev };
        delete next[act.id];
        return next;
      });
    }
  };

  // Execute "Reservar horario" button action
  const handleConfirmReservation = async (act: Activity) => {
    const activeDay = getActiveDay(act);
    const dayTab = activeDay?.googleSheetsTab || act.googleSheetsTab || "Viernes";
    const selectedTime = selectedTimeByActivity[act.id];
    const selectedRowIndex = selectedSlotRowByActivity[act.id];
    const participantId = selectedParticipantByActivity[act.id] || "titular";

    if (!selectedTime || !selectedRowIndex) {
      alert("Por favor selecciona primero un horario disponible.");
      return;
    }

    const { slots } = getCurrentDaySlots(act);
    const chosenSlot = slots.find(s => s.rowIndex === selectedRowIndex);
    if (!chosenSlot) {
      alert("El horario seleccionado ya no está disponible. Por favor elige otro.");
      return;
    }

    // Determine participant details
    let personType: "titular" | "companion" = "titular";
    let personName = (nombreTitular || "").trim();
    let personLastName = (apellidosTitular || "").trim();

    if (participantId !== "titular") {
      personType = "companion";
      const comp = companionsList.find(c => c.id === participantId);
      personName = (comp?.firstName || `Acompañante`).trim();
      personLastName = (comp?.lastName || "").trim();
    }

    const lastNameParts = personLastName.split(" ");
    const paternal = lastNameParts[0] ? lastNameParts[0].trim() : "";
    const maternal = lastNameParts.length > 1 ? lastNameParts.slice(1).join(" ").trim() : "";

    const newReservation: ActivityReservationDetail = {
      activityId: act.id,
      activityName: act.name || "Sesión de Spa",
      personType,
      personId: participantId,
      personName,
      paternalName: paternal,
      maternalName: maternal,
      titularEmail: (correoTitular || "").trim(),
      slotTime: chosenSlot.timeSlot,
      therapistGender: chosenSlot.therapistGender,
      rowIndex: chosenSlot.rowIndex,
      citaNo: chosenSlot.citaNo,
      dayId: activeDay.id,
      dayDate: activeDay.date,
      dayLabel: activeDay.label,
      sheetTab: dayTab
    };

    setBookingLoading(prev => ({ ...prev, [act.id]: true }));
    setBookingSuccessMsg(prev => ({ ...prev, [act.id]: "" }));

    try {
      // Find any previous reservation for this activity
      const previousReservations = activityReservations.filter(r => r.activityId === act.id);

      // Save to Google Sheets via Webhook & Backend API
      const sheetRes = await saveSpaReservationsToSheet(
        act,
        [newReservation],
        {
          previousReservations,
          sheetTab: dayTab,
          titularEmail: (correoTitular || "").trim()
        }
      );
      if (!sheetRes.success) {
        console.warn("Webhook warning:", sheetRes.error);
      }

      // Update state
      const updatedReservations = [...activityReservations.filter(r => r.activityId !== act.id), newReservation];
      if (setActivityReservations) {
        setActivityReservations(updatedReservations);
      }

      // Ensure participant is in selectedActivities
      if (personType === "titular") {
        if (!selectedActivities.includes(act.id)) {
          setSelectedActivities(prev => [...prev, act.id]);
        }
      } else {
        const comp = companionsList.find(c => c.id === participantId);
        if (comp) {
          const currentCompActs = comp.selectedActivities || [];
          if (!currentCompActs.includes(act.id)) {
            updateCompanionItem(comp.id, "selectedActivities", [...currentCompActs, act.id]);
          }
        }
      }

      // Auto-save draft in Firestore & DataStore immediately
      if (onSaveReservationSuccess) {
        onSaveReservationSuccess(updatedReservations);
      }

      setBookingSuccessMsg(prev => ({
        ...prev,
        [act.id]: `¡Horario reservado con éxito para ${personName} el ${activeDay.label} a las ${chosenSlot.timeSlot}!`
      }));

      // Refresh slots for this day to reflect the newly occupied slot
      handleRefreshDaySlots(act);
    } catch (err: any) {
      alert(`Error al guardar la reserva: ${err?.message || "Ocurrió un problema de conexión."}`);
    } finally {
      setBookingLoading(prev => ({ ...prev, [act.id]: false }));
    }
  };

  // Helper to cancel or change reservation
  const handleCancelReservation = async (act: Activity) => {
    const existingRes = activityReservations.find(r => r.activityId === act.id);
    if (!existingRes) return;

    if (!confirm("¿Deseas liberar y cancelar este horario reservado en el SPA?")) {
      return;
    }

    setBookingLoading(prev => ({ ...prev, [act.id]: true }));
    try {
      await saveSpaReservationsToSheet(
        act,
        [],
        {
          previousReservations: [existingRes],
          clearedRowIndices: existingRes.rowIndex ? [existingRes.rowIndex] : [],
          sheetTab: existingRes.sheetTab || act.googleSheetsTab || "Viernes",
          titularEmail: (correoTitular || "").trim()
        }
      );

      const updatedReservations = activityReservations.filter(r => r.activityId !== act.id);
      if (setActivityReservations) {
        setActivityReservations(updatedReservations);
      }

      if (onSaveReservationSuccess) {
        onSaveReservationSuccess(updatedReservations);
      }

      setSelectedTimeByActivity(prev => {
        const next = { ...prev };
        delete next[act.id];
        return next;
      });
      setSelectedSlotRowByActivity(prev => {
        const next = { ...prev };
        delete next[act.id];
        return next;
      });
      setBookingSuccessMsg(prev => {
        const next = { ...prev };
        delete next[act.id];
        return next;
      });

      handleRefreshDaySlots(act);
    } catch (err: any) {
      alert(`Error al cancelar: ${err?.message}`);
    } finally {
      setBookingLoading(prev => ({ ...prev, [act.id]: false }));
    }
  };

  const handleNextWithValidation = () => {
    // Validate if any SPA activity is ON but missing slot reservation
    const unreservedSpaActs: string[] = [];
    activitiesList.forEach(act => {
      const isSpa = (act.activityType || act.category || "").toUpperCase() === "SPA";
      const isSelected = selectedActivities.includes(act.id) || (hasCompanion && companionsList.some(c => c.selectedActivities?.includes(act.id)));
      if (isSpa && isSelected) {
        const hasRes = activityReservations.some(r => r.activityId === act.id);
        if (!hasRes) {
          unreservedSpaActs.push(act.name);
        }
      }
    });

    if (unreservedSpaActs.length > 0) {
      if (!confirm(`Tienes seleccionada la actividad "${unreservedSpaActs.join(", ")}" pero aún no has dado clic en "Reservar horario". ¿Deseas continuar de todas formas (quedarás en lista de espera)?`)) {
        return;
      }
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
        <p className={`text-xs md:text-sm mt-1 font-medium ${t.textMuted}`}>
          Selecciona las actividades recreativas del evento. En actividades tipo SPA, activa el selector para elegir el día, consultar los horarios disponibles en vivo y reservar tu cita.
        </p>
      </div>

      <div className="space-y-5">
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
          activitiesList.map(act => {
            const actType = (act.activityType || (act.category ? act.category.toUpperCase() : "OTRO"));
            const isSpa = actType === "SPA" || act.category === "spa";

            // Check if active for titular or companion
            const isTitularActive = selectedActivities.includes(act.id);
            const isAnyCompanionActive = hasCompanion && companionsList.some(c => c.selectedActivities?.includes(act.id));
            const isActivityOn = isTitularActive || isAnyCompanionActive;

            // Existing confirmed reservation for this activity
            const currentReservation = activityReservations.find(r => r.activityId === act.id);

            // Days configuration
            const days = act.daysConfig && act.daysConfig.length > 0 
              ? act.daysConfig 
              : [{ id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }];

            const activeDay = getActiveDay(act);
            const { loading: isLoadingSlots, slots: daySlots, error: slotsError } = getCurrentDaySlots(act);

            // Filter available unblocked slots for the current active day
            const availableSlots = daySlots.filter(s => {
              if (s.isBlocked) return false;
              if (s.isOccupied) {
                // If occupied by current user's email, consider available for re-selection
                const isOccupiedByThisUser = 
                  (currentReservation && currentReservation.rowIndex === s.rowIndex) ||
                  (!!s.titularEmail && !!correoTitular && (s.titularEmail || "").trim().toLowerCase() === (correoTitular || "").trim().toLowerCase());
                return isOccupiedByThisUser;
              }
              return true;
            });

            // Group available slots by Time (e.g. "09:00 AM (60 min)" -> [slot1, slot2])
            const groupedSlotsByTime = availableSlots.reduce((acc, slot) => {
              const timeKey = `${slot.timeSlot}${slot.duration ? ` (${slot.duration})` : ''}`;
              if (!acc[timeKey]) {
                acc[timeKey] = [];
              }
              acc[timeKey].push(slot);
              return acc;
            }, {} as Record<string, SpaReservationSlot[]>);

            const availableTimeKeys = Object.keys(groupedSlotsByTime);

            const activeTime = selectedTimeByActivity[act.id] || (currentReservation ? `${currentReservation.slotTime}` : "");
            const activeRowIndex = selectedSlotRowByActivity[act.id] || currentReservation?.rowIndex;
            const activeParticipant = selectedParticipantByActivity[act.id] || currentReservation?.personId || "titular";

            const slotsRemaining = Math.max(0, (act.capacity || 20) - (act.registeredCount || 0));
            const isFull = slotsRemaining === 0;

            return (
              <div 
                key={act.id} 
                className={`p-5 md:p-6 rounded-3xl border transition-all duration-300 ${
                  isDarkMode 
                    ? isActivityOn 
                      ? "bg-slate-900/90 border-purple-800/80 shadow-lg shadow-purple-950/20" 
                      : "bg-slate-900/50 border-slate-800/80" 
                    : isActivityOn 
                      ? "bg-white border-purple-300 shadow-md ring-1 ring-purple-100" 
                      : "bg-slate-50/60 border-slate-200/90 hover:bg-white"
                }`}
              >
                {/* Header & Main Switch */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                        isSpa
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800" 
                          : actType === "GOLF" || act.category === "golf"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" 
                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {actType}
                      </span>

                      {act.eventDay && (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {act.eventDay}
                        </span>
                      )}

                      {act.timeRange && (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {act.timeRange}
                        </span>
                      )}

                      {isSpa && days.length > 1 && (
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-900/40 px-2 py-0.5 rounded-md">
                          {days.length} Días Disponibles
                        </span>
                      )}
                    </div>

                    <h4 className={`text-lg md:text-xl font-black uppercase tracking-tight ${t.textHeading}`}>
                      {act.name}
                    </h4>

                    <p className={`text-xs md:text-sm leading-relaxed ${t.textMuted}`}>
                      {act.description}
                    </p>

                    {act.rules && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2 rounded-xl flex items-center gap-1.5 font-medium mt-1">
                        <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span><strong>Nota:</strong> {act.rules}</span>
                      </p>
                    )}
                  </div>

                  {/* Clean, High-Contrast ON/OFF Switch */}
                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 p-3 sm:p-0 bg-slate-100/70 sm:bg-transparent rounded-2xl">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {isActivityOn ? "Actividad Activada" : "No participar"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActivityOn}
                      onClick={() => handleToggleActivity(act, !isActivityOn)}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none cursor-pointer shadow-inner ${
                        isActivityOn 
                          ? isSpa 
                            ? "bg-purple-600 hover:bg-purple-700" 
                            : "bg-emerald-600 hover:bg-emerald-700" 
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span className="sr-only">Activar actividad</span>
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md flex items-center justify-center font-black text-[10px] ${
                          isActivityOn ? "translate-x-9 text-purple-700" : "translate-x-1 text-slate-400"
                        }`}
                      >
                        {isActivityOn ? "ON" : "OFF"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* WHEN ACTIVITY IS OFF */}
                {!isActivityOn && (
                  <div className="pt-3 text-center sm:text-left">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      El selector se encuentra en modo <strong>OFF</strong>. Si deseas participar o reservar tu sesión, cambia el interruptor a <strong>ON</strong>.
                    </p>
                  </div>
                )}

                {/* WHEN ACTIVITY IS ON & IS SPA */}
                {isActivityOn && isSpa && (
                  <div className="mt-5 space-y-5 animate-in fade-in duration-200">
                    
                    {/* CONFIRMED RESERVATION SUMMARY CARD */}
                    {currentReservation && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 rounded text-[10px] font-black uppercase tracking-wider">
                              Horario Confirmado en Google Sheets
                            </span>
                            <h5 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100 mt-0.5">
                              {currentReservation.dayLabel || "Día seleccionado"} • {currentReservation.slotTime}
                            </h5>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                              Participante: <strong>{currentReservation.personName} {currentReservation.paternalName}</strong> ({currentReservation.personType === "titular" ? "Titular" : "Acompañante"}) • Terapeuta: <strong>{currentReservation.therapistGender}</strong> {currentReservation.citaNo ? `(Cita #${currentReservation.citaNo})` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(act)}
                            disabled={bookingLoading[act.id]}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            Liberar Horario
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 1: DAY SELECTOR (Single selection only) */}
                    <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          1) Selecciona el día que deseas usar el SPA (Solo 1 día permitido):
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRefreshDaySlots(act)}
                          disabled={isLoadingSlots}
                          className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingSlots ? 'animate-spin' : ''}`} />
                          Actualizar Horarios
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {days.map(day => {
                          const isSelectedDay = activeDay.id === day.id;
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => {
                                setSelectedDayByActivity(prev => ({ ...prev, [act.id]: day.id }));
                                // Clear pending unconfirmed time when switching days
                                setSelectedTimeByActivity(prev => {
                                  const next = { ...prev };
                                  delete next[act.id];
                                  return next;
                                });
                                setSelectedSlotRowByActivity(prev => {
                                  const next = { ...prev };
                                  delete next[act.id];
                                  return next;
                                });
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                isSelectedDay
                                  ? "bg-purple-600 text-white border-purple-600 shadow-md"
                                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-purple-300"
                              }`}
                            >
                              <div>
                                <span className={`text-xs font-black block ${isSelectedDay ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                                  {day.label}
                                </span>
                                <span className={`text-[10px] block font-medium ${isSelectedDay ? "text-purple-100" : "text-slate-500 dark:text-slate-400"}`}>
                                  Pestaña: {day.googleSheetsTab}
                                </span>
                              </div>
                              {isSelectedDay && (
                                <span className="p-1 bg-white/20 rounded-full">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* STEP 2: GROUPED AVAILABLE TIMES FOR SELECTED DAY */}
                    <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          2) Horarios disponibles para {activeDay.label}:
                        </label>
                        <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300">
                          {isLoadingSlots ? "Consultando..." : `${availableSlots.length} citas libres`}
                        </span>
                      </div>

                      {isLoadingSlots ? (
                        <div className="py-6 text-center text-purple-700 dark:text-purple-300 font-semibold animate-pulse flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                          Consultando disponibilidad en Google Sheets ({activeDay.googleSheetsTab})...
                        </div>
                      ) : slotsError ? (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{slotsError}</span>
                        </div>
                      ) : availableTimeKeys.length === 0 ? (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>No hay horarios disponibles en esta fecha. Puedes seleccionar otro día arriba o pasar a lista de espera.</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {availableTimeKeys.map(timeKey => {
                              const slotsForTime = groupedSlotsByTime[timeKey];
                              const isSelectedTime = activeTime.includes(timeKey) || activeTime === timeKey || (activeRowIndex && slotsForTime.some(s => s.rowIndex === activeRowIndex));

                              return (
                                <button
                                  key={timeKey}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTimeByActivity(prev => ({ ...prev, [act.id]: timeKey }));
                                    // Auto-select first slot of this time
                                    if (slotsForTime.length > 0) {
                                      setSelectedSlotRowByActivity(prev => ({ ...prev, [act.id]: slotsForTime[0].rowIndex }));
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center ${
                                    isSelectedTime
                                      ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300"
                                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-purple-400"
                                  }`}
                                >
                                  <span className="text-xs font-black">{timeKey}</span>
                                  <span className={`text-[10px] mt-0.5 font-bold ${isSelectedTime ? "text-purple-100" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {slotsForTime.length} {slotsForTime.length === 1 ? "terapeuta" : "terapeutas"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Dynamic selector for therapist gender: only Dama or Caballero, dynamically hidden if unavailable */}
                          {(() => {
                            const matchingTimeKey = availableTimeKeys.find(tk => tk === activeTime || tk.startsWith(activeTime) || activeTime.startsWith(tk) || (activeRowIndex && groupedSlotsByTime[tk]?.some(s => s.rowIndex === activeRowIndex))) || (activeTime && groupedSlotsByTime[activeTime] ? activeTime : availableTimeKeys[0]);
                            const currentSlots = matchingTimeKey && groupedSlotsByTime[matchingTimeKey] ? groupedSlotsByTime[matchingTimeKey] : [];
                            
                            if (currentSlots.length === 0) return null;

                            const damaSlots = currentSlots.filter(s => normalizeTherapistGender(s.therapistGender) === "Dama");
                            const caballeroSlots = currentSlots.filter(s => normalizeTherapistGender(s.therapistGender) === "Caballero");
                            
                            const currentSelectedSlot = currentSlots.find(s => s.rowIndex === activeRowIndex) || currentSlots[0];
                            const currentGender = normalizeTherapistGender(currentSelectedSlot.therapistGender);

                            return (
                              <div className="pt-3 border-t border-purple-200/60 dark:border-purple-900/50 flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                                  Terapeuta disponible:
                                </span>
                                <div className="flex items-center gap-2">
                                  {damaSlots.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedSlotRowByActivity(prev => ({ ...prev, [act.id]: damaSlots[0].rowIndex }));
                                      }}
                                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
                                        currentGender === "Dama"
                                          ? "bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300 dark:ring-purple-800"
                                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-purple-400"
                                      }`}
                                    >
                                      <Sparkles className="w-3 h-3 text-purple-300" />
                                      Dama
                                    </button>
                                  )}

                                  {caballeroSlots.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedSlotRowByActivity(prev => ({ ...prev, [act.id]: caballeroSlots[0].rowIndex }));
                                      }}
                                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1.5 ${
                                        currentGender === "Caballero"
                                          ? "bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300 dark:ring-purple-800"
                                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-purple-400"
                                      }`}
                                    >
                                      <Sparkles className="w-3 h-3 text-purple-300" />
                                      Caballero
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* STEP 3: PARTICIPANT SELECTOR (Titular o Acompañante) */}
                    <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 rounded-2xl space-y-3">
                      <label className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        3) ¿Quién tomará el horario seleccionado?
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Option Titular */}
                        <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          activeParticipant === "titular"
                            ? "bg-white dark:bg-slate-800 border-purple-600 ring-2 ring-purple-400 shadow-xs"
                            : "bg-white/70 dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-purple-300"
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name={`participant-${act.id}`}
                              value="titular"
                              checked={activeParticipant === "titular"}
                              onChange={() => setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: "titular" }))}
                              className="accent-purple-600 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                {nombreTitular || "Titular"} {apellidosTitular}
                              </span>
                              <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold block">
                                Titular del registro
                              </span>
                            </div>
                          </div>
                          <User className="w-4 h-4 text-purple-500 shrink-0" />
                        </label>

                        {/* Option Companion */}
                        {hasCompanion && companionsList.map((comp, cIdx) => (
                          <label key={comp.id} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            activeParticipant === comp.id
                              ? "bg-white dark:bg-slate-800 border-purple-600 ring-2 ring-purple-400 shadow-xs"
                              : "bg-white/70 dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-purple-300"
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name={`participant-${act.id}`}
                                value={comp.id}
                                checked={activeParticipant === comp.id}
                                onChange={() => setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: comp.id }))}
                                className="accent-purple-600 w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                  {comp.firstName || `Acompañante ${cIdx + 1}`} {comp.lastName}
                                </span>
                                <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold block">
                                  Acompañante registrado
                                </span>
                              </div>
                            </div>
                            <User className="w-4 h-4 text-purple-500 shrink-0" />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* STEP 4: ACTION BUTTON "RESERVAR HORARIO" */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                        {activeTime ? (
                          <span>
                            Día: <strong>{activeDay.label}</strong> • Horario: <strong>{activeTime}</strong> • Participante: <strong>{activeParticipant === "titular" ? `${nombreTitular} ${apellidosTitular}` : companionsList.find(c => c.id === activeParticipant)?.firstName || "Acompañante"}</strong>
                          </span>
                        ) : (
                          <span>* Selecciona un horario arriba para habilitar la reserva.</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmReservation(act)}
                        disabled={bookingLoading[act.id] || !activeTime || !activeRowIndex}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs md:text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                          !activeTime || !activeRowIndex
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                            : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20 active:scale-98"
                        }`}
                      >
                        {bookingLoading[act.id] ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Guardando en Google Sheets...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Reservar horario</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Success message banner */}
                    {bookingSuccessMsg[act.id] && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-900 dark:text-emerald-100 font-bold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{bookingSuccessMsg[act.id]}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* WHEN ACTIVITY IS ON & IS NOT SPA (GOLF, TOURS, ETC.) */}
                {isActivityOn && !isSpa && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                      Participantes que asistirán a {act.name}:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Titular enrollment */}
                      <label className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isTitularActive}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedActivities(prev => [...prev, act.id]);
                              } else {
                                setSelectedActivities(prev => prev.filter(id => id !== act.id));
                              }
                            }}
                            className="w-4.5 h-4.5 accent-blue-600 cursor-pointer rounded"
                          />
                          <span className="text-xs font-bold">{nombreTitular || "Titular"} {apellidosTitular} (Titular)</span>
                        </div>
                        {isFull && <span className="text-[10px] font-black text-amber-500 uppercase">Espera</span>}
                      </label>

                      {/* Companion enrollment */}
                      {hasCompanion && companionsList.map((comp, idx) => {
                        const isCompActive = comp.selectedActivities?.includes(act.id);
                        return (
                          <label key={comp.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isCompActive}
                                onChange={e => {
                                  const updatedActs = e.target.checked
                                    ? [...(comp.selectedActivities || []), act.id]
                                    : (comp.selectedActivities || []).filter(id => id !== act.id);
                                  updateCompanionItem(comp.id, "selectedActivities", updatedActs);
                                }}
                                className="w-4.5 h-4.5 accent-blue-600 cursor-pointer rounded"
                              />
                              <span className="text-xs font-bold">{comp.firstName || `Acompañante ${idx + 1}`} {comp.lastName}</span>
                            </div>
                            {isFull && <span className="text-[10px] font-black text-amber-500 uppercase">Espera</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Buttons */}
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
