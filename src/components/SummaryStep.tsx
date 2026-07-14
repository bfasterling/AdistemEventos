import React from "react";
import { FileText, ChevronLeft, Save, CheckCircle } from "lucide-react";

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
}

export default function SummaryStep({
  t,
  isDarkMode,
  draftSuccess,
  carnetTipoHabitacion,
  configuracionHabitacion,
  nochesAdicionales,
  requerimientosAdicionales,
  calculateTotalHotelCost,
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
  selectedActivities,
  DataStore,
  handlePrev,
  handleSaveDraft,
  handleSaveRegistration,
  loggedGuest
}: SummaryStepProps) {
  
  // Custom helper component to render user-captured values with authorized green color and NO background
  const Val = ({ children }: { children: React.ReactNode }) => (
    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm md:text-base inline-block mx-1 leading-normal transition-all">
      {children}
    </span>
  );

  // Label helper to lower the title font size and make it highly scannable
  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 select-none">
      {children}
    </span>
  );

  return (
    <div className="space-y-6 text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100">
      <div>
        <h3 className={`text-xl font-black flex items-center gap-2 ${t.textTitle}`}>
          <FileText className="w-5.5 h-5.5 text-blue-500" />
          Paso 6: Resumen de Registro y Confirmación Oficial
        </h3>
        <p className={`text-xs mt-1 ${t.textMuted}`}>
          Valida detalladamente toda la información capturada en las etapas anteriores antes de proceder a la confirmación oficial.
        </p>
      </div>

      {draftSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-xl text-sm text-center flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>¡Borrador de registro guardado con éxito! Podrás completarlo en cualquier inicio de sesión posterior.</span>
        </div>
      )}

      {/* Summary Block Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Hotel Summary */}
        <div className={`${t.section} p-5 rounded-2xl space-y-3.5 shadow-xs border border-slate-200 dark:border-slate-800`}>
          <span className="font-black text-blue-500 uppercase text-xs tracking-wider block border-b pb-2 flex justify-between">
            <span>🏨 Hospedaje Sede</span>
            <span className="text-emerald-500 font-black text-sm md:text-base bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">${calculateTotalHotelCost().toLocaleString()} MXN</span>
          </span>
          <div className="space-y-2.5">
            <div>
              <Label>Habitación Sede:</Label> 
              <Val>{carnetTipoHabitacion}</Val>
            </div>
            <div>
              <Label>Configuración de Cama:</Label> 
              <Val>{configuracionHabitacion === "King" ? "1 Cama King Size" : "2 Camas Queen Size"}</Val>
            </div>
            <div>
              <Label>Noches adicionales:</Label> 
              <Val>{nochesAdicionales || 0} noche(s)</Val>
            </div>
            {requerimientosAdicionales && (
              <div className="pt-1.5">
                <Label>Comentarios / Requerimientos:</Label> 
                <div className="mt-1 p-2 bg-slate-500/5 rounded-lg border border-slate-300/10 text-slate-700 dark:text-slate-300 font-medium text-xs md:text-sm">
                  {requerimientosAdicionales}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Titular Summary */}
        <div className={`${t.section} p-5 rounded-2xl space-y-3.5 shadow-xs border border-slate-200 dark:border-slate-800`}>
          <span className="font-black text-blue-500 uppercase text-xs tracking-wider block border-b pb-2">
            👤 Invitado Titular
          </span>
          <div className="space-y-2.5">
            <div>
              <Label>Nombre:</Label> 
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
          </div>
        </div>

        {/* Companions Summary */}
        <div className={`${t.section} p-5 rounded-2xl space-y-3 md:col-span-2 shadow-xs border border-slate-200 dark:border-slate-800`}>
          <span className="font-black text-blue-500 uppercase text-xs tracking-wider block border-b pb-2">
            👥 Acompañantes y Menores Registrados
          </span>
          <div className="space-y-3">
            {hasCompanion && companionsList.length > 0 ? (
              <div className="space-y-2">
                <span className="font-bold text-slate-500 text-xs uppercase block">Adultos:</span>
                {companionsList.map((comp, idx) => (
                  <div key={comp.id} className="pl-3 border-l-2 border-blue-500 py-1.5 space-y-1 bg-slate-500/5 rounded-r-lg flex flex-wrap items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400 mr-2 text-xs">#{idx + 1}:</span> 
                    <Val>{comp.firstName} {comp.lastName}</Val>
                    <span className="mx-2 text-slate-400">•</span>
                    <Label>Parentesco:</Label> 
                    <Val>{comp.relationship}</Val>
                    <span className="mx-2 text-slate-400">•</span>
                    <Label>Alergias:</Label> 
                    <Val>{comp.allergies || "Ninguna"}</Val>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic">Sin acompañantes adultos registrados.</div>
            )}

            {numMinors > 0 ? (
              <div className="space-y-2 pt-1 font-sans">
                <span className="font-bold text-slate-500 text-xs uppercase block">Menores de edad:</span>
                {minors.map((m, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-blue-500 py-1.5 space-y-1 bg-slate-500/5 rounded-r-lg flex flex-wrap items-center">
                    <span className="font-bold text-slate-600 dark:text-slate-400 mr-2 text-xs">Menor #{idx + 1}:</span> 
                    <Label>Edad:</Label> 
                    <Val>{m.age} años</Val>
                    <span className="mx-2 text-slate-400">•</span>
                    <Label>Alergias:</Label> 
                    <Val>{m.allergies || "Ninguna"}</Val>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic">Sin menores registrados.</div>
            )}
          </div>
        </div>

        {/* Logistics Summary */}
        <div className={`${t.section} p-5 rounded-2xl space-y-3 md:col-span-2 shadow-xs border border-slate-200 dark:border-slate-800`}>
          <span className="font-black text-blue-500 uppercase text-xs tracking-wider block border-b pb-2">
            ✈ Itinerario de Vuelos / Transporte
          </span>
          {hasFlights ? (
            <div className="space-y-3">
              {!vuelosSeparados ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-500/5 p-4 rounded-xl border border-slate-500/10 space-y-2">
                    <strong className="text-emerald-500 text-xs block uppercase tracking-wider mb-1">Llegada Unificada</strong>
                    <div>
                      <Label>Aerolínea:</Label> 
                      <Val>{vueloLlegadaAerolinea}</Val>
                    </div>
                    <div>
                      <Label>Vuelo/Matrícula:</Label> 
                      <Val>{vueloLlegadaNoVuelo || "N/A"}</Val>
                    </div>
                    <div>
                      <Label>Fecha y Hora:</Label> 
                      <Val>{vueloLlegadaFecha}</Val> a las <Val>{vueloLlegadaHora}</Val>
                    </div>
                  </div>
                  <div className="bg-slate-500/5 p-4 rounded-xl border border-slate-500/10 space-y-2">
                    <strong className="text-blue-500 text-xs block uppercase tracking-wider mb-1">Salida Unificada</strong>
                    <div>
                      <Label>Aerolínea:</Label> 
                      <Val>{vueloRegresoAerolinea}</Val>
                    </div>
                    <div>
                      <Label>Vuelo/Matrícula:</Label> 
                      <Val>{vueloRegresoNoVuelo || "N/A"}</Val>
                    </div>
                    <div>
                      <Label>Fecha y Hora:</Label> 
                      <Val>{vueloRegresoFecha}</Val> a las <Val>{vueloRegresoHora}</Val>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-500/5 rounded-xl border border-blue-500/10 space-y-2">
                    <span className="font-bold block uppercase text-xs text-blue-500 tracking-wider mb-1">Titular</span>
                    <div>
                      <Label>Llegada:</Label> 
                      <Val>{vueloLlegadaAerolinea}</Val> (<Val>{vueloLlegadaNoVuelo || "N/A"}</Val>) el <Val>{vueloLlegadaFecha}</Val> a las <Val>{vueloLlegadaHora}</Val>
                    </div>
                    <div>
                      <Label>Regreso:</Label> 
                      <Val>{vueloRegresoAerolinea}</Val> (<Val>{vueloRegresoNoVuelo || "N/A"}</Val>) el <Val>{vueloRegresoFecha}</Val> a las <Val>{vueloRegresoHora}</Val>
                    </div>
                  </div>
                  {companionsList.map((comp, idx) => (
                    <div key={comp.id} className="p-4 bg-slate-500/5 rounded-xl border border-slate-300/10 space-y-2">
                      <span className="font-bold block uppercase text-xs text-blue-500 tracking-wider font-sans mb-1">Acompañante #{idx+1}: {comp.firstName}</span>
                      <div>
                        <Label>Llegada:</Label> 
                        <Val>{comp.vueloLlegadaAerolinea || "N/A"}</Val> (<Val>{comp.vueloLlegadaNoVuelo || "N/A"}</Val>) el <Val>{comp.vueloLlegadaFecha}</Val> a las <Val>{comp.vueloLlegadaHora}</Val>
                      </div>
                      <div>
                        <Label>Regreso:</Label> 
                        <Val>{comp.vueloRegresoAerolinea || "N/A"}</Val> (<Val>{comp.vueloRegresoNoVuelo || "N/A"}</Val>) el <Val>{comp.vueloRegresoFecha}</Val> a las <Val>{comp.vueloRegresoHora}</Val>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-rose-500 font-extrabold italic bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
              Vuelos pendientes de registrar. Podrás capturarlos después de forma directa.
            </div>
          )}
        </div>

        {/* Activities Summary */}
        <div className={`${t.section} p-5 rounded-2xl space-y-3 md:col-span-2 shadow-xs border border-slate-200 dark:border-slate-800`}>
          <span className="font-black text-blue-500 uppercase text-xs tracking-wider block border-b pb-2">
            🏌 Actividades Exclusivas Seleccionadas
          </span>
          <div className="space-y-3">
            {/* Titular selected activities */}
            <div>
              <Label>Para {nombreTitular}:</Label>
              {selectedActivities.length > 0 ? (
                <ul className="list-disc pl-5 mt-1.5 space-y-1.5 font-sans">
                  {DataStore.getActivities().filter((a: any) => selectedActivities.includes(a.id)).map((act: any) => (
                    <li key={act.id} className="font-extrabold text-blue-700 dark:text-blue-400">
                      <Val>{act.title}</Val> (<Val>{act.dateTime}</Val>) {act.registeredCount >= act.capacity && <span className="text-amber-500 text-xs font-extrabold uppercase ml-1">(Lista de Espera)</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500 italic ml-1 text-sm">Ninguna seleccionada</span>
              )}
            </div>

            {/* Companions selected activities */}
            {hasCompanion && companionsList.map((comp, idx) => (
              <div key={comp.id} className="pt-2.5 border-t border-slate-250 dark:border-slate-800">
                <Label>Para {comp.firstName} (Acompañante #{idx+1}):</Label>
                {comp.selectedActivities && comp.selectedActivities.length > 0 ? (
                  <ul className="list-disc pl-5 mt-1.5 space-y-1.5 font-sans">
                    {DataStore.getActivities().filter((a: any) => comp.selectedActivities?.includes(a.id)).map((act: any) => (
                      <li key={act.id} className="font-extrabold text-blue-700 dark:text-blue-400">
                        <Val>{act.title}</Val> (<Val>{act.dateTime}</Val>) {act.registeredCount >= act.capacity && <span className="text-amber-500 text-xs font-extrabold uppercase ml-1">(Lista de Espera)</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-500 italic ml-1 font-sans text-sm">Ninguna seleccionada</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Info & Cancellation Policy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* Payment box with improved accessibility / color contrast */}
        <div className="p-5 bg-blue-500/5 dark:bg-slate-900/40 rounded-2xl border border-blue-500/20 space-y-2.5 shadow-xs text-slate-800 dark:text-slate-200">
          <span className="font-black text-blue-600 dark:text-blue-400 uppercase text-xs tracking-wider block border-b border-blue-500/10 pb-1.5">💳 Datos de Cuenta para Pagos Adicionales</span>
          <p className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100">• Titular: <span className="font-extrabold text-blue-600 dark:text-blue-400">ADISTEM S.A. DE C.V.</span></p>
          <p className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100">• Banco: <span className="font-extrabold text-blue-600 dark:text-blue-400">BBVA México</span></p>
          <p className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100">• Cuenta CLABE: <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">0121 8000 1234 5678 90</span></p>
          <p className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100">• Concepto: <span className="font-extrabold text-blue-600 dark:text-blue-400">Stellantis Convención [{nombreTitular || "ID"}]</span></p>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2.5">Una vez realizado tu pago de noches adicionales, sube tu comprobante en la sección de mis compras.</p>
        </div>

        <div className="p-5 bg-rose-500/5 dark:bg-rose-950/20 rounded-2xl border border-rose-500/15 space-y-1.5 text-rose-800 dark:text-rose-300">
          <span className="font-black uppercase text-xs tracking-wider block border-b border-rose-500/10 pb-1.5 text-rose-600 dark:text-rose-400">⚠ Políticas de Cancelación</span>
          <p className="text-xs md:text-sm font-bold">• Cancelación sin costo antes del 15 de Octubre de 2026.</p>
          <p className="text-xs md:text-sm font-bold">• Cargos del 50% de la estadía por cancelaciones extemporáneas.</p>
          <p className="text-xs md:text-sm font-bold">• Cargo total (No-Show) por inasistencias no notificadas.</p>
        </div>
      </div>

      {/* Wizard Bottom buttons */}
      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <div className="flex gap-2">
          <button 
            onClick={handlePrev}
            className={t.btnSec + " flex items-center gap-1.5 text-sm font-bold"}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>
          <button 
            onClick={handleSaveDraft}
            className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-extrabold rounded-xl transition cursor-pointer text-sm flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Borrador</span>
          </button>
        </div>

        <button 
          onClick={handleSaveRegistration}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition cursor-pointer text-sm flex items-center gap-2 animate-pulse"
        >
          <Save className="w-4 h-4" />
          <span>{loggedGuest ? "Guardar y Actualizar Cambios" : "Completar mi Registro Oficial"}</span>
        </button>
      </div>
    </div>
  );
}
