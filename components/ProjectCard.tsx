
import React from 'react';
import { Project } from '../types';
import { Building2, ThermometerSun, Utensils, TreePine, Waves, Sun } from 'lucide-react';

interface Props {
  project: Project;
  onToggle: (id: string) => void;
  onCostChange: (id: string, cost: number) => void;
  onPeriodChange: (id: string, startYear: number, endYear: number) => void;
  formatCurrency: (amount: number) => string;
}

const ProjectCard: React.FC<Props> = ({ project, onToggle, onCostChange, onPeriodChange, formatCurrency }) => {
  const getIcon = () => {
    switch (project.id) {
      case 'clim': return <ThermometerSun className="w-5 h-5 text-orange-500" />;
      case 'sport_cover': return <Building2 className="w-5 h-5 text-blue-500" />;
      case 'pool': return <Waves className="w-5 h-5 text-cyan-500" />;
      case 'restauration': return <Utensils className="w-5 h-5 text-red-500" />;
      case 'terrain': return <TreePine className="w-5 h-5 text-green-500" />;
      case 'solar_sport': return <Sun className="w-5 h-5 text-yellow-500" />;
      default: return <Building2 className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleStartYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val)) return;
    const newStart = val;
    const currentEnd = project.startYear + project.durationYears - 1;
    
    // Allow free typing, just ensure logical end
    let newEnd = currentEnd;
    if (newStart > currentEnd) {
        newEnd = newStart;
    }
    onPeriodChange(project.id, newStart, newEnd);
  };

  const handleEndYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (isNaN(val)) return;
    const newEnd = val;
    // Allow free typing
    onPeriodChange(project.id, project.startYear, newEnd);
  };

  const endYear = project.startYear + project.durationYears - 1;

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${project.isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${project.isActive ? 'bg-slate-100' : 'bg-slate-200'}`}>
            {getIcon()}
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">{project.name}</h4>
            <p className="text-xs text-slate-500">{project.description}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={project.isActive}
            onChange={() => onToggle(project.id)}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-medium text-slate-500">Début</label>
            <input 
              type="number" 
              value={project.startYear}
              onChange={handleStartYearChange}
              disabled={!project.isActive}
              className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
          <div className="relative">
            <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-medium text-slate-500">Fin</label>
             <input 
              type="number" 
              value={endYear}
              onChange={handleEndYearChange}
              disabled={!project.isActive}
              className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
        </div>

        {project.isVariable && project.variableMin && project.variableMax ? (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-500">Budget alloué</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{formatCurrency(project.totalCost)}</span>
            </div>
            <input
              type="range"
              min={project.variableMin}
              max={project.variableMax}
              step={1000000}
              value={project.totalCost}
              onChange={(e) => onCostChange(project.id, Number(e.target.value))}
              disabled={!project.isActive}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{formatCurrency(project.variableMin)}</span>
              <span>{formatCurrency(project.variableMax)}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between text-sm mt-1">
             <span className="text-slate-500">Coût Total:</span>
             <span className="font-bold text-slate-800">{formatCurrency(project.totalCost)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;