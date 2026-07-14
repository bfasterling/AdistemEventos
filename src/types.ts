export enum GuestStatus {
  INCOMPLETE = 'Incompleto',
  COMPLETE = 'Completo',
  CONFIRMED = 'Confirmado',
  CANCELLED = 'Cancelado'
}

export interface Companion {
  id: string;
  name: string;
  relationship: string;
  allergies: string;
  requirements: string;
  firstName?: string;
  lastName?: string;
  sex?: string;
  ineAttached?: boolean;
  selectedActivities?: string[];
  vueloLlegadaAerolinea?: string;
  vueloLlegadaNoVuelo?: string;
  vueloLlegadaFecha?: string;
  vueloLlegadaHora?: string;
  vueloLlegadaPasajeros?: string[];
  vueloRegresoAerolinea?: string;
  vueloRegresoNoVuelo?: string;
  vueloRegresoFecha?: string;
  vueloRegresoHora?: string;
  vueloRegresoPasajeros?: string[];
}

export interface FlightInfo {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureDateTime: string;
  arrivalAirport: string;
  arrivalDateTime: string;
  itineraryFileUrl?: string;
  itineraryFileName?: string;
  manualValid: boolean;
}

export interface Guest {
  id: string;
  email: string;
  name: string;
  phone: string;
  distributor: string; // Agencia/Distribuidor (obligatorio)
  role: string; // Rol interno para control staff
  status: GuestStatus;
  stage: 1 | 2; // Etapa de registro (1 o 2)
  companions: Companion[];
  allergies: string[];
  allergiesCustom: string;
  specialRequirements: string;
  flightArrival?: FlightInfo;
  flightDeparture?: FlightInfo;
  assignedTransportId?: string; // ID de horario de transporte
  selectedActivities: string[]; // IDs de las actividades inscritas
  idFileName?: string; // Nombre del archivo de identificacion (INE/pasaporte)
  idFileUrl?: string; // URL o base64 de la identificacion
  extractedFaceUrl?: string; // Thumbnail del rostro extraido
  cancelledBy?: 'invitado' | 'staff';
  cancelledAt?: string;
  cancellationReason?: string;
  username?: string; // Usuario de acceso
  password?: string; // Contraseña de acceso
  createdAt: string;
  updatedAt: string;

  // NUEVOS CAMPOS REGISTRO WEB & ADMIN
  grupo?: string;
  distribuidora?: string;
  nombreTitular?: string;
  apellidosTitular?: string;
  correoTitular?: string;
  celularTitular?: string;
  sexo?: string;
  alergiasTitular?: string;
  nombreAcompanante?: string;
  apellidosAcompanante?: string;
  sexoAcompanante?: string;
  alergiasAcompanante?: string;
  numMenores?: number;
  alergiasMenores?: string[];
  minors?: Array<{ name: string; lastName: string; age: number; sex: string; allergies: string }>;
  vuelosSeparados?: boolean;
  draftSaved?: boolean;
  numHabitaciones?: number;
  configuracionHabitacion?: string; // 'King' | 'Queen/Queen'
  carnetTipoHabitacion?: string; // 'Sencilla' | 'Sencillo Extra' | 'Doble' | 'Doble Extra'
  vueloLlegadaFecha?: string;
  vueloLlegadaHora?: string;
  vueloLlegadaAerolinea?: string;
  vueloLlegadaNoVuelo?: string;
  vueloLlegadaPersonas?: number;
  vueloLlegadaPasajerosTitular?: string[];
  vueloRegresoFecha?: string;
  vueloRegresoHora?: string;
  vueloRegresoAerolinea?: string;
  vueloRegresoNoVuelo?: string;
  vueloRegresoPersonas?: number;
  vueloRegresoPasajerosTitular?: string[];
  nochesAdicionales?: number;
  requerimientosAdicionales?: string;
  tipoHuesped?: 'VIP' | 'Convencionista' | 'Staff';
  hotelAlojamiento?: string;
  numeroHabitacion?: string;
  ineTitular?: boolean;
  ineAcompanante?: boolean;
  comentariosAdmin?: string;
  costosAdicionales?: CustomCost[];
  auditHistory?: GuestChangeLog[];
  registeredByUserId?: string;
}

export interface TransportSlot {
  id: string;
  route: 'Aeropuerto -> Hotel' | 'Hotel -> Aeropuerto';
  dateTime: string; // Fecha y hora de salida
  capacity: number;
  assignedCount: number;
  description: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  dateTime: string;
  capacity: number;
  registeredCount: number;
  waitingList: string[]; // Lista de espera (ID de invitados)
  rules?: string;
  category: 'spa' | 'golf' | 'tour' | 'cena' | 'otro';
}

export interface CommMessage {
  id: string;
  subject: string;
  body: string;
  type: 'email' | 'push';
  segment: {
    stage?: 'all' | 1 | 2;
    status?: 'all' | GuestStatus;
    activityId?: 'all' | string;
    arrivalDay?: 'all' | string;
  };
  sentAt: string;
  recipientCount: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string; // "Staff - Juan" or "Invitado - <Name>"
  userEmail: string;
  action: string; // "Editar Vuelo", "Inscribir Actividad", "Registrar Invitado", etc.
  details: string;
  prevValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface EventConfig {
  eventName: string;
  dates: string;
  venue: string;
  hotelSede?: string;
  direccionHotelSede?: string;
  telefonosHotelSede?: string;
  daysConfig?: {
    id: string;
    dayNumber: number;
    date: string;
    calendarDate?: string;
    title: string;
    description: string;
    notes?: string;
  }[];
  agenda: {
    day: string;
    title: string;
    time: string;
    description: string;
  }[];
  stage1Open: boolean;
  stage2Open: boolean;
  deadlineFlightChange: string; // ISO Date String
  deadlineTransportChange: string; // ISO Date String
  deadlineActivityChange: string; // ISO Date String
  eventStartDate?: string; // YYYY-MM-DD
  eventEndDate?: string;   // YYYY-MM-DD
  emailTemplateWelcome: string;
  emailTemplateConfirmation: string;
  pushTemplateAlert: string;
}

export interface HotelConfig {
  id: string;
  name: string;
  costSencilla: number;
  costSencilloExtra: number;
  costDoble: number;
  costDobleExtra: number;
}

export interface PortalUser {
  id: string; // Email
  email: string;
  password?: string;
  role: 'Invitado' | 'Staff' | 'Admin';
  guestId?: string; // Linked guest ID (for Invitado role)
}

export interface GuestChangeLog {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface CustomCost {
  description: string;
  monto: number;
}

