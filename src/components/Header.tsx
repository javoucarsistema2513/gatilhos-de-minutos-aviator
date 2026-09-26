import React, { useState, useEffect } from 'react';
import {
  Plane,
  Compass,
  Clock,
  Activity,
  ShieldAlert,
  Sparkles,
  Flame,
  FileText
} from 'lucide-react';
import { AIRCRAFT_PRESETS } from '../utils/aviationFormulas';
import { AircraftPreset } from '../types/aviation';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPreset: AircraftPreset;
  onSelectPreset: (preset: AircraftPreset) => void;
  isSimulating: boolean;
  onToggleSimulate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPreset,
  onSelectPreset,
  isSimulating,
  onToggleSimulate,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [localTime, setLocalTime] = useState<string>('');

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      // UTC / Zulu time (aviation standard)
      const zuluHours = String(now.getUTCHours()).padStart(2, '0');
      const zuluMins = String(now.getUTCMinutes()).padStart(2, '0');
      const zuluSecs = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${zuluHours}:${zuluMins}:${zuluSecs}Z`);

      // Local time
      const locHours = String(now.getHours()).padStart(2, '0');
      const locMins = String(now.getMinutes()).padStart(2, '0');
      const locSecs = String(now.getSeconds()).padStart(2, '0');
      setLocalTime(`${locHours}:${locMins}:${locSecs}L`);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'aviator', label: 'Aviator: Minutagem & Padrões', icon: Flame, highlight: true },
    { id: 'flightlog', label: 'Minutagem de Voo (CIV)', icon: FileText },
    { id: 'wind', label: 'Vento & Proa (E6B)', icon: Compass },
    { id: 'runway', label: 'Pista & Vento Cruzado', icon: ShieldAlert },
    { id: 'altitude', label: 'Altitudes & TAS', icon: Activity },
    { id: 'descent', label: 'Descida & TOD', icon: Plane },
    { id: 'fuel', label: 'Combustível & Alcance', icon: Sparkles },
    { id: 'weight', label: 'Peso & Balanceamento', icon: Activity },
    { id: 'converter', label: 'Conversor de Unidades', icon: Compass },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      {/* Top Cockpit Telemetry Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-bold tracking-wider">REAL-TIME ACTIVE</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 font-semibold">{utcTime}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{localTime}</span>
          </div>
        </div>

        {/* Aircraft Preset Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="aircraft-preset-select" className="text-slate-400 text-xs hidden md:inline">
            Aeronave:
          </label>
          <select
            id="aircraft-preset-select"
            value={selectedPreset.id}
            onChange={(e) => {
              const found = AIRCRAFT_PRESETS.find((p) => p.id === e.target.value);
              if (found) onSelectPreset(found);
            }}
            className="bg-slate-800 border border-slate-700 text-cyan-300 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {AIRCRAFT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cruiseSpeedKt} kt)
              </option>
            ))}
          </select>

          {/* Live Flight Mode simulator button */}
          <button
            id="toggle-live-sim-btn"
            onClick={onToggleSimulate}
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors flex items-center space-x-1.5 ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Simular voo com telemetria contínua"
          >
            <Plane className={`w-3 h-3 ${isSimulating ? 'rotate-45' : ''}`} />
            <span>{isSimulating ? 'SIMULAÇÃO ATIVA' : 'MODO VOO REAL'}</span>
          </button>
        </div>
      </div>

      {/* Main App Title & Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AeroCalc
                <span className="text-xs font-mono font-normal uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/50 text-cyan-300">
                  Aviation E6B
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Computador de voo para navegação, aerodinâmica e performance em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? item.highlight
                      ? 'bg-rose-600 text-white shadow-sm font-semibold'
                      : 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : item.highlight
                    ? 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.highlight && !isActive ? 'text-rose-400' : ''}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-rose-500/30 text-rose-200 uppercase font-bold">
                    HOT
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
