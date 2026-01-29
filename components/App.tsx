
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
    return String(val || '');
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
      setData(result);
    } catch (err: any) {
      console.error("Search Error:", err);
      // Fallback Fehlermeldung, falls process.env.API_KEY nicht geladen wurde
      if (err.message?.includes("API_KEY") || err.message?.includes("API Key")) {
        setError("API-Key Fehler: Bitte stellen Sie sicher, dass die Umgebungsvariable API_KEY in Vercel korrekt gesetzt ist.");
      } else {
        setError(err.message || "Ein technischer Fehler ist aufgetreten.");
      }
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
              {loading ? 'Suche...' : 'Prüfen'}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl mb-8 flex items-start gap-4 animate-in slide-in-from-top-2">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-bold mb-1">Hinweis</p>
              <p className="text-sm opacity-90">{safeText(error)}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700 italic">Dr. Schätz analysiert die aktuelle Lage...</p>
              <p className="text-sm text-slate-400 mt-1">Bitte haben Sie einen Moment Geduld.</p>
            </div>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 block">Lagebericht für Österreich</span>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">
                  {safeText(data.header?.subtitle).replace('Standort: ', '')}
                </h2>
                <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  {safeText(data.header?.timestamp_label)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(data.header?.quality_badges ?? []).map((badge, idx) => (
                  <div key={idx} className={`px-4 py-2 rounded-2xl border flex flex-col justify-center ${getSeverityBadge(badge.severity)}`}>
                    <span className="text-[9px] uppercase font-black opacity-50 tracking-wider">Status</span>
                    <span className="text-xs font-bold">{safeText(badge.label)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(data.kpi_cards ?? []).map(card => (
                <div key={card.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{safeText(card.title)}</p>
                  <p className={`text-2xl font-black mb-4 ${
                    card.severity === 'bad' ? 'text-rose-600' : 
                    card.severity === 'warn' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {safeText(card.value_label)}
                  </p>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        card.severity === 'bad' ? 'bg-rose-500' : 
                        card.severity === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (card.value_level / 4) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-3xl border border-blue-100 shadow-sm">
                <h4 className="text-xs font-black text-blue-800 uppercase mb-4 tracking-widest">Dermatologischer Fokus</h4>
                <p className="text-lg text-slate-800 font-semibold leading-relaxed">{safeText(data.summaries?.today_one_liner)}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-indigo-100 shadow-sm">
                <h4 className="text-xs font-black text-indigo-800 uppercase mb-4 tracking-widest">Wochenprognose</h4>
                <p className="text-lg text-slate-800 font-semibold leading-relaxed">{safeText(data.summaries?.next_days_one_liner)}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-6">
              {(data.charts ?? []).map(chart => (
                <PollenCharts key={chart.id} chartData={chart} />
              ))}
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(data.recommendation_blocks ?? []).map(block => (
                <div key={block.id} className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-black text-slate-800 mb-6">{safeText(block.title)}</h3>
                  <div className="space-y-6">
                    {(block.items ?? []).map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold leading-tight mb-1">{safeText(item.title)}</p>
                          <p className="text-sm text-slate-500 leading-relaxed">{safeText(item.detail)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="space-y-6">
              {(data.tables ?? []).map(table => (
                <PollenTable key={table.id} tableData={table} />
              ))}
            </div>

            {/* Grounding Sources */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              {data.groundingSources && data.groundingSources.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Referenzquellen</p>
                  <div className="flex flex-wrap gap-2">
                    {data.groundingSources.map((source, i) => (
                      <a 
                        key={i} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors shadow-sm"
                      >
                        {source.title.length > 40 ? source.title.substring(0, 40) + '...' : source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  <strong>Haftungsausschluss:</strong> {safeText(data.disclaimer || "Diese automatisierte Analyse basiert auf aktuellen Web-Daten und dient der unverbindlichen Information.")}
                </p>
              </div>
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="text-center py-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="text-7xl mb-8 filter grayscale opacity-20">🏥</div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">Pollen-Check starten</h2>
            <p className="text-slate-500 max-w-sm mx-auto text-lg">
              Geben Sie eine österreichische PLZ ein, um den dermatologischen Lagebericht abzurufen.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
