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
  tipo?: "adult" | "minor";
  parentezco?: string;
  age?: number;
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
  alergiasMenores?: string | string[];
  minors?: Array<{ name: string; lastName: string; age: number; sex: string; allergies: string; tipo?: 'adult' | 'minor'; parentezco?: string }>;
  vuelosSeparados?: boolean;
  draftSaved?: boolean;
  numHabitaciones?: number;
  configuracionHabitacion?: string; // 'King' | 'Queen/Queen'
  carnetTipoHabitacion?: string; // 'Sencilla' | 'Sencillo Extra' | 'Doble' | 'Doble Extra'
  regaloTitularEntregado?: boolean;
  regaloAcompananteMujerEntregado?: boolean;
  regaloAcompananteHombreEntregado?: boolean;
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
  nochesAdicionalesFechas?: string[];
  requerimientosAdicionales?: string;
  tipoHuesped?: 'VIP' | 'Planta' | 'Financiera' | 'Externo' | 'Staff' | string;
  hotelAlojamiento?: string;
  numeroHabitacion?: string;
  puesto?: string;
  kitsBienvenida?: boolean;
  regaloHombre?: boolean;
  arregloFloral?: boolean;
  certificadoRegalo?: boolean;
  regaloDespedida?: boolean;
  regaloMenores?: boolean;
  vueloLlegadaAerolinea2?: string;
  vueloLlegadaNoVuelo2?: string;
  vueloLlegadaHora2?: string;
  vueloLlegadaPax2?: number;
  vueloRegresoFecha2?: string;
  vueloRegresoAerolinea2?: string;
  vueloRegresoNoVuelo2?: string;
  vueloRegresoHora2?: string;
  vueloRegresoPax2?: number;
  ineTitular?: boolean;
  ineAcompanante?: boolean;
  comentariosAdmin?: string;
  costosAdicionales?: CustomCost[];
  auditHistory?: GuestChangeLog[];
  registeredByUserId?: string;
  acceptedPrivacyPolicyAt?: string;
  activityReservations?: ActivityReservationDetail[];
}

export interface ActivityDayConfig {
  id: string;
  date: string; // e.g. "2026-05-15" or "15 de Mayo"
  label: string; // e.g. "Viernes 15 de Mayo"
  googleSheetsTab: string; // e.g. "Viernes" / "SPA Viernes"
  sheetSlots?: SpaReservationSlot[];
}

export interface ActivityReservationDetail {
  activityId: string;
  activityName?: string;
  personType: 'titular' | 'companion' | 'minor';
  personId: string;
  personName: string;
  paternalName?: string;
  maternalName?: string;
  titularEmail: string;
  slotTime?: string;
  dayId?: string; // ID del día seleccionado
  dayDate?: string; // Fecha (ej: 2026-05-15)
  dayLabel?: string; // Etiqueta del día (ej: Viernes 15 de Mayo)
  sheetTab?: string; // Pestaña de sheets de ese día (ej: "Viernes")
  therapistGender?: string;
  rowIndex?: number;
  citaNo?: string;
  notes?: string;
  // Golf specific fields
  golfOwnClubs?: boolean;
  golfHand?: 'Derecho' | 'Zurdo';
  golfShaft?: 'Regular' | 'Stiff';
  // Sheets synchronization tracking
  syncStatus?: 'synced' | 'pending_sheet' | 'failed_sheet';
  syncError?: string;
  lastSyncAt?: string;
}

export interface SpaReservationSlot {
  rowIndex: number;
  citaNo?: string; // Col A
  timeSlot: string; // Col J/K formatted (ej: 09:00 AM (60 min))
  rawTime?: string; // Col J/K raw
  duration?: string; // Col K/L (ej: 60 min)
  therapistGender: string; // Col M/N (Dama / Caballero / Femenino / Masculino)
  isBlocked: boolean; // Col P con dato/bloqueo
  isOccupied: boolean; // Col P con email o Col B/C/D con nombre
  participantName?: string; // Col B
  participantPaternal?: string; // Col C
  participantMaternal?: string; // Col D
  titularEmail?: string; // Col P
}

export interface TransportSlot {
  id: string;
  route: 'Aeropuerto -> Hotel' | 'Hotel -> Aeropuerto';
  dateTime: string; // Fecha y hora de salida
  capacity: number;
  assignedCount: number;
  description: string;
}

export type ActivityType = 'SPA' | 'GOLF' | 'BUCEO' | 'PICKLEBALL' | 'BINGO' | 'MOVIE_NIGHTS' | 'OTRO';

export interface Activity {
  id: string;
  name: string;
  description: string;
  isActive?: boolean; // Default true - si está desactivada no se muestra en el registro
  activityType?: ActivityType; // SPA, GOLF, BUCEO, PICKLEBALL, BINGO, MOVIE_NIGHTS, OTRO
  googleSheetsUrl?: string; // Liga del archivo de google sheets
  googleSheetsWebhookUrl?: string; // URL del Webhook de Google Apps Script para escritura en vivo
  googleSheetsTab?: string; // Nombre de la pestaña del google sheets por defecto
  daysConfig?: ActivityDayConfig[]; // Días/fechas configurados con su respectiva pestaña
  eventDay?: string; // Día del evento (ej: Día 1, Día 2, 15 de Mayo)
  timeRange?: string; // Rango de horario (ej: 09:00 - 14:00)
  dateTime: string;
  capacity: number;
  registeredCount: number;
  waitingList: string[]; // Lista de espera (ID de invitados)
  rules?: string;
  category: 'spa' | 'golf' | 'tour' | 'cena' | 'otro' | 'SPA' | 'GOLF' | 'BUCEO' | 'PICKLEBALL' | 'pickleball' | 'BINGO' | 'bingo' | 'MOVIE_NIGHTS' | 'movie_nights' | 'OTRO';
  slots?: SpaReservationSlot[];
  sheetSlots?: SpaReservationSlot[];
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
  currentRegistrationStage?: 1 | 2; // 1 = Registro Dueños (1 titular por grupo), 2 = Registro Abierto
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
  // Costos por carnet por el evento (no por día)
  costCarnetDoble?: number;
  costCarnetSencillo?: number;
  // Costos por día
  costDiaAdicionalDoble?: number;
  costDiaAdicionalSencillo?: number;
  costNino0a3?: number;
  costNino4a11?: number;
  costNino12a17?: number;
  costAdultoDiaExtra?: number;
  costCamaExtra?: number;
  // Retrocompatibilidad
  costSencilla?: number;
  costSencilloExtra?: number;
  costDoble?: number;
  costDobleExtra?: number;
}

export interface PortalUser {
  id: string; // Email
  email: string;
  password?: string;
  role: 'Invitado' | 'Staff' | 'Admin';
  guestId?: string; // Linked guest ID (for Invitado role)
  acceptedPrivacyPolicyAt?: string; // Fecha y hora de aceptación de políticas
  acceptedPrivacyTerms?: boolean; // Estado de aceptación
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

