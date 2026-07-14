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
  handlePrev
}: CompanionsStepProps) {
  const reqStar = <span className="text-rose-500 font-extrabold text-sm ml-0.5">*</span>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
          <Users className="w-5 h-5 text-blue-500" />
          Paso 3: Registro de Acompañantes y Menores
        </h3>
        <p className={`text-xs mt-0.5 ${t.textMuted}`}>
          Agrega a tus familiares que viajarán contigo. Los adultos influyen en el tipo de habitación. Se permite un máximo de 3 adultos acompañantes sin menores, o hasta 2 adultos con un máximo de 2 menores.
        </p>
      </div>

      {/* Companion Toggle Switch */}
      <div className={`${t.section} flex items-center justify-between gap-4 transition-colors duration-300 border border-blue-500/15`}>
        <div>
          <p className={`text-xs font-bold ${t.textHeading}`}>¿Viajas con acompañante(s) adulto(s)?</p>
          <p className={`text-[11px] ${t.textMuted}`}>Puedes registrar un máximo de 3 adultos acompañantes.</p>
        </div>
        <button 
          onClick={handleToggleCompanion}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
            hasCompanion 
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
          }`}
        >
          {hasCompanion ? "Remover Todos" : "Agregar Acompañante"}
        </button>
      </div>

      {/* Companions List Loop */}
      <AnimatePresence>
        {hasCompanion && (
          <div className="space-y-4">
            {companionsList.map((comp, idx) => (
              <motion.div 
                key={comp.id}
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className={`${t.infoCard} border-2 border-blue-500/10 transition-colors duration-300 overflow-hidden space-y-4 bg-slate-500/5`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50 dark:border-slate-800">
                  <h4 className={`font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
                    <Users className="w-4 h-4" />
                    Acompañante Adulto #{idx + 1}
                  </h4>
                  {companionsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompanionItem(comp.id)}
                      className="text-rose-500 hover:text-rose-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  )}
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
                      className={`${t.inputWhite} transition-colors duration-300 font-medium`}
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
                      className={`${t.inputWhite} transition-colors duration-300 font-medium`}
                    />
                  </div>

                  <div>
                    <label className={`block font-bold uppercase mb-1 ${t.label}`}>
                      Parentesco {reqStar}
                    </label>
                    <select 
                      value={comp.relationship}
                      onChange={e => updateCompanionItem(comp.id, "relationship", e.target.value)}
                      className={`w-full p-2.5 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-800 border-slate-700 text-slate-100" 
                          : "bg-white border-slate-200 text-slate-700"
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
                      className={`${t.inputWhite} transition-colors duration-300`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {companionsList.length < (numMinors > 0 ? 2 : 3) && (
              <button
                type="button"
                onClick={addCompanionItem}
                className="w-full py-3 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-500/30 font-black text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Agregar Otro Acompañante Adulto
              </button>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Minors section */}
      <div className="space-y-4">
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-t pt-4 ${t.border}`}>
          <div>
            <p className={`text-xs font-bold ${t.textHeading}`}>¿Viajas con menores de edad?</p>
            <p className={`text-[11px] ${t.textMuted}`}>Máximo 2 menores. No se permite registrar menores si ya hay 3 adultos registrados.</p>
          </div>

          {companionsList.length >= 3 ? (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-500 font-semibold max-w-sm">
              Límite de ocupación alcanzado (3 adultos). No se permite registrar menores de edad en esta configuración de hospedaje.
            </div>
          ) : (
            <select 
              value={numMinors}
              onChange={e => handleMinorCountChange(Number(e.target.value))}
              className={`p-2 border text-xs font-bold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                isDarkMode 
                  ? "bg-slate-850 border-slate-800 text-slate-100" 
                  : "bg-slate-50 border-slate-200 text-slate-700"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block font-bold mb-0.5 ${t.label}`}>
                  Edad {reqStar}
                </label>
                <input 
                  type="number"
                  value={minor.age}
                  min={1}
                  max={17}
                  required
                  onChange={e => handleMinorFieldChange(idx, "age", Number(e.target.value))}
                  className={`${t.inputWhiteS} transition-colors duration-300`}
                />
              </div>
              <div>
                <label className={`block font-bold mb-0.5 ${t.label}`}>Alergias del Menor</label>
                <input 
                  type="text"
                  value={minor.allergies}
                  onChange={e => handleMinorFieldChange(idx, "allergies", e.target.value)}
                  placeholder="Ej. Lactosa, polen o ninguna"
                  className={`${t.inputWhiteS} transition-colors duration-300`}
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
          <span>Siguiente: Aerolíneas / Transporte</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
