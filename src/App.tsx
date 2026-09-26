import React, { useState } from 'react';
import { Header } from './components/Header';
import { AviatorMinutagemCalculator } from './components/AviatorMinutagemCalculator';
import { FlightLogMinutagem } from './components/FlightLogMinutagem';
import { NavigationWindCalculator } from './components/NavigationWindCalculator';
import { RunwayCrosswindCalculator } from './components/RunwayCrosswindCalculator';
import { AltitudePerformanceCalculator } from './components/AltitudePerformanceCalculator';
import { DescentCalculator } from './components/DescentCalculator';
import { FuelPlanningCalculator } from './components/FuelPlanningCalculator';
import { WeightAndBalanceCalculator } from './components/WeightAndBalanceCalculator';
import { AviationUnitConverter } from './components/AviationUnitConverter';
import { LiveFlightMode } from './components/LiveFlightMode';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AIRCRAFT_PRESETS } from './utils/aviationFormulas';
import { AircraftPreset } from './types/aviation';
import { Plane, Compass, ShieldAlert, Activity, Sparkles, Scale, ArrowRightLeft, Radio, Flame } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('aviator');
  const [selectedPreset, setSelectedPreset] = useState<AircraftPreset>(AIRCRAFT_PRESETS[0]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Cockpit Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedPreset={selectedPreset}
        onSelectPreset={setSelectedPreset}
        isSimulating={isSimulating}
        onToggleSimulate={() => setIsSimulating(!isSimulating)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Live Simulation Banner / View when toggled */}
        {isSimulating && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <LiveFlightMode
              aircraft={selectedPreset}
              onClose={() => setIsSimulating(false)}
            />
          </div>
        )}

        {/* Dynamic Aviation Calculators based on Active Tab */}
        <div className="transition-all duration-200">
          {activeTab === 'aviator' && (
            <AviatorMinutagemCalculator />
          )}

          {activeTab === 'flightlog' && (
            <FlightLogMinutagem />
          )}

          {activeTab === 'wind' && (
            <NavigationWindCalculator
              initialTrack={90}
              initialTas={selectedPreset.cruiseSpeedKt}
              initialWindDir={45}
              initialWindSpeed={15}
            />
          )}

          {activeTab === 'runway' && (
            <RunwayCrosswindCalculator
              maxCrosswindLimit={selectedPreset.maxCrosswindKt}
            />
          )}

          {activeTab === 'altitude' && (
            <AltitudePerformanceCalculator />
          )}

          {activeTab === 'descent' && (
            <DescentCalculator />
          )}

          {activeTab === 'fuel' && (
            <FuelPlanningCalculator />
          )}

          {activeTab === 'weight' && (
            <WeightAndBalanceCalculator
              selectedPreset={selectedPreset}
            />
          )}

          {activeTab === 'converter' && (
            <AviationUnitConverter />
          )}
        </div>
      </main>

      {/* Offline Connectivity Status Toast */}
      <OfflineIndicator />

      {/* Cockpit Avionics Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 text-slate-400 text-xs py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <img src="/icon.svg" alt="Avião Vermelho" className="w-4 h-4 object-contain" />
              <span>AeroCalc Suite PWA</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Aeronave Ativa: <strong className="text-cyan-300">{selectedPreset.name}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-rose-300">
              ✈ PWA Multiplataforma
            </span>
            <span>Cruzeiro: {selectedPreset.cruiseSpeedKt} kt</span>
            <span>Vento Cruzado Máx: {selectedPreset.maxCrosswindKt} kt</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
