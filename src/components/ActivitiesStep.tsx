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
  minors?: Array<{
    name: string;
    lastName: string;
    age: number;
    sex?: string;
    allergies?: string;
    tipo?: 'adult' | 'minor';
    parentezco?: string;
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

const MONTH_NORM: Record<string, string> = {
  ene: "Ene",
  enero: "Ene",
  jan: "Ene",
  january: "Ene",
  feb: "Feb",
  febrero: "Feb",
  february: "Feb",
  mar: "Mar",
  marzo: "Mar",
  march: "Mar",
  abr: "Abr",
  abril: "Abr",
  apr: "Abr",
  april: "Abr",
  may: "May",
  mayo: "May",
  jun: "Jun",
  junio: "Jun",
  june: "Jun",
  jul: "Jul",
  julio: "Jul",
  july: "Jul",
  ago: "Ago",
  agosto: "Ago",
  aug: "Ago",
  august: "Ago",
  sep: "Sep",
  sept: "Sep",
  septiembre: "Sep",
  september: "Sep",
  oct: "Oct",
  octubre: "Oct",
  october: "Oct",
  nov: "Nov",
  noviembre: "Nov",
  november: "Nov",
  dic: "Dic",
  diciembre: "Dic",
  dec: "Dic",
  december: "Dic"
};

const standardizeDateString = (rawStr?: string): string => {
  if (!rawStr) return "";
  let text = String(rawStr).trim();
  if (!text) return "";

  // 1. Convert ISO dates like 2026-11-08 to "8 Nov"
  text = text.replace(/\b(\d{4})-(\d{2})-(\d{2})(?:T.*)?\b/g, (_match, _y, m, d) => {
    const monthIndex = parseInt(m, 10);
    const dayNum = parseInt(d, 10);
    const monthNames = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthAbbr = monthNames[monthIndex] || m;
    return `${dayNum} ${monthAbbr}`;
  });

  // 2. Month-first patterns like "Nov 8", "Noviembre 8", "Nov. 8", "Nov 08", "Nov 8th", "Nov, 8", "Nov 8, 2026" -> "8 Nov"
  const monthFirstRegex = /\b(Ene(?:ro)?|Feb(?:rero)?|Mar(?:zo)?|Abr(?:il)?|May(?:o)?|Jun(?:io)?|Jul(?:io)?|Ago(?:sto)?|Sep(?:t|tiembre)?|Oct(?:ubre)?|Nov(?:iembre)?|Dic(?:iembre)?|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.,]?\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?\b/gi;
  text = text.replace(monthFirstRegex, (_match, mStr, dStr) => {
    const normM = MONTH_NORM[mStr.toLowerCase()] || mStr;
    const dayNum = parseInt(dStr, 10);
    return `${dayNum} ${normM}`;
  });

  // 3. Day-first patterns like "08 Nov", "8 de Noviembre", "8 de Nov", "8 Noviembre", "8th Nov" -> "8 Nov"
  const dayFirstRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:de\s+)?(Ene(?:ro)?|Feb(?:rero)?|Mar(?:zo)?|Abr(?:il)?|May(?:o)?|Jun(?:io)?|Jul(?:io)?|Ago(?:sto)?|Sep(?:t|tiembre)?|Oct(?:ubre)?|Nov(?:iembre)?|Dic(?:iembre)?|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.,]?(?:\s*,\s*\d{4}|\s+\d{4})?\b/gi;
  text = text.replace(dayFirstRegex, (_match, dStr, mStr) => {
    const normM = MONTH_NORM[mStr.toLowerCase()] || mStr;
    const dayNum = parseInt(dStr, 10);
    return `${dayNum} ${normM}`;
  });

  return text.trim();
};

const cleanRepeatedDateText = (str?: string): string => {
  if (!str) return "";
  let trimmed = standardizeDateString(str);
  if (!trimmed) return "";

  // Split on dash/hyphen/slash/al/a separators (including multiple dashes like -- or ---)
  const sepRegex = /\s*(?:[—–-]|\bal\b|\ba\b|\/)\s*/i;
  const parts = trimmed.split(sepRegex).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const normParts = parts.map(p => standardizeDateString(p).toLowerCase().replace(/\s+/g, " "));
    const allSame = normParts.every(p => p === normParts[0]);
    if (allSame) {
      return parts[0];
    }
  }

  // Check if string contains duplicate pattern like "X — X"
  const doubleDashMatch = trimmed.match(/^(.+?)\s*(?:[—–-])\s*(.+?)$/);
  if (doubleDashMatch) {
    const p1 = standardizeDateString(doubleDashMatch[1]);
    const p2 = standardizeDateString(doubleDashMatch[2]);
    if (p1.toLowerCase().replace(/\s+/g, " ") === p2.toLowerCase().replace(/\s+/g, " ")) {
      return p1;
    }
  }

  return trimmed;
};

export default function ActivitiesStep({
  t,
  isDarkMode,
  nombreTitular,
  apellidosTitular = "",
  correoTitular = "",
  hasCompanion,
  companionsList,
  minors = [],
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
  const isMovieNightsActivity = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    const name = (act.name || "").toUpperCase();
    return type === "MOVIE_NIGHTS" || name.includes("MOVIE NIGHT");
  };

  // Minors list filter: only count items that are genuinely minors (tipo === 'minor' or (no tipo and age < 18))
  // If in adicional companions it was chosen that the companion is an adult, they are excluded here
  const actualMinors = useMemo(() => {
    return (minors || []).filter(m => m.tipo === "minor" || (!m.tipo && (m.age !== undefined ? Number(m.age) < 18 : true)));
  }, [minors]);
  const hasActualMinors = actualMinors.length > 0;

  // Only show active activities in registration wizard (memoized to avoid new references on every render)
  // SPA activity is placed at the end of the list as requested
  // Movie Nights is only visible if there are registered minors (excluding adult companions)
  const activitiesList: Activity[] = useMemo(() => {
    const raw = (DataStore.getActivities ? DataStore.getActivities() : []).filter((act: Activity) => {
      if (act.isActive === false) return false;
      const isMovie = isMovieNightsActivity(act);
      if (isMovie && !hasActualMinors) {
        return false;
      }
      return true;
    });
    return [...raw].sort((a, b) => {
      const isSpaA = (a.activityType || a.category || "").toUpperCase() === "SPA" || (a.name || "").toUpperCase().includes("SPA");
      const isSpaB = (b.activityType || b.category || "").toUpperCase() === "SPA" || (b.name || "").toUpperCase().includes("SPA");
      if (isSpaA && !isSpaB) return 1;
      if (!isSpaA && isSpaB) return -1;
      return 0;
    });
  }, [DataStore, hasActualMinors]);

  // Clean up Movie Nights selections or reservations if there are no actual minors
  useEffect(() => {
    if (!hasActualMinors) {
      const allActs: Activity[] = DataStore.getActivities ? DataStore.getActivities() : [];
      const movieActs = allActs.filter(isMovieNightsActivity);
      const movieActIds = new Set(movieActs.map(a => a.id));
      if (movieActIds.size > 0) {
        setSelectedActivities(prev => {
          const filtered = prev.filter(id => !movieActIds.has(id));
          return filtered.length === prev.length ? prev : filtered;
        });
        if (setActivityReservations) {
          setActivityReservations(prev => {
            const filtered = prev.filter(r => !movieActIds.has(r.activityId));
            return filtered.length === prev.length ? prev : filtered;
          });
        }
      }
    }
  }, [hasActualMinors, setSelectedActivities, setActivityReservations, DataStore]);

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
  // Titular (or single participant):
  // { [activityId]: boolean } - true = lleva sus propios bastones (Sí), false = no lleva bastones propios (No)
  const [golfOwnClubsByActivity, setGolfOwnClubsByActivity] = useState<Record<string, boolean>>({});
  // { [activityId]: 'Derecho' | 'Zurdo' }
  const [golfHandByActivity, setGolfHandByActivity] = useState<Record<string, 'Derecho' | 'Zurdo'>>({});
  // { [activityId]: 'Regular' | 'Stiff' }
  const [golfShaftByActivity, setGolfShaftByActivity] = useState<Record<string, 'Regular' | 'Stiff'>>({});

  // Companion (when both or companion selected):
  const [golfCompOwnClubsByActivity, setGolfCompOwnClubsByActivity] = useState<Record<string, boolean>>({});
  const [golfCompHandByActivity, setGolfCompHandByActivity] = useState<Record<string, 'Derecho' | 'Zurdo'>>({});
  const [golfCompShaftByActivity, setGolfCompShaftByActivity] = useState<Record<string, 'Regular' | 'Stiff'>>({});

  const isSpecialActivity = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    return type === "SPA" || type === "PICKLEBALL" || type === "BINGO" || type === "MOVIE_NIGHTS" || type === "GOLF";
  };

  const isPickleballActivity = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    return type === "PICKLEBALL" || type === "BINGO" || type === "MOVIE_NIGHTS" || type === "GOLF";
  };

  const isPickleOrBingo = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    const name = (act.name || "").toUpperCase();
    return type === "PICKLEBALL" || type === "BINGO" || type === "MOVIE_NIGHTS" || name.includes("PICKLEBALL") || name.includes("BINGO") || name.includes("MOVIE");
  };

  const isMultiParticipantActivity = (act: Activity) => {
    const type = (act.activityType || act.category || "").toUpperCase();
    const name = (act.name || "").toUpperCase();
    return type === "PICKLEBALL" || type === "BINGO" || type === "MOVIE_NIGHTS" || type === "GOLF" || name.includes("PICKLEBALL") || name.includes("BINGO") || name.includes("GOLF") || name.includes("MOVIE");
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
    if (type === "MOVIE_NIGHTS") return "Movie Nights";
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

        // Check if user already has reservations for this activity
        const existingResList = activityReservations.filter(r => r.activityId === act.id);
        const existingRes = existingResList[0];

        if (existingRes && existingRes.dayId) {
          setSelectedDayByActivity(prev => {
            if (prev[act.id] === existingRes.dayId) return prev;
            return { ...prev, [act.id]: existingRes.dayId! };
          });

          let targetParticipant = existingRes.personId || (existingRes.personType === "titular" ? "titular" : "companion");
          if (isMovieNightsActivity(act)) {
            const minorResList = existingResList.filter(r => r.personType === "minor");
            if (minorResList.length > 1 || (actualMinors && actualMinors.length > 1 && minorResList.length === actualMinors.length)) {
              targetParticipant = "all-minors";
            } else if (minorResList.length === 1) {
              targetParticipant = minorResList[0].personId || "minor-0";
            } else {
              targetParticipant = actualMinors && actualMinors.length > 1 ? "all-minors" : "minor-0";
            }
          } else if (isMultiParticipantActivity(act)) {
            const titularRes = existingResList.find(r => r.personType === "titular" || r.personId === "titular");
            const compRes = existingResList.find(r => r.personType === "companion" || (r.personId && r.personId !== "titular"));
            if (titularRes && compRes) {
              targetParticipant = "both";
            } else if (compRes && !titularRes) {
              targetParticipant = compRes?.personId || (companionsList[0]?.id || "companion");
            } else {
              targetParticipant = "titular";
            }

            if (titularRes) {
              if (titularRes.golfOwnClubs !== undefined) {
                setGolfOwnClubsByActivity(prev => ({ ...prev, [act.id]: titularRes.golfOwnClubs! }));
              }
              if (titularRes.golfHand) {
                setGolfHandByActivity(prev => ({ ...prev, [act.id]: titularRes.golfHand! }));
              }
              if (titularRes.golfShaft) {
                setGolfShaftByActivity(prev => ({ ...prev, [act.id]: titularRes.golfShaft! }));
              }
            }
            if (compRes) {
              if (compRes.golfOwnClubs !== undefined) {
                setGolfCompOwnClubsByActivity(prev => ({ ...prev, [act.id]: compRes.golfOwnClubs! }));
              }
              if (compRes.golfHand) {
                setGolfCompHandByActivity(prev => ({ ...prev, [act.id]: compRes.golfHand! }));
              }
              if (compRes.golfShaft) {
                setGolfCompShaftByActivity(prev => ({ ...prev, [act.id]: compRes.golfShaft! }));
              }
            }
          }

          setSelectedParticipantByActivity(prev => {
            if (prev[act.id] === targetParticipant) return prev;
            return { ...prev, [act.id]: targetParticipant };
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
            if (isMovieNightsActivity(act)) {
              return { ...prev, [act.id]: actualMinors && actualMinors.length > 1 ? "all-minors" : "minor-0" };
            }
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
        if (isMovieNightsActivity(act)) {
          setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: actualMinors && actualMinors.length > 1 ? "all-minors" : "minor-0" }));
        } else {
          setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: "titular" }));
        }
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
          const isPickle = isPickleballActivity(act);
          const saveFn = isPickle ? savePickleballReservationsToSheet : saveSpaReservationsToSheet;
          await saveFn(
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
          console.warn("[Activity Release] Error releasing sheet reservation:", err);
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
    const isMultiParticipant = isMultiParticipantActivity(act);
    const actLabel = getActivityTypeName(act);
    const activeDay = getActiveDay(act);
    const dayTab = activeDay?.googleSheetsTab || act.googleSheetsTab || "Viernes";
    const selectedTime = selectedTimeByActivity[act.id];
    const selectedRowIndex = selectedSlotRowByActivity[act.id];
    const participantId = selectedParticipantByActivity[act.id] || "titular";
    const { slots } = getCurrentDaySlots(act);
    const userEmailNorm = (correoTitular || "").trim().toUpperCase();

    // MOVIE NIGHTS CASE: Exclusively for minors
    if (isMovieNightsActivity(act)) {
      const isAllMinors = participantId === "all-minors" || participantId === "both";
      const targetMinors = isAllMinors 
        ? (actualMinors || []) 
        : [actualMinors[parseInt(participantId.replace("minor-", ""), 10) || 0]].filter(Boolean);

      if (targetMinors.length === 0) {
        alert("No hay menores seleccionados para registrar.");
        return;
      }

      const prevMinorResList = activityReservations.filter(r => r.activityId === act.id && r.personType === "minor");
      const assignedSlots: SpaReservationSlot[] = [];
      const usedRowIndices = new Set<number>();

      for (let i = 0; i < targetMinors.length; i++) {
        const minorObj = targetMinors[i];
        const minorId = isAllMinors ? `minor-${i}` : participantId;
        const prevRes = prevMinorResList.find(r => r.personId === minorId || (r.personName?.toLowerCase() === minorObj.name?.toLowerCase()));

        let chosen: SpaReservationSlot | undefined;
        if (prevRes && prevRes.rowIndex && prevRes.rowIndex >= 9 && (prevRes.dayId === activeDay.id || prevRes.sheetTab === dayTab) && !usedRowIndices.has(prevRes.rowIndex)) {
          chosen = slots.find(s => s.rowIndex === prevRes.rowIndex) || {
            rowIndex: prevRes.rowIndex,
            citaNo: prevRes.citaNo || String(prevRes.rowIndex - 8),
            timeSlot: activeDay.label || act.eventDay || actLabel,
            rawTime: actLabel,
            duration: "",
            therapistGender: "",
            isBlocked: false,
            isOccupied: true
          };
        } else {
          chosen = slots.find(s => !s.isBlocked && !s.isOccupied && !usedRowIndices.has(s.rowIndex));
        }

        if (!chosen && slots.length === 0) {
          const baseRow = 9 + i;
          chosen = {
            rowIndex: baseRow,
            citaNo: String(i + 1),
            timeSlot: activeDay.label || act.eventDay || actLabel,
            rawTime: actLabel,
            duration: "",
            therapistGender: "",
            isBlocked: false,
            isOccupied: false
          };
        }

        if (!chosen) {
          alert(`Lo sentimos, no hay suficientes lugares disponibles para todos los menores en ${actLabel}.`);
          return;
        }

        usedRowIndices.add(chosen.rowIndex);
        assignedSlots.push(chosen);
      }

      const newMinorReservations: ActivityReservationDetail[] = targetMinors.map((minorObj, idx) => {
        const slot = assignedSlots[idx];
        const lastNameParts = (minorObj.lastName || "").trim().split(" ");
        const paternal = lastNameParts[0] ? lastNameParts[0].trim() : "";
        const maternal = lastNameParts.length > 1 ? lastNameParts.slice(1).join(" ").trim() : "";
        const mId = isAllMinors ? `minor-${idx}` : participantId;

        return {
          activityId: act.id,
          activityName: act.name || actLabel,
          personType: "minor",
          personId: mId,
          personName: (minorObj.name || "Menor").trim(),
          paternalName: paternal,
          maternalName: maternal,
          titularEmail: userEmailNorm,
          slotTime: activeDay.label || act.eventDay || "Lugar Asignado",
          rowIndex: slot.rowIndex,
          citaNo: slot.citaNo,
          dayId: activeDay.id,
          dayDate: activeDay.date,
          dayLabel: activeDay.label,
          sheetTab: dayTab
        };
      });

      setBookingLoading(prev => ({ ...prev, [act.id]: true }));
      setBookingSuccessMsg(prev => ({ ...prev, [act.id]: "" }));

      try {
        const previousReservations = activityReservations.filter(r => r.activityId === act.id);
        const sheetRes = await savePickleballReservationsToSheet(
          act,
          newMinorReservations,
          {
            previousReservations,
            sheetTab: dayTab,
            titularEmail: userEmailNorm
          }
        );
        if (!sheetRes.success) {
          console.warn("Webhook warning:", sheetRes.error);
        }

        const updatedReservations = [
          ...activityReservations.filter(r => r.activityId !== act.id),
          ...newMinorReservations
        ];
        if (setActivityReservations) {
          setActivityReservations(updatedReservations);
        }
        if (!selectedActivities.includes(act.id)) {
          setSelectedActivities(prev => [...prev, act.id]);
        }

        if (onSaveReservationSuccess) {
          onSaveReservationSuccess(updatedReservations);
        }

        const namesListUpper = newMinorReservations.map(r => `${r.personName} ${r.paternalName || ""}`.trim().toUpperCase()).join(" Y ");
        const placeWord = newMinorReservations.length > 1 ? "Lugares" : "Lugar";
        setBookingSuccessMsg(prev => ({
          ...prev,
          [act.id]: `¡${placeWord} de ${actLabel} reservados y guardados con éxito para ${namesListUpper}!`
        }));

        handleRefreshDaySlots(act);
      } catch (err: any) {
        alert(`Error al guardar la reserva: ${err?.message || "Ocurrió un problema de conexión."}`);
      } finally {
        setBookingLoading(prev => ({ ...prev, [act.id]: false }));
      }
      return;
    }

    // CASE 1: Multi-participant activity (Pickleball, Bingo or Golf) with BOTH Titular and Companion
    if (isMultiParticipant && participantId === "both") {
      const prevTitularRes = activityReservations.find(r => r.activityId === act.id && (r.personType === "titular" || r.personId === "titular"));
      const prevCompRes = activityReservations.find(r => r.activityId === act.id && (r.personType === "companion" || (r.personId && r.personId !== "titular")));

      let chosenSlotTitular: SpaReservationSlot | undefined;
      let chosenSlotComp: SpaReservationSlot | undefined;

      // 1. Reutilizar o buscar renglón para el Titular
      if (prevTitularRes && prevTitularRes.rowIndex && prevTitularRes.rowIndex >= 9 && (prevTitularRes.dayId === activeDay.id || prevTitularRes.sheetTab === dayTab)) {
        chosenSlotTitular = slots.find(s => s.rowIndex === prevTitularRes.rowIndex) || {
          rowIndex: prevTitularRes.rowIndex,
          citaNo: prevTitularRes.citaNo || String(prevTitularRes.rowIndex - 8),
          timeSlot: activeDay.label || act.eventDay || actLabel,
          rawTime: actLabel,
          duration: "",
          therapistGender: "",
          isBlocked: false,
          isOccupied: true
        };
      } else {
        const slotByEmail = userEmailNorm ? slots.find(s => s.titularEmail && s.titularEmail.trim().toUpperCase() === userEmailNorm) : undefined;
        if (slotByEmail) {
          chosenSlotTitular = slotByEmail;
        } else {
          chosenSlotTitular = slots.find(s => !s.isBlocked && !s.isOccupied);
        }
      }

      // 2. Reutilizar o buscar renglón para el Acompañante
      if (prevCompRes && prevCompRes.rowIndex && prevCompRes.rowIndex >= 9 && (prevCompRes.dayId === activeDay.id || prevCompRes.sheetTab === dayTab)) {
        chosenSlotComp = slots.find(s => s.rowIndex === prevCompRes.rowIndex) || {
          rowIndex: prevCompRes.rowIndex,
          citaNo: prevCompRes.citaNo || String(prevCompRes.rowIndex - 8),
          timeSlot: activeDay.label || act.eventDay || actLabel,
          rawTime: actLabel,
          duration: "",
          therapistGender: "",
          isBlocked: false,
          isOccupied: true
        };
      } else {
        const compSlotByEmail = userEmailNorm 
          ? slots.find(s => s.titularEmail && s.titularEmail.trim().toUpperCase() === userEmailNorm && s.rowIndex !== chosenSlotTitular?.rowIndex)
          : undefined;
        if (compSlotByEmail) {
          chosenSlotComp = compSlotByEmail;
        } else {
          chosenSlotComp = slots.find(s => !s.isBlocked && !s.isOccupied && s.rowIndex !== chosenSlotTitular?.rowIndex);
        }
      }

      // Fallback slots if sheet empty
      if (!chosenSlotTitular && slots.length === 0) {
        chosenSlotTitular = {
          rowIndex: prevTitularRes?.rowIndex || 9,
          citaNo: prevTitularRes?.citaNo || "1",
          timeSlot: activeDay.label || act.eventDay || actLabel,
          rawTime: actLabel,
          duration: "",
          therapistGender: "",
          isBlocked: false,
          isOccupied: false
        };
      }
      if (!chosenSlotComp && slots.length === 0) {
        chosenSlotComp = {
          rowIndex: prevCompRes?.rowIndex || ((chosenSlotTitular?.rowIndex || 9) + 1),
          citaNo: prevCompRes?.citaNo || "2",
          timeSlot: activeDay.label || act.eventDay || actLabel,
          rawTime: actLabel,
          duration: "",
          therapistGender: "",
          isBlocked: false,
          isOccupied: false
        };
      }

      if (!chosenSlotTitular || !chosenSlotComp) {
        alert(`Lo sentimos, no hay suficientes lugares disponibles en este momento para ${actLabel} (se requieren 2 lugares).`);
        return;
      }

      const titularLastNameParts = (apellidosTitular || "").trim().split(" ");
      const comp = companionsList[0];
      const compLastNameParts = (comp?.lastName || "").trim().split(" ");

      const isGolf = isGolfActivity(act);
      const titularOwnClubs = golfOwnClubsByActivity[act.id] ?? false;
      const titularHand = golfHandByActivity[act.id] || "Derecho";
      const titularShaft = golfShaftByActivity[act.id] || "Regular";

      const compOwnClubs = golfCompOwnClubsByActivity[act.id] ?? false;
      const compHand = golfCompHandByActivity[act.id] || "Derecho";
      const compShaft = golfCompShaftByActivity[act.id] || "Regular";

      const titularRes: ActivityReservationDetail = {
        activityId: act.id,
        activityName: act.name || actLabel,
        personType: "titular",
        personId: "titular",
        personName: (nombreTitular || "").trim(),
        paternalName: titularLastNameParts[0] ? titularLastNameParts[0].trim() : "",
        maternalName: titularLastNameParts.length > 1 ? titularLastNameParts.slice(1).join(" ").trim() : "",
        titularEmail: userEmailNorm,
        slotTime: activeDay.label || act.eventDay || "Lugar Asignado",
        rowIndex: chosenSlotTitular.rowIndex,
        citaNo: chosenSlotTitular.citaNo,
        dayId: activeDay.id,
        dayDate: activeDay.date,
        dayLabel: activeDay.label,
        sheetTab: dayTab,
        golfOwnClubs: isGolf ? titularOwnClubs : undefined,
        golfHand: isGolf && !titularOwnClubs ? titularHand : undefined,
        golfShaft: isGolf && !titularOwnClubs ? titularShaft : undefined
      };

      const compRes: ActivityReservationDetail = {
        activityId: act.id,
        activityName: act.name || actLabel,
        personType: "companion",
        personId: comp?.id || "companion",
        personName: (comp?.firstName || "Acompañante").trim(),
        paternalName: compLastNameParts[0] ? compLastNameParts[0].trim() : "",
        maternalName: compLastNameParts.length > 1 ? compLastNameParts.slice(1).join(" ").trim() : "",
        titularEmail: userEmailNorm,
        slotTime: activeDay.label || act.eventDay || "Lugar Asignado",
        rowIndex: chosenSlotComp.rowIndex,
        citaNo: chosenSlotComp.citaNo,
        dayId: activeDay.id,
        dayDate: activeDay.date,
        dayLabel: activeDay.label,
        sheetTab: dayTab,
        golfOwnClubs: isGolf ? compOwnClubs : undefined,
        golfHand: isGolf && !compOwnClubs ? compHand : undefined,
        golfShaft: isGolf && !compOwnClubs ? compShaft : undefined
      };

      const newReservationsList = [titularRes, compRes];

      setBookingLoading(prev => ({ ...prev, [act.id]: true }));
      setBookingSuccessMsg(prev => ({ ...prev, [act.id]: "" }));

      try {
        const previousReservations = activityReservations.filter(r => r.activityId === act.id);
        const saveFn = savePickleballReservationsToSheet;
        const sheetRes = await saveFn(
          act,
          newReservationsList,
          {
            previousReservations,
            sheetTab: dayTab,
            titularEmail: userEmailNorm
          }
        );

        const isSynced = sheetRes.success && sheetRes.syncStatus === "synced";
        titularRes.syncStatus = isSynced ? "synced" : (sheetRes.syncStatus || "pending_sheet");
        compRes.syncStatus = isSynced ? "synced" : (sheetRes.syncStatus || "pending_sheet");
        if (!isSynced && sheetRes.error) {
          titularRes.syncError = sheetRes.error;
          compRes.syncError = sheetRes.error;
        }
        titularRes.lastSyncAt = new Date().toISOString();
        compRes.lastSyncAt = new Date().toISOString();

        if (!sheetRes.success) {
          console.warn("Google Sheets Sync notice:", sheetRes.error || sheetRes.message);
        }

        const updatedReservations = [
          ...activityReservations.filter(r => r.activityId !== act.id),
          ...newReservationsList
        ];
        if (setActivityReservations) {
          setActivityReservations(updatedReservations);
        }
        if (!selectedActivities.includes(act.id)) {
          setSelectedActivities(prev => [...prev, act.id]);
        }
        if (comp) {
          const currentCompActs = comp.selectedActivities || [];
          if (!currentCompActs.includes(act.id)) {
            updateCompanionItem(comp.id, "selectedActivities", [...currentCompActs, act.id]);
          }
        }

        if (onSaveReservationSuccess) {
          onSaveReservationSuccess(updatedReservations);
        }

        const titularDisplay = `${titularRes.personName} ${titularRes.paternalName || ""}`.trim().toUpperCase() || "TITULAR";
        const compDisplay = `${compRes.personName} ${compRes.paternalName || ""}`.trim().toUpperCase() || "ACOMPAÑANTE";
        setBookingSuccessMsg(prev => ({
          ...prev,
          [act.id]: isSynced
            ? `¡Lugares de ${actLabel} reservados y sincronizados con éxito para ${titularDisplay} y ${compDisplay}!`
            : `¡Lugares de ${actLabel} asegurados en tu registro para ${titularDisplay} y ${compDisplay}! (Sincronización con Google Sheets en proceso)`
        }));

        handleRefreshDaySlots(act);
      } catch (err: any) {
        alert(`Error al guardar la reserva: ${err?.message || "Ocurrió un problema de conexión."}`);
      } finally {
        setBookingLoading(prev => ({ ...prev, [act.id]: false }));
      }
      return;
    }

    // CASE 2: Single Participant (Titular or Companion, or Spa / Golf single)
    let chosenSlot: SpaReservationSlot | undefined;
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
      let selectedTime = selectedTimeByActivity[act.id];
      let selectedRowIndex = selectedSlotRowByActivity[act.id];

      // Smart fallback: If not explicitly selected in state, try activeTime or first available slot
      if (!selectedTime) {
        const rawActiveTime = selectedTimeByActivity[act.id] || (existingRes ? `${existingRes.slotTime}` : "");
        const activeTime = canonicalizeTimeKey(rawActiveTime);
        if (activeTime) {
          selectedTime = activeTime;
        } else {
          const availableSlots = slots.filter(s => !s.isBlocked && !s.isOccupied);
          if (availableSlots.length > 0) {
            selectedTime = canonicalizeTimeKey(availableSlots[0].timeSlot || availableSlots[0].rawTime);
            selectedRowIndex = availableSlots[0].rowIndex;
          }
        }
      }

      if (selectedTime && !selectedRowIndex) {
        const normTime = canonicalizeTimeKey(selectedTime);
        const match = slots.find(s => canonicalizeTimeKey(s.timeSlot || s.rawTime) === normTime && !s.isBlocked && !s.isOccupied)
                   || slots.find(s => canonicalizeTimeKey(s.timeSlot || s.rawTime) === normTime);
        if (match) {
          selectedRowIndex = match.rowIndex;
        }
      }

      if (!selectedTime || !selectedRowIndex) {
        alert("Por favor selecciona primero un horario disponible.");
        return;
      }

      // Priority 1: Match by exact rowIndex
      chosenSlot = slots.find(s => s.rowIndex === selectedRowIndex);

      // Priority 2: Fallback to any matching slot with this time if rowIndex shifted
      if (!chosenSlot && selectedTime) {
        const normTime = canonicalizeTimeKey(selectedTime);
        chosenSlot = slots.find(s => canonicalizeTimeKey(s.timeSlot || s.rawTime) === normTime && !s.isBlocked && !s.isOccupied)
                  || slots.find(s => canonicalizeTimeKey(s.timeSlot || s.rawTime) === normTime);
      }

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
      const comp = companionsList.find(c => c.id === participantId) || companionsList[0];
      personName = (comp?.firstName || `Acompañante`).trim();
      personLastName = (comp?.lastName || "").trim();
    }

    const lastNameParts = personLastName.split(" ");
    const paternal = lastNameParts[0] ? lastNameParts[0].trim() : "";
    const maternal = lastNameParts.length > 1 ? lastNameParts.slice(1).join(" ").trim() : "";

    const isGolf = isGolfActivity(act);
    let ownClubs = false;
    let hand: "Derecho" | "Zurdo" = "Derecho";
    let shaft: "Regular" | "Stiff" = "Regular";

    if (isGolf) {
      if (personType === "titular") {
        ownClubs = golfOwnClubsByActivity[act.id] ?? false;
        hand = golfHandByActivity[act.id] || "Derecho";
        shaft = golfShaftByActivity[act.id] || "Regular";
      } else {
        ownClubs = golfCompOwnClubsByActivity[act.id] !== undefined ? golfCompOwnClubsByActivity[act.id] : (golfOwnClubsByActivity[act.id] ?? false);
        hand = golfCompHandByActivity[act.id] || golfHandByActivity[act.id] || "Derecho";
        shaft = golfCompShaftByActivity[act.id] || golfShaftByActivity[act.id] || "Regular";
      }
    }

    const newReservation: ActivityReservationDetail = {
      activityId: act.id,
      activityName: act.name || (isPickle ? actLabel : "Sesión de Spa"),
      personType,
      personId: participantId,
      personName,
      paternalName: paternal,
      maternalName: maternal,
      titularEmail: userEmailNorm,
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
      // Find any previous reservation for this activity (may include companion or titular from previous 'both' selection)
      const previousReservations = activityReservations.filter(r => r.activityId === act.id);

      // Save to Google Sheets via Webhook & Backend API
      const saveFn = isPickle ? savePickleballReservationsToSheet : saveSpaReservationsToSheet;
      const sheetRes = await saveFn(
        act,
        [newReservation],
        {
          previousReservations,
          sheetTab: dayTab,
          titularEmail: userEmailNorm
        }
      );

      const isSynced = sheetRes.success && sheetRes.syncStatus === "synced";
      newReservation.syncStatus = isSynced ? "synced" : (sheetRes.syncStatus || "pending_sheet");
      if (!isSynced && sheetRes.error) {
        newReservation.syncError = sheetRes.error;
      }
      newReservation.lastSyncAt = new Date().toISOString();

      if (!sheetRes.success) {
        console.warn("Google Sheets Sync notice:", sheetRes.error || sheetRes.message);
      }

      // Update state: replace any previous reservations for this activity with the single chosen one
      const updatedReservations = [...activityReservations.filter(r => r.activityId !== act.id), newReservation];
      if (setActivityReservations) {
        setActivityReservations(updatedReservations);
      }

      // Ensure participant is in selectedActivities and deselected person is removed
      if (personType === "titular") {
        if (!selectedActivities.includes(act.id)) {
          setSelectedActivities(prev => [...prev, act.id]);
        }
        if (hasCompanion) {
          companionsList.forEach(comp => {
            if (comp.selectedActivities?.includes(act.id)) {
              updateCompanionItem(comp.id, "selectedActivities", comp.selectedActivities.filter(id => id !== act.id));
            }
          });
        }
      } else {
        setSelectedActivities(prev => prev.filter(id => id !== act.id));
        const comp = companionsList.find(c => c.id === participantId) || companionsList[0];
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

      const personDisplay = `${personName} ${personLastName}`.trim().toUpperCase() || "PARTICIPANTE";
      setBookingSuccessMsg(prev => ({
        ...prev,
        [act.id]: isPickle
          ? (isSynced
              ? `¡Lugar de ${actLabel} reservado y sincronizado con éxito para ${personDisplay}!`
              : `¡Lugar de ${actLabel} asegurado en tu registro para ${personDisplay}! (Sincronización con Google Sheets en proceso)`)
          : (isSynced
              ? `¡Horario reservado y sincronizado con éxito para ${personDisplay} el ${cleanRepeatedDateText(activeDay.label)} a las ${chosenSlot.timeSlot}!`
              : `¡Horario asegurado en tu registro para ${personDisplay} el ${cleanRepeatedDateText(activeDay.label)} a las ${chosenSlot.timeSlot}! (Sincronización con Google Sheets pendiente)`)
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
          Selecciona las actividades del evento en las que deseas participar. Activa el selector para inscribirte.
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

            // Existing confirmed reservations for this activity
            const currentReservations = activityReservations.filter(r => r.activityId === act.id);
            const currentReservation = currentReservations[0];
            const isPickleBingo = isPickleOrBingo(act);

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
                  currentReservations.some(r => r.rowIndex === s.rowIndex) ||
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
                className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 ${
                  isActivityOn ? "p-5 md:p-6" : "p-3 sm:py-3.5 sm:px-4 md:px-5"
                } ${
                  isDarkMode 
                    ? isActivityOn 
                      ? "bg-slate-900/90 border-emerald-800/80 shadow-lg shadow-emerald-950/20" 
                      : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700" 
                    : isActivityOn 
                      ? "bg-white border-emerald-300 shadow-md ring-1 ring-emerald-100" 
                      : "bg-slate-50/60 border-slate-200/90 hover:bg-white"
                }`}
              >
                {/* Header & Switch: Selector arriba, Nombre abajo */}
                <div className={`${isActivityOn ? "space-y-3 pb-4 border-b border-slate-200/70 dark:border-slate-800" : "space-y-2.5"}`}>
                  {/* Fila superior: Selector ¿Desea participar? */}
                  <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                      ¿Desea participar?
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActivityOn}
                      onClick={() => handleToggleActivity(act, !isActivityOn)}
                      className={`relative inline-flex h-6 sm:h-7 md:h-8 w-12 sm:w-14 md:w-16 p-0.5 sm:p-1 items-center rounded-full transition-colors focus:outline-none cursor-pointer shadow-inner shrink-0 ${
                        isActivityOn 
                          ? "bg-emerald-600 hover:bg-emerald-700" 
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span className="sr-only">¿Desea participar?</span>
                      <span
                        className={`h-4.5 sm:h-5 md:h-6 w-5 sm:w-6 md:w-7 rounded-full bg-white shadow-md flex items-center justify-center font-black text-[8px] sm:text-[9px] md:text-[10px] tracking-tight uppercase select-none transition-transform ${
                          isActivityOn ? "translate-x-6 sm:translate-x-7 text-emerald-700 font-extrabold" : "translate-x-0 text-slate-500"
                        }`}
                      >
                        {isActivityOn ? "SI" : "NO"}
                      </span>
                    </button>
                  </div>

                  {/* Renglón inferior: Nombre de la actividad */}
                  <div>
                    <h4 className={`text-sm sm:text-base md:text-lg font-black uppercase tracking-tight break-words ${t.textHeading}`}>
                      {act.name}
                    </h4>
                    {!isActivityOn && act.description && (
                      <p className={`text-[11px] sm:text-xs leading-snug line-clamp-2 mt-1 ${t.textMuted}`}>
                        {act.description}
                      </p>
                    )}
                  </div>

                  {isActivityOn && (
                    <>
                      <p className={`text-xs md:text-sm leading-relaxed ${t.textMuted}`}>
                        {act.description}
                      </p>

                      {act.rules && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2 rounded-xl flex items-center gap-1.5 font-medium mt-1">
                          <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span><strong>Nota:</strong> {act.rules}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* WHEN ACTIVITY IS ON & IS SPECIAL SHEET ACTIVITY (SPA OR PICKLEBALL) */}
                {isActivityOn && isSpecialSheet && (
                  <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                    
                    {/* CONFIRMED RESERVATION SUMMARY CARD */}
                    {currentReservations.length > 0 && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 rounded text-[10px] font-black uppercase tracking-wider">
                              {currentReservations.length > 1 
                                ? `${currentReservations.length} LUGARES CONFIRMADOS` 
                                : (isPickle ? "LUGAR CONFIRMADO" : "HORARIO CONFIRMADO")}
                            </span>
                            <h5 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-100 mt-0.5">
                              {isPickle 
                                ? (cleanRepeatedDateText(currentReservations[0].dayLabel) || act.name || getActivityTypeName(act)) 
                                : `${cleanRepeatedDateText(currentReservations[0].dayLabel) || "Día seleccionado"} • ${currentReservations[0].slotTime}`}
                            </h5>
                            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                              {currentReservations.length > 1 ? (
                                <div className="space-y-1 mt-0.5">
                                  {currentReservations.map((r, rIdx) => {
                                    const golfDetails = isGolfActivity(act)
                                      ? (r.golfOwnClubs ? " • Bastones: Propios" : ` • Bastones: Préstamo (${r.golfHand || 'Derecho'}, Varilla ${r.golfShaft || 'Regular'})`)
                                      : "";
                                    const roleName = r.personType === "titular" 
                                      ? "Titular" 
                                      : (r.personType === "minor" ? "Menor" : "Acompañante");
                                    return (
                                      <div key={rIdx}>
                                        <strong>{`${(r.personName || "").toUpperCase()} ${(r.paternalName || "").toUpperCase()}`.trim()}</strong> ({roleName}){golfDetails}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div>
                                  Participante: <strong>{`${(currentReservations[0].personName || "").toUpperCase()} ${(currentReservations[0].paternalName || "").toUpperCase()}`.trim()}</strong> ({currentReservations[0].personType === "titular" ? "Titular" : (currentReservations[0].personType === "minor" ? "Menor" : "Acompañante")})
                                  {currentReservations[0].therapistGender ? ` • Terapeuta: ${currentReservations[0].therapistGender}` : ''}
                                  {isGolfActivity(act) && (
                                    currentReservations[0].golfOwnClubs 
                                      ? " • Bastones: Propios" 
                                      : ` • Bastones: Préstamo (${currentReservations[0].golfHand || 'Derecho'}, Varilla ${currentReservations[0].golfShaft || 'Regular'})`
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1: SELECCIÓN DE PARTICIPANTE */}
                    <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 rounded-2xl space-y-2.5">
                      <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        1) {isMovieNightsActivity(act) 
                          ? `¿Quién participará en ${getActivityTypeName(act)}? (Exclusivo para menores de edad)`
                          : isPickle 
                          ? `¿Quién participará en ${getActivityTypeName(act)}?` 
                          : "¿Quién tomará el spa?"}
                      </label>

                      {isMovieNightsActivity(act) ? (
                        <div className={`grid ${actualMinors && actualMinors.length > 1 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"} gap-2`}>
                          {actualMinors.map((minor, mIdx) => {
                            const minorKey = `minor-${mIdx}`;
                            const isSelected = activeParticipant === minorKey;
                            const minorFullName = `${minor.name || `Menor ${mIdx + 1}`} ${minor.lastName || ""}`.trim().toUpperCase();
                            return (
                              <label key={minorKey} className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                isSelected
                                  ? "bg-white dark:bg-slate-800 border-emerald-600 ring-2 ring-emerald-400 shadow-xs"
                                  : "bg-white/70 dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                              }`}>
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name={`participant-${act.id}`}
                                    value={minorKey}
                                    checked={isSelected}
                                    onChange={() => setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: minorKey }))}
                                    className="accent-emerald-600 w-4 h-4 cursor-pointer"
                                  />
                                  <div>
                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                      {minorFullName}
                                    </span>
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">
                                      MENOR ({minor.age} AÑOS)
                                    </span>
                                  </div>
                                </div>
                                <User className="w-4 h-4 text-emerald-600 shrink-0" />
                              </label>
                            );
                          })}

                          {actualMinors && actualMinors.length > 1 && (
                            <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              activeParticipant === "all-minors" || activeParticipant === "both"
                                ? "bg-white dark:bg-slate-800 border-emerald-600 ring-2 ring-emerald-400 shadow-xs"
                                : "bg-white/70 dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                            }`}>
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name={`participant-${act.id}`}
                                  value="all-minors"
                                  checked={activeParticipant === "all-minors" || activeParticipant === "both"}
                                  onChange={() => setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: "all-minors" }))}
                                  className="accent-emerald-600 w-4 h-4 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                    TODOS LOS MENORES
                                  </span>
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">
                                    {actualMinors.length} LUGARES
                                  </span>
                                </div>
                              </div>
                              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                            </label>
                          )}
                        </div>
                      ) : (
                        <div className={`grid ${isMultiParticipantActivity(act) && hasCompanion && companionsList.length > 0 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"} gap-2`}>
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

                          {/* Option Both (Titular y Acompañante) - FOR PICKLEBALL, BINGO AND GOLF */}
                          {isMultiParticipantActivity(act) && hasCompanion && companionsList.length > 0 && (
                            <label className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                              activeParticipant === "both"
                                ? "bg-white dark:bg-slate-800 border-emerald-600 ring-2 ring-emerald-400 shadow-xs"
                                : "bg-white/70 dark:bg-slate-850 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                            }`}>
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name={`participant-${act.id}`}
                                  value="both"
                                  checked={activeParticipant === "both"}
                                  onChange={() => setSelectedParticipantByActivity(prev => ({ ...prev, [act.id]: "both" }))}
                                  className="accent-emerald-600 w-4 h-4 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                                    AMBOS (TITULAR Y ACOMPAÑANTE)
                                  </span>
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">
                                    2 LUGARES
                                  </span>
                                </div>
                              </div>
                              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                            </label>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2: SELECCIÓN DE DÍA (Sólo visible si hay más de 1 fecha disponible) */}
                    {days.length > 1 && (
                      <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            2) Elige la fecha en la que deseas reservar:
                          </label>
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
                                  {standardizeDateString(day.label)}
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
                      <div className="space-y-3">
                        {/* CASE A: BOTH PARTICIPANTS */}
                        {activeParticipant === "both" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* TITULAR GOLF SPECS */}
                            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div>
                                  <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    Titular: {nombreTitular || "Titular"}
                                  </label>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                    ¿Lleva sus bastones propios?
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={golfOwnClubsByActivity[act.id] ?? false}
                                  onClick={() => {
                                    const currentVal = golfOwnClubsByActivity[act.id] ?? false;
                                    setGolfOwnClubsByActivity(prev => ({ ...prev, [act.id]: !currentVal }));
                                  }}
                                  className={`relative inline-flex h-7 w-14 p-0.5 items-center rounded-full transition-colors focus:outline-none cursor-pointer shadow-inner ${
                                    (golfOwnClubsByActivity[act.id] ?? false)
                                      ? "bg-emerald-600 hover:bg-emerald-700" 
                                      : "bg-slate-300 dark:bg-slate-700"
                                  }`}
                                >
                                  <span
                                    className={`h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center font-black text-[9px] tracking-tight uppercase select-none transition-transform ${
                                      (golfOwnClubsByActivity[act.id] ?? false) ? "translate-x-7 text-emerald-700 font-extrabold" : "translate-x-0 text-slate-500"
                                    }`}
                                  >
                                    {(golfOwnClubsByActivity[act.id] ?? false) ? "SI" : "NO"}
                                  </span>
                                </button>
                              </div>

                              {!(golfOwnClubsByActivity[act.id] ?? false) ? (
                                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/50 space-y-2.5">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
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
                                            className={`py-1.5 px-2 rounded-xl border text-xs font-black transition cursor-pointer text-center ${
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

                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
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
                                            className={`py-1.5 px-2 rounded-xl border text-xs font-black transition cursor-pointer text-center ${
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
                              ) : (
                                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Llevará su propio set de bastones.</span>
                                </div>
                              )}
                            </div>

                            {/* COMPANION GOLF SPECS */}
                            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div>
                                  <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    Acompañante: {companionsList[0]?.firstName || "Acompañante"}
                                  </label>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                    ¿Lleva sus bastones propios?
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={golfCompOwnClubsByActivity[act.id] ?? false}
                                  onClick={() => {
                                    const currentVal = golfCompOwnClubsByActivity[act.id] ?? false;
                                    setGolfCompOwnClubsByActivity(prev => ({ ...prev, [act.id]: !currentVal }));
                                  }}
                                  className={`relative inline-flex h-7 w-14 p-0.5 items-center rounded-full transition-colors focus:outline-none cursor-pointer shadow-inner ${
                                    (golfCompOwnClubsByActivity[act.id] ?? false)
                                      ? "bg-emerald-600 hover:bg-emerald-700" 
                                      : "bg-slate-300 dark:bg-slate-700"
                                  }`}
                                >
                                  <span
                                    className={`h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center font-black text-[9px] tracking-tight uppercase select-none transition-transform ${
                                      (golfCompOwnClubsByActivity[act.id] ?? false) ? "translate-x-7 text-emerald-700 font-extrabold" : "translate-x-0 text-slate-500"
                                    }`}
                                  >
                                    {(golfCompOwnClubsByActivity[act.id] ?? false) ? "SI" : "NO"}
                                  </span>
                                </button>
                              </div>

                              {!(golfCompOwnClubsByActivity[act.id] ?? false) ? (
                                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/50 space-y-2.5">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                                      ¿Zurdo o Derecho?
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {(['Derecho', 'Zurdo'] as const).map((handOption) => {
                                        const currentHand = golfCompHandByActivity[act.id] || "Derecho";
                                        const isSelected = currentHand === handOption;
                                        return (
                                          <button
                                            key={handOption}
                                            type="button"
                                            onClick={() => setGolfCompHandByActivity(prev => ({ ...prev, [act.id]: handOption }))}
                                            className={`py-1.5 px-2 rounded-xl border text-xs font-black transition cursor-pointer text-center ${
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

                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                                      Tipo de varilla:
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {(['Regular', 'Stiff'] as const).map((shaftOption) => {
                                        const currentShaft = golfCompShaftByActivity[act.id] || "Regular";
                                        const isSelected = currentShaft === shaftOption;
                                        return (
                                          <button
                                            key={shaftOption}
                                            type="button"
                                            onClick={() => setGolfCompShaftByActivity(prev => ({ ...prev, [act.id]: shaftOption }))}
                                            className={`py-1.5 px-2 rounded-xl border text-xs font-black transition cursor-pointer text-center ${
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
                              ) : (
                                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Llevará su propio set de bastones.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* CASE B: SINGLE PARTICIPANT (TITULAR OR COMPANION) */
                          <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl space-y-3.5">
                            {(() => {
                              const isTitular = activeParticipant === "titular";
                              const activeComp = companionsList.find(c => c.id === activeParticipant) || companionsList[0];
                              const participantLabel = isTitular 
                                ? `${(nombreTitular || "TITULAR").toUpperCase()} ${(apellidosTitular || "").toUpperCase()}`.trim()
                                : `${(activeComp?.firstName || "ACOMPAÑANTE").toUpperCase()} ${(activeComp?.lastName || "").toUpperCase()}`.trim();
                              
                              const ownClubsVal = isTitular 
                                ? (golfOwnClubsByActivity[act.id] ?? false)
                                : (golfCompOwnClubsByActivity[act.id] !== undefined ? golfCompOwnClubsByActivity[act.id] : (golfOwnClubsByActivity[act.id] ?? false));
                              
                              const handVal = isTitular
                                ? (golfHandByActivity[act.id] || "Derecho")
                                : (golfCompHandByActivity[act.id] || golfHandByActivity[act.id] || "Derecho");

                              const shaftVal = isTitular
                                ? (golfShaftByActivity[act.id] || "Regular")
                                : (golfCompShaftByActivity[act.id] || golfShaftByActivity[act.id] || "Regular");

                              return (
                                <>
                                  <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                      <label className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        {days.length > 1 ? "3) Equipamiento de Golf: ¿Llevas tus bastones propios?" : "2) Equipamiento de Golf: ¿Llevas tus bastones propios?"}
                                      </label>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Participante: <strong>{participantLabel}</strong>. Indica si llevarás tu propio set o requieres préstamo.
                                      </p>
                                    </div>

                                    {/* Switch Sí / No */}
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={ownClubsVal}
                                      onClick={() => {
                                        if (isTitular) {
                                          setGolfOwnClubsByActivity(prev => ({ ...prev, [act.id]: !ownClubsVal }));
                                        } else {
                                          setGolfCompOwnClubsByActivity(prev => ({ ...prev, [act.id]: !ownClubsVal }));
                                          setGolfOwnClubsByActivity(prev => ({ ...prev, [act.id]: !ownClubsVal }));
                                        }
                                      }}
                                      className={`relative inline-flex h-8 w-16 p-1 items-center rounded-full transition-colors focus:outline-none cursor-pointer shadow-inner ${
                                        ownClubsVal
                                          ? "bg-emerald-600 hover:bg-emerald-700" 
                                          : "bg-slate-300 dark:bg-slate-700"
                                      }`}
                                    >
                                      <span className="sr-only">¿Llevas tus bastones propios?</span>
                                      <span
                                        className={`h-6 w-7 rounded-full bg-white shadow-md flex items-center justify-center font-black text-[10px] tracking-tight uppercase select-none transition-transform ${
                                          ownClubsVal ? "translate-x-7 text-emerald-700 font-extrabold" : "translate-x-0 text-slate-500"
                                        }`}
                                      >
                                        {ownClubsVal ? "SI" : "NO"}
                                      </span>
                                    </button>
                                  </div>

                                  {/* Si NO lleva bastones propios -> Preguntar Zurdo/Derecho y Tipo de Varilla */}
                                  {!ownClubsVal ? (
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
                                              const isSelected = handVal === handOption;
                                              return (
                                                <button
                                                  key={handOption}
                                                  type="button"
                                                  onClick={() => {
                                                    if (isTitular) {
                                                      setGolfHandByActivity(prev => ({ ...prev, [act.id]: handOption }));
                                                    } else {
                                                      setGolfCompHandByActivity(prev => ({ ...prev, [act.id]: handOption }));
                                                      setGolfHandByActivity(prev => ({ ...prev, [act.id]: handOption }));
                                                    }
                                                  }}
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
                                              const isSelected = shaftVal === shaftOption;
                                              return (
                                                <button
                                                  key={shaftOption}
                                                  type="button"
                                                  onClick={() => {
                                                    if (isTitular) {
                                                      setGolfShaftByActivity(prev => ({ ...prev, [act.id]: shaftOption }));
                                                    } else {
                                                      setGolfCompShaftByActivity(prev => ({ ...prev, [act.id]: shaftOption }));
                                                      setGolfShaftByActivity(prev => ({ ...prev, [act.id]: shaftOption }));
                                                    }
                                                  }}
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
                                </>
                              );
                            })()}
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
                            {days.length > 1 ? `3) Horarios disponibles para ${standardizeDateString(activeDay.label)}:` : `2) Horarios disponibles:`}
                          </label>
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
                          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl flex items-center gap-2 text-xs font-medium text-emerald-900 dark:text-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              {daySlots.length > 0 ? (
                                <>Lugares disponibles: <strong className="font-black text-emerald-800 dark:text-emerald-300">{availablePickleSlots}</strong></>
                              ) : (
                                <>Lugares disponibles para registro.</>
                              )}
                            </span>
                          </div>
                        );
                      })()
                    )}

                    {/* ACTION BUTTON "GUARDAR ACTIVIDAD" */}
                    {(() => {
                      const currentDayTab = activeDay?.googleSheetsTab || act.googleSheetsTab || "Viernes";
                      const availablePickleSlots = daySlots.filter(s => !s.isBlocked && !s.isOccupied).length;
                      const isMovie = isMovieNightsActivity(act);
                      const isAllMinors = isMovie && (activeParticipant === "all-minors" || activeParticipant === "both");
                      const neededSlots = isMovie
                        ? (isAllMinors ? (actualMinors && actualMinors.length ? actualMinors.length : 1) : 1)
                        : ((isMultiParticipantActivity(act) && activeParticipant === "both") ? 2 : 1);
                      const userReservedRowsOnThisDay = currentReservations.filter(r => (r.dayId === activeDay.id || r.sheetTab === currentDayTab)).length;
                      const effectiveAvailable = availablePickleSlots + userReservedRowsOnThisDay;
                      const hasPicklePlaces = daySlots.length === 0 || effectiveAvailable >= neededSlots;
                      const isPickleDisabled = bookingLoading[act.id] || isLoadingSlots || (!hasPicklePlaces && daySlots.length > 0);
                      const isSpaDisabled = bookingLoading[act.id] || !activeTime || !activeRowIndex;
                      const isDisabled = isPickle ? isPickleDisabled : isSpaDisabled;

                      // Only show button for Pickleball if there are available places
                      if (isPickle && !hasPicklePlaces && daySlots.length > 0) {
                        return null;
                      }

                      return (
                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-bold leading-snug">
                            Si deseas cancelar la actividad, cambia el botón a NO y se eliminará el registro.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleConfirmReservation(act)}
                            disabled={isDisabled}
                            className={`w-full sm:w-auto shrink-0 px-6 py-3 rounded-xl font-black text-xs md:text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
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
