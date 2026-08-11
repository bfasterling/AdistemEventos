import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Users, Calendar, Plane, FileText, AlertTriangle, Bus, Award, 
  MessageSquare, Settings, History, Download, Plus, Search, 
  Trash2, Edit3, Save, CheckCircle, XCircle, Sparkles, UploadCloud,
  FileSpreadsheet, UserCheck, ShieldAlert, Check, RefreshCw,
  Bed, Mail, Lock, LogIn, Shield, DollarSign, Key, CheckCircle2, PlusCircle,
  ShieldCheck, Filter, ArrowUpDown, Gift
} from "lucide-react";
import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig, PortalUser } from "../types";
import { DataStore } from "../dataStore";
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
  const [costSencilla, setCostSencilla] = useState<number>(0);
  const [costSencilloExtra, setCostSencilloExtra] = useState<number>(0);
  const [costDoble, setCostDoble] = useState<number>(0);
  const [costDobleExtra, setCostDobleExtra] = useState<number>(0);
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
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("todos");
  const [filterHotel, setFilterHotel] = useState<string>("todos");
  const [filterType, setFilterType] = useState<string>("todos");

  // Selected guest for detailed file view (expediente)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [editedGuestData, setEditedGuestData] = useState<Guest | null>(null);

  // Registrante state variables
  const [registrantEmail, setRegistrantEmail] = useState<string>("");
  const [registrantPassword, setRegistrantPassword] = useState<string>("");
  const [originalRegistrantEmail, setOriginalRegistrantEmail] = useState<string>("");

  const getHasChanges = () => {
    if (!selectedGuest || !editedGuestData) return false;
    
    // Check guest differences
    const guestChanged = JSON.stringify(selectedGuest) !== JSON.stringify(editedGuestData);
    
    // Check registrant account differences
    const dbUser = DataStore.getUsers().find(u => u.guestId === selectedGuest.id);
    const dbEmail = dbUser?.email || "";
    const dbPassword = dbUser?.password || "";
    
    const registrantChanged = (registrantEmail.trim() !== dbEmail) || (registrantPassword.trim() !== dbPassword);
    
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
  const [activityFormState, setActivityFormState] = useState<Omit<Activity, 'registeredCount' | 'waitingList'>>({
    id: "",
    name: "",
    description: "",
    dateTime: "",
    capacity: 20,
    rules: "",
    category: "otro"
  });

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

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityFormState.name || !activityFormState.dateTime || !activityFormState.description) {
      alert("Por favor completa el nombre, fecha/hora y descripción de la actividad.");
      return;
    }

    const activityData: Activity = {
      id: editingActivity ? editingActivity.id : `act-${Date.now()}`,
      name: activityFormState.name,
      description: activityFormState.description,
      dateTime: activityFormState.dateTime,
      capacity: Number(activityFormState.capacity),
      category: activityFormState.category,
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
    onUpdate();
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
    setActivityFormState({
      id: act.id,
      name: act.name,
      description: act.description,
      dateTime: act.dateTime,
      capacity: act.capacity,
      category: act.category,
      rules: act.rules || ""
    });
    setShowActivityForm(true);
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
    if (!importText.trim()) {
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
        const id = parts[0].trim();
        const name = parts[1].trim();
        const email = parts[2].trim();
        const distributor = parts[3] ? parts[3].trim() : "Distribuidor Stellantis";
        const role = parts[4] ? parts[4].trim() : "Asociado";
        const stageVal = parts[5] && parts[5].trim() === "2" ? 2 : 1;

        if (id && name && email) {
          const duplicate = existingGuests.some(g => g.id === id || g.email.toLowerCase() === email.toLowerCase());
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
    if (!newGuestData.id.match(/^ADI-\d{4}$/)) {
      errors.id = "El código debe tener el formato ADI-XXXX (ej: ADI-1234)";
    }
    if (!newGuestData.name.trim()) {
      errors.name = "El nombre completo es requerido";
    }
    if (!newGuestData.email.includes("@")) {
      errors.email = "El correo electrónico no es válido";
    }
    if (!newGuestData.distributor.trim()) {
      errors.distributor = "El distribuidor/agencia es un campo obligatorio";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newG: Guest = {
      ...newGuestData,
      username: newGuestData.username.trim() || newGuestData.email.trim().toLowerCase(),
      password: newGuestData.password.trim() || newGuestData.id.trim().toUpperCase(),
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

  // Select guest and immediately enter edit mode
  const handleSelectGuestForEditing = (g: Guest) => {
    setSelectedGuest(g);
    try {
      setEditedGuestData(JSON.parse(JSON.stringify(g)));
    } catch (e) {
      setEditedGuestData({ ...g });
    }

    // Find matching portal user
    const u = DataStore.getUsers().find(user => user.guestId === g.id);
    if (u) {
      setRegistrantEmail(u.email);
      setRegistrantPassword(u.password || "");
      setOriginalRegistrantEmail(u.email);
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
    
    // Save Guest
    const res = DataStore.saveGuest(editedGuestData, editorRole, editorEmail, true);
    if (res.success) {
      // Save/Update Portal User (Registrante)
      if (registrantEmail.trim()) {
        const users = DataStore.getUsers();
        
        if (originalRegistrantEmail && originalRegistrantEmail.toLowerCase() !== registrantEmail.trim().toLowerCase()) {
          // Delete old user
          DataStore.deleteUser(originalRegistrantEmail);
          
          // Create new user
          const newUser: PortalUser = {
            id: registrantEmail.trim().toLowerCase(),
            email: registrantEmail.trim().toLowerCase(),
            password: registrantPassword.trim(),
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
              password: registrantPassword.trim()
            };
            DataStore.saveUser(updatedUser);
          }
        } else {
          // Create new user
          const newUser: PortalUser = {
            id: registrantEmail.trim().toLowerCase(),
            email: registrantEmail.trim().toLowerCase(),
            password: registrantPassword.trim(),
            role: "Invitado",
            guestId: editedGuestData.id
          };
          DataStore.addUser(newUser);
        }
      } else if (originalRegistrantEmail) {
        // If registrant email was cleared, delete old user
        DataStore.deleteUser(originalRegistrantEmail);
      }

      setSelectedGuest(editedGuestData);
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

    if (!hotelName.trim()) {
      alert("El nombre de la sede es obligatorio.");
      return;
    }

    const hotelData = {
      id: editingHotelId || `H-${Date.now()}`,
      name: hotelName.trim(),
      costSencilla: Number(costSencilla),
      costSencilloExtra: Number(costSencilloExtra),
      costDoble: Number(costDoble),
      costDobleExtra: Number(costDobleExtra)
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
    setCostSencilla(0);
    setCostSencilloExtra(0);
    setCostDoble(0);
    setCostDobleExtra(0);
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
    setCostSencilla(h.costSencilla);
    setCostSencilloExtra(h.costSencilloExtra);
    setCostDoble(h.costDoble);
    setCostDobleExtra(h.costDobleExtra);
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

  // Helpers for guest financial/hotel cost calculations
  const getGuestHotelCost = (g: any): number => {
    const hotels = DataStore.getHotels();
    const hotelSedeName = g.hotelAlojamiento || config?.hotelSede || "Sin asignar";
    const hotel = hotels.find((h: any) => h.name === hotelSedeName) || hotels[0];
    
    if (!hotel) return 0;

    let baseRate = hotel.costSencilla;
    const type = g.carnetTipoHabitacion || "Sencilla";
    if (type === "Sencillo Extra") baseRate = hotel.costSencilloExtra;
    else if (type === "Doble") baseRate = hotel.costDoble;
    else if (type === "Doble Extra") baseRate = hotel.costDobleExtra;

    const nightlyRate = baseRate / 3;
    const additionalNights = g.nochesAdicionales || 0;
    const rooms = g.numHabitaciones || 1;
    return (baseRate + additionalNights * nightlyRate) * rooms;
  };

  const getGuestTotalCost = (g: any): number => {
    const hotelCost = getGuestHotelCost(g);
    const customSum = (g.costosAdicionales || []).reduce((sum: number, c: any) => sum + c.monto, 0);
    return hotelCost + customSum;
  };

  const handleExportToExcel = () => {
    let totalTitulares = 0;
    let totalCompMujeres = 0;
    let totalCompHombres = 0;
    let totalMenores = 0;
    let totalHabSencilla = 0;
    let totalHabDoble = 0;
    let totalHabSencilloExtra = 0;
    let totalHabDobleExtra = 0;
    let totalHabitaciones = 0;
    let totalNochesAdicionales = 0;
    let totalHospedaje = 0;
    let totalCargosExtra = 0;
    let totalGeneral = 0;
    let totalRegaloTitular = 0;
    let totalRegaloMujer = 0;
    let totalRegaloHombre = 0;

    let totalCostoCarnet = 0;
    let totalCarnetExtra = 0;
    let totalMealPlanMenores = 0;
    let totalAdultosDiaAdicional = 0;
    let totalMenoresDiaAdicional = 0;
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

    const activitiesList = DataStore.getActivities();
    const hotelsList = DataStore.getHotels();

    const excelData = guests.map((g, index) => {
      totalTitulares++;
      const companion = g.companions && g.companions.length > 0 ? g.companions[0] : null;
      const hasCompanion = !!(companion || g.nombreAcompanante);
      const minorsCount = Math.round(g.numMenores || (g.minors ? g.minors.length : 0));
      totalMenores += minorsCount;

      const gAny = g as any;
      const compAny = companion as any;

      const compSexRaw = companion?.sex || gAny.sexoAcompanante || "";
      let compSex = "";
      let isFemaleComp = false;
      let isMaleComp = false;

      if (hasCompanion) {
        const compSexUpper = (compSexRaw || "").trim().toUpperCase();
        if (compSexUpper === "F" || compSexUpper === "MUJER" || compSexUpper === "FEMENINO") {
          compSex = "F";
          isFemaleComp = true;
          totalCompMujeres++;
        } else if (compSexUpper === "M" || compSexUpper === "HOMBRE" || compSexUpper === "MASCULINO") {
          compSex = "M";
          isMaleComp = true;
          totalCompHombres++;
        } else {
          compSex = "";
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

      const tipoHab = gAny.carnetTipoHabitacion || gAny.tipoHabitacion || "Sencilla";
      const habCount = Math.round(g.numHabitaciones || 1);
      totalHabitaciones += habCount;
      const extraNights = Math.round(g.nochesAdicionales || 0);
      totalNochesAdicionales += extraNights;

      if (tipoHab === "Sencilla") totalHabSencilla += habCount;
      else if (tipoHab === "Doble") totalHabDoble += habCount;
      else if (tipoHab === "Sencillo Extra") totalHabSencilloExtra += habCount;
      else if (tipoHab === "Doble Extra") totalHabDobleExtra += habCount;

      // Hotel calculation
      const hotelNameVal = gAny.hotel || gAny.hotelAlojamiento || "";
      const hotel = hotelNameVal ? hotelsList.find((h: any) => h.name === hotelNameVal) : null;

      let baseRoomRate = 0;
      if (hotel) {
        if (tipoHab === "Sencillo Extra") baseRoomRate = hotel.costSencilloExtra || 0;
        else if (tipoHab === "Doble") baseRoomRate = hotel.costDoble || 0;
        else if (tipoHab === "Doble Extra") baseRoomRate = hotel.costDobleExtra || 0;
        else baseRoomRate = hotel.costSencilla || 0;
      }

      const costoCarnetVal = gAny.costoCarnet !== undefined ? Number(gAny.costoCarnet) : Math.round(baseRoomRate * habCount);
      const nightlyRoomRate = baseRoomRate > 0 ? (baseRoomRate / 3) : 0;
      const carnetExtraVal = gAny.carnetExtra !== undefined ? Number(gAny.carnetExtra) : Math.round(extraNights * nightlyRoomRate * habCount);

      const costMealMenor = (hotel as any)?.costMealMenor || 1500;
      const costMealAdulto = (hotel as any)?.costMealAdulto || 2500;

      const mealPlanMenoresVal = gAny.mealPlanMenores !== undefined && typeof gAny.mealPlanMenores === "number"
        ? gAny.mealPlanMenores
        : Math.round(minorsCount * costMealMenor * 3);

      const numAdults = 1 + (hasCompanion ? 1 : 0);
      const adultosDiaAdicionalVal = gAny.adultosDiaAdicional !== undefined && typeof gAny.adultosDiaAdicional === "number"
        ? gAny.adultosDiaAdicional
        : Math.round(numAdults * extraNights * costMealAdulto);

      const menoresDiaAdicionalVal = gAny.menoresDiaAdicional !== undefined && typeof gAny.menoresDiaAdicional === "number"
        ? gAny.menoresDiaAdicional
        : Math.round(minorsCount * extraNights * costMealMenor);

      const costHosp = Math.round(getGuestHotelCost(g));
      const costExtra = Math.round((g.costosAdicionales || []).reduce((s: number, c: any) => s + c.monto, 0));
      const costTotal = Math.round(getGuestTotalCost(g));

      totalHospedaje += costHosp;
      totalCargosExtra += costExtra;
      totalGeneral += costTotal;

      totalCostoCarnet += costoCarnetVal;
      totalCarnetExtra += carnetExtraVal;
      totalMealPlanMenores += mealPlanMenoresVal;
      totalAdultosDiaAdicional += adultosDiaAdicionalVal;
      totalMenoresDiaAdicional += menoresDiaAdicionalVal;

      if (g.regaloTitularEntregado) totalRegaloTitular++;
      if (isFemaleComp && g.regaloAcompananteMujerEntregado) totalRegaloMujer++;
      if (isMaleComp && (g.regaloAcompananteHombreEntregado || g.regaloHombre)) totalRegaloHombre++;

      // VIP / Cena de Consejo / Junta de Consejo
      const isVip = g.tipoHuesped === 'VIP' || gAny.cenaConsejo === true || (g.grupo && g.grupo.toUpperCase().includes('VIP')) || g.puesto === 'VIP';
      const cenaConsejoVal = isVip ? (hasCompanion ? 2 : 1) : 0;
      const juntaConsejoVal = isVip ? 1 : 0;

      totalCenaConsejo += cenaConsejoVal;
      totalAsistentesJuntaConsejo += juntaConsejoVal;

      // Vuelos 1
      const arrDate = g.vueloLlegadaFecha || (g.flightArrival ? new Date(g.flightArrival.arrivalDateTime).toLocaleDateString("es-MX") : "");
      const arrAirline = g.vueloLlegadaAerolinea || g.flightArrival?.airline || "";
      const arrNo = g.vueloLlegadaNoVuelo || g.flightArrival?.flightNumber || "";
      const arrTime = g.vueloLlegadaHora || (g.flightArrival ? new Date(g.flightArrival.arrivalDateTime).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }) : "");
      const arrPax = g.vueloLlegadaPersonas || (hasCompanion && !g.vuelosSeparados ? 2 : 1);

      const depDate = g.vueloRegresoFecha || (g.flightDeparture ? new Date(g.flightDeparture.departureDateTime).toLocaleDateString("es-MX") : "");
      const depAirline = g.vueloRegresoAerolinea || g.flightDeparture?.airline || "";
      const depNo = g.vueloRegresoNoVuelo || g.flightDeparture?.flightNumber || "";
      const depTime = g.vueloRegresoHora || (g.flightDeparture ? new Date(g.flightDeparture.departureDateTime).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' }) : "");
      const depPax = g.vueloRegresoPersonas || (hasCompanion && !g.vuelosSeparados ? 2 : 1);

      // Vuelos 2
      const arrDate2 = gAny.vueloLlegadaFecha2 || compAny?.vueloLlegadaFecha || "";
      const arrAirline2 = gAny.vueloLlegadaAerolinea2 || compAny?.vueloLlegadaAerolinea || "";
      const arrNo2 = gAny.vueloLlegadaNoVuelo2 || compAny?.vueloLlegadaNoVuelo || "";
      const arrTime2 = gAny.vueloLlegadaHora2 || compAny?.vueloLlegadaHora || "";
      const arrPax2 = gAny.vueloLlegadaPax2 || (arrAirline2 || arrDate2 ? 1 : 0);

      const depDate2 = gAny.vueloRegresoFecha2 || compAny?.vueloRegresoFecha || "";
      const depAirline2 = gAny.vueloRegresoAerolinea2 || compAny?.vueloRegresoAerolinea || "";
      const depNo2 = gAny.vueloRegresoNoVuelo2 || compAny?.vueloRegresoNoVuelo || "";
      const depTime2 = gAny.vueloRegresoHora2 || compAny?.vueloRegresoHora || "";
      const depPax2 = gAny.vueloRegresoPax2 || (depAirline2 || depDate2 ? 1 : 0);

      // Date check helper
      const isDateMatch = (dateStr: string, day: number, month: number) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.getDate() === day && (d.getMonth() + 1) === month;
        }
        return dateStr.includes(`${day}/11`) || dateStr.includes(`0${day}/11`) || dateStr.includes(`-11-0${day}`) || dateStr.includes(`-11-${day}`);
      };

      // Calculate pax for arrivals / departures on specific dates
      const calcArrivalsOnDate = (targetDay: number) => {
        let count = 0;
        if (isDateMatch(arrDate, targetDay, 11)) count += (arrPax || 1);
        if (arrDate2 && isDateMatch(arrDate2, targetDay, 11)) count += (arrPax2 || 1);
        return count;
      };

      const calcDeparturesOnDate = (targetDay: number) => {
        let count = 0;
        if (isDateMatch(depDate, targetDay, 11)) count += (depPax || 1);
        if (depDate2 && isDateMatch(depDate2, targetDay, 11)) count += (depPax2 || 1);
        return count;
      };

      const leg4 = calcArrivalsOnDate(4);
      const leg5 = calcArrivalsOnDate(5);
      const leg6 = calcArrivalsOnDate(6);
      const leg7 = calcArrivalsOnDate(7);
      const leg8 = calcArrivalsOnDate(8);

      totalLlegada4 += leg4;
      totalLlegada5 += leg5;
      totalLlegada6 += leg6;
      totalLlegada7 += leg7;
      totalLlegada8 += leg8;

      const sal9 = calcDeparturesOnDate(9);
      const sal10 = calcDeparturesOnDate(10);
      const sal11 = calcDeparturesOnDate(11);
      const sal12 = calcDeparturesOnDate(12);

      totalSalida9 += sal9;
      totalSalida10 += sal10;
      totalSalida11 += sal11;
      totalSalida12 += sal12;

      // Regalos
      const regHombreCount = (sex1 === 'M' ? 1 : 0) + (isMaleComp ? 1 : 0);
      const regMujerCount = (sex1 === 'F' ? 1 : 0) + (isFemaleComp ? 1 : 0);
      totalRegalosHombre += regHombreCount;
      totalRegalosMujer += regMujerCount;

      // Alergias
      const formatAllergy = (val: any) => {
        if (!val) return "";
        const str = String(val).trim();
        if (!str || str.toLowerCase() === "ninguna" || str.toLowerCase() === "ninguno" || str.toLowerCase() === "n/a") return "";
        return str;
      };

      const allergyTitular = formatAllergy(g.allergies?.join(", ") || g.alergiasTitular);
      const allergyAcomp = formatAllergy(companion?.requirements || g.alergiasAcompanante);
      const allergyMenor1 = formatAllergy(g.minors?.[0]?.allergies || (Array.isArray(g.alergiasMenores) ? g.alergiasMenores[0] : g.alergiasMenores));
      const allergyMenor2 = formatAllergy(g.minors?.[1]?.allergies || (Array.isArray(g.alergiasMenores) && g.alergiasMenores[1] ? g.alergiasMenores[1] : ""));

      // Companion name splitting
      let compApellidos = "";
      let compNombres = "";
      if (compAny) {
        if (compAny.apellidos || compAny.nombres) {
          compApellidos = compAny.apellidos || "";
          compNombres = compAny.nombres || "";
        } else if (compAny.name) {
          const parts = compAny.name.trim().split(' ');
          if (parts.length > 1) {
            compNombres = parts[0];
            compApellidos = parts.slice(1).join(' ');
          } else {
            compNombres = compAny.name;
          }
        }
      } else if (g.nombreAcompanante) {
        const parts = g.nombreAcompanante.trim().split(' ');
        if (parts.length > 1) {
          compNombres = parts[0];
          compApellidos = parts.slice(1).join(' ');
        } else {
          compNombres = g.nombreAcompanante;
        }
      }

      // Minors
      const minor1 = g.minors?.[0];
      const minor2 = g.minors?.[1];
      const nombreMenor1 = minor1?.name || (Array.isArray(gAny.nombreMenores) ? gAny.nombreMenores[0] : (gAny.nombreMenores || ""));
      const nombreMenor2 = minor2?.name || (Array.isArray(gAny.nombreMenores) ? gAny.nombreMenores[1] : "");
      const edadMenor1 = minor1?.age !== undefined ? String(minor1.age) : (Array.isArray(gAny.edadMenores) ? String(gAny.edadMenores[0] || "") : (gAny.edadMenores ? String(gAny.edadMenores) : ""));
      const edadMenor2 = minor2?.age !== undefined ? String(minor2.age) : (Array.isArray(gAny.edadMenores) && gAny.edadMenores[1] ? String(gAny.edadMenores[1]) : "");

      // Kit de bienvenida label
      const hasMan = sex1 === "M" || isMaleComp;
      const hasWoman = sex1 === "F" || isFemaleComp;
      let kitBienvenidaVal = "N/A";
      if (hasMan && hasWoman) kitBienvenidaVal = "Hombre y mujer";
      else if (hasMan) kitBienvenidaVal = "Hombre";
      else if (hasWoman) kitBienvenidaVal = "Mujer";

      const rowObj: Record<string, any> = {
        "No. Consecutivo": index + 1,
        "Puesto": g.puesto || g.role || "Convencionista",
        "tipo de huesped": g.tipoHuesped || "Convencionista",
        "grupo": g.grupo || "Stellantis",
        "Distribuidora": g.distribuidora || g.distributor || "",
        "APELLIDOS 1": g.apellidosTitular || (g.name ? g.name.split(' ').slice(1).join(' ') : ""),
        "NOMBRE(S) 1": g.nombreTitular || (g.name ? g.name.split(' ')[0] : ""),
        "SEXO 1": sex1,
        "APELLIDOS 2": compApellidos,
        "NOMBRES 2": compNombres,
        "SEXO 2": compSex,
        "NOMBRE MENOR 1": nombreMenor1,
        "EDAD MENOR 1": edadMenor1,
        "NOMBRE MENOR 2": nombreMenor2,
        "EDAD MENOR 2": edadMenor2,
        "NUMERO DE MENORES": minorsCount,

        "HOTEL": hotelNameVal,
        "CATEGORIA": "",
        "CONFIGURACION": g.configuracionHabitacion || "King",
        "NO. HABITACION": g.numeroHabitacion || gAny.numHabitacion || "",
        "CARNET": tipoHab,
        "COSTO CARNET": costoCarnetVal,
        "CARNET EXTRA": carnetExtraVal,
        "MEAL PLAN MENORES": mealPlanMenoresVal,
        "ADULTOS DIA ADICIONAL": adultosDiaAdicionalVal,
        "MENORES DIA ADICIONAL": menoresDiaAdicionalVal,
        "TOTAL A PAGAR": costTotal,
        "CENA DE CONSEJO": cenaConsejoVal > 0 ? cenaConsejoVal : "",
        "ASISTENTES JUNTA DE CONSEJO": juntaConsejoVal > 0 ? juntaConsejoVal : "",

        "LLEGADAS 4 NOV": leg4 > 0 ? leg4 : "",
        "LLEGADAS 5 NOV": leg5 > 0 ? leg5 : "",
        "LLEGADAS 6 NOV": leg6 > 0 ? leg6 : "",
        "LLEGADAS 7 NOV": leg7 > 0 ? leg7 : "",
        "LLEGADAS 8 NOV": leg8 > 0 ? leg8 : "",

        "SALIDAS GENERAL 9 NOV": sal9 > 0 ? sal9 : "",
        "10 NOV": sal10 > 0 ? sal10 : "",
        "11 NOV": sal11 > 0 ? sal11 : "",
        "12 NOV": sal12 > 0 ? sal12 : "",

        "REGALOS HOMBRE": regHombreCount,
        "REGALOS MUJER": regMujerCount,
        "REGALO HOMBRE": (sex1 === 'M' || isMaleComp) ? (g.regaloTitularEntregado || g.regaloHombre ? 1 : 0) : 0,
        "ARREGLO FLORAL": g.arregloFloral ? 1 : 0,
        "CERTIFICADO DE REGALO": g.certificadoRegalo ? 1 : 0,
        "REGALO DE DESPEDIDA": g.regaloDespedida ? 1 : 0,
        "REGALO MENORES": g.regaloMenores ? 1 : 0,

        "INE 1": (g.ineTitular || g.idFileName) ? "SI" : "NO",
        "INE 2": hasCompanion ? (g.ineAcompanante ? "SI" : "NO") : "NO",

        "Fecha llegada": arrDate,
        "Aerolinea llegada": arrAirline,
        "No Vuelo llegada": arrNo,
        "Hora llegada": arrTime,
        "#Pax llegada": arrPax,
        "Fecha llegada 2": arrDate2,
        "Aerolinea llegada 2": arrAirline2,
        "No vuelo llegada 2": arrNo2,
        "Hora llegada 2": arrTime2,
        "#Pax llegada2": arrPax2,
        "Fecha regreso": depDate,
        "Aerolinea regreso": depAirline,
        "No. Vuelo regreso": depNo,
        "Hora regreso": depTime,
        "#Pax Regreso": depPax,
        "Fecha regreso2": depDate2,
        "Aerolinea regreso2": depAirline2,
        "No. Vuelo regreso2": depNo2,
        "Hora regreso2": depTime2,
        "#Pax regreso2": depPax2,
      };

      // Columnas dinámicas para actividades
      activitiesList.forEach(act => {
        rowObj[`Actividad: ${act.name}`] = g.selectedActivities?.includes(act.id) ? "Inscrito" : "No";
      });

      rowObj["Alergias/restricciones titula"] = allergyTitular;
      rowObj["Alergias/restricciones/acompañante"] = allergyAcomp;
      rowObj["alergias/restricciones Menor1"] = allergyMenor1;
      rowObj["alergias/restricciones menor2"] = allergyMenor2;
      rowObj["Comentarios especiales"] = g.specialRequirements || g.requerimientosAdicionales || "";
      rowObj["Fecha registro"] = g.createdAt ? new Date(g.createdAt).toLocaleDateString("es-MX") : "";
      rowObj["Email Titular"] = g.email;
      rowObj["Telefono/Celular"] = g.phone;
      rowObj["Noches adicionales"] = Math.round(g.nochesAdicionales || 0);
      rowObj["Estatus registro"] = g.status;
      rowObj["Comentarios Staff Admin"] = g.comentariosAdmin || "";

      return rowObj;
    });

    excelData.push({} as any);

    const totalKitsGeneral = totalTitulares + totalCompMujeres + totalCompHombres + totalMenores;

    const totalsObj: Record<string, any> = {
      "No. Consecutivo": "TOTALES DE OPERACIÓN",
      "Puesto": "",
      "tipo de huesped": `Titulares: ${totalTitulares}`,
      "grupo": "",
      "Distribuidora": "",
      "APELLIDOS 1": `Total Titulares: ${totalTitulares}`,
      "NOMBRE(S) 1": "",
      "SEXO 1": "",
      "APELLIDOS 2": `Total Acompañantes: ${totalCompMujeres + totalCompHombres}`,
      "NOMBRES 2": "",
      "SEXO 2": "",
      "NOMBRE MENOR 1": "",
      "EDAD MENOR 1": "",
      "NOMBRE MENOR 2": "",
      "EDAD MENOR 2": "",
      "NUMERO DE MENORES": totalMenores,

      "HOTEL": "",
      "CATEGORIA": "",
      "CONFIGURACION": "",
      "NO. HABITACION": "",
      "CARNET": `Habitaciones: ${totalHabitaciones}`,
      "COSTO CARNET": totalCostoCarnet,
      "CARNET EXTRA": totalCarnetExtra,
      "MEAL PLAN MENORES": totalMealPlanMenores,
      "ADULTOS DIA ADICIONAL": totalAdultosDiaAdicional,
      "MENORES DIA ADICIONAL": totalMenoresDiaAdicional,
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
      const registeredCount = guests.filter(g => g.selectedActivities?.includes(act.id)).length;
      totalsObj[`Actividad: ${act.name}`] = `Total: ${registeredCount}`;
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

    excelData.push(totalsObj);

    excelData.push({
      "No. Consecutivo": "RESUMEN EJECUTIVO",
      "Puesto": `Titulares: ${totalTitulares}`,
      "Nombre completo acompañante": `Acompañantes Adultos: ${totalCompMujeres + totalCompHombres}`,
      "Regalo menores": `Menores: ${totalMenores}`,
      "Kits d bienvenida": `Total Kits Evento: ${totalKitsGeneral}`,
      "Noches adicionales": `Total Noches Extra: ${totalNochesAdicionales}`,
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

    const worksheet = XLSX.utils.json_to_sheet(upperExcelData);

    // Style the title row with a light gray background
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            fill: { fgColor: { rgb: "E0E0E0" }, patternType: "solid" },
            font: { bold: true }
          };
        }
      }
    }

    const colWidths = Object.keys(excelData[0] || {}).map(key => {
      let maxLen = key.length;
      excelData.forEach(row => {
        const val = (row as any)[key];
        if (val !== undefined && val !== null) {
          const str = String(val);
          if (str.length > maxLen && str.length < 60) {
            maxLen = str.length;
          }
        }
      });
      return { wch: Math.max(maxLen + 3, 14) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Padrón de Invitados");

    XLSX.writeFile(workbook, `Padron_Invitados_ADISTEM_2026_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    if (!commForm.subject.trim() || !commForm.body.trim()) {
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

  // Filtered guest list
  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.distributor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (g.distribuidora || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    const matchesStage = stageFilter === "all" || g.stage.toString() === stageFilter;

    const matchesGroup = filterGroup === "todos" || 
                         (g.grupo && g.grupo.toLowerCase() === filterGroup.toLowerCase()) ||
                         (filterGroup === "Stellantis" && !g.grupo); // fallback matching
                         
    const matchesHotel = filterHotel === "todos" || (g.hotelAlojamiento || config?.hotelSede || "Sin asignar") === filterHotel;
    const matchesType = filterType === "todos" || (g.tipoHuesped || "Convencionista") === filterType;

    return matchesSearch && matchesStatus && matchesStage && matchesGroup && matchesHotel && matchesType;
  });

  // Calculate high level KPI totals
  const totalGuestsCount = guests.length;
  const countIncomplete = guests.filter(g => g.status === GuestStatus.INCOMPLETE).length;
  const countComplete = guests.filter(g => g.status === GuestStatus.COMPLETE).length;
  const countConfirmed = guests.filter(g => g.status === GuestStatus.CONFIRMED).length;
  const countCancelled = guests.filter(g => g.status === GuestStatus.CANCELLED).length;

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
            { id: "activities", label: "Actividades Especiales", icon: Award },
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Padrón Total</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{totalGuestsCount}</p>
                <span className="text-[11px] text-slate-400 block mt-2 font-medium">Invitados cargados</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Confirmados</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{countConfirmed}</p>
                <span className="text-[11px] text-emerald-500 block mt-2 font-medium">Asistencia asegurada</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <p className="text-xs text-sky-600 font-bold uppercase tracking-wider">Completos</p>
                <p className="text-3xl font-black text-sky-600 mt-1">{countComplete}</p>
                <span className="text-[11px] text-sky-500 block mt-2 font-medium">Vuelos y ID cargados</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Incompletos</p>
                <p className="text-3xl font-black text-amber-600 mt-1">{countIncomplete}</p>
                <span className="text-[11px] text-amber-500 block mt-2 font-medium">Falta registro de datos</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1">
                <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">Cancelados</p>
                <p className="text-3xl font-black text-rose-600 mt-1">{countCancelled}</p>
                <span className="text-[11px] text-rose-500 block mt-2 font-medium">Bajas del evento</span>
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
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-brand-teal" />
                      Ocupación General de Actividades
                    </h4>
                    <div className="space-y-2.5">
                      {activities.slice(0, 4).map(act => {
                        const percent = Math.min(100, Math.round((act.registeredCount / act.capacity) * 100));
                        return (
                          <div key={act.id} className="flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-600 truncate max-w-[160px]" title={act.name}>{act.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[10px]">({act.registeredCount}/{act.capacity})</span>
                              <span className={`px-2 py-0.5 rounded font-black text-[10px] border ${
                                percent >= 100 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                percent >= 80 ? 'bg-amber-50 text-amber-750 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              }`}>
                                {percent}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
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
                <p className="text-xs text-slate-500 font-medium">Administra los hoteles sede oficiales del evento y configura las tarifas por noche según el carnet del invitado.</p>
              </div>

              {isReadOnly && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Modo de Vista de Staff (Sólo Lectura):</strong> Tu cuenta no tiene permisos para crear, editar o eliminar hoteles o tarifas. Para realizar cambios, ingresa como Administrador.</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* HOTEL FORM CARD */}
                <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="font-bold text-xs text-blue-600 uppercase tracking-widest flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    {editingHotelId ? "Editar Sede" : "Nueva Sede de Alojamiento"}
                  </h4>

                  <form onSubmit={handleSaveHotel} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre del Hotel Sede</label>
                      <input 
                        type="text"
                        value={hotelName}
                        onChange={e => setHotelName(e.target.value)}
                        placeholder="Ej: Grand Fiesta Americana Coral Beach"
                        disabled={isReadOnly}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block mb-2">Costos por Noche (Tarifario MXN)</span>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Habitación Sencilla</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              value={costSencilla || ""}
                              onChange={e => setCostSencilla(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Habitación Sencilla Extra</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              value={costSencilloExtra || ""}
                              onChange={e => setCostSencilloExtra(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Habitación Doble</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              value={costDoble || ""}
                              onChange={e => setCostDoble(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">Habitación Doble Extra</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              value={costDobleExtra || ""}
                              onChange={e => setCostDobleExtra(Number(e.target.value))}
                              disabled={isReadOnly}
                              placeholder="0"
                              className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
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
                              setCostSencilla(0);
                              setCostSencilloExtra(0);
                              setCostDoble(0);
                              setCostDobleExtra(0);
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
                          <span>{editingHotelId ? "Guardar Sede" : "Registrar Sede"}</span>
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {/* HOTELS TABLE CARD */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Catálogo de Sedes Registradas</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {hotelsList.length} Sedes
                    </span>
                  </div>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                          <th className="p-4">Hotel Sede</th>
                          <th className="p-4 text-right">Sencilla</th>
                          <th className="p-4 text-right">Sencilla Extra</th>
                          <th className="p-4 text-right">Doble</th>
                          <th className="p-4 text-right">Doble Extra</th>
                          {!isReadOnly && <th className="p-4 text-center">Acciones</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {hotelsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 italic font-medium">
                              No hay sedes registradas en la base de datos.
                            </td>
                          </tr>
                        ) : (
                          hotelsList.map(h => (
                            <tr key={h.id} className="hover:bg-slate-50/40">
                              <td className="p-4 font-bold text-slate-800">{h.name}</td>
                              <td className="p-4 font-mono text-right text-slate-600 font-semibold">${h.costSencilla?.toLocaleString()}</td>
                              <td className="p-4 font-mono text-right text-slate-600 font-semibold">${h.costSencilloExtra?.toLocaleString()}</td>
                              <td className="p-4 font-mono text-right text-slate-600 font-semibold">${h.costDoble?.toLocaleString()}</td>
                              <td className="p-4 font-mono text-right text-slate-600 font-semibold">${h.costDobleExtra?.toLocaleString()}</td>
                              {!isReadOnly && (
                                <td className="p-4">
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
                          ))
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
                    placeholder="Buscar titular, correo o agencia..."
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
                    <option value="VIP">VIP</option>
                    <option value="Convencionista">Convencionista</option>
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
                <div className="bg-white p-6 rounded-xl border border-blue-200 space-y-6 shadow-md">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="px-2.5 py-1 bg-slate-150 text-slate-700 rounded font-mono text-xs font-bold">
                        {selectedGuest.id}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedGuest.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{selectedGuest.role} • <strong className="text-blue-600">{selectedGuest.distributor}</strong></p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onSelectGuestForMobileSim(selectedGuest)}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Probar en el simulador móvil"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Probar en Sim Móvil
                      </button>
                      <button 
                        onClick={() => { setSelectedGuest(null); setIsEditingGuest(false); }} 
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

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
                                  value={["Dueño", "Director", "Gerente", "Financiera", "Planta"].includes(activeGuestData.puesto || activeGuestData.role || "") ? (activeGuestData.puesto || activeGuestData.role || "") : "Otros"} 
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val !== "Otros") {
                                      updateField("puesto", val);
                                    } else {
                                      updateField("puesto", "Otros");
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer text-sm"
                                >
                                  <option value="Dueño">Dueño</option>
                                  <option value="Director">Director</option>
                                  <option value="Gerente">Gerente</option>
                                  <option value="Financiera">Financiera</option>
                                  <option value="Planta">Planta</option>
                                  <option value="Otros">Otros</option>
                                </select>
                                {(!["Dueño", "Director", "Gerente", "Financiera", "Planta"].includes(activeGuestData.puesto || activeGuestData.role || "") || activeGuestData.puesto === "Otros") && (
                                  <input 
                                    type="text" 
                                    value={activeGuestData.puesto === "Otros" ? "" : (activeGuestData.puesto || activeGuestData.role || "")} 
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
                                  value={activeGuestData.tipoHuesped || "Convencionista"} 
                                  onChange={e => updateField("tipoHuesped", e.target.value as any)}
                                  disabled={isReadOnly}
                                  className="w-full bg-white border border-blue-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer font-bold text-blue-900"
                                >
                                  <option value="Convencionista">Convencionista</option>
                                  <option value="VIP">VIP</option>
                                  <option value="Mesa Directiva">Mesa Directiva</option>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hotel Sede de Alojamiento</label>
                            <select 
                              value={activeGuestData.hotelAlojamiento || ""} 
                              onChange={e => updateField("hotelAlojamiento", e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer font-semibold"
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
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Habitación Carnet</label>
                            <select 
                              value={activeGuestData.carnetTipoHabitacion || "Doble"} 
                              onChange={e => updateField("carnetTipoHabitacion", e.target.value as any)}
                              disabled={isReadOnly}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer"
                            >
                              <option value="Sencilla">Sencilla</option>
                              <option value="Doble">Doble</option>
                              <option value="Sencillo Extra">Sencilla Extra</option>
                              <option value="Doble Extra">Doble Extra</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Configuración Cama</label>
                            <select 
                              value={activeGuestData.configuracionHabitacion || "Queen/Queen"} 
                              onChange={e => updateField("configuracionHabitacion", e.target.value as any)}
                              disabled={isReadOnly}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer"
                            >
                              <option value="King">1 Cama King Size</option>
                              <option value="Queen/Queen">2 Camas Queen Size</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Noches Adicionales (Máx. 4)</label>
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
                              className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono font-bold"
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
                      )}

                      {/* 3. VUELOS TAB */}
                      {editGuestSubTab === "vuelos" && (() => {
                        const minorsCount = activeGuestData.minors?.length || activeGuestData.numMenores || 0;
                        const totalReg = 1 + (activeGuestData.companions?.length || 0) + minorsCount;
                        const allPeople = [
                          { id: "titular", name: `${activeGuestData.nombreTitular || ""} ${activeGuestData.apellidosTitular || ""}`.trim() || "Titular", type: "Titular" },
                          ...(activeGuestData.companions || []).map((c: any, idx: number) => ({
                            id: c.id || `C-${idx + 1}`,
                            name: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || `Acompañante #${idx + 1}`,
                            type: "Acompañante"
                          })),
                          ...(activeGuestData.minors || []).map((m: any, idx: number) => ({
                            id: `M-${idx + 1}`,
                            name: m.name ? `${m.name} ${m.lastName || ""}`.trim() : `Menor #${idx + 1} (${m.age === 0 ? "0-11 meses" : `${m.age || ""} años`})`,
                            type: "Menor"
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
                                    {allPeople.map(p => {
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
                                    {allPeople.map(p => {
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
                          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">Traslado Aeropuerto <span className="text-slate-400">↔</span> Hotel</span>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Traslado / Transporte Programado</label>
                              <select
                                value={activeGuestData.assignedTransportId || ""}
                                onChange={e => updateField("assignedTransportId", e.target.value || undefined)}
                                disabled={isReadOnly}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer font-semibold"
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
                            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">Inscripción a Actividades con Cupo</span>
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
                      {editGuestSubTab === "acompanantes" && (
                        <div className="space-y-6">
                          {/* SECCION 1: ACOMPAÑANTES ADULTOS */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div>
                                <h5 className="font-bold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  Acompañantes Adultos ({(activeGuestData.companions || []).length})
                                </h5>
                                <p className="text-[10px] text-slate-500 font-medium">Gestión de datos de acompañantes mayores de edad</p>
                              </div>

                              {!isReadOnly && (
                                <button
                                  type="button"
                                  disabled={(activeGuestData.companions || []).length >= 1}
                                  onClick={() => {
                                    const currentComps = activeGuestData.companions || [];
                                    if (currentComps.length >= 1) {
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
                                    const updated = [...currentComps, newComp];
                                    updateField("companions", updated);
                                    if (updated.length === 1) {
                                      updateField("nombreAcompanante", "");
                                      updateField("apellidosAcompanante", "");
                                      updateField("sexoAcompanante", "Femenino");
                                      updateField("alergiasAcompanante", "");
                                    }
                                  }}
                                  className={`px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-2xs ${
                                    (activeGuestData.companions || []).length >= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  Agregar Acompañante Adulto (Máx. 1)
                                </button>
                              )}
                            </div>

                            {/* Legacy Single Companion fallback sync if companions array is empty but legacy fields exist */}
                            {(!activeGuestData.companions || activeGuestData.companions.length === 0) && (activeGuestData.nombreAcompanante || activeGuestData.apellidosAcompanante) && (
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

                            {(!activeGuestData.companions || activeGuestData.companions.length === 0) && !activeGuestData.nombreAcompanante && !activeGuestData.apellidosAcompanante && (
                              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                <p className="text-xs text-slate-400 font-medium">El titular no registró acompañantes adultos.</p>
                              </div>
                            )}

                            {activeGuestData.companions && activeGuestData.companions.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeGuestData.companions.map((comp, cidx) => {
                                  let fName = comp.firstName || "";
                                  let lName = comp.lastName || "";
                                  if (!fName && !lName) {
                                    const parts = (comp.name || "").split(" ");
                                    fName = parts[0] || "";
                                    lName = parts.slice(1).join(" ") || "";
                                  }

                                  const updateCompanionField = (field: string, value: any) => {
                                    const updated = activeGuestData.companions.map((c, i) => {
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
                                          Acompañante #{cidx + 1}
                                        </span>
                                        {!isReadOnly && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const filtered = activeGuestData.companions.filter((_, i) => i !== cidx);
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

                          {/* SECCION 2: MENORES DE EDAD / NIÑOS */}
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div>
                                <h5 className="font-bold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  Menores Acompañantes ({activeGuestData.numMenores ?? (activeGuestData.minors || []).length})
                                </h5>
                                <p className="text-[10px] text-slate-500 font-medium">Gestión de niños e infantes acompañantes</p>
                              </div>

                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentMinors = activeGuestData.minors || [];
                                    const newMinor = {
                                      name: "",
                                      lastName: "",
                                      age: 5,
                                      sex: "F",
                                      allergies: ""
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
                                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  Agregar Menor de Edad
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] text-slate-500 font-bold mb-1">Cantidad de Menores</label>
                                <input 
                                  type="number" 
                                  min={0}
                                  value={activeGuestData.numMenores ?? (activeGuestData.minors || []).length} 
                                  onChange={e => updateField("numMenores", Number(e.target.value))}
                                  disabled={isReadOnly}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500 font-bold mb-1">Alergias / Dieta General de los Menores</label>
                                <input 
                                  type="text" 
                                  placeholder="Especificar alergias de los niños"
                                  value={activeGuestData.alergiasMenores || ""} 
                                  onChange={e => updateField("alergiasMenores", e.target.value)}
                                  disabled={isReadOnly}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
                                />
                              </div>
                            </div>

                            {/* Minors List Cards */}
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

                                  return (
                                    <div key={midx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 relative">
                                      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                                        <span className="text-[11px] font-extrabold text-sky-700 uppercase">
                                          Menor #{midx + 1}
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

                                      <div className="grid grid-cols-2 gap-2 text-xs">
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
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Rango de Edad</label>
                                          <select
                                            value={minor.age <= 1 ? "0" : minor.age <= 11 ? "5" : "12"}
                                            onChange={e => updateMinorField("age", Number(e.target.value))}
                                            disabled={isReadOnly}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 cursor-pointer"
                                          >
                                            <option value="0">0 - 11 meses (Infante)</option>
                                            <option value="5">1 - 11 años (Niño)</option>
                                            <option value="12">12+ años (Adolescente)</option>
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
                                        <div className="col-span-2">
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Alergias o Restricciones</label>
                                          <input
                                            type="text"
                                            value={minor.allergies || ""}
                                            onChange={e => updateMinorField("allergies", e.target.value)}
                                            disabled={isReadOnly}
                                            placeholder="Ninguna"
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
                      )}

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
                                    if (!newChargeDesc.trim() || newChargeAmount <= 0) return;
                                    const updatedCharges = [...currentCharges, { description: newChargeDesc.trim(), monto: newChargeAmount }];
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

                      {/* 7. BITACORA TAB */}
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
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl transition cursor-pointer font-bold"
                      >
                        Cerrar
                      </button>
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
                      <th className="p-4">Invitado Titular</th>
                      <th className="p-4">Distribuidor / Grupo</th>
                      <th className="p-4">Logística Sede</th>
                      <th className="p-4">Acompañantes</th>
                      <th className="p-4">Regalos / Kits</th>
                      <th className="p-4">Vuelo Ida / Regreso</th>
                      <th className="p-4">Importe Total</th>
                      <th className="p-4 text-right">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic font-medium">
                          No se encontraron invitados que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map(g => {
                        const customCostSum = (g.costosAdicionales || []).reduce((s: number, c: any) => s + c.monto, 0);
                        const total = getGuestTotalCost(g);
                        
                        const hasCompanions = g.companions && g.companions.length > 0;
                        const companionText = hasCompanions ? `Adulto: ${g.companions[0].name}` : (g.nombreAcompanante ? `Adulto: ${g.nombreAcompanante}` : "Solo");
                        const minorsCount = g.numMenores || 0;

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
                              <p className="font-bold text-slate-900 text-sm">{g.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-medium">{g.email}</p>
                              <span className="bg-blue-50 border border-blue-150 text-blue-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block">
                                {g.tipoHuesped || "Convencionista"}
                              </span>
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
                              <p className="text-slate-400 text-[11px] font-semibold">Menores: {minorsCount}</p>
                            </td>
                            <td className="p-4" onClick={e => e.stopPropagation()}>
                              <div className="flex flex-col gap-1 text-[10px]">
                                <button
                                  type="button"
                                  onClick={e => handleToggleGift(g, 'regaloTitularEntregado', e)}
                                  className={`px-2 py-0.5 rounded border text-left font-bold transition flex items-center justify-between gap-1 cursor-pointer ${
                                    g.regaloTitularEntregado 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                                  }`}
                                  title="Toggle regalo titular"
                                >
                                  <span>Titular: {g.regaloTitularEntregado ? "Entregado ✓" : "Pendiente"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={e => handleToggleGift(g, 'regaloAcompananteMujerEntregado', e)}
                                  className={`px-2 py-0.5 rounded border text-left font-bold transition flex items-center justify-between gap-1 cursor-pointer ${
                                    g.regaloAcompananteMujerEntregado 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                                  }`}
                                  title="Toggle regalo acompañante mujer"
                                >
                                  <span>Reg. Mujer: {g.regaloAcompananteMujerEntregado ? "Entregado ✓" : "Pendiente"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={e => handleToggleGift(g, 'regaloAcompananteHombreEntregado', e)}
                                  className={`px-2 py-0.5 rounded border text-left font-bold transition flex items-center justify-between gap-1 cursor-pointer ${
                                    g.regaloAcompananteHombreEntregado 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                                  }`}
                                  title="Toggle regalo acompañante hombre"
                                >
                                  <span>Reg. Hombre: {g.regaloAcompananteHombreEntregado ? "Entregado ✓" : "Pendiente"}</span>
                                </button>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-[11px]">
                              <p className="text-emerald-600 font-bold">{arrivalFlight}</p>
                              <p className="text-blue-600 font-bold">{departureFlight}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-extrabold text-slate-900 text-sm font-mono">${total.toLocaleString()} MXN</p>
                              {customCostSum > 0 && (
                                <p className="text-[10px] text-emerald-600 font-semibold">+{customCostSum.toLocaleString()} extras</p>
                              )}
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
                                    if (confirm(`¿Estás seguro de eliminar el registro completo de ${g.name}? Esto es irreversible.`)) {
                                      DataStore.deleteGuest(g.id, "Staff - Juan", "staff@adistem.com.mx");
                                      onUpdate();
                                      setSelectedGuest(null);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:text-rose-750 rounded hover:bg-rose-50 cursor-pointer transition"
                                  title="Borrar invitado"
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
                              <p className="font-extrabold text-slate-800 leading-tight">{g.name}</p>
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
                              <p className="font-extrabold text-slate-800 leading-tight">{g.name}</p>
                              <p className="text-[10px] text-slate-550 font-semibold">{g.distributor}</p>
                              <p className="text-[9px] text-slate-400 font-medium font-mono mt-0.5">{g.email}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-700">{flight.airline} {flight.flightNumber}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{flight.departureAirport} → {flight.arrivalAirport}</p>
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
                <h3 className="text-lg font-bold text-slate-900">Catálogo Maestro de Actividades</h3>
                <p className="text-xs text-slate-500 font-medium">Controla el cupo, listas de espera automáticas y bloqueos de edición de actividades recreativas del evento.</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingActivity(null);
                    setActivityFormState({
                      id: "",
                      name: "",
                      description: "",
                      dateTime: "",
                      capacity: 20,
                      rules: "",
                      category: "otro"
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
                return (
                  <div key={act.id} className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-750 border border-blue-150 text-[10px] font-bold rounded uppercase">
                          {act.category}
                        </span>
                        <span className={`text-[11px] font-bold uppercase tracking-wide ${percent >= 100 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}`}>
                          {percent >= 100 ? "⚠️ CUPO LLENO" : "✓ LUGARES LIBRES"}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-850 mt-2">{act.name}</h4>
                      <p className="text-xs text-slate-650 mt-1 leading-relaxed font-medium">{act.description}</p>
                      
                      <div className="mt-3 p-2 bg-slate-50 rounded text-[11px] text-slate-600 border border-slate-150 font-medium">
                        <p><strong>Horario:</strong> {formatDate(act.dateTime)}</p>
                        {act.rules && <p className="mt-1"><strong>Condiciones:</strong> {act.rules}</p>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Ocupación Inscritos:</span>
                        <span className="font-bold text-slate-850">{act.registeredCount} / {act.capacity} delegados</span>
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
                        <span className={`font-mono font-bold ${act.waitingList.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {act.waitingList.length} invitado(s) en espera
                        </span>
                      </div>

                      {/* Action buttons: view guests, edit, and delete */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedActivityForGuests(act)}
                          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100/80 text-brand-primary border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <Users className="w-4 h-4" />
                          Participantes
                        </button>
                        <button
                          onClick={() => handleEditActivity(act)}
                          className="px-3 py-2 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-slate-600 border border-slate-200 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
                          title="Editar Actividad"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="px-3 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 border border-slate-200 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
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

            {/* ACTIVITY CRUD MODAL FORM */}
            {showActivityForm && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl animate-in zoom-in duration-150">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-brand-primary" />
                      {editingActivity ? "Editar Actividad Especial" : "Crear Nueva Actividad Especial"}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowActivityForm(false);
                        setEditingActivity(null);
                      }}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveActivity} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold">Categoría:</label>
                      <select
                        value={activityFormState.category}
                        onChange={(e) => setActivityFormState({ ...activityFormState, category: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="spa">Spa / Bienestar</option>
                        <option value="golf">Torneo de Golf</option>
                        <option value="tour">Tour Recreativo</option>
                        <option value="cena">Cena de Gala</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold">Nombre de la Actividad:</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Torneo de Golf de Gala"
                        value={activityFormState.name}
                        onChange={(e) => setActivityFormState({ ...activityFormState, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold">Descripción:</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Ej. Torneo en el campo de golf del hotel con premios..."
                        value={activityFormState.description}
                        onChange={(e) => setActivityFormState({ ...activityFormState, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold">Fecha y Hora:</label>
                        <input
                          type="datetime-local"
                          required
                          value={activityFormState.dateTime}
                          onChange={(e) => setActivityFormState({ ...activityFormState, dateTime: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-600 font-bold">Cupo Máximo:</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={1000}
                          value={activityFormState.capacity}
                          onChange={(e) => setActivityFormState({ ...activityFormState, capacity: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600 font-bold">Reglas / Condiciones (Opcional):</label>
                      <input
                        type="text"
                        placeholder="Ej. Vestimenta formal, Requiere reservación previa"
                        value={activityFormState.rules}
                        onChange={(e) => setActivityFormState({ ...activityFormState, rules: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="flex justify-end pt-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowActivityForm(false);
                          setEditingActivity(null);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg transition shadow-xs"
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
                      Esto cancelará de forma permanente la inscripción de <strong className="text-slate-900 font-semibold">{activityToDelete.registeredCount} invitado(s)</strong> registrados y vaciará la lista de espera de <strong className="text-slate-900 font-semibold">{activityToDelete.waitingList.length} persona(s)</strong>.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActivityToDelete(null)}
                      className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteActivity}
                      className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sí, Eliminar
                    </button>
                  </div>
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
        const registered = guests.filter(g => g.status !== GuestStatus.CANCELLED && g.selectedActivities.includes(act.id));
        const waiting = guests.filter(g => g.status !== GuestStatus.CANCELLED && act.waitingList.includes(g.id))
          .sort((a, b) => {
            const indexA = act.waitingList.indexOf(a.id);
            const indexB = act.waitingList.indexOf(b.id);
            return indexA - indexB;
          });

        const filteredRegistered = registered.filter(g => {
          const s = (activityGuestsSearchQuery || "").toLowerCase();
          return g.name.toLowerCase().includes(s) || g.distributor.toLowerCase().includes(s) || g.email.toLowerCase().includes(s) || (g.phone || "").includes(s);
        });

        const filteredWaiting = waiting.filter(g => {
          const s = (activityGuestsSearchQuery || "").toLowerCase();
          return g.name.toLowerCase().includes(s) || g.distributor.toLowerCase().includes(s) || g.email.toLowerCase().includes(s) || (g.phone || "").includes(s);
        });

        const handleCopyEmails = () => {
          const emails = registered.map(g => g.email).join(", ");
          navigator.clipboard.writeText(emails);
          alert(`Copiados los correos de los ${registered.length} invitados inscritos.`);
        };

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-2xl border border-slate-150 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-750 border border-blue-150 text-[9px] font-black rounded uppercase">
                    {act.category}
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-brand-primary" />
                    Asistentes Registrados: {act.name}
                  </h4>
                  <p className="text-[11px] text-slate-550 font-medium">
                    Horario: {formatDate(act.dateTime)} • Cupo: {act.registeredCount} / {act.capacity} delegados
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedActivityForGuests(null);
                    setActivityGuestsSearchQuery("");
                  }}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
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
                      placeholder="Buscar por nombre, correo, distribuidor..."
                      value={activityGuestsSearchQuery}
                      onChange={e => setActivityGuestsSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-brand-primary rounded-xl text-xs outline-hidden transition font-medium text-slate-800"
                    />
                  </div>

                  <button
                    onClick={handleCopyEmails}
                    disabled={registered.length === 0}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs rounded-xl transition shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    Copiar Correos de Inscritos
                  </button>
                </div>

                {/* Lists Segment */}
                <div className="flex-1 min-h-0 space-y-6 overflow-y-auto pr-1">
                  
                  {/* Registered Guests Section */}
                  <div>
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Invitados Inscritos ({registered.length})
                    </h5>

                    {filteredRegistered.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs text-slate-400 italic">No hay invitados inscritos {activityGuestsSearchQuery ? "que coincidan con la búsqueda." : "aún en esta actividad."}</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-3xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50/50">
                                <th className="p-3">Código ID</th>
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Distribuidor</th>
                                <th className="p-3">E-mail</th>
                                <th className="p-3">Teléfono</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRegistered.map(g => (
                                <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                                  <td className="p-3 font-mono font-bold text-slate-500">{g.id}</td>
                                  <td className="p-3 font-bold text-slate-800">{g.name}</td>
                                  <td className="p-3 font-medium text-slate-650">{g.distributor}</td>
                                  <td className="p-3 text-slate-500">{g.email}</td>
                                  <td className="p-3 text-slate-500">{g.phone || "—"}</td>
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
                                        setSelectedGuest(g);
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
                                <th className="p-3">Fila #</th>
                                <th className="p-3">Código ID</th>
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Distribuidor</th>
                                <th className="p-3">E-mail</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredWaiting.map((g, index) => (
                                <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50/30">
                                  <td className="p-3 font-mono font-bold text-amber-700">#{index + 1}</td>
                                  <td className="p-3 font-mono text-slate-500">{g.id}</td>
                                  <td className="p-3 font-bold text-slate-850">{g.name}</td>
                                  <td className="p-3 font-medium text-slate-650">{g.distributor}</td>
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
                                        setSelectedGuest(g);
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
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => {
                    setSelectedActivityForGuests(null);
                    setActivityGuestsSearchQuery("");
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
