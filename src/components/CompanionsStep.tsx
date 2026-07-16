import React from "react";
import { Users, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface CompanionsStepProps {
  t: any;
  isDarkMode: boolean;
  hasCompanion: boolean;
  handleToggleCompanion: () => void;
  companionsList: Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    sex: string;
    allergies: string;
    ineAttached: boolean;
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
  removeCompanionItem: (id: string) => void;
  addCompanionItem: () => void;
  updateCompanionItem: (id: string, field: string, val: any) => void;
  numMinors: number;
  handleMinorCountChange: (count: number) => void;
  minors: Array<{ name: string; lastName: string; age: number; sex: string; allergies: string }>;
  handleMinorFieldChange: (idx: number, field: string, val: any) => void;
  handleNext: () => void;
  handlePrev: () => void;
  carnetTipoHabitacion?: string;
}

export default function CompanionsStep({
  t,
  isDarkMode,
  hasCompanion,
  handleToggleCompanion,
  companionsList,
  removeCompanionItem,
  addCompanionItem,
  updateCompanionItem,
  numMinors,
  handleMinorCountChange,
  minors,
  handleMinorFieldChange,
  handleNext,
  handlePrev,
  carnetTipoHabitacion
}: CompanionsStepProps) {
  const reqStar = <span className="text-rose-500 font-extrabold text-sm ml-0.5">*</span>;

  const isSencillo = carnetTipoHabitacion === "Sencillo" || carnetTipoHabitacion === "Sencilla" || carnetTipoHabitacion === "Sencillo Extra" || carnetTipoHabitacion === "Sencilla Extra" || (!!carnetTipoHabitacion && carnetTipoHabitacion.startsWith("Sencilla"));

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
          <Users className="w-5 h-5 text-blue-500" />
          Paso 3: Registro de Acompañantes y Menores
        </h3>
      </div>

      {/* Companion Toggle Switch */}
      <div className={`${t.section} flex items-center justify-between gap-4 transition-colors duration-300 border border-[#56B7A9]`}>
        <div>
          <p className={`text-xs font-bold ${t.textHeading}`}>¿Viajas con acompañante(s) adulto(s)?</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { 
              if (isSencillo) return;
              if (hasCompanion) handleToggleCompanion(); 
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              !hasCompanion
                ? "bg-[#56B7A9] text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            No
          </button>
          <button
            type="button"
            disabled={isSencillo}
            onClick={() => { 
              if (isSencillo) return;
              if (!hasCompanion) handleToggleCompanion(); 
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              isSencillo
                ? "bg-slate-200 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                : hasCompanion
                  ? "bg-[#56B7A9] text-white cursor-pointer"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
            }`}
          >
            Si
          </button>
        </div>
      </div>

      {isSencillo && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-550/10 border border-amber-500/30 rounded-2xl text-xs font-medium text-amber-800 dark:text-amber-200 flex items-start gap-2.5 transition-colors duration-300"
        >
          <span className="text-base leading-none">⚠️</span>
          <div>
            <p className="font-extrabold mb-0.5 text-amber-700 dark:text-amber-400">Carnet Sencillo Seleccionado</p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              No es posible registrar acompañantes adultos con un carnet de tipo <strong>Sencillo</strong>. Si deseas agregar un acompañante, por favor regresa al paso anterior (<strong>Paso 1: Elección de Carnet</strong>) en la sección de Hospedaje y selecciona un carnet <strong>Doble</strong>.
            </p>
          </div>
        </motion.div>
      )}

      {/* Companions List Loop */}
      <AnimatePresence>
        {hasCompanion && (
          <div className="space-y-4">
            {companionsList.slice(0, 1).map((comp, idx) => (
              <motion.div 
                key={comp.id}
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className={`${t.infoCard} border-2 border-[#56B7A9] transition-colors duration-300 overflow-hidden space-y-4 bg-slate-500/5`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                  <h4 className={`font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
                    <Users className="w-4 h-4" />
                    Acompañante Adulto
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block font-bold uppercase mb-1 ${t.label}`}>
                      Nombre(s) {reqStar}
                    </label>
                    <input 
                      type="text"
                      value={comp.firstName}
                      onChange={e => updateCompanionItem(comp.id, "firstName", e.target.value)}
                      placeholder="Nombres del acompañante"
                      className="w-full p-2.5 bg-transparent border border-[#56B7A9] rounded-xl text-xs font-medium transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className={`block font-bold uppercase mb-1 ${t.label}`}>
                      Apellidos {reqStar}
                    </label>
                    <input 
                      type="text"
                      value={comp.lastName}
                      onChange={e => updateCompanionItem(comp.id, "lastName", e.target.value)}
                      placeholder="Apellidos del acompañante"
                      className="w-full p-2.5 bg-transparent border border-[#56B7A9] rounded-xl text-xs font-medium transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className={`block font-bold uppercase mb-1 ${t.label}`}>
                      Parentesco {reqStar}
                    </label>
                    <select 
                      value={comp.relationship}
                      onChange={e => updateCompanionItem(comp.id, "relationship", e.target.value)}
                      className={`w-full p-2.5 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-800 text-slate-100" 
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <option value="Esposo/a">Esposo/a</option>
                      <option value="Cónyuge">Cónyuge</option>
                      <option value="Hijo/a">Hijo/a</option>
                      <option value="Padre/Madre">Padre/Madre</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Amigo/a">Amigo/a</option>
                      <option value="Socio/a">Socio/a</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block font-bold uppercase mb-1 ${t.label}`}>
                      Sexo {reqStar}
                    </label>
                    <div className="flex gap-4 mt-2 font-semibold">
                      <label className={`flex items-center gap-1.5 cursor-pointer ${t.radioLabel}`}>
                        <input 
                          type="radio" 
                          name={`sexoAcompanante-${comp.id}`} 
                          checked={comp.sex === "M"} 
                          onChange={() => updateCompanionItem(comp.id, "sex", "M")} 
                          className="accent-blue-500" 
                        />
                        Masculino
                      </label>
                      <label className={`flex items-center gap-1.5 cursor-pointer ${t.radioLabel}`}>
                        <input 
                          type="radio" 
                          name={`sexoAcompanante-${comp.id}`} 
                          checked={comp.sex === "F"} 
                          onChange={() => updateCompanionItem(comp.id, "sex", "F")} 
                          className="accent-blue-500" 
                        />
                        Femenino
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block font-bold uppercase mb-1 ${t.label}`}>Alergias o Restricciones Alimenticias</label>
                    <input 
                      type="text"
                      value={comp.allergies}
                      onChange={e => updateCompanionItem(comp.id, "allergies", e.target.value)}
                      placeholder="Ninguna o alergias específicas"
                      className="w-full p-2.5 bg-transparent border border-[#56B7A9] rounded-xl text-xs font-medium transition-colors duration-300"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Minors section */}
      <div className="space-y-4">
        <div className="p-4 bg-[#56B7A9]/10 rounded-xl border border-[#56B7A9]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className={`text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide`}>¿Viajas con menores de edad?</p>
            <p className={`text-[11px] ${t.textMuted}`}>Máximo 2 menores.</p>
          </div>
 
          {companionsList.length >= 3 ? (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-500 font-semibold max-w-sm">
              Límite de ocupación alcanzado (3 adultos). No se permite registrar menores de edad en esta configuración de hospedaje.
            </div>
          ) : (
            <select 
              value={numMinors}
              onChange={e => handleMinorCountChange(Number(e.target.value))}
              className={`p-2 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-850 text-slate-100" 
                  : "bg-white text-slate-700"
              }`}
            >
              <option value={0}>Sin menores</option>
              <option value={1}>1 menor</option>
              <option value={2}>2 menores</option>
            </select>
          )}
        </div>
 
        {companionsList.length < 3 && minors.map((minor, idx) => (
          <div key={idx} className={`${t.section} border-l-4 border-blue-500 space-y-3 text-xs transition-colors duration-300`}>
            <p className={`font-black text-[11px] uppercase tracking-wider ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
              Menor #{idx + 1}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className={`block font-bold mb-0.5 ${t.label}`}>
                  Edad {reqStar}
                </label>
                <select 
                  value={minor.age}
                  required
                  onChange={e => handleMinorFieldChange(idx, "age", Number(e.target.value))}
                  className={`w-full p-2.5 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                    isDarkMode 
                      ? "bg-slate-800 text-slate-100" 
                      : "bg-white text-slate-700"
                  }`}
                >
                  <option value={0}>0-11 meses</option>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? "año" : "años"}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={`block font-bold mb-0.5 ${t.label}`}>Alergias del Menor</label>
                <input 
                  type="text"
                  value={minor.allergies}
                  onChange={e => handleMinorFieldChange(idx, "allergies", e.target.value)}
                  placeholder="Ej. Lactosa, polen o ninguna"
                  className={`w-full p-2.5 border border-[#56B7A9] text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl ${
                    isDarkMode 
                      ? "bg-slate-800 text-slate-100" 
                      : "bg-white text-slate-800"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <button 
          onClick={handlePrev}
          className={t.btnSec + " flex items-center gap-1.5"}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        <button 
          onClick={handleNext}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
        >
          <span>Siguiente: Itinerario de viaje</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
