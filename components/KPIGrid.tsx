
import React from 'react';
import { SimulationSummary } from '../types';
import { Wallet, TrendingDown } from 'lucide-react';

interface Props {
  summary: SimulationSummary;
  formatCurrency: (val: number) => string;
}

const KPIGrid: React.FC<Props> = ({ summary, formatCurrency }) => {
  return (
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
  );
};

export default KPIGrid;
