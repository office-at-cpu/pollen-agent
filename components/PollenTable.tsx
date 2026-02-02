
import React, { useState } from 'react';
import { UIViewModel } from '../types';

interface PollenTableProps {
  tableData: UIViewModel['tables'][0];
}

const PollenTable: React.FC<PollenTableProps> = ({ tableData }) => {
  const [collapsed, setCollapsed] = useState<string[]>(tableData.default_collapsed_categories || []);

  const toggleCategory = (cat: string) => {
    setCollapsed(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const getSeverityColor = (label: string) => {
    const l = String(label || '').toLowerCase();
    if (l.includes('keine')) return 'bg-emerald-50 text-emerald-600';
    if (l.includes('gering')) return 'bg-green-50 text-green-600';
    if (l.includes('mittel')) return 'bg-amber-50 text-amber-600';
    if (l.includes('hoch')) return 'bg-orange-50 text-orange-600';
    if (l.includes('sehr hoch')) return 'bg-red-50 text-red-600';
    return 'bg-slate-50 text-slate-500';
  };

  const columns = tableData.columns || [
    { key: 'pollen_type', label: 'Pollenart' },
    { key: 'label', label: 'Belastung' },
    { key: 'inferred', label: 'Tendenz' }
  ];
  const rows = tableData.rows || [];

  const renderRow = (row: any, idx: number) => (
    <tr key={idx} className="hover:bg-slate-50/50 transition-colors border-none">
      {columns.map(col => {
        const val = row[col.key];
        return (
          <td key={col.key} className="py-4 px-6 text-sm text-slate-600">
            {col.key === 'label' ? (
              <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getSeverityColor(val)}`}>
                {val}
              </span>
            ) : col.key === 'inferred' ? (
              <span className="text-xs font-bold text-slate-400 italic">
                {val}
              </span>
            ) : (
              <span className="font-bold text-slate-800">{val}</span>
            )}
          </td>
        );
      })}
    </tr>
  );

  const groupedRows: Record<string, any[]> = {};
  if (tableData.group_by || rows.some(r => r.category)) {
    const groupKey = tableData.group_by || 'category';
    rows.forEach(row => {
      const cat = row[groupKey] || 'Sonstige';
      if (!groupedRows[cat]) groupedRows[cat] = [];
      groupedRows[cat].push(row);
    });
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
      <div className="p-6 bg-white">
        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">{tableData.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30">
              {columns.map(col => (
                <th key={col.key} className="py-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-transparent">
            {Object.keys(groupedRows).length > 0 ? (
              Object.keys(groupedRows).map(cat => (
                <React.Fragment key={cat}>
                  <tr 
                    className="bg-slate-50/50 cursor-pointer select-none border-none"
                    onClick={() => toggleCategory(cat)}
                  >
                    <td colSpan={columns.length} className="py-3 px-6 text-[10px] font-black text-blue-600 flex items-center gap-2 uppercase tracking-widest">
                      <span className={`transform transition-transform duration-200 ${collapsed.includes(cat) ? '-rotate-90' : ''}`}>▼</span>
                      {cat}
                    </td>
                  </tr>
                  {!collapsed.includes(cat) && groupedRows[cat].map((row, idx) => renderRow(row, idx))}
                </React.Fragment>
              ))
            ) : (
              rows.map((row, idx) => renderRow(row, idx))
            )}
          </tbody>
        </table>
      </div>
      {tableData.notes && tableData.notes.length > 0 && (
        <div className="p-6 bg-white">
          {tableData.notes.map((note, i) => (
            <p key={i} className="text-[10px] text-slate-300 italic font-medium">* {note}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollenTable;
