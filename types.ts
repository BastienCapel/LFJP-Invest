
export interface Project {
  id: string;
  name: string;
  category: 'infra' | 'equipment' | 'land';
  totalCost: number;
  startYear: number; // e.g., 2025 for 2025-2026
  durationYears: number;
  isActive: boolean;
  isVariable?: boolean;
  variableMin?: number;
  variableMax?: number;
  description: string;
}

export interface YearlyFinancials {
  year: number;
  label: string; // e.g., "25-26"
  baseCapacity: number; // Base capacity + ANEF (without fees)
  feeRevenue: number; // Revenue from fee increase
  investmentCapacity: number; // Total (Base + Fee)
  projectCosts: number;
  balance: number; // Capacity - Costs
  accumulatedBalance: number;
  activeProjects: string[];
}

export interface SimulationSummary {
  totalInvestment: number;
  totalCapacity: number;
  fundingGap: number;
  maxYearlyDeficit: number;
  yearsWithDeficit: number;
}
