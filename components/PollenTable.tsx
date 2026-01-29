
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
    if (l.includes('keine')) return 'bg-emerald-100 text-emerald-700';
    if (l.includes('gering')) return 'bg-green-100 text-green-700';
    if (l.includes('mittel')) return 'bg-amber-100 text-amber-700';
    if (l.includes('hoch')) return 'bg-orange-100 text-orange-700';
    if (l.includes('sehr hoch')) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };

  // Stelle sicher, dass wir nur valide Spalten rendern
  const columns = tableData.columns || [
    { key: 'pollen_type', label: 'Pollenart' },
    { key: 'label', label: 'Belastung' },
    { key: 'inferred', label: 'Tendenz' }
  ];
  const rows = tableData.rows || [];

  const renderRow = (row: any, idx: number) => (
    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      {columns.map(col => {
        const val = row[col.key];
        return (
          <td key={col.key} className="py-3 px-4 text-sm text-slate-600">
            {col.key === 'label' ? (
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${getSeverityColor(val)}`}>
                {val}
              </span>
            ) : col.key === 'inferred' ? (
              <span className="text-xs font-medium text-slate-500 italic">
                {val}
              </span>
            ) : (
              <span className="font-medium text-slate-800">{val}</span>
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{tableData.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30">
              {columns.map(col => (
                <th key={col.key} className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedRows).length > 0 ? (
              Object.keys(groupedRows).map(cat => (
                <React.Fragment key={cat}>
                  <tr 
                    className="bg-slate-50/80 cursor-pointer select-none border-y border-slate-100"
                    onClick={() => toggleCategory(cat)}
                  >
                    <td colSpan={columns.length} className="py-2 px-4 text-xs font-bold text-slate-500 flex items-center gap-2">
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
        <div className="p-4 bg-slate-50/30 border-t border-slate-100">
          {tableData.notes.map((note, i) => (
            <p key={i} className="text-[10px] text-slate-400 italic">* {note}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollenTable;
