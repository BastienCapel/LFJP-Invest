
import React from 'react';
import { YearlyFinancials } from '../types';

interface Props {
  data: YearlyFinancials[];
  formatCurrency: (val: number) => string;
}

const FinancialTable: React.FC<Props> = ({ data, formatCurrency }) => {
  return (
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
            {data.map((row) => (
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
  );
};

export default FinancialTable;
