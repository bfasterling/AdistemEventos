import React from "react";
import { FileText, ChevronLeft, Save, CheckCircle, User, Users, ShieldAlert, Key, Plane } from "lucide-react";

interface SummaryStepProps {
  t: any;
  isDarkMode: boolean;
  draftSuccess: boolean;
  carnetTipoHabitacion: string;
  configuracionHabitacion: string;
  nochesAdicionales: number;
  requerimientosAdicionales: string;
  calculateTotalHotelCost: () => number;
  nombreTitular: string;
  apellidosTitular: string;
  grupo: string;
  distribuidora: string;
  correoTitular: string;
  celularTitular: string;
  alergiasTitular: string;
  hasCompanion: boolean;
  companionsList: Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    allergies: string;
    vueloLlegadaAerolinea?: string;
    vueloLlegadaNoVuelo?: string;
    vueloLlegadaFecha?: string;
    vueloLlegadaHora?: string;
    vueloRegresoAerolinea?: string;
    vueloRegresoNoVuelo?: string;
    vueloRegresoFecha?: string;
    vueloRegresoHora?: string;
    selectedActivities?: string[];
    vueloLlegadaPasajeros?: string[];
    vueloRegresoPasajeros?: string[];
  }>;
  numMinors: number;
  minors: Array<{ name: string; lastName: string; age: number; allergies: string }>;
  hasFlights: boolean;
  vuelosSeparados: boolean;
  vueloLlegadaAerolinea: string;
  vueloLlegadaNoVuelo: string;
  vueloLlegadaFecha: string;
  vueloLlegadaHora: string;
  vueloRegresoAerolinea: string;
  vueloRegresoNoVuelo: string;
  vueloRegresoFecha: string;
  vueloRegresoHora: string;
  selectedActivities: string[];
  DataStore: any;
  handlePrev: () => void;
  handleSaveDraft: () => void;
  handleSaveRegistration: () => void;
  loggedGuest: any;
  activeAccessUser?: any;
  vueloLlegadaPasajerosTitular?: string[];
  vueloRegresoPasajerosTitular?: string[];
}

export default function SummaryStep({
  t,
  isDarkMode,
  draftSuccess,
  carnetTipoHabitacion,
  configuracionHabitacion,
  nochesAdicionales,
  requerimientosAdicionales,
  nombreTitular,
  apellidosTitular,
  grupo,
  distribuidora,
  correoTitular,
  celularTitular,
  alergiasTitular,
  hasCompanion,
  companionsList,
  numMinors,
  minors,
  hasFlights,
  vuelosSeparados,
  vueloLlegadaAerolinea,
  vueloLlegadaNoVuelo,
  vueloLlegadaFecha,
  vueloLlegadaHora,
  vueloRegresoAerolinea,
  vueloRegresoNoVuelo,
  vueloRegresoFecha,
  vueloRegresoHora,
  handlePrev,
  handleSaveDraft,
  handleSaveRegistration,
  loggedGuest,
  activeAccessUser,
  vueloLlegadaPasajerosTitular,
  vueloRegresoPasajerosTitular
}: SummaryStepProps) {
  
  const Val = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#56B7A9] font-extrabold text-xs md:text-sm inline-block mx-1">
      {children}
    </span>
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
      {children}
    </span>
  );

  const getPassengerName = (id: string) => {
    if (id === "titular") return `${nombreTitular} ${apellidosTitular}`.trim() || "Titular";
    if (id.startsWith("C-")) {
      const idx = parseInt(id.split("-")[1] || "1") - 1;
      const comp = companionsList[idx];
      if (comp) return `${comp.firstName} ${comp.lastName}`.trim();
    }
    if (id.startsWith("M-")) {
      const idx = parseInt(id.split("-")[1] || "1") - 1;
      const minor = minors[idx];
      if (minor) return (minor.name || minor.lastName) ? `${minor.name || ""} ${minor.lastName || ""}`.trim() : `Menor #${idx + 1}`;
    }
    const foundComp = companionsList.find(c => c.id === id);
    if (foundComp) return `${foundComp.firstName} ${foundComp.lastName}`.trim();
    
    return id;
  };

  const renderFlightsSummary = () => {
    if (!hasFlights) {
      return (
        <div className="p-4 bg-slate-500/5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center italic text-slate-500">
          No se ha registrado itinerario de vuelos.
        </div>
      );
    }

    if (!vuelosSeparados) {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-[#56B7A9]/5 rounded-xl border border-[#56B7A9]/25 space-y-2">
            <span className="font-extrabold text-blue-500 text-[10px] uppercase block tracking-wider">✈️ Vuelo de Llegada (Unificado)</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><Label>Aerolínea:</Label> <Val>{vueloLlegadaAerolinea || "Terrestre"}</Val></div>
              {vueloLlegadaAerolinea !== "Terrestre" && (
                <div><Label>No. Vuelo:</Label> <Val>{vueloLlegadaNoVuelo || "N/A"}</Val></div>
              )}
              <div><Label>Fecha:</Label> <Val>{vueloLlegadaFecha || "N/A"}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloLlegadaHora || "N/A"}</Val></div>
            </div>
          </div>

          <div className="p-3 bg-[#56B7A9]/5 rounded-xl border border-[#56B7A9]/25 space-y-2">
            <span className="font-extrabold text-blue-500 text-[10px] uppercase block tracking-wider">✈️ Vuelo de Regreso (Unificado)</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><Label>Aerolínea:</Label> <Val>{vueloRegresoAerolinea || "Terrestre"}</Val></div>
              {vueloRegresoAerolinea !== "Terrestre" && (
                <div><Label>No. Vuelo:</Label> <Val>{vueloRegresoNoVuelo || "N/A"}</Val></div>
              )}
              <div><Label>Fecha:</Label> <Val>{vueloRegresoFecha || "N/A"}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloRegresoHora || "N/A"}</Val></div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-500/5 rounded-xl border border-slate-200/50 dark:border-slate-800">
            <Label>Pasajeros en este itinerario:</Label>
            <p className="mt-1 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
              {getPassengerName("titular")}
              {companionsList.map(c => `, ${getPassengerName(c.id)}`)}
              {minors.slice(0, numMinors).map((m, idx) => `, ${getPassengerName(`M-${idx + 1}`)}`)}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Titular flights */}
        <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="font-extrabold text-[#56B7A9] text-[10px] uppercase block tracking-wider">
            👤 Itinerario de {nombreTitular} {apellidosTitular} (Titular)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
              <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Llegada</span>
              <div><Label>Aerolínea:</Label> <Val>{vueloLlegadaAerolinea || "Terrestre"}</Val></div>
              {vueloLlegadaAerolinea !== "Terrestre" && (
                <div><Label>No. Vuelo:</Label> <Val>{vueloLlegadaNoVuelo || "N/A"}</Val></div>
              )}
              <div><Label>Fecha:</Label> <Val>{vueloLlegadaFecha || "N/A"}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloLlegadaHora || "N/A"}</Val></div>
              {/* Minors with titular on arrival */}
              {vueloLlegadaPasajerosTitular && vueloLlegadaPasajerosTitular.filter(id => id.startsWith("M-")).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Menores acompañantes:</span>
                  <div className="text-[10px] text-[#56B7A9] font-extrabold">
                    {vueloLlegadaPasajerosTitular.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                  </div>
                </div>
              )}
            </div>

            <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
              <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Regreso</span>
              <div><Label>Aerolínea:</Label> <Val>{vueloRegresoAerolinea || "Terrestre"}</Val></div>
              {vueloRegresoAerolinea !== "Terrestre" && (
                <div><Label>No. Vuelo:</Label> <Val>{vueloRegresoNoVuelo || "N/A"}</Val></div>
              )}
              <div><Label>Fecha:</Label> <Val>{vueloRegresoFecha || "N/A"}</Val></div>
              <div><Label>Hora:</Label> <Val>{vueloRegresoHora || "N/A"}</Val></div>
              {/* Minors with titular on departure */}
              {vueloRegresoPasajerosTitular && vueloRegresoPasajerosTitular.filter(id => id.startsWith("M-")).length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Menores acompañantes:</span>
                  <div className="text-[10px] text-[#56B7A9] font-extrabold">
                    {vueloRegresoPasajerosTitular.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Companions flights */}
        {hasCompanion && companionsList.map((comp) => (
          <div key={comp.id} className="p-3 bg-slate-500/5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-extrabold text-[#56B7A9] text-[10px] uppercase block tracking-wider">
              👥 Itinerario de {comp.firstName} {comp.lastName} (Acompañante)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
                <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Llegada</span>
                <div><Label>Aerolínea:</Label> <Val>{comp.vueloLlegadaAerolinea || "Terrestre"}</Val></div>
                {comp.vueloLlegadaAerolinea !== "Terrestre" && (
                  <div><Label>No. Vuelo:</Label> <Val>{comp.vueloLlegadaNoVuelo || "N/A"}</Val></div>
                )}
                <div><Label>Fecha:</Label> <Val>{comp.vueloLlegadaFecha || "N/A"}</Val></div>
                <div><Label>Hora:</Label> <Val>{comp.vueloLlegadaHora || "N/A"}</Val></div>
                {/* Minors with companion on arrival */}
                {comp.vueloLlegadaPasajeros && comp.vueloLlegadaPasajeros.filter(id => id.startsWith("M-")).length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Menores acompañantes:</span>
                    <div className="text-[10px] text-[#56B7A9] font-extrabold">
                      {comp.vueloLlegadaPasajeros.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-white/5 rounded-lg border border-[#56B7A9]/20 space-y-1">
                <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider block">Regreso</span>
                <div><Label>Aerolínea:</Label> <Val>{comp.vueloRegresoAerolinea || "Terrestre"}</Val></div>
                {comp.vueloRegresoAerolinea !== "Terrestre" && (
                  <div><Label>No. Vuelo:</Label> <Val>{comp.vueloRegresoNoVuelo || "N/A"}</Val></div>
                )}
                <div><Label>Fecha:</Label> <Val>{comp.vueloRegresoFecha || "N/A"}</Val></div>
                <div><Label>Hora:</Label> <Val>{comp.vueloRegresoHora || "N/A"}</Val></div>
                {/* Minors with companion on departure */}
                {comp.vueloRegresoPasajeros && comp.vueloRegresoPasajeros.filter(id => id.startsWith("M-")).length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Menores acompañantes:</span>
                    <div className="text-[10px] text-[#56B7A9] font-extrabold">
                      {comp.vueloRegresoPasajeros.filter(id => id.startsWith("M-")).map(id => getPassengerName(id)).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100">
      <div>
        <h3 className={`text-lg font-black flex items-center gap-2 ${t.textTitle}`}>
          <FileText className="w-5 h-5 text-blue-500" />
          Resumen de Registro
        </h3>
        <p className={`text-xs mt-0.5 ${t.textMuted}`}>
          Por favor revisa cuidadosamente toda la información antes de guardar y finalizar tu registro.
        </p>
      </div>

      {draftSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-xl text-center flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>¡Borrador de registro guardado con éxito! Podrás completarlo en cualquier inicio de sesión posterior.</span>
        </div>
      )}

      {/* Grid containing the cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Información del Titular (incluyendo requerimientos de hospedaje) */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9]`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-[#56B7A9]" />
            <span>1. Información del Titular y Hospedaje</span>
          </div>
          <div className="space-y-2.5">
            <div>
              <Label>Nombre completo:</Label> 
              <Val>{nombreTitular} {apellidosTitular}</Val>
            </div>
            <div>
              <Label>Grupo / Razón Social:</Label> 
              <Val>{grupo}</Val>
            </div>
            <div>
              <Label>Distribuidora:</Label> 
              <Val>{distribuidora}</Val>
            </div>
            <div>
              <Label>Contacto:</Label> 
              <Val>{correoTitular}</Val> • <Val>{celularTitular}</Val>
            </div>
            {alergiasTitular && (
              <div>
                <Label>Alergias / Restricciones:</Label> 
                <Val>{alergiasTitular}</Val>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Detalles de Hospedaje Sede</span>
              <div>
                <Label>Tipo de carnet:</Label> 
                <Val>{carnetTipoHabitacion}</Val>
              </div>
              <div>
                <Label>Configuración de cama:</Label> 
                <Val>{configuracionHabitacion}</Val>
              </div>
              <div>
                <Label>Noches adicionales:</Label> 
                <Val>{nochesAdicionales || 0} noche(s)</Val>
              </div>
              {requerimientosAdicionales && (
                <div className="mt-1.5 p-2.5 bg-slate-500/5 rounded-xl border border-slate-350 dark:border-slate-800">
                  <Label>Requerimientos especiales / Comentarios:</Label>
                  <p className="mt-1 text-slate-700 dark:text-slate-300 font-medium text-xs leading-relaxed">
                    {requerimientosAdicionales}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Información del Acompañante y Menores */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9]`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#56B7A9]" />
            <span>2. Acompañantes y Menores</span>
          </div>
          <div className="space-y-4">
            {hasCompanion && companionsList.length > 0 ? (
              <div className="space-y-2.5">
                <span className="font-bold text-slate-500 text-[10px] uppercase block tracking-wider">Acompañante Adulto:</span>
                {companionsList.slice(0, 1).map((comp) => (
                  <div key={comp.id} className="pl-3 border-l-2 border-[#56B7A9] py-1 space-y-1 bg-slate-500/5 rounded-r-xl p-2">
                    <div>
                      <Label>Nombre:</Label> 
                      <Val>{comp.firstName} {comp.lastName}</Val>
                    </div>
                    <div>
                      <Label>Parentesco:</Label> 
                      <Val>{comp.relationship}</Val>
                    </div>
                    {comp.allergies && (
                      <div>
                        <Label>Alergias:</Label> 
                        <Val>{comp.allergies}</Val>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {numMinors > 0 ? (
              <div className="space-y-2.5 pt-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase block tracking-wider">
                  Menores de edad (Cantidad: {numMinors}):
                </span>
                {minors.slice(0, numMinors).map((m, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-[#56B7A9] py-1 space-y-1 bg-slate-500/5 rounded-r-xl p-2">
                    <div>
                      <Label>Menor #{idx + 1}:</Label> 
                      <Val>{(m.name || m.lastName) ? `${m.name || ""} ${m.lastName || ""}`.trim() : `Menor #${idx + 1}`}</Val>
                    </div>
                    <div>
                      <Label>Edad:</Label> 
                      <Val>{m.age} años</Val>
                    </div>
                    {m.allergies && (
                      <div>
                        <Label>Alergias / Restricciones:</Label> 
                        <Val>{m.allergies}</Val>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {!hasCompanion && numMinors === 0 && (
              <div className="text-slate-500 italic py-6 text-center">
                Sin acompañantes o menores registrados.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Resumen de Vuelos / Itinerario de Viaje */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] md:col-span-2`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Plane className="w-4 h-4 text-[#56B7A9]" />
            <span>3. Itinerario de Vuelos de Llegada y Salida</span>
          </div>
          <div className="space-y-1">
            {renderFlightsSummary()}
          </div>
        </div>

        {/* Card 4: Contenido de Cuenta (Datos de acceso) */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9]`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-[#56B7A9]" />
            <span>4. Contenido de Cuenta</span>
          </div>
          <div className="space-y-3 bg-slate-500/5 p-4 rounded-xl border border-dashed border-[#56B7A9]/30">
            <p className="text-xs text-slate-500 leading-relaxed mb-1">
              Estos son tus datos de acceso para ingresar a la App oficial de la Convención ADISTEM 2026.
            </p>
            <div className="space-y-2">
              <div>
                <Label>Usuario / Correo:</Label> 
                <Val>{activeAccessUser?.email || correoTitular || "No disponible"}</Val>
              </div>
              <div>
                <Label>Contraseña de acceso:</Label> 
                <Val>{activeAccessUser?.password || "••••••••"}</Val>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Políticas de Cancelación */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9]`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#56B7A9]" />
            <span>5. Política de Cancelación</span>
          </div>
          <div className="space-y-3 p-4 bg-rose-500/5 rounded-xl border border-rose-500/10 text-rose-800 dark:text-rose-300">
            <p className="font-bold">• Cancelación sin costo antes del 15 de Octubre de 2026.</p>
            <p className="font-bold">• Cargos del 50% de la estadía por cancelaciones extemporáneas.</p>
            <p className="font-bold">• Cargo total (No-Show) por inasistencias no notificadas.</p>
          </div>
        </div>

        {/* Card 6: Datos de Depósito / Transferencia Bancaria */}
        <div className={`${t.section} p-5 rounded-2xl space-y-4 shadow-xs border border-[#56B7A9] md:col-span-2`}>
          <div className="font-black text-[#56B7A9] uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Save className="w-4 h-4 text-[#56B7A9]" />
            <span>6. Datos de Depósito o Transferencia Bancaria</span>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Si registraste noches adicionales de hospedaje, por favor realiza tu pago mediante depósito o transferencia electrónica con los siguientes datos bancarios:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#56B7A9]/10 p-4 rounded-xl border border-[#56B7A9]/30">
              <div className="space-y-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <div>
                  <Label>Banco:</Label> 
                  <Val>Banamex</Val>
                </div>
                <div>
                  <Label>Titular de Cuenta:</Label> 
                  <Val>ADISTEM, A.C.</Val>
                </div>
                <div>
                  <Label>Sucursal:</Label> 
                  <Val>7012</Val>
                </div>
              </div>
              <div className="space-y-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <div>
                  <Label>Número de Cuenta:</Label> 
                  <Val>1234567</Val>
                </div>
                <div>
                  <Label>CLABE Interbancaria:</Label> 
                  <Val>002180701212345678</Val>
                </div>
                <div>
                  <Label>Referencia:</Label> 
                  <Val>{nombreTitular} {apellidosTitular}</Val>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#56B7A9] font-extrabold">
              * Una vez realizado el pago, envía tu comprobante por correo electrónico a pagos@adistem.org para confirmar tu reservación de noches adicionales.
            </p>
          </div>
        </div>

      </div>

      {/* Buttons Block */}
      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <div className="flex gap-2">
          <button 
            onClick={handlePrev}
            className={t.btnSec + " flex items-center gap-1.5 text-xs font-bold"}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>
          <button 
            onClick={handleSaveDraft}
            className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-extrabold rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Borrador</span>
          </button>
        </div>

        <button 
          onClick={handleSaveRegistration}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-2 animate-pulse"
        >
          <Save className="w-4 h-4" />
          <span>{loggedGuest ? "Guardar y Finalizar" : "Completar y Finalizar"}</span>
        </button>
      </div>
    </div>
  );
}
