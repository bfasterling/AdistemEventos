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
  const reqStar = <span className="text-red-500 font-extrabold text-sm ml-0.5">*</span>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl md:text-2xl font-extrabold flex items-center gap-2.5 ${t.textTitle}`}>
          <User className="w-6 h-6 text-blue-500" />
          Paso 2: Información del Titular
        </h3>
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
              if (agencies.length > 0) {
                setDistribuidora(agencies[0]);
              } else {
                setDistribuidora("");
              }
            }}
            className={`${t.input} text-sm md:text-base transition-colors duration-300 font-bold`}
          >
            {GROUPS_LIST.map(g => (
              <option key={g} value={g} className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>
            Razón Social / Distribuidora {reqStar}
          </label>
          <select 
            value={distribuidora}
            onChange={e => setDistribuidora(e.target.value)}
            className={`${t.input} text-sm md:text-base transition-colors duration-300 font-bold`}
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
          <label className={`block font-extrabold uppercase mb-2 text-xs md:text-sm tracking-wide ${t.label}`}>Alergias o Restricciones Alimenticias</label>
          <p className={`p-3.5 rounded-xl text-xs md:text-sm font-medium leading-relaxed border ${
            isDarkMode ? "bg-slate-800/60 border-slate-700/80 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
          }`}>
            Para informar respecto a cualquier alergia, restriccion alimenticia o limitación de movilidad, favor de enviar un correo a{" "}
            <a href="mailto:soporte.convencion@adistem.com.mx" className="text-blue-500 dark:text-blue-400 font-bold underline hover:text-blue-600 transition-colors">
              soporte.convencion@adistem.com.mx
            </a>
          </p>
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
