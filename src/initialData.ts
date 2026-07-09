import { Guest, GuestStatus, TransportSlot, Activity, CommMessage, AuditLogEntry, EventConfig } from "./types";

export const INITIAL_EVENT_CONFIG: EventConfig = {
  eventName: "Convención Anual ADISTEM 2026",
  dates: "Del 15 al 18 de Octubre, 2026",
  venue: "Grand Fiesta Americana Coral Beach, Hotel Sede",
  hotelSede: "Grand Fiesta Americana Coral Beach, Hotel Sede",
  direccionHotelSede: "Blvd. Kukulcan Km. 9.5, Zona Hotelera, 77500, Q.R., México",
  telefonosHotelSede: "+52 998 881 3200",
  daysConfig: [
    {
      id: "dia1",
      dayNumber: 1,
      date: "15 de Octubre, 2026",
      title: "Llegada al hotel y registro",
      description: "Llegada al hotel Grand Fiesta Americana, registro oficial de delegados ADISTEM, entrega de gafetes y kit de bienvenida en el lobby.",
      notes: "Recuerda llevar una identificación oficial para el registro rápido en el lobby del hotel. El cóctel de bienvenida iniciará a las 19:30 en el área de playa. Código de vestir: Casual de playa."
    },
    {
      id: "dia2",
      dayNumber: 2,
      date: "16 de Octubre, 2026",
      title: "Sesión Plenaria de Negocios y Actividades Recreativas",
      description: "Reunión de negocios en el salón principal por la mañana, actividades recreativas en el hotel por la tarde.",
      notes: "La plenaria empieza puntualmente a las 09:00 en el Gran Salón Coral. Desayuno buffet disponible desde las 07:00 en el restaurante Viña del Mar. Para las actividades recreativas de la tarde (golf o spa), asegúrate de llevar protector solar biodegradable y ropa adecuada."
    },
    {
      id: "dia3",
      dayNumber: 3,
      date: "17 de Octubre, 2026",
      title: "Mesas de Trabajo y Cena de Gala",
      description: "Mesa panel de distribuidores por la mañana, tiempo libre por la tarde y cena de clausura formal por la noche.",
      notes: "El código de vestir para la Cena de Gala es formal / guayabera de gala. La ceremonia de premiación iniciará puntualmente a las 20:00 en el Gran Salón Coral. ¡No olvides tu invitación física!"
    },
    {
      id: "dia4",
      dayNumber: 4,
      date: "18 de Octubre, 2026",
      title: "Brunch de Despedida y Check-out",
      description: "Brunch de clausura en el restaurante del hotel y traslados coordinados hacia el aeropuerto de la Sede.",
      notes: "Recuerda que la hora límite de check-out en el hotel es a las 12:00. Los autobuses de traslado saldrán en bloques hacia el aeropuerto según el horario que seleccionaste. Revisa tu confirmación de traslado."
    }
  ],
  agenda: [
    { day: "Día 1 - Oct 15", title: "Llegada y Registro de Invitados", time: "14:00 - 18:00", description: "Recepción en lobby, entrega de kits de bienvenida y asignación de habitaciones." },
    { day: "Día 1 - Oct 15", title: "Cóctel de Bienvenida Stellantis", time: "19:30 - 22:30", description: "Cena cóctel de apertura en la playa del hotel con directivos de Stellantis México." },
    { day: "Día 2 - Oct 16", title: "Sesión Plenaria de Negocios", time: "09:00 - 13:00", description: "Presentación de resultados de la asociación y estrategia comercial de Stellantis para el próximo año." },
    { day: "Día 2 - Oct 16", title: "Actividades de Integración Recíproca", time: "14:30 - 18:30", description: "Espacio para actividades recreativas reservadas (Golf, Spa o Tour de Cenotes)." },
    { day: "Día 3 - Oct 17", title: "Mesa Panel de Distribuidores", time: "10:00 - 13:00", description: "Discusión sobre electromovilidad, retos de la red de concesionarios y digitalización." },
    { day: "Día 3 - Oct 17", title: "Cena de Gala y Premiación Anual", time: "20:00 - 23:30", description: "Celebración y entrega de galardones a los mejores distribuidores del año." },
    { day: "Día 4 - Oct 18", title: "Brunch de Despedida y Check-out", time: "09:00 - 11:30", description: "Brunch libre de clausura y traslados coordinados hacia el aeropuerto." }
  ],
  stage1Open: true,
  stage2Open: true,
  deadlineFlightChange: "2026-10-01T23:59:59.000Z",
  deadlineTransportChange: "2026-10-05T23:59:59.000Z",
  deadlineActivityChange: "2026-10-05T23:59:59.000Z",
  emailTemplateWelcome: "Estimado {name},\n\nNos complace invitarle a la Convención Anual ADISTEM 2026 de la Asociación de Distribuidores Stellantis México. Por favor use su código de acceso {code} en la aplicación móvil para confirmar su asistencia, registrar sus vuelos, subir sus documentos y seleccionar sus actividades.\n\nAtentamente,\nStaff ADISTEM",
  emailTemplateConfirmation: "Estimado {name},\n\nConfirmamos que su registro para la Convención ADISTEM 2026 ha sido completado con éxito. Su transporte asignado es: {transport} y tiene confirmada su participación en la actividad: {activity}.\n\n¡Le esperamos!",
  pushTemplateAlert: "Aviso importante: Se aproxima la fecha límite para registrar y modificar sus vuelos y actividades adicionales de la convención. Ingrese a la app para revisar sus datos."
};

export const INITIAL_GUESTS: Guest[] = [
  {
    id: "ADI-1092",
    email: "bernardo@fasterling.mx",
    name: "Ing. Bernardo Fasterling",
    phone: "5544332211",
    distributor: "Stellantis Interlomas",
    role: "Presidente del Consejo",
    status: GuestStatus.CONFIRMED,
    stage: 1,
    companions: [
      { id: "c1", name: "Sofía de Fasterling", relationship: "Cónyuge", allergies: "Ninguna", requirements: "Ninguno" }
    ],
    allergies: ["Mariscos"],
    allergiesCustom: "Alérgica a camarones (Sofía)",
    specialRequirements: "Habitación piso alto libre de humo",
    flightArrival: {
      airline: "Aeromexico",
      flightNumber: "AM504",
      departureAirport: "MEX",
      departureDateTime: "2026-10-15T09:15:00",
      arrivalAirport: "CUN",
      arrivalDateTime: "2026-10-15T11:30:00",
      manualValid: true
    },
    flightDeparture: {
      airline: "Aeromexico",
      flightNumber: "AM513",
      departureAirport: "CUN",
      departureDateTime: "2026-10-18T15:20:00",
      arrivalAirport: "MEX",
      arrivalDateTime: "2026-10-18T17:40:00",
      manualValid: true
    },
    assignedTransportId: "T-AER-HOT-2",
    selectedActivities: ["ACT-GOLF", "ACT-GALA"],
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-25T14:32:00.000Z"
  },
  {
    id: "ADI-2481",
    email: "alejandro.gomez@adistem.com.mx",
    name: "Lic. Alejandro Gómez",
    phone: "8119887766",
    distributor: "Stellantis Monterrey Sur",
    role: "Distribuidor Asociado",
    status: GuestStatus.COMPLETE,
    stage: 1,
    companions: [],
    allergies: [],
    allergiesCustom: "",
    specialRequirements: "",
    flightArrival: {
      airline: "VivaAerobus",
      flightNumber: "VB1240",
      departureAirport: "MTY",
      departureDateTime: "2026-10-15T10:30:00",
      arrivalAirport: "CUN",
      arrivalDateTime: "2026-10-15T13:10:00",
      manualValid: true
    },
    assignedTransportId: "T-AER-HOT-3",
    selectedActivities: ["ACT-SPA", "ACT-GALA"],
    createdAt: "2026-06-16T11:15:00.000Z",
    updatedAt: "2026-06-20T16:45:00.000Z"
  },
  {
    id: "ADI-3392",
    email: "marcela.rodriguez@vanguardia.mx",
    name: "Dra. Marcela Rodríguez",
    phone: "3334445566",
    distributor: "Vanguardia Motors Guadalajara",
    role: "Directora General",
    status: GuestStatus.INCOMPLETE,
    stage: 1,
    companions: [
      { id: "c2", name: "Carlos Rodríguez", relationship: "Hijo", allergies: "Nueces", requirements: "Menú infantil" }
    ],
    allergies: ["Nueces", "Gluten"],
    allergiesCustom: "Carlos es altamente alérgico a nueces de árbol.",
    specialRequirements: "Requiere cuna en la habitación.",
    createdAt: "2026-06-18T09:00:00.000Z",
    updatedAt: "2026-06-18T09:00:00.000Z",
    selectedActivities: []
  },
  {
    id: "ADI-4512",
    email: "fernando.lopez@stellantis-lomas.com",
    name: "C.P. Fernando López Díaz",
    phone: "5577665544",
    distributor: "Autoforum Lomas",
    role: "Distribuidor Asociado",
    status: GuestStatus.CONFIRMED,
    stage: 2,
    companions: [],
    allergies: [],
    allergiesCustom: "",
    specialRequirements: "",
    flightArrival: {
      airline: "Volaris",
      flightNumber: "Y4712",
      departureAirport: "MEX",
      departureDateTime: "2026-10-15T15:00:00",
      arrivalAirport: "CUN",
      arrivalDateTime: "2026-10-15T17:15:00",
      manualValid: true
    },
    flightDeparture: {
      airline: "Volaris",
      flightNumber: "Y4719",
      departureAirport: "CUN",
      departureDateTime: "2026-10-18T18:00:00",
      arrivalAirport: "MEX",
      arrivalDateTime: "2026-10-18T20:25:00",
      manualValid: true
    },
    assignedTransportId: "T-AER-HOT-4",
    selectedActivities: ["ACT-TULUM", "ACT-GALA"],
    createdAt: "2026-06-20T12:00:00.000Z",
    updatedAt: "2026-06-26T11:20:00.000Z"
  },
  {
    id: "ADI-5619",
    email: "sofia.castillo@grupocar.mx",
    name: "Sra. Sofía Castillo Prado",
    phone: "4421112233",
    distributor: "Stellantis Querétaro",
    role: "Directora de Operaciones",
    status: GuestStatus.CANCELLED,
    stage: 1,
    companions: [],
    allergies: [],
    allergiesCustom: "",
    specialRequirements: "",
    cancelledBy: "invitado",
    cancelledAt: "2026-06-28T15:40:00.000Z",
    cancellationReason: "Problemas de agenda corporativa imprevistos.",
    createdAt: "2026-06-15T10:30:00.000Z",
    updatedAt: "2026-06-28T15:40:00.000Z",
    selectedActivities: []
  },
  {
    id: "ADI-6029",
    email: "arturo.valenzuela@stellantis-puebla.mx",
    name: "Ing. Arturo Valenzuela",
    phone: "2223334444",
    distributor: "Valenzuela Motores Puebla",
    role: "Distribuidor Principal",
    status: GuestStatus.INCOMPLETE,
    stage: 2,
    companions: [],
    allergies: [],
    allergiesCustom: "",
    specialRequirements: "",
    createdAt: "2026-06-22T08:00:00.000Z",
    updatedAt: "2026-06-22T08:00:00.000Z",
    selectedActivities: []
  }
];

export const INITIAL_TRANSPORT_SLOTS: TransportSlot[] = [
  // Llegadas (Aeropuerto -> Hotel)
  { id: "T-AER-HOT-1", route: "Aeropuerto -> Hotel", dateTime: "2026-10-15T09:30:00", capacity: 15, assignedCount: 0, description: "Bloque 1 (Mañana temprano) - Transportadora ADISTEM" },
  { id: "T-AER-HOT-2", route: "Aeropuerto -> Hotel", dateTime: "2026-10-15T12:00:00", capacity: 20, assignedCount: 1, description: "Bloque 2 (Mediodía) - Transportadora ADISTEM" },
  { id: "T-AER-HOT-3", route: "Aeropuerto -> Hotel", dateTime: "2026-10-15T14:30:00", capacity: 25, assignedCount: 1, description: "Bloque 3 (Tarde temprana) - Van VIP Express" },
  { id: "T-AER-HOT-4", route: "Aeropuerto -> Hotel", dateTime: "2026-10-15T17:30:00", capacity: 20, assignedCount: 1, description: "Bloque 4 (Tarde tarde) - Autobús Ejecutivo ADISTEM" },
  
  // Salidas (Hotel -> Aeropuerto)
  { id: "T-HOT-AER-1", route: "Hotel -> Aeropuerto", dateTime: "2026-10-18T07:00:00", capacity: 15, assignedCount: 0, description: "Salida Madrugada - Traslado coordinado" },
  { id: "T-HOT-AER-2", route: "Hotel -> Aeropuerto", dateTime: "2026-10-18T10:00:00", capacity: 25, assignedCount: 0, description: "Salida Media Mañana - Traslado coordinado" },
  { id: "T-HOT-AER-3", route: "Hotel -> Aeropuerto", dateTime: "2026-10-18T13:00:00", capacity: 25, assignedCount: 1, description: "Salida Mediodía - Autobús Ejecutivo" },
  { id: "T-HOT-AER-4", route: "Hotel -> Aeropuerto", dateTime: "2026-10-18T16:00:00", capacity: 15, assignedCount: 0, description: "Salida Tarde - Traslado final" }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  { id: "ACT-SPA", name: "Sesión de Spa de Relajación Riviera", description: "Circuito de hidroterapia guiado y masaje corporal sueco de 50 minutos en las exclusivas instalaciones del Coral Beach Spa.", dateTime: "2026-10-16T15:00:00", capacity: 15, registeredCount: 1, waitingList: [], rules: "Máximo 15 personas simultáneas. Requiere ropa de baño.", category: "spa" },
  { id: "ACT-GOLF", name: "Torneo de Golf Convención ADISTEM", description: "Torneo formato scramble por parejas en el campo de Golf El Tinto diseñado por Nick Price. Incluye carrito y barra libre de snacks.", dateTime: "2026-10-16T14:30:00", capacity: 20, registeredCount: 1, waitingList: [], rules: "Se requiere vestimenta de golf reglamentaria. Se permite traer equipo propio o rentar en ProShop.", category: "golf" },
  { id: "ACT-CENOTE", name: "Tour Ecológico de Cenotes Sagrados", description: "Visita guiada privada y nado libre en tres cenotes vírgenes de la Riviera Maya con comida tradicional maya incluida.", dateTime: "2026-10-16T14:30:00", capacity: 25, registeredCount: 0, waitingList: [], rules: "Obligatorio uso de bloqueador biodegradable y chaleco salvavidas provisto.", category: "tour" },
  { id: "ACT-TULUM", name: "Tour Cultural Ruinas de Tulum Express", description: "Recorrido privado por la emblemática zona arqueológica de Tulum frente al Mar Caribe con guía certificado bilingüe.", dateTime: "2026-10-17T14:30:00", capacity: 30, registeredCount: 1, waitingList: [], rules: "Zapatos cómodos para caminar, gorra y agua embotellada recomendados.", category: "tour" },
  { id: "ACT-GALA", name: "Cena de Gala y Cierre Stellantis", description: "Espectacular banquete de 4 tiempos y premiación de distribuidores en el Gran Salón Coral, amenizado con orquesta en vivo.", dateTime: "2026-10-17T20:00:00", capacity: 150, registeredCount: 3, waitingList: [], rules: "Código de vestir: Formal / Guayabera de gala.", category: "cena" }
];

export const INITIAL_COMMS: CommMessage[] = [
  { id: "msg-1", subject: "Invitación Oficial - Convención ADISTEM 2026", body: "Se ha abierto el periodo de confirmación para el evento principal de distribuidores Stellantis.", type: "email", segment: { stage: "all" }, sentAt: "2026-06-15T11:00:00.000Z", recipientCount: 6 },
  { id: "msg-2", subject: "Fecha límite para asignación de Vuelos", body: "Recordatorio importante: Tienen hasta el 1 de Octubre para cargar sus pases de abordar y detalles de vuelos para logística.", type: "push", segment: { status: GuestStatus.INCOMPLETE }, sentAt: "2026-06-25T09:00:00.000Z", recipientCount: 2 }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  { id: "log-1", userId: "Staff - Coordinador Logística", userEmail: "coordinador@adistem.com.mx", action: "Alta de Invitado", details: "Se ingresó al sistema al Ing. Bernardo Fasterling para Etapa 1.", timestamp: "2026-06-15T10:00:00.000Z" },
  { id: "log-2", userId: "Invitado - Bernardo Fasterling", userEmail: "bernardo@fasterling.mx", action: "Confirmación de Asistencia", details: "El invitado confirmó asistencia desde la aplicación y agregó acompañante (Sofía).", timestamp: "2026-06-25T14:15:00.000Z" },
  { id: "log-3", userId: "Invitado - Bernardo Fasterling", userEmail: "bernardo@fasterling.mx", action: "Carga de Itinerario de Vuelo", details: "Registro de vuelo de llegada Aeromexico AM504 y salida AM513.", prevValue: "Sin vuelos", newValue: "AM504 (Llegada) / AM513 (Salida)", timestamp: "2026-06-25T14:32:00.000Z" },
  { id: "log-4", userId: "Invitado - Sofía Castillo", userEmail: "sofia.castillo@grupocar.mx", action: "Cancelación de Evento", details: "Canceló su asistencia desde el portal de invitado. Motivo: Problemas de agenda corporativa imprevistos.", prevValue: "Asistirá", newValue: "Cancelado", timestamp: "2026-06-28T15:40:00.000Z" }
];
