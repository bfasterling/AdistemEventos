import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig, HotelConfig, PortalUser, ActivityReservationDetail, SpaReservationSlot, GuestChangeLog, HotelRoom, EventPhoto } from "./types";
import { INITIAL_EVENT_CONFIG, INITIAL_GUESTS, INITIAL_TRANSPORT_SLOTS, INITIAL_ACTIVITIES, INITIAL_COMMS, INITIAL_AUDIT_LOGS, INITIAL_HOTELS, INITIAL_USERS } from "./initialData";
import { INITIAL_HOTEL_ROOMS } from "./data/hotelRoomsData";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { collection, doc, setDoc as fSetDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { fetchSpaSlotsFromSheet, fetchPickleballSlotsFromSheet } from "./utils/googleSheetsService";

// Helper function to recursively remove undefined properties before saving to Firestore
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as any;
  }
  
  const cleaned: any = {};
  for (const key of Object.keys(obj as any)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      cleaned[key] = sanitizeForFirestore(val);
    }
  }
  return cleaned;
}

// Wrapper for setDoc to ensure we never send undefined values to Firestore
function setDoc(docRef: any, data: any, options?: any): Promise<void> {
  return fSetDoc(docRef, sanitizeForFirestore(data), options);
}

export class DataStore {
  private static guests: Guest[] = INITIAL_GUESTS;
  private static transportSlots: TransportSlot[] = INITIAL_TRANSPORT_SLOTS;
  private static activities: Activity[] = INITIAL_ACTIVITIES;
  private static comms: CommMessage[] = INITIAL_COMMS;
  private static auditLogs: AuditLogEntry[] = INITIAL_AUDIT_LOGS;
  private static config: EventConfig | null = INITIAL_EVENT_CONFIG;
  private static hotels: HotelConfig[] = INITIAL_HOTELS;
  private static photos: EventPhoto[] = [];
  private static hotelRooms: HotelRoom[] = (() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("adistem_hotel_rooms");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_HOTEL_ROOMS;
  })();
  private static portalUsers: PortalUser[] = INITIAL_USERS as PortalUser[];
  private static onUpdateCallback: (() => void) | null = null;
  private static isInitialized = false;

  static initialize(onUpdate: () => void): void {
    if (this.isInitialized) {
      this.onUpdateCallback = onUpdate;
      onUpdate();
      return;
    }
    this.isInitialized = true;
    this.onUpdateCallback = onUpdate;

    // Trigger immediate UI rendering with offline/default data
    onUpdate();

    // 1. Listen to config
    onSnapshot(collection(db, "config"), (snapshot) => {
      if (snapshot.empty) {
        this.seedConfig();
      } else {
        snapshot.forEach(docSnap => {
          if (docSnap.id === "event_config") {
            let data = docSnap.data() as EventConfig;
            let needsUpdate = false;
            
            // Clean up old mock deadlines from previous database seeding if they match the templates
            if (data.deadlineFlightChange && (data.deadlineFlightChange.includes("2026-10") || data.deadlineFlightChange.includes("2026-10-15"))) {
              data.deadlineFlightChange = "";
              needsUpdate = true;
            }
            if (data.deadlineTransportChange && (data.deadlineTransportChange.includes("2026-10") || data.deadlineTransportChange.includes("2026-10-17"))) {
              data.deadlineTransportChange = "";
              needsUpdate = true;
            }
            if (data.deadlineActivityChange && (data.deadlineActivityChange.includes("2026-10") || data.deadlineActivityChange.includes("2026-10-16"))) {
              data.deadlineActivityChange = "";
              needsUpdate = true;
            }

            // Ensure stage 2 is open and currentRegistrationStage is 2
            if (!data.stage2Open || data.currentRegistrationStage !== 2) {
              data.stage2Open = true;
              data.currentRegistrationStage = 2;
              needsUpdate = true;
            }

            if (needsUpdate) {
              setDoc(doc(db, "config", "event_config"), data)
                .then(() => console.log("Database migrated: Old mock deadlines successfully cleared to blank."))
                .catch(err => console.error("Error clearing old mock deadlines in db:", err));
            }

            this.config = data;
          }
        });
        if (this.onUpdateCallback) this.onUpdateCallback();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "config"));

    // 2. Listen to guests
    onSnapshot(collection(db, "guests"), (snapshot) => {
      const list: Guest[] = [];
      snapshot.forEach(doc => {
        if (!doc.id.startsWith("empty_marker")) {
          const g = doc.data() as Guest;
          if (!g.selectedActivities) g.selectedActivities = [];
          if (!g.companions) g.companions = [];
          if (!g.auditHistory) g.auditHistory = [];
          if (!g.activityReservations) g.activityReservations = [];
          list.push(g);
        }
      });
      this.guests = list;
      if (this.onUpdateCallback) this.onUpdateCallback();
    }, (err) => handleFirestoreError(err, OperationType.GET, "guests"));

    // 3. Listen to transports
    onSnapshot(collection(db, "transports"), (snapshot) => {
      const list: TransportSlot[] = [];
      snapshot.forEach(doc => {
        if (!doc.id.startsWith("empty_marker")) {
          list.push(doc.data() as TransportSlot);
        }
      });
      this.transportSlots = list;
      if (this.onUpdateCallback) this.onUpdateCallback();
    }, (err) => handleFirestoreError(err, OperationType.GET, "transports"));

    // 4. Listen to activities
    onSnapshot(collection(db, "activities"), (snapshot) => {
      const list: Activity[] = [];
      snapshot.forEach(doc => {
        if (!doc.id.startsWith("empty_marker")) {
          const act = doc.data() as Activity;
          if (!act.waitingList) act.waitingList = [];
          list.push(act);
        }
      });
      this.activities = list;
      if (this.onUpdateCallback) this.onUpdateCallback();
    }, (err) => handleFirestoreError(err, OperationType.GET, "activities"));

    // 5. Listen to comms
    onSnapshot(collection(db, "comms"), (snapshot) => {
      const list: CommMessage[] = [];
      snapshot.forEach(doc => {
        if (!doc.id.startsWith("empty_marker")) {
          list.push(doc.data() as CommMessage);
        }
      });
      this.comms = list;
      if (this.onUpdateCallback) this.onUpdateCallback();
    }, (err) => handleFirestoreError(err, OperationType.GET, "comms"));

    // 6. Listen to audits
    onSnapshot(collection(db, "audits"), (snapshot) => {
      const list: AuditLogEntry[] = [];
      snapshot.forEach(doc => {
        if (!doc.id.startsWith("empty_marker")) {
          list.push(doc.data() as AuditLogEntry);
        }
      });
      this.auditLogs = list;
      if (this.onUpdateCallback) this.onUpdateCallback();
    }, (err) => handleFirestoreError(err, OperationType.GET, "audits"));

    // 7. Listen to hotels
    onSnapshot(collection(db, "hotels"), (snapshot) => {
      const list: HotelConfig[] = [];
      snapshot.forEach(doc => {
        if (!doc.id.startsWith("empty_marker")) {
          list.push(doc.data() as HotelConfig);
        }
      });
      this.hotels = list;
      if (this.onUpdateCallback) this.onUpdateCallback();
    }, (err) => handleFirestoreError(err, OperationType.GET, "hotels"));

    // 8. Listen to users
    onSnapshot(collection(db, "users"), (snapshot) => {
      if (snapshot.empty) {
        this.seedUsers();
      } else {
        const list: PortalUser[] = [];
        snapshot.forEach(doc => {
          if (!doc.id.startsWith("empty_marker")) {
            list.push(doc.data() as PortalUser);
          }
        });
        this.portalUsers = list;
        if (this.onUpdateCallback) this.onUpdateCallback();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "users"));

    // 9. Listen to hotel rooms catalog
    onSnapshot(doc(db, "hotelRoomsConfig", "catalog"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.rooms) && data.rooms.length > 0) {
          this.hotelRooms = data.rooms;
          try {
            localStorage.setItem("adistem_hotel_rooms", JSON.stringify(data.rooms));
          } catch (e) {}
          if (this.onUpdateCallback) this.onUpdateCallback();
        }
      }
    }, (err) => console.warn("hotelRooms listener:", err));

    // 10. Listen to event photos
    onSnapshot(collection(db, "photos"), (snapshot) => {
      const list: EventPhoto[] = [];
      snapshot.forEach(docSnap => {
        if (!docSnap.id.startsWith("empty_marker")) {
          list.push(docSnap.data() as EventPhoto);
        }
      });
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      this.photos = list;
      if (this.onUpdateCallback) this.onUpdateCallback();
    }, (err) => console.warn("photos listener:", err));
  }

  private static seedConfig() {
    setDoc(doc(db, "config", "event_config"), INITIAL_EVENT_CONFIG)
      .catch(err => console.error("Error seeding config:", err));
  }

  private static seedGuests() {
    INITIAL_GUESTS.forEach(g => {
      setDoc(doc(db, "guests", g.id), g)
        .catch(err => console.error("Error seeding guest:", err));
    });
  }

  private static seedTransports() {
    INITIAL_TRANSPORT_SLOTS.forEach(t => {
      setDoc(doc(db, "transports", t.id), t)
        .catch(err => console.error("Error seeding transport:", err));
    });
  }

  private static seedActivities() {
    INITIAL_ACTIVITIES.forEach(a => {
      setDoc(doc(db, "activities", a.id), a)
        .catch(err => console.error("Error seeding activity:", err));
    });
  }

  private static seedComms() {
    INITIAL_COMMS.forEach(c => {
      setDoc(doc(db, "comms", c.id), c)
        .catch(err => console.error("Error seeding comm:", err));
    });
  }

  private static seedAudits() {
    INITIAL_AUDIT_LOGS.forEach(l => {
      setDoc(doc(db, "audits", l.id), l)
        .catch(err => console.error("Error seeding audit log:", err));
    });
  }

  private static seedHotels() {
    INITIAL_HOTELS.forEach(h => {
      setDoc(doc(db, "hotels", h.id), h)
        .catch(err => console.error("Error seeding hotel:", err));
    });
  }

  private static seedUsers() {
    INITIAL_USERS.forEach(u => {
      setDoc(doc(db, "users", u.id), u)
        .catch(err => console.error("Error seeding user:", err));
    });
  }

  static getEventConfig(): EventConfig {
    return this.config || INITIAL_EVENT_CONFIG;
  }

  static saveEventConfig(config: EventConfig, editorName: string, editorEmail: string): void {
    const oldConfig = this.getEventConfig();
    this.config = config;
    
    // Write to Firestore asynchronously
    setDoc(doc(db, "config", "event_config"), config)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, "config/event_config"));

    // Audit general config change
    this.addAuditLog({
      userId: `Staff - ${editorName}`,
      userEmail: editorEmail,
      action: "Modificación de Configuración",
      details: "Se actualizaron las fechas, plazos límite o textos de las plantillas de correo/push.",
      prevValue: JSON.stringify(oldConfig).substring(0, 200),
      newValue: JSON.stringify(config).substring(0, 200)
    });
  }

  static getGuests(): Guest[] {
    try {
      return JSON.parse(JSON.stringify(this.guests));
    } catch (e) {
      return this.guests;
    }
  }

  static saveGuestsRaw(guests: Guest[]): void {
    this.guests = guests;
    // Write each guest to Firestore asynchronously
    guests.forEach(g => {
      setDoc(doc(db, "guests", g.id), g)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `guests/${g.id}`));
    });
    this.recalculateCounts();
  }

  static getTransportSlots(): TransportSlot[] {
    return this.transportSlots;
  }

  static saveTransportSlot(slot: TransportSlot): void {
    const index = this.transportSlots.findIndex(s => s.id === slot.id);
    if (index !== -1) {
      this.transportSlots[index] = slot;
    }
    setDoc(doc(db, "transports", slot.id), slot)
      .catch(err => console.error("Error saving transport slot:", err));
  }

  static addTransportSlot(slot: TransportSlot): void {
    this.transportSlots.push(slot);
    setDoc(doc(db, "transports", slot.id), slot)
      .catch(err => console.error("Error adding transport slot:", err));
  }

  static deleteTransportSlot(id: string): void {
    this.transportSlots = this.transportSlots.filter(s => s.id !== id);
    deleteDoc(doc(db, "transports", id))
      .catch(err => console.error("Error deleting transport slot:", err));
  }

  static getActivities(): Activity[] {
    return this.activities;
  }

  static saveActivity(activity: Activity): void {
    const index = this.activities.findIndex(a => a.id === activity.id);
    if (index !== -1) {
      this.activities[index] = activity;
    }
    setDoc(doc(db, "activities", activity.id), activity)
      .catch(err => console.error("Error saving activity:", err));
    this.recalculateCounts();
  }

  static addActivity(activity: Activity): void {
    this.activities.push(activity);
    setDoc(doc(db, "activities", activity.id), activity)
      .catch(err => console.error("Error adding activity:", err));
    this.recalculateCounts();
  }

  static deleteActivity(id: string): void {
    this.activities = this.activities.filter(a => a.id !== id);
    deleteDoc(doc(db, "activities", id))
      .catch(err => console.error("Error deleting activity:", err));
    // Also remove this activity from any guest's selectedActivities
    this.guests.forEach(g => {
      if (g.selectedActivities.includes(id)) {
        g.selectedActivities = g.selectedActivities.filter(aid => aid !== id);
        setDoc(doc(db, "guests", g.id), g)
          .catch(err => console.error("Error updating guest after deleting activity:", err));
      }
    });
    this.recalculateCounts();
  }

  static getComms(): CommMessage[] {
    return this.comms;
  }

  static getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  static getHotels(): HotelConfig[] {
    return this.hotels;
  }

  static saveHotel(hotel: HotelConfig): void {
    const index = this.hotels.findIndex(h => h.id === hotel.id);
    if (index !== -1) {
      this.hotels[index] = hotel;
    }
    setDoc(doc(db, "hotels", hotel.id), hotel)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `hotels/${hotel.id}`));
  }

  static addHotel(hotel: HotelConfig): void {
    this.hotels.push(hotel);
    setDoc(doc(db, "hotels", hotel.id), hotel)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `hotels/${hotel.id}`));
  }

  static deleteHotel(id: string): void {
    this.hotels = this.hotels.filter(h => h.id !== id);
    deleteDoc(doc(db, "hotels", id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `hotels/${id}`));
  }

  static getHotelRooms(): HotelRoom[] {
    return this.hotelRooms;
  }

  static setHotelRooms(rooms: HotelRoom[]): void {
    this.hotelRooms = rooms;
    try {
      localStorage.setItem("adistem_hotel_rooms", JSON.stringify(rooms));
    } catch (e) {}
    setDoc(doc(db, "hotelRoomsConfig", "catalog"), { rooms })
      .catch(err => console.warn("Error saving hotel rooms to firestore:", err));
    if (this.onUpdateCallback) this.onUpdateCallback();
  }

  static getUsers(): PortalUser[] {
    return this.portalUsers;
  }

  static saveUser(user: PortalUser): void {
    const index = this.portalUsers.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.portalUsers[index] = user;
    }
    setDoc(doc(db, "users", user.id), user)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`));
  }

  static addUser(user: PortalUser): { success: boolean; error?: string } {
    const exists = this.portalUsers.some(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (exists) {
      return { success: false, error: "Ya existe un usuario registrado con ese correo electrónico." };
    }
    this.portalUsers.push(user);
    setDoc(doc(db, "users", user.id), user)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`));
    return { success: true };
  }

  static deleteUser(id: string): void {
    this.portalUsers = this.portalUsers.filter(u => u.id !== id);
    deleteDoc(doc(db, "users", id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `users/${id}`));
  }

  static resetToDefault(): void {
    this.seedConfig();
    this.seedGuests();
    this.seedTransports();
    this.seedActivities();
    this.seedComms();
    this.seedAudits();
    this.seedHotels();
    this.seedUsers();
    this.recalculateCounts();
  }

  static saveGuest(
    updatedGuest: Guest,
    editorName: string,
    editorEmail: string,
    bypassDeadlines = false
  ): { success: boolean; error?: string } {
    const guests = this.getGuests();
    const index = guests.findIndex(g => g.id === updatedGuest.id);
    if (index === -1) {
      return { success: false, error: "Invitado no encontrado." };
    }

    const oldGuest = guests[index];
    const config = this.getEventConfig();
    const nowStr = new Date().toISOString();

    // 1. Validate Deadlines (if not bypassed by Staff)
    if (!bypassDeadlines) {
      // Check flight change deadline
      const flightChanged = JSON.stringify(oldGuest.flightArrival) !== JSON.stringify(updatedGuest.flightArrival) ||
                            JSON.stringify(oldGuest.flightDeparture) !== JSON.stringify(updatedGuest.flightDeparture);
      if (flightChanged && config.deadlineFlightChange) {
        const deadline = new Date(config.deadlineFlightChange);
        if (!isNaN(deadline.getTime()) && new Date() > deadline) {
          this.addAuditLog({
            userId: `Intento - ${editorName}`,
            userEmail: editorEmail,
            action: "Intento de Cambio de Vuelo Fuera de Plazo",
            details: `Invitado intentó cambiar sus vuelos después de la fecha límite (${new Date(config.deadlineFlightChange).toLocaleString()}).`,
            prevValue: oldGuest.flightArrival?.flightNumber || "Ninguno",
            newValue: updatedGuest.flightArrival?.flightNumber || "Ninguno"
          });
          return { success: false, error: "La fecha límite para realizar modificaciones en vuelos ha expirado." };
        }
      }

      // Check transport change deadline
      if (oldGuest.assignedTransportId !== updatedGuest.assignedTransportId && config.deadlineTransportChange) {
        const deadline = new Date(config.deadlineTransportChange);
        if (!isNaN(deadline.getTime()) && new Date() > deadline) {
          this.addAuditLog({
            userId: `Intento - ${editorName}`,
            userEmail: editorEmail,
            action: "Intento de Cambio de Transporte Fuera de Plazo",
            details: `Invitado intentó cambiar su transporte después de la fecha límite (${new Date(config.deadlineTransportChange).toLocaleString()}).`,
            prevValue: oldGuest.assignedTransportId || "Ninguno",
            newValue: updatedGuest.assignedTransportId || "Ninguno"
          });
          return { success: false, error: "La fecha límite para modificar la asignación de transporte ha expirado." };
        }
      }

      // Check activities change deadline
      const activitiesChanged = JSON.stringify(oldGuest.selectedActivities) !== JSON.stringify(updatedGuest.selectedActivities);
      if (activitiesChanged && config.deadlineActivityChange) {
        const deadline = new Date(config.deadlineActivityChange);
        if (!isNaN(deadline.getTime()) && new Date() > deadline) {
          this.addAuditLog({
            userId: `Intento - ${editorName}`,
            userEmail: editorEmail,
            action: "Intento de Cambio de Actividades Fuera de Plazo",
            details: `Invitado intentó modificar su inscripción a actividades después de la fecha límite (${new Date(config.deadlineActivityChange).toLocaleString()}).`,
            prevValue: oldGuest.selectedActivities.join(", ") || "Ninguna",
            newValue: updatedGuest.selectedActivities.join(", ") || "Ninguna"
          });
          return { success: false, error: "La fecha límite para inscribir o cambiar actividades ha expirado." };
        }
      }
    }

    // 2. Build detailed Audit Logs for changes
    const auditEntries: Omit<AuditLogEntry, "id" | "timestamp">[] = [];
    const currentHourMin = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

    const formatAuditValue = (val: any, fieldName?: string): string => {
      if (val === null || val === undefined || val === "") return "—";
      if (typeof val === "boolean") return val ? "Sí" : "No";
      if (typeof val === "number") return String(val);
      if (typeof val === "string") {
        if (val.includes("[object Object]")) return "Ficha de datos";
        return val;
      }
      if (Array.isArray(val)) {
        if (val.length === 0) return "Ninguno";
        if (val.every(item => typeof item === "string" || typeof item === "number")) {
          return val.join(", ");
        }
        if (val.some(item => item && (item.name || item.firstName || item.lastName || item.age !== undefined))) {
          return val.map((item, idx) => {
            const n = (item.name || `${item.firstName || ""} ${item.lastName || ""}`.trim()) || `Persona #${idx + 1}`;
            const ageStr = item.age !== undefined ? ` (${item.age === 0 ? "0-11 meses" : `${item.age} años`})` : "";
            const relStr = item.relationship || item.parentezco ? ` - ${item.relationship || item.parentezco}` : "";
            return `${n}${ageStr}${relStr}`;
          }).join("; ");
        }
        if (val.some(item => item && (item.activityId || item.activityName))) {
          return val.map(r => `${r.personName || "Participante"}: ${r.activityName || r.activityId} (${r.slotTime || "Sin horario"})`).join("; ");
        }
        if (val.some(item => item && item.concepto !== undefined)) {
          return val.map(c => `${c.concepto}: $${c.monto}`).join("; ");
        }
        try {
          return val.map(item => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", ");
        } catch {
          return `${val.length} elemento(s)`;
        }
      }
      if (typeof val === "object") {
        if (val.airline || val.flightNumber || val.arrivalDateTime || val.departureDateTime) {
          const parts = [
            val.airline,
            val.flightNumber ? `Vuelo ${val.flightNumber}` : "",
            val.arrivalDateTime || val.departureDateTime ? new Date(val.arrivalDateTime || val.departureDateTime).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : ""
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(" - ") : "Vuelo registrado";
        }
        try {
          return JSON.stringify(val);
        } catch {
          return "Ficha de datos";
        }
      }
      return String(val);
    };

    // Nombre Titular
    const oldFullName = `${oldGuest.nombreTitular || ""} ${oldGuest.apellidosTitular || ""}`.trim() || oldGuest.name || "—";
    const newFullName = `${updatedGuest.nombreTitular || ""} ${updatedGuest.apellidosTitular || ""}`.trim() || updatedGuest.name || "—";
    if (oldFullName !== newFullName) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Nombre Titular",
        field: "Nombre Titular",
        details: `Se editó el nombre del titular de "${oldFullName}" a "${newFullName}" a las ${currentHourMin} hrs.`,
        prevValue: oldFullName,
        newValue: newFullName
      });
    }

    // Correo Electrónico
    const oldEmail = oldGuest.correoTitular || oldGuest.email || "—";
    const newEmail = updatedGuest.correoTitular || updatedGuest.email || "—";
    if (oldEmail !== newEmail) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Correo Electrónico",
        field: "Correo Electrónico",
        details: `Se editó el correo del titular de "${oldEmail}" a "${newEmail}" a las ${currentHourMin} hrs.`,
        prevValue: oldEmail,
        newValue: newEmail
      });
    }

    // Celular / Teléfono
    const oldPhone = oldGuest.celularTitular || oldGuest.phone || "—";
    const newPhone = updatedGuest.celularTitular || updatedGuest.phone || "—";
    if (oldPhone !== newPhone) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Celular",
        field: "Teléfono / Celular",
        details: `Se editó el celular del titular de "${oldPhone}" a "${newPhone}" a las ${currentHourMin} hrs.`,
        prevValue: oldPhone,
        newValue: newPhone
      });
    }

    // Sexo Titular
    if (oldGuest.sexo !== updatedGuest.sexo && (oldGuest.sexo || updatedGuest.sexo)) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Sexo Titular",
        field: "Sexo Titular",
        details: `Se cambió el sexo del titular de "${oldGuest.sexo || "No especificado"}" a "${updatedGuest.sexo || "No especificado"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.sexo || "No especificado",
        newValue: updatedGuest.sexo || "No especificado"
      });
    }

    // Alergias Titular
    const oldAllergies = oldGuest.alergiasTitular || (Array.isArray(oldGuest.allergies) ? oldGuest.allergies.join(", ") : "") || "Ninguna";
    const newAllergies = updatedGuest.alergiasTitular || (Array.isArray(updatedGuest.allergies) ? updatedGuest.allergies.join(", ") : "") || "Ninguna";
    if (oldAllergies !== newAllergies) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Alergias Titular",
        field: "Alergias Titular",
        details: `Se actualizaron las alergias del titular de "${oldAllergies}" a "${newAllergies}" a las ${currentHourMin} hrs.`,
        prevValue: oldAllergies,
        newValue: newAllergies
      });
    }

    // Hotel / Sede
    if (oldGuest.hotelAlojamiento !== updatedGuest.hotelAlojamiento) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Sede de Alojamiento",
        field: "Hotel / Sede",
        details: `Se modificó la sede del invitado de "${oldGuest.hotelAlojamiento || "Sin Sede asignada"}" a "${updatedGuest.hotelAlojamiento || "Sin Sede asignada"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.hotelAlojamiento || "Sin Sede asignada",
        newValue: updatedGuest.hotelAlojamiento || "Sin Sede asignada"
      });
    }

    // No. Habitación
    if (oldGuest.numeroHabitacion !== updatedGuest.numeroHabitacion) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Habitación",
        field: "No. Habitación",
        details: `Se editó el número de habitación de "${oldGuest.numeroHabitacion || "Sin asignar"}" a "${updatedGuest.numeroHabitacion || "Sin asignar"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.numeroHabitacion || "Sin asignar",
        newValue: updatedGuest.numeroHabitacion || "Sin asignar"
      });
    }

    // Tipo de Habitación
    if (oldGuest.tipoHabitacion !== updatedGuest.tipoHabitacion) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Tipo de Habitación",
        field: "Tipo de Habitación",
        details: `Se editó el tipo de habitación de "${oldGuest.tipoHabitacion || "Sin asignar"}" a "${updatedGuest.tipoHabitacion || "Sin asignar"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.tipoHabitacion || "Sin asignar",
        newValue: updatedGuest.tipoHabitacion || "Sin asignar"
      });
    }

    // Tipo de Huésped
    if (oldGuest.tipoHuesped !== updatedGuest.tipoHuesped) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Categoría de Huésped",
        field: "Tipo de Huésped",
        details: `Se cambió la categoría de huésped de "${oldGuest.tipoHuesped || "Convencionista"}" a "${updatedGuest.tipoHuesped || "Convencionista"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.tipoHuesped || "Convencionista",
        newValue: updatedGuest.tipoHuesped || "Convencionista"
      });
    }

    // Carnet Tipo Habitación
    if (oldGuest.carnetTipoHabitacion !== updatedGuest.carnetTipoHabitacion) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Tipo Habitación Carnet",
        field: "Tipo Carnet",
        details: `Se editó el tipo de habitación del carnet de "${oldGuest.carnetTipoHabitacion || "Sencilla"}" a "${updatedGuest.carnetTipoHabitacion || "Sencilla"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.carnetTipoHabitacion || "Sencilla",
        newValue: updatedGuest.carnetTipoHabitacion || "Sencilla"
      });
    }

    // Configuración Cama
    if (oldGuest.configuracionHabitacion !== updatedGuest.configuracionHabitacion) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Configuración de Cama",
        field: "Configuración Habitación",
        details: `Se cambió la configuración de habitación de "${oldGuest.configuracionHabitacion || "King"}" a "${updatedGuest.configuracionHabitacion || "King"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.configuracionHabitacion || "King",
        newValue: updatedGuest.configuracionHabitacion || "King"
      });
    }

    // Noches Adicionales
    if (oldGuest.nochesAdicionales !== updatedGuest.nochesAdicionales) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio Noches Adicionales",
        field: "Noches Adicionales",
        details: `Se modificaron las noches adicionales de "${oldGuest.nochesAdicionales ?? 0}" a "${updatedGuest.nochesAdicionales ?? 0}" a las ${currentHourMin} hrs.`,
        prevValue: String(oldGuest.nochesAdicionales ?? 0),
        newValue: String(updatedGuest.nochesAdicionales ?? 0)
      });
    }

    // Puesto / Cargo
    if (oldGuest.puesto !== updatedGuest.puesto) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Puesto / Cargo",
        field: "Puesto / Cargo",
        details: `Se modificó el cargo de "${oldGuest.puesto || "—"}" a "${updatedGuest.puesto || "—"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.puesto || "—",
        newValue: updatedGuest.puesto || "—"
      });
    }

    // Grupo
    if (oldGuest.grupo !== updatedGuest.grupo) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Grupo",
        field: "Grupo",
        details: `Se cambió el grupo de "${oldGuest.grupo || "Sin grupo"}" a "${updatedGuest.grupo || "Sin grupo"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.grupo || "Sin grupo",
        newValue: updatedGuest.grupo || "Sin grupo"
      });
    }

    // Distribuidora / Agencia
    const oldDist = oldGuest.distribuidora || oldGuest.distributor;
    const newDist = updatedGuest.distribuidora || updatedGuest.distributor;
    if (oldDist !== newDist) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Distribuidora",
        field: "Distribuidora",
        details: `Se editó la distribuidora/agencia de "${oldDist || "—"}" a "${newDist || "—"}" a las ${currentHourMin} hrs.`,
        prevValue: oldDist || "—",
        newValue: newDist || "—"
      });
    }

    // Estatus Registro
    if (oldGuest.status !== updatedGuest.status) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Estado de Registro",
        field: "Estatus Registro",
        details: `Estatus de registro cambió de "${oldGuest.status}" a "${updatedGuest.status}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.status,
        newValue: updatedGuest.status
      });
    }

    // Comentarios Admin
    if (oldGuest.comentariosAdmin !== updatedGuest.comentariosAdmin) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Edición Comentarios Admin",
        field: "Comentarios Staff Admin",
        details: `Se actualizaron los comentarios de staff admin a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.comentariosAdmin || "Sin comentarios",
        newValue: updatedGuest.comentariosAdmin || "Sin comentarios"
      });
    }

    // Requerimientos Especiales
    const oldReq = oldGuest.specialRequirements || oldGuest.requerimientosAdicionales || "";
    const newReq = updatedGuest.specialRequirements || updatedGuest.requerimientosAdicionales || "";
    if (oldReq !== newReq) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Edición Requerimientos Especiales",
        field: "Requerimientos Especiales",
        details: `Se actualizaron los requerimientos especiales a las ${currentHourMin} hrs.`,
        prevValue: oldReq || "Ninguno",
        newValue: newReq || "Ninguno"
      });
    }

    // Acompañante Adulto
    const oldAdultComp = (oldGuest.companions || []).find(c => !c.id?.startsWith("M-") && (c as any).tipo !== "minor" && !c.relationship?.includes("Menor"));
    const newAdultComp = (updatedGuest.companions || []).find(c => !c.id?.startsWith("M-") && (c as any).tipo !== "minor" && !c.relationship?.includes("Menor"));

    const oldCompName = oldGuest.nombreAcompanante 
      ? `${oldGuest.nombreAcompanante} ${oldGuest.apellidosAcompanante || ""}`.trim() 
      : (oldAdultComp ? (oldAdultComp.name || `${oldAdultComp.firstName || ""} ${oldAdultComp.lastName || ""}`.trim()) : "");
    const newCompName = updatedGuest.nombreAcompanante 
      ? `${updatedGuest.nombreAcompanante} ${updatedGuest.apellidosAcompanante || ""}`.trim() 
      : (newAdultComp ? (newAdultComp.name || `${newAdultComp.firstName || ""} ${newAdultComp.lastName || ""}`.trim()) : "");

    if (oldCompName !== newCompName) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Acompañante",
        field: "Acompañante Adulto",
        details: `Se modificó el acompañante de "${oldCompName || "Sin acompañante"}" a "${newCompName || "Sin acompañante"}" a las ${currentHourMin} hrs.`,
        prevValue: oldCompName || "Sin acompañante",
        newValue: newCompName || "Sin acompañante"
      });
    }

    // Alergias Acompañante
    const oldCompAllergies = oldGuest.alergiasAcompanante || oldAdultComp?.allergies || "";
    const newCompAllergies = updatedGuest.alergiasAcompanante || newAdultComp?.allergies || "";
    if (oldCompAllergies !== newCompAllergies) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio Alergias Acompañante",
        field: "Alergias Acompañante",
        details: `Se actualizaron las alergias del acompañante a las ${currentHourMin} hrs.`,
        prevValue: oldCompAllergies || "Ninguna",
        newValue: newCompAllergies || "Ninguna"
      });
    }

    // Menores / Adicionales
    const oldMinorsList = oldGuest.minors || [];
    const newMinorsList = updatedGuest.minors || [];
    const oldMinorsStr = oldMinorsList.map((m, i) => `${m.name || `Menor #${i + 1}`} ${m.lastName || ""}`.trim() + ` (${m.age === 0 ? "0-11 meses" : `${m.age} años`}${m.allergies ? `, alergia: ${m.allergies}` : ""})`).join("; ");
    const newMinorsStr = newMinorsList.map((m, i) => `${m.name || `Menor #${i + 1}`} ${m.lastName || ""}`.trim() + ` (${m.age === 0 ? "0-11 meses" : `${m.age} años`}${m.allergies ? `, alergia: ${m.allergies}` : ""})`).join("; ");

    if (oldMinorsStr !== newMinorsStr || (oldGuest.numMenores ?? 0) !== (updatedGuest.numMenores ?? 0)) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Modificación de Menores / Adicionales",
        field: "Menores / Adicionales",
        details: `Se actualizó la lista de menores de "${oldMinorsStr || "Ninguno"}" a "${newMinorsStr || "Ninguno"}" a las ${currentHourMin} hrs.`,
        prevValue: oldMinorsStr || "Ninguno",
        newValue: newMinorsStr || "Ninguno"
      });
    }

    // Vuelo de Llegada 1
    const oldArrStr = [
      oldGuest.vueloLlegadaAerolinea || oldGuest.flightArrival?.airline,
      oldGuest.vueloLlegadaNoVuelo || oldGuest.flightArrival?.flightNumber ? `No. ${oldGuest.vueloLlegadaNoVuelo || oldGuest.flightArrival?.flightNumber}` : "",
      oldGuest.vueloLlegadaFecha ? `Fecha ${oldGuest.vueloLlegadaFecha}` : "",
      oldGuest.vueloLlegadaHora ? `Hora ${oldGuest.vueloLlegadaHora}` : "",
      oldGuest.vueloLlegadaPersonas ? `Pax: ${oldGuest.vueloLlegadaPersonas}` : ""
    ].filter(Boolean).join(" | ") || (oldGuest.flightArrival ? formatAuditValue(oldGuest.flightArrival) : "No registrado");

    const newArrStr = [
      updatedGuest.vueloLlegadaAerolinea || updatedGuest.flightArrival?.airline,
      updatedGuest.vueloLlegadaNoVuelo || updatedGuest.flightArrival?.flightNumber ? `No. ${updatedGuest.vueloLlegadaNoVuelo || updatedGuest.flightArrival?.flightNumber}` : "",
      updatedGuest.vueloLlegadaFecha ? `Fecha ${updatedGuest.vueloLlegadaFecha}` : "",
      updatedGuest.vueloLlegadaHora ? `Hora ${updatedGuest.vueloLlegadaHora}` : "",
      updatedGuest.vueloLlegadaPersonas ? `Pax: ${updatedGuest.vueloLlegadaPersonas}` : ""
    ].filter(Boolean).join(" | ") || (updatedGuest.flightArrival ? formatAuditValue(updatedGuest.flightArrival) : "No registrado");

    if (oldArrStr !== newArrStr) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Edición Vuelo de Llegada",
        field: "Vuelo Llegada",
        details: `Se actualizaron los datos del vuelo de llegada a las ${currentHourMin} hrs.`,
        prevValue: oldArrStr,
        newValue: newArrStr
      });
    }

    // Vuelo de Salida 1
    const oldDepStr = [
      oldGuest.vueloRegresoAerolinea || oldGuest.flightDeparture?.airline,
      oldGuest.vueloRegresoNoVuelo || oldGuest.flightDeparture?.flightNumber ? `No. ${oldGuest.vueloRegresoNoVuelo || oldGuest.flightDeparture?.flightNumber}` : "",
      oldGuest.vueloRegresoFecha ? `Fecha ${oldGuest.vueloRegresoFecha}` : "",
      oldGuest.vueloRegresoHora ? `Hora ${oldGuest.vueloRegresoHora}` : "",
      oldGuest.vueloRegresoPersonas ? `Pax: ${oldGuest.vueloRegresoPersonas}` : ""
    ].filter(Boolean).join(" | ") || (oldGuest.flightDeparture ? formatAuditValue(oldGuest.flightDeparture) : "No registrado");

    const newDepStr = [
      updatedGuest.vueloRegresoAerolinea || updatedGuest.flightDeparture?.airline,
      updatedGuest.vueloRegresoNoVuelo || updatedGuest.flightDeparture?.flightNumber ? `No. ${updatedGuest.vueloRegresoNoVuelo || updatedGuest.flightDeparture?.flightNumber}` : "",
      updatedGuest.vueloRegresoFecha ? `Fecha ${updatedGuest.vueloRegresoFecha}` : "",
      updatedGuest.vueloRegresoHora ? `Hora ${updatedGuest.vueloRegresoHora}` : "",
      updatedGuest.vueloRegresoPersonas ? `Pax: ${updatedGuest.vueloRegresoPersonas}` : ""
    ].filter(Boolean).join(" | ") || (updatedGuest.flightDeparture ? formatAuditValue(updatedGuest.flightDeparture) : "No registrado");

    if (oldDepStr !== newDepStr) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Edición Vuelo de Salida",
        field: "Vuelo Salida",
        details: `Se actualizaron los datos del vuelo de salida a las ${currentHourMin} hrs.`,
        prevValue: oldDepStr,
        newValue: newDepStr
      });
    }

    // Vuelos Separados
    if (oldGuest.vuelosSeparados !== updatedGuest.vuelosSeparados) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Modificación de Vuelos Separados",
        field: "Vuelos Separados",
        details: `Cambio en configuración de vuelos separados a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.vuelosSeparados ? "Sí" : "No",
        newValue: updatedGuest.vuelosSeparados ? "Sí" : "No"
      });
    }

    // Transporte
    if (oldGuest.assignedTransportId !== updatedGuest.assignedTransportId) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Modificación de Transporte",
        field: "Transporte",
        details: `Cambio en asignación de transporte a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.assignedTransportId || "Sin asignar",
        newValue: updatedGuest.assignedTransportId || "Sin asignar"
      });
    }

    // Actividades
    const oldActs = oldGuest.selectedActivities || [];
    const newActs = updatedGuest.selectedActivities || [];
    const addedActivities = newActs.filter(a => !oldActs.includes(a));
    const removedActivities = oldActs.filter(a => !newActs.includes(a));

    if (addedActivities.length > 0) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Inscripción en Actividad",
        field: "Actividades",
        details: `Inscrito en la(s) actividad(es): ${addedActivities.join(", ")} a las ${currentHourMin} hrs.`,
        prevValue: "—",
        newValue: addedActivities.join(", ")
      });
    }

    if (removedActivities.length > 0) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cancelación de Actividad",
        field: "Actividades",
        details: `Removido de la(s) actividad(es): ${removedActivities.join(", ")} a las ${currentHourMin} hrs.`,
        prevValue: removedActivities.join(", "),
        newValue: "—"
      });
    }

    // Citas de Actividades
    const oldReservations = oldGuest.activityReservations || [];
    const newReservations = updatedGuest.activityReservations || [];
    if (JSON.stringify(oldReservations) !== JSON.stringify(newReservations)) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Actualización de Slots / Citas",
        field: "Citas de Actividades",
        details: `Se actualizaron las citas/horarios de actividades para el participante a las ${currentHourMin} hrs.`,
        prevValue: oldReservations.map(r => `${r.personName}: ${r.slotTime || "Sin slot"}`).join(", ") || "Sin citas",
        newValue: newReservations.map(r => `${r.personName}: ${r.slotTime || "Sin slot"}`).join(", ") || "Sin citas"
      });
    }

    // Costos Adicionales
    if (JSON.stringify(oldGuest.costosAdicionales || []) !== JSON.stringify(updatedGuest.costosAdicionales || [])) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Modificación de Cargos Adicionales",
        field: "Cargos Adicionales",
        details: `Se actualizaron los cargos adicionales a las ${currentHourMin} hrs.`,
        prevValue: formatAuditValue(oldGuest.costosAdicionales || []),
        newValue: formatAuditValue(updatedGuest.costosAdicionales || [])
      });
    }

    // INE Titular
    if (oldGuest.ineTitular !== updatedGuest.ineTitular) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Modificación de INE Titular",
        field: "INE Titular",
        details: `Estatus de INE Titular cambiado a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.ineTitular ? "Entregada" : "Pendiente",
        newValue: updatedGuest.ineTitular ? "Entregada" : "Pendiente"
      });
    }

    // INE Acompañante
    if (oldGuest.ineAcompanante !== updatedGuest.ineAcompanante) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Modificación de INE Acompañante",
        field: "INE Acompañante",
        details: `Estatus de INE Acompañante cambiado a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.ineAcompanante ? "Entregada" : "Pendiente",
        newValue: updatedGuest.ineAcompanante ? "Entregada" : "Pendiente"
      });
    }

    // Cancellation Specific
    if (updatedGuest.status === GuestStatus.CANCELLED && oldGuest.status !== GuestStatus.CANCELLED) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cancelación de Asistencia",
        field: "Cancelación de Asistencia",
        details: `Invitado canceló su asistencia al evento a las ${currentHourMin} hrs. Motivo: ${updatedGuest.cancellationReason || "No especificado"}`,
        prevValue: oldGuest.status,
        newValue: GuestStatus.CANCELLED
      });
    }

    // General diff check for any other properties to ensure 100% of field modifications are tracked
    const handledKeys = new Set([
      "name", "nombreTitular", "apellidosTitular", "email", "correoTitular",
      "phone", "celularTitular", "hotelAlojamiento", "numeroHabitacion", "tipoHabitacion",
      "tipoHuesped", "carnetTipoHabitacion", "configuracionHabitacion",
      "nochesAdicionales", "grupo", "distribuidora",
      "distributor", "status", "sexo", "nombreAcompanante",
      "apellidosAcompanante", "sexoAcompanante", "alergiasAcompanante",
      "companions", "minors", "numMenores", "flightArrival", "flightDeparture",
      "vueloLlegadaFecha", "vueloLlegadaHora", "vueloLlegadaAerolinea",
      "vueloLlegadaNoVuelo", "vueloLlegadaPersonas", "vueloRegresoFecha",
      "vueloRegresoHora", "vueloRegresoAerolinea", "vueloRegresoNoVuelo",
      "vueloRegresoPersonas", "assignedTransportId", "selectedActivities",
      "activityReservations", "alergiasTitular", "allergies", "comentariosAdmin",
      "specialRequirements", "requerimientosAdicionales", "costosAdicionales",
      "ineTitular", "ineAcompanante", "puesto", "updatedAt", "auditHistory",
      "vuelosSeparados"
    ]);

    const friendlyFieldNames: Record<string, string> = {
      "vueloLlegadaFecha2": "Fecha Vuelo Llegada 2 (Acompañante)",
      "vueloLlegadaHora2": "Hora Vuelo Llegada 2 (Acompañante)",
      "vueloLlegadaAerolinea2": "Aerolínea Vuelo Llegada 2 (Acompañante)",
      "vueloLlegadaNoVuelo2": "No. Vuelo Llegada 2 (Acompañante)",
      "vueloLlegadaPax2": "Pasajeros Vuelo Llegada 2",
      "vueloRegresoFecha2": "Fecha Vuelo Regreso 2 (Acompañante)",
      "vueloRegresoHora2": "Hora Vuelo Regreso 2 (Acompañante)",
      "vueloRegresoAerolinea2": "Aerolínea Vuelo Regreso 2 (Acompañante)",
      "vueloRegresoNoVuelo2": "No. Vuelo Regreso 2 (Acompañante)",
      "vueloRegresoPax2": "Pasajeros Vuelo Regreso 2",
      "nochesAdicionalesFechas": "Fechas Noches Adicionales",
      "hasCompanion": "Tiene Acompañante",
      "allergiesCustom": "Alergias Personalizadas",
      "alergiasMenores": "Alergias Menores",
      "kitsBienvenida": "Kit de Bienvenida",
      "regaloTitularEntregado": "Regalo Titular Entregado",
      "regaloHombre": "Regalo Hombre",
      "regaloAcompananteHombreEntregado": "Regalo Acompañante Hombre",
      "regaloAcompananteMujerEntregado": "Regalo Acompañante Mujer",
      "arregloFloral": "Arreglo Floral",
      "certificadoRegalo": "Certificado de Regalo",
      "regaloDespedida": "Regalo Despedida",
      "regaloMenores": "Regalo Menores",
      "stage": "Etapa / Fase",
      "numHabitaciones": "Número de Habitaciones",
      "cancellationReason": "Motivo de Cancelación"
    };

    const allDiffKeys = new Set([...Object.keys(oldGuest || {}), ...Object.keys(updatedGuest || {})]);
    allDiffKeys.forEach(k => {
      if (handledKeys.has(k)) return;
      if (k === "id" || k === "createdAt" || k === "updatedAt" || k === "auditHistory") return;
      const oldVal = (oldGuest as any)?.[k];
      const newVal = (updatedGuest as any)?.[k];
      const sOld = JSON.stringify(oldVal ?? null);
      const sNew = JSON.stringify(newVal ?? null);
      if (sOld !== sNew) {
        const friendlyField = friendlyFieldNames[k] || k;
        const prevFmt = formatAuditValue(oldVal, k);
        const newFmt = formatAuditValue(newVal, k);
        auditEntries.push({
          userId: editorName,
          userEmail: editorEmail,
          action: `Modificación de ${friendlyField}`,
          field: friendlyField,
          details: `Se modificó el dato "${friendlyField}" de "${prevFmt}" a "${newFmt}" a las ${currentHourMin} hrs.`,
          prevValue: prevFmt,
          newValue: newFmt
        });
      }
    });

    // Append to Guest's local auditHistory
    const localHistory = updatedGuest.auditHistory || [];
    auditEntries.forEach(entry => {
      localHistory.push({
        timestamp: new Date().toISOString(),
        user: `${editorName} (${editorEmail})`,
        action: entry.action,
        details: entry.details,
        field: entry.field || entry.action,
        prevValue: entry.prevValue,
        newValue: entry.newValue
      });
    });
    updatedGuest.auditHistory = localHistory;

    // Save Guest
    updatedGuest.updatedAt = nowStr;
    this.guests[index] = updatedGuest;
    
    // Write to Firestore asynchronously
    setDoc(doc(db, "guests", updatedGuest.id), updatedGuest)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `guests/${updatedGuest.id}`));

    // Save Audit logs
    auditEntries.forEach(entry => this.addAuditLog(entry));

    // Recalculate seats/counts
    this.recalculateCounts();

    return { success: true };
  }

  static addGuest(newGuest: Guest, editorName: string, editorEmail: string): { success: boolean; error?: string } {
    const guests = this.getGuests();
    if (guests.some(g => g.email.toLowerCase() === newGuest.email.toLowerCase())) {
      return { success: false, error: "Ya existe un invitado registrado con ese correo electrónico." };
    }
    if (guests.some(g => g.id === newGuest.id)) {
      return { success: false, error: "Ya existe un invitado registrado con ese código ID." };
    }

    newGuest.createdAt = new Date().toISOString();
    newGuest.updatedAt = new Date().toISOString();
    this.guests.push(newGuest);
    
    // Write to Firestore asynchronously
    setDoc(doc(db, "guests", newGuest.id), newGuest)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `guests/${newGuest.id}`));

    this.addAuditLog({
      userId: editorName,
      userEmail: editorEmail,
      action: "Alta de Invitado",
      details: `Se dio de alta individual al invitado ${newGuest.name} (${newGuest.distributor}) con código ${newGuest.id}.`,
      newValue: JSON.stringify(newGuest).substring(0, 200)
    });

    this.recalculateCounts();
    return { success: true };
  }

  static async deleteGuest(id: string, editorName: string, editorEmail: string): Promise<boolean> {
    const guests = this.getGuests();
    const guest = guests.find(g => g.id === id);
    if (!guest) return false;

    const deletedAt = new Date().toISOString();
    const updatedGuest: Guest = {
      ...guest,
      isDeleted: true,
      deletedAt,
      deletedBy: editorName,
      // Se limpian reservaciones de actividades para liberar los lugares desincorporados de Google Sheets
      activityReservations: []
    };

    // Actualizar en memoria
    const inMemIdx = this.guests.findIndex(g => g.id === id);
    if (inMemIdx !== -1) {
      this.guests[inMemIdx] = updatedGuest;
    } else {
      this.guests.push(updatedGuest);
    }

    // Persistir borrado lógico en Firestore (no se borra físicamente el documento)
    try {
      await setDoc(doc(db, "guests", id), updatedGuest);
    } catch (err) {
      console.error(`Error saving logically deleted guest ${id} in Firestore:`, err);
      handleFirestoreError(err, OperationType.WRITE, `guests/${id}`);
    }

    const existingUser = this.portalUsers.find(u => u.guestId === id);
    if (existingUser) {
      this.deleteUser(existingUser.id);
    }

    const titularNombre = guest.nombreTitular && guest.apellidosTitular 
      ? `${guest.nombreTitular} ${guest.apellidosTitular}` 
      : guest.name;
    const grupoNombre = guest.grupo || guest.distribuidora || guest.distributor || "Sin Grupo";
    const companionCount = guest.companions?.length || 0;
    const hotelNombre = guest.hotelAlojamiento || "No asignado";

    this.addAuditLog({
      userId: editorName,
      userEmail: editorEmail,
      action: "Eliminación Lógica de Registro / Padrón",
      details: `Se marcó como borrado lógicamente el registro [${guest.id}]. Titular: "${titularNombre}", Grupo Empresarial: "${grupoNombre}", Distribuidora: "${guest.distribuidora || guest.distributor || 'N/A'}", Correo: ${guest.correoTitular || guest.email || 'N/A'}, Teléfono: ${guest.celularTitular || guest.phone || 'N/A'}, Hotel: ${hotelNombre}, Acompañantes: ${companionCount}. Se liberaron sus actividades de Google Sheets y el registro se trasladó al catálogo de "Registros Borrados" (no computa en totales ni carnets del panel).`,
      prevValue: JSON.stringify({
        id: guest.id,
        nombre: titularNombre,
        grupo: grupoNombre,
        distribuidora: guest.distribuidora || guest.distributor,
        email: guest.correoTitular || guest.email,
        telefono: guest.celularTitular || guest.phone,
        hotel: hotelNombre,
        tipoHabitacion: guest.carnetTipoHabitacion || guest.configuracionHabitacion || "Estándar",
        estatus: guest.status
      }),
      newValue: `Borrado lógicamente por ${editorName} el ${new Date().toLocaleDateString("es-MX")}`
    });

    this.recalculateCounts();
    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }
    return true;
  }

  static async restoreGuest(id: string, editorName: string, editorEmail: string): Promise<boolean> {
    const guests = this.getGuests();
    const guest = guests.find(g => g.id === id);
    if (!guest) return false;

    const restoredGuest: Guest = {
      ...guest,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      updatedAt: new Date().toISOString()
    };

    const inMemIdx = this.guests.findIndex(g => g.id === id);
    if (inMemIdx !== -1) {
      this.guests[inMemIdx] = restoredGuest;
    } else {
      this.guests.push(restoredGuest);
    }

    try {
      await setDoc(doc(db, "guests", id), restoredGuest);
    } catch (err) {
      console.error(`Error restoring guest ${id} in Firestore:`, err);
      handleFirestoreError(err, OperationType.WRITE, `guests/${id}`);
    }

    const titularNombre = guest.nombreTitular && guest.apellidosTitular 
      ? `${guest.nombreTitular} ${guest.apellidosTitular}` 
      : guest.name;

    this.addAuditLog({
      userId: editorName,
      userEmail: editorEmail,
      action: "Restauración de Registro / Padrón",
      details: `Se restauró el registro [${guest.id}] de "${titularNombre}". El registro vuelve a estar activo en el padrón y computará en la logística y reportes.`,
      newValue: "Registro reactivado en el padrón oficial"
    });

    this.recalculateCounts();
    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }
    return true;
  }

  static sendCommMessage(msg: Omit<CommMessage, "id" | "sentAt">, senderName: string, senderEmail: string): void {
    const newMsg: CommMessage = {
      ...msg,
      id: "msg-" + Math.random().toString(36).substring(2, 9),
      sentAt: new Date().toISOString()
    };
    this.comms.push(newMsg);
    
    // Write to Firestore asynchronously
    fSetDoc(doc(db, "comms", newMsg.id), sanitizeForFirestore(newMsg))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `comms/${newMsg.id}`));

    // Audit logs
    this.addAuditLog({
      userId: `Staff - ${senderName}`,
      userEmail: senderEmail,
      action: `Envío masivo (${newMsg.type === "email" ? "Correo" : "Notificación Push"})`,
      details: `Se emitió comunicado: "${newMsg.subject}" dirigido a segmento de invitados (${newMsg.recipientCount} destinatarios).`,
      newValue: newMsg.body.substring(0, 100)
    });
  }

  static deleteCommMessage(msgId: string, editorName?: string, editorEmail?: string): void {
    this.comms = this.comms.filter(c => c.id !== msgId);
    deleteDoc(doc(db, "comms", msgId))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `comms/${msgId}`));

    if (editorName) {
      this.addAuditLog({
        userId: `Staff - ${editorName}`,
        userEmail: editorEmail || "staff@adistem.com.mx",
        action: "Eliminar Comunicado",
        details: `Se eliminó el comunicado con ID ${msgId}.`
      });
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }
  }

  // ==========================================
  // EVENT PHOTOS MANAGEMENT
  // ==========================================
  static getPhotos(): EventPhoto[] {
    return [...this.photos];
  }

  static async uploadPhoto(params: {
    fullBase64: string;
    thumbBase64: string;
    guestId: string;
    guestName: string;
    carnetNumero?: string;
    distributor?: string;
    caption?: string;
    date?: string;
  }): Promise<EventPhoto> {
    const res = await fetch("/api/photos/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!data.success || !data.photo) {
      throw new Error(data.error || "No se pudo subir la foto.");
    }
    const newPhoto: EventPhoto = data.photo;

    // Save metadata to Firestore asynchronously
    setDoc(doc(db, "photos", newPhoto.id), sanitizeForFirestore(newPhoto))
      .catch(err => console.warn("Error guardando foto en Firestore:", err));

    if (!this.photos.some(p => p.id === newPhoto.id)) {
      this.photos.unshift(newPhoto);
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }

    return newPhoto;
  }

  static async deletePhoto(photoId: string, editorName?: string, editorEmail?: string): Promise<boolean> {
    this.photos = this.photos.filter(p => p.id !== photoId);

    // Delete from Firestore
    deleteDoc(doc(db, "photos", photoId))
      .catch(err => console.warn("Error eliminando foto en Firestore:", err));

    // Delete from server storage
    fetch(`/api/photos/${photoId}`, { method: "DELETE" }).catch(() => {});

    if (editorName) {
      this.addAuditLog({
        userId: `Staff - ${editorName}`,
        userEmail: editorEmail || "staff@adistem.com.mx",
        action: "Eliminar Foto del Evento",
        details: `Se eliminó la foto con ID ${photoId}.`
      });
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }
    return true;
  }

  static async deletePhotosBatch(photoIds: string[], editorName?: string, editorEmail?: string): Promise<boolean> {
    if (!photoIds || photoIds.length === 0) return true;
    const idSet = new Set(photoIds);
    this.photos = this.photos.filter(p => !idSet.has(p.id));

    // Delete all from Firestore
    photoIds.forEach(id => {
      deleteDoc(doc(db, "photos", id)).catch(() => {});
    });

    // Delete batch from server storage
    fetch("/api/photos/delete-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: photoIds })
    }).catch(() => {});

    if (editorName) {
      this.addAuditLog({
        userId: `Staff - ${editorName}`,
        userEmail: editorEmail || "staff@adistem.com.mx",
        action: "Eliminación Masiva de Fotos",
        details: `Se eliminaron ${photoIds.length} fotos del evento.`
      });
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }
    return true;
  }

  static addAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): void {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: "log-" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    this.auditLogs.push(newEntry);
    
    // Write to Firestore asynchronously
    setDoc(doc(db, "audits", newEntry.id), newEntry)
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `audits/${newEntry.id}`));
  }

  static recalculateCounts(): void {
    const guests = this.getGuests().filter(g => !g.isDeleted);
    
    // Recalculate transport counts
    const transports = this.transportSlots;
    transports.forEach(t => {
      t.assignedCount = guests.filter(g => g.status !== GuestStatus.CANCELLED && g.assignedTransportId === t.id).length;
      // Write to Firestore asynchronously
      setDoc(doc(db, "transports", t.id), t)
        .catch(err => console.error("Error saving transport recalculation:", err));
    });

    // Recalculate activity counts and waiting list positions
    const activities = this.activities;
    activities.forEach(act => {
      let totalRegisteredForAct = 0;

      guests.filter(g => g.status !== GuestStatus.CANCELLED).forEach(g => {
        // 1. Check if guest has specific activityReservations for this activity
        const guestActReservations = (g.activityReservations || []).filter(r => r.activityId === act.id);
        
        if (guestActReservations.length > 0) {
          totalRegisteredForAct += guestActReservations.length;
        } else {
          // Fallback: check selectedActivities on titular
          if (g.selectedActivities && g.selectedActivities.includes(act.id)) {
            totalRegisteredForAct += 1;
          }
          // And check selectedActivities on companions
          if (g.companions && g.companions.length > 0) {
            g.companions.forEach(c => {
              if (c.selectedActivities && c.selectedActivities.includes(act.id)) {
                totalRegisteredForAct += 1;
              }
            });
          }
        }
      });

      act.registeredCount = totalRegisteredForAct;

      act.waitingList = (act.waitingList || []).filter(gid => {
        const g = guests.find(guest => guest.id === gid);
        return g && g.status !== GuestStatus.CANCELLED;
      });

      // Write to Firestore asynchronously
      setDoc(doc(db, "activities", act.id), act)
        .catch(err => console.error("Error saving activity recalculation:", err));
    });

    // Trigger local callback to update UI immediately with mutated in-memory values
    if (this.onUpdateCallback) {
      this.onUpdateCallback();
    }
  }

  static async syncActivityWithGoogleSheets(
    activityId: string,
    editorName: string = "Sistema BackOffice",
    editorEmail: string = "admin@convencion.com"
  ): Promise<{
    success: boolean;
    message: string;
    updatedGuests: number;
    freedSlots: number;
    assignedSlots: number;
  }> {
    const act = this.activities.find(a => a.id === activityId);
    if (!act) {
      return { success: false, message: "Actividad no encontrada.", updatedGuests: 0, freedSlots: 0, assignedSlots: 0 };
    }

    if (!act.googleSheetsUrl) {
      this.recalculateCounts();
      if (this.onUpdateCallback) this.onUpdateCallback();
      return {
        success: true,
        message: "Conteos recalculados correctamente en Firestore (sin Google Sheets vinculado).",
        updatedGuests: 0,
        freedSlots: 0,
        assignedSlots: 0
      };
    }

    try {
      // Determine activity type
      const actType = (act.activityType || act.category || "").toUpperCase();
      const isPickleOrBingo = actType === "PICKLEBALL" || actType === "BINGO" || actType === "MOVIE_NIGHTS" || actType === "MOVIE NIGHTS" || (act.name || "").toUpperCase().includes("PICKLEBALL") || (act.name || "").toUpperCase().includes("BINGO") || (act.name || "").toUpperCase().includes("MOVIE");
      const isGolf = actType === "GOLF" || (act.name || "").toUpperCase().includes("GOLF");

      // Collect all configured day tabs to query from Google Sheets
      const targetTabs: string[] = [];
      if (act.daysConfig && act.daysConfig.length > 0) {
        act.daysConfig.forEach(d => {
          const t = (d.googleSheetsTab || d.label || "").trim();
          if (t && !targetTabs.includes(t)) targetTabs.push(t);
        });
      }
      if (act.googleSheetsTab && !targetTabs.includes(act.googleSheetsTab.trim())) {
        targetTabs.unshift(act.googleSheetsTab.trim());
      }
      if (targetTabs.length === 0) {
        targetTabs.push("Hoja 1");
      }

      const liveSlotsByTab: Record<string, SpaReservationSlot[]> = {};
      const allLiveSlots: (SpaReservationSlot & { sheetTab: string })[] = [];

      for (const tab of targetTabs) {
        try {
          let sheetsResult;
          if (isPickleOrBingo || isGolf) {
            sheetsResult = await fetchPickleballSlotsFromSheet(
              act.googleSheetsUrl,
              tab,
              act.googleSheetsWebhookUrl,
              isGolf ? "GOLF" : (actType || "PICKLEBALL")
            );
          } else {
            sheetsResult = await fetchSpaSlotsFromSheet(
              act.googleSheetsUrl,
              tab,
              act.googleSheetsWebhookUrl
            );
          }

          if (sheetsResult && sheetsResult.success && Array.isArray(sheetsResult.slots)) {
            liveSlotsByTab[tab] = sheetsResult.slots;
            sheetsResult.slots.forEach(s => {
              allLiveSlots.push({ ...s, sheetTab: tab });
            });
          }
        } catch (tabErr) {
          console.warn(`Error al consultar pestaña '${tab}':`, tabErr);
        }
      }

      if (allLiveSlots.length === 0) {
        return {
          success: false,
          message: `No se pudo consultar Google Sheets en vivo en las pestañas (${targetTabs.join(", ")}). Verifica la URL y los permisos.`,
          updatedGuests: 0,
          freedSlots: 0,
          assignedSlots: 0
        };
      }

      let freedSlots = 0;
      let assignedSlots = 0;
      let updatedGuestsCount = 0;

      // Create a cloned map of all guests so modifications across multiple slots are preserved
      const guestMap = new Map<string, Guest>();
      this.guests.forEach(g => {
        guestMap.set(g.id, JSON.parse(JSON.stringify(g)));
      });
      const modifiedGuestIds = new Set<string>();

      const normalize = (str?: string) => {
        if (!str) return "";
        return str
          .toString()
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      };

      const normalizeEmail = (str?: string) => {
        if (!str) return "";
        const s = str.toString().trim().toLowerCase();
        return s.includes("@") ? s : "";
      };

      // 1. Process all occupied slots in Google Sheets -> Link/Create reservations in Firestore
      const occupiedLiveSlots = allLiveSlots.filter(s => s.isOccupied && !s.isBlocked);

      for (const slot of occupiedLiveSlots) {
        const slotEmail = normalizeEmail(slot.titularEmail);
        const slotFullName = normalize(`${slot.participantName || ""} ${slot.participantPaternal || ""} ${slot.participantMaternal || ""}`);
        const slotNameOnly = normalize(`${slot.participantName || ""} ${slot.participantPaternal || ""}`);
        const slotFirstName = normalize(slot.participantName);
        const slotPaternal = normalize(slot.participantPaternal);

        // Find matching guest in Firestore
        let matchedGuest: Guest | undefined;

        // 1. Try matching by email
        if (slotEmail) {
          for (const g of guestMap.values()) {
            if (g.status === GuestStatus.CANCELLED) continue;
            if (normalizeEmail(g.email) === slotEmail) {
              matchedGuest = g;
              break;
            }
          }
        }

        // 2. Try matching by full name / parts if email didn't match
        if (!matchedGuest && (slotFullName || slotNameOnly)) {
          const targetName = slotNameOnly || slotFullName;
          for (const g of guestMap.values()) {
            if (g.status === GuestStatus.CANCELLED) continue;
            const anyG = g as any;
            const gName = normalize(g.name || `${anyG.firstName || ""} ${anyG.lastName || ""}`);
            const gNombreParts = normalize(`${anyG.nombre || anyG.firstName || ""} ${anyG.paterno || anyG.lastName || ""} ${anyG.materno || ""}`);

            if (gName === targetName || (targetName.length >= 5 && (gName.includes(targetName) || targetName.includes(gName)))) {
              matchedGuest = g;
              break;
            }
            if (gNombreParts && (gNombreParts === targetName || (targetName.length >= 5 && (gNombreParts.includes(targetName) || targetName.includes(gNombreParts))))) {
              matchedGuest = g;
              break;
            }
            if (slotFirstName && slotPaternal && gName.includes(slotFirstName) && gName.includes(slotPaternal)) {
              matchedGuest = g;
              break;
            }
            // Check companions
            if (g.companions && g.companions.length > 0) {
              const matchedComp = g.companions.find(c => {
                const cName = normalize(c.name || `${c.firstName || ""} ${c.lastName || ""}`);
                return cName === targetName || (targetName.length >= 5 && (cName.includes(targetName) || targetName.includes(cName)));
              });
              if (matchedComp) {
                matchedGuest = g;
                break;
              }
            }
          }
        }

        if (matchedGuest) {
          let hasGuestChanged = false;
          matchedGuest.activityReservations = matchedGuest.activityReservations || [];

          // Determine if slot is for titular or companion
          let personId = "titular";
          let personType: "titular" | "companion" = "titular";
          let personName = matchedGuest.name;

          const slotRoleHint = (slot.participantMaternal || "").toUpperCase();
          const isExplicitCompanion = slotRoleHint.includes("ACOMPAÑANTE") || slotRoleHint.includes("COMPANION") || slotRoleHint.includes("ACOMPANANTE");
          const isExplicitTitular = slotRoleHint.includes("TITULAR");

          if (matchedGuest.companions && matchedGuest.companions.length > 0) {
            const targetName = slotNameOnly || slotFullName;
            const compMatch = matchedGuest.companions.find(c => {
              const cName = normalize(c.name || `${c.firstName || ""} ${c.lastName || ""}`);
              return targetName && (cName === targetName || (targetName.length >= 4 && (cName.includes(targetName) || targetName.includes(cName))));
            });

            if (compMatch) {
              personId = compMatch.id;
              personType = "companion";
              personName = compMatch.name || `${compMatch.firstName || ""} ${compMatch.lastName || ""}`.trim();
            } else if (isExplicitCompanion) {
              const firstComp = matchedGuest.companions[0];
              personId = firstComp.id;
              personType = "companion";
              personName = firstComp.name || `${firstComp.firstName || ""} ${firstComp.lastName || ""}`.trim();
            } else if (!isExplicitTitular) {
              // If titular already has an active reservation on this tab/day and companion doesn't, assign to companion
              const titularRes = matchedGuest.activityReservations.find(r => 
                r.activityId === act.id && 
                (r.personId === "titular" || r.personType === "titular") &&
                (r.sheetTab === slot.sheetTab || r.rowIndex === slot.rowIndex)
              );
              if (titularRes && titularRes.rowIndex !== slot.rowIndex) {
                const firstComp = matchedGuest.companions[0];
                personId = firstComp.id;
                personType = "companion";
                personName = firstComp.name || `${firstComp.firstName || ""} ${firstComp.lastName || ""}`.trim();
              }
            }
          }

          // Match configured day metadata
          const matchedDay = act.daysConfig?.find(d => 
            (d.googleSheetsTab || "").trim().toLowerCase() === slot.sheetTab.toLowerCase() ||
            (d.label || "").trim().toLowerCase() === slot.sheetTab.toLowerCase() ||
            (d.id || "").toLowerCase() === slot.sheetTab.toLowerCase()
          ) || (act.daysConfig && act.daysConfig.length > 0 ? act.daysConfig[0] : undefined);

          const dayId = matchedDay?.id || "day-1";
          const dayLabel = matchedDay?.label || slot.sheetTab || act.eventDay || "Día 1";
          const dayDate = matchedDay?.date || act.dateTime || "2026-05-15";

          // Check if guest already has this reservation
          const existingResIndex = matchedGuest.activityReservations.findIndex(r => 
            r.activityId === act.id && (
              (r.rowIndex && r.rowIndex === slot.rowIndex && (r.sheetTab || targetTabs[0]) === slot.sheetTab) ||
              (r.citaNo && r.citaNo === slot.citaNo && (r.sheetTab || targetTabs[0]) === slot.sheetTab) ||
              (r.personId === personId && (r.sheetTab === slot.sheetTab || r.dayId === dayId))
            )
          );

          if (existingResIndex >= 0) {
            const existingRes = matchedGuest.activityReservations[existingResIndex];
            if (
              existingRes.slotTime !== slot.timeSlot || 
              existingRes.therapistGender !== slot.therapistGender || 
              existingRes.rowIndex !== slot.rowIndex || 
              existingRes.citaNo !== slot.citaNo ||
              existingRes.sheetTab !== slot.sheetTab ||
              existingRes.dayId !== dayId ||
              existingRes.dayLabel !== dayLabel ||
              existingRes.personId !== personId ||
              existingRes.personType !== personType
            ) {
              existingRes.slotTime = slot.timeSlot;
              existingRes.therapistGender = slot.therapistGender;
              existingRes.rowIndex = slot.rowIndex;
              existingRes.citaNo = slot.citaNo;
              existingRes.sheetTab = slot.sheetTab;
              existingRes.dayId = dayId;
              existingRes.dayLabel = dayLabel;
              existingRes.dayDate = dayDate;
              existingRes.personId = personId;
              existingRes.personType = personType;
              existingRes.personName = slot.participantName ? `${slot.participantName} ${slot.participantPaternal || ""}`.trim() : personName;
              existingRes.paternalName = slot.participantPaternal;
              existingRes.maternalName = slot.participantMaternal;
              existingRes.titularEmail = slot.titularEmail || matchedGuest.email;
              hasGuestChanged = true;
            }
          } else {
            // Add new reservation from Google Sheets
            const newReservation: ActivityReservationDetail = {
              activityId: act.id,
              activityName: act.name,
              personId: personId,
              personType: personType,
              personName: slot.participantName ? `${slot.participantName} ${slot.participantPaternal || ""}`.trim() : personName,
              paternalName: slot.participantPaternal,
              maternalName: slot.participantMaternal,
              titularEmail: slot.titularEmail || matchedGuest.email,
              slotTime: slot.timeSlot,
              therapistGender: slot.therapistGender,
              citaNo: slot.citaNo,
              rowIndex: slot.rowIndex,
              sheetTab: slot.sheetTab,
              dayId,
              dayDate,
              dayLabel
            };
            matchedGuest.activityReservations.push(newReservation);
            hasGuestChanged = true;
            assignedSlots++;
          }

          // Ensure activity is in selectedActivities
          if (personType === "titular") {
            matchedGuest.selectedActivities = matchedGuest.selectedActivities || [];
            if (!matchedGuest.selectedActivities.includes(act.id)) {
              matchedGuest.selectedActivities.push(act.id);
              hasGuestChanged = true;
            }
          } else {
            const comp = matchedGuest.companions?.find(c => c.id === personId);
            if (comp) {
              comp.selectedActivities = comp.selectedActivities || [];
              if (!comp.selectedActivities.includes(act.id)) {
                comp.selectedActivities.push(act.id);
                hasGuestChanged = true;
              }
            }
          }

          if (hasGuestChanged) {
            modifiedGuestIds.add(matchedGuest.id);
          }
        }
      }

      // 2. Free up any reservations in Firestore that were deleted/erased in Google Sheets
      for (const guest of guestMap.values()) {
        if (guest.status === GuestStatus.CANCELLED) continue;

        let hasGuestChanged = false;
        const currentReservations = guest.activityReservations || [];
        const reservationsForThisAct = currentReservations.filter(r => r.activityId === act.id);

        if (reservationsForThisAct.length > 0) {
          const validReservations: ActivityReservationDetail[] = [];

          for (const res of reservationsForThisAct) {
            const resTab = (res.sheetTab || act.googleSheetsTab || targetTabs[0] || "Hoja 1").trim();
            const tabSlots = liveSlotsByTab[resTab] || allLiveSlots.filter(s => s.sheetTab === resTab);

            // Find corresponding slot in live Google Sheets by rowIndex, citaNo, or name/email
            let matchingSlot = res.rowIndex 
              ? tabSlots.find(s => s.rowIndex === res.rowIndex)
              : null;

            if (!matchingSlot && res.citaNo) {
              matchingSlot = tabSlots.find(s => s.citaNo === res.citaNo);
            }

            if (!matchingSlot) {
              matchingSlot = tabSlots.find(s => {
                const normPName = normalize(res.personName);
                const normSlotName = normalize(`${s.participantName || ""} ${s.participantPaternal || ""}`);
                const normEmail = normalizeEmail(res.titularEmail || guest.email);
                const normSlotEmail = normalizeEmail(s.titularEmail);
                return (normEmail && normSlotEmail && normEmail === normSlotEmail) || 
                       (normPName && normSlotName && (normSlotName === normPName || (normPName.length >= 5 && (normSlotName.includes(normPName) || normPName.includes(normSlotName)))));
              });
            }

            // Check if slot in Google Sheet is still occupied AND assigned to this guest
            let isStillOccupiedByThisPerson = false;
            if (matchingSlot && matchingSlot.isOccupied && !matchingSlot.isBlocked) {
              const slotEmail = normalizeEmail(matchingSlot.titularEmail);
              const slotName = normalize(`${matchingSlot.participantName || ""} ${matchingSlot.participantPaternal || ""}`);
              const resEmail = normalizeEmail(res.titularEmail || guest.email);
              const resName = normalize(res.personName);

              if (slotEmail && resEmail && slotEmail === resEmail) {
                isStillOccupiedByThisPerson = true;
              } else if (slotName && resName && (slotName === resName || (resName.length >= 4 && (slotName.includes(resName) || resName.includes(slotName))))) {
                isStillOccupiedByThisPerson = true;
              } else {
                isStillOccupiedByThisPerson = false;
              }
            }

            if (isStillOccupiedByThisPerson && matchingSlot) {
              if (matchingSlot.timeSlot && matchingSlot.timeSlot !== res.slotTime) {
                res.slotTime = matchingSlot.timeSlot;
                hasGuestChanged = true;
              }
              if (matchingSlot.therapistGender && matchingSlot.therapistGender !== res.therapistGender) {
                res.therapistGender = matchingSlot.therapistGender;
                hasGuestChanged = true;
              }
              if (matchingSlot.rowIndex && matchingSlot.rowIndex !== res.rowIndex) {
                res.rowIndex = matchingSlot.rowIndex;
                hasGuestChanged = true;
              }
              validReservations.push(res);
            } else {
              // Slot was erased/freed/blocked manually in Google Sheets!
              freedSlots++;
              hasGuestChanged = true;
              console.log(`[Google Sheets Sync] Slot en fila ${res.rowIndex || res.citaNo} (${resTab}) liberado para ${res.personName} tras borrado manual en Sheets.`);
            }
          }

          if (validReservations.length !== reservationsForThisAct.length) {
            hasGuestChanged = true;
          }

          if (hasGuestChanged) {
            const otherReservations = currentReservations.filter(r => r.activityId !== act.id);
            guest.activityReservations = [...otherReservations, ...validReservations];

            // If no valid reservations remain for this activity, clean up selectedActivities
            const hasTitularRes = validReservations.some(r => r.personId === "titular" || r.personType === "titular");
            if (!hasTitularRes && guest.selectedActivities?.includes(act.id)) {
              guest.selectedActivities = guest.selectedActivities.filter(id => id !== act.id);
            }

            if (guest.companions && guest.companions.length > 0) {
              guest.companions.forEach(comp => {
                const hasCompRes = validReservations.some(r => r.personId === comp.id);
                if (!hasCompRes && comp.selectedActivities?.includes(act.id)) {
                  comp.selectedActivities = comp.selectedActivities.filter(id => id !== act.id);
                }
              });
            }

            modifiedGuestIds.add(guest.id);
          }
        }
      }

      // 3. Commit all modified guests to Firestore & in-memory store
      for (const guestId of modifiedGuestIds) {
        const g = guestMap.get(guestId);
        if (!g) continue;

        g.updatedAt = new Date().toISOString();
        g.auditHistory = g.auditHistory || [];
        g.auditHistory.push({
          timestamp: new Date().toISOString(),
          user: `${editorName} (${editorEmail})`,
          action: "Sincronización con Google Sheets",
          details: `Sincronizada actividad ${act.name} con Google Sheets (${targetTabs.join(", ")})`
        });

        await setDoc(doc(db, "guests", g.id), g);
        const inMemIdx = this.guests.findIndex(item => item.id === g.id);
        if (inMemIdx >= 0) {
          this.guests[inMemIdx] = JSON.parse(JSON.stringify(g));
        } else {
          this.guests.push(JSON.parse(JSON.stringify(g)));
        }
        updatedGuestsCount++;
      }

      // Recalculate activity and transport counts in Firestore & notify UI
      this.recalculateCounts();
      if (this.onUpdateCallback) {
        this.onUpdateCallback();
      }

      const messages: string[] = [];
      if (assignedSlots > 0) messages.push(`se asignaron/vincularon ${assignedSlots} cupo(s) desde Sheets`);
      if (freedSlots > 0) messages.push(`se liberaron ${freedSlots} cupo(s) eliminados en Sheets`);
      if (messages.length === 0) messages.push(`todos los registros coinciden al 100% con Google Sheets`);

      return {
        success: true,
        message: `Sincronización completada con Google Sheets (${targetTabs.join(", ")}): ${messages.join(" y ")}.`,
        updatedGuests: updatedGuestsCount,
        freedSlots,
        assignedSlots
      };
    } catch (err: any) {
      console.error("Error in syncActivityWithGoogleSheets:", err);
      return {
        success: false,
        message: `Error al sincronizar con Google Sheets: ${err?.message || err}`,
        updatedGuests: 0,
        freedSlots: 0,
        assignedSlots: 0
      };
    }
  }
}

export const CUTOFF_CHANGE_DATE = new Date("2026-10-08T00:00:00.000");

export function getPostCutoffChanges(guest: Guest, customCutoff?: Date | string | null): GuestChangeLog[] {
  if (!guest) return [];
  const changes: GuestChangeLog[] = [];
  
  let targetCutoff = CUTOFF_CHANGE_DATE;
  if (customCutoff) {
    const parsed = customCutoff instanceof Date ? customCutoff : new Date(customCutoff);
    if (!isNaN(parsed.getTime())) {
      targetCutoff = parsed;
    }
  }

  const fieldMap: Record<string, string> = {
    "name": "Nombre Titular",
    "nombreTitular": "Nombre(s) Titular",
    "apellidosTitular": "Apellidos Titular",
    "email": "Correo Electrónico",
    "correoTitular": "Correo Titular",
    "phone": "Teléfono / Celular",
    "celularTitular": "Celular Titular",
    "hotelAlojamiento": "Hotel / Sede",
    "numeroHabitacion": "No. Habitación",
    "tipoHabitacion": "Tipo de Habitación",
    "tipoHuesped": "Tipo de Huésped",
    "carnetTipoHabitacion": "Tipo Carnet",
    "configuracionHabitacion": "Configuración Habitación",
    "nochesAdicionales": "Noches Adicionales",
    "nochesAdicionalesFechas": "Fechas Noches Adicionales",
    "puesto": "Puesto / Cargo",
    "grupo": "Grupo",
    "distribuidora": "Distribuidora / Agencia",
    "distributor": "Distribuidora",
    "status": "Estatus Registro",
    "comentariosAdmin": "Comentarios Staff Admin",
    "alergiasTitular": "Alergias Titular",
    "allergies": "Alergias Titular",
    "alergiasAcompanante": "Alergias Acompañante",
    "sexo": "Sexo Titular",
    "sexoAcompanante": "Sexo Acompañante",
    "nombreAcompanante": "Nombre Acompañante",
    "apellidosAcompanante": "Apellidos Acompañante",
    "companions": "Acompañantes / Menores",
    "minors": "Menores / Adicionales",
    "numMenores": "Número de Menores",
    "alergiasMenores": "Alergias Menores",
    "vueloLlegadaFecha": "Fecha Vuelo Llegada",
    "vueloLlegadaHora": "Hora Vuelo Llegada",
    "vueloLlegadaAerolinea": "Aerolínea Vuelo Llegada",
    "vueloLlegadaNoVuelo": "No. Vuelo Llegada",
    "vueloLlegadaPersonas": "Pasajeros Vuelo Llegada",
    "vueloRegresoFecha": "Fecha Vuelo Salida",
    "vueloRegresoHora": "Hora Vuelo Salida",
    "vueloRegresoAerolinea": "Aerolínea Vuelo Salida",
    "vueloRegresoNoVuelo": "No. Vuelo Salida",
    "vueloRegresoPersonas": "Pasajeros Vuelo Salida",
    "vueloLlegadaFecha2": "Fecha Vuelo Llegada 2 (Acompañante)",
    "vueloLlegadaHora2": "Hora Vuelo Llegada 2 (Acompañante)",
    "vueloLlegadaAerolinea2": "Aerolínea Vuelo Llegada 2 (Acompañante)",
    "vueloLlegadaNoVuelo2": "No. Vuelo Llegada 2 (Acompañante)",
    "vueloLlegadaPax2": "Pasajeros Vuelo Llegada 2",
    "vueloRegresoFecha2": "Fecha Vuelo Regreso 2 (Acompañante)",
    "vueloRegresoHora2": "Hora Vuelo Regreso 2 (Acompañante)",
    "vueloRegresoAerolinea2": "Aerolínea Vuelo Regreso 2 (Acompañante)",
    "vueloRegresoNoVuelo2": "No. Vuelo Regreso 2 (Acompañante)",
    "vueloRegresoPax2": "Pasajeros Vuelo Regreso 2",
    "vuelosSeparados": "Vuelos Separados",
    "specialRequirements": "Requerimientos Especiales",
    "requerimientosAdicionales": "Requerimientos Especiales",
    "costosAdicionales": "Cargos Adicionales",
    "assignedTransportId": "Transporte Asignado",
    "selectedActivities": "Actividades",
    "activityReservations": "Citas de Actividades",
    "ineTitular": "INE Titular",
    "ineAcompanante": "INE Acompañante",
    "hasCompanion": "Tiene Acompañante",
    "kitsBienvenida": "Kit de Bienvenida",
    "regaloTitularEntregado": "Regalo Titular Entregado",
    "regaloHombre": "Regalo Hombre",
    "regaloAcompananteHombreEntregado": "Regalo Acompañante Hombre",
    "regaloAcompananteMujerEntregado": "Regalo Acompañante Mujer",
    "arregloFloral": "Arreglo Floral",
    "certificadoRegalo": "Certificado de Regalo",
    "regaloDespedida": "Regalo Despedida",
    "regaloMenores": "Regalo Menores",
    "stage": "Etapa / Fase",
    "numHabitaciones": "Número de Habitaciones"
  };

  if (guest.auditHistory && Array.isArray(guest.auditHistory)) {
    guest.auditHistory.forEach(entry => {
      if (entry.timestamp) {
        const d = new Date(entry.timestamp);
        if (!isNaN(d.getTime()) && d >= targetCutoff) {
          // Determine clean field name
          let rawField = entry.field || entry.action || "Dato modificado";
          let cleanField = fieldMap[rawField] || rawField;
          
          if (cleanField.startsWith("Modificación de ") || cleanField.startsWith("Cambio de ") || cleanField.startsWith("Edición de ")) {
            cleanField = cleanField.replace(/^(?:Modificación|Cambio|Edición)\s+(?:de\s+|en\s+)?/i, "").trim();
          }

          let prev = entry.prevValue;
          let next = entry.newValue;

          // Attempt to extract real values from details if prev/next are missing, generic or contains [object]
          const isGenericPrev = !prev || prev === "—" || prev === "Dato previo" || prev === "Datos previos registrados" || (typeof prev === "string" && prev.includes("[object"));
          const isGenericNext = !next || next === "—" || next === "Actualizado" || next === "Ficha actualizada" || (typeof next === "string" && next.includes("[object"));

          if (entry.details && (isGenericPrev || isGenericNext)) {
            // Regex for 'de "..." a "..."' or 'de ... a ...'
            const deAMatch = entry.details.match(/(?:de|desde)\s+["“']?([^"”']+)["”']?\s+a\s+["“']?([^"”']+)["”']?/i);
            if (deAMatch) {
              if (isGenericPrev) prev = deAMatch[1].trim();
              if (isGenericNext) next = deAMatch[2].trim();
            } else {
              // Regex for 'Inscrito en: ...' or 'Cancelado: ...'
              const actInscrito = entry.details.match(/Inscrito en la\(s\) actividad\(es\):\s*([^.]+)/i);
              if (actInscrito) {
                if (isGenericPrev) prev = "Ninguna";
                if (isGenericNext) next = actInscrito[1].trim();
              }
              const actRemovido = entry.details.match(/Removido de la\(s\) actividad\(es\):\s*([^.]+)/i);
              if (actRemovido) {
                if (isGenericPrev) prev = actRemovido[1].trim();
                if (isGenericNext) next = "Ninguna";
              }
            }
          }

          if (typeof prev === "string" && prev.includes("[object Object]")) {
            prev = "Datos previos";
          }
          if (typeof next === "string" && next.includes("[object Object]")) {
            next = "Datos actualizados";
          }

          changes.push({
            ...entry,
            field: cleanField,
            prevValue: prev || "—",
            newValue: next || "—"
          });
        }
      }
    });
  }

  // Fallback if updatedAt is on or after targetCutoff and no specific auditHistory entries exist
  if (changes.length === 0 && guest.updatedAt) {
    const updDate = new Date(guest.updatedAt);
    const crDate = guest.createdAt ? new Date(guest.createdAt) : null;
    if (!isNaN(updDate.getTime()) && updDate >= targetCutoff) {
      if (!crDate || updDate.getTime() > crDate.getTime() + 1000) {
        // Look for any latest audit entry to recover field if possible
        const lastHist = (guest.auditHistory && guest.auditHistory.length > 0) 
          ? guest.auditHistory[guest.auditHistory.length - 1] 
          : null;

        if (lastHist) {
          let fieldName = fieldMap[lastHist.field || ""] || lastHist.field || lastHist.action || "Registro General";
          changes.push({
            timestamp: lastHist.timestamp || guest.updatedAt,
            user: lastHist.user || "Staff",
            action: lastHist.action || "Modificación de Registro",
            field: fieldName,
            details: lastHist.details || `Modificación guardada el ${updDate.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}.`,
            prevValue: lastHist.prevValue || "—",
            newValue: lastHist.newValue || "—"
          });
        } else {
          changes.push({
            timestamp: guest.updatedAt,
            user: "Staff",
            action: "Modificación de Ficha",
            field: "Datos de Ficha",
            details: `Ficha modificada el ${updDate.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}.`,
            prevValue: "Registro guardado previamente",
            newValue: `Modificado ${updDate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} hrs`
          });
        }
      }
    }
  }

  return changes;
}
