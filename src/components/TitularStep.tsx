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
  availableGroupsList?: string[];
  takenGroupsList?: string[];
  registeredGroupsMap?: Record<string, { guestId: string; titularName: string; agency?: string }>;
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
  availableGroupsList,
  takenGroupsList = [],
  registeredGroupsMap = {}
}: TitularStepProps) {
  const reqStar = <span className="text-red-500 font-extrabold text-sm ml-0.5">*</span>;

  const selectableGroups = isStage1 && availableGroupsList ? availableGroupsList : GROUPS_LIST;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl md:text-2xl font-extrabold flex items-center gap-2.5 ${t.textTitle}`}>
          <User className="w-6 h-6 text-blue-500" />
          Paso 2: Información del Titular
        </h3>
      </div>

      {isStage1 && (
        <div className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs transition-colors duration-200 ${
          isDarkMode
            ? "bg-emerald-900/90 border-emerald-500 text-white"
            : "bg-emerald-50 border-emerald-200 text-emerald-900"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${isDarkMode ? "bg-emerald-300" : "bg-emerald-500"}`}></span>
            <div>
              <span className={`font-extrabold uppercase tracking-wide ${isDarkMode ? "text-white" : "text-emerald-950"}`}>
                REGISTRO DUEÑOS : ETAPA 1
              </span>
              <p className={`text-[11px] mt-0.5 ${isDarkMode ? "text-white/95" : "text-emerald-800"}`}>
                En esta primer etapa sólo se permite el registro de un dueño por grupo.
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border whitespace-nowrap self-start sm:self-auto ${
            isDarkMode 
              ? "bg-emerald-800 border-emerald-400 text-white shadow-xs" 
              : "bg-emerald-100 border-emerald-300 text-emerald-900"
          }`}>
            {selectableGroups.length} de {GROUPS_LIST.length} grupos disponibles
          </span>
        </div>
      )}

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
            {selectableGroups.length === 0 && (
              <option value="" disabled>No hay grupos disponibles en Etapa 1</option>
            )}
            {selectableGroups.map(g => (
              <option key={g} value={g} className={isDarkMode ? "bg-slate-900 text-slate-100 font-semibold" : "bg-white text-slate-800 font-semibold"}>
                {g}
              </option>
            ))}
            {isStage1 && takenGroupsList.length > 0 && (
              <optgroup label="Grupos asignados (No disponibles en Etapa 1)">
                {takenGroupsList.map(g => (
                  <option 
                    key={g} 
                    value={g} 
                    disabled 
                    className="text-slate-400 bg-slate-100 dark:bg-slate-900 italic font-normal"
                  >
                    {g} (Asignado)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {isStage1 && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
              <span>✓</span> Solo se muestran disponibles grupos sin registro previo de titular.
            </p>
          )}
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
                  -- Seleccione una distribuidora --
                </option>
                {(GROUPS_DATA[grupo] || []).map(agency => (
                  <option key={agency} value={agency} className={isDarkMode ? "bg-slate-900 text-slate-100 font-semibold" : "bg-white text-slate-800 font-semibold"}>{agency}</option>
                ))}
              </>
            )}
          </select>
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
