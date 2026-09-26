import React, { useState, useEffect } from 'react';
import { Plane, Play, Pause, RotateCcw, AlertCircle, Fuel, TrendingDown, Radio, Check } from 'lucide-react';
import { AircraftPreset } from '../types/aviation';

interface LiveFlightModeProps {
  aircraft: AircraftPreset;
  onClose?: () => void;
}

export const LiveFlightMode: React.FC<LiveFlightModeProps> = ({ aircraft }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [initialFuel, setInitialFuel] = useState<number>(45); // gallons
  const [cruiseSpeed, setCruiseSpeed] = useState<number>(aircraft.cruiseSpeedKt || 120);
  const [legDistanceNm, setLegDistanceNm] = useState<number>(180);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(180);
  const [fuelBurnPerHour, setFuelBurnPerHour] = useState<number>(aircraft.fuelBurnGph || 9.0);

  // TOD target distance
  const [altitudeToLose, setAltitudeToLose] = useState<number>(6000); // 8500 to 2500
  const todDistanceNm = Math.round((altitudeToLose / 1000) * 3 * 10) / 10; // ~18 NM

  // ATC Scratchpad
  const [atcNotes, setAtcNotes] = useState<string>('Squawk: 1200 | Alt: 8500 | QNH: 1013');

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Update distance remaining dynamically
  // Speed in NM per second = cruiseSpeed / 3600
  const nmTravelled = (elapsedSeconds * cruiseSpeed) / 3600;
  const currentDistance = Math.max(0, Math.round((legDistanceNm - nmTravelled) * 10) / 10);

  // Update fuel dynamically
  // Fuel burned = (elapsedSeconds / 3600) * fuelBurnPerHour
  const fuelBurned = Math.round(((elapsedSeconds * fuelBurnPerHour) / 3600) * 100) / 100;
  const currentFuel = Math.max(0, Math.round((initialFuel - fuelBurned) * 100) / 100);

  // Check if reached or past TOD
  const isPastTod = currentDistance <= todDistanceNm && currentDistance > 0;
  const hasArrived = currentDistance <= 0;

  // Format stopwatch
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setDistanceRemaining(legDistanceNm);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Flight Mode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Plane className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Telemetria de Voo em Tempo Real
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                {isRunning ? 'TRANSMITINDO' : 'EM ESPERA'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Acompanhamento contínuo segundo a segundo de queima de combustível, distância e alerta de TOD.
            </p>
          </div>
        </div>

        {/* Stopwatch Controls */}
        <div className="flex items-center space-x-2 font-mono">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'PAUSAR VOO' : 'INICIAR VOO'}</span>
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Reiniciar Cronômetro"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOD Alert Banner if in range */}
      {isPastTod && (
        <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-500 text-cyan-200 flex items-center gap-3 animate-pulse">
          <TrendingDown className="w-6 h-6 text-cyan-400 flex-shrink-0" />
          <div>
            <div className="font-bold text-sm uppercase tracking-wide">
              ALERTA: PONTO DE DESCIDA (TOD) ALCANÇADO!
            </div>
            <p className="text-xs text-slate-300">
              Distância para o destino é de {currentDistance} NM. Inicie a descida agora a ~{Math.round(cruiseSpeed * 5)} FPM para atingir a altitude alvo!
            </p>
          </div>
        </div>
      )}

      {hasArrived && elapsedSeconds > 0 && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-200 flex items-center gap-3">
          <Check className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="font-bold text-sm uppercase tracking-wide">DESTINO ALCANÇADO!</div>
            <p className="text-xs text-slate-300">
              Tempo total de voo: {formatTime(elapsedSeconds)}. Combustível restante: {currentFuel} gal.
            </p>
          </div>
        </div>
      )}

      {/* Main Gauges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Stopwatch */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Tempo de Voo</div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400 mt-1">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Cronômetro ativo</div>
        </div>

        {/* Distance Remaining */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Distância Restante</div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">
            {currentDistance} <span className="text-xs font-normal">NM</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Percorrido: {Math.round(nmTravelled * 10) / 10} NM
          </div>
        </div>

        {/* Live Fuel Tank */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Combustível Atual</div>
          <div
            className={`text-2xl sm:text-3xl font-mono font-bold mt-1 ${
              currentFuel < 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
            }`}
          >
            {currentFuel} <span className="text-xs font-normal">GAL</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Queimado: {fuelBurned} gal
          </div>
        </div>

        {/* Distance to TOD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Distância p/ TOD</div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 mt-1">
            {Math.max(0, Math.round((currentDistance - todDistanceNm) * 10) / 10)}{' '}
            <span className="text-xs font-normal text-slate-400">NM</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">TOD fixado em {todDistanceNm} NM</div>
        </div>
      </div>

      {/* Active Flight Settings & ATC Scratchpad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Quick parameters adjustment */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Ajustes Rápidos da Etapa
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400">Distância Total (NM)</label>
              <input
                type="number"
                value={legDistanceNm}
                onChange={(e) => setLegDistanceNm(Math.max(1, Number(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">Velocidade Solo (GS KT)</label>
              <input
                type="number"
                value={cruiseSpeed}
                onChange={(e) => setCruiseSpeed(Math.max(20, Number(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-emerald-300 font-mono mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">Combustível Inicial (Gal)</label>
              <input
                type="number"
                value={initialFuel}
                onChange={(e) => setInitialFuel(Math.max(1, Number(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">Consumo Horário (GPH)</label>
              <input
                type="number"
                step="0.5"
                value={fuelBurnPerHour}
                onChange={(e) => setFuelBurnPerHour(Math.max(0.5, Number(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono mt-1"
              />
            </div>
          </div>
        </div>

        {/* Pilot ATC Scratchpad */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" /> Bloco de Notas do Piloto (ATC / ATIS)
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Salvo em sessão</span>
          </div>

          <textarea
            value={atcNotes}
            onChange={(e) => setAtcNotes(e.target.value)}
            placeholder="Anotações de autorização, frequências, transponder..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>
    </div>
  );
};
