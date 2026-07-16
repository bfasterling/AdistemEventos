import React from "react";
import { User, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

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
  GROUPS_LIST
}: TitularStepProps) {
  const reqStar = <span className="text-rose-500 font-extrabold text-sm ml-0.5">*</span>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
          <User className="w-5 h-5 text-blue-500" />
          Paso 2: Información del Titular
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className={`block font-bold uppercase mb-1 ${t.label}`}>
            Grupo al que pertenece {reqStar}
          </label>
          <select 
            value={grupo}
            onChange={e => {
              const newGrp = e.target.value;
              setGrupo(newGrp);
              const agencies = GROUPS_DATA[newGrp] || [];
              if (agencies.length > 0) {
                setDistribuidora(agencies[0]);
              } else {
                setDistribuidora("");
              }
            }}
            className={`${t.input} transition-colors duration-300 font-bold`}
          >
            {GROUPS_LIST.map(g => (
              <option key={g} value={g} className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block font-bold uppercase mb-1 ${t.label}`}>
            Razón Social / Distribuidora {reqStar}
          </label>
          <select 
            value={distribuidora}
            onChange={e => setDistribuidora(e.target.value)}
            className={`${t.input} transition-colors duration-300 font-bold`}
          >
            {(GROUPS_DATA[grupo] || []).map(agency => (
              <option key={agency} value={agency} className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>{agency}</option>
            ))}
            {(!GROUPS_DATA[grupo] || GROUPS_DATA[grupo].length === 0) && (
              <option value="">Seleccione grupo primero...</option>
            )}
          </select>
        </div>

        <div>
          <label className={`block font-bold uppercase mb-1 ${t.label}`}>
            Nombre(s) del Titular {reqStar}
          </label>
          <input 
            type="text"
            value={nombreTitular}
            onChange={e => setNombreTitular(e.target.value)}
            placeholder="Ingresa tus nombres"
            className={`${t.input} transition-colors duration-300`}
          />
        </div>

        <div>
          <label className={`block font-bold uppercase mb-1 ${t.label}`}>
            Apellidos del Titular {reqStar}
          </label>
          <input 
            type="text"
            value={apellidosTitular}
            onChange={e => setApellidosTitular(e.target.value)}
            placeholder="Ingresa tus apellidos"
            className={`${t.input} transition-colors duration-300`}
          />
        </div>

        <div>
          <label className={`block font-bold uppercase mb-1 ${t.label}`}>
            Correo del titular {reqStar}
          </label>
          <input 
            type="email"
            value={correoTitular}
            onChange={e => setCorreoTitular(e.target.value)}
            placeholder="correo@distribuidor.com"
            className={`${t.input} transition-colors duration-300`}
          />
        </div>

        <div>
          <label className={`block font-bold uppercase mb-1 ${t.label}`}>
            Celular del titular {reqStar}
          </label>
          <input 
            type="tel"
            value={celularTitular}
            onChange={e => setCelularTitular(e.target.value)}
            placeholder="+52 33 0000 0000"
            className={`${t.input} transition-colors duration-300`}
          />
        </div>

        <div>
          <label className={`block font-bold uppercase mb-1 ${t.label}`}>
            Sexo {reqStar}
          </label>
          <div className="flex gap-4 mt-1.5 font-sans">
            <label className={`flex items-center gap-1.5 font-semibold cursor-pointer ${t.radioLabel}`}>
              <input type="radio" name="sexo" checked={sexo === "M"} onChange={() => setSexo("M")} className="accent-blue-500" />
              Masculino
            </label>
            <label className={`flex items-center gap-1.5 font-semibold cursor-pointer ${t.radioLabel}`}>
              <input type="radio" name="sexo" checked={sexo === "F"} onChange={() => setSexo("F")} className="accent-blue-500" />
              Femenino
            </label>
          </div>
        </div>

        <div>
          <label className={`block font-bold uppercase mb-1 ${t.label}`}>Alergias o Restricciones Alimenticias</label>
          <input 
            type="text"
            value={alergiasTitular}
            onChange={e => setAlergiasTitular(e.target.value)}
            placeholder="Ej. Mariscos, gluten o ninguna"
            className={`${t.input} transition-colors duration-300`}
          />
        </div>
      </div>

      {activeAccessUser && (
        <div className={`${t.infoCard} transition-colors duration-300`}>
          <h4 className={`font-bold flex items-center gap-1.5 text-emerald-500`}>
            <CheckCircle className="w-4 h-4" />
            Cuenta de Acceso Activa
          </h4>
          <p className={t.textMuted}>
            Estás registrando este carnet bajo la cuenta de acceso: <strong className="font-semibold text-blue-500">{activeAccessUser.email}</strong>.
          </p>
        </div>
      )}

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
          <span>Siguiente: Acompañantes</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
