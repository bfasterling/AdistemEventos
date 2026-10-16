import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Calendar, Bell, QrCode, LogOut, Key, 
  Plane, MapPin, Bed, User, AlertCircle, Clock, 
  CheckCircle2, Compass, Sparkles, Building2, ShieldCheck, 
  Coffee, Users, HeartPulse, Share2, Smartphone, Check,
  Camera, Trash2, RefreshCw, X, Image as ImageIcon, ChevronRight, Download
} from "lucide-react";
import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, EventConfig, EventPhoto } from "../types";
import { DataStore } from "../dataStore";
import LogoConvencion from "../assets/images/Logo_convencion_reducido.png";
import QRCode from "qrcode";

const isCapacitor = typeof window !== "undefined" && (
  !!(window as any).Capacitor || 
  window.location.protocol === "capacitor:" || 
  window.location.href.startsWith("capacitor://") ||
  navigator.userAgent.includes("Capacitor")
);

const isNativeOrMobileViewport = isCapacitor || (typeof window !== "undefined" && (
  window.location.search.includes("view=mobile") ||
  window.innerWidth < 768 ||
  (window.navigator && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent))
));

interface MobileAppProps {
  guests: Guest[];
  transportSlots: TransportSlot[];
  activities: Activity[];
  comms: CommMessage[];
  photos: EventPhoto[];
  config: EventConfig;
  activeSimGuestId: string | null;
  onUpdate: () => void;
}

// Generate a certified ISO/IEC 18004 standard QR Code readable by iOS/Android camera and Google Lens
export function QrCodeSvg({ 
  value, 
  size = 160, 
  className = "mx-auto select-none" 
}: { 
  value: string; 
  size?: number; 
  className?: string; 
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setDataUrl("");
      return;
    }

    // Generate high-resolution, perfectly quiet-zoned (margin: 3) QR Code
    QRCode.toDataURL(value, {
      margin: 3,
      errorCorrectionLevel: "M",
      width: Math.max(size * 2, 400),
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    }).then(url => {
      if (isMounted) setDataUrl(url);
    }).catch(err => {
      console.error("Error generating QR code:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!value) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`flex items-center justify-center bg-slate-100 rounded-2xl text-slate-400 text-xs ${className}`}
      >
        Sin código
      </div>
    );
  }

  if (dataUrl) {
    return (
      <img
        src={dataUrl}
        alt={`Código QR: ${value}`}
        width={size}
        height={size}
        className={`block rounded-xl bg-white shadow-2xs ${className}`}
        style={{ width: `${size}px`, height: `${size}px`, imageRendering: "pixelated" }}
      />
    );
  }

  return (
    <div 
      style={{ width: size, height: size }} 
      className={`flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl animate-pulse text-slate-400 text-xs p-2 text-center ${className}`}
    >
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-1"></div>
      <span className="text-[9px] font-bold">Generando QR...</span>
    </div>
  );
}

// Format date into human-friendly format: "15 Oct 2026 • 18:30 hrs"
function formatCommDate(val?: any): string {
  if (!val) {
    const d = new Date();
    return `${d.getDate()} Oct ${d.getFullYear()} • ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} hrs`;
  }
  try {
    let d: Date;
    if (typeof val === "object") {
      if ("seconds" in val) {
        d = new Date(val.seconds * 1000);
      } else if ("_seconds" in val) {
        d = new Date(val._seconds * 1000);
      } else if (val instanceof Date) {
        d = val;
      } else {
        d = new Date(String(val));
      }
    } else if (typeof val === "number") {
      d = new Date(val);
    } else {
      d = new Date(val);
    }

    if (isNaN(d.getTime())) {
      return String(val);
    }

    const day = d.getDate();
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} • ${hours}:${mins} hrs`;
  } catch {
    return String(val);
  }
}

// Helper to optimize image in canvas: full (max 1080px Full HD, quality 0.78) and thumbnail (max 240px, quality 0.65)
async function processAndOptimizeImage(file: File): Promise<{ fullBase64: string; thumbBase64: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Tiempo de espera agotado al procesar la imagen"));
    }, 15000);

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer el archivo de imagen."));
    };

    img.onload = () => {
      clearTimeout(timeout);
      try {
        // 1. Full high-definition optimized image (Max 1080px for crisp display on any phone/retina)
        const maxDim = 1080;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");
        ctx.drawImage(img, 0, 0, width, height);
        const fullBase64 = canvas.toDataURL("image/jpeg", 0.78);

        // 2. Ultra-light thumbnail image for fast grid rendering (Max 240px)
        const thumbDim = 240;
        let tWidth = img.width;
        let tHeight = img.height;
        if (tWidth > thumbDim || tHeight > thumbDim) {
          if (tWidth > tHeight) {
            tHeight = Math.round((tHeight * thumbDim) / tWidth);
            tWidth = thumbDim;
          } else {
            tWidth = Math.round((tWidth * thumbDim) / tHeight);
            tHeight = thumbDim;
          }
        }
        const tCanvas = document.createElement("canvas");
        tCanvas.width = tWidth;
        tCanvas.height = tHeight;
        const tCtx = tCanvas.getContext("2d");
        if (!tCtx) throw new Error("Canvas context not available");
        tCtx.drawImage(img, 0, 0, tWidth, tHeight);
        const thumbBase64 = tCanvas.toDataURL("image/jpeg", 0.65);

        URL.revokeObjectURL(objectUrl);
        resolve({ fullBase64, thumbBase64 });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.src = objectUrl;
  });
}

// Format date into day label e.g. "Jueves 15 de Octubre"
function formatDayLabel(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export default function MobileApp({
  guests,
  transportSlots,
  activities,
  comms,
  photos,
  config,
  activeSimGuestId,
  onUpdate
}: MobileAppProps) {
  // Session / Authentication state with persistent localStorage cache
  const [currentUser, setCurrentUser] = useState<Guest | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("adistem_session_guest_data");
        if (cached) return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("adistem_session_guest_data") || !!localStorage.getItem("adistem_session_email");
    }
    return false;
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Navigation tabs: 'itinerary' | 'agenda' | 'photos' | 'comms' | 'carnet'
  const [activeTab, setActiveTab] = useState<"itinerary" | "agenda" | "photos" | "comms" | "carnet">("itinerary");
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(1);

  // Photos tab states
  const [photoFilterMode, setPhotoFilterMode] = useState<"all" | "mine">("all");
  const [selectedPhotoDate, setSelectedPhotoDate] = useState<string>("all");
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<EventPhoto | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const [visiblePhotosCount, setVisiblePhotosCount] = useState<number>(16);
  const [isRefreshingPhotos, setIsRefreshingPhotos] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Push notifications state
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [pushSubscribedSuccess, setPushSubscribedSuccess] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  const isIos = typeof window !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches || 
    (window.navigator as any).standalone === true
  );

  // 1. Register Service Worker on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(reg => {
        // Check if already subscribed to push
        if ("pushManager" in reg) {
          reg.pushManager.getSubscription().then(sub => {
            if (sub) {
              setPushSubscribedSuccess(true);
            }
          });
        }
      }).catch(err => {
        console.error("Error registrando Service Worker:", err);
      });
    }
  }, []);

  // 2. Restore and sync session from localStorage and guests list
  useEffect(() => {
    const storedEmail = localStorage.getItem("adistem_session_email");
    if (storedEmail && guests.length > 0) {
      const g = guests.find(g => 
        g.email.toLowerCase() === storedEmail.toLowerCase() || 
        g.id.toLowerCase() === storedEmail.toLowerCase()
      );
      if (g) {
        setCurrentUser(g);
        setIsLoggedIn(true);
        localStorage.setItem("adistem_session_guest_data", JSON.stringify(g));
      }
    }
  }, [guests]);

  // 3. Sync to activeSimGuestId when selected from Backoffice simulator
  useEffect(() => {
    if (activeSimGuestId) {
      const g = guests.find(g => g.id === activeSimGuestId);
      if (g) {
        setCurrentUser(g);
        setIsLoggedIn(true);
        localStorage.setItem("adistem_session_email", g.email);
        localStorage.setItem("adistem_session_guest_data", JSON.stringify(g));
      }
    }
  }, [activeSimGuestId, guests]);

  // 4. Sync live updates of current logged-in guest from database
  useEffect(() => {
    if (isLoggedIn && currentUser && guests.length > 0) {
      const g = guests.find(guest => guest.id === currentUser.id);
      if (g && JSON.stringify(g) !== JSON.stringify(currentUser)) {
        setCurrentUser(g);
        localStorage.setItem("adistem_session_guest_data", JSON.stringify(g));
      }
    }
  }, [guests, isLoggedIn, currentUser]);

  // 5. Re-link existing push subscription with logged-in guest identity
  useEffect(() => {
    if (isLoggedIn && currentUser && typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        if (reg && reg.pushManager) {
          reg.pushManager.getSubscription().then(sub => {
            if (sub) {
              fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscription: sub,
                  guestId: currentUser.id,
                  email: currentUser.email,
                  userAgent: navigator.userAgent
                })
              }).catch(() => {});
            }
          });
        }
      }).catch(() => {});
    }
  }, [currentUser, isLoggedIn]);

  // 6. Filter visible comms for logged-in user (All, Group category or Single guest)
  const visibleComms = useMemo(() => {
    if (!currentUser) return comms;
    const isUserVip = currentUser.tipoHuesped === 'VIP' || (currentUser.comentariosAdmin && currentUser.comentariosAdmin.toUpperCase().includes('**VIP'));
    const isUserStaff = currentUser.tipoHuesped === 'Staff' || (currentUser.comentariosAdmin && currentUser.comentariosAdmin.toUpperCase().includes('**STAFF'));

    return comms.filter(msg => {
      const seg = msg.segment || {};
      // Single guest targeting
      if (seg.targetMode === 'single') {
        return seg.targetGuestId === currentUser.id;
      }
      // Category targeting
      if (seg.targetMode === 'category') {
        if (seg.targetCategory === 'VIP') return isUserVip;
        if (seg.targetCategory === 'Staff') return isUserStaff;
        return currentUser.tipoHuesped === seg.targetCategory;
      }
      // Stage targeting
      if (seg.stage && seg.stage !== 'all') {
        if (currentUser.stage && currentUser.stage !== seg.stage) return false;
      }
      return true;
    });
  }, [comms, currentUser]);

  // 7. Track read comm message IDs with persistent localStorage
  const [readCommIds, setReadCommIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("adistem_read_comm_ids");
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const unreadCommsCount = useMemo(() => {
    if (activeTab === "comms") return 0;
    return visibleComms.filter(m => !readCommIds.includes(m.id)).length;
  }, [visibleComms, readCommIds, activeTab]);

  // Mark all visible comms as read when viewing the comms tab
  useEffect(() => {
    if (activeTab === "comms" && visibleComms.length > 0) {
      const currentIds = visibleComms.map(c => c.id);
      setReadCommIds(prev => {
        const combined = Array.from(new Set([...prev, ...currentIds]));
        try {
          localStorage.setItem("adistem_read_comm_ids", JSON.stringify(combined));
        } catch {
          // ignore
        }
        return combined;
      });
    }
  }, [activeTab, visibleComms]);

  // Push Subscription Handler
  const handleSubscribePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("Tu dispositivo o navegador no soporta notificaciones push.");
      return;
    }

    setIsSubscribingPush(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== "granted") {
        if (isIos && !isStandalone) {
          setShowIosTip(true);
        } else {
          alert("Permiso de notificaciones no concedido. Puedes habilitarlo en los ajustes de tu navegador.");
        }
        setIsSubscribingPush(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      if (!reg || !reg.pushManager) {
        throw new Error("PushManager no disponible en este dispositivo.");
      }

      // Obtener clave pública VAPID del servidor
      const keyRes = await fetch("/api/push/public-key");
      const { publicKey } = await keyRes.json();

      // Convertir base64 url-safe a Uint8Array
      const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
      const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
      }

      // Guardar suscripción en el backend
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub,
          guestId: currentUser?.id,
          email: currentUser?.email,
          userAgent: navigator.userAgent
        })
      });

      setPushSubscribedSuccess(true);
      setShowIosTip(false);
    } catch (err: any) {
      console.error("Error al suscribir notificaciones:", err);
      alert("No se pudo completar la activación de notificaciones: " + (err.message || "Error desconocido"));
    } finally {
      setIsSubscribingPush(false);
    }
  };

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
        localStorage.setItem("adistem_session_guest_data", JSON.stringify(guest));
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
    localStorage.setItem("adistem_session_guest_data", JSON.stringify(guest));
  };

  const handleLogout = () => {
    localStorage.removeItem("adistem_session_email");
    localStorage.removeItem("adistem_session_guest_data");
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

  // Photos filtering and computation
  const availablePhotoDates = useMemo(() => {
    const set = new Set<string>();
    (photos || []).forEach(p => {
      if (p.date) set.add(p.date);
    });
    return Array.from(set).sort().reverse();
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    return (photos || []).filter(p => {
      if (photoFilterMode === "mine") {
        if (!currentUser || p.guestId !== currentUser.id) return false;
      }
      if (selectedPhotoDate !== "all") {
        if (p.date !== selectedPhotoDate) return false;
      }
      return true;
    });
  }, [photos, photoFilterMode, selectedPhotoDate, currentUser]);

  const displayedPhotos = useMemo(() => {
    return filteredPhotos.slice(0, visiblePhotosCount);
  }, [filteredPhotos, visiblePhotosCount]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser) {
      alert("Por favor inicia sesión con tu usuario o carnet para compartir fotos.");
      return;
    }

    setIsUploadingPhoto(true);
    setUploadToast("Optimizando foto capturada...");

    try {
      const { fullBase64, thumbBase64 } = await processAndOptimizeImage(file);
      setUploadToast("Guardando en Storage...");
      await DataStore.uploadPhoto({
        fullBase64,
        thumbBase64,
        guestId: currentUser.id,
        guestName: currentUser.name || `${currentUser.nombreTitular || ""} ${currentUser.apellidosTitular || ""}`.trim() || "Asistente ADISTEM",
        carnetNumero: (currentUser as any).carnetNumero ? String((currentUser as any).carnetNumero) : "",
        distributor: currentUser.distributor || "ADISTEM",
        date: new Date().toISOString().split("T")[0]
      });

      setUploadToast("¡Foto publicada exitosamente!");
      setTimeout(() => setUploadToast(null), 3000);
      onUpdate();
    } catch (err: any) {
      console.error("Error al procesar o subir foto:", err);
      alert("Hubo un error al procesar la foto: " + (err.message || err));
      setUploadToast(null);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("¿Deseas eliminar esta foto? Ya no será compartida con los demás asistentes.")) {
      return;
    }
    try {
      await DataStore.deletePhoto(photoId, currentUser?.name, currentUser?.email);
      if (activeLightboxPhoto?.id === photoId) {
        setActiveLightboxPhoto(null);
      }
      onUpdate();
    } catch (err) {
      console.error("Error al eliminar foto:", err);
    }
  };

  const handleRefreshPhotos = async () => {
    setIsRefreshingPhotos(true);
    try {
      onUpdate();
    } finally {
      setTimeout(() => setIsRefreshingPhotos(false), 500);
    }
  };

  const handleSharePhoto = async (photo: EventPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = photo.photoUrl.startsWith("http") 
      ? photo.photoUrl 
      : `${window.location.origin}${photo.photoUrl.startsWith('/') ? '' : '/'}${photo.photoUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Foto Convención ADISTEM 2026",
          text: `Foto tomada por ${photo.guestName} en la Convención ADISTEM 2026`,
          url: shareUrl
        });
      } catch (err) {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("¡Enlace de la foto copiado al portapapeles!");
      } catch {
        window.open(photo.photoUrl, "_blank");
      }
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
    <div className={isNativeOrMobileViewport ? "w-full h-full bg-white flex flex-col border-0 capacitor-safe-area" : "bg-slate-50 p-4 flex flex-col items-center justify-center min-h-screen border-l border-slate-100"} id="mobile-sim-wrapper">
      
      {/* PHONE EMULATOR CONTAINER */}
      <div className={isNativeOrMobileViewport ? "w-full h-full bg-white relative flex-1 flex flex-col min-h-0 border-0 rounded-none shadow-none overflow-hidden" : "w-[370px] h-[740px] bg-white rounded-[44px] border-[10px] border-slate-850 shadow-2xl relative overflow-hidden flex flex-col"} id="phone-frame">
        
        {/* Notch / Speaker bar */}
        {!isNativeOrMobileViewport && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-100 rounded-full z-50 flex items-center justify-between px-3">
            <div className="w-2 h-2 rounded-full bg-slate-350"></div>
            <div className="w-12 h-1 bg-slate-300 rounded"></div>
          </div>
        )}

        {/* StatusBar Row */}
        {!isNativeOrMobileViewport && (
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
                      placeholder="ej: correo@empresa.com"
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
                
                {/* Banner de Activación de Notificaciones Push & PWA */}
                {!pushSubscribedSuccess && pushPermission !== "granted" ? (
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3.5 rounded-2xl shadow-sm border border-blue-800 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-blue-500/20 rounded-xl text-blue-300 shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          Avisos y Alertas en tu Celular
                          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">Recomendado</span>
                        </h4>
                        <p className="text-[10px] text-blue-150 leading-relaxed mt-0.5 font-medium">
                          Activa las notificaciones para recibir cambios de logística, horarios y avisos urgentes incluso con tu celular bloqueado o en reposo.
                        </p>
                      </div>
                    </div>

                    <div className="pt-0.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSubscribePush}
                        disabled={isSubscribingPush}
                        className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-xs font-black rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        {isSubscribingPush ? "Conectando..." : "Activar Notificaciones"}
                      </button>

                      {isIos && !isStandalone && (
                        <button
                          type="button"
                          onClick={() => setShowIosTip(prev => !prev)}
                          className="px-2.5 py-2 bg-white/10 hover:bg-white/20 text-blue-200 text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          ¿Cómo activar en iPhone?
                        </button>
                      )}
                    </div>

                    {/* Instrucción detallada para iOS si no está en pantalla de inicio */}
                    {(showIosTip || (isIos && !isStandalone)) && (
                      <div className="p-2.5 bg-black/25 rounded-xl border border-white/10 text-[10px] text-blue-100 space-y-1">
                        <p className="font-bold text-white flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-amber-300" />
                          Instrucciones para iPhone (Apple iOS):
                        </p>
                        <p className="leading-tight text-blue-150">
                          1. En Safari, toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba <Share2 className="w-2.5 h-2.5 inline" />).
                        </p>
                        <p className="leading-tight text-blue-150">
                          2. Selecciona <strong>"Agregar a la pantalla de inicio"</strong>.
                        </p>
                        <p className="leading-tight text-blue-150">
                          3. Abre la app desde el nuevo ícono oficial en tu pantalla y toca <strong>"Activar Notificaciones"</strong> para recibir alertas en tu pantalla bloqueada.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Notificaciones y alertas push activadas en este dispositivo
                    </span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-black uppercase">
                      En línea
                    </span>
                  </div>
                )}
                
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

                {/* ================= PESTAÑA: FOTOS DEL EVENTO ================= */}
                {activeTab === "photos" && (
                  <div className="space-y-3.5">
                    {/* Header y Acciones Principales */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-150">
                      <div>
                        <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          Galería del Evento
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Comparte y revive los momentos de la Convención.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleRefreshPhotos}
                          title="Actualizar fotos"
                          disabled={isRefreshingPhotos}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer transition shadow-2xs"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPhotos ? 'animate-spin text-blue-600' : ''}`} />
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Tomar Foto</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handlePhotoCapture}
                        />
                      </div>
                    </div>

                    {/* Toast de carga / Optimización */}
                    {(isUploadingPhoto || uploadToast) && (
                      <div className={`p-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 transition shadow-3xs ${
                        uploadToast?.includes("exitosamente") 
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                          : "bg-blue-50 text-blue-900 border border-blue-200 animate-pulse"
                      }`}>
                        {isUploadingPhoto ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span>{uploadToast || "Optimizando y publicando foto..."}</span>
                      </div>
                    )}

                    {/* Filtros: Switch Todas / Mis Fotos & Selector de Fecha */}
                    <div className="space-y-2 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-150">
                      {/* Switch Todas vs Mis Fotos */}
                      <div className="flex bg-slate-200/70 p-0.5 rounded-xl text-[10px]">
                        <button
                          onClick={() => setPhotoFilterMode("all")}
                          className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer text-center ${
                            photoFilterMode === "all"
                              ? "bg-white text-slate-900 shadow-2xs font-black"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Todas ({photos.length})
                        </button>
                        <button
                          onClick={() => setPhotoFilterMode("mine")}
                          className={`flex-1 py-1 rounded-lg font-bold transition cursor-pointer text-center ${
                            photoFilterMode === "mine"
                              ? "bg-white text-slate-900 shadow-2xs font-black"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Mis Fotos ({photos.filter(p => currentUser && p.guestId === currentUser.id).length})
                        </button>
                      </div>

                      {/* Selector de Fecha */}
                      {availablePhotoDates.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                          <button
                            onClick={() => setSelectedPhotoDate("all")}
                            className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition cursor-pointer ${
                              selectedPhotoDate === "all"
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Todos los días
                          </button>
                          {availablePhotoDates.map(dateStr => {
                            let label = dateStr;
                            try {
                              const parts = dateStr.split("-");
                              if (parts.length === 3) {
                                const day = parseInt(parts[2], 10);
                                const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                                label = `${day} ${months[parseInt(parts[1], 10) - 1]}`;
                              }
                            } catch {}
                            return (
                              <button
                                key={dateStr}
                                onClick={() => setSelectedPhotoDate(dateStr)}
                                className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition cursor-pointer ${
                                  selectedPhotoDate === dateStr
                                    ? "bg-blue-600 text-white shadow-2xs"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Cuadrícula de Thumbnails Optimizados */}
                    {filteredPhotos.length === 0 ? (
                      <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-2 p-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-slate-800 font-bold">
                          {photoFilterMode === "mine" 
                            ? "Aún no has compartido fotos" 
                            : "No hay fotos para la fecha seleccionada"}
                        </p>
                        <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto font-medium">
                          {photoFilterMode === "mine"
                            ? "Toca en 'Tomar Foto' para capturar y compartir recuerdos con los asistentes."
                            : "Sé el primero en compartir una foto de este día del evento."}
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-2xs cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Tomar mi primera foto</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {displayedPhotos.map(photo => {
                            const isMyPhoto = !!(currentUser && photo.guestId === currentUser.id);
                            return (
                              <div
                                key={photo.id}
                                onClick={() => setActiveLightboxPhoto(photo)}
                                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-150 shadow-3xs cursor-pointer select-none transition duration-200 hover:shadow-md"
                              >
                                <img
                                  src={photo.thumbnailUrl || photo.photoUrl}
                                  alt={photo.caption || `Foto de ${photo.guestName}`}
                                  loading="lazy"
                                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'/%3E%3Ccircle cx='12' cy='13' r='3'/%3E%3C/svg%3E";
                                  }}
                                />

                                {/* Gradiente inferior informativo con Autor y botón Compartir */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 flex items-end justify-between pointer-events-none">
                                  <div className="text-white text-[9px] font-bold truncate pr-1">
                                    <span className="block truncate text-white leading-tight drop-shadow-xs">{photo.guestName}</span>
                                    <span className="text-[8px] text-slate-300 font-medium block">{photo.date}</span>
                                  </div>
                                  <button
                                    onClick={(e) => handleSharePhoto(photo, e)}
                                    title="Compartir foto"
                                    className="pointer-events-auto p-1.5 bg-white/25 hover:bg-white/50 text-white rounded-full backdrop-blur-xs transition active:scale-90"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Icono discreto de bote de basura SOLO si la foto fue tomada por el usuario */}
                                {isMyPhoto && (
                                  <button
                                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                                    title="Eliminar mi foto"
                                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full shadow-md backdrop-blur-xs transition cursor-pointer z-10 active:scale-90"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Botón de carga progresiva / Scroll asíncrono para no saturar red */}
                        {filteredPhotos.length > displayedPhotos.length && (
                          <div className="pt-1 text-center">
                            <button
                              onClick={() => setVisiblePhotosCount(prev => prev + 16)}
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-[10px] font-black rounded-xl border border-slate-200 transition cursor-pointer"
                            >
                              Cargar más fotos ({filteredPhotos.length - displayedPhotos.length} restantes)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ================= PESTAÑA 3: AVISOS Y COMUNICADOS ================= */}
                {activeTab === "comms" && (
                  <div className="space-y-3.5">
                    <div className="border-b border-slate-150 pb-2 flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-xs text-slate-900">Avisos y Comunicados Oficiales</h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Notificaciones, avisos de logística y cambios enviados por el Comité Organizador.
                        </p>
                      </div>
                      {visibleComms.length > 0 && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-150 shrink-0">
                          {visibleComms.length} {visibleComms.length === 1 ? "aviso" : "avisos"}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {visibleComms.length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                          <p className="text-xs text-slate-400 italic">No hay avisos publicados por el momento.</p>
                        </div>
                      ) : (
                        visibleComms.map(msg => (
                          <div key={msg.id} className="p-3.5 bg-white rounded-2xl border border-slate-150 space-y-2.5 shadow-3xs">
                            <div className="flex justify-between items-center text-[10px] border-b border-slate-100 pb-2">
                              <span className="text-blue-600 uppercase tracking-wider flex items-center gap-1.5 font-black text-[9px]">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                {msg.segment?.targetMode === "single" 
                                  ? "Aviso Personal" 
                                  : msg.segment?.targetMode === "category" 
                                    ? `Aviso ${msg.segment.targetCategory || "Grupo"}` 
                                    : "Comité ADISTEM"}
                              </span>
                              <span className="text-slate-600 font-bold text-[10px] flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                {formatCommDate(msg.sentAt || (msg as any).createdAt || (msg as any).timestamp || (msg as any).date)}
                              </span>
                            </div>
                            <p className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                              <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              {msg.subject}
                            </p>
                            <p className="text-[11px] text-slate-650 leading-relaxed font-medium whitespace-pre-line">
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
              <div className="bg-white border-t border-slate-150 p-2 grid grid-cols-5 gap-0.5 text-[10px] text-center select-none shrink-0 shadow-lg" id="phone-bottom-bar">
                
                <button 
                  onClick={() => setActiveTab("itinerary")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-xl ${
                    activeTab === "itinerary" ? "text-blue-600 font-black bg-blue-50/80" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span className="text-[9px]">Itinerario</span>
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
                  onClick={() => setActiveTab("photos")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-xl ${
                    activeTab === "photos" ? "text-blue-600 font-black bg-blue-50/80" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[9px]">Fotos</span>
                </button>

                <button 
                  onClick={() => setActiveTab("comms")}
                  className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer rounded-xl relative ${
                    activeTab === "comms" ? "text-blue-600 font-black bg-blue-50/80" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <div className="relative">
                    <Bell className="w-4 h-4" />
                    {unreadCommsCount > 0 && activeTab !== "comms" && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
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
        {!isNativeOrMobileViewport && (
          <div className="h-4 bg-white flex items-center justify-center shrink-0 pb-1 select-none border-t border-slate-50">
            <div className="w-32 h-1 bg-slate-200 rounded-full"></div>
          </div>
        )}

      </div>

      {/* ================= LIGHTBOX MODAL PARA VER FOTO EN GRANDE ================= */}
      {activeLightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-3 select-none backdrop-blur-sm"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          {/* Barra Superior con info del autor y botón de cerrar */}
          <div className="flex items-center justify-between text-white p-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                {(activeLightboxPhoto.guestName || "A")[0].toUpperCase()}
              </div>
              <div className="truncate">
                <p className="font-extrabold text-xs text-white truncate">{activeLightboxPhoto.guestName}</p>
                <p className="text-[10px] text-slate-300">
                  {activeLightboxPhoto.carnetNumero ? `Carnet #${activeLightboxPhoto.carnetNumero} • ` : ""}
                  {formatCommDate(activeLightboxPhoto.timestamp || activeLightboxPhoto.date)}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveLightboxPhoto(null)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition active:scale-90"
              title="Cerrar foto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Imagen en grande (al hacer click en la foto también se cierra y regresa a los thumbnails) */}
          <div className="flex-1 flex items-center justify-center p-2 min-h-0 cursor-pointer" onClick={() => setActiveLightboxPhoto(null)}>
            <img 
              src={activeLightboxPhoto.photoUrl} 
              alt={activeLightboxPhoto.caption || "Foto en grande"} 
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition duration-300 pointer-events-auto"
            />
          </div>

          {/* Barra Inferior con Compartir, Eliminar (si es propia) y Botón Cerrar */}
          <div className="flex items-center justify-between p-2 gap-2 text-white" onClick={e => e.stopPropagation()}>
            <button
              onClick={(e) => handleSharePhoto(activeLightboxPhoto, e)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold text-white transition cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir</span>
            </button>

            {currentUser && activeLightboxPhoto.guestId === currentUser.id && (
              <button
                onClick={(e) => handleDeletePhoto(activeLightboxPhoto.id, e)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/80 hover:bg-rose-600 rounded-xl text-xs font-bold text-white transition cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar mi foto</span>
              </button>
            )}

            <button
              onClick={() => setActiveLightboxPhoto(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition cursor-pointer active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
