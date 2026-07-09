import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, Plane, FileText, AlertTriangle, Bus, Award, 
  MessageSquare, Settings, History, Download, Plus, Search, 
  Trash2, Edit3, Save, CheckCircle, XCircle, Sparkles, UploadCloud,
  FileSpreadsheet, UserCheck, ShieldAlert, Check, RefreshCw
} from "lucide-react";
import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig } from "../types";
import { DataStore } from "../dataStore";

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

  // Selected guest for detailed file view (expediente)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [editedGuestData, setEditedGuestData] = useState<Guest | null>(null);

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
    DataStore.saveEventConfig(editingConfig, "Coordinador Staff", "staff@adistem.com.mx");
    onUpdate();
    alert("¡Configuración guardada y auditada correctamente!");
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

  // Save guest edits from Staff override
  const handleSaveEditedGuest = () => {
    if (!editedGuestData) return;
    const res = DataStore.saveGuest(editedGuestData, "Staff Override", "staff@adistem.com.mx", true);
    if (res.success) {
      setSelectedGuest(editedGuestData);
      setIsEditingGuest(false);
      onUpdate();
      alert("Ficha de invitado modificada correctamente en base de datos.");
    } else {
      alert(res.error || "Error al actualizar.");
    }
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
                          g.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    const matchesStage = stageFilter === "all" || g.stage.toString() === stageFilter;

    return matchesSearch && matchesStatus && matchesStage;
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

  return (
    <div className="bg-[#f8f9fa] text-slate-800 min-h-screen font-sans flex flex-col md:flex-row" id="backoffice-root">
      
      {/* LEFT NAVIGATION COLUMN */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200/60 flex flex-col p-4 shrink-0 shadow-2xs" id="backoffice-nav">
        <div className="flex flex-col items-center justify-center pb-5 mb-5 border-b border-slate-100 w-full">
          <div className="p-2 bg-slate-50 border border-slate-150 rounded-2xl w-full flex items-center justify-center shadow-xs">
            <img 
              src="/assets/Logo_convencion_reducido.png" 
              onError={(e) => {
                e.currentTarget.src = "/logo.png";
              }} 
              className="h-20 w-auto object-contain mx-auto max-w-full" 
              alt="Logo Convención" 
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
            { id: "config", label: "Reglas & Agenda", icon: Settings },
            { id: "guests", label: "Lista de Invitados", icon: UserCheck },
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
          <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100">
            <span className="text-slate-800 font-bold block mb-0.5">Demostración Activa:</span>
            Para simular el flujo del asistente, puedes iniciar sesión en el simulador móvil de la derecha como:
            <span className="block font-mono text-blue-600 mt-1 select-all font-bold">bernardo@fasterling.mx</span>
          </div>
          
          <button 
            onClick={() => setResetConfirm(true)}
            className="w-full text-left px-4 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition flex items-center gap-2 cursor-pointer font-bold"
          >
            <Trash2 className="w-3 h-3" />
            Restablecer Evento
          </button>
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
                  {[1, 2, 3, 4].map(dayNum => {
                    const dayObj = config.daysConfig?.find(d => d.dayNumber === dayNum);
                    const formattedDate = dayObj ? dayObj.date.split(" de ")[0] + " Oct" : `${14 + dayNum} Oct`;
                    return (
                      <button
                        key={dayNum}
                        onClick={() => setSelectedLogisticsDay(dayNum)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex flex-col items-center min-w-[70px] ${
                          selectedLogisticsDay === dayNum
                            ? "bg-brand-primary text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-250"
                        }`}
                      >
                        <span className="text-[10px] uppercase">Día {dayNum}</span>
                        <span className="text-[9px] font-medium opacity-85">{formattedDate}</span>
                      </button>
                    );
                  })}
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
                    const daysList = config.daysConfig || [];
                    const dayObj = daysList.find(d => d.dayNumber === selectedLogisticsDay) || {
                      date: `${14 + selectedLogisticsDay} de Octubre, 2026`,
                      title: `Día ${selectedLogisticsDay} del Evento`,
                      description: "Actividades generales y bloques operativos del día."
                    };

                    const dayGeneralAgenda = config.agenda.filter(item => {
                      const dayLabel = item.day.toLowerCase();
                      return dayLabel.includes(`día ${selectedLogisticsDay}`) || dayLabel.includes(`dia ${selectedLogisticsDay}`);
                    });

                    const dayRecActivities = activities.filter(act => {
                      const actDate = new Date(act.dateTime);
                      return actDate.getDate() === (14 + selectedLogisticsDay);
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

        {/* ======================= TAB: CONFIGURATION ======================= */}
        {activeTab === "config" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-wider">Configuración del Evento & Reglas Operativas</h3>
                <p className="text-xs text-slate-500 font-medium">Define los datos de la sede, plazos límites de logística y la agenda/notas oficiales por día.</p>
              </div>
              <button 
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios Operativos
              </button>
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
                      Fechas de Celebración:
                    </label>
                    <input 
                      type="text" 
                      value={editingConfig.dates || ""}
                      onChange={e => setEditingConfig({ ...editingConfig, dates: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-medium"
                    />
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
                <h4 className="font-bold text-sm text-brand-primary flex items-center gap-2 border-b border-slate-100 pb-2 font-display uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-brand-primary" />
                  Fechas Límite ("Deadlines")
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha Límite para Cambios de Vuelo:
                    </label>
                    <input 
                      type="datetime-local" 
                      value={editingConfig.deadlineFlightChange.substring(0, 16)}
                      onChange={e => setEditingConfig({ ...editingConfig, deadlineFlightChange: new Date(e.target.value).toISOString() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block font-medium">Pasada esta fecha, la app de invitado bloqueará la edición y emitirá alerta roja.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha Límite para Cambios de Transporte:
                    </label>
                    <input 
                      type="datetime-local" 
                      value={editingConfig.deadlineTransportChange.substring(0, 16)}
                      onChange={e => setEditingConfig({ ...editingConfig, deadlineTransportChange: new Date(e.target.value).toISOString() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fecha Límite para Registro de Actividades:
                    </label>
                    <input 
                      type="datetime-local" 
                      value={editingConfig.deadlineActivityChange.substring(0, 16)}
                      onChange={e => setEditingConfig({ ...editingConfig, deadlineActivityChange: new Date(e.target.value).toISOString() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary font-mono font-bold"
                    />
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

                  {/* Day tabs selection */}
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-lg">
                    {[1, 2, 3, 4].map(dayNum => (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => setSelectedEditingDay(dayNum)}
                        className={`py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                          selectedEditingDay === dayNum 
                            ? "bg-brand-primary text-white shadow-3xs" 
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/40"
                        }`}
                      >
                        Día {dayNum}
                      </button>
                    ))}
                  </div>

                  {/* Fields for chosen day */}
                  {(() => {
                    const daysList = editingConfig.daysConfig || [];
                    let dayObj = daysList.find(d => d.dayNumber === selectedEditingDay);
                    // Fallback to auto-create if missing
                    if (!dayObj) {
                      dayObj = {
                        id: `dia${selectedEditingDay}`,
                        dayNumber: selectedEditingDay,
                        date: `${14 + selectedEditingDay} de Octubre, 2026`,
                        title: `Actividades del Día ${selectedEditingDay}`,
                        description: `Descripción general para el Día ${selectedEditingDay}`,
                        notes: `Notas importantes para el Día ${selectedEditingDay}`
                      };
                    }

                    const handleDayFieldChange = (field: string, val: string) => {
                      const updatedList = [...daysList];
                      const idx = updatedList.findIndex(d => d.dayNumber === selectedEditingDay);
                      const newDayObj = { ...dayObj!, [field]: val };
                      if (idx === -1) {
                        updatedList.push(newDayObj);
                      } else {
                        updatedList[idx] = newDayObj;
                      }
                      setEditingConfig({ ...editingConfig, daysConfig: updatedList });
                    };

                    return (
                      <div className="space-y-3 pt-1 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha del Día:</label>
                          <input 
                            type="text"
                            value={dayObj.date}
                            onChange={e => handleDayFieldChange("date", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-brand-primary"
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
                        className="bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                      >
                        <option value="Día 1 - Oct 15">Día 1</option>
                        <option value="Día 2 - Oct 16">Día 2</option>
                        <option value="Día 3 - Oct 17">Día 3</option>
                        <option value="Día 4 - Oct 18">Día 4</option>
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
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
              <div className="flex flex-1 w-full gap-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, correo, distribuidor o código ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-850 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="flex gap-2 w-full lg:w-auto">
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none shadow-2xs cursor-pointer font-medium"
                >
                  <option value="all">Estatus: Todos</option>
                  <option value={GuestStatus.CONFIRMED}>Confirmado</option>
                  <option value={GuestStatus.COMPLETE}>Completo</option>
                  <option value={GuestStatus.INCOMPLETE}>Incompleto</option>
                  <option value={GuestStatus.CANCELLED}>Cancelado</option>
                </select>

                <select 
                  value={stageFilter} 
                  onChange={e => setStageFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none shadow-2xs cursor-pointer font-medium"
                >
                  <option value="all">Etapa: Todas</option>
                  <option value="1">Etapa 1 (VIPS)</option>
                  <option value="2">Etapa 2 (Delegados)</option>
                </select>

                <button 
                  onClick={() => setIsAddingGuest(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <Plus className="w-4 h-4" /> Alta Invitado
                </button>
              </div>
            </div>

            {/* EXPEDIENTE VIEW / DETAILED DIALOG */}
            {selectedGuest && (
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
                      onClick={() => {
                        setEditedGuestData({ ...selectedGuest });
                        setIsEditingGuest(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Ficha Staff
                    </button>
                    <button 
                      onClick={() => setSelectedGuest(null)} 
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {isEditingGuest && editedGuestData ? (
                  // Overriding Guest Data by Staff
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
                    <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider">Modo Edición - Forzar datos desde Staff</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-600 font-bold mb-1">Nombre Completo</label>
                        <input 
                          type="text" 
                          value={editedGuestData.name} 
                          onChange={e => setEditedGuestData({ ...editedGuestData, name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 font-bold mb-1">Distribuidor/Agencia</label>
                        <input 
                          value={editedGuestData.distributor} 
                          onChange={e => setEditedGuestData({ ...editedGuestData, distributor: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 font-bold mb-1">Teléfono</label>
                        <input 
                          type="text" 
                          value={editedGuestData.phone} 
                          onChange={e => setEditedGuestData({ ...editedGuestData, phone: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 font-bold mb-1">Estatus del Registro</label>
                        <select 
                          value={editedGuestData.status} 
                          onChange={e => setEditedGuestData({ ...editedGuestData, status: e.target.value as GuestStatus })}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value={GuestStatus.INCOMPLETE}>{GuestStatus.INCOMPLETE}</option>
                          <option value={GuestStatus.COMPLETE}>{GuestStatus.COMPLETE}</option>
                          <option value={GuestStatus.CONFIRMED}>{GuestStatus.CONFIRMED}</option>
                          <option value={GuestStatus.CANCELLED}>{GuestStatus.CANCELLED}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 font-bold mb-1">Etapa de Registro</label>
                        <select 
                          value={editedGuestData.stage} 
                          onChange={e => setEditedGuestData({ ...editedGuestData, stage: Number(e.target.value) as (1 | 2) })}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value={1}>Etapa 1 (VIPS)</option>
                          <option value={2}>Etapa 2 (General)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 font-bold mb-1">Alergias (Separadas por comas)</label>
                        <input 
                          type="text" 
                          value={editedGuestData.allergies.join(", ")} 
                          onChange={e => setEditedGuestData({ ...editedGuestData, allergies: e.target.value.split(",").map(s=>s.trim()).filter(Boolean) })}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 font-bold mb-1">Usuario de Acceso (Default: email)</label>
                        <input 
                          type="text" 
                          placeholder={editedGuestData.email}
                          value={editedGuestData.username || ""} 
                          onChange={e => setEditedGuestData({ ...editedGuestData, username: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 font-bold mb-1">Contraseña de Acceso (Default: ID)</label>
                        <input 
                          type="text" 
                          placeholder={editedGuestData.id}
                          value={editedGuestData.password || ""} 
                          onChange={e => setEditedGuestData({ ...editedGuestData, password: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={handleSaveEditedGuest}
                        className="px-4 py-2 bg-emerald-650 hover:bg-emerald-750 text-white font-bold text-xs rounded transition cursor-pointer shadow-2xs"
                      >
                        Confirmar Cambios
                      </button>
                      <button 
                        onClick={() => setIsEditingGuest(false)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Detailed view of Dossier
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider">Credenciales de Acceso App</h4>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                        <p className="text-xs text-slate-700"><strong>Usuario:</strong> <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{selectedGuest.username || selectedGuest.email}</span></p>
                        <p className="text-xs text-slate-700"><strong>Contraseña:</strong> <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{selectedGuest.password || selectedGuest.id}</span></p>
                      </div>

                      <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider">Acompañantes y Alergias</h4>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                        <p className="text-xs text-slate-700"><strong>Acompañantes ({selectedGuest.companions.length}):</strong></p>
                        {selectedGuest.companions.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic font-medium">Sin acompañantes registrados</p>
                        ) : (
                          selectedGuest.companions.map((comp, cidx) => (
                            <div key={comp.id || cidx} className="text-xs text-slate-600 border-b border-slate-100 pb-1.5 last:border-0 last:pb-0 font-medium">
                              <p className="font-bold text-slate-800">{comp.name} ({comp.relationship})</p>
                              <p className="text-[10px] text-amber-600 font-semibold">Requerimiento: {comp.requirements || "Ninguno"}</p>
                            </div>
                          ))
                        )}
                        
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-700"><strong>Alergias del Invitado:</strong></p>
                          <div className="flex flex-wrap gap-1 mt-1 font-bold">
                            {selectedGuest.allergies.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic font-medium">Ninguna declarada</span>
                            ) : (
                              selectedGuest.allergies.map((alg, aidx) => (
                                <span key={aidx} className="bg-rose-50 border border-rose-150 text-rose-700 text-[10px] px-2 py-0.5 rounded font-bold">
                                  {alg}
                                </span>
                              ))
                            )}
                          </div>
                          {selectedGuest.allergiesCustom && (
                            <p className="text-[11px] text-slate-500 mt-1.5 bg-white p-2 rounded border border-slate-150 italic font-medium">
                              "{selectedGuest.allergiesCustom}"
                            </p>
                          )}
                        </div>

                        <div className="pt-2">
                          <p className="text-xs text-slate-700"><strong>Requerimientos Especiales:</strong></p>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium font-medium">
                            {selectedGuest.specialRequirements || "Ninguno especificado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider">Itinerarios de Vuelo</h4>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Llegada (Hacia Sede)
                          </p>
                          {selectedGuest.flightArrival ? (
                            <div className="text-xs text-slate-600 mt-1 space-y-0.5 font-medium">
                              <p><strong>Vuelo:</strong> {selectedGuest.flightArrival.airline} {selectedGuest.flightArrival.flightNumber}</p>
                              <p><strong>Ruta:</strong> {selectedGuest.flightArrival.departureAirport} → {selectedGuest.flightArrival.arrivalAirport}</p>
                              <p><strong>Fecha/Hora:</strong> {formatDate(selectedGuest.flightArrival.arrivalDateTime)}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-rose-600 italic mt-1 font-semibold font-semibold">Vuelo de llegada no registrado</p>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Salida (Regreso)
                          </p>
                          {selectedGuest.flightDeparture ? (
                            <div className="text-xs text-slate-600 mt-1 space-y-0.5 font-medium">
                              <p><strong>Vuelo:</strong> {selectedGuest.flightDeparture.airline} {selectedGuest.flightDeparture.flightNumber}</p>
                              <p><strong>Ruta:</strong> {selectedGuest.flightDeparture.departureAirport} → {selectedGuest.flightDeparture.arrivalAirport}</p>
                              <p><strong>Fecha/Hora:</strong> {formatDate(selectedGuest.flightDeparture.departureDateTime)}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-rose-600 italic mt-1 font-semibold">Vuelo de salida no registrado</p>
                          )}
                        </div>

                        {/* Document Verification Mock */}
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-700 font-bold">Identificación Oficial (INE/Pasaporte)</p>
                          <div className="flex items-center gap-2 mt-2 bg-white p-2 rounded border border-slate-150 shadow-2xs">
                            <FileText className="w-5 h-5 text-sky-500" />
                            <div className="text-[10px]">
                              <p className="text-slate-800 font-bold">identificacion_oficial.jpg</p>
                              <p className="text-emerald-600 flex items-center gap-1 font-semibold">
                                <Check className="w-3 h-3" /> Legible (Validado por Staff)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider">Logística de Transporte & Actividades</h4>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
                        <div>
                          <p className="text-xs text-slate-700"><strong>Traslado Aeropuerto-Hotel Asignado:</strong></p>
                          {selectedGuest.assignedTransportId ? (
                            <div className="bg-white p-2 border border-slate-150 rounded mt-1">
                              <p className="text-[11px] text-slate-800 font-bold">{transportSlots.find(t => t.id === selectedGuest.assignedTransportId)?.description}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">ID: {selectedGuest.assignedTransportId}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-rose-600 italic mt-1 font-semibold font-semibold">Sin asignación de transporte sugerida</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-700"><strong>Inscripción a Actividades:</strong></p>
                          <div className="space-y-1.5 mt-1.5">
                            {selectedGuest.selectedActivities.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">No inscrito en actividades adicionales con cupo.</p>
                            ) : (
                              selectedGuest.selectedActivities.map(actId => {
                                const act = activities.find(a => a.id === actId);
                                return (
                                  <div key={actId} className="bg-white px-2 py-1.5 border border-slate-150 rounded flex items-center justify-between shadow-2xs">
                                    <span className="text-[11px] text-slate-700 truncate font-semibold">{act?.name}</span>
                                    <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 border border-emerald-150">Inscrito</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {selectedGuest.status !== GuestStatus.CANCELLED ? (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <p className="text-xs text-rose-600 font-semibold">Zona de Cancelaciones</p>
                            <button 
                              onClick={() => {
                                const reason = prompt("Especifica la razón de cancelación de asistencia para el expediente:");
                                if (reason !== null) {
                                  handleCancelAssistant(selectedGuest.id, reason || "Cancelado a solicitud de mesa directiva.");
                                }
                              }}
                              className="w-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 text-[11px] font-bold py-1.5 rounded transition cursor-pointer"
                            >
                              Dar de Baja / Cancelar Registro
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 bg-rose-50 border border-rose-150 rounded text-[11px] mt-2">
                            <p className="font-bold text-rose-600">Registro Cancelado</p>
                            <p className="text-slate-600 mt-1 font-medium"><strong>Por:</strong> {selectedGuest.cancelledBy} • {formatDate(selectedGuest.cancelledAt)}</p>
                            <p className="text-slate-500 font-medium"><strong>Motivo:</strong> {selectedGuest.cancellationReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* MASSIVE EXCEL/CSV SIMULATED IMPORT CARDS */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 space-y-4 shadow-sm">
              <h4 className="font-bold text-sm text-slate-850 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Carga Masiva de Invitados (Simulador Excel / CSV)
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Pega múltiples registros respetando el formato delimitado por comas. El sistema validará automáticamente duplicados de correo o ID para evitar confusiones operativas.
              </p>
              
              <div className="bg-slate-50 p-3 rounded border border-slate-150 space-y-2 text-[11px] text-slate-600 font-mono">
                <p className="text-slate-700 font-sans font-bold text-xs">Ejemplo de línea a copiar:</p>
                <p>ADI-9901,Ing. Raul Sanchez,raul.sanchez@dodge-mex.mx,Dodge Patriot Insurgentes,Asociado,1</p>
                <p>ADI-9902,Lic. Elena Rostova,elena@stellantis-bj.com,Stellantis Benito Juarez,Directora,2</p>
              </div>

              <textarea 
                rows={3}
                placeholder="Pega aquí tus filas de invitados del archivo Excel..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center justify-between">
                <button 
                  onClick={handleBulkImport}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded text-xs transition cursor-pointer shadow-2xs"
                >
                  Procesar Carga Masiva
                </button>
                {importStatus && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-150">{importStatus}</span>
                )}
              </div>
            </div>

            {/* GUEST DIRECTORY LIST TABLE */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <p className="font-bold text-sm text-slate-850">Listado Total de Invitados ({filteredGuests.length})</p>
                <span className="text-slate-400 text-xs italic font-medium">Clic en el registro para ver expediente</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50">
                      <th className="p-4">ID / Email</th>
                      <th className="p-4">Nombre Invitado</th>
                      <th className="p-4">Distribuidor/Agencia</th>
                      <th className="p-4">Etapa</th>
                      <th className="p-4">Acompañantes</th>
                      <th className="p-4">Estatus</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic font-medium">
                          No se encontraron invitados que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map(g => (
                        <tr 
                          key={g.id} 
                          onClick={() => setSelectedGuest(g)}
                          className={`border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition ${
                            selectedGuest?.id === g.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''
                          }`}
                        >
                          <td className="p-4">
                            <span className="font-mono text-slate-800 font-bold block">{g.id}</span>
                            <span className="text-slate-400 text-[10px] block font-medium">{g.email}</span>
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {g.name}
                            <span className="text-[10px] text-slate-400 block font-normal">{g.role}</span>
                          </td>
                          <td className="p-4 text-slate-650 font-bold">{g.distributor}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              g.stage === 1 ? 'bg-purple-50 text-purple-700 border border-purple-150' : 'bg-slate-100 text-slate-700'
                            }`}>
                              Etapa {g.stage}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{g.companions.length} acompañante(s)</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              g.status === GuestStatus.CONFIRMED ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                              g.status === GuestStatus.COMPLETE ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                              g.status === GuestStatus.CANCELLED ? 'bg-rose-50 text-rose-700 border border-rose-150' :
                              'bg-amber-50 text-amber-700 border border-amber-150'
                            }`}>
                              {g.status}
                            </span>
                          </td>
                          <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => setSelectedGuest(g)}
                                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer transition"
                              >
                                Ficha
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar el registro completo de ${g.name}? Esto es irreversible.`)) {
                                    DataStore.deleteGuest(g.id, "Staff - Juan", "staff@adistem.com.mx");
                                    onUpdate();
                                    setSelectedGuest(null);
                                  }
                                }}
                                className="p-1 text-rose-600 hover:text-rose-750 rounded hover:bg-rose-50 cursor-pointer transition"
                                title="Borrar invitado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
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
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Catálogo Maestro de Actividades</h3>
                <p className="text-xs text-slate-500 font-medium">Controla el cupo, listas de espera automáticas y bloqueos de edición de actividades recreativas del evento.</p>
              </div>
              <button 
                onClick={() => triggerVersionedDownload("Actividades_Maestras_Completo")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Exportar Reporte Proveedores
              </button>
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
                      <div className="text-[11px] flex items-center justify-between font-medium">
                        <span className="text-slate-500">Lista de Espera:</span>
                        <span className={`font-mono font-bold ${act.waitingList.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {act.waitingList.length} invitado(s) en espera
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
    </div>
  );
}
