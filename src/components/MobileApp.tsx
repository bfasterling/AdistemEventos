import React, { useState, useEffect } from "react";
import { 
  Smartphone, ShieldAlert, Sparkles, AlertCircle, Plane, Check, 
  Trash2, UserPlus, UploadCloud, Bus, Award, Calendar, Bell, 
  ChevronRight, LogOut, Loader2, Key, Info, HelpCircle
} from "lucide-react";
import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, EventConfig } from "../types";
import { DataStore } from "../dataStore";

interface MobileAppProps {
  guests: Guest[];
  transportSlots: TransportSlot[];
  activities: Activity[];
  comms: CommMessage[];
  config: EventConfig;
  activeSimGuestId: string | null;
  onUpdate: () => void;
}

export default function MobileApp({
  guests,
  transportSlots,
  activities,
  comms,
  config,
  activeSimGuestId,
  onUpdate
}: MobileAppProps) {
  // Session / Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Guest | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginError, setLoginError] = useState("");

  // Wizards & Tabs Navigation inside phone
  const [wizardStep, setWizardStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"wizard" | "agenda" | "comms" | "cancel">("wizard");

  // Local Wizard Forms State
  const [assistanceConfirm, setAssistanceConfirm] = useState<boolean | null>(null);
  const [wizardData, setWizardData] = useState({
    distributor: "",
    phone: "",
    role: "Distribuidor Asociado",
    allergies: [] as string[],
    allergiesCustom: "",
    specialRequirements: "",
    companions: [] as Array<{ id: string, name: string, relationship: string, allergies: string, requirements: string }>
  });

  // Companion Subform state
  const [newCompanion, setNewCompanion] = useState({ name: "", relationship: "Cónyuge", allergies: "", requirements: "" });

  // Identification Upload State
  const [idFileSelected, setIdFileSelected] = useState<boolean>(false);
  const [idFileName, setIdFileName] = useState<string>("");
  const [extractedFaceUrl, setExtractedFaceUrl] = useState<string>("");
  const [idUploading, setIdUploading] = useState<boolean>(false);

  // Flight Upload & Gemini AI Assistance State
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");
  const [flightInbound, setFlightInbound] = useState({
    airline: "",
    flightNumber: "",
    departureAirport: "",
    departureDateTime: "",
    arrivalAirport: "",
    arrivalDateTime: "",
    manualValid: true
  });
  const [flightOutbound, setFlightOutbound] = useState({
    airline: "",
    flightNumber: "",
    departureAirport: "",
    departureDateTime: "",
    arrivalAirport: "",
    arrivalDateTime: "",
    manualValid: true
  });

  // Transport change State
  const [transportSelectedId, setTransportSelectedId] = useState("");

  // Status message
  const [wizardSuccessMessage, setWizardSuccessMessage] = useState("");
  const [wizardErrorMessage, setWizardErrorMessage] = useState("");

  // Sync to activeSimGuestId when selected from Backoffice
  useEffect(() => {
    if (activeSimGuestId) {
      const g = guests.find(g => g.id === activeSimGuestId);
      if (g) {
        setCurrentUser(g);
        setIsLoggedIn(true);
        loadGuestData(g);
      }
    }
  }, [activeSimGuestId, guests]);

  // Sync current logged-in guest with live Firestore updates
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const g = guests.find(guest => guest.id === currentUser.id);
      if (g && JSON.stringify(g) !== JSON.stringify(currentUser)) {
        setCurrentUser(g);
      }
    }
  }, [guests, isLoggedIn, currentUser]);

  const loadGuestData = (g: Guest) => {
    setAssistanceConfirm(g.status !== GuestStatus.CANCELLED ? true : false);
    setWizardData({
      distributor: g.distributor || "",
      phone: g.phone || "",
      role: g.role || "Distribuidor Asociado",
      allergies: g.allergies || [],
      allergiesCustom: g.allergiesCustom || "",
      specialRequirements: g.specialRequirements || "",
      companions: g.companions || []
    });
    if (g.flightArrival) setFlightInbound({ ...g.flightArrival, manualValid: true });
    if (g.flightDeparture) setFlightOutbound({ ...g.flightDeparture, manualValid: true });
    setTransportSelectedId(g.assignedTransportId || "");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim()) {
      setLoginError("Por favor ingresa tu correo electrónico.");
      return;
    }

    const emailClean = loginEmail.toLowerCase().trim();
    // Search guest
    const guest = guests.find(g => g.email.toLowerCase() === emailClean);

    if (!guest) {
      // Allow instant register/login for demonstration
      setLoginError("El correo electrónico no se encuentra registrado en el padrón de ADISTEM. Puedes registrarte en el Backoffice.");
      return;
    }

    setCurrentUser(guest);
    setIsLoggedIn(true);
    loadGuestData(guest);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginEmail("");
    setWizardStep(1);
    setActiveTab("wizard");
  };

  // Companion Management
  const handleAddCompanion = () => {
    if (!newCompanion.name.trim()) return;
    const item = {
      id: "c-" + Math.random().toString(36).substring(2, 6),
      name: newCompanion.name,
      relationship: newCompanion.relationship,
      allergies: newCompanion.allergies || "Ninguna",
      requirements: newCompanion.requirements || "Ninguno"
    };

    const updatedComps = [...wizardData.companions, item];
    setWizardData({ ...wizardData, companions: updatedComps });
    setNewCompanion({ name: "", relationship: "Cónyuge", allergies: "", requirements: "" });
  };

  const handleRemoveCompanion = (id: string) => {
    const filtered = wizardData.companions.filter(c => c.id !== id);
    setWizardData({ ...wizardData, companions: filtered });
  };

  // Toggle allergies checklist
  const toggleAllergy = (allergy: string) => {
    const list = [...wizardData.allergies];
    if (list.includes(allergy)) {
      setWizardData({ ...wizardData, allergies: list.filter(a => a !== allergy) });
    } else {
      list.push(allergy);
      setWizardData({ ...wizardData, allergies: list });
    }
  };

  // Simulated Document upload
  const simulateIdUpload = () => {
    setIdUploading(true);
    setTimeout(() => {
      setIdFileSelected(true);
      setIdFileName("ine_stellantis_mex.jpg");
      // Simulated avatar generation from passport
      setExtractedFaceUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200");
      setIdUploading(false);
    }, 1500);
  };

  // Gemini Flight extraction
  const simulateGeminiFlightExtraction = (type: "arrival" | "departure") => {
    setAiExtracting(true);
    setAiSuccessMessage("");
    
    // We will call our back-end API using mock itineraries for maximum authenticity!
    const sampleItineraries = {
      arrival: "AEROMEXICO FLIGHT AM504 DEPARTING MEXICO CITY (MEX) ON OCT 15, 2026 AT 09:15 AM ARRIVING CANCUN (CUN) AT 11:30 AM. CLASS T. RECORD CODE XYZ123.",
      departure: "VOLARIS FLIGHT Y4719 DEPARTING CANCUN (CUN) ON OCT 18, 2026 AT 18:00 PM ARRIVING MEXICO CITY (MEX) AT 20:25 PM. BOARDING PASS INCLUDED."
    };

    const textContent = type === "arrival" ? sampleItineraries.arrival : sampleItineraries.departure;

    fetch("/api/extract-flight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textContent })
    })
    .then(res => res.json())
    .then(resData => {
      setAiExtracting(false);
      if (resData.success && resData.data) {
        const data = resData.data;
        if (type === "arrival") {
          setFlightInbound({
            airline: data.airline || "Aeroméxico",
            flightNumber: data.flightNumber || "AM504",
            departureAirport: data.departureAirport || "MEX",
            departureDateTime: data.departureDateTime || "2026-10-15T09:15",
            arrivalAirport: data.arrivalAirport || "CUN",
            arrivalDateTime: data.arrivalDateTime || "2026-10-15T11:30",
            manualValid: true
          });
          setAiSuccessMessage("✨ Itinerario de Llegada leído con éxito con Inteligencia Artificial Gemini.");
        } else {
          setFlightOutbound({
            airline: data.airline || "Volaris",
            flightNumber: data.flightNumber || "Y4719",
            departureAirport: data.departureAirport || "CUN",
            departureDateTime: data.departureDateTime || "2026-10-18T18:00",
            arrivalAirport: data.arrivalAirport || "MEX",
            arrivalDateTime: data.arrivalDateTime || "2026-10-18T20:25",
            manualValid: true
          });
          setAiSuccessMessage("✨ Itinerario de Salida leído con éxito con Inteligencia Artificial Gemini.");
        }
        setTimeout(() => setAiSuccessMessage(""), 4000);
      } else {
        alert("No se pudo obtener lectura de la API. Aplicando valores predeterminados seguros.");
      }
    })
    .catch(err => {
      setAiExtracting(false);
      console.error(err);
      // Fallback
      if (type === "arrival") {
        setFlightInbound({
          airline: "Aeromexico",
          flightNumber: "AM504",
          departureAirport: "MEX",
          departureDateTime: "2026-10-15T09:15",
          arrivalAirport: "CUN",
          arrivalDateTime: "2026-10-15T11:30",
          manualValid: true
        });
      } else {
        setFlightOutbound({
          airline: "Volaris",
          flightNumber: "Y4719",
          departureAirport: "CUN",
          departureDateTime: "2026-10-18T18:00",
          arrivalAirport: "MEX",
          arrivalDateTime: "2026-10-18T20:25",
          manualValid: true
        });
      }
      setAiSuccessMessage("Lectura asistida completada.");
    });
  };

  // Submit whole Wizard
  const handleWizardSubmit = () => {
    if (!currentUser) return;
    setWizardErrorMessage("");
    setWizardSuccessMessage("");

    // Form validations
    if (!wizardData.distributor.trim()) {
      setWizardErrorMessage("El Distribuidor Stellantis/Agencia es un campo obligatorio.");
      return;
    }
    if (!wizardData.phone.trim()) {
      setWizardErrorMessage("El teléfono celular es requerido para emergencias.");
      return;
    }

    const updatedGuest: Guest = {
      ...currentUser,
      status: assistanceConfirm ? GuestStatus.CONFIRMED : GuestStatus.CANCELLED,
      distributor: wizardData.distributor,
      phone: wizardData.phone,
      role: wizardData.role,
      allergies: wizardData.allergies,
      allergiesCustom: wizardData.allergiesCustom,
      specialRequirements: wizardData.specialRequirements,
      companions: wizardData.companions,
      flightArrival: flightInbound.flightNumber ? flightInbound : undefined,
      flightDeparture: flightOutbound.flightNumber ? flightOutbound : undefined,
      assignedTransportId: transportSelectedId || undefined
    };

    // Save
    const res = DataStore.saveGuest(updatedGuest, currentUser.name, currentUser.email, false);
    if (res.success) {
      setCurrentUser(updatedGuest);
      setWizardSuccessMessage("¡Felicidades! Tus datos de confirmación para ADISTEM han sido guardados con éxito.");
      onUpdate();
      // Advance to next screen or scroll back
      setTimeout(() => {
        setWizardSuccessMessage("");
        setWizardStep(1);
      }, 3000);
    } else {
      setWizardErrorMessage(res.error || "Ocurrió un error al guardar los datos.");
    }
  };

  // Guest autonomous cancellation
  const handleGuestCancelAll = (reason: string) => {
    if (!currentUser) return;
    const updated: Guest = {
      ...currentUser,
      status: GuestStatus.CANCELLED,
      cancelledBy: "invitado",
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || "Cancelado por el propio invitado de forma autónoma."
    };

    const res = DataStore.saveGuest(updated, currentUser.name, currentUser.email, false);
    if (res.success) {
      setCurrentUser(updated);
      setAssistanceConfirm(false);
      onUpdate();
      alert("Tu asistencia a la Convención ADISTEM ha sido cancelada.");
    } else {
      alert(res.error || "Error al cancelar.");
    }
  };

  // Join activity with real-time capacity and waitlist
  const handleJoinActivity = (actId: string) => {
    if (!currentUser) return;
    const act = activities.find(a => a.id === actId);
    if (!act) return;

    const isAlreadySelected = currentUser.selectedActivities.includes(actId);
    let updatedActivities = [...currentUser.selectedActivities];

    if (isAlreadySelected) {
      // Unsubscribe
      updatedActivities = updatedActivities.filter(id => id !== actId);
      // If was in waiting list, remove
      act.waitingList = act.waitingList.filter(gid => gid !== currentUser.id);
    } else {
      // Subscribe
      // Check capacity
      if (act.registeredCount >= act.capacity) {
        if (!act.waitingList.includes(currentUser.id)) {
          act.waitingList.push(currentUser.id);
          alert("El cupo para esta actividad está lleno. Se te ha agregado automáticamente a la LISTA DE ESPERA.");
        }
      }
      updatedActivities.push(actId);
    }

    const updatedGuest: Guest = {
      ...currentUser,
      selectedActivities: updatedActivities
    };

    const res = DataStore.saveGuest(updatedGuest, currentUser.name, currentUser.email, false);
    if (res.success) {
      setCurrentUser(updatedGuest);
      onUpdate();
    } else {
      alert(res.error || "Error al modificar actividades.");
    }
  };

  return (
    <div className="bg-slate-50 p-4 flex flex-col items-center justify-center min-h-screen border-l border-slate-100" id="mobile-sim-wrapper">
      
      {/* PHONE EMULATOR CONTAINER */}
      <div className="w-[360px] h-[720px] bg-white rounded-[40px] border-[10px] border-slate-850 shadow-2xl relative overflow-hidden flex flex-col" id="phone-frame">
        
        {/* Notch / Speaker bar */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-100 rounded-full z-50 flex items-center justify-between px-3">
          <div className="w-2 h-2 rounded-full bg-slate-350"></div>
          <div className="w-12 h-1 bg-slate-300 rounded"></div>
        </div>Base

        {/* StatusBar Row */}
        <div className="bg-white text-slate-800 px-5 pt-7 pb-2 flex justify-between text-[10px] font-bold tracking-wider select-none shrink-0 border-b border-slate-50">
          <span>09:41 AM (UTC)</span>
          <div className="flex gap-1.5 items-center">
            <span>5G</span>
            <div className="w-5 h-2.5 bg-slate-100 rounded-sm relative p-0.5 border border-slate-200">
              <div className="h-full bg-emerald-600 rounded-xs w-4"></div>
            </div>
          </div>
        </div>

        {/* SCREEN SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto bg-white text-slate-800 flex flex-col text-sm relative" id="phone-screen">
          
          {!isLoggedIn ? (
            /* ================= PHONE SCREEN: LOGIN / ACCESO ================= */
            <div className="flex-1 flex flex-col justify-between p-6 bg-white">
              <div className="space-y-6 pt-6">
                <div className="text-center space-y-2">
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-150 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Asistente ADISTEM
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight pt-1">Convención Anual 2026</h3>
                  <p className="text-xs text-slate-500 font-medium">Portal móvil exclusivo para la gestión de su itinerario, transportación y actividades especiales.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 uppercase mb-1">Correo Electrónico:</label>
                    <input 
                      type="email" 
                      placeholder="ej: bernardo@fasterling.mx"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-semibold transition"
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
                    Ingresar con Invitación
                  </button>
                </form>
              </div>

              {/* Login Help / Demo guide */}
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-650 space-y-1.5 font-medium">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Instrucciones de Demostración:
                </p>
                <p>Puedes usar los correos de prueba configurados:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700 font-mono text-[10px]">
                  <li>bernardo@fasterling.mx</li>
                  <li>alejandro.gomez@adistem.com.mx</li>
                </ul>
              </div>
            </div>
          ) : (
            /* ================= PHONE SCREEN: LOGGED IN INTERFACE ================= */
            <div className="flex-1 flex flex-col bg-white">
              
              {/* Active User Header */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-150 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-blue-750 block font-bold uppercase tracking-wider">{currentUser?.distributor}</span>
                  <p className="text-xs font-black text-slate-900">{currentUser?.name}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-rose-600 transition cursor-pointer"
                  title="Salir"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Deadline Warn Banner if expired */}
              <div className="bg-amber-50 border-b border-amber-100 px-3 py-1.5 text-[10px] text-amber-700 font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Límite vuelos: {new Date(config.deadlineFlightChange).toLocaleDateString()}</span>
              </div>

              {/* TAB CONTENT SPACE */}
              <div className="flex-1 p-4 space-y-4">
                
                {/* WIZARD REGISTER TAB */}
                {activeTab === "wizard" && (
                  <div className="space-y-4">
                    
                    {/* Step indicator */}
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <p className="text-[11px] font-bold text-slate-800">Paso {wizardStep} de 5: {
                        wizardStep === 1 ? "Confirmación" :
                        wizardStep === 2 ? "Datos & Acompañante" :
                        wizardStep === 3 ? "Itinerarios de Vuelo" :
                        wizardStep === 4 ? "Identificación" : "Asignación de Traslado"
                      }</p>
                      <span className="text-[10px] bg-blue-50 text-blue-750 border border-blue-150 px-2 py-0.5 rounded-full font-bold">
                        {Math.round((wizardStep / 5) * 100)}%
                      </span>
                    </div>

                    {/* WIZARD STEP 1: ASSISTANCE CONFIRM */}
                    {wizardStep === 1 && (
                      <div className="space-y-4 pt-2">
                        <p className="text-xs text-slate-550 font-medium leading-relaxed">
                          Estimado directivo, por favor confirme si asistirá a la Convención ADISTEM de este año en Cancún:
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setAssistanceConfirm(true)}
                            className={`py-6 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                              assistanceConfirm === true 
                                ? "bg-emerald-50 border-emerald-250 text-emerald-700 font-extrabold shadow-sm" 
                                : "bg-slate-50 border-slate-150 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            <Check className="w-6 h-6" />
                            <span className="text-xs font-bold">Sí asistiré</span>
                          </button>

                          <button 
                            onClick={() => setAssistanceConfirm(false)}
                            className={`py-6 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                              assistanceConfirm === false 
                                ? "bg-rose-50 border-rose-250 text-rose-700 font-extrabold shadow-sm" 
                                : "bg-slate-50 border-slate-150 text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            <LogOut className="w-6 h-6" />
                            <span className="text-xs font-bold">No asistiré</span>
                          </button>
                        </div>

                        {assistanceConfirm === false && (
                          <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-rose-700">Cancelación de Asistencia</p>
                            <p className="text-[11px] text-slate-600 font-medium">Si decides no asistir, se liberarán tus cupos reservados. ¿Confirmas tu decisión?</p>
                            <button 
                              onClick={() => {
                                const r = prompt("Motivo opcional de cancelación:");
                                handleGuestCancelAll(r || "Problemas de agenda corporativa.");
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg cursor-pointer transition shadow-2xs"
                            >
                              Confirmar Cancelación
                            </button>
                          </div>
                        )}

                        <div className="pt-4">
                          <button 
                            onClick={() => setWizardStep(2)}
                            disabled={assistanceConfirm === null}
                            className="w-full bg-blue-600 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:bg-blue-700 transition"
                          >
                            Siguiente Paso <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* WIZARD STEP 2: PERSONAL DATA & COMPANIONS */}
                    {wizardStep === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-600">Distribuidor Stellantis / Agencia (Obligatorio)</label>
                          <input 
                            type="text" 
                            placeholder="Nombre de la Concesionaria"
                            value={wizardData.distributor}
                            onChange={e => setWizardData({ ...wizardData, distributor: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-600">Teléfono Celular de Contacto</label>
                          <input 
                            type="text" 
                            placeholder="Número para urgencias"
                            value={wizardData.phone}
                            onChange={e => setWizardData({ ...wizardData, phone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                          />
                        </div>

                        {/* Companions form */}
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <p className="text-xs font-bold text-slate-800">Acompañantes Registrados</p>
                          
                          {wizardData.companions.length > 0 && (
                            <div className="space-y-2 mb-3">
                              {wizardData.companions.map(comp => (
                                <div key={comp.id} className="p-2 bg-white rounded-lg border border-slate-150 flex justify-between items-center shadow-3xs">
                                  <div className="text-[11px]">
                                    <p className="font-bold text-slate-800">{comp.name}</p>
                                    <p className="text-slate-500 text-[10px] font-medium">{comp.relationship}</p>
                                  </div>
                                  <button onClick={() => handleRemoveCompanion(comp.id)} className="text-rose-600 p-1 hover:bg-slate-100 rounded cursor-pointer transition">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-1.5 border-t border-slate-150 pt-2">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Registrar Acompañante:</p>
                            <input 
                              type="text" 
                              placeholder="Nombre del acompañante"
                              value={newCompanion.name}
                              onChange={e => setNewCompanion({ ...newCompanion, name: e.target.value })}
                              className="w-full bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                            />
                            <div className="grid grid-cols-2 gap-1">
                              <select 
                                value={newCompanion.relationship}
                                onChange={e => setNewCompanion({ ...newCompanion, relationship: e.target.value })}
                                className="bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-600 font-semibold focus:outline-none focus:border-blue-500"
                              >
                                <option value="Cónyuge">Cónyuge</option>
                                <option value="Hijo/a">Hijo/a</option>
                                <option value="Otro">Otro</option>
                              </select>
                              <button 
                                type="button" 
                                onClick={handleAddCompanion}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-3xs transition"
                              >
                                <UserPlus className="w-3 h-3" /> Agregar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Allergies and Special Req */}
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                          <p className="text-xs font-bold text-slate-800">Requerimientos & Alergias</p>
                          <div className="flex flex-wrap gap-1.5">
                            {["Mariscos", "Nueces", "Gluten", "Lácteos"].map(alg => {
                              const selected = wizardData.allergies.includes(alg);
                              return (
                                <button
                                  key={alg}
                                  type="button"
                                  onClick={() => toggleAllergy(alg)}
                                  className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer font-semibold ${
                                    selected ? 'bg-rose-50 border-rose-250 text-rose-700 font-bold shadow-3xs' : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {alg}
                                </button>
                              );
                            })}
                          </div>
                          <input 
                            type="text" 
                            placeholder="Otras alergias..."
                            value={wizardData.allergiesCustom}
                            onChange={e => setWizardData({ ...wizardData, allergiesCustom: e.target.value })}
                            className="w-full bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button onClick={() => setWizardStep(1)} className="bg-slate-100 hover:bg-slate-200 border border-slate-150 text-slate-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition">Atrás</button>
                          <button onClick={() => setWizardStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition">Siguiente</button>
                        </div>
                      </div>
                    )}

                    {/* WIZARD STEP 3: FLIGHT INBOUND & OUTBOUND */}
                    {wizardStep === 3 && (
                      <div className="space-y-4">
                        
                        {/* Gemini Assistant extraction action banner */}
                        <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-blue-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              Lectura Asistida por IA Gemini
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-650 leading-normal font-medium">
                            ¿Tienes un itinerario de vuelo de Aeroméxico o Volaris? Presiona el botón para simular una lectura automática de pasaje con Gemini y llenar los campos:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              type="button"
                              onClick={() => simulateGeminiFlightExtraction("arrival")}
                              disabled={aiExtracting}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 font-bold py-1.5 px-2 rounded-lg text-[10px] transition cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                            >
                              {aiExtracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plane className="w-3 h-3" />}
                              Lector Llegada (IA)
                            </button>
                            <button 
                              type="button"
                              onClick={() => simulateGeminiFlightExtraction("departure")}
                              disabled={aiExtracting}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 font-bold py-1.5 px-2 rounded-lg text-[10px] transition cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                            >
                              {aiExtracting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plane className="w-3 h-3" />}
                              Lector Salida (IA)
                            </button>
                          </div>
                          {aiSuccessMessage && <p className="text-[10px] text-emerald-700 mt-1 font-bold animate-pulse">{aiSuccessMessage}</p>}
                        </div>

                        {/* FLIGHT INBOUND FORM */}
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                          <p className="text-xs font-bold text-slate-800">Vuelo de Llegada (Cancún)</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              placeholder="Aerolínea"
                              value={flightInbound.airline}
                              onChange={e => setFlightInbound({ ...flightInbound, airline: e.target.value })}
                              className="bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <input 
                              type="text" 
                              placeholder="No. Vuelo"
                              value={flightInbound.flightNumber}
                              onChange={e => setFlightInbound({ ...flightInbound, flightNumber: e.target.value })}
                              className="bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <input 
                              type="text" 
                              placeholder="Origen (IATA, ej. MEX)"
                              value={flightInbound.departureAirport}
                              onChange={e => setFlightInbound({ ...flightInbound, departureAirport: e.target.value })}
                              className="bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <input 
                              type="datetime-local" 
                              value={flightInbound.arrivalDateTime}
                              onChange={e => setFlightInbound({ ...flightInbound, arrivalDateTime: e.target.value })}
                              className="bg-white border border-slate-150 rounded p-1.5 text-[10px] text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* FLIGHT OUTBOUND FORM */}
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                          <p className="text-xs font-bold text-slate-800">Vuelo de Regreso (Salida)</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              placeholder="Aerolínea"
                              value={flightOutbound.airline}
                              onChange={e => setFlightOutbound({ ...flightOutbound, airline: e.target.value })}
                              className="bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <input 
                              type="text" 
                              placeholder="No. Vuelo"
                              value={flightOutbound.flightNumber}
                              onChange={e => setFlightOutbound({ ...flightOutbound, flightNumber: e.target.value })}
                              className="bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <input 
                              type="text" 
                              placeholder="Destino (IATA, ej. MEX)"
                              value={flightOutbound.arrivalAirport}
                              onChange={e => setFlightOutbound({ ...flightOutbound, arrivalAirport: e.target.value })}
                              className="bg-white border border-slate-150 rounded p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            />
                            <input 
                              type="datetime-local" 
                              value={flightOutbound.departureDateTime}
                              onChange={e => setFlightOutbound({ ...flightOutbound, departureDateTime: e.target.value })}
                              className="bg-white border border-slate-150 rounded p-1.5 text-[10px] text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button onClick={() => setWizardStep(2)} className="bg-slate-100 hover:bg-slate-200 border border-slate-150 text-slate-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition">Atrás</button>
                          <button onClick={() => setWizardStep(4)} className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition">Siguiente</button>
                        </div>
                      </div>
                    )}

                    {/* WIZARD STEP 4: IDENTIFICATION UPLOAD */}
                    {wizardStep === 4 && (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500 font-medium">
                          Sube tu INE o pasaporte oficial. Requerido por el hotel de la sede y para fines de logística:
                        </p>

                        <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50" onClick={simulateIdUpload}>
                          {idUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                              <p className="text-xs text-slate-600 font-semibold">Subiendo y validando legibilidad...</p>
                            </div>
                          ) : idFileSelected ? (
                            <div className="flex flex-col items-center gap-2">
                              {extractedFaceUrl ? (
                                <img src={extractedFaceUrl} className="w-12 h-12 rounded-full border border-blue-500 object-cover shadow-sm" alt="Cara" />
                              ) : (
                                <Check className="w-8 h-8 text-emerald-600" />
                              )}
                              <p className="text-xs text-emerald-700 font-extrabold">✓ {idFileName}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Extracción de rostro generada automáticamente para credencial.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <UploadCloud className="w-8 h-8 text-blue-500" />
                              <p className="text-xs font-black text-slate-800">Tomar foto o Cargar Imagen</p>
                              <p className="text-[10px] text-slate-400 font-medium">INE, Pasaporte (Formatos JPG, PNG • Max 4MB)</p>
                            </div>
                          )}
                        </div>

                        {idFileSelected && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-[11px] text-emerald-700 font-bold flex items-center gap-2 shadow-3xs">
                            <Check className="w-4 h-4" />
                            <span>Documento legible y validado por sistema.</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button onClick={() => setWizardStep(3)} className="bg-slate-100 hover:bg-slate-200 border border-slate-150 text-slate-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition">Atrás</button>
                          <button onClick={() => setWizardStep(5)} className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-2xs transition">Siguiente</button>
                        </div>
                      </div>
                    )}

                    {/* WIZARD STEP 5: TRANSPORT SLOT SELECTION */}
                    {wizardStep === 5 && (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                          <p className="text-[11px] text-blue-700 leading-normal font-bold">
                            <strong>Sugerencia por Vuelo:</strong> En base a tu hora de arribo a Cancún, el sistema sugiere un traslado coordinado. Puedes cambiarlo según disponibilidad.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase">Horarios de Traslado Disponibles:</p>
                          
                          {transportSlots.filter(t => t.route.includes("Aeropuerto")).map(slot => {
                            const isSelected = transportSelectedId === slot.id;
                            const full = slot.assignedCount >= slot.capacity;
                            return (
                              <button
                                key={slot.id}
                                onClick={() => { if(!full || isSelected) setTransportSelectedId(slot.id); }}
                                className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                                  isSelected 
                                    ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold shadow-3xs' 
                                    : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100/70'
                                } ${full && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="text-[11px]">
                                  <p className="font-extrabold text-slate-800">{slot.description}</p>
                                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Salida: {new Date(slot.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                <span className="text-[10px] font-bold">
                                  {isSelected ? "✓ Seleccionado" : full ? "Lleno" : "Disponible"}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {wizardErrorMessage && (
                          <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-[11px] text-rose-700 font-medium">
                            {wizardErrorMessage}
                          </div>
                        )}

                        {wizardSuccessMessage && (
                          <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-[11px] text-emerald-700 font-bold text-center animate-pulse">
                            {wizardSuccessMessage}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button onClick={() => setWizardStep(4)} className="bg-slate-100 hover:bg-slate-200 border border-slate-150 text-slate-700 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition">Atrás</button>
                          <button 
                            onClick={handleWizardSubmit} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-xs cursor-pointer shadow-2xs transition"
                          >
                            Finalizar Registro
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AGENDA & ACTIVITIES TAB */}
                {activeTab === "agenda" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-150 pb-2">
                      <h4 className="font-bold text-xs text-slate-900">Inscripción de Actividades y Agenda</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Cupos limitados por día. El sistema cerrará inscripciones automáticamente al llenarse.</p>
                    </div>

                    <div className="space-y-3">
                      {activities.map(act => {
                        const isEnrolled = currentUser?.selectedActivities.includes(act.id);
                        const isWaitlist = act.waitingList.includes(currentUser?.id || "");
                        const full = act.registeredCount >= act.capacity;
                        
                        return (
                          <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-150 text-[9px] font-bold uppercase rounded-md">
                                {act.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold">
                                {act.registeredCount} / {act.capacity} cupos
                              </span>
                            </div>

                            <p className="font-extrabold text-slate-900 text-xs">{act.name}</p>
                            <p className="text-[10px] text-slate-600 font-medium leading-normal">{act.description}</p>
                            <p className="text-[10px] text-amber-700 font-bold">Horario: {new Date(act.dateTime).toLocaleDateString("es-MX", {day: "numeric", month: "short"})} - {new Date(act.dateTime).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}</p>

                            <button
                              onClick={() => handleJoinActivity(act.id)}
                              className={`w-full font-bold text-xs py-2 rounded-lg transition cursor-pointer shadow-3xs ${
                                isWaitlist 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-250 hover:bg-amber-100'
                                  : isEnrolled 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                    : full 
                                      ? 'bg-amber-600 text-white hover:bg-amber-700' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {isWaitlist 
                                ? "Lista de Espera" 
                                : isEnrolled 
                                  ? "✓ Inscrito (Presiona para cancelar)" 
                                  : full 
                                    ? "Cupo Lleno (Entrar a Espera)" 
                                    : "Inscribirse"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* RECEIVED COMMS TAB */}
                {activeTab === "comms" && (
                  <div className="space-y-4">
                    <div className="border-b border-slate-150 pb-2">
                      <h4 className="font-bold text-xs text-slate-900">Buzón de Comunicados ADISTEM</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Aquí se guardan las notificaciones push y circulares de correo oficiales.</p>
                    </div>

                    <div className="space-y-3">
                      {comms.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6">Buzón vacío por el momento.</p>
                      ) : (
                        comms.map(msg => (
                          <div key={msg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1 shadow-3xs">
                            <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                              <span>Oficina Staff ADISTEM</span>
                              <span>Hace unas horas</span>
                            </div>
                            <p className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                              <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              {msg.subject}
                            </p>
                            <p className="text-[11px] text-slate-650 mt-1 leading-normal font-medium">
                              {msg.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SELF CANCELLATION TAB */}
                {activeTab === "cancel" && (
                  <div className="space-y-4 text-center py-4">
                    <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
                    <h4 className="font-black text-sm text-slate-900">¿Deseas darte de baja del evento?</h4>
                    <p className="text-xs text-slate-550 leading-relaxed px-4 font-medium">
                      Esta acción liberará de forma automática tu reservación en el hotel, traslados en autobús y tu lugar en las actividades recreativas seleccionadas.
                    </p>

                    {currentUser?.status === GuestStatus.CANCELLED ? (
                      <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-[11px] text-rose-700 font-bold">
                        Tu estatus actual ya es: CANCELADO.
                      </div>
                    ) : (
                      <div className="pt-2 space-y-2">
                        <button 
                          onClick={() => {
                            const r = prompt("Describe el motivo de la cancelación de asistencia (opcional):");
                            if (r !== null) {
                              handleGuestCancelAll(r);
                            }
                          }}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                        >
                          Confirmar Cancelación de Asistencia
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* BOTTOM NAVIGATION TAB BAR */}
              <div className="bg-slate-50 border-t border-slate-150 p-2 grid grid-cols-4 gap-1 text-[10px] text-center select-none shrink-0" id="phone-bottom-bar">
                <button 
                  onClick={() => setActiveTab("wizard")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-lg ${
                    activeTab === "wizard" ? "text-blue-600 font-bold bg-white shadow-3xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Registro</span>
                </button>

                <button 
                  onClick={() => setActiveTab("agenda")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-lg ${
                    activeTab === "agenda" ? "text-blue-600 font-bold bg-white shadow-3xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agenda</span>
                </button>

                <button 
                  onClick={() => setActiveTab("comms")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-lg ${
                    activeTab === "comms" ? "text-blue-600 font-bold bg-white shadow-3xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Mensajes</span>
                </button>

                <button 
                  onClick={() => setActiveTab("cancel")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-lg ${
                    activeTab === "cancel" ? "text-rose-600 font-bold bg-white shadow-3xs" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Baja</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Home Indicator line */}
        <div className="h-4 bg-white flex items-center justify-center shrink-0 pb-1 select-none border-t border-slate-50">
          <div className="w-32 h-1 bg-slate-200 rounded-full"></div>
        </div>

      </div>

      <div className="text-center text-[11px] text-slate-500 max-w-xs mt-3 space-y-1 leading-normal" id="simulator-info">
        <p className="font-bold text-slate-700">Simulador de Aplicación Flutter (iOS & Android)</p>
        <p>Prueba en tiempo real cómo interactúan los invitados de la Convención ADISTEM desde sus teléfonos móviles.</p>
      </div>

    </div>
  );
}
