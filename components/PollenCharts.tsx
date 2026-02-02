
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UIViewModel } from '../types';

interface PollenChartsProps {
  chartData: UIViewModel['charts'][0];
}

const PollenCharts: React.FC<PollenChartsProps> = ({ chartData }) => {
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
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-50 h-[450px]">
      <h3 className="text-lg font-black text-slate-800 mb-6">{chartData.title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          {/* Gitterlinien und Achsenlinien entfernt für Clean Design */}
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            domain={[chartData.y?.min ?? 0, chartData.y?.max ?? 4]} 
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              padding: '12px'
            }}
            itemStyle={{ fontSize: '12px', fontWeight: 700 }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle" 
            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          {series.map((s, idx) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={colors[idx % colors.length]}
              strokeWidth={4}
              dot={{ r: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {(chartData.annotations ?? []).map((ann, i) => (
        <p key={i} className="text-[10px] text-slate-400 mt-4 italic font-medium">
          Note: {ann.text}
        </p>
      ))}
    </div>
  );
};

export default PollenCharts;
