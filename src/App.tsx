import React, { useState, useEffect } from "react";
import { Laptop, Smartphone, Sparkles, AlertTriangle, ShieldCheck, HelpCircle, Users } from "lucide-react";
import BackOffice from "./components/BackOffice";
import MobileApp from "./components/MobileApp";
import GuestRegistration from "./components/GuestRegistration";
import AdminPanel from "./components/AdminPanel";
import { DataStore } from "./dataStore";
import { Guest, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig } from "./types";
import LogoConvencion from "./assets/images/Logo_convencion_reducido.png";

const isCapacitor = typeof window !== "undefined" && (
  !!(window as any).Capacitor || 
  window.location.protocol === "capacitor:" || 
  window.location.href.startsWith("capacitor://") ||
  navigator.userAgent.includes("Capacitor")
);

export default function App() {
  // Sync core database state across both simulated panels
  const [guests, setGuests] = useState<Guest[]>([]);
  const [transportSlots, setTransportSlots] = useState<TransportSlot[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [comms, setComms] = useState<CommMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [config, setConfig] = useState<EventConfig | null>(null);

  // Layout View mode state: 'split' | 'backoffice' | 'mobile' | 'register' | 'admin' | 'direct-landing'
  const [viewMode, setViewMode] = useState<'split' | 'backoffice' | 'mobile' | 'register' | 'admin' | 'direct-landing'>(() => {
    if (isCapacitor) {
      return 'mobile';
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const viewParam = params.get('view');
      
      if (viewParam === 'register' || hash === '#/register') {
        return 'register';
      }
      if (viewParam === 'admin' || hash === '#/admin') {
        return 'admin';
      }
      if (viewParam === 'backoffice' || viewParam === 'mobile' || viewParam === 'split') {
        return viewParam;
      }
      
      // If direct link is used without a view parameter, show direct-landing page
      return 'direct-landing';
    }
    return 'direct-landing';
  });

  // Selected guest in Backoffice to automatically load/login in Mobile Simulator
  const [activeSimGuestId, setActiveSimGuestId] = useState<string | null>(null);



  // Check if we should hide the top header for a completely clean layout
  const [hideHeader, setHideHeader] = useState(() => {
    if (isCapacitor) {
      return true;
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get('hideHeader') === 'true' || params.get('view') === 'mobile' || params.get('view') === 'backoffice') {
        return true;
      }
      if (window.innerWidth < 768) {
        return true;
      }
    }
    return false;
  });

  // Reload handler from DataStore
  const reloadData = () => {
    setGuests([...DataStore.getGuests()]);
    setTransportSlots([...DataStore.getTransportSlots()]);
    setActivities([...DataStore.getActivities()]);
    setComms([...DataStore.getComms()]);
    setAuditLogs([...DataStore.getAuditLogs()]);
    const currentConfig = DataStore.getEventConfig();
    setConfig(currentConfig ? { ...currentConfig } : null);
  };

  // Initial load
  useEffect(() => {
    document.title = "Convención ADISTEM 2026";
    // Initialize DataStore real-time synchronization with Firestore
    DataStore.initialize(() => {
      reloadData();
    });
  }, []);

  const handleSelectGuestForSim = (guest: Guest) => {
    setActiveSimGuestId(guest.id);
    // Switch to split view to see both side-by-side
    setViewMode('split');
    // Scroll or focus mobile sim if needed
    alert(`Se ha cargado e iniciado sesión automáticamente como "${guest.name}" (${guest.email}) en el simulador móvil de la derecha.`);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-800 font-sans">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-500 animate-pulse">Cargando base de datos ADISTEM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans flex flex-col" id="app-root">
      
      {/* BRAND & LAYOUT CONTROLLER HEADER */}
      {!hideHeader && viewMode !== 'register' && viewMode !== 'admin' && viewMode !== 'direct-landing' && (
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-xs" id="app-header">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center p-1 bg-brand-primary rounded-xl shadow-md border border-brand-light">
              <img 
                src={LogoConvencion} 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} 
                className="h-10 object-contain max-w-[160px]" 
                alt="Logo ADISTEM" 
              />
              <div className="flex items-center justify-center w-10 h-10 bg-brand-primary text-white font-black text-sm tracking-wider uppercase rounded-lg">
                AD
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider text-brand-primary font-display uppercase flex items-center gap-2">
                CONVENCIÓN <span className="text-brand-teal">ADISTEM</span> 2026
                <span className="bg-brand-light/30 text-brand-primary border border-brand-secondary/30 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Asociación de Distribuidores • Backoffice Web & App de Invitados</p>
            </div>
          </div>

          {/* View Mode Toggle Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60" id="layout-toggles">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'split' 
                  ? "bg-brand-primary text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <Smartphone className="w-3.5 h-3.5" />
              <span>Vista Dividida</span>
            </button>

            <button
              onClick={() => setViewMode('backoffice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'backoffice' 
                  ? "bg-brand-primary text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Consola Backoffice</span>
            </button>

            <button
              onClick={() => setViewMode('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'mobile' 
                  ? "bg-brand-primary text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simulador Móvil (Invitado)</span>
            </button>
          </div>

          {/* Floating Quick Action */}
          <div className="flex flex-wrap items-center gap-2">
            <a 
              href="?view=register"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title="Abre el Portal de Autoregistro para Invitados en una URL dedicada"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Portal Invitado 🔗</span>
            </a>
            <a 
              href="?view=admin"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-slate-100 border border-slate-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title="Abre la Consola de Administración para Staff y Administradores en una URL dedicada"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Consola Admin 🔗</span>
            </a>

          </div>
        </header>
      )}



      {/* CORE WORKSPACE CONTENT AND WORKFLOW SIMULATION */}
      <main className="flex-1 flex overflow-hidden relative" id="app-workspace">

        {/* VIEW: DIRECT LANDING PAGE */}
        {viewMode === 'direct-landing' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 min-h-screen w-full select-none" id="direct-landing-page">
            <div className="flex flex-col items-center max-w-md w-full text-center space-y-8 animate-fade-in">
              {/* Centered Logo */}
              <div className="relative p-2 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-[280px]">
                <img 
                  src={LogoConvencion} 
                  className="w-full object-contain max-h-[140px]" 
                  alt="Logo Convención ADISTEM" 
                />
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    // Update url without full page reload
                    window.history.pushState({}, "", "?view=register");
                    setViewMode('register');
                  }}
                  className="px-8 py-4 bg-brand-primary hover:bg-[#002166] text-white font-extrabold text-base rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5 text-brand-light" />
                  <span>Ir a registro Convención</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* VIEW: GUEST WEB REGISTRATION */}
        {viewMode === 'register' && (
          <div className="flex-1 overflow-y-auto w-full h-full">
            <GuestRegistration />
          </div>
        )}

         {/* VIEW: ADMIN CONSOLE */}
        {viewMode === 'admin' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden w-full" id="backoffice-container">
            <BackOffice 
              guests={guests}
              transportSlots={transportSlots}
              activities={activities}
              comms={comms}
              auditLogs={auditLogs}
              config={config}
              onUpdate={reloadData}
              onSelectGuestForMobileSim={handleSelectGuestForSim}
            />
          </div>
        )}

        {/* VIEW: BACKOFFICE PANEL */}
        {(viewMode === 'split' || viewMode === 'backoffice') && (
          <div className={`flex-1 flex flex-col h-full overflow-hidden ${viewMode === 'split' ? 'w-2/3' : 'w-full'}`} id="backoffice-container">
            <BackOffice 
              guests={guests}
              transportSlots={transportSlots}
              activities={activities}
              comms={comms}
              auditLogs={auditLogs}
              config={config}
              onUpdate={reloadData}
              onSelectGuestForMobileSim={handleSelectGuestForSim}
            />
          </div>
        )}

        {/* VIEW: FLUTTER APP SIMULATOR */}
        {(viewMode === 'split' || viewMode === 'mobile') && (
          <div className={isCapacitor 
            ? "w-full h-full bg-white overflow-hidden flex flex-col flex-1" 
            : `shrink-0 flex items-center justify-center bg-slate-100/80 border-l border-slate-200/80 h-full overflow-y-auto overflow-x-hidden ${viewMode === 'split' ? 'w-[390px]' : 'flex-1'}`} id="mobile-container">
            <MobileApp 
              guests={guests}
              transportSlots={transportSlots}
              activities={activities}
              comms={comms}
              config={config}
              activeSimGuestId={activeSimGuestId}
              onUpdate={reloadData}
            />
          </div>
        )}

      </main>

    </div>
  );
}
