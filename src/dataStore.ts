import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig } from "./types";
import { INITIAL_EVENT_CONFIG, INITIAL_GUESTS, INITIAL_TRANSPORT_SLOTS, INITIAL_ACTIVITIES, INITIAL_COMMS, INITIAL_AUDIT_LOGS } from "./initialData";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";

export class DataStore {
  private static guests: Guest[] = INITIAL_GUESTS;
  private static transportSlots: TransportSlot[] = INITIAL_TRANSPORT_SLOTS;
  private static activities: Activity[] = INITIAL_ACTIVITIES;
  private static comms: CommMessage[] = INITIAL_COMMS;
  private static auditLogs: AuditLogEntry[] = INITIAL_AUDIT_LOGS;
  private static config: EventConfig | null = INITIAL_EVENT_CONFIG;
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
        snapshot.forEach(doc => {
          if (doc.id === "event_config") {
            this.config = doc.data() as EventConfig;
          }
        });
        if (this.onUpdateCallback) this.onUpdateCallback();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "config"));

    // 2. Listen to guests
    onSnapshot(collection(db, "guests"), (snapshot) => {
      if (snapshot.empty) {
        this.seedGuests();
      } else {
        const list: Guest[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as Guest);
        });
        this.guests = list;
        if (this.onUpdateCallback) this.onUpdateCallback();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "guests"));

    // 3. Listen to transports
    onSnapshot(collection(db, "transports"), (snapshot) => {
      if (snapshot.empty) {
        this.seedTransports();
      } else {
        const list: TransportSlot[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as TransportSlot);
        });
        this.transportSlots = list;
        if (this.onUpdateCallback) this.onUpdateCallback();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "transports"));

    // 4. Listen to activities
    onSnapshot(collection(db, "activities"), (snapshot) => {
      if (snapshot.empty) {
        this.seedActivities();
      } else {
        const list: Activity[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as Activity);
        });
        this.activities = list;
        if (this.onUpdateCallback) this.onUpdateCallback();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "activities"));

    // 5. Listen to comms
    onSnapshot(collection(db, "comms"), (snapshot) => {
      if (snapshot.empty) {
        this.seedComms();
      } else {
        const list: CommMessage[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as CommMessage);
        });
        this.comms = list;
        if (this.onUpdateCallback) this.onUpdateCallback();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "comms"));

    // 6. Listen to audits
    onSnapshot(collection(db, "audits"), (snapshot) => {
      if (snapshot.empty) {
        this.seedAudits();
      } else {
        const list: AuditLogEntry[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as AuditLogEntry);
        });
        this.auditLogs = list;
        if (this.onUpdateCallback) this.onUpdateCallback();
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "audits"));
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
    return this.guests;
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

  static getComms(): CommMessage[] {
    return this.comms;
  }

  static getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  static resetToDefault(): void {
    this.seedConfig();
    this.seedGuests();
    this.seedTransports();
    this.seedActivities();
    this.seedComms();
    this.seedAudits();
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
      if (flightChanged) {
        const deadline = new Date(config.deadlineFlightChange);
        if (new Date() > deadline) {
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
      if (oldGuest.assignedTransportId !== updatedGuest.assignedTransportId) {
        const deadline = new Date(config.deadlineTransportChange);
        if (new Date() > deadline) {
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
      if (activitiesChanged) {
        const deadline = new Date(config.deadlineActivityChange);
        if (new Date() > deadline) {
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

    // Email / Name Change
    if (oldGuest.name !== updatedGuest.name) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Nombre",
        details: `Se editó el nombre del invitado.`,
        prevValue: oldGuest.name,
        newValue: updatedGuest.name
      });
    }

    // Status Change
    if (oldGuest.status !== updatedGuest.status) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cambio de Estado de Registro",
        details: `Estatus de registro cambió de ${oldGuest.status} a ${updatedGuest.status}.`,
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
        details: `Se actualizaron los datos del vuelo de llegada.`,
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
        details: `Se actualizaron los datos del vuelo de salida.`,
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
        details: `Cambio en asignación de transporte.`,
        prevValue: oldGuest.assignedTransportId || "Sin asignar",
        newValue: updatedGuest.assignedTransportId || "Sin asignar"
      });
    }

    // Activities changes
    const addedActivities = updatedGuest.selectedActivities.filter(a => !oldGuest.selectedActivities.includes(a));
    const removedActivities = oldGuest.selectedActivities.filter(a => !updatedGuest.selectedActivities.includes(a));

    if (addedActivities.length > 0) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Inscripción en Actividad",
        details: `Inscrito en la(s) actividad(es): ${addedActivities.join(", ")}`,
        newValue: addedActivities.join(", ")
      });
    }

    if (removedActivities.length > 0) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cancelación de Actividad",
        details: `Removido de la(s) actividad(es): ${removedActivities.join(", ")}`,
        prevValue: removedActivities.join(", ")
      });
    }

    // Cancellation Specific
    if (updatedGuest.status === GuestStatus.CANCELLED && oldGuest.status !== GuestStatus.CANCELLED) {
      auditEntries.push({
        userId: editorName,
        userEmail: editorEmail,
        action: "Cancelación de Asistencia",
        details: `Invitado canceló su asistencia al evento. Motivo: ${updatedGuest.cancellationReason || "No especificado"}`,
        prevValue: oldGuest.status,
        newValue: GuestStatus.CANCELLED
      });
    }

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
      const registeredGuests = guests.filter(g => g.status !== GuestStatus.CANCELLED && g.selectedActivities.includes(act.id));
      act.registeredCount = registeredGuests.length;

      act.waitingList = act.waitingList.filter(gid => {
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
}
