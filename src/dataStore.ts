import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig, HotelConfig, PortalUser, ActivityReservationDetail, SpaReservationSlot } from "./types";
import { INITIAL_EVENT_CONFIG, INITIAL_GUESTS, INITIAL_TRANSPORT_SLOTS, INITIAL_ACTIVITIES, INITIAL_COMMS, INITIAL_AUDIT_LOGS, INITIAL_HOTELS, INITIAL_USERS } from "./initialData";
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

    // Email / Name Change
    if (oldGuest.name !== updatedGuest.name) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Nombre",
        details: `Se editó el nombre del invitado de "${oldGuest.name || "—"}" a "${updatedGuest.name || "—"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.name,
        newValue: updatedGuest.name
      });
    }

    // Email Change
    if (oldGuest.email !== updatedGuest.email) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Correo",
        details: `Se editó el correo del invitado de "${oldGuest.email || "—"}" a "${updatedGuest.email || "—"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.email,
        newValue: updatedGuest.email
      });
    }

    // Phone Change
    if (oldGuest.phone !== updatedGuest.phone) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Celular",
        details: `Se editó el celular del invitado de "${oldGuest.phone || "—"}" a "${updatedGuest.phone || "—"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.phone,
        newValue: updatedGuest.phone
      });
    }

    // Sede (hotelAlojamiento) Change
    if (oldGuest.hotelAlojamiento !== updatedGuest.hotelAlojamiento) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Sede de Alojamiento",
        details: `Se modificó la sede del invitado. Dato anterior: "${oldGuest.hotelAlojamiento || "Sin Sede asignada"}" cambiado por "${updatedGuest.hotelAlojamiento || "Sin Sede asignada"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.hotelAlojamiento || "Sin Sede asignada",
        newValue: updatedGuest.hotelAlojamiento || "Sin Sede asignada"
      });
    }

    // Numero Habitacion Change
    if (oldGuest.numeroHabitacion !== updatedGuest.numeroHabitacion) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Habitación",
        details: `Se editó el número de habitación de "${oldGuest.numeroHabitacion || "Sin asignar"}" a "${updatedGuest.numeroHabitacion || "Sin asignar"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.numeroHabitacion || "Sin asignar",
        newValue: updatedGuest.numeroHabitacion || "Sin asignar"
      });
    }

    // Tipo Huesped Change
    if (oldGuest.tipoHuesped !== updatedGuest.tipoHuesped) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Categoría de Huésped",
        details: `Se cambió la categoría de huésped de "${oldGuest.tipoHuesped || "Convencionista"}" a "${updatedGuest.tipoHuesped || "Convencionista"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.tipoHuesped || "Convencionista",
        newValue: updatedGuest.tipoHuesped || "Convencionista"
      });
    }

    // Carnet Tipo Habitacion Change
    if (oldGuest.carnetTipoHabitacion !== updatedGuest.carnetTipoHabitacion) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Tipo Habitación Carnet",
        details: `Se editó el tipo de habitación del carnet de "${oldGuest.carnetTipoHabitacion || "Sencilla"}" a "${updatedGuest.carnetTipoHabitacion || "Sencilla"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.carnetTipoHabitacion || "Sencilla",
        newValue: updatedGuest.carnetTipoHabitacion || "Sencilla"
      });
    }

    // Noches Adicionales Change
    if (oldGuest.nochesAdicionales !== updatedGuest.nochesAdicionales) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio Noches Adicionales",
        details: `Se modificaron las noches adicionales de "${oldGuest.nochesAdicionales ?? 0}" a "${updatedGuest.nochesAdicionales ?? 0}" a las ${currentHourMin} hrs.`,
        prevValue: String(oldGuest.nochesAdicionales ?? 0),
        newValue: String(updatedGuest.nochesAdicionales ?? 0)
      });
    }

    // Grupo Change
    if (oldGuest.grupo !== updatedGuest.grupo) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Grupo",
        details: `Se cambió el grupo de "${oldGuest.grupo || "Sin grupo"}" a "${updatedGuest.grupo || "Sin grupo"}" a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.grupo || "Sin grupo",
        newValue: updatedGuest.grupo || "Sin grupo"
      });
    }

    // Distribuidora / Agencia Change
    const oldDist = oldGuest.distribuidora || oldGuest.distributor;
    const newDist = updatedGuest.distribuidora || updatedGuest.distributor;
    if (oldDist !== newDist) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Distribuidora",
        details: `Se editó la distribuidora/agencia de "${oldDist || "—"}" a "${newDist || "—"}" a las ${currentHourMin} hrs.`,
        prevValue: oldDist || "—",
        newValue: newDist || "—"
      });
    }

    // Status Change
    if (oldGuest.status !== updatedGuest.status) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Estado de Registro",
        details: `Estatus de registro cambió de ${oldGuest.status} a ${updatedGuest.status} a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.status,
        newValue: updatedGuest.status
      });
    }

    // Flight Arrival change
    if (JSON.stringify(oldGuest.flightArrival) !== JSON.stringify(updatedGuest.flightArrival)) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Edición Vuelo de Llegada",
        details: `Se actualizaron los datos del vuelo de llegada a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.flightArrival ? `${oldGuest.flightArrival.airline} ${oldGuest.flightArrival.flightNumber}` : "No registrado",
        newValue: updatedGuest.flightArrival ? `${updatedGuest.flightArrival.airline} ${updatedGuest.flightArrival.flightNumber}` : "Eliminado"
      });
    }

    // Flight Departure change
    if (JSON.stringify(oldGuest.flightDeparture) !== JSON.stringify(updatedGuest.flightDeparture)) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Edición Vuelo de Salida",
        details: `Se actualizaron los datos del vuelo de salida a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.flightDeparture ? `${oldGuest.flightDeparture.airline} ${oldGuest.flightDeparture.flightNumber}` : "No registrado",
        newValue: updatedGuest.flightDeparture ? `${updatedGuest.flightDeparture.airline} ${updatedGuest.flightDeparture.flightNumber}` : "Eliminado"
      });
    }

    // Transport change
    if (oldGuest.assignedTransportId !== updatedGuest.assignedTransportId) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Modificación de Transporte",
        details: `Cambio en asignación de transporte a las ${currentHourMin} hrs.`,
        prevValue: oldGuest.assignedTransportId || "Sin asignar",
        newValue: updatedGuest.assignedTransportId || "Sin asignar"
      });
    }

    // Activities changes
    const oldActs = oldGuest.selectedActivities || [];
    const newActs = updatedGuest.selectedActivities || [];
    const addedActivities = newActs.filter(a => !oldActs.includes(a));
    const removedActivities = oldActs.filter(a => !newActs.includes(a));

    if (addedActivities.length > 0) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Inscripción en Actividad",
        details: `Inscrito en la(s) actividad(es): ${addedActivities.join(", ")} a las ${currentHourMin} hrs.`,
        newValue: addedActivities.join(", ")
      });
    }

    if (removedActivities.length > 0) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cancelación de Actividad",
        details: `Removido de la(s) actividad(es): ${removedActivities.join(", ")} a las ${currentHourMin} hrs.`,
        prevValue: removedActivities.join(", ")
      });
    }

    // Reservation / Slot changes
    const oldReservations = oldGuest.activityReservations || [];
    const newReservations = updatedGuest.activityReservations || [];
    if (JSON.stringify(oldReservations) !== JSON.stringify(newReservations)) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Actualización de Slots / Citas",
        details: `Se actualizaron las citas/horarios de actividades para el participante a las ${currentHourMin} hrs.`,
        prevValue: oldReservations.map(r => `${r.personName}: ${r.slotTime || "Sin slot"}`).join(", "),
        newValue: newReservations.map(r => `${r.personName}: ${r.slotTime || "Sin slot"}`).join(", ")
      });
    }

    // Cancellation Specific
    if (updatedGuest.status === GuestStatus.CANCELLED && oldGuest.status !== GuestStatus.CANCELLED) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cancelación de Asistencia",
        details: `Invitado canceló su asistencia al evento a las ${currentHourMin} hrs. Motivo: ${updatedGuest.cancellationReason || "No especificado"}`,
        prevValue: oldGuest.status,
        newValue: GuestStatus.CANCELLED
      });
    }

    // Append to Guest's local auditHistory
    const localHistory = updatedGuest.auditHistory || [];
    auditEntries.forEach(entry => {
      localHistory.push({
        timestamp: new Date().toISOString(),
        user: `${editorName} (${editorEmail})`,
        action: entry.action,
        details: entry.details
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

  static deleteGuest(id: string, editorName: string, editorEmail: string): void {
    const guests = this.getGuests();
    const guest = guests.find(g => g.id === id);
    if (!guest) return;

    this.guests = guests.filter(g => g.id !== id);
    
    // Delete from Firestore asynchronously
    deleteDoc(doc(db, "guests", id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `guests/${id}`));

    const existingUser = this.portalUsers.find(u => u.guestId === id);
    if (existingUser) {
      this.deleteUser(existingUser.id);
    }

    this.addAuditLog({
      userId: editorName,
      userEmail: editorEmail,
      action: "Eliminación de Invitado",
      details: `Se eliminó por completo el registro de ${guest.name} del evento.`,
      prevValue: guest.name
    });

    this.recalculateCounts();
  }

  static sendCommMessage(msg: Omit<CommMessage, "id" | "sentAt">, senderName: string, senderEmail: string): void {
    const newMsg: CommMessage = {
      ...msg,
      id: "msg-" + Math.random().toString(36).substring(2, 9),
      sentAt: new Date().toISOString()
    };
    this.comms.push(newMsg);
    
    // Write to Firestore asynchronously
    setDoc(doc(db, "comms", newMsg.id), newMsg)
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
    const guests = this.getGuests();
    
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
