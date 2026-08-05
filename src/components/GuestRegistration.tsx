import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Users, Plane, Bed, Calendar, FileText, AlertCircle, CheckCircle, 
  ChevronRight, ChevronLeft, Save, Plus, Trash2, ArrowRight, LogIn, Lock, Mail, Phone, PlusCircle,
  Sun, Moon, Key, Eye, EyeOff, ShieldCheck, X, FileDown
} from "lucide-react";
import { DataStore } from "../dataStore";
import { generateArcoPdf } from "../utils/generateArcoPdf";
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

  // Privacy Policy Acceptance Checkboxes & Modal State
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState<boolean>(false);
  const [authorizedPersonalData, setAuthorizedPersonalData] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

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
      setCompanionsList([]);
      setVuelosSeparados(false);
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
  const [nochesAdicionalesFechas, setNochesAdicionalesFechas] = useState<string[]>([]);
  const [requerimientosAdicionales, setRequerimientosAdicionales] = useState<string>("");
  const [showNightsModal, setShowNightsModal] = useState(false);
  const [pendingNextStep, setPendingNextStep] = useState<number | null>(null);

  useEffect(() => {
    setNochesAdicionales(nochesAdicionalesFechas.length);
  }, [nochesAdicionalesFechas]);

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

    if (!acceptedPrivacyPolicy || !authorizedPersonalData) {
      setSignUpError("Debes consentir el tratamiento de datos personales sensibles y confirmar la declaración para continuar.");
      return;
    }

    const users = DataStore.getUsers();
    const exists = users.some(u => u.email.toLowerCase() === emailTrimmed);
    if (exists) {
      setSignUpError("Esta cuenta de correo ya se encuentra registrada. Por favor inicia sesión.");
      return;
    }

    const nowTimestamp = new Date().toISOString();

    // Success! Generate guestId and pre-create the PortalUser with privacy acceptance timestamp
    const newGuestId = `G-${Date.now()}`;
    const newUser: PortalUser = {
      id: emailTrimmed,
      email: emailTrimmed,
      password: signUpPassword,
      role: "Invitado",
      guestId: newGuestId,
      acceptedPrivacyPolicyAt: nowTimestamp,
      acceptedPrivacyTerms: true,
    };

    const res = DataStore.addUser(newUser);
    if (!res.success) {
      setSignUpError(res.error || "Ocurrió un error al crear el usuario.");
      return;
    }

    // Almacena en bitácora de auditoría la fecha y hora exacta de aceptación para respaldo legal
    DataStore.addAuditLog({
      userId: `Nuevo Registro - ${emailTrimmed}`,
      userEmail: emailTrimmed,
      action: "Aceptación de Políticas de Privacidad",
      details: `El usuario aceptó las Políticas de Privacidad de Información y la Autorización de Registro de datos personales el ${new Date(nowTimestamp).toLocaleString("es-MX")}.`,
      newValue: `Aceptado a las ${nowTimestamp}`
    });

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
    setNochesAdicionalesFechas(guest.nochesAdicionalesFechas || []);
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
      nochesAdicionalesFechas,
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
      if (currentStep === 1 && nochesAdicionales > 0) {
        setPendingNextStep(nextStep);
        setShowNightsModal(true);
      } else {
        autoSaveProgress(nextStep);
        setCurrentStep(nextStep);
      }
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
      if (currentStep === 1 && targetStep > 1 && nochesAdicionales > 0) {
        setPendingNextStep(targetStep);
        setShowNightsModal(true);
      } else {
        autoSaveProgress(targetStep);
        setCurrentStep(targetStep);
      }
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
      nochesAdicionalesFechas,
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
      nochesAdicionalesFechas,
      requerimientosAdicionales,
      ineTitular,
      ineAcompanante,
      vuelosSeparados: hasCompanion ? vuelosSeparados : false,
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

              {/* Checkboxes de Políticas de Privacidad y Autorización */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={acceptedPrivacyPolicy}
                    onChange={e => setAcceptedPrivacyPolicy(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                  />
                  <span className={`text-[11px] leading-relaxed ${t.label}`}>
                    Consiento expresamente y por escrito el tratamiento por ASOCIACIÓN DE DISTRIBUIDORES STELLANTIS DE MÉXICO, A.C. (“ADISTEM”) de mis datos personales sensibles que proporcione, relativos a alergias, restricciones alimentarias, condiciones de salud, discapacidades y necesidades de movilidad o accesibilidad, para atender mis necesidades y procurar mi seguridad durante la Convención ADISTEM 2026. Asimismo, autorizo que los datos personales sensibles estrictamente necesarios sean comunicados, según corresponda, al hotel sede y a las empresas contratadas para prestar los servicios de alimentación, transportación, accesibilidad o actividades que intervengan directamente en mi atención, exclusivamente para las finalidades señaladas en el presente{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-extrabold underline cursor-pointer inline"
                    >
                      Aviso de Privacidad
                    </button>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={authorizedPersonalData}
                    onChange={e => setAuthorizedPersonalData(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                  />
                  <span className={`text-[11px] leading-relaxed ${t.label}`}>
                    En caso de proporcionar datos personales sensibles de una persona menor de edad, manifiesto, bajo protesta de decir verdad, ser su madre, padre, persona tutora o representante legal, o contar con facultades suficientes para actuar en su nombre; y consiento expresamente y por escrito que ADISTEM trate y, cuando resulte necesario, comunique sus datos personales sensibles en los términos y para las finalidades señaladas en el párrafo anterior.
                  </span>
                </label>
              </div>

              {signUpError && <p className="text-rose-500 text-xs font-bold">{signUpError}</p>}

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsSignUpScreen(false);
                    setIsLoginMode(true);
                    setSignUpError(null);
                    setAcceptedPrivacyPolicy(false);
                    setAuthorizedPersonalData(false);
                  }}
                  className="flex-1 py-3 bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar / Volver
                </button>
                <button 
                  type="submit"
                  disabled={!acceptedPrivacyPolicy || !authorizedPersonalData}
                  className={`flex-1 py-3 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                    (!acceptedPrivacyPolicy || !authorizedPersonalData)
                      ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60 shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg cursor-pointer"
                  }`}
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

                    {recoverError && <p className="text-rose-500 text-xs font-bold whitespace-pre-line border border-rose-500/30 bg-rose-500/5 p-3 rounded-lg leading-relaxed">{recoverError}</p>}
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
                    nochesAdicionalesFechas={nochesAdicionalesFechas}
                    setNochesAdicionalesFechas={setNochesAdicionalesFechas}
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
                    hasCompanion={hasCompanion}
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
                      Para cualquier duda con el proceso de registro o cancelación comunicarse a los siguietes correos :
                      <div className="mt-2 space-y-1">
                        <div><strong>Anahí Ojeda</strong> (<a href="mailto:aog@adistem.com.mx" className="text-[#56B7A9] hover:underline">aog@adistem.com.mx</a>)</div>
                        <div><strong>Gabriela Pérez</strong> (<a href="mailto:gph@adistem.com.mx" className="text-[#56B7A9] hover:underline">gph@adistem.com.mx</a>)</div>
                      </div>
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

        {showNightsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#56B7A9]/40 max-w-md w-full p-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center">
                <Bed className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  Noches Adicionales Seleccionadas
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Seleccionaste <span className="font-black text-blue-600 dark:text-blue-400 text-lg">{nochesAdicionales}</span> noches adicionales con cargo extra a tu carnet, ¿Deseas confirmar?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNightsModal(false);
                    if (pendingNextStep !== null) {
                      if (validateStepForNumber(1)) {
                        autoSaveProgress(pendingNextStep);
                        setCurrentStep(pendingNextStep);
                      }
                      setPendingNextStep(null);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNightsModal(false);
                    setPendingNextStep(null);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE POLÍTICAS DE PRIVACIDAD */}
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[88vh] ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
            }`}>
              {/* Modal Header */}
              <div className={`p-5 border-b flex items-center justify-between ${
                isDarkMode ? "border-slate-800 bg-slate-850" : "border-slate-100 bg-slate-50"
              }`}>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-base">Aviso de Privacidad Integral - ADISTEM</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body with Full Privacy Policy */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">

                {/* 1. Generales */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">1.- Generales</h4>
                  <p>
                    <strong>1.1.-</strong> ADISTEM ES UNA PERSONA MORAL COMPROMETIDA Y RESPETUOSA DE LOS DERECHOS SOBRE LOS DATOS PERSONALES RECONOCIDOS EN EL ARTÍCULO 16, SEGUNDO PÁRRAFO, DE LA CONSTITUCIÓN POLÍTICA DE LOS ESTADOS UNIDOS MEXICANOS, ASÍ COMO DE LAS DISPOSICIONES DE LA LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES EN POSESIÓN DE LOS PARTICULARES, SU REGLAMENTO Y LA DEMÁS NORMATIVA VIGENTE Y APLICABLE. POR LO ANTERIOR, PONE A DISPOSICIÓN DE LAS PERSONAS TITULARES EL PRESENTE AVISO DE PRIVACIDAD, A FIN DE INFORMARLES SOBRE EL TRATAMIENTO DE SUS DATOS PERSONALES Y PERMITIRLES EJERCER SUS DERECHOS, INCLUIDO SU DERECHO A LA AUTODETERMINACIÓN INFORMATIVA.
                  </p>
                  <p>
                    <strong>1.2.-</strong> ADISTEM PONE A DISPOSICIÓN DE LAS PERSONAS TITULARES EL PRESENTE AVISO DE PRIVACIDAD A TRAVÉS DE LA PÁGINA DE INTERNET CUYA DIRECCIÓN ELECTRÓNICA ES https://adistem-convencion2026.ai.studio/?view=register, EN ADELANTE DENOMINADA “LA PLATAFORMA DE REGISTRO”. CUANDO, CONFORME A LA LEGISLACIÓN APLICABLE, RESULTE NECESARIO RECABAR EL CONSENTIMIENTO DE LA PERSONA TITULAR PARA DETERMINADAS FINALIDADES O CATEGORÍAS DE DATOS PERSONALES, ESTE SERÁ SOLICITADO MEDIANTE LOS MECANISMOS ELECTRÓNICOS HABILITADOS PARA TAL EFECTO.
                  </p>
                  <p>
                    <strong>1.3.-</strong> SI LA PERSONA TITULAR NO DESEA PROPORCIONAR LOS DATOS PERSONALES NECESARIOS PARA SU REGISTRO Y PARTICIPACIÓN EN LA CONVENCIÓN ADISTEM 2026, PODRÁ ABSTENERSE DE COMPLETAR EL REGISTRO; SIN EMBARGO, EN ESE CASO, ADISTEM PODRÁ VERSE IMPOSIBILITADA PARA GESTIONAR SU REGISTRO Y COORDINAR SU HOSPEDAJE, TRANSPORTACIÓN, ALIMENTACIÓN Y DEMÁS ASPECTOS LOGÍSTICOS RELACIONADOS CON SU PARTICIPACIÓN EN EL EVENTO.
                  </p>
                  <p>
                    <strong>1.4.-</strong> PARA EFECTOS DEL PRESENTE AVISO DE PRIVACIDAD, SE ENTENDERÁ POR “PERSONA TITULAR” A LA PERSONA A QUIEN CORRESPONDAN LOS DATOS PERSONALES.
                  </p>
                </div>

                {/* 2. Definiciones */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">2.- Definiciones</h4>
                  <p><strong>2.1.- Datos personales.-</strong> Cualquier información concerniente a una persona identificada o identificable. Se considera que una persona es identificable cuando su identidad pueda determinarse directa o indirectamente a través de cualquier información.</p>
                  <p><strong>2.2.- Datos personales sensibles.-</strong> Aquellos datos personales que afecten a la esfera más íntima de la persona TITULAR, o cuya utilización indebida pueda dar origen a discriminación o conlleve un riesgo grave para esta. De manera enunciativa más no limitativa, se consideran sensibles los datos personales que puedan revelar aspectos como origen racial o étnico, estado de salud presente o futuro, información genética, creencias religiosas, filosóficas y morales, opiniones políticas y preferencia sexual.</p>
                  <p><strong>2.3.- Titular.-</strong> La persona a quien corresponden los datos personales.</p>
                  <p><strong>2.4.- Responsable.-</strong> Sujeto regulado, entendido como la persona física o moral (ADISTEM) de carácter privado que lleva a cabo el tratamiento de los datos personales.</p>
                  <p><strong>2.5.- Sujeto regulado.-</strong> Persona física o moral de carácter privado que lleva a cabo el tratamiento de datos personales.</p>
                  <p><strong>2.6.- Persona Encargada.-</strong> La persona física o jurídica que sola o conjuntamente con otras trate datos personales por cuenta del Responsable.</p>
                  <p><strong>2.7.- Tratamiento.-</strong> Cualquier operación o conjunto de operaciones efectuadas mediante procedimientos manuales o automatizados aplicados a los datos personales, relacionadas con la obtención, uso, registro, organización, conservation, elaboración, utilización, comunicación, difusión, almacenamiento, posesión, acceso, manejo, aprovechamiento, divulgación, transferencia o disposición de datos personales.</p>
                  <p className="pl-4"><strong>2.7.1.- Transferencia.-</strong> Toda comunicación de datos personales dentro o fuera del territorio mexicano, realizada a persona distinta de EL TITULAR, del Responsable o de la persona encargada del tratamiento.</p>
                  <p className="pl-4"><strong>2.7.2.- Remisión.-</strong> La comunicación de datos personales entre el Responsable y la Persona Encargada, dentro o fuera del territorio mexicano.</p>
                  <p><strong>2.8.- Tercero.-</strong> La persona física o moral, nacional o extranjera, distinta de EL TITULAR o del Responsable de los datos.</p>
                  <p><strong>2.9.- Derechos ARCO.-</strong> Derechos de Acceso, Rectificación, Cancelación y Oposición al tratamiento de datos personales.</p>
                  <p><strong>2.10.- Finalidades Primarias.-</strong> Aquellas finalidades para las cuales se recaban y tratan principalmente los datos personales y por lo que se da origen a la relación entre ADISTEM y EL TITULAR.</p>
                  <p><strong>2.11.- Finalidades Secundarias.-</strong> Aquellas finalidades que no son imprescindibles para la relación entre ADISTEM y EL TITULAR, pero que con su tratamiento contribuye al cumplimiento del objeto social de ADISTEM y respecto de las cuales, el Responsable requerirá el consentimiento de EL TITULAR para su tratamiento.</p>
                </div>

                {/* 3. Identidad y domicilio */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">3.- Identidad y domicilio del responsable que trata los datos personales</h4>
                  <p>
                    <strong>3.1.-</strong> La Responsable del tratamiento de los datos personales de LOS TITULARES es ASOCIACIÓN DE DISTRIBUIDORES STELLANTIS DE MÉXICO, A.C. (en adelante denominada como “ADISTEM”), quien se compromete a respetar lo establecido en el presente Aviso de Privacidad (en lo sucesivo el “Aviso” o el “Aviso de Privacidad” indistintamente), mismo que se pone a disposición de LOS TITULARES en cumplimiento de lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (en lo sucesivo la “Ley” o “LFPDPPP”, indistintamente) vigente y demás normativa vigente y aplicable.
                  </p>
                  <p>
                    Los datos personales de las personas que se registren o sean registradas como participantes en la Convención ADISTEM 2026 serán recabados, utilizados, almacenados, tratados y, en su caso, transferidos por ADISTEM con motivo del registro, organización, administración, desarrollo y celebración de la Convención ADISTEM 2026, incluyendo la gestión del hospedaje, alimentación, transportación, actividades y demás aspectos logísticos relacionados con el evento. El registro y la participación en la Convención ADISTEM 2026 se encuentran dirigidos a personas ubicadas en México. La Plataforma de Registro se encuentra disponible en idioma español.
                  </p>
                  <p>
                    <strong>3.2.-</strong> El domicilio que para los efectos del presente Aviso establece ADISTEM es el ubicado en calle Presidente Masarik No. 67, colonia Chapultepec Morales, alcaldía Miguel Hidalgo, c.p. 11570, Ciudad de México, México.
                  </p>
                </div>

                {/* 4. Datos personales */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">4.- Datos personales a los que se les da tratamiento</h4>
                  <p><strong>4.1.-</strong> EL TITULAR reconoce y acepta que ADISTEM podrá tratar directamente y/o a través de Personas Encargadas, los siguientes datos personales, atendiendo a la relación con cada TITULAR:</p>
                  <div className="pl-4 space-y-2">
                    <p><strong>4.1.1.- Participantes en la Convención ADISTEM 2026:</strong></p>
                    <p>• <strong>Datos generales y de identificación:</strong> Nombre completo, sexo, edad -únicamente respecto de menores de edad-, parentesco o relación con la persona que realiza el registro, identificación oficial con fotografía, pudiendo tratarse de la credencial para votar expedida por el Instituto Nacional Electoral o pasaporte vigente, incluyendo los datos personales contenidos en dichos documentos.</p>
                    <p>• <strong>Datos de contacto, acceso y entrega:</strong> Correo electrónico, teléfono fijo y/o móvil, credenciales de acceso a la Plataforma de Registro, dirección de entrega y, en su caso, nombre y datos de contacto de la persona designada por EL TITULAR para recibir obsequios, kits o materiales relacionados con la Convención ADISTEM 2026.</p>
                    <p>• <strong>Datos laborales y de vinculación con la distribuidora:</strong> Distribuidora, empresa o grupo al que pertenece EL TITULAR y puesto que desempeña.</p>
                    <p>• <strong>Datos de viaje y transportación:</strong> Fechas y horarios de llegada y salida, aerolínea, número de vuelo y demás información necesaria para coordinar los traslados relacionados con la Convención ADISTEM 2026.</p>
                    <p>• <strong>Datos de hospedaje:</strong> Fechas de entrada y salida, tipo de ocupación, requerimientos de hospedaje e información necesaria para la asignación y administración de habitaciones.</p>
                    <p>• <strong>Datos relativos a actividades y preferencias:</strong> Actividades seleccionadas; número de participantes; datos, fechas y horarios de reservaciones; así como preferencias y requerimientos operativos relacionados con las actividades recreativas, deportivas o de bienestar, así como la selección o características de los kits o materiales solicitados, incluyendo, cuando resulte aplicable, hándicap de golf, mano derecha o izquierda, tipo de vara o equipo requerido, y día y horario de los servicios de spa.</p>
                    <p>• <strong>Datos financieros o patrimoniales:</strong> Costo del carnet o inscripción; importes por carnets adicionales, importes por planes de alimentos de menores; importes por días adicionales de hospedaje de personas adultas y menores de edad; así como el monto total a pagar con motivo de la participación de EL TITULAR en la Convención ADISTEM 2026.</p>
                    <p>• <strong>Datos personales sensibles:</strong> ADISTEM podrá tratar datos personales sensibles relativos a alergias, restricciones alimentarias, condiciones de salud, discapacidades y necesidades de movilidad o accesibilidad.</p>
                    <p>• <strong>Documentación en copia:</strong> Copia digital de la credencial para votar expedida por el Instituto Nacional Electoral o del pasaporte vigente de EL TITULAR, incluyendo los datos personales contenidos en dichos documentos.</p>
                  </div>
                  <p>
                    Si EL TITULAR realiza el proceso de registro en la Plataforma de Registro de ADISTEM para que el beneficiario de dicho registro sea un tercero, dicho TITULAR deberá obtener previamente su consentimiento antes de otorgar sus datos personales a ADISTEM comprometiéndose a sacar en paz y a salvo a ADISTEM de cualquier controversia ocasionada por el uso no autorizado de los datos personales de los terceros. En los casos en los que el tercero sea un menor de edad conforme a la normativa mexicana aplicable, EL TITULAR manifiesta bajo protesta de decir verdad, tener facultades suficientes para otorgar sus datos personales a ADISTEM y aceptar el presente Aviso de Privacidad, comprometiéndose a sacar en paz y a salvo a ADISTEM de cualquier controversia ocasionada por el uso no autorizado de los datos personales de los menores de edad.
                  </p>
                  <p>
                    <strong>4.2.-</strong> EL TITULAR, en este acto, otorga su consentimiento expreso, en términos del artículo 7 de la LFPDPPP, para que ADISTEM trate sus datos personales, distintos de los datos personales sensibles regulados en el numeral 4.3, para cumplir con las finalidades establecidas en el presente Aviso de Privacidad, salvo en aquellos casos en los que no resulte necesario recabar dicho consentimiento conforme a la LFPDPPP.
                  </p>
                  <p>
                    En particular, los datos financieros y/o patrimoniales tratados por ADISTEM son necesarios para ejercer un derecho o cumplir obligaciones derivadas de la relación jurídica entre ADISTEM y EL TITULAR, vinculada con su registro y participación en la Convención ADISTEM 2026, por lo que no será necesario recabar el consentimiento de EL TITULAR para dicho tratamiento, de conformidad con lo previsto en los artículos 7 y 9, fracción IV de la LFPDPPP.
                  </p>
                  <p>
                    <strong>4.3.-</strong> En términos del artículo 8 de la LFPDPPP, ADISTEM recabará previamente el consentimiento expreso y por escrito de EL TITULAR para el tratamiento de sus datos personales sensibles, a través de firma electrónica o de cualquier mecanismo de autenticación habilitado para tal efecto, tanto en la Plataforma de Registro, vía telefónica, correo electrónico o mensajes de WhatsApp.
                  </p>
                  <p>
                    Cuando quien realice el registro pretenda proporcionar datos personales sensibles correspondientes a otra persona adulta, dichos datos únicamente podrán ser recabados después de que esta, en su carácter de TITULAR de los datos, haya otorgado directamente el consentimiento expreso y por escrito previsto en el numeral 4.3, mediante el mecanismo de autenticación habilitado en la Plataforma de Registro.
                  </p>
                  <p>
                    Cuando no resulte posible recabar dicho consentimiento mediante la Plataforma de Registro, quien realice el registro deberá abstenerse de proporcionar los datos personales sensibles de la otra persona adulta, y ADISTEM podrá recabarlos directamente de ésta durante la Convención ADISTEM 2026, conjuntamente con el consentimiento correspondiente. Lo anterior, salvo que quien realice el registro acredite contar con facultades suficientes para actuar en representación de la persona adulta titular de los datos personales.
                  </p>
                  <p>
                    <strong>4.4.-</strong> EL TITULAR en este acto, bajo protesta de decir verdad, acepta que los datos que ha proporcionado a ADISTEM son veraces, actuales y correctos. Además, se compromete a sacar en paz y a salvo a ADISTEM de cualquier demanda o reclamación, derivada de que los datos proporcionados no cumplan con las características declaradas.
                  </p>
                  <p>
                    <strong>4.5.-</strong> La Plataforma de Registro podrá recabar automáticamente datos técnicos y de navegación, tales como dirección IP, tipo de dispositivo, navegador, sistema operativo, identificadores de sesión, fecha y hora de acceso y registros de actividad, con la finalidad de permitir su funcionamiento, mantener la seguridad de la plataforma, prevenir y detectar accesos no autorizados o actividades fraudulentas y generar estadísticas sobre su utilización.
                  </p>
                </div>

                {/* 5. Finalidades */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">5.- Finalidades del tratamiento de los datos personales</h4>
                  <p><strong>5.1.-</strong> ADISTEM podrá tratar los datos personales de EL TITULAR, directamente y/o a través de Personas Encargadas, para las siguientes finalidades primarias, que resultan necesarias para la relación entre ADISTEM y EL TITULAR, sin perjuicio de aquellos supuestos en los que deba recabarse el consentimiento expreso conforme a la LFPDPPP:</p>
                  <div className="pl-4 space-y-1.5">
                    <p><strong>5.1.1.- EL TITULAR-Participante en la Convención ADISTEM 2026:</strong></p>
                    <p><strong>a)</strong> Crear, administrar y autenticar la cuenta de EL TITULAR en la Plataforma de Registro, así como permitirle ingresar, consultar, completar y actualizar la información relacionada con su registro en la Convención ADISTEM 2026.</p>
                    <p><strong>b)</strong> Registrar a EL TITULAR como participante en la Convención ADISTEM 2026, ya sea que proporcione directamente sus datos personales o que sea registrado por otra persona que cuente con autorización o facultades suficientes para ello.</p>
                    <p><strong>c)</strong> Identificar a EL TITULAR, validar la información proporcionada y confirmar su registro, asistencia y participación en la Convención ADISTEM 2026.</p>
                    <p><strong>d)</strong> Contactar a EL TITULAR, a través de los medios de contacto proporcionados, para confirmar, completar o actualizar su información, atender solicitudes, comunicar cambios y enviar avisos, instrucciones, recordatorios y demás información operativa relacionada con la Convención ADISTEM 2026.</p>
                    <p><strong>e)</strong> Integrar y administrar la base de datos de participantes, así como elaborar y actualizar los listados, registros y controles internos necesarios para la organización, administración, operación y desarrollo de la Convención ADISTEM 2026.</p>
                    <p><strong>f)</strong> Gestionar y coordinar el hospedaje de EL TITULAR, incluyendo las reservaciones, asignación y tipo de ocupación de las habitaciones, fechas de entrada y salida, proceso de check-in y check-out, plan de alimentos y demás servicios relacionados con su estancia en el hotel.</p>
                    <p><strong>g)</strong> Recabar y conservar una copia digital de la credencial para votar expedida por el Instituto Nacional Electoral o del pasaporte vigente de EL TITULAR, así como transferirla al hotel sede, para validar su identidad, gestionar o facilitar su pre-registro y proceso de check-in, y administrar los servicios de hospedaje relacionados con la Convención ADISTEM 2026.</p>
                    <p><strong>h)</strong> Gestionar y coordinar la transportación y los traslados de EL TITULAR relacionados con la Convención ADISTEM 2026, tomando en consideración sus fechas y horarios de llegada y salida, aerolínea, número de vuelo y demás información proporcionada para tal efecto.</p>
                    <p><strong>i)</strong> Registrar, organizar y coordinar la participación de EL TITULAR en las actividades, reuniones, comidas, cenas y demás eventos que formen parte del programa de la Convención ADISTEM 2026, incluyendo la administración de reservaciones, fechas, horarios, disponibilidad, número de participantes, preferencias y requerimientos de equipo o servicio relacionados con las actividades seleccionadas.</p>
                    <p><strong>j)</strong> Gestionar la participación de las personas acompañantes adultas y menores de edad registradas para asistir a la Convención ADISTEM 2026, incluyendo los servicios de hospedaje, alimentación, transportación y actividades que, según corresponda, hayan sido solicitados para dichas personas.</p>
                    <p><strong>k)</strong> Comunicar o poner a disposición del hotel, de la empresa de transportación y de los demás prestadores de servicios que intervengan en la organización y desarrollo de la Convención ADISTEM 2026 los datos personales estrictamente necesarios para gestionar el hospedaje, alimentación, traslados, actividades, envío o entrega de obsequios, kits y materiales, y demás servicios solicitados por EL TITULAR.</p>
                    <p><strong>l)</strong> Atender y dar seguimiento a las dudas, aclaraciones, modificaciones, cancelaciones, comentarios, incidencias y solicitudes especiales relacionadas con el registro, organización, desarrollo y participación de EL TITULAR en la Convención ADISTEM 2026.</p>
                    <p><strong>m)</strong> Identificar y atender las alergias, restricciones alimentarias, condiciones de salud, discapacidades y necesidades de movilidad o accesibilidad informadas por EL TITULAR, con la finalidad de coordinar los ajustes, alimentos, espacios, apoyos y servicios que resulten razonablemente necesarios durante su participación en la Convención ADISTEM 2026.</p>
                    <p><strong>n)</strong> Procurar la seguridad y adecuada atención de EL TITULAR durante la Convención ADISTEM 2026 y, en caso de presentarse alguna contingencia relacionada con su salud, facilitar su atención por las personas o servicios competentes, utilizando únicamente los datos personales sensibles que resulten indispensables para tal efecto.</p>
                    <p><strong>o)</strong> Comunicar exclusivamente a los prestadores de servicios que intervengan directamente en la atención de EL TITULAR, y en la medida estrictamente necesaria para la prestación del servicio correspondiente, los datos personales sensibles indispensables para atender las alergias, restricciones alimentarias, condiciones de salud, discapacidades y necesidades de movilidad o accesibilidad informadas por EL TITULAR. Para estos efectos, los datos relativos a alergias y restricciones alimentarias únicamente podrán comunicarse al hotel y a los proveedores de alimentos que deban atenderlas; los datos relativos a discapacidades y necesidades de movilidad o accesibilidad únicamente podrán comunicarse al hotel, a la empresa de transportación o a los prestadores de actividades que deban realizar los ajustes correspondientes; y la información sobre condiciones de salud únicamente podrá comunicarse cuando resulte indispensable para procurar la seguridad de EL TITULAR o permitir su participación en la actividad o servicio solicitado. En ningún caso se comunicarán diagnósticos, antecedentes médicos o datos sensibles distintos de los estrictamente necesarios para la finalidad y el servicio correspondientes.</p>
                    <p><strong>p)</strong> Conservar los registros y documentación relacionados con la participación de EL TITULAR durante el tiempo necesario para la organización y desarrollo de la Convención ADISTEM 2026 y, posteriormente, durante el plazo que resulte necesario para atender aclaraciones, responsabilidades o requerimientos derivados del evento, conforme a la legislación aplicable. Una vez cumplidas las finalidades que justificaron su tratamiento y concluidos los plazos de conservación aplicables, ADISTEM procederá a su cancelación y posterior supresión, previo bloqueo, en su caso.</p>
                    <p><strong>q)</strong> Calcular, registrar, administrar y dar seguimiento a los costos del carnet o inscripción, carnets adicionales, planes de alimentos de menores, días adicionales de hospedaje y demás importes relacionados con la participación de EL TITULAR en la Convención ADISTEM 2026, así como determinar el monto total a pagar.</p>
                    <p><strong>r)</strong> Contactar a EL TITULAR o, en su caso, a la persona que éste designe, y recabar o confirmar los datos estrictamente necesarios para gestionar la asignación, entrega o envío de obsequios, kits y materiales relacionados con la participación de EL TITULAR en la Convención ADISTEM 2026.</p>
                  </div>

                  <p><strong>5.2.-</strong> ADISTEM podrá tratar los datos personales de EL TITULAR para las siguientes finalidades secundarias (que requieren el consentimiento de EL TITULAR, siendo suficiente para estas finalidades, el consentimiento tácito):</p>
                  <div className="pl-4 space-y-1.5">
                    <p><strong>a)</strong> Elaborar, de forma agregada o disociada, estadísticas, análisis e informes internos relacionados con el registro, participación y asistencia de EL TITULAR en la Convención ADISTEM 2026, así como con la utilización de la Plataforma de Registro, con la finalidad de evaluar y mejorar la organización de futuros eventos de ADISTEM.</p>
                    <p><strong>b)</strong> Enviar a EL TITULAR invitaciones, información y comunicaciones relacionadas con futuras convenciones, eventos, actividades y programas organizados o promovidos por ADISTEM.</p>
                    <p><strong>c)</strong> Conservar la copia digital de la credencial para votar expedida por el Instituto Nacional Electoral o del pasaporte vigente de EL TITULAR para, en caso de que participe en la Convención ADISTEM que se celebre en el año inmediato siguiente, reutilizarla para gestionar su registro y facilitar el proceso de check-in, siempre que el documento continúe vigente. La copia será conservada hasta que concluya el periodo de registro de la Convención del año inmediato siguiente. Una vez concluido dicho periodo, si EL TITULAR no participa en esa Convención, el documento ha perdido su vigencia o EL TITULAR ha manifestado su negativa a este tratamiento, ADISTEM procederá a su cancelación y posterior supresión, salvo que exista una obligación legal que justifique su conservación.</p>
                  </div>
                  <p>
                    <strong>5.3.-</strong> ADISTEM manifiesta que, si requiriera tratar los datos personales de EL TITULAR para nuevas o diferentes finalidades a las establecidas en el presente Aviso de Privacidad, se lo informará a EL TITULAR y recabará su consentimiento para dichas finalidades nuevas o diferentes.
                  </p>
                  <p>
                    <strong>5.4.-</strong> En caso de que EL TITULAR no desee que sus datos personales sean tratados para todas o algunas de las finalidades secundarias que se establecen en el apartado 5.2., deberá enviar una solicitud con la negativa de su tratamiento, especificando las finalidades para las que desea que no sean tratados sus datos personales, al siguiente correo electrónico: <a href="mailto:soporte.convencion@adistem.com.mx" className="text-blue-500 dark:text-blue-400 underline font-bold">soporte.convencion@adistem.com.mx</a>.
                  </p>
                </div>

                {/* 6. Cookies */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">6.- Uso de “Cookies” y “web beacons”</h4>
                  <p><strong>6.1.-</strong> La Plataforma de Registro podrá utilizar cookies y otras tecnologías similares. Las cookies son pequeños archivos de información que un sitio de Internet almacena en el navegador o dispositivo de EL TITULAR y que permiten, entre otras funciones, mantener activa una sesión, recordar ciertas preferencias, facilitar el funcionamiento de la plataforma y obtener información técnica relacionada con su utilización.</p>
                  <p><strong>6.2.-</strong> ADISTEM podrá utilizar cookies y tecnologías similares para las siguientes finalidades:</p>
                  <div className="pl-4 space-y-1">
                    <p><strong>i)</strong> Permitir el funcionamiento y la navegación en la Plataforma de Registro.</p>
                    <p><strong>ii)</strong> Autenticar a EL TITULAR, mantener activa su sesión y permitirle acceder a su cuenta.</p>
                    <p><strong>iii)</strong> Recordar las preferencias y configuraciones seleccionadas por EL TITULAR.</p>
                    <p><strong>iv)</strong> Prevenir, detectar y analizar accesos no autorizados, actividades fraudulentas, incidentes de seguridad y demás riesgos relacionados con la utilización de la Plataforma de Registro.</p>
                    <p><strong>v)</strong> Obtener información estadística y analizar el funcionamiento y la utilización de la Plataforma de Registro, con la finalidad de detectar errores y mejorar su operación.</p>
                  </div>
                  <p><strong>6.3.-</strong> Asimismo, la Plataforma de Registro y, en su caso, las comunicaciones electrónicas relacionadas con la Convención ADISTEM 2026 podrán utilizar web beacons, píxeles u otras tecnologías similares que permitan obtener información relacionada con la interacción de EL TITULAR, como la dirección IP, tipo de navegador, tipo de dispositivo, sistema operativo, fecha y hora de acceso, páginas o secciones consultadas y acciones realizadas dentro de la Plataforma de Registro.</p>
                  <p><strong>6.4.-</strong> EL TITULAR podrá administrar, bloquear o eliminar las cookies mediante las opciones de privacidad y seguridad de su navegador y, cuando la Plataforma de Registro cuente con un mecanismo de configuración de cookies, podrá aceptar, rechazar o configurar las cookies que no sean estrictamente necesarias para su funcionamiento. La desactivación de las cookies estrictamente necesarias podrá impedir o afectar el acceso, la autenticación, la conservación de la sesión o algunas funciones de la Plataforma de Registro.</p>
                  <p><strong>6.5.-</strong> Para administrar o deshabilitar las cookies, EL TITULAR deberá consultar las opciones de privacidad, seguridad o configuración del navegador que utilice. Los procedimientos pueden variar dependiendo del navegador, del dispositivo y de la versión instalada.</p>
                </div>

                {/* 7. Limitaciones */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">7.- Limitaciones del uso y divulgación de los datos personales</h4>
                  <p><strong>7.1.-</strong> ADISTEM se compromete a realizar su mejor esfuerzo para proteger la seguridad de los datos personales que EL TITULAR le está entregando, mediante el resguardo físico, la celebración de acuerdos de confidencialidad con los clientes, proveedores y empleados, el uso de tecnologías que controlen el acceso, uso o divulgación sin autorización de la información personal, tal es el caso de antivirus y firewalls en los servidores de acceso y bases de datos de ADISTEM así como la encriptación de las bases de datos y la aplicación del principio de mínimo privilegio; además mediante la contratación de certificados de seguridad SSL para la Plataforma de Registro de ADISTEM y sus servidores; asimismo, ADISTEM almacena la información personal en bases de datos con acceso limitado que se encuentran en instalaciones controladas con mecanismos de seguridad; ADISTEM se compromete a que la información proporcionada por EL TITULAR, sea considerada con carácter confidencial, y utilizada bajo plena privacidad.</p>
                  <p><strong>7.2.-</strong> En este tenor, ADISTEM se obliga a tomar las medidas necesarias para garantizar que las Personas Encargadas que contrate cumplan con lo establecido en el presente Aviso de Privacidad, con las obligaciones a su cargo y particularmente, con las disposiciones establecidas en el artículo 50 del Reglamento de la LFPDPPP.</p>
                  <p><strong>7.3.-</strong> Asimismo, ADISTEM se obliga a contratar servicios de cómputo en la nube que realicen el tratamiento de los datos personales de LOS TITULARES, siempre que los mismos respeten las previsiones del artículo 52 del Reglamento de la LFPDPPP.</p>
                  <p><strong>7.4.-</strong> Adicionalmente, se le informa que si EL TITULAR quisiera limitar el uso o divulgación de sus datos personales deberá enviar una solicitud para tal fin a la dirección de correo electrónico indicada en el numeral 8.1. del presente Aviso de Privacidad, indicando claramente las limitaciones deseadas.</p>
                  <p><strong>7.5.-</strong> Igualmente, se le hace del conocimiento de EL TITULAR que, para efectos de evitar recibir publicidad en general, puede realizar su inscripción en el Registro Público para Evitar Publicidad. Para más información podrá revisar el sitio web de la Procuraduría Federal del Consumidor (PROFECO).</p>
                  <p><strong>7.6.-</strong> No obstante lo anterior y, en caso de que se presenten vulneraciones de seguridad ocurridas en cualquier fase del tratamiento, que afecten de forma significativa los derechos patrimoniales o morales de LOS TITULARES, éstos serán informados de manera inmediata a través de los medios de contacto disponibles, a fin de que estos últimos puedan tomar las medidas correspondientes a la defensa de sus derechos, deslindando de cualquier responsabilidad a ADISTEM si la vulneración no es imputable a ADISTEM.</p>
                </div>

                {/* 8. Designado */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">8.- Designado para tramitar las solicitudes</h4>
                  <p><strong>8.1.-</strong> En caso de que EL TITULAR necesite revocar su consentimiento, así como Acceder, Rectificar, Cancelar, Oponerse al tratamiento de los datos personales que ha proporcionado, lo deberá hacer a través de la persona designada por ADISTEM cuyos datos se describen a continuación:</p>
                  <div className="pl-4">
                    <p><strong>Designado:</strong> Área de Datos Personales.</p>
                    <p><strong>Correo electrónico:</strong> <a href="mailto:soporte.convencion@adistem.com.mx" className="text-blue-500 dark:text-blue-400 underline font-bold">soporte.convencion@adistem.com.mx</a>.</p>
                  </div>
                </div>

                {/* 9. Revocar consentimiento */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">9.- Medios para revocar el consentimiento</h4>
                  <p>
                    EL TITULAR de los datos personales podrá revocar el consentimiento que, en su caso, haya otorgado para el tratamiento de sus datos personales. Dicha revocación del consentimiento deberá realizarse observando el siguiente procedimiento y utilizando el siguiente formato:
                  </p>
                  <div className="pl-4 space-y-1.5">
                    <p><strong>9.1.-</strong> Enviar un correo electrónico en atención al Designado en el punto 8-ocho del presente Aviso, mediante el cual serán atendidas dichas solicitudes.</p>
                    <p><strong>9.2.-</strong> Enviar una solicitud o mensaje de datos al correo electrónico antes precisado, en el que señale:</p>
                    <div className="pl-4 space-y-1">
                      <p><strong>9.2.1.-</strong> El nombre completo de EL TITULAR, domicilio, correo electrónico o cualquier otro medio para recibir notificaciones, para que ADISTEM le comunique la respuesta que se genere con motivo de su solicitud;</p>
                      <p><strong>9.2.2.-</strong> El motivo de su solicitud;</p>
                      <p><strong>9.2.3.-</strong> Los argumentos que sustenten su solicitud o petición;</p>
                      <p><strong>9.2.4.-</strong> Documento oficial que acredite su identidad y que demuestre que es quien dice ser, así como la personalidad e identidad de su representante; y</p>
                      <p><strong>9.2.5.-</strong> Fecha a partir de la cual, se hace efectiva la revocación de su consentimiento.</p>
                    </div>
                    <p>
                      <strong>9.3.-</strong> Adjuntar al correo electrónico mencionado, el{" "}
                      <button
                        type="button"
                        onClick={generateArcoPdf}
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-extrabold underline cursor-pointer inline"
                      >
                        formato
                      </button>{" "}
                      que se indica en este apartado, con la firma de EL TITULAR o del representante legal.
                    </p>
                    <p><strong>9.4.-</strong> ADISTEM notificará a EL TITULAR, en un plazo máximo de 20-veinte días, contados desde la fecha en que se recibió la solicitud sobre la revocación del consentimiento, la resolución adoptada, a efecto de que, si resulta procedente, se haga efectiva la misma dentro de los 15-quince días siguientes a la fecha en que se comunica la respuesta, mediante un mensaje que informe que ha ejecutado todos los actos tendientes a hacer efectiva la revocación del consentimiento de EL TITULAR.</p>
                  </div>
                </div>

                {/* 10. Derechos ARCO */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">10.- Medios para ejercer los derechos ARCO</h4>
                  <p><strong>10.1.-</strong> En caso de que EL TITULAR necesite Acceder, Rectificar, Cancelar u Oponerse a los datos personales que ha proporcionado a ADISTEM, EL TITULAR deberá seguir el siguiente procedimiento, utilizando el siguiente formato:</p>
                  <div className="pl-4 space-y-1.5">
                    <p><strong>10.2.-</strong> Enviar un correo electrónico en atención al Designado del punto 8-ocho del presente Aviso, mediante el cual serán atendidas dichas solicitudes, señalando lo siguiente:</p>
                    <div className="pl-4 space-y-1">
                      <p><strong>10.2.1.-</strong> El nombre completo de EL TITULAR, domicilio, correo electrónico o cualquier otro medio para recibir notificaciones para que ADISTEM le comunique la respuesta que se genere con motivo de su solicitud;</p>
                      <p><strong>10.2.2.-</strong> El motivo de su solicitud;</p>
                      <p><strong>10.2.3.-</strong> Los argumentos que sustenten su solicitud o petición;</p>
                      <p><strong>10.2.4.-</strong> Documento oficial que acredite su identidad y que demuestre que es quien dice ser, así como la personalidad e identidad de su representante;</p>
                      <p><strong>10.2.5.-</strong> Descripción clara y precisa de los datos personales respecto de los que se busca ejercer alguno de los derechos ARCO, y cualquier otro elemento o documento que facilite la localización de los datos personales;</p>
                      <p><strong>10.2.6.-</strong> La descripción del derecho ARCO que se pretende ejercer, o bien, lo que solicita EL TITULAR;</p>
                      <p><strong>10.2.7.-</strong> Tratándose de solicitudes de rectificación de datos personales, EL TITULAR deberá indicar, además de lo señalado, las modificaciones a realizarse y aportar la documentación que sustente su petición;</p>
                      <p>
                        <strong>10.2.8.-</strong> Adjuntar al correo electrónico mencionado, el{" "}
                        <button
                          type="button"
                          onClick={generateArcoPdf}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-extrabold underline cursor-pointer inline"
                        >
                          formato
                        </button>{" "}
                        que se indica en este apartado, con la firma de EL TITULAR o del representante legal.
                      </p>
                    </div>
                    <p><strong>10.3.-</strong> ADISTEM notificará a EL TITULAR, en un plazo máximo de 20-veinte días contados desde la fecha en que se recibió la solicitud de acceso, rectificación, cancelación u oposición, la resolución adoptada, a efecto de que, si resulta procedente, se haga efectiva la misma dentro de los 15-quince días siguientes a la fecha en que se comunica la respuesta. Tratándose de solicitudes de acceso a datos personales, procederá la entrega previa acreditación de la identidad del solicitante o representante legal, según corresponda.</p>
                  </div>
                </div>

                {/* 11. Transferencia de datos */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">11.- Transferencia de datos personales</h4>
                  <p>
                    <strong>11.1.-</strong> ADISTEM se obliga a no transferir o compartir los datos personales a los que se refiere el presente Aviso, a favor de terceros, salvo en los casos en que resulte necesario para cumplir con las finalidades de dicho Aviso.
                  </p>
                  <p>
                    En particular, ADISTEM podrá transferir al hotel que sea designado como sede de la Convención ADISTEM 2026, los datos generales y de identificación, datos de contacto, datos de hospedaje, datos relativos a actividades y preferencias, así como la copia de la credencial para votar expedida por el Instituto Nacional Electoral o del pasaporte vigente de EL TITULAR, con la finalidad de validar su identidad, gestionar o facilitar su pre-registro y proceso de check-in, y administrar los servicios de hospedaje relacionados con la Convención ADISTEM 2026.
                  </p>
                  <p>
                    Las transferencias de datos personales distintos de los sensibles previstas en este numeral no requieren el consentimiento de EL TITULAR, al actualizarse las excepciones previstas en la LFPDPPP.
                  </p>
                  <p>
                    Asimismo, ADISTEM podrá transferir a las empresas contratadas para prestar los servicios de transportación, alimentación, accesibilidad, actividades y mensajería o logística durante la Convención ADISTEM 2026 los datos personales estrictamente necesarios para coordinar y proporcionar los traslados, alimentos, ajustes, apoyos, actividades y el envío o entrega de obsequios, kits y materiales relacionados con la participación de EL TITULAR.
                  </p>
                  <p>
                    Cuando cualquiera de las transferencias previstas en este numeral incluya datos personales sensibles, se limitará a los datos indispensables para la prestación del servicio correspondiente y se sujetará al consentimiento expreso y por escrito de EL TITULAR previsto en el numeral 4.3 del presente Aviso de Privacidad.
                  </p>
                </div>

                {/* 12. Modificaciones */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">12.- Modificaciones</h4>
                  <p>
                    <strong>12.1.-</strong> ADISTEM podrá modificar o actualizar el presente Aviso de Privacidad como consecuencia de cambios en el tratamiento de los datos personales o en la normativa aplicable. Las modificaciones se pondrán a disposición de EL TITULAR en la Plataforma de Registro y, cuando resulten sustanciales, se comunicarán mediante los medios de contacto disponibles. Cuando las modificaciones impliquen nuevas finalidades que requieran consentimiento, éste será recabado antes de iniciar el tratamiento correspondiente.
                  </p>
                </div>

                {/* 13. Autoridad garante */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">13.- Autoridad garante</h4>
                  <p>
                    <strong>13.1.-</strong> Si EL TITULAR considera que su derecho a la protección de sus datos personales ha sido lesionado por alguna conducta u omisión por parte de ADISTEM o presume alguna violación a las disposiciones previstas en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, su Reglamento y demás ordenamientos aplicables, podrá presentar una solicitud de protección de datos, o en su caso, interponer denuncia ante la Secretaría Anticorrupción y Buen Gobierno (SABG). Para mayor información, le sugerimos visitar su página oficial de Internet https://www.gob.mx/buengobierno.
                  </p>
                </div>

                {/* 14. Ley aplicable y jurisdicción */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wide">14.- Ley aplicable y jurisdicción</h4>
                  <p>
                    <strong>14.1.-</strong> El presente Aviso de Privacidad se regirá por las disposiciones legales aplicables en la República Mexicana, en especial, por lo dispuesto en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, su Reglamento y la demás normativa vigente y aplicable.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                  <p className="font-bold text-slate-500 dark:text-slate-400 text-xs">
                    Versión 1.0 [Fecha de actualización 29/Julio/2026]
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`p-4 border-t flex items-center justify-end gap-3 ${
                isDarkMode ? "border-slate-800 bg-slate-850" : "border-slate-100 bg-slate-50"
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedPrivacyPolicy(true);
                    setShowPrivacyModal(false);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Entendido y Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
