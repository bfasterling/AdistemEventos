import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Users, Bed, Calendar, FileText, BarChart3, Settings, LogIn, Lock, Mail, 
  Search, Filter, Edit, Plus, Trash2, Download, Save, DollarSign, ListTodo, AlertTriangle, CheckCircle, RefreshCw
} from "lucide-react";
import * as XLSX from "xlsx";
import { DataStore } from "../dataStore";
import { Guest, HotelConfig, PortalUser, CustomCost, GuestStatus } from "../types";

export default function AdminPanel() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active navigation tab: 'dashboard' | 'hotels' | 'guests' | 'audits'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hotels' | 'guests' | 'audits'>('dashboard');

  // UI state messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filters state for guests list
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterGroup, setFilterGroup] = useState<string>("todos");
  const [filterHotel, setFilterHotel] = useState<string>("todos");
  const [filterType, setFilterType] = useState<string>("todos");

  // Selected guest for detail modal
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);

  // Guest modification state
  const [editHotel, setEditHotel] = useState<string>("");
  const [editRoomNumber, setEditRoomNumber] = useState<string>("");
  const [editType, setEditType] = useState<'VIP' | 'Convencionista' | 'Staff'>("Convencionista");
  const [editComments, setEditComments] = useState<string>("");
  
  // Custom charges in modal
  const [newChargeDesc, setNewChargeDesc] = useState<string>("");
  const [newChargeAmount, setNewChargeAmount] = useState<number>(0);
  const [customCharges, setCustomCharges] = useState<CustomCost[]>([]);

  // Hotel creation/edit states
  const [hotelName, setHotelName] = useState<string>("");
  const [costSencilla, setCostSencilla] = useState<number>(0);
  const [costSencilloExtra, setCostSencilloExtra] = useState<number>(0);
  const [costDoble, setCostDoble] = useState<number>(0);
  const [costDobleExtra, setCostDobleExtra] = useState<number>(0);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);

  // Lists from store
  const guests = DataStore.getGuests();
  const hotels = DataStore.getHotels();
  const users = DataStore.getUsers();
  const audits = DataStore.getAuditLogs();
  const config = DataStore.getEventConfig();

  const isReadOnly = currentUser?.role === "Staff";

  // Handle Admin/Staff authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

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
      setSuccessMsg(`Consola iniciada como ${foundUser.role} (${foundUser.email})`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setLoginError("Acceso denegado. Tu perfil de Invitado no tiene acceso a esta consola.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAdminEmail("");
    setAdminPassword("");
  };

  // Helper cost calculations
  const getGuestHotelCost = (g: Guest): number => {
    // Find assigned hotel config
    const hotelSedeName = g.hotelAlojamiento || config?.hotelSede || "Sin asignar";
    const hotel = hotels.find(h => h.name === hotelSedeName) || hotels[0];
    
    if (!hotel) return 0;

    let baseRate = hotel.costSencilla;
    const type = g.carnetTipoHabitacion || "Sencilla";
    if (type.includes("Sencillo Extra")) baseRate = hotel.costSencilloExtra;
    else if (type.includes("Sencillo") || type.includes("Sencilla")) baseRate = hotel.costSencilla;
    else if (type.includes("Doble Extra")) baseRate = hotel.costDobleExtra;
    else if (type.includes("Doble")) baseRate = hotel.costDoble;

    const nightlyRate = baseRate / 3;
    const additionalNights = g.nochesAdicionales || 0;
    const rooms = g.numHabitaciones || 1;
    return (baseRate + additionalNights * nightlyRate) * rooms;
  };

  const getGuestTotalCost = (g: Guest): number => {
    const hotelCost = getGuestHotelCost(g);
    const customSum = (g.costosAdicionales || []).reduce((sum, c) => sum + c.monto, 0);
    return hotelCost + customSum;
  };

  // Metrics calculators
  const stats = {
    totalGuests: guests.length,
    confirmedCount: guests.filter(g => g.status === GuestStatus.CONFIRMED || g.status === GuestStatus.COMPLETE).length,
    pendingFlights: guests.filter(g => !g.vueloLlegadaNoVuelo).length,
    totalHotelCost: guests.reduce((sum, g) => sum + getGuestHotelCost(g), 0),
    totalCustomCost: guests.reduce((sum, g) => sum + (g.costosAdicionales || []).reduce((s, c) => s + c.monto, 0), 0)
  };

  // Hotel manager handlers
  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      setErrorMsg("Error: Tu usuario tipo Staff es de sólo lectura.");
      return;
    }

    if (!hotelName.trim()) {
      setErrorMsg("El nombre de la sede es obligatorio.");
      return;
    }

    const hotelData: HotelConfig = {
      id: editingHotelId || `H-${Date.now()}`,
      name: hotelName.trim(),
      costSencilla: Number(costSencilla),
      costSencilloExtra: Number(costSencilloExtra),
      costDoble: Number(costDoble),
      costDobleExtra: Number(costDobleExtra)
    };

    if (editingHotelId) {
      DataStore.saveHotel(hotelData);
      setSuccessMsg(`Sede "${hotelName}" actualizada con éxito.`);
    } else {
      DataStore.addHotel(hotelData);
      setSuccessMsg(`Sede "${hotelName}" registrada con éxito.`);
    }

    // Reset fields
    setHotelName("");
    setCostSencilla(0);
    setCostSencilloExtra(0);
    setCostDoble(0);
    setCostDobleExtra(0);
    setEditingHotelId(null);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleEditHotelClick = (h: HotelConfig) => {
    if (isReadOnly) return;
    setEditingHotelId(h.id);
    setHotelName(h.name);
    setCostSencilla(h.costSencilla);
    setCostSencilloExtra(h.costSencilloExtra);
    setCostDoble(h.costDoble);
    setCostDobleExtra(h.costDobleExtra);
  };

  const handleDeleteHotel = (id: string, name: string) => {
    if (isReadOnly) return;
    if (confirm(`¿Estás seguro de eliminar la sede "${name}"? Se perderán las configuraciones asociadas.`)) {
      DataStore.deleteHotel(id);
      setSuccessMsg(`Sede "${name}" eliminada.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Guest inline edit modal open
  const handleOpenGuestModal = (g: Guest) => {
    setSelectedGuest(g);
    setEditHotel(g.hotelAlojamiento || config?.hotelSede || "Sin asignar");
    setEditRoomNumber(g.numeroHabitacion || "");
    setEditType(g.tipoHuesped || "Convencionista");
    setEditComments(g.comentariosAdmin || "");
    setCustomCharges(g.costosAdicionales || []);
    setIsGuestModalOpen(true);
  };

  const handleAddCustomCharge = () => {
    if (!newChargeDesc.trim() || newChargeAmount <= 0) return;
    const updated = [...customCharges, { description: newChargeDesc.trim(), monto: newChargeAmount }];
    setCustomCharges(updated);
    setNewChargeDesc("");
    setNewChargeAmount(0);
  };

  const handleRemoveCustomCharge = (idx: number) => {
    const updated = customCharges.filter((_, i) => i !== idx);
    setCustomCharges(updated);
  };

  const handleSaveGuestModal = () => {
    if (!selectedGuest) return;
    if (isReadOnly) {
      setErrorMsg("Error: Tu cuenta de Staff no tiene permisos de modificación.");
      return;
    }

    const updated: Guest = {
      ...selectedGuest,
      hotelAlojamiento: editHotel,
      numeroHabitacion: editRoomNumber,
      tipoHuesped: editType,
      comentariosAdmin: editComments,
      costosAdicionales: customCharges,
      updatedAt: new Date().toISOString(),
      auditHistory: [
        ...(selectedGuest.auditHistory || []),
        {
          timestamp: new Date().toISOString(),
          user: `Admin (${currentUser?.email})`,
          action: "Actualización de Logística Admin",
          details: `Asignado hotel: ${editHotel}, Habitación: ${editRoomNumber || "S/N"}, Tipo: ${editType}. Cargos extra: ${customCharges.length}.`
        }
      ]
    };

    DataStore.saveGuest(updated, currentUser?.role || "Admin", currentUser?.email || "admin@adistem.mx", true);
    setIsGuestModalOpen(false);
    setSuccessMsg(`Logística de ${selectedGuest.name} guardada.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Reset demo database helper
  const handleResetDB = () => {
    if (confirm("¿Estás seguro de restablecer por completo la base de datos a sus valores demo por defecto? Se perderán los registros nuevos.")) {
      DataStore.resetToDefault();
      setSuccessMsg("Base de datos de prueba re-inicializada con éxito.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // SheetJS Excel Export logic
  const handleExportToExcel = () => {
    // Generate clean flat array of guests
    const excelData = guests.map(g => {
      const companion = g.companions && g.companions.length > 0 ? g.companions[0] : null;
      const minorsCount = g.numMenores || 0;
      
      return {
        "ID Registro": g.id,
        "Titular Nombre": g.name,
        "Distribuidora / Agencia": g.distribuidora || g.distributor || "",
        "Grupo Corporativo": g.grupo || "Stellantis",
        "Teléfono": g.phone,
        "Email Titular": g.email,
        "Sexo Titular": g.sexo || "M",
        "Alergias Titular": g.alergiasTitular || "",
        "Acompañante Adulto": companion ? companion.name : "Ninguno",
        "Alergias Acompañante": companion ? companion.allergies : "",
        "No. Menores": minorsCount,
        "INE Cargada Titular": g.ineTitular ? "Sí" : "No",
        "INE Cargada Acompañante": g.ineAcompanante ? "Sí" : "No",
        "Habitaciones Reservadas": g.numHabitaciones || 1,
        "Configuración Cama": g.configuracionHabitacion || "King",
        "Tipo Carnet Habitación": g.carnetTipoHabitacion || "Sencilla",
        "Noches Adicionales": g.nochesAdicionales || 0,
        "Vuelo Llegada": g.vueloLlegadaNoVuelo ? `${g.vueloLlegadaAerolinea} ${g.vueloLlegadaNoVuelo}` : "Pendiente",
        "Fecha/Hora Llegada": g.vueloLlegadaFecha ? `${g.vueloLlegadaFecha} ${g.vueloLlegadaHora || ""}` : "Pendiente",
        "Vuelo Regreso": g.vueloRegresoNoVuelo ? `${g.vueloRegresoAerolinea} ${g.vueloRegresoNoVuelo}` : "Pendiente",
        "Fecha/Hora Regreso": g.vueloRegresoFecha ? `${g.vueloRegresoFecha} ${g.vueloRegresoHora || ""}` : "Pendiente",
        "Hotel Asignado Sede": g.hotelAlojamiento || config?.hotelSede || "Sin asignar",
        "No. Habitación Sede": g.numeroHabitacion || "S/N",
        "Tipo de Huésped": g.tipoHuesped || "Convencionista",
        "Costo Hospedaje Sede": getGuestHotelCost(g),
        "Costo Cargos Extra": (g.costosAdicionales || []).reduce((s, c) => s + c.monto, 0),
        "Costo Total General": getGuestTotalCost(g),
        "Comentarios Especiales": g.specialRequirements || "",
        "Comentarios Coordinación Admin": g.comentariosAdmin || "",
        "Estado de Registro": g.status,
        "Fecha de Registro": g.createdAt
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Padrón de Invitados");
    
    // Auto-fit column widths
    const max_len = excelData.reduce((prev: any, next: any) => {
      Object.keys(next).forEach((key, index) => {
        const val_len = next[key] ? String(next[key]).length : 10;
        prev[index] = Math.max(prev[index] || 10, val_len);
      });
      return prev;
    }, []);
    worksheet["!cols"] = max_len.map((w: number) => ({ w: w + 2 }));

    // Download file
    XLSX.writeFile(workbook, `Padron_Invitados_ADISTEM_2026_${new Date().toISOString().split('T')[0]}.xlsx`);
    setSuccessMsg("¡Archivo Excel .xlsx exportado con éxito!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Filtered guest list
  const filteredGuests = guests.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (g.distribuidora || g.distributor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (g.grupo || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchGroup = filterGroup === "todos" || g.grupo === filterGroup;
    const matchHotel = filterHotel === "todos" || (g.hotelAlojamiento || config?.hotelSede || "Sin asignar") === filterHotel;
    const matchType = filterType === "todos" || (g.tipoHuesped || "Convencionista") === filterType;

    return matchSearch && matchGroup && matchHotel && matchType;
  });

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 min-h-screen py-10 px-4 md:px-8 font-sans flex flex-col items-center justify-center" id="admin-panel-root">
      
      {/* SUCCESS & ERROR TOASTS */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 right-6 bg-emerald-500 text-white px-5 py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 z-50">
            <CheckCircle className="w-5 h-5" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 right-6 bg-rose-500 text-white px-5 py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 z-50">
            <AlertTriangle className="w-5 h-5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BRAND & ACCES CONTROL */}
      {!isLoggedIn ? (
        <div className="w-full max-w-md bg-slate-800 border border-slate-700/80 rounded-3xl shadow-2xl p-8 space-y-6" id="admin-login-card">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white">Consola de Control</h2>
            <p className="text-xs text-slate-400">Acceso exclusivo para personal de Staff y administradores de ADISTEM 2026.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo de Staff</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@fasterling.mx / staff@fasterling.mx"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-hidden focus:border-blue-500 text-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="admin / staff"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-hidden focus:border-blue-500 text-xs transition"
                />
              </div>
            </div>

            {loginError && <p className="text-rose-400 text-xs font-bold">{loginError}</p>}

            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar a Consola</span>
            </button>

            <div className="text-[10px] text-slate-500 text-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40 leading-relaxed">
              <strong>Demostración:</strong> Puedes usar <code className="text-slate-300">admin@fasterling.mx</code> con password <code className="text-slate-300">admin</code> para control total, o <code className="text-slate-300">staff@fasterling.mx</code> con password <code className="text-slate-300">staff</code> para visualizador de sólo lectura.
            </div>
          </form>
        </div>
      ) : (
        /* WORKSPACE CONSOLE */
        <div className="w-full max-w-7xl bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl flex flex-col md:flex-row items-stretch min-h-[600px] overflow-hidden" id="admin-workspace-card">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-64 bg-slate-900 p-6 flex flex-col justify-between border-r border-slate-700/60 shrink-0">
            <div className="space-y-8">
              {/* Brand Profile */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-sm tracking-widest text-white">AD</div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">CONSOLA ADISTEM</h3>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${isReadOnly ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                    Perfil: {currentUser?.role}
                  </p>
                </div>
              </div>

              {/* Navigation buttons */}
              <nav className="flex flex-col gap-1 text-xs font-bold text-slate-400">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard e Indicadores</span>
                </button>

                <button 
                  onClick={() => setActiveTab('hotels')}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'hotels' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <Bed className="w-4 h-4" />
                  <span>Sedes y Tarifas (CRUD)</span>
                </button>

                <button 
                  onClick={() => setActiveTab('guests')}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'guests' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <Users className="w-4 h-4" />
                  <span>Gestión de Invitados</span>
                </button>

                <button 
                  onClick={() => setActiveTab('audits')}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 transition cursor-pointer ${activeTab === 'audits' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Bitácora Auditoría</span>
                </button>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-4 pt-6 border-t border-slate-700/40">
              <button 
                onClick={handleResetDB}
                className="w-full py-2 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Restablece toda la base de datos de Firestore a sus valores por defecto."
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restablecer Demo</span>
              </button>

              <div className="text-[11px] text-slate-500 break-all">
                Conectado: {currentUser?.email}
              </div>

              <button 
                onClick={handleLogout}
                className="w-full py-2 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 rounded-lg font-bold text-[10px] uppercase tracking-widest transition cursor-pointer"
              >
                Cerrar Sesión Staff
              </button>
            </div>
          </aside>

          {/* MAIN CONTAINER PANEL */}
          <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
            
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">Dashboard de Logística Unificada</h2>
                  <p className="text-xs text-slate-400">Monitorea la asistencia, tarifas hoteleras de la convención y actividades recreativas.</p>
                </div>

                {/* KPI Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700/40 space-y-1 shadow-md">
                    <p className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider">Total Invitados</p>
                    <p className="text-2xl font-sans font-black text-white">{stats.totalGuests}</p>
                    <p className="text-[10px] text-slate-500 font-sans">En base de datos Firestore</p>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700/40 space-y-1 shadow-md">
                    <p className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider">Confirmados (App/Web)</p>
                    <p className="text-2xl font-sans font-black text-emerald-400">{stats.confirmedCount}</p>
                    <p className="text-[10px] text-emerald-600 font-sans">Listo para recibir</p>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700/40 space-y-1 shadow-md">
                    <p className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider">Hospedaje Estimado Sede</p>
                    <p className="text-2xl font-sans font-black text-blue-400">${stats.totalHotelCost.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-sans">Noches + Habitaciones</p>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700/40 space-y-1 shadow-md">
                    <p className="text-slate-400 font-sans font-bold uppercase text-[10px] tracking-wider">Vuelos Pendientes</p>
                    <p className="text-2xl font-sans font-black text-rose-400">{stats.pendingFlights}</p>
                    <p className="text-[10px] text-slate-500 font-sans">Falta cargar itinerarios</p>
                  </div>

                </div>

                {/* Sub audit logs list */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Historial de Operaciones Recientes</h3>
                  <div className="bg-slate-900 rounded-2xl border border-slate-700/40 overflow-hidden divide-y divide-slate-800 text-xs">
                    {audits.slice(0, 5).map((l, idx) => (
                      <div key={idx} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-300">{l.action}</p>
                          <p className="text-slate-500 text-[11px]">{l.details}</p>
                        </div>
                        <div className="text-right sm:text-right shrink-0">
                          <p className="font-bold text-slate-400">{l.userId}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{new Date(l.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: HOTELS CRUD */}
            {activeTab === 'hotels' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">Control de Sedes Hoteleras y Cuotas</h2>
                  <p className="text-xs text-slate-400">Define los costos de hospedaje por tipo de habitación por noche, aplicables para el cálculo automático.</p>
                </div>

                {/* CRUD FORM */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700/50 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-blue-500" />
                    {editingHotelId ? "Editar Sede" : "Registrar Nueva Sede"}
                  </h3>
                  
                  {isReadOnly && (
                    <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-300">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>Atención: Posees perfil de Staff (Sólo Lectura). El formulario está deshabilitado.</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveHotel} className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-medium">
                    <div className="md:col-span-2">
                      <label className="block text-slate-400 mb-1 font-bold">Nombre de la Sede</label>
                      <input 
                        type="text"
                        disabled={isReadOnly}
                        value={hotelName}
                        onChange={e => setHotelName(e.target.value)}
                        placeholder="Ej. Grand Fiesta Americana"
                        className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-hidden disabled:bg-slate-900 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">Tarifa Sencilla *</label>
                      <input 
                        type="number"
                        disabled={isReadOnly}
                        value={costSencilla}
                        onChange={e => setCostSencilla(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-hidden disabled:bg-slate-900 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">Sencilla Extra *</label>
                      <input 
                        type="number"
                        disabled={isReadOnly}
                        value={costSencilloExtra}
                        onChange={e => setCostSencilloExtra(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-hidden disabled:bg-slate-900 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">Doble *</label>
                      <input 
                        type="number"
                        disabled={isReadOnly}
                        value={costDoble}
                        onChange={e => setCostDoble(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold">Doble Extra *</label>
                      <input 
                        type="number"
                        disabled={isReadOnly}
                        value={costDobleExtra}
                        onChange={e => setCostDobleExtra(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-850 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="md:col-span-5 flex justify-end gap-3 pt-2">
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
                          className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                        >
                          Cancelar Edición
                        </button>
                      )}
                      <button 
                        type="submit"
                        disabled={isReadOnly}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>{editingHotelId ? "Guardar Cambios" : "Agregar Sede"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* HOTELS TABLE */}
                <div className="bg-slate-900 rounded-2xl border border-slate-700/40 overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
                        <th className="p-4 font-bold">Hotel Sede</th>
                        <th className="p-4 font-bold">Sencilla</th>
                        <th className="p-4 font-bold">Sencilla Extra</th>
                        <th className="p-4 font-bold">Doble</th>
                        <th className="p-4 font-bold">Doble Extra</th>
                        {!isReadOnly && <th className="p-4 font-bold text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {hotels.map(h => (
                        <tr key={h.id} className="hover:bg-slate-850/40">
                          <td className="p-4 font-bold text-white">{h.name}</td>
                          <td className="p-4 font-mono">${h.costSencilla.toLocaleString()} MXN</td>
                          <td className="p-4 font-mono">${h.costSencilloExtra.toLocaleString()} MXN</td>
                          <td className="p-4 font-mono">${h.costDoble.toLocaleString()} MXN</td>
                          <td className="p-4 font-mono">${h.costDobleExtra.toLocaleString()} MXN</td>
                          {!isReadOnly && (
                            <td className="p-4 flex justify-center gap-2">
                              <button 
                                onClick={() => handleEditHotelClick(h)}
                                className="p-1.5 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteHotel(h.id, h.name)}
                                className="p-1.5 bg-rose-950/50 text-rose-300 hover:text-white border border-rose-800/60 rounded-lg transition cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB 3: GUESTS MANAGEMENT */}
            {activeTab === 'guests' && (
              <div className="space-y-6">
                
                {/* Header controls & Export */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">Padrón de Invitados ADISTEM</h2>
                    <p className="text-xs text-slate-400">Verifica vuelos, asigna habitaciones e ingresa comentarios de control o cargos adicionales.</p>
                  </div>

                  <button 
                    onClick={handleExportToExcel}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Todo a Excel (.xlsx)</span>
                  </button>
                </div>

                {/* Lookups Filters block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-400 bg-slate-900 p-4 rounded-2xl border border-slate-700/40">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar por titular, email o agencia..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-850 border border-slate-750 rounded-xl text-slate-200 text-xs focus:outline-hidden focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <select 
                      value={filterGroup}
                      onChange={e => setFilterGroup(e.target.value)}
                      className="w-full p-2 bg-slate-850 border border-slate-750 rounded-xl text-slate-300"
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
                      className="w-full p-2 bg-slate-850 border border-slate-750 rounded-xl text-slate-300"
                    >
                      <option value="todos">Todos los Hoteles</option>
                      {hotels.map(h => (
                        <option key={h.id} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select 
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="w-full p-2 bg-slate-850 border border-slate-750 rounded-xl text-slate-300"
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

                {/* GUESTS TABLE */}
                <div className="bg-slate-900 rounded-2xl border border-slate-700/40 overflow-hidden text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-slate-400 border-b border-slate-700/50">
                          <th className="p-4 font-bold">Invitado Titular</th>
                          <th className="p-4 font-bold">Distribuidor / Grupo</th>
                          <th className="p-4 font-bold">Logística Sede</th>
                          <th className="p-4 font-bold">Acompañantes</th>
                          <th className="p-4 font-bold">Vuelo Ida / Regreso</th>
                          <th className="p-4 font-bold">Importe Total</th>
                          <th className="p-4 font-bold text-center">Detalles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {filteredGuests.map(g => {
                          const customCostSum = (g.costosAdicionales || []).reduce((s, c) => s + c.monto, 0);
                          const total = getGuestTotalCost(g);
                          
                          return (
                            <tr key={g.id} className="hover:bg-slate-850/30">
                              <td className="p-4">
                                <p className="font-bold text-white text-[13px] uppercase">{(g.name || "").toUpperCase()}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{g.email}</p>
                                <span className="bg-blue-900/40 border border-blue-800 text-blue-300 font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block">
                                  {g.tipoHuesped || "Convencionista"}
                                </span>
                              </td>
                              <td className="p-4 text-slate-300">
                                <p className="font-semibold text-white">{g.distribuidora || g.distributor || "ADISTEM"}</p>
                                <p className="text-[11px] text-slate-500">{g.grupo || "Stellantis"}</p>
                              </td>
                              <td className="p-4 text-slate-400 font-medium">
                                <p className="text-white text-[11px] font-bold">{g.hotelAlojamiento || config?.hotelSede || "Sin asignar"}</p>
                                <p className="text-[11px]">Habitación Sede: <strong className="text-slate-300">{g.numeroHabitacion || "S/N"}</strong></p>
                                <p className="text-[11px] font-mono text-slate-500">{g.carnetTipoHabitacion || "Sencilla"} ({g.configuracionHabitacion || "King"})</p>
                              </td>
                              <td className="p-4 font-medium text-slate-300">
                                <p className="text-slate-200">{g.nombreAcompanante ? `Adulto: ${g.nombreAcompanante}` : "Solo"}</p>
                                <p className="text-slate-500 text-[11px]">Menores: {g.numMenores || 0}</p>
                              </td>
                              <td className="p-4 text-slate-400 font-mono">
                                <p className="text-[11px] text-emerald-400 font-bold">{g.vueloLlegadaNoVuelo ? `Llegada: ${g.vueloLlegadaNoVuelo}` : "Ida: Pendiente"}</p>
                                <p className="text-[11px] text-blue-400 font-bold">{g.vueloRegresoNoVuelo ? `Salida: ${g.vueloRegresoNoVuelo}` : "Regreso: Pendiente"}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-white text-sm font-mono">${total.toLocaleString()}</p>
                                {customCostSum > 0 && <p className="text-[10px] text-slate-500 font-sans">+{customCostSum.toLocaleString()} cargos extra</p>}
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => handleOpenGuestModal(g)}
                                  className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl hover:bg-slate-750 transition cursor-pointer font-bold text-[11px] flex items-center justify-center gap-1 mx-auto"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{isReadOnly ? "Ver" : "Logística"}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredGuests.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      No se encontraron delegados que coincidan con la búsqueda o filtros aplicados.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 4: AUDIT LOGS */}
            {activeTab === 'audits' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider">Bitácora de Auditoría en Tiempo Real</h2>
                  <p className="text-xs text-slate-400">Verifica la traza completa de cambios, creaciones y logs generados tanto por personal de coordinación como por invitados.</p>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-700/40 overflow-hidden divide-y divide-slate-800 text-xs">
                  {audits.map((l, idx) => (
                    <div key={idx} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:bg-slate-850/20 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm">{l.action}</span>
                          <span className="bg-slate-800 text-slate-400 font-mono text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">ID: {l.id}</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{l.details}</p>
                      </div>
                      <div className="text-left md:text-right shrink-0">
                        <p className="font-bold text-blue-400">{l.userId}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{l.userEmail}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">{new Date(l.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </main>

        </div>
      )}

      {/* DETAIL LOGISTICS & COMMENTS GUEST MODAL */}
      <AnimatePresence>
        {isGuestModalOpen && selectedGuest && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="guest-edit-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 border border-slate-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-8 text-xs text-slate-200 flex flex-col"
            >
              
              {/* Header */}
              <div className="bg-slate-900 p-5 border-b border-slate-700/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Logística y Cuotas de Invitado</h3>
                  <p className="text-[11px] text-slate-400">Asigna habitaciones, hotel sede e introduce cargos extras para {selectedGuest.name}.</p>
                </div>
                <button 
                  onClick={() => setIsGuestModalOpen(false)}
                  className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 font-bold hover:text-white rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                
                {isReadOnly && (
                  <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Estás en modo de SÓLO LECTURA como personal de Staff. Los cambios no se guardarán.</span>
                  </div>
                )}

                {/* Sub-block logistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Hotel Alojamiento Sede</label>
                    <select 
                      disabled={isReadOnly}
                      value={editHotel}
                      onChange={e => setEditHotel(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500"
                    >
                      {hotels.map(h => (
                        <option key={h.id} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Número de Habitación</label>
                    <input 
                      type="text"
                      disabled={isReadOnly}
                      value={editRoomNumber}
                      onChange={e => setEditRoomNumber(e.target.value)}
                      placeholder="Ej. 1405"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Categoría Huésped</label>
                    <select 
                      disabled={isReadOnly}
                      value={editType}
                      onChange={e => setEditType(e.target.value as any)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500"
                    >
                      <option value="Distribuidores">Distribuidores</option>
                      <option value="VIP">VIP</option>
                      <option value="Planta">Planta</option>
                      <option value="Financiera">Financiera</option>
                      <option value="Externo">Externo</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                </div>

                {/* Additional custom charges */}
                <div className="space-y-3 border-t border-slate-700/50 pt-4">
                  <h4 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Cargos Adicionales de Control (Ej. Golf, tours extra, Spa)
                  </h4>
                  
                  {/* Add charges inline form */}
                  {!isReadOnly && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Descripción de Cargo</label>
                        <input 
                          type="text"
                          value={newChargeDesc}
                          onChange={e => setNewChargeDesc(e.target.value)}
                          placeholder="Ej. Green Fee Golf Extra"
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl focus:outline-hidden text-xs"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Monto ($)</label>
                        <input 
                          type="number"
                          value={newChargeAmount}
                          onChange={e => setNewChargeAmount(Number(e.target.value))}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl focus:outline-hidden text-xs"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleAddCustomCharge}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer flex items-center justify-center font-bold"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Charges table */}
                  <div className="bg-slate-900 rounded-xl divide-y divide-slate-800 overflow-hidden font-mono text-[11px]">
                    {customCharges.map((c, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center">
                        <span className="text-slate-300">{c.description}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">${c.monto.toLocaleString()} MXN</span>
                          {!isReadOnly && (
                            <button 
                              onClick={() => handleRemoveCustomCharge(idx)}
                              className="text-rose-400 hover:text-rose-300 p-0.5"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {customCharges.length === 0 && (
                      <div className="p-3 text-center text-slate-500 italic">No hay cargos extra registrados.</div>
                    )}
                  </div>
                </div>

                {/* Coordination Comments */}
                <div className="space-y-2 border-t border-slate-700/50 pt-4">
                  <label className="block text-slate-400 font-bold">Comentarios Internos de la Coordinación (Staff)</label>
                  <textarea 
                    disabled={isReadOnly}
                    value={editComments}
                    onChange={e => setEditComments(e.target.value)}
                    placeholder="Introduce notas sobre traslados, requerimientos VIP o de facturación."
                    rows={2}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Change History Traza */}
                <div className="space-y-2 border-t border-slate-700/50 pt-4 text-[10px]">
                  <p className="font-bold text-slate-400 uppercase tracking-widest">Historial de Auditoría del Invitado</p>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/30 font-mono space-y-1.5 max-h-32 overflow-y-auto">
                    {(selectedGuest.auditHistory || []).map((h, i) => (
                      <div key={i} className="text-slate-400">
                        <span className="text-blue-400 font-bold">[{new Date(h.timestamp).toLocaleDateString()}]</span>{' '}
                        <strong className="text-slate-300">{h.user}:</strong> {h.action} - {h.details}
                      </div>
                    ))}
                    {(selectedGuest.auditHistory || []).length === 0 && (
                      <div className="text-slate-600 text-center italic">Sin registros de auditoría anteriores.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer Save */}
              <div className="bg-slate-900 p-4 border-t border-slate-700/60 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setIsGuestModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveGuestModal}
                  disabled={isReadOnly}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
