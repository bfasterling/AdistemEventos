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
  Users
} from "lucide-react";
import { Activity, ActivityReservationDetail, ActivityDayConfig, SpaReservationSlot } from "../types";
import { 
  fetchSpaSlotsFromSheet, 
  fetchPickleballSlotsFromSheet, 
  saveSpaReservationsToSheet, 
  savePickleballReservationsToSheet, 
  normalizeTherapistGender,
  cleanTimeFormat,
  canonicalizeTimeKey
} from "../utils/googleSheetsService";

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
  // Only show active activities in registration wizard (memoized to avoid new references on every render)
  const activitiesList: Activity[] = useMemo(() => {
    return (DataStore.getActivities ? DataStore.getActivities() : []).filter((act: Activity) => act.isActive !== false);
  }, [DataStore]);

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

  // Golf specific states:
  // { [activityId]: boolean } - true = lleva sus propios bastones (Sí), false = no lleva bastones propios (No)
  const [golfOwnClubsByActivity, setGolfOwnClubsByActivity] = useState<Record<string, boolean>>({});
  // { [activityId]: 'Derecho' | 'Zurdo' }
  const [golfHandByActivity, setGolfHandByActivity] = useState<Record<string, 'Derecho' | 'Zurdo'>>({});
  // { [activityId]: 'Regular' | 'Stiff' }
  const [golfShaftByActivity, setGolfShaftByActivity] = useState<Record<string, 'Regular' | 'Stiff'>>({});

  const isSpecialActivity = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    return type === "SPA" || type === "PICKLEBALL" || type === "BINGO" || type === "GOLF";
  };

  const isPickleballActivity = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    return type === "PICKLEBALL" || type === "BINGO" || type === "GOLF";
  };

  const isGolfActivity = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    return type === "GOLF";
  };

  const getActivityTypeName = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    if (type === "GOLF") return "Golf";
    if (type === "BINGO") return "Bingo";
    if (type === "PICKLEBALL") return "Pickleball";
    if (type === "SPA") return "Spa";
    return act.name || "Actividad";
  };

  // Initialize day and participant for activities
  useEffect(() => {
    activitiesList.forEach(act => {
      if (isSpecialActivity(act)) {
        const days = act.daysConfig && act.daysConfig.length > 0 
          ? act.daysConfig 
          : [{ id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }];

        // Check if user already has a reservation for this activity
        const existingRes = activityReservations.find(r => r.activityId === act.id);

        if (existingRes && existingRes.dayId) {
          setSelectedDayByActivity(prev => {
            if (prev[act.id] === existingRes.dayId) return prev;
            return { ...prev, [act.id]: existingRes.dayId! };
          });
          setSelectedParticipantByActivity(prev => {
            if (prev[act.id] === existingRes.personId) return prev;
            return { ...prev, [act.id]: existingRes.personId };
          });
          if (existingRes.golfOwnClubs !== undefined) {
            setGolfOwnClubsByActivity(prev => {
              if (prev[act.id] === existingRes.golfOwnClubs) return prev;
              return { ...prev, [act.id]: existingRes.golfOwnClubs! };
            });
          }
          if (existingRes.golfHand) {
            setGolfHandByActivity(prev => {
              if (prev[act.id] === existingRes.golfHand) return prev;
              return { ...prev, [act.id]: existingRes.golfHand! };
            });
          }
          if (existingRes.golfShaft) {
            setGolfShaftByActivity(prev => {
              if (prev[act.id] === existingRes.golfShaft) return prev;
              return { ...prev, [act.id]: existingRes.golfShaft! };
            });
          }
        } else if (days.length > 0) {
          setSelectedDayByActivity(prev => {
            if (prev[act.id]) return prev;
            return { ...prev, [act.id]: days[0].id };
          });
          setSelectedParticipantByActivity(prev => {
            if (prev[act.id]) return prev;
            return { ...prev, [act.id]: "titular" };
          });
        }
      }
    });
  }, [activitiesList, activityReservations]);

  // Reset unconfirmed special activities when mounting step 5 if they were not saved
  useEffect(() => {
    activitiesList.forEach(act => {
      if (isSpecialActivity(act)) {
        const hasSavedRes = activityReservations.some(r => r.activityId === act.id);
        if (!hasSavedRes) {
          // If no reservation was saved for this activity, reset all pending fields
          setSelectedActivities(prev => prev.filter(id => id !== act.id));
          if (hasCompanion) {
            companionsList.forEach(comp => {
              if (comp.selectedActivities?.includes(act.id)) {
                updateCompanionItem(comp.id, "selectedActivities", (comp.selectedActivities || []).filter(id => id !== act.id));
              }
            });
          }
          setSelectedTimeByActivity(prev => {
            if (!prev[act.id]) return prev;
            const next = { ...prev };
            delete next[act.id];
            return next;
          });
          setSelectedSlotRowByActivity(prev => {
            if (!prev[act.id]) return prev;
            const next = { ...prev };
            delete next[act.id];
            return next;
          });
          setSelectedParticipantByActivity(prev => {
            if (prev[act.id] === "titular") return prev;
            return { ...prev, [act.id]: "titular" };
          });
          const days = act.daysConfig && act.daysConfig.length > 0 
            ? act.daysConfig 
            : [{ id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }];
          if (days.length > 0) {
            setSelectedDayByActivity(prev => {
              if (prev[act.id] === days[0].id) return prev;
              return { ...prev, [act.id]: days[0].id };
            });
          }
        }
      }
    });
  }, []);

  // Fetch slots whenever the active day for a special activity changes
  useEffect(() => {
    activitiesList.forEach(act => {
      if (!isSpecialActivity(act) || !act.googleSheetsUrl) return;

      const days = act.daysConfig && act.daysConfig.length > 0 
        ? act.daysConfig 
        : [{ id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }];

      const activeDayId = selectedDayByActivity[act.id] || days[0]?.id;
      const activeDay = days.find(d => d.id === activeDayId) || days[0];
      const targetTab = activeDay?.googleSheetsTab || act.googleSheetsTab || "Viernes";
      const cacheKey = `${act.id}_${targetTab}`;

      setSlotsCache(prev => {
        if (prev[cacheKey]) return prev; // Already cached or fetching

        const fetchFn = isPickleballActivity(act) ? fetchPickleballSlotsFromSheet : fetchSpaSlotsFromSheet;
        fetchFn(act.googleSheetsUrl, targetTab, act.googleSheetsWebhookUrl, act.activityType || "PICKLEBALL")
          .then(res => {
            setSlotsCache(current => ({
              ...current,
              [cacheKey]: {
                loading: false,
                slots: res.slots || [],
                error: res.error
              }
            }));
          })
          .catch(err => {
            setSlotsCache(current => ({
              ...current,
              [cacheKey]: {
                loading: false,
                slots: [],
                error: err?.message || "Error al conectar con la pestaña del Sheets."
              }
            }));
          });

        return {
          ...prev,
          [cacheKey]: { loading: true, slots: [] }
        };
      });
    });
  }, [activitiesList, selectedDayByActivity]);

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

    const fetchFn = isPickleballActivity(act) ? fetchPickleballSlotsFromSheet : fetchSpaSlotsFromSheet;
    fetchFn(act.googleSheetsUrl, targetTab, act.googleSheetsWebhookUrl, act.activityType || "PICKLEBALL")
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

  // Helper to extract clean time and duration for slots
  const extractTimeAndDuration = (slot?: SpaReservationSlot, rawTimeStr?: string) => {
    let raw = (slot?.rawTime || slot?.timeSlot || rawTimeStr || "").trim();
    let cleaned = cleanTimeFormat(raw, slot?.duration);
    let time = cleaned;
    let duration = (slot?.duration || "").trim();

    if (cleaned.includes("(") && cleaned.includes(")")) {
      const match = cleaned.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        time = match[1].trim();
        if (!duration || duration === "60 min") {
          duration = match[2].trim();
        }
      }
    }

    if (!duration) {
      duration = "60 min";
    }

    return { time, duration };
  };

  // Toggle activity ON or OFF
  const handleToggleActivity = async (act: Activity, newState: boolean) => {
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

      // If user had a reservation in Google Sheets, trigger release and clear Firestore
      const existingReservations = activityReservations.filter(r => r.activityId === act.id);
      if (existingReservations.length > 0) {
        try {
          await saveSpaReservationsToSheet(
            act,
            [],
            {
              previousReservations: existingReservations,
              clearedRowIndices: existingReservations.map(r => r.rowIndex).filter(Boolean) as number[],
              sheetTab: existingReservations[0]?.sheetTab || act.googleSheetsTab || "Viernes",
              titularEmail: (correoTitular || "").trim()
            }
          );
        } catch (err) {
          console.warn("[SPA Release] Error releasing sheet reservation:", err);
        }
      }

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
    }
  };

  // Execute "Guardar Actividad" button action
  const handleConfirmReservation = async (act: Activity) => {
    const isPickle = isPickleballActivity(act);
    const actLabel = getActivityTypeName(act);
    const activeDay = getActiveDay(act);
    const dayTab = activeDay?.googleSheetsTab || act.googleSheetsTab || "Viernes";
    const selectedTime = selectedTimeByActivity[act.id];
    const selectedRowIndex = selectedSlotRowByActivity[act.id];
    const participantId = selectedParticipantByActivity[act.id] || "titular";
    const { slots } = getCurrentDaySlots(act);

    let chosenSlot: SpaReservationSlot | undefined;
    const userEmailNorm = (correoTitular || "").trim().toUpperCase();
    const existingRes = activityReservations.find(r => r.activityId === act.id && (r.personId === participantId || (!r.personId && participantId === "titular")));

    if (isPickle) {
      // 1. Si el usuario ya tenía un lugar reservado en este día/pestaña, reutilizar su renglón exacto para actualizarlo en su lugar
      if (existingRes && existingRes.rowIndex && existingRes.rowIndex >= 9 && (existingRes.dayId === activeDay.id || existingRes.sheetTab === dayTab)) {
        const matchingSlot = slots.find(s => s.rowIndex === existingRes.rowIndex);
        chosenSlot = matchingSlot || {
          rowIndex: existingRes.rowIndex,
          citaNo: existingRes.citaNo || String(existingRes.rowIndex - 8),
          timeSlot: act.eventDay || actLabel,
          rawTime: actLabel,
          duration: "",
          therapistGender: "",
          isBlocked: false,
          isOccupied: true
        };
      } else {
        // 2. Verificar si en las celdas ya existe un registro con el correo del titular en este día
        const slotByEmail = userEmailNorm ? slots.find(s => s.titularEmail && s.titularEmail.trim().toUpperCase() === userEmailNorm) : undefined;
        if (slotByEmail) {
          chosenSlot = slotByEmail;
        } else {
          // 3. Nueva reservación: buscar el primer lugar verdaderamente libre (a partir de la fila 9)
          chosenSlot = slots.find(s => !s.isBlocked && !s.isOccupied);
        }
      }

      if (!chosenSlot && slots.length === 0) {
        // Fallback default slot si aún no cargan los slots del sheet
        chosenSlot = {
          rowIndex: existingRes?.rowIndex || 9,
          citaNo: existingRes?.citaNo || "1",
          timeSlot: act.eventDay || actLabel,
          rawTime: actLabel,
          duration: "",
          therapistGender: "Dama",
          isBlocked: false,
          isOccupied: false
        };
      } else if (!chosenSlot) {
        alert(`Lo sentimos, no hay lugares disponibles en este momento para ${actLabel}. El cupo se encuentra lleno.`);
        return;
      }
    } else {
      if (!selectedTime || !selectedRowIndex) {
        alert("Por favor selecciona primero un horario disponible.");
        return;
      }

      chosenSlot = slots.find(s => s.rowIndex === selectedRowIndex);
      if (!chosenSlot) {
        alert("El horario seleccionado ya no está disponible. Por favor elige otro.");
        return;
      }
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

    const isGolf = isGolfActivity(act);
    const ownClubs = golfOwnClubsByActivity[act.id] ?? false;
    const hand = golfHandByActivity[act.id] || "Derecho";
    const shaft = golfShaftByActivity[act.id] || "Regular";

    const newReservation: ActivityReservationDetail = {
      activityId: act.id,
      activityName: act.name || (isPickle ? actLabel : "Sesión de Spa"),
      personType,
      personId: participantId,
      personName,
      paternalName: paternal,
      maternalName: maternal,
      titularEmail: (correoTitular || "").trim().toUpperCase(),
      slotTime: isPickle ? (activeDay.label || act.eventDay || "Lugar Asignado") : chosenSlot.timeSlot,
      therapistGender: isPickle ? undefined : chosenSlot.therapistGender,
      rowIndex: chosenSlot.rowIndex,
      citaNo: chosenSlot.citaNo,
      dayId: activeDay.id,
      dayDate: activeDay.date,
      dayLabel: activeDay.label,
      sheetTab: dayTab,
      golfOwnClubs: isGolf ? ownClubs : undefined,
      golfHand: isGolf && !ownClubs ? hand : undefined,
      golfShaft: isGolf && !ownClubs ? shaft : undefined
    };

    setBookingLoading(prev => ({ ...prev, [act.id]: true }));
    setBookingSuccessMsg(prev => ({ ...prev, [act.id]: "" }));

    try {
      // Find any previous reservation for this activity
      const previousReservations = activityReservations.filter(r => r.activityId === act.id);

      // Save to Google Sheets via Webhook & Backend API
      const saveFn = isPickle ? savePickleballReservationsToSheet : saveSpaReservationsToSheet;
      const sheetRes = await saveFn(
        act,
        [newReservation],
        {
          previousReservations,
          sheetTab: dayTab,
          titularEmail: (correoTitular || "").trim().toUpperCase()
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
        [act.id]: isPickle
          ? `¡Lugar de ${actLabel} reservado y guardado con éxito para ${personName}!`
          : `¡Horario reservado con éxito para ${personName} el ${activeDay.label} a las ${chosenSlot.timeSlot}!`
      }));

      // Refresh slots for this day to reflect the newly occupied slot
      handleRefreshDaySlots(act);
    } catch (err: any) {
      alert(`Error al guardar la reserva: ${err?.message || "Ocurrió un problema de conexión."}`);
    } finally {
      setBookingLoading(prev => ({ ...prev, [act.id]: false }));
    }
  };

  // Helper to cancel or release reservation (does exactly the same as toggling OFF)
  const handleCancelReservation = async (act: Activity) => {
    setBookingLoading(prev => ({ ...prev, [act.id]: true }));
    try {
      await handleToggleActivity(act, false);
    } catch (err: any) {
      console.error("Error al liberar horario:", err);
    } finally {
      setBookingLoading(prev => ({ ...prev, [act.id]: false }));
    }
  };

  const handleNextWithValidation = () => {
    // Validate if any special activity (SPA, Pickleball) is ON but missing slot reservation
    const unreservedSpecialActs: string[] = [];
    activitiesList.forEach(act => {
      const isSpecial = isSpecialActivity(act);
      const isSelected = selectedActivities.includes(act.id) || (hasCompanion && companionsList.some(c => c.selectedActivities?.includes(act.id)));
      if (isSpecial && isSelected) {
        const hasRes = activityReservations.some(r => r.activityId === act.id);
        if (!hasRes) {
          unreservedSpecialActs.push(act.name);
        }
      }
    });

    if (unreservedSpecialActs.length > 0) {
      if (!confirm(`Tienes seleccionada la actividad "${unreservedSpecialActs.join(", ")}" pero aún no has dado clic en "Guardar Actividad". ¿Deseas continuar?`)) {
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
          Paso 5: Registro de Actividades
        </h3>
        <p className={`text-xs md:text-sm mt-1 font-medium ${t.textMuted}`}>
          Selecciona las actividades recreativas del evento. En actividades como SPA, Pickleball y Bingo, activa el selector para elegir el día, consultar los lugares u horarios disponibles en vivo y reservar tu espacio.
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
            const isPickle = isPickleballActivity(act);
            const isSpecialSheet = isSpa || isPickle;

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

            // Group available slots by clean canonical Time (e.g. "09:00 AM" -> [slot1, slot2])
            const groupedSlotsByTime = availableSlots.reduce((acc, slot) => {
              const rawTimeVal = slot.timeSlot || slot.rawTime || `Cita ${slot.citaNo}`;
              const timeKey = canonicalizeTimeKey(rawTimeVal) || rawTimeVal.trim();
              if (!timeKey) return acc;
              if (!acc[timeKey]) {
                acc[timeKey] = [];
              }
              acc[timeKey].push(slot);
              return acc;
            }, {} as Record<string, SpaReservationSlot[]>);

            const availableTimeKeys = Object.keys(groupedSlotsByTime).sort((a, b) => {
              const parseToMins = (t: string) => {
                const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                if (!m) return 0;
                let h = parseInt(m[1], 10);
                const min = parseInt(m[2], 10);
                const p = (m[3] || "AM").toUpperCase();
                if (p === "PM" && h < 12) h += 12;
                if (p === "AM" && h === 12) h = 0;
                return h * 60 + min;
              };
              return parseToMins(a) - parseToMins(b);
            });

            const rawActiveTime = selectedTimeByActivity[act.id] || (currentReservation ? `${currentReservation.slotTime}` : "");
            const activeTime = canonicalizeTimeKey(rawActiveTime);
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
                      ? "bg-slate-900/90 border-emerald-800/80 shadow-lg shadow-emerald-950/20" 
                      : "bg-slate-900/50 border-slate-800/80" 
                    : isActivityOn 
                      ? "bg-white border-emerald-300 shadow-md ring-1 ring-emerald-100" 
                      : "bg-slate-50/60 border-slate-200/90 hover:bg-white"
                }`}
              >
                {/* Header & Switch */}
                <div className="space-y-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                  {!isSpa && !isPickle && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                        actType === "GOLF" || act.category === "golf"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" 
                          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {actType}
                      </span>

                      {act.eventDay && (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {act.eventDay}
                        </span>
                      )}

                      {act.timeRange && (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {act.timeRange}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
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

                  {/* Switch and Question aligned to the left near the description */}
                  <div className="pt-1 flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                      ¿Desea participar?
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActivityOn}
                      onClick={() => handleToggleActivity(act, !isActivityOn)}
                      className={`relative inline-flex h-8 w-16 p-1 items-center rounded-full transition-colors focus:outline-none cursor-pointer shadow-inner ${
                        isActivityOn 
                          ? "bg-emerald-600 hover:bg-emerald-700" 
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span className="sr-only">¿Desea participar?</span>
                      <span
                        className={`h-6 w-7 rounded-full bg-white shadow-md flex items-center justify-center font-black text-[10px] tracking-tight uppercase select-none transition-transform ${
                          isActivityOn ? "translate-x-7 text-emerald-700 font-extrabold" : "translate-x-0 text-slate-500"
                        }`}
                      >
                        {isActivityOn ? "SI" : "NO"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* WHEN ACTIVITY IS OFF */}
                {!isActivityOn && (
                  <div className="pt-3 text-left">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      El selector se encuentra en modo <strong>NO</strong>. Si deseas participar o reservar tu sesión, cambia el interruptor a <strong>SI</strong>.
                    </p>
                  </div>
                )}

                {/* WHEN ACTIVITY IS ON & IS SPECIAL SHEET ACTIVITY (SPA OR PICKLEBALL) */}
                {isActivityOn && isSpecialSheet && (
                  <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                    
                    {/* CONFIRMED RESERVATION SUMMARY CARD */}
                    {currentReservation && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 rounded text-[10px] font-black uppercase tracking-wider">
                              {isPickle ? "LUGAR CONFIRMADO" : "HORARIO CONFIRMADO"}
                            </span>
                            <h5 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100 mt-0.5">
                              {isPickle 
                                ? (currentReservation.dayLabel || act.name || getActivityTypeName(act)) 
                                : `${currentReservation.dayLabel || "Día seleccionado"} • ${currentReservation.slotTime}`}
                            </h5>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                              Participante: <strong>{`${(currentReservation.personName || "").toUpperCase()} ${(currentReservation.paternalName || "").toUpperCase()}`.trim()}</strong> ({currentReservation.personType === "titular" ? "Titular" : "Acompañante"})
                              {currentReservation.therapistGender ? ` • Terapeuta: ${currentReservation.therapistGender}` : ''}
                              {isGolfActivity(act) && (
                                currentReservation.golfOwnClubs 
                                  ? " • Bastones: Propios" 
                                  : ` • Bastones: Préstamo (${currentReservation.golfHand || 'Derecho'}, Varilla ${currentReservation.golfShaft || 'Regular'})`
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1: SELECCIÓN DE PARTICIPANTE */}
                    <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 rounded-2xl space-y-2.5">
                      <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        1) {isPickle ? `¿Quién participará en ${getActivityTypeName(act)}?` : "¿Quién tomará el spa?"}
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Option Titular */}
                        <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          activeParticipant === "titular"
                            ? "bg-white dark:bg-slate-800 border-emerald-600 ring-2 ring-emerald-400 shadow-xs"
                            : "bg-white/70 dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name={`participant-${act.id}`}
                              value="titular"
                              checked={activeParticipant === "titular"}
                              onChange={() => setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: "titular" }))}
                              className="accent-emerald-600 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                {`${(nombreTitular || "TITULAR").toUpperCase()} ${(apellidosTitular || "").toUpperCase()}`.trim()}
                              </span>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">
                                TITULAR
                              </span>
                            </div>
                          </div>
                          <User className="w-4 h-4 text-emerald-600 shrink-0" />
                        </label>

                        {/* Option Companion */}
                        {hasCompanion && companionsList.map((comp, cIdx) => (
                          <label key={comp.id} className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            activeParticipant === comp.id
                              ? "bg-white dark:bg-slate-800 border-emerald-600 ring-2 ring-emerald-400 shadow-xs"
                              : "bg-white/70 dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name={`participant-${act.id}`}
                                value={comp.id}
                                checked={activeParticipant === comp.id}
                                onChange={() => setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: comp.id }))}
                                className="accent-emerald-600 w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                  {`${(comp.firstName || `ACOMPAÑANTE ${cIdx + 1}`).toUpperCase()} ${(comp.lastName || "").toUpperCase()}`.trim()}
                                </span>
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">
                                  ACOMPAÑANTE
                                </span>
                              </div>
                            </div>
                            <User className="w-4 h-4 text-emerald-600 shrink-0" />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 2: SELECCIÓN DE DÍA (Sólo visible si hay más de 1 fecha disponible) */}
                    {days.length > 1 && (
                      <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            2) Elige la fecha en la que deseas reservar:
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRefreshDaySlots(act)}
                            disabled={isLoadingSlots}
                            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingSlots ? 'animate-spin' : ''}`} />
                            Actualizar Disponibilidad
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {days.map(day => {
                            const isSelectedDay = activeDay.id === day.id;
                            return (
                              <button
                                key={day.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDayByActivity(prev => ({ ...prev, [act.id]: day.id }));
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
                                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  isSelectedDay
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-400"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                                }`}
                              >
                                <span className="text-xs font-black">
                                  {day.label}
                                </span>
                                {isSelectedDay && (
                                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3: PREGUNTAS CONDICIONALES DE GOLF */}
                    {isGolfActivity(act) && (
                      <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl space-y-3.5">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              {days.length > 1 ? "3) Equipamiento de Golf: ¿Llevas tus bastones propios?" : "2) Equipamiento de Golf: ¿Llevas tus bastones propios?"}
                            </label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Indica si llevarás tu propio set o si requieres bastones de préstamo.
                            </p>
                          </div>

                          {/* Switch Sí / No */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={golfOwnClubsByActivity[act.id] ?? false}
                            onClick={() => {
                              const currentVal = golfOwnClubsByActivity[act.id] ?? false;
                              setGolfOwnClubsByActivity(prev => ({ ...prev, [act.id]: !currentVal }));
                            }}
                            className={`relative inline-flex h-8 w-16 p-1 items-center rounded-full transition-colors focus:outline-none cursor-pointer shadow-inner ${
                              (golfOwnClubsByActivity[act.id] ?? false)
                                ? "bg-emerald-600 hover:bg-emerald-700" 
                                : "bg-slate-300 dark:bg-slate-700"
                            }`}
                          >
                            <span className="sr-only">¿Llevas tus bastones propios?</span>
                            <span
                              className={`h-6 w-7 rounded-full bg-white shadow-md flex items-center justify-center font-black text-[10px] tracking-tight uppercase select-none transition-transform ${
                                (golfOwnClubsByActivity[act.id] ?? false) ? "translate-x-7 text-emerald-700 font-extrabold" : "translate-x-0 text-slate-500"
                              }`}
                            >
                              {(golfOwnClubsByActivity[act.id] ?? false) ? "SI" : "NO"}
                            </span>
                          </button>
                        </div>

                        {/* Si NO lleva bastones propios -> Preguntar Zurdo/Derecho y Tipo de Varilla */}
                        {!(golfOwnClubsByActivity[act.id] ?? false) ? (
                          <div className="pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/50 space-y-3 animate-in fade-in duration-150">
                            <span className="text-[11px] font-extrabold text-emerald-900 dark:text-emerald-300 block uppercase tracking-wide">
                              Especificaciones para préstamo de bastones:
                            </span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* 1: Zurdo o Derecho */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                  ¿Zurdo o Derecho?
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {(['Derecho', 'Zurdo'] as const).map((handOption) => {
                                    const currentHand = golfHandByActivity[act.id] || "Derecho";
                                    const isSelected = currentHand === handOption;
                                    return (
                                      <button
                                        key={handOption}
                                        type="button"
                                        onClick={() => setGolfHandByActivity(prev => ({ ...prev, [act.id]: handOption }))}
                                        className={`py-2 px-3 rounded-xl border text-xs font-black transition cursor-pointer text-center ${
                                          isSelected
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-800"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-400"
                                        }`}
                                      >
                                        {handOption}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* 2: Tipo de Varilla */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                  Tipo de varilla:
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {(['Regular', 'Stiff'] as const).map((shaftOption) => {
                                    const currentShaft = golfShaftByActivity[act.id] || "Regular";
                                    const isSelected = currentShaft === shaftOption;
                                    return (
                                      <button
                                        key={shaftOption}
                                        type="button"
                                        onClick={() => setGolfShaftByActivity(prev => ({ ...prev, [act.id]: shaftOption }))}
                                        className={`py-2 px-3 rounded-xl border text-xs font-black transition cursor-pointer text-center ${
                                          isSelected
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-800"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-400"
                                        }`}
                                      >
                                        {shaftOption}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Llevarás tu propio set de bastones de golf. No se requiere préstamo de equipo.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4: SELECCIÓN DE HORARIOS (SPA) O ESTADO DE DISPONIBILIDAD (PICKLEBALL / BINGO / GOLF) */}
                    {!isPickle ? (
                      /* SPA: Horarios y Terapeutas */
                      <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            {days.length > 1 ? `3) Horarios disponibles para ${activeDay.label}:` : `2) Horarios disponibles:`}
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRefreshDaySlots(act)}
                            disabled={isLoadingSlots}
                            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingSlots ? 'animate-spin' : ''}`} />
                            Actualizar Horarios
                          </button>
                        </div>

                        {isLoadingSlots ? (
                          <div className="py-5 text-center text-emerald-700 dark:text-emerald-300 font-semibold animate-pulse flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                            Consultando disponibilidad en Google Sheets ({activeDay.googleSheetsTab})...
                          </div>
                        ) : slotsError ? (
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{slotsError}</span>
                          </div>
                        ) : availableTimeKeys.length === 0 ? (
                          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>No hay horarios disponibles en esta fecha. Puedes seleccionar otro día arriba o pasar a lista de espera.</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Compact time slots grid - only time */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {availableTimeKeys.map(timeKey => {
                                const slotsForTime = groupedSlotsByTime[timeKey];
                                const displayTime = timeKey;
                                const isSelectedTime = (activeTime && (activeTime === timeKey || activeTime.includes(timeKey) || timeKey.includes(activeTime))) || (activeRowIndex && slotsForTime.some(s => s.rowIndex === activeRowIndex));

                                return (
                                  <button
                                    key={timeKey}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTimeByActivity(prev => ({ ...prev, [act.id]: timeKey }));
                                      if (slotsForTime.length > 0) {
                                        // Pick current active slot if inside this group, otherwise pick first available slot
                                        const matchingSlot = slotsForTime.find(s => s.rowIndex === activeRowIndex) || slotsForTime[0];
                                        setSelectedSlotRowByActivity(prev => ({ ...prev, [act.id]: matchingSlot.rowIndex }));
                                      }
                                    }}
                                    className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center ${
                                      isSelectedTime
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-700"
                                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                                    }`}
                                  >
                                    <span className="text-xs font-black tracking-tight leading-tight">{displayTime}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Dynamic compact selector for therapist gender */}
                            {(() => {
                              const matchingTimeKey = availableTimeKeys.find(tk => tk === activeTime || tk.startsWith(activeTime) || activeTime.startsWith(tk) || (activeRowIndex && groupedSlotsByTime[tk]?.some(s => s.rowIndex === activeRowIndex))) || (activeTime && groupedSlotsByTime[activeTime] ? activeTime : availableTimeKeys[0]);
                              const currentSlots = matchingTimeKey && groupedSlotsByTime[matchingTimeKey] ? groupedSlotsByTime[matchingTimeKey] : [];
                              
                              if (currentSlots.length === 0) return null;

                              const damaSlots = currentSlots.filter(s => normalizeTherapistGender(s.therapistGender) === "Dama");
                              const caballeroSlots = currentSlots.filter(s => normalizeTherapistGender(s.therapistGender) === "Caballero");
                              
                              if (damaSlots.length === 0 && caballeroSlots.length === 0) {
                                return null;
                              }

                              const currentSelectedSlot = currentSlots.find(s => s.rowIndex === activeRowIndex) || currentSlots[0];
                              const currentGender = normalizeTherapistGender(currentSelectedSlot.therapistGender);

                              return (
                                <div className="pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/50 flex items-center gap-3 flex-wrap">
                                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
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
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-800"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-400"
                                        }`}
                                      >
                                        <Sparkles className="w-3 h-3 text-emerald-200" />
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
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300 dark:ring-emerald-800"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-400"
                                        }`}
                                      >
                                        <Sparkles className="w-3 h-3 text-emerald-200" />
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
                    ) : (
                      /* PICKLEBALL / BINGO: Disponibilidad de cupos en vivo */
                      (() => {
                        const actTypeName = getActivityTypeName(act);
                        const availablePickleSlots = daySlots.filter(s => !s.isBlocked && !s.isOccupied).length;
                        const hasPicklePlaces = daySlots.length === 0 || availablePickleSlots > 0;

                        if (isLoadingSlots) {
                          return (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-pulse">
                              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                              Consultando disponibilidad de lugares de {actTypeName} en tiempo real ({activeDay.googleSheetsTab})...
                            </div>
                          );
                        }

                        if (slotsError) {
                          return (
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>{slotsError}</span>
                            </div>
                          );
                        }

                        if (!hasPicklePlaces && daySlots.length > 0) {
                          return (
                            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 font-medium">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Lo sentimos, no hay lugares disponibles en este momento. El cupo de {actTypeName} se encuentra lleno.</span>
                            </div>
                          );
                        }

                        return (
                          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs font-medium text-emerald-900 dark:text-emerald-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>
                                {daySlots.length > 0 ? (
                                  <>Lugares disponibles: <strong className="font-black text-emerald-800 dark:text-emerald-300">{availablePickleSlots}</strong></>
                                ) : (
                                  <>Lugares disponibles para registro.</>
                                )}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRefreshDaySlots(act)}
                              disabled={isLoadingSlots}
                              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className={`w-3 h-3 ${isLoadingSlots ? 'animate-spin' : ''}`} />
                              Verificar disponibilidad
                            </button>
                          </div>
                        );
                      })()
                    )}

                    {/* ACTION BUTTON "GUARDAR ACTIVIDAD" */}
                    {(() => {
                      const availablePickleSlots = daySlots.filter(s => !s.isBlocked && !s.isOccupied).length;
                      const hasPicklePlaces = daySlots.length === 0 || availablePickleSlots > 0;
                      const isPickleDisabled = bookingLoading[act.id] || isLoadingSlots || (!hasPicklePlaces && daySlots.length > 0);
                      const isSpaDisabled = bookingLoading[act.id] || !activeTime || !activeRowIndex;
                      const isDisabled = isPickle ? isPickleDisabled : isSpaDisabled;

                      // Only show button for Pickleball if there are available places
                      if (isPickle && !hasPicklePlaces && daySlots.length > 0) {
                        return null;
                      }

                      return (
                        <div className="pt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleConfirmReservation(act)}
                            disabled={isDisabled}
                            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs md:text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                              isDisabled
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-98"
                            }`}
                          >
                            {bookingLoading[act.id] ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Guardando...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Guardar Actividad</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Success message banner */}
                    {bookingSuccessMsg[act.id] && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-900 dark:text-emerald-100 font-bold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{bookingSuccessMsg[act.id]}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* WHEN ACTIVITY IS ON & IS NOT SPECIAL SHEET ACTIVITY (GOLF, TOURS, ETC.) */}
                {isActivityOn && !isSpecialSheet && (
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
