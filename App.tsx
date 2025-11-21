
import React, { useState, useMemo } from 'react';
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
import { Wallet, TrendingDown, Users, Calculator, Building2 } from 'lucide-react';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [studentCount, setStudentCount] = useState<number>(INITIAL_STUDENT_COUNT);
  const [feeRates, setFeeRates] = useState<Record<number, number>>({});

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
    
    // Track revenue evolution year over year
    let currentTotalRevenue = GLOBAL_REVENUE;

    YEARS_TO_SIMULATE.forEach(year => {
      // 1. Calculate Base Capacity
      const baseCapacity = year >= ANEF_YEAR ? BASE_CAPACITY + ANEF_BOOST : BASE_CAPACITY;
      
      // 2. Calculate Fee Revenue (Compound Logic)
      // Get the evolution rate for this specific year (default 0%)
      const yearlyEvolutionRate = feeRates[year] || 0;
      
      // Apply evolution to the running total revenue
      currentTotalRevenue = currentTotalRevenue * (1 + (yearlyEvolutionRate / 100));
      
      // The "Fee Revenue" available for investment is the delta between 
      // the new current revenue and the original baseline revenue.
      const feeRevenue = currentTotalRevenue - GLOBAL_REVENUE;
      
      // 3. Total Investment Capacity
      const totalCapacity = baseCapacity + feeRevenue;

      // 4. Calculate Expenses for this year
      let currentYearCosts = 0;
      const activeProjectNames: string[] = [];

      projects.forEach(p => {
        if (!p.isActive) return;
        
        // Check if year falls within project timeline
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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

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
          
          <div className="flex items-center gap-4">
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
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Investissement Total</p>
                <p className="text-2xl font-bold text-slate-800">{formatMoney(summary.totalInvestment)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wallet className="w-5 h-5" /></div>
            </div>
          </div>

          <div className={`p-5 rounded-xl border shadow-sm ${summary.fundingGap > 0 ? 'bg-white border-red-200' : 'bg-white border-green-200'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Manque à gagner (Fin 2030)</p>
                <p className={`text-2xl font-bold ${summary.fundingGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatMoney(summary.fundingGap)}
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
                <p className="text-2xl font-bold text-emerald-600">{formatMoney(summary.totalCapacity)}</p>
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
            <FinancialChart data={simulationData} />

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
                        <td className="px-4 py-3 font-mono text-slate-500 text-xs">{formatMoney(row.baseCapacity)}</td>
                        <td className={`px-4 py-3 font-mono text-xs font-semibold ${row.feeRevenue < 0 ? 'text-red-500' : 'text-orange-600'}`}>
                          {row.feeRevenue > 0 ? '+' : ''}{formatMoney(row.feeRevenue)}
                        </td>
                        <td className="px-4 py-3 font-mono text-blue-600 text-xs">{formatMoney(row.projectCosts)}</td>
                        <td className={`px-4 py-3 font-mono font-bold text-xs ${row.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatMoney(row.balance)}
                        </td>
                        <td className={`px-4 py-3 font-mono text-xs ${row.accumulatedBalance >= 0 ? 'text-slate-600' : 'text-red-600'}`}>
                          {formatMoney(row.accumulatedBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: Fee Simulator (3/12 on XL) */}
          <div className="xl:col-span-3">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
               <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-slate-400" />
                Financement
              </h2>
              <FeeSimulator 
                years={YEARS_TO_SIMULATE}
                feeRates={feeRates}
                globalRevenue={GLOBAL_REVENUE}
                onRateChange={updateFeeRate}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
