import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { 
  Users, Calendar, Plane, FileText, AlertTriangle, Bus, Award, 
  MessageSquare, Settings, History, Download, Plus, Search, 
  Trash2, Edit3, Save, CheckCircle, XCircle, X, Sparkles, UploadCloud,
  FileSpreadsheet, UserCheck, User, ShieldAlert, Check, RefreshCw,
  Bed, Mail, Lock, LogIn, Shield, DollarSign, Key, CheckCircle2, PlusCircle,
  ShieldCheck, Filter, ArrowUpDown, ArrowUp, ArrowDown, Gift, ExternalLink, Link, Clock, Code, FileCode, Copy, Info, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Building2, ListFilter, Phone, Loader2, Hotel, Receipt, Calculator, Baby
} from "lucide-react";

type GuestSortField = 'name' | 'distributor_group' | 'total';
type SortDirection = 'asc' | 'desc';
import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig, PortalUser } from "../types";
import { DataStore } from "../dataStore";
import { generateGoogleAppsScriptCode, saveSpaReservationsToSheet } from "../utils/googleSheetsService";
import { GROUPS_DATA, GROUPS_LIST } from "../groupsData";
import LogoConvencion from "../assets/images/Logo_convencion_reducido.png";

interface BackOfficeProps {
  guests: Guest[];
  transportSlots: TransportSlot[];
  activities: Activity[];
  comms: CommMessage[];
  auditLogs: AuditLogEntry[];
  config: EventConfig;
  onUpdate: () => void;
  onSelectGuestForMobileSim: (guest: Guest) => void;
}

export default function BackOffice({
  guests,
  transportSlots,
  activities,
  comms,
  auditLogs,
  config,
  onUpdate,
  onSelectGuestForMobileSim
}: BackOfficeProps) {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("adistem_backoffice_session");
    return !!saved;
  });
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem("adistem_backoffice_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loginError, setLoginError] = useState<string | null>(null);

  // Hotel creation/edit states (Sedes & Tarifas CRUD)
  const [hotelName, setHotelName] = useState<string>("");
  const [costCarnetDoble, setCostCarnetDoble] = useState<number>(0);
  const [costCarnetSencillo, setCostCarnetSencillo] = useState<number>(0);
  const [costDiaAdicionalDoble, setCostDiaAdicionalDoble] = useState<number>(0);
  const [costDiaAdicionalSencillo, setCostDiaAdicionalSencillo] = useState<number>(0);
  const [costNino0a3, setCostNino0a3] = useState<number>(0);
  const [costNino4a11, setCostNino4a11] = useState<number>(0);
  const [costNino12a17, setCostNino12a17] = useState<number>(0);
  const [costAdultoDiaExtra, setCostAdultoDiaExtra] = useState<number>(0);
  const [costCamaExtra, setCostCamaExtra] = useState<number>(0);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);

  // Custom charges in edit guest modal
  const [newChargeDesc, setNewChargeDesc] = useState<string>("");
  const [newChargeAmount, setNewChargeAmount] = useState<number>(0);
  const [editGuestSubTab, setEditGuestSubTab] = useState<string>("general");
  const [bitacoraFilter, setBitacoraFilter] = useState<string>("all");
  const [bitacoraSortAsc, setBitacoraSortAsc] = useState<boolean>(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Selected Day in Logistics Summary
  const [selectedLogisticsDay, setSelectedLogisticsDay] = useState<number>(1);

  // Active Alert Detail Modal
  const [activeAlertDetail, setActiveAlertDetail] = useState<{
    title: string;
    description: string;
    type: 'error' | 'warning' | 'info' | 'success';
    items: string[];
  } | null>(null);

  // State for forms/searches
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Stage 1 Groups Modal states (Dashboard)
  const [showStage1GroupsModal, setShowStage1GroupsModal] = useState<boolean>(false);
  const [showGuestsWithoutFlightsModal, setShowGuestsWithoutFlightsModal] = useState<boolean>(false);
  const [guestsWithoutFlightsSearch, setGuestsWithoutFlightsSearch] = useState<string>("");
  const [stage1GroupFilter, setStage1GroupFilter] = useState<"all" | "registered" | "unregistered">("all");
  const [stage1GroupSearch, setStage1GroupSearch] = useState<string>("");
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);
  const [categoryModalSearch, setCategoryModalSearch] = useState<string>("");
  const [minorsSortField, setMinorsSortField] = useState<"edad" | "enrolled" | "nombre">("edad");
  const [minorsSortDir, setMinorsSortDir] = useState<'asc' | 'desc'>('asc');
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("todos");
  const [filterHotel, setFilterHotel] = useState<string>("todos");
  const [filterType, setFilterType] = useState<string>("todos");

  // Selected guest for detailed file view (expediente modal)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [editedGuestData, setEditedGuestData] = useState<Guest | null>(null);

  // Sorting and pagination for Guest Directory List table
  const [guestSortField, setGuestSortField] = useState<GuestSortField | null>(null);
  const [guestSortDir, setGuestSortDir] = useState<SortDirection>('asc');
  const [guestPageSize, setGuestPageSize] = useState<number>(20);
  const [guestCurrentPage, setGuestCurrentPage] = useState<number>(1);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedGuest) {
        setSelectedGuest(null);
        setIsEditingGuest(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedGuest]);

  // Registrante state variables
  const [registrantEmail, setRegistrantEmail] = useState<string>("");
  const [registrantPassword, setRegistrantPassword] = useState<string>("");
  const [originalRegistrantEmail, setOriginalRegistrantEmail] = useState<string>("");

  // Guest Deletion Confirmation Modal states
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null);
  const [isDeletingGuest, setIsDeletingGuest] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);

  const handleConfirmDeleteGuest = async () => {
    if (!guestToDelete) return;
    setIsDeletingGuest(true);
    setDeleteError(null);
    try {
      const editorName = currentUser?.name || "Administrador ADISTEM";
      const editorEmail = currentUser?.email || "bernardo@fasterling.mx";

      const deletedId = guestToDelete.id;
      const deletedName = guestToDelete.nombreTitular && guestToDelete.apellidosTitular
        ? `${guestToDelete.nombreTitular} ${guestToDelete.apellidosTitular}`
        : guestToDelete.name;

      // 1. Release slots in Google Sheets first before deleting from Firestore
      const reservations = guestToDelete.activityReservations || [];
      if (reservations.length > 0) {
        console.log(`[BackOffice] Liberando ${reservations.length} reservaciones en Google Sheets...`);
        // Group reservations by activityId and sheetTab
        const grouped: { [key: string]: typeof reservations } = {};
        reservations.forEach(r => {
          const tab = r.sheetTab || "Hoja 1";
          const key = `${r.activityId}::${tab}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(r);
        });

        // Process each group and trigger the Google Sheets Apps Script webhook
        for (const key of Object.keys(grouped)) {
          const [actId, tabName] = key.split("::");
          const actResList = grouped[key];
          const actObj = activities.find(a => a.id === actId);
          if (actObj && actObj.googleSheetsWebhookUrl) {
            console.log(`[BackOffice] Liberando ${actResList.length} lugares para la actividad ${actObj.name} (Pestaña: ${tabName})...`);
            try {
              const rowIndicesToClear = actResList.map(r => r.rowIndex).filter((idx): idx is number => idx !== undefined && idx > 0);
              if (rowIndicesToClear.length > 0) {
                const resSheets = await saveSpaReservationsToSheet(
                  actObj,
                  [], // empty array for new reservations to trigger clearing
                  {
                    sheetTab: tabName,
                    previousReservations: actResList,
                    clearedRowIndices: rowIndicesToClear,
                    titularEmail: (guestToDelete.email || "").toUpperCase()
                  }
                );
                if (!resSheets.success) {
                  console.warn(`[BackOffice] Advertencia al sincronizar baja de ${actObj.name} en Sheets:`, resSheets.error);
                }
              }
            } catch (sheetErr) {
              console.error(`[BackOffice] Error al limpiar Google Sheets de ${actObj.name}:`, sheetErr);
            }
          }
        }
      }

      // 2. Now delete from Firestore
      const success = await DataStore.deleteGuest(deletedId, editorName, editorEmail);
      if (!success) {
        throw new Error("No se pudo completar la eliminación del registro en el sistema.");
      }

      onUpdate();
      if (selectedGuest?.id === deletedId) {
        setSelectedGuest(null);
        setIsEditingGuest(false);
        setEditedGuestData(null);
      }
      setGuestToDelete(null);
      setDeleteSuccessToast(`El registro [${deletedId}] de "${deletedName}" fue eliminado exitosamente. Se liberaron los espacios asociados en Google Sheets y la actividad quedó registrada en la Bitácora de Auditoría.`);
      setTimeout(() => {
        setDeleteSuccessToast(null);
      }, 6000);
    } catch (err: any) {
      console.error("Error al eliminar registro de invitado:", err);
      setDeleteError(err?.message || "Ocurrió un error al intentar eliminar el registro.");
    } finally {
      setIsDeletingGuest(false);
    }
  };

  const getHasChanges = () => {
    if (!selectedGuest || !editedGuestData) return false;
    
    // Check guest differences
    const guestChanged = JSON.stringify(selectedGuest) !== JSON.stringify(editedGuestData);
    
    // Check registrant account differences
    const dbUser = DataStore.getUsers().find(u => u.guestId === selectedGuest.id);
    const dbEmail = dbUser?.email || "";
    const dbPassword = dbUser?.password || "";
    
    const registrantChanged = (((registrantEmail || "").trim()) !== dbEmail) || (((registrantPassword || "").trim()) !== dbPassword);
    
    return guestChanged || registrantChanged;
  };

  // New Guest Form State
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [newGuestData, setNewGuestData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    distributor: "",
    role: "Distribuidor Asociado",
    stage: 1 as (1 | 2),
    status: GuestStatus.INCOMPLETE,
    username: "",
    password: ""
  });

  // Event Config Form
  const [editingConfig, setEditingConfig] = useState<EventConfig>({ ...config });

  // Configuration saving states
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveConfigSuccess, setSaveConfigSuccess] = useState(false);

  const getDaysArray = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return [];
    const start = new Date(startStr + "T00:00:00");
    const end = new Date(endStr + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return [];
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const count = Math.min(Math.max(diffDays, 1), 15);
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  const getDayDateLabel = (dayNum: number, startStr?: string) => {
    if (!startStr) return "";
    const start = new Date(startStr + "T00:00:00");
    if (isNaN(start.getTime())) return "";
    start.setDate(start.getDate() + (dayNum - 1));
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return start.toLocaleDateString('es-ES', options);
  };

  const getDayDateString = (dayNum: number, startStr?: string) => {
    if (!startStr) return "";
    const start = new Date(startStr + "T00:00:00");
    if (isNaN(start.getTime())) return "";
    start.setDate(start.getDate() + (dayNum - 1));
    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, '0');
    const dd = String(start.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [newAgendaItem, setNewAgendaItem] = useState({ day: "Día 1", title: "", time: "", description: "" });
  const [selectedEditingDay, setSelectedEditingDay] = useState<number>(1);

  // Bulk Import mock state
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Communication Form State
  const [commForm, setCommForm] = useState({
    subject: "",
    body: "",
    type: "email" as "email" | "push",
    segmentStage: "all" as "all" | 1 | 2,
    segmentStatus: "all" as "all" | GuestStatus
  });

  // Resettle/clear action helper
  const [resetConfirm, setResetConfirm] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  // Version counter for report generation
  const [reportVersion, setReportVersion] = useState(1);
  const [downloadLogs, setDownloadLogs] = useState<Array<{ id: string, reportName: string, version: string, timestamp: string }>>([]);

  // Form formats validation helper
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modal state to view registered guests in a specific activity
  const [selectedActivityForGuests, setSelectedActivityForGuests] = useState<Activity | null>(null);
  const [activityGuestsSearchQuery, setActivityGuestsSearchQuery] = useState("");
  const [activityGuestsDayFilter, setActivityGuestsDayFilter] = useState<string>("all");

  // Modal and view state for Daily Flights (Arrivals & Departures) inspection
  const [selectedFlightModal, setSelectedFlightModal] = useState<{
    type: 'arrival' | 'departure';
    dayGroup: any;
  } | null>(null);
  const [flightModalSearchQuery, setFlightModalSearchQuery] = useState("");
  const [flightViewFilter, setFlightViewFilter] = useState<'both' | 'arrivals' | 'departures'>('both');

  // Backward compatibility state for arrivals modal if referenced
  const [selectedArrivalDay, setSelectedArrivalDay] = useState<{
    dateKey: string;
    dateLabel: string;
    shortLabel: string;
    totalPax: number;
    records: any[];
  } | null>(null);
  const [arrivalSearchQuery, setArrivalSearchQuery] = useState("");

  // Transport Blocks CRUD and flight status states
  const [editingTransportSlot, setEditingTransportSlot] = useState<TransportSlot | null>(null);
  const [showTransportSlotForm, setShowTransportSlotForm] = useState(false);
  const [transportFormState, setTransportFormState] = useState<Omit<TransportSlot, 'assignedCount'>>({
    id: "",
    route: 'Aeropuerto -> Hotel',
    dateTime: "",
    capacity: 40,
    description: ""
  });

  const [editingGuestFlight, setEditingGuestFlight] = useState<{ guestId: string, type: 'arrival' | 'departure' } | null>(null);
  const [actualTimeFormState, setActualTimeFormState] = useState<{ actualDateTime: string }>({
    actualDateTime: ""
  });

  // Activities CRUD states
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [selectedActivityForSlots, setSelectedActivityForSlots] = useState<Activity | null>(null);
  const [selectedDayTabForSlots, setSelectedDayTabForSlots] = useState<string>("");
  const [slotFilterStatus, setSlotFilterStatus] = useState<'all' | 'available' | 'blocked' | 'occupied'>('all');
  const [slotFilterGender, setSlotFilterGender] = useState<'all' | 'Dama' | 'Caballero'>('all');
  const [slotSearchTerm, setSlotSearchTerm] = useState<string>("");
  const [spaSlotsLoading, setSpaSlotsLoading] = useState(false);
  const [spaSlotsList, setSpaSlotsList] = useState<any[]>([]);
  const [spaSlotsError, setSpaSlotsError] = useState<string | null>(null);
  const [spaSlotsSummary, setSpaSlotsSummary] = useState<{ total: number; available: number; blocked: number; occupied: number }>({ total: 0, available: 0, blocked: 0, occupied: 0 });
  const [syncingActivityId, setSyncingActivityId] = useState<string | null>(null);
  const [formSheetTestLoading, setFormSheetTestLoading] = useState(false);
  const [formSheetTestResult, setFormSheetTestResult] = useState<{
    success: boolean;
    totalCount: number;
    availableCount: number;
    blockedCount: number;
    sampleSlots: any[];
    error?: string;
  } | null>(null);
  const [activityFormState, setActivityFormState] = useState<{
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    activityType: 'SPA' | 'PICKLEBALL' | 'BINGO' | 'MOVIE_NIGHTS' | 'GOLF' | 'BUCEO' | 'OTRO';
    googleSheetsUrl: string;
    googleSheetsWebhookUrl: string;
    googleSheetsTab: string;
    daysConfig: Array<{
      id: string;
      date: string;
      label: string;
      googleSheetsTab: string;
    }>;
    eventDay: string;
    timeRange: string;
    dateTime: string;
    capacity: number;
    rules: string;
    category: 'spa' | 'pickleball' | 'bingo' | 'movie_nights' | 'golf' | 'tour' | 'cena' | 'otro' | 'SPA' | 'PICKLEBALL' | 'BINGO' | 'MOVIE_NIGHTS' | 'GOLF' | 'BUCEO' | 'OTRO';
  }>({
    id: "",
    name: "",
    description: "",
    isActive: true,
    activityType: "SPA",
    googleSheetsUrl: "https://docs.google.com/spreadsheets/d/1b3XRN2-3E0LJkb8mclMGqKX0Ld-5Kj5HLCsyeMPYRjo/edit?usp=sharing",
    googleSheetsWebhookUrl: "",
    googleSheetsTab: "Viernes",
    daysConfig: [
      { id: "day-1", date: "2026-05-15", label: "Viernes 15 de Mayo", googleSheetsTab: "Viernes" },
      { id: "day-2", date: "2026-05-16", label: "Sábado 16 de Mayo", googleSheetsTab: "Sábado" }
    ],
    eventDay: "Viernes y Sábado",
    timeRange: "09:00 - 14:00",
    dateTime: "",
    capacity: 20,
    rules: "",
    category: "SPA"
  });

  const [showAppsScriptModal, setShowAppsScriptModal] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [webhookTestLoading, setWebhookTestLoading] = useState<boolean>(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string; raw?: any } | null>(null);

  const isFlightDelayed = (scheduledStr?: string, actualStr?: string): boolean => {
    if (!scheduledStr || !actualStr) return false;
    return new Date(actualStr).getTime() > new Date(scheduledStr).getTime();
  };

  const getFlightDelayMinutes = (scheduledStr?: string, actualStr?: string): number => {
    if (!scheduledStr || !actualStr) return 0;
    const diff = new Date(actualStr).getTime() - new Date(scheduledStr).getTime();
    return diff > 0 ? Math.round(diff / 60000) : 0;
  };

  const handleSaveTransportSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportFormState.dateTime || !transportFormState.description) {
      alert("Por favor completa la fecha, hora y descripción del bloque.");
      return;
    }
    
    const slotData: TransportSlot = {
      id: editingTransportSlot ? editingTransportSlot.id : `transport-${Date.now()}`,
      route: transportFormState.route as any,
      dateTime: transportFormState.dateTime,
      capacity: Number(transportFormState.capacity),
      description: transportFormState.description,
      assignedCount: editingTransportSlot ? editingTransportSlot.assignedCount : 0
    };

    if (editingTransportSlot) {
      DataStore.saveTransportSlot(slotData);
    } else {
      DataStore.addTransportSlot(slotData);
    }

    setShowTransportSlotForm(false);
    setEditingTransportSlot(null);
    onUpdate();
  };

  const handleDeleteTransportSlot = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este bloque de transporte?")) {
      DataStore.deleteTransportSlot(id);
      onUpdate();
    }
  };

  const handleEditTransportSlot = (slot: TransportSlot) => {
    setEditingTransportSlot(slot);
    setTransportFormState({
      id: slot.id,
      route: slot.route,
      dateTime: slot.dateTime,
      capacity: slot.capacity,
      description: slot.description
    });
    setShowTransportSlotForm(true);
  };

  const handleTestSheetConnection = async (tabToTest?: string) => {
    if (!activityFormState.googleSheetsUrl) {
      alert("Por favor ingresa primero la liga de Google Sheets.");
      return;
    }
    const tabName = (typeof tabToTest === 'string' && tabToTest.trim()) ? tabToTest.trim() : ((activityFormState.daysConfig?.[0]?.googleSheetsTab) || (activityFormState.googleSheetsTab || "").trim() || "Hoja 1");
    setFormSheetTestLoading(true);
    setFormSheetTestResult(null);
    try {
      const isPickleOrBingo = activityFormState.activityType === 'PICKLEBALL' || activityFormState.activityType === 'BINGO' || activityFormState.activityType === 'MOVIE_NIGHTS' || activityFormState.category === 'pickleball' || activityFormState.category === 'bingo' || activityFormState.category === 'movie_nights';
      const { fetchSpaSlotsFromSheet, fetchPickleballSlotsFromSheet } = await import("../utils/googleSheetsService");
      const res = isPickleOrBingo 
        ? await fetchPickleballSlotsFromSheet((activityFormState.googleSheetsUrl || "").trim(), tabName, (activityFormState.googleSheetsWebhookUrl || "").trim(), activityFormState.activityType || "PICKLEBALL")
        : await fetchSpaSlotsFromSheet((activityFormState.googleSheetsUrl || "").trim(), tabName, (activityFormState.googleSheetsWebhookUrl || "").trim());
      setFormSheetTestResult({
        success: res.success,
        totalCount: res.totalCount,
        availableCount: res.availableCount,
        blockedCount: res.blockedCount,
        sampleSlots: res.slots.slice(0, 5),
        error: res.error
      });
      if (res.availableCount > 0) {
        setActivityFormState(prev => ({
          ...prev,
          capacity: res.availableCount
        }));
      }
    } catch (err: any) {
      setFormSheetTestResult({
        success: false,
        totalCount: 0,
        availableCount: 0,
        blockedCount: 0,
        sampleSlots: [],
        error: err?.message || "Error al conectar con Google Sheets."
      });
    } finally {
      setFormSheetTestLoading(false);
    }
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityFormState.name || !activityFormState.description) {
      alert("Por favor completa el nombre y la descripción de la actividad.");
      return;
    }

    const activityTypeNormalized = activityFormState.activityType || 'SPA';
    const categoryNormalized = activityTypeNormalized.toLowerCase() as any;

    const parsedCapacity = Number(activityFormState.capacity);
    const finalCapacity = !isNaN(parsedCapacity) && parsedCapacity >= 0 ? parsedCapacity : (editingActivity?.capacity ?? 20);
    const primaryTab = activityFormState.daysConfig?.[0]?.googleSheetsTab || (activityFormState.googleSheetsTab || "").trim() || "Hoja 1";

    const activityData: Activity = {
      id: editingActivity ? editingActivity.id : `act-${Date.now()}`,
      name: activityFormState.name,
      description: activityFormState.description,
      isActive: activityFormState.isActive !== false,
      activityType: activityTypeNormalized,
      googleSheetsUrl: (activityFormState.googleSheetsUrl || "").trim(),
      googleSheetsWebhookUrl: (activityFormState.googleSheetsWebhookUrl || "").trim(),
      googleSheetsTab: primaryTab,
      daysConfig: activityFormState.daysConfig && activityFormState.daysConfig.length > 0 ? activityFormState.daysConfig : undefined,
      eventDay: (activityFormState.eventDay || "").trim(),
      timeRange: (activityFormState.timeRange || "").trim(),
      dateTime: activityFormState.dateTime || `${activityFormState.eventDay} - ${activityFormState.timeRange}`,
      capacity: finalCapacity,
      category: categoryNormalized,
      rules: activityFormState.rules || "",
      registeredCount: editingActivity ? editingActivity.registeredCount : 0,
      waitingList: editingActivity ? editingActivity.waitingList : []
    };

    if (editingActivity) {
      DataStore.saveActivity(activityData);
    } else {
      DataStore.addActivity(activityData);
    }

    setShowActivityForm(false);
    setEditingActivity(null);
    setFormSheetTestResult(null);
    setWebhookTestResult(null);
    onUpdate();
  };

  const handleToggleActivityActive = (act: Activity) => {
    const newActiveState = act.isActive === false ? true : false;
    const updated: Activity = { ...act, isActive: newActiveState };
    DataStore.saveActivity(updated);
    onUpdate();
  };

  const handleTestWebhookConnection = async () => {
    if (!(activityFormState.googleSheetsWebhookUrl || "").trim()) {
      alert("Por favor ingresa primero la URL del Webhook de Google Apps Script.");
      return;
    }
    setWebhookTestLoading(true);
    setWebhookTestResult(null);
    try {
      const { testGoogleAppsScriptWebhook } = await import("../utils/googleSheetsService");
      const targetTab = activityFormState.daysConfig?.[0]?.googleSheetsTab || (activityFormState.googleSheetsTab || "").trim() || "Hoja 1";
      const res = await testGoogleAppsScriptWebhook(
        (activityFormState.googleSheetsWebhookUrl || "").trim(),
        targetTab
      );
      setWebhookTestResult({
        success: res.success,
        message: res.message,
        raw: res.raw
      });
    } catch (err: any) {
      setWebhookTestResult({
        success: false,
        message: err?.message || "Error al conectar con el Webhook de Google Apps Script."
      });
    } finally {
      setWebhookTestLoading(false);
    }
  };

  const handleDeleteActivity = (id: string) => {
    const act = activities.find(a => a.id === id);
    if (act) {
      setActivityToDelete(act);
    }
  };

  const handleConfirmDeleteActivity = () => {
    if (activityToDelete) {
      DataStore.deleteActivity(activityToDelete.id);
      setActivityToDelete(null);
      onUpdate();
    }
  };

  const handleEditActivity = (act: Activity) => {
    setEditingActivity(act);
    setFormSheetTestResult(null);
    setWebhookTestResult(null);
    const actType = (act.activityType || (act.category ? act.category.toUpperCase() : 'SPA')) as any;
    const defaultDays = act.daysConfig && act.daysConfig.length > 0
      ? act.daysConfig
      : [
          { id: "day-1", date: act.dateTime || "2026-05-15", label: act.eventDay || "Día 1", googleSheetsTab: act.googleSheetsTab || "Viernes" }
        ];

    const isPickle = actType === 'PICKLEBALL' || (act.category && act.category.toLowerCase() === 'pickleball') || (act.name && act.name.toLowerCase().includes('pickleball'));
    const isBingo = actType === 'BINGO' || (act.category && act.category.toLowerCase() === 'bingo') || (act.name && act.name.toLowerCase().includes('bingo'));
    const isMovieNights = actType === 'MOVIE_NIGHTS' || actType === 'MOVIE NIGHTS' || (act.category && act.category.toLowerCase() === 'movie_nights') || (act.name && act.name.toLowerCase().includes('movie'));
    const resolvedType = isMovieNights ? 'MOVIE_NIGHTS' : (isBingo ? 'BINGO' : (isPickle ? 'PICKLEBALL' : (['SPA', 'PICKLEBALL', 'BINGO', 'MOVIE_NIGHTS', 'GOLF', 'BUCEO', 'OTRO'].includes(actType) ? actType : 'SPA')));

    setActivityFormState({
      id: act.id || "",
      name: act.name || "",
      description: act.description || "",
      isActive: act.isActive !== false,
      activityType: resolvedType as any,
      googleSheetsUrl: act.googleSheetsUrl || "",
      googleSheetsWebhookUrl: act.googleSheetsWebhookUrl || "",
      googleSheetsTab: act.googleSheetsTab || (defaultDays[0]?.googleSheetsTab || "Viernes"),
      daysConfig: defaultDays,
      eventDay: act.eventDay || "Viernes y Sábado",
      timeRange: act.timeRange || "09:00 - 14:00",
      dateTime: act.dateTime || "",
      capacity: act.capacity ?? 20,
      category: (isMovieNights ? 'movie_nights' : isBingo ? 'bingo' : isPickle ? 'pickleball' : (act.category || "SPA")) as any,
      rules: act.rules || ""
    });
    setShowActivityForm(true);
  };

  const loadSlotsForActivityTab = async (act: Activity, tabName: string) => {
    setSpaSlotsLoading(true);
    setSpaSlotsError(null);
    try {
      const isPickleOrBingo = act.activityType === 'PICKLEBALL' || act.activityType === 'BINGO' || act.activityType === 'MOVIE_NIGHTS' || act.category === 'pickleball' || act.category === 'bingo' || act.category === 'movie_nights';
      const { fetchSpaSlotsFromSheet, fetchPickleballSlotsFromSheet } = await import("../utils/googleSheetsService");
      const res = isPickleOrBingo
        ? await fetchPickleballSlotsFromSheet(act.googleSheetsUrl || "", tabName, act.googleSheetsWebhookUrl, act.activityType || "PICKLEBALL")
        : await fetchSpaSlotsFromSheet(act.googleSheetsUrl || "", tabName, act.googleSheetsWebhookUrl);
      setSpaSlotsList(res.slots || []);
      setSpaSlotsSummary({
        total: res.totalCount || res.slots?.length || 0,
        available: res.availableCount || (res.slots || []).filter((s: any) => !s.isBlocked && !s.isOccupied).length,
        blocked: res.blockedCount || (res.slots || []).filter((s: any) => s.isBlocked).length,
        occupied: res.occupiedCount || (res.slots || []).filter((s: any) => s.isOccupied).length
      });
      if (res.error) {
        setSpaSlotsError(res.error);
      }
    } catch (e: any) {
      setSpaSlotsError(e?.message || "Error al cargar la información de slots.");
    } finally {
      setSpaSlotsLoading(false);
    }
  };

  const handleOpenSlotsModal = async (act: Activity, specificTab?: string) => {
    setSelectedActivityForSlots(act);
    const initialTab = specificTab || act.daysConfig?.[0]?.googleSheetsTab || act.googleSheetsTab || "Viernes";
    setSelectedDayTabForSlots(initialTab);
    setSlotFilterStatus('all');
    setSlotFilterGender('all');
    setSlotSearchTerm("");
    await loadSlotsForActivityTab(act, initialTab);
  };

  const handleSyncActivityWithSheets = async (act: Activity) => {
    try {
      setSyncingActivityId(act.id);
      const res = await DataStore.syncActivityWithGoogleSheets(
        act.id,
        currentUser?.name || "Administrador Staff",
        currentUser?.email || "admin@adistem.com.mx"
      );
      if (res.success) {
        alert(res.message);
      } else {
        alert(`Error: ${res.message}`);
      }
    } catch (err: any) {
      alert(`Error al sincronizar: ${err?.message || err}`);
    } finally {
      setSyncingActivityId(null);
    }
  };

  const handleSaveActualFlightTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuestFlight) return;
    
    const guest = guests.find(g => g.id === editingGuestFlight.guestId);
    if (!guest) return;

    const updatedGuest = { ...guest };
    const actualTime = actualTimeFormState.actualDateTime;

    if (editingGuestFlight.type === 'arrival' && updatedGuest.flightArrival) {
      updatedGuest.flightArrival = {
        ...updatedGuest.flightArrival,
        ...({ actualDateTime: actualTime } as any)
      };
    } else if (editingGuestFlight.type === 'departure' && updatedGuest.flightDeparture) {
      updatedGuest.flightDeparture = {
        ...updatedGuest.flightDeparture,
        ...({ actualDateTime: actualTime } as any)
      };
    }

    const result = DataStore.saveGuest(updatedGuest, "Coordinador Staff", "coordinador@adistem.org", true);
    if (result.success) {
      setEditingGuestFlight(null);
      onUpdate();
    } else {
      alert(result.error);
    }
  };

  // Reset local state if external config updates
  useEffect(() => {
    setEditingConfig({ ...config });
  }, [config]);

  // Sync with Firestore simulation
  const handleFirestoreSync = () => {
    setIsSyncing(true);
    setSyncMessage("Estableciendo conexión segura con Firebase...");
    setTimeout(() => {
      setSyncMessage("Sincronizando esquemas en Firestore...");
      setTimeout(() => {
        DataStore.recalculateCounts();
        onUpdate();
        setIsSyncing(false);
        setSyncMessage("Base de datos de Firebase Firestore actualizada correctamente.");
        setTimeout(() => setSyncMessage(""), 4000);
      }, 1000);
    }, 1000);
  };

  // Helper: Format Dates
  const formatDate = (isoStr: string | undefined) => {
    if (!isoStr) return "Pendiente";
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? isoStr : d.toLocaleString("es-MX", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
  };

  const handleSaveConfig = () => {
    setIsSavingConfig(true);
    setSaveConfigSuccess(false);

    // Simulate database write & recalculation transition for excellent feedback
    setTimeout(() => {
      try {
        DataStore.saveEventConfig(editingConfig, "Coordinador Staff", "staff@adistem.com.mx");
        onUpdate();
        setIsSavingConfig(false);
        setSaveConfigSuccess(true);
        
        // Auto-clear success state after 4 seconds
        setTimeout(() => {
          setSaveConfigSuccess(false);
        }, 4000);
      } catch (error) {
        setIsSavingConfig(false);
        alert("Ocurrió un error al guardar la configuración: " + (error instanceof Error ? error.message : String(error)));
      }
    }, 850);
  };

  const handleAddAgendaItem = () => {
    if (!newAgendaItem.title || !newAgendaItem.time) {
      alert("Por favor completa el título y horario de la actividad de agenda.");
      return;
    }
    const updatedAgenda = [...editingConfig.agenda, newAgendaItem];
    const newConf = { ...editingConfig, agenda: updatedAgenda };
    setEditingConfig(newConf);
    setNewAgendaItem({ day: "Día 1", title: "", time: "", description: "" });
  };

  const handleDeleteAgendaItem = (index: number) => {
    const updatedAgenda = editingConfig.agenda.filter((_, i) => i !== index);
    setEditingConfig({ ...editingConfig, agenda: updatedAgenda });
  };

  // Bulk Excel/CSV simulated import
  const handleBulkImport = () => {
    if (!importText || !importText.trim()) {
      alert("Por favor ingresa datos en formato de texto tabulado o separado por comas.");
      return;
    }

    const lines = importText.split("\n");
    let count = 0;
    let duplicateCount = 0;
    const existingGuests = DataStore.getGuests();

    lines.forEach(line => {
      const parts = line.split(/[,\t]/);
      if (parts.length >= 3) {
        const id = parts[0] ? parts[0].trim() : "";
        const name = parts[1] ? parts[1].trim() : "";
        const email = parts[2] ? parts[2].trim() : "";
        const distributor = parts[3] ? parts[3].trim() : "Distribuidor Stellantis";
        const role = parts[4] ? parts[4].trim() : "Asociado";
        const stageVal = parts[5] && parts[5].trim() === "2" ? 2 : 1;

        if (id && name && email) {
          const duplicate = existingGuests.some(g => g.id === id || (g.email && g.email.toLowerCase() === email.toLowerCase()));
          if (!duplicate) {
            const newG: Guest = {
              id,
              name,
              email,
              phone: parts[6] ? parts[6].trim() : "5512345678",
              distributor,
              role,
              status: GuestStatus.INCOMPLETE,
              stage: stageVal,
              companions: [],
              allergies: [],
              allergiesCustom: "",
              specialRequirements: "",
              selectedActivities: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            existingGuests.push(newG);
            count++;
          } else {
            duplicateCount++;
          }
        }
      }
    });

    if (count > 0) {
      DataStore.saveGuestsRaw(existingGuests);
      DataStore.addAuditLog({
        userId: "Staff - Carga Masiva",
        userEmail: "staff@adistem.com.mx",
        action: "Carga Masiva de Invitados",
        details: `Se importaron exitosamente ${count} nuevos invitados desde archivo. ${duplicateCount} duplicados omitidos.`
      });
      onUpdate();
      setImportStatus(`¡Éxito! Se importaron ${count} invitados. ${duplicateCount} registros ya existían y fueron omitidos.`);
      setImportText("");
    } else {
      setImportStatus(`Ningún invitado nuevo importado. Se detectaron ${duplicateCount} duplicados o datos inválidos.`);
    }
  };

  // Add individual guest
  const handleAddIndividualGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!newGuestData.id || !newGuestData.id.match(/^ADI-\d{4}$/)) {
      errors.id = "El código debe tener el formato ADI-XXXX (ej: ADI-1234)";
    }
    if (!newGuestData.name || !newGuestData.name.trim()) {
      errors.name = "El nombre completo es requerido";
    }
    if (!newGuestData.email || !newGuestData.email.includes("@")) {
      errors.email = "El correo electrónico no es válido";
    }
    if (!newGuestData.distributor || !newGuestData.distributor.trim()) {
      errors.distributor = "El distribuidor/agencia es un campo obligatorio";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newG: Guest = {
      ...newGuestData,
      puesto: newGuestData.role || "Dueño",
      username: (newGuestData.username || "").trim() || (newGuestData.email || "").trim().toLowerCase(),
      password: (newGuestData.password || "").trim() || (newGuestData.id || "").trim().toUpperCase(),
      companions: [],
      allergies: [],
      allergiesCustom: "",
      specialRequirements: "",
      selectedActivities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = DataStore.addGuest(newG, "Staff - Juan Manuel", "staff@adistem.com.mx");
    if (res.success) {
      onUpdate();
      setIsAddingGuest(false);
      setNewGuestData({
        id: "",
        name: "",
        email: "",
        phone: "",
        distributor: "",
        role: "Distribuidor Asociado",
        stage: 1,
        status: GuestStatus.INCOMPLETE,
        username: "",
        password: ""
      });
      setFormErrors({});
      alert("Invitado agregado correctamente.");
    } else {
      alert(res.error || "Ocurrió un error.");
    }
  };

  // Normalize guest data when opening modal so adult companions are strictly separated from minors/additional companions
  const normalizeGuestForModal = (g: Guest): Guest => {
    let cleanGuest: Guest;
    try {
      cleanGuest = JSON.parse(JSON.stringify(g));
    } catch (e) {
      cleanGuest = { ...g };
    }

    // Separate primary adult companions from minors / additional companions (M- IDs, minors, adicionales)
    const rawComps = Array.isArray(cleanGuest.companions) ? cleanGuest.companions : [];
    const adultComps = rawComps.filter(c => {
      if (c.id && c.id.startsWith("M-")) return false;
      if (c.relationship && (c.relationship.includes("Menor") || c.relationship.includes("Adicional"))) return false;
      if ((c as any).tipo === "minor") return false;
      return true;
    });

    // If cleanGuest.minors is empty or missing, but rawComps has minors/adicionales, recover them into minors
    if ((!cleanGuest.minors || cleanGuest.minors.length === 0) && rawComps.length > adultComps.length) {
      const recoveredMinors = rawComps.filter(c => {
        return (c.id && c.id.startsWith("M-")) ||
               (c.relationship && (c.relationship.includes("Menor") || c.relationship.includes("Adicional"))) ||
               ((c as any).tipo === "minor");
      }).map((c, idx) => {
        const isAdult = (c as any).tipo === "adult" || (c.relationship && c.relationship.includes("Adulto"));
        return {
          id: c.id || `M-${idx + 1}`,
          name: c.firstName || (c.name ? c.name.split(' ')[0] : "") || "",
          lastName: c.lastName || (c.name ? c.name.split(' ').slice(1).join(' ') : "") || "",
          age: (c as any).age !== undefined ? (c as any).age : (isAdult ? 18 : 5),
          sex: c.sex || "F",
          allergies: c.allergies || "",
          tipo: (c as any).tipo || (isAdult ? "adult" : "minor"),
          parentezco: (c as any).parentezco || (isAdult ? "Otro" : "Hijo")
        };
      });
      cleanGuest.minors = recoveredMinors;
      cleanGuest.numMenores = recoveredMinors.length;
    }

    cleanGuest.companions = adultComps;
    return cleanGuest;
  };

  // Select guest and immediately enter edit mode
  const handleSelectGuestForEditing = (g: Guest) => {
    const cleanGuest = normalizeGuestForModal(g);
    setSelectedGuest(cleanGuest);
    setEditedGuestData(cleanGuest);

    // Find matching portal user
    const u = DataStore.getUsers().find(user => user.guestId === g.id);
    if (u) {
      setRegistrantEmail(u.email || "");
      setRegistrantPassword(u.password || "");
      setOriginalRegistrantEmail(u.email || "");
    } else {
      setRegistrantEmail("");
      setRegistrantPassword("");
      setOriginalRegistrantEmail("");
    }

    setIsEditingGuest(true);
    setEditGuestSubTab("general");
  };

  // Save guest edits from Staff override
  const handleSaveEditedGuest = () => {
    if (!editedGuestData) return;
    const editorRole = currentUser ? `Staff - ${currentUser.role}` : "Staff Override";
    const editorEmail = currentUser ? currentUser.email : "staff@adistem.com.mx";

    // Synchronize companions array with minors & additional companions for persistent storage
    const baseCompanions = (editedGuestData.companions || []).filter(c => 
      !c.id?.startsWith("M-") && 
      !c.relationship?.includes("Menor") && 
      !c.relationship?.includes("Adicional") &&
      (c as any).tipo !== "minor"
    );

    const combinedCompanionsForStorage = [...baseCompanions];

    if (editedGuestData.minors) {
      editedGuestData.minors.forEach((m, idx) => {
        const mName = (m.name || "").trim();
        const mLastName = (m.lastName || "").trim();
        const mFullName = `${mName} ${mLastName}`.trim();
        const isAdult = m.tipo === "adult";
        const minorRel = m.parentezco 
          ? `${m.parentezco} (Edad: ${m.age === 0 ? "0-11 meses" : `${m.age || 0} años`}${m.age >= 12 ? " - Plan de alimentación adulto" : ""})`
          : `Menor (Edad: ${m.age === 0 ? "0-11 meses" : `${m.age || 0} años`}${m.age >= 12 ? " - Plan de alimentación adulto" : ""})`;
        combinedCompanionsForStorage.push({
          id: `M-${idx + 1}`,
          name: mFullName ? mFullName : (isAdult ? `Acompañante Adicional #${idx + 1} (Adulto)` : `Menor #${idx + 1} (${m.age === 0 ? "0-11 meses" : `${m.age || 0} años`})`),
          relationship: isAdult ? (m.parentezco ? `${m.parentezco} (Adulto Adicional)` : "Acompañante Adicional (Adulto)") : minorRel,
          allergies: m.allergies,
          requirements: "",
          sex: m.sex || "F",
          tipo: m.tipo || (m.age >= 18 ? "adult" : "minor"),
          parentezco: m.parentezco || (m.tipo === "adult" ? "Otro" : "Hijo"),
          age: m.age
        });
      });
    }

    const guestToSave: Guest = {
      ...editedGuestData,
      companions: combinedCompanionsForStorage,
      numMenores: (editedGuestData.minors || []).length
    };
    
    // Save Guest
    const res = DataStore.saveGuest(guestToSave, editorRole, editorEmail, true);
    if (res.success) {
      // Save/Update Portal User (Registrante)
      const cleanRegEmail = (registrantEmail || "").trim();
      const cleanRegPassword = (registrantPassword || "").trim();
      if (cleanRegEmail) {
        const users = DataStore.getUsers();
        
        if (originalRegistrantEmail && originalRegistrantEmail.toLowerCase() !== cleanRegEmail.toLowerCase()) {
          // Delete old user
          DataStore.deleteUser(originalRegistrantEmail);
          
          // Create new user
          const newUser: PortalUser = {
            id: cleanRegEmail.toLowerCase(),
            email: cleanRegEmail.toLowerCase(),
            password: cleanRegPassword,
            role: "Invitado",
            guestId: editedGuestData.id
          };
          DataStore.addUser(newUser);
        } else if (originalRegistrantEmail) {
          // Update existing user
          const existingUser = users.find(u => u.email.toLowerCase() === originalRegistrantEmail.toLowerCase());
          if (existingUser) {
            const updatedUser: PortalUser = {
              ...existingUser,
              password: cleanRegPassword
            };
            DataStore.saveUser(updatedUser);
          }
        } else {
          // Create new user
          const newUser: PortalUser = {
            id: cleanRegEmail.toLowerCase(),
            email: cleanRegEmail.toLowerCase(),
            password: cleanRegPassword,
            role: "Invitado",
            guestId: editedGuestData.id
          };
          DataStore.addUser(newUser);
        }
      } else if (originalRegistrantEmail) {
        // If registrant email was cleared, delete old user
        DataStore.deleteUser(originalRegistrantEmail);
      }

      const cleanSavedGuest: Guest = {
        ...guestToSave,
        companions: baseCompanions
      };
      setSelectedGuest(cleanSavedGuest);
      setEditedGuestData(cleanSavedGuest);
      setIsEditingGuest(false);
      onUpdate();
      alert("Ficha de invitado y cuenta de registrante modificados correctamente.");
    } else {
      alert(res.error || "Error al actualizar.");
    }
  };

  // Login / Logout Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const users = DataStore.getUsers();
    const foundUser = users.find(
      u => u.email.toLowerCase() === adminEmail.toLowerCase() && u.password === adminPassword
    );

    if (!foundUser) {
      setLoginError("Usuario o contraseña incorrectos.");
      return;
    }

    if (foundUser.role === "Staff" || foundUser.role === "Admin") {
      setCurrentUser(foundUser);
      setIsLoggedIn(true);
      localStorage.setItem("adistem_backoffice_session", JSON.stringify(foundUser));
    } else {
      setLoginError("Acceso denegado. Tu perfil no tiene acceso a esta consola.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAdminEmail("");
    setAdminPassword("");
    localStorage.removeItem("adistem_backoffice_session");
  };

  // Hotel Sedes & Tarifas CRUD handlers
  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === "Staff") {
      alert("Error: Tu cuenta de Staff no tiene permisos para modificar Sedes.");
      return;
    }

    if (!hotelName || !hotelName.trim()) {
      alert("El nombre de la sede es obligatorio.");
      return;
    }

    const hotelData = {
      id: editingHotelId || `H-${Date.now()}`,
      name: (hotelName || "").trim(),
      costCarnetDoble: Number(costCarnetDoble),
      costCarnetSencillo: Number(costCarnetSencillo),
      costDiaAdicionalDoble: Number(costDiaAdicionalDoble),
      costDiaAdicionalSencillo: Number(costDiaAdicionalSencillo),
      costNino0a3: Number(costNino0a3),
      costNino4a11: Number(costNino4a11),
      costNino12a17: Number(costNino12a17),
      costAdultoDiaExtra: Number(costAdultoDiaExtra),
      costCamaExtra: Number(costCamaExtra),
      costSencilla: Number(costCarnetSencillo),
      costDoble: Number(costCarnetDoble)
    };

    if (editingHotelId) {
      DataStore.saveHotel(hotelData);
      alert(`Sede "${hotelName}" actualizada con éxito.`);
    } else {
      DataStore.addHotel(hotelData);
      alert(`Sede "${hotelName}" registrada con éxito.`);
    }

    // Reset fields
    setHotelName("");
    setCostCarnetDoble(0);
    setCostCarnetSencillo(0);
    setCostDiaAdicionalDoble(0);
    setCostDiaAdicionalSencillo(0);
    setCostNino0a3(0);
    setCostNino4a11(0);
    setCostNino12a17(0);
    setCostAdultoDiaExtra(0);
    setCostCamaExtra(0);
    setEditingHotelId(null);
    onUpdate();
  };

  const handleEditHotelClick = (h: any) => {
    if (currentUser?.role === "Staff") {
      alert("Error: Tu cuenta de Staff no tiene permisos para modificar Sedes.");
      return;
    }
    setEditingHotelId(h.id);
    setHotelName(h.name);
    setCostCarnetDoble(h.costCarnetDoble ?? h.costDoble ?? 0);
    setCostCarnetSencillo(h.costCarnetSencillo ?? h.costSencilla ?? 0);
    setCostDiaAdicionalDoble(h.costDiaAdicionalDoble ?? (h.costDoble ? Math.round(h.costDoble / 3) : 0));
    setCostDiaAdicionalSencillo(h.costDiaAdicionalSencillo ?? (h.costSencilla ? Math.round(h.costSencilla / 3) : 0));
    setCostNino0a3(h.costNino0a3 ?? 0);
    setCostNino4a11(h.costNino4a11 ?? 0);
    setCostNino12a17(h.costNino12a17 ?? 0);
    setCostAdultoDiaExtra(h.costAdultoDiaExtra ?? 0);
    setCostCamaExtra(h.costCamaExtra ?? 0);
  };

  const handleDeleteHotel = (id: string, name: string) => {
    if (currentUser?.role === "Staff") {
      alert("Error: Tu cuenta de Staff no tiene permisos para modificar Sedes.");
      return;
    }
    if (confirm(`¿Estás seguro de eliminar la sede "${name}"? Se perderán las configuraciones asociadas.`)) {
      DataStore.deleteHotel(id);
      alert(`Sede "${name}" eliminada.`);
      onUpdate();
    }
  };

  // Helper completo para determinar el índice correlativo del carnet dentro de su grupo
  // Política de evento: El 1er y 2do carnet del grupo son base; del 3er carnet en adelante aplica recargo de $10,000 MXN
  const getCarnetIndexInGroup = (guestId?: string, roomIndex: number = 0, currentList: Guest[] = guests): number => {
    if (!guestId) return roomIndex + 1;
    const targetGuest = currentList.find(x => x.id === guestId);
    if (!targetGuest) return roomIndex + 1;
    const groupName = (targetGuest.grupo || "Stellantis").trim().toLowerCase();
    const groupGuests = currentList.filter(x => (x.grupo || "Stellantis").trim().toLowerCase() === groupName);

    // Ordenar de forma consistente por fecha de registro o por ID
    groupGuests.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id);
    });

    let priorCarnets = 0;
    for (const item of groupGuests) {
      if (item.id === guestId) {
        break;
      }
      priorCarnets += Math.max(1, item.numHabitaciones || 1);
    }
    return priorCarnets + roomIndex + 1;
  };

  // Helper completo para cálculo financiero detallado por Carnet / Habitación
  const calculateCarnetFinancials = (g: any, customHotel?: any, carnetIndexInGroup?: number) => {
    const hotels = DataStore.getHotels();
    const hotelSedeName = g.hotelAlojamiento || g.hotel || config?.hotelSede || "Rosewood Mandarina";
    const hotel = customHotel || hotels.find((h: any) => h.name === hotelSedeName) || hotels[0];

    const hasCompanion = !!(g.nombreAcompanante || (g.companions && g.companions.length > 0));
    const tipoHab = g.carnetTipoHabitacion || (hasCompanion ? "Doble" : "Sencilla");
    const isDoble = tipoHab.toLowerCase().includes("doble") || hasCompanion;

    // 1. Costo Carnet por el Evento (no por día)
    const costoCarnetEvento = hotel
      ? (isDoble ? (hotel.costCarnetDoble ?? hotel.costDoble ?? 0) : (hotel.costCarnetSencillo ?? hotel.costSencilla ?? 0))
      : 0;

    // 2. Días Adicionales Carnet (costo por día)
    const nochesAdicionales = Math.max(0, g.nochesAdicionales || 0);
    const costoDiaAdicionalCarnet = hotel
      ? (isDoble 
          ? (hotel.costDiaAdicionalDoble ?? (hotel.costCarnetDoble ? Math.round(hotel.costCarnetDoble / 3) : 0))
          : (hotel.costDiaAdicionalSencillo ?? (hotel.costCarnetSencillo ? Math.round(hotel.costCarnetSencillo / 3) : 0)))
      : 0;
    const totalDiasAdicionalesCarnet = nochesAdicionales * costoDiaAdicionalCarnet;

    // 3. Desglose de menores y adultos extra
    const minors = g.minors || [];
    let count0a3 = 0;
    let count4a11 = 0;
    let count12a17 = 0;
    let countAdultoExtra = 0;

    if (Array.isArray(minors) && minors.length > 0) {
      minors.forEach((m: any) => {
        const isAdultType = m.tipo === "adult" || (m.relationship && m.relationship.toLowerCase().includes("adulto"));
        const age = typeof m.age === "number" ? m.age : parseInt(String(m.age || "0"), 10);
        if (isAdultType || age >= 18) {
          countAdultoExtra++;
        } else if (age <= 3) {
          count0a3++;
        } else if (age <= 11) {
          count4a11++;
        } else {
          count12a17++;
        }
      });
    } else if (g.edadMenores) {
      const agesArr = Array.isArray(g.edadMenores) ? g.edadMenores : [g.edadMenores];
      agesArr.forEach((ageRaw: any) => {
        const age = parseInt(String(ageRaw || "0"), 10);
        if (age >= 18) countAdultoExtra++;
        else if (age <= 3) count0a3++;
        else if (age <= 11) count4a11++;
        else count12a17++;
      });
    } else if (g.numMenores && g.numMenores > 0) {
      count4a11 = g.numMenores;
    }

    // Acompañantes adultos adicionales en companions (más allá del 1er acompañante incluido en carnet Doble)
    if (Array.isArray(g.companions) && g.companions.length > 1) {
      const extraAdultComps = g.companions.slice(1).filter((c: any) => {
        if (c.id && c.id.startsWith("M-")) return false; // Ya contabilizado en minors
        if (c.tipo === "minor" || (c.relationship && c.relationship.toLowerCase().includes("menor"))) return false;
        return true;
      }).length;
      countAdultoExtra += extraAdultComps;
    }

    if (typeof g.numAdultosExtra === 'number' && g.numAdultosExtra > countAdultoExtra) {
      countAdultoExtra = g.numAdultosExtra;
    } else if (typeof g.adultosExtra === 'number' && g.adultosExtra > countAdultoExtra) {
      countAdultoExtra = g.adultosExtra;
    }

    const diasEstanciaTotal = Math.max(1, 3 + nochesAdicionales);

    const costoDiaNino0a3 = hotel?.costNino0a3 ?? 0;
    const totalNinos0a3 = count0a3 * costoDiaNino0a3 * diasEstanciaTotal;

    const costoDiaNino4a11 = hotel?.costNino4a11 ?? 0;
    const totalNinos4a11 = count4a11 * costoDiaNino4a11 * diasEstanciaTotal;

    const costoDiaNino12a17 = hotel?.costNino12a17 ?? 0;
    const totalNinos12a17 = count12a17 * costoDiaNino12a17 * diasEstanciaTotal;

    // 4. Adulto día extra
    const costoAdultoDiaExtra = hotel?.costAdultoDiaExtra ?? 8500;
    const totalAdultoDiaExtra = countAdultoExtra * costoAdultoDiaExtra * diasEstanciaTotal;

    // 5. Cama extra
    const hasCamaExtra = !!(g.camaExtra || (g.configuracionHabitacion && g.configuracionHabitacion.toLowerCase().includes("cama extra")));
    const costoCamaExtra = hotel?.costCamaExtra ?? 0;
    const totalCamaExtra = hasCamaExtra ? costoCamaExtra * diasEstanciaTotal : 0;

    const totalCargosManuales = (g.costosAdicionales || []).reduce((sum: number, c: any) => sum + (c.monto || 0), 0);

    // 6. Recargo 3er carnet en adelante del mismo grupo: $10,000 pesos por cada carnet a partir del tercero
    const effectiveCarnetIndex = typeof carnetIndexInGroup === 'number'
      ? carnetIndexInGroup
      : getCarnetIndexInGroup(g.id, 0);
    const recargoTercerCarnet = effectiveCarnetIndex >= 3 ? 10000 : 0;

    const totalGeneralCarnet = costoCarnetEvento + totalDiasAdicionalesCarnet + totalNinos0a3 + totalNinos4a11 + totalNinos12a17 + totalAdultoDiaExtra + totalCamaExtra + totalCargosManuales + recargoTercerCarnet;

    const isAdistem = (g.grupo || "").trim().toUpperCase() === "ADISTEM";
    if (isAdistem) {
      return {
        hotelName: hotel?.name || hotelSedeName,
        isDoble,
        tipoHab,
        costoCarnetEvento: 0,
        nochesAdicionales,
        costoDiaAdicionalCarnet: 0,
        totalDiasAdicionalesCarnet: 0,
        diasEstanciaTotal,
        count0a3,
        costoDiaNino0a3: 0,
        totalNinos0a3: 0,
        count4a11,
        costoDiaNino4a11: 0,
        totalNinos4a11: 0,
        count12a17,
        costoDiaNino12a17: 0,
        totalNinos12a17: 0,
        countAdultoExtra,
        costoAdultoDiaExtra: 0,
        totalAdultoDiaExtra: 0,
        hasCamaExtra,
        costoCamaExtra: 0,
        totalCamaExtra: 0,
        totalCargosManuales: 0,
        effectiveCarnetIndex,
        recargoTercerCarnet: 0,
        totalGeneralCarnet: 0
      };
    }

    return {
      hotelName: hotel?.name || hotelSedeName,
      isDoble,
      tipoHab,
      costoCarnetEvento,
      nochesAdicionales,
      costoDiaAdicionalCarnet,
      totalDiasAdicionalesCarnet,
      diasEstanciaTotal,
      count0a3,
      costoDiaNino0a3,
      totalNinos0a3,
      count4a11,
      costoDiaNino4a11,
      totalNinos4a11,
      count12a17,
      costoDiaNino12a17,
      totalNinos12a17,
      countAdultoExtra,
      costoAdultoDiaExtra,
      totalAdultoDiaExtra,
      hasCamaExtra,
      costoCamaExtra,
      totalCamaExtra,
      totalCargosManuales,
      effectiveCarnetIndex,
      recargoTercerCarnet,
      totalGeneralCarnet
    };
  };

  const getGuestTotalCost = (g: any): number => {
    const habCount = Math.max(1, g.numHabitaciones || 1);
    let total = 0;
    for (let r = 0; r < habCount; r++) {
      const carnetIdx = getCarnetIndexInGroup(g.id, r);
      const carnetGuestObj = r === 0 ? g : {
        ...g,
        companions: [],
        nombreAcompanante: undefined,
        minors: [],
        numMenores: 0,
        carnetTipoHabitacion: "Sencilla"
      };
      total += calculateCarnetFinancials(carnetGuestObj, undefined, carnetIdx).totalGeneralCarnet;
    }
    return total;
  };

  const getGuestHotelCost = (g: any): number => {
    return getGuestTotalCost(g);
  };

  const handleExportToExcel = async () => {
    let totalCarnets = 0;
    let totalTitulares = 0;
    let totalCompMujeres = 0;
    let totalCompHombres = 0;
    let totalMenores = 0;
    let totalHabSencilla = 0;
    let totalHabDoble = 0;
    let totalHabitaciones = 0;
    let totalNochesAdicionales = 0;
    let totalGeneral = 0;
    let totalRegaloTitular = 0;
    let totalRegaloMujer = 0;
    let totalRegaloHombre = 0;

    let totalCostoCarnetEvento = 0;
    let totalDiasAdicionalesCarnetSuma = 0;
    let totalCount0a3 = 0;
    let totalNinos0a3Suma = 0;
    let totalCount4a11 = 0;
    let totalNinos4a11Suma = 0;
    let totalCount12a17 = 0;
    let totalNinos12a17Suma = 0;
    let totalAdultoDiaExtraSuma = 0;
    let totalCamaExtraSuma = 0;
    let totalCargosManualesSuma = 0;
    let totalRecargo3erCarnetSuma = 0;

    let totalCenaConsejo = 0;
    let totalAsistentesJuntaConsejo = 0;

    let totalLlegada4 = 0;
    let totalLlegada5 = 0;
    let totalLlegada6 = 0;
    let totalLlegada7 = 0;
    let totalLlegada8 = 0;

    let totalSalida9 = 0;
    let totalSalida10 = 0;
    let totalSalida11 = 0;
    let totalSalida12 = 0;

    let totalRegalosHombre = 0;
    let totalRegalosMujer = 0;
    let totalRegalosAdicionalesAdultosHombre = 0;
    let totalRegalosAdicionalesAdultosMujer = 0;

    const activitiesList = DataStore.getActivities();
    const sourceGuests = (guests && guests.length > 0) ? guests : DataStore.getGuests();

    const excelData: Array<Record<string, any>> = [];

    // Categorías de huésped oficiales en orden prioritario
    const officialCategories = ["Distribuidores", "VIP", "Planta", "Financiera", "Externo", "Staff"];
    const detectedCategories = Array.from(new Set(
      sourceGuests.map(g => {
        const cat = (g.tipoHuesped || "Distribuidores").trim();
        return (cat.toLowerCase() === "convencionista" || cat.toLowerCase() === "convencionistas") ? "Externo" : cat;
      })
    ));

    const exportCategoryOrder: string[] = [];
    officialCategories.forEach(c => {
      if (detectedCategories.some(dc => dc.toLowerCase() === c.toLowerCase())) {
        exportCategoryOrder.push(c);
      }
    });
    detectedCategories.forEach(dc => {
      if (!exportCategoryOrder.some(c => c.toLowerCase() === dc.toLowerCase())) {
        exportCategoryOrder.push(dc);
      }
    });

    // Clean flight date formatter
    const getCleanFlightDate = (fechaStr?: string, flightInfo?: any, isArrival: boolean = true): string => {
      let raw = (fechaStr || "").trim();
      if (!raw && flightInfo) {
        raw = (isArrival ? (flightInfo.arrivalDateTime || flightInfo.departureDateTime) : (flightInfo.departureDateTime || flightInfo.arrivalDateTime)) || "";
      }
      if (!raw || raw === "N/A") return "";

      // 1. If YYYY-MM-DD
      const ymdMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (ymdMatch) {
        const [, y, m, d] = ymdMatch;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }

      // 2. If DD/MM/YYYY
      const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }

      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) {
        const day = String(raw.includes("T") ? dt.getUTCDate() : dt.getDate()).padStart(2, '0');
        const month = String(raw.includes("T") ? dt.getUTCMonth() + 1 : dt.getMonth() + 1).padStart(2, '0');
        const year = raw.includes("T") ? dt.getUTCFullYear() : dt.getFullYear();
        return `${day}/${month}/${year}`;
      }

      return raw;
    };

    // Date check helper
    const isDateMatch = (dateStr: string, day: number, month: number) => {
      if (!dateStr) return false;
      const str = String(dateStr).trim();
      if (!str) return false;

      // Check DD/MM/YYYY
      const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dmy) {
        return parseInt(dmy[1], 10) === day && parseInt(dmy[2], 10) === month;
      }

      // Check YYYY-MM-DD
      const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (ymd) {
        return parseInt(ymd[3], 10) === day && parseInt(ymd[2], 10) === month;
      }

      const dayPad = String(day).padStart(2, '0');
      const monthPad = String(month).padStart(2, '0');
      if (str.includes(`${dayPad}/${monthPad}`) || str.includes(`${day}/${monthPad}`) || str.includes(`${day}/${month}`)) {
        return true;
      }
      if (str.includes(`-${monthPad}-${dayPad}`) || str.includes(`-${month}-${dayPad}`) || str.includes(`-${monthPad}-${day}`)) {
        return true;
      }

      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return (d.getUTCDate() === day && (d.getUTCMonth() + 1) === month) ||
               (d.getDate() === day && (d.getMonth() + 1) === month);
      }
      return false;
    };

    // Helper para formatear alergias limpias
    const formatAllergy = (val: any) => {
      if (!val) return "";
      const str = String(val).trim();
      if (!str || str.toLowerCase() === "ninguna" || str.toLowerCase() === "ninguno" || str.toLowerCase() === "n/a") return "";
      return str;
    };

    // Tracking global de inscritos por actividad (personas y carnets)
    const totalActPax: Record<string, number> = {};
    const totalActCarnets: Record<string, number> = {};
    activitiesList.forEach(act => {
      totalActPax[act.id] = 0;
      totalActCarnets[act.id] = 0;
    });

    interface ActivityParticipantInfo {
      type: 'titular' | 'companion' | 'minor';
      name: string;
      slot?: string;
    }

    const formatCompactDay = (r: any): string => {
      const raw = (r.dayLabel || r.sheetTab || r.dayDate || "").trim();
      if (!raw) {
        if (r.dayId === "day-1") return "Vie";
        if (r.dayId === "day-2") return "Sáb";
        return "";
      }
      // Check for month-day or day-month: e.g. "Nov 8", "8 Nov", "8 de Noviembre", "Noviembre 8"
      const novMatch = raw.match(/nov(?:iembre)?\.?\s*(\d{1,2})|(\d{1,2})\s*(?:de\s*)?nov(?:iembre)?/i);
      if (novMatch) {
        const dayNum = novMatch[1] || novMatch[2];
        return `Nov${dayNum}`;
      }
      const mayMatch = raw.match(/may(?:o)?\.?\s*(\d{1,2})|(\d{1,2})\s*(?:de\s*)?may(?:o)?/i);
      if (mayMatch) {
        const dayNum = mayMatch[1] || mayMatch[2];
        return `May${dayNum}`;
      }
      const monthMatch = raw.match(/([a-zA-Z]{3,})\.?\s*(\d{1,2})|(\d{1,2})\s*(?:de\s*)?([a-zA-Z]{3,})/i);
      if (monthMatch) {
        const mName = (monthMatch[1] || monthMatch[4] || "").substring(0, 3);
        const mCap = mName.charAt(0).toUpperCase() + mName.slice(1).toLowerCase();
        const dayNum = monthMatch[2] || monthMatch[3];
        return `${mCap}${dayNum}`;
      }
      if (/viernes/i.test(raw)) return "Vie";
      if (/s[aá]bado/i.test(raw)) return "Sáb";
      if (/domingo/i.test(raw)) return "Dom";
      if (/jueves/i.test(raw)) return "Jue";

      return raw.replace(/\s+/g, "");
    };

    const formatCompactTime = (rawTime?: string): string => {
      if (!rawTime) return "";
      // Strip durations like (60 min), (60 MIN), (45 min), (60), etc.
      let t = rawTime.replace(/\s*\(\d+[\s\w]*\)/gi, "").trim();
      // Condense "11:30 AM" -> "11:30AM", "09:00 am" -> "09:00AM"
      t = t.replace(/\s+([AaPp][Mm])/i, "$1");
      return t;
    };

    const isMovieNightsAct = (act?: { id?: string; name?: string; activityType?: string; category?: string } | null): boolean => {
      if (!act) return false;
      const type = (act.activityType || act.category || "").toUpperCase();
      const name = (act.name || "").toUpperCase();
      const id = (act.id || "").toUpperCase();
      return type === "MOVIE_NIGHTS" || type === "MOVIE NIGHTS" || name.includes("MOVIE") || id.includes("MOVIE");
    };

    const getGuestActivityParticipants = (guest: Guest, actId: string, act?: Activity): ActivityParticipantInfo[] => {
      const isMovie = isMovieNightsAct(act);
      const participants: ActivityParticipantInfo[] = [];
      const addedIds = new Set<string>();

      // 1. Check activityReservations (Spa slots, turnos, citas registradas)
      const reservations = (guest.activityReservations || []).filter(r => r.activityId === actId);
      reservations.forEach(r => {
        const isTitular = r.personType === "titular" || r.personId === "titular";
        const isMinor = r.personType === "minor" || (r.personId && r.personId.startsWith("minor"));
        
        // Movie Nights es exclusivamente para menores de edad
        if (isMovie && isTitular) {
          return;
        }

        const type: 'titular' | 'companion' | 'minor' = isMovie ? 'minor' : (isTitular ? 'titular' : isMinor ? 'minor' : 'companion');

        let pName = r.personName;
        if (r.paternalName || r.maternalName) {
          pName = `${r.personName || ""} ${r.paternalName || ""} ${r.maternalName || ""}`.trim();
        }
        if (!pName) {
          if (type === 'titular') pName = guest.name || `${guest.nombreTitular || ''} ${guest.apellidosTitular || ''}`.trim() || "Titular";
          else if (type === 'companion') pName = guest.nombreAcompanante || "Acompañante";
          else pName = "Menor";
        }

        const compactDay = formatCompactDay(r);
        const compactTime = formatCompactTime(r.slotTime);
        const slot = [compactDay, compactTime].filter(Boolean).join(" ");

        const pId = r.personId || (type === 'titular' ? 'titular' : `${type}-${pName}`);
        addedIds.add(pId);

        participants.push({
          type,
          name: pName,
          slot: slot || undefined
        });
      });

      // 2. Fallback Titular en selectedActivities (no aplica para Movie Nights)
      if (!isMovie && !addedIds.has("titular") && (guest.selectedActivities || []).includes(actId)) {
        addedIds.add("titular");
        participants.push({
          type: 'titular',
          name: guest.name || `${guest.nombreTitular || ''} ${guest.apellidosTitular || ''}`.trim() || "Titular"
        });
      }

      // 3. Fallback Acompañante en companions[].selectedActivities (no aplica para Movie Nights)
      if (!isMovie && guest.companions && guest.companions.length > 0) {
        guest.companions.forEach(c => {
          const cId = c.id || "companion";
          if (!addedIds.has(cId) && !addedIds.has("companion") && (c.selectedActivities || []).includes(actId)) {
            addedIds.add(cId);
            participants.push({
              type: 'companion',
              name: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || guest.nombreAcompanante || "Acompañante"
            });
          }
        });
      }

      // 4. Fallback Menores en minors[].selectedActivities
      if (guest.minors && guest.minors.length > 0) {
        guest.minors.forEach((m: any, mIdx: number) => {
          const mId = m.id || `minor-${mIdx}`;
          if (!addedIds.has(mId) && ((m.selectedActivities || []).includes(actId) || (isMovie && (guest.selectedActivities || []).includes(actId)))) {
            addedIds.add(mId);
            participants.push({
              type: 'minor',
              name: m.name || [m.firstName, m.lastName].filter(Boolean).join(" ") || `Menor ${mIdx + 1}`
            });
          }
        });
      }

      // 5. Fallback para Movie Nights si se marcó en el registro pero no se generó sub-objeto minor individual
      if (isMovie && participants.length === 0 && (guest.selectedActivities || []).includes(actId)) {
        const count = guest.numMenores || 1;
        for (let idx = 0; idx < count; idx++) {
          participants.push({
            type: 'minor',
            name: `Menor ${idx + 1}`
          });
        }
      }

      return participants;
    };

    const formatActivityCellText = (participants: ActivityParticipantInfo[], act?: Activity, guest?: Guest): string => {
      if (participants.length === 0) return "";

      if (act && isMovieNightsAct(act)) {
        const minorsCount = participants.filter(p => p.type === 'minor').length || guest?.numMenores || participants.length || 1;
        return `menores : ${minorsCount}`;
      }

      const titular = participants.find(p => p.type === 'titular');
      const companion = participants.find(p => p.type === 'companion');
      const minors = participants.filter(p => p.type === 'minor');

      const parts: string[] = [];

      if (titular) {
        parts.push(titular.slot ? `TITULAR ${titular.slot}` : `TITULAR`);
      }
      if (companion) {
        parts.push(companion.slot ? `ACOMP ${companion.slot}` : `ACOMP`);
      }
      if (minors.length > 0) {
        if (minors.length === 1) {
          const m = minors[0];
          parts.push(m.slot ? `MENOR ${m.slot}` : `MENOR`);
        } else {
          const slotsList = minors.map(m => m.slot).filter(Boolean);
          const slotNote = slotsList.length > 0 ? ` ${slotsList.join(", ")}` : "";
          parts.push(`${minors.length} MENORES${slotNote}`);
        }
      }

      return parts.join(", ");
    };

    // Iterar por cada categoría de huésped
    exportCategoryOrder.forEach(categoryName => {
      const catGuests = sourceGuests.filter(g => {
        const cat = (g.tipoHuesped || "Externo").trim();
        const norm = (cat.toLowerCase() === "convencionista" || cat.toLowerCase() === "convencionistas") ? "Externo" : cat;
        return norm.toLowerCase() === categoryName.toLowerCase();
      });

      if (catGuests.length === 0) return;

      // Ordenar alfabéticamente dentro de la categoría
      catGuests.sort((a, b) => {
        const nameA = (a.apellidosTitular ? `${a.apellidosTitular} ${a.nombreTitular || ""}` : (a.name || "")).trim().toUpperCase();
        const nameB = (b.apellidosTitular ? `${b.apellidosTitular} ${b.nombreTitular || ""}` : (b.name || "")).trim().toUpperCase();
        return nameA.localeCompare(nameB, 'es');
      });

      // Subtotales de actividades en la categoría
      const catActPax: Record<string, number> = {};
      const catActCarnets: Record<string, number> = {};
      activitiesList.forEach(act => {
        catActPax[act.id] = 0;
        catActCarnets[act.id] = 0;
      });

      // Subtotales de la categoría
      let catCarnets = 0;
      let catTitulares = 0;
      let catCompMujeres = 0;
      let catCompHombres = 0;
      let catMenores = 0;
      let catHabSencilla = 0;
      let catHabDoble = 0;
      let catNochesAdicionales = 0;
      let catCostoCarnetEvento = 0;
      let catTotalDiasAdicionales = 0;
      let catCount0a3 = 0;
      let catCosto0a3 = 0;
      let catCount4a11 = 0;
      let catCosto4a11 = 0;
      let catCount12a17 = 0;
      let catCosto12a17 = 0;
      let catAdultoDiaExtra = 0;
      let catCamaExtra = 0;
      let catCargosManuales = 0;
      let catRecargo3erCarnet = 0;
      let catTotalGeneral = 0;

      let catCenaConsejo = 0;
      let catAsistentesJuntaConsejo = 0;
      let catLlegada4 = 0;
      let catLlegada5 = 0;
      let catLlegada6 = 0;
      let catLlegada7 = 0;
      let catLlegada8 = 0;
      let catSalida9 = 0;
      let catSalida10 = 0;
      let catSalida11 = 0;
      let catSalida12 = 0;
      let catRegalosHombre = 0;
      let catRegalosMujer = 0;
      let catRegalosAdicionalesAdultosHombre = 0;
      let catRegalosAdicionalesAdultosMujer = 0;
      let catRegaloTitular = 0;

      catGuests.forEach(g => {
        const gAny = g as any;
        const companion = g.companions && g.companions.length > 0 ? g.companions[0] : null;
        const compAny = companion as any;
        const hasCompanion = !!(companion || g.nombreAcompanante);

        const minorsListForExport = (g.minors || []).filter((m: any) => m.tipo === "minor" || (m.tipo !== "adult" && m.age !== undefined && m.age < 12));
        const adultsListForExport = (g.minors || []).filter((m: any) => m.tipo === "adult" || (m.age !== undefined && m.age >= 12));
        const hasMinorsInList = (g.minors || []).length > 0;
        const exportMinorsCount = hasMinorsInList ? minorsListForExport.length : Math.round(g.numMenores || 0);
        const exportAdultsCount = hasMinorsInList ? adultsListForExport.length : 0;

        const minorsCount = exportMinorsCount;

        const addAdultFemaleCount = adultsListForExport.filter((m: any) => {
          const s = (m.sex || "").trim().toUpperCase();
          return s === "F" || s === "MUJER" || s === "FEMENINO";
        }).length;

        const addAdultMaleCount = adultsListForExport.filter((m: any) => {
          const s = (m.sex || "").trim().toUpperCase();
          return s === "M" || s === "HOMBRE" || s === "MASCULINO";
        }).length;

        const compSexRaw = companion?.sex || gAny.sexoAcompanante || "";
        let compSex = "";
        let isFemaleComp = false;
        let isMaleComp = false;

        if (hasCompanion) {
          const compSexUpper = (compSexRaw || "").trim().toUpperCase();
          if (compSexUpper === "F" || compSexUpper === "MUJER" || compSexUpper === "FEMENINO") {
            compSex = "F";
            isFemaleComp = true;
          } else if (compSexUpper === "M" || compSexUpper === "HOMBRE" || compSexUpper === "MASCULINO") {
            compSex = "M";
            isMaleComp = true;
          }
        }

        // Sexo 1
        const sex1Raw = (gAny.sexo || "").trim().toUpperCase();
        let sex1 = "";
        if (sex1Raw === "M" || sex1Raw === "MASCULINO" || sex1Raw === "HOMBRE") {
          sex1 = "M";
        } else if (sex1Raw === "F" || sex1Raw === "FEMENINO" || sex1Raw === "MUJER") {
          sex1 = "F";
        }

        // Vuelos 1
        const arrDateFormatted = getCleanFlightDate(g.vueloLlegadaFecha, g.flightArrival, true);
        const arrAirline = g.vueloLlegadaAerolinea || g.flightArrival?.airline || "";
        const arrNo = g.vueloLlegadaNoVuelo || g.flightArrival?.flightNumber || "";
        const arrTime = g.vueloLlegadaHora || (g.flightArrival ? new Date(g.flightArrival.arrivalDateTime).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }) : "");
        const arrPax = g.vueloLlegadaPersonas || (hasCompanion && !g.vuelosSeparados ? 2 : 1);

        const depDateFormatted = getCleanFlightDate(g.vueloRegresoFecha, g.flightDeparture, false);
        const depAirline = g.vueloRegresoAerolinea || g.flightDeparture?.airline || "";
        const depNo = g.vueloRegresoNoVuelo || g.flightDeparture?.flightNumber || "";
        const depTime = g.vueloRegresoHora || (g.flightDeparture ? new Date(g.flightDeparture.departureDateTime).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }) : "");
        const depPax = g.vueloRegresoPersonas || (hasCompanion && !g.vuelosSeparados ? 2 : 1);

        // Vuelos 2
        const arrDate2Formatted = getCleanFlightDate(gAny.vueloLlegadaFecha2 || compAny?.vueloLlegadaFecha, compAny?.flightArrival, true);
        const arrAirline2 = gAny.vueloLlegadaAerolinea2 || compAny?.vueloLlegadaAerolinea || "";
        const arrNo2 = gAny.vueloLlegadaNoVuelo2 || compAny?.vueloLlegadaNoVuelo || "";
        const arrTime2 = gAny.vueloLlegadaHora2 || compAny?.vueloLlegadaHora || "";
        const arrPax2 = gAny.vueloLlegadaPax2 || (arrAirline2 || arrDate2Formatted ? 1 : 0);

        const depDate2Formatted = getCleanFlightDate(gAny.vueloRegresoFecha2 || compAny?.vueloRegresoFecha, compAny?.flightDeparture, false);
        const depAirline2 = gAny.vueloRegresoAerolinea2 || compAny?.vueloRegresoAerolinea || "";
        const depNo2 = gAny.vueloRegresoNoVuelo2 || compAny?.vueloRegresoNoVuelo || "";
        const depTime2 = gAny.vueloRegresoHora2 || compAny?.vueloRegresoHora || "";
        const depPax2 = gAny.vueloRegresoPax2 || (depAirline2 || depDate2Formatted ? 1 : 0);

        const calcArrivalsOnDate = (targetDay: number) => {
          let count = 0;
          if (isDateMatch(arrDateFormatted, targetDay, 11)) count += (arrPax || 1);
          if (arrDate2Formatted && isDateMatch(arrDate2Formatted, targetDay, 11)) count += (arrPax2 || 1);
          return count;
        };

        const calcDeparturesOnDate = (targetDay: number) => {
          let count = 0;
          if (isDateMatch(depDateFormatted, targetDay, 11)) count += (depPax || 1);
          if (depDate2Formatted && isDateMatch(depDate2Formatted, targetDay, 11)) count += (depPax2 || 1);
          return count;
        };

        const leg4 = calcArrivalsOnDate(4);
        const leg5 = calcArrivalsOnDate(5);
        const leg6 = calcArrivalsOnDate(6);
        const leg7 = calcArrivalsOnDate(7);
        const leg8 = calcArrivalsOnDate(8);

        const sal9 = calcDeparturesOnDate(9);
        const sal10 = calcDeparturesOnDate(10);
        const sal11 = calcDeparturesOnDate(11);
        const sal12 = calcDeparturesOnDate(12);

        const regHombreCount = (sex1 === 'M' ? 1 : 0) + (isMaleComp ? 1 : 0);
        const regMujerCount = (sex1 === 'F' ? 1 : 0) + (isFemaleComp ? 1 : 0);

        const allergyTitular = formatAllergy(g.allergies?.join(", ") || g.alergiasTitular);
        const allergyAcomp = formatAllergy(companion?.requirements || g.alergiasAcompanante);
        const allergyMenor1 = formatAllergy(g.minors?.[0]?.allergies || (Array.isArray(g.alergiasMenores) ? g.alergiasMenores[0] : g.alergiasMenores));
        const allergyMenor2 = formatAllergy(g.minors?.[1]?.allergies || (Array.isArray(g.alergiasMenores) && g.alergiasMenores[1] ? g.alergiasMenores[1] : ""));

        let compApellidos = "";
        let compNombres = "";
        if (compAny) {
          if (compAny.apellidos || compAny.nombres) {
            compApellidos = compAny.apellidos || "";
            compNombres = compAny.nombres || "";
          } else if (compAny.name) {
            const parts = String(compAny.name || "").trim().split(' ');
            if (parts.length > 1) {
              compNombres = parts[0];
              compApellidos = parts.slice(1).join(' ');
            } else {
              compNombres = compAny.name;
            }
          }
        } else if (g.nombreAcompanante) {
          const parts = String(g.nombreAcompanante || "").trim().split(' ');
          if (parts.length > 1) {
            compNombres = parts[0];
            compApellidos = parts.slice(1).join(' ');
          } else {
            compNombres = g.nombreAcompanante;
          }
        }

        const minor1 = minorsListForExport[0];
        const minor2 = minorsListForExport[1];
        const nombreMenor1 = minor1?.name ? `${minor1.name} ${minor1.lastName || ""}`.trim() : (Array.isArray(gAny.nombreMenores) ? gAny.nombreMenores[0] : (gAny.nombreMenores || ""));
        const nombreMenor2 = minor2?.name ? `${minor2.name} ${minor2.lastName || ""}`.trim() : (Array.isArray(gAny.nombreMenores) ? gAny.nombreMenores[1] : "");
        
        const formatExportAge = (ageStr: string) => {
          if (!ageStr) return "";
          const cleaned = ageStr.trim().toLowerCase();
          const parsed = parseInt(cleaned, 10);
          if (parsed === 0 || cleaned === "0" || cleaned.includes("meses")) {
            return "0-11 MESES";
          }
          return ageStr;
        };

        const edadMenor1 = formatExportAge(minor1?.age !== undefined ? String(minor1.age) : (Array.isArray(gAny.edadMenores) ? String(gAny.edadMenores[0] || "") : (gAny.edadMenores ? String(gAny.edadMenores) : "")));
        const edadMenor2 = formatExportAge(minor2?.age !== undefined ? String(minor2.age) : (Array.isArray(gAny.edadMenores) && gAny.edadMenores[1] ? String(gAny.edadMenores[1]) : ""));

        const hasMan = sex1 === "M" || isMaleComp;
        const hasWoman = sex1 === "F" || isFemaleComp;
        let kitBienvenidaVal = "N/A";
        if (hasMan && hasWoman) kitBienvenidaVal = "Hombre y mujer";
        else if (hasMan) kitBienvenidaVal = "Hombre";
        else if (hasWoman) kitBienvenidaVal = "Mujer";

        const isVip = g.tipoHuesped === 'VIP' || gAny.cenaConsejo === true || (g.grupo && g.grupo.toUpperCase().includes('VIP')) || g.puesto === 'VIP';
        const cenaConsejoVal = isVip ? (hasCompanion ? 2 : 1) : 0;
        const juntaConsejoVal = isVip ? 1 : 0;

        const habCount = Math.max(1, Math.round(g.numHabitaciones || 1));

        for (let r = 0; r < habCount; r++) {
          totalCarnets++;
          catCarnets++;
          totalHabitaciones++;

          const carnetIndexInGroup = getCarnetIndexInGroup(g.id, r, sourceGuests);

          const carnetGuestObj = r === 0 ? g : {
            ...g,
            companions: [],
            nombreAcompanante: undefined,
            minors: [],
            numMenores: 0,
            carnetTipoHabitacion: "Sencilla"
          };

          const fin = calculateCarnetFinancials(carnetGuestObj, undefined, carnetIndexInGroup);
          const isAdistem = (g.grupo || "").trim().toUpperCase() === "ADISTEM";
          const carnetCostToUse = isAdistem ? 0 : fin.costoCarnetEvento;
          const totalGeneralToUse = isAdistem ? (fin.totalGeneralCarnet - fin.costoCarnetEvento) : fin.totalGeneralCarnet;

          if (r === 0) {
            totalTitulares++;
            catTitulares++;
            if (isFemaleComp) {
              totalCompMujeres++;
              catCompMujeres++;
            }
            if (isMaleComp) {
              totalCompHombres++;
              catCompHombres++;
            }
            totalMenores += minorsCount;
            catMenores += minorsCount;

            totalLlegada4 += leg4;
            catLlegada4 += leg4;
            totalLlegada5 += leg5;
            catLlegada5 += leg5;
            totalLlegada6 += leg6;
            catLlegada6 += leg6;
            totalLlegada7 += leg7;
            catLlegada7 += leg7;
            totalLlegada8 += leg8;
            catLlegada8 += leg8;

            totalSalida9 += sal9;
            catSalida9 += sal9;
            totalSalida10 += sal10;
            catSalida10 += sal10;
            totalSalida11 += sal11;
            catSalida11 += sal11;
            totalSalida12 += sal12;
            catSalida12 += sal12;

            totalRegalosHombre += regHombreCount;
            catRegalosHombre += regHombreCount;
            totalRegalosMujer += regMujerCount;
            catRegalosMujer += regMujerCount;

            totalRegalosAdicionalesAdultosHombre += exportAdultsCount > 0 ? addAdultMaleCount : 0;
            catRegalosAdicionalesAdultosHombre += exportAdultsCount > 0 ? addAdultMaleCount : 0;
            totalRegalosAdicionalesAdultosMujer += exportAdultsCount > 0 ? addAdultFemaleCount : 0;
            catRegalosAdicionalesAdultosMujer += exportAdultsCount > 0 ? addAdultFemaleCount : 0;

            if (g.regaloTitularEntregado) {
              totalRegaloTitular++;
              catRegaloTitular++;
            }
            if (isFemaleComp && g.regaloAcompananteMujerEntregado) totalRegaloMujer++;
            if (isMaleComp && (g.regaloAcompananteHombreEntregado || g.regaloHombre)) totalRegaloHombre++;

            totalCenaConsejo += cenaConsejoVal;
            catCenaConsejo += cenaConsejoVal;
            totalAsistentesJuntaConsejo += juntaConsejoVal;
            catAsistentesJuntaConsejo += juntaConsejoVal;
          }

          if (fin.isDoble) {
            totalHabDoble++;
            catHabDoble++;
          } else {
            totalHabSencilla++;
            catHabSencilla++;
          }

          totalNochesAdicionales += fin.nochesAdicionales;
          catNochesAdicionales += fin.nochesAdicionales;

          totalCostoCarnetEvento += carnetCostToUse;
          catCostoCarnetEvento += carnetCostToUse;

          totalDiasAdicionalesCarnetSuma += fin.totalDiasAdicionalesCarnet;
          catTotalDiasAdicionales += fin.totalDiasAdicionalesCarnet;

          totalCount0a3 += fin.count0a3;
          catCount0a3 += fin.count0a3;
          totalNinos0a3Suma += fin.totalNinos0a3;
          catCosto0a3 += fin.totalNinos0a3;

          totalCount4a11 += fin.count4a11;
          catCount4a11 += fin.count4a11;
          totalNinos4a11Suma += fin.totalNinos4a11;
          catCosto4a11 += fin.totalNinos4a11;

          totalCount12a17 += fin.count12a17;
          catCount12a17 += fin.count12a17;
          totalNinos12a17Suma += fin.totalNinos12a17;
          catCosto12a17 += fin.totalNinos12a17;

          totalAdultoDiaExtraSuma += fin.totalAdultoDiaExtra;
          catAdultoDiaExtra += fin.totalAdultoDiaExtra;

          totalCamaExtraSuma += fin.totalCamaExtra;
          catCamaExtra += fin.totalCamaExtra;

          totalCargosManualesSuma += fin.totalCargosManuales;
          catCargosManuales += fin.totalCargosManuales;

          totalRecargo3erCarnetSuma += fin.recargoTercerCarnet;
          catRecargo3erCarnet += fin.recargoTercerCarnet;

          totalGeneral += totalGeneralToUse;
          catTotalGeneral += totalGeneralToUse;

          const habitacionNum = g.numeroHabitacion || gAny.numHabitacion 
            ? `${g.numeroHabitacion || gAny.numHabitacion}${habCount > 1 ? `-${r + 1}` : ""}` 
            : (habCount > 1 ? `Hab ${r + 1} de ${habCount}` : "");

          let guestPuesto = g.puesto || gAny.cargo || "Dueño";
          if (guestPuesto === "Otros") guestPuesto = "Externos";

          const rowObj: Record<string, any> = {
            "grupo": g.grupo || "Stellantis",
            "Distribuidora": g.distribuidora || g.distributor || "",
            "tipo de huesped": categoryName,
            "APELLIDOS 1": g.apellidosTitular || (g.name ? g.name.split(' ').slice(1).join(' ') : ""),
            "NOMBRE(S) 1": g.nombreTitular || (g.name ? g.name.split(' ')[0] : ""),
            "PUESTO / CARGO": guestPuesto,
            "SEXO 1": sex1,
            "APELLIDOS 2": r === 0 ? compApellidos : "",
            "NOMBRES 2": r === 0 ? compNombres : "",
            "SEXO 2": r === 0 ? compSex : "",
            "NOMBRE MENOR 1": r === 0 ? nombreMenor1 : "",
            "EDAD MENOR 1": r === 0 ? edadMenor1 : "",
            "NOMBRE MENOR 2": r === 0 ? nombreMenor2 : "",
            "EDAD MENOR 2": r === 0 ? edadMenor2 : "",
            "NUMERO DE MENORES": r === 0 ? minorsCount : 0,
            "ADICIONALES ADULTOS": r === 0 && exportAdultsCount > 0 
              ? adultsListForExport.map(a => `${a.name || ""} ${a.lastName || ""}`.trim()).join(", ").toUpperCase() 
              : "",

            "HOTEL": fin.hotelName,
            "CATEGORIA": "",
            "CONFIGURACION": g.configuracionHabitacion || "King",
            "NO. HABITACION": habitacionNum,

            // COSTOS CONFIGURADOS EN SEDES & TARIFAS
            "CARNET": fin.isDoble ? "Carnet Doble" : "Carnet Sencillo",
            "COSTO CARNET": carnetCostToUse,
            "NOCHES ADICIONALES": fin.nochesAdicionales,
            "COSTO DIA ADICIONAL CARNET": fin.costoDiaAdicionalCarnet,
            "TOTAL DIAS ADICIONALES CARNET": fin.totalDiasAdicionalesCarnet,
            "NIÑOS 0-3 AÑOS (CANTIDAD)": fin.count0a3,
            "COSTO NIÑOS 0-3 AÑOS": fin.totalNinos0a3,
            "NIÑOS 4-11 AÑOS (CANTIDAD)": fin.count4a11,
            "COSTO NIÑOS 4-11 AÑOS": fin.totalNinos4a11,
            "NIÑOS 12-17 AÑOS (CANTIDAD)": fin.count12a17,
            "COSTO NIÑOS 12-17 AÑOS": fin.totalNinos12a17,
            "ADULTO DIA EXTRA": fin.totalAdultoDiaExtra,
            "CAMA EXTRA": fin.totalCamaExtra,
            "CARGOS ADICIONALES": fin.totalCargosManuales,
            "RECARGO 3ER+ CARNET GRUPO": fin.recargoTercerCarnet,
            "TOTAL A PAGAR": totalGeneralToUse,

            // Consejos
            "CENA DE CONSEJO": r === 0 && cenaConsejoVal > 0 ? cenaConsejoVal : "",
            "ASISTENTES JUNTA DE CONSEJO": r === 0 && juntaConsejoVal > 0 ? juntaConsejoVal : "",

            // Llegadas y salidas
            "LLEGADAS 4 NOV": r === 0 && leg4 > 0 ? leg4 : "",
            "LLEGADAS 5 NOV": r === 0 && leg5 > 0 ? leg5 : "",
            "LLEGADAS 6 NOV": r === 0 && leg6 > 0 ? leg6 : "",
            "LLEGADAS 7 NOV": r === 0 && leg7 > 0 ? leg7 : "",
            "LLEGADAS 8 NOV": r === 0 && leg8 > 0 ? leg8 : "",

            "SALIDAS GENERAL 9 NOV": r === 0 && sal9 > 0 ? sal9 : "",
            "10 NOV": r === 0 && sal10 > 0 ? sal10 : "",
            "11 NOV": r === 0 && sal11 > 0 ? sal11 : "",
            "12 NOV": r === 0 && sal12 > 0 ? sal12 : "",

            // Regalos
            "REGALOS HOMBRE": r === 0 ? regHombreCount : 0,
            "REGALOS MUJER": r === 0 ? regMujerCount : 0,
            "REGALOS ADICIONALES ADULTOS HOMBRE": r === 0 ? addAdultMaleCount : 0,
            "REGALOS ADICIONALES ADULTOS MUJER": r === 0 ? addAdultFemaleCount : 0,
            "KIT DE BIENVENIDA": r === 0 ? kitBienvenidaVal : "N/A",
            "REGALO HOMBRE": r === 0 && (sex1 === 'M' || isMaleComp) ? (g.regaloTitularEntregado || g.regaloHombre ? 1 : 0) : 0,
            "ARREGLO FLORAL": r === 0 && g.arregloFloral ? 1 : 0,
            "CERTIFICADO DE REGALO": r === 0 && g.certificadoRegalo ? 1 : 0,
            "REGALO DE DESPEDIDA": r === 0 && g.regaloDespedida ? 1 : 0,
            "REGALO MENORES": r === 0 && g.regaloMenores ? 1 : 0,

            // Documentación
            "INE 1": (g.ineTitular || g.idFileName) ? "SI" : "NO",
            "INE 2": hasCompanion ? (g.ineAcompanante ? "SI" : "NO") : "NO",

            // Logística de vuelos
            "Fecha llegada": arrDateFormatted,
            "Aerolinea llegada": arrAirline,
            "No Vuelo llegada": arrNo,
            "Hora llegada": arrTime,
            "#Pax llegada": arrPax,
            "Fecha llegada 2": arrDate2Formatted,
            "Aerolinea llegada 2": arrAirline2,
            "No vuelo llegada 2": arrNo2,
            "Hora llegada 2": arrTime2,
            "#Pax llegada2": arrPax2,
            "Fecha regreso": depDateFormatted,
            "Aerolinea regreso": depAirline,
            "No. Vuelo regreso": depNo,
            "Hora regreso": depTime,
            "#Pax Regreso": depPax,
            "Fecha regreso2": depDate2Formatted,
            "Aerolinea regreso2": depAirline2,
            "No. Vuelo regreso2": depNo2,
            "Hora regreso2": depTime2,
            "#Pax regreso2": depPax2,
          };

          // Actividades dinámicas
          activitiesList.forEach(act => {
            if (r === 0) {
              const parts = getGuestActivityParticipants(g, act.id, act);
              if (parts.length > 0) {
                catActPax[act.id] = (catActPax[act.id] || 0) + parts.length;
                catActCarnets[act.id] = (catActCarnets[act.id] || 0) + 1;
                totalActPax[act.id] = (totalActPax[act.id] || 0) + parts.length;
                totalActCarnets[act.id] = (totalActCarnets[act.id] || 0) + 1;
              }
              rowObj[`Actividad: ${act.name}`] = formatActivityCellText(parts, act, g);
            } else {
              rowObj[`Actividad: ${act.name}`] = "";
            }
          });

          rowObj["Alergias/restricciones titula"] = r === 0 ? allergyTitular : "";
          rowObj["Alergias/restricciones/acompañante"] = r === 0 ? allergyAcomp : "";
          rowObj["alergias/restricciones Menor1"] = r === 0 ? allergyMenor1 : "";
          rowObj["alergias/restricciones menor2"] = r === 0 ? allergyMenor2 : "";
          rowObj["Comentarios especiales"] = r === 0 ? (g.specialRequirements || g.requerimientosAdicionales || "") : "";
          rowObj["Fecha registro"] = g.createdAt ? new Date(g.createdAt).toLocaleDateString("es-MX") : "";
          rowObj["Email Titular"] = g.email;
          rowObj["Telefono/Celular"] = g.phone;
          rowObj["Noches adicionales"] = fin.nochesAdicionales;
          rowObj["Estatus registro"] = g.status;
          rowObj["Comentarios Staff Admin"] = g.comentariosAdmin || "";
          rowObj["Notas / comentarios internos de comunicación"] = g.comentariosAdmin || "";

          excelData.push(rowObj);
        }
      });
    });

    const totalKitsGeneral = totalTitulares + totalCompMujeres + totalCompHombres + totalMenores;

    const totalsObj: Record<string, any> = {
      "grupo": "TOTALES GENERALES DE OPERACIÓN",
      "Distribuidora": `Total Carnets: ${totalCarnets}`,
      "tipo de huesped": "",
      "APELLIDOS 1": `Total Titulares: ${totalTitulares}`,
      "NOMBRE(S) 1": `Total Adultos: ${totalTitulares + totalCompMujeres + totalCompHombres}`,
      "PUESTO / CARGO": "",
      "SEXO 1": "",
      "APELLIDOS 2": `Total Acompañantes: ${totalCompMujeres + totalCompHombres}`,
      "NOMBRES 2": "",
      "SEXO 2": "",
      "NOMBRE MENOR 1": "",
      "EDAD MENOR 1": "",
      "NOMBRE MENOR 2": "",
      "EDAD MENOR 2": "",
      "NUMERO DE MENORES": totalMenores,
      "ADICIONALES ADULTOS": "",

      "HOTEL": "",
      "CATEGORIA": "",
      "CONFIGURACION": "",
      "NO. HABITACION": "",
      "CARNET": `Doble: ${totalHabDoble} | Sencillo: ${totalHabSencilla}`,
      "COSTO CARNET": totalCostoCarnetEvento,
      "NOCHES ADICIONALES": totalNochesAdicionales,
      "COSTO DIA ADICIONAL CARNET": "",
      "TOTAL DIAS ADICIONALES CARNET": totalDiasAdicionalesCarnetSuma,
      "NIÑOS 0-3 AÑOS (CANTIDAD)": totalCount0a3,
      "COSTO NIÑOS 0-3 AÑOS": totalNinos0a3Suma,
      "NIÑOS 4-11 AÑOS (CANTIDAD)": totalCount4a11,
      "COSTO NIÑOS 4-11 AÑOS": totalNinos4a11Suma,
      "NIÑOS 12-17 AÑOS (CANTIDAD)": totalCount12a17,
      "COSTO NIÑOS 12-17 AÑOS": totalNinos12a17Suma,
      "ADULTO DIA EXTRA": totalAdultoDiaExtraSuma,
      "CAMA EXTRA": totalCamaExtraSuma,
      "CARGOS ADICIONALES": totalCargosManualesSuma,
      "RECARGO 3ER+ CARNET GRUPO": totalRecargo3erCarnetSuma,
      "TOTAL A PAGAR": totalGeneral,
      "CENA DE CONSEJO": totalCenaConsejo,
      "ASISTENTES JUNTA DE CONSEJO": totalAsistentesJuntaConsejo,

      "LLEGADAS 4 NOV": totalLlegada4,
      "LLEGADAS 5 NOV": totalLlegada5,
      "LLEGADAS 6 NOV": totalLlegada6,
      "LLEGADAS 7 NOV": totalLlegada7,
      "LLEGADAS 8 NOV": totalLlegada8,

      "SALIDAS GENERAL 9 NOV": totalSalida9,
      "10 NOV": totalSalida10,
      "11 NOV": totalSalida11,
      "12 NOV": totalSalida12,

      "REGALOS HOMBRE": totalRegalosHombre,
      "REGALOS MUJER": totalRegalosMujer,
      "REGALOS ADICIONALES ADULTOS HOMBRE": totalRegalosAdicionalesAdultosHombre,
      "REGALOS ADICIONALES ADULTOS MUJER": totalRegalosAdicionalesAdultosMujer,
      "KIT DE BIENVENIDA": `Total Kits/Regalos: ${totalKitsGeneral + totalRegalosAdicionalesAdultosHombre + totalRegalosAdicionalesAdultosMujer}`,
      "REGALO HOMBRE": `Entregados: ${totalRegaloTitular}`,
      "ARREGLO FLORAL": "",
      "CERTIFICADO DE REGALO": "",
      "REGALO DE DESPEDIDA": "",
      "REGALO MENORES": `Menores: ${totalMenores}`,

      "INE 1": "",
      "INE 2": "",

      "Fecha llegada": "",
      "Aerolinea llegada": "",
      "No Vuelo llegada": "",
      "Hora llegada": "",
      "#Pax llegada": "",
      "Fecha llegada 2": "",
      "Aerolinea llegada 2": "",
      "No vuelo llegada 2": "",
      "Hora llegada 2": "",
      "#Pax llegada2": "",
      "Fecha regreso": "",
      "Aerolinea regreso": "",
      "No. Vuelo regreso": "",
      "Hora regreso": "",
      "#Pax Regreso": "",
      "Fecha regreso2": "",
      "Aerolinea regreso2": "",
      "No. Vuelo regreso2": "",
      "Hora regreso2": "",
      "#Pax regreso2": "",
    };

    activitiesList.forEach(act => {
      const pax = totalActPax[act.id] || 0;
      totalsObj[`Actividad: ${act.name}`] = `Inscritos: ${pax}`;
    });

    totalsObj["Alergias/restricciones titula"] = "";
    totalsObj["Alergias/restricciones/acompañante"] = "";
    totalsObj["alergias/restricciones Menor1"] = "";
    totalsObj["alergias/restricciones menor2"] = "";
    totalsObj["Comentarios especiales"] = "";
    totalsObj["Fecha registro"] = "";
    totalsObj["Email Titular"] = "";
    totalsObj["Telefono/Celular"] = "";
    totalsObj["Noches adicionales"] = totalNochesAdicionales;
    totalsObj["Estatus registro"] = "";
    totalsObj["Comentarios Staff Admin"] = "";
    totalsObj["Notas / comentarios internos de comunicación"] = "";

    excelData.push(totalsObj);

    excelData.push({
      "grupo": "RESUMEN EJECUTIVO",
      "Distribuidora": `Total Carnets: ${totalCarnets}`,
      "tipo de huesped": "",
      "Puesto / Cargo": `Titulares: ${totalTitulares}`,
      "Nombre completo acompañante": `Acompañantes Adultos: ${totalCompMujeres + totalCompHombres}`,
      "Regalo menores": `Menores: ${totalMenores} (0-3: ${totalCount0a3}, 4-11: ${totalCount4a11}, 12-17: ${totalCount12a17})`,
      "Kits d bienvenida": `Total Kits Evento: ${totalKitsGeneral}`,
      "Noches adicionales": `Total Noches Extra: ${totalNochesAdicionales}`,
      "TOTAL A PAGAR": `Gran Total Finanzas: $${totalGeneral.toLocaleString()} MXN`
    } as any);

    // Convert keys and string values in all rows to UPPERCASE for XLS export
    const upperExcelData = excelData.map(row => {
      const newRow: Record<string, any> = {};
      Object.keys(row || {}).forEach(key => {
        const upperKey = key.toUpperCase();
        const val = (row as any)[key];
        if (typeof val === 'string') {
          newRow[upperKey] = val.toUpperCase();
        } else {
          newRow[upperKey] = val;
        }
      });
      return newRow;
    });

    // Generar archivo Excel con ExcelJS para soporte nativo de inmovilización de paneles y estilos visuales
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ADISTEM 2026";
    workbook.created = new Date();

    // 1. HOJA 1: Padrón de Invitados
    const worksheet = workbook.addWorksheet("Padrón de Invitados", {
      views: [
        {
          state: "frozen",
          xSplit: 2, // Inmoviliza columnas A (GRUPO) y B (DISTRIBUIDORA)
          ySplit: 1, // Inmoviliza fila 1 (Títulos)
          topLeftCell: "C2"
        }
      ]
    });

    // Ancho específico para columnas clave
    const SPECIFIC_COL_WIDTHS: Record<string, number> = {
      "GRUPO": 18,
      "DISTRIBUIDORA": 24,
      "TIPO DE HUESPED": 18,
      "TIPO CARNET": 16,
      "CVE": 8,
      "ID": 10,
      "ID CARNET": 12,
      "PUESTO": 14,
      "PUESTO / CARGO": 14,
      "HOTEL": 22,
      "HABITACION": 12,
      "NO. HABITACION": 12,
      "CONFIGURACION": 14,
      "APELLIDOS 1": 20,
      "NOMBRE(S) 1": 18,
      "SEXO 1": 8,
      "APELLIDOS 2": 20,
      "NOMBRES 2": 18,
      "SEXO 2": 8,
      "NOMBRE MENOR 1": 18,
      "EDAD MENOR 1": 9,
      "NOMBRE MENOR 2": 18,
      "EDAD MENOR 2": 9,
      "NUMERO DE MENORES": 11,
      "ADICIONALES ADULTOS": 22,
      "CARNET": 14,
      "COSTO CARNET": 13,
      "NOCHES ADICIONALES": 11,
      "COSTO DIA ADICIONAL CARNET": 13,
      "TOTAL DIAS ADICIONALES CARNET": 14,
      "NIÑOS 0-3 AÑOS (CANTIDAD)": 10,
      "COSTO NIÑOS 0-3 AÑOS": 13,
      "NIÑOS 4-11 AÑOS (CANTIDAD)": 10,
      "COSTO NIÑOS 4-11 AÑOS": 13,
      "NIÑOS 12-17 AÑOS (CANTIDAD)": 10,
      "COSTO NIÑOS 12-17 AÑOS": 13,
      "ADULTO DIA EXTRA": 13,
      "CAMA EXTRA": 12,
      "CARGOS ADICIONALES": 13,
      "RECARGO 3ER+ CARNET GRUPO": 14,
      "TOTAL A PAGAR": 14,
      "CENA DE CONSEJO": 11,
      "ASISTENTES JUNTA DE CONSEJO": 11,
      "LLEGADAS 4 NOV": 10,
      "LLEGADAS 5 NOV": 10,
      "LLEGADAS 6 NOV": 10,
      "LLEGADAS 7 NOV": 10,
      "LLEGADAS 8 NOV": 10,
      "SALIDAS GENERAL 9 NOV": 11,
      "10 NOV": 9,
      "11 NOV": 9,
      "12 NOV": 9,
      "REGALOS HOMBRE": 10,
      "REGALOS MUJER": 10,
      "REGALOS ADICIONALES ADULTOS HOMBRE": 15,
      "REGALOS ADICIONALES ADULTOS MUJER": 15,
      "KIT DE BIENVENIDA": 14,
      "REGALO HOMBRE": 10,
      "ARREGLO FLORAL": 10,
      "CERTIFICADO DE REGALO": 10,
      "REGALO DE DESPEDIDA": 10,
      "REGALO MENORES": 11,
      "INE 1": 8,
      "INE 2": 8,
      "FECHA LLEGADA": 13,
      "AEROLINEA LLEGADA": 18,
      "NO VUELO LLEGADA": 12,
      "HORA LLEGADA": 10,
      "#PAX LLEGADA": 9,
      "FECHA LLEGADA 2": 13,
      "AEROLINEA LLEGADA 2": 18,
      "NO VUELO LLEGADA 2": 12,
      "HORA LLEGADA 2": 10,
      "#PAX LLEGADA2": 9,
      "FECHA REGRESO": 13,
      "AEROLINEA REGRESO": 18,
      "NO. VUELO REGRESO": 12,
      "HORA REGRESO": 10,
      "#PAX REGRESO": 9,
      "FECHA REGRESO2": 13,
      "AEROLINEA REGRESO2": 18,
      "NO. VUELO REGRESO2": 12,
      "HORA REGRESO2": 10,
      "#PAX REGRESO2": 9,
      "ALERGIAS/RESTRICCIONES TITULA": 24,
      "ALERGIAS/RESTRICCIONES/ACOMPAÑANTE": 24,
      "ALERGIAS/RESTRICCIONES MENOR1": 20,
      "ALERGIAS/RESTRICCIONES MENOR2": 20,
      "COMENTARIOS ESPECIALES": 32,
      "FECHA REGISTRO": 13,
      "EMAIL TITULAR": 26,
      "TELEFONO/CELULAR": 16,
      "ESTATUS REGISTRO": 14,
      "COMENTARIOS STAFF ADMIN": 32,
      "NOTAS / COMENTARIOS INTERNOS DE COMUNICACIÓN": 32
    };

    const headersSet = new Set<string>();
    upperExcelData.forEach(row => {
      Object.keys(row || {}).forEach(k => headersSet.add(k));
    });
    const headers1 = Array.from(headersSet);

    worksheet.columns = headers1.map(key => {
      const upperKey = key.toUpperCase();
      let colWidth = SPECIFIC_COL_WIDTHS[upperKey];
      if (!colWidth) {
        let maxLen = key.length;
        upperExcelData.forEach(row => {
          const val = (row as any)[key];
          if (val !== undefined && val !== null) {
            const str = String(val);
            if (str.length > maxLen && str.length < 80) {
              maxLen = str.length;
            }
          }
        });
        colWidth = upperKey.includes("ACTIVIDAD")
          ? Math.min(Math.max(maxLen + 2, 22), 52)
          : Math.min(Math.max(maxLen + 2, 10), 36);
      }
      return {
        header: key,
        key: key,
        width: colWidth
      };
    });

    // Formato de la fila de Títulos (Renglón 1)
    const headerRow1 = worksheet.getRow(1);
    headerRow1.height = 30;
    headerRow1.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2F0D9" } // Verde tenue
      };
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FF1B4332" } // Verde bosque oscuro
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFA5D6A7" } },
        bottom: { style: "medium", color: { argb: "FF66BB6A" } },
        left: { style: "thin", color: { argb: "FFC8E6C9" } },
        right: { style: "thin", color: { argb: "FFC8E6C9" } }
      };
    });

    // Columnas de costos y moneda en pesos
    const CURRENCY_COLUMNS = new Set([
      "COSTO CARNET",
      "COSTO DIA ADICIONAL CARNET",
      "TOTAL DIAS ADICIONALES CARNET",
      "COSTO NIÑOS 0-3 AÑOS",
      "COSTO NIÑOS 4-11 AÑOS",
      "COSTO NIÑOS 12-17 AÑOS",
      "ADULTO DIA EXTRA",
      "CAMA EXTRA",
      "CARGOS ADICIONALES",
      "RECARGO 3ER+ CARNET GRUPO",
      "TOTAL A PAGAR"
    ]);

    // Columnas de cantidades numéricas (asistentes, menores, noches, vuelos pax, regalos, etc.)
    const COUNT_COLUMNS = new Set([
      "CVE",
      "ID",
      "ID CARNET",
      "SEXO 1",
      "SEXO 2",
      "EDAD MENOR 1",
      "EDAD MENOR 2",
      "NUMERO DE MENORES",
      "NO. HABITACION",
      "NOCHES ADICIONALES",
      "NIÑOS 0-3 AÑOS (CANTIDAD)",
      "NIÑOS 4-11 AÑOS (CANTIDAD)",
      "NIÑOS 12-17 AÑOS (CANTIDAD)",
      "CENA DE CONSEJO",
      "ASISTENTES JUNTA DE CONSEJO",
      "LLEGADAS 4 NOV",
      "LLEGADAS 5 NOV",
      "LLEGADAS 6 NOV",
      "LLEGADAS 7 NOV",
      "LLEGADAS 8 NOV",
      "SALIDAS GENERAL 9 NOV",
      "10 NOV",
      "11 NOV",
      "12 NOV",
      "REGALOS HOMBRE",
      "REGALOS MUJER",
      "REGALOS ADICIONALES ADULTOS HOMBRE",
      "REGALOS ADICIONALES ADULTOS MUJER",
      "REGALO HOMBRE",
      "ARREGLO FLORAL",
      "CERTIFICADO DE REGALO",
      "REGALO DE DESPEDIDA",
      "REGALO MENORES",
      "INE 1",
      "INE 2",
      "#PAX LLEGADA",
      "#PAX LLEGADA2",
      "#PAX REGRESO",
      "#PAX REGRESO2"
    ]);

    const formatDataCell = (cell: ExcelJS.Cell, colKey: string) => {
      const isCurrency = CURRENCY_COLUMNS.has(colKey);
      const isCount = COUNT_COLUMNS.has(colKey);
      const rawVal = cell.value;
      const isNumeric = rawVal !== "" && rawVal !== null && rawVal !== undefined && (typeof rawVal === "number" || (!isNaN(Number(rawVal)) && typeof rawVal === "string" && rawVal.trim() !== "" && !colKey.includes("TELEFONO") && !colKey.includes("CELULAR") && !colKey.includes("FECHA") && !colKey.includes("ACTIVIDAD")));

      if (isCurrency) {
        if (isNumeric) {
          cell.value = Number(rawVal);
          cell.numFmt = '"$"#,##0';
        }
        cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
      } else if (isCount || isNumeric) {
        if (isNumeric) {
          cell.value = Number(rawVal);
          cell.numFmt = '#,##0';
        }
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      } else if (colKey.includes("ACTIVIDAD")) {
        const valStr = String(rawVal || "").trim().toUpperCase();
        if (valStr === "NO" || valStr === "0" || valStr.startsWith("INSCRITOS: 0")) {
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        }
      } else {
        cell.alignment = { vertical: "middle", wrapText: true };
      }
    };

    // Inserción y formateo de filas de datos
    upperExcelData.forEach(rowObj => {
      const rowValues = headers1.map(h => (rowObj as any)[h] !== undefined && (rowObj as any)[h] !== null ? (rowObj as any)[h] : "");
      const row = worksheet.addRow(rowValues);

      const grupoVal = String((rowObj as any)["GRUPO"] || "").toUpperCase();
      const isTotalsRow = grupoVal.includes("TOTALES GENERALES") || grupoVal.includes("RESUMEN EJECUTIVO");
      const isSubtotalRow = grupoVal.startsWith("SUBTOTAL");
      const isEmptyRow = Object.keys(rowObj).length === 0;

      if (isTotalsRow) {
        row.height = 26;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const colKey = headers1[colNumber - 1]?.toUpperCase() || "";
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD4EDDA" } // Verde tenue elegante
          };
          cell.font = {
            name: "Calibri",
            size: 11.5,
            bold: true,
            color: { argb: "FF0F5132" }
          };
          cell.border = {
            top: { style: "medium", color: { argb: "FF2E7D32" } },
            bottom: { style: "double", color: { argb: "FF1B5E20" } },
            left: { style: "thin", color: { argb: "FFA5D6A7" } },
            right: { style: "thin", color: { argb: "FFA5D6A7" } }
          };
          formatDataCell(cell, colKey);
        });
      } else if (isSubtotalRow) {
        row.height = 24;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const colKey = headers1[colNumber - 1]?.toUpperCase() || "";
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEDF7ED" } // Verde suave muy tenue
          };
          cell.font = {
            name: "Calibri",
            size: 11,
            bold: true,
            color: { argb: "FF1E4620" }
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFA5D6A7" } },
            bottom: { style: "thin", color: { argb: "FFA5D6A7" } }
          };
          formatDataCell(cell, colKey);
        });
      } else if (isEmptyRow) {
        row.height = 10;
      } else {
        row.height = 20;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const colKey = headers1[colNumber - 1]?.toUpperCase() || "";
          cell.font = {
            name: "Calibri",
            size: 10,
            color: { argb: "FF222222" }
          };
          cell.border = {
            top: { style: "hair", color: { argb: "FFE0E0E0" } },
            bottom: { style: "hair", color: { argb: "FFE0E0E0" } },
            left: { style: "hair", color: { argb: "FFE0E0E0" } },
            right: { style: "hair", color: { argb: "FFE0E0E0" } }
          };
          formatDataCell(cell, colKey);
        });
      }
    });

    // SEGUNDA HOJA EN EL EXCEL: RESUMEN Y CONTROL POR GRUPOS EN ORDEN ALFABÉTICO
    const allGroupNames = Array.from(new Set([
      ...GROUPS_LIST,
      ...sourceGuests.map(g => g.grupo || "Stellantis")
    ].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));

    const sheet2Data: Array<Record<string, any>> = [];

    let totCarnetsG = 0;
    let totTitularesG = 0;
    let totAdultsG = 0;
    let totMinorsG = 0;
    let totMinors0a3G = 0;
    let totMinors4a11G = 0;
    let totMinors12a17G = 0;
    let totPersonasG = 0;
    let totCarnetsBaseG = 0;
    let totCarnetsExtraG = 0;
    let totRecargoExtraG = 0;
    let totFinancieroG = 0;

    allGroupNames.forEach(groupName => {
      const gList = sourceGuests.filter(g => (g.grupo || "Stellantis").trim().toLowerCase() === groupName.toLowerCase());
      const carnetsCount = gList.reduce((sum, g) => sum + Math.max(1, g.numHabitaciones || 1), 0);
      const titularesCount = gList.length;
      const companionsCount = gList.reduce((sum, g) => sum + (g.nombreAcompanante || (g.companions && g.companions.length > 0) ? 1 : 0), 0);
      const totalAdultos = titularesCount + companionsCount;

      let gMinors0a3 = 0;
      let gMinors4a11 = 0;
      let gMinors12a17 = 0;
      let gRecargoCarnetsExtra = 0;
      let gTotalCost = 0;

      gList.forEach(g => {
        const habCount = Math.max(1, g.numHabitaciones || 1);
        for (let r = 0; r < habCount; r++) {
          const carnetIdx = getCarnetIndexInGroup(g.id, r, sourceGuests);
          const carnetGuestObj = r === 0 ? g : {
            ...g,
            companions: [],
            nombreAcompanante: undefined,
            minors: [],
            numMenores: 0,
            carnetTipoHabitacion: "Sencilla"
          };
          const fin = calculateCarnetFinancials(carnetGuestObj, undefined, carnetIdx);
          if (r === 0) {
            gMinors0a3 += fin.count0a3;
            gMinors4a11 += fin.count4a11;
            gMinors12a17 += fin.count12a17;
          }
          gRecargoCarnetsExtra += fin.recargoTercerCarnet;
          gTotalCost += fin.totalGeneralCarnet;
        }
      });

      const gTotalMinors = gMinors0a3 + gMinors4a11 + gMinors12a17;
      const gTotalPersonas = totalAdultos + gTotalMinors;
      const carnetsExtraCount = Math.max(0, carnetsCount - 2);

      totCarnetsG += carnetsCount;
      totTitularesG += titularesCount;
      totAdultsG += totalAdultos;
      totMinorsG += gTotalMinors;
      totMinors0a3G += gMinors0a3;
      totMinors4a11G += gMinors4a11;
      totMinors12a17G += gMinors12a17;
      totPersonasG += gTotalPersonas;
      totCarnetsBaseG += Math.min(carnetsCount, 2);
      totCarnetsExtraG += carnetsExtraCount;
      totRecargoExtraG += gRecargoCarnetsExtra;
      totFinancieroG += gTotalCost;

      sheet2Data.push({
        "GRUPO": groupName.toUpperCase(),
        "TOTAL CARNETS REGISTRADOS": carnetsCount,
        "TOTAL ADULTOS (INC. TITULAR)": totalAdultos,
        "TOTAL MENORES": gTotalMinors,
        "MENORES 0-3 AÑOS": gMinors0a3,
        "MENORES 4-11 AÑOS": gMinors4a11,
        "MENORES 12-17 AÑOS": gMinors12a17,
        "TOTAL ASISTENTES GRUPO": gTotalPersonas,
        "CARNETS BASE (HASTA 2)": Math.min(carnetsCount, 2),
        "CARNETS EXTRAS (3RO EN ADELANTE)": carnetsExtraCount,
        "RECARGO CARNETS EXTRAS ($10,000 C/U)": gRecargoCarnetsExtra,
        "TOTAL FINANCIERO GRUPO (MXN)": gTotalCost
      });
    });

    sheet2Data.push({} as any);
    sheet2Data.push({
      "GRUPO": "TOTALES DE TODOS LOS GRUPOS",
      "TOTAL CARNETS REGISTRADOS": totCarnetsG,
      "TOTAL ADULTOS (INC. TITULAR)": totAdultsG,
      "TOTAL MENORES": totMinorsG,
      "MENORES 0-3 AÑOS": totMinors0a3G,
      "MENORES 4-11 AÑOS": totMinors4a11G,
      "MENORES 12-17 AÑOS": totMinors12a17G,
      "TOTAL ASISTENTES GRUPO": totPersonasG,
      "CARNETS BASE (HASTA 2)": totCarnetsBaseG,
      "CARNETS EXTRAS (3RO EN ADELANTE)": totCarnetsExtraG,
      "RECARGO CARNETS EXTRAS ($10,000 C/U)": totRecargoExtraG,
      "TOTAL FINANCIERO GRUPO (MXN)": totFinancieroG
    });

    const worksheet2 = workbook.addWorksheet("Resumen por Grupos", {
      views: [
        {
          state: "frozen",
          xSplit: 1, // Inmoviliza columna A (GRUPO)
          ySplit: 1, // Inmoviliza fila 1 (Títulos)
          topLeftCell: "B2"
        }
      ]
    });

    const sheet2ColDefs: Record<string, { title: string; width: number }> = {
      "GRUPO": { title: "Grupo Distribuidor", width: 24 },
      "TOTAL CARNETS REGISTRADOS": { title: "Total Carnets\nRegistrados", width: 12 },
      "TOTAL ADULTOS (INC. TITULAR)": { title: "Total Adultos\n(Inc. Titular)", width: 12 },
      "TOTAL MENORES": { title: "Total\nMenores", width: 9 },
      "MENORES 0-3 AÑOS": { title: "Menores\n0-3 Años", width: 9 },
      "MENORES 4-11 AÑOS": { title: "Menores\n4-11 Años", width: 9 },
      "MENORES 12-17 AÑOS": { title: "Menores\n12-17 Años", width: 9 },
      "TOTAL ASISTENTES GRUPO": { title: "Total Asistentes\nGrupo", width: 12 },
      "CARNETS BASE (HASTA 2)": { title: "Carnets Base\n(Hasta 2)", width: 11 },
      "CARNETS EXTRAS (3RO EN ADELANTE)": { title: "Carnets Extras\n(3ro en adelante)", width: 13 },
      "RECARGO CARNETS EXTRAS ($10,000 C/U)": { title: "Recargo Extras\n($10,000 c/u)", width: 13 },
      "TOTAL FINANCIERO GRUPO (MXN)": { title: "Total Financiero\nGrupo (MXN)", width: 15 }
    };

    const headers2 = Object.keys(sheet2Data[0] || {});
    worksheet2.columns = headers2.map(key => {
      const def = sheet2ColDefs[key];
      return {
        header: def?.title || key,
        key: key,
        width: def?.width || 12
      };
    });

    const headerRow2 = worksheet2.getRow(1);
    headerRow2.height = 36;
    headerRow2.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2F0D9" }
      };
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FF1B4332" }
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFA5D6A7" } },
        bottom: { style: "medium", color: { argb: "FF66BB6A" } },
        left: { style: "thin", color: { argb: "FFC8E6C9" } },
        right: { style: "thin", color: { argb: "FFC8E6C9" } }
      };
    });

    const SHEET2_CURRENCY_COLUMNS = new Set([
      "RECARGO CARNETS EXTRAS ($10,000 C/U)",
      "TOTAL FINANCIERO GRUPO (MXN)"
    ]);

    const formatSheet2DataCell = (cell: ExcelJS.Cell, colKey: string) => {
      const isCurrency = SHEET2_CURRENCY_COLUMNS.has(colKey);
      const rawVal = cell.value;
      const isNumeric = rawVal !== "" && rawVal !== null && rawVal !== undefined && (typeof rawVal === "number" || (!isNaN(Number(rawVal)) && typeof rawVal === "string" && rawVal.trim() !== ""));

      if (isCurrency) {
        if (isNumeric) {
          cell.value = Number(rawVal);
          cell.numFmt = '"$"#,##0';
        }
        cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
      } else if (colKey !== "GRUPO" && isNumeric) {
        cell.value = Number(rawVal);
        cell.numFmt = '#,##0';
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      } else {
        cell.alignment = { vertical: "middle", wrapText: true };
      }
    };

    sheet2Data.forEach(rowObj => {
      const rowValues = headers2.map(h => (rowObj as any)[h] !== undefined && (rowObj as any)[h] !== null ? (rowObj as any)[h] : "");
      const row = worksheet2.addRow(rowValues);
      const isTotal = String((rowObj as any)["GRUPO"] || "").includes("TOTALES");
      const isEmpty = Object.keys(rowObj).length === 0;

      if (isTotal) {
        row.height = 26;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const colKey = headers2[colNumber - 1]?.toUpperCase() || "";
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD4EDDA" }
          };
          cell.font = {
            name: "Calibri",
            size: 11.5,
            bold: true,
            color: { argb: "FF0F5132" }
          };
          cell.border = {
            top: { style: "medium", color: { argb: "FF2E7D32" } },
            bottom: { style: "double", color: { argb: "FF1B5E20" } }
          };
          formatSheet2DataCell(cell, colKey);
        });
      } else if (isEmpty) {
        row.height = 10;
      } else {
        row.height = 20;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const colKey = headers2[colNumber - 1]?.toUpperCase() || "";
          cell.font = { name: "Calibri", size: 10 };
          formatSheet2DataCell(cell, colKey);
        });
      }
    });

    // Garantizar que absolutamente todas las celdas de ambas hojas tengan wrapText activado
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.alignment = {
          ...(cell.alignment || { vertical: "middle" }),
          wrapText: true
        };
      });
    });

    worksheet2.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.alignment = {
          ...(cell.alignment || { vertical: "middle" }),
          wrapText: true
        };
      });
    });

    // Guardar y descargar archivo XLSX nativo con todos los estilos y paneles inmovilizados
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Padron_Invitados_ADISTEM_2026_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleToggleGift = (guest: Guest, field: 'regaloTitularEntregado' | 'regaloAcompananteMujerEntregado' | 'regaloAcompananteHombreEntregado', e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser?.role === "Staff") {
      alert("Tu cuenta de Staff es sólo lectura.");
      return;
    }
    const updated = {
      ...guest,
      [field]: !guest[field]
    };
    DataStore.saveGuest(updated, currentUser?.email || "Staff Admin", currentUser?.email || "admin@adistem.com.mx", true);
    onUpdate();
  };

  // Cancel assistant workflow
  const handleCancelAssistant = (guestId: string, reason: string) => {
    const guestsList = DataStore.getGuests();
    const gIndex = guestsList.findIndex(g => g.id === guestId);
    if (gIndex === -1) return;

    const guest = { ...guestsList[gIndex] };
    guest.status = GuestStatus.CANCELLED;
    guest.cancelledBy = "staff";
    guest.cancelledAt = new Date().toISOString();
    guest.cancellationReason = reason;

    const res = DataStore.saveGuest(guest, "Staff - Juan Manuel", "staff@adistem.com.mx", true);
    if (res.success) {
      setSelectedGuest(guest);
      onUpdate();
      alert(`La asistencia de ${guest.name} ha sido cancelada correctamente.`);
    }
  };

  // Bulk simulated downloads
  const triggerVersionedDownload = (reportName: string) => {
    const timestamp = new Date().toISOString();
    const downloadId = "DL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const verString = `v1.${reportVersion}`;
    
    // Add file logs
    setDownloadLogs(prev => [
      { id: downloadId, reportName, version: verString, timestamp },
      ...prev
    ]);
    setReportVersion(v => v + 1);

    alert(`[Simulación Descarga Operativa]
Reporte: ${reportName}
Identificador de Descarga: ${downloadId}
Versión: ${verString}
Fecha y Hora de Generación: ${new Date(timestamp).toLocaleString()}

El archivo Excel/CSV se ha empaquetado de manera estructurada para la operación del hotel y aeropuertos de destino.`);
  };

  // Send messaging
  const handleSendComms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(commForm.subject || "").trim() || !(commForm.body || "").trim()) {
      alert("Por favor completa el título y cuerpo del mensaje.");
      return;
    }

    // Calculate recipient count
    let count = guests.length;
    if (commForm.segmentStage !== "all") {
      count = guests.filter(g => g.stage === commForm.segmentStage).length;
    }
    if (commForm.segmentStatus !== "all") {
      count = guests.filter(g => g.status === commForm.segmentStatus).length;
    }

    DataStore.sendCommMessage({
      subject: commForm.subject,
      body: commForm.body,
      type: commForm.type,
      segment: {
        stage: commForm.segmentStage,
        status: commForm.segmentStatus
      },
      recipientCount: count
    }, "Coordinador Comunicación", "comunicados@adistem.com.mx");

    onUpdate();
    setCommForm({
      subject: "",
      body: "",
      type: "email",
      segmentStage: "all",
      segmentStatus: "all"
    });
    alert(`¡Mensaje (${commForm.type.toUpperCase()}) emitido correctamente a ${count} invitados!`);
  };

  // Reset demo databases
  const handleReset = () => {
    DataStore.resetToDefault();
    onUpdate();
    setResetConfirm(false);
    setSelectedGuest(null);
    alert("Se han restablecido los datos del evento ADISTEM a los valores semilla de demostración.");
  };

  // Filtered guest list with comprehensive search (Titular, Acompañante, Menores, Agencia, Correo, etc.)
  const filteredGuests = guests.filter(g => {
    const qRaw = searchQuery.trim();
    let matchesSearch = true;
    if (qRaw) {
      const normalize = (str?: string) =>
        (str || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

      const q = normalize(qRaw);

      // 1. Titular fields
      const titularMatch =
        normalize(g.name).includes(q) ||
        normalize(g.nombreTitular).includes(q) ||
        normalize(g.apellidosTitular).includes(q) ||
        normalize(`${g.nombreTitular || ""} ${g.apellidosTitular || ""}`).includes(q) ||
        normalize(g.email).includes(q) ||
        normalize(g.correoTitular).includes(q) ||
        normalize(g.distributor).includes(q) ||
        normalize(g.distribuidora).includes(q) ||
        normalize(g.grupo).includes(q) ||
        normalize(g.id).includes(q) ||
        normalize(g.phone).includes(q) ||
        normalize(g.celularTitular).includes(q);

      // 2. Direct companion fields (adult)
      const directAcomp = `${g.nombreAcompanante || ""} ${g.apellidosAcompanante || ""}`.trim();
      const directAcompMatch =
        normalize(g.nombreAcompanante).includes(q) ||
        normalize(g.apellidosAcompanante).includes(q) ||
        normalize(directAcomp).includes(q);

      // 3. Companions array (adults & companions)
      const companionsArrayMatch = Array.isArray(g.companions) && g.companions.some(c => {
        const compFullName = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.name || "";
        return (
          normalize(c.name).includes(q) ||
          normalize(c.firstName).includes(q) ||
          normalize(c.lastName).includes(q) ||
          normalize(compFullName).includes(q)
        );
      });

      // 4. Minors array
      const minorsMatch = Array.isArray(g.minors) && g.minors.some(m => {
        const minorFullName = `${m.name || ""} ${m.lastName || ""}`.trim();
        return (
          normalize(m.name).includes(q) ||
          normalize(m.lastName).includes(q) ||
          normalize(minorFullName).includes(q)
        );
      });

      matchesSearch = titularMatch || directAcompMatch || companionsArrayMatch || minorsMatch;
    }
    
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    const matchesStage = stageFilter === "all" || g.stage.toString() === stageFilter;

    const matchesGroup = filterGroup === "todos" || 
                         (g.grupo && g.grupo.toLowerCase() === filterGroup.toLowerCase()) ||
                         (filterGroup === "Stellantis" && !g.grupo); // fallback matching
                         
    const matchesHotel = filterHotel === "todos" || (g.hotelAlojamiento || config?.hotelSede || "Sin asignar") === filterHotel;
    const guestNormType = (() => {
      const t = (g.tipoHuesped || "Externo").trim();
      return (t.toLowerCase() === "convencionista" || t.toLowerCase() === "convencionistas") ? "Externo" : t;
    })();
    const matchesType = filterType === "todos" || guestNormType.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesStatus && matchesStage && matchesGroup && matchesHotel && matchesType;
  });

  // Reset pagination when search or filters change
  useEffect(() => {
    setGuestCurrentPage(1);
  }, [searchQuery, statusFilter, stageFilter, filterGroup, filterHotel, filterType, guestPageSize]);

  // Toggle sorting for allowed columns (Titular, Distribuidor/Grupo, Importe)
  const handleToggleGuestSort = (field: GuestSortField) => {
    if (guestSortField === field) {
      setGuestSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setGuestSortField(field);
      setGuestSortDir('asc');
    }
    setGuestCurrentPage(1);
  };

  // Sorted guests according to chosen column
  const sortedGuests = useMemo(() => {
    if (!guestSortField) return filteredGuests;
    return [...filteredGuests].sort((a, b) => {
      if (guestSortField === 'name') {
        const nameA = (a.name || `${a.nombreTitular || ""} ${a.apellidosTitular || ""}`.trim()).toLowerCase();
        const nameB = (b.name || `${b.nombreTitular || ""} ${b.apellidosTitular || ""}`.trim()).toLowerCase();
        const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        return guestSortDir === 'asc' ? cmp : -cmp;
      }
      if (guestSortField === 'distributor_group') {
        const distA = `${a.distribuidora || a.distributor || ""} ${a.grupo || ""}`.trim().toLowerCase();
        const distB = `${b.distribuidora || b.distributor || ""} ${b.grupo || ""}`.trim().toLowerCase();
        const cmp = distA.localeCompare(distB, 'es', { sensitivity: 'base' });
        return guestSortDir === 'asc' ? cmp : -cmp;
      }
      if (guestSortField === 'total') {
        const totA = getGuestTotalCost(a);
        const totB = getGuestTotalCost(b);
        return guestSortDir === 'asc' ? totA - totB : totB - totA;
      }
      return 0;
    });
  }, [filteredGuests, guestSortField, guestSortDir]);

  // Pagination calculations
  const totalGuestPages = Math.max(1, Math.ceil(sortedGuests.length / guestPageSize));
  const currentPageClamped = Math.min(Math.max(1, guestCurrentPage), totalGuestPages);

  const paginatedGuests = useMemo(() => {
    const start = (currentPageClamped - 1) * guestPageSize;
    return sortedGuests.slice(start, start + guestPageSize);
  }, [sortedGuests, currentPageClamped, guestPageSize]);

  // Calculate high level KPI totals
  const totalGuestsCount = guests.length;
  const countIncomplete = guests.filter(g => g.status === GuestStatus.INCOMPLETE).length;
  const countComplete = guests.filter(g => g.status === GuestStatus.COMPLETE).length;
  const countConfirmed = guests.filter(g => g.status === GuestStatus.CONFIRMED).length;
  const countCancelled = guests.filter(g => g.status === GuestStatus.CANCELLED).length;

  // Stage 1 groups calculations
  const totalStage1Groups = GROUPS_LIST.length;

  const stage1GroupRegistrations = useMemo(() => {
    const map: Record<string, Guest> = {};
    const activeList = guests.filter(g => g.status !== GuestStatus.CANCELLED);

    // Prefer confirmed / complete guests if any
    const sorted = [...activeList].sort((a, b) => {
      if (a.status === GuestStatus.CONFIRMED && b.status !== GuestStatus.CONFIRMED) return -1;
      if (b.status === GuestStatus.CONFIRMED && a.status !== GuestStatus.CONFIRMED) return 1;
      return 0;
    });

    sorted.forEach(g => {
      const grpUpper = (g.grupo || "").trim().toUpperCase();
      if (grpUpper && !map[grpUpper]) {
        map[grpUpper] = g;
      }
    });

    return map;
  }, [guests]);

  const stage1GroupsWithRegistration = useMemo(() => {
    return GROUPS_LIST.filter(g => !!stage1GroupRegistrations[g.toUpperCase()]);
  }, [stage1GroupRegistrations]);

  const titularRegistradosCount = stage1GroupsWithRegistration.length;
  const titularesFaltantesCount = Math.max(0, totalStage1Groups - titularRegistradosCount);
  const stage1CompletionPercent = Math.round((titularRegistradosCount / totalStage1Groups) * 100) || 0;

  const filteredStage1Groups = useMemo(() => {
    let list = [...GROUPS_LIST];

    if (stage1GroupFilter === "registered") {
      list = list.filter(g => !!stage1GroupRegistrations[g.toUpperCase()]);
    } else if (stage1GroupFilter === "unregistered") {
      list = list.filter(g => !stage1GroupRegistrations[g.toUpperCase()]);
    }

    if (stage1GroupSearch.trim()) {
      const normalize = (str?: string) =>
        (str || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const q = normalize(stage1GroupSearch);

      list = list.filter(g => {
        const matchName = normalize(g).includes(q);
        const agencies = (GROUPS_DATA[g] || []).some(a => normalize(a).includes(q));
        const titular = stage1GroupRegistrations[g.toUpperCase()];
        const matchTitular = titular ? (
          normalize(titular.name).includes(q) ||
          normalize(titular.nombreTitular).includes(q) ||
          normalize(titular.apellidosTitular).includes(q) ||
          normalize(`${titular.nombreTitular || ""} ${titular.apellidosTitular || ""}`).includes(q) ||
          normalize(titular.email).includes(q) ||
          normalize(titular.correoTitular).includes(q) ||
          normalize(titular.distribuidora || titular.distributor || "").includes(q) ||
          normalize(titular.nombreAcompanante).includes(q) ||
          normalize(titular.apellidosAcompanante).includes(q) ||
          normalize(`${titular.nombreAcompanante || ""} ${titular.apellidosAcompanante || ""}`).includes(q) ||
          (titular.companions || []).some(c => normalize(c.name || `${c.firstName || ''} ${c.lastName || ''}`).includes(q)) ||
          (titular.minors || []).some(m => normalize(m.name || `${m.name || ''} ${m.lastName || ''}`).includes(q))
        ) : false;
        return matchName || agencies || matchTitular;
      });
    }

    return list;
  }, [stage1GroupFilter, stage1GroupSearch, stage1GroupRegistrations]);

  // Categorías de Huésped oficiales
  const CATEGORIES_LIST = ["Distribuidores", "Planta", "Financiera", "Externo", "Staff"] as const;

  const categoryGuestsMap = useMemo(() => {
    const map: Record<string, Guest[]> = {
      "Distribuidores": [],
      "VIP": [],
      "Planta": [],
      "Financiera": [],
      "Externo": [],
      "Staff": []
    };

    (guests || []).forEach(g => {
      const rawCat = (g.tipoHuesped || "").trim();
      const rawLower = rawCat.toLowerCase();
      
      if (rawLower === "distribuidor" || rawLower === "distribuidores" || rawLower === "vip") {
        map["Distribuidores"].push(g);
        if (rawLower === "vip") {
          map["VIP"].push(g);
        }
      } else if (rawLower === "planta") {
        map["Planta"].push(g);
      } else if (rawLower === "financiera" || rawLower === "financiero" || rawLower === "financieras") {
        map["Financiera"].push(g);
      } else if (rawLower === "staff") {
        map["Staff"].push(g);
      } else if (
        rawLower === "externo" || 
        rawLower === "externos" || 
        rawLower === "convencionista" || 
        rawLower === "convencionistas" ||
        rawLower === "dueño" ||
        rawLower === "invitado" ||
        rawLower === "general"
      ) {
        map["Externo"].push(g);
      } else {
        const matchKey = Object.keys(map).find(k => k.toLowerCase() === rawLower);
        if (matchKey) {
          map[matchKey].push(g);
        } else {
          map["Distribuidores"].push(g);
        }
      }
    });

    return map;
  }, [guests]);

  const categoryCarnetsMap = useMemo(() => {
    const counts: Record<string, number> = {
      "Distribuidores": 0,
      "VIP": 0,
      "Planta": 0,
      "Financiera": 0,
      "Externo": 0,
      "Staff": 0
    };
    Object.keys(categoryGuestsMap).forEach(cat => {
      const guestList = categoryGuestsMap[cat] || [];
      counts[cat] = guestList.reduce((sum, g) => sum + Math.max(1, g.numHabitaciones || 1), 0);
    });
    return counts;
  }, [categoryGuestsMap]);

  const categoryModalGuests = useMemo(() => {
    if (!selectedCategoryModal) return [];
    if (selectedCategoryModal === "Menores") return [];
    const list = categoryGuestsMap[selectedCategoryModal] || [];
    if (!categoryModalSearch.trim()) return list;
    const q = categoryModalSearch.toLowerCase().trim();
    return list.filter(g => {
      const fullTitular = `${g.nombreTitular || ""} ${g.apellidosTitular || ""} ${g.name || ""}`.toLowerCase();
      const group = (g.grupo || "").toLowerCase();
      const dist = (g.distribuidora || g.distributor || "").toLowerCase();
      const email = (g.email || "").toLowerCase();
      let p = g.puesto || (g as any).cargo || "";
      if (p === "Otros") p = "Externos";
      return fullTitular.includes(q) || group.includes(q) || dist.includes(q) || email.includes(q) || p.toLowerCase().includes(q);
    });
  }, [selectedCategoryModal, categoryGuestsMap, categoryModalSearch]);

  const getGuestTotalPeopleCount = (g: any): number => {
    const hasComp = !!(g.nombreAcompanante || (g.companions && g.companions.length > 0));
    const addCount = Math.max(g.minors ? g.minors.length : 0, g.numMenores || 0);
    return 1 + (hasComp ? 1 : 0) + addCount;
  };

  const guestsWithoutFlights = useMemo(() => {
    return (guests || []).filter(g => {
      // Exclude cancelled guests
      if ((g.status as string) === "Cancelado" || (g.status as string) === "Cancelada") return false;

      // Check if arrival flight is missing
      const hasArrival = g.vueloLlegadaNoVuelo || g.flightArrival?.flightNumber || g.vueloLlegadaFecha || g.flightArrival?.arrivalDateTime;
      // Check if departure flight is missing
      const hasDeparture = g.vueloRegresoNoVuelo || g.flightDeparture?.flightNumber || g.vueloRegresoFecha || g.flightDeparture?.departureDateTime;

      // If either arrival or departure flight is missing, they belong in this list
      return !hasArrival || !hasDeparture;
    });
  }, [guests]);

  const filteredGuestsWithoutFlights = useMemo(() => {
    if (!guestsWithoutFlightsSearch.trim()) return guestsWithoutFlights;
    const q = guestsWithoutFlightsSearch.toLowerCase().trim();
    return guestsWithoutFlights.filter(g => {
      const name = `${g.nombreTitular || ""} ${g.apellidosTitular || ""} ${g.name || ""}`.toLowerCase();
      const email = (g.email || "").toLowerCase();
      const dist = (g.distribuidora || g.distributor || "").toLowerCase();
      return name.includes(q) || email.includes(q) || dist.includes(q);
    });
  }, [guestsWithoutFlights, guestsWithoutFlightsSearch]);

  const handleExportGuestsWithoutFlightsXLS = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ADISTEM 2026 - Logística de Vuelos";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Sin Vuelo Registrado", {
      views: [{ state: "frozen", ySplit: 1 }]
    });

    // Column widths
    worksheet.columns = [
      { header: "GRUPO", key: "grupo", width: 18 },
      { header: "DISTRIBUIDORA", key: "distribuidora", width: 24 },
      { header: "TITULAR", key: "titular", width: 30 },
      { header: "CORREO", key: "correo", width: 30 },
      { header: "PERSONAS EN CARNET", key: "personas", width: 22 },
      { header: "ESTATUS REGISTRO", key: "estatus", width: 18 },
      { header: "VUELO LLEGADA", key: "vuelo_llegada", width: 20 },
      { header: "VUELO REGRESO", key: "vuelo_regreso", width: 20 }
    ];

    guestsWithoutFlights.forEach(g => {
      const hasArrival = g.vueloLlegadaNoVuelo || g.flightArrival?.flightNumber || g.vueloLlegadaFecha || g.flightArrival?.arrivalDateTime;
      const hasDeparture = g.vueloRegresoNoVuelo || g.flightDeparture?.flightNumber || g.vueloRegresoFecha || g.flightDeparture?.departureDateTime;

      const totalPeople = getGuestTotalPeopleCount(g);

      worksheet.addRow({
        grupo: (g.grupo || "STELLANTIS").toUpperCase(),
        distribuidora: (g.distribuidora || g.distributor || "SIN ASIGNAR").toUpperCase(),
        titular: (g.name || `${g.nombreTitular || ""} ${g.apellidosTitular || ""}`.trim() || "SIN NOMBRE").toUpperCase(),
        correo: g.email || "",
        personas: totalPeople,
        estatus: (g.status || "Pendiente").toUpperCase(),
        vuelo_llegada: hasArrival 
          ? `${g.vueloLlegadaAerolinea || g.flightArrival?.airline || ""} ${g.vueloLlegadaNoVuelo || g.flightArrival?.flightNumber || ""}`.trim().toUpperCase()
          : "PENDIENTE REGISTRO",
        vuelo_regreso: hasDeparture 
          ? `${g.vueloRegresoAerolinea || g.flightDeparture?.airline || ""} ${g.vueloRegresoNoVuelo || g.flightDeparture?.flightNumber || ""}`.trim().toUpperCase()
          : "PENDIENTE REGISTRO"
      });
    });

    // Format headers (Row 1)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2F0D9" } // Verde claro
      };
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FF1B4332" } // Verde oscuro
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center"
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFA5D6A7" } },
        bottom: { style: "medium", color: { argb: "FF66BB6A" } },
        left: { style: "thin", color: { argb: "FFC8E6C9" } },
        right: { style: "thin", color: { argb: "FFC8E6C9" } }
      };
    });

    // Align content cells
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Calibri", size: 10 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } }
        };
        // Alignments
        if (colNumber === 5) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.numFmt = "#,##0";
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reporte_Pendientes_Vuelo_ADISTEM_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totalMinorsCount = useMemo(() => {
    return (guests || []).filter(g => (g.status as string) !== "Cancelado" && (g.status as string) !== "Cancelada").reduce((sum, g) => {
      const minorsList = g.minors || [];
      if (minorsList.length > 0) {
        const minorsOnly = minorsList.filter((m: any) => m.tipo === "minor" || (m.tipo !== "adult" && m.age !== undefined && m.age < 12));
        return sum + minorsOnly.length;
      }
      return sum + Math.round(g.numMenores || 0);
    }, 0);
  }, [guests]);

  const categoryModalMinorsList = useMemo(() => {
    if (selectedCategoryModal !== "Menores") return [];
    const activeGuests = (guests || []).filter(g => (g.status as string) !== "Cancelado" && (g.status as string) !== "Cancelada");
    
    // Find all Movie Night activity IDs
    const acts = DataStore.getActivities ? DataStore.getActivities() : [];
    const movieNightActivityIds = acts.filter((a: any) => {
      const type = (a.activityType || a.category || "").toUpperCase();
      const name = (a.name || "").toUpperCase();
      return type === "MOVIE_NIGHTS" || type === "MOVIE NIGHTS" || name.includes("MOVIE");
    }).map((a: any) => a.id);

    // Differentiate Saturday and Sunday Movie Nights
    const movieNightActs = acts.filter((a: any) => {
      const type = (a.activityType || a.category || "").toUpperCase();
      const name = (a.name || "").toUpperCase();
      return type === "MOVIE_NIGHTS" || type === "MOVIE NIGHTS" || name.includes("MOVIE") || a.id.includes("MOVIE");
    });

    let satAct = movieNightActs.find((a: any) => {
      const n = (a.name || "").toLowerCase();
      const d = (a.eventDay || "").toLowerCase();
      return n.includes("sab") || n.includes("sáb") || d.includes("sab") || d.includes("sáb");
    });

    let sunAct = movieNightActs.find((a: any) => {
      const n = (a.name || "").toLowerCase();
      const d = (a.eventDay || "").toLowerCase();
      return n.includes("dom") || d.includes("dom");
    });

    if (!satAct && movieNightActs.length > 0) {
      satAct = movieNightActs[0];
    }
    if (!sunAct && movieNightActs.length > 1) {
      sunAct = movieNightActs.find(a => a.id !== satAct?.id);
    }

    const flatMinors: Array<{
      id: string;
      minorName: string;
      minorAge: number;
      titularName: string;
      razonSocial: string;
      roomNumber: string;
      isMovieNightsEnrolled: boolean;
      enrolledSat: boolean;
      enrolledSun: boolean;
      guestRef: Guest;
    }> = [];

    const checkEnrollment = (m: any, mId: string, mName: string, g: any, actId?: string) => {
      if (!actId) return false;
      
      if (m && m.selectedActivities && m.selectedActivities.includes(actId)) {
        return true;
      }
      
      const hasRes = (g.activityReservations || []).some((r: any) => {
        if (r.activityId !== actId) return false;
        const isMinorPerson = r.personType === "minor" || (r.personId && r.personId.startsWith("minor"));
        const nameLower = (r.personName || "").trim().toLowerCase();
        const targetNameLower = String(mName || "").trim().toLowerCase();
        return isMinorPerson && (r.personId === mId || nameLower.includes(targetNameLower) || targetNameLower.includes(nameLower));
      });
      if (hasRes) return true;
      
      if (g.selectedActivities && g.selectedActivities.includes(actId)) {
        return true;
      }
      
      return false;
    };

    activeGuests.forEach(g => {
      const minorsList = g.minors || [];
      
      if (minorsList.length > 0) {
        const minorsOnly = minorsList.filter((m: any) => m.tipo === "minor" || (m.tipo !== "adult" && m.age !== undefined && m.age < 12));
        minorsOnly.forEach((m, idx) => {
          const mId = m.id || `${g.id}-minor-${idx}`;
          const mName = m.name ? `${m.name} ${m.lastName || ""}`.trim() : `Menor ${idx + 1}`;
          const mAge = m.age !== undefined && !isNaN(Number(m.age)) ? Number(m.age) : 0;

          const enrolledSat = checkEnrollment(m, mId, mName, g, satAct?.id);
          const enrolledSun = checkEnrollment(m, mId, mName, g, sunAct?.id);

          const titularName = (g.nombreTitular && g.apellidosTitular 
            ? `${g.nombreTitular} ${g.apellidosTitular}`
            : (g.name || "Sin nombre")).trim();

          flatMinors.push({
            id: mId,
            minorName: String(mName || `Menor ${idx + 1}`).trim().toUpperCase(),
            minorAge: mAge,
            titularName: titularName.trim().toUpperCase(),
            razonSocial: (g.distribuidora || g.distributor || "STELLANTIS").trim().toUpperCase(),
            roomNumber: g.numeroHabitacion || (g as any).numHabitacion || "Pendiente",
            isMovieNightsEnrolled: enrolledSat || enrolledSun,
            enrolledSat,
            enrolledSun,
            guestRef: g
          });
        });
      } else {
        const numMenoresCount = Math.round(g.numMenores || 0);
        for (let idx = 0; idx < numMenoresCount; idx++) {
          const mId = `${g.id}-minor-${idx}`;
          const mName = Array.isArray((g as any).nombreMenores) ? (g as any).nombreMenores[idx] : ((g as any).nombreMenores || `Menor ${idx + 1}`);
          const mAgeRaw = Array.isArray((g as any).edadMenores) ? parseInt((g as any).edadMenores[idx] || "0", 10) : parseInt(String((g as any).edadMenores || "0"), 10);
          const mAge = isNaN(mAgeRaw) ? 0 : mAgeRaw;

          const enrolledSat = checkEnrollment(null, mId, mName, g, satAct?.id);
          const enrolledSun = checkEnrollment(null, mId, mName, g, sunAct?.id);

          const titularName = (g.nombreTitular && g.apellidosTitular 
            ? `${g.nombreTitular} ${g.apellidosTitular}`
            : (g.name || "Sin nombre")).trim();

          flatMinors.push({
            id: mId,
            minorName: String(mName || `Menor ${idx + 1}`).trim().toUpperCase(),
            minorAge: mAge,
            titularName: titularName.trim().toUpperCase(),
            razonSocial: (g.distribuidora || g.distributor || "STELLANTIS").trim().toUpperCase(),
            roomNumber: g.numeroHabitacion || (g as any).numHabitacion || "Pendiente",
            isMovieNightsEnrolled: enrolledSat || enrolledSun,
            enrolledSat,
            enrolledSun,
            guestRef: g
          });
        }
      }
    });

    // Sort based on minorsSortField and minorsSortDir
    const sortedMinors = [...flatMinors].sort((a, b) => {
      let comparison = 0;
      if (minorsSortField === "edad") {
        comparison = a.minorAge - b.minorAge;
      } else if (minorsSortField === "enrolledSat") {
        const aVal = a.enrolledSat ? 1 : 0;
        const bVal = b.enrolledSat ? 1 : 0;
        comparison = aVal - bVal;
      } else if (minorsSortField === "enrolledSun") {
        const aVal = a.enrolledSun ? 1 : 0;
        const bVal = b.enrolledSun ? 1 : 0;
        comparison = aVal - bVal;
      } else if (minorsSortField === "enrolled") {
        const aVal = (a.enrolledSat ? 1 : 0) + (a.enrolledSun ? 1 : 0);
        const bVal = (b.enrolledSat ? 1 : 0) + (b.enrolledSun ? 1 : 0);
        comparison = aVal - bVal;
      } else {
        comparison = a.minorName.localeCompare(b.minorName, 'es');
      }

      // If equal, fallback to name sorting
      if (comparison === 0) {
        comparison = a.minorName.localeCompare(b.minorName, 'es');
      }

      return minorsSortDir === 'asc' ? comparison : -comparison;
    });

    // Apply search filter if query is present
    if (!categoryModalSearch.trim()) return sortedMinors;
    const q = categoryModalSearch.toLowerCase().trim();
    return sortedMinors.filter(item => {
      return item.minorName.toLowerCase().includes(q) || 
             item.titularName.toLowerCase().includes(q) || 
             item.razonSocial.toLowerCase().includes(q) || 
             item.roomNumber.toLowerCase().includes(q);
    });
  }, [selectedCategoryModal, guests, categoryModalSearch, minorsSortField, minorsSortDir]);

  const handleExportCategoryXLS = (catName: string) => {
    if (catName === "Menores") {
      const activeGuests = (guests || []).filter(g => (g.status as string) !== "Cancelado" && (g.status as string) !== "Cancelada");
      const acts = DataStore.getActivities ? DataStore.getActivities() : [];
      const movieNightActivityIds = acts.filter((a: any) => {
        const type = (a.activityType || a.category || "").toUpperCase();
        const name = (a.name || "").toUpperCase();
        return type === "MOVIE_NIGHTS" || type === "MOVIE NIGHTS" || name.includes("MOVIE");
      }).map((a: any) => a.id);

      const exportRows: any[] = [];
      activeGuests.forEach(g => {
        const minorsList = g.minors || [];
        
        if (minorsList.length > 0) {
          const minorsOnly = minorsList.filter((m: any) => m.tipo === "minor" || (m.tipo !== "adult" && m.age !== undefined && m.age < 12));
          minorsOnly.forEach((m, idx) => {
            const mId = m.id || `${g.id}-minor-${idx}`;
            const mName = m.name ? `${m.name} ${m.lastName || ""}`.trim() : `Menor ${idx + 1}`;
            const mAge = m.age !== undefined && !isNaN(Number(m.age)) ? Number(m.age) : 0;

            let enrolled = false;
            if (m.selectedActivities && m.selectedActivities.some(actId => movieNightActivityIds.includes(actId))) {
              enrolled = true;
            } else {
              const hasRes = (g.activityReservations || []).some(r => {
                const isMatchAct = movieNightActivityIds.includes(r.activityId);
                if (!isMatchAct) return false;
                const isMinorPerson = r.personType === "minor" || (r.personId && r.personId.startsWith("minor"));
                const nameLower = (r.personName || "").trim().toLowerCase();
                const targetNameLower = String(mName || "").trim().toLowerCase();
                return isMinorPerson && (r.personId === mId || nameLower.includes(targetNameLower) || targetNameLower.includes(nameLower));
              });
              if (hasRes) {
                enrolled = true;
              } else if (g.selectedActivities && g.selectedActivities.some(actId => movieNightActivityIds.includes(actId))) {
                enrolled = true;
              }
            }

            const titularName = (g.nombreTitular && g.apellidosTitular 
              ? `${g.nombreTitular} ${g.apellidosTitular}`
              : (g.name || "Sin nombre")).trim();

            exportRows.push({
              "NOMBRE DEL MENOR": String(mName || `Menor ${idx + 1}`).trim().toUpperCase(),
              "EDAD": mAge === 0 ? "0-11 MESES" : mAge,
              "TITULAR RESPONSABLE": titularName.toUpperCase(),
              "RAZÓN SOCIAL / EMPRESA": (g.distribuidora || g.distributor || "").toUpperCase(),
              "GRUPO": (g.grupo || "STELLANTIS").toUpperCase(),
              "INSCRITO EN MOVIE NIGHTS": enrolled ? "SÍ" : "NO",
              "NO. HABITACIÓN": g.numeroHabitacion || (g as any).numHabitacion || "PENDIENTE",
              "ESTATUS TITULAR": (g.status || "").toUpperCase()
            });
          });
        } else {
          const numMenoresCount = Math.round(g.numMenores || 0);
          for (let idx = 0; idx < numMenoresCount; idx++) {
            const mId = `${g.id}-minor-${idx}`;
            const mName = Array.isArray((g as any).nombreMenores) ? (g as any).nombreMenores[idx] : ((g as any).nombreMenores || `Menor ${idx + 1}`);
            const mAgeRaw = Array.isArray((g as any).edadMenores) ? parseInt((g as any).edadMenores[idx] || "0", 10) : parseInt(String((g as any).edadMenores || "0"), 10);
            const mAge = isNaN(mAgeRaw) ? 0 : mAgeRaw;

            let enrolled = false;
            const hasRes = (g.activityReservations || []).some(r => {
              const isMatchAct = movieNightActivityIds.includes(r.activityId);
              if (!isMatchAct) return false;
              const isMinorPerson = r.personType === "minor" || (r.personId && r.personId.startsWith("minor"));
              const nameLower = (r.personName || "").trim().toLowerCase();
              const targetNameLower = String(mName || "").trim().toLowerCase();
              return isMinorPerson && (r.personId === mId || nameLower.includes(targetNameLower) || targetNameLower.includes(nameLower));
            });
            if (hasRes) {
              enrolled = true;
            } else if (g.selectedActivities && g.selectedActivities.some(actId => movieNightActivityIds.includes(actId))) {
              enrolled = true;
            }

            const titularName = (g.nombreTitular && g.apellidosTitular 
              ? `${g.nombreTitular} ${g.apellidosTitular}`
              : (g.name || "Sin nombre")).trim();

            exportRows.push({
              "NOMBRE DEL MENOR": String(mName || `Menor ${idx + 1}`).trim().toUpperCase(),
              "EDAD": mAge === 0 ? "0-11 MESES" : mAge,
              "TITULAR RESPONSABLE": titularName.toUpperCase(),
              "RAZÓN SOCIAL / EMPRESA": (g.distribuidora || g.distributor || "").toUpperCase(),
              "GRUPO": (g.grupo || "STELLANTIS").toUpperCase(),
              "INSCRITO EN MOVIE NIGHTS": enrolled ? "SÍ" : "NO",
              "NO. HABITACIÓN": g.numeroHabitacion || (g as any).numHabitacion || "PENDIENTE",
              "ESTATUS TITULAR": (g.status || "").toUpperCase()
            });
          }
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Menores Registrados");
      XLSX.writeFile(workbook, `Padrón_Menores_${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }

    const rawList = categoryGuestsMap[catName] || [];
    const catGuests = [...rawList].sort((a, b) => {
      const nameA = (a.apellidosTitular ? `${a.apellidosTitular} ${a.nombreTitular || ""}` : (a.name || "")).trim().toUpperCase();
      const nameB = (b.apellidosTitular ? `${b.apellidosTitular} ${b.nombreTitular || ""}` : (b.name || "")).trim().toUpperCase();
      return nameA.localeCompare(nameB, 'es');
    });

    const exportRows: any[] = [];
    catGuests.forEach(g => {
      const habCount = Math.max(1, g.numHabitaciones || 1);
      for (let r = 0; r < habCount; r++) {
        const carnetIndexInGroup = getCarnetIndexInGroup(g.id, r, guests);
        const carnetGuestObj = r === 0 ? g : {
          ...g,
          companions: [],
          nombreAcompanante: undefined,
          minors: [],
          numMenores: 0,
          carnetTipoHabitacion: "Sencilla"
        };
        const fin = calculateCarnetFinancials(carnetGuestObj, undefined, carnetIndexInGroup);
        const isAdistem = (g.grupo || "").trim().toUpperCase() === "ADISTEM";
        const carnetCostToUse = isAdistem ? 0 : fin.costoCarnetEvento;
        const totalGeneralToUse = isAdistem ? (fin.totalGeneralCarnet - fin.costoCarnetEvento) : fin.totalGeneralCarnet;
        const comp = g.companions?.[0];
        const compName = r === 0 ? (g.nombreAcompanante || (comp ? `${comp.nombres || comp.name || ""} ${comp.apellidos || ""}`.trim() : "")) : "";
        const menoresCount = r === 0 ? Math.round(g.numMenores || (g.minors ? g.minors.length : 0)) : 0;

        let guestPuesto = g.puesto || (g as any).cargo || "Dueño";
        if (guestPuesto === "Otros") guestPuesto = "Externos";

        exportRows.push({
          "CATEGORÍA": catName.toUpperCase(),
          "GRUPO": (g.grupo || "STELLANTIS").toUpperCase(),
          "DISTRIBUIDORA": (g.distribuidora || g.distributor || "").toUpperCase(),
          "APELLIDOS TITULAR": (g.apellidosTitular || (g.name ? g.name.split(' ').slice(1).join(' ') : "")).toUpperCase(),
          "NOMBRE TITULAR": (g.nombreTitular || (g.name ? g.name.split(' ')[0] : "")).toUpperCase(),
          "PUESTO / CARGO": guestPuesto.toUpperCase(),
          "EMAIL": g.email || "",
          "TELÉFONO": g.phone || g.celularTitular || "",
          "ACOMPAÑANTE": compName.toUpperCase(),
          "NUM. MENORES": menoresCount,
          "HOTEL": fin.hotelName.toUpperCase(),
          "CONFIGURACIÓN": (g.configuracionHabitacion || "King").toUpperCase(),
          "TIPO CARNET": fin.isDoble ? "DOBLE" : "SENCILLO",
          "COSTO CARNET": carnetCostToUse,
          "NOCHES ADICIONALES": fin.nochesAdicionales,
          "TOTAL DÍAS ADICIONALES": fin.totalDiasAdicionalesCarnet,
          "RECARGO 3ER+ CARNET": fin.recargoTercerCarnet,
          "TOTAL A PAGAR": totalGeneralToUse,
          "ESTATUS REGISTRO": (g.status || "").toUpperCase(),
          "COMENTARIOS STAFF ADMIN": (g.comentariosAdmin || "").toUpperCase(),
          "NOTAS / COMENTARIOS INTERNOS DE COMUNICACIÓN": (g.comentariosAdmin || "").toUpperCase()
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Cat_${catName.substring(0, 25)}`);
    XLSX.writeFile(workbook, `Padrón_${catName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Exportar listado de grupos Etapa 1 a formato Excel (XLSX)
  const handleExportStage1GroupsXLS = (exportAll = false) => {
    const groupsToExport = (!exportAll && filteredStage1Groups.length > 0) ? filteredStage1Groups : GROUPS_LIST;
    const activitiesList = DataStore.getActivities() || activities || [];

    const excelData: Array<Record<string, any>> = [];

    let countWithTitular = 0;
    let countWithoutTitular = 0;
    let totalAdultCompanions = 0;
    let totalMinorsCount = 0;
    let totalPeopleCount = 0;

    groupsToExport.forEach((groupName, idx) => {
      const titular = stage1GroupRegistrations[groupName.toUpperCase()];
      const agencies = GROUPS_DATA[groupName] || [];
      const isRegistered = !!titular;

      if (isRegistered) {
        countWithTitular++;
      } else {
        countWithoutTitular++;
      }

      // Titular data
      const titularName = isRegistered
        ? (`${titular.nombreTitular || ""} ${titular.apellidosTitular || ""}`.trim() || titular.name || "Titular Registrado")
        : "— (Sin registro)";
      const titularEmail = isRegistered ? (titular.email || titular.correoTitular || "—") : "—";
      const titularPhone = isRegistered ? (titular.phone || titular.celularTitular || "—") : "—";
      const titularDistribuidora = isRegistered ? (titular.distribuidora || titular.distributor || "—") : "—";
      const titularStatus = isRegistered ? (titular.status || "Registrado") : "DISPONIBLE";

      // Adult companion data
      let acompName = "—";
      let acompSexo = "—";
      let acompAlergias = "—";

      if (isRegistered) {
        const directAcomp = `${titular.nombreAcompanante || ""} ${titular.apellidosAcompanante || ""}`.trim();
        const firstComp = titular.companions && titular.companions.length > 0 ? titular.companions[0] : null;

        if (directAcomp) {
          acompName = directAcomp;
          acompSexo = titular.sexoAcompanante || (firstComp?.sex || "—");
          acompAlergias = titular.alergiasAcompanante || (firstComp?.allergies || "—");
        } else if (firstComp && (firstComp.name || firstComp.firstName)) {
          acompName = firstComp.name || `${firstComp.firstName || ""} ${firstComp.lastName || ""}`.trim();
          acompSexo = firstComp.sex || titular.sexoAcompanante || "—";
          acompAlergias = firstComp.allergies || titular.alergiasAcompanante || "—";
        }
      }

      const hasAdultComp = acompName !== "—" && acompName.trim().length > 0;
      if (hasAdultComp) totalAdultCompanions++;

      // Minors data
      const minorsCount = isRegistered ? (titular.numMenores || (titular.minors ? titular.minors.length : 0) || 0) : 0;
      totalMinorsCount += minorsCount;

      let menoresDetalle = "0 Menores";
      if (isRegistered && titular.minors && titular.minors.length > 0) {
        menoresDetalle = titular.minors.map((m, mIdx) => {
          const mName = `${m.name || ""} ${m.lastName || ""}`.trim() || `Menor ${mIdx + 1}`;
          const mAge = m.age ? `${m.age} años` : "";
          const mSex = m.sex || "";
          const mAllerg = m.allergies ? `[Alergias: ${m.allergies}]` : "";
          return `${mIdx + 1}. ${mName}${mAge || mSex || mAllerg ? ` (${[mAge, mSex, mAllerg].filter(Boolean).join(", ")})` : ""}`;
        }).join("; ");
      } else if (minorsCount > 0) {
        menoresDetalle = `${minorsCount} Menor(es)`;
      } else if (!isRegistered) {
        menoresDetalle = "—";
      }

      const totalPaxGrupo = isRegistered ? (1 + (hasAdultComp ? 1 : 0) + minorsCount) : 0;
      totalPeopleCount += totalPaxGrupo;

      // Extract activities for titular, companion and minors
      const titularActReservations: string[] = [];
      const acompActReservations: string[] = [];
      const minorsActReservations: string[] = [];

      if (isRegistered) {
        // 1. From activityReservations
        (titular.activityReservations || []).forEach(res => {
          const actObj = activitiesList.find(a => a.id === res.activityId);
          const actName = res.activityName || actObj?.name || res.activityId;
          const schedule = [res.dayLabel || res.dayDate, res.slotTime].filter(Boolean).join(" ");
          const desc = schedule ? `${actName} (${schedule})` : actName;

          if (res.personType === "companion" || res.personId === "companion") {
            if (!acompActReservations.includes(desc)) acompActReservations.push(desc);
          } else if (res.personType === "minor" || res.personId?.startsWith("minor")) {
            if (!minorsActReservations.includes(desc)) minorsActReservations.push(desc);
          } else {
            if (!titularActReservations.includes(desc)) titularActReservations.push(desc);
          }
        });

        // 2. From titular.selectedActivities
        (titular.selectedActivities || []).forEach(actId => {
          const actObj = activitiesList.find(a => a.id === actId);
          const actName = actObj?.name || actId;
          const alreadyListed = titularActReservations.some(item => item.startsWith(actName));
          if (!alreadyListed) {
            titularActReservations.push(`${actName} (Inscrito)`);
          }
        });

        // 3. From titular.companions[0].selectedActivities
        if (titular.companions && titular.companions.length > 0) {
          (titular.companions[0].selectedActivities || []).forEach(actId => {
            const actObj = activitiesList.find(a => a.id === actId);
            const actName = actObj?.name || actId;
            const alreadyListed = acompActReservations.some(item => item.startsWith(actName));
            if (!alreadyListed) {
              acompActReservations.push(`${actName} (Inscrito)`);
            }
          });
        }
      }

      const titularActStr = titularActReservations.length > 0 ? titularActReservations.join("; ") : (isRegistered ? "Ninguna" : "—");
      const acompActStr = acompActReservations.length > 0 ? acompActReservations.join("; ") : (isRegistered ? (hasAdultComp ? "Ninguna" : "Sin acompañante") : "—");
      const minorsActStr = minorsActReservations.length > 0 ? minorsActReservations.join("; ") : (isRegistered ? (minorsCount > 0 ? "Ninguna" : "Sin menores") : "—");

      let resumenActividadesGrupo = "—";
      if (isRegistered) {
        const parts: string[] = [];
        if (titularActReservations.length > 0) parts.push(`Titular: ${titularActReservations.join(", ")}`);
        if (acompActReservations.length > 0) parts.push(`Acompañante: ${acompActReservations.join(", ")}`);
        if (minorsActReservations.length > 0) parts.push(`Menores: ${minorsActReservations.join(", ")}`);
        resumenActividadesGrupo = parts.length > 0 ? parts.join(" | ") : "Sin actividades registradas";
      }

      const rowObj: Record<string, any> = {
        "No.": idx + 1,
        "Grupo Empresarial": groupName,
        "Distribuidoras Convocadas": agencies.join(", ") || "—",
        "Estado Etapa 1": isRegistered ? "CON REGISTRO" : "DISPONIBLE (SIN REGISTRO)",
        "Titular Registrado": titularName,
        "Correo Titular": titularEmail,
        "Teléfono Titular": titularPhone,
        "Razón Social / Distribuidora": titularDistribuidora,
        "Estatus Expediente": titularStatus,
        "Acompañante Adulto": acompName,
        "Sexo Acompañante": acompSexo,
        "Alergias Acompañante": acompAlergias,
        "Número de Menores": minorsCount,
        "Detalle Menores": menoresDetalle,
        "Total Integrantes Grupo": totalPaxGrupo,
        "Actividades Titular": titularActStr,
        "Actividades Acompañante": acompActStr,
        "Actividades Menores": minorsActStr,
        "Resumen Actividades Grupo": resumenActividadesGrupo,
      };

      // Dynamic activity columns for each catalog activity
      activitiesList.forEach(act => {
        if (!isRegistered) {
          rowObj[`Actividad: ${act.name}`] = "";
          return;
        }

        const actType = (act.activityType || act.category || "").toUpperCase();
        const actName = (act.name || "").toUpperCase();
        const actId = (act.id || "").toUpperCase();
        const isMovie = actType === "MOVIE_NIGHTS" || actType === "MOVIE NIGHTS" || actName.includes("MOVIE") || actId.includes("MOVIE");

        if (isMovie) {
          const minorsRes = (titular.activityReservations || []).filter(r => r.activityId === act.id && (r.personType === "minor" || (r.personId && r.personId.startsWith("minor"))));
          const minorsHasIt = minorsRes.length > 0 || (titular.minors && titular.minors.some((m: any) => (m.selectedActivities || []).includes(act.id))) || (titular.selectedActivities || []).includes(act.id);
          if (minorsHasIt) {
            const mCount = minorsRes.length > 0 ? minorsRes.length : (titular.minors?.length || titular.numMenores || 1);
            rowObj[`Actividad: ${act.name}`] = `menores : ${mCount}`;
          } else {
            rowObj[`Actividad: ${act.name}`] = "";
          }
          return;
        }

        const titularHasIt = (titular.selectedActivities || []).includes(act.id) ||
          (titular.activityReservations || []).some(r => r.activityId === act.id && (r.personType === "titular" || r.personId === "titular"));
        
        const acompHasIt = (titular.activityReservations || []).some(r => r.activityId === act.id && (r.personType === "companion" || (r.personId && r.personId !== "titular" && !r.personId.startsWith("minor")))) ||
          (titular.companions && titular.companions.some(c => (c.selectedActivities || []).includes(act.id)));

        const minorsRes = (titular.activityReservations || []).filter(r => r.activityId === act.id && (r.personType === "minor" || (r.personId && r.personId.startsWith("minor"))));
        const minorsHasIt = minorsRes.length > 0 || (titular.minors && titular.minors.some((m: any) => (m.selectedActivities || []).includes(act.id)));

        // Detail of slot/schedule
        const tRes = (titular.activityReservations || []).find(r => r.activityId === act.id && (r.personType === "titular" || r.personId === "titular"));
        const cRes = (titular.activityReservations || []).find(r => r.activityId === act.id && (r.personType === "companion" || (r.personId && r.personId !== "titular" && !r.personId.startsWith("minor"))));

        const tSched = tRes?.slotTime ? `${tRes.dayLabel || tRes.dayDate || ''} ${tRes.slotTime}`.trim() : "";
        const cSched = cRes?.slotTime ? `${cRes.dayLabel || cRes.dayDate || ''} ${cRes.slotTime}`.trim() : "";

        const enrolledTypes: string[] = [];
        if (titularHasIt) enrolledTypes.push(tSched ? `TITULAR ${tSched}` : "TITULAR");
        if (acompHasIt) enrolledTypes.push(cSched ? `ACOMP ${cSched}` : "ACOMP");
        if (minorsHasIt) {
          const mNames = minorsRes.map(m => m.personName || "Menor").filter(Boolean);
          enrolledTypes.push(mNames.length > 0 ? `MENOR (${mNames.join(", ")})` : "MENOR");
        }

        if (enrolledTypes.length > 0) {
          rowObj[`Actividad: ${act.name}`] = enrolledTypes.join(", ");
        } else {
          rowObj[`Actividad: ${act.name}`] = "";
        }
      });

      // Hotel & Lodging
      rowObj["Hotel"] = isRegistered ? (titular.hotelAlojamiento || config?.hotelSede || "—") : "—";
      rowObj["Tipo Habitación"] = isRegistered ? (titular.carnetTipoHabitacion || "Sencilla") : "—";
      rowObj["Configuración Cama"] = isRegistered ? (titular.configuracionHabitacion || "King") : "—";
      rowObj["Habitación No."] = isRegistered ? (titular.numeroHabitacion || "S/N") : "—";
      rowObj["Fecha Registro"] = isRegistered && titular.createdAt ? new Date(titular.createdAt).toLocaleDateString("es-MX") : "—";

      excelData.push(rowObj);
    });

    // Separator row
    excelData.push({} as any);

    // Summary row
    const totalsRow: Record<string, any> = {
      "No.": "TOTALES",
      "Grupo Empresarial": `Total Grupos: ${groupsToExport.length}`,
      "Distribuidoras Convocadas": "",
      "Estado Etapa 1": `Con Titular: ${countWithTitular} | Disponibles: ${countWithoutTitular}`,
      "Titular Registrado": `Total Titulares: ${countWithTitular}`,
      "Correo Titular": "",
      "Teléfono Titular": "",
      "Razón Social / Distribuidora": "",
      "Estatus Expediente": "",
      "Acompañante Adulto": `Total Acompañantes: ${totalAdultCompanions}`,
      "Sexo Acompañante": "",
      "Alergias Acompañante": "",
      "Número de Menores": totalMinorsCount,
      "Detalle Menores": `Total Menores: ${totalMinorsCount}`,
      "Total Integrantes Grupo": `Total Pax: ${totalPeopleCount}`,
      "Actividades Titular": "",
      "Actividades Acompañante": "",
      "Actividades Menores": "",
      "Resumen Actividades Grupo": "",
    };

    activitiesList.forEach(act => {
      let registeredInAct = 0;
      let paxInAct = 0;
      groupsToExport.forEach(gName => {
        const tit = stage1GroupRegistrations[gName.toUpperCase()];
        if (!tit) return;
        const resList = (tit.activityReservations || []).filter(r => r.activityId === act.id);
        const inAct = (tit.selectedActivities || []).includes(act.id) || resList.length > 0 ||
          (tit.companions && tit.companions.some(c => (c.selectedActivities || []).includes(act.id))) ||
          (tit.minors && tit.minors.some((m: any) => (m.selectedActivities || []).includes(act.id)));
        if (inAct) {
          registeredInAct++;
          paxInAct += resList.length > 0 ? resList.length : 1;
        }
      });
      totalsRow[`Actividad: ${act.name}`] = `Inscritos: ${paxInAct}`;
    });

    totalsRow["Hotel"] = "";
    totalsRow["Tipo Habitación"] = "";
    totalsRow["Configuración Cama"] = "";
    totalsRow["Habitación No."] = "";
    totalsRow["Fecha Registro"] = "";

    excelData.push(totalsRow);

    // Convert keys and string values in all rows to UPPERCASE for clean XLS export
    const upperExcelData = excelData.map(row => {
      const newRow: Record<string, any> = {};
      Object.keys(row || {}).forEach(key => {
        const upperKey = key.toUpperCase();
        const val = (row as any)[key];
        if (typeof val === "string") {
          newRow[upperKey] = val.toUpperCase();
        } else {
          newRow[upperKey] = val;
        }
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(upperExcelData);

    // Style header row
    if (worksheet["!ref"]) {
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            fill: { fgColor: { rgb: "D9E1F2" }, patternType: "solid" },
            font: { bold: true }
          };
        }
      }
    }

    const colWidths = Object.keys(upperExcelData[0] || {}).map(key => {
      let maxLen = key.length;
      upperExcelData.forEach(row => {
        const val = (row as any)[key];
        if (val !== undefined && val !== null) {
          const str = String(val);
          if (str.length > maxLen && str.length < 80) {
            maxLen = str.length;
          }
        }
      });
      return { wch: Math.max(maxLen + 3, 14) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grupos y Actividades Etapa 1");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Control_Grupos_Etapa1_ADISTEM_2026_${dateStr}.xlsx`);
  };

  // Helper para normalizar y parsear fechas de vuelos (llegadas y salidas)
  const parseFlightDateHelper = (rawDate?: string, flightInfo?: any, isDeparture = false) => {
    let s = (rawDate || "").trim();
    if (!s && flightInfo) {
      s = (isDeparture 
        ? (flightInfo.departureDateTime || flightInfo.arrivalDateTime || "") 
        : (flightInfo.arrivalDateTime || flightInfo.departureDateTime || "")
      ).trim();
    }
    if (!s || s === "N/A" || s === "undefined" || s === "null") return null;

    let y: number | undefined;
    let m: number | undefined;
    let d: number | undefined;

    // Formato ISO: YYYY-MM-DD
    const ymd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymd) {
      y = parseInt(ymd[1], 10);
      m = parseInt(ymd[2], 10);
      d = parseInt(ymd[3], 10);
    } else {
      // Formato DD/MM/YYYY o MM/DD/YYYY
      const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dmy) {
        const part1 = parseInt(dmy[1], 10);
        const part2 = parseInt(dmy[2], 10);
        const part3 = parseInt(dmy[3], 10);

        if (part1 > 12 && part2 <= 12) {
          d = part1;
          m = part2;
          y = part3;
        } else if (part2 > 12 && part1 <= 12) {
          m = part1;
          d = part2;
          y = part3;
        } else if (part2 === 11) {
          // Convención de México DD/MM/YYYY (ej. 05/11/2026)
          d = part1;
          m = 11;
          y = part3;
        } else if (part1 === 11) {
          // Formato US MM/DD/YYYY
          m = 11;
          d = part2;
          y = part3;
        } else {
          d = part1;
          m = part2;
          y = part3;
        }
      }
    }

    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) {
      const dt = new Date(s);
      if (!isNaN(dt.getTime())) {
        y = dt.getFullYear();
        m = dt.getMonth() + 1;
        d = dt.getDate();
      }
    }

    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
    if (y < 2024 || y > 2030) {
      y = 2026;
    }

    const dt = new Date(y, m - 1, d);
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const shortMonths = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayName = daysOfWeek[dt.getDay()] || "";
    const monthName = months[m - 1] || "";
    const shortMonthName = shortMonths[m - 1] || "";

    return {
      key,
      year: y,
      month: m,
      day: d,
      label: `${dayName} ${d} de ${monthName} ${y}`,
      shortLabel: `${dayName.substring(0, 3)} ${d} ${shortMonthName}`
    };
  };

  // Resumen agrupado por día y horarios de LLEGADAS de vuelos
  const dailyArrivalsSummary = useMemo(() => {
    interface ArrivalRecord {
      id: string;
      guestId: string;
      titularName: string;
      puesto: string;
      distribuidora: string;
      grupo: string;
      hotel: string;
      phone: string;
      email: string;
      airline: string;
      flightNumber: string;
      flightTime: string;
      rawDate: string;
      pax: number;
      companionNames: string[];
      isCompanionFlight?: boolean;
    }

    const map = new Map<string, {
      dateKey: string;
      dateLabel: string;
      shortLabel: string;
      records: ArrivalRecord[];
      totalPax: number;
      uniqueFlights: Set<string>;
      timeBuckets: { morning: number; afternoon: number; evening: number; other: number };
      topHours: Map<string, number>;
    }>();

    // Días oficiales del evento para llegadas (4 a 8 Noviembre 2026)
    const officialDateKeys = ["2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
    officialDateKeys.forEach(k => {
      const p = parseFlightDateHelper(k);
      if (p) {
        map.set(k, {
          dateKey: k,
          dateLabel: p.label,
          shortLabel: p.shortLabel,
          records: [],
          totalPax: 0,
          uniqueFlights: new Set(),
          timeBuckets: { morning: 0, afternoon: 0, evening: 0, other: 0 },
          topHours: new Map()
        });
      }
    });

    let pendingCount = 0;
    const activeGuests = guests.filter(g => g.status !== GuestStatus.CANCELLED);

    activeGuests.forEach(g => {
      const gAny = g as any;
      const hasComp = (g.companions && g.companions.length > 0) || !!g.nombreAcompanante;
      const compNames = (g.companions || []).map(c => c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()).filter(Boolean);
      if (compNames.length === 0 && g.nombreAcompanante) {
        compNames.push(g.nombreAcompanante);
      }

      // 1. Vuelo de llegada titular
      const parsedArr1 = parseFlightDateHelper(g.vueloLlegadaFecha, g.flightArrival, false);
      const arrAirline1 = g.vueloLlegadaAerolinea || g.flightArrival?.airline || "";
      const arrNo1 = g.vueloLlegadaNoVuelo || g.flightArrival?.flightNumber || "";
      let arrTime1 = g.vueloLlegadaHora || (g.flightArrival?.arrivalDateTime ? new Date(g.flightArrival.arrivalDateTime).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }) : "") || "";
      if (arrTime1.includes("T")) {
        const tMatch = arrTime1.match(/T(\d{1,2}:\d{2})/);
        if (tMatch) arrTime1 = tMatch[1];
      }

      const pax1 = g.vueloLlegadaPersonas || (!g.vuelosSeparados && hasComp ? 1 + compNames.length : 1);

      if (parsedArr1) {
        if (!map.has(parsedArr1.key)) {
          map.set(parsedArr1.key, {
            dateKey: parsedArr1.key,
            dateLabel: parsedArr1.label,
            shortLabel: parsedArr1.shortLabel,
            records: [],
            totalPax: 0,
            uniqueFlights: new Set(),
            timeBuckets: { morning: 0, afternoon: 0, evening: 0, other: 0 },
            topHours: new Map()
          });
        }
        const item = map.get(parsedArr1.key)!;
        item.records.push({
          id: `${g.id}-arr1`,
          guestId: g.id,
          titularName: g.name || `${g.nombreTitular || ""} ${g.apellidosTitular || ""}`.trim(),
          puesto: g.puesto || gAny.cargo || "Dueño",
          distribuidora: g.distribuidora || g.distributor || "ADISTEM",
          grupo: g.grupo || "Stellantis",
          hotel: g.hotelAlojamiento || config.hotelSede || "Sin asignar",
          phone: g.phone || g.celularTitular || "",
          email: g.email || "",
          airline: arrAirline1,
          flightNumber: arrNo1,
          flightTime: arrTime1,
          rawDate: g.vueloLlegadaFecha || "",
          pax: pax1,
          companionNames: !g.vuelosSeparados ? compNames : [],
          isCompanionFlight: false
        });
        item.totalPax += pax1;
        if (arrNo1) item.uniqueFlights.add(`${arrAirline1} ${arrNo1}`.trim());

        const hourNum = parseInt(arrTime1.split(":")[0], 10);
        if (!isNaN(hourNum)) {
          if (hourNum < 12) item.timeBuckets.morning += pax1;
          else if (hourNum < 18) item.timeBuckets.afternoon += pax1;
          else item.timeBuckets.evening += pax1;
          const hrKey = `${String(hourNum).padStart(2, '0')}:00`;
          item.topHours.set(hrKey, (item.topHours.get(hrKey) || 0) + pax1);
        } else {
          item.timeBuckets.other += pax1;
        }
      } else {
        pendingCount += pax1;
      }

      // 2. Vuelo de llegada acompañante si vienen separados
      if (g.vuelosSeparados) {
        const compDateRaw = gAny.vueloLlegadaFecha2 || (g.companions?.[0] as any)?.vueloLlegadaFecha;
        const parsedArr2 = parseFlightDateHelper(compDateRaw, null, false);
        const arrAirline2 = gAny.vueloLlegadaAerolinea2 || (g.companions?.[0] as any)?.vueloLlegadaAerolinea || "";
        const arrNo2 = gAny.vueloLlegadaNoVuelo2 || (g.companions?.[0] as any)?.vueloLlegadaNoVuelo || "";
        let arrTime2 = gAny.vueloLlegadaHora2 || (g.companions?.[0] as any)?.vueloLlegadaHora || "";
        if (arrTime2.includes("T")) {
          const tMatch = arrTime2.match(/T(\d{1,2}:\d{2})/);
          if (tMatch) arrTime2 = tMatch[1];
        }
        const pax2 = gAny.vueloLlegadaPax2 || compNames.length || 1;

        if (parsedArr2) {
          if (!map.has(parsedArr2.key)) {
            map.set(parsedArr2.key, {
              dateKey: parsedArr2.key,
              dateLabel: parsedArr2.label,
              shortLabel: parsedArr2.shortLabel,
              records: [],
              totalPax: 0,
              uniqueFlights: new Set(),
              timeBuckets: { morning: 0, afternoon: 0, evening: 0, other: 0 },
              topHours: new Map()
            });
          }
          const item2 = map.get(parsedArr2.key)!;
          item2.records.push({
            id: `${g.id}-arr2`,
            guestId: g.id,
            titularName: compNames.join(", ") || `Acompañante de ${g.name}`,
            puesto: "Acompañante",
            distribuidora: g.distribuidora || g.distributor || "ADISTEM",
            grupo: g.grupo || "Stellantis",
            hotel: g.hotelAlojamiento || config.hotelSede || "Sin asignar",
            phone: g.phone || "",
            email: g.email || "",
            airline: arrAirline2,
            flightNumber: arrNo2,
            flightTime: arrTime2,
            rawDate: compDateRaw || "",
            pax: pax2,
            companionNames: [],
            isCompanionFlight: true
          });
          item2.totalPax += pax2;
          if (arrNo2) item2.uniqueFlights.add(`${arrAirline2} ${arrNo2}`.trim());

          const hourNum2 = parseInt(arrTime2.split(":")[0], 10);
          if (!isNaN(hourNum2)) {
            if (hourNum2 < 12) item2.timeBuckets.morning += pax2;
            else if (hourNum2 < 18) item2.timeBuckets.afternoon += pax2;
            else item2.timeBuckets.evening += pax2;
            const hrKey = `${String(hourNum2).padStart(2, '0')}:00`;
            item2.topHours.set(hrKey, (item2.topHours.get(hrKey) || 0) + pax2);
          } else {
            item2.timeBuckets.other += pax2;
          }
        } else {
          pendingCount += pax2;
        }
      }
    });

    // Solo mostramos días oficiales o días que tengan registros reales con pasajeros
    const daysList = Array.from(map.values())
      .filter(d => officialDateKeys.includes(d.dateKey) || d.totalPax > 0)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    const totalConfirmedPax = daysList.reduce((sum, d) => sum + d.totalPax, 0);

    return {
      days: daysList,
      totalConfirmedPax,
      pendingCount
    };
  }, [guests, config]);

  // Resumen agrupado por día y horarios de SALIDAS / RETORNOS de vuelos
  const dailyDeparturesSummary = useMemo(() => {
    interface DepartureRecord {
      id: string;
      guestId: string;
      titularName: string;
      puesto: string;
      distribuidora: string;
      grupo: string;
      hotel: string;
      phone: string;
      email: string;
      airline: string;
      flightNumber: string;
      flightTime: string;
      rawDate: string;
      pax: number;
      companionNames: string[];
      isCompanionFlight?: boolean;
    }

    const map = new Map<string, {
      dateKey: string;
      dateLabel: string;
      shortLabel: string;
      records: DepartureRecord[];
      totalPax: number;
      uniqueFlights: Set<string>;
      timeBuckets: { morning: number; afternoon: number; evening: number; other: number };
      topHours: Map<string, number>;
    }>();

    // Días oficiales del evento para salidas y retornos (6 a 9 Noviembre 2026)
    const officialDepartureKeys = ["2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"];
    officialDepartureKeys.forEach(k => {
      const p = parseFlightDateHelper(k, null, true);
      if (p) {
        map.set(k, {
          dateKey: k,
          dateLabel: p.label,
          shortLabel: p.shortLabel,
          records: [],
          totalPax: 0,
          uniqueFlights: new Set(),
          timeBuckets: { morning: 0, afternoon: 0, evening: 0, other: 0 },
          topHours: new Map()
        });
      }
    });

    let pendingCount = 0;
    const activeGuests = guests.filter(g => g.status !== GuestStatus.CANCELLED);

    activeGuests.forEach(g => {
      const gAny = g as any;
      const hasComp = (g.companions && g.companions.length > 0) || !!g.nombreAcompanante;
      const compNames = (g.companions || []).map(c => c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()).filter(Boolean);
      if (compNames.length === 0 && g.nombreAcompanante) {
        compNames.push(g.nombreAcompanante);
      }

      // 1. Vuelo de retorno titular
      const parsedDep1 = parseFlightDateHelper(g.vueloRegresoFecha, g.flightDeparture, true);
      const depAirline1 = g.vueloRegresoAerolinea || g.flightDeparture?.airline || "";
      const depNo1 = g.vueloRegresoNoVuelo || g.flightDeparture?.flightNumber || "";
      let depTime1 = g.vueloRegresoHora || (g.flightDeparture?.departureDateTime ? new Date(g.flightDeparture.departureDateTime).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }) : "") || "";
      if (depTime1.includes("T")) {
        const tMatch = depTime1.match(/T(\d{1,2}:\d{2})/);
        if (tMatch) depTime1 = tMatch[1];
      }

      const pax1 = g.vueloRegresoPersonas || (!g.vuelosSeparados && hasComp ? 1 + compNames.length : 1);

      if (parsedDep1) {
        if (!map.has(parsedDep1.key)) {
          map.set(parsedDep1.key, {
            dateKey: parsedDep1.key,
            dateLabel: parsedDep1.label,
            shortLabel: parsedDep1.shortLabel,
            records: [],
            totalPax: 0,
            uniqueFlights: new Set(),
            timeBuckets: { morning: 0, afternoon: 0, evening: 0, other: 0 },
            topHours: new Map()
          });
        }
        const item = map.get(parsedDep1.key)!;
        item.records.push({
          id: `${g.id}-dep1`,
          guestId: g.id,
          titularName: g.name || `${g.nombreTitular || ""} ${g.apellidosTitular || ""}`.trim(),
          puesto: g.puesto || gAny.cargo || "Dueño",
          distribuidora: g.distribuidora || g.distributor || "ADISTEM",
          grupo: g.grupo || "Stellantis",
          hotel: g.hotelAlojamiento || config.hotelSede || "Sin asignar",
          phone: g.phone || g.celularTitular || "",
          email: g.email || "",
          airline: depAirline1,
          flightNumber: depNo1,
          flightTime: depTime1,
          rawDate: g.vueloRegresoFecha || "",
          pax: pax1,
          companionNames: !g.vuelosSeparados ? compNames : [],
          isCompanionFlight: false
        });
        item.totalPax += pax1;
        if (depNo1) item.uniqueFlights.add(`${depAirline1} ${depNo1}`.trim());

        const hourNum = parseInt(depTime1.split(":")[0], 10);
        if (!isNaN(hourNum)) {
          if (hourNum < 12) item.timeBuckets.morning += pax1;
          else if (hourNum < 18) item.timeBuckets.afternoon += pax1;
          else item.timeBuckets.evening += pax1;
          const hrKey = `${String(hourNum).padStart(2, '0')}:00`;
          item.topHours.set(hrKey, (item.topHours.get(hrKey) || 0) + pax1);
        } else {
          item.timeBuckets.other += pax1;
        }
      } else {
        pendingCount += pax1;
      }

      // 2. Vuelo de regreso de acompañante si vienen separados
      if (g.vuelosSeparados) {
        const compDateRaw = gAny.vueloRegresoFecha2 || (g.companions?.[0] as any)?.vueloRegresoFecha;
        const parsedDep2 = parseFlightDateHelper(compDateRaw, null, true);
        const depAirline2 = gAny.vueloRegresoAerolinea2 || (g.companions?.[0] as any)?.vueloRegresoAerolinea || "";
        const depNo2 = gAny.vueloRegresoNoVuelo2 || (g.companions?.[0] as any)?.vueloRegresoNoVuelo || "";
        let depTime2 = gAny.vueloRegresoHora2 || (g.companions?.[0] as any)?.vueloRegresoHora || "";
        if (depTime2.includes("T")) {
          const tMatch = depTime2.match(/T(\d{1,2}:\d{2})/);
          if (tMatch) depTime2 = tMatch[1];
        }
        const pax2 = gAny.vueloRegresoPax2 || compNames.length || 1;

        if (parsedDep2) {
          if (!map.has(parsedDep2.key)) {
            map.set(parsedDep2.key, {
              dateKey: parsedDep2.key,
              dateLabel: parsedDep2.label,
              shortLabel: parsedDep2.shortLabel,
              records: [],
              totalPax: 0,
              uniqueFlights: new Set(),
              timeBuckets: { morning: 0, afternoon: 0, evening: 0, other: 0 },
              topHours: new Map()
            });
          }
          const item2 = map.get(parsedDep2.key)!;
          item2.records.push({
            id: `${g.id}-dep2`,
            guestId: g.id,
            titularName: compNames.join(", ") || `Acompañante de ${g.name}`,
            puesto: "Acompañante",
            distribuidora: g.distribuidora || g.distributor || "ADISTEM",
            grupo: g.grupo || "Stellantis",
            hotel: g.hotelAlojamiento || config.hotelSede || "Sin asignar",
            phone: g.phone || "",
            email: g.email || "",
            airline: depAirline2,
            flightNumber: depNo2,
            flightTime: depTime2,
            rawDate: compDateRaw || "",
            pax: pax2,
            companionNames: [],
            isCompanionFlight: true
          });
          item2.totalPax += pax2;
          if (depNo2) item2.uniqueFlights.add(`${depAirline2} ${depNo2}`.trim());

          const hourNum2 = parseInt(depTime2.split(":")[0], 10);
          if (!isNaN(hourNum2)) {
            if (hourNum2 < 12) item2.timeBuckets.morning += pax2;
            else if (hourNum2 < 18) item2.timeBuckets.afternoon += pax2;
            else item2.timeBuckets.evening += pax2;
            const hrKey = `${String(hourNum2).padStart(2, '0')}:00`;
            item2.topHours.set(hrKey, (item2.topHours.get(hrKey) || 0) + pax2);
          } else {
            item2.timeBuckets.other += pax2;
          }
        } else {
          pendingCount += pax2;
        }
      }
    });

    // Solo mostramos días oficiales o días que tengan registros reales con pasajeros
    const daysList = Array.from(map.values())
      .filter(d => officialDepartureKeys.includes(d.dateKey) || d.totalPax > 0)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    const totalConfirmedPax = daysList.reduce((sum, d) => sum + d.totalPax, 0);

    return {
      days: daysList,
      totalConfirmedPax,
      pendingCount
    };
  }, [guests, config]);

  // Exportar vuelos de un día (Llegadas o Salidas) a Excel con formato y diseño profesional
  const handleExportDayFlightsExcel = async (dayGroup: {
    dateKey: string;
    dateLabel: string;
    records: any[];
  }, flightType: 'arrival' | 'departure' = 'arrival') => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ADISTEM 2026 - Control de Vuelos";
    workbook.created = new Date();

    const isArr = flightType === 'arrival';
    const cleanDateKey = dayGroup.dateKey.substring(5) || "General";
    const sheetPrefix = isArr ? "Llegadas" : "Salidas";
    const worksheet = workbook.addWorksheet(`${sheetPrefix} ${cleanDateKey}`, {
      views: [{ state: "frozen", ySplit: 2 }]
    });

    // Paletas de color por tipo
    const titleBg = isArr ? "FFE2F0D9" : "FFE0F2FE"; // Verde tenue / Azul tenue
    const titleText = isArr ? "FF1B4332" : "FF075985";
    const headerBg = isArr ? "FFC8E6C9" : "FFBAE6FD";
    const headerText = isArr ? "FF1B4332" : "FF0369A1";
    const borderCol = isArr ? "FFA5D6A7" : "FF93C5FD";
    const borderMid = isArr ? "FF66BB6A" : "FF3B82F6";
    const totBg = isArr ? "FFD4EDDA" : "FFDBEAFE";
    const totText = isArr ? "FF0F5132" : "FF1E40AF";

    // Title Banner
    worksheet.mergeCells("A1:M1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = isArr 
      ? `REPORTE DE RECEPCIÓN Y LLEGADA DE VUELOS — ${dayGroup.dateLabel.toUpperCase()}`
      : `REPORTE DE SALIDAS Y RETORNO DE VUELOS — ${dayGroup.dateLabel.toUpperCase()}`;
    titleCell.font = { name: "Calibri", size: 13, bold: true, color: { argb: titleText } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: titleBg } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 32;

    const headers = [
      "#",
      "ID Carnet",
      "Invitado Titular",
      "Puesto / Cargo",
      "Distribuidora",
      "Grupo",
      "Acompañantes / Familia",
      "Aerolínea",
      "No. Vuelo",
      isArr ? "Hora Llegada" : "Hora Salida",
      "No. Pax",
      "Hotel Sede",
      "Teléfono / Celular"
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 26;
    headerRow.eachCell(cell => {
      cell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: headerText } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerBg } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: borderCol } },
        bottom: { style: "medium", color: { argb: borderMid } },
        left: { style: "thin", color: { argb: borderCol } },
        right: { style: "thin", color: { argb: borderCol } }
      };
    });

    let totPax = 0;
    dayGroup.records.forEach((rec, idx) => {
      totPax += rec.pax;
      const row = worksheet.addRow([
        idx + 1,
        rec.guestId,
        rec.titularName,
        rec.puesto,
        rec.distribuidora,
        rec.grupo,
        rec.companionNames.join(", ") || "—",
        rec.airline || "—",
        rec.flightNumber || "—",
        rec.flightTime || "—",
        rec.pax,
        rec.hotel || "—",
        rec.phone || "—"
      ]);
      row.height = 20;
      row.eachCell((cell, colNum) => {
        cell.font = { name: "Calibri", size: 9.5 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } }
        };
        if (colNum === 1 || colNum === 2 || colNum === 9 || colNum === 10 || colNum === 11) {
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        }
      });
    });

    // Fila de Totales Generales
    const totRow = worksheet.addRow([
      "TOTAL",
      "",
      `Total Registros: ${dayGroup.records.length}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "TOTAL PAX:",
      totPax,
      "",
      ""
    ]);
    totRow.height = 24;
    totRow.eachCell(cell => {
      cell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: totText } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: totBg } };
      cell.border = {
        top: { style: "medium", color: { argb: borderMid } },
        bottom: { style: "double", color: { argb: titleText } }
      };
    });

    worksheet.columns = [
      { width: 6 },
      { width: 12 },
      { width: 28 },
      { width: 16 },
      { width: 24 },
      { width: 18 },
      { width: 28 },
      { width: 16 },
      { width: 12 },
      { width: 14 },
      { width: 10 },
      { width: 22 },
      { width: 18 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isArr 
      ? `Llegadas_Vuelos_${dayGroup.dateKey}.xlsx`
      : `Salidas_Retorno_Vuelos_${dayGroup.dateKey}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Wrapper para compatibilidad hacia atrás
  const handleExportDayArrivalsExcel = async (dayGroup: {
    dateKey: string;
    dateLabel: string;
    records: any[];
  }) => {
    return handleExportDayFlightsExcel(dayGroup, 'arrival');
  };

  // Alerts calculations
  const flightChangesCount = auditLogs.filter(l => l.action.includes("Vuelo") || l.action.includes("Itinerario")).length;
  const incompleteDocsCount = guests.filter(g => g.status !== GuestStatus.CANCELLED && !g.flightArrival).length; // simple logic for flight missing
  const outOfDeadlinesCount = auditLogs.filter(l => l.action.includes("Fuera de Plazo")).length;

  const handleAlertClick = (type: string) => {
    if (type === "outOfDeadlines") {
      const logs = auditLogs.filter(l => l.action.includes("Fuera de Plazo"));
      setActiveAlertDetail({
        title: "Intentos Fuera de Plazo Detectados",
        description: "Los siguientes registros de auditoría muestran a los invitados que intentaron cambiar datos logísticos después de la fecha límite establecida.",
        type: "error",
        items: logs.map(l => `[${new Date(l.timestamp).toLocaleString("es-MX")}] ${l.userId} (${l.userEmail || "Sistema"}): ${l.action}`)
      });
    } else if (type === "flightChanges") {
      const logs = auditLogs.filter(l => l.action.includes("Vuelo") || l.action.includes("Itinerario") || l.action.toLowerCase().includes("vuelo"));
      setActiveAlertDetail({
        title: "Modificaciones Recientes a Itinerarios de Vuelo",
        description: "Historial de modificaciones de vuelos y transportación terrestres realizadas por los invitados o coordinadores.",
        type: "warning",
        items: logs.map(l => `[${new Date(l.timestamp).toLocaleString("es-MX")}] ${l.userId} (${l.userEmail || "Sistema"}): ${l.action}`)
      });
    } else if (type === "incompleteDocs") {
      const list = guests.filter(g => g.status !== GuestStatus.CANCELLED && !g.flightArrival);
      setActiveAlertDetail({
        title: "Invitados Confirmados Sin Vuelo Registrado",
        description: "Asistentes que confirmaron su presencia pero aún no registran sus horarios o números de vuelo para coordinar su transportación.",
        type: "info",
        items: list.map(g => `${g.id} — ${g.name} (${g.distributor}) | Contacto: ${g.email}`)
      });
    } else if (type === "activitiesMonitoring") {
      const list = activities.map(a => {
        const enrolledCount = a.registeredCount;
        const waitCount = a.waitingList ? a.waitingList.length : 0;
        return `${a.name} (${a.category}) — ${enrolledCount} de ${a.capacity} cupos ocupados | En Lista de Espera: ${waitCount} personas`;
      });
      setActiveAlertDetail({
        title: "Estatus Operativo de Cupos y Listas de Espera",
        description: "Detalle del cupo máximo, asistentes registrados y cantidad de personas en fila de espera por actividad.",
        type: "success",
        items: list
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 font-sans" id="backoffice-login-screen">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/80 shadow-md max-w-xs mx-auto">
              <img 
                src={LogoConvencion} 
                className="h-28 md:h-36 w-auto object-contain max-w-full" 
                alt="Logo Convención ADISTEM" 
              />
            </div>
            <div className="mt-4">
              <h1 className="text-xl font-black text-slate-900 tracking-wider uppercase font-display">
                CONVENCIÓN <span className="text-blue-600 font-extrabold">ADISTEM</span> 2026
              </h1>
              <p className="text-[10px] text-blue-600 font-extrabold tracking-widest uppercase mt-0.5">
                Consola de Control de Staff
              </p>
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Acceso restringido para personal de Staff y administradores de ADISTEM.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@fasterling.mx / staff@fasterling.mx"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contraseña</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="admin / staff"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          </form>
          
          <div className="text-center pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400">Exagono Software © 2026</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] text-slate-800 min-h-screen font-sans flex flex-col md:flex-row" id="backoffice-root">
      
      {/* LEFT NAVIGATION COLUMN */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200/60 flex flex-col p-4 shrink-0 shadow-2xs" id="backoffice-nav">
        <div className="flex flex-col items-center justify-center pb-5 mb-5 border-b border-slate-100 w-full">
          <div className="p-3 bg-white border border-slate-200 rounded-2xl w-full flex items-center justify-center shadow-xs">
            <img 
              src={LogoConvencion} 
              className="h-28 md:h-36 w-auto object-contain mx-auto max-w-full transition-transform duration-300 hover:scale-105" 
              alt="Logo Convención ADISTEM" 
            />
          </div>
          <div className="text-center mt-3">
            <h1 className="font-black text-xs text-brand-primary tracking-tight leading-tight font-display uppercase">
              ADISTEM
            </h1>
            <span className="text-[10px] text-brand-teal font-extrabold tracking-widest uppercase">
              BACKOFFICE
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: "dashboard", label: "Panel Principal", icon: Users },
            { id: "hotels", label: "Sedes & Tarifas", icon: Bed },
            { id: "guests", label: "Padrón de Invitados", icon: UserCheck },
            { id: "config", label: "Reglas & Agenda", icon: Settings },
            { id: "transport", label: "Transporte (Cupos)", icon: Bus },
            { id: "activities", label: "Actividades", icon: Award },
            { id: "comms", label: "Mensajes & Push", icon: MessageSquare },
            { id: "reports", label: "Reportes Versionados", icon: Download },
            { id: "audits", label: "Bitácora & Auditoría", icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedGuest(null); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition text-sm cursor-pointer ${
                  activeTab === tab.id 
                    ? "bg-brand-primary/10 text-brand-primary border-l-4 border-brand-primary font-bold" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 font-medium"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
          {currentUser && (
            <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs space-y-1">
              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">Usuario Conectado</span>
              <span className="text-blue-900 font-bold block truncate font-mono text-[10px]">{currentUser.email}</span>
              <div className="flex items-center gap-1">
                <span className="inline-block bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                  {currentUser.role}
                </span>
                {currentUser.role === "Staff" && (
                  <span className="inline-block bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase">
                    Solo lectura
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100">
            <span className="text-slate-800 font-bold block mb-0.5">Demostración Activa:</span>
            Para simular el flujo del asistente, puedes iniciar sesión en el simulador móvil de la derecha como:
            <span className="block font-mono text-blue-600 mt-1 select-all font-bold">bernardo@fasterling.mx</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-850 transition flex items-center gap-2 cursor-pointer font-bold"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500 rotate-180" />
              Cerrar Sesión Staff
            </button>
            
            <button 
              onClick={() => setResetConfirm(true)}
              className="w-full text-left px-4 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition flex items-center gap-2 cursor-pointer font-bold animate-pulse"
            >
              <Trash2 className="w-3 h-3" />
              Restablecer Evento
            </button>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE CONTENT PANEL */}
      <div className="flex-1 p-6 overflow-y-auto bg-[#f8f9fa]" id="backoffice-workspace">
        
        {/* Reset Confirmation Prompt */}
        {resetConfirm && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold text-rose-800 text-sm">¿Restablecer toda la base de datos?</h4>
                <p className="text-xs text-rose-700 mt-1 font-medium">Se borrarán los cambios locales, se recrearán los invitados semilla de ADISTEM y se reiniciarán las capacidades.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReset} className="px-3 py-1.5 bg-rose-650 hover:bg-rose-750 text-white font-bold text-xs rounded transition cursor-pointer shadow-2xs">Sí, restablecer</button>
              <button onClick={() => setResetConfirm(false)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded transition cursor-pointer">Cancelar</button>
            </div>
          </div>
        )}

        {/* ======================= TAB: DASHBOARD ======================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{config.eventName}</h2>
                <p className="text-sm text-slate-500 font-medium">{config.venue} • {config.dates}</p>
              </div>
            </div>

            {/* COUNT STATS CARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Carnets Registrados</p>
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900">{totalGuestsCount}</span>
                  <span className="text-sm font-bold text-slate-400">/ 134</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1 font-medium">Total de carnets / habitaciones registradas</span>
              </div>
            </div>

            {/* SECCIÓN: TOTALES POR CATEGORÍA DE HUÉSPED */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 tracking-tight flex items-center gap-2">
                      Totales por Categoría de Huésped
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Distribución y cupos máximos permitidos por categoría de invitado
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Haz clic en una categoría para consultar su listado y exportar a Excel
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Distribuidores (Distribuidores + VIP) */}
                <div 
                  onClick={() => {
                    setSelectedCategoryModal("Distribuidores");
                    setCategoryModalSearch("");
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/80 to-amber-100/40 border border-amber-200 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group"
                  title="Ver listado de Distribuidores (incluye VIP) y exportar a Excel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Distribuidores</span>
                    <Award className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-900">{categoryCarnetsMap["Distribuidores"] || 0}</span>
                    <span className="text-xs font-bold text-amber-700/80">/ 106 carnets</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-amber-700 font-medium">{categoryGuestsMap["Distribuidores"]?.length || 0} registros</span>
                    <span className="text-[10px] font-bold text-amber-800 underline group-hover:text-amber-950">&rarr; Ver XLS</span>
                  </div>
                </div>

                {/* Planta */}
                <div 
                  onClick={() => {
                    setSelectedCategoryModal("Planta");
                    setCategoryModalSearch("");
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/80 to-blue-100/40 border border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group"
                  title="Ver listado de Planta y exportar a Excel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Planta</span>
                    <Building2 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-blue-900">{categoryCarnetsMap["Planta"] || 0}</span>
                    <span className="text-xs font-bold text-blue-700/80">/ 10 carnets</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-blue-700 font-medium">{categoryGuestsMap["Planta"]?.length || 0} registros</span>
                    <span className="text-[10px] font-bold text-blue-800 underline group-hover:text-blue-950">&rarr; Ver XLS</span>
                  </div>
                </div>

                {/* Financiera */}
                <div 
                  onClick={() => {
                    setSelectedCategoryModal("Financiera");
                    setCategoryModalSearch("");
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 border border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group"
                  title="Ver listado de Financiera y exportar a Excel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Financiera</span>
                    <DollarSign className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-900">{categoryCarnetsMap["Financiera"] || 0}</span>
                    <span className="text-xs font-bold text-emerald-700/80">/ 5 carnets</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-emerald-700 font-medium">{categoryGuestsMap["Financiera"]?.length || 0} registros</span>
                    <span className="text-[10px] font-bold text-emerald-800 underline group-hover:text-emerald-950">&rarr; Ver XLS</span>
                  </div>
                </div>

                {/* Externos */}
                <div 
                  onClick={() => {
                    setSelectedCategoryModal("Externo");
                    setCategoryModalSearch("");
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/80 to-indigo-100/40 border border-[#b2c2e0] hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group"
                  title="Ver listado de Externos y exportar a Excel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Externos</span>
                    <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-900">{categoryCarnetsMap["Externo"] || 0}</span>
                    <span className="text-xs font-bold text-indigo-700/80">/ 8 carnets</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-indigo-700 font-medium">{categoryGuestsMap["Externo"]?.length || 0} registros</span>
                    <span className="text-[10px] font-bold text-indigo-800 underline group-hover:text-indigo-950">&rarr; Ver XLS</span>
                  </div>
                </div>

                {/* Staff */}
                <div 
                  onClick={() => {
                    setSelectedCategoryModal("Staff");
                    setCategoryModalSearch("");
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-250 hover:border-slate-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group"
                  title="Ver listado de Staff y exportar a Excel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Staff</span>
                    <Shield className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{categoryCarnetsMap["Staff"] || 0}</span>
                    <span className="text-xs font-bold text-slate-600">/ 5 carnets</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-600 font-medium">{categoryGuestsMap["Staff"]?.length || 0} registros</span>
                    <span className="text-[10px] font-bold text-slate-700 underline group-hover:text-slate-900">&rarr; Ver XLS</span>
                  </div>
                </div>

                {/* Menores */}
                <div 
                  onClick={() => {
                    setSelectedCategoryModal("Menores");
                    setCategoryModalSearch("");
                    setMinorsSortField("edad");
                    setMinorsSortDir("asc");
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-pink-50/80 to-pink-100/40 border border-pink-200 hover:border-pink-400 hover:shadow-md cursor-pointer transition-all active:scale-[0.99] group"
                  title="Ver listado de Menores y su estatus de Movie Night"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-pink-850 uppercase tracking-wider">Menores</span>
                    <Baby className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-pink-900">{totalMinorsCount}</span>
                    <span className="text-xs font-bold text-pink-700/80">menores</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-pink-700 font-medium">Registrados</span>
                    <span className="text-[10px] font-bold text-pink-800 underline group-hover:text-pink-950">&rarr; Ver XLS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN REGISTRO DUEÑOS : ETAPA 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        Registro Grupos
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Monitoreo de cupos por grupo empresarial (1 titular exclusivo por grupo).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  <button
                    onClick={() => {
                      setStage1GroupFilter("all");
                      setStage1GroupSearch("");
                      setShowStage1GroupsModal(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer hover:shadow-md"
                  >
                    <ListFilter className="w-4 h-4" />
                    <span>Listado y Control de Grupos</span>
                  </button>

                  <button
                    onClick={() => handleExportStage1GroupsXLS(true)}
                    className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer hover:shadow-md"
                    title="Exportar informe completo de grupos a Excel (XLSX) con titulares, acompañantes y actividades"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Exportar Grupos a XLS</span>
                  </button>
                </div>
              </div>

              {/* 3 Tarjetas métricas requeridas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tarjeta 1: Total de grupos */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de grupos</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 mt-2">{totalStage1Groups}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Total de grupos convocados</p>
                </div>

                {/* Tarjeta 2: Grupos registrados */}
                <div 
                  onClick={() => {
                    setStage1GroupFilter("registered");
                    setShowStage1GroupsModal(true);
                  }}
                  className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
                  title="Clic para ver listado de titulares registrados y exportar a Excel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Grupos registrados</span>
                    <UserCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-3xl font-black text-emerald-700 mt-2">{titularRegistradosCount}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-emerald-600/80 font-medium">Grupos con titular registrado</p>
                    <span className="text-[10px] font-bold text-emerald-700 underline group-hover:text-emerald-900 flex items-center gap-0.5">
                      Ver lista & XLS &rarr;
                    </span>
                  </div>
                </div>

                {/* Tarjeta 3: Grupos sin registro */}
                <div 
                  onClick={() => {
                    setStage1GroupFilter("unregistered");
                    setShowStage1GroupsModal(true);
                  }}
                  className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group"
                  title="Clic para ver grupos faltantes y exportar a Excel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Grupos sin registro</span>
                    <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-3xl font-black text-amber-700 mt-2">{titularesFaltantesCount}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-amber-600/80 font-medium">Grupos disponibles sin titular</p>
                    <span className="text-[10px] font-bold text-amber-700 underline group-hover:text-amber-900 flex items-center gap-0.5">
                      Ver lista & XLS &rarr;
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de progreso de avance */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    Avance de registro: <strong className="text-slate-900">{titularRegistradosCount} de {totalStage1Groups} grupos con titular</strong>
                  </span>
                  <span className="text-blue-600 font-extrabold">{stage1CompletionPercent}% completado</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${stage1CompletionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECCIÓN: LLEGADAS Y SALIDAS DIARIAS Y CONTROL DE VUELOS */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-0">
              {/* Header Principal del Bloque */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="p-2 bg-blue-600/30 border border-blue-400/30 text-blue-300 rounded-xl shadow-inner flex items-center gap-1.5">
                      <Plane className="w-4 h-4 text-emerald-400" />
                      <Plane className="w-4 h-4 text-blue-400 rotate-90" />
                    </span>
                    <h4 className="font-extrabold text-base sm:text-lg text-white tracking-wide flex items-center gap-2 font-display uppercase">
                      Llegadas y salidas diarias y control de vuelos
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 font-medium max-w-2xl">
                    Monitoreo integral y recepción de asistentes y retornos por día y franjas horarias con desglose de vuelos, horas pico y participantes.
                  </p>
                </div>

                {/* Métricas y Filtro de Vistas */}
                <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <Plane className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{dailyArrivalsSummary.totalConfirmedPax} Pax Llegadas</span>
                    </span>
                    <span className="bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <Plane className="w-3.5 h-3.5 text-blue-400 rotate-90" />
                      <span>{dailyDeparturesSummary.totalConfirmedPax} Pax Salidas</span>
                    </span>
                    {guestsWithoutFlights.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setGuestsWithoutFlightsSearch("");
                          setShowGuestsWithoutFlightsModal(true);
                        }}
                        className="bg-amber-600/90 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm border border-amber-500/40 transition duration-150 cursor-pointer hover:shadow-md"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
                        <span>{guestsWithoutFlights.length} Registros sin vuelo registrado</span>
                      </button>
                    )}
                  </div>

                  {/* Switcher de visualización */}
                  <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => setFlightViewFilter('both')}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                        flightViewFilter === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Ver Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlightViewFilter('arrivals')}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        flightViewFilter === 'arrivals' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Plane className="w-3 h-3 text-emerald-300" />
                      <span>Llegadas ({dailyArrivalsSummary.days.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlightViewFilter('departures')}
                      className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        flightViewFilter === 'departures' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Plane className="w-3 h-3 text-blue-300 rotate-90" />
                      <span>Salidas ({dailyDeparturesSummary.days.length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTENIDO SEPARADO: LLEGADAS Y SALIDAS */}
              <div className="p-5 space-y-8 bg-slate-50/50">
                
                {/* 1. SECCIÓN: LLEGADAS DE VUELOS (RECEPCIÓN) */}
                {(flightViewFilter === 'both' || flightViewFilter === 'arrivals') && (
                  <div className="space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-emerald-100 text-emerald-800 rounded-lg">
                          <Plane className="w-4 h-4 text-emerald-700" />
                        </span>
                        <div>
                          <h5 className="font-extrabold text-xs sm:text-sm text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                            Recepción y Llegadas de Vuelos por Día
                          </h5>
                          <p className="text-[11px] text-emerald-800 font-medium">Control de vuelos de arribo y transfer de llegada al hotel sede.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {dailyArrivalsSummary.totalConfirmedPax} pax confirmados
                        </span>
                        {dailyArrivalsSummary.pendingCount > 0 && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            ⏳ {dailyArrivalsSummary.pendingCount} pax sin vuelo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                      {dailyArrivalsSummary.days.map((dayGroup) => {
                        const topHoursArray = Array.from(dayGroup.topHours.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

                        return (
                          <div
                            key={`arr-${dayGroup.dateKey}`}
                            className={`rounded-xl border transition-all duration-200 p-4 flex flex-col justify-between ${
                              dayGroup.totalPax > 0
                                ? 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-200 hover:border-emerald-400 hover:shadow-md'
                                : 'bg-slate-50/60 border-slate-200/80 opacity-75'
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Header Card */}
                              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                                <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                                  <Plane className="w-3 h-3 text-emerald-600" />
                                  {dayGroup.shortLabel}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  dayGroup.totalPax > 0
                                    ? 'bg-emerald-600 text-white shadow-3xs'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {dayGroup.totalPax} Pax
                                </span>
                              </div>

                              <p className="text-[11px] font-bold text-slate-800">
                                {dayGroup.dateLabel}
                              </p>

                              {/* Indicadores horarios */}
                              <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-emerald-100 shadow-3xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">🌅 Mañana (&lt;12:00):</span>
                                  <span className="font-bold text-slate-800">{dayGroup.timeBuckets.morning} pax</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">☀️ Tarde (12-18:00):</span>
                                  <span className="font-bold text-slate-800">{dayGroup.timeBuckets.afternoon} pax</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">🌙 Noche (&gt;18:00):</span>
                                  <span className="font-bold text-slate-800">{dayGroup.timeBuckets.evening} pax</span>
                                </div>
                                {dayGroup.timeBuckets.other > 0 && (
                                  <div className="flex items-center justify-between text-amber-700">
                                    <span className="font-medium">⏳ Sin hora fija:</span>
                                    <span className="font-bold">{dayGroup.timeBuckets.other} pax</span>
                                  </div>
                                )}
                              </div>

                              {/* Horas pico */}
                              {topHoursArray.length > 0 && (
                                <div className="text-[10px] text-emerald-900 font-medium pt-0.5">
                                  <span className="font-bold text-emerald-950">Horas pico: </span>
                                  {topHoursArray.map(([hr, count]) => `${hr} (${count} pax)`).join(" • ")}
                                </div>
                              )}

                              <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between pt-1">
                                <span>Vuelos: <strong>{dayGroup.uniqueFlights.size}</strong></span>
                                <span>Registros: <strong>{dayGroup.records.length}</strong></span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-3 mt-3 border-t border-emerald-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFlightModal({ type: 'arrival', dayGroup });
                                  setFlightModalSearchQuery("");
                                }}
                                disabled={dayGroup.records.length === 0}
                                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer ${
                                  dayGroup.records.length > 0
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Ver Llegadas ({dayGroup.records.length})</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. SECCIÓN: SALIDAS Y RETORNO DE VUELOS */}
                {(flightViewFilter === 'both' || flightViewFilter === 'departures') && (
                  <div className="space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-150 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-blue-100 text-blue-800 rounded-lg">
                          <Plane className="w-4 h-4 text-blue-700 rotate-90" />
                        </span>
                        <div>
                          <h5 className="font-extrabold text-xs sm:text-sm text-blue-950 uppercase tracking-wider flex items-center gap-2">
                            Salidas y Retorno de Vuelos por Día
                          </h5>
                          <p className="text-[11px] text-blue-800 font-medium">Control de vuelos de despegue y logística de checkout y traslados al aeropuerto.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                          {dailyDeparturesSummary.totalConfirmedPax} pax confirmados
                        </span>
                        {dailyDeparturesSummary.pendingCount > 0 && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            ⏳ {dailyDeparturesSummary.pendingCount} pax sin vuelo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                      {dailyDeparturesSummary.days.map((dayGroup) => {
                        const topHoursArray = Array.from(dayGroup.topHours.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

                        return (
                          <div
                            key={`dep-${dayGroup.dateKey}`}
                            className={`rounded-xl border transition-all duration-200 p-4 flex flex-col justify-between ${
                              dayGroup.totalPax > 0
                                ? 'bg-gradient-to-b from-blue-50/70 to-white border-blue-200 hover:border-blue-400 hover:shadow-md'
                                : 'bg-slate-50/60 border-slate-200/80 opacity-75'
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Header Card */}
                              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                                <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1">
                                  <Plane className="w-3 h-3 text-blue-600 rotate-90" />
                                  {dayGroup.shortLabel}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                  dayGroup.totalPax > 0
                                    ? 'bg-blue-600 text-white shadow-3xs'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {dayGroup.totalPax} Pax
                                </span>
                              </div>

                              <p className="text-[11px] font-bold text-slate-800">
                                {dayGroup.dateLabel}
                              </p>

                              {/* Indicadores horarios */}
                              <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-blue-100 shadow-3xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">🌅 Mañana (&lt;12:00):</span>
                                  <span className="font-bold text-slate-800">{dayGroup.timeBuckets.morning} pax</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">☀️ Tarde (12-18:00):</span>
                                  <span className="font-bold text-slate-800">{dayGroup.timeBuckets.afternoon} pax</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">🌙 Noche (&gt;18:00):</span>
                                  <span className="font-bold text-slate-800">{dayGroup.timeBuckets.evening} pax</span>
                                </div>
                                {dayGroup.timeBuckets.other > 0 && (
                                  <div className="flex items-center justify-between text-amber-700">
                                    <span className="font-medium">⏳ Sin hora fija:</span>
                                    <span className="font-bold">{dayGroup.timeBuckets.other} pax</span>
                                  </div>
                                )}
                              </div>

                              {/* Horas pico */}
                              {topHoursArray.length > 0 && (
                                <div className="text-[10px] text-blue-900 font-medium pt-0.5">
                                  <span className="font-bold text-blue-950">Horas pico: </span>
                                  {topHoursArray.map(([hr, count]) => `${hr} (${count} pax)`).join(" • ")}
                                </div>
                              )}

                              <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between pt-1">
                                <span>Vuelos: <strong>{dayGroup.uniqueFlights.size}</strong></span>
                                <span>Registros: <strong>{dayGroup.records.length}</strong></span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-3 mt-3 border-t border-blue-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFlightModal({ type: 'departure', dayGroup });
                                  setFlightModalSearchQuery("");
                                }}
                                disabled={dayGroup.records.length === 0}
                                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-3xs cursor-pointer ${
                                  dayGroup.records.length > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Ver Salidas ({dayGroup.records.length})</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* CRITICAL WARNINGS AND ALERTS - NOW FULL WIDTH FOR CLEAN FEED */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                  Alertas Críticas y Monitoreo de Operación
                </h3>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold rounded">Monitoreo Activo</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Out Of Deadlines Alert Block */}
                <div 
                  onClick={() => handleAlertClick('outOfDeadlines')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3.5 group ${
                    outOfDeadlinesCount > 0 
                      ? 'bg-rose-50/70 border-rose-150 hover:bg-rose-100 hover:border-rose-300' 
                      : 'bg-slate-50/50 border-slate-150 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className={`w-5 h-5 mt-0.5 shrink-0 ${outOfDeadlinesCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                  <div className="text-xs flex-1">
                    <p className={`font-bold ${outOfDeadlinesCount > 0 ? 'text-rose-950' : 'text-slate-800'}`}>
                      Intentos fuera de plazo detectados {outOfDeadlinesCount > 0 && `(${outOfDeadlinesCount})`}
                    </p>
                    <p className="text-slate-550 mt-1 leading-normal font-medium">
                      {outOfDeadlinesCount > 0 
                        ? `Se detectaron ${outOfDeadlinesCount} intento(s) de cambios posteriores a la fecha límite. Da clic para ver la lista de auditoría.` 
                        : "No se registran solicitudes fuera de tiempo en la bitácora."}
                    </p>
                    <span className="text-[10px] font-bold text-rose-600 hover:underline inline-block mt-2">
                      Ver expedientes afectados →
                    </span>
                  </div>
                </div>

                {/* Flight Changes Alert Block */}
                <div 
                  onClick={() => handleAlertClick('flightChanges')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3.5 group ${
                    flightChangesCount > 0 
                      ? 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-100 hover:border-amber-350' 
                      : 'bg-slate-50/50 border-slate-150 hover:bg-slate-100'
                  }`}
                >
                  <Plane className={`w-5 h-5 mt-0.5 shrink-0 ${flightChangesCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                  <div className="text-xs flex-1">
                    <p className={`font-bold ${flightChangesCount > 0 ? 'text-amber-950' : 'text-slate-800'}`}>
                      Modificaciones recientes a itinerarios de vuelo {flightChangesCount > 0 && `(${flightChangesCount})`}
                    </p>
                    <p className="text-slate-550 mt-1 leading-normal font-medium">
                      {flightChangesCount > 0 
                        ? `Se registraron ${flightChangesCount} cambios recientes de pasajes o vuelos. Da clic para ver detalles.` 
                        : "Sin cambios registrados recientemente en itinerarios."}
                    </p>
                    <span className="text-[10px] font-bold text-amber-700 hover:underline inline-block mt-2">
                      Ver bitácora de vuelos →
                    </span>
                  </div>
                </div>

                {/* Incomplete Docs Alert Block */}
                <div 
                  onClick={() => handleAlertClick('incompleteDocs')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3.5 group ${
                    incompleteDocsCount > 0 
                      ? 'bg-blue-50/50 border-blue-150 hover:bg-blue-100/60 hover:border-blue-300' 
                      : 'bg-slate-50/50 border-slate-150 hover:bg-slate-100'
                  }`}
                >
                  <FileText className={`w-5 h-5 mt-0.5 shrink-0 ${incompleteDocsCount > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="text-xs flex-1">
                    <p className={`font-bold ${incompleteDocsCount > 0 ? 'text-blue-950' : 'text-slate-800'}`}>
                      Invitados confirmados sin itinerario {incompleteDocsCount > 0 && `(${incompleteDocsCount})`}
                    </p>
                    <p className="text-slate-550 mt-1 leading-normal font-medium">
                      {incompleteDocsCount > 0 
                        ? `Hay ${incompleteDocsCount} asistentes listos que no han ingresado sus horas de llegada. Clic para ver lista.` 
                        : "Todos los invitados confirmados tienen su logística completa."}
                    </p>
                    <span className="text-[10px] font-bold text-blue-650 hover:underline inline-block mt-2">
                      Ver lista de pendientes →
                    </span>
                  </div>
                </div>

                {/* Activity Occupancy Alert Block */}
                <div 
                  onClick={() => handleAlertClick('activitiesMonitoring')}
                  className="p-4 bg-emerald-50/50 border border-emerald-150 hover:bg-emerald-100/60 hover:border-emerald-300 rounded-xl transition-all cursor-pointer text-left flex items-start gap-3.5 group"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-xs flex-1">
                    <p className="font-bold text-emerald-900">
                      Monitoreo activo de cupos en actividades especiales
                    </p>
                    <p className="text-slate-550 mt-1 leading-normal font-medium">
                      Control del límite máximo en Spa, Torneo de Golf y Cena de Gala. Clic para revisar inscripciones y listas de espera por actividad.
                    </p>
                    <span className="text-[10px] font-bold text-emerald-700 hover:underline inline-block mt-2">
                      Ver ocupación de actividades →
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* REDESIGNED LOGISTICS RESUMEN (AT THE BOTTOM, FULL WIDTH) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-6">
              <div className="border-b border-slate-150/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-brand-primary" />
                    Resumen de Logística Operativa del Evento
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Control en tiempo real de cupos de traslado terrestre y planeador interactivo de agenda diaria.</p>
                </div>

                {/* Logistics Day Tabs inside Card Header */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto shrink-0" id="backoffice-logistics-day-tabs">
                  {(() => {
                    const daysArray = getDaysArray(config.eventStartDate, config.eventEndDate);
                    if (daysArray.length === 0) {
                      return <span className="text-xs text-slate-500 italic p-1.5 font-semibold">Sin fechas oficiales</span>;
                    }
                    const activeLogisticsDay = daysArray.includes(selectedLogisticsDay) ? selectedLogisticsDay : (daysArray[0] || 1);
                    return daysArray.map(dayNum => {
                      const dayObj = config.daysConfig?.find(d => d.dayNumber === dayNum);
                      const formattedDate = dayObj?.date 
                        ? (dayObj.date.includes(" de ") 
                            ? dayObj.date.split(" de ")[0] + " " + (dayObj.date.split(" de ")[1] ? dayObj.date.split(" de ")[1].substring(0,3) : "")
                            : dayObj.date)
                        : (config.eventStartDate ? getDayDateLabel(dayNum, config.eventStartDate).split(" de ")[0] : `Día ${dayNum}`);
                      return (
                        <button
                          key={dayNum}
                          onClick={() => setSelectedLogisticsDay(dayNum)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex flex-col items-center min-w-[70px] ${
                            activeLogisticsDay === dayNum
                              ? "bg-brand-primary text-white shadow-2xs"
                              : "text-slate-600 hover:bg-slate-250"
                          }`}
                        >
                          <span className="text-[10px] uppercase">Día {dayNum}</span>
                          <span className="text-[9px] font-medium opacity-85">{formattedDate}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Grid 3 Columns */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* COLUMN 1: TRANSPORT & MAIN CAPACITIES PROGRESS */}
                <div className="space-y-5 border-r border-slate-100 xl:pr-6">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-blue-600" />
                      Cupo Transporte Aeropuerto ↔ Hotel
                    </h4>
                    <div className="space-y-3">
                      {transportSlots.slice(0, 4).map(slot => {
                        const percent = Math.min(100, Math.round((slot.assignedCount / slot.capacity) * 100));
                        return (
                          <div key={slot.id} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium">
                              <span className="text-slate-600 truncate max-w-[170px]" title={slot.description}>{slot.description}</span>
                              <span className="text-slate-800 font-bold">{slot.assignedCount} / {slot.capacity} pas.</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  percent >= 90 ? 'bg-rose-500' :
                                  percent >= 70 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-brand-teal" />
                        Ocupación General de Actividades
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {activities.length} actividades
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {activities.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No hay actividades registradas.</p>
                      ) : (
                        activities.map(act => {
                          const percent = Math.min(100, Math.round((act.registeredCount / act.capacity) * 100));
                          return (
                            <div key={act.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 hover:bg-slate-100/70 transition">
                              <div className="flex items-center justify-between text-xs font-semibold gap-2">
                                <span className="text-slate-800 font-bold truncate max-w-[170px]" title={act.name}>{act.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-slate-500 text-[10px] font-mono">({act.registeredCount}/{act.capacity})</span>
                                  <span className={`px-1.5 py-0.5 rounded font-black text-[9px] border ${
                                    percent >= 100 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    percent >= 80 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {percent}%
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-brand-primary'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>

                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                                  {act.eventDay || "Día 1"} {act.timeRange ? `• ${act.timeRange}` : ''}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedActivityForGuests(act);
                                    setActivityGuestsSearchQuery("");
                                    setActivityGuestsDayFilter("all");
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-brand-primary hover:text-white border border-slate-200 hover:border-brand-primary text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs group"
                                  title="Ver participantes de esta actividad y exportar a Excel"
                                >
                                  <Users className="w-3 h-3 text-brand-primary group-hover:text-white" />
                                  <span>Ver Participantes</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUMNS 2 & 3: DAILY PLANNER DETAILS */}
                <div className="xl:col-span-2 space-y-4">
                  {(() => {
                    const daysArray = getDaysArray(config.eventStartDate, config.eventEndDate);
                    if (daysArray.length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <Calendar className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                          <p className="text-xs text-slate-500 font-medium">Por favor configure las fechas oficiales del evento en la sección de Configuración para activar el planeador de agenda diaria.</p>
                        </div>
                      );
                    }
                    const activeLogisticsDay = daysArray.includes(selectedLogisticsDay) ? selectedLogisticsDay : (daysArray[0] || 1);

                    const daysList = config.daysConfig || [];
                    const dayObj = daysList.find(d => d.dayNumber === activeLogisticsDay) || {
                      date: config.eventStartDate ? getDayDateLabel(activeLogisticsDay, config.eventStartDate) : `Día ${activeLogisticsDay}`,
                      calendarDate: config.eventStartDate ? getDayDateString(activeLogisticsDay, config.eventStartDate) : "",
                      title: `Día ${activeLogisticsDay} del Evento`,
                      description: "Actividades generales y bloques operativos del día."
                    };

                    const dayGeneralAgenda = config.agenda.filter(item => {
                      const dayLabel = item.day.toLowerCase();
                      return dayLabel.includes(`día ${activeLogisticsDay}`) || dayLabel.includes(`dia ${activeLogisticsDay}`);
                    });

                    const normalizeDateStr = (s: string) => {
                      if (!s) return "";
                      const firstPart = s.split(/[T ]/)[0];
                      const parts = firstPart.split('-');
                      if (parts.length === 3) {
                        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                      }
                      return firstPart;
                    };

                    const targetDateStr = (dayObj && dayObj.calendarDate) || (config.eventStartDate ? getDayDateString(activeLogisticsDay, config.eventStartDate) : "");
                    const normalizedTarget = normalizeDateStr(targetDateStr);
                    const dayRecActivities = activities.filter(act => {
                      return normalizeDateStr(act.dateTime) === normalizedTarget;
                    });

                    return (
                      <div className="space-y-4">
                        
                        {/* Day Info Subheader */}
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                          <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest">{dayObj.date}</p>
                          <h4 className="text-sm font-black text-slate-800 mt-0.5">{dayObj.title}</h4>
                          <p className="text-xs text-slate-550 mt-1 leading-normal font-medium">{dayObj.description}</p>
                        </div>

                        {/* Side by side general schedule vs recreational */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Plenary Sessions */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                              <Calendar className="w-4 h-4 text-brand-primary" />
                              Programa General de Sesiones
                            </h5>
                            
                            {dayGeneralAgenda.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-4">No hay sesiones plenarias calendarizadas hoy.</p>
                            ) : (
                              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {dayGeneralAgenda.map((item, idx) => (
                                  <div key={idx} className="p-2.5 bg-white border border-slate-150 rounded-xl shadow-3xs flex gap-3">
                                    <div className="w-16 shrink-0 border-r border-slate-100 pr-2 flex flex-col justify-center text-center">
                                      <span className="text-[10px] font-extrabold text-brand-primary block leading-none">{item.time.split(" - ")[0]}</span>
                                      <span className="text-[8px] text-slate-400 block mt-1 font-semibold">Inicio</span>
                                    </div>
                                    <div className="text-xs">
                                      <p className="font-extrabold text-slate-800 leading-tight">{item.title}</p>
                                      <p className="text-slate-550 font-medium text-[10px] mt-0.5 leading-normal truncate max-w-[180px]">{item.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Recreational Activities */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                              <Award className="w-4 h-4 text-brand-teal" />
                              Actividades Recreativas
                            </h5>

                            {dayRecActivities.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-4">Sin actividades recreativas asignadas para este día.</p>
                            ) : (
                              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {dayRecActivities.map(act => {
                                  const pct = Math.min(100, Math.round((act.registeredCount / act.capacity) * 100));
                                  return (
                                    <div key={act.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-1 hover:bg-slate-100/50 transition">
                                      <div className="flex justify-between items-center">
                                        <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-[8px] font-black uppercase text-slate-500 rounded">
                                          {act.category}
                                        </span>
                                        <span className={`text-[10px] font-black ${
                                          pct >= 100 ? 'text-rose-600' : 'text-emerald-600'
                                        }`}>
                                          {act.registeredCount} / {act.capacity} lgs.
                                        </span>
                                      </div>
                                      <p className="font-extrabold text-slate-800 leading-tight">{act.name}</p>
                                      <p className="text-[10px] text-slate-500 font-medium truncate leading-none">
                                        Hora: {new Date(act.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hrs
                                      </p>
                                      <div className="pt-1.5 flex justify-end">
                                        <button
                                          onClick={() => setSelectedActivityForGuests(act)}
                                          className="px-2 py-1 bg-white hover:bg-brand-primary hover:text-white border border-slate-200 text-[9px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-3xs text-slate-700"
                                        >
                                          <Users className="w-3 h-3" />
                                          Ver Inscritos
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================= TAB: HOTELS (SEDES & TARIFAS) ======================= */}
        {activeTab === "hotels" && (() => {
          const hotelsList = DataStore.getHotels();
          const isReadOnly = currentUser?.role === "Staff";

          return (
            <div className="space-y-6" id="backoffice-tab-hotels">
              <div className="border-b border-slate-200/80 pb-4">
                <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-wider">Sedes & Tarifas de Hospedaje</h3>
                <p className="text-xs text-slate-500 font-medium">Configura los costos por carnet para el evento completo y las tarifas por día (días adicionales, menores y camas extras).</p>
              </div>

              {isReadOnly && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Modo de Vista de Staff (Sólo Lectura):</strong> Tu cuenta no tiene permisos para crear, editar o eliminar hoteles o tarifas. Para realizar cambios, ingresa como Administrador.</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* HOTEL FORM CARD */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-xs text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    {editingHotelId ? "Editar Sede & Tarifas" : "Nueva Sede de Alojamiento"}
                  </h4>

                  <form onSubmit={handleSaveHotel} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre del Hotel Sede</label>
                      <input 
                        type="text"
                        value={hotelName}
                        onChange={e => setHotelName(e.target.value)}
                        placeholder="Ej: Rosewood Mandarina"
                        disabled={isReadOnly}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-bold"
                      />
                    </div>

                    {/* SECCIÓN 1: COSTOS POR CARNET POR EL EVENTO */}
                    <div className="border-t border-slate-100 pt-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/60">
                      <span className="text-[10px] font-extrabold text-blue-750 uppercase tracking-widest block mb-1">
                        Costos por Carnet por el Evento (No por día)
                      </span>
                      <p className="text-[10px] text-slate-500 mb-2.5">Costo total integral del carnet durante toda la convención oficial.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-600 font-bold mb-1">Carnet Doble</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              value={costCarnetDoble || ""}
                              onChange={e => setCostCarnetDoble(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-600 font-bold mb-1">Carnet Sencillo</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              value={costCarnetSencillo || ""}
                              onChange={e => setCostCarnetSencillo(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECCIÓN 2: COSTOS POR DÍA */}
                    <div className="border-t border-slate-100 pt-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 space-y-3">
                      <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest block">
                        Costos por Día (Estancias adicionales y extras)
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Día Adicional Carnet Doble</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                            <input 
                              type="number"
                              value={costDiaAdicionalDoble || ""}
                              onChange={e => setCostDiaAdicionalDoble(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Día Adicional Carnet Sencillo</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                            <input 
                              type="number"
                              value={costDiaAdicionalSencillo || ""}
                              onChange={e => setCostDiaAdicionalSencillo(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Niños Extra 0 a 3 años (Día)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                            <input 
                              type="number"
                              value={costNino0a3 || ""}
                              onChange={e => setCostNino0a3(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Niños Extra 4 a 11 años (Día)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                            <input 
                              type="number"
                              value={costNino4a11 || ""}
                              onChange={e => setCostNino4a11(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Niños Extra 12 a 17 años (Día)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                            <input 
                              type="number"
                              value={costNino12a17 || ""}
                              onChange={e => setCostNino12a17(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Adulto Día Extra</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                            <input 
                              type="number"
                              value={costAdultoDiaExtra || ""}
                              onChange={e => setCostAdultoDiaExtra(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Cama Extra (Por Día)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                            <input 
                              type="number"
                              value={costCamaExtra || ""}
                              onChange={e => setCostCamaExtra(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isReadOnly && (
                      <div className="flex gap-2 pt-2">
                        {editingHotelId && (
                          <button 
                            type="button"
                            onClick={() => {
                              setHotelName("");
                              setCostCarnetDoble(0);
                              setCostCarnetSencillo(0);
                              setCostDiaAdicionalDoble(0);
                              setCostDiaAdicionalSencillo(0);
                              setCostNino0a3(0);
                              setCostNino4a11(0);
                              setCostNino12a17(0);
                              setCostAdultoDiaExtra(0);
                              setCostCamaExtra(0);
                              setEditingHotelId(null);
                            }}
                            className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition cursor-pointer font-bold"
                          >
                            Cancelar
                          </button>
                        )}
                        <button 
                          type="submit"
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{editingHotelId ? "Actualizar Tarifas" : "Registrar Sede & Tarifas"}</span>
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {/* HOTELS TABLE CARD */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Catálogo de Sedes & Estructura de Tarifas</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {hotelsList.length} Sedes
                    </span>
                  </div>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold text-[11px]">
                          <th className="p-3">Hotel Sede</th>
                          <th className="p-3 text-right">Carnet Doble (Evento)</th>
                          <th className="p-3 text-right">Carnet Sencillo (Evento)</th>
                          <th className="p-3 text-right">Día Extra Doble</th>
                          <th className="p-3 text-right">Día Extra Sencillo</th>
                          <th className="p-3 text-right">Niños (0-3 / 4-11 / 12-17)</th>
                          <th className="p-3 text-right">Cama Extra</th>
                          {!isReadOnly && <th className="p-3 text-center">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {hotelsList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400 italic font-medium">
                              No hay sedes registradas en la base de datos.
                            </td>
                          </tr>
                        ) : (
                          hotelsList.map(h => {
                            const cDoble = h.costCarnetDoble ?? h.costDoble ?? 0;
                            const cSencillo = h.costCarnetSencillo ?? h.costSencilla ?? 0;
                            const dExtraDoble = h.costDiaAdicionalDoble ?? (cDoble ? Math.round(cDoble / 3) : 0);
                            const dExtraSencillo = h.costDiaAdicionalSencillo ?? (cSencillo ? Math.round(cSencillo / 3) : 0);
                            const n0a3 = h.costNino0a3 ?? 0;
                            const n4a11 = h.costNino4a11 ?? 0;
                            const n12a17 = h.costNino12a17 ?? 0;
                            const cCama = h.costCamaExtra ?? 0;

                            return (
                              <tr key={h.id} className="hover:bg-slate-50/40">
                                <td className="p-3 font-bold text-slate-800">{h.name}</td>
                                <td className="p-3 font-mono text-right text-blue-700 font-bold">${cDoble.toLocaleString()}</td>
                                <td className="p-3 font-mono text-right text-emerald-700 font-bold">${cSencillo.toLocaleString()}</td>
                                <td className="p-3 font-mono text-right text-slate-600">${dExtraDoble.toLocaleString()}</td>
                                <td className="p-3 font-mono text-right text-slate-600">${dExtraSencillo.toLocaleString()}</td>
                                <td className="p-3 font-mono text-right text-slate-600 text-[10px]">
                                  ${n0a3.toLocaleString()} / ${n4a11.toLocaleString()} / ${n12a17.toLocaleString()}
                                </td>
                                <td className="p-3 font-mono text-right text-slate-600">${cCama.toLocaleString()}</td>
                                {!isReadOnly && (
                                  <td className="p-3">
                                    <div className="flex justify-center gap-1.5">
                                      <button 
                                        onClick={() => handleEditHotelClick(h)}
                                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition cursor-pointer"
                                        title="Editar"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteHotel(h.id, h.name)}
                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* ======================= TAB: CONFIGURATION ======================= */}
        {activeTab === "config" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-wider">Configuración del Evento & Reglas Operativas</h3>
                <p className="text-xs text-slate-500 font-medium">Define los datos de la sede, plazos límites de logística y la agenda/notas oficiales por día.</p>
              </div>
              <div className="flex items-center gap-3">
                {saveConfigSuccess && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-3xs animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ¡Configuración guardada con éxito!
                  </span>
                )}
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                  className={`px-4 py-2 text-white font-bold text-xs rounded-lg transition-all duration-350 shadow-sm flex items-center gap-2 cursor-pointer ${
                    saveConfigSuccess 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : isSavingConfig
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-brand-primary hover:bg-brand-primary/95"
                  }`}
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : saveConfigSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      ¡Guardado!
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Guardar Cambios Operativos
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COL 1: DATOS GENERALES DEL EVENTO */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
                <h4 className="font-bold text-sm text-brand-primary flex items-center gap-2 border-b border-slate-100 pb-2 font-display uppercase tracking-wider">
                  <Settings className="w-4 h-4 text-brand-primary" />
                  Datos del Evento
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre del Evento:
                    </label>
                    <input 
                      type="text" 
                      value={editingConfig.eventName || ""}
                      onChange={e => setEditingConfig({ ...editingConfig, eventName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fechas de Celebración (Texto Libre):
                    </label>
                    <input 
                      type="text" 
                      value={editingConfig.dates || ""}
                      onChange={e => setEditingConfig({ ...editingConfig, dates: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fecha Inicio de Evento:
                      </label>
                      <input 
                        type="date" 
                        value={editingConfig.eventStartDate || ""}
                        onChange={e => setEditingConfig({ ...editingConfig, eventStartDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fecha Fin de Evento:
                      </label>
                      <input 
                        type="date" 
                        value={editingConfig.eventEndDate || ""}
                        onChange={e => setEditingConfig({ ...editingConfig, eventEndDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lugar del Evento (Sede General):
                    </label>
                    <input 
                      type="text" 
                      value={editingConfig.venue || ""}
                      onChange={e => setEditingConfig({ ...editingConfig, venue: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <h5 className="text-xs font-extrabold text-brand-primary uppercase tracking-wider">Información de Hotel Sede</h5>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre del Hotel Sede:
                      </label>
                      <input 
                        type="text" 
                        value={editingConfig.hotelSede || ""}
                        onChange={e => setEditingConfig({ ...editingConfig, hotelSede: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Dirección del Hotel Sede:
                      </label>
                      <textarea 
                        rows={2}
                        value={editingConfig.direccionHotelSede || ""}
                        onChange={e => setEditingConfig({ ...editingConfig, direccionHotelSede: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-primary resize-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfonos de Emergencia Hotel:
                      </label>
                      <input 
                        type="text" 
                        value={editingConfig.telefonosHotelSede || ""}
                        onChange={e => setEditingConfig({ ...editingConfig, telefonosHotelSede: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* COL 2: FECHAS LÍMITE Y ETAPAS */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-sm text-brand-primary flex items-center gap-2 font-display uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-brand-primary" />
                    Fechas Límite ("Deadlines")
                  </h4>
                  <button
                    onClick={() => {
                      if (window.confirm("¿Estás seguro de querer dejar todas las fechas límite en blanco (sin restricciones)?")) {
                        setEditingConfig({
                          ...editingConfig,
                          deadlineFlightChange: "",
                          deadlineTransportChange: "",
                          deadlineActivityChange: ""
                        });
                      }
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    Limpiar Todo
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha Límite para Cambios de Vuelo:
                    </label>
                    <input 
                      type="datetime-local" 
                      value={editingConfig.deadlineFlightChange ? editingConfig.deadlineFlightChange.substring(0, 16) : ""}
                      onChange={e => setEditingConfig({ ...editingConfig, deadlineFlightChange: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-mono font-bold"
                    />
                    {editingConfig.deadlineFlightChange ? (
                      <span className="text-[10px] text-emerald-600 mt-1 block font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Fecha límite activa: {new Date(editingConfig.deadlineFlightChange).toLocaleString("es-MX")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Sin restricción (en blanco). Los invitados podrán modificar vuelos libremente.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha Límite para Cambios de Transporte:
                    </label>
                    <input 
                      type="datetime-local" 
                      value={editingConfig.deadlineTransportChange ? editingConfig.deadlineTransportChange.substring(0, 16) : ""}
                      onChange={e => setEditingConfig({ ...editingConfig, deadlineTransportChange: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-mono font-bold"
                    />
                    {editingConfig.deadlineTransportChange ? (
                      <span className="text-[10px] text-emerald-600 mt-1 block font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Fecha límite activa: {new Date(editingConfig.deadlineTransportChange).toLocaleString("es-MX")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Sin restricción (en blanco). Los invitados podrán modificar traslados libremente.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha Límite para Registro de Actividades:
                    </label>
                    <input 
                      type="datetime-local" 
                      value={editingConfig.deadlineActivityChange ? editingConfig.deadlineActivityChange.substring(0, 16) : ""}
                      onChange={e => setEditingConfig({ ...editingConfig, deadlineActivityChange: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-mono font-bold"
                    />
                    {editingConfig.deadlineActivityChange ? (
                      <span className="text-[10px] text-emerald-600 mt-1 block font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Fecha límite activa: {new Date(editingConfig.deadlineActivityChange).toLocaleString("es-MX")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Sin restricción (en blanco). Los invitados podrán inscribirse libremente.
                      </span>
                    )}
                  </div>
                </div>

                {/* Apertura por Fases */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Etapas de Registro Activas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Etapa 1 (VIPS)</p>
                        <p className="text-[10px] text-slate-400 font-medium">Listado preferencial</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={editingConfig.stage1Open} 
                        onChange={e => setEditingConfig({ ...editingConfig, stage1Open: e.target.checked })}
                        className="w-4 h-4 text-brand-primary rounded cursor-pointer"
                      />
                    </label>

                    <label className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Etapa 2 (General)</p>
                        <p className="text-[10px] text-slate-400 font-medium">Abierto a delegados</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={editingConfig.stage2Open} 
                        onChange={e => setEditingConfig({ ...editingConfig, stage2Open: e.target.checked })}
                        className="w-4 h-4 text-brand-primary rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* COL 3: CONFIGURACIÓN POR DÍA (NOTAS APP) & AGENDA OFICIAL */}
              <div className="space-y-6">
                
                {/* NOTAS POR DÍA */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
                  <h4 className="font-bold text-sm text-brand-primary flex items-center gap-2 border-b border-slate-100 pb-2 font-display uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-brand-teal" />
                    Notas y Consulta Diaria (App)
                  </h4>

                  {(() => {
                    const daysArray = getDaysArray(editingConfig.eventStartDate, editingConfig.eventEndDate);
                    if (daysArray.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-50 border border-slate-150 rounded-lg">
                          Establezca el inicio y fin del evento en "Datos del evento" para configurar Notas por Día.
                        </div>
                      );
                    }
                    const activeEditingDay = daysArray.includes(selectedEditingDay) ? selectedEditingDay : (daysArray[0] || 1);

                    const daysList = editingConfig.daysConfig || [];
                    let dayObj = daysList.find(d => d.dayNumber === activeEditingDay);
                    // Fallback to auto-create if missing (with dynamic dates!)
                    if (!dayObj) {
                      dayObj = {
                        id: `dia${activeEditingDay}`,
                        dayNumber: activeEditingDay,
                        date: editingConfig.eventStartDate ? getDayDateLabel(activeEditingDay, editingConfig.eventStartDate) : `Día ${activeEditingDay}`,
                        calendarDate: editingConfig.eventStartDate ? getDayDateString(activeEditingDay, editingConfig.eventStartDate) : "",
                        title: `Actividades del Día ${activeEditingDay}`,
                        description: `Descripción general para el Día ${activeEditingDay}`,
                        notes: "" // Empty notes initially as requested by user
                      };
                    }

                    const handleDayFieldChange = (field: string, val: string) => {
                      const updatedList = [...daysList];
                      const idx = updatedList.findIndex(d => d.dayNumber === activeEditingDay);
                      const newDayObj = { ...dayObj!, [field]: val };
                      if (idx === -1) {
                        updatedList.push(newDayObj);
                      } else {
                        updatedList[idx] = newDayObj;
                      }
                      setEditingConfig({ ...editingConfig, daysConfig: updatedList });
                    };

                    return (
                      <>
                        {/* Day tabs selection */}
                        <div className="flex flex-wrap gap-1 p-0.5 bg-slate-100 rounded-lg">
                          {daysArray.map(dayNum => (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => setSelectedEditingDay(dayNum)}
                              className={`flex-1 py-1 text-xs font-bold rounded-md transition cursor-pointer min-w-[50px] ${
                                activeEditingDay === dayNum 
                                  ? "bg-brand-primary text-white shadow-3xs" 
                                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/40"
                              }`}
                            >
                              Día {dayNum}
                            </button>
                          ))}
                        </div>

                        {/* Fields for chosen day */}
                        <div className="space-y-3 pt-1 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha del Día (Texto descriptivo):</label>
                            <input 
                              type="text"
                              value={dayObj.date}
                              onChange={e => handleDayFieldChange("date", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-brand-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Calendario Real (Año-Mes-Día para sincronización):</label>
                            <input 
                              type="date"
                              value={dayObj.calendarDate || ""}
                              onChange={e => handleDayFieldChange("calendarDate", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-850 font-bold focus:outline-none focus:border-brand-primary font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título / Concepto del Día:</label>
                            <input 
                              type="text"
                              value={dayObj.title}
                              onChange={e => handleDayFieldChange("title", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-brand-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción de Actividades del Día:</label>
                            <textarea 
                              rows={2}
                              value={dayObj.description}
                              onChange={e => handleDayFieldChange("description", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-brand-primary resize-none font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-teal uppercase mb-1 font-extrabold">Notas de Consulta para App (Importante):</label>
                            <textarea 
                              rows={3}
                              value={dayObj.notes || ""}
                              onChange={e => handleDayFieldChange("notes", e.target.value)}
                              placeholder="Ej: Recuerda llevar una identificación oficial. Código de vestir: Formal..."
                              className="w-full bg-brand-light/15 border border-brand-teal/30 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-brand-teal font-medium"
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* AGENDA CARD */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
                  <h4 className="font-bold text-sm text-brand-primary flex items-center gap-2 border-b border-slate-100 pb-2 font-display uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-brand-secondary" />
                    Agenda Oficial Interactiva
                  </h4>

                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {editingConfig.agenda.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-100 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/25 font-bold rounded text-[10px] uppercase">
                            {item.day}
                          </span>
                          <p className="font-bold text-slate-800 mt-1">{item.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5 font-medium">{item.time} • {item.description}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteAgendaItem(idx)}
                          className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                          title="Eliminar de agenda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add new agenda item */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-bold text-slate-700">Añadir Actividad a la Agenda</p>
                    <div className="grid grid-cols-3 gap-2">
                      <select 
                        value={newAgendaItem.day}
                        onChange={e => setNewAgendaItem({ ...newAgendaItem, day: e.target.value })}
                        className="bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-semibold"
                      >
                        {(() => {
                          const daysArr = getDaysArray(editingConfig.eventStartDate, editingConfig.eventEndDate);
                          return daysArr.map(dayNum => (
                            <option key={dayNum} value={`Día ${dayNum}`}>Día {dayNum}</option>
                          ));
                        })()}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Horario (ej. 09:00 - 11:00)"
                        value={newAgendaItem.time}
                        onChange={e => setNewAgendaItem({ ...newAgendaItem, time: e.target.value })}
                        className="col-span-2 bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Título de la reunión o cóctel"
                      value={newAgendaItem.title}
                      onChange={e => setNewAgendaItem({ ...newAgendaItem, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                    <input 
                      type="text" 
                      placeholder="Descripción breve..."
                      value={newAgendaItem.description}
                      onChange={e => setNewAgendaItem({ ...newAgendaItem, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                    <button 
                      onClick={handleAddAgendaItem}
                      className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-bold py-2 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs text-center"
                    >
                      <Plus className="w-4 h-4" /> Registrar en Agenda
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: GUESTS ======================= */}
        {activeTab === "guests" && (
          <div className="space-y-6">
            
            {/* SEARCH AND FILTERS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-primary" />
                    Padrón de Invitados ADISTEM
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Filtra, exporta y gestiona la logística de hospedaje, vuelos y acompañantes de los asistentes.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button 
                    onClick={handleExportToExcel}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Exportar a Excel (.xlsx)
                  </button>
                  <button 
                    onClick={() => setIsAddingGuest(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    <Plus className="w-4 h-4" /> Alta Invitado
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 pt-2">
                <div className="sm:col-span-2 lg:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="Buscar titular, acompañante, menores, agencia o correo..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="all">Estatus: Todos</option>
                    <option value={GuestStatus.CONFIRMED}>Confirmado</option>
                    <option value={GuestStatus.COMPLETE}>Completo</option>
                    <option value={GuestStatus.INCOMPLETE}>Incompleto</option>
                    <option value={GuestStatus.CANCELLED}>Cancelado</option>
                  </select>
                </div>

                <div>
                  <select 
                    value={filterGroup} 
                    onChange={e => setFilterGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="todos">Todos los Grupos</option>
                    <option value="Stellantis">Stellantis</option>
                    <option value="Stellantis Financial">Stellantis Financial</option>
                    <option value="Valmur">Valmur</option>
                    <option value="Camarena">Camarena</option>
                    <option value="Kasa">Kasa</option>
                  </select>
                </div>

                <div>
                  <select 
                    value={filterHotel} 
                    onChange={e => setFilterHotel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="todos">Todos los Hoteles</option>
                    {DataStore.getHotels().map(h => (
                      <option key={h.id} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="todos">Cualquier Categoría</option>
                    <option value="Distribuidores">Distribuidores</option>
                    <option value="VIP">VIP</option>
                    <option value="Planta">Planta</option>
                    <option value="Financiera">Financiera</option>
                    <option value="Externo">Externo</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>
            </div>

            {/* EXPEDIENTE VIEW / DETAILED DIALOG */}
            {selectedGuest && (() => {
              const activeGuestData = (editedGuestData && editedGuestData.id === selectedGuest.id) ? editedGuestData : selectedGuest;
              const isReadOnly = currentUser?.role === "Staff";
              const registeredHotels = DataStore.getHotels();
              const currentCharges = activeGuestData.costosAdicionales || [];
              const transportSlots = DataStore.getTransportSlots();
              const allActivities = DataStore.getActivities();

              const updateField = (field: keyof Guest, value: any) => {
                let updatedData = { [field]: value };
                if (field === "alergiasTitular") {
                  updatedData = {
                    ...updatedData,
                    allergiesCustom: value,
                    allergies: value.split(",").map((s: string) => s.trim()).filter(Boolean)
                  };
                }

                if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                  setEditedGuestData({ ...editedGuestData, ...updatedData });
                } else {
                  setEditedGuestData({ ...selectedGuest, ...updatedData });
                }
              };

              return (
                <div 
                  className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedGuest(null);
                      setIsEditingGuest(false);
                    }
                  }}
                >
                  <div 
                    className="bg-white w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Sticky Header */}
                    <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 sticky top-0 z-20 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-xs font-bold border border-blue-200">
                            {selectedGuest.id}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expediente de Invitado</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedGuest.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{selectedGuest.role} • <strong className="text-blue-600">{selectedGuest.distributor}</strong></p>
                      </div>
                      
                      <div className="flex gap-2.5 items-center">
                        <button 
                          onClick={() => {
                            setGuestToDelete(selectedGuest);
                            setDeleteError(null);
                          }}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Eliminar este registro permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Eliminar Registro</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setSelectedGuest(null); setIsEditingGuest(false); }} 
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Cerrar ventana de detalle"
                        >
                          <XCircle className="w-4 h-4 text-slate-500" />
                          <span>Cerrar Detalle</span>
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Modal Content */}
                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                      <div className="p-5 bg-slate-50 rounded-xl border border-blue-200 space-y-4 shadow-sm" id="guest-editor-card">
                    {/* Catalog Datalists for Combos */}
                    <datalist id="airlines-list">
                      <option value="Aeroméxico" />
                      <option value="Volaris" />
                      <option value="VivaAerobus" />
                      <option value="Delta Air Lines" />
                      <option value="United Airlines" />
                      <option value="American Airlines" />
                      <option value="Air Canada" />
                      <option value="Copa Airlines" />
                      <option value="TAR Aerolíneas" />
                      <option value="Vuelo Privado / Chárter" />
                      <option value="Transporte Terrestre / Auto Propio" />
                    </datalist>

                    <datalist id="grupos-list">
                      <option value="Stellantis" />
                      <option value="Grupo Camarena" />
                      <option value="Grupo Valmur" />
                      <option value="Chrysler" />
                      <option value="Peugeot" />
                      <option value="RAM" />
                      <option value="Jeep" />
                      <option value="Fiat" />
                      <option value="Alfa Romeo" />
                      <option value="ADISTEM" />
                      <option value="Organización / Staff" />
                    </datalist>

                    <datalist id="distribuidoras-list">
                      {Array.from(new Set(guests.map(g => g.distributor || g.distribuidora).filter(Boolean))).map((dist, idx) => (
                        <option key={idx} value={dist} />
                      ))}
                    </datalist>

                    <div className="border-b border-slate-200 pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-sm text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-blue-600 animate-pulse" />
                            Ficha del Invitado - Edición de Datos
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">Estás editando la ficha oficial de <strong className="text-slate-800">{activeGuestData.name}</strong></p>
                        </div>
                      </div>

                      {/* SUB-TABS SELECTOR - HIGHLY VISIBLE TAB BAR */}
                      <div className="bg-slate-100/90 p-2 rounded-2xl flex flex-wrap gap-1.5 mt-4 border border-slate-200 shadow-inner w-full" id="edit-guest-subtabs">
                        {[
                          { id: "general", label: "Titular & Cuenta", icon: Shield },
                          { id: "registrante", label: "Registrante", icon: Key },
                          { id: "hospedaje", label: "Hospedaje & Sede", icon: Bed },
                          { id: "vuelos", label: "Vuelos (Ida/Vuelta)", icon: Plane },
                          { id: "logistica", label: "Logística & Actividades", icon: Calendar },
                          { id: "acompanantes", label: "Acompañantes", icon: Users },
                          { id: "cargos", label: "Cargos Extra", icon: DollarSign },
                          { id: "detalle_cargos", label: "Detalle de Cargos", icon: Receipt },
                          { id: "bitacora", label: "Bitácora", icon: History }
                        ].map(t => {
                          const Icon = t.icon;
                          const isActive = editGuestSubTab === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setEditGuestSubTab(t.id)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs border ${
                                isActive 
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-700 font-extrabold shadow-md scale-102 -translate-y-0.5" 
                                  : "bg-white text-slate-600 border-slate-200 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                              }`}
                            >
                              <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-slate-400"}`} />
                              <span>{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {isReadOnly && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-center gap-2 text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span><strong>Modo Consulta Staff (Lectura):</strong> Tu perfil no tiene permisos para actualizar los datos.</span>
                      </div>
                    )}

                    <div className="text-xs text-slate-700 min-h-[250px]">
                      
                      {/* 1. GENERAL TAB */}
                      {editGuestSubTab === "general" && (
                        <div className="space-y-5">
                          {/* INFORMACION DEL TITULAR */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                            <h5 className="font-bold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <UserCheck className="w-4 h-4 text-blue-600" />
                              Información del Titular (Datos de Registro)
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre(s) del Titular</label>
                                <input 
                                  type="text" 
                                  value={activeGuestData.nombreTitular || (activeGuestData.name ? activeGuestData.name.split(' ')[0] : "")} 
                                  onChange={e => {
                                    const val = e.target.value;
                                    const last = activeGuestData.apellidosTitular || (activeGuestData.name ? activeGuestData.name.split(' ').slice(1).join(' ') : "");
                                    const fullName = `${val} ${last}`.trim();
                                    if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                      setEditedGuestData({ ...editedGuestData, nombreTitular: val, name: fullName });
                                    } else {
                                      setEditedGuestData({ ...selectedGuest, nombreTitular: val, name: fullName });
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  placeholder="Ej: Juan Pablo"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Apellidos del Titular</label>
                                <input 
                                  type="text" 
                                  value={activeGuestData.apellidosTitular || (activeGuestData.name ? activeGuestData.name.split(' ').slice(1).join(' ') : "")} 
                                  onChange={e => {
                                    const val = e.target.value;
                                    const first = activeGuestData.nombreTitular || (activeGuestData.name ? activeGuestData.name.split(' ')[0] : "");
                                    const fullName = `${first} ${val}`.trim();
                                    if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                      setEditedGuestData({ ...editedGuestData, apellidosTitular: val, name: fullName });
                                    } else {
                                      setEditedGuestData({ ...selectedGuest, apellidosTitular: val, name: fullName });
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  placeholder="Ej: Perez Garcia"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correo Electrónico Titular</label>
                                <input 
                                  type="email" 
                                  value={activeGuestData.correoTitular || activeGuestData.email || ""} 
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                      setEditedGuestData({ ...editedGuestData, correoTitular: val, email: val });
                                    } else {
                                      setEditedGuestData({ ...selectedGuest, correoTitular: val, email: val });
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  placeholder="ejemplo@agencia.com"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Celular Titular</label>
                                <input 
                                  type="text" 
                                  value={activeGuestData.celularTitular || activeGuestData.phone || ""} 
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                      setEditedGuestData({ ...editedGuestData, celularTitular: val, phone: val });
                                    } else {
                                      setEditedGuestData({ ...selectedGuest, celularTitular: val, phone: val });
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  placeholder="5512345678"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                />
                              </div>

                                <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Puesto / Cargo</label>
                                <select 
                                  value={["Dueño", "Director", "Gerente", "Financiera", "Planta", "Externo", "Externos", "Staff"].includes(activeGuestData.puesto || "") ? (activeGuestData.puesto || "") : "Externo"} 
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateField("puesto", val);
                                  }}
                                  disabled={isReadOnly}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer text-sm"
                                >
                                  <option value="Dueño">Dueño</option>
                                  <option value="Director">Director</option>
                                  <option value="Gerente">Gerente</option>
                                  <option value="Financiera">Financiera</option>
                                  <option value="Planta">Planta</option>
                                  <option value="Externo">Externo</option>
                                  <option value="Staff">Staff</option>
                                </select>
                                {(!["Dueño", "Director", "Gerente", "Financiera", "Planta", "Externo", "Externos", "Staff"].includes(activeGuestData.puesto || "")) && (activeGuestData.puesto || "") !== "" && (
                                  <input 
                                    type="text" 
                                    value={activeGuestData.puesto || ""} 
                                    onChange={e => updateField("puesto", e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder="Especificar puesto / cargo..."
                                    className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50 text-xs"
                                  />
                                )}
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sexo (Titular)</label>
                                <select 
                                  value={activeGuestData.sexo || "Masculino"} 
                                  onChange={e => updateField("sexo", e.target.value as any)}
                                  disabled={isReadOnly}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer"
                                >
                                  <option value="Masculino">Masculino</option>
                                  <option value="Femenino">Femenino</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alergias o Restricciones Alimenticias</label>
                                <input 
                                  type="text" 
                                  placeholder="Ninguna o especificar..."
                                  value={activeGuestData.alergiasTitular || activeGuestData.allergiesCustom || ""} 
                                  onChange={e => updateField("alergiasTitular", e.target.value)}
                                  disabled={isReadOnly}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                />
                              </div>
                            </div>
                          </div>

                          {/* CLASIFICACIÓN Y ESTATUS */}
                          <div className="bg-slate-50/80 p-4 rounded-xl border border-blue-150 space-y-4">
                            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              Clasificación de Registro & Estatus
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Categoría de Huésped</label>
                                <select 
                                  value={
                                    (activeGuestData.tipoHuesped === "Convencionistas" || activeGuestData.tipoHuesped === "Convencionista")
                                      ? "Externo"
                                      : (activeGuestData.tipoHuesped || "Distribuidores")
                                  } 
                                  onChange={e => updateField("tipoHuesped", e.target.value as any)}
                                  disabled={isReadOnly}
                                  className="w-full bg-white border border-blue-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer font-bold text-blue-900"
                                >
                                  <option value="Distribuidores">Distribuidores</option>
                                  <option value="VIP">VIP</option>
                                  <option value="Planta">Planta</option>
                                  <option value="Financiera">Financiera</option>
                                  <option value="Externo">Externo</option>
                                  <option value="Staff">Staff</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Estatus del Registro</label>
                                <select 
                                  value={activeGuestData.status} 
                                  onChange={e => updateField("status", e.target.value as GuestStatus)}
                                  disabled={isReadOnly}
                                  className={`w-full border rounded-xl p-2 focus:outline-none font-bold cursor-pointer ${
                                    activeGuestData.status === GuestStatus.CONFIRMED ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                    activeGuestData.status === GuestStatus.COMPLETE ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                    activeGuestData.status === GuestStatus.CANCELLED ? 'bg-rose-50 text-rose-800 border-rose-300' :
                                    'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  <option value={GuestStatus.INCOMPLETE}>{GuestStatus.INCOMPLETE}</option>
                                  <option value={GuestStatus.COMPLETE}>{GuestStatus.COMPLETE}</option>
                                  <option value={GuestStatus.CONFIRMED}>{GuestStatus.CONFIRMED}</option>
                                  <option value={GuestStatus.CANCELLED}>{GuestStatus.CANCELLED}</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Grupo Corporativo</label>
                                <input 
                                  type="text" 
                                  list="grupos-list"
                                  value={activeGuestData.grupo || ""} 
                                  onChange={e => updateField("grupo", e.target.value)}
                                  disabled={isReadOnly}
                                  placeholder="Ej: Camarena, Stellantis, Valmur, etc."
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Distribuidora / Agencia</label>
                                <input 
                                  type="text" 
                                  list="distribuidoras-list"
                                  value={activeGuestData.distributor || activeGuestData.distribuidora || ""} 
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                      setEditedGuestData({ ...editedGuestData, distributor: val, distribuidora: val });
                                    } else {
                                      setEditedGuestData({ ...selectedGuest, distributor: val, distribuidora: val });
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  placeholder="Nombre de la distribuidora"
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Etapa de Registro</label>
                                <select 
                                  value={activeGuestData.stage} 
                                  onChange={e => updateField("stage", Number(e.target.value) as (1 | 2))}
                                  disabled={isReadOnly}
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer font-semibold"
                                >
                                  <option value={1}>Etapa 1 (VIPs / Directivos)</option>
                                  <option value={2}>Etapa 2 (Delegados Generales)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Aceptación Aviso de Privacidad</label>
                                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>
                                    {activeGuestData.acceptedPrivacyPolicyAt 
                                      ? `Aceptado: ${new Date(activeGuestData.acceptedPrivacyPolicyAt).toLocaleString()}`
                                      : `Aceptado al registrar (${new Date(activeGuestData.createdAt || Date.now()).toLocaleDateString()})`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* CONTROL DE ENTREGA DE REGALOS / KITS ADISTEM 2026 */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                            <h5 className="font-bold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <Gift className="w-4 h-4 text-blue-600" />
                              Control de Entrega de Regalos, Kits y Documentación (Padrón de Invitados)
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!activeGuestData.kitsBienvenida}
                                  onChange={e => updateField("kitsBienvenida", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">Kit de Bienvenida</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Kits Entregados</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!activeGuestData.regaloTitularEntregado}
                                  onChange={e => updateField("regaloTitularEntregado", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">Regalo Titular</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Kit de Convencionista Titular</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!(activeGuestData.regaloHombre || activeGuestData.regaloAcompananteHombreEntregado)}
                                  onChange={e => {
                                    updateField("regaloHombre", e.target.checked);
                                    updateField("regaloAcompananteHombreEntregado", e.target.checked);
                                  }}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">Regalo Hombre</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Kit Hombre Entregado</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!activeGuestData.regaloAcompananteMujerEntregado}
                                  onChange={e => updateField("regaloAcompananteMujerEntregado", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">Regalo Acompañante Mujer</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Kit Acompañante Mujer</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!activeGuestData.arregloFloral}
                                  onChange={e => updateField("arregloFloral", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">Arreglo Floral</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Arreglo Floral Entregado</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!activeGuestData.certificadoRegalo}
                                  onChange={e => updateField("certificadoRegalo", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">Certificado de Regalo</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Certificado Asignado</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!activeGuestData.regaloDespedida}
                                  onChange={e => updateField("regaloDespedida", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">Regalo de Despedida</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Regalo Despedida Entregado</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!activeGuestData.regaloMenores}
                                  onChange={e => updateField("regaloMenores", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">Regalo Menores</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Regalos de Menores Entregados</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!(activeGuestData.ineTitular || activeGuestData.idFileName)}
                                  onChange={e => updateField("ineTitular", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">INE 1 (Titular)</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Identificación de Titular</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                                <input
                                  type="checkbox"
                                  checked={!!activeGuestData.ineAcompanante}
                                  onChange={e => updateField("ineAcompanante", e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">INE 2 (Acompañante)</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Identificación de Acompañante</span>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* Danger/Cancellation Zone */}
                          <div className="border border-rose-150 bg-rose-50/60 p-4 rounded-xl space-y-2">
                            <h5 className="font-bold text-xs text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                              Gestión de Bajas y Cancelación de Asistencia
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              Al cancelar la asistencia del invitado, se liberarán los cupos de hotel, transportación y actividades. El registro cambiará a estatus "Cancelado".
                            </p>
                            {activeGuestData.status !== GuestStatus.CANCELLED ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const reason = prompt("Especifica el motivo de la cancelación de asistencia:");
                                  if (reason !== null) {
                                    const nowStr = new Date().toISOString();
                                    if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                      setEditedGuestData({
                                        ...editedGuestData,
                                        status: GuestStatus.CANCELLED,
                                        cancelledBy: "staff",
                                        cancelledAt: nowStr,
                                        cancellationReason: reason || "Cancelado por el staff operativo."
                                      });
                                    } else {
                                      setEditedGuestData({
                                        ...selectedGuest,
                                        status: GuestStatus.CANCELLED,
                                        cancelledBy: "staff",
                                        cancelledAt: nowStr,
                                        cancellationReason: reason || "Cancelado por el staff operativo."
                                      });
                                    }
                                  }
                                }}
                                className="bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                              >
                                Dar de Baja / Cancelar Asistencia
                              </button>
                            ) : (
                              <div className="p-3 bg-rose-100/70 border border-rose-200 rounded-xl text-xs">
                                <p className="font-bold text-rose-800">Asistencia Cancelada</p>
                                <p className="text-slate-700 mt-1"><strong>Registrado por:</strong> {activeGuestData.cancelledBy || "Staff"} el {new Date(activeGuestData.cancelledAt || "").toLocaleString()}</p>
                                <p className="text-slate-700"><strong>Motivo:</strong> {activeGuestData.cancellationReason || "No especificado"}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                      setEditedGuestData({
                                        ...editedGuestData,
                                        status: GuestStatus.INCOMPLETE,
                                        cancelledBy: undefined,
                                        cancelledAt: undefined,
                                        cancellationReason: undefined
                                      });
                                    } else {
                                      setEditedGuestData({
                                        ...selectedGuest,
                                        status: GuestStatus.INCOMPLETE,
                                        cancelledBy: undefined,
                                        cancelledAt: undefined,
                                        cancellationReason: undefined
                                      });
                                    }
                                  }}
                                  className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                                >
                                  Reactivar Asistencia
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 1.5 REGISTRANTE TAB */}
                      {editGuestSubTab === "registrante" && (
                        <div className="space-y-4 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
                          <div>
                            <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Key className="w-4 h-4 text-blue-600" />
                              Datos de la Cuenta del Registrante (Acceso al Portal Web)
                            </h5>
                            <p className="text-[10px] text-slate-500 mb-3">
                              Esta cuenta permite a la persona que registró a este invitado iniciar sesión en el portal web para modificar sus datos o completar su registro.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correo del Registrante</label>
                              <input 
                                type="email" 
                                value={registrantEmail} 
                                onChange={e => setRegistrantEmail(e.target.value)}
                                disabled={isReadOnly}
                                placeholder="Sin cuenta de registrante"
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-xs text-slate-800 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contraseña del Registrante</label>
                              <input 
                                type="text" 
                                value={registrantPassword} 
                                onChange={e => setRegistrantPassword(e.target.value)}
                                disabled={isReadOnly}
                                placeholder="Sin contraseña"
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-800 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                              />
                            </div>
                          </div>
                          
                          {!registrantEmail && (
                            <p className="text-[10px] text-amber-600 font-bold mt-2">
                              * Nota: Si ingresas un correo y contraseña, se creará una nueva cuenta de acceso para este invitado de forma automática al guardar.
                            </p>
                          )}
                        </div>
                      )}

                      {/* 2. HOSPAJE TAB */}
                      {editGuestSubTab === "hospedaje" && (
                        <div className="space-y-4">
                          {/* Banner informativo de costos de carnet */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                              <Hotel className="w-4 h-4 text-blue-600" />
                              <span>Tarifas Oficiales de Carnet:</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono">
                              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold shadow-3xs">
                                Carnet Sencillo: <strong className="text-blue-700">$95,000 + IVA</strong>
                              </span>
                              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold shadow-3xs">
                                Carnet Doble: <strong className="text-purple-700">$115,000 + IVA</strong>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hotel Sede de Alojamiento</label>
                              <select 
                                value={activeGuestData.hotelAlojamiento || ""} 
                                onChange={e => updateField("hotelAlojamiento", e.target.value)}
                                disabled={isReadOnly}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer font-semibold text-xs"
                              >
                                <option value="">Sin Hospedaje asignado</option>
                                {registeredHotels.map(h => (
                                  <option key={h.id} value={h.name}>{h.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número de Habitación</label>
                              <input 
                                type="text" 
                                value={activeGuestData.numeroHabitacion || ""} 
                                onChange={e => updateField("numeroHabitacion", e.target.value)}
                                disabled={isReadOnly}
                                placeholder="S/N"
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Habitación Carnet</label>
                              <select 
                                value={activeGuestData.carnetTipoHabitacion || "Doble"} 
                                onChange={e => {
                                  const val = e.target.value as any;
                                  if (val === "Sencilla" || val === "Sencillo Extra") {
                                    if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                      setEditedGuestData({
                                        ...editedGuestData,
                                        carnetTipoHabitacion: val,
                                        configuracionHabitacion: "King"
                                      });
                                    } else {
                                      setEditedGuestData({
                                        ...selectedGuest,
                                        carnetTipoHabitacion: val,
                                        configuracionHabitacion: "King"
                                      });
                                    }
                                  } else {
                                    updateField("carnetTipoHabitacion", val);
                                  }
                                }}
                                disabled={isReadOnly}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer text-xs font-semibold"
                              >
                                <option value="Sencilla">Carnet Sencillo</option>
                                <option value="Doble">Carnet Doble</option>
                                <option value="Sencillo Extra">Sencilla Extra</option>
                                <option value="Doble Extra">Doble Extra</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Configuración Cama { (activeGuestData.carnetTipoHabitacion === "Sencilla" || activeGuestData.carnetTipoHabitacion === "Sencillo Extra") && <span className="text-amber-600 font-semibold normal-case">(Fija en Sencillo)</span>}
                              </label>
                              <select 
                                value={(activeGuestData.carnetTipoHabitacion === "Sencilla" || activeGuestData.carnetTipoHabitacion === "Sencillo Extra") ? "King" : (activeGuestData.configuracionHabitacion || "Queen/Queen")} 
                                onChange={e => updateField("configuracionHabitacion", e.target.value as any)}
                                disabled={isReadOnly || activeGuestData.carnetTipoHabitacion === "Sencilla" || activeGuestData.carnetTipoHabitacion === "Sencillo Extra"}
                                className={`w-full border rounded-xl p-2 focus:outline-none focus:border-blue-500 text-xs font-semibold ${
                                  (activeGuestData.carnetTipoHabitacion === "Sencilla" || activeGuestData.carnetTipoHabitacion === "Sencillo Extra")
                                    ? "bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200"
                                    : "bg-white text-slate-800 cursor-pointer border-slate-200"
                                }`}
                              >
                                <option value="King">1 Cama King Size</option>
                                <option value="Queen/Queen">2 Camas Queen / Matrimoniales</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Noches Adicionales (0 a 4)</label>
                              <input 
                                type="number" 
                                min={0}
                                max={4}
                                value={activeGuestData.nochesAdicionales ?? 0} 
                                onChange={e => {
                                  const val = Math.min(4, Math.max(0, Number(e.target.value)));
                                  updateField("nochesAdicionales", val);
                                }}
                                disabled={isReadOnly}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fechas Noches Adicionales</label>
                              <input 
                                type="text" 
                                value={activeGuestData.nochesAdicionalesFechas || ""} 
                                onChange={e => updateField("nochesAdicionalesFechas", e.target.value)}
                                disabled={isReadOnly || (activeGuestData.nochesAdicionales || 0) === 0}
                                placeholder={(activeGuestData.nochesAdicionales || 0) > 0 ? "Ej: 21 Octubre, 22 Octubre" : "Sin noches adicionales"}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-semibold text-xs text-slate-800"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Requerimientos Especiales / Adicionales del Invitado</label>
                              <textarea 
                                value={activeGuestData.specialRequirements || activeGuestData.requerimientosAdicionales || ""} 
                                onChange={e => {
                                  if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                    setEditedGuestData({ ...editedGuestData, specialRequirements: e.target.value, requerimientosAdicionales: e.target.value });
                                  } else {
                                    setEditedGuestData({ ...selectedGuest, specialRequirements: e.target.value, requerimientosAdicionales: e.target.value });
                                  }
                                }}
                                disabled={isReadOnly}
                                rows={2}
                                placeholder="Ej: Silla de ruedas, menú kosher, etc."
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 disabled:opacity-50 text-xs"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notas / Comentarios Internos de Coordinación</label>
                              <textarea 
                                value={activeGuestData.comentariosAdmin || ""} 
                                onChange={e => updateField("comentariosAdmin", e.target.value)}
                                disabled={isReadOnly}
                                rows={2}
                                placeholder="Añade aquí notas de logística, excepciones, etc."
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 disabled:opacity-50 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. VUELOS TAB */}
                      {editGuestSubTab === "vuelos" && (() => {
                        const baseComps = (activeGuestData.companions || []).filter(c => 
                          !c.id?.startsWith("M-") && 
                          !c.relationship?.includes("Menor") && 
                          !c.relationship?.includes("Adicional") &&
                          (c as any).tipo !== "minor"
                        );
                        const minorsList = activeGuestData.minors || [];
                        const minorsCount = minorsList.length || activeGuestData.numMenores || 0;
                        const totalReg = 1 + baseComps.length + minorsCount;
                        const allPeople = [
                          { id: "titular", name: `${activeGuestData.nombreTitular || ""} ${activeGuestData.apellidosTitular || ""}`.trim() || "Titular", type: "Titular" },
                          ...baseComps.map((c: any, idx: number) => ({
                            id: (c.id && !c.id.startsWith("M-")) ? c.id : `C-${idx + 1}`,
                            name: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || `Acompañante #${idx + 1}`,
                            type: "Acompañante"
                          })),
                          ...minorsList.map((m: any, idx: number) => ({
                            id: `M-${idx + 1}`,
                            name: m.name ? `${m.name} ${m.lastName || ""}`.trim() : (m.tipo === "adult" ? `Acompañante Adicional #${idx + 1} (Adulto)` : `Menor #${idx + 1} (${m.age === 0 ? "0-11 meses" : `${m.age || ""} años`})`),
                            type: m.tipo === "adult" ? "Acompañante Adicional" : "Menor"
                          }))
                        ];

                        if (allPeople.length < totalReg) {
                          const missingCount = totalReg - allPeople.length;
                          for (let i = 0; i < missingCount; i++) {
                            allPeople.push({
                              id: `M-seed-${i + 1}`,
                              name: `Menor #${i + 1}`,
                              type: "Menor"
                            });
                          }
                        }

                        const uniquePeople = allPeople.filter((p, index, self) =>
                          index === self.findIndex((t) => t.id === p.id)
                        );

                        const arrivalPassengersList = activeGuestData.vueloLlegadaPasajerosTitular || ["titular"];
                        const returnPassengersList = activeGuestData.vueloRegresoPasajerosTitular || ["titular"];

                        const calculatedArrivalCount = !activeGuestData.vuelosSeparados
                          ? totalReg
                          : Math.min(arrivalPassengersList.length, totalReg);

                        const calculatedReturnCount = !activeGuestData.vuelosSeparados
                          ? totalReg
                          : Math.min(returnPassengersList.length, totalReg);

                        return (
                          <div className="space-y-4">
                            {/* Toggle for Shared / Separate flights */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold text-slate-800">¿Los pasajeros viajan en vuelos separados?</p>
                                <p className="text-[10px] text-slate-500">
                                  Si está desactivado (vuelos compartidos), el número de pasajeros es igual al titular más los acompañantes adultos más los menores ({totalReg} personas).
                                </p>
                              </div>
                              <input 
                                type="checkbox"
                                checked={!!activeGuestData.vuelosSeparados}
                                disabled={isReadOnly}
                                onChange={e => {
                                  const separate = e.target.checked;
                                  setEditedGuestData(prev => {
                                    const next = { ...prev, vuelosSeparados: separate };
                                    if (!separate) {
                                      next.vueloLlegadaPersonas = totalReg;
                                      next.vueloRegresoPersonas = totalReg;
                                      next.vueloLlegadaPasajerosTitular = ["titular"];
                                      next.vueloRegresoPasajerosTitular = ["titular"];
                                    } else {
                                      next.vueloLlegadaPersonas = 1;
                                      next.vueloRegresoPersonas = 1;
                                      next.vueloLlegadaPasajerosTitular = ["titular"];
                                      next.vueloRegresoPasajerosTitular = ["titular"];
                                    }
                                    return next;
                                  });
                                }}
                                className="w-5 h-5 accent-blue-600 cursor-pointer"
                              />
                            </div>

                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                <Plane className="w-3.5 h-3.5 text-emerald-600" />
                                Horario e Itinerario de Arribo (Llegada)
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Fecha Llegada</label>
                                  <input 
                                    type="date"
                                    value={activeGuestData.vueloLlegadaFecha || ""}
                                    onChange={e => updateField("vueloLlegadaFecha", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Hora Llegada</label>
                                  <input 
                                    type="time"
                                    value={activeGuestData.vueloLlegadaHora || ""}
                                    onChange={e => updateField("vueloLlegadaHora", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Aerolínea / Transporte</label>
                                  <input 
                                    type="text"
                                    list="airlines-list"
                                    placeholder="Ej: Aeroméxico"
                                    value={activeGuestData.vueloLlegadaAerolinea || ""}
                                    onChange={e => updateField("vueloLlegadaAerolinea", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">No. de Vuelo</label>
                                  <input 
                                    type="text"
                                    placeholder="AM-124"
                                    value={activeGuestData.vueloLlegadaNoVuelo || ""}
                                    onChange={e => updateField("vueloLlegadaNoVuelo", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">No. Pasajeros</label>
                                  <input 
                                    type="number"
                                    value={calculatedArrivalCount}
                                    onChange={e => {
                                      const val = Math.min(Number(e.target.value), totalReg);
                                      updateField("vueloLlegadaPersonas", val);
                                    }}
                                    disabled={true}
                                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none font-mono text-slate-700 font-bold"
                                  />
                                </div>
                              </div>

                              {activeGuestData.vuelosSeparados && (
                                <div className="mt-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5">
                                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide block">
                                    Seleccionar pasajeros en este vuelo de llegada:
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                                    {uniquePeople.map(p => {
                                      const isChecked = arrivalPassengersList.includes(p.id);
                                      return (
                                        <label key={p.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] font-medium cursor-pointer hover:bg-slate-50">
                                          <input 
                                            type="checkbox"
                                            checked={isChecked}
                                            disabled={isReadOnly}
                                            onChange={() => {
                                              const nextList = isChecked
                                                ? arrivalPassengersList.filter(id => id !== p.id)
                                                : [...arrivalPassengersList, p.id];
                                              updateField("vueloLlegadaPasajerosTitular", nextList);
                                              updateField("vueloLlegadaPersonas", nextList.length);
                                            }}
                                            className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                                          />
                                          <span className="truncate">{p.name} <span className="text-[9px] text-slate-400 font-normal">({p.type})</span></span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* VUELO DE LLEGADA 2 (TRAMO / ACOMPAÑANTE SEPARADO) */}
                            {activeGuestData.vuelosSeparados && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                  <Plane className="w-3.5 h-3.5 text-teal-600" />
                                  Vuelo de Llegada 2 (Tramo / Acompañante Separado)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Aerolínea Llegada 2</label>
                                    <input 
                                      type="text"
                                      placeholder="Ej: Aeroméxico"
                                      value={activeGuestData.vueloLlegadaAerolinea2 || ""}
                                      onChange={e => updateField("vueloLlegadaAerolinea2", e.target.value)}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">No. Vuelo Llegada 2</label>
                                    <input 
                                      type="text"
                                      placeholder="AM-456"
                                      value={activeGuestData.vueloLlegadaNoVuelo2 || ""}
                                      onChange={e => updateField("vueloLlegadaNoVuelo2", e.target.value)}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono font-bold text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Hora Llegada 2</label>
                                    <input 
                                      type="time"
                                      value={activeGuestData.vueloLlegadaHora2 || ""}
                                      onChange={e => updateField("vueloLlegadaHora2", e.target.value)}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">No. Pax Llegada 2</label>
                                    <input 
                                      type="number"
                                      value={activeGuestData.vueloLlegadaPax2 ?? 1}
                                      onChange={e => updateField("vueloLlegadaPax2", Number(e.target.value))}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono text-slate-700 font-bold text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                <Plane className="w-3.5 h-3.5 text-purple-600 rotate-90" />
                                Horario e Itinerario de Retorno (Regreso)
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Fecha Retorno</label>
                                  <input 
                                    type="date"
                                    value={activeGuestData.vueloRegresoFecha || ""}
                                    onChange={e => updateField("vueloRegresoFecha", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Hora Retorno</label>
                                  <input 
                                    type="time"
                                    value={activeGuestData.vueloRegresoHora || ""}
                                    onChange={e => updateField("vueloRegresoHora", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Aerolínea / Transporte</label>
                                  <input 
                                    type="text"
                                    list="airlines-list"
                                    placeholder="Ej: Volaris"
                                    value={activeGuestData.vueloRegresoAerolinea || ""}
                                    onChange={e => updateField("vueloRegresoAerolinea", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">No. de Vuelo</label>
                                  <input 
                                    type="text"
                                    placeholder="Y4-893"
                                    value={activeGuestData.vueloRegresoNoVuelo || ""}
                                    onChange={e => updateField("vueloRegresoNoVuelo", e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">No. Pasajeros</label>
                                  <input 
                                    type="number"
                                    value={calculatedReturnCount}
                                    onChange={e => {
                                      const val = Math.min(Number(e.target.value), totalReg);
                                      updateField("vueloRegresoPersonas", val);
                                    }}
                                    disabled={true}
                                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none font-mono text-slate-700 font-bold"
                                  />
                                </div>
                              </div>

                              {activeGuestData.vuelosSeparados && (
                                <div className="mt-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1.5">
                                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide block">
                                    Seleccionar pasajeros en este vuelo de regreso:
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                                    {uniquePeople.map(p => {
                                      const isChecked = returnPassengersList.includes(p.id);
                                      return (
                                        <label key={p.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] font-medium cursor-pointer hover:bg-slate-50">
                                          <input 
                                            type="checkbox"
                                            checked={isChecked}
                                            disabled={isReadOnly}
                                            onChange={() => {
                                              const nextList = isChecked
                                                ? returnPassengersList.filter(id => id !== p.id)
                                                : [...returnPassengersList, p.id];
                                              updateField("vueloRegresoPasajerosTitular", nextList);
                                              updateField("vueloRegresoPersonas", nextList.length);
                                            }}
                                            className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                                          />
                                          <span className="truncate">{p.name} <span className="text-[9px] text-slate-400 font-normal">({p.type})</span></span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* VUELO DE REGRESO 2 (TRAMO / ACOMPAÑANTE SEPARADO) */}
                            {activeGuestData.vuelosSeparados && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                                  <Plane className="w-3.5 h-3.5 text-indigo-600 rotate-90" />
                                  Vuelo de Regreso 2 (Tramo / Acompañante Separado)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Fecha Retorno 2</label>
                                    <input 
                                      type="date"
                                      value={activeGuestData.vueloRegresoFecha2 || ""}
                                      onChange={e => updateField("vueloRegresoFecha2", e.target.value)}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Aerolínea Regreso 2</label>
                                    <input 
                                      type="text"
                                      placeholder="Ej: Volaris"
                                      value={activeGuestData.vueloRegresoAerolinea2 || ""}
                                      onChange={e => updateField("vueloRegresoAerolinea2", e.target.value)}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">No. Vuelo Regreso 2</label>
                                    <input 
                                      type="text"
                                      placeholder="Y4-789"
                                      value={activeGuestData.vueloRegresoNoVuelo2 || ""}
                                      onChange={e => updateField("vueloRegresoNoVuelo2", e.target.value)}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono font-bold text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">Hora Retorno 2</label>
                                    <input 
                                      type="time"
                                      value={activeGuestData.vueloRegresoHora2 || ""}
                                      onChange={e => updateField("vueloRegresoHora2", e.target.value)}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-bold mb-1">No. Pax Regreso 2</label>
                                    <input 
                                      type="number"
                                      value={activeGuestData.vueloRegresoPax2 ?? 1}
                                      onChange={e => updateField("vueloRegresoPax2", Number(e.target.value))}
                                      disabled={isReadOnly}
                                      className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono text-slate-700 font-bold text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 4. LOGISTICA TAB */}
                      {editGuestSubTab === "logistica" && (
                        <div className="space-y-4">
                          {/* 4.1 Citas y Reservaciones de Actividades con Cupo (SPA, Golf, etc.) */}
                          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div>
                                <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  Citas y Turnos Reservados en Actividades con Cupo ({(activeGuestData.activityReservations || []).length})
                                </span>
                                <p className="text-[10px] text-slate-500 font-medium">Citas asignadas en vivo al titular y acompañantes en actividades con cupo limitado</p>
                              </div>
                            </div>

                            {(!activeGuestData.activityReservations || activeGuestData.activityReservations.length === 0) ? (
                              <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <p className="text-xs text-slate-400 font-medium">Este invitado no cuenta con citas reservadas en actividades con cupo.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {activeGuestData.activityReservations.map((res, rIdx) => {
                                  const actMatch = allActivities.find(a => a.id === res.activityId);
                                  const actName = res.activityName || actMatch?.name || res.activityId;
                                  const isGolf = actName.toLowerCase().includes("golf") || actMatch?.category === "golf";
                                  const isSpa = actName.toLowerCase().includes("spa") || actMatch?.category === "spa";

                                  return (
                                    <div key={rIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 relative shadow-3xs">
                                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-1.5">
                                        <div>
                                          <p className="font-bold text-slate-800 flex items-center gap-1">
                                            {actName}
                                            {res.citaNo && <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">Cita #{res.citaNo}</span>}
                                          </p>
                                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                                            <span>Para:</span>
                                            <strong className="text-slate-700">{res.personName || "Invitado"}</strong>
                                            <span className="text-[9px] px-1 bg-slate-200 text-slate-600 rounded capitalize">{res.personType || "titular"}</span>
                                          </p>
                                        </div>
                                        {!isReadOnly && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm(`¿Liberar la cita de ${res.personName || 'este invitado'} en ${actName}?`)) {
                                                const filtered = (activeGuestData.activityReservations || []).filter((_, i) => i !== rIdx);
                                                updateField("activityReservations", filtered);
                                              }
                                            }}
                                            className="text-rose-600 hover:text-rose-800 font-bold text-[10px] uppercase cursor-pointer"
                                          >
                                            Liberar
                                          </button>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                                        <div>
                                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Día / Pestaña:</span>
                                          <span className="font-medium text-slate-700">{res.dayLabel || res.sheetTab || res.dayDate || "No especificado"}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Horario / Turno:</span>
                                          <span className="font-bold text-blue-700 font-mono">{res.slotTime || "Por confirmar"}</span>
                                        </div>

                                        {isSpa && res.therapistGender && (
                                          <div className="col-span-2">
                                            <span className="text-[9px] text-slate-400 font-bold block uppercase">Terapeuta Asignado:</span>
                                            <span className="font-medium text-slate-700">{res.therapistGender}</span>
                                          </div>
                                        )}

                                        {isGolf && (
                                          <div className="col-span-2 bg-white p-2 rounded-lg border border-slate-200/60 text-[10px] space-y-0.5">
                                            <p className="font-bold text-slate-700">Detalles de Golf:</p>
                                            <p>Palos: <strong className="text-slate-800">{res.golfOwnClubs ? "Lleva palos propios" : "Renta palos de golf"}</strong></p>
                                            {res.golfHand && <p>Orientación: <strong className="text-slate-800">{res.golfHand}</strong></p>}
                                            {res.golfShaft && <p>Varilla: <strong className="text-slate-800">{res.golfShaft}</strong></p>}
                                          </div>
                                        )}

                                        {res.notes && (
                                          <div className="col-span-2 text-[10px] text-slate-500 italic">
                                            Nota: {res.notes}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">Traslado Aeropuerto <span className="text-slate-400">↔</span> Hotel</span>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Traslado / Transporte Programado</label>
                              <select
                                value={activeGuestData.assignedTransportId || ""}
                                onChange={e => updateField("assignedTransportId", e.target.value || undefined)}
                                disabled={isReadOnly}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer font-semibold text-xs"
                              >
                                <option value="">Sin transporte asignado</option>
                                {transportSlots.map(t => (
                                  <option key={t.id} value={t.id}>
                                    [{t.route}] {t.description} ({t.assignedCount}/{t.capacity} lugares) - {t.dateTime}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">Inscripción General a Actividades del Programa</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {allActivities.map(act => {
                                const isChecked = activeGuestData.selectedActivities?.includes(act.id);
                                return (
                                  <label key={act.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-xs transition">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isReadOnly}
                                      onChange={e => {
                                        const current = activeGuestData.selectedActivities || [];
                                        let updated: string[];
                                        if (e.target.checked) {
                                          updated = [...current, act.id];
                                        } else {
                                          updated = current.filter(id => id !== act.id);
                                        }
                                        updateField("selectedActivities", updated);
                                      }}
                                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div>
                                      <p className="font-bold text-slate-800">{act.name}</p>
                                      <p className="text-[10px] text-slate-500 font-medium">{act.description}</p>
                                      <p className="text-[9px] text-blue-600 mt-1 font-semibold uppercase tracking-wider">
                                        Cupo: {act.registeredCount}/{act.capacity} • Categoría: {act.category}
                                      </p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. ACOMPANANTES TAB */}
                      {editGuestSubTab === "acompanantes" && (() => {
                        const adultCompanions = (activeGuestData.companions || []).filter(c => 
                          !c.id?.startsWith("M-") && 
                          !c.relationship?.includes("Menor") && 
                          !c.relationship?.includes("Adicional") &&
                          (c as any).tipo !== "minor"
                        );

                        return (
                        <div className="space-y-6">
                          {/* SECCION 1: ACOMPAÑANTES ADULTOS */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                              <div>
                                <h5 className="font-bold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  Acompañante Adulto ({adultCompanions.length} / 1)
                                </h5>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Se consideran menores de 0 a 11 años; <strong>a partir de los 12 años se registran como adultos</strong>.
                                </p>
                              </div>

                              {!isReadOnly && (
                                <button
                                  type="button"
                                  disabled={adultCompanions.length >= 1}
                                  onClick={() => {
                                    if (adultCompanions.length >= 1) {
                                      alert("Únicamente se permite registrar un máximo de 1 acompañante adulto por invitado.");
                                      return;
                                    }
                                    const newComp = {
                                      id: Date.now().toString(),
                                      name: "Nuevo Acompañante",
                                      firstName: "",
                                      lastName: "",
                                      relationship: "Esposo/a",
                                      sex: "F",
                                      allergies: "",
                                      requirements: ""
                                    };
                                    const updated = [...adultCompanions, newComp];
                                    updateField("companions", updated);
                                    if (updated.length === 1) {
                                      updateField("nombreAcompanante", "");
                                      updateField("apellidosAcompanante", "");
                                      updateField("sexoAcompanante", "Femenino");
                                      updateField("alergiasAcompanante", "");
                                    }
                                  }}
                                  className={`px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-2xs ${
                                    adultCompanions.length >= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  Agregar Acompañante Adulto (Máx. 1)
                                </button>
                              )}
                            </div>

                            {(activeGuestData.carnetTipoHabitacion === "Sencilla" || activeGuestData.carnetTipoHabitacion === "Sencillo Extra") && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                                <span className="font-bold">⚠️ Nota sobre Carnet Sencillo:</span>
                                <span>El carnet sencillo contempla únicamente 1 persona (titular). Si se requiere acompañante adulto en la misma habitación, cambiar el tipo de carnet a <strong>Carnet Doble</strong> en la pestaña Hospedaje.</span>
                              </div>
                            )}

                            {/* Legacy Single Companion fallback sync if companions array is empty but legacy fields exist */}
                            {adultCompanions.length === 0 && (activeGuestData.nombreAcompanante || activeGuestData.apellidosAcompanante) && (
                              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                                <span className="text-amber-800 font-medium">
                                  Se detectaron datos de acompañante único (<strong>{activeGuestData.nombreAcompanante} {activeGuestData.apellidosAcompanante}</strong>).
                                </span>
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newComp = {
                                        id: Date.now().toString(),
                                        name: `${activeGuestData.nombreAcompanante || ''} ${activeGuestData.apellidosAcompanante || ''}`.trim(),
                                        firstName: activeGuestData.nombreAcompanante || '',
                                        lastName: activeGuestData.apellidosAcompanante || '',
                                        relationship: "Esposo/a",
                                        sex: activeGuestData.sexoAcompanante === "Masculino" ? "M" : "F",
                                        allergies: activeGuestData.alergiasAcompanante || "",
                                        requirements: ""
                                      };
                                      updateField("companions", [newComp]);
                                    }}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded cursor-pointer"
                                  >
                                    Convertir a Ficha
                                  </button>
                                )}
                              </div>
                            )}

                            {adultCompanions.length === 0 && !activeGuestData.nombreAcompanante && !activeGuestData.apellidosAcompanante && (
                              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                <p className="text-xs text-slate-400 font-medium">El titular no registró acompañantes adultos.</p>
                              </div>
                            )}

                            {adultCompanions.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {adultCompanions.map((comp, cidx) => {
                                  let fName = comp.firstName || "";
                                  let lName = comp.lastName || "";
                                  if (!fName && !lName) {
                                    const parts = (comp.name || "").split(" ");
                                    fName = parts[0] || "";
                                    lName = parts.slice(1).join(" ") || "";
                                  }

                                  const updateCompanionField = (field: string, value: any) => {
                                    const updated = adultCompanions.map((c, i) => {
                                      if (i === cidx) {
                                        const newC = { ...c, [field]: value };
                                        if (field === "firstName" || field === "lastName") {
                                          const fn = field === "firstName" ? value : fName;
                                          const ln = field === "lastName" ? value : lName;
                                          newC.name = `${fn} ${ln}`.trim();
                                        }
                                        return newC;
                                      }
                                      return c;
                                    });
                                    updateField("companions", updated);

                                    // Sync first companion with top-level fields
                                    if (cidx === 0) {
                                      if (field === "firstName") updateField("nombreAcompanante", value);
                                      if (field === "lastName") updateField("apellidosAcompanante", value);
                                      if (field === "sex") updateField("sexoAcompanante", value === "M" ? "Masculino" : "Femenino");
                                      if (field === "allergies") updateField("alergiasAcompanante", value);
                                    }
                                  };

                                  return (
                                    <div key={comp.id || cidx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 relative shadow-2xs">
                                      <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                                        <span className="text-[11px] font-extrabold text-blue-700 uppercase flex items-center gap-1">
                                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                          Acompañante Adulto #{cidx + 1}
                                        </span>
                                        {!isReadOnly && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const filtered = adultCompanions.filter((_, i) => i !== cidx);
                                              updateField("companions", filtered);
                                              if (cidx === 0) {
                                                const next = filtered[0];
                                                if (next) {
                                                  updateField("nombreAcompanante", next.firstName || "");
                                                  updateField("apellidosAcompanante", next.lastName || "");
                                                  updateField("sexoAcompanante", next.sex === "M" ? "Masculino" : "Femenino");
                                                  updateField("alergiasAcompanante", next.allergies || "");
                                                } else {
                                                  updateField("nombreAcompanante", "");
                                                  updateField("apellidosAcompanante", "");
                                                  updateField("sexoAcompanante", "Femenino");
                                                  updateField("alergiasAcompanante", "");
                                                }
                                              }
                                            }}
                                            className="text-rose-600 hover:text-rose-800 font-bold text-[10px] uppercase cursor-pointer"
                                          >
                                            Eliminar
                                          </button>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nombre(s)</label>
                                          <input
                                            type="text"
                                            value={fName}
                                            onChange={e => updateCompanionField("firstName", e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Nombre"
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Apellidos</label>
                                          <input
                                            type="text"
                                            value={lName}
                                            onChange={e => updateCompanionField("lastName", e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Apellidos"
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Parentesco</label>
                                          <select
                                            value={comp.relationship || "Esposo/a"}
                                            onChange={e => updateCompanionField("relationship", e.target.value)}
                                            disabled={isReadOnly}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                                          >
                                            <option value="Esposo/a">Esposo/a</option>
                                            <option value="Hijo/a">Hijo/a</option>
                                            <option value="Padre/Madre">Padre/Madre</option>
                                            <option value="Hermano/a">Hermano/a</option>
                                            <option value="Amigo/a">Amigo/a</option>
                                            <option value="Otro">Otro</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Sexo</label>
                                          <select
                                            value={comp.sex || "F"}
                                            onChange={e => updateCompanionField("sex", e.target.value)}
                                            disabled={isReadOnly}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                                          >
                                            <option value="F">Femenino</option>
                                            <option value="M">Masculino</option>
                                          </select>
                                        </div>
                                        <div className="col-span-2">
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Alergias o Restricciones Alimenticias</label>
                                          <input
                                            type="text"
                                            value={comp.allergies || ""}
                                            onChange={e => updateCompanionField("allergies", e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Ninguna o especificar..."
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* SECCION 2: ACOMPAÑANTES ADICIONALES (ADULTOS O MENORES DE EDAD) */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                              <div>
                                <h5 className="font-bold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  Acompañantes Adicionales (Adultos o Menores de edad) ({(activeGuestData.minors || []).length} / 2)
                                </h5>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Máximo 2 acompañantes adicionales (adultos o menores de edad). Se consideran menores de 0 a 11 años; <strong>a partir de los 12 años se registran como adultos</strong>.
                                </p>
                              </div>

                              {!isReadOnly && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={(activeGuestData.minors || []).length >= 2}
                                    onClick={() => {
                                      const currentMinors = activeGuestData.minors || [];
                                      if (currentMinors.length >= 2) {
                                        alert("Máximo 2 acompañantes adicionales (adultos o menores de edad).");
                                        return;
                                      }
                                      const newMinor = {
                                        name: "",
                                        lastName: "",
                                        age: 5,
                                        sex: "F",
                                        allergies: "",
                                        tipo: "minor" as const,
                                        parentezco: "Hijo"
                                      };
                                      const updated = [...currentMinors, newMinor];
                                      if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                        setEditedGuestData({
                                          ...editedGuestData,
                                          minors: updated,
                                          numMenores: updated.length
                                        });
                                      } else {
                                        setEditedGuestData({
                                          ...selectedGuest,
                                          minors: updated,
                                          numMenores: updated.length
                                        });
                                      }
                                    }}
                                    className={`px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-2xs ${
                                      (activeGuestData.minors || []).length >= 2 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                    }`}
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    Agregar Menor (0 a 11 años)
                                  </button>
                                  <button
                                    type="button"
                                    disabled={(activeGuestData.minors || []).length >= 2}
                                    onClick={() => {
                                      const currentMinors = activeGuestData.minors || [];
                                      if (currentMinors.length >= 2) {
                                        alert("Máximo 2 acompañantes adicionales (adultos o menores de edad).");
                                        return;
                                      }
                                      const newAdult = {
                                        name: "",
                                        lastName: "",
                                        age: 18,
                                        sex: "F",
                                        allergies: "",
                                        tipo: "adult" as const,
                                        parentezco: "Otro"
                                      };
                                      const updated = [...currentMinors, newAdult];
                                      if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                        setEditedGuestData({
                                          ...editedGuestData,
                                          minors: updated,
                                          numMenores: updated.length
                                        });
                                      } else {
                                        setEditedGuestData({
                                          ...selectedGuest,
                                          minors: updated,
                                          numMenores: updated.length
                                        });
                                      }
                                    }}
                                    className={`px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-2xs ${
                                      (activeGuestData.minors || []).length >= 2 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                    }`}
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    Agregar Adulto Adicional (12+ años)
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] text-slate-500 font-bold mb-1">Cantidad de Acompañantes Adicionales Registrados</label>
                                <input 
                                  type="number" 
                                  min={0}
                                  max={2}
                                  value={activeGuestData.numMenores ?? (activeGuestData.minors || []).length} 
                                  onChange={e => updateField("numMenores", Number(e.target.value))}
                                  disabled={isReadOnly}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 font-bold mb-1">Alergias / Dieta General de los Adicionales</label>
                                <input 
                                  type="text" 
                                  placeholder="Especificar restricciones generales"
                                  value={activeGuestData.alergiasMenores || ""} 
                                  onChange={e => updateField("alergiasMenores", e.target.value)}
                                  disabled={isReadOnly}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 text-xs"
                                />
                              </div>
                            </div>

                            {/* Minors List Cards */}
                            {(!activeGuestData.minors || activeGuestData.minors.length === 0) && (
                              <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                <p className="text-xs text-slate-400 font-medium">No se registraron acompañantes adicionales (adultos o menores).</p>
                              </div>
                            )}

                            {activeGuestData.minors && activeGuestData.minors.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {activeGuestData.minors.map((minor, midx) => {
                                  const updateMinorField = (field: string, val: any) => {
                                    const updated = (activeGuestData.minors || []).map((m, i) => {
                                      if (i === midx) {
                                        return { ...m, [field]: val };
                                      }
                                      return m;
                                    });
                                    updateField("minors", updated);
                                  };

                                  const isAdultMinor = minor.tipo === "adult";

                                  return (
                                    <div key={midx} className={`bg-slate-50 border rounded-xl p-3 space-y-2 relative ${isAdultMinor ? 'border-purple-200 bg-purple-50/20' : 'border-slate-200'}`}>
                                      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                                        <span className={`text-[11px] font-extrabold uppercase ${isAdultMinor ? 'text-purple-700' : 'text-sky-700'}`}>
                                          {isAdultMinor ? `Acompañante Adicional #${midx + 1} (Adulto)` : `Menor #${midx + 1} (0 a 11 años)`}
                                        </span>
                                        {!isReadOnly && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = (activeGuestData.minors || []).filter((_, i) => i !== midx);
                                              if (editedGuestData && editedGuestData.id === selectedGuest.id) {
                                                setEditedGuestData({
                                                  ...editedGuestData,
                                                  minors: updated,
                                                  numMenores: updated.length
                                                });
                                              } else {
                                                setEditedGuestData({
                                                  ...selectedGuest,
                                                  minors: updated,
                                                  numMenores: updated.length
                                                });
                                              }
                                            }}
                                            className="text-rose-600 hover:text-rose-800 font-bold text-[10px] uppercase cursor-pointer"
                                          >
                                            Eliminar
                                          </button>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nombre(s)</label>
                                          <input
                                            type="text"
                                            value={minor.name || ""}
                                            onChange={e => updateMinorField("name", e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Nombre"
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Apellidos</label>
                                          <input
                                            type="text"
                                            value={minor.lastName || ""}
                                            onChange={e => updateMinorField("lastName", e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Apellidos"
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Tipo</label>
                                          <select
                                            value={minor.tipo || "minor"}
                                            onChange={e => {
                                              const val = e.target.value;
                                              updateMinorField("tipo", val);
                                              if (val === "adult") {
                                                updateMinorField("age", 18);
                                              } else if ((minor.age ?? 0) > 17) {
                                                updateMinorField("age", 10);
                                              }
                                            }}
                                            disabled={isReadOnly}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 cursor-pointer"
                                          >
                                            <option value="minor">Menor de edad (0 a 17 años)</option>
                                            <option value="adult">Adulto adicional (18+ años)</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Sexo</label>
                                          <select
                                            value={minor.sex || "F"}
                                            onChange={e => updateMinorField("sex", e.target.value)}
                                            disabled={isReadOnly}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 cursor-pointer"
                                          >
                                            <option value="F">Femenino</option>
                                            <option value="M">Masculino</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                            {minor.tipo === "adult" ? "Edad (A partir de 18)" : "Edad (Hasta 17 años)"}
                                          </label>
                                          {minor.tipo === "adult" ? (
                                            <input
                                              type="number"
                                              min={18}
                                              max={100}
                                              value={minor.age || 18}
                                              onChange={e => updateMinorField("age", Number(e.target.value))}
                                              disabled={isReadOnly}
                                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 font-mono"
                                            />
                                          ) : (
                                            <select
                                              value={Math.min(minor.age ?? 5, 17)}
                                              onChange={e => updateMinorField("age", Number(e.target.value))}
                                              disabled={isReadOnly}
                                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 cursor-pointer"
                                            >
                                              <option value={0}>0 - 11 meses</option>
                                              {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={num}>
                                                  {num} {num === 1 ? "año" : "años"}
                                                </option>
                                              ))}
                                            </select>
                                          )}
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Parentesco</label>
                                          <select
                                            value={minor.parentezco || (minor.tipo === "adult" ? "Otro" : "Hijo")}
                                            onChange={e => updateMinorField("parentezco", e.target.value)}
                                            disabled={isReadOnly}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 cursor-pointer"
                                          >
                                            <option value="Hijo">Hijo</option>
                                            <option value="Amigo">Amigo</option>
                                            <option value="Sobrino">Sobrino</option>
                                            <option value="Hermano">Hermano</option>
                                            <option value="Esposo/a">Esposo/a</option>
                                            <option value="Familiar">Familiar</option>
                                            <option value="Otro">Otro</option>
                                          </select>
                                        </div>
                                        <div className="col-span-2 sm:col-span-3">
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Alergias o Restricciones</label>
                                          <input
                                            type="text"
                                            value={minor.allergies || ""}
                                            onChange={e => updateMinorField("allergies", e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Ninguna o alergias específicas"
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })()}

                      {/* 6. CARGOS EXTRA TAB */}
                      {editGuestSubTab === "cargos" && (
                        <div className="space-y-4">
                          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              Cargos Extra / Modificaciones Financieras
                            </span>
                            {!isReadOnly && (
                              <div className="flex gap-2 bg-slate-50 p-3 rounded-lg border border-slate-150 items-end">
                                <div className="flex-1">
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Descripción de Cargo</label>
                                  <input 
                                    type="text"
                                    placeholder="Ej: Noche adicional extra GFA"
                                    value={newChargeDesc}
                                    onChange={e => setNewChargeDesc(e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                                  />
                                </div>
                                <div className="w-32">
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Monto (MXN)</label>
                                  <input 
                                    type="number"
                                    placeholder="Monto"
                                    value={newChargeAmount || ""}
                                    onChange={e => setNewChargeAmount(Number(e.target.value))}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none font-mono"
                                  />
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const cleanDesc = (newChargeDesc || "").trim();
                                    if (!cleanDesc || newChargeAmount <= 0) return;
                                    const updatedCharges = [...currentCharges, { description: cleanDesc, monto: newChargeAmount }];
                                    updateField("costosAdicionales", updatedCharges);
                                    setNewChargeDesc("");
                                    setNewChargeAmount(0);
                                  }}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                                >
                                  Agregar
                                </button>
                              </div>
                            )}

                            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                                    <th className="p-2.5">Descripción de Cargo</th>
                                    <th className="p-2.5 text-right w-36">Monto</th>
                                    {!isReadOnly && <th className="p-2.5 text-center w-20">Acción</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {currentCharges.length === 0 ? (
                                    <tr>
                                      <td colSpan={isReadOnly ? 2 : 3} className="p-6 text-center text-slate-400 italic">
                                        Sin cargos adicionales registrados.
                                      </td>
                                    </tr>
                                  ) : (
                                    currentCharges.map((c, cidx) => (
                                      <tr key={cidx} className="hover:bg-slate-50/50">
                                        <td className="p-2.5 font-semibold text-slate-700">{c.description}</td>
                                        <td className="p-2.5 font-mono text-right text-slate-600 font-bold">${c.monto.toLocaleString()} MXN</td>
                                        {!isReadOnly && (
                                          <td className="p-2.5 text-center">
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                const filtered = currentCharges.filter((_, i) => i !== cidx);
                                                updateField("costosAdicionales", filtered);
                                              }}
                                              className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                                            >
                                              Eliminar
                                            </button>
                                          </td>
                                        )}
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6.5 DETALLE DE CARGOS TAB */}
                      {editGuestSubTab === "detalle_cargos" && (() => {
                        const habCount = Math.max(1, activeGuestData.numHabitaciones || 1);
                        
                        const roomsFinancials: Array<{
                          roomIndex: number;
                          carnetIdx: number;
                          fin: ReturnType<typeof calculateCarnetFinancials>;
                          items: Array<{
                            id: string;
                            categoria: string;
                            badgeColor: string;
                            concepto: string;
                            descripcion: string;
                            calculo: string;
                            monto: number;
                          }>;
                          roomTotal: number;
                        }> = [];

                        let calcGrandTotal = 0;
                        let sumBaseCarnet = 0;
                        let sumNochesExtras = 0;
                        let sumMenores = 0;
                        let sumAdultosExtra = 0;
                        let sumCamaExtra = 0;
                        let sumRecargo3er = 0;
                        let sumCargosManuales = 0;
                        let totalMinorsCount = 0;
                        let totalAdultsExtraCount = 0;

                        for (let r = 0; r < habCount; r++) {
                          const carnetIdx = getCarnetIndexInGroup(activeGuestData.id, r);
                          const carnetGuestObj = r === 0 ? activeGuestData : {
                            ...activeGuestData,
                            companions: [],
                            nombreAcompanante: undefined,
                            minors: [],
                            numMenores: 0,
                            carnetTipoHabitacion: "Sencilla"
                          };
                          const fin = calculateCarnetFinancials(carnetGuestObj, undefined, carnetIdx);
                          calcGrandTotal += fin.totalGeneralCarnet;
                          sumBaseCarnet += fin.costoCarnetEvento;
                          sumNochesExtras += fin.totalDiasAdicionalesCarnet;
                          sumMenores += (fin.totalNinos0a3 + fin.totalNinos4a11 + fin.totalNinos12a17);
                          sumAdultosExtra += fin.totalAdultoDiaExtra;
                          sumCamaExtra += fin.totalCamaExtra;
                          sumRecargo3er += fin.recargoTercerCarnet;
                          sumCargosManuales += fin.totalCargosManuales;
                          totalMinorsCount += (fin.count0a3 + fin.count4a11 + fin.count12a17);
                          totalAdultsExtraCount += fin.countAdultoExtra;

                          // Construir items detallados de este carnet
                          const items: Array<{
                            id: string;
                            categoria: string;
                            badgeColor: string;
                            concepto: string;
                            descripcion: string;
                            calculo: string;
                            monto: number;
                          }> = [];

                          // 1. Carnet base evento
                          items.push({
                            id: `base-${r}`,
                            categoria: "Costo del Carnet",
                            badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
                            concepto: `Costo del Carnet Convención 2026 (${fin.tipoHab})`,
                            descripcion: `Paquete oficial de 4 días / 3 noches en ${fin.hotelName}`,
                            calculo: `Estancia oficial (22 al 25 de Octubre 2026) en ocupación ${fin.isDoble ? "Doble" : "Sencilla"}`,
                            monto: fin.costoCarnetEvento
                          });

                          // 2. Noches adicionales
                          if (fin.nochesAdicionales > 0) {
                            items.push({
                              id: `noches-${r}`,
                              categoria: "Noches Adicionales",
                              badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
                              concepto: `${fin.nochesAdicionales} ${fin.nochesAdicionales === 1 ? "Noche Adicional" : "Noches Adicionales"}`,
                              descripcion: `Estancia extendida previa o posterior a las fechas oficiales`,
                              calculo: `${fin.nochesAdicionales} noche(s) × $${fin.costoDiaAdicionalCarnet.toLocaleString()} MXN / noche (${fin.tipoHab})`,
                              monto: fin.totalDiasAdicionalesCarnet
                            });
                          }

                          // 3. Menores 0 a 3 años
                          if (fin.count0a3 > 0) {
                            items.push({
                              id: `n03-${r}`,
                              categoria: "Menores (0-3)",
                              badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                              concepto: `Menores de 0 a 3 años (${fin.count0a3})`,
                              descripcion: `Hospedaje de infantes sin cargo adicional de convención`,
                              calculo: `${fin.count0a3} menor(es) × $${fin.costoDiaNino0a3.toLocaleString()} MXN × ${fin.diasEstanciaTotal} días de estancia`,
                              monto: fin.totalNinos0a3
                            });
                          }

                          // 4. Menores 4 a 11 años
                          if (fin.count4a11 > 0) {
                            items.push({
                              id: `n411-${r}`,
                              categoria: "Menores (4-11)",
                              badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
                              concepto: `Menores de 4 a 11 años (${fin.count4a11})`,
                              descripcion: `Hospedaje y plan de alimentos oficial para niños`,
                              calculo: `${fin.count4a11} menor(es) × $${fin.costoDiaNino4a11.toLocaleString()} MXN / día × ${fin.diasEstanciaTotal} días`,
                              monto: fin.totalNinos4a11
                            });
                          }

                          // 5. Menores 12 a 17 años
                          if (fin.count12a17 > 0) {
                            items.push({
                              id: `n1217-${r}`,
                              categoria: "Menores (12-17)",
                              badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
                              concepto: `Menores de 12 a 17 años (${fin.count12a17})`,
                              descripcion: `Tarifa júnior / adulto para jóvenes acompañantes (incluye plan de alimentos)`,
                              calculo: `${fin.count12a17} menor(es) × $${fin.costoDiaNino12a17.toLocaleString()} MXN / día × ${fin.diasEstanciaTotal} días`,
                              monto: fin.totalNinos12a17
                            });
                          }

                          // 6. Adultos Extra
                          if (fin.countAdultoExtra > 0) {
                            items.push({
                              id: `adulto-extra-${r}`,
                              categoria: "Adultos Extra",
                              badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
                              concepto: `Adulto(s) Extra (${fin.countAdultoExtra})`,
                              descripcion: `Acompañante adulto adicional no incluido en carnet base (incluye plan de alimentos)`,
                              calculo: `${fin.countAdultoExtra} adulto(s) extra × $${fin.costoAdultoDiaExtra.toLocaleString()} MXN / día × ${fin.diasEstanciaTotal} días de estancia`,
                              monto: fin.totalAdultoDiaExtra
                            });
                          }

                          // 7. Cama extra
                          if (fin.hasCamaExtra && fin.totalCamaExtra > 0) {
                            items.push({
                              id: `cama-${r}`,
                              categoria: "Cama Extra",
                              badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
                              concepto: `Cama Adicional Supletoria`,
                              descripcion: `Cama extra solicitada en habitación`,
                              calculo: `$${fin.costoCamaExtra.toLocaleString()} MXN / día × ${fin.diasEstanciaTotal} días de estancia`,
                              monto: fin.totalCamaExtra
                            });
                          }

                          // 8. Recargo 3er carnet en adelante
                          if (fin.recargoTercerCarnet > 0) {
                            items.push({
                              id: `recargo-${r}`,
                              categoria: "Recargo de Cuota",
                              badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
                              concepto: `Recargo por 3er Carnet en adelante`,
                              descripcion: `Carnet consecutivo #${fin.effectiveCarnetIndex} del grupo ${activeGuestData.grupo || "Stellantis"}`,
                              calculo: `Regla de convención: $10,000 MXN por carnet a partir del 3° del grupo`,
                              monto: fin.recargoTercerCarnet
                            });
                          }

                          // 9. Cargos manuales
                          const roomCostosAdicionales = carnetGuestObj.costosAdicionales || [];
                          roomCostosAdicionales.forEach((c: any, cidx: number) => {
                            items.push({
                              id: `extra-${r}-${cidx}`,
                              categoria: "Cargo Extra",
                              badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
                              concepto: c.description || c.concepto || `Cargo Adicional #${cidx + 1}`,
                              descripcion: `Cargo administrativo aplicado en backoffice`,
                              calculo: `Monto especificado en pestaña Cargos Extra`,
                              monto: c.monto || 0
                            });
                          });

                          roomsFinancials.push({
                            roomIndex: r,
                            carnetIdx,
                            fin,
                            items,
                            roomTotal: fin.totalGeneralCarnet
                          });
                        }

                        const handleDownloadSingleGuestStatement = () => {
                          const rows: any[] = [];
                          roomsFinancials.forEach((rf) => {
                            const labelCarnet = habCount > 1 ? `Carnet / Hab. #${rf.roomIndex + 1}` : "Carnet Principal";
                            rf.items.forEach((item) => {
                              rows.push({
                                "TITULAR": (activeGuestData.name || "").toUpperCase(),
                                "GRUPO": (activeGuestData.grupo || "STELLANTIS").toUpperCase(),
                                "DISTRIBUIDORA": (activeGuestData.distribuidora || activeGuestData.distributor || "").toUpperCase(),
                                "HOTEL": rf.fin.hotelName.toUpperCase(),
                                "HABITACIÓN": labelCarnet,
                                "CATEGORÍA": item.categoria,
                                "CONCEPTO": item.concepto,
                                "DESCRIPCIÓN": item.descripcion,
                                "FÓRMULA / CÁLCULO": item.calculo,
                                "MONTO (MXN)": item.monto
                              });
                            });
                          });
                          // Fila de Total
                          rows.push({
                            "TITULAR": "TOTAL GENERAL",
                            "GRUPO": "",
                            "DISTRIBUIDORA": "",
                            "HOTEL": "",
                            "HABITACIÓN": "",
                            "CATEGORÍA": "TOTAL",
                            "CONCEPTO": "TOTAL CARGOS APLICADOS",
                            "DESCRIPCIÓN": "Coincide con padrón de invitados",
                            "FÓRMULA / CÁLCULO": "",
                            "MONTO (MXN)": calcGrandTotal
                          });

                          const ws = XLSX.utils.json_to_sheet(rows);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Detalle_Cargos");
                          const cleanTitular = (activeGuestData.name || "Invitado").replace(/[^a-zA-Z0-9]/g, "_");
                          XLSX.writeFile(wb, `Detalle_Cargos_${cleanTitular}_${new Date().toISOString().split('T')[0]}.xlsx`);
                        };

                        return (
                          <div className="space-y-5 animate-in fade-in duration-150">
                            {/* Header de la sección */}
                            <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                      <Receipt className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h5 className="font-black text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                        Detalle de Cargos Aplicados al Registro
                                      </h5>
                                      <p className="text-[11px] text-slate-500 font-medium">
                                        Desglose financiero detallado y transparente para el expediente de <strong className="text-slate-800 uppercase">{activeGuestData.name}</strong>
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleDownloadSingleGuestStatement}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                                    title="Descargar este desglose de cargos a Excel"
                                  >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>Descargar en Excel</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditGuestSubTab("cargos")}
                                    className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    title="Ir a agregar o modificar cargos extra"
                                  >
                                    <PlusCircle className="w-4 h-4 text-blue-600" />
                                    <span>Gestionar Cargos Extra</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Tarjetas KPI de resumen por rubro */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Costo del Carnet</span>
                                <p className="text-base sm:text-lg font-black text-blue-700 font-mono mt-1">
                                  ${sumBaseCarnet.toLocaleString()} MXN
                                </p>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {habCount} {habCount === 1 ? "carnet base" : "carnets base"}
                                </span>
                              </div>

                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Noches Extras</span>
                                <p className="text-base sm:text-lg font-black text-amber-700 font-mono mt-1">
                                  ${sumNochesExtras.toLocaleString()} MXN
                                </p>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {activeGuestData.nochesAdicionales || 0} noche(s) adicionales
                                </span>
                              </div>

                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Menores</span>
                                <p className="text-base sm:text-lg font-black text-purple-700 font-mono mt-1">
                                  ${sumMenores.toLocaleString()} MXN
                                </p>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {totalMinorsCount} menor(es) registrados
                                </span>
                              </div>

                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Adultos Extra</span>
                                <p className="text-base sm:text-lg font-black text-fuchsia-700 font-mono mt-1">
                                  ${sumAdultosExtra.toLocaleString()} MXN
                                </p>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {totalAdultsExtraCount} adulto(s) extra
                                </span>
                              </div>

                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Camas Extra</span>
                                <p className="text-base sm:text-lg font-black text-indigo-700 font-mono mt-1">
                                  ${sumCamaExtra.toLocaleString()} MXN
                                </p>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {sumCamaExtra > 0 ? "Cama adicional solicitada" : "Sin cama extra"}
                                </span>
                              </div>

                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recargos & Extras</span>
                                <p className="text-base sm:text-lg font-black text-orange-700 font-mono mt-1">
                                  ${(sumRecargo3er + sumCargosManuales).toLocaleString()} MXN
                                </p>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  3er+ carnet y cargos admin
                                </span>
                              </div>
                            </div>

                            {/* Detalle por cada Carnet / Habitación */}
                            <div className="space-y-4">
                              {roomsFinancials.map((rf) => {
                                const isPrincipal = rf.roomIndex === 0;
                                const labelHab = habCount > 1 
                                  ? `Habitación #${rf.roomIndex + 1} — Carnet ${rf.fin.isDoble ? "Doble" : "Sencillo"} (${rf.fin.hotelName})`
                                  : `Carnet Principal — ${rf.fin.tipoHab} (${rf.fin.hotelName})`;

                                return (
                                  <div key={rf.roomIndex} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                                    {/* Cabecera de la habitación / carnet */}
                                    <div className="p-3.5 sm:px-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                                          isPrincipal ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                                        }`}>
                                          {rf.roomIndex + 1}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h6 className="font-extrabold text-xs text-slate-900 uppercase">
                                              {labelHab}
                                            </h6>
                                            <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                                              Carnet #{rf.carnetIdx} de {activeGuestData.grupo || "Grupo"}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-slate-500 font-medium">
                                            Configuración: {activeGuestData.configuracionHabitacion || "King"} • Estancia total: {rf.fin.diasEstanciaTotal} días
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Tabla de cargos itemizados */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                            <th className="py-2.5 px-3.5 w-36">Rubro</th>
                                            <th className="py-2.5 px-3.5">Concepto & Descripción</th>
                                            <th className="py-2.5 px-3.5">Detalle / Fórmula de Cálculo</th>
                                            <th className="py-2.5 px-3.5 text-right w-36">Monto Aplicado</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {rf.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                              <td className="py-2.5 px-3.5 align-top">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${item.badgeColor}`}>
                                                  {item.categoria}
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3.5 align-top">
                                                <p className="font-bold text-slate-900 text-xs">{item.concepto}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{item.descripcion}</p>
                                              </td>
                                              <td className="py-2.5 px-3.5 align-top text-slate-600 font-medium text-[11px]">
                                                {item.calculo}
                                              </td>
                                              <td className="py-2.5 px-3.5 align-top text-right font-mono font-extrabold text-slate-900 text-xs">
                                                ${item.monto.toLocaleString()} MXN
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Recuadro de Gran Total Consolidado */}
                            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md border border-slate-800">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">
                                    Resumen Global del Registro
                                  </span>
                                  <h5 className="font-black text-base text-white mt-0.5">
                                    Total de Cargos Aplicados al Expediente
                                  </h5>
                                  <p className="text-xs text-slate-300 font-medium mt-1">
                                    Titular: <strong className="text-white uppercase">{activeGuestData.name}</strong> • Grupo: <strong className="text-white">{activeGuestData.grupo || "Stellantis"}</strong> • {habCount} {habCount === 1 ? "habitación" : "habitaciones"}
                                  </p>
                                </div>

                                <div className="flex flex-col sm:items-end">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Monto Total Oficial</span>
                                  <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                                      ${calcGrandTotal.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300">MXN</span>
                                  </div>
                                  <p className="text-[10px] text-slate-300 font-medium mt-1">
                                    ✓ Coincide al 100% con la columna Total en el listado del Padrón de Invitados
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      {editGuestSubTab === "bitacora" && (() => {
                        const portalUsers = DataStore.getUsers();
                        const systemAuditLogs = DataStore.getAuditLogs();
                        
                        const linkedUser = portalUsers.find(
                          u => (u.email && u.email.toLowerCase() === activeGuestData.email.toLowerCase()) ||
                               (u.guestId && u.guestId === activeGuestData.id)
                        );

                        interface TimelineLog {
                          id: string;
                          timestamp: string;
                          user: string;
                          action: string;
                          details: string;
                          category: 'cuenta' | 'privacidad' | 'registro' | 'modificacion' | 'cancelacion' | 'sistema';
                          badgeBg: string;
                          badgeText: string;
                          icon: any;
                          prevValue?: string;
                          newValue?: string;
                        }

                        const allLogs: TimelineLog[] = [];

                        // 1. Account creation
                        if (activeGuestData.createdAt) {
                          allLogs.push({
                            id: `evt-creation-${activeGuestData.id}`,
                            timestamp: activeGuestData.createdAt,
                            user: activeGuestData.registeredByUserId || activeGuestData.email || 'Sistema Web ADISTEM',
                            action: 'Alta en Padrón / Creación de Cuenta',
                            details: `Se registró la ficha del invitado ${activeGuestData.name}. Grupo Corporativo: "${activeGuestData.grupo || 'Stellantis'}", Distribuidora: "${activeGuestData.distributor || activeGuestData.distribuidora || 'Sin asignar'}".`,
                            category: 'cuenta',
                            badgeBg: 'bg-indigo-100 border-indigo-200 text-indigo-800',
                            badgeText: 'Alta de Registro',
                            icon: Key
                          });
                        }

                        // 2. Privacy Policy Acceptance
                        const privacyTimestamp = linkedUser?.acceptedPrivacyPolicyAt || activeGuestData.acceptedPrivacyPolicyAt;
                        if (privacyTimestamp || linkedUser?.acceptedPrivacyTerms) {
                          allLogs.push({
                            id: `evt-privacy-${activeGuestData.id}`,
                            timestamp: privacyTimestamp || activeGuestData.createdAt,
                            user: `${activeGuestData.name} (${activeGuestData.email})`,
                            action: 'Aceptación de Aviso de Privacidad y Términos Legales',
                            details: 'El usuario aceptó expresamente la Política de Privacidad, Términos de Protección de Datos Sensibles y Consentimiento Legal para la Convención ADISTEM 2026.',
                            category: 'privacidad',
                            badgeBg: 'bg-emerald-100 border-emerald-200 text-emerald-800',
                            badgeText: 'Aceptación Legal',
                            icon: ShieldCheck
                          });
                        }

                        // 3. Complete registration / status
                        if (activeGuestData.status === GuestStatus.CONFIRMED || activeGuestData.status === GuestStatus.COMPLETE) {
                          allLogs.push({
                            id: `evt-complete-${activeGuestData.id}`,
                            timestamp: activeGuestData.updatedAt || activeGuestData.createdAt,
                            user: `${activeGuestData.name} (Invitado)`,
                            action: 'Finalización de Carnet Web',
                            details: `El invitado completó todos los pasos del registro. Carnet en Etapa ${activeGuestData.stage}. Estatus actual: ${activeGuestData.status}. Sede: ${activeGuestData.hotelAlojamiento || 'Por asignar'}.`,
                            category: 'registro',
                            badgeBg: 'bg-blue-100 border-blue-200 text-blue-800',
                            badgeText: 'Carnet Finalizado',
                            icon: CheckCircle2
                          });
                        }

                        // 4. Cancellation event if applicable
                        if (activeGuestData.cancelledAt || activeGuestData.status === GuestStatus.CANCELLED) {
                          allLogs.push({
                            id: `evt-cancelled-${activeGuestData.id}`,
                            timestamp: activeGuestData.cancelledAt || activeGuestData.updatedAt || new Date().toISOString(),
                            user: activeGuestData.cancelledBy === 'invitado' ? `${activeGuestData.name} (Invitado)` : 'Coordinación Staff ADISTEM',
                            action: 'Baja / Cancelación de Asistencia',
                            details: `Registro marcado como CANCELADO. Motivo de baja: "${activeGuestData.cancellationReason || 'No especificado'}".`,
                            category: 'cancelacion',
                            badgeBg: 'bg-rose-100 border-rose-200 text-rose-800',
                            badgeText: 'Baja Registrada',
                            icon: ShieldAlert
                          });
                        }

                        // 5. Guest audit history
                        if (activeGuestData.auditHistory && activeGuestData.auditHistory.length > 0) {
                          activeGuestData.auditHistory.forEach((h, idx) => {
                            let cat: TimelineLog['category'] = 'modificacion';
                            let bg = 'bg-sky-100 border-sky-200 text-sky-800';
                            let text = 'Edición de Ficha';
                            let icon = Edit3;

                            const actLower = h.action.toLowerCase();
                            if (actLower.includes('crea') || actLower.includes('alta')) { cat = 'cuenta'; bg = 'bg-indigo-100 border-indigo-200 text-indigo-800'; text = 'Alta Cuenta'; icon = Key; }
                            else if (actLower.includes('privacidad') || actLower.includes('terminos')) { cat = 'privacidad'; bg = 'bg-emerald-100 border-emerald-200 text-emerald-800'; text = 'Aceptación Legal'; icon = ShieldCheck; }
                            else if (actLower.includes('cancela') || actLower.includes('baja')) { cat = 'cancelacion'; bg = 'bg-rose-100 border-rose-200 text-rose-800'; text = 'Baja'; icon = ShieldAlert; }
                            else if (actLower.includes('completa') || actLower.includes('finaliz')) { cat = 'registro'; bg = 'bg-blue-100 border-blue-200 text-blue-800'; text = 'Registro Web'; icon = CheckCircle2; }
                            else if (actLower.includes('vuelo') || actLower.includes('traslado') || actLower.includes('transporte')) { icon = Plane; text = 'Logística/Vuelos'; }

                            allLogs.push({
                              id: `evt-hist-${idx}-${h.timestamp}`,
                              timestamp: h.timestamp,
                              user: h.user || 'Usuario / Coordinador',
                              action: h.action,
                              details: h.details,
                              category: cat,
                              badgeBg: bg,
                              badgeText: text,
                              icon: icon
                            });
                          });
                        }

                        // 6. Matching system audits from DataStore
                        const matchingSystemAudits = systemAuditLogs.filter(sysLog => {
                          if (!sysLog) return false;
                          const emailMatch = sysLog.userEmail && sysLog.userEmail.toLowerCase() === activeGuestData.email.toLowerCase();
                          const idMatch = (sysLog.userId && sysLog.userId.includes(activeGuestData.id)) || (sysLog.details && sysLog.details.includes(activeGuestData.id));
                          const nameMatch = sysLog.details && sysLog.details.toLowerCase().includes(activeGuestData.name.toLowerCase());
                          return emailMatch || idMatch || nameMatch;
                        });

                        matchingSystemAudits.forEach(sysLog => {
                          const exists = allLogs.some(l => Math.abs(new Date(l.timestamp).getTime() - new Date(sysLog.timestamp).getTime()) < 1000 && l.action === sysLog.action);
                          if (!exists) {
                            allLogs.push({
                              id: `evt-sys-${sysLog.id}`,
                              timestamp: sysLog.timestamp,
                              user: `${sysLog.userId} (${sysLog.userEmail || 'Sistema'})`,
                              action: sysLog.action,
                              details: sysLog.details,
                              category: 'sistema',
                              badgeBg: 'bg-purple-100 border-purple-200 text-purple-800',
                              badgeText: 'Auditoría Sistema',
                              icon: RefreshCw,
                              prevValue: sysLog.prevValue,
                              newValue: sysLog.newValue
                            });
                          }
                        });

                        // Deduplicate logs with exact same timestamp & action
                        const uniqueLogs = allLogs.reduce((acc: TimelineLog[], current) => {
                          const dup = acc.find(item => item.timestamp === current.timestamp && item.action === current.action);
                          if (!dup) acc.push(current);
                          return acc;
                        }, []);

                        // Sort logs
                        uniqueLogs.sort((a, b) => {
                          const timeA = new Date(a.timestamp).getTime();
                          const timeB = new Date(b.timestamp).getTime();
                          return bitacoraSortAsc ? timeA - timeB : timeB - timeA;
                        });

                        // Filter by category
                        const filtered = bitacoraFilter === 'all'
                          ? uniqueLogs
                          : uniqueLogs.filter(l => l.category === bitacoraFilter);

                        return (
                          <div className="space-y-4 animate-fade-in">
                            {/* Summary Metrics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                                  <Key className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha y Hora de Creación</p>
                                  <p className="text-xs font-black text-slate-800 font-mono mt-0.5">
                                    {activeGuestData.createdAt ? new Date(activeGuestData.createdAt).toLocaleString("es-MX") : "No registrada"}
                                  </p>
                                </div>
                              </div>

                              <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                                  <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aceptación Privacidad & Términos</p>
                                  <p className="text-xs font-black text-emerald-700 font-mono mt-0.5">
                                    {privacyTimestamp ? new Date(privacyTimestamp).toLocaleString("es-MX") : "Aceptado en Registro"}
                                  </p>
                                </div>
                              </div>

                              <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                                  <History className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Eventos Registrados</p>
                                  <p className="text-xs font-black text-blue-700 font-mono mt-0.5">
                                    {uniqueLogs.length} movimiento(s)
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Filters & Search Toolbar */}
                            <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wide flex items-center gap-1">
                                  <Filter className="w-3.5 h-3.5 text-blue-600" /> Filtrar Por Categoría:
                                </span>
                                <select 
                                  value={bitacoraFilter}
                                  onChange={e => setBitacoraFilter(e.target.value)}
                                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                  <option value="all">Todos los Movimientos ({uniqueLogs.length})</option>
                                  <option value="cuenta">Creación de Cuenta / Alta</option>
                                  <option value="privacidad">Aviso de Privacidad & Legal</option>
                                  <option value="registro">Completado de Carnet</option>
                                  <option value="modificacion">Cambios en Datos de Ficha</option>
                                  <option value="cancelacion">Bajas y Cancelaciones</option>
                                  <option value="sistema">Auditoría del Sistema</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => setBitacoraSortAsc(!bitacoraSortAsc)}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                                Orden: {bitacoraSortAsc ? "Más Antiguos Primero ⬆" : "Más Recientes Primero ⬇"}
                              </button>
                            </div>

                            {/* Timeline Cards Container */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest flex items-center gap-1">
                                <History className="w-4 h-4 text-blue-600" /> Bitácora Oficial e Histórico de Eventos ({filtered.length})
                              </span>

                              {filtered.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1">
                                  <p className="text-slate-500 font-bold text-xs">No se encontraron registros para la categoría seleccionada.</p>
                                  <p className="text-slate-400 text-[11px]">Intenta cambiando el filtro de la bitácora.</p>
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                  {filtered.map((item) => {
                                    const IconComponent = item.icon || History;
                                    const formattedDate = new Date(item.timestamp).toLocaleString("es-MX", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit"
                                    });

                                    return (
                                      <div key={item.id} className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all duration-200 space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                          <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                                              <IconComponent className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="font-extrabold text-xs text-slate-800">{item.action}</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${item.badgeBg}`}>
                                              {item.badgeText}
                                            </span>
                                          </div>

                                          <span className="text-[10px] text-slate-500 font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-3xs">
                                            {formattedDate}
                                          </span>
                                        </div>

                                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                          {item.details}
                                        </p>

                                        {(item.prevValue || item.newValue) && (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] font-mono">
                                            {item.prevValue && <div className="text-slate-500"><strong>Anterior:</strong> {item.prevValue}</div>}
                                            {item.newValue && <div className="text-blue-700 font-bold"><strong>Nuevo:</strong> {item.newValue}</div>}
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[10px] text-slate-500 font-medium">
                                          <span className="flex items-center gap-1">
                                            <UserCheck className="w-3 h-3 text-slate-400" />
                                            <strong>Registrado por:</strong> {item.user}
                                          </span>
                                          <span className="text-slate-400 font-mono">
                                            ID: {item.id}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                    </div>

                    {/* BOTTOM ACTIONS */}
                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
                      {!isReadOnly && (() => {
                        const hasChanges = getHasChanges();
                        return (
                          <button 
                            type="button"
                            disabled={!hasChanges}
                            onClick={handleSaveEditedGuest}
                            className={`px-4 py-2 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 ${
                              hasChanges
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                            }`}
                          >
                            <Save className="w-4 h-4" />
                            Confirmar Cambios
                          </button>
                        );
                      })()}
                      <button 
                        type="button"
                        onClick={() => { setSelectedGuest(null); setIsEditingGuest(false); }}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs rounded-xl transition cursor-pointer font-bold shadow-2xs"
                      >
                        Cerrar Detalle
                      </button>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ADD INDIVIDUAL GUEST DIALOG */}
            {isAddingGuest && (
              <form onSubmit={handleAddIndividualGuest} className="bg-white p-5 rounded-xl border border-blue-200/85 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-900">Alta de Invitado Nuevo (Operación ADISTEM)</h4>
                  <button type="button" onClick={() => { setIsAddingGuest(false); setFormErrors({}); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 font-bold mb-1">Código ID Invitado (Formato: ADI-XXXX)</label>
                    <input 
                      type="text" 
                      placeholder="ej: ADI-4491"
                      value={newGuestData.id}
                      onChange={e => setNewGuestData({ ...newGuestData, id: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.id && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{formErrors.id}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-bold mb-1">Nombre Completo del Invitado</label>
                    <input 
                      type="text" 
                      placeholder="Ing. Juan Pablo Garza"
                      value={newGuestData.name}
                      onChange={e => setNewGuestData({ ...newGuestData, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.name && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-bold mb-1">Correo Electrónico Oficial (Evitar Duplicados)</label>
                    <input 
                      type="email" 
                      placeholder="jpablo@garzamotors.com.mx"
                      value={newGuestData.email}
                      onChange={e => setNewGuestData({ ...newGuestData, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.email && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-bold mb-1">Distribuidor / Agencia (Obligatorio)</label>
                    <input 
                      type="text" 
                      placeholder="Garza Automotriz Monterrey"
                      value={newGuestData.distributor}
                      onChange={e => setNewGuestData({ ...newGuestData, distributor: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    {formErrors.distributor && <p className="text-rose-600 text-[10px] mt-1 font-semibold">{formErrors.distributor}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-bold mb-1">Rol de Control Administrativo</label>
                    <input 
                      type="text" 
                      placeholder="Socio Fundador / Director"
                      value={newGuestData.role}
                      onChange={e => setNewGuestData({ ...newGuestData, role: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-bold mb-1">Etapa de Registro Asignada</label>
                    <select 
                      value={newGuestData.stage}
                      onChange={e => setNewGuestData({ ...newGuestData, stage: Number(e.target.value) as (1 | 2) })}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value={1}>Etapa 1 (Acceso Preferente / VIPS)</option>
                      <option value={2}>Etapa 2 (Acceso General / Delegados)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-bold mb-1">Usuario de Acceso (Opcional, default: Correo)</label>
                    <input 
                      type="text" 
                      placeholder="Dejar vacío para usar el correo"
                      value={newGuestData.username}
                      onChange={e => setNewGuestData({ ...newGuestData, username: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 font-bold mb-1">Contraseña de Acceso (Opcional, default: ID)</label>
                    <input 
                      type="text" 
                      placeholder="Dejar vacío para usar el ID (ej: ADI-1234)"
                      value={newGuestData.password}
                      onChange={e => setNewGuestData({ ...newGuestData, password: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition cursor-pointer shadow-2xs">
                    Dar de Alta Invitado
                  </button>
                  <button type="button" onClick={() => { setIsAddingGuest(false); setFormErrors({}); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded transition cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </form>
            )}



            {/* GUEST DIRECTORY LIST TABLE */}
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <p className="font-bold text-sm text-slate-850">Listado de Gestión de Invitados ADISTEM ({filteredGuests.length})</p>
                <span className="text-slate-400 text-[11px] italic font-medium">Clic en el registro para abrir expediente</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-500 font-bold bg-slate-50/75 text-[11px] uppercase tracking-wider">
                      <th 
                        className="p-4 cursor-pointer select-none hover:bg-slate-100 hover:text-blue-700 transition group"
                        onClick={() => handleToggleGuestSort('name')}
                        title="Clic para ordenar por Invitado Titular (Asc / Desc)"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Invitado Titular</span>
                          {guestSortField === 'name' ? (
                            guestSortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-350 opacity-40 group-hover:opacity-100 group-hover:text-blue-500 transition shrink-0" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 cursor-pointer select-none hover:bg-slate-100 hover:text-blue-700 transition group"
                        onClick={() => handleToggleGuestSort('distributor_group')}
                        title="Clic para ordenar por Distribuidor / Grupo (Asc / Desc)"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Distribuidor / Grupo</span>
                          {guestSortField === 'distributor_group' ? (
                            guestSortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-350 opacity-40 group-hover:opacity-100 group-hover:text-blue-500 transition shrink-0" />
                          )}
                        </div>
                      </th>
                      <th className="p-4">Logística Sede</th>
                      <th className="p-4">Acompañantes</th>
                      <th className="p-4">Vuelo Ida / Regreso</th>
                      <th 
                        className="p-4 cursor-pointer select-none hover:bg-slate-100 hover:text-blue-700 transition group"
                        onClick={() => handleToggleGuestSort('total')}
                        title="Clic para ordenar por Importe Total (Asc / Desc)"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Importe Total</span>
                          {guestSortField === 'total' ? (
                            guestSortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-350 opacity-40 group-hover:opacity-100 group-hover:text-blue-500 transition shrink-0" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 text-right">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedGuests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic font-medium">
                          No se encontraron invitados que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      paginatedGuests.map(g => {
                        const customCostSum = (g.costosAdicionales || []).reduce((s: number, c: any) => s + c.monto, 0);
                        const total = getGuestTotalCost(g);
                        
                        const hasCompanions = g.companions && g.companions.length > 0;
                        const companionText = hasCompanions ? `Adulto: ${g.companions[0].name}` : (g.nombreAcompanante ? `Adulto: ${g.nombreAcompanante}` : "Solo");
                        
                        const minorsList = g.minors || [];
                        const actualMinorsCount = minorsList.length > 0
                          ? minorsList.filter((m: any) => m.tipo === "minor" || (m.tipo !== "adult" && m.age !== undefined && m.age < 12)).length
                          : Math.round(g.numMenores || 0);
                        const actualAdultsCount = minorsList.length > 0
                          ? minorsList.filter((m: any) => m.tipo === "adult" || (m.age !== undefined && m.age >= 12)).length
                          : 0;

                        const arrivalFlight = g.flightArrival ? `${g.flightArrival.airline} ${g.flightArrival.flightNumber}` : (g.vueloLlegadaNoVuelo ? `${g.vueloLlegadaAerolinea} ${g.vueloLlegadaNoVuelo}` : "Ida: Pendiente");
                        const departureFlight = g.flightDeparture ? `${g.flightDeparture.airline} ${g.flightDeparture.flightNumber}` : (g.vueloRegresoNoVuelo ? `${g.vueloRegresoAerolinea} ${g.vueloRegresoNoVuelo}` : "Salida: Pendiente");

                        return (
                          <tr 
                            key={g.id} 
                            onClick={() => handleSelectGuestForEditing(g)}
                            className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition ${
                              selectedGuest?.id === g.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''
                            }`}
                          >
                            <td className="p-4">
                              <p className="font-bold text-slate-900 text-sm uppercase">{(g.name || `${g.nombreTitular || ""} ${g.apellidosTitular || ""}`.trim()).toUpperCase()}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-medium">{g.email}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="bg-blue-50 border border-blue-150 text-blue-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider inline-block">
                                  {(g.tipoHuesped === "Convencionistas" || g.tipoHuesped === "Convencionista") ? "Externo" : (g.tipoHuesped || "Externo")}
                                </span>
                                <span className="bg-purple-50 border border-purple-200 text-purple-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider inline-block">
                                  {g.puesto || (g as any).cargo || "Dueño"}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800">{g.distribuidora || g.distributor || "ADISTEM"}</p>
                              <p className="text-[11px] text-slate-400 font-semibold">{g.grupo || "Stellantis"}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-slate-800 font-bold">{g.hotelAlojamiento || config?.hotelSede || "Sin asignar"}</p>
                              <p className="text-[11px] font-semibold text-slate-500">
                                Habitación: <strong className="text-slate-700">{g.numeroHabitacion || "S/N"}</strong>
                              </p>
                              <p className="text-[10px] font-mono text-slate-400">
                                {g.carnetTipoHabitacion || "Sencilla"} ({g.configuracionHabitacion || "King"})
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="text-slate-700 font-medium">{companionText}</p>
                              <p className="text-slate-400 text-[11px] font-semibold">
                                {actualMinorsCount > 0 && `Menores: ${actualMinorsCount}`}
                                {actualMinorsCount > 0 && actualAdultsCount > 0 && ` · `}
                                {actualAdultsCount > 0 && `Adic. Adultos: ${actualAdultsCount}`}
                                {actualMinorsCount === 0 && actualAdultsCount === 0 && `Sin adicionales`}
                              </p>
                            </td>
                            <td className="p-4 font-mono text-[11px]">
                              <p className="text-emerald-600 font-bold">{arrivalFlight}</p>
                              <p className="text-blue-600 font-bold">{departureFlight}</p>
                            </td>
                            <td 
                              className="p-4 cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectGuestForEditing(g);
                                setEditGuestSubTab("detalle_cargos");
                              }}
                              title="Ver detalle completo de cargos para este registro"
                            >
                              <p className="font-extrabold text-slate-900 text-sm font-mono group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                                ${total.toLocaleString()} MXN
                                <Receipt className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                              {customCostSum > 0 && (
                                <p className="text-[10px] text-emerald-600 font-semibold">+{customCostSum.toLocaleString()} extras</p>
                              )}
                              <span className="text-[9px] text-blue-600 underline font-bold opacity-0 group-hover:opacity-100 transition-opacity block mt-0.5">
                                Ver desglose &rarr;
                              </span>
                            </td>
                            <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => handleSelectGuestForEditing(g)}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-extrabold rounded-lg cursor-pointer transition"
                                >
                                  Ver Ficha
                                </button>
                                <button 
                                  onClick={() => {
                                    setGuestToDelete(g);
                                    setDeleteError(null);
                                  }}
                                  className="p-1.5 text-rose-600 hover:text-rose-750 rounded hover:bg-rose-50 cursor-pointer transition"
                                  title="Eliminar registro de invitado"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar with page size selector */}
              <div className="px-5 py-3.5 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/75 text-xs">
                <div className="flex items-center gap-2 text-slate-600 flex-wrap">
                  <span className="font-medium">Mostrar:</span>
                  <select
                    value={guestPageSize}
                    onChange={(e) => {
                      setGuestPageSize(Number(e.target.value));
                      setGuestCurrentPage(1);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                  <span className="text-slate-500 font-medium ml-2">
                    {sortedGuests.length > 0 ? (
                      <>
                        Mostrando <strong className="text-slate-800 font-bold">{(currentPageClamped - 1) * guestPageSize + 1}</strong> a <strong className="text-slate-800 font-bold">{Math.min(currentPageClamped * guestPageSize, sortedGuests.length)}</strong> de <strong className="text-slate-800 font-bold">{sortedGuests.length}</strong> invitados
                      </>
                    ) : (
                      "0 invitados"
                    )}
                  </span>
                </div>

                {totalGuestPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPageClamped <= 1}
                      onClick={() => setGuestCurrentPage(1)}
                      className="p-1.5 rounded-lg border border-slate-250 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Primera página"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPageClamped <= 1}
                      onClick={() => setGuestCurrentPage(p => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-250 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="px-3 py-1 font-bold text-slate-750 bg-white border border-slate-250 rounded-lg shadow-2xs">
                      Página {currentPageClamped} de {totalGuestPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPageClamped >= totalGuestPages}
                      onClick={() => setGuestCurrentPage(p => Math.min(totalGuestPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-250 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPageClamped >= totalGuestPages}
                      onClick={() => setGuestCurrentPage(totalGuestPages)}
                      className="p-1.5 rounded-lg border border-slate-250 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Última página"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: TRANSPORT ======================= */}
        {activeTab === "transport" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-brand-primary" />
                  Consola de Logística de Transporte (Hotel ↔ Aeropuerto)
                </h3>
                <p className="text-xs text-slate-550 font-medium">Gestiona traslados terrestres de delegados, edita y crea bloques de autobuses, y monitorea demoras de vuelos en tiempo real.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={() => {
                    setEditingTransportSlot(null);
                    setTransportFormState({
                      id: "",
                      route: 'Aeropuerto -> Hotel',
                      dateTime: "",
                      capacity: 40,
                      description: ""
                    });
                    setShowTransportSlotForm(true);
                  }}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Bloque de Transporte
                </button>
                <button 
                  onClick={() => triggerVersionedDownload("Transporte_Asignacion_Operativa")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Exportar Reporte Hotel
                </button>
              </div>
            </div>

            {/* TRANSPORT BLOCKS SECTION */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <Bus className="w-4 h-4 text-brand-primary" />
                Catálogo de Horarios, Capacidades y Ocupación de Bloques
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transportSlots.map(slot => {
                  const available = slot.capacity - slot.assignedCount;
                  const percent = Math.min(100, Math.round((slot.assignedCount / slot.capacity) * 100));
                  return (
                    <div key={slot.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3 hover:shadow-2xs transition">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            slot.route.includes("Aeropuerto") ? 'bg-sky-50 text-sky-700 border border-sky-150' : 'bg-purple-50 text-purple-700 border border-purple-150'
                          }`}>
                            {slot.route}
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleEditTransportSlot(slot)}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Editar bloque"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteTransportSlot(slot.id)}
                              className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                              title="Eliminar bloque"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="font-extrabold text-slate-800 text-xs mt-1">{slot.description}</p>
                        <p className="text-slate-550 text-[10px] font-medium">Salida: {formatDate(slot.dateTime)}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-end justify-between text-[11px] font-semibold text-slate-600">
                          <span>Progreso de Ocupación:</span>
                          <span className="font-bold text-slate-800">{slot.assignedCount} / {slot.capacity} pas.</span>
                        </div>
                        <div className="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden border border-slate-100">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              percent >= 90 ? 'bg-rose-500' :
                              percent >= 70 ? 'bg-amber-500' : 'bg-brand-primary'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`font-bold ${available <= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {available <= 0 ? "⚠️ AGOTADO" : `${available} asientos libres`}
                          </span>
                          <span className="text-slate-450 font-medium">Capacidad: {slot.capacity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INCOMING ARRIVALS TRACKER */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-600" />
                  Plan de Arribos de Pasajeros (Ordenado por Horario de Llegada)
                </h4>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {guests.filter(g => g.status !== GuestStatus.CANCELLED && g.flightArrival).length} Vuelos Confirmados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <th className="p-3">Asistente / Distribuidor</th>
                      <th className="p-3">Vuelo de Llegada</th>
                      <th className="p-3">Bloque Terrestre</th>
                      <th className="p-3">Estatus de Vuelo / Demoras</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const list = guests
                        .filter(g => g.status !== GuestStatus.CANCELLED && g.flightArrival)
                        .sort((a, b) => {
                          const timeA = new Date(a.flightArrival!.arrivalDateTime).getTime();
                          const timeB = new Date(b.flightArrival!.arrivalDateTime).getTime();
                          return timeA - timeB;
                        });

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic font-medium">
                              No hay itinerarios de llegada registrados todavía en la plataforma.
                            </td>
                          </tr>
                        );
                      }

                      return list.map(g => {
                        const flight = g.flightArrival!;
                        const actualTime = (flight as any).actualDateTime;
                        const delayed = isFlightDelayed(flight.arrivalDateTime, actualTime);
                        const delayMin = getFlightDelayMinutes(flight.arrivalDateTime, actualTime);
                        const assignedBlock = transportSlots.find(s => s.id === g.assignedTransportId);

                        return (
                          <tr key={g.id} className="hover:bg-slate-50/50 transition border-b border-slate-100">
                            <td className="p-3">
                              <p className="font-extrabold text-slate-800 leading-tight uppercase">{(g.name || "").toUpperCase()}</p>
                              <p className="text-[10px] text-slate-550 font-semibold">{g.distributor}</p>
                              <p className="text-[9px] text-slate-400 font-medium font-mono mt-0.5">{g.email}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-700">{flight.airline} {flight.flightNumber}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{flight.departureAirport} → {flight.arrivalAirport}</p>
                              <p className="text-[10px] text-slate-450 mt-0.5">Programado: <span className="font-bold text-slate-600">{formatDate(flight.arrivalDateTime)}</span></p>
                            </td>
                            <td className="p-3 font-medium text-slate-700">
                              {assignedBlock ? (
                                <div className="space-y-0.5">
                                  <p className="font-bold text-xs text-brand-primary">{assignedBlock.description}</p>
                                  <p className="text-[10px] text-slate-450">Salida: {formatDate(assignedBlock.dateTime)}</p>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-150 text-[10px] font-bold rounded">
                                  ⚠️ Sin Bloque Asignado
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {actualTime ? (
                                <div className="space-y-1">
                                  <p className="text-[10px] text-slate-500 font-medium">Actual/Estimado: <span className="font-bold text-slate-700">{formatDate(actualTime)}</span></p>
                                  {delayed ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-150 text-[9px] font-black uppercase animate-pulse">
                                      <span className="w-1 h-1 rounded-full bg-rose-600"></span>
                                      ⚠️ RETRASADO (+{Math.floor(delayMin / 60)}h {delayMin % 60}m)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-extrabold uppercase">
                                      ● EN TIEMPO
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold">
                                    ● CONFIRMADO PROGRAMADO
                                  </span>
                                  <p className="text-[9px] text-slate-450 font-medium">Aún no se reporta demora en aeropuerto</p>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setEditingGuestFlight({ guestId: g.id, type: 'arrival' });
                                  setActualTimeFormState({ actualDateTime: actualTime || flight.arrivalDateTime });
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer border border-slate-200/80 flex items-center gap-1 mx-auto"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Monitorear
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OUTCOMING DEPARTURES TRACKER */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Plane className="w-4 h-4 text-purple-600" />
                  Plan de Salidas / Retornos (Ordenado por Horario de Vuelo)
                </h4>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {guests.filter(g => g.status !== GuestStatus.CANCELLED && g.flightDeparture).length} Retornos Confirmados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <th className="p-3">Asistente / Distribuidor</th>
                      <th className="p-3">Vuelo de Salida</th>
                      <th className="p-3">Bloque Terrestre</th>
                      <th className="p-3">Estatus de Vuelo / Demoras</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const list = guests
                        .filter(g => g.status !== GuestStatus.CANCELLED && g.flightDeparture)
                        .sort((a, b) => {
                          const timeA = new Date(a.flightDeparture!.departureDateTime).getTime();
                          const timeB = new Date(b.flightDeparture!.departureDateTime).getTime();
                          return timeA - timeB;
                        });

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic font-medium">
                              No hay itinerarios de salida registrados todavía en la plataforma.
                            </td>
                          </tr>
                        );
                      }

                      return list.map(g => {
                        const flight = g.flightDeparture!;
                        const actualTime = (flight as any).actualDateTime;
                        const delayed = isFlightDelayed(flight.departureDateTime, actualTime);
                        const delayMin = getFlightDelayMinutes(flight.departureDateTime, actualTime);
                        const assignedBlock = transportSlots.find(s => s.id === g.assignedTransportId);

                        return (
                          <tr key={g.id} className="hover:bg-slate-50/50 transition border-b border-slate-100">
                            <td className="p-3">
                              <p className="font-extrabold text-slate-800 leading-tight uppercase">{(g.name || "").toUpperCase()}</p>
                              <p className="text-[10px] text-slate-550 font-semibold">{g.distributor}</p>
                              <p className="text-[9px] text-slate-400 font-medium font-mono mt-0.5">{g.email}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-700">{flight.airline} {flight.flightNumber}</p>
                              <p className="text-[10px] text-slate-550 font-medium">{flight.departureAirport} → {flight.arrivalAirport}</p>
                              <p className="text-[10px] text-slate-450 mt-0.5">Programado: <span className="font-bold text-slate-600">{formatDate(flight.departureDateTime)}</span></p>
                            </td>
                            <td className="p-3 font-medium text-slate-700">
                              {assignedBlock ? (
                                <div className="space-y-0.5">
                                  <p className="font-bold text-xs text-brand-primary">{assignedBlock.description}</p>
                                  <p className="text-[10px] text-slate-450">Salida: {formatDate(assignedBlock.dateTime)}</p>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-150 text-[10px] font-bold rounded">
                                  ⚠️ Sin Bloque Asignado
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {actualTime ? (
                                <div className="space-y-1">
                                  <p className="text-[10px] text-slate-500 font-medium">Actual/Estimado: <span className="font-bold text-slate-700">{formatDate(actualTime)}</span></p>
                                  {delayed ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-150 text-[9px] font-black uppercase animate-pulse">
                                      <span className="w-1 h-1 rounded-full bg-rose-600"></span>
                                      ⚠️ RETRASADO (+{Math.floor(delayMin / 60)}h {delayMin % 60}m)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-extrabold uppercase">
                                      ● EN TIEMPO
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold">
                                    ● CONFIRMADO PROGRAMADO
                                  </span>
                                  <p className="text-[9px] text-slate-450 font-medium">Aún no se reporta demora en aeropuerto</p>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setEditingGuestFlight({ guestId: g.id, type: 'departure' });
                                  setActualTimeFormState({ actualDateTime: actualTime || flight.departureDateTime });
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer border border-slate-200/80 flex items-center gap-1 mx-auto"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Monitorear
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TRANSPORT SLOT CRUD MODAL FORM */}
            {showTransportSlotForm && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl animate-in zoom-in duration-150">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Bus className="w-4 h-4 text-brand-primary" />
                      {editingTransportSlot ? "Editar Bloque de Transporte" : "Crear Nuevo Bloque de Transporte"}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowTransportSlotForm(false);
                        setEditingTransportSlot(null);
                      }}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTransportSlot} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold">Ruta del Traslado:</label>
                      <select
                        value={transportFormState.route}
                        onChange={(e) => setTransportFormState({ ...transportFormState, route: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="Aeropuerto -> Hotel">Aeropuerto → Hotel</option>
                        <option value="Hotel -> Aeropuerto">Hotel → Aeropuerto</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold">Descripción del Bloque:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Bloque 2 - Autobús Ejecutivo"
                        value={transportFormState.description}
                        onChange={(e) => setTransportFormState({ ...transportFormState, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold">Fecha y Hora Salida:</label>
                        <input
                          type="datetime-local"
                          required
                          value={transportFormState.dateTime}
                          onChange={(e) => setTransportFormState({ ...transportFormState, dateTime: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold">Cupo Máximo (Pasajeros):</label>
                        <input
                          type="number"
                          required
                          min={5}
                          max={200}
                          value={transportFormState.capacity}
                          onChange={(e) => setTransportFormState({ ...transportFormState, capacity: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTransportSlotForm(false);
                          setEditingTransportSlot(null);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg transition shadow-xs"
                      >
                        {editingTransportSlot ? "Guardar Cambios" : "Crear Bloque"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* REAL-TIME FLIGHT DELAY MONITORING FORM MODAL */}
            {editingGuestFlight && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-xl animate-in zoom-in duration-150">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-brand-primary animate-spin" />
                      Consultar / Actualizar Hora Real de Vuelo
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setEditingGuestFlight(null)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {(() => {
                    const guest = guests.find(g => g.id === editingGuestFlight.guestId);
                    if (!guest) return null;
                    const flight = editingGuestFlight.type === 'arrival' ? guest.flightArrival : guest.flightDeparture;
                    if (!flight) return null;

                    return (
                      <form onSubmit={handleSaveActualFlightTime} className="space-y-4 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                          <p className="font-extrabold text-slate-800">{guest.name}</p>
                          <p className="text-slate-550 font-medium">{guest.distributor}</p>
                          <div className="pt-2 mt-2 border-t border-slate-200/60 space-y-0.5">
                            <p className="font-bold text-slate-700">Vuelo: {flight.airline} {flight.flightNumber}</p>
                            <p className="text-slate-500">Ruta: {flight.departureAirport} → {flight.arrivalAirport}</p>
                            <p className="text-slate-500">Fecha/Hora Programada: <span className="font-bold text-slate-700">{formatDate(flight.departureDateTime || flight.arrivalDateTime)}</span></p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-600 font-bold">Fecha y Hora de Arribo/Salida Real:</label>
                          <input
                            type="datetime-local"
                            required
                            value={actualTimeFormState.actualDateTime}
                            onChange={(e) => setActualTimeFormState({ actualDateTime: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                          <p className="text-[10px] text-slate-400 font-medium">Si esta hora es posterior a la programada, se emitirá una alerta visual de demora en la consola.</p>
                        </div>

                        <div className="flex justify-end pt-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingGuestFlight(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg transition shadow-xs"
                          >
                            Actualizar Estatus
                          </button>
                        </div>
                      </form>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB: ACTIVITIES ======================= */}
        {activeTab === "activities" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-150 pb-4 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Catálogo Maestro de Actividades Especiales</h3>
                <p className="text-xs text-slate-500 font-medium">Configura el tipo (SPA, GOLF, BUCEO), sincronización con Google Sheets, horarios, días y cupos máximos.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingActivity(null);
                    setFormSheetTestResult(null);
                    setWebhookTestResult(null);
                    setActivityFormState({
                      id: "",
                      name: "",
                      description: "",
                      isActive: true,
                      activityType: "SPA",
                      googleSheetsUrl: "https://docs.google.com/spreadsheets/d/1b3XRN2-3E0LJkb8mclMGqKX0Ld-5Kj5HLCsyeMPYRjo/edit?usp=sharing",
                      googleSheetsWebhookUrl: "",
                      googleSheetsTab: "Viernes",
                      daysConfig: [
                        { id: "day-1", date: "2026-05-15", label: "Viernes 15 de Mayo", googleSheetsTab: "Viernes" },
                        { id: "day-2", date: "2026-05-16", label: "Sábado 16 de Mayo", googleSheetsTab: "Sábado" }
                      ],
                      eventDay: "Viernes y Sábado",
                      timeRange: "09:00 - 14:00",
                      dateTime: "",
                      capacity: 20,
                      rules: "",
                      category: "SPA"
                    });
                    setShowActivityForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Crear Nueva Actividad
                </button>
                <button 
                  onClick={() => triggerVersionedDownload("Actividades_Maestras_Completo")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Exportar Reporte Proveedores
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activities.map(act => {
                const percent = Math.min(100, Math.round((act.registeredCount / act.capacity) * 100));
                const actType = (act.activityType || (act.category ? act.category.toUpperCase() : 'OTRO'));
                
                return (
                  <div key={act.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition">
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[11px] font-black rounded-lg uppercase tracking-wide border flex items-center gap-1.5 ${
                            actType === "SPA" 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
                              : actType === "GOLF"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : actType === "BUCEO"
                                  ? "bg-sky-50 text-sky-700 border-sky-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            <Sparkles className="w-3.5 h-3.5" />
                            {actType}
                          </span>

                          {/* Interactive Active/Inactive Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleActivityActive(act)}
                            className={`px-2.5 py-1 text-[11px] font-black rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs ${
                              act.isActive !== false
                                ? "bg-emerald-100/80 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                            }`}
                            title={act.isActive !== false ? "Actividad Activa en Registro (Clic para desactivar)" : "Actividad Desactivada / Oculta en Registro (Clic para activar)"}
                          >
                            <span className={`w-2 h-2 rounded-full ${act.isActive !== false ? "bg-emerald-600 animate-pulse" : "bg-rose-500"}`}></span>
                            <span>{act.isActive !== false ? "Activa" : "No Activa"}</span>
                          </button>
                        </div>

                        <span className={`text-[11px] font-extrabold uppercase tracking-wide ${percent >= 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {percent >= 100 ? "⚠️ CUPO LLENO" : "✓ LUGARES DISPONIBLES"}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-base text-slate-850 mt-2.5">{act.name}</h4>
                      <p className="text-xs text-slate-650 mt-1 leading-relaxed font-medium line-clamp-2">{act.description}</p>
                      
                      {/* Schedule & Day Badge */}
                      <div className="mt-3 p-3 bg-slate-50/80 rounded-xl text-[11px] text-slate-700 border border-slate-150 space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <strong>Día:</strong> {act.eventDay || "Por definir"}
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <strong>Horario:</strong> {act.timeRange || act.dateTime || "Por definir"}
                          </span>
                        </div>
                        {act.rules && (
                          <p className="pt-1 border-t border-slate-200/60 text-slate-600">
                            <strong>Condiciones:</strong> {act.rules}
                          </p>
                        )}
                      </div>

                      {/* Google Sheets Config Preview */}
                      {act.googleSheetsUrl && (
                        <div className="mt-2.5 p-2.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-bold text-emerald-900 block text-[11px]">Google Sheets Conectado</span>
                                {act.daysConfig && act.daysConfig.length > 0 ? (
                                  <span className="text-[10px] text-emerald-700 font-bold block">
                                    {act.daysConfig.length} {act.daysConfig.length === 1 ? "día activo" : "días activos"} con pestañas dedicadas
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 truncate block">Pestaña: <strong>{act.googleSheetsTab || "Hoja 1"}</strong></span>
                                )}
                              </div>
                            </div>
                            <a 
                              href={act.googleSheetsUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition shadow-3xs shrink-0 flex items-center gap-1 text-[10px] font-bold"
                              title="Abrir Google Sheets en nueva pestaña"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Abrir
                            </a>
                          </div>

                          {act.daysConfig && act.daysConfig.length > 0 && (
                            <div className="pt-1.5 border-t border-emerald-200/50 flex flex-wrap gap-1">
                              {act.daysConfig.map((d, dIdx) => (
                                <span key={d.id || dIdx} className="px-1.5 py-0.5 bg-white border border-emerald-200 text-emerald-900 rounded text-[9px] font-bold">
                                  {d.label}: <strong>{d.googleSheetsTab}</strong>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-emerald-200/50 text-[10px]">
                            <span className="text-slate-600 font-medium">Escritura en vivo (Webhook):</span>
                            {act.googleSheetsWebhookUrl ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Activo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Solo Lectura
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Ocupación Inscritos:</span>
                        <span className="font-bold text-slate-850">{act.registeredCount} / {act.capacity} participantes</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            percent >= 100 ? 'bg-rose-600' : percent > 75 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      {/* Waiting list display */}
                      <div className="text-[11px] flex items-center justify-between font-medium mb-3">
                        <span className="text-slate-500">Lista de Espera:</span>
                        <span className={`font-mono font-bold ${act.waitingList?.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {act.waitingList?.length || 0} invitado(s) en espera
                        </span>
                      </div>

                      {/* Action buttons: view guests, view google sheets slots, sync with sheets, edit, and delete */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedActivityForGuests(act)}
                          className="flex-1 py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Inscritos</span>
                        </button>
                        <button
                          onClick={() => handleOpenSlotsModal(act)}
                          className="py-2 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                          title="Inspeccionar Slots y datos de Google Sheets"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                          <span>Slots</span>
                        </button>
                        {act.googleSheetsUrl && (
                          <button
                            onClick={() => handleSyncActivityWithSheets(act)}
                            disabled={syncingActivityId === act.id}
                            className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-3xs disabled:opacity-50"
                            title="Sincronizar con Google Sheets (liberar o actualizar cupos eliminados)"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${syncingActivityId === act.id ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Sync Sheets</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditActivity(act)}
                          className="px-3 py-2 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-slate-600 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                          title="Editar Actividad"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="px-3 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                          title="Eliminar Actividad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GOOGLE SHEETS SLOTS INSPECTION MODAL */}
            {selectedActivityForSlots && (() => {
              const configuredDays = (selectedActivityForSlots.daysConfig && selectedActivityForSlots.daysConfig.length > 0)
                ? selectedActivityForSlots.daysConfig
                : [
                    {
                      id: "day-default",
                      label: selectedActivityForSlots.eventDay || "Día Principal",
                      date: selectedActivityForSlots.dateTime || "",
                      googleSheetsTab: selectedActivityForSlots.googleSheetsTab || "Hoja 1"
                    }
                  ];

              const currentTabName = selectedDayTabForSlots || configuredDays[0]?.googleSheetsTab || selectedActivityForSlots.googleSheetsTab || "Hoja 1";

              const filteredSlots = spaSlotsList.filter(slot => {
                if (slotFilterStatus === 'available' && (slot.isBlocked || slot.isOccupied)) return false;
                if (slotFilterStatus === 'blocked' && !slot.isBlocked) return false;
                if (slotFilterStatus === 'occupied' && !slot.isOccupied) return false;
                if (slotFilterGender !== 'all') {
                  const g = (slot.therapistGender || "").toLowerCase();
                  if (slotFilterGender === 'Dama' && !g.includes('dama') && !g.includes('fem') && !g.includes('mujer')) return false;
                  if (slotFilterGender === 'Caballero' && !g.includes('caballero') && !g.includes('masc') && !g.includes('hombre')) return false;
                }
                if (slotSearchTerm.trim()) {
                  const q = slotSearchTerm.toLowerCase();
                  const fullName = `${slot.participantName || ''} ${slot.participantPaternal || ''} ${slot.participantMaternal || ''}`.toLowerCase();
                  const email = (slot.titularEmail || '').toLowerCase();
                  const time = (slot.timeSlot || '').toLowerCase();
                  const cita = String(slot.citaNo || slot.rowIndex || '').toLowerCase();
                  return fullName.includes(q) || email.includes(q) || time.includes(q) || cita.includes(q);
                }
                return true;
              });

              return (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
                  <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full p-5 md:p-7 space-y-4 shadow-2xl animate-in zoom-in duration-150 max-h-[92vh] flex flex-col">
                    
                    {/* Header */}
                    <div className="border-b border-slate-150 pb-3 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                            Slots & Citas en Vivo: {selectedActivityForSlots.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Tipo: <strong className="text-purple-700 uppercase">{selectedActivityForSlots.activityType || selectedActivityForSlots.category}</strong> • Pestaña activa: <strong className="text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">"{currentTabName}"</strong>
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSelectedActivityForSlots(null)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold p-1 rounded-lg hover:bg-slate-100 transition"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>

                    {/* DÍAS CONFIGURADOS / SELECTOR DE PESTAÑAS */}
                    <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" /> Días configurados:
                        </span>
                        {configuredDays.map((d, dIdx) => {
                          const tab = d.googleSheetsTab || `Hoja ${dIdx + 1}`;
                          const isActive = currentTabName.trim().toLowerCase() === tab.trim().toLowerCase();
                          return (
                            <button
                              key={d.id || dIdx}
                              type="button"
                              onClick={() => {
                                setSelectedDayTabForSlots(tab);
                                loadSlotsForActivityTab(selectedActivityForSlots, tab);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 shrink-0 ${
                                isActive
                                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-2 ring-purple-500 font-extrabold"
                                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>{d.label || `Día ${dIdx + 1}`}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? "bg-purple-800 text-purple-100" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                                Pestaña: "{tab}"
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => loadSlotsForActivityTab(selectedActivityForSlots, currentTabName)}
                        disabled={spaSlotsLoading}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                        title="Recargar datos de esta pestaña desde Google Sheets"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${spaSlotsLoading ? 'animate-spin' : ''}`} />
                        <span>Recargar pestaña</span>
                      </button>
                    </div>

                    {/* Summary Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Citas en Pestaña</span>
                        <span className="text-lg font-black text-slate-850">{spaSlotsSummary.total}</span>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">✓ Cupos Disponibles</span>
                        <span className="text-lg font-black text-emerald-700">{spaSlotsSummary.available}</span>
                      </div>
                      <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">🚫 Bloqueados (Col P/O)</span>
                        <span className="text-lg font-black text-rose-700">{spaSlotsSummary.blocked}</span>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">👤 Ocupados / Asignados</span>
                        <span className="text-lg font-black text-blue-700">{spaSlotsSummary.occupied}</span>
                      </div>
                    </div>

                    {/* Rules & Column Mapping banner */}
                    <div className="p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs space-y-1 text-purple-950 shrink-0">
                      <div className="font-extrabold flex items-center justify-between text-purple-900 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          Reglas de lectura de Google Sheets (Renglón 9 en adelante):
                        </span>
                        <span className="text-[10px] font-mono text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200">
                          {selectedActivityForSlots.activityType === 'GOLF' ? 'Golf Apps Script' : selectedActivityForSlots.activityType === 'PICKLEBALL' ? 'Pickleball Apps Script' : selectedActivityForSlots.activityType === 'BINGO' ? 'Bingo Apps Script' : (selectedActivityForSlots.activityType === 'MOVIE_NIGHTS' || (selectedActivityForSlots.name || '').toUpperCase().includes('MOVIE')) ? 'Movie Nights Apps Script' : 'SPA Apps Script v8'} • Mayúsculas activas
                        </span>
                      </div>
                      {selectedActivityForSlots.activityType === 'GOLF' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-1 text-[10px] font-medium text-purple-900">
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col B:</strong> Nombre</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col C:</strong> Apellido</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center text-rose-700"><strong>Col D:</strong> Email / RESERVADO</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col F:</strong> Bastones</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col G:</strong> Der / Zur</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col H:</strong> Reg / Stiff</span>
                        </div>
                      ) : selectedActivityForSlots.activityType === 'PICKLEBALL' || selectedActivityForSlots.activityType === 'BINGO' || selectedActivityForSlots.activityType === 'MOVIE_NIGHTS' || (selectedActivityForSlots.name || '').toUpperCase().includes('MOVIE') ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] font-medium text-purple-900">
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col B:</strong> Nombre</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col C:</strong> Apellido</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col D:</strong> {(selectedActivityForSlots.activityType === 'MOVIE_NIGHTS' || (selectedActivityForSlots.name || '').toUpperCase().includes('MOVIE')) ? 'Menor de Edad' : 'Titular / Acompañante'}</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center text-rose-700"><strong>Col G:</strong> Email / RESERVADO</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1 text-[10px] font-medium text-purple-900">
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col A:</strong> Cita #</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col B:</strong> Nombre</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col C/D:</strong> Apellidos</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col J/K:</strong> Horario</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center"><strong>Col M/N:</strong> Terapeuta</span>
                          <span className="p-1 bg-white rounded-md border border-purple-150 text-center text-rose-700"><strong>Col P:</strong> Email/Bloqueo</span>
                        </div>
                      )}
                    </div>

                    {/* Filters & Search Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0 pt-1">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <div className="relative w-full max-w-xs">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={slotSearchTerm}
                            onChange={(e) => setSlotSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre, horario, cita..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Filter */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setSlotFilterStatus('all')}
                            className={`px-2.5 py-1 rounded-lg transition ${slotFilterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            Todos ({spaSlotsList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlotFilterStatus('available')}
                            className={`px-2.5 py-1 rounded-lg transition ${slotFilterStatus === 'available' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'}`}
                          >
                            Disponibles ({spaSlotsList.filter(s => !s.isBlocked && !s.isOccupied).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlotFilterStatus('blocked')}
                            className={`px-2.5 py-1 rounded-lg transition ${slotFilterStatus === 'blocked' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'}`}
                          >
                            Bloqueados ({spaSlotsList.filter(s => s.isBlocked).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlotFilterStatus('occupied')}
                            className={`px-2.5 py-1 rounded-lg transition ${slotFilterStatus === 'occupied' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'}`}
                          >
                            Ocupados ({spaSlotsList.filter(s => s.isOccupied).length})
                          </button>
                        </div>

                        {/* Gender Filter */}
                        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setSlotFilterGender('all')}
                            className={`px-2.5 py-1 rounded-lg transition ${slotFilterGender === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                          >
                            Género: Todos
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlotFilterGender('Dama')}
                            className={`px-2.5 py-1 rounded-lg transition ${slotFilterGender === 'Dama' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'}`}
                          >
                            Dama
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlotFilterGender('Caballero')}
                            className={`px-2.5 py-1 rounded-lg transition ${slotFilterGender === 'Caballero' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-50'}`}
                          >
                            Caballero
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Loading or Error status */}
                    {spaSlotsLoading && (
                      <div className="p-8 text-center text-slate-500 font-bold text-xs animate-pulse flex items-center justify-center gap-2 border border-slate-200 rounded-2xl bg-slate-50">
                        <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                        Consultando Google Sheets pestaña "{currentTabName}" en vivo...
                      </div>
                    )}

                    {spaSlotsError && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{spaSlotsError}</span>
                      </div>
                    )}

                    {/* Interactive Slots Table */}
                    {!spaSlotsLoading && (
                      <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl min-h-[220px]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
                            <tr>
                              <th className="p-2.5 text-center">Cita / Renglón</th>
                              <th className="p-2.5">Horario & Duración</th>
                              <th className="p-2.5">Terapeuta</th>
                              <th className="p-2.5">Participante (Col B, C, D)</th>
                              <th className="p-2.5">Email Titular / Bloqueo (Col P/O)</th>
                              <th className="p-2.5 text-center">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {filteredSlots.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                                  {spaSlotsList.length === 0
                                    ? `No se encontraron slots registrados en la pestaña "${currentTabName}". Verifica que el nombre de la pestaña coincida exactamente en Google Sheets.`
                                    : "No hay citas que coincidan con los filtros seleccionados."}
                                </td>
                              </tr>
                            ) : (
                              filteredSlots.map((slot, sIdx) => {
                                const fullName = [slot.participantName, slot.participantPaternal, slot.participantMaternal].filter(Boolean).join(" ").trim();
                                const isDama = (slot.therapistGender || "").toLowerCase().includes("dam") || (slot.therapistGender || "").toLowerCase().includes("fem");
                                return (
                                  <tr 
                                    key={sIdx} 
                                    className={`hover:bg-slate-50/80 transition ${
                                      slot.isBlocked 
                                        ? 'bg-rose-50/40' 
                                        : slot.isOccupied 
                                          ? 'bg-blue-50/30' 
                                          : 'hover:bg-emerald-50/20'
                                    }`}
                                  >
                                    <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                                      <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-[11px]">
                                        {slot.citaNo ? `Cita #${slot.citaNo}` : `#${sIdx + 1}`}
                                      </span>
                                      <span className="block text-[9px] text-slate-400 font-normal mt-0.5">
                                        Fila {slot.rowIndex}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-bold text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                        <span className="text-slate-900">{slot.timeSlot || "09:00 AM"}</span>
                                      </div>
                                      {slot.duration && (
                                        <span className="text-[10px] text-slate-500 font-normal ml-5">
                                          {slot.duration}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2.5">
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                                        isDama 
                                          ? "bg-purple-100 text-purple-800 border border-purple-200" 
                                          : "bg-blue-100 text-blue-800 border border-blue-200"
                                      }`}>
                                        <User className="w-3 h-3" />
                                        {slot.therapistGender || "Dama"}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-bold text-slate-850">
                                      {fullName ? (
                                        <span className="text-slate-900 uppercase">{fullName}</span>
                                      ) : (
                                        <span className="text-slate-400 font-normal italic">Sin participante</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                                      {slot.titularEmail ? (
                                        <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                          {slot.titularEmail}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300 font-normal">—</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      {slot.isBlocked ? (
                                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 font-black rounded-full text-[10px] inline-flex items-center gap-1">
                                          🚫 Bloqueado
                                        </span>
                                      ) : slot.isOccupied ? (
                                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-200 font-black rounded-full text-[10px] inline-flex items-center gap-1">
                                          👤 Ocupado
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 font-black rounded-full text-[10px] inline-flex items-center gap-1">
                                          ✓ Disponible
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Actions Footer */}
                    <div className="pt-2 flex justify-between items-center flex-wrap gap-2 shrink-0 border-t border-slate-150">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => loadSlotsForActivityTab(selectedActivityForSlots, currentTabName)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Refrescar pestaña
                        </button>
                        {selectedActivityForSlots.googleSheetsUrl && (
                          <a
                            href={selectedActivityForSlots.googleSheetsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir Google Sheets
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedActivityForSlots(null)}
                        className="px-6 py-2.5 bg-slate-850 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ACTIVITY CRUD MODAL FORM */}
            {showActivityForm && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in duration-150 max-h-[95vh] overflow-y-auto">
                  <div className="border-b border-slate-150 pb-4 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {editingActivity ? "Editar Actividad Especial" : "Crear Nueva Actividad Especial"}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Configura las reglas, horarios y sincronización con Google Sheets.</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowActivityForm(false);
                        setEditingActivity(null);
                        setFormSheetTestResult(null);
                      }}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveActivity} className="space-y-4 text-xs">
                    {/* 1. Activity Type & Status Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-extrabold">1) Tipo de Actividad:</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                          {(['SPA', 'PICKLEBALL', 'BINGO', 'MOVIE_NIGHTS', 'GOLF', 'BUCEO', 'OTRO'] as const).map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setActivityFormState({ ...activityFormState, activityType: t, category: t.toLowerCase() as any })}
                              className={`py-2 px-1 rounded-xl border text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                                (activityFormState.activityType || 'SPA').toUpperCase() === t
                                   ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                   : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              {t === 'MOVIE_NIGHTS' ? 'MOVIE NIGHTS' : t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-slate-700 font-extrabold">Estado de Publicación:</label>
                        <button
                          type="button"
                          onClick={() => setActivityFormState({ ...activityFormState, isActive: activityFormState.isActive === false ? true : false })}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-between shadow-3xs ${
                            activityFormState.isActive !== false
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${activityFormState.isActive !== false ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                            <span>{activityFormState.isActive !== false ? "Activa (Visible en Registro)" : "No Activa (Oculta en Registro)"}</span>
                          </span>
                          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${activityFormState.isActive !== false ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"}`}>
                            {activityFormState.isActive !== false ? "ON" : "OFF"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Name */}
                    <div className="space-y-1">
                      <label className="block text-slate-700 font-bold">Nombre de la Actividad:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Spa & Masajes Relajantes, Torneo de Golf, Inmersión de Buceo..."
                        value={activityFormState.name || ""}
                        onChange={(e) => setActivityFormState({ ...activityFormState, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    {/* 3. Description */}
                    <div className="space-y-1">
                      <label className="block text-slate-700 font-bold">Descripción Breve:</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Describe la dinámica de la actividad, qué incluye y detalles importantes..."
                        value={activityFormState.description || ""}
                        onChange={(e) => setActivityFormState({ ...activityFormState, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
                      />
                    </div>

                    {/* 4. Google Sheets Link & Multi-Day Tabs with Interactive Test */}
                    {(() => {
                      const isFormGolf = (activityFormState.activityType || '').toUpperCase() === 'GOLF' || (activityFormState.category || '').toLowerCase() === 'golf' || (activityFormState.name || '').toLowerCase().includes('golf');
                      const isFormBingo = (activityFormState.activityType || '').toUpperCase() === 'BINGO' || (activityFormState.category || '').toLowerCase() === 'bingo' || (activityFormState.name || '').toLowerCase().includes('bingo');
                      const isFormMovieNights = (activityFormState.activityType || '').toUpperCase() === 'MOVIE_NIGHTS' || (activityFormState.category || '').toLowerCase() === 'movie_nights' || (activityFormState.name || '').toLowerCase().includes('movie');
                      const isFormPickle = (activityFormState.activityType || '').toUpperCase() === 'PICKLEBALL' || (activityFormState.category || '').toLowerCase() === 'pickleball' || (activityFormState.name || '').toLowerCase().includes('pickleball');
                      const isPickleOrBingo = isFormPickle || isFormBingo || isFormMovieNights;
                      const actLabel = isFormGolf ? 'Golf' : isFormMovieNights ? 'Movie Nights' : isFormBingo ? 'Bingo' : isFormPickle ? 'Pickleball' : 'SPA';

                      return (
                        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              Sincronización con Google Sheets ({actLabel} - Lectura & Escritura en Vivo)
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setShowAppsScriptModal(true)}
                                className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] rounded-lg transition border border-emerald-300 flex items-center gap-1.5 cursor-pointer"
                                title="Ver código Apps Script e instrucciones"
                              >
                                <Code className="w-3.5 h-3.5 text-emerald-700" />
                                {isFormGolf ? 'Obtener Script Golf' : isPickleOrBingo ? `Obtener Script ${actLabel}` : 'Obtener Script SPA (v8)'}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-slate-700 font-bold text-xs">Liga del archivo de Google Sheets (General):</label>
                            <input
                              type="url"
                              placeholder="https://docs.google.com/spreadsheets/d/1b3XRN2-3E0LJkb8mclMGqKX0Ld-5Kj5HLCsyeMPYRjo/edit?usp=sharing"
                              value={activityFormState.googleSheetsUrl || ""}
                              onChange={(e) => setActivityFormState({ ...activityFormState, googleSheetsUrl: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                            />
                            <span className="text-[10px] text-slate-500 block">
                              {isFormGolf
                                ? "* Golf: Registra lugares desde el renglón 9 en adelante (Col B: Nombre, Col C: Apellido, Col D: Email/Bloqueo, Col F: Bastones, Col G: Mano, Col H: Varilla)."
                                : isFormMovieNights
                                ? "* Movie Nights: Registra lugares de menores de edad desde el renglón 9 en adelante (Col B: Nombre menor, Col C: Apellido menor, Col D: MENOR, Col G: Email titular/Bloqueo)."
                                : isPickleOrBingo 
                                ? `* ${actLabel}: Registra lugares desde el renglón 9 en adelante (Col B: Nombre, Col C: Apellido, Col D: Titular/Acompañante, Col G: Email/Bloqueo).`
                                : "* SPA: Lee y registra citas desde el renglón 9 en adelante (Col B, C, D: Nombres, Col J/K: Horarios, Col M: Terapeuta, Col P: Email/Bloqueo)."}
                            </span>
                          </div>

                          {/* Webhook Configuration for Direct Live Writing */}
                          <div className="p-3 bg-white/80 border border-emerald-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <label className="block text-emerald-950 font-extrabold text-xs flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                URL del Webhook de Apps Script ({actLabel}):
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setShowAppsScriptModal(true)}
                                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                  title="Ver y copiar código Google Apps Script para pegar en el archivo de Google Sheets"
                                >
                                  <FileCode className="w-3 h-3" />
                                  {isFormGolf ? 'Código Script Golf' : isPickleOrBingo ? `Código Script ${actLabel}` : 'Código Script SPA (v8)'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleTestWebhookConnection}
                                  disabled={webhookTestLoading || !activityFormState.googleSheetsWebhookUrl}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <RefreshCw className={`w-3 h-3 ${webhookTestLoading ? 'animate-spin' : ''}`} />
                                  {webhookTestLoading ? "Probando..." : "Probar Escritura"}
                                </button>
                              </div>
                            </div>
                            <input
                              type="url"
                              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                              value={activityFormState.googleSheetsWebhookUrl || ""}
                              onChange={(e) => setActivityFormState({ ...activityFormState, googleSheetsWebhookUrl: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-emerald-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                            />
                            <span className="text-[10px] text-slate-600 block">
                              * El Webhook escribe en la pestaña correspondiente y libera los registros previos al reasignar o cambiar de fecha.
                            </span>

                            {/* Webhook Test Result */}
                            {webhookTestResult && (
                              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                                webhookTestResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                              }`}>
                                {webhookTestResult.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                                <span className="font-medium text-[11px]">{webhookTestResult.message}</span>
                              </div>
                            )}
                          </div>

                      {/* Multi-Day Configuration Section */}
                      <div className="p-3.5 bg-white rounded-xl border border-emerald-200/90 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              Días y Pestañas Asociadas de Google Sheets
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Configura los días en que estará activa la actividad y la pestaña que contiene los slots de cada día.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newDayIndex = (activityFormState.daysConfig?.length || 0) + 1;
                              const newDay = {
                                id: `day-${Date.now()}`,
                                date: `2026-05-${14 + newDayIndex}`,
                                label: `Día ${newDayIndex}`,
                                googleSheetsTab: `Hoja ${newDayIndex}`
                              };
                              setActivityFormState({
                                ...activityFormState,
                                daysConfig: [...(activityFormState.daysConfig || []), newDay]
                              });
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            + Agregar Día y Pestaña
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {(activityFormState.daysConfig || []).map((dItem, dIdx) => (
                            <div key={dItem.id || dIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                                  <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                                    {dIdx + 1}
                                  </span>
                                  {dItem.label || `Día ${dIdx + 1}`}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleTestSheetConnection(dItem.googleSheetsTab)}
                                    disabled={formSheetTestLoading || !activityFormState.googleSheetsUrl}
                                    className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-lg border border-emerald-300 transition flex items-center gap-1 cursor-pointer"
                                    title={`Probar lectura de la pestaña ${dItem.googleSheetsTab}`}
                                  >
                                    <RefreshCw className={`w-3 h-3 ${formSheetTestLoading ? 'animate-spin' : ''}`} />
                                    Probar Pestaña
                                  </button>
                                  {(activityFormState.daysConfig?.length || 0) > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActivityFormState({
                                          ...activityFormState,
                                          daysConfig: (activityFormState.daysConfig || []).filter((_, idx) => idx !== dIdx)
                                        });
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                      title="Eliminar este día"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <label className="block text-slate-600 font-bold text-[10px]">Fecha / Referencia:</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: 2026-05-15 o 15 de Mayo"
                                    value={dItem.date || ""}
                                    onChange={(e) => {
                                      const updated = [...(activityFormState.daysConfig || [])];
                                      updated[dIdx] = { ...updated[dIdx], date: e.target.value };
                                      setActivityFormState({ ...activityFormState, daysConfig: updated });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-slate-600 font-bold text-[10px]">Nombre del Día (Etiqueta):</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: Viernes 15 de Mayo"
                                    value={dItem.label || ""}
                                    onChange={(e) => {
                                      const updated = [...(activityFormState.daysConfig || [])];
                                      updated[dIdx] = { ...updated[dIdx], label: e.target.value };
                                      setActivityFormState({ ...activityFormState, daysConfig: updated });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-slate-600 font-bold text-[10px]">Pestaña en Google Sheets:</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: Viernes, SPA Viernes..."
                                    value={dItem.googleSheetsTab || ""}
                                    onChange={(e) => {
                                      const updated = [...(activityFormState.daysConfig || [])];
                                      updated[dIdx] = { ...updated[dIdx], googleSheetsTab: e.target.value };
                                      setActivityFormState({ ...activityFormState, daysConfig: updated });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:ring-1 focus:ring-emerald-500 font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Live Test Result Banner */}
                      {formSheetTestResult && (
                        <div className={`p-3 rounded-xl text-xs space-y-2 border ${
                          formSheetTestResult.success ? 'bg-white border-emerald-300 text-emerald-950' : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          {formSheetTestResult.success ? (
                            <>
                              <div className="flex items-center justify-between font-bold text-[11px]">
                                <span className="flex items-center gap-1.5 text-emerald-800">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  ¡Lectura Exitosa de Google Sheets!
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                                  {formSheetTestResult.availableCount} Cupos Disponibles
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-medium pt-1">
                                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                  <span className="text-slate-500 block">Total Leídos:</span>
                                  <strong className="text-slate-900">{formSheetTestResult.totalCount}</strong>
                                </div>
                                <div className="p-1.5 bg-rose-50 rounded-lg border border-rose-100">
                                  <span className="text-rose-600 block">Bloqueados / Ocupados (Col P):</span>
                                  <strong className="text-rose-700">{formSheetTestResult.blockedCount}</strong>
                                </div>
                                <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                  <span className="text-emerald-600 block">Disponibles (Cupo):</span>
                                  <strong className="text-emerald-700">{formSheetTestResult.availableCount}</strong>
                                </div>
                              </div>
                              {formSheetTestResult.sampleSlots.length > 0 && (
                                <div className="pt-1 text-[10px] text-slate-600">
                                  <strong>Muestra de Horarios: </strong>
                                  {formSheetTestResult.sampleSlots.map((s, idx) => (
                                    <span key={idx} className={`inline-block px-1.5 py-0.5 rounded mr-1 mb-1 font-mono ${s.isBlocked || s.isOccupied ? 'bg-rose-100 text-rose-800 line-through' : 'bg-slate-100 text-slate-800'}`}>
                                      {s.timeSlot} {s.isBlocked || s.isOccupied ? '(Ocupado/Bloqueado)' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2 font-medium">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>{formSheetTestResult.error || "No se pudo leer la hoja. Verifica la URL y permisos de acceso."}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                    {/* 5. Schedule & Capacity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-slate-700 font-bold">4) Día del Evento:</label>
                        <input
                          type="text"
                          placeholder="Ej. Día 1, Día 2, 15 Mayo..."
                          value={activityFormState.eventDay || ""}
                          onChange={(e) => setActivityFormState({ ...activityFormState, eventDay: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-700 font-bold">Rango de Horario:</label>
                        <input
                          type="text"
                          placeholder="Ej. 09:00 - 14:00"
                          value={activityFormState.timeRange || ""}
                          onChange={(e) => setActivityFormState({ ...activityFormState, timeRange: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-700 font-bold">6) Cupo Máximo:</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={1000}
                          value={activityFormState.capacity ?? 20}
                          onChange={(e) => setActivityFormState({ ...activityFormState, capacity: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* Rules */}
                    <div className="space-y-1">
                      <label className="block text-slate-700 font-bold">Reglas / Condiciones (Opcional):</label>
                      <input
                        type="text"
                        placeholder="Ej. Vestimenta cómoda, traje de baño, llegar 10 minutos antes..."
                        value={activityFormState.rules || ""}
                        onChange={(e) => setActivityFormState({ ...activityFormState, rules: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div className="flex justify-end pt-4 gap-2 border-t border-slate-150">
                      <button
                        type="button"
                        onClick={() => {
                          setShowActivityForm(false);
                          setEditingActivity(null);
                          setFormSheetTestResult(null);
                        }}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md cursor-pointer"
                      >
                        {editingActivity ? "Guardar Cambios" : "Crear Actividad"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* CUSTOM DELETE CONFIRMATION MODAL */}
            {activityToDelete && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-xl animate-in zoom-in duration-150">
                  <div className="flex items-center gap-3 text-rose-600">
                    <div className="p-2.5 bg-rose-50 rounded-xl">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        ¿Eliminar Actividad Especial?
                      </h3>
                      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                        Esta acción es irreversible
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-slate-600 font-medium">
                      Estás por eliminar la actividad especial: <strong className="text-slate-900">"{activityToDelete.name}"</strong>.
                    </p>
                    <p className="text-slate-500 leading-relaxed">
                      Esto cancelará de forma permanente la inscripción de <strong className="text-slate-900 font-semibold">{activityToDelete.registeredCount} invitado(s)</strong> registrados y vaciará la lista de espera de <strong className="text-slate-900 font-semibold">{activityToDelete.waitingList?.length || 0} persona(s)</strong>.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActivityToDelete(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteActivity}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition text-xs shadow-xs"
                    >
                      Sí, Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GOOGLE APPS SCRIPT CODE & DEPLOYMENT MODAL */}
            {showAppsScriptModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-5 shadow-2xl animate-in zoom-in duration-150 max-h-[90vh] flex flex-col">
                  {(() => {
                    const isFormGolf = (activityFormState.activityType || '').toUpperCase() === 'GOLF' || (activityFormState.category || '').toLowerCase() === 'golf' || (activityFormState.name || '').toLowerCase().includes('golf');
                    const isFormBingo = (activityFormState.activityType || '').toUpperCase() === 'BINGO' || (activityFormState.category || '').toLowerCase() === 'bingo' || (activityFormState.name || '').toLowerCase().includes('bingo');
                    const isFormMovieNights = (activityFormState.activityType || '').toUpperCase() === 'MOVIE_NIGHTS' || (activityFormState.category || '').toLowerCase() === 'movie_nights' || (activityFormState.name || '').toLowerCase().includes('movie');
                    const isFormPickle = (activityFormState.activityType || '').toUpperCase() === 'PICKLEBALL' || (activityFormState.category || '').toLowerCase() === 'pickleball' || (activityFormState.name || '').toLowerCase().includes('pickleball');
                    const isPickleOrBingo = isFormPickle || isFormBingo || isFormMovieNights;
                    const actLabel = isFormGolf ? 'Golf' : isFormMovieNights ? 'Movie Nights' : isFormBingo ? 'Bingo' : isFormPickle ? 'Pickleball' : 'SPA';
                    const scriptCode = generateGoogleAppsScriptCode(activityFormState.googleSheetsTab || "Viernes", isFormGolf ? 'GOLF' : isFormMovieNights ? 'MOVIE_NIGHTS' : isFormBingo ? 'BINGO' : isFormPickle ? 'PICKLEBALL' : (activityFormState.activityType || 'SPA'));

                    return (
                      <>
                        <div className="border-b border-slate-150 pb-4 flex justify-between items-center shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                              <FileCode className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                                {isFormGolf
                                  ? `Código Google Apps Script (Golf - Fila 9, Col B, C, D, F, G, H)`
                                  : isPickleOrBingo 
                                  ? `Código Google Apps Script (${actLabel} - Fila 9, Col B, C, D, G)` 
                                  : "Código Google Apps Script (SPA - Mayúsculas y Limpieza Multi-Día)"}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium">
                                Pega este código en el editor de Apps Script de tu Google Sheet para habilitar guardado y sincronización en vivo.
                              </p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setShowAppsScriptModal(false)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold p-1 rounded-lg hover:bg-slate-100"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                        </div>

                        {/* Step by step instructions */}
                        <div className="p-3.5 bg-purple-50/80 border border-purple-200/90 rounded-2xl text-xs space-y-2 text-purple-950 shrink-0">
                          <div className="font-extrabold text-purple-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            Pasos para implementar en tu Google Sheet ({actLabel}):
                          </div>
                          <ol className="list-decimal list-inside space-y-1 text-[11px] text-purple-900 font-medium">
                            <li>Abre tu Google Sheet y ve a <strong>Extensiones &gt; Apps Script</strong>.</li>
                            <li>Borra todo el contenido de <code>Código.gs</code> y pega el código que aparece abajo.</li>
                            <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong> (Deploy &gt; New deployment).</li>
                            <li>Selecciona tipo <strong>"Aplicación web" (Web App)</strong>.</li>
                            <li>En <strong>"Quién tiene acceso" (Who has access)</strong>, selecciona estrictamente <strong>"Cualquier usuario" (Anyone)</strong>.</li>
                            <li>Copia la <strong>URL de la aplicación web</strong> generada y pégala en el campo <em>"URL del Webhook de Apps Script"</em> arriba.</li>
                          </ol>
                        </div>

                        {/* Code snippet display */}
                        <div className="flex-1 overflow-hidden flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">
                              Código JavaScript para Apps Script ({actLabel}):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(scriptCode);
                                setCopiedScript(true);
                                setTimeout(() => setCopiedScript(false), 2500);
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                                copiedScript 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                              }`}
                            >
                              {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedScript ? "¡Copiado al portapapeles!" : "Copiar Código"}
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] leading-relaxed border border-slate-800">
                            <pre>{scriptCode}</pre>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-2 flex justify-end shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowAppsScriptModal(false)}
                            className="px-6 py-2.5 bg-slate-850 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Entendido / Cerrar
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB: COMMS ======================= */}
        {activeTab === "comms" && (
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Comunicación Oficial & Envío de Notificaciones Push</h3>
              <p className="text-xs text-slate-500 font-medium">Emite boletines informativos o alertas críticas instantáneas a la aplicación del invitado.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* EMIT FORM */}
              <form onSubmit={handleSendComms} className="bg-white p-5 rounded-xl border border-slate-100 lg:col-span-2 space-y-4 shadow-sm">
                <h4 className="font-bold text-sm text-slate-850 border-b border-slate-100 pb-2">Crear Nuevo Comunicado</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Tipo de Canal:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setCommForm({ ...commForm, type: "email" })}
                        className={`py-2 text-xs font-bold rounded border transition cursor-pointer ${
                          commForm.type === "email" 
                            ? "bg-blue-600 border-blue-500 text-white" 
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        Correo Electrónico
                      </button>
                      <button 
                        type="button"
                        onClick={() => setCommForm({ ...commForm, type: "push" })}
                        className={`py-2 text-xs font-bold rounded border transition cursor-pointer ${
                          commForm.type === "push" 
                            ? "bg-blue-600 border-blue-500 text-white" 
                            : "bg-slate-900 border-slate-800 text-slate-400"
                        }`}
                      >
                        Notificación Push (App)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Segmentar por Etapa de Registro:</label>
                    <select 
                      value={commForm.segmentStage}
                      onChange={e => setCommForm({ ...commForm, segmentStage: e.target.value === "all" ? "all" : Number(e.target.value) as (1 | 2) })}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-3 py-2 text-xs text-white"
                    >
                      <option value="all">Todas las Etapas (1 y 2)</option>
                      <option value="1">Sólo Etapa 1 (VIPS)</option>
                      <option value="2">Sólo Etapa 2 (General)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-300 mb-1">Asunto o Título del Aviso:</label>
                    <input 
                      type="text" 
                      placeholder={commForm.type === "push" ? "ej. ¡Cambio de itinerario!" : "ej. Instrucciones de acceso para la sesión del viernes"}
                      value={commForm.subject}
                      onChange={e => setCommForm({ ...commForm, subject: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-300 mb-1">Contenido del Mensaje:</label>
                    <textarea 
                      rows={5}
                      placeholder="Escribe aquí el cuerpo del correo o el texto breve que recibirá la app móvil..."
                      value={commForm.body}
                      onChange={e => setCommForm({ ...commForm, body: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-850 rounded p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" /> Emitir Comunicado Oficial
                  </button>
                </div>
              </form>

              {/* OUTBOX LOG */}
              <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-4 shadow-sm">
                <h4 className="font-bold text-sm text-slate-850 border-b border-slate-100 pb-2">Bitácora de Comunicados</h4>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {comms.map(msg => (
                    <div key={msg.id} className="p-3 bg-slate-50 rounded border border-slate-150 text-xs shadow-3xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          msg.type === "email" ? "bg-blue-50 text-blue-750 border-blue-150" : "bg-purple-50 text-purple-750 border-purple-150"
                        }`}>
                          {msg.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{formatDate(msg.sentAt)}</span>
                      </div>
                      <p className="font-bold text-slate-800">{msg.subject}</p>
                      <p className="text-slate-650 text-[11px] mt-1 line-clamp-2 font-medium">{msg.body}</p>
                      <div className="pt-2 border-t border-slate-150 mt-2 text-[10px] text-slate-500 flex justify-between font-bold">
                        <span>Segmento: Stage {msg.segment.stage || "Todas"}</span>
                        <span className="font-bold text-slate-600">Enviados: {msg.recipientCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: REPORTS ======================= */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Generación de Reportes Versionados</h3>
              <p className="text-xs text-slate-500 font-medium">Descarga informes con control de cambios, resaltando las modificaciones respecto a la última exportación.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-sm text-slate-850 flex items-center gap-2">
                    <FileSpreadsheet className="w-4.5 h-4.5 text-blue-600" />
                    Padrón de Invitados Consolidado
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Exporta lista completa de invitados con sus estatus de registro, acompañantes, agencias distribuidoras y roles de control.</p>
                </div>
                <button 
                  onClick={() => triggerVersionedDownload("Padron_Invitados_Completo")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" /> Generar Descarga v1.{reportVersion}
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-sm text-slate-850 flex items-center gap-2">
                    <Plane className="w-4.5 h-4.5 text-sky-600" />
                    Logística de Vuelos y Cambios
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Reporte de itinerarios y capturas de pasajes de abordaje de llegada y salida. Ideal para coordinación en aeropuertos.</p>
                </div>
                <button 
                  onClick={() => triggerVersionedDownload("Logistica_Vuelos_E_Itinerarios")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" /> Generar Descarga v1.{reportVersion}
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-sm text-slate-850 flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-rose-600" />
                    Alergias e Informes para Hotel
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Contiene requerimientos dietéticos, alergias severas y observaciones especiales formateadas para entrega directa al hotel.</p>
                </div>
                <button 
                  onClick={() => triggerVersionedDownload("Alergias_Y_Requerimientos_Hotel")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" /> Generar Descarga v1.{reportVersion}
                </button>
              </div>
            </div>

            {/* AUDIT LOG OF GENERATED DOWNLOADS */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-4 shadow-sm">
              <h4 className="font-bold text-sm text-slate-850 border-b border-slate-100 pb-2">Histórico de Exportaciones Descargadas</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50">
                      <th className="p-3">Identificador de Descarga</th>
                      <th className="p-3">Reporte Generado</th>
                      <th className="p-3">Versión de Datos</th>
                      <th className="p-3">Fecha y Hora</th>
                      <th className="p-3 text-right">Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downloadLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 italic">No se han realizado descargas operativas de reportes en esta sesión.</td>
                      </tr>
                    ) : (
                      downloadLogs.map(log => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-blue-600">{log.id}</td>
                          <td className="p-3 text-slate-850 font-bold">{log.reportName}</td>
                          <td className="p-3 text-slate-650 font-medium">{log.version}</td>
                          <td className="p-3 text-slate-500 font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">✓ Completado</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: AUDITS ======================= */}
        {activeTab === "audits" && (
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Trazabilidad Total & Bitácora de Auditoría</h3>
                <p className="text-xs text-slate-500 font-medium">Monitorea cada cambio de itinerario, transportes asignados, cancelaciones de invitados o configuraciones generales.</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-150 rounded-full text-xs font-mono font-bold">
                Trazabilidad Activa
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50">
                      <th className="p-4">Fecha y Hora</th>
                      <th className="p-4">Usuario Responsable</th>
                      <th className="p-4">Acción Realizada</th>
                      <th className="p-4">Detalles / Modificaciones</th>
                      <th className="p-4">Valor Anterior</th>
                      <th className="p-4">Valor Nuevo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-4 text-slate-550 font-medium whitespace-nowrap">{formatDate(log.timestamp)}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-850">{log.userId}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{log.userEmail}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            log.action.includes("Cancelación") ? "bg-rose-50 text-rose-700 border-rose-150" :
                            log.action.includes("Vuelo") || log.action.includes("Itinerario") ? "bg-sky-50 text-sky-700 border-sky-150" :
                            log.action.includes("Fuera de Plazo") ? "bg-amber-50 text-amber-700 border-amber-150 font-extrabold animate-pulse" :
                            "bg-slate-100 text-slate-700 border-slate-150"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-slate-650 font-medium max-w-xs truncate" title={log.details}>{log.details}</td>
                        <td className="p-4 text-slate-450 font-mono text-[10px] truncate max-w-[120px]" title={log.prevValue || "—"}>
                          {log.prevValue || "—"}
                        </td>
                        <td className="p-4 text-blue-600 font-mono text-[10px] font-bold truncate max-w-[120px]" title={log.newValue || "—"}>
                          {log.newValue || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeAlertDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl border border-slate-150 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${
                  activeAlertDetail.type === 'error' ? 'text-rose-600 animate-pulse' :
                  activeAlertDetail.type === 'warning' ? 'text-amber-500' :
                  activeAlertDetail.type === 'info' ? 'text-blue-500' : 'text-emerald-500'
                }`} />
                {activeAlertDetail.title}
              </h4>
              <button 
                onClick={() => setActiveAlertDetail(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <p className="text-slate-550 leading-relaxed font-medium">{activeAlertDetail.description}</p>
              
              <div className="space-y-1.5 pt-2">
                <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">Registros y Afectados ({activeAlertDetail.items.length}):</p>
                {activeAlertDetail.items.length === 0 ? (
                  <p className="text-slate-400 italic py-4">No se encontraron registros activos para esta alerta en este momento.</p>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-150 max-h-[40vh] overflow-y-auto font-mono text-[11px] text-slate-700">
                    {activeAlertDetail.items.map((item, idx) => (
                      <div key={idx} className="p-3 leading-relaxed hover:bg-slate-100/40">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setActiveAlertDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedActivityForGuests && (() => {
        const act = selectedActivityForGuests;
        const actType = (act.activityType || (act.category ? act.category.toUpperCase() : "OTRO"));
        const isSpa = actType === "SPA" || act.category === "spa";

        // Build comprehensive flat list of all registered participants (titulars & companions)
        interface ParticipantEntry {
          key: string;
          guestId: string;
          guest: Guest;
          personId: string;
          participantName: string;
          participantType: "Titular" | "Acompañante" | "Menor";
          titularName: string;
          distributor: string;
          email: string;
          phone: string;
          role: string;
          dayId?: string;
          dayLabel?: string;
          dayDate?: string;
          sheetTab?: string;
          slotInfo: {
            slotTime?: string;
            therapistGender?: string;
            citaNo?: string;
            rowIndex?: number;
          } | null;
          activityName: string;
        }

        const registeredParticipants: ParticipantEntry[] = [];

        guests.filter(g => g.status !== GuestStatus.CANCELLED).forEach(g => {
          const guestReservations = (g.activityReservations || []).filter(r => r.activityId === act.id);
          const addedPersonIds = new Set<string>();

          if (guestReservations.length > 0) {
            guestReservations.forEach(r => {
              const isTitular = r.personId === "titular" || r.personType === "titular";
              const comp = !isTitular && g.companions ? g.companions.find(c => c.id === r.personId) : null;
              
              let pName = r.personName || (isTitular ? g.name : (comp?.name || "Acompañante"));
              if (r.paternalName || r.maternalName) {
                pName = `${r.personName || ""} ${r.paternalName || ""} ${r.maternalName || ""}`.trim();
              }
              if (!pName && isTitular) pName = g.name;

              addedPersonIds.add(r.personId);

              const dayLabel = r.dayLabel || (r.dayId === "day-1" ? "Viernes" : r.dayId === "day-2" ? "Sábado" : r.sheetTab || act.eventDay || "Día 1");

              registeredParticipants.push({
                key: `${g.id}-${r.personId}-${r.rowIndex || Math.random()}`,
                guestId: g.id,
                guest: g,
                personId: r.personId,
                participantName: pName || g.name,
                participantType: isTitular ? "Titular" : (comp?.relationship?.includes("Menor") ? "Menor" : "Acompañante"),
                titularName: g.name,
                distributor: g.distributor || g.distribuidora || "—",
                email: r.titularEmail || g.email || "—",
                phone: g.phone || g.celularTitular || "—",
                role: g.role || "Guest",
                dayId: r.dayId,
                dayLabel: dayLabel,
                dayDate: r.dayDate,
                sheetTab: r.sheetTab || act.googleSheetsTab || "Viernes",
                slotInfo: {
                  slotTime: r.slotTime,
                  therapistGender: r.therapistGender,
                  citaNo: r.citaNo,
                  rowIndex: r.rowIndex
                },
                activityName: act.name
              });
            });
          }

          // Fallback / standard activities (non-SPA): Titular
          if (!isSpa && !addedPersonIds.has("titular") && g.selectedActivities && g.selectedActivities.includes(act.id)) {
            registeredParticipants.push({
              key: `${g.id}-titular`,
              guestId: g.id,
              guest: g,
              personId: "titular",
              participantName: g.name,
              participantType: "Titular",
              titularName: g.name,
              distributor: g.distributor || g.distribuidora || "—",
              email: g.email || "—",
              phone: g.phone || g.celularTitular || "—",
              role: g.role || "Guest",
              dayLabel: act.eventDay || "Día 1",
              sheetTab: act.googleSheetsTab || "Hoja 1",
              slotInfo: null,
              activityName: act.name
            });
          }

          // Fallback / standard activities (non-SPA): Companions
          if (!isSpa && g.companions && g.companions.length > 0) {
            g.companions.forEach(comp => {
              if (!addedPersonIds.has(comp.id) && comp.selectedActivities && comp.selectedActivities.includes(act.id)) {
                registeredParticipants.push({
                  key: `${g.id}-${comp.id}`,
                  guestId: g.id,
                  guest: g,
                  personId: comp.id,
                  participantName: comp.name || `${comp.firstName || ''} ${comp.lastName || ''}`.trim() || "Acompañante",
                  participantType: comp.relationship?.includes("Menor") ? "Menor" : "Acompañante",
                  titularName: g.name,
                  distributor: g.distributor || g.distribuidora || "—",
                  email: g.email || "—",
                  phone: g.phone || g.celularTitular || "—",
                  role: g.role || "Guest",
                  dayLabel: act.eventDay || "Día 1",
                  sheetTab: act.googleSheetsTab || "Hoja 1",
                  slotInfo: null,
                  activityName: act.name
                });
              }
            });
          }
        });

        // Compute available day filters for the modal
        const dayOptionsMap = new Map<string, { id: string; label: string; count: number }>();
        
        // 1. Add days/tabs from real activity configuration (act.daysConfig)
        if (act.daysConfig && act.daysConfig.length > 0) {
          act.daysConfig.forEach(d => {
            const key = d.sheetTab || d.date || d.id;
            const label = d.sheetTab || d.date || `Pestaña ${d.id}`;
            dayOptionsMap.set(key, { id: key, label, count: 0 });
          });
        } else if (act.googleSheetsTab) {
          dayOptionsMap.set(act.googleSheetsTab, { id: act.googleSheetsTab, label: act.googleSheetsTab, count: 0 });
        }
        
        // 2. Tally from registered participants and include any extra tabs
        registeredParticipants.forEach(p => {
          let matchedKey: string | null = null;
          for (const [key, opt] of dayOptionsMap.entries()) {
            if (
              (p.sheetTab && p.sheetTab.toLowerCase() === opt.label.toLowerCase()) ||
              (p.dayLabel && p.dayLabel.toLowerCase() === opt.label.toLowerCase()) ||
              (p.dayId && p.dayId === key) ||
              (p.dayDate && p.dayDate === key) ||
              (p.sheetTab && opt.label.toLowerCase().includes(p.sheetTab.toLowerCase())) ||
              (p.dayLabel && opt.label.toLowerCase().includes(p.dayLabel.toLowerCase()))
            ) {
              matchedKey = key;
              break;
            }
          }

          if (matchedKey) {
            const item = dayOptionsMap.get(matchedKey)!;
            item.count += 1;
          } else {
            const dKey = p.sheetTab || p.dayLabel || p.dayId || "Día General";
            const dLabel = p.dayLabel || p.sheetTab || dKey;
            const existing = dayOptionsMap.get(dKey);
            if (existing) {
              existing.count += 1;
            } else {
              dayOptionsMap.set(dKey, { id: dKey, label: dLabel, count: 1 });
            }
          }
        });

        const dayOptions = Array.from(dayOptionsMap.values());

        const waiting = guests.filter(g => g.status !== GuestStatus.CANCELLED && act.waitingList && act.waitingList.includes(g.id))
          .sort((a, b) => {
            const indexA = act.waitingList.indexOf(a.id);
            const indexB = act.waitingList.indexOf(b.id);
            return indexA - indexB;
          });

        const filteredRegistered = registeredParticipants
          .filter(p => {
            const s = (activityGuestsSearchQuery || "").toLowerCase();
            const matchesSearch = !s || 
                   p.participantName.toLowerCase().includes(s) ||
                   p.titularName.toLowerCase().includes(s) ||
                   p.distributor.toLowerCase().includes(s) ||
                   p.email.toLowerCase().includes(s) ||
                   p.phone.includes(s) ||
                   p.guestId.toLowerCase().includes(s) ||
                   (p.dayLabel && p.dayLabel.toLowerCase().includes(s)) ||
                   (p.sheetTab && p.sheetTab.toLowerCase().includes(s)) ||
                   (p.slotInfo?.slotTime && p.slotInfo.slotTime.toLowerCase().includes(s)) ||
                   (p.slotInfo?.therapistGender && p.slotInfo.therapistGender.toLowerCase().includes(s));

            const matchesDay = activityGuestsDayFilter === "all" || (() => {
              const opt = dayOptionsMap.get(activityGuestsDayFilter);
              const targetLabel = opt ? opt.label.toLowerCase() : activityGuestsDayFilter.toLowerCase();
              return (
                p.dayId === activityGuestsDayFilter ||
                (p.sheetTab && p.sheetTab.toLowerCase() === targetLabel) ||
                (p.dayLabel && p.dayLabel.toLowerCase() === targetLabel) ||
                (p.sheetTab && targetLabel.includes(p.sheetTab.toLowerCase())) ||
                (p.dayLabel && targetLabel.includes(p.dayLabel.toLowerCase()))
              );
            })();

            return matchesSearch && matchesDay;
          })
          .sort((a, b) => {
            // Ordenar por Día/Pestaña
            const tabA = (a.sheetTab || a.dayLabel || a.dayDate || "").toLowerCase();
            const tabB = (b.sheetTab || b.dayLabel || b.dayDate || "").toLowerCase();
            if (tabA !== tabB) {
              return tabA.localeCompare(tabB, "es", { numeric: true });
            }
            // Secundario por horario si existe
            const timeA = a.slotInfo?.slotTime || "";
            const timeB = b.slotInfo?.slotTime || "";
            if (timeA !== timeB) {
              return timeA.localeCompare(timeB);
            }
            return a.participantName.localeCompare(b.participantName, "es");
          });

        const filteredWaiting = waiting.filter(g => {
          const s = (activityGuestsSearchQuery || "").toLowerCase();
          return g.name.toLowerCase().includes(s) || g.distributor.toLowerCase().includes(s) || g.email.toLowerCase().includes(s) || (g.phone || "").includes(s);
        });

        const handleCopyEmails = () => {
          const emailList = Array.from(new Set(filteredRegistered.map(p => p.email).filter(e => e && e !== "—")));
          if (emailList.length === 0) {
            alert("No hay correos disponibles para copiar.");
            return;
          }
          navigator.clipboard.writeText(emailList.join(", "));
          alert(`Copiados los correos de ${emailList.length} personas inscritas.`);
        };

        const handleExportParticipantsExcel = async () => {
          const workbook = new ExcelJS.Workbook();
          workbook.creator = "ADISTEM 2026 - Control de Actividades";
          workbook.created = new Date();

          const cleanSheetName = (act.name || "Actividad").replace(/[/\\?%*:|"<>]/g, "_").substring(0, 25);
          const worksheet = workbook.addWorksheet(cleanSheetName, {
            views: [{ state: "frozen", ySplit: 2 }]
          });

          // Title Banner
          worksheet.mergeCells(isSpa ? "A1:J1" : "A1:I1");
          const titleCell = worksheet.getCell("A1");
          titleCell.value = `LISTADO DE PARTICIPANTES INSCRITOS — ${act.name.toUpperCase()}`;
          titleCell.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FF1B4332" } };
          titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2F0D9" } };
          titleCell.alignment = { vertical: "middle", horizontal: "center" };
          worksheet.getRow(1).height = 32;

          const headers = isSpa ? [
            "#",
            "Participante",
            "Tipo",
            "Titular Carnet",
            "Distribuidora / Grupo",
            "Día / Fecha",
            "Horario / Turno",
            "Terapeuta",
            "Email",
            "Teléfono / Celular"
          ] : [
            "#",
            "Participante",
            "Tipo",
            "Titular Carnet",
            "Distribuidora / Grupo",
            "Día / Fecha",
            "Horario / Turno",
            "Email",
            "Teléfono / Celular"
          ];

          const headerRow = worksheet.addRow(headers);
          headerRow.height = 26;
          headerRow.eachCell(cell => {
            cell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF1B4332" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC8E6C9" } };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
            cell.border = {
              top: { style: "thin", color: { argb: "FFA5D6A7" } },
              bottom: { style: "medium", color: { argb: "FF66BB6A" } },
              left: { style: "thin", color: { argb: "FFA5D6A7" } },
              right: { style: "thin", color: { argb: "FFA5D6A7" } }
            };
          });

          filteredRegistered.forEach((p, idx) => {
            const rowData = isSpa ? [
              idx + 1,
              p.participantName,
              p.participantType,
              p.titularName,
              p.distributor,
              p.dayLabel || act.eventDay || "Día 1",
              p.slotInfo?.slotTime || act.timeRange || act.dateTime || "Horario Regular",
              p.slotInfo?.therapistGender ? `Terapeuta: ${p.slotInfo.therapistGender}` : "—",
              p.email,
              p.phone
            ] : [
              idx + 1,
              p.participantName,
              p.participantType,
              p.titularName,
              p.distributor,
              p.dayLabel || act.eventDay || "Día 1",
              p.slotInfo?.slotTime || act.timeRange || act.dateTime || "Horario Regular",
              p.email,
              p.phone
            ];

            const row = worksheet.addRow(rowData);
            row.height = 20;
            row.eachCell((cell, colNum) => {
              cell.font = { name: "Calibri", size: 9.5 };
              cell.border = {
                top: { style: "thin", color: { argb: "FFE0E0E0" } },
                bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
                left: { style: "thin", color: { argb: "FFE0E0E0" } },
                right: { style: "thin", color: { argb: "FFE0E0E0" } }
              };
              if (colNum === 1 || colNum === 3 || colNum === 6 || colNum === 7) {
                cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
              } else {
                cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
              }
            });
          });

          // Totals row
          const totRow = worksheet.addRow([
            "TOTAL",
            `Total Participantes: ${filteredRegistered.length}`,
            "",
            "",
            "",
            "",
            "",
            "",
            ...(isSpa ? ["", ""] : [""])
          ]);
          totRow.height = 24;
          totRow.eachCell(cell => {
            cell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF0F5132" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
            cell.border = {
              top: { style: "medium", color: { argb: "FF2E7D32" } },
              bottom: { style: "double", color: { argb: "FF1B5E20" } }
            };
          });

          worksheet.columns = isSpa ? [
            { width: 6 },
            { width: 28 },
            { width: 14 },
            { width: 26 },
            { width: 24 },
            { width: 14 },
            { width: 18 },
            { width: 20 },
            { width: 24 },
            { width: 16 }
          ] : [
            { width: 6 },
            { width: 28 },
            { width: 14 },
            { width: 26 },
            { width: 24 },
            { width: 14 },
            { width: 20 },
            { width: 24 },
            { width: 16 }
          ];

          const buffer = await workbook.xlsx.writeBuffer();
          const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Inscritos_${act.name.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        };

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-2xl border border-slate-150 max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase border ${
                      isSpa ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-blue-50 text-blue-750 border-blue-150"
                    }`}>
                      {act.category || act.activityType}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-brand-primary" />
                    Participantes Inscritos: {act.name}
                  </h4>
                  <p className="text-[11px] text-slate-550 font-medium">
                    Día: <strong className="text-slate-800">{act.eventDay || "Día 1"}</strong> • Horario General: <strong className="text-slate-800">{act.timeRange || act.dateTime || "Por definir"}</strong> • Ocupación: <strong className="text-blue-700">{registeredParticipants.length}</strong> / {act.capacity} personas
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedActivityForGuests(null);
                    setActivityGuestsSearchQuery("");
                    setActivityGuestsDayFilter("all");
                  }}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col min-h-0">

                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por participante, correo, distribuidor..."
                      value={activityGuestsSearchQuery}
                      onChange={e => setActivityGuestsSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-brand-primary rounded-xl text-xs outline-hidden transition font-medium text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <button
                      onClick={handleCopyEmails}
                      disabled={filteredRegistered.length === 0}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs rounded-xl transition shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Copiar Correos ({filteredRegistered.length})
                    </button>
                    <button
                      onClick={handleExportParticipantsExcel}
                      disabled={filteredRegistered.length === 0}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Descargar lista de inscritos en Excel (.xlsx) con formato profesional"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar a Excel (.xlsx)
                    </button>
                  </div>
                </div>

                {/* Lists Segment */}
                <div className="flex-1 min-h-0 space-y-6 overflow-y-auto pr-1">
                  
                  {/* Registered Guests Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Personas Inscritas ({filteredRegistered.length})
                      </h5>
                      <span className="text-[10px] font-bold text-slate-400">
                        {isSpa ? "Participantes con Horario y Turno asignado" : "Participantes Titulares y Acompañantes"}
                      </span>
                    </div>

                    {filteredRegistered.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs text-slate-400 italic">No hay participantes inscritos {activityGuestsSearchQuery ? "que coincidan con la búsqueda." : "aún en esta actividad."}</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50/80">
                                <th className="p-3 text-center">#</th>
                                <th className="p-3">Participante</th>
                                <th className="p-3">Distribuidor / Grupo</th>
                                <th className="p-3">Día</th>
                                <th className="p-3">{isSpa ? "Horario & Terapeuta" : "Horario"}</th>
                                <th className="p-3">Contacto</th>
                                <th className="p-3 text-center">Estatus</th>
                                <th className="p-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredRegistered.map((p, idx) => (
                                <tr key={p.key} className="hover:bg-slate-50/60 transition">
                                  <td className="p-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-extrabold text-slate-900">{p.participantName}</p>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                        p.participantType === "Titular"
                                          ? "bg-blue-100 text-blue-800"
                                          : p.participantType === "Acompañante"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-amber-100 text-amber-800"
                                      }`}>
                                        {p.participantType}
                                      </span>
                                    </div>
                                    {p.participantType !== "Titular" && (
                                      <p className="text-[10px] text-slate-400 font-medium">Titular: {p.titularName}</p>
                                    )}
                                  </td>
                                  <td className="p-3 font-medium text-slate-700">{p.distributor}</td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-150 rounded text-[10px] font-bold inline-block">
                                      {p.dayLabel || act.eventDay || "Día 1"}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    {isSpa ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-purple-900 font-bold">
                                          <Clock className="w-3 h-3 text-purple-600 shrink-0" />
                                          <span>{p.slotInfo?.slotTime || act.timeRange || "11:30 AM"}</span>
                                        </div>
                                        {p.slotInfo?.therapistGender && (
                                          <span className="inline-block px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold text-[10px]">
                                            Terapeuta: {p.slotInfo.therapistGender}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-0.5 text-slate-700 font-bold">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                                          <span>{p.slotInfo?.slotTime || act.timeRange || act.dateTime || "Horario Oficial"}</span>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-[10px]">
                                    <p className="font-mono text-slate-700">{p.email}</p>
                                    <p className="text-slate-400">{p.phone}</p>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Confirmado
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedActivityForGuests(null);
                                        setActivityGuestsSearchQuery("");
                                        setActivityGuestsDayFilter("all");
                                        setSelectedGuest(normalizeGuestForModal(p.guest));
                                        setIsEditingGuest(false);
                                        setActiveTab("guests");
                                      }}
                                      className="text-brand-primary hover:underline font-bold text-[10px] cursor-pointer"
                                    >
                                      Ver Expediente
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Waiting List Section */}
                  <div>
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Lista de Espera ({waiting.length})
                    </h5>

                    {filteredWaiting.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs text-slate-400 italic">No hay invitados en lista de espera {activityGuestsSearchQuery ? "que coincidan con la búsqueda." : "para esta actividad."}</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-3xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50/50">
                                <th className="p-3 text-center">#</th>
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Distribuidor / Grupo</th>
                                <th className="p-3">E-mail</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredWaiting.map((g, index) => (
                                <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                                  <td className="p-3 text-center font-mono font-bold text-amber-700">#{index + 1}</td>
                                  <td className="p-3 font-bold text-slate-850 uppercase">{(g.name || "").toUpperCase()}</td>
                                  <td className="p-3 font-medium text-slate-650">{g.distributor || g.distribuidora || "—"}</td>
                                  <td className="p-3 text-slate-500">{g.email}</td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-medium border border-slate-200/50">
                                      {g.role}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedActivityForGuests(null);
                                        setActivityGuestsSearchQuery("");
                                        setSelectedGuest(normalizeGuestForModal(g));
                                        setIsEditingGuest(false);
                                        setActiveTab("guests");
                                      }}
                                      className="text-brand-primary hover:underline font-bold text-[10px]"
                                    >
                                      Ver Expediente
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-550 font-medium">
                  Total de cupos ocupados: <strong className="text-slate-800">{registeredParticipants.length}</strong> de <strong className="text-slate-800">{act.capacity}</strong>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleExportParticipantsExcel}
                    disabled={filteredRegistered.length === 0}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar a Excel (.xlsx)
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedActivityForGuests(null);
                      setActivityGuestsSearchQuery("");
                      setActivityGuestsDayFilter("all");
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL LISTADO Y CONTROL DE GRUPOS - ETAPA 1 */}
      {showStage1GroupsModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[200] p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/90 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 tracking-tight">
                      Registro Grupos — Grupos y Titulares
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                      1 Titular por Grupo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Listado de los {totalStage1Groups} grupos convocados. Monitorea disponibilidad y expedientes de titulares registrados.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportStage1GroupsXLS(false)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  title="Exportar listado a Excel (XLSX) con grupo, titular, acompañantes y actividades"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar a XLS</span>
                  <span className="sm:hidden">XLS</span>
                </button>
                <button
                  onClick={() => setShowStage1GroupsModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Cerrar modal"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar & Filters */}
            <div className="p-4 sm:px-6 bg-slate-50/50 border-b border-slate-200/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* 3 Filters */}
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={() => setStage1GroupFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      stage1GroupFilter === "all"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Todos los grupos</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      stage1GroupFilter === "all" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                    }`}>
                      {totalStage1Groups}
                    </span>
                  </button>

                  <button
                    onClick={() => setStage1GroupFilter("registered")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      stage1GroupFilter === "registered"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Grupos con registro</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      stage1GroupFilter === "registered" ? "bg-emerald-700 text-emerald-100" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {titularRegistradosCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setStage1GroupFilter("unregistered")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      stage1GroupFilter === "unregistered"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Grupos sin registro</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      stage1GroupFilter === "unregistered" ? "bg-amber-700 text-amber-100" : "bg-amber-100 text-amber-800"
                    }`}>
                      {titularesFaltantesCount}
                    </span>
                  </button>
                </div>

                {/* Search Bar & Export Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={stage1GroupSearch}
                      onChange={(e) => setStage1GroupSearch(e.target.value)}
                      placeholder="Buscar grupo, titular, acompañante..."
                      className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    />
                    {stage1GroupSearch && (
                      <button
                        onClick={() => setStage1GroupSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleExportStage1GroupsXLS(false)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md shrink-0"
                    title="Exportar a XLS con información de grupos, comitivas y actividades"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exportar XLS ({filteredStage1Groups.length})</span>
                    <span className="sm:hidden">XLS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-slate-50/30">
              {filteredStage1Groups.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No se encontraron grupos</p>
                  <p className="text-xs text-slate-400">
                    No hay grupos que coincidan con el filtro o término de búsqueda seleccionado.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Grupo Empresarial</th>
                          <th className="py-3 px-4">Distribuidoras Asociadas</th>
                          <th className="py-3 px-4">Estado Etapa 1</th>
                          <th className="py-3 px-4">Titular Asignado</th>
                          <th className="py-3 px-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStage1Groups.map((groupName, idx) => {
                          const titular = stage1GroupRegistrations[groupName.toUpperCase()];
                          const agencies = GROUPS_DATA[groupName] || [];
                          const isRegistered = !!titular;

                          return (
                            <tr key={groupName} className={`transition-colors hover:bg-slate-50/70 ${isRegistered ? "bg-emerald-50/15" : ""}`}>
                              {/* # */}
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-[11px]">
                                {idx + 1}
                              </td>

                              {/* Grupo */}
                              <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${isRegistered ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                  <span>{groupName}</span>
                                </div>
                              </td>

                              {/* Distribuidoras */}
                              <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                                <span className="text-[11px] font-medium line-clamp-1" title={agencies.join(", ")}>
                                  {agencies.length > 0 ? agencies.slice(0, 2).join(", ") + (agencies.length > 2 ? ` (+${agencies.length - 2} más)` : "") : "—"}
                                </span>
                              </td>

                              {/* Estado Etapa 1 */}
                              <td className="py-3.5 px-4">
                                {isRegistered ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    Con Registro
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    Sin Registro (Disponible)
                                  </span>
                                )}
                              </td>

                              {/* Titular, Acompañantes y Actividades */}
                              <td className="py-3.5 px-4">
                                {isRegistered && titular ? (
                                  <div className="space-y-1">
                                    <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase">
                                      <User className="w-3 h-3 text-blue-600" />
                                      {(`${titular.nombreTitular || ""} ${titular.apellidosTitular || ""}`.trim() || titular.name || "").toUpperCase()}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {titular.email || titular.correoTitular || "Sin correo"} {titular.phone ? `• ${titular.phone}` : ""}
                                    </p>
                                    {titular.distribuidora && (
                                      <p className="text-[10px] text-slate-400 font-medium">
                                        Razón Social: {titular.distribuidora}
                                      </p>
                                    )}

                                    {/* Badges de Acompañante y Actividades */}
                                    {(() => {
                                      const directAcomp = `${titular.nombreAcompanante || ""} ${titular.apellidosAcompanante || ""}`.trim();
                                      const firstComp = titular.companions && titular.companions.length > 0 ? (titular.companions[0].name || `${titular.companions[0].firstName || ""} ${titular.companions[0].lastName || ""}`.trim()) : "";
                                      const acompDisp = directAcomp || firstComp;

                                      const minorsList = titular.minors || [];
                                      let actualMinorsCount = Math.round(titular.numMenores || 0);
                                      let actualAdultsCount = 0;
                                      if (minorsList.length > 0) {
                                        actualMinorsCount = minorsList.filter((m: any) => m.tipo === "minor" || (m.tipo !== "adult" && m.age !== undefined && m.age < 12)).length;
                                        actualAdultsCount = minorsList.filter((m: any) => m.tipo === "adult" || (m.age !== undefined && m.age >= 12)).length;
                                      }

                                      const actCount = (titular.activityReservations?.length || titular.selectedActivities?.length || 0);

                                      return (
                                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                                          {acompDisp ? (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                                              Acomp: {acompDisp}
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-medium">
                                              Sin acomp. adulto
                                            </span>
                                          )}
                                          {actualMinorsCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                              {actualMinorsCount} menor{actualMinorsCount > 1 ? "es" : ""}
                                            </span>
                                          )}
                                          {actualAdultsCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                                              {actualAdultsCount} adic. adulto{actualAdultsCount > 1 ? "s" : ""}
                                            </span>
                                          )}
                                          {actCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                                              {actCount} act.
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">
                                    Disponible para registro
                                  </span>
                                )}
                              </td>

                              {/* Acciones */}
                              <td className="py-3.5 px-4 text-right">
                                {isRegistered && titular ? (
                                  <button
                                    onClick={() => {
                                      setShowStage1GroupsModal(false);
                                      handleSelectGuestForEditing(titular);
                                    }}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-lg text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <span>Ver Expediente</span>
                                    <span>→</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    Habilitado en registro
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Mostrando <strong className="text-slate-800">{filteredStage1Groups.length}</strong> de <strong className="text-slate-800">{totalStage1Groups}</strong> grupos ({titularRegistradosCount} con titular, {titularesFaltantesCount} disponibles)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportStage1GroupsXLS(false)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  title="Descargar archivo Excel con grupos, titulares, acompañantes y actividades"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Descargar XLS ({filteredStage1Groups.length})</span>
                </button>
                <button
                  onClick={() => setShowStage1GroupsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTADO DE HUÉSPEDES SIN VUELOS REGISTRADOS */}
      {showGuestsWithoutFlightsModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[200] p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/90 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 tracking-tight">
                      Registros sin vuelo registrado
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                      {guestsWithoutFlights.length} registros
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Huéspedes con vuelos de llegada y/o regreso pendientes de capturar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportGuestsWithoutFlightsXLS}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  title="Exportar listado completo de pendientes de vuelo a Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar a XLS</span>
                  <span className="sm:hidden">XLS</span>
                </button>
                <button
                  onClick={() => setShowGuestsWithoutFlightsModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Cerrar modal"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search filter bar */}
            <div className="p-4 sm:px-6 bg-slate-50/50 border-b border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={guestsWithoutFlightsSearch}
                  onChange={e => setGuestsWithoutFlightsSearch(e.target.value)}
                  placeholder="Buscar por titular, correo o distribuidora..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
                {guestsWithoutFlightsSearch && (
                  <button
                    onClick={() => setGuestsWithoutFlightsSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs font-bold text-slate-600">
                Mostrando <span className="text-blue-700 font-extrabold">{filteredGuestsWithoutFlights.length}</span> registros de {guestsWithoutFlights.length}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredGuestsWithoutFlights.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-sm text-slate-600">No se encontraron registros</p>
                  <p className="text-xs mt-1">Todos los huéspedes con filtros aplicados tienen sus vuelos completos o no coinciden con la búsqueda.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10 backdrop-blur-xs select-none">
                      <th className="py-3 px-4">Titular</th>
                      <th className="py-3 px-4">Grupo / Distribuidora</th>
                      <th className="py-3 px-4 text-center">Personas en Carnet</th>
                      <th className="py-3 px-4">Correo</th>
                      <th className="py-3 px-4">Llegada</th>
                      <th className="py-3 px-4">Regreso</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGuestsWithoutFlights.map((g) => {
                      const hasArrival = g.vueloLlegadaNoVuelo || g.flightArrival?.flightNumber || g.vueloLlegadaFecha || g.flightArrival?.arrivalDateTime;
                      const hasDeparture = g.vueloRegresoNoVuelo || g.flightDeparture?.flightNumber || g.vueloRegresoFecha || g.flightDeparture?.departureDateTime;

                      const totalPeople = getGuestTotalPeopleCount(g);

                      return (
                        <tr key={g.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-4 font-extrabold text-slate-900 uppercase">
                            {g.name || `${g.nombreTitular || ""} ${g.apellidosTitular || ""}`.trim() || "Sin nombre"}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700 uppercase">
                            <span className="text-slate-400 block text-[9px]">{g.grupo || "Stellantis"}</span>
                            {g.distribuidora || g.distributor || "Sin asignar"}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                            {totalPeople}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {g.email}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              hasArrival 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {hasArrival ? "Registrado" : "Pendiente"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              hasDeparture 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {hasDeparture ? "Registrado" : "Pendiente"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                handleSelectGuestForEditing(g);
                                setEditGuestSubTab("vuelos");
                                setShowGuestsWithoutFlightsModal(false);
                              }}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-extrabold rounded-lg cursor-pointer transition shadow-2xs"
                            >
                              Ver Ficha / Capturar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                ADISTEM 2026 • Control de Logística de Vuelos
              </span>
              <button
                onClick={() => setShowGuestsWithoutFlightsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LISTADO DE HUÉSPEDES POR CATEGORÍA */}
      {selectedCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[200] p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/90 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900 tracking-tight">
                      Listado de Huéspedes : {selectedCategoryModal === "Menores" ? "Menores Registrados" : `Categoría ${selectedCategoryModal}`}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                      {selectedCategoryModal === "Menores" ? categoryModalMinorsList.length : categoryModalGuests.length} {selectedCategoryModal === "Menores" ? "menores" : (categoryModalGuests.length === 1 ? "registro" : "registros")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Huéspedes clasificados como {selectedCategoryModal}. Consulta expedientes o descarga la relación en Excel.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCategoryXLS(selectedCategoryModal)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  title="Exportar listado de esta categoría a Excel (XLSX)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar a XLS</span>
                  <span className="sm:hidden">XLS</span>
                </button>
                <button
                  onClick={() => setSelectedCategoryModal(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Cerrar modal"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search filter bar */}
            <div className="p-4 sm:px-6 bg-slate-50/50 border-b border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categoryModalSearch}
                  onChange={e => setCategoryModalSearch(e.target.value)}
                  placeholder={selectedCategoryModal === "Menores" ? "Buscar por menor, titular, empresa o habitación..." : "Buscar por titular, puesto, grupo, empresa o email..."}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
                {categoryModalSearch && (
                  <button
                    onClick={() => setCategoryModalSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-xs font-bold text-slate-600">
                Mostrando <span className="text-blue-700 font-extrabold">{selectedCategoryModal === "Menores" ? categoryModalMinorsList.length : categoryModalGuests.length}</span> registros
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {selectedCategoryModal === "Menores" ? (
                categoryModalMinorsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm text-slate-600">No se encontraron menores</p>
                    <p className="text-xs mt-1">No hay menores registrados con los filtros actuales.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10 backdrop-blur-xs select-none">
                        <th 
                          onClick={() => {
                            if (minorsSortField === "nombre") {
                              setMinorsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                            } else {
                              setMinorsSortField("nombre");
                              setMinorsSortDir('asc');
                            }
                          }}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        >
                          Nombre del Menor {minorsSortField === "nombre" ? (minorsSortDir === 'asc' ? "▲" : "▼") : ""}
                        </th>
                        <th 
                          onClick={() => {
                            if (minorsSortField === "edad") {
                              setMinorsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                            } else {
                              setMinorsSortField("edad");
                              setMinorsSortDir('asc');
                            }
                          }}
                          className="py-3 px-4 text-center cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        >
                          Edad {minorsSortField === "edad" ? (minorsSortDir === 'asc' ? "▲" : "▼") : ""}
                        </th>
                        <th className="py-3 px-4">Titular Responsable</th>
                        <th className="py-3 px-4">Razón Social / Empresa</th>
                        <th 
                          onClick={() => {
                            if (minorsSortField === "enrolledSat") {
                              setMinorsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                            } else {
                              setMinorsSortField("enrolledSat");
                              setMinorsSortDir('asc');
                            }
                          }}
                          className="py-3 px-4 text-center cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        >
                          Movie Nights Sábado {minorsSortField === "enrolledSat" ? (minorsSortDir === 'asc' ? "▲" : "▼") : ""}
                        </th>
                        <th 
                          onClick={() => {
                            if (minorsSortField === "enrolledSun") {
                              setMinorsSortDir(d => d === 'asc' ? 'desc' : 'asc');
                            } else {
                              setMinorsSortField("enrolledSun");
                              setMinorsSortDir('asc');
                            }
                          }}
                          className="py-3 px-4 text-center cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        >
                          Movie Nights Domingo {minorsSortField === "enrolledSun" ? (minorsSortDir === 'asc' ? "▲" : "▼") : ""}
                        </th>
                        <th className="py-3 px-4 text-center">No. Habitación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryModalMinorsList.map((m) => {
                        return (
                          <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-3 px-4 font-extrabold text-slate-900 uppercase">
                              {m.minorName}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700">
                              {Number(m.minorAge) === 0 ? "0-11 meses" : `${m.minorAge} ${Number(m.minorAge) === 1 ? "año" : "años"}`}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800 uppercase">
                              {m.titularName}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-500 uppercase">
                              {m.razonSocial}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                m.enrolledSat 
                                  ? 'bg-pink-50 text-pink-700 border border-pink-200 animate-pulse'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {m.enrolledSat ? "SÍ INSC." : "NO"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                m.enrolledSun 
                                  ? 'bg-pink-50 text-pink-700 border border-pink-200 animate-pulse'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {m.enrolledSun ? "SÍ INSC." : "NO"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-600 font-mono">
                              {m.roomNumber}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                categoryModalGuests.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm text-slate-600">No se encontraron registros</p>
                    <p className="text-xs mt-1">No hay huéspedes registrados en la categoría "{selectedCategoryModal}" con los filtros actuales.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10 backdrop-blur-xs">
                        <th className="py-3 px-4">Titular</th>
                        <th className="py-3 px-4">Puesto / Cargo</th>
                        <th className="py-3 px-4">Grupo / Distribuidora</th>
                        <th className="py-3 px-4">Alojamiento</th>
                        <th className="py-3 px-4">Acompañantes</th>
                        <th className="py-3 px-4 text-center">Estatus</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryModalGuests.map((g) => {
                        const titularName = (g.nombreTitular && g.apellidosTitular 
                          ? `${g.nombreTitular} ${g.apellidosTitular}`
                          : (g.name || "Sin nombre")).trim().toUpperCase();
                        
                        let guestPuesto = g.puesto || g.role || (g as any).cargo || "Dueño";
                        if (guestPuesto === "Otros") guestPuesto = "Externos";

                        const comp = g.companions?.[0];
                        const compName = g.nombreAcompanante || (comp ? `${comp.nombres || comp.name || ""} ${comp.apellidos || ""}`.trim() : "");
                        const menoresCount = Math.round(g.numMenores || (g.minors ? g.minors.length : 0));

                        return (
                          <tr key={g.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-extrabold text-slate-900 uppercase">{titularName}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{g.email || g.correoTitular || "Sin correo"}</p>
                              {g.phone && <p className="text-[10px] text-slate-400">{g.phone}</p>}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold text-[10px] uppercase">
                                {guestPuesto}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800">{g.grupo || "Stellantis"}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{g.distribuidora || g.distributor || "—"}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800">{g.hotelAlojamiento || "Hotel Sede"}</p>
                              <p className="text-[11px] text-slate-500">
                                {g.carnetTipoHabitacion || "Sencilla"} • {g.configuracionHabitacion || "King"}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-slate-700 font-medium">
                                {compName ? `Adulto: ${compName.toUpperCase()}` : "Sin acompañante"}
                              </p>
                              {menoresCount > 0 && (
                                <p className="text-slate-500 text-[10px] font-semibold">{menoresCount} menor(es)</p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                g.status === GuestStatus.CONFIRMED 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : g.status === GuestStatus.CANCELLED
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {g.status === GuestStatus.CONFIRMED ? 'Confirmado' : g.status === GuestStatus.CANCELLED ? 'Cancelado' : 'Completado'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  handleSelectGuestForEditing(g);
                                  setSelectedCategoryModal(null);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                              >
                                Ver expediente &rarr;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Mostrando <strong className="text-slate-800">{selectedCategoryModal === "Menores" ? categoryModalMinorsList.length : categoryModalGuests.length}</strong> de <strong className="text-slate-800">{selectedCategoryModal === "Menores" ? totalMinorsCount : (categoryGuestsMap[selectedCategoryModal]?.length || 0)}</strong> {selectedCategoryModal === "Menores" ? "menores" : "huéspedes"} en {selectedCategoryModal}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCategoryXLS(selectedCategoryModal)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer hover:shadow-md"
                  title="Descargar archivo Excel con huéspedes de esta categoría"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Descargar XLS ({selectedCategoryModal === "Menores" ? categoryModalMinorsList.length : categoryModalGuests.length})</span>
                </button>
                <button
                  onClick={() => setSelectedCategoryModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE CONTROL DE VUELOS (LLEGADAS Y SALIDAS) */}
      {(selectedFlightModal || selectedArrivalDay) && (() => {
        const modalData = selectedFlightModal 
          ? {
              type: selectedFlightModal.type,
              dayGroup: selectedFlightModal.dayGroup,
              searchQuery: flightModalSearchQuery,
              setSearchQuery: setFlightModalSearchQuery,
              onClose: () => {
                setSelectedFlightModal(null);
                setFlightModalSearchQuery("");
              }
            }
          : {
              type: 'arrival' as const,
              dayGroup: selectedArrivalDay!,
              searchQuery: arrivalSearchQuery,
              setSearchQuery: setArrivalSearchQuery,
              onClose: () => {
                setSelectedArrivalDay(null);
                setArrivalSearchQuery("");
              }
            };

        const isArrival = modalData.type === 'arrival';
        const dayGroup = modalData.dayGroup;
        const q = modalData.searchQuery.toLowerCase().trim();

        const filteredRecords = dayGroup.records.filter((r: any) => {
          if (!q) return true;
          return (
            r.titularName?.toLowerCase().includes(q) ||
            r.airline?.toLowerCase().includes(q) ||
            r.flightNumber?.toLowerCase().includes(q) ||
            r.grupo?.toLowerCase().includes(q) ||
            r.distribuidora?.toLowerCase().includes(q) ||
            r.puesto?.toLowerCase().includes(q) ||
            r.hotel?.toLowerCase().includes(q) ||
            r.phone?.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            (r.companionNames && r.companionNames.some((c: string) => c.toLowerCase().includes(q)))
          );
        });

        const filteredPax = filteredRecords.reduce((s: number, r: any) => s + r.pax, 0);

        // Styling helpers by flight type
        const themeBorder = isArrival ? 'border-emerald-200/90' : 'border-blue-200/90';
        const themeHeaderBg = isArrival 
          ? 'from-emerald-50 via-emerald-50/70 to-teal-50/40 border-emerald-100' 
          : 'from-blue-50 via-blue-50/70 to-indigo-50/40 border-blue-100';
        const themeIconBg = isArrival ? 'bg-emerald-600' : 'bg-blue-600';
        const themeBadgeBg = isArrival 
          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
          : 'bg-blue-100 text-blue-800 border-blue-200';
        const themeTitleColor = isArrival ? 'text-emerald-950' : 'text-blue-950';
        const themeSubColor = isArrival ? 'text-emerald-700' : 'text-blue-700';
        const themeSubBarBg = isArrival ? 'border-emerald-100/70 bg-emerald-50/30' : 'border-blue-100/70 bg-blue-50/30';
        const themeInputFocus = isArrival 
          ? 'border-emerald-200 focus:ring-emerald-500' 
          : 'border-blue-200 focus:ring-blue-500';
        const themeBtnExport = isArrival
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white';
        const themeTableHead = isArrival 
          ? 'bg-emerald-100/70 text-emerald-950 border-emerald-200' 
          : 'bg-blue-100/70 text-blue-950 border-blue-200';
        const themeHoverRow = isArrival ? 'hover:bg-emerald-50/30' : 'hover:bg-blue-50/30';
        const themeTimeBadge = isArrival 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
          : 'bg-blue-50 border-blue-200 text-blue-800';
        const themeFooterBg = isArrival ? 'border-emerald-100 bg-emerald-50/40' : 'border-blue-100 bg-blue-50/40';
        const themeFooterText = isArrival ? 'text-emerald-900' : 'text-blue-900';
        const themeFooterHighlight = isArrival ? 'text-emerald-950' : 'text-blue-950';

        return (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-[220] p-3 sm:p-5 animate-in fade-in duration-150">
            <div className={`bg-white rounded-2xl border ${themeBorder} max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150`}>
              
              {/* Header con estilo diferenciado para Llegadas / Salidas */}
              <div className={`px-6 py-4 border-b bg-gradient-to-r ${themeHeaderBg} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${themeIconBg} text-white flex items-center justify-center shadow-sm`}>
                    <Plane className={`w-5 h-5 text-white ${!isArrival ? 'rotate-90' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${themeBadgeBg}`}>
                        {dayGroup.shortLabel}
                      </span>
                      <span className={`text-xs ${themeSubColor} font-bold`}>
                        {isArrival ? 'Recepción y Llegada de Vuelos' : 'Salidas y Retorno de Vuelos'}
                      </span>
                    </div>
                    <h3 className={`text-base sm:text-lg font-black ${themeTitleColor}`}>
                      {isArrival ? 'Llegadas' : 'Salidas'}: {dayGroup.dateLabel}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={modalData.onClose}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer shadow-3xs flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>Cerrar</span>
                </button>
              </div>

              {/* Sub-toolbar con buscador y KPIs de franja horaria */}
              <div className={`px-6 py-3 border-b ${themeSubBarBg} flex flex-col md:flex-row items-center justify-between gap-3 text-xs`}>
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className={`w-4 h-4 ${isArrival ? 'text-emerald-600' : 'text-blue-600'} absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`} />
                  <input
                    type="text"
                    value={modalData.searchQuery}
                    onChange={(e) => modalData.setSearchQuery(e.target.value)}
                    placeholder="Buscar titular, acompañante, vuelo, hotel..."
                    className={`w-full pl-9 pr-8 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 font-medium text-slate-800 ${themeInputFocus}`}
                  />
                  {modalData.searchQuery && (
                    <button
                      onClick={() => modalData.setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Métricas rápidas por horario */}
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg font-semibold text-[11px] shadow-3xs">
                    🌅 Mañana: <strong>{dayGroup.timeBuckets.morning}</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg font-semibold text-[11px] shadow-3xs">
                    ☀️ Tarde: <strong>{dayGroup.timeBuckets.afternoon}</strong>
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg font-semibold text-[11px] shadow-3xs">
                    🌙 Noche: <strong>{dayGroup.timeBuckets.evening}</strong>
                  </span>
                  <button
                    onClick={() => handleExportDayFlightsExcel(dayGroup, isArrival ? 'arrival' : 'departure')}
                    disabled={dayGroup.records.length === 0}
                    className={`px-3 py-1.5 font-bold rounded-lg text-xs transition shadow-3xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${themeBtnExport}`}
                    title="Exportar archivo Excel estructurado"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar a Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-white">
                {filteredRecords.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Plane className={`w-10 h-10 ${isArrival ? 'text-emerald-200' : 'text-blue-200'} mx-auto`} />
                    <p className="font-semibold text-sm text-slate-600">No se encontraron registros de vuelo con los filtros actuales.</p>
                    <p className="text-xs text-slate-400">Intenta con otro término de búsqueda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`${themeTableHead} font-bold border-b text-[11px]`}>
                          <th className="py-3 px-3 text-center w-10">#</th>
                          <th className="py-3 px-4">Invitado / Pasajero</th>
                          <th className="py-3 px-3">Puesto / Rol</th>
                          <th className="py-3 px-4">Distribuidora / Grupo</th>
                          <th className="py-3 px-4">Acompañantes / Familia</th>
                          <th className="py-3 px-3">Aerolínea & Vuelo</th>
                          <th className="py-3 px-3 text-center">{isArrival ? 'Hora Llegada' : 'Hora Salida'}</th>
                          <th className="py-3 px-3 text-center">No. Pax</th>
                          <th className="py-3 px-4">Hotel Sede</th>
                          <th className="py-3 px-4">Contacto</th>
                          <th className="py-3 px-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecords.map((r: any, idx: number) => (
                          <tr key={r.id} className={`${themeHoverRow} transition`}>
                            <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400 font-bold">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 uppercase">{r.titularName}</p>
                              {r.isCompanionFlight && (
                                <span className="inline-block mt-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                                  Vuelo independiente de acompañante
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px] uppercase">
                                {r.puesto}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800">{r.grupo}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{r.distribuidora}</p>
                            </td>
                            <td className="py-3 px-4">
                              {r.companionNames && r.companionNames.length > 0 ? (
                                <p className="text-slate-700 font-medium">{r.companionNames.join(", ")}</p>
                              ) : (
                                <span className="text-slate-400 italic">Solo</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <p className={`font-bold ${isArrival ? 'text-emerald-800' : 'text-blue-800'}`}>{r.airline || "—"}</p>
                              <p className="font-mono text-[11px] text-slate-600 font-semibold">{r.flightNumber || "Pendiente"}</p>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {r.flightTime ? (
                                <span className={`inline-block px-2 py-0.5 border font-mono font-bold rounded ${themeTimeBadge}`}>
                                  {r.flightTime}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic font-mono text-[11px]">Por definir</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 text-slate-800">
                                {r.pax}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-700">{r.hotel}</span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-[11px] text-slate-600 font-mono">{r.email || "—"}</p>
                              <p className="text-[10px] text-slate-500">{r.phone || "—"}</p>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {r.guestId && (() => {
                                const targetGuest = guests.find(g => g.id === r.guestId);
                                if (!targetGuest) return null;
                                return (
                                  <button
                                    onClick={() => {
                                      modalData.onClose();
                                      handleSelectGuestForEditing(targetGuest);
                                    }}
                                    className={`px-2.5 py-1 text-[11px] font-bold border rounded-lg transition cursor-pointer ${
                                      isArrival 
                                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' 
                                        : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                                    }`}
                                  >
                                    Expediente →
                                  </button>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer con totales y botones requeridos */}
              <div className={`px-6 py-4 border-t ${themeFooterBg} flex flex-col sm:flex-row items-center justify-between gap-3`}>
                <div className={`text-xs ${themeFooterText} font-medium`}>
                  Mostrando <strong className={themeFooterHighlight}>{filteredRecords.length}</strong> registros de <strong className={themeFooterHighlight}>{dayGroup.records.length}</strong> (Total: <strong className={themeFooterHighlight}>{filteredPax} pax</strong>)
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleExportDayFlightsExcel(dayGroup, isArrival ? 'arrival' : 'departure')}
                    disabled={dayGroup.records.length === 0}
                    className={`px-4 py-2 font-bold rounded-lg text-xs transition shadow-3xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${themeBtnExport}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar a Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={modalData.onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR REGISTRO DE INVITADO */}
      {guestToDelete && (() => {
        const titularFullName = guestToDelete.nombreTitular && guestToDelete.apellidosTitular 
          ? `${guestToDelete.nombreTitular} ${guestToDelete.apellidosTitular}` 
          : guestToDelete.name;
        const grupoName = guestToDelete.grupo || guestToDelete.distribuidora || guestToDelete.distributor || "Sin Grupo Asignado";
        const emailVal = guestToDelete.correoTitular || guestToDelete.email || "No registrado";
        const phoneVal = guestToDelete.celularTitular || guestToDelete.phone || "No registrado";
        const hotelVal = guestToDelete.hotelAlojamiento || "No asignado";
        const roomVal = guestToDelete.carnetTipoHabitacion || guestToDelete.configuracionHabitacion || "Habitación Estándar";
        const totalCalculado = getGuestTotalCost(guestToDelete);
        const companionsList = guestToDelete.companions || [];
        const hasMinors = (guestToDelete.numMenores && guestToDelete.numMenores > 0) || (guestToDelete.minors && guestToDelete.minors.length > 0);

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[250] p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-rose-200/90 max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-rose-950 tracking-tight">
                      Confirmar Eliminación de Registro
                    </h3>
                    <p className="text-xs text-rose-700 font-medium mt-0.5">
                      Revisa minuciosamente los datos antes de proceder. La eliminación es permanente.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isDeletingGuest && setGuestToDelete(null)}
                  disabled={isDeletingGuest}
                  className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-400 hover:text-rose-700 transition cursor-pointer disabled:opacity-50"
                  title="Cerrar modal"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">

                {/* Error Banner if any */}
                {deleteError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Error al eliminar</p>
                      <p className="text-[11px] mt-0.5">{deleteError}</p>
                    </div>
                  </div>
                )}

                {/* Card 1: Datos del Titular */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" /> Datos del Titular
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                      {guestToDelete.role || "Titular"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Nombre Completo</p>
                      <p className="font-black text-slate-900 text-sm mt-0.5">{titularFullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Correo Electrónico</p>
                      <p className="font-semibold text-slate-800 font-mono text-[11px] mt-0.5">{emailVal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Teléfono Celular</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{phoneVal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Acompañantes Registrados</p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {companionsList.length > 0 
                          ? `${companionsList.length} adulto(s): ${companionsList.map(c => c.name).join(", ")}` 
                          : (guestToDelete.nombreAcompanante ? `Adulto: ${guestToDelete.nombreAcompanante}` : "Sin acompañante adulto")}
                        {hasMinors && ` • ${guestToDelete.numMenores || guestToDelete.minors?.length || 0} menor(es)`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Datos del Grupo Empresarial */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-brand-primary" /> Grupo Empresarial & Distribuidora
                    </span>
                    <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary font-bold rounded text-[10px]">
                      Etapa {guestToDelete.stage || 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Grupo Corporativo</p>
                      <p className="font-black text-slate-900 text-xs mt-0.5">{grupoName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Distribuidora / Agencia</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{guestToDelete.distribuidora || guestToDelete.distributor || "No especificada"}</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-blue-900 text-[11px] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Liberación de Cupo:</strong> Al eliminar este registro, el cupo de la Etapa 1 asignado al grupo <strong>{grupoName}</strong> se liberará automáticamente para permitir un nuevo registro.
                    </span>
                  </div>
                </div>

                {/* Card 3: Datos del Registro a Borrar */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" /> Registro y Alojamiento
                    </span>
                    <span className="font-mono font-black text-xs px-2 py-0.5 bg-purple-100 text-purple-900 rounded border border-purple-200">
                      ID: {guestToDelete.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Estatus Actual</p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        guestToDelete.status === GuestStatus.CONFIRMED ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        guestToDelete.status === GuestStatus.COMPLETE ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        guestToDelete.status === GuestStatus.CANCELLED ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {guestToDelete.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Hotel & Habitación</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{hotelVal} • {roomVal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Total Registrado</p>
                      <p className="font-black text-slate-900 text-sm font-mono mt-0.5">${totalCalculado.toLocaleString()} MXN</p>
                    </div>
                  </div>
                </div>

                {/* Card 4: Reservaciones en Actividades a Liberar en Google Sheets */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Reservaciones y Lugares a Liberar en Google Sheets
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      {guestToDelete.activityReservations?.length || 0} lugares
                    </span>
                  </div>

                  {guestToDelete.activityReservations && guestToDelete.activityReservations.length > 0 ? (
                    <div className="space-y-2 text-[11px]">
                      <p className="text-slate-500 font-medium leading-relaxed">
                        Se enviará una orden de liberación automática a los Webhooks de Google Sheets para los siguientes espacios ocupados:
                      </p>
                      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                        {guestToDelete.activityReservations.map((res, rIdx) => {
                          const act = activities.find(a => a.id === res.activityId);
                          return (
                            <div key={res.personId + "-" + rIdx} className="py-2 flex items-start justify-between gap-4">
                              <div>
                                <span className="font-bold text-slate-800 uppercase">{res.personName}</span>
                                <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded ml-1.5 font-bold uppercase tracking-wide">
                                  {res.personType === "titular" ? "Titular" : res.personType === "companion" ? "Acomp. Adulto" : "Menor"}
                                </span>
                                <p className="text-slate-500 text-[10px] mt-0.5 font-medium">
                                  Actividad: <strong className="text-slate-700">{res.activityName || act?.name || "Sin Nombre"}</strong>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-extrabold text-slate-700">{res.sheetTab || "Hoja 1"} • Renglón {res.rowIndex || "Pendiente"}</p>
                                {res.slotTime && <p className="text-slate-400 text-[10px] font-medium mt-0.5">{res.slotTime}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-emerald-800 text-[11px] font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Este invitado no tiene actividades o lugares apartados. No se realizarán llamadas a Google Sheets.</span>
                    </div>
                  )}
                </div>

                {/* Advertencia Crítica */}
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-xs uppercase tracking-wide text-rose-800">
                      Acción Definitiva e Irreversible
                    </p>
                    <p className="text-[11px] leading-relaxed text-rose-700">
                      Al confirmar, se liberarán los espacios en Google Sheets, se eliminará el registro de la base de datos de <strong>Firestore</strong>, se removerán sus credenciales de acceso al portal y se generará una entrada con firma del administrador en la <strong>Bitácora General de Auditoría</strong>.
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => !isDeletingGuest && setGuestToDelete(null)}
                  disabled={isDeletingGuest}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDeleteGuest}
                  disabled={isDeletingGuest}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-60"
                >
                  {isDeletingGuest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Eliminando de Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmar y Eliminar Registro</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* TOAST DE ÉXITO AL ELIMINAR */}
      {deleteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-[300] bg-emerald-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="text-xs">
            <p className="font-black text-emerald-200 uppercase tracking-wide text-[10px]">Registro Eliminado con Éxito</p>
            <p className="font-medium text-emerald-50 mt-0.5">{deleteSuccessToast}</p>
          </div>
          <button 
            onClick={() => setDeleteSuccessToast(null)}
            className="ml-auto text-emerald-300 hover:text-white p-1 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
