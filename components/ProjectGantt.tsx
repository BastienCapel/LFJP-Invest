
import React from 'react';
import { Project } from '../types';
import { CalendarDays, Sigma, Power, MousePointerClick } from 'lucide-react';

interface Props {
  projects: Project[];
  years: number[];
  onPeriodChange: (id: string, start: number, end: number) => void;
  onToggle: (id: string) => void;
}

const ProjectGantt: React.FC<Props> = ({ projects, years, onPeriodChange, onToggle }) => {
  
  const formatMoneyShort = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`;
    }
    if (amount === 0) return '-';
    return (amount / 1000).toFixed(0) + 'k';
  };

  // Helper to handle logic when a year slot is clicked
  const handleYearClick = (project: Project, clickedYear: number) => {
    // 1. If inactive, activate and set start/end to clicked year
    if (!project.isActive) {
      onPeriodChange(project.id, clickedYear, clickedYear);
      onToggle(project.id);
      return;
    }

    const currentStart = project.startYear;
    const currentEnd = project.startYear + project.durationYears - 1;

    // 2. Interaction logic for active projects
    if (clickedYear < currentStart) {
      // Extend start backwards
      onPeriodChange(project.id, clickedYear, currentEnd);
    } else if (clickedYear > currentEnd) {
      // Extend end forwards
      onPeriodChange(project.id, currentStart, clickedYear);
    } else if (clickedYear === currentStart && clickedYear === currentEnd) {
      // Clicked the only active year -> deactivate
      onToggle(project.id);
    } else if (clickedYear === currentStart) {
      // Clicked start -> Shrink from left
      onPeriodChange(project.id, currentStart + 1, currentEnd);
    } else if (clickedYear === currentEnd) {
      // Clicked end -> Shrink from right
      onPeriodChange(project.id, currentStart, currentEnd - 1);
    } else {
       // Clicked in the middle -> Do nothing (or could be split, but let's keep it simple)
       // Optional: Could allow setting this year as ONLY year? No, too destructive.
    }
  };

  // Calculate totals per year (only for active projects)
  const yearlyTotals = years.map(year => {
    return projects.filter(p => p.isActive).reduce((sum, project) => {
      const endYear = project.startYear + project.durationYears - 1;
      if (year >= project.startYear && year <= endYear) {
        return sum + (project.totalCost / project.durationYears);
      }
      return sum;
    }, 0);
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Calendrier des Dépenses Interactif</h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded">
            <MousePointerClick className="w-3 h-3" />
            <span>Cliquez sur les cases pour modifier</span>
        </div>
      </div>

      {/* Header Years */}
      <div className="grid grid-cols-5 gap-1 mb-2 text-center">
        {years.map(year => (
          <div key={year} className="text-[10px] font-bold text-slate-400">
            {year}
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        {projects.map(project => {
          const yearlyCost = project.totalCost / project.durationYears;
          const endYear = project.startYear + project.durationYears - 1;
          const isActive = project.isActive;

          return (
            <div key={project.id} className={`group transition-opacity ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}>
              {/* Project Name */}
              <div className="flex items-center gap-2 mb-1 px-1">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                <div className="text-xs font-medium text-slate-700 truncate flex-1" title={project.name}>
                    {project.name}
                </div>
                {!isActive && <span className="text-[9px] text-slate-400 italic">Inactif</span>}
              </div>
              
              {/* Timeline Grid */}
              <div className="grid grid-cols-5 gap-1 h-8 bg-slate-50 rounded-md p-1">
                {years.map(year => {
                  const isFilled = isActive && year >= project.startYear && year <= endYear;
                  const isStart = year === project.startYear;
                  const isEnd = year === endYear;

                  // Determine color based on project category (visual cue)
                  let bgClass = 'bg-blue-500';
                  if (project.category === 'equipment') bgClass = 'bg-orange-500';
                  if (project.category === 'land') bgClass = 'bg-green-500';

                  if (!isFilled) {
                    return (
                        <div 
                            key={year} 
                            onClick={() => handleYearClick(project, year)}
                            className="rounded-sm hover:bg-slate-200 cursor-pointer transition-colors"
                            title="Cliquer pour activer ou étendre"
                        />
                    );
                  }

                  return (
                    <div 
                      key={year} 
                      onClick={() => handleYearClick(project, year)}
                      className={`
                        ${bgClass} 
                        relative flex items-center justify-center 
                        text-[9px] font-bold text-white 
                        shadow-sm transition-all cursor-pointer hover:opacity-80
                        ${isStart ? 'rounded-l-md' : 'rounded-l-sm'}
                        ${isEnd ? 'rounded-r-md' : 'rounded-r-sm'}
                      `}
                      title={`${formatMoneyShort(yearlyCost)} - Cliquer pour réduire`}
                    >
                      {formatMoneyShort(yearlyCost)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Row */}
      <div className="pt-3 border-t-2 border-slate-100">
        <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1 px-1">
            <Sigma className="w-3 h-3 text-slate-500" />
            Total Annuel
        </div>
        <div className="grid grid-cols-5 gap-1">
            {yearlyTotals.map((total, index) => (
                <div 
                    key={years[index]} 
                    className={`
                        text-xs font-bold text-center py-1.5 rounded
                        ${total > 0 ? 'text-slate-700 bg-slate-100' : 'text-slate-300'}
                    `}
                >
                    {formatMoneyShort(total)}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectGantt;
