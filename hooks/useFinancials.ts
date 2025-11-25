
import { useMemo, useCallback } from 'react';
import { Project, YearlyFinancials, SimulationSummary } from '../types';
import { 
  BASE_CAPACITY, 
  ANEF_BOOST, 
  ANEF_YEAR, 
  YEARS_TO_SIMULATE, 
  GLOBAL_REVENUE 
} from '../constants';

const EXCHANGE_RATE_EUR = 655.957;

export const useFinancials = (
    projects: Project[], 
    feeRates: Record<number, number>, 
    currency: 'XOF' | 'EUR'
) => {

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

  return {
    simulationData,
    summary,
    formatCurrency
  };
};
