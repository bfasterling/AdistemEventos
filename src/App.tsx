import React, { useState, useEffect } from "react";
import { Laptop, Smartphone, Sparkles, AlertTriangle, ShieldCheck, HelpCircle, Users } from "lucide-react";
import BackOffice from "./components/BackOffice";
import MobileApp from "./components/MobileApp";
import GuestRegistration from "./components/GuestRegistration";
import AdminPanel from "./components/AdminPanel";
import { DataStore } from "./dataStore";
import { Guest, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig } from "./types";

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

  // Layout View mode state: 'split' | 'backoffice' | 'mobile' | 'register' | 'admin'
  const [viewMode, setViewMode] = useState<'split' | 'backoffice' | 'mobile' | 'register' | 'admin'>(() => {
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
      if (window.innerWidth < 768) {
        return 'mobile';
      }
    }
    return 'split';
  });

  // Selected guest in Backoffice to automatically load/login in Mobile Simulator
  const [activeSimGuestId, setActiveSimGuestId] = useState<string | null>(null);

  // Instructions Modal state
  const [showInstructions, setShowInstructions] = useState(() => {
    if (isCapacitor) {
      return false;
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has('view')) {
        return false;
      }
      if (window.innerWidth < 768) {
        return false;
      }
    }
    return true;
  });

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
      {!hideHeader && viewMode !== 'register' && viewMode !== 'admin' && (
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-xs" id="app-header">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center p-1 bg-brand-primary rounded-xl shadow-md border border-brand-light">
              <img 
                src="/assets/Logo_convencion_reducido.png" 
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
              <p className="text-xs text-slate-500 font-medium">Asociación de Distribuidores Stellantis México • Backoffice Web & App de Invitados</p>
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
            <button 
              onClick={() => setShowInstructions(true)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer text-xs flex items-center gap-1.5 shadow-2xs"
              title="Instrucciones de Compilación y Publicación"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Instrucciones Tiendas App</span>
            </button>
          </div>
        </header>
      )}

      {/* DETAILED SETUP & STORE INSTRUCTIONS DIALOG */}
      {showInstructions && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="instructions-modal">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-xl my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Guía de Pruebas Móviles y Publicación en Tiendas</h3>
                  <p className="text-xs text-slate-500">Proveedor de Software: Exagono Software • Cliente: ADISTEM</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstructions(false)} 
                className="px-3 py-1 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs rounded-lg cursor-pointer transition shadow-xs"
              >
                Cerrar Guía
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-800 text-xs">🚀 ¿Cómo funciona esta demostración unificada?</h4>
                <p>
                  Esta plataforma web integra de forma unificada tanto el <strong>Backoffice de Staff</strong> como el <strong>Simulador Móvil de Invitados en Flutter</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Panel de Staff:</strong> Permite gestionar reglas operativas, plazos límite (deadlines), cargar invitados en lote, administrar cupos de transporte y actividades recreativas del evento.</li>
                  <li><strong>Simulador Móvil:</strong> En el panel derecho puedes probar todo el flujo paso a paso que experimentará el delegado en su smartphone. Incluye <strong>Lectura Asistida de Vuelos con IA de Gemini</strong>.</li>
                  <li><strong>Trazabilidad en tiempo real:</strong> Al modificar algo en el simulador móvil de invitado, la bitácora de auditoría y los contadores del Backoffice se actualizan instantáneamente.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">📦 Instrucciones para Compilar y Publicar en Tiendas (App Store & Google Play)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1.5">
                    <p className="font-bold text-slate-800">1. Ejecución Local de la App Flutter</p>
                    <p className="text-[11px] text-slate-500">
                      Para levantar la aplicación en dispositivos físicos durante el evento privado o pruebas internas:
                    </p>
                    <pre className="bg-slate-100 p-2 rounded text-[10px] font-mono text-blue-700 overflow-x-auto border border-slate-200/40">
{`# 1. Instalar Flutter SDK en tu PC
# 2. Descarga el paquete de fuentes móviles
flutter pub get
# 3. Correr en simulador o celular USB
flutter run`}
                    </pre>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1.5">
                    <p className="font-bold text-slate-800">2. Generación del Paquete de Producción</p>
                    <p className="text-[11px] text-slate-500">
                      Construye los binarios finales optimizados y firmados digitalmente para cada sistema operativo:
                    </p>
                    <pre className="bg-slate-100 p-2 rounded text-[10px] font-mono text-blue-700 overflow-x-auto border border-slate-200/40">
{`# Compilar App Bundle para Google Play Store
flutter build appbundle --release

# Compilar IPA para App Store de Apple
flutter build ipa --release`}
                    </pre>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                  <p className="font-bold text-slate-800">3. Checklists de Publicación para Exagono Software</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1">
                      <p className="text-blue-700 font-bold">Google Play Store:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                        <li>Crear ficha en consola Google Play Developer.</li>
                        <li>Subir archivo <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded">.aab</code> firmado.</li>
                        <li>Configurar política de privacidad sin geolocalización.</li>
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="text-indigo-700 font-bold">Apple App Store (iOS):</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                        <li>Registrar cuenta de Apple Developer ADISTEM.</li>
                        <li>Crear perfil de provisión y certificado de distribución.</li>
                        <li>Subir compilado a App Store Connect vía Xcode.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => setShowInstructions(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition"
              >
                Comenzar Pruebas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE WORKSPACE CONTENT AND WORKFLOW SIMULATION */}
      <main className="flex-1 flex overflow-hidden relative" id="app-workspace">
        
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
