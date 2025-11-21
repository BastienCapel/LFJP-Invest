import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { YearlyFinancials } from '../types';

interface Props {
  data: YearlyFinancials[];
}

const formatCurrencyShort = (value: number) => {
  return `${(value / 1000000).toFixed(0)}M`;
};

const FinancialChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-80 w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Flux de Trésorerie Prévisionnel</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            tickFormatter={formatCurrencyShort} 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value)}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
          
          {/* Capacity Line */}
          <Line 
            type="stepAfter" 
            dataKey="investmentCapacity" 
            name="Capacité d'Investissement" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
          />

          {/* Expense Bars */}
          <Bar 
            dataKey="projectCosts" 
            name="Dépenses Projets" 
            radius={[4, 4, 0, 0]} 
            barSize={40}
          >
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.projectCosts > entry.investmentCapacity ? '#ef4444' : '#3b82f6'} />
              ))}
          </Bar>

          {/* Zero Line */}
          <ReferenceLine y={0} stroke="#000" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinancialChart;
