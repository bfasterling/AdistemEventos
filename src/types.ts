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
  emailTemplateWelcome: string;
  emailTemplateConfirmation: string;
  pushTemplateAlert: string;
}
