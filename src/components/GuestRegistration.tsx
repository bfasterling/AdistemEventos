import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Users, Plane, Bed, Calendar, FileText, AlertCircle, CheckCircle, 
  ChevronRight, ChevronLeft, Save, Plus, Trash2, ArrowRight, LogIn, Lock, Mail, Phone, PlusCircle,
  Sun, Moon
} from "lucide-react";
import { DataStore } from "../dataStore";
import { Guest, Companion, GuestStatus, HotelConfig } from "../types";

export default function GuestRegistration() {
  const config = DataStore.getEventConfig();
  
  // Dark mode theme selection
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("guestRegTheme") === "dark";
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("guestRegTheme", next ? "dark" : "light");
      return next;
    });
  };

  // Theme styles mapping
  const t = {
    container: isDarkMode 
      ? "flex-1 bg-slate-950 text-slate-100 min-h-screen py-10 px-4 md:px-8 font-sans flex flex-col items-center justify-center transition-colors duration-300" 
      : "flex-1 bg-slate-100 text-slate-900 min-h-screen py-10 px-4 md:px-8 font-sans flex flex-col items-center justify-center transition-colors duration-300",
    headerText: isDarkMode ? "text-white" : "text-slate-900",
    headerSubText: isDarkMode ? "text-blue-300" : "text-brand-primary font-bold",
    logoBg: isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200",
    
    // Main white/dark card structure
    card: isDarkMode 
      ? "w-full max-w-4xl bg-slate-900 text-slate-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-800/80 flex flex-col transition-all duration-300" 
      : "w-full max-w-4xl bg-white text-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col transition-all duration-300",
    
    // Login and register choice cards
    gateCard: isDarkMode 
      ? "flex-1 bg-slate-850 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between space-y-6" 
      : "flex-1 bg-slate-50 border border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between space-y-6",
    dividerLine: isDarkMode ? "bg-slate-800" : "bg-slate-200",
    dividerTextBg: isDarkMode ? "bg-slate-900 text-slate-500" : "bg-white text-slate-400",
    
    // Logged status bar
    statusBar: isDarkMode 
      ? "bg-slate-950/40 border-b border-slate-800/60 px-6 py-3 flex items-center justify-between text-xs text-slate-400" 
      : "bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600",
    statusBarText: isDarkMode ? "text-slate-100" : "text-slate-800",
    
    // Headings, titles, labels, descriptions
    textTitle: isDarkMode ? "text-white" : "text-slate-950",
    textHeading: isDarkMode ? "text-slate-100" : "text-slate-900",
    textMuted: isDarkMode ? "text-slate-400" : "text-slate-500",
    label: isDarkMode ? "text-slate-300" : "text-slate-600",
    
    // Stepper header
    stepper: isDarkMode 
      ? "bg-slate-950/40 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between overflow-x-auto text-xs font-bold text-slate-500" 
      : "bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex items-center justify-between overflow-x-auto text-xs font-bold text-slate-500",
    stepActive: "text-blue-500",
    stepInactive: isDarkMode ? "text-slate-600" : "text-slate-400",
    stepNumActive: "bg-blue-600 text-white",
    stepNumInactive: isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-200",
    
    // Form Sections (sub-cards)
    section: isDarkMode 
      ? "bg-slate-850/40 border border-slate-800/80 p-4 rounded-2xl" 
      : "bg-slate-50 border border-slate-200/80 p-4 rounded-2xl",
    infoCard: isDarkMode
      ? "bg-blue-950/30 border border-blue-900/40 p-4 rounded-xl space-y-2 text-xs"
      : "bg-blue-50/80 border border-blue-100 p-4 rounded-xl space-y-2 text-xs",
    infoCardTitle: isDarkMode ? "text-blue-400" : "text-blue-900",
    
    // Inputs, Select, Option
    input: isDarkMode 
      ? "w-full p-2.5 bg-slate-850 border border-slate-800 rounded-xl text-slate-100 font-medium focus:border-blue-500 focus:outline-hidden transition-colors" 
      : "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:border-blue-600 focus:outline-hidden transition-colors",
    inputWhite: isDarkMode 
      ? "w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-medium focus:outline-hidden transition-colors" 
      : "w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-hidden transition-colors",
    inputWhiteS: isDarkMode 
      ? "w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-hidden transition-colors" 
      : "w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden transition-colors",
    disabledInput: isDarkMode 
      ? "disabled:bg-slate-900 disabled:text-slate-600" 
      : "disabled:bg-slate-100 disabled:text-slate-400",
    radioLabel: isDarkMode ? "text-slate-300" : "text-slate-700",
    
    // Custom list cards / list items
    listItem: isDarkMode 
      ? "bg-slate-850/50 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between" 
      : "bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between",
    
    // Bottom border / spacing dividers
    border: isDarkMode ? "border-slate-800" : "border-slate-100",
    
    // Secondary Buttons
    btnSec: isDarkMode
      ? "px-5 py-2.5 border border-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer text-xs"
      : "px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs"
  };

  // Authentication states
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active logged-in guest for editing
  const [loggedGuest, setLoggedGuest] = useState<Guest | null>(null);

  // Registration wizard states
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [grupo, setGrupo] = useState<string>("Stellantis");
  const [distribuidora, setDistribuidora] = useState<string>("");
  const [nombreTitular, setNombreTitular] = useState<string>("");
  const [apellidosTitular, setApellidosTitular] = useState<string>("");
  const [correoTitular, setCorreoTitular] = useState<string>("");
  const [celularTitular, setCelularTitular] = useState<string>("");
  const [sexo, setSexo] = useState<string>("M");
  const [alergiasTitular, setAlergiasTitular] = useState<string>("");
  const [hasCompanion, setHasCompanion] = useState<boolean>(false);
  const [nombreAcompanante, setNombreAcompanante] = useState<string>("");
  const [apellidosAcompanante, setApellidosAcompanante] = useState<string>("");
  const [sexoAcompanante, setSexoAcompanante] = useState<string>("F");
  const [alergiasAcompanante, setAlergiasAcompanante] = useState<string>("");
  const [ineTitular, setIneTitular] = useState<boolean>(false);
  const [ineAcompanante, setIneAcompanante] = useState<boolean>(false);

  // Password for new registration account
  const [regPassword, setRegPassword] = useState<string>("");

  // Minors list state
  const [numMinors, setNumMinors] = useState<number>(0);
  const [minors, setMinors] = useState<Array<{ name: string; lastName: string; age: number; sex: string; allergies: string }>>([]);

  // Flight states
  const [hasFlights, setHasFlights] = useState<boolean>(false);
  const [vueloLlegadaFecha, setVueloLlegadaFecha] = useState<string>("2026-10-15");
  const [vueloLlegadaHora, setVueloLlegadaHora] = useState<string>("12:00");
  const [vueloLlegadaAerolinea, setVueloLlegadaAerolinea] = useState<string>("");
  const [vueloLlegadaNoVuelo, setVueloLlegadaNoVuelo] = useState<string>("");
  const [vueloLlegadaPersonas, setVueloLlegadaPersonas] = useState<number>(1);

  const [vueloRegresoFecha, setVueloRegresoFecha] = useState<string>("2026-10-18");
  const [vueloRegresoHora, setVueloRegresoHora] = useState<string>("15:00");
  const [vueloRegresoAerolinea, setVueloRegresoAerolinea] = useState<string>("");
  const [vueloRegresoNoVuelo, setVueloRegresoNoVuelo] = useState<string>("");
  const [vueloRegresoPersonas, setVueloRegresoPersonas] = useState<number>(1);

  // Hotel configuration states
  const [numHabitaciones, setNumHabitaciones] = useState<number>(1);
  const [configuracionHabitacion, setConfiguracionHabitacion] = useState<string>("King");
  const [carnetTipoHabitacion, setCarnetTipoHabitacion] = useState<string>("Sencilla");
  const [nochesAdicionales, setNochesAdicionales] = useState<number>(0);
  const [requerimientosAdicionales, setRequerimientosAdicionales] = useState<string>("");

  // Options lists
  const gruposList = [
    "Stellantis", "Stellantis Financial", "Valmur", "Camarena", "Stella de Puebla", 
    "Kasa", "Bichara", "Refran Autos", "Sabalo", "Toxa", "Diez", "Automundo"
  ];

  // Load existing guest for modification
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const users = DataStore.getUsers();
    const foundUser = users.find(
      u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword
    );

    if (!foundUser) {
      setLoginError("Usuario o contraseña incorrectos.");
      return;
    }

    if (foundUser.role === "Invitado" && foundUser.guestId) {
      const allGuests = DataStore.getGuests();
      const guest = allGuests.find(g => g.id === foundUser.guestId);
      if (guest) {
        setLoggedGuest(guest);
        loadGuestToForm(guest);
        setSuccessMessage(`Sesión iniciada correctamente. Bienvenido, ${guest.name}.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setLoginError("No se encontró el registro de invitado asignado.");
      }
    } else {
      setLoginError("Este perfil no tiene permisos para acceder al portal de invitados.");
    }
  };

  const loadGuestToForm = (guest: Guest) => {
    setGrupo(guest.grupo || "Stellantis");
    setDistribuidora(guest.distribuidora || guest.distributor || "");
    setNombreTitular(guest.nombreTitular || guest.name.split(" ")[0] || "");
    setApellidosTitular(guest.apellidosTitular || guest.name.split(" ").slice(1).join(" ") || "");
    setCorreoTitular(guest.correoTitular || guest.email || "");
    setCelularTitular(guest.celularTitular || guest.phone || "");
    setSexo(guest.sexo || "M");
    setAlergiasTitular(guest.alergiasTitular || (guest.allergiesCustom ? guest.allergiesCustom : ""));
    setIneTitular(guest.ineTitular || false);

    if (guest.companions && guest.companions.length > 0) {
      setHasCompanion(true);
      const comp = guest.companions[0];
      setNombreAcompanante(guest.nombreAcompanante || comp.name || "");
      setApellidosAcompanante(guest.apellidosAcompanante || "");
      setSexoAcompanante(guest.sexoAcompanante || "F");
      setAlergiasAcompanante(guest.alergiasAcompanante || comp.allergies || "");
      setIneAcompanante(guest.ineAcompanante || false);
    } else {
      setHasCompanion(false);
    }

    setNumMinors(guest.numMenores || 0);
    if (guest.numMenores && guest.numMenores > 0 && guest.companions) {
      const loadedMinors = guest.companions.slice(guest.nombreAcompanante ? 1 : 0).map(c => ({
        name: c.name || "",
        lastName: "",
        age: c.relationship.includes("Edad:") ? parseInt(c.relationship.split("Edad:")[1]) || 10 : 10,
        sex: "M" as const,
        allergies: c.allergies || ""
      }));
      setMinors(loadedMinors);
    } else {
      setMinors([]);
    }

    if (guest.vueloLlegadaFecha) {
      setHasFlights(true);
      setVueloLlegadaFecha(guest.vueloLlegadaFecha);
      setVueloLlegadaHora(guest.vueloLlegadaHora || "");
      setVueloLlegadaAerolinea(guest.vueloLlegadaAerolinea || "");
      setVueloLlegadaNoVuelo(guest.vueloLlegadaNoVuelo || "");
      setVueloLlegadaPersonas(guest.vueloLlegadaPersonas || 1);

      setVueloRegresoFecha(guest.vueloRegresoFecha || "");
      setVueloRegresoHora(guest.vueloRegresoHora || "");
      setVueloRegresoAerolinea(guest.vueloRegresoAerolinea || "");
      setVueloRegresoNoVuelo(guest.vueloRegresoNoVuelo || "");
      setVueloRegresoPersonas(guest.vueloRegresoPersonas || 1);
    } else {
      setHasFlights(false);
    }

    setNumHabitaciones(guest.numHabitaciones || 1);
    setConfiguracionHabitacion(guest.configuracionHabitacion || "King");
    setCarnetTipoHabitacion(guest.carnetTipoHabitacion || "Sencilla");
    setNochesAdicionales(guest.nochesAdicionales || 0);
    setRequerimientosAdicionales(guest.requerimientosAdicionales || "");
    setCurrentStep(1);
  };

  const handleMinorCountChange = (count: number) => {
    setNumMinors(count);
    const updatedMinors = [...minors];
    if (count > minors.length) {
      for (let i = minors.length; i < count; i++) {
        updatedMinors.push({ name: "", lastName: "", age: 6, sex: "M", allergies: "" });
      }
    } else {
      updatedMinors.splice(count);
    }
    setMinors(updatedMinors);
  };

  const handleMinorFieldChange = (index: number, field: string, value: any) => {
    const updatedMinors = [...minors];
    updatedMinors[index] = { ...updatedMinors[index], [field]: value };
    setMinors(updatedMinors);
  };

  const validateStep = (): boolean => {
    setValidationError(null);

    if (currentStep === 1) {
      if (!distribuidora.trim()) {
        setValidationError("El nombre de la distribuidora es obligatorio.");
        return false;
      }
      if (!nombreTitular.trim() || !apellidosTitular.trim()) {
        setValidationError("Nombre y apellidos del titular son obligatorios.");
        return false;
      }
      if (!correoTitular.trim() || !correoTitular.includes("@")) {
        setValidationError("Ingresa un correo electrónico del titular válido.");
        return false;
      }
      if (!celularTitular.trim()) {
        setValidationError("El número celular del titular es obligatorio.");
        return false;
      }
      if (!loggedGuest && !regPassword.trim()) {
        setValidationError("Asigna una contraseña para tu cuenta de acceso.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (hasCompanion) {
        if (!nombreAcompanante.trim() || !apellidosAcompanante.trim()) {
          setValidationError("Ingresa el nombre y apellidos completos del acompañante.");
          return false;
        }
      }
      // Check minors
      for (let i = 0; i < minors.length; i++) {
        if (!minors[i].name.trim() || !minors[i].lastName.trim()) {
          setValidationError(`Por favor completa nombre y apellido para el menor #${i + 1}.`);
          return false;
        }
      }
    }

    if (currentStep === 3) {
      if (hasFlights) {
        if (!vueloLlegadaAerolinea.trim() || !vueloLlegadaNoVuelo.trim()) {
          setValidationError("Ingresa aerolínea y número de vuelo para la llegada.");
          return false;
        }
        if (!vueloRegresoAerolinea.trim() || !vueloRegresoNoVuelo.trim()) {
          setValidationError("Ingresa aerolínea y número de vuelo para el regreso.");
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Cost calculations
  const calculateTotalHotelCost = (): number => {
    let costPerNight = 4500; // Default GFA Sencilla
    if (carnetTipoHabitacion === "Sencillo Extra") costPerNight = 5000;
    else if (carnetTipoHabitacion === "Doble") costPerNight = 5500;
    else if (carnetTipoHabitacion === "Doble Extra") costPerNight = 6000;

    return numHabitaciones * costPerNight * (3 + nochesAdicionales); // 3 original nights + additional
  };

  const handleSaveRegistration = () => {
    setValidationError(null);

    // Prepare companion list for core Guest structure compatibility
    const allCompanions: Companion[] = [];
    if (hasCompanion) {
      allCompanions.push({
        id: "C-1",
        name: `${nombreAcompanante} ${apellidosAcompanante}`.trim(),
        relationship: "Acompañante Adulto",
        allergies: alergiasAcompanante,
        requirements: ""
      });
    }

    minors.forEach((m, idx) => {
      allCompanions.push({
        id: `M-${idx + 1}`,
        name: `${m.name} ${m.lastName}`.trim(),
        relationship: `Menor (Edad: ${m.age})`,
        allergies: m.allergies,
        requirements: ""
      });
    });

    const isEditing = !!loggedGuest;
    const guestId = isEditing ? loggedGuest!.id : `G-${Date.now()}`;
    const emailToUse = correoTitular.toLowerCase().trim();

    const newGuestData: Guest = {
      id: guestId,
      email: emailToUse,
      name: `${nombreTitular} ${apellidosTitular}`,
      phone: celularTitular,
      distributor: distribuidora,
      role: "Guest",
      status: GuestStatus.CONFIRMED,
      stage: hasFlights ? 2 : 1,
      companions: allCompanions,
      allergies: [],
      allergiesCustom: alergiasTitular,
      specialRequirements: requerimientosAdicionales,
      idFileName: ineTitular ? "INE_TITULAR.jpg" : undefined,
      selectedActivities: isEditing ? loggedGuest!.selectedActivities : [],
      createdAt: isEditing ? loggedGuest!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Specific registration details
      grupo,
      distribuidora,
      nombreTitular,
      apellidosTitular,
      correoTitular: emailToUse,
      celularTitular,
      sexo,
      alergiasTitular,
      nombreAcompanante: hasCompanion ? nombreAcompanante : undefined,
      apellidosAcompanante: hasCompanion ? apellidosAcompanante : undefined,
      sexoAcompanante: hasCompanion ? sexoAcompanante : undefined,
      alergiasAcompanante: hasCompanion ? alergiasAcompanante : undefined,
      numMenores: numMinors,
      alergiasMenores: minors.map(m => m.allergies),
      numHabitaciones,
      configuracionHabitacion,
      carnetTipoHabitacion,
      nochesAdicionales,
      requerimientosAdicionales,
      ineTitular,
      ineAcompanante,

      // Flights info
      vueloLlegadaFecha: hasFlights ? vueloLlegadaFecha : undefined,
      vueloLlegadaHora: hasFlights ? vueloLlegadaHora : undefined,
      vueloLlegadaAerolinea: hasFlights ? vueloLlegadaAerolinea : undefined,
      vueloLlegadaNoVuelo: hasFlights ? vueloLlegadaNoVuelo : undefined,
      vueloLlegadaPersonas: hasFlights ? vueloLlegadaPersonas : undefined,
      vueloRegresoFecha: hasFlights ? vueloRegresoFecha : undefined,
      vueloRegresoHora: hasFlights ? vueloRegresoHora : undefined,
      vueloRegresoAerolinea: hasFlights ? vueloRegresoAerolinea : undefined,
      vueloRegresoNoVuelo: hasFlights ? vueloRegresoNoVuelo : undefined,
      vueloRegresoPersonas: hasFlights ? vueloRegresoPersonas : undefined,

      // Audits logs on guest
      auditHistory: [
        ...(isEditing ? (loggedGuest!.auditHistory || []) : []),
        {
          timestamp: new Date().toISOString(),
          user: `${nombreTitular} ${apellidosTitular} (Invitado)`,
          action: isEditing ? "Actualización de Registro Web" : "Registro Inicial Web",
          details: `Se ${isEditing ? "actualizó" : "creó"} el carnet de registro para ${nombreTitular}. Noches adicionales: ${nochesAdicionales}.`
        }
      ]
    };

    try {
      // Save user login account
      const passwordToUse = isEditing ? (DataStore.getUsers().find(u => u.id === emailToUse)?.password || "convencion2026") : regPassword;
      
      if (!isEditing) {
        const userRes = DataStore.addUser({
          id: emailToUse,
          email: emailToUse,
          password: passwordToUse,
          role: "Invitado",
          guestId: guestId
        });

        if (!userRes.success) {
          setValidationError(userRes.error || "Error al crear tu usuario.");
          return;
        }
      }

      // Save/Add guest
      DataStore.saveGuest(newGuestData, `${nombreTitular} ${apellidosTitular}`, emailToUse, true);

      // Save logged in guest state
      setLoggedGuest(newGuestData);

      setSuccessMessage(isEditing 
        ? "¡Tus datos de registro han sido actualizados con éxito en tiempo real!" 
        : "¡Tu registro ha sido completado con éxito! Se ha creado tu cuenta."
      );
      
      // Move to success step
      setCurrentStep(5);
    } catch (err: any) {
      setValidationError("Error al guardar en el servidor de base de datos. Revisa la conexión.");
    }
  };

  const handleLogout = () => {
    setLoggedGuest(null);
    setIsLoginMode(true);
    setLoginEmail("");
    setLoginPassword("");
    setRegPassword("");
    setCurrentStep(1);
    // Reset form fields
    setDistribuidora("");
    setNombreTitular("");
    setApellidosTitular("");
    setCorreoTitular("");
    setCelularTitular("");
    setAlergiasTitular("");
    setHasCompanion(false);
    setNombreAcompanante("");
    setApellidosAcompanante("");
    setNumMinors(0);
    setMinors([]);
    setHasFlights(false);
  };

  return (
    <div className={`flex-1 min-h-screen py-10 px-4 md:px-8 font-sans flex flex-col items-center justify-center transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100" 
        : "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900"
    }`} id="guest-reg-container">
      
      {/* Top Controls & Theme Toggle */}
      <div className="w-full max-w-4xl flex justify-end mb-6 animate-fade-in">
        <button
          onClick={toggleTheme}
          className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm border flex items-center gap-2 cursor-pointer transition-all duration-350 hover:scale-[1.02] active:scale-[0.98] ${
            isDarkMode
              ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-yellow-400"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900"
          }`}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 fill-indigo-100" />
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* Top Brand Logo & Heading */}
      <div className="text-center mb-8 max-w-xl flex flex-col items-center">
        <div className={`inline-flex items-center justify-center p-4 rounded-3xl border shadow-lg mb-4 transition-all duration-300 ${
          isDarkMode 
            ? "bg-slate-900/80 border-slate-800/80 shadow-black/40" 
            : "bg-white border-slate-200/80 shadow-slate-200/50"
        }`}>
          <img 
            src="/logo.png" 
            alt="Logo Convención" 
            className="h-14 md:h-16 w-auto object-contain max-w-full"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = "w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl text-white";
                fallback.innerText = "AD";
                parent.appendChild(fallback);
              }
            }}
          />
        </div>
        <h1 className={`text-2xl md:text-3xl font-black tracking-tight uppercase font-display transition-colors duration-300 ${
          isDarkMode ? "text-white" : "text-slate-950"
        }`}>
          Panel de Registro Invitados
        </h1>
        <p className={`font-bold text-xs uppercase tracking-widest mt-1.5 transition-colors duration-300 ${
          isDarkMode ? "text-blue-400" : "text-brand-primary"
        }`}>
          Convención ADISTEM 2026 • Stellantis México
        </p>
      </div>

      <div className={t.card} id="guest-reg-card">
        
        {/* Success and Error Banners */}
        {successMessage && (
          <div className="bg-emerald-500 text-white p-4 text-center font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        )}
        {validationError && (
          <div className="bg-rose-500 text-white p-4 text-center font-bold text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 animate-bounce" />
            <span>{validationError}</span>
          </div>
        )}

        {/* LOGGED IN STATUS / LOGOUT */}
        {loggedGuest && (
          <div className={t.statusBar}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
              <span className={t.statusBarText}>Sesión activa: <strong className="font-bold">{loggedGuest.name}</strong> ({loggedGuest.email})</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold rounded-lg hover:bg-rose-500/25 transition cursor-pointer"
            >
              Cerrar Sesión / Regresar
            </button>
          </div>
        )}

        {/* VIEW 1: GATEWAY (LOGIN / REGISTER CHOOSE) */}
        {!loggedGuest && isLoginMode ? (
          <div className="p-6 md:p-10 space-y-8 flex flex-col md:flex-row items-stretch gap-8">
            
            {/* Login Section */}
            <div className="flex-1 space-y-6">
              <div>
                <h2 className={`text-xl font-bold flex items-center gap-2 ${t.textTitle}`}>
                  <LogIn className="w-5 h-5 text-blue-500" />
                  Iniciar Sesión
                </h2>
                <p className={`text-xs mt-1 ${t.textMuted}`}>¿Ya te registraste anteriormente? Ingresa tu correo y contraseña para ver o actualizar tus datos.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-sm">
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${t.label}`}>Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="ejemplo@fasterling.mx"
                      required
                      className={`w-full pl-9 pr-3 py-2.5 text-xs transition-colors duration-300 ${t.input}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${t.label}`}>Contraseña de Registro</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full pl-9 pr-3 py-2.5 text-xs transition-colors duration-300 ${t.input}`}
                    />
                  </div>
                </div>

                {loginError && <p className="text-rose-500 text-xs font-bold">{loginError}</p>}

                <button 
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Ingresar a mi Registro</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Separator */}
            <div className="hidden md:flex flex-col items-center justify-center">
              <div className={`w-[1px] h-full ${t.dividerLine}`}></div>
              <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest my-2 rounded-md ${t.dividerTextBg}`}>O</span>
              <div className={`w-[1px] h-full ${t.dividerLine}`}></div>
            </div>

            {/* New Register Card */}
            <div className={t.gateCard}>
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-slate-800 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-bold ${t.textTitle}`}>Nuevo Invitado</h3>
                <p className={`text-xs leading-relaxed ${t.textMuted}`}>
                  Si eres titular de la invitación de distribuidor y no has registrado tus datos de carnet, haz clic para crear tu cuenta y rellenar las 5 etapas en minutos.
                </p>
                <ul className={`text-xs space-y-1.5 list-disc pl-4 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  <li>Carga de datos personales y alergias.</li>
                  <li>Inclusión de acompañante o menores.</li>
                  <li>Configuración de habitaciones y noches adicionales.</li>
                  <li>Logística de traslados aéreos en tiempo real.</li>
                </ul>
              </div>

              <button 
                onClick={() => {
                  setIsLoginMode(false);
                  setLoggedGuest(null);
                }}
                className={`w-full py-3 font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? "bg-slate-800 hover:bg-slate-700 text-white" 
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                <span>Comenzar Nuevo Registro</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        ) : (
          /* REGISTRATION WIZARD FLOW (STAGES 1-5) */
          <div className="flex-1 flex flex-col">
            
            {/* Progress Stepper Header */}
            {currentStep <= 4 && (
              <div className={t.stepper}>
                <div className="flex items-center gap-6 w-full justify-around min-w-[500px]">
                  <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-500 font-bold' : t.stepInactive}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${currentStep >= 1 ? t.stepNumActive : t.stepNumInactive}`}>1</span>
                    <span>Datos Titular</span>
                  </div>
                  <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-500 font-bold' : t.stepInactive}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${currentStep >= 2 ? t.stepNumActive : t.stepNumInactive}`}>2</span>
                    <span>Acompañantes</span>
                  </div>
                  <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-blue-500 font-bold' : t.stepInactive}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${currentStep >= 3 ? t.stepNumActive : t.stepNumInactive}`}>3</span>
                    <span>Vuelos</span>
                  </div>
                  <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-blue-500 font-bold' : t.stepInactive}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${currentStep >= 4 ? t.stepNumActive : t.stepNumInactive}`}>4</span>
                    <span>Hotel y Resumen</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content Container */}
            <div className="p-6 md:p-8 flex-1">
              
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
                      <User className="w-5 h-5 text-blue-500" />
                      Paso 1: Información Oficial del Titular
                    </h3>
                    <p className={`text-xs mt-0.5 ${t.textMuted}`}>Introduce tus datos de distribuidor y contacto. Serán utilizados para los gafetes y credenciales.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Grupo al que pertenece *</label>
                      <select 
                        value={grupo}
                        onChange={e => setGrupo(e.target.value)}
                        className={`${t.input} transition-colors duration-300`}
                      >
                        {gruposList.map(g => (
                          <option key={g} value={g} className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Agencia / Distribuidora *</label>
                      <input 
                        type="text"
                        value={distribuidora}
                        onChange={e => setDistribuidora(e.target.value)}
                        placeholder="Ej. Stellantis Guadalajara Central"
                        className={`${t.input} transition-colors duration-300`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Nombre(s) del Titular *</label>
                      <input 
                        type="text"
                        value={nombreTitular}
                        onChange={e => setNombreTitular(e.target.value)}
                        placeholder="Ingresa tus nombres"
                        className={`${t.input} transition-colors duration-300`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Apellidos del Titular *</label>
                      <input 
                        type="text"
                        value={apellidosTitular}
                        onChange={e => setApellidosTitular(e.target.value)}
                        placeholder="Ingresa tus apellidos"
                        className={`${t.input} transition-colors duration-300`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Correo de Contacto *</label>
                      <input 
                        type="email"
                        value={correoTitular}
                        onChange={e => setCorreoTitular(e.target.value)}
                        disabled={!!loggedGuest}
                        placeholder="correo@distribuidor.com"
                        className={`${t.input} ${t.disabledInput} transition-colors duration-300`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Celular de Contacto *</label>
                      <input 
                        type="tel"
                        value={celularTitular}
                        onChange={e => setCelularTitular(e.target.value)}
                        placeholder="+52 33 0000 0000"
                        className={`${t.input} transition-colors duration-300`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Sexo *</label>
                      <div className="flex gap-4 mt-1.5">
                        <label className={`flex items-center gap-1.5 font-semibold cursor-pointer ${t.radioLabel}`}>
                          <input type="radio" name="sexo" checked={sexo === "M"} onChange={() => setSexo("M")} className="accent-blue-500" />
                          Masculino
                        </label>
                        <label className={`flex items-center gap-1.5 font-semibold cursor-pointer ${t.radioLabel}`}>
                          <input type="radio" name="sexo" checked={sexo === "F"} onChange={() => setSexo("F")} className="accent-blue-500" />
                          Femenino
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Alergias o Restricciones Alimenticias</label>
                      <input 
                        type="text"
                        value={alergiasTitular}
                        onChange={e => setAlergiasTitular(e.target.value)}
                        placeholder="Ej. Mariscos, gluten o ninguna"
                        className={`${t.input} transition-colors duration-300`}
                      />
                    </div>
                  </div>

                  {/* Password assignment for accounts creation */}
                  {!loggedGuest && (
                    <div className={`${t.infoCard} transition-colors duration-300`}>
                      <h4 className={`font-bold flex items-center gap-1.5 ${t.infoCardTitle}`}>
                        <Lock className="w-4 h-4" />
                        Establece tu Contraseña de Acceso
                      </h4>
                      <p className={t.textMuted}>Con este correo y contraseña podrás regresar después a cargar tus pases de abordar o modificar tus habitaciones.</p>
                      <input 
                        type="password"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="Ingresa una contraseña segura"
                        className={`max-w-md ${t.inputWhite} transition-colors duration-300`}
                      />
                    </div>
                  )}

                  <div className={`border-t pt-5 flex justify-between ${t.border}`}>
                    <button 
                      onClick={() => setIsLoginMode(true)}
                      className={t.btnSec}
                    >
                      Regresar al Login
                    </button>
                    <button 
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
                    >
                      <span>Siguiente: Acompañantes</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
                      <Users className="w-5 h-5 text-blue-500" />
                      Paso 2: Registro de Acompañantes y Menores
                    </h3>
                    <p className={`text-xs mt-0.5 ${t.textMuted}`}>Agrega a tus familiares que viajarán contigo. Esto influye en la capacidad del transporte y tipo de habitación.</p>
                  </div>

                  {/* Companion Switch */}
                  <div className={`${t.section} flex items-center justify-between gap-4 transition-colors duration-300`}>
                    <div>
                      <p className={`text-xs font-bold ${t.textHeading}`}>¿Viajas con un acompañante adulto?</p>
                      <p className={`text-[11px] ${t.textMuted}`}>Habitación doble o doble extra configurada para la sede.</p>
                    </div>
                    <button 
                      onClick={() => setHasCompanion(!hasCompanion)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
                        hasCompanion 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                      }`}
                    >
                      {hasCompanion ? "Remover Acompañante" : "Agregar Acompañante"}
                    </button>
                  </div>

                  {/* Companion Fields */}
                  <AnimatePresence>
                    {hasCompanion && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }} 
                        exit={{ opacity: 0, height: 0 }}
                        className={`${t.infoCard} transition-colors duration-300 overflow-hidden space-y-4`}
                      >
                        <h4 className={`font-bold uppercase tracking-wider text-[11px] ${t.infoCardTitle}`}>Información del Acompañante Adulto</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block font-bold uppercase mb-1 ${t.label}`}>Nombre(s) Acompañante *</label>
                            <input 
                              type="text"
                              value={nombreAcompanante}
                              onChange={e => setNombreAcompanante(e.target.value)}
                              placeholder="Nombres del acompañante"
                              className={`${t.inputWhite} transition-colors duration-300`}
                            />
                          </div>

                          <div>
                            <label className={`block font-bold uppercase mb-1 ${t.label}`}>Apellidos Acompañante *</label>
                            <input 
                              type="text"
                              value={apellidosAcompanante}
                              onChange={e => setApellidosAcompanante(e.target.value)}
                              placeholder="Apellidos del acompañante"
                              className={`${t.inputWhite} transition-colors duration-300`}
                            />
                          </div>

                          <div>
                            <label className={`block font-bold uppercase mb-1 ${t.label}`}>Sexo *</label>
                            <div className="flex gap-4 mt-2 font-semibold">
                              <label className={`flex items-center gap-1.5 cursor-pointer ${t.radioLabel}`}>
                                <input type="radio" name="sexoAcompanante" checked={sexoAcompanante === "M"} onChange={() => setSexoAcompanante("M")} className="accent-blue-500" />
                                Masculino
                              </label>
                              <label className={`flex items-center gap-1.5 cursor-pointer ${t.radioLabel}`}>
                                <input type="radio" name="sexoAcompanante" checked={sexoAcompanante === "F"} onChange={() => setSexoAcompanante("F")} className="accent-blue-500" />
                                Femenino
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className={`block font-bold uppercase mb-1 ${t.label}`}>Alergias o Restricciones</label>
                            <input 
                              type="text"
                              value={alergiasAcompanante}
                              onChange={e => setAlergiasAcompanante(e.target.value)}
                              placeholder="Ninguna o alergias específicas"
                              className={`${t.inputWhite} transition-colors duration-300`}
                            />
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 pt-2 text-[11px] ${t.textMuted}`}>
                          <input 
                            type="checkbox"
                            checked={ineAcompanante}
                            onChange={e => setIneAcompanante(e.target.checked)}
                            id="ineAcomp"
                            className="accent-blue-500"
                          />
                          <label htmlFor="ineAcomp" className="cursor-pointer font-semibold">Confirmar que poseo INE/Pasaporte digital listo del acompañante para validación en etapa 2.</label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Minors Block */}
                  <div className="space-y-4">
                    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-2 border-t pt-4 ${t.border}`}>
                      <div>
                        <p className={`text-xs font-bold ${t.textHeading}`}>¿Viajas con menores de edad?</p>
                        <p className={`text-[11px] ${t.textMuted}`}>Por favor indica la cantidad de menores para coordinar pulseras especiales y kit infantil.</p>
                      </div>
                      <select 
                        value={numMinors}
                        onChange={e => handleMinorCountChange(Number(e.target.value))}
                        className={`p-2 border text-xs font-bold focus:outline-hidden transition-colors duration-300 rounded-xl cursor-pointer ${
                          isDarkMode 
                            ? "bg-slate-850 border-slate-800 text-slate-100" 
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <option value={0}>Sin menores</option>
                        <option value={1}>1 menor</option>
                        <option value={2}>2 menores</option>
                        <option value={3}>3 menores</option>
                        <option value={4}>4 menores</option>
                      </select>
                    </div>

                    {minors.map((minor, idx) => (
                      <div key={idx} className={`${t.section} space-y-3 text-xs transition-colors duration-300`}>
                        <p className={`font-bold text-[11px] uppercase tracking-wider ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>Menor #{idx + 1}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className={`block font-bold mb-0.5 ${t.label}`}>Nombre(s) *</label>
                            <input 
                              type="text"
                              value={minor.name}
                              required
                              onChange={e => handleMinorFieldChange(idx, "name", e.target.value)}
                              placeholder="Nombres"
                              className={`${t.inputWhiteS} transition-colors duration-300`}
                            />
                          </div>
                          <div>
                            <label className={`block font-bold mb-0.5 ${t.label}`}>Apellidos *</label>
                            <input 
                              type="text"
                              value={minor.lastName}
                              required
                              onChange={e => handleMinorFieldChange(idx, "lastName", e.target.value)}
                              placeholder="Apellidos"
                              className={`${t.inputWhiteS} transition-colors duration-300`}
                            />
                          </div>
                          <div>
                            <label className={`block font-bold mb-0.5 ${t.label}`}>Edad *</label>
                            <input 
                              type="number"
                              value={minor.age}
                              min={1}
                              max={17}
                              required
                              onChange={e => handleMinorFieldChange(idx, "age", Number(e.target.value))}
                              className={`${t.inputWhiteS} transition-colors duration-300`}
                            />
                          </div>
                          <div>
                            <label className={`block font-bold mb-0.5 ${t.label}`}>Alergias del Menor</label>
                            <input 
                              type="text"
                              value={minor.allergies}
                              onChange={e => handleMinorFieldChange(idx, "allergies", e.target.value)}
                              placeholder="Ej. Lactosa, polen o ninguna"
                              className={`${t.inputWhiteS} transition-colors duration-300`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ID Check Titular */}
                  <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs transition-colors duration-300 ${
                    isDarkMode 
                      ? "bg-amber-950/20 border-amber-900/40 text-amber-300" 
                      : "bg-amber-50 border-amber-100 text-amber-900"
                  }`}>
                    <input 
                      type="checkbox"
                      checked={ineTitular}
                      onChange={e => setIneTitular(e.target.checked)}
                      id="ineTit"
                      className="accent-amber-500"
                    />
                    <label htmlFor="ineTit" className="font-semibold cursor-pointer">Confirmo que poseo INE o pasaporte digital legible del titular de la convención para validación posterior.</label>
                  </div>

                  <div className={`border-t pt-5 flex justify-between ${t.border}`}>
                    <button 
                      onClick={handlePrev}
                      className={t.btnSec + " flex items-center gap-1.5"}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Atrás</span>
                    </button>
                    <button 
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
                    >
                      <span>Siguiente: Vuelos</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
                      <Plane className="w-5 h-5 text-blue-500" />
                      Paso 3: Logística y Detalles de Vuelo
                    </h3>
                    <p className={`text-xs mt-0.5 ${t.textMuted}`}>Introduce tus pases e itinerario para coordinar tu recepción en el aeropuerto y autobuses de traslado.</p>
                  </div>

                  <div className={`${t.section} flex items-center justify-between gap-4 transition-colors duration-300`}>
                    <div>
                      <p className={`text-xs font-bold ${t.textHeading}`}>¿Ya posees vuelos confirmados?</p>
                      <p className={`text-[11px] ${t.textMuted}`}>Si no los tienes aún, puedes guardarlos después en cualquier momento iniciando sesión.</p>
                    </div>
                    <button 
                      onClick={() => setHasFlights(!hasFlights)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
                        hasFlights 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                      }`}
                    >
                      {hasFlights ? "No tengo vuelos aún" : "Sí, registrar vuelos"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {hasFlights && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden pt-2 text-xs"
                      >
                        
                        {/* Arrival Block */}
                        <div className={`border p-4 rounded-2xl space-y-3 transition-colors duration-300 ${
                          isDarkMode 
                            ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300" 
                            : "bg-emerald-50/40 border-emerald-100 text-emerald-900"
                        }`}>
                          <h4 className={`font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                            isDarkMode ? "text-emerald-400" : "text-emerald-800"
                          }`}>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            Itinerario de Llegada (Aeropuerto Sede)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>Fecha de Llegada</label>
                              <input 
                                type="date"
                                value={vueloLlegadaFecha}
                                onChange={e => setVueloLlegadaFecha(e.target.value)}
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>Hora de Llegada</label>
                              <input 
                                type="time"
                                value={vueloLlegadaHora}
                                onChange={e => setVueloLlegadaHora(e.target.value)}
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>Aerolínea *</label>
                              <input 
                                type="text"
                                value={vueloLlegadaAerolinea}
                                onChange={e => setVueloLlegadaAerolinea(e.target.value)}
                                placeholder="Ej. Aeroméxico"
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>No. de Vuelo *</label>
                              <input 
                                type="text"
                                value={vueloLlegadaNoVuelo}
                                onChange={e => setVueloLlegadaNoVuelo(e.target.value)}
                                placeholder="Ej. AM-504"
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>No. Personas Llegando</label>
                              <input 
                                type="number"
                                value={vueloLlegadaPersonas}
                                min={1}
                                onChange={e => setVueloLlegadaPersonas(Number(e.target.value))}
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                          </div>
                        </div>
 
                        {/* Departure Block */}
                        <div className={`border p-4 rounded-2xl space-y-3 transition-colors duration-300 ${
                          isDarkMode 
                            ? "bg-blue-950/20 border-blue-900/40 text-blue-300" 
                            : "bg-blue-50/40 border-blue-100 text-blue-900"
                        }`}>
                          <h4 className={`font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                            isDarkMode ? "text-blue-400" : "text-blue-800"
                          }`}>
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                            Itinerario de Retorno / Regreso
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>Fecha de Salida</label>
                              <input 
                                type="date"
                                value={vueloRegresoFecha}
                                onChange={e => setVueloRegresoFecha(e.target.value)}
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>Hora de Salida</label>
                              <input 
                                type="time"
                                value={vueloRegresoHora}
                                onChange={e => setVueloRegresoHora(e.target.value)}
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>Aerolínea *</label>
                              <input 
                                type="text"
                                value={vueloRegresoAerolinea}
                                onChange={e => setVueloRegresoAerolinea(e.target.value)}
                                placeholder="Ej. Volaris"
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>No. de Vuelo *</label>
                              <input 
                                type="text"
                                value={vueloRegresoNoVuelo}
                                onChange={e => setVueloRegresoNoVuelo(e.target.value)}
                                placeholder="Ej. Y4-740"
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                            <div>
                              <label className={`block font-bold mb-0.5 ${t.label}`}>No. Personas Retorno</label>
                              <input 
                                type="number"
                                value={vueloRegresoPersonas}
                                min={1}
                                onChange={e => setVueloRegresoPersonas(Number(e.target.value))}
                                className={`${t.inputWhite} transition-colors duration-300`}
                              />
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`border-t pt-5 flex justify-between ${t.border}`}>
                    <button 
                      onClick={handlePrev}
                      className={t.btnSec + " flex items-center gap-1.5"}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Atrás</span>
                    </button>
                    <button 
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
                    >
                      <span>Siguiente: Hospedaje</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
                      <Bed className="w-5 h-5 text-blue-500" />
                      Paso 4: Elección de Hospedaje y Confirmación
                    </h3>
                    <p className={`text-xs mt-0.5 ${t.textMuted}`}>Elige tu carnet de hospedaje para el hotel sede {config?.hotelSede || "asignado"} y valida el resumen de costos.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    
                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Carnet Tipo Habitación</label>
                      <select 
                        value={carnetTipoHabitacion}
                        onChange={e => setCarnetTipoHabitacion(e.target.value)}
                        className={`${t.inputWhite} transition-colors duration-300`}
                      >
                        <option value="Sencilla">Sencilla (3 noches: $13,500 MXN)</option>
                        <option value="Sencillo Extra">Sencilla Extra (3 noches: $15,000 MXN)</option>
                        <option value="Doble">Doble (3 noches: $16,500 MXN)</option>
                        <option value="Doble Extra">Doble Extra (3 noches: $18,000 MXN)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Configuración de Cama</label>
                      <select 
                        value={configuracionHabitacion}
                        onChange={e => setConfiguracionHabitacion(e.target.value)}
                        className={`${t.inputWhite} transition-colors duration-300`}
                      >
                        <option value="King">1 Cama King Size</option>
                        <option value="Queen/Queen">2 Camas Queen/Queen</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block font-bold uppercase mb-1 ${t.label}`}>Noches Adicionales</label>
                      <input 
                        type="number"
                        min={0}
                        max={5}
                        value={nochesAdicionales}
                        onChange={e => setNochesAdicionales(Number(e.target.value))}
                        className={`${t.inputWhite} transition-colors duration-300`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1 ${t.label}`}>Requerimientos o Comentarios Especiales</label>
                    <textarea 
                      value={requerimientosAdicionales}
                      onChange={e => setRequerimientosAdicionales(e.target.value)}
                      placeholder="Ej. Cuna para bebé, piso alto, alergias específicas o requerimientos de movilidad."
                      rows={2}
                      className={`${t.inputWhite} transition-colors duration-300`}
                    />
                  </div>

                  {/* Pricing / Cost Summary Panel */}
                  <div className={`rounded-2xl p-5 space-y-4 shadow-lg text-xs font-mono transition-colors duration-300 ${
                    isDarkMode 
                      ? "bg-slate-900 border border-slate-800 text-slate-100" 
                      : "bg-slate-950 text-white"
                  }`}>
                    <h4 className="font-bold text-blue-400 text-sm font-sans flex items-center justify-between border-b border-white/15 pb-2">
                      <span>Resumen de Cuotas de Hospedaje Sede</span>
                      <span className="text-white text-[10px] bg-blue-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">ADISTEM</span>
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>Hospedaje Tipo Carnet ({carnetTipoHabitacion}):</span>
                        <span className="font-semibold text-blue-200">
                          {carnetTipoHabitacion === "Sencilla" ? "$4,500" : carnetTipoHabitacion === "Sencillo Extra" ? "$5,000" : carnetTipoHabitacion === "Doble" ? "$5,500" : "$6,000"} MXN / noche
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Estadía Oficial Obligatoria (3 noches):</span>
                        <span>3 Noches</span>
                      </div>
                      {nochesAdicionales > 0 && (
                        <div className="flex justify-between text-amber-300">
                          <span>Noches adicionales solicitadas ({nochesAdicionales}):</span>
                          <span>+{nochesAdicionales} Noches</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>Habitaciones requeridas:</span>
                        <span>{numHabitaciones} Habitación</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-sans font-bold">
                        <span>Importe Total Calculado Sede:</span>
                        <span className="text-emerald-400 font-black text-base">
                          ${calculateTotalHotelCost().toLocaleString()} MXN
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans italic">
                      * El pago y facturación del carnet se realizará según las directrices acordadas por el Grupo y su Distribuidora con la coordinación del evento.
                    </p>
                  </div>

                  <div className={`border-t pt-5 flex justify-between ${t.border}`}>
                    <button 
                      onClick={handlePrev}
                      className={t.btnSec + " flex items-center gap-1.5"}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Atrás</span>
                    </button>
                    <button 
                      onClick={handleSaveRegistration}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5 animate-pulse"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loggedGuest ? "Guardar y Actualizar Cambios" : "Completar mi Registro Oficial"}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-4 border-emerald-50">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className={`text-2xl font-black ${t.textTitle}`}>¡Tu carnet de registro está confirmado!</h3>
                    <p className={`text-xs max-w-lg mx-auto ${t.textMuted}`}>
                      Tus datos se han guardado con éxito en la base de datos central en tiempo real y están vinculados a la app móvil de invitados de Stellantis México.
                    </p>
                  </div>

                  {/* Show summary */}
                  <div className={`border max-w-md mx-auto p-4 text-xs space-y-2.5 text-left rounded-2xl transition-colors duration-300 ${t.section} ${t.textHeading}`}>
                    <div className={`border-b pb-1.5 font-bold uppercase flex justify-between ${t.border}`}>
                      <span>Carnet Digital Unificado</span>
                      <span className="text-blue-500 font-extrabold">ID: {loggedGuest?.id}</span>
                    </div>
                    <div><strong className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Invitado:</strong> {nombreTitular} {apellidosTitular}</div>
                    <div><strong className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Distribuidora:</strong> {distribuidora} ({grupo})</div>
                    <div><strong className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Celular:</strong> {celularTitular}</div>
                    <div><strong className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Acompañante:</strong> {hasCompanion ? `${nombreAcompanante} ${apellidosAcompanante}` : "Ninguno"}</div>
                    <div><strong className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Menores:</strong> {numMinors > 0 ? `${numMinors} registrado(s)` : "Ninguno"}</div>
                    <div><strong className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Hotel Sede:</strong> {config?.hotelSede || "Por definir"}</div>
                    <div><strong className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Habitación Sede:</strong> {numHabitaciones} • {carnetTipoHabitacion} • {configuracionHabitacion}</div>
                    <div><strong className={isDarkMode ? "text-slate-300" : "text-slate-800"}>Total Hospedaje:</strong> ${calculateTotalHotelCost().toLocaleString()} MXN</div>
                    {hasFlights ? (
                      <div className="text-emerald-500 font-bold">✓ Vuelos registrados: {vueloLlegadaNoVuelo} / {vueloRegresoNoVuelo}</div>
                    ) : (
                      <div className="text-rose-500 font-bold">✗ Vuelos pendientes por registrar</div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className={`p-3 text-xs rounded-xl max-w-md mx-auto border transition-colors duration-300 ${
                      isDarkMode 
                        ? "bg-blue-950/20 border-blue-900/30 text-blue-300" 
                        : "bg-blue-50 border-blue-100 text-blue-900"
                    }`}>
                      Puedes volver a este portal con tu correo <strong>{correoTitular}</strong> para actualizar tus pases de abordar e itinerario cuando quieras.
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => setCurrentStep(1)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Modificar mis datos / Re-editar
                      </button>
                      <button 
                        onClick={handleLogout}
                        className={t.btnSec}
                      >
                        Finalizar y Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
