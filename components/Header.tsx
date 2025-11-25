
import React from 'react';
import { Calculator, Lock, Unlock, FileDown, Banknote, Cloud, CheckCircle, HardDrive, RotateCcw, Users, Loader2 } from 'lucide-react';

interface Props {
  isLocked: boolean;
  onLockToggle: () => void;
  isExporting: boolean;
  onExportPDF: () => void;
  currency: 'XOF' | 'EUR';
  onCurrencyToggle: () => void;
  isSaving: boolean;
  dbStatus: 'connected' | 'offline' | 'error';
  lastSaved: Date | null;
  onReset: () => void;
  studentCount: number;
  onStudentCountChange: (val: number) => void;
}

const Header: React.FC<Props> = ({
  isLocked,
  onLockToggle,
  isExporting,
  onExportPDF,
  currency,
  onCurrencyToggle,
  isSaving,
  dbStatus,
  lastSaved,
  onReset,
  studentCount,
  onStudentCountChange
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-200">
            <Calculator className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 hidden sm:block">LFJP Invest <span className="font-normal text-slate-500">| 2026-2030</span></h1>
        </div>
        
        <div className="flex items-center gap-3">

           {/* Lock Button */}
           <button
              onClick={onLockToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium transition-colors mr-1 shadow-sm ${isLocked ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              title={isLocked ? "Site verrouillé (Cliquer pour déverrouiller)" : "Mode édition actif (Cliquer pour verrouiller)"}
           >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span className="hidden md:inline">{isLocked ? "Verrouillé" : "Édition"}</span>
           </button>

           {/* PDF Export Button */}
           <button
              onClick={onExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mr-2 shadow-sm"
              title="Exporter la vue actuelle en PDF"
           >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span className="hidden md:inline">PDF</span>
           </button>

           {/* Currency Toggle */}
           <button 
              onClick={onCurrencyToggle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 text-sm font-semibold text-slate-700 mr-2"
              title="Changer la devise"
           >
              <Banknote className="w-4 h-4 text-slate-500" />
              <span>{currency === 'XOF' ? 'FCFA' : 'EUR'}</span>
           </button>

           {/* Sync Status Indicator */}
           <div className="hidden md:flex items-center gap-2 mr-4">
             {isSaving ? (
               <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                 <Cloud className="w-3 h-3 animate-pulse" />
                 Sauvegarde...
               </span>
             ) : dbStatus === 'connected' ? (
               <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full" title={`Sauvegardé dans le Cloud à ${lastSaved?.toLocaleTimeString()}`}>
                 <CheckCircle className="w-3 h-3" />
                 Cloud Synchro
               </span>
             ) : (
               <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full" title="Sauvegarde locale uniquement">
                 <HardDrive className="w-3 h-3" />
                 Mode Local
               </span>
             )}
           </div>

           <button 
              onClick={onReset}
              disabled={isLocked}
              className={`text-xs flex items-center gap-1 transition-colors px-3 py-1 rounded-full ${isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
              title="Réinitialiser toutes les données"
           >
             <RotateCcw className="w-3 h-3" />
             Reset
           </button>
           <div className="h-6 w-px bg-slate-200 mx-1"></div>
           <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
             <Users className="w-4 h-4 text-slate-500" />
             <input 
               type="number" 
               value={studentCount}
               onChange={(e) => onStudentCountChange(Math.max(1, parseInt(e.target.value) || 0))}
               disabled={isLocked}
               className="bg-transparent border-none outline-none w-16 text-sm font-semibold text-slate-700 text-right disabled:text-slate-400"
             />
             <span className="text-xs text-slate-500">élèves</span>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
