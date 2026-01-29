
import React, { useState } from 'react';
import { fetchPollenData } from '../services/geminiService';
import { UIViewModel } from '../types';
import PollenCharts from './PollenCharts';
import PollenTable from './PollenTable';

const App: React.FC = () => {
  const [plz, setPlz] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UIViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeText = (val: any): string => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && 'text' in val) return String(val.text);
    if (val === null || val === undefined) return '';
    return String(val);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!/^\d{4}$/.test(plz)) {
      setError("Bitte geben Sie eine gültige 4-stellige österreichische Postleitzahl ein.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await fetchPollenData(plz);
      if (result && (result.header || result.kpi_cards)) {
        setData(result);
      } else {
        throw new Error("Das Ergebnis konnte nicht korrekt formatiert werden.");
      }
    } catch (err: any) {
      console.error("Search Handler Error:", err);
      setError(err.message || "Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: 'good' | 'warn' | 'bad') => {
    const styles = {
      good: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      warn: 'bg-amber-50 text-amber-700 border-amber-100',
      bad: 'bg-rose-50 text-rose-700 border-rose-100'
    };
    return styles[severity] || styles.warn;
  };

  const PollenScaleLegend = () => (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mt-4">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bedeutung der Belastungsstufen</h4>
      <div className="grid grid-cols-5 gap-1">
        {[
          { l: '0', c: 'bg-emerald-500', t: 'Keine', d: 'Keine Pollen' },
          { l: '1', c: 'bg-emerald-400', t: 'Gering', d: 'Kaum Reizung' },
          { l: '2', c: 'bg-amber-500', t: 'Mittel', d: 'Symptome möglich' },
          { l: '3', c: 'bg-orange-500', t: 'Hoch', d: 'Deutliche Last' },
          { l: '4', c: 'bg-rose-600', t: 'Sehr Hoch', d: 'Starke Belastung' }
        ].map((item) => (
          <div key={item.l} className="flex flex-col items-center">
            <div className={`w-full h-1.5 ${item.c} rounded-full mb-1`}></div>
            <span className="text-[10px] font-bold text-slate-700">{item.t}</span>
            <span className="text-[9px] text-slate-400 hidden sm:block">{item.d}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-12 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Polleninformation Dr. Schätz</h1>
              <p className="text-xs text-slate-500 font-medium italic">Ihre dermatologische Praxis in Österreich</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text" 
              placeholder="PLZ"
              value={plz}
              onChange={(e) => setPlz(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-center text-slate-700 font-medium"
              maxLength={4}
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-md shadow-blue-100 disabled:opacity-50"
            >
              {loading ? 'Analysiere...' : 'Prüfen'}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <p className="font-bold">Hinweis zur Analyse</p>
            </div>
            <p className="text-sm opacity-90">{safeText(error)}</p>
            <button 
              onClick={() => handleSearch()}
              className="mt-4 text-xs font-bold uppercase tracking-wider bg-rose-200 hover:bg-rose-300 text-rose-800 px-4 py-2 rounded-lg transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 opacity-30">🌻</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Willkommen beim Pollen-Agent</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Geben Sie Ihre Postleitzahl ein, um aktuelle Daten für Ihren Standort in Österreich zu erhalten.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium italic">Dr. Schätz führt eine Live-Recherche durch...</p>
            <p className="text-xs text-slate-400">Dies kann bis zu 60 Sekunden dauern.</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Header / Standort */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Standort & Zeit</h4>
                  <p className="text-lg font-bold text-slate-800 leading-tight">
                    {safeText(data.header?.subtitle || `Analyse für PLZ ${plz}`).replace('Standort: ', '')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{safeText(data.header?.timestamp_label)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(data.header?.quality_badges ?? []).map((badge, idx) => (
                    <div key={idx} className={`px-3 py-2 rounded-xl border flex flex-col ${getSeverityBadge(badge.severity)}`}>
                      <span className="text-[9px] uppercase font-bold opacity-60">Datenquelle</span>
                      <span className="text-xs font-bold mt-1">{safeText(badge.label)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(data.kpi_cards ?? []).map(card => (
                  <div key={card.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:border-blue-200 transition-colors">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{safeText(card.title)}</span>
                    <span className={`text-xl font-bold mb-2 ${
                      card.severity === 'bad' ? 'text-rose-600' : 
                      card.severity === 'warn' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {safeText(card.value_label)}
                    </span>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          card.severity === 'bad' ? 'bg-rose-500' : 
                          card.severity === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (card.value_level / 4) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <PollenScaleLegend />
            </div>

            {/* Zusammenfassungen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 tracking-widest">Lagebericht Heute</h4>
                <p className="text-base text-blue-900 font-medium leading-relaxed">{safeText(data.summaries?.today_one_liner)}</p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-800 uppercase mb-3 tracking-widest">Prognose</h4>
                <p className="text-base text-indigo-900 font-medium leading-relaxed">{safeText(data.summaries?.next_days_one_liner)}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6">
              {(data.charts ?? []).map(chart => (
                <PollenCharts key={chart.id} chartData={chart} />
              ))}
            </div>

            {/* Empfehlungen (Nicht fett gemäß Anforderung) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(data.recommendation_blocks ?? []).map(block => (
                <div key={block.id} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">{safeText(block.title)}</h3>
                  <ul className="space-y-4">
                    {(block.items ?? []).map((item, idx) => (
                      <li key={idx} className="flex gap-3 items-start">
                        <span className="w-5 h-5 mt-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">✓</span>
                        <div>
                          <p className="text-slate-800 text-sm leading-tight">{safeText(item.title)}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{safeText(item.detail)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Tabellen */}
            <div className="space-y-6">
              {(data.tables ?? []).map(table => (
                <PollenTable key={table.id} tableData={table} />
              ))}
            </div>

            {/* Quellen & Disclaimer */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              {data.groundingSources && data.groundingSources.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Quellen & Referenzen</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-2">
                    {data.groundingSources.map((source, i) => (
                      <div 
                        key={i} 
                        className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm select-none"
                      >
                        {source.title.length > 50 ? source.title.substring(0, 50) + '...' : source.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs font-bold text-slate-700 mb-1 italic">Haftungsausschluss:</p>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                {safeText(data.disclaimer || "Die bereitgestellten Informationen dienen der allgemeinen Orientierung und ersetzen keine ärztliche Beratung.")}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
