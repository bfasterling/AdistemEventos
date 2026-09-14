import React from "react";
import { User, ChevronLeft, ChevronRight } from "lucide-react";

interface TitularStepProps {
  t: any;
  isDarkMode: boolean;
  grupo: string;
  setGrupo: (val: string) => void;
  distribuidora: string;
  setDistribuidora: (val: string) => void;
  nombreTitular: string;
  setNombreTitular: (val: string) => void;
  apellidosTitular: string;
  setApellidosTitular: (val: string) => void;
  correoTitular: string;
  setCorreoTitular: (val: string) => void;
  celularTitular: string;
  setCelularTitular: (val: string) => void;
  sexo: string;
  setSexo: (val: string) => void;
  alergiasTitular: string;
  setAlergiasTitular: (val: string) => void;
  activeAccessUser: any;
  loggedGuest: any;
  handleNext: () => void;
  handlePrev: () => void;
  GROUPS_DATA: any;
  GROUPS_LIST: string[];
  isStage1?: boolean;
  isStage2?: boolean;
  availableGroupsList?: string[];
  takenGroupsList?: string[];
  registeredGroupsMap?: Record<string, { guestId: string; titularName: string; agency?: string }>;
  registeredRazonSocialMap?: Record<string, { guestId: string; titularName: string; agency?: string; grupo?: string }>;
  isExemptStage1Group?: (name: string) => boolean;
  groupRegistrationsCount?: Record<string, number>;
}

export default function TitularStep({
  t,
  isDarkMode,
  grupo,
  setGrupo,
  distribuidora,
  setDistribuidora,
  nombreTitular,
  setNombreTitular,
  apellidosTitular,
  setApellidosTitular,
  correoTitular,
  setCorreoTitular,
  celularTitular,
  setCelularTitular,
  sexo,
  setSexo,
  alergiasTitular,
  setAlergiasTitular,
  activeAccessUser,
  loggedGuest,
  handleNext,
  handlePrev,
  GROUPS_DATA,
  GROUPS_LIST,
  isStage1 = false,
  isStage2 = true,
  availableGroupsList,
  takenGroupsList = [],
  registeredGroupsMap = {},
  registeredRazonSocialMap = {},
  isExemptStage1Group,
  groupRegistrationsCount = {}
}: TitularStepProps) {
  const reqStar = <span className="text-red-500 font-extrabold text-sm ml-0.5">*</span>;

  const isExempt = (val: string) => {
    if (isExemptStage1Group) return isExemptStage1Group(val);
    const upper = (val || "").trim().toUpperCase();
    return upper === "STELLANTIS" || upper === "STELLANTIS FINANCIAL";
  };

  // Stage 2 logic: Max 4 registrations per group
  const availableGroupsInStage2 = GROUPS_LIST.filter(g => {
    if (isExempt(g.toUpperCase())) return true;
    const count = groupRegistrationsCount[g.toUpperCase()] || 0;
    return count < 4;
  });

  const fullGroupsInStage2 = GROUPS_LIST.filter(g => {
    if (isExempt(g.toUpperCase())) return false;
    const count = groupRegistrationsCount[g.toUpperCase()] || 0;
    return count >= 4;
  });

  const selectableGroups = isStage1 && availableGroupsList ? availableGroupsList : availableGroupsInStage2;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl md:text-2xl font-extrabold flex items-center gap-2.5 ${t.textTitle}`}>
          <User className="w-6 h-6 text-blue-500" />
          Paso 2: Información del Titular
        </h3>
      </div>

      <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-xs transition-colors duration-200 ${
        isDarkMode
          ? "bg-blue-950/80 border-blue-500/50 text-blue-100"
          : "bg-blue-50 border-blue-200 text-blue-950"
      }`}>
        <span className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${isDarkMode ? "bg-blue-400" : "bg-blue-600"}`}></span>
        <div>
          <span className={`font-extrabold uppercase tracking-wide ${isDarkMode ? "text-white" : "text-blue-950"}`}>
            REGISTRO DUEÑOS : ETAPA 2
          </span>
          <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-blue-200" : "text-blue-800"}`}>
            A partir del Lunes 14 de Septiembre. Disponibilidad limitada y asignada por orden de registro.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Grupo al que pertenece {reqStar}
          </label>
          <select 
            value={grupo}
            onChange={e => {
              const newGrp = e.target.value;
              setGrupo(newGrp);
              const agencies = GROUPS_DATA[newGrp] || [];
              if (agencies.length === 1) {
                setDistribuidora(agencies[0]);
              } else {
                setDistribuidora("");
              }
            }}
            className={`${t.input} text-sm md:text-base transition-colors duration-300 font-bold ${!grupo ? "text-slate-400 font-normal" : ""}`}
          >
            <option value="" disabled className={isDarkMode ? "bg-slate-900 text-slate-400" : "bg-white text-slate-400"}>
              -- Seleccione su grupo empresarial --
            </option>

            {/* Grupos disponibles con menos de 4 registros */}
            {availableGroupsInStage2.length > 0 && (
              <optgroup label="Grupos con cupo disponible (Menos de 4 registros)">
                {availableGroupsInStage2.map(g => {
                  const count = groupRegistrationsCount[g.toUpperCase()] || 0;
                  const isExemptGrp = isExempt(g.toUpperCase());
                  return (
                    <option 
                      key={g} 
                      value={g} 
                      className={isDarkMode ? "bg-slate-900 text-slate-100 font-semibold" : "bg-white text-slate-800 font-semibold"}
                    >
                      {g} {!isExemptGrp && count > 0 ? `(${count}/4 registros)` : ""}
                    </option>
                  );
                })}
              </optgroup>
            )}

            {/* Grupos inhabilitados con 4 o más registros */}
            {fullGroupsInStage2.length > 0 && (
              <optgroup label="Grupos inhabilitados (Límite de 4 registros alcanzado)">
                {fullGroupsInStage2.map(g => {
                  const count = groupRegistrationsCount[g.toUpperCase()] || 0;
                  return (
                    <option 
                      key={g} 
                      value={g} 
                      disabled 
                      className="text-slate-400 bg-slate-100 dark:bg-slate-900 italic font-normal"
                    >
                      {g} (Inhabilitado - Cupo lleno: {count}/4)
                    </option>
                  );
                })}
              </optgroup>
            )}
          </select>
          
          <div className="mt-1.5 space-y-0.5">
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
              <span>✓</span> Etapa 2: Máximo 4 registros por grupo empresarial.
            </p>
            {grupo && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Registros confirmados en este grupo: <strong className="text-blue-600 dark:text-blue-400 font-bold">{groupRegistrationsCount[grupo.toUpperCase()] || 0} de 4</strong>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Razón Social / Distribuidora {reqStar}
          </label>
          <select 
            value={distribuidora}
            onChange={e => setDistribuidora(e.target.value)}
            disabled={!grupo}
            className={`${t.input} text-sm md:text-base transition-colors duration-300 font-bold ${!distribuidora ? "text-slate-400 font-normal" : ""} ${!grupo ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {!grupo ? (
              <option value="" disabled className={isDarkMode ? "bg-slate-900 text-slate-400" : "bg-white text-slate-400"}>
                Seleccione grupo primero...
              </option>
            ) : (
              <>
                <option value="" disabled className={isDarkMode ? "bg-slate-900 text-slate-400" : "bg-white text-slate-400"}>
                  -- Seleccione una razón social / distribuidora --
                </option>
                {(GROUPS_DATA[grupo] || []).map((agency: string) => (
                  <option 
                    key={agency} 
                    value={agency} 
                    className={isDarkMode ? "bg-slate-900 text-slate-100 font-semibold" : "bg-white text-slate-800 font-semibold"}
                  >
                    {agency}
                  </option>
                ))}
              </>
            )}
          </select>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1.5 flex items-center gap-1">
            <span>✓</span> Sin restricción por razón social: se permite más de un registro por distribuidora.
          </p>
        </div>

        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Nombre(s) del Titular {reqStar}
          </label>
          <input 
            type="text"
            value={nombreTitular}
            onChange={e => setNombreTitular(e.target.value)}
            onBlur={e => setNombreTitular(e.target.value.toUpperCase())}
            placeholder="Ingresa tus nombres"
            className={`${t.input} text-sm md:text-base transition-colors duration-300`}
          />
        </div>

        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Apellidos del Titular {reqStar}
          </label>
          <input 
            type="text"
            value={apellidosTitular}
            onChange={e => setApellidosTitular(e.target.value)}
            onBlur={e => setApellidosTitular(e.target.value.toUpperCase())}
            placeholder="Ingresa tus apellidos"
            className={`${t.input} text-sm md:text-base transition-colors duration-300`}
          />
        </div>

        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Correo del titular {reqStar}
          </label>
          <input 
            type="email"
            value={correoTitular}
            onChange={e => setCorreoTitular(e.target.value)}
            onBlur={e => setCorreoTitular(e.target.value.toUpperCase())}
            placeholder="correo@distribuidor.com"
            className={`${t.input} text-sm md:text-base transition-colors duration-300`}
          />
        </div>

        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Celular del titular {reqStar}
          </label>
          <input 
            type="tel"
            value={celularTitular}
            onChange={e => setCelularTitular(e.target.value)}
            onBlur={e => setCelularTitular(e.target.value.toUpperCase())}
            placeholder="+52 33 0000 0000"
            className={`${t.input} text-sm md:text-base transition-colors duration-300`}
          />
        </div>

        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Sexo {reqStar}
          </label>
          <div className="flex gap-6 mt-2.5 font-sans">
            <label className={`flex items-center gap-2 font-bold cursor-pointer text-sm md:text-base ${t.radioLabel}`}>
              <input type="radio" name="sexo" checked={sexo === "M"} onChange={() => setSexo("M")} className="accent-blue-500 w-4.5 h-4.5" />
              Masculino
            </label>
            <label className={`flex items-center gap-2 font-bold cursor-pointer text-sm md:text-base ${t.radioLabel}`}>
              <input type="radio" name="sexo" checked={sexo === "F"} onChange={() => setSexo("F")} className="accent-blue-500 w-4.5 h-4.5" />
              Femenino
            </label>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Alergias o Restricciones Alimenticias
          </label>
          <input
            type="text"
            value={alergiasTitular}
            onChange={e => setAlergiasTitular(e.target.value)}
            onBlur={e => setAlergiasTitular(e.target.value.toUpperCase())}
            placeholder="Especifica alergias o restricciones (o 'Ninguna')"
            className={`${t.input} text-sm md:text-base transition-colors duration-300`}
          />
        </div>
      </div>



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
          <span>Siguiente: Acompañantes</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
