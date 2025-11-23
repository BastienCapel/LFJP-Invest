
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  INITIAL_PROJECTS, 
  INITIAL_STUDENT_COUNT, 
  BASE_CAPACITY, 
  ANEF_BOOST, 
  ANEF_YEAR,
  YEARS_TO_SIMULATE,
  GLOBAL_REVENUE
} from './constants';
import { Project, YearlyFinancials, SimulationSummary } from './types';
import ProjectCard from './components/ProjectCard';
import FinancialChart from './components/FinancialChart';
import FeeSimulator from './components/FeeSimulator';
import ProjectGantt from './components/ProjectGantt';
import { Wallet, TrendingDown, Users, Calculator, Building2, RotateCcw, Cloud, CheckCircle, AlertCircle, Loader2, CloudOff, HardDrive, Banknote } from 'lucide-react';

// Firebase imports (Compat SDK)
import { db } from './firebase';

const SIMULATION_DOC_ID = 'lfjp_current_simulation';
const LOCAL_STORAGE_KEY = 'lfjp_invest_backup';
const EXCHANGE_RATE_EUR = 655.957;

const App: React.FC = () => {
  // --- State ---

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [studentCount, setStudentCount] = useState<number>(INITIAL_STUDENT_COUNT);
  const [feeRates, setFeeRates] = useState<Record<number, number>>({});
  const [currency, setCurrency] = useState<'XOF' | 'EUR'>('XOF');
  
  // Persistence State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'offline' | 'error'>('offline');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Ref to track if the update comes from the DB to prevent echo-saving
  const ignoreRemoteUpdate = useRef(false);

  // --- Helpers ---
  
  // Merges saved projects with the codebase's INITIAL_PROJECTS.
  // This ensures new projects added in code appear in the app, while preserving user edits for existing ones.
  const mergeProjects = useCallback((savedProjects: Project[]) => {
    if (!savedProjects || !Array.isArray(savedProjects)) return INITIAL_PROJECTS;

    const savedMap = new Map(savedProjects.map(p => [p.id, p]));
    
    return INITIAL_PROJECTS.map(initP => {
      const savedP = savedMap.get(initP.id);
      if (savedP) {
        // Restore user's dynamic values but allow code updates for static things like names/descriptions if needed?
        // For now, we trust the saved state for values, but maybe we should ensure structure.
        return {
          ...initP, // Start with code definition (gets new descriptions/names)
          isActive: savedP.isActive,
          totalCost: savedP.totalCost,
          startYear: savedP.startYear,
          durationYears: savedP.durationYears,
          // If the user modified these, we keep them. If not, we fall back to init.
        };
      }
      // If project is in code but not in DB, return the new code project
      return initP;
    });
  }, []);

  // --- Integration Logic ---

  // 1. Load Data (Real-time Listener from Firebase)
  useEffect(() => {
    if (!db) {
        // Fallback if DB init failed entirely
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
             try {
                const parsed = JSON.parse(local);
                if (parsed.projects) setProjects(mergeProjects(parsed.projects));
                if (parsed.studentCount) setStudentCount(parsed.studentCount);
                if (parsed.feeRates) setFeeRates(parsed.feeRates);
            } catch(e) {}
        }
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    
    // Listen to document changes in real-time using Compat SDK
    const docRef = db.collection("simulations").doc(SIMULATION_DOC_ID);
    
    const unsub = docRef.onSnapshot(
      (docSnap: any) => {
        // Handle both compat (property) and possible function check for existence
        const exists = typeof docSnap.exists === 'function' ? docSnap.exists() : docSnap.exists;

        if (exists) {
          const data = docSnap.data();
          
          // Optimization: check if data actually changed to avoid unnecessary re-renders
          // We can't easily check 'deeply' fast, but we can rely on the fact that if we just saved,
          // the data coming back is likely the same (except maybe timestamps).
          
          // We apply the merge logic immediately
          const mergedProjects = data.projects ? mergeProjects(data.projects) : INITIAL_PROJECTS;
          
          // Indicate that the next state changes are from the DB, not the user
          ignoreRemoteUpdate.current = true;

          setProjects(mergedProjects);
          if (data.studentCount) setStudentCount(data.studentCount);
          if (data.feeRates) setFeeRates(data.feeRates);
          
          setDbStatus('connected');
          setErrorMessage(null);
          setLastSaved(new Date()); // Assume synced if we just got data
          
          // Also update local storage as backup
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
              ...data,
              projects: mergedProjects // Save the merged version
          }));
        } else {
          // Doc doesn't exist yet, create it with defaults later (on save)
          setDbStatus('connected');
        }
        setIsLoading(false);
      },
      (error: any) => {
        console.error("Firebase Error:", error);
        
        // Handle Permission Denied specifically
        if (error.code === 'permission-denied') {
            setErrorMessage("Accès refusé. Veuillez vérifier les règles de sécurité dans la console Firebase (mettre 'allow read, write: if true').");
        } else if (error.code === 'unavailable') {
            setErrorMessage("Hors ligne. Passage en mode local.");
            setDbStatus('offline');
        } else {
            setErrorMessage(error.message);
            setDbStatus('error');
        }

        // Fallback to LocalStorage
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                if (parsed.projects) setProjects(mergeProjects(parsed.projects));
                if (parsed.studentCount) setStudentCount(parsed.studentCount);
                if (parsed.feeRates) setFeeRates(parsed.feeRates);
            } catch (e) {}
        }
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [mergeProjects]);

  // 2. Save Data (Debounced)
  useEffect(() => {
    if (isLoading) return;

    // STABILITY FIX: If the current change was triggered by the DB listener (onSnapshot),
    // do not trigger a save back to the DB. Reset the flag and exit.
    if (ignoreRemoteUpdate.current) {
      ignoreRemoteUpdate.current = false;
      return;
    }

    const saveData = async () => {
      setIsSaving(true);
      const now = new Date();
      const dataToSave = {
          projects,
          studentCount,
          feeRates,
          updatedAt: now.toISOString()
      };

      // 1. Always save to LocalStorage first (instant backup)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));

      // 2. Try saving to Firebase using Compat SDK
      if (db) {
        try {
            const docRef = db.collection("simulations").doc(SIMULATION_DOC_ID);
            // Use merge: true to avoid overwriting other fields if they exist (though here we control the whole doc)
            await docRef.set(dataToSave, { merge: true });
            
            setDbStatus('connected');
            setErrorMessage(null);
            setLastSaved(now);
        } catch (error: any) {
            console.error("Save failed", error);
            if (error.code === 'permission-denied') {
                setDbStatus('error');
                setErrorMessage("Permission refusée lors de la sauvegarde. Vérifiez les règles Firebase.");
            } else {
                setDbStatus('offline');
            }
        }
      }

      setIsSaving(false);
    };

    const timeoutId = setTimeout(saveData, 2000); // Increased debounce to 2s for better stability
    return () => clearTimeout(timeoutId);
  }, [projects, studentCount, feeRates, isLoading]);

  const handleResetData = async () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser toutes les données aux valeurs par défaut ?")) {
      setProjects(INITIAL_PROJECTS);
      setStudentCount(INITIAL_STUDENT_COUNT);
      setFeeRates({});
      // The useEffect will trigger the save automatically because this is a user action
    }
  };

  // --- Logic ---

  const toggleProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const updateProjectCost = (id: string, cost: number) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, totalCost: cost } : p));
  };

  const updateProjectPeriod = (id: string, startYear: number, endYear: number) => {
    const duration = Math.max(1, endYear - startYear + 1);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, startYear, durationYears: duration } : p));
  };

  const updateFeeRate = (year: number, rate: number) => {
    setFeeRates(prev => ({ ...prev, [year]: rate }));
  };

  const simulationData = useMemo(() => {
    let accumulatedBalance = 0;
    const yearlyData: YearlyFinancials[] = [];
    
    let currentTotalRevenue = GLOBAL_REVENUE;

    YEARS_TO_SIMULATE.forEach(year => {
      const baseCapacity = year >= ANEF_YEAR ? BASE_CAPACITY + ANEF_BOOST : BASE_CAPACITY;
      const yearlyEvolutionRate = feeRates[year] || 0;
      currentTotalRevenue = currentTotalRevenue * (1 + (yearlyEvolutionRate / 100));
      const feeRevenue = currentTotalRevenue - GLOBAL_REVENUE;
      const totalCapacity = baseCapacity + feeRevenue;

      let currentYearCosts = 0;
      const activeProjectNames: string[] = [];

      projects.forEach(p => {
        if (!p.isActive) return;
        if (year >= p.startYear && year < p.startYear + p.durationYears) {
          const yearlyCost = p.totalCost / p.durationYears;
          currentYearCosts += yearlyCost;
          activeProjectNames.push(p.name);
        }
      });

      const balance = totalCapacity - currentYearCosts;
      accumulatedBalance += balance;

      yearlyData.push({
        year,
        label: year.toString(),
        baseCapacity,
        feeRevenue,
        investmentCapacity: totalCapacity,
        projectCosts: currentYearCosts,
        balance,
        accumulatedBalance,
        activeProjects: activeProjectNames
      });
    });

    return yearlyData;
  }, [projects, feeRates]);

  const summary = useMemo<SimulationSummary>(() => {
    const totalInvestment = projects
      .filter(p => p.isActive)
      .reduce((sum, p) => sum + p.totalCost, 0);
    
    const totalCapacity = simulationData.reduce((sum, d) => sum + d.investmentCapacity, 0);
    
    const finalBalance = simulationData[simulationData.length - 1].accumulatedBalance;
    const fundingGap = finalBalance < 0 ? Math.abs(finalBalance) : 0;

    const yearsWithDeficit = simulationData.filter(d => d.balance < 0).length;
    const maxYearlyDeficit = Math.min(...simulationData.map(d => d.balance));

    return {
      totalInvestment,
      totalCapacity,
      fundingGap,
      maxYearlyDeficit,
      yearsWithDeficit
    };
  }, [projects, simulationData]);

  const formatCurrency = useCallback((amount: number) => {
    if (currency === 'EUR') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount / EXCHANGE_RATE_EUR);
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  }, [currency]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Chargement des données...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-200">
              <Calculator className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">LFJP Invest <span className="font-normal text-slate-500">| 2026-2030</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Currency Toggle */}
             <button 
                onClick={() => setCurrency(prev => prev === 'XOF' ? 'EUR' : 'XOF')}
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
                onClick={handleResetData}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors px-3 py-1 rounded-full hover:bg-red-50"
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
                 onChange={(e) => setStudentCount(Math.max(1, parseInt(e.target.value) || 0))}
                 className="bg-transparent border-none outline-none w-16 text-sm font-semibold text-slate-700 text-right"
               />
               <span className="text-xs text-slate-500">élèves</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {errorMessage && (
           <div className={`border-l-4 p-4 mb-6 rounded-r flex justify-between items-center ${errorMessage?.includes('règles') ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {errorMessage?.includes('règles') ? <AlertCircle className="h-5 w-5 text-red-500" /> : <CloudOff className="h-5 w-5 text-amber-500" />}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${errorMessage?.includes('règles') ? 'text-red-700' : 'text-amber-700'}`}>
                  <strong>{errorMessage?.includes('règles') ? "Action requise sur Firebase" : "Mode hors ligne"} : </strong> 
                  {errorMessage}
                  {errorMessage?.includes('règles') && (
                    <span className="block mt-1 text-xs">
                        Allez dans l'onglet <strong>Règles</strong> de votre base de données Firestore et mettez <code>allow read, write: if true;</code>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Investissement Total</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalInvestment)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wallet className="w-5 h-5" /></div>
            </div>
          </div>

          <div className={`p-5 rounded-xl border shadow-sm ${summary.fundingGap > 0 ? 'bg-white border-red-200' : 'bg-white border-green-200'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Manque à gagner (Fin 2030)</p>
                <p className={`text-2xl font-bold ${summary.fundingGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(summary.fundingGap)}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${summary.fundingGap > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Capacité Totale</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalCapacity)}</p>
                <p className="text-xs text-slate-400 mt-1">Inclut budget + ANEF + % Ecolages</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Wallet className="w-5 h-5" /></div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT: Projects (3/12 on XL) */}
          <div className="xl:col-span-3 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-400" />
                Projets
              </h2>
              
              <div className="flex flex-col gap-4">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onToggle={toggleProject}
                    onCostChange={updateProjectCost}
                    onPeriodChange={updateProjectPeriod}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE: Financials (6/12 on XL) */}
          <div className="xl:col-span-6 space-y-6">
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-400" />
                Analyse Financière
              </h2>
            <FinancialChart data={simulationData} currency={currency} />

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 text-sm">Trésorerie Annuelle</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-4 py-3">Année</th>
                      <th className="px-4 py-3">Capacité (Base)</th>
                      <th className="px-4 py-3 text-orange-600">Levier Ecolages</th>
                      <th className="px-4 py-3">Dépenses</th>
                      <th className="px-4 py-3">Solde</th>
                      <th className="px-4 py-3">Cumul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {simulationData.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">{row.label}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 text-xs">{formatCurrency(row.baseCapacity)}</td>
                        <td className={`px-4 py-3 font-mono text-xs font-semibold ${row.feeRevenue < 0 ? 'text-red-500' : 'text-orange-600'}`}>
                          {row.feeRevenue > 0 ? '+' : ''}{formatCurrency(row.feeRevenue)}
                        </td>
                        <td className="px-4 py-3 font-mono text-blue-600 text-xs">{formatCurrency(row.projectCosts)}</td>
                        <td className={`px-4 py-3 font-mono font-bold text-xs ${row.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatCurrency(row.balance)}
                        </td>
                        <td className={`px-4 py-3 font-mono text-xs ${row.accumulatedBalance >= 0 ? 'text-slate-600' : 'text-red-600'}`}>
                          {formatCurrency(row.accumulatedBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gantt Chart */}
            <ProjectGantt 
                projects={projects} 
                years={YEARS_TO_SIMULATE} 
                onPeriodChange={updateProjectPeriod}
                onToggle={toggleProject}
                currency={currency}
            />

          </div>

          {/* RIGHT: Fee Simulator (3/12 on XL) */}
          <div className="xl:col-span-3">
            <div className="sticky top-24">
               <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-slate-400" />
                Financement
              </h2>
              <FeeSimulator 
                years={YEARS_TO_SIMULATE}
                feeRates={feeRates}
                globalRevenue={GLOBAL_REVENUE}
                onRateChange={updateFeeRate}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
