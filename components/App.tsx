
import React, { useState, useEffect } from 'react';
import { fetchPollenData } from '../services/geminiService';
import { UIViewModel } from '../types';
import PollenCharts from './PollenCharts';
import PollenTable from './PollenTable';

const App: React.FC = () => {
  const [plz, setPlz] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UIViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVercelMissingKey, setIsVercelMissingKey] = useState(false);

  const getCoords = (): Promise<{ lat: number; lng: number } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(undefined);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(undefined),
        { timeout: 5000 }
      );
    });
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
    setIsVercelMissingKey(false);

    try {
      const coords = await getCoords();
      const result = await fetchPollenData(plz, coords);
      setData(result);
    } catch (err: any) {
      console.error("Search Error:", err);
      if (err.message === "API_KEY_MISSING") {
        setIsVercelMissingKey(true);
        setError("API-Konfiguration erforderlich.");
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
    <div className="min-h-screen pb-12 text-slate-900 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Polleninformation Dr. Schätz</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dermatologische Praxis Österreich</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <input 
              type="text" 
              placeholder="PLZ"
              value={plz}
              onChange={(e) => setPlz(e.target.value)}
              className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-28 text-center text-slate-700 font-bold text-lg"
              maxLength={4}
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md shadow-blue-100 disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Analyse...' : 'Prüfen'}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {isVercelMissingKey && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-8 rounded-3xl mb-8 animate-in slide-in-from-top-4 duration-500 shadow-sm">
            <h3 className="text-lg font-black mb-2 flex items-center gap-2">
              <span className="text-2xl">🔑</span> API-Key Einrichtung notwendig
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Damit die App auf Vercel funktioniert, muss der API-Key in Ihrem Vercel-Dashboard hinterlegt werden:
            </p>
            <ol className="text-xs space-y-2 list-decimal list-inside opacity-90 mb-6 font-medium">
              <li>Gehen Sie zu <b>Settings > Environment Variables</b> in Vercel.</li>
              <li>Fügen Sie eine Variable mit dem Namen <b>API_KEY</b> hinzu.</li>
              <li>Fügen Sie Ihren Gemini-Key als Wert ein.</li>
              <li>Starten Sie ein <b>Redeploy</b> Ihrer Anwendung.</li>
            </ol>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors"
            >
              API Key bei Google holen
            </a>
          </div>
        )}

        {error && !isVercelMissingKey && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl mb-8 flex items-start gap-4 animate-in slide-in-from-top-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold mb-1">Hinweis zur Analyse</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-800 italic">Dr. Schätz führt eine Live-Recherche durch...</p>
              <p className="text-sm text-slate-400 mt-2">Aktuelle Datenquellen werden für Ihren Standort ausgewertet.</p>
            </div>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Result */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Dermatologisches Bulletin</span>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">
                  {data.header?.subtitle?.replace('Standort: ', '')}
                </h2>
                <div className="flex items-center gap-2 mt-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-tighter">{data.header?.timestamp_label}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(data.header?.quality_badges ?? []).map((badge, idx) => (
                  <div key={idx} className={`px-4 py-2 rounded-2xl border flex flex-col justify-center ${getSeverityBadge(badge.severity)}`}>
                    <span className="text-[8px] uppercase font-black opacity-50 tracking-widest">Status</span>
                    <span className="text-xs font-bold">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(data.kpi_cards ?? []).map(card => (
                <div key={card.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{card.title}</p>
                  <p className={`text-2xl font-black mb-4 ${
                    card.severity === 'bad' ? 'text-rose-600' : 
                    card.severity === 'warn' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {card.value_label}
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
              <div className="bg-gradient-to-br from-blue-50/50 to-white p-8 rounded-3xl border border-blue-100 shadow-sm">
                <h4 className="text-[10px] font-black text-blue-800 uppercase mb-4 tracking-widest">Lagebericht Heute</h4>
                <p className="text-lg text-slate-800 font-bold leading-relaxed">{data.summaries?.today_one_liner}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50/50 to-white p-8 rounded-3xl border border-indigo-100 shadow-sm">
                <h4 className="text-[10px] font-black text-indigo-800 uppercase mb-4 tracking-widest">Trendprognose</h4>
                <p className="text-lg text-slate-800 font-bold leading-relaxed">{data.summaries?.next_days_one_liner}</p>
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
                  <h3 className="text-xl font-black text-slate-800 mb-6">{block.title}</h3>
                  <div className="space-y-6">
                    {(block.items ?? []).map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold leading-tight mb-1">{item.title}</p>
                          <p className="text-sm text-slate-500 leading-relaxed">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tables */}
            <div className="space-y-6">
              {(data.tables ?? []).map(table => (
                <PollenTable key={table.id} tableData={table} />
              ))}
            </div>

            {/* Footer */}
            <div className="bg-slate-200/50 p-8 rounded-3xl border border-slate-200">
              {data.groundingSources && data.groundingSources.length > 0 && (
                <div className="mb-6 opacity-60">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Datenquellen (reiner Text):</p>
                  <div className="flex flex-col gap-1">
                    {data.groundingSources.map((s, i) => (
                      <span key={i} className="text-[9px] text-slate-500 font-mono break-all">{s.uri}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2">
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  <strong>Haftungsausschluss:</strong> {data.disclaimer || "Die Informationen basieren auf KI-Live-Recherche und dienen der unverbindlichen Information. Bei Symptomen fragen Sie Ihren Arzt."}
                </p>
              </div>
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="text-center py-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="text-7xl mb-8 opacity-20">🏥</div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Analyse starten</h2>
            <p className="text-slate-500 max-w-sm mx-auto text-lg font-medium leading-relaxed">
              Bitte geben Sie eine 4-stellige PLZ für Österreich ein, um den dermatologischen Lagebericht abzurufen.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
