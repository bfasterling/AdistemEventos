import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Users, Plane, Bed, Calendar, FileText, AlertCircle, CheckCircle, 
  ChevronRight, ChevronLeft, Save, Plus, Trash2, ArrowRight, LogIn, Lock, Mail, Phone, PlusCircle,
  Sun, Moon, Key, Eye, EyeOff
} from "lucide-react";
import { DataStore } from "../dataStore";
import LogoConvencion from "../assets/images/Logo_convencion_reducido.png";
import { Guest, Companion, GuestStatus, HotelConfig, PortalUser } from "../types";
import { GROUPS_DATA, GROUPS_LIST } from "../groupsData";

import LodgingStep from "./LodgingStep";
import TitularStep from "./TitularStep";
import CompanionsStep from "./CompanionsStep";
import FlightsStep from "./FlightsStep";
import ActivitiesStep from "./ActivitiesStep";
import SummaryStep from "./SummaryStep";

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
      ? "w-full p-2.5 bg-slate-850 border border-[#56B7A9] rounded-xl text-slate-100 font-medium focus:border-[#56B7A9] focus:outline-hidden transition-colors" 
      : "w-full p-2.5 bg-slate-50 border border-[#56B7A9] rounded-xl text-slate-800 font-medium focus:border-[#56B7A9] focus:outline-hidden transition-colors",
    inputWhite: isDarkMode 
      ? "w-full p-2.5 bg-slate-800 border border-[#56B7A9] rounded-xl text-slate-100 font-medium focus:outline-hidden transition-colors" 
      : "w-full p-2.5 bg-white border border-[#56B7A9] rounded-xl text-slate-800 font-medium focus:outline-hidden transition-colors",
    inputWhiteS: isDarkMode 
      ? "w-full p-2 bg-slate-800 border border-[#56B7A9] rounded-lg text-slate-100 focus:outline-hidden transition-colors" 
      : "w-full p-2 bg-white border border-[#56B7A9] rounded-lg text-slate-800 focus:outline-hidden transition-colors",
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
      ? "px-6 py-3 border border-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer text-sm"
      : "px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer text-sm"
  };

  // Authentication states
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [isSignUpScreen, setIsSignUpScreen] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState<boolean>(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // New States for Password Recovery
  const [showRecoverPassword, setShowRecoverPassword] = useState<boolean>(false);
  const [recoverEmail, setRecoverEmail] = useState<string>("");
  const [recoverSuccess, setRecoverSuccess] = useState<string | null>(null);
  const [recoverError, setRecoverError] = useState<string | null>(null);
  const [recoverLoading, setRecoverLoading] = useState<boolean>(false);

  // New States for separate access account creation
  const [signUpEmail, setSignUpEmail] = useState<string>("");
  const [signUpPassword, setSignUpPassword] = useState<string>("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState<string>("");
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Track active access user session
  const [activeAccessUser, setActiveAccessUser] = useState<PortalUser | null>(null);

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

  // New multi-companion list state
  const [companionsList, setCompanionsList] = useState<Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    sex: string;
    allergies: string;
    ineAttached: boolean;
  }>>([]);

  const addCompanionItem = () => {
    setCompanionsList(prev => [
      ...prev,
      {
        id: `C-${Date.now()}-${prev.length + 1}`,
        firstName: "",
        lastName: "",
        relationship: "Esposo/a",
        sex: "F",
        allergies: "",
        ineAttached: false
      }
    ]);
  };

  const removeCompanionItem = (id: string) => {
    setCompanionsList(prev => prev.filter(c => c.id !== id));
  };

  const updateCompanionItem = (id: string, field: string, value: any) => {
    setCompanionsList(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleToggleCompanion = () => {
    if (!hasCompanion) {
      setHasCompanion(true);
      if (companionsList.length === 0) {
        setCompanionsList([
          {
            id: `C-${Date.now()}-1`,
            firstName: "",
            lastName: "",
            relationship: "Esposo/a",
            sex: "F",
            allergies: "",
            ineAttached: false
          }
        ]);
      }
    } else {
      setHasCompanion(false);
    }
  };

  // Password for new registration account
  const [regPassword, setRegPassword] = useState<string>("");

  // Minors list state
  const [numMinors, setNumMinors] = useState<number>(0);
  const [minors, setMinors] = useState<Array<{ name: string; lastName: string; age: number; sex: string; allergies: string }>>([]);

  // Flight states
  const [hasFlights, setHasFlights] = useState<boolean>(false);
  const [vuelosSeparados, setVuelosSeparados] = useState<boolean>(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [vueloLlegadaFecha, setVueloLlegadaFecha] = useState<string>(() => DataStore.getEventConfig()?.eventStartDate || "2026-11-15");
  const [vueloLlegadaHora, setVueloLlegadaHora] = useState<string>("12:00");
  const [vueloLlegadaAerolinea, setVueloLlegadaAerolinea] = useState<string>("");
  const [vueloLlegadaNoVuelo, setVueloLlegadaNoVuelo] = useState<string>("");
  const [vueloLlegadaPersonas, setVueloLlegadaPersonas] = useState<number>(1);
  const [vueloLlegadaPasajerosTitular, setVueloLlegadaPasajerosTitular] = useState<string[]>(["titular"]);

  const [vueloRegresoFecha, setVueloRegresoFecha] = useState<string>(() => DataStore.getEventConfig()?.eventEndDate || "2026-11-18");
  const [vueloRegresoHora, setVueloRegresoHora] = useState<string>("15:00");
  const [vueloRegresoAerolinea, setVueloRegresoAerolinea] = useState<string>("");
  const [vueloRegresoNoVuelo, setVueloRegresoNoVuelo] = useState<string>("");
  const [vueloRegresoPersonas, setVueloRegresoPersonas] = useState<number>(1);
  const [vueloRegresoPasajerosTitular, setVueloRegresoPasajerosTitular] = useState<string[]>(["titular"]);

  // Hotel configuration states
  const [numHabitaciones, setNumHabitaciones] = useState<number>(1);
  const [configuracionHabitacion, setConfiguracionHabitacion] = useState<string>("King");
  const [carnetTipoHabitacion, setCarnetTipoHabitacion] = useState<string>("Sencilla");
  const [nochesAdicionales, setNochesAdicionales] = useState<number>(0);
  const [requerimientosAdicionales, setRequerimientosAdicionales] = useState<string>("");

  // Bed configuration sync based on selected room type and companion reset if Sencillo
  useEffect(() => {
    const isSencillo = carnetTipoHabitacion === "Sencillo" || carnetTipoHabitacion === "Sencilla" || carnetTipoHabitacion === "Sencillo Extra" || carnetTipoHabitacion === "Sencilla Extra" || carnetTipoHabitacion.startsWith("Sencilla");
    if (isSencillo) {
      setConfiguracionHabitacion("King");
      setHasCompanion(false);
    } else {
      setConfiguracionHabitacion("Queen/Queen");
    }
  }, [carnetTipoHabitacion]);

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
      setActiveAccessUser(foundUser);
      const allGuests = DataStore.getGuests();
      const guest = allGuests.find(g => g.id === foundUser.guestId);
      if (guest) {
        setLoggedGuest(guest);
        loadGuestToForm(guest);
        setSuccessMessage(`Sesión iniciada correctamente. Bienvenido, ${guest.name}.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        // Logged in successfully but guest details are not yet completed
        setLoggedGuest(null);
        resetAllFormFields();
        setCorreoTitular(foundUser.email);
        setSuccessMessage("Sesión iniciada. Por favor completa tu registro de carnet.");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } else {
      setLoginError("Este perfil no tiene permisos para acceder al portal de invitados.");
    }
  };

  const handleRecoverPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverError(null);
    setRecoverSuccess(null);
    setRecoverLoading(true);

    try {
      const users = DataStore.getUsers();
      const foundUser = users.find(
        u => u.email.toLowerCase() === recoverEmail.trim().toLowerCase()
      );

      if (!foundUser) {
        setRecoverError("El correo electrónico ingresado no está registrado.");
        setRecoverLoading(false);
        return;
      }

      const response = await fetch("/api/recover-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: foundUser.email,
          password: foundUser.password || "No establecida"
        })
      });

      const data = await response.json();
      if (data.success) {
        setRecoverSuccess("¡Éxito! Se ha enviado un correo con tus datos de acceso. Por favor revisa tu bandeja de entrada o spam.");
        setRecoverEmail("");
      } else {
        setRecoverError(data.error || "Ocurrió un error al intentar enviar el correo de recuperación.");
      }
    } catch (err: any) {
      console.error("Error recuperando contraseña:", err);
      setRecoverError("Error de conexión al servidor. Por favor intenta de nuevo.");
    } finally {
      setRecoverLoading(false);
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    const emailTrimmed = signUpEmail.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes("@")) {
      setSignUpError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    if (!signUpPassword || signUpPassword.length < 4) {
      setSignUpError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError("Las contraseñas no coinciden. Verifica que estén escritas igual.");
      return;
    }

    const users = DataStore.getUsers();
    const exists = users.some(u => u.email.toLowerCase() === emailTrimmed);
    if (exists) {
      setSignUpError("Esta cuenta de correo ya se encuentra registrada. Por favor inicia sesión.");
      return;
    }

    // Success! Generate guestId and pre-create the PortalUser
    const newGuestId = `G-${Date.now()}`;
    const newUser: PortalUser = {
      id: emailTrimmed,
      email: emailTrimmed,
      password: signUpPassword,
      role: "Invitado",
      guestId: newGuestId
    };

    const res = DataStore.addUser(newUser);
    if (!res.success) {
      setSignUpError(res.error || "Ocurrió un error al crear el usuario.");
      return;
    }

    // Success! Log them in under this brand new access account
    setActiveAccessUser(newUser);
    setLoggedGuest(null);
    setIsSignUpScreen(false);
    
    // Reset wizard fields to default for a fresh registration
    resetAllFormFields();
    setCorreoTitular(emailTrimmed);

    setSuccessMessage("Cuenta creada con éxito. Comienza tu registro completando los datos del titular.");
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const resetAllFormFields = () => {
    setGrupo("Stellantis");
    setDistribuidora("");
    setNombreTitular("");
    setApellidosTitular("");
    setCorreoTitular("");
    setCelularTitular("");
    setSexo("M");
    setAlergiasTitular("");
    setHasCompanion(false);
    setNombreAcompanante("");
    setApellidosAcompanante("");
    setSexoAcompanante("F");
    setAlergiasAcompanante("");
    setIneTitular(false);
    setIneAcompanante(false);
    setCompanionsList([]);
    setRegPassword("");
    setNumMinors(0);
    setMinors([]);
    setHasFlights(false);
    setVuelosSeparados(false);
    setSelectedActivities([]);
    setVueloLlegadaFecha(DataStore.getEventConfig()?.eventStartDate || "2026-11-15");
    setVueloLlegadaHora("12:00");
    setVueloLlegadaAerolinea("");
    setVueloLlegadaNoVuelo("");
    setVueloLlegadaPersonas(1);
    setVueloLlegadaPasajerosTitular(["titular"]);
    setVueloRegresoFecha(DataStore.getEventConfig()?.eventEndDate || "2026-11-18");
    setVueloRegresoHora("15:00");
    setVueloRegresoAerolinea("");
    setVueloRegresoNoVuelo("");
    setVueloRegresoPersonas(1);
    setVueloRegresoPasajerosTitular(["titular"]);
    setNumHabitaciones(1);
    setConfiguracionHabitacion("King");
    setCarnetTipoHabitacion("Sencilla");
    setNochesAdicionales(0);
    setRequerimientosAdicionales("");
    setValidationError(null);
    setCurrentStep(1);
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
    setVuelosSeparados(guest.vuelosSeparados || false);
    setSelectedActivities(guest.selectedActivities || []);

    if (guest.companions && guest.companions.length > 0) {
      const adultComps = guest.companions.filter(c => !c.relationship.includes("Menor"));
      if (adultComps.length > 0) {
        setHasCompanion(true);
        setCompanionsList(adultComps.map(c => {
          let fName = c.firstName || "";
          let lName = c.lastName || "";
          if (!fName && !lName) {
            const parts = (c.name || "").split(" ");
            fName = parts[0] || "";
            lName = parts.slice(1).join(" ") || "";
          }
          return {
            id: c.id,
            firstName: fName,
            lastName: lName,
            relationship: c.relationship || "Esposo/a",
            sex: c.sex || "F",
            allergies: c.allergies || "",
            ineAttached: c.ineAttached || false,
            selectedActivities: c.selectedActivities || [],
            vueloLlegadaAerolinea: c.vueloLlegadaAerolinea || "",
            vueloLlegadaNoVuelo: c.vueloLlegadaNoVuelo || "",
            vueloLlegadaFecha: c.vueloLlegadaFecha || (DataStore.getEventConfig()?.eventStartDate || "2026-11-15"),
            vueloLlegadaHora: c.vueloLlegadaHora || "12:00",
            vueloLlegadaPasajeros: c.vueloLlegadaPasajeros || [c.id],
            vueloRegresoAerolinea: c.vueloRegresoAerolinea || "",
            vueloRegresoNoVuelo: c.vueloRegresoNoVuelo || "",
            vueloRegresoFecha: c.vueloRegresoFecha || (DataStore.getEventConfig()?.eventEndDate || "2026-11-18"),
            vueloRegresoHora: c.vueloRegresoHora || "15:00",
            vueloRegresoPasajeros: c.vueloRegresoPasajeros || [c.id],
          };
        }));
      } else if (guest.nombreAcompanante) {
        setHasCompanion(true);
        setCompanionsList([{
          id: "C-1",
          firstName: guest.nombreAcompanante,
          lastName: guest.apellidosAcompanante || "",
          relationship: "Acompañante Adulto",
          sex: guest.sexoAcompanante || "F",
          allergies: guest.alergiasAcompanante || "",
          ineAttached: guest.ineAcompanante || false,
          selectedActivities: [],
          vueloLlegadaAerolinea: "",
          vueloLlegadaNoVuelo: "",
          vueloLlegadaFecha: DataStore.getEventConfig()?.eventStartDate || "2026-11-15",
          vueloLlegadaHora: "12:00",
          vueloRegresoAerolinea: "",
          vueloRegresoNoVuelo: "",
          vueloRegresoFecha: DataStore.getEventConfig()?.eventEndDate || "2026-11-18",
          vueloRegresoHora: "15:00",
        }]);
      } else {
        setHasCompanion(false);
        setCompanionsList([]);
      }
    } else if (guest.nombreAcompanante) {
      setHasCompanion(true);
      setCompanionsList([{
        id: "C-1",
        firstName: guest.nombreAcompanante,
        lastName: guest.apellidosAcompanante || "",
        relationship: "Acompañante Adulto",
        sex: guest.sexoAcompanante || "F",
        allergies: guest.alergiasAcompanante || "",
        ineAttached: guest.ineAcompanante || false,
        selectedActivities: [],
        vueloLlegadaAerolinea: "",
        vueloLlegadaNoVuelo: "",
        vueloLlegadaFecha: DataStore.getEventConfig()?.eventStartDate || "2026-11-15",
        vueloLlegadaHora: "12:00",
        vueloRegresoAerolinea: "",
        vueloRegresoNoVuelo: "",
        vueloRegresoFecha: DataStore.getEventConfig()?.eventEndDate || "2026-11-18",
        vueloRegresoHora: "15:00",
      }]);
    } else {
      setHasCompanion(false);
      setCompanionsList([]);
    }

    setNumMinors(guest.numMenores || 0);
    if (guest.numMenores && guest.numMenores > 0 && guest.minors) {
      setMinors(guest.minors);
    } else if (guest.numMenores && guest.numMenores > 0 && guest.companions) {
      const loadedMinors = guest.companions.filter(c => c.relationship.includes("Menor")).map(c => {
        let fName = c.firstName || "";
        let lName = c.lastName || "";
        if (!fName && !lName) {
          const parts = (c.name || "").split(" ");
          fName = parts[0] || "";
          lName = parts.slice(1).join(" ") || "";
        }
        return {
          name: fName,
          lastName: lName,
          age: c.relationship.includes("Edad:") ? parseInt(c.relationship.split("Edad:")[1]) || 10 : 10,
          sex: "M" as const,
          allergies: c.allergies || ""
        };
      });
      setMinors(loadedMinors);
    } else {
      setMinors([]);
    }

    if (guest.vueloLlegadaFecha) {
      setHasFlights(true);
      setVuelosSeparados(!!guest.vuelosSeparados);
      setVueloLlegadaFecha(guest.vueloLlegadaFecha);
      setVueloLlegadaHora(guest.vueloLlegadaHora || "");
      setVueloLlegadaAerolinea(guest.vueloLlegadaAerolinea || "");
      setVueloLlegadaNoVuelo(guest.vueloLlegadaNoVuelo || "");
      setVueloLlegadaPersonas(guest.vueloLlegadaPersonas || 1);
      setVueloLlegadaPasajerosTitular(guest.vueloLlegadaPasajerosTitular || ["titular"]);

      setVueloRegresoFecha(guest.vueloRegresoFecha || "");
      setVueloRegresoHora(guest.vueloRegresoHora || "");
      setVueloRegresoAerolinea(guest.vueloRegresoAerolinea || "");
      setVueloRegresoNoVuelo(guest.vueloRegresoNoVuelo || "");
      setVueloRegresoPersonas(guest.vueloRegresoPersonas || 1);
      setVueloRegresoPasajerosTitular(guest.vueloRegresoPasajerosTitular || ["titular"]);
    } else {
      setHasFlights(false);
      setVuelosSeparados(false);
      setVueloLlegadaPasajerosTitular(["titular"]);
      setVueloRegresoPasajerosTitular(["titular"]);
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

  const validateStepForNumber = (stepNum: number): boolean => {
    setValidationError(null);

    if (stepNum === 1) {
      if (nochesAdicionales < 0 || nochesAdicionales > 23) {
        setValidationError("Las noches adicionales no pueden exceder de 23.");
        return false;
      }
      return true;
    }

    if (stepNum === 2) {
      if (!distribuidora || !distribuidora.trim()) {
        setValidationError("La Razón Social / Distribuidora es obligatoria.");
        return false;
      }
      if (!nombreTitular || !nombreTitular.trim() || !apellidosTitular || !apellidosTitular.trim()) {
        setValidationError("El nombre y apellidos del titular son obligatorios.");
        return false;
      }
      if (!correoTitular || !correoTitular.trim() || !correoTitular.includes("@")) {
        setValidationError("El correo del titular es obligatorio y debe ser un correo válido.");
        return false;
      }
      if (!celularTitular || !celularTitular.trim()) {
        setValidationError("El celular del titular es obligatorio.");
        return false;
      }
      return true;
    }

    if (stepNum === 3) {
      if (hasCompanion) {
        if (companionsList.length === 0) {
          setValidationError("Agrega al menos un acompañante o desactiva la opción.");
          return false;
        }
        if (companionsList.length > 3) {
          setValidationError("El límite máximo es de 3 acompañantes adultos.");
          return false;
        }
        for (let i = 0; i < companionsList.length; i++) {
          const comp = companionsList[i];
          if (!comp.firstName.trim() || !comp.lastName.trim()) {
            setValidationError(`Ingresa el nombre y apellidos completos para el acompañante adulto #${i + 1}.`);
            return false;
          }
        }
      }
      if (companionsList.length >= 3 && numMinors > 0) {
        setValidationError("Si se registran 3 adultos acompañantes, no se permite registrar menores.");
        return false;
      }
      if (numMinors > 2) {
        setValidationError("El límite máximo es de 2 menores.");
        return false;
      }
      for (let i = 0; i < minors.length; i++) {
        const minor = minors[i];
        if (minor.age < 0 || minor.age > 17) {
          setValidationError(`La edad del menor #${i + 1} debe estar entre 0 y 17 años.`);
          return false;
        }
      }
      return true;
    }

    if (stepNum === 4) {
      if (hasFlights) {
        if (!vuelosSeparados) {
          if (!vueloLlegadaAerolinea) {
            setValidationError("Selecciona la aerolínea/transporte de llegada.");
            return false;
          }
          if (vueloLlegadaAerolinea !== "Terrestre") {
            if (!vueloLlegadaNoVuelo || !vueloLlegadaNoVuelo.trim()) {
              setValidationError(vueloLlegadaAerolinea === "Privado" ? "Ingresa la matrícula para el vuelo privado de llegada." : "Ingresa el número de vuelo de llegada.");
              return false;
            }
          }
          if (!vueloLlegadaFecha || !vueloLlegadaFecha.trim()) {
            setValidationError("Ingresa la fecha de llegada.");
            return false;
          }
          if (!vueloLlegadaHora || !vueloLlegadaHora.trim()) {
            setValidationError("Ingresa la hora de llegada.");
            return false;
          }
          if (!vueloRegresoAerolinea) {
            setValidationError("Selecciona la aerolínea/transporte de salida.");
            return false;
          }
          if (vueloRegresoAerolinea !== "Terrestre") {
            if (!vueloRegresoNoVuelo || !vueloRegresoNoVuelo.trim()) {
              setValidationError(vueloRegresoAerolinea === "Privado" ? "Ingresa la matrícula para el vuelo privado de salida." : "Ingresa el número de vuelo de salida.");
              return false;
            }
          }
          if (!vueloRegresoFecha || !vueloRegresoFecha.trim()) {
            setValidationError("Ingresa la fecha de salida.");
            return false;
          }
          if (!vueloRegresoHora || !vueloRegresoHora.trim()) {
            setValidationError("Ingresa la hora de salida.");
            return false;
          }
        } else {
          // Separate flight checks
          if (!vueloLlegadaAerolinea) {
            setValidationError("Selecciona la aerolínea/transporte de llegada para el titular.");
            return false;
          }
          if (vueloLlegadaAerolinea !== "Terrestre" && (!vueloLlegadaNoVuelo || !vueloLlegadaNoVuelo.trim())) {
            setValidationError("Ingresa número de vuelo/matrícula de llegada para el titular.");
            return false;
          }
          if (!vueloLlegadaFecha || !vueloLlegadaFecha.trim()) {
            setValidationError("Ingresa la fecha de llegada para el titular.");
            return false;
          }
          if (!vueloLlegadaHora || !vueloLlegadaHora.trim()) {
            setValidationError("Ingresa la hora de llegada para el titular.");
            return false;
          }
          if (!vueloRegresoAerolinea) {
            setValidationError("Selecciona la aerolínea/transporte de salida para el titular.");
            return false;
          }
          if (vueloRegresoAerolinea !== "Terrestre" && (!vueloRegresoNoVuelo || !vueloRegresoNoVuelo.trim())) {
            setValidationError("Ingresa número de vuelo/matrícula de salida para el titular.");
            return false;
          }
          if (!vueloRegresoFecha || !vueloRegresoFecha.trim()) {
            setValidationError("Ingresa la fecha de salida para el titular.");
            return false;
          }
          if (!vueloRegresoHora || !vueloRegresoHora.trim()) {
            setValidationError("Ingresa la hora de salida para el titular.");
            return false;
          }

          for (let i = 0; i < companionsList.length; i++) {
            const comp = companionsList[i];
            if (!comp.vueloLlegadaAerolinea) {
              setValidationError(`Selecciona la aerolínea/transporte de llegada para el acompañante ${comp.firstName}.`);
              return false;
            }
            if (comp.vueloLlegadaAerolinea !== "Terrestre" && (!comp.vueloLlegadaNoVuelo || !comp.vueloLlegadaNoVuelo.trim())) {
              setValidationError(`Ingresa número de vuelo/matrícula de llegada para ${comp.firstName}.`);
              return false;
            }
            if (!comp.vueloLlegadaFecha || !comp.vueloLlegadaFecha.trim()) {
              setValidationError(`Ingresa la fecha de llegada para el acompañante ${comp.firstName}.`);
              return false;
            }
            if (!comp.vueloLlegadaHora || !comp.vueloLlegadaHora.trim()) {
              setValidationError(`Ingresa la hora de llegada para el acompañante ${comp.firstName}.`);
              return false;
            }
            if (!comp.vueloRegresoAerolinea) {
              setValidationError(`Selecciona la aerolínea/transporte de salida para el acompañante ${comp.firstName}.`);
              return false;
            }
            if (comp.vueloRegresoAerolinea !== "Terrestre" && (!comp.vueloRegresoNoVuelo || !comp.vueloRegresoNoVuelo.trim())) {
              setValidationError(`Ingresa número de vuelo/matrícula de salida para ${comp.firstName}.`);
              return false;
            }
            if (!comp.vueloRegresoFecha || !comp.vueloRegresoFecha.trim()) {
              setValidationError(`Ingresa la fecha de salida para el acompañante ${comp.firstName}.`);
              return false;
            }
            if (!comp.vueloRegresoHora || !comp.vueloRegresoHora.trim()) {
              setValidationError(`Ingresa la hora de salida para el acompañante ${comp.firstName}.`);
              return false;
            }
          }
        }
      }
      return true;
    }

    if (stepNum === 5) {
      return true;
    }

    return true;
  };

  const validateStep = (): boolean => {
    return validateStepForNumber(currentStep);
  };

  const autoSaveProgress = (targetStepNum?: number) => {
    const allCompanions: Companion[] = [];
    if (hasCompanion) {
      companionsList.forEach((comp, idx) => {
        allCompanions.push({
          id: comp.id || `C-${idx + 1}`,
          name: `${comp.firstName} ${comp.lastName}`.trim(),
          relationship: comp.relationship || "Acompañante Adulto",
          allergies: comp.allergies || "Ninguna",
          requirements: "",
          firstName: comp.firstName.trim(),
          lastName: comp.lastName.trim(),
          sex: comp.sex || "F",
          ineAttached: comp.ineAttached || false,
          selectedActivities: comp.selectedActivities || [],
          vueloLlegadaAerolinea: comp.vueloLlegadaAerolinea,
          vueloLlegadaNoVuelo: comp.vueloLlegadaNoVuelo,
          vueloLlegadaFecha: comp.vueloLlegadaFecha,
          vueloLlegadaHora: comp.vueloLlegadaHora,
          vueloRegresoAerolinea: comp.vueloRegresoAerolinea,
          vueloRegresoNoVuelo: comp.vueloRegresoNoVuelo,
          vueloRegresoFecha: comp.vueloRegresoFecha,
          vueloRegresoHora: comp.vueloRegresoHora,
        });
      });
    }

    minors.forEach((m, idx) => {
      allCompanions.push({
        id: `M-${idx + 1}`,
        name: (m.name && m.name.trim()) ? `${m.name} ${m.lastName}`.trim() : `Menor #${idx + 1} (${m.age === 0 ? "0-11 meses" : `${m.age} años`})`,
        relationship: `Menor (Edad: ${m.age === 0 ? "0-11 meses" : `${m.age} años`})`,
        allergies: m.allergies,
        requirements: ""
      });
    });

    const isEditing = !!loggedGuest;
    const guestId = isEditing ? loggedGuest!.id : (activeAccessUser?.guestId || `G-${Date.now()}`);
    const emailToUse = correoTitular.toLowerCase().trim() || activeAccessUser?.email || "borrador@distribuidor.com";
    const nameToUse = `${nombreTitular} ${apellidosTitular}`.trim() || "Borrador de Invitado";

    const draftGuestData: Guest = {
      id: guestId,
      email: emailToUse,
      name: nameToUse,
      phone: celularTitular,
      distributor: distribuidora,
      role: "Guest",
      status: GuestStatus.INCOMPLETE,
      stage: targetStepNum || currentStep,
      companions: allCompanions,
      allergies: [],
      allergiesCustom: alergiasTitular,
      specialRequirements: requerimientosAdicionales,
      selectedActivities: selectedActivities,
      createdAt: isEditing ? loggedGuest!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      grupo,
      distribuidora,
      nombreTitular,
      apellidosTitular,
      correoTitular: emailToUse,
      celularTitular,
      sexo,
      alergiasTitular,
      numMenores: numMinors,
      alergiasMenores: minors.map(m => m.allergies),
      numHabitaciones,
      configuracionHabitacion,
      carnetTipoHabitacion,
      nochesAdicionales,
      requerimientosAdicionales,
      ineTitular,
      ineAcompanante,
      vuelosSeparados,
      draftSaved: true,
      minors,

      vueloLlegadaFecha: hasFlights ? vueloLlegadaFecha : undefined,
      vueloLlegadaHora: hasFlights ? vueloLlegadaHora : undefined,
      vueloLlegadaAerolinea: hasFlights ? vueloLlegadaAerolinea : undefined,
      vueloLlegadaNoVuelo: hasFlights ? vueloLlegadaNoVuelo : undefined,
      vueloLlegadaPersonas: hasFlights ? vueloLlegadaPersonas : undefined,
      vueloLlegadaPasajerosTitular: hasFlights ? vueloLlegadaPasajerosTitular : undefined,
      vueloRegresoFecha: hasFlights ? vueloRegresoFecha : undefined,
      vueloRegresoHora: hasFlights ? vueloRegresoHora : undefined,
      vueloRegresoAerolinea: hasFlights ? vueloRegresoAerolinea : undefined,
      vueloRegresoNoVuelo: hasFlights ? vueloRegresoNoVuelo : undefined,
      vueloRegresoPersonas: hasFlights ? vueloRegresoPersonas : undefined,
      vueloRegresoPasajerosTitular: hasFlights ? vueloRegresoPasajerosTitular : undefined,
    };

    try {
      const guests = DataStore.getGuests();
      const existsInStore = guests.some(g => g.id === guestId);

      if (existsInStore) {
        DataStore.saveGuest(draftGuestData, nameToUse, emailToUse, true);
      } else {
        DataStore.addGuest(draftGuestData, nameToUse, emailToUse);
        if (activeAccessUser && activeAccessUser.guestId !== guestId) {
          const updatedUser = { ...activeAccessUser, guestId };
          DataStore.saveUser(updatedUser);
          setActiveAccessUser(updatedUser);
        }
      }
      setLoggedGuest(draftGuestData);
    } catch (err: any) {
      console.error("Autosave failed silently:", err);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      const nextStep = currentStep + 1;
      autoSaveProgress(nextStep);
      setCurrentStep(nextStep);
    }
  };

  const handlePrev = () => {
    const prevStep = Math.max(1, currentStep - 1);
    autoSaveProgress(prevStep);
    setCurrentStep(prevStep);
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      autoSaveProgress(targetStep);
      setCurrentStep(targetStep);
      return;
    }
    // Forward navigation: check if all preceding steps are valid!
    let canProceed = true;
    for (let s = 1; s < targetStep; s++) {
      if (!validateStepForNumber(s)) {
        canProceed = false;
        break;
      }
    }
    if (canProceed) {
      setValidationError(null);
      autoSaveProgress(targetStep);
      setCurrentStep(targetStep);
    }
  };

  // Cost calculations
  const calculateTotalHotelCost = (): number => {
    const hotels = DataStore.getHotels();
    const hotelSedeName = config?.hotelSede || "Sin asignar";
    const hotel = hotels.find(h => h.name === hotelSedeName) || hotels[0];
    if (!hotel) return 0;

    let baseRate = hotel.costSencilla;
    if (carnetTipoHabitacion === "Sencillo Extra" || carnetTipoHabitacion === "Sencilla Extra") {
      baseRate = hotel.costSencilloExtra;
    } else if (carnetTipoHabitacion === "Doble") {
      baseRate = hotel.costDoble;
    } else if (carnetTipoHabitacion === "Doble Extra") {
      baseRate = hotel.costDobleExtra;
    }

    return (3 + (nochesAdicionales || 0)) * baseRate * (numHabitaciones || 1);
  };

  const checkActivityConflict = (personId: string, candidateActivity: any, selectedActs: string[]): boolean => {
    const allActivities = DataStore.getActivities();
    const selectedObjList = allActivities.filter(a => selectedActs.includes(a.id) && a.id !== candidateActivity.id);
    return selectedObjList.some(a => a.dateTime === candidateActivity.dateTime);
  };

  const [draftSuccess, setDraftSuccess] = useState<boolean>(false);

  const handleSaveDraft = () => {
    setValidationError(null);
    const allCompanions: Companion[] = [];
    if (hasCompanion) {
      companionsList.forEach((comp, idx) => {
        allCompanions.push({
          id: comp.id || `C-${idx + 1}`,
          name: `${comp.firstName} ${comp.lastName}`.trim(),
          relationship: comp.relationship || "Acompañante Adulto",
          allergies: comp.allergies || "Ninguna",
          requirements: "",
          firstName: comp.firstName.trim(),
          lastName: comp.lastName.trim(),
          sex: comp.sex || "F",
          ineAttached: comp.ineAttached || false,
          selectedActivities: comp.selectedActivities || [],
          vueloLlegadaAerolinea: comp.vueloLlegadaAerolinea,
          vueloLlegadaNoVuelo: comp.vueloLlegadaNoVuelo,
          vueloLlegadaFecha: comp.vueloLlegadaFecha,
          vueloLlegadaHora: comp.vueloLlegadaHora,
          vueloRegresoAerolinea: comp.vueloRegresoAerolinea,
          vueloRegresoNoVuelo: comp.vueloRegresoNoVuelo,
          vueloRegresoFecha: comp.vueloRegresoFecha,
          vueloRegresoHora: comp.vueloRegresoHora,
        });
      });
    }

    minors.forEach((m, idx) => {
      allCompanions.push({
        id: `M-${idx + 1}`,
        name: (m.name && m.name.trim()) ? `${m.name} ${m.lastName}`.trim() : `Menor #${idx + 1} (${m.age === 0 ? "0-11 meses" : `${m.age} años`})`,
        relationship: `Menor (Edad: ${m.age === 0 ? "0-11 meses" : `${m.age} años`})`,
        allergies: m.allergies,
        requirements: ""
      });
    });

    const isEditing = !!loggedGuest;
    const guestId = isEditing ? loggedGuest!.id : (activeAccessUser?.guestId || `G-${Date.now()}`);
    const emailToUse = correoTitular.toLowerCase().trim() || activeAccessUser?.email || "borrador@distribuidor.com";

    const draftGuestData: Guest = {
      id: guestId,
      email: emailToUse,
      name: `${nombreTitular} ${apellidosTitular}`.trim() || "Borrador de Invitado",
      phone: celularTitular,
      distributor: distribuidora,
      role: "Guest",
      status: GuestStatus.INCOMPLETE,
      stage: 1,
      companions: allCompanions,
      allergies: [],
      allergiesCustom: alergiasTitular,
      specialRequirements: requerimientosAdicionales,
      selectedActivities: selectedActivities,
      createdAt: isEditing ? loggedGuest!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      grupo,
      distribuidora,
      nombreTitular,
      apellidosTitular,
      correoTitular: emailToUse,
      celularTitular,
      sexo,
      alergiasTitular,
      numMenores: numMinors,
      alergiasMenores: minors.map(m => m.allergies),
      numHabitaciones,
      configuracionHabitacion,
      carnetTipoHabitacion,
      nochesAdicionales,
      requerimientosAdicionales,
      ineTitular,
      ineAcompanante,
      vuelosSeparados,
      draftSaved: true,
      minors,

      vueloLlegadaFecha: hasFlights ? vueloLlegadaFecha : undefined,
      vueloLlegadaHora: hasFlights ? vueloLlegadaHora : undefined,
      vueloLlegadaAerolinea: hasFlights ? vueloLlegadaAerolinea : undefined,
      vueloLlegadaNoVuelo: hasFlights ? vueloLlegadaNoVuelo : undefined,
      vueloLlegadaPersonas: hasFlights ? vueloLlegadaPersonas : undefined,
      vueloLlegadaPasajerosTitular: hasFlights ? vueloLlegadaPasajerosTitular : undefined,
      vueloRegresoFecha: hasFlights ? vueloRegresoFecha : undefined,
      vueloRegresoHora: hasFlights ? vueloRegresoHora : undefined,
      vueloRegresoAerolinea: hasFlights ? vueloRegresoAerolinea : undefined,
      vueloRegresoNoVuelo: hasFlights ? vueloRegresoNoVuelo : undefined,
      vueloRegresoPersonas: hasFlights ? vueloRegresoPersonas : undefined,
      vueloRegresoPasajerosTitular: hasFlights ? vueloRegresoPasajerosTitular : undefined,
    };

    try {
      DataStore.saveGuest(draftGuestData, draftGuestData.name, emailToUse, true);
      setLoggedGuest(draftGuestData);
      setDraftSuccess(true);
      setTimeout(() => setDraftSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error saving draft:", err);
      setValidationError("Error al guardar borrador: " + err.message);
    }
  };

  const handleSaveRegistration = () => {
    setValidationError(null);

    // Prepare companion list for core Guest structure compatibility
    const allCompanions: Companion[] = [];
    if (hasCompanion) {
      companionsList.forEach((comp, idx) => {
        allCompanions.push({
          id: comp.id || `C-${idx + 1}`,
          name: `${comp.firstName} ${comp.lastName}`.trim(),
          relationship: comp.relationship || "Acompañante Adulto",
          allergies: comp.allergies || "Ninguna",
          requirements: "",
          firstName: comp.firstName.trim(),
          lastName: comp.lastName.trim(),
          sex: comp.sex || "F",
          ineAttached: comp.ineAttached || false,
          selectedActivities: comp.selectedActivities || [],
          vueloLlegadaAerolinea: comp.vueloLlegadaAerolinea,
          vueloLlegadaNoVuelo: comp.vueloLlegadaNoVuelo,
          vueloLlegadaFecha: comp.vueloLlegadaFecha,
          vueloLlegadaHora: comp.vueloLlegadaHora,
          vueloLlegadaPasajeros: comp.vueloLlegadaPasajeros,
          vueloRegresoAerolinea: comp.vueloRegresoAerolinea,
          vueloRegresoNoVuelo: comp.vueloRegresoNoVuelo,
          vueloRegresoFecha: comp.vueloRegresoFecha,
          vueloRegresoHora: comp.vueloRegresoHora,
          vueloRegresoPasajeros: comp.vueloRegresoPasajeros,
        });
      });
    }

    const isEditing = !!loggedGuest;
    const guestId = isEditing ? loggedGuest!.id : (activeAccessUser?.guestId || `G-${Date.now()}`);
    const emailToUse = correoTitular.toLowerCase().trim();

    minors.forEach((m, idx) => {
      allCompanions.push({
        id: `M-${idx + 1}`,
        name: (m.name && m.name.trim()) ? `${m.name} ${m.lastName}`.trim() : `Menor #${idx + 1} (${m.age === 0 ? "0-11 meses" : `${m.age} años`})`,
        relationship: `Menor (Edad: ${m.age === 0 ? "0-11 meses" : `${m.age} años`})`,
        allergies: m.allergies,
        requirements: ""
      });
    });

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
      selectedActivities: selectedActivities,
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
      nombreAcompanante: hasCompanion && companionsList.length > 0 ? companionsList[0].firstName : undefined,
      apellidosAcompanante: hasCompanion && companionsList.length > 0 ? companionsList[0].lastName : undefined,
      sexoAcompanante: hasCompanion && companionsList.length > 0 ? companionsList[0].sex : undefined,
      alergiasAcompanante: hasCompanion && companionsList.length > 0 ? companionsList[0].allergies : undefined,
      numMenores: numMinors,
      alergiasMenores: minors.map(m => m.allergies),
      numHabitaciones,
      configuracionHabitacion,
      carnetTipoHabitacion,
      nochesAdicionales,
      requerimientosAdicionales,
      ineTitular,
      ineAcompanante,
      vuelosSeparados,
      draftSaved: false,
      minors,

      // Flights info
      vueloLlegadaFecha: hasFlights ? vueloLlegadaFecha : undefined,
      vueloLlegadaHora: hasFlights ? vueloLlegadaHora : undefined,
      vueloLlegadaAerolinea: hasFlights ? vueloLlegadaAerolinea : undefined,
      vueloLlegadaNoVuelo: hasFlights ? vueloLlegadaNoVuelo : undefined,
      vueloLlegadaPersonas: hasFlights ? vueloLlegadaPersonas : undefined,
      vueloLlegadaPasajerosTitular: hasFlights ? vueloLlegadaPasajerosTitular : undefined,
      vueloRegresoFecha: hasFlights ? vueloRegresoFecha : undefined,
      vueloRegresoHora: hasFlights ? vueloRegresoHora : undefined,
      vueloRegresoAerolinea: hasFlights ? vueloRegresoAerolinea : undefined,
      vueloRegresoNoVuelo: hasFlights ? vueloRegresoNoVuelo : undefined,
      vueloRegresoPersonas: hasFlights ? vueloRegresoPersonas : undefined,
      vueloRegresoPasajerosTitular: hasFlights ? vueloRegresoPasajerosTitular : undefined,

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
      let result;
      if (isEditing) {
        result = DataStore.saveGuest(
          newGuestData,
          `${nombreTitular} ${apellidosTitular}`,
          activeAccessUser?.email || emailToUse,
          true
        );
      } else {
        result = DataStore.addGuest(
          newGuestData,
          `${nombreTitular} ${apellidosTitular}`,
          activeAccessUser?.email || emailToUse
        );

        // Ensure active access user is linked to this guest record
        if (activeAccessUser && activeAccessUser.guestId !== guestId) {
          const updatedUser = { ...activeAccessUser, guestId };
          DataStore.saveUser(updatedUser);
          setActiveAccessUser(updatedUser);
        }
      }

      if (result && !result.success) {
        setValidationError(result.error || "Error al guardar el registro.");
        return;
      }

      // Recalculate activity counts (crucial so that activities capacity updates in real time!)
      DataStore.recalculateCounts();

      // Save logged in guest state
      setLoggedGuest(newGuestData);

      setSuccessMessage(isEditing 
        ? "¡Tus datos de registro han sido actualizados con éxito en tiempo real!" 
        : "¡Tu registro ha sido completado con éxito! Tu cuenta de acceso ha quedado vinculada."
      );
      
      // Move to success step
      setCurrentStep(7);
    } catch (err: any) {
      console.error("Error al guardar registro:", err);
      setValidationError(`Error al guardar en el servidor de base de datos: ${err?.message || err}. Revisa la conexión.`);
    }
  };

  const handleLogout = () => {
    setLoggedGuest(null);
    setActiveAccessUser(null);
    setIsLoginMode(true);
    setIsSignUpScreen(false);
    setLoginEmail("");
    setLoginPassword("");
    setSignUpEmail("");
    setSignUpPassword("");
    setSignUpConfirmPassword("");
    setRegPassword("");
    resetAllFormFields();
  };

  return (
    <div className={`flex-1 min-h-screen py-10 px-4 md:px-8 font-sans flex flex-col items-center justify-center transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100" 
        : "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-slate-900"
    }`} id="guest-reg-container">
      
      {/* Top Controls & Theme Toggle */}
      <div className="w-full max-w-4xl flex flex-col items-end gap-2.5 mb-6 animate-fade-in">
        {/* Cerrar Sesión button */}
        {(loggedGuest || activeAccessUser) && (
          <button 
            onClick={handleLogout}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm border flex items-center gap-2 cursor-pointer transition-all duration-350 hover:scale-[1.02] active:scale-[0.98] bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-500`}
          >
            Cerrar Sesión
          </button>
        )}

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
        <div className="inline-flex items-center justify-center p-6 md:p-8 rounded-3xl border shadow-xl mb-4 bg-white border-slate-250/90 shadow-slate-200/60 max-w-full">
          <img 
            src={LogoConvencion} 
            alt="Logo Convención ADISTEM" 
            className="h-32 md:h-44 w-auto object-contain max-w-full transition-transform duration-300 hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = "w-28 h-28 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-3xl text-white";
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
          Convención ADISTEM 2026
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
        {(loggedGuest || activeAccessUser) && (
          <div className={t.statusBar}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
              <span className={t.statusBarText}>
                Sesión activa: <strong className="font-bold">{loggedGuest ? loggedGuest.name : activeAccessUser?.email}</strong> 
                {loggedGuest ? ` (${loggedGuest.email})` : ` (Cuenta de Acceso)`}
              </span>
            </div>
          </div>
        )}

        {/* VIEW 1: SIGN UP SCREEN (CREAR CUENTA) */}
        {isSignUpScreen ? (
          <div className="p-6 md:p-10 space-y-6 max-w-xl mx-auto w-full">
            <div>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${t.textTitle}`}>
                <PlusCircle className="w-5 h-5 text-blue-500" />
                Crear Cuenta de Acceso
              </h2>
              <p className={`text-xs mt-1 ${t.textMuted}`}>
                Registra un correo electrónico y contraseña. Esta cuenta te servirá tanto para realizar tu registro de carnet como para ingresar después a validar tu acceso en la APP.
              </p>
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-4 text-sm">
              <div>
                <label className={`block text-xs font-bold uppercase mb-1 ${t.label}`}>Correo de Acceso (Usuario)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="email"
                    value={signUpEmail}
                    onChange={e => setSignUpEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    required
                    className={`w-full pl-9 pr-3 py-2.5 text-xs transition-colors duration-300 ${t.input}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase mb-1 ${t.label}`}>Contraseña de Ingreso</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type={showSignUpPassword ? "text" : "password"}
                    value={signUpPassword}
                    onChange={e => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-9 pr-10 py-2.5 text-xs transition-colors duration-300 ${t.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(prev => !prev)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                    title={showSignUpPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase mb-1 ${t.label}`}>Confirmar Contraseña</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type={showSignUpConfirmPassword ? "text" : "password"}
                    value={signUpConfirmPassword}
                    onChange={e => setSignUpConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-9 pr-10 py-2.5 text-xs transition-colors duration-300 ${t.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpConfirmPassword(prev => !prev)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                    title={showSignUpConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {signUpError && <p className="text-rose-500 text-xs font-bold">{signUpError}</p>}

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsSignUpScreen(false);
                    setIsLoginMode(true);
                    setSignUpError(null);
                  }}
                  className="flex-1 py-3 bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar / Volver
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Crear Cuenta y Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : !loggedGuest && !activeAccessUser ? (
          <div className="p-6 md:p-10 space-y-6 max-w-xl mx-auto w-full">
            
            {/* Login Section */}
            <div className="space-y-6">
              {!showRecoverPassword ? (
                <>
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
                          placeholder="ejemplo@dominio.com"
                          required
                          className={`w-full pl-9 pr-3 py-2.5 text-xs transition-colors duration-300 ${t.input}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1 ${t.label}`}>Contraseña de Registro</label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className={`w-full pl-9 pr-10 py-2.5 text-xs transition-colors duration-300 ${t.input}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(prev => !prev)}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                          title={showLoginPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
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

                    <div className="text-center pt-2 space-y-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRecoverPassword(true);
                          setRecoverSuccess(null);
                          setRecoverError(null);
                        }}
                        className="text-xs text-[#56B7A9] hover:underline font-bold transition cursor-pointer"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>

                      <div className="flex items-center justify-center gap-3">
                        <div className={`h-[1px] flex-1 ${t.dividerLine}`}></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">O</span>
                        <div className={`h-[1px] flex-1 ${t.dividerLine}`}></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUpScreen(true);
                          setSignUpError(null);
                        }}
                        className="w-full py-3.5 bg-[#56B7A9] hover:bg-[#429c8f] text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5 border border-[#429c8f]/25"
                      >
                        <PlusCircle className="w-5 h-5 text-white" />
                        <span className="tracking-wide">Crear Nueva cuenta de registro</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${t.textTitle}`}>
                      <Key className="w-5 h-5 text-blue-500" />
                      Recuperar Contraseña
                    </h2>
                    <p className={`text-xs mt-1 ${t.textMuted}`}>Ingresa el correo electrónico con el que te registraste para enviarte tus datos de acceso.</p>
                  </div>

                  <form onSubmit={handleRecoverPasswordSubmit} className="space-y-4 text-sm">
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1 ${t.label}`}>Correo Electrónico de Registro</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                          type="email"
                          value={recoverEmail}
                          onChange={e => setRecoverEmail(e.target.value)}
                          placeholder="ejemplo@dominio.com"
                          required
                          className={`w-full pl-9 pr-3 py-2.5 text-xs transition-colors duration-300 ${t.input}`}
                        />
                      </div>
                    </div>

                    {recoverError && <p className="text-rose-500 text-xs font-bold">{recoverError}</p>}
                    {recoverSuccess && <p className="text-emerald-500 text-xs font-bold">{recoverSuccess}</p>}

                    <div className="flex gap-4 pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowRecoverPassword(false);
                          setRecoverError(null);
                          setRecoverSuccess(null);
                        }}
                        className="flex-1 py-3 bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={recoverLoading}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <span>{recoverLoading ? "Enviando..." : "Enviar Correo"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

          </div>
        ) : (
          /* REGISTRATION WIZARD FLOW (STAGES 1-5) */
          <div className="flex-1 flex flex-col">
            
            {/* Progress Stepper Header */}
            {currentStep <= 6 && (
              <div className={t.stepper}>
                <div className="flex items-center gap-4 w-full justify-between min-w-[650px] overflow-x-auto pb-2">
                  {[
                    { step: 1, label: "Hospedaje", icon: Bed },
                    { step: 2, label: "Titular", icon: User },
                    { step: 3, label: "Acompañantes", icon: Users },
                    { step: 4, label: "Itinerario de viaje", icon: Plane },
                    { step: 5, label: "Actividades", icon: Calendar }
                  ].map(({ step, label, icon: Icon }) => {
                    const isActive = currentStep === step;
                    const isCompleted = currentStep > step;
                    return (
                      <button
                        key={step}
                        onClick={() => handleStepClick(step)}
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? 'text-blue-500 font-bold bg-blue-500/5' 
                            : isCompleted
                              ? 'text-emerald-500 font-semibold hover:text-blue-500'
                              : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                        }`}
                      >
                        <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isActive 
                            ? 'bg-blue-600 text-white' 
                            : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {step}
                        </span>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[11px] uppercase tracking-wider">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step Content Container */}
            <div className="p-6 md:p-8 flex-1">
              
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <LodgingStep
                    t={t}
                    isDarkMode={isDarkMode}
                    carnetTipoHabitacion={carnetTipoHabitacion}
                    setCarnetTipoHabitacion={setCarnetTipoHabitacion}
                    configuracionHabitacion={configuracionHabitacion}
                    setConfiguracionHabitacion={setConfiguracionHabitacion}
                    nochesAdicionales={nochesAdicionales}
                    setNochesAdicionales={setNochesAdicionales}
                    requerimientosAdicionales={requerimientosAdicionales}
                    setRequerimientosAdicionales={setRequerimientosAdicionales}
                    calculateTotalHotelCost={calculateTotalHotelCost}
                    handleNext={handleNext}
                    setIsLoginMode={setIsLoginMode}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <TitularStep
                    t={t}
                    isDarkMode={isDarkMode}
                    grupo={grupo}
                    setGrupo={setGrupo}
                    distribuidora={distribuidora}
                    setDistribuidora={setDistribuidora}
                    nombreTitular={nombreTitular}
                    setNombreTitular={setNombreTitular}
                    apellidosTitular={apellidosTitular}
                    setApellidosTitular={setApellidosTitular}
                    correoTitular={correoTitular}
                    setCorreoTitular={setCorreoTitular}
                    celularTitular={celularTitular}
                    setCelularTitular={setCelularTitular}
                    sexo={sexo}
                    setSexo={setSexo}
                    alergiasTitular={alergiasTitular}
                    setAlergiasTitular={setAlergiasTitular}
                    activeAccessUser={activeAccessUser}
                    loggedGuest={loggedGuest}
                    handleNext={handleNext}
                    handlePrev={handlePrev}
                    GROUPS_DATA={GROUPS_DATA}
                    GROUPS_LIST={GROUPS_LIST}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <CompanionsStep
                    t={t}
                    isDarkMode={isDarkMode}
                    hasCompanion={hasCompanion}
                    handleToggleCompanion={handleToggleCompanion}
                    companionsList={companionsList}
                    removeCompanionItem={removeCompanionItem}
                    addCompanionItem={addCompanionItem}
                    updateCompanionItem={updateCompanionItem}
                    numMinors={numMinors}
                    handleMinorCountChange={handleMinorCountChange}
                    minors={minors}
                    handleMinorFieldChange={handleMinorFieldChange}
                    handleNext={handleNext}
                    handlePrev={handlePrev}
                    carnetTipoHabitacion={carnetTipoHabitacion}
                  />
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <FlightsStep
                    t={t}
                    isDarkMode={isDarkMode}
                    hasFlights={hasFlights}
                    setHasFlights={setHasFlights}
                    vuelosSeparados={vuelosSeparados}
                    setVuelosSeparados={setVuelosSeparados}
                    vueloLlegadaAerolinea={vueloLlegadaAerolinea}
                    setVueloLlegadaAerolinea={setVueloLlegadaAerolinea}
                    vueloLlegadaNoVuelo={vueloLlegadaNoVuelo}
                    setVueloLlegadaNoVuelo={setVueloLlegadaNoVuelo}
                    vueloLlegadaFecha={vueloLlegadaFecha}
                    setVueloLlegadaFecha={setVueloLlegadaFecha}
                    vueloLlegadaHora={vueloLlegadaHora}
                    setVueloLlegadaHora={setVueloLlegadaHora}
                    vueloLlegadaPersonas={vueloLlegadaPersonas}
                    setVueloLlegadaPersonas={setVueloLlegadaPersonas}
                    vueloLlegadaPasajerosTitular={vueloLlegadaPasajerosTitular}
                    setVueloLlegadaPasajerosTitular={setVueloLlegadaPasajerosTitular}
                    vueloRegresoAerolinea={vueloRegresoAerolinea}
                    setVueloRegresoAerolinea={setVueloRegresoAerolinea}
                    vueloRegresoNoVuelo={vueloRegresoNoVuelo}
                    setVueloRegresoNoVuelo={setVueloRegresoNoVuelo}
                    vueloRegresoFecha={vueloRegresoFecha}
                    setVueloRegresoFecha={setVueloRegresoFecha}
                    vueloRegresoHora={vueloRegresoHora}
                    setVueloRegresoHora={setVueloRegresoHora}
                    vueloRegresoPersonas={vueloRegresoPersonas}
                    setVueloRegresoPersonas={setVueloRegresoPersonas}
                    vueloRegresoPasajerosTitular={vueloRegresoPasajerosTitular}
                    setVueloRegresoPasajerosTitular={setVueloRegresoPasajerosTitular}
                    nombreTitular={nombreTitular}
                    apellidosTitular={apellidosTitular}
                    companionsList={companionsList}
                    updateCompanionItem={updateCompanionItem}
                    minors={minors}
                    handleNext={handleNext}
                    handlePrev={handlePrev}
                    carnetTipoHabitacion={carnetTipoHabitacion}
                  />
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <ActivitiesStep
                    t={t}
                    isDarkMode={isDarkMode}
                    nombreTitular={nombreTitular}
                    hasCompanion={hasCompanion}
                    companionsList={companionsList}
                    selectedActivities={selectedActivities}
                    setSelectedActivities={setSelectedActivities}
                    updateCompanionItem={updateCompanionItem}
                    checkActivityConflict={checkActivityConflict}
                    DataStore={DataStore}
                    handleNext={handleNext}
                    handlePrev={handlePrev}
                  />
                </motion.div>
              )}

              {currentStep === 6 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <SummaryStep
                    t={t}
                    isDarkMode={isDarkMode}
                    draftSuccess={draftSuccess}
                    carnetTipoHabitacion={carnetTipoHabitacion}
                    configuracionHabitacion={configuracionHabitacion}
                    nochesAdicionales={nochesAdicionales}
                    requerimientosAdicionales={requerimientosAdicionales}
                    calculateTotalHotelCost={calculateTotalHotelCost}
                    nombreTitular={nombreTitular}
                    apellidosTitular={apellidosTitular}
                    grupo={grupo}
                    distribuidora={distribuidora}
                    correoTitular={correoTitular}
                    celularTitular={celularTitular}
                    alergiasTitular={alergiasTitular}
                    sexo={sexo}
                    hasCompanion={hasCompanion}
                    companionsList={companionsList}
                    numMinors={numMinors}
                    minors={minors}
                    hasFlights={hasFlights}
                    vuelosSeparados={vuelosSeparados}
                    vueloLlegadaAerolinea={vueloLlegadaAerolinea}
                    vueloLlegadaNoVuelo={vueloLlegadaNoVuelo}
                    vueloLlegadaFecha={vueloLlegadaFecha}
                    vueloLlegadaHora={vueloLlegadaHora}
                    vueloRegresoAerolinea={vueloRegresoAerolinea}
                    vueloRegresoNoVuelo={vueloRegresoNoVuelo}
                    vueloRegresoFecha={vueloRegresoFecha}
                    vueloRegresoHora={vueloRegresoHora}
                    selectedActivities={selectedActivities}
                    DataStore={DataStore}
                    handlePrev={handlePrev}
                    handleSaveDraft={handleSaveDraft}
                    handleSaveRegistration={handleSaveRegistration}
                    loggedGuest={loggedGuest}
                    activeAccessUser={activeAccessUser}
                    vueloLlegadaPasajerosTitular={vueloLlegadaPasajerosTitular}
                    vueloRegresoPasajerosTitular={vueloRegresoPasajerosTitular}
                  />
                </motion.div>
              )}

              {currentStep === 7 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-4 border-emerald-50">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className={`text-2xl font-black ${t.textTitle}`}>¡Tu carnet de registro está confirmado!</h3>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className={`p-4 text-sm rounded-xl max-w-md mx-auto border transition-colors duration-300 font-semibold ${
                      isDarkMode 
                        ? "bg-blue-950/20 border-blue-900/30 text-blue-300" 
                        : "bg-blue-50 border-blue-100 text-blue-900"
                    }`}>
                      Puedes volver a este portal con tu correo de registro <strong>{activeAccessUser?.email || correoTitular}</strong> para actualizar tus pases de abordar e itinerario cuando quieras.
                    </div>

                    <div className={`p-4 text-sm rounded-xl max-w-md mx-auto border transition-colors duration-300 font-semibold ${
                      isDarkMode 
                        ? "bg-slate-800/50 border-slate-700/50 text-slate-300" 
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}>
                      Para cualquier duda con el proceso de registro, comunicarse a los siguientes correos: <br className="hidden sm:block" />
                      <strong>Anahí Ojeda</strong> (<a href="mailto:aog@adistem.com.mx" className="text-[#56B7A9] hover:underline">aog@adistem.com.mx</a>) y <br className="hidden sm:block" />
                      <strong>Gabriela Pérez</strong> (<a href="mailto:gph@adistem.com.mx" className="text-[#56B7A9] hover:underline">gph@adistem.com.mx</a>)
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
