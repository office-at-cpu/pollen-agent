
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
      if (result && (result as any).error) {
        setError(safeText((result as any).error.message) || "Standort-Fehler");
      } else if (result && result.header) {
        setData(result);
      } else {
        throw new Error("Ungültiges Datenformat empfangen.");
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

  const WeatherInfoSection = () => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
      <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
        <span>🌤️</span> Wetter-Einfluss
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
        <div className="bg-white/50 p-3 rounded-lg">
          <p className="font-bold mb-1 italic">🌧️ Regen</p>
          <p className="text-xs leading-snug">Wäscht Pollen aus der Luft. Balken sinken oft zeitversetzt.</p>
        </div>
        <div className="bg-white/50 p-3 rounded-lg">
          <p className="font-bold mb-1 italic">💨 Wind</p>
          <p className="text-xs leading-snug">Verteilt Pollen über weite Strecken. Sprunghafte Anstiege möglich.</p>
        </div>
        <div className="bg-white/50 p-3 rounded-lg">
          <p className="font-bold mb-1 italic">☀️ Sonne</p>
          <p className="text-xs leading-snug">Öffnet Blüten. Hohe Werte an sonnigen Vormittagen typisch.</p>
        </div>
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
              {loading ? 'Lädt...' : 'Prüfen'}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="text-xl">⚠️</span>
            <p className="font-medium">{safeText(error)}</p>
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
            <p className="text-slate-500 font-medium italic">Dr. Schätz analysiert die aktuelle Lage für PLZ {plz}...</p>
            <p className="text-xs text-slate-400">Dies kann einen Moment dauern (Live-Recherche).</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Structured Location & Quality Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex flex-col md:flex-row items-stretch">
                <div className="bg-slate-50 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="text-3xl grayscale opacity-50">📍</div>
                </div>
                <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gewählter Standort</h4>
                    <p className="text-lg font-bold text-slate-800 leading-tight">
                      {safeText(data.header?.subtitle).replace('Standort: ', '')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{safeText(data.header?.timestamp_label)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(data.header?.quality_badges ?? []).map((badge, idx) => (
                      <div key={idx} className={`px-3 py-2 rounded-xl border flex flex-col ${getSeverityBadge(badge.severity)}`}>
                        <span className="text-[9px] uppercase font-bold opacity-60 tracking-tighter">Datenqualität</span>
                        <span className="text-xs font-bold leading-none mt-1">{safeText(badge.label)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Section */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(data.kpi_cards ?? []).map(card => (
                  <div key={card.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group hover:border-blue-200 transition-colors">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{safeText(card.title)}</span>
                    <span className={`text-xl font-bold mb-2 ${
                      card.severity === 'bad' ? 'text-rose-600' : 
                      card.severity === 'warn' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {safeText(card.value_label)}
                    </span>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          card.severity === 'bad' ? 'bg-rose-500' : 
                          card.severity === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (card.value_level / 4) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 italic leading-tight">{safeText(card.hint)}</p>
                  </div>
                ))}
              </div>
              <PollenScaleLegend />
            </div>

            {/* Weather & General Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WeatherInfoSection />
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex-1">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Wochen-Trend</h4>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium italic">"{safeText(data.summaries?.midterm_one_liner)}"</p>
                </div>
              </div>
            </div>

            {/* Main Information Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <h4 className="text-xs font-bold text-blue-800 uppercase mb-3 tracking-widest">Die Lage heute</h4>
                <p className="text-base text-blue-900 font-medium leading-relaxed">{safeText(data.summaries?.today_one_liner)}</p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                <h4 className="text-xs font-bold text-indigo-800 uppercase mb-3 tracking-widest">Nächste Tage</h4>
                <p className="text-base text-indigo-900 font-medium leading-relaxed">{safeText(data.summaries?.next_days_one_liner)}</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(data.charts ?? []).map(chart => (
                <PollenCharts key={chart.id} chartData={chart} />
              ))}
            </div>

            {/* Allergiker-Tipps */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(data.recommendation_blocks ?? []).map(block => (
                <div key={block.id} className={`p-6 rounded-2xl border shadow-sm flex flex-col ${
                  block.id === 'medical_help' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-lg font-bold ${
                      block.id === 'medical_help' ? 'text-rose-800' : 'text-slate-800'
                    }`}>
                      {block.id === 'medical_help' ? safeText(block.title) : "Allergiker-Tipp"}
                    </h3>
                    {block.id !== 'medical_help' && (
                      <div className="flex gap-1">
                        <span className="text-[10px] text-rose-600 font-bold">!!</span>
                        <span className="text-[10px] text-slate-300">/</span>
                        <span className="text-[10px] text-amber-500 font-bold">!</span>
                      </div>
                    )}
                  </div>
                  <ul className="space-y-4 flex-1">
                    {(block.items ?? []).map((item, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                          item.priority === 'hoch' ? 'bg-rose-600 text-white' : 
                          item.priority === 'mittel' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {item.priority === 'hoch' ? '!!' : '!'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{safeText(item.title)}</p>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{safeText(item.detail)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {block.id !== 'medical_help' && (
                    <p className="mt-4 pt-4 border-t border-slate-50 text-[9px] text-slate-400 italic">
                      Info: !! = Hohe Relevanz heute | ! = Allgemeine Empfehlung
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Detailed Tables */}
            <div className="space-y-6">
              {(data.tables ?? []).map(table => (
                <PollenTable key={table.id} tableData={table} />
              ))}
            </div>

            {/* Footnotes & Disclaimer */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-500">
              <p className="text-sm font-bold text-slate-700 mb-2">Wichtige Hinweise:</p>
              <p className="text-xs leading-relaxed italic mb-4">{safeText(data.disclaimer)}</p>
              <div className="space-y-1">
                {(data.footnotes ?? []).map((fn, idx) => (
                  <p key={idx} className="text-[10px]">* {safeText(fn)}</p>
                ))}
              </div>
              
              {/* Added Search Grounding Sources as per Gemini API guidelines */}
              {data.groundingSources && data.groundingSources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recherchierte Quellen:</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {data.groundingSources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <span>🔗</span> {source.title || 'Quelle'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <footer className="mt-12 py-8 text-center text-slate-400 text-xs border-t border-slate-100">
        <p>&copy; {new Date().getFullYear()} Dr. Schätz Dermatologie. Daten dienen der gesundheitlichen Orientierung.</p>
        <p className="mt-1 uppercase tracking-widest font-bold opacity-50 text-[10px]">Pollenwarn-Agent Österreich</p>
      </footer>
    </div>
  );
};

export default App;
