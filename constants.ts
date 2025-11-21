
import { Project } from './types';

export const INITIAL_STUDENT_COUNT = 630;
export const BASE_CAPACITY = 70000000; // 70M FCFA
export const ANEF_BOOST = 30000000; // 30M FCFA
export const ANEF_YEAR = 2028; // Starts in 2028

// Revenue calculation: 1 266 470 000 - 5% (remises)
export const GLOBAL_REVENUE = 1266470000 * 0.95; // ~1.203 Billion FCFA

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'clim',
    name: 'Climatisation (Phases 2 & 3)',
    category: 'equipment',
    totalCost: 60000000,
    startYear: 2026,
    durationYears: 2, // Adjusted for 2026 start based on logic
    isActive: true,
    isVariable: true,
    variableMin: 30000000,
    variableMax: 60000000,
    description: 'Salles restantes (Min) ou Bureaux + Solaire (Max)'
  },
  {
    id: 'sport_cover',
    name: 'Couverture Terrain Sport',
    category: 'infra',
    totalCost: 75000000,
    startYear: 2026,
    durationYears: 3,
    isActive: true,
    isVariable: true,
    variableMin: 60000000,
    variableMax: 90000000,
    description: 'Structure de couverture pour le terrain'
  },
  {
    id: 'pool',
    name: 'Piscine',
    category: 'infra',
    totalCost: 125000000,
    startYear: 2027,
    durationYears: 2,
    isActive: true,
    isVariable: true,
    variableMin: 100000000,
    variableMax: 150000000,
    description: 'Rénovation et aménagements piscine'
  },
  {
    id: 'restauration',
    name: 'Restauration Scolaire',
    category: 'infra',
    totalCost: 300000000,
    startYear: 2027,
    durationYears: 3,
    isActive: true,
    isVariable: true,
    variableMin: 250000000,
    variableMax: 350000000,
    description: 'Construction et équipement du réfectoire'
  },
  {
    id: 'terrain',
    name: 'Acquisition Terrain',
    category: 'land',
    totalCost: 60000000,
    startYear: 2028,
    durationYears: 1,
    isActive: true,
    isVariable: true,
    variableMin: 50000000,
    variableMax: 80000000,
    description: 'Extension foncière'
  }
];

export const YEARS_TO_SIMULATE = [2026, 2027, 2028, 2029, 2030];