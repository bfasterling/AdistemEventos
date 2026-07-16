import React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface ActivitiesStepProps {
  t: any;
  isDarkMode: boolean;
  nombreTitular: string;
  hasCompanion: boolean;
  companionsList: Array<{
    id: string;
    firstName: string;
    lastName: string;
    selectedActivities?: string[];
  }>;
  selectedActivities: string[];
  setSelectedActivities: React.Dispatch<React.SetStateAction<string[]>>;
  updateCompanionItem: (id: string, field: string, val: any) => void;
  checkActivityConflict: (personId: string, candidateActivity: any, selectedActs: string[]) => boolean;
  DataStore: any;
  handleNext: () => void;
  handlePrev: () => void;
}

export default function ActivitiesStep({
  t,
  isDarkMode,
  nombreTitular,
  hasCompanion,
  companionsList,
  selectedActivities,
  setSelectedActivities,
  updateCompanionItem,
  checkActivityConflict,
  DataStore,
  handleNext,
  handlePrev
}: ActivitiesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl md:text-2xl font-extrabold flex items-center gap-2.5 ${t.textTitle}`}>
          <Calendar className="w-6 h-6 text-blue-500" />
          Paso 5: Registro de Actividades
        </h3>
      </div>

      <div className="space-y-4">
        {DataStore.getActivities().length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border border-dashed transition-all duration-300 ${
            isDarkMode 
              ? "bg-slate-900/40 border-slate-800 text-slate-400" 
              : "bg-slate-50 border-slate-200 text-slate-500 shadow-xs"
          }`}>
            <p className="font-extrabold text-sm text-amber-500 uppercase tracking-wide">
              Todavía no se encuentran actividades disponibles, próximamente se podrán seleccionar aquí
            </p>
          </div>
        ) : (
          DataStore.getActivities().map((act: any) => {
            const slotsRemaining = Math.max(0, act.capacity - act.registeredCount);
            const isFull = slotsRemaining === 0;

            // Check if selected for Titular
            const isSelectedForTitular = selectedActivities.includes(act.id);
            
            // Check for schedule conflict for Titular
            const hasConflictForTitular = !isSelectedForTitular && 
              checkActivityConflict("titular", act, selectedActivities);

            return (
              <div 
                key={act.id} 
                className={`p-6 rounded-2xl border transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-slate-900/60 border-slate-800" 
                    : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        act.category === "Golf" 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : act.category === "Spa" 
                            ? "bg-purple-500/10 text-purple-500" 
                            : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {act.category}
                      </span>
                      <span className={`text-xs font-bold ${t.textMuted} flex items-center gap-1`}>
                        <Calendar className="w-4 h-4" />
                        {act.dateTime}
                      </span>
                      <span className={`text-xs font-extrabold ${isFull ? "text-rose-500" : "text-emerald-500"}`}>
                        {isFull ? "Lista de Espera" : `${slotsRemaining} cupos libres`}
                      </span>
                    </div>
                    <h4 className={`text-base md:text-lg font-black uppercase tracking-tight ${t.textHeading}`}>
                      {act.title}
                    </h4>
                    <p className={`text-xs md:text-sm leading-relaxed ${t.textMuted}`}>
                      {act.description}
                    </p>
                  </div>

                  {/* Checkbox selectors for passengers */}
                  <div className="p-4 bg-slate-500/5 rounded-xl border border-slate-200/5 min-w-[220px] space-y-2.5 text-xs md:text-sm font-sans">
                    <span className="font-bold text-slate-500 uppercase text-[10px] md:text-xs tracking-wider block border-b pb-1.5">
                      Asignación de Huéspedes
                    </span>
                    
                    {/* Titular check */}
                    <div className="flex items-center justify-between gap-2.5 py-0.5 text-xs md:text-sm">
                      <span className="font-bold truncate max-w-[130px]">{nombreTitular || "Titular"}</span>
                      <div className="flex items-center gap-1.5">
                        {hasConflictForTitular ? (
                          <span className="text-[10px] text-rose-500 font-black uppercase bg-rose-500/5 px-2 py-0.5 rounded">
                            Conflicto Horario
                          </span>
                        ) : (
                          <input 
                            type="checkbox"
                            checked={isSelectedForTitular}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedActivities(prev => [...prev, act.id]);
                              } else {
                                setSelectedActivities(prev => prev.filter(id => id !== act.id));
                              }
                            }}
                            className="w-4.5 h-4.5 accent-blue-500 cursor-pointer"
                          />
                        )}
                        {isSelectedForTitular && isFull && (
                          <span className="text-[10px] text-amber-500 font-black uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                            Espera
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Adult companions check */}
                    {hasCompanion && companionsList.map((comp, idx) => {
                      const isSelectedForComp = comp.selectedActivities?.includes(act.id);
                      const hasConflictForComp = !isSelectedForComp && 
                        checkActivityConflict(comp.id, act, comp.selectedActivities || []);

                      return (
                        <div key={comp.id} className="flex items-center justify-between gap-2.5 py-1 border-t border-slate-100 dark:border-slate-850 pt-2 font-sans text-xs md:text-sm">
                          <span className="font-bold truncate max-w-[130px]">{comp.firstName || `Acompañante ${idx + 1}`}</span>
                          <div className="flex items-center gap-1.5">
                            {hasConflictForComp ? (
                              <span className="text-[10px] text-rose-500 font-black uppercase bg-rose-500/5 px-2 py-0.5 rounded">
                                Conflicto Horario
                              </span>
                            ) : (
                              <input 
                                type="checkbox"
                                checked={isSelectedForComp}
                                onChange={e => {
                                  const updatedActs = e.target.checked
                                    ? [...(comp.selectedActivities || []), act.id]
                                    : (comp.selectedActivities || []).filter(id => id !== act.id);
                                  updateCompanionItem(comp.id, "selectedActivities", updatedActs);
                                }}
                                className="w-4.5 h-4.5 accent-blue-500 cursor-pointer"
                              />
                            )}
                            {isSelectedForComp && isFull && (
                              <span className="text-[10px] text-amber-500 font-black uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                                Espera
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
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
          <span>Siguiente: Resumen</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
