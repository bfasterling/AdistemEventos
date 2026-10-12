import React, { useState, useEffect } from "react";
import { 
  Calendar, Bell, QrCode, LogOut, Key, Info, 
  Plane, MapPin, Bed, User, AlertCircle, Clock, 
  CheckCircle2, Compass, Sparkles, Building2, ShieldCheck, 
  Coffee, Users, HeartPulse
} from "lucide-react";
import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, EventConfig } from "../types";
import { DataStore } from "../dataStore";
import LogoConvencion from "../assets/images/Logo_convencion_reducido.png";

const isCapacitor = typeof window !== "undefined" && (
  !!(window as any).Capacitor || 
  window.location.protocol === "capacitor:" || 
  window.location.href.startsWith("capacitor://") ||
  navigator.userAgent.includes("Capacitor")
);

interface MobileAppProps {
  guests: Guest[];
  transportSlots: TransportSlot[];
  activities: Activity[];
  comms: CommMessage[];
  config: EventConfig;
  activeSimGuestId: string | null;
  onUpdate: () => void;
}

// Generate a deterministic SVG QR Code from any identifier string
function QrCodeSvg({ value, size = 160 }: { value: string; size?: number }) {
  // Simple deterministic 21x21 pseudo-matrix QR generator for visually accurate badge scanning
  const matrixSize = 21;
  const grid: boolean[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  // Helper to draw standard 7x7 QR corner finder patterns
  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[r0 + r][c0 + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, 14);
  drawFinder(14, 0);

  // Timing patterns
  for (let i = 8; i < 13; i++) {
    if (i % 2 === 0) {
      grid[6][i] = true;
      grid[i][6] = true;
    }
  }

  // Populate data area based on simple hash of string
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= 13;
      const inBottomLeft = r >= 13 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      if (r === 6 || c === 6) continue;

      // Seed pseudo-random cell state
      hash = (hash * 1664525 + 1013904223) >>> 0;
      grid[r][c] = (hash % 100) < 45;
    }
  }

  const cellSize = size / matrixSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto select-none">
      <rect width={size} height={size} fill="#ffffff" rx={8} />
      {grid.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function MobileApp({
  guests,
  transportSlots,
  activities,
  comms,
  config,
  activeSimGuestId
}: MobileAppProps) {
  // Session / Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Guest | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Read-only navigation tabs: 'itinerary' | 'agenda' | 'comms' | 'carnet'
  const [activeTab, setActiveTab] = useState<"itinerary" | "agenda" | "comms" | "carnet">("itinerary");
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(1);

  // Restore session from localStorage on mount or guests update
  useEffect(() => {
    const storedEmail = localStorage.getItem("adistem_session_email");
    if (storedEmail && !isLoggedIn && !activeSimGuestId && guests.length > 0) {
      const g = guests.find(g => g.email.toLowerCase() === storedEmail.toLowerCase() || g.id.toLowerCase() === storedEmail.toLowerCase());
      if (g) {
        setCurrentUser(g);
        setIsLoggedIn(true);
      }
    }
  }, [guests, isLoggedIn, activeSimGuestId]);

  // Sync to activeSimGuestId when selected from Backoffice simulator
  useEffect(() => {
    if (activeSimGuestId) {
      const g = guests.find(g => g.id === activeSimGuestId);
      if (g) {
        setCurrentUser(g);
        setIsLoggedIn(true);
        localStorage.setItem("adistem_session_email", g.email);
      }
    }
  }, [activeSimGuestId, guests]);

  // Sync live updates of current logged-in guest from database
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const g = guests.find(guest => guest.id === currentUser.id);
      if (g && JSON.stringify(g) !== JSON.stringify(currentUser)) {
        setCurrentUser(g);
      }
    }
  }, [guests, isLoggedIn, currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Por favor ingresa tu usuario y tu contraseña.");
      return;
    }

    const inputUserClean = loginEmail.toLowerCase().trim();
    const inputPassClean = loginPassword.trim();

    // 1. Search portal users (created from admin or credentials)
    const users = DataStore.getUsers();
    const foundUser = users.find(
      u => u.email.toLowerCase() === inputUserClean && u.password === inputPassClean
    );

    if (foundUser && foundUser.guestId) {
      const guest = guests.find(g => g.id === foundUser.guestId);
      if (guest) {
        setCurrentUser(guest);
        setIsLoggedIn(true);
        localStorage.setItem("adistem_session_email", guest.email);
        return;
      }
    }

    // 2. Search directly in guests (by email, username or carnet ID)
    const guest = guests.find(g => 
      g.email.toLowerCase() === inputUserClean || 
      (g.username && g.username.toLowerCase() === inputUserClean) ||
      g.id.toLowerCase() === inputUserClean ||
      ((g as any).carnetNumero && String((g as any).carnetNumero).toLowerCase() === inputUserClean)
    );

    if (!guest) {
      setLoginError("El usuario o carnet ingresado no se encuentra registrado.");
      return;
    }

    // Verify password (falls back to ID or carnetNumero case-insensitively)
    const expectedPassword = (guest.password || (guest as any).carnetNumero || guest.id).trim().toLowerCase();
    const providedPassword = inputPassClean.toLowerCase();

    if (expectedPassword !== providedPassword) {
      setLoginError("Contraseña incorrecta. Verifica con el comité organizador o staff.");
      return;
    }

    setCurrentUser(guest);
    setIsLoggedIn(true);
    localStorage.setItem("adistem_session_email", guest.email);
  };

  const handleLogout = () => {
    localStorage.removeItem("adistem_session_email");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginEmail("");
    setLoginPassword("");
    setActiveTab("itinerary");
  };

  // Date helper functions for multi-day convention agenda
  const getDaysArray = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return [1, 2, 3, 4];
    const start = new Date(startStr + "T00:00:00");
    const end = new Date(endStr + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return [1, 2, 3, 4];
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const count = Math.min(Math.max(diffDays, 1), 15);
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  const getDayDateLabel = (dayNum: number, startStr?: string) => {
    if (!startStr) return `Día ${dayNum}`;
    const start = new Date(startStr + "T00:00:00");
    if (isNaN(start.getTime())) return `Día ${dayNum}`;
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

  const normalizeDateStr = (s: string) => {
    if (!s) return "";
    const firstPart = s.split(/[T ]/)[0];
    const parts = firstPart.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return firstPart;
  };

  // Helper for flights display
  const formatDateTimeDisplay = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      }) + " hrs";
    } catch {
      return isoStr;
    }
  };

  // Get enrolled activities for current user
  const enrolledActivities = activities.filter(act => 
    currentUser?.selectedActivities?.includes(act.id)
  );

  // Get assigned transport slots
  const arrivalTransport = transportSlots.find(t => t.id === currentUser?.assignedTransportId);
  const departureTransport = transportSlots.find(t => t.id === currentUser?.assignedTransportDepartureId);

  return (
    <div className={isCapacitor ? "w-full h-full bg-white flex flex-col border-0 capacitor-safe-area" : "bg-slate-50 p-4 flex flex-col items-center justify-center min-h-screen border-l border-slate-100"} id="mobile-sim-wrapper">
      
      {/* PHONE EMULATOR CONTAINER */}
      <div className={isCapacitor ? "w-full h-full bg-white relative flex-1 flex flex-col min-h-0 border-0 rounded-none shadow-none overflow-hidden" : "w-[370px] h-[740px] bg-white rounded-[44px] border-[10px] border-slate-850 shadow-2xl relative overflow-hidden flex flex-col"} id="phone-frame">
        
        {/* Notch / Speaker bar */}
        {!isCapacitor && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-100 rounded-full z-50 flex items-center justify-between px-3">
            <div className="w-2 h-2 rounded-full bg-slate-350"></div>
            <div className="w-12 h-1 bg-slate-300 rounded"></div>
          </div>
        )}

        {/* StatusBar Row */}
        {!isCapacitor && (
          <div className="bg-white text-slate-800 px-5 pt-7 pb-2 flex justify-between text-[10px] font-bold tracking-wider select-none shrink-0 border-b border-slate-50">
            <span>09:41 AM (UTC)</span>
            <div className="flex gap-1.5 items-center">
              <span>5G</span>
              <div className="w-5 h-2.5 bg-slate-100 rounded-sm relative p-0.5 border border-slate-200">
                <div className="h-full bg-emerald-600 rounded-xs w-4"></div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN SCROLLABLE VIEWPORT */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white text-slate-800 flex flex-col text-sm relative" id="phone-screen">
          
          {!isLoggedIn ? (
            /* ================= PANTALLA DE ACCESO (LOGIN) ================= */
            <div className="flex-1 flex flex-col justify-between p-6 bg-white overflow-y-auto">
              <div className="space-y-6 pt-2">
                <div className="text-center space-y-2 flex flex-col items-center">
                  <div className="mb-2 p-2 bg-slate-50 border border-slate-150 rounded-2xl max-w-[220px]">
                    <img 
                      src={LogoConvencion} 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                      className="h-16 w-auto object-contain mx-auto" 
                      alt="Logo Convención" 
                    />
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-150 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Asistente ADISTEM
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight pt-1">Convención Anual 2026</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Aplicación oficial de consulta: Revisa tu itinerario, vuelos, habitación asignada, agenda y avisos del evento.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Usuario, Correo o No. Carnet:</label>
                    <input 
                      type="text" 
                      placeholder="ej: bernardo@fasterling.mx o ADI-1092"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-semibold transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Contraseña (o ID de Carnet):</label>
                    <input 
                      type="password" 
                      placeholder="ej: ADI-1092"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-semibold transition font-mono"
                    />
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-[11px] text-rose-700 font-medium flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    Iniciar Sesión
                  </button>
                </form>
              </div>

              {/* Login Help / Demo credentials */}
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-650 space-y-1.5 font-medium mt-4">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Credenciales de acceso:
                </p>
                <p>Ingresa con tu correo registrado o selecciona un invitado desde el panel de administración.</p>
                <div className="bg-white p-2 rounded border border-slate-150 font-mono text-[10px] text-slate-700">
                  <span>Demo: </span><strong className="text-blue-700">bernardo@fasterling.mx</strong><br/>
                  <span>Pass: </span><strong className="text-blue-700">ADI-1092</strong>
                </div>
              </div>
            </div>
          ) : (
            /* ================= INTERFAZ FIRMADA (100% CONSULTA) ================= */
            <div className="flex-1 min-h-0 flex flex-col bg-slate-50 overflow-hidden">
              
              {/* Header Superior con Usuario y Logout */}
              <div className="bg-white px-4 py-2.5 border-b border-slate-150 flex items-center justify-between gap-2 shrink-0 shadow-3xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img 
                    src={LogoConvencion} 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    className="h-10 w-auto object-contain max-w-[100px]" 
                    alt="Logo Convención" 
                  />
                  <div className="min-w-0">
                    <span className="text-[9px] text-blue-600 block font-bold uppercase tracking-wider leading-none mb-0.5 truncate">
                      {currentUser?.distributor || "ADISTEM"}
                    </span>
                    <p className="text-[11px] font-black text-slate-900 truncate leading-tight">
                      {currentUser?.name || `${currentUser?.nombreTitular || ""} ${currentUser?.apellidosTitular || ""}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition cursor-pointer shrink-0"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Contenedor Scrollable del Contenido Principal */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-4">
                
                {/* ================= PESTAÑA 1: MI ITINERARIO ================= */}
                {activeTab === "itinerary" && (
                  <div className="space-y-3.5">
                    
                    {/* Tarjeta de Hospedaje y Habitación */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-3xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5" />
                          Hospedaje & Sede
                        </span>
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-150">
                          Confirmado
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-900">
                          {currentUser?.hotelAlojamiento || "Rosewood Mandarina"}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Hotel Sede Oficial de la Convención</p>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Habitación Asignada</span>
                          {currentUser?.numeroHabitacion && currentUser.numeroHabitacion !== "No asignada" ? (
                            <div className="space-y-0.5">
                              <span className="text-xs font-black text-slate-900">No. {currentUser.numeroHabitacion}</span>
                              {currentUser.tipoHabitacion && (
                                <p className="text-[10px] font-bold text-blue-700">{currentUser.tipoHabitacion}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700">En asignación por el Staff</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Check-in</span>
                          <span className="text-[10px] font-extrabold text-slate-700">15:00 hrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta de Vuelos Registrados */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-3xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5" />
                          Vuelos Registrados
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">Itinerario Aéreo</span>
                      </div>

                      {/* Vuelo Llegada */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-extrabold">
                          <span className="text-slate-500 uppercase">Llegada a la Sede</span>
                          <span className="text-indigo-600 font-mono">
                            {currentUser?.flightArrival?.airline || ""} {currentUser?.flightArrival?.flightNumber || ""}
                          </span>
                        </div>
                        {currentUser?.flightArrival?.flightNumber ? (
                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-0.5">
                            <div>
                              <span className="text-[8px] text-slate-400 block font-bold">Origen</span>
                              <span className="font-bold text-slate-800">{currentUser.flightArrival.departureAirport || "N/A"}</span>
                              <span className="text-[9px] text-slate-500 block">{formatDateTimeDisplay(currentUser.flightArrival.departureDateTime)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 block font-bold">Destino Sede</span>
                              <span className="font-bold text-slate-800">{currentUser.flightArrival.arrivalAirport || "N/A"}</span>
                              <span className="text-[9px] text-slate-500 block">{formatDateTimeDisplay(currentUser.flightArrival.arrivalDateTime)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">Sin vuelo de llegada registrado en el sistema.</p>
                        )}
                      </div>

                      {/* Vuelo Regreso */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-extrabold">
                          <span className="text-slate-500 uppercase">Vuelo de Regreso</span>
                          <span className="text-indigo-600 font-mono">
                            {currentUser?.flightDeparture?.airline || ""} {currentUser?.flightDeparture?.flightNumber || ""}
                          </span>
                        </div>
                        {currentUser?.flightDeparture?.flightNumber ? (
                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-0.5">
                            <div>
                              <span className="text-[8px] text-slate-400 block font-bold">Salida Sede</span>
                              <span className="font-bold text-slate-800">{currentUser.flightDeparture.departureAirport || "N/A"}</span>
                              <span className="text-[9px] text-slate-500 block">{formatDateTimeDisplay(currentUser.flightDeparture.departureDateTime)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 block font-bold">Destino Final</span>
                              <span className="font-bold text-slate-800">{currentUser.flightDeparture.arrivalAirport || "N/A"}</span>
                              <span className="text-[9px] text-slate-500 block">{formatDateTimeDisplay(currentUser.flightDeparture.arrivalDateTime)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">Sin vuelo de regreso registrado en el sistema.</p>
                        )}
                      </div>
                    </div>

                    {/* Tarjeta de Traslados Terrestres */}
                    {(arrivalTransport || departureTransport || currentUser?.assignedTransportId) && (
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-3xs space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" />
                          Traslados & Logística Terrestre
                        </span>

                        {arrivalTransport && (
                          <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-150 text-[10px] space-y-0.5">
                            <span className="font-extrabold text-emerald-800 block">Aeropuerto ➔ Hotel Sede</span>
                            <p className="text-slate-700 font-medium">Horario de salida: <strong>{formatDateTimeDisplay(arrivalTransport.dateTime)}</strong></p>
                            <p className="text-[9px] text-slate-500">{arrivalTransport.description || arrivalTransport.route}</p>
                          </div>
                        )}

                        {departureTransport && (
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-150 text-[10px] space-y-0.5">
                            <span className="font-extrabold text-slate-800 block">Hotel Sede ➔ Aeropuerto</span>
                            <p className="text-slate-700 font-medium">Horario de salida: <strong>{formatDateTimeDisplay(departureTransport.dateTime)}</strong></p>
                            <p className="text-[9px] text-slate-500">{departureTransport.description || departureTransport.route}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actividades en las que se registró */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-3xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-teal-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mis Actividades Confirmadas
                        </span>
                        <span className="text-[9px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-150">
                          {enrolledActivities.length} registradas
                        </span>
                      </div>

                      {enrolledActivities.length === 0 ? (
                        <div className="py-4 text-center space-y-1">
                          <p className="text-[11px] text-slate-400 font-medium italic">
                            No tienes actividades recreativas personalizadas registradas por el momento.
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Revisa la pestaña "Agenda" para consultar todas las actividades del evento.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {enrolledActivities.map(act => (
                            <div key={act.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] font-extrabold bg-teal-100/60 text-teal-800 px-1.5 py-0.5 rounded">
                                  {act.category || "Recreativa"}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {formatDateTimeDisplay(act.dateTime)}
                                </span>
                              </div>
                              <h5 className="font-extrabold text-xs text-slate-900">{act.name}</h5>
                              <p className="text-[10px] text-slate-550 leading-normal font-medium">{act.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resumen de Acompañantes si tiene */}
                    {currentUser?.companions && currentUser.companions.length > 0 && (
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-150 shadow-3xs space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          Acompañantes Registrados
                        </span>
                        <div className="space-y-1.5">
                          {currentUser.companions.map((comp, idx) => (
                            <div key={comp.id || idx} className="p-2 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between text-[10px]">
                              <div>
                                <span className="font-black text-slate-800 block">{comp.name}</span>
                                <span className="text-slate-500 text-[9px]">{comp.relationship || "Acompañante"}</span>
                              </div>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
                                Confirmado
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alergias o Restricciones */}
                    {((currentUser?.allergies && currentUser.allergies.length > 0) || currentUser?.allergiesCustom) && (
                      <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/60 text-[10px] space-y-1">
                        <span className="font-black text-amber-900 uppercase text-[9px] flex items-center gap-1">
                          <HeartPulse className="w-3 h-3 text-amber-700" />
                          Restricciones Alimenticias Registradas
                        </span>
                        <p className="text-slate-700 font-medium">
                          {currentUser?.allergies?.join(", ")}
                          {currentUser?.allergiesCustom ? ` • ${currentUser.allergiesCustom}` : ""}
                        </p>
                      </div>
                    )}

                  </div>
                )}

                {/* ================= PESTAÑA 2: AGENDA ================= */}
                {activeTab === "agenda" && (
                  <div className="space-y-3.5">
                    {(() => {
                      const daysArray = getDaysArray(config.eventStartDate, config.eventEndDate);
                      const activeMobileDay = daysArray.includes(selectedMobileDay) ? selectedMobileDay : (daysArray[0] || 1);

                      const daysList = config.daysConfig || [];
                      const dayObj = daysList.find(d => d.dayNumber === activeMobileDay);

                      // Match agenda items configured in the admin for this day
                      const dayGeneralAgenda = (config.agenda || []).filter(item => {
                        if (!item) return false;
                        const dayText = (item.day || "").toLowerCase().trim();
                        const targetDay1 = `día ${activeMobileDay}`;
                        const targetDay2 = `dia ${activeMobileDay}`;
                        if (dayText === targetDay1 || dayText === targetDay2) return true;
                        if (dayText.includes(targetDay1) || dayText.includes(targetDay2)) return true;
                        if (dayText === String(activeMobileDay)) return true;
                        if (dayObj) {
                          if (dayObj.date && dayText.includes(dayObj.date.toLowerCase().trim())) return true;
                          if (dayObj.calendarDate && dayText.includes(dayObj.calendarDate.toLowerCase().trim())) return true;
                        }
                        return false;
                      });

                      const hasConfiguredDayInfo = !!(dayObj && (
                        (dayObj.title && dayObj.title.trim() && !dayObj.title.startsWith("Actividades del Día") && !dayObj.title.startsWith("Día ")) ||
                        (dayObj.description && dayObj.description.trim() && !dayObj.description.startsWith("Descripción general")) ||
                        (dayObj.notes && dayObj.notes.trim())
                      ));

                      return (
                        <div className="space-y-3.5">
                          {/* Selector de Días */}
                          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl" id="mobile-day-tabs">
                            {daysArray.map(dayNum => {
                              const existingDay = config.daysConfig?.find(d => d.dayNumber === dayNum);
                              const displayDate = existingDay?.date?.trim()
                                ? (existingDay.date.includes(" de ") 
                                    ? existingDay.date.split(" de ")[0] + " " + (existingDay.date.split(" de ")[1] ? existingDay.date.split(" de ")[1].substring(0,3) : "")
                                    : existingDay.date)
                                : (config.eventStartDate ? getDayDateLabel(dayNum, config.eventStartDate).split(" de ")[0] : `Día ${dayNum}`);
                              return (
                                <button
                                  key={dayNum}
                                  onClick={() => setSelectedMobileDay(dayNum)}
                                  className={`flex-1 min-w-[55px] py-1.5 flex flex-col items-center justify-center rounded-lg transition cursor-pointer ${
                                    activeMobileDay === dayNum 
                                      ? "bg-blue-600 text-white shadow-2xs font-bold" 
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  <span className="text-[10px] font-black uppercase">Día {dayNum}</span>
                                  {displayDate && displayDate !== `Día ${dayNum}` && (
                                    <span className={`text-[9px] font-medium leading-none ${activeMobileDay === dayNum ? 'text-white/80' : 'text-slate-400'}`}>{displayDate}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Notas / Concepto del Día configurado en el Admin (Solo si fue configurado) */}
                          {hasConfiguredDayInfo && dayObj && (
                            <div className="bg-amber-50/70 border border-amber-250/70 p-3.5 rounded-2xl space-y-1.5 shadow-3xs">
                              {dayObj.title && dayObj.title.trim() && !dayObj.title.startsWith("Actividades del Día") && (
                                <h5 className="font-black text-xs text-slate-900">{dayObj.title}</h5>
                              )}
                              {dayObj.description && dayObj.description.trim() && !dayObj.description.startsWith("Descripción general") && (
                                <p className="text-[10px] text-slate-600 leading-normal font-medium">{dayObj.description}</p>
                              )}
                              {dayObj.notes && dayObj.notes.trim() && (
                                <div className="text-[10px] text-amber-950 font-bold bg-amber-100/60 p-2.5 rounded-xl leading-relaxed mt-1">
                                  <span className="text-[8px] text-amber-800 uppercase tracking-widest block mb-0.5 font-extrabold">NOTAS & RECOMENDACIONES:</span>
                                  {dayObj.notes}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Lista de Actividades de la Agenda Oficial del Admin */}
                          <div className="space-y-2">
                            {dayGeneralAgenda.length === 0 ? (
                              <div className="p-6 bg-white rounded-2xl border border-slate-150 text-center space-y-1.5">
                                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                                <p className="text-xs text-slate-500 font-semibold">Sin actividades en la agenda para este día</p>
                              </div>
                            ) : (
                              dayGeneralAgenda.map((item, idx) => (
                                <div key={idx} className="p-3 bg-white border border-slate-150 rounded-2xl shadow-3xs flex gap-3 items-start">
                                  {item.time && (
                                    <div className="shrink-0 bg-blue-50 border border-blue-150 text-blue-700 px-2.5 py-1.5 rounded-xl text-center min-w-[75px]">
                                      <span className="text-[10px] font-black block leading-tight font-mono">{item.time}</span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 text-xs leading-snug">{item.title}</p>
                                    {item.description && (
                                      <p className="text-slate-600 font-medium text-[10px] mt-1 leading-relaxed">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ================= PESTAÑA 3: AVISOS Y COMUNICADOS ================= */}
                {activeTab === "comms" && (
                  <div className="space-y-3.5">
                    <div className="border-b border-slate-150 pb-2">
                      <h4 className="font-black text-xs text-slate-900">Avisos y Comunicados Oficiales</h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Notificaciones, avisos de logística y cambios enviados por el Comité Organizador.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {comms.length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                          <p className="text-xs text-slate-400 italic">No hay avisos publicados por el momento.</p>
                        </div>
                      ) : (
                        comms.map(msg => (
                          <div key={msg.id} className="p-3.5 bg-white rounded-2xl border border-slate-150 space-y-1.5 shadow-3xs">
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                              <span className="text-blue-600 uppercase tracking-wider">Staff ADISTEM</span>
                              <span>Oficial</span>
                            </div>
                            <p className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                              <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              {msg.subject}
                            </p>
                            <p className="text-[11px] text-slate-650 leading-relaxed font-medium">
                              {msg.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ================= PESTAÑA 4: MI CARNET DIGITAL CON QR ================= */}
                {activeTab === "carnet" && (
                  <div className="space-y-3.5">
                    <div className="border-b border-slate-150 pb-2 text-center">
                      <h4 className="font-black text-xs text-slate-900">Acreditación Oficial Digital</h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Presenta este carnet digital para acceder a los salones, comidas y eventos.
                      </p>
                    </div>

                    {/* Tarjeta Visual de Carnet */}
                    <div className="bg-gradient-to-b from-blue-900 via-blue-950 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-blue-800 space-y-4 text-center relative overflow-hidden">
                      {/* Decorative background glow */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest text-blue-300 font-extrabold block">
                          CONVENCIÓN ANUAL ADISTEM 2026
                        </span>
                        <h3 className="text-base font-black text-white leading-tight">
                          {currentUser?.name || `${currentUser?.nombreTitular || ""} ${currentUser?.apellidosTitular || ""}`}
                        </h3>
                        <p className="text-xs text-blue-200 font-semibold">{currentUser?.distributor || "ADISTEM"}</p>
                        <span className="inline-block mt-1 bg-white/10 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20">
                          {currentUser?.role || currentUser?.tipoHuesped || "Distribuidor Asociado"}
                        </span>
                      </div>

                      {/* QR Code Container */}
                      <div className="bg-white p-3 rounded-2xl shadow-inner max-w-[190px] mx-auto border-4 border-blue-400/30">
                        <QrCodeSvg value={`ADISTEM-${currentUser?.id || "CONV2026"}-${(currentUser as any)?.carnetNumero || "001"}`} size={160} />
                        <span className="block mt-2 font-mono text-[10px] font-black text-slate-800 tracking-wider">
                          {(currentUser as any)?.carnetNumero || currentUser?.id || "ADI-2026"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left bg-white/5 p-3 rounded-2xl border border-white/10 text-[10px]">
                        <div>
                          <span className="text-[8px] text-blue-300 block font-bold uppercase">Sede & Hotel</span>
                          <span className="font-extrabold text-white truncate block">
                            {currentUser?.hotelAlojamiento || "Rosewood"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-blue-300 block font-bold uppercase">Habitación</span>
                          <span className="font-extrabold text-emerald-400 block">
                            {currentUser?.numeroHabitacion && currentUser.numeroHabitacion !== "No asignada" ? `No. ${currentUser.numeroHabitacion}` : "En asignación"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-bold pt-1">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Acreditado Oficialmente</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* BARRA DE NAVEGACIÓN INFERIOR (BOTTOM TAB BAR) */}
              <div className="bg-white border-t border-slate-150 p-2 grid grid-cols-4 gap-1 text-[10px] text-center select-none shrink-0 shadow-lg" id="phone-bottom-bar">
                
                <button 
                  onClick={() => setActiveTab("itinerary")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-xl ${
                    activeTab === "itinerary" ? "text-blue-600 font-black bg-blue-50/80" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span className="text-[9px]">Mi Itinerario</span>
                </button>

                <button 
                  onClick={() => setActiveTab("agenda")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-xl ${
                    activeTab === "agenda" ? "text-blue-600 font-black bg-blue-50/80" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-[9px]">Agenda</span>
                </button>

                <button 
                  onClick={() => setActiveTab("comms")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-xl relative ${
                    activeTab === "comms" ? "text-blue-600 font-black bg-blue-50/80" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <div className="relative">
                    <Bell className="w-4 h-4" />
                    {comms.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                    )}
                  </div>
                  <span className="text-[9px]">Avisos</span>
                </button>

                <button 
                  onClick={() => setActiveTab("carnet")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-xl ${
                    activeTab === "carnet" ? "text-blue-600 font-black bg-blue-50/80" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-[9px]">Mi Carnet</span>
                </button>

              </div>

            </div>
          )}

        </div>

        {/* Home Indicator line */}
        {!isCapacitor && (
          <div className="h-4 bg-white flex items-center justify-center shrink-0 pb-1 select-none border-t border-slate-50">
            <div className="w-32 h-1 bg-slate-200 rounded-full"></div>
          </div>
        )}

      </div>

      {!isCapacitor && (
        <div className="text-center text-[11px] text-slate-500 max-w-xs mt-3 space-y-1 leading-normal" id="simulator-info">
          <p className="font-bold text-slate-700">App Móvil ADISTEM (iOS & Android)</p>
          <p>Modo consulta e itinerario: Hotel y habitación asignada, vuelos, agenda diaria, avisos del admin y carnet digital con QR.</p>
        </div>
      )}

    </div>
  );
}
