import React from "react";
import { Users, Trash2, Plus, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
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
  minors: Array<{ name: string; lastName: string; age: number; sex: string; allergies: string; tipo?: 'adult' | 'minor'; parentezco?: string }>;
  handleMinorFieldChange: (idx: number, fieldOrObj: string | Record<string, any>, val?: any) => void;
  handleNext: () => void;
  handlePrev: () => void;
  carnetTipoHabitacion?: string;
  configuracionHabitacion?: string;
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
  carnetTipoHabitacion,
  configuracionHabitacion
}: CompanionsStepProps) {
  const reqStar = <span className="text-red-500 font-extrabold text-sm ml-0.5">*</span>;

  const isSencillo = carnetTipoHabitacion === "Sencillo" || carnetTipoHabitacion === "Sencilla" || carnetTipoHabitacion === "Sencillo Extra" || carnetTipoHabitacion === "Sencilla Extra" || (!!carnetTipoHabitacion && carnetTipoHabitacion.startsWith("Sencilla"));

  const isDoble = !!carnetTipoHabitacion && carnetTipoHabitacion.toLowerCase().includes("doble");
  const isQueenQueen = !!configuracionHabitacion && configuracionHabitacion.toLowerCase().includes("queen");
  const isDobleQueenQueen = isDoble && isQueenQueen;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl md:text-2xl font-extrabold flex items-center gap-2.5 ${t.textTitle}`}>
          <Users className="w-6 h-6 text-blue-500" />
          Paso 3: Registro de Acompañantes y Menores
        </h3>
      </div>

      {/* Companion Toggle Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 border-2 border-[#56B7A9]/40 bg-[#56B7A9]/10 dark:bg-[#56B7A9]/10 p-5 rounded-2xl">
        <div>
          <p className={`text-sm md:text-base font-extrabold ${t.textHeading} uppercase`}>¿VIAJAS CON ACOMPAÑANTE(S) ADULTO(S)?</p>
          <p className={`text-xs md:text-sm mt-1 font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Se consideran menores de edad de 0 a 17 años (a partir de los 18 años se registran como adultos).
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { 
              if (isSencillo) return;
              if (hasCompanion) handleToggleCompanion(); 
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-black transition cursor-pointer ${
              !hasCompanion
                ? "bg-red-500 text-white shadow-xs"
                : "bg-slate-500 dark:bg-slate-600 text-white"
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
            className={`px-5 py-2.5 rounded-lg text-sm font-black transition ${
              isSencillo
                ? "bg-slate-200 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                : hasCompanion
                  ? "bg-[#56B7A9] text-white cursor-pointer shadow-xs"
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
          className="p-4 bg-amber-550/10 border border-amber-500/30 rounded-2xl text-xs md:text-sm font-medium text-amber-800 dark:text-amber-200 flex items-start gap-2.5 transition-colors duration-300"
        >
          <span className="text-base md:text-lg leading-none">⚠️</span>
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
                key={(comp.id && !comp.id.startsWith("M-")) ? comp.id : `C-${idx + 1}`}
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className={`${t.infoCard} border-2 border-[#56B7A9] transition-colors duration-300 overflow-hidden space-y-4 bg-slate-500/5 p-5`}
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/50 dark:border-slate-800">
                  <h4 className={`font-black uppercase tracking-wider text-xs md:text-sm flex items-center gap-1.5 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
                    <Users className="w-5 h-5" />
                    Acompañante Adulto
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Nombre(s) {reqStar}
                    </label>
                    <input 
                      type="text"
                      value={comp.firstName || ""}
                      onChange={e => updateCompanionItem(comp.id, "firstName", e.target.value)}
                      onBlur={e => updateCompanionItem(comp.id, "firstName", e.target.value.toUpperCase())}
                      placeholder="Nombres del acompañante"
                      className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Apellidos {reqStar}
                    </label>
                    <input 
                      type="text"
                      value={comp.lastName || ""}
                      onChange={e => updateCompanionItem(comp.id, "lastName", e.target.value)}
                      onBlur={e => updateCompanionItem(comp.id, "lastName", e.target.value.toUpperCase())}
                      placeholder="Apellidos del acompañante"
                      className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Parentesco {reqStar}
                    </label>
                    <select 
                      value={comp.relationship || "Esposo/a"}
                      onChange={e => updateCompanionItem(comp.id, "relationship", e.target.value)}
                      className={`w-full p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-800 text-slate-100" 
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <option value="Esposo/a">Esposo/a</option>
                      <option value="Hijo/a">Hijo/a</option>
                      <option value="Padre/Madre">Padre/Madre</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Amigo/a">Amigo/a</option>
                      <option value="Socio/a">Socio/a</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Sexo {reqStar}
                    </label>
                    <div className="flex gap-6 mt-2.5 font-sans">
                      <label className={`flex items-center gap-2 font-bold cursor-pointer text-sm md:text-base ${t.radioLabel}`}>
                        <input 
                          type="radio" 
                          name={`sexoAcompanante-${comp.id}`} 
                          checked={comp.sex === "M"} 
                          onChange={() => updateCompanionItem(comp.id, "sex", "M")} 
                          className="accent-blue-500 w-4.5 h-4.5" 
                        />
                        Masculino
                      </label>
                      <label className={`flex items-center gap-2 font-bold cursor-pointer text-sm md:text-base ${t.radioLabel}`}>
                        <input 
                          type="radio" 
                          name={`sexoAcompanante-${comp.id}`} 
                          checked={comp.sex === "F"} 
                          onChange={() => updateCompanionItem(comp.id, "sex", "F")} 
                          className="accent-blue-500 w-4.5 h-4.5" 
                        />
                        Femenino
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Alergias o Restricciones del Acompañante
                    </label>
                    <input 
                      type="text"
                      value={comp.allergies || ""}
                      onChange={e => updateCompanionItem(comp.id, "allergies", e.target.value)}
                      onBlur={e => updateCompanionItem(comp.id, "allergies", e.target.value.toUpperCase())}
                      placeholder="Especifica alergias o restricciones (o 'Ninguna')"
                      className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* SECTION FOR ACOMPAÑANTES ADICIONALES (DOBLE QUEEN/QUEEN) OR MENOR DE EDAD (DOBLE KING) */}
      {!isSencillo && (
        <div className="space-y-4">
          {isDobleQueenQueen ? (
            /* DOBLE QUEEN/QUEEN: ACOMPAÑANTES ADICIONALES */
            <div className="p-5 bg-[#56B7A9]/10 dark:bg-[#56B7A9]/10 rounded-2xl border-2 border-[#56B7A9]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
              <div>
                <p className={`text-sm md:text-base font-extrabold uppercase tracking-wide ${isDarkMode ? "text-white" : "text-black"}`}>
                  ¿VIAJAS CON ACOMPAÑANTES ADICIONALES?
                </p>
                <p className={`text-xs md:text-sm mt-0.5 font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                  Máximo 2 acompañantes adicionales (adultos o menores de edad).
                </p>
              </div>

              <select 
                value={numMinors}
                onChange={e => handleMinorCountChange(Number(e.target.value))}
                className={`p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-850 text-slate-100" 
                    : "bg-white text-slate-700"
                }`}
              >
                <option value={0}>Sin acompañantes adicionales</option>
                <option value={1}>1 acompañante adicional</option>
                <option value={2}>2 acompañantes adicionales</option>
              </select>
            </div>
          ) : (
            /* DOBLE KING: MÁXIMO 1 MENOR DE EDAD */
            <div className="p-5 bg-[#56B7A9]/10 dark:bg-[#56B7A9]/10 rounded-2xl border-2 border-[#56B7A9]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
              <div>
                <p className={`text-sm md:text-base font-extrabold uppercase tracking-wide ${isDarkMode ? "text-white" : "text-black"}`}>
                  ¿VIAJAS CON UN MENOR DE EDAD?
                </p>
                <p className={`text-xs md:text-sm mt-0.5 font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                  En habitación Doble King Size se permite al titular, un acompañante adulto y máximo un (1) menor de edad.
                </p>
              </div>

              <select 
                value={numMinors > 1 ? 1 : numMinors}
                onChange={e => handleMinorCountChange(Number(e.target.value))}
                className={`p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                  isDarkMode 
                    ? "bg-slate-850 text-slate-100" 
                    : "bg-white text-slate-700"
                }`}
              >
                <option value={0}>Sin menores</option>
                <option value={1}>1 menor</option>
              </select>
            </div>
          )}

          {/* Cards for each adicional/minor */}
          {numMinors > 0 && minors.slice(0, isDobleQueenQueen ? 2 : 1).map((item, idx) => {
            const isAdult = item.tipo === "adult" || !item.tipo;
            const isMinor = item.tipo === "minor";

            if (isDobleQueenQueen) {
              return (
                <div key={idx} className={`${t.section} border-l-4 border-[#56B7A9] space-y-4 text-sm transition-colors duration-300 p-5 shadow-xs`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <p className={`font-black text-xs md:text-sm uppercase tracking-wider ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                      Acompañante Adicional #{idx + 1}
                    </p>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isAdult ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"}`}>
                      {isAdult ? "Adulto" : `${item.parentezco ? `${item.parentezco} - ` : ""}Menor (${item.age === 0 ? "0-11 meses" : `${item.age} años`})`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nombre */}
                    <div>
                      <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                        Nombre(s) {reqStar}
                      </label>
                      <input 
                        type="text"
                        value={item.name || ""}
                        onChange={e => handleMinorFieldChange(idx, "name", e.target.value)}
                        onBlur={e => handleMinorFieldChange(idx, "name", e.target.value.toUpperCase())}
                        placeholder="Nombre(s) del acompañante adicional"
                        className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                      />
                    </div>

                    {/* Apellidos */}
                    <div>
                      <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                        Apellidos {reqStar}
                      </label>
                      <input 
                        type="text"
                        value={item.lastName || ""}
                        onChange={e => handleMinorFieldChange(idx, "lastName", e.target.value)}
                        onBlur={e => handleMinorFieldChange(idx, "lastName", e.target.value.toUpperCase())}
                        placeholder="Apellidos del acompañante adicional"
                        className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                      />
                    </div>

                    {/* Tipo: Adulto o Menor de edad */}
                    <div>
                      <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                        ¿Es adulto o menor de edad? {reqStar}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleMinorFieldChange(idx, { tipo: "adult", age: 18, parentezco: "" });
                          }}
                          className={`py-3 px-3 rounded-xl border text-xs md:text-sm font-black transition cursor-pointer text-center ${
                            isAdult
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-300 dark:ring-purple-800"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-purple-400"
                          }`}
                        >
                          Adulto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleMinorFieldChange(idx, { 
                              tipo: "minor", 
                              age: (item.age !== undefined && item.age <= 17) ? item.age : 10,
                              parentezco: item.parentezco || "Hijo"
                            });
                          }}
                          className={`py-3 px-3 rounded-xl border text-xs md:text-sm font-black transition cursor-pointer text-center ${
                            isMinor
                              ? "bg-[#56B7A9] text-white border-[#56B7A9] shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-800"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-400"
                          }`}
                        >
                          Menor de edad
                        </button>
                      </div>
                    </div>

                    {/* Sexo del acompañante adicional */}
                    <div>
                      <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                        Sexo {reqStar}
                      </label>
                      <div className="flex gap-6 mt-3 font-sans">
                        <label className={`flex items-center gap-2 font-bold cursor-pointer text-xs md:text-sm ${t.radioLabel}`}>
                          <input 
                            type="radio" 
                            name={`sexoAdicional-${idx}`} 
                            checked={item.sex === "M"} 
                            onChange={() => handleMinorFieldChange(idx, "sex", "M")} 
                            className="accent-blue-500 w-4 h-4 cursor-pointer" 
                          />
                          Masculino
                        </label>
                        <label className={`flex items-center gap-2 font-bold cursor-pointer text-xs md:text-sm ${t.radioLabel}`}>
                          <input 
                            type="radio" 
                            name={`sexoAdicional-${idx}`} 
                            checked={item.sex === "F" || !item.sex} 
                            onChange={() => handleMinorFieldChange(idx, "sex", "F")} 
                            className="accent-blue-500 w-4 h-4 cursor-pointer" 
                          />
                          Femenino
                        </label>
                      </div>
                    </div>

                    {/* Campos exclusivos para Menor de edad */}
                    {isMinor && (
                      <>
                        {/* Parentesco */}
                        <div>
                          <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                            Parentesco {reqStar}
                          </label>
                          <select
                            value={item.parentezco || "Hijo"}
                            required
                            onChange={e => handleMinorFieldChange(idx, "parentezco", e.target.value)}
                            className={`w-full p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                              isDarkMode ? "bg-slate-800 text-slate-100" : "bg-white text-slate-700"
                            }`}
                          >
                            <option value="Hijo">Hijo</option>
                            <option value="Amigo">Amigo</option>
                            <option value="Sobrino">Sobrino</option>
                            <option value="Hermano">Hermano</option>
                          </select>
                        </div>

                        {/* Edad del Menor */}
                        <div>
                          <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                            Edad del Menor {reqStar}
                          </label>
                          <select 
                            value={item.age ?? 10}
                            required
                            onChange={e => handleMinorFieldChange(idx, "age", Number(e.target.value))}
                            className={`w-full p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                              isDarkMode 
                                ? "bg-slate-800 text-slate-100" 
                                : "bg-white text-slate-700"
                            }`}
                          >
                            <option value={0}>0-11 meses</option>
                            {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num}>
                                {num} {num === 1 ? "año" : "años"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Alergias o restricciones */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                        Alergias o Restricciones
                      </label>
                      <input 
                        type="text"
                        value={item.allergies || ""}
                        onChange={e => handleMinorFieldChange(idx, "allergies", e.target.value)}
                        onBlur={e => handleMinorFieldChange(idx, "allergies", e.target.value.toUpperCase())}
                        placeholder="Especifica alergias o restricciones médicas/alimentarias (o 'Ninguna')"
                        className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                      />
                    </div>
                  </div>
                </div>
              );
            }

            // Case Doble King
            return (
              <div key={idx} className={`${t.section} border-l-4 border-blue-500 space-y-4 text-sm transition-colors duration-300 p-5 shadow-xs`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <p className={`font-black text-xs md:text-sm uppercase tracking-wider ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
                    Menor de Edad #1
                  </p>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    {item.parentezco ? `${item.parentezco} - ` : ""}Edad: {item.age === 0 ? "0-11 meses" : `${item.age} años`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Nombre(s) {reqStar}
                    </label>
                    <input 
                      type="text"
                      value={item.name || ""}
                      onChange={e => handleMinorFieldChange(idx, "name", e.target.value)}
                      onBlur={e => handleMinorFieldChange(idx, "name", e.target.value.toUpperCase())}
                      placeholder="Nombre(s) del menor"
                      className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Apellidos {reqStar}
                    </label>
                    <input 
                      type="text"
                      value={item.lastName || ""}
                      onChange={e => handleMinorFieldChange(idx, "lastName", e.target.value)}
                      onBlur={e => handleMinorFieldChange(idx, "lastName", e.target.value.toUpperCase())}
                      placeholder="Apellidos del menor"
                      className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Sexo {reqStar}
                    </label>
                    <div className="flex gap-4 mt-3 font-sans">
                      <label className={`flex items-center gap-1.5 font-bold cursor-pointer text-xs md:text-sm ${t.radioLabel}`}>
                        <input 
                          type="radio" 
                          name={`sexoMenorKing-${idx}`} 
                          checked={item.sex === "M"} 
                          onChange={() => handleMinorFieldChange(idx, "sex", "M")} 
                          className="accent-blue-500 w-4 h-4 cursor-pointer" 
                        />
                        Masculino
                      </label>
                      <label className={`flex items-center gap-1.5 font-bold cursor-pointer text-xs md:text-sm ${t.radioLabel}`}>
                        <input 
                          type="radio" 
                          name={`sexoMenorKing-${idx}`} 
                          checked={item.sex === "F" || !item.sex} 
                          onChange={() => handleMinorFieldChange(idx, "sex", "F")} 
                          className="accent-blue-500 w-4 h-4 cursor-pointer" 
                        />
                        Femenino
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Parentesco {reqStar}
                    </label>
                    <select 
                      value={item.parentezco || "Hijo"}
                      required
                      onChange={e => handleMinorFieldChange(idx, "parentezco", e.target.value)}
                      className={`w-full p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                        isDarkMode ? "bg-slate-800 text-slate-100" : "bg-white text-slate-700"
                      }`}
                    >
                      <option value="Hijo">Hijo</option>
                      <option value="Amigo">Amigo</option>
                      <option value="Sobrino">Sobrino</option>
                      <option value="Hermano">Hermano</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Edad {reqStar}
                    </label>
                    <select 
                      value={item.age ?? 10}
                      required
                      onChange={e => {
                        handleMinorFieldChange(idx, { age: Number(e.target.value), tipo: "minor" });
                      }}
                      className={`w-full p-3 border border-[#56B7A9] text-sm md:text-base font-extrabold focus:outline-none transition-colors duration-300 rounded-xl cursor-pointer ${
                        isDarkMode 
                          ? "bg-slate-800 text-slate-100" 
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <option value={0}>0-11 meses</option>
                      {Array.from({ length: 17 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "año" : "años"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className={`block font-extrabold mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
                      Alergias o Restricciones del Menor
                    </label>
                    <input 
                      type="text"
                      value={item.allergies || ""}
                      onChange={e => handleMinorFieldChange(idx, "allergies", e.target.value)}
                      onBlur={e => handleMinorFieldChange(idx, "allergies", e.target.value.toUpperCase())}
                      placeholder="Especifica alergias o restricciones médicas/alimentarias (o 'Ninguna')"
                      className="w-full p-3 bg-transparent border border-[#56B7A9] rounded-xl text-sm md:text-base font-semibold transition-colors duration-300"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`border-t pt-5 flex justify-between ${t.border}`}>
        <button 
          onClick={handlePrev}
          className={`${t.btnSec} text-sm py-3 px-6 flex items-center gap-1.5`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Atrás</span>
        </button>
        <button 
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm flex items-center gap-2"
        >
          <span>Siguiente: Itinerario de viaje</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
