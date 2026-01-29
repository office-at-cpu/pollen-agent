
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
    switch (label?.toLowerCase()) {
      case 'keine': return 'bg-emerald-100 text-emerald-700';
      case 'gering': return 'bg-green-100 text-green-700';
      case 'mittel': return 'bg-amber-100 text-amber-700';
      case 'hoch': return 'bg-orange-100 text-orange-700';
      case 'sehr hoch': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const columns = tableData.columns ?? [];
  const rows = tableData.rows ?? [];
  const notes = tableData.notes ?? [];

  const renderRow = (row: any, idx: number) => (
    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      {columns.map(col => (
        <td key={col.key} className="py-3 px-4 text-sm text-slate-600">
          {col.key === 'label' ? (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(row[col.key])}`}>
              {row[col.key]}
            </span>
          ) : col.key === 'inferred' ? (
            <span className={`text-xs ${row[col.key] === 'ja' ? 'text-amber-600 italic' : 'text-slate-400'}`}>
              {row[col.key]}
            </span>
          ) : (
            row[col.key]
          )}
        </td>
      ))}
    </tr>
  );

  const groupedRows: Record<string, any[]> = {};
  if (tableData.group_by) {
    rows.forEach(row => {
      const cat = row[tableData.group_by!] || 'Andere';
      if (!groupedRows[cat]) groupedRows[cat] = [];
      groupedRows[cat].push(row);
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-semibold text-slate-800">{tableData.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30">
              {columns.map(col => (
                <th key={col.key} className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.group_by ? (
              Object.keys(groupedRows).map(cat => (
                <React.Fragment key={cat}>
                  <tr 
                    className="bg-slate-100/50 cursor-pointer select-none"
                    onClick={() => toggleCategory(cat)}
                  >
                    <td colSpan={columns.length} className="py-2 px-4 text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className={`transform transition-transform ${collapsed.includes(cat) ? '-rotate-90' : ''}`}>▼</span>
                      {cat} ({groupedRows[cat].length})
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
      {notes.length > 0 && (
        <div className="p-4 bg-slate-50/30 border-t border-slate-100">
          {notes.map((note, i) => (
            <p key={i} className="text-xs text-slate-500">* {note}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollenTable;
