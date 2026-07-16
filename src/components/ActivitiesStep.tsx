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
        <h3 className={`text-lg font-bold flex items-center gap-2 ${t.textTitle}`}>
          <Calendar className="w-5 h-5 text-blue-500" />
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
            <p className="font-extrabold text-xs text-amber-500 uppercase tracking-wide">
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
                className={`p-5 rounded-2xl border transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-slate-900/60 border-slate-800" 
                    : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        act.category === "Golf" 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : act.category === "Spa" 
                            ? "bg-purple-500/10 text-purple-500" 
                            : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {act.category}
                      </span>
                      <span className={`text-[10px] font-bold ${t.textMuted} flex items-center gap-1`}>
                        <Calendar className="w-3 h-3" />
                        {act.dateTime}
                      </span>
                      <span className={`text-[10px] font-extrabold ${isFull ? "text-rose-500" : "text-emerald-500"}`}>
                        {isFull ? "Lista de Espera" : `${slotsRemaining} cupos libres`}
                      </span>
                    </div>
                    <h4 className={`text-sm font-black uppercase tracking-tight ${t.textHeading}`}>
                      {act.title}
                    </h4>
                    <p className={`text-[11px] leading-relaxed ${t.textMuted}`}>
                      {act.description}
                    </p>
                  </div>

                  {/* Checkbox selectors for passengers */}
                  <div className="p-3 bg-slate-500/5 rounded-xl border border-slate-200/5 min-w-[200px] space-y-2 text-[11px] font-sans">
                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider block border-b pb-1">
                      Asignación de Huéspedes
                    </span>
                    
                    {/* Titular check */}
                    <div className="flex items-center justify-between gap-2 py-0.5">
                      <span className="font-semibold truncate max-w-[120px]">{nombreTitular || "Titular"}</span>
                      <div className="flex items-center gap-1">
                        {hasConflictForTitular ? (
                          <span className="text-[9px] text-rose-500 font-extrabold uppercase bg-rose-500/5 px-1.5 py-0.5 rounded">
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
                            className="w-4 h-4 accent-blue-500 cursor-pointer"
                          />
                        )}
                        {isSelectedForTitular && isFull && (
                          <span className="text-[9px] text-amber-500 font-extrabold uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
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
                        <div key={comp.id} className="flex items-center justify-between gap-2 py-0.5 border-t border-slate-100 dark:border-slate-850 pt-1.5 font-sans">
                          <span className="font-semibold truncate max-w-[120px]">{comp.firstName || `Acompañante ${idx + 1}`}</span>
                          <div className="flex items-center gap-1">
                            {hasConflictForComp ? (
                              <span className="text-[9px] text-rose-500 font-extrabold uppercase bg-rose-500/5 px-1.5 py-0.5 rounded">
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
                                className="w-4 h-4 accent-blue-500 cursor-pointer"
                              />
                            )}
                            {isSelectedForComp && isFull && (
                              <span className="text-[9px] text-amber-500 font-extrabold uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
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
          className={t.btnSec + " flex items-center gap-1.5"}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>
        <button 
          onClick={handleNext}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
        >
          <span>Siguiente: Resumen</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
