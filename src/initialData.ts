import { Guest, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig, HotelConfig } from "./types";

export const INITIAL_EVENT_CONFIG: EventConfig = {
  eventName: "Nueva Convención",
  dates: "Por definir",
  venue: "Por definir",
  hotelSede: "Por definir",
  direccionHotelSede: "",
  telefonosHotelSede: "",
  daysConfig: [],
  agenda: [],
  stage1Open: true,
  stage2Open: true,
  currentRegistrationStage: 2,
  deadlineFlightChange: "",
  deadlineTransportChange: "",
  deadlineActivityChange: "",
  eventStartDate: "",
  eventEndDate: "",
  emailTemplateWelcome: "Estimado {name},\n\nNos complace invitarle a la Convención. Por favor use su código de acceso {code} en la aplicación móvil para confirmar su asistencia, registrar sus vuelos, subir sus documentos y seleccionar sus actividades.\n\nAtentamente,\nStaff",
  emailTemplateConfirmation: "Estimado {name},\n\nConfirmamos que su registro ha sido completado con éxito. Su transporte asignado es: {transport} y tiene confirmada su participación en la actividad: {activity}.\n\n¡Le esperamos!",
  pushTemplateAlert: "Aviso importante: Se aproxima la fecha límite para registrar y modificar sus vuelos y actividades adicionales de la convención. Ingrese a la app para revisar sus datos."
};

export const INITIAL_GUESTS: Guest[] = [];

export const INITIAL_TRANSPORT_SLOTS: TransportSlot[] = [];

export const INITIAL_ACTIVITIES: Activity[] = [];

export const INITIAL_COMMS: CommMessage[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

export const INITIAL_HOTELS: HotelConfig[] = [
  {
    id: "hotel-rosewood-mandarina",
    name: "Rosewood Mandarina",
    costCarnetDoble: 75000,
    costCarnetSencillo: 55000,
    costDiaAdicionalDoble: 18500,
    costDiaAdicionalSencillo: 14500,
    costNino0a3: 0,
    costNino4a11: 3200,
    costNino12a17: 5800,
    costAdultoDiaExtra: 8500,
    costCamaExtra: 2500,
    costSencilla: 55000,
    costDoble: 75000
  }
];

export const INITIAL_USERS = [
  { id: "admin@fasterling.mx", email: "admin@fasterling.mx", password: "admin", role: "Admin" },
  { id: "staff@fasterling.mx", email: "staff@fasterling.mx", password: "staff", role: "Staff" }
];
