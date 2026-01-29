
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UIViewModel } from '../types';

interface PollenChartsProps {
  chartData: UIViewModel['charts'][0];
}

const PollenCharts: React.FC<PollenChartsProps> = ({ chartData }) => {
  // Map the series into a format suitable for Recharts
  const xValues = chartData.x?.values ?? [];
  const series = chartData.series ?? [];
  
  const data = xValues.map((date, index) => {
    const entry: any = { date };
    series.forEach((s) => {
      entry[s.name] = (s.values ?? [])[index];
    });
    return entry;
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{chartData.title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            domain={[chartData.y?.min ?? 0, chartData.y?.max ?? 4]} 
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" />
          {series.map((s, idx) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={colors[idx % colors.length]}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {(chartData.annotations ?? []).map((ann, i) => (
        <p key={i} className="text-xs text-slate-500 mt-2 italic">
          * {ann.text}
        </p>
      ))}
    </div>
  );
};

export default PollenCharts;
