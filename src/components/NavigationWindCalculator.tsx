import React, { useState, useId } from 'react';
import { WindTriangleInput } from '../types/aviation';
import { calculateWindTriangle, normalizeHeading, toRad } from '../utils/aviationFormulas';
import { Compass, Wind, Navigation, Gauge, AlertTriangle, ArrowUpRight, RotateCcw } from 'lucide-react';

interface NavigationWindCalculatorProps {
  initialTrack?: number;
  initialTas?: number;
  initialWindDir?: number;
  initialWindSpeed?: number;
}

export const NavigationWindCalculator: React.FC<NavigationWindCalculatorProps> = ({
  initialTrack = 90,
  initialTas = 120,
  initialWindDir = 45,
  initialWindSpeed = 15,
}) => {
  const [track, setTrack] = useState<number>(initialTrack);
  const [tas, setTas] = useState<number>(initialTas);
  const [windDir, setWindDir] = useState<number>(initialWindDir);
  const [windSpeed, setWindSpeed] = useState<number>(initialWindSpeed);

  const rawTrackId = useId();
  const rawTasId = useId();
  const rawWindDirId = useId();
  const rawWindSpeedId = useId();

  const input: WindTriangleInput = {
    desiredTrack: track,
    trueAirspeed: tas,
    windDirection: windDir,
    windSpeed: windSpeed,
  };

  const result = calculateWindTriangle(input);

  // Quick Wind Scenario buttons
  const setScenario = (type: 'headwind' | 'crosswind' | 'tailwind' | 'calm') => {
    if (type === 'headwind') {
      setWindDir(track);
      setWindSpeed(20);
    } else if (type === 'crosswind') {
      setWindDir(normalizeHeading(track + 90));
      setWindSpeed(18);
    } else if (type === 'tailwind') {
      setWindDir(normalizeHeading(track + 180));
      setWindSpeed(20);
    } else {
      setWindSpeed(0);
    }
  };

  // Compass rendering coordinates
  const radius = 100;
  const center = 130;

  // Track coordinates
  const trackRad = toRad(track - 90);
  const trackX = center + radius * Math.cos(trackRad);
  const trackY = center + radius * Math.sin(trackRad);

  // Heading coordinates
  const headingRad = toRad(result.trueHeading - 90);
  const headingX = center + (radius - 12) * Math.cos(headingRad);
  const headingY = center + (radius - 12) * Math.sin(headingRad);

  // Wind vector (pointing towards center from outside)
  const windFromRad = toRad(windDir - 90);
  const windStartX = center + (radius + 18) * Math.cos(windFromRad);
  const windStartY = center + (radius + 18) * Math.sin(windFromRad);

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanatory Note */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              Triângulo de Velocidades & Navegação (E6B)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo instantâneo de Proa Verdadeira (TH), Ângulo de Correção de Deriva (WCA) e Velocidade no Solo (GS).
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setScenario('headwind')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px]"
            >
              Proa 20kt
            </button>
            <button
              onClick={() => setScenario('crosswind')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px]"
            >
              Cruzado 90°
            </button>
            <button
              onClick={() => setScenario('tailwind')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px]"
            >
              Cauda 20kt
            </button>
            <button
              onClick={() => setScenario('calm')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px]"
            >
              Vento Calmo
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls + Visual Compass + Output Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Inputs (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" /> Parâmetros de Voo & Atmosfera
          </h3>

          {/* Desired Track / Rumbo */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawTrackId} className="text-slate-300 font-medium">
                Rumbo Desejado (Track / Course)
              </label>
              <span className="font-mono text-cyan-400 font-bold text-sm">{String(track).padStart(3, '0')}°</span>
            </div>
            <input
              id={rawTrackId}
              type="range"
              min="0"
              max="359"
              value={track}
              onChange={(e) => setTrack(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between items-center gap-2 pt-1">
              <div className="flex gap-1 text-[11px]">
                <button
                  onClick={() => setTrack((t) => (t - 5 + 360) % 360)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  -5°
                </button>
                <button
                  onClick={() => setTrack((t) => (t + 5) % 360)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  +5°
                </button>
              </div>
              <input
                type="number"
                min="0"
                max="359"
                value={track}
                onChange={(e) => setTrack(Math.max(0, Math.min(359, Number(e.target.value) || 0)))}
                className="w-18 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* True Airspeed (TAS) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawTasId} className="text-slate-300 font-medium">
                Velocidade Verdadeira (TAS)
              </label>
              <span className="font-mono text-emerald-400 font-bold text-sm">{tas} KT</span>
            </div>
            <input
              id={rawTasId}
              type="range"
              min="40"
              max="450"
              value={tas}
              onChange={(e) => setTas(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between items-center gap-2 pt-1">
              <div className="flex gap-1 text-[11px]">
                <button
                  onClick={() => setTas((s) => Math.max(30, s - 10))}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  -10
                </button>
                <button
                  onClick={() => setTas((s) => s + 10)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  +10
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="30"
                  max="600"
                  value={tas}
                  onChange={(e) => setTas(Math.max(10, Number(e.target.value) || 0))}
                  className="w-18 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-mono">kt</span>
              </div>
            </div>
          </div>

          {/* Wind Direction (FROM) */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawWindDirId} className="text-slate-300 font-medium flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-amber-400" />
                Direção do Vento (Soprando DE)
              </label>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {String(windDir).padStart(3, '0')}°
              </span>
            </div>
            <input
              id={rawWindDirId}
              type="range"
              min="0"
              max="359"
              value={windDir}
              onChange={(e) => setWindDir(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between items-center gap-2 pt-1">
              <div className="flex gap-1 text-[11px]">
                <button
                  onClick={() => setWindDir((w) => (w - 10 + 360) % 360)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  -10°
                </button>
                <button
                  onClick={() => setWindDir((w) => (w + 10) % 360)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  +10°
                </button>
              </div>
              <input
                type="number"
                min="0"
                max="359"
                value={windDir}
                onChange={(e) => setWindDir(Math.max(0, Math.min(359, Number(e.target.value) || 0)))}
                className="w-18 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Wind Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawWindSpeedId} className="text-slate-300 font-medium">
                Velocidade do Vento
              </label>
              <span className="font-mono text-amber-400 font-bold text-sm">{windSpeed} KT</span>
            </div>
            <input
              id={rawWindSpeedId}
              type="range"
              min="0"
              max="80"
              value={windSpeed}
              onChange={(e) => setWindSpeed(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between items-center gap-2 pt-1">
              <div className="flex gap-1 text-[11px]">
                <button
                  onClick={() => setWindSpeed((w) => Math.max(0, w - 5))}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  -5
                </button>
                <button
                  onClick={() => setWindSpeed((w) => w + 5)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  +5
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(Math.max(0, Number(e.target.value) || 0))}
                  className="w-18 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-400 font-mono">kt</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right Column: Live Visual Compass & Telemetry Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Telemetry Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* True Heading */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Proa (TH)</div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400 mt-1">
                {String(result.trueHeading).padStart(3, '0')}°
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {result.windCorrectionAngle === 0
                  ? 'Sem deriva'
                  : result.windCorrectionAngle > 0
                  ? `Correção ${result.windCorrectionAngle}° D`
                  : `Correção ${Math.abs(result.windCorrectionAngle)}° E`}
              </div>
            </div>

            {/* Ground Speed */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Solo (GS)</div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">
                {result.groundSpeed} <span className="text-xs font-normal text-emerald-500">KT</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {Math.round(result.groundSpeed * 1.852)} km/h
              </div>
            </div>

            {/* WCA (Wind Correction Angle) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Deriva (WCA)</div>
              <div
                className={`text-2xl sm:text-3xl font-mono font-bold mt-1 ${
                  result.windCorrectionAngle > 0
                    ? 'text-amber-400'
                    : result.windCorrectionAngle < 0
                    ? 'text-indigo-400'
                    : 'text-slate-300'
                }`}
              >
                {result.windCorrectionAngle > 0 ? `+${result.windCorrectionAngle}°` : `${result.windCorrectionAngle}°`}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {result.windCorrectionAngle > 0 ? 'Girar à Direita' : result.windCorrectionAngle < 0 ? 'Girar à Esquerda' : 'Alinhado'}
              </div>
            </div>

            {/* Headwind / Tailwind */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Vento em Rota</div>
              <div
                className={`text-xl sm:text-2xl font-mono font-bold mt-1.5 ${
                  result.headwind >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {Math.abs(result.headwind)} <span className="text-xs font-normal">KT</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {result.headwind >= 0 ? 'Vento de Proa' : 'Vento de Cauda'}
              </div>
            </div>
          </div>

          {/* Visual Vector Compass (Interactive SVG) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Rosa dos Ventos & Vetores de Voo
              </span>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span> Rumbo ({track}°)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block"></span> Proa ({result.trueHeading}°)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span> Vento ({windDir}°/{windSpeed}kt)
                </span>
              </div>
            </div>

            <div className="relative">
              <svg width="260" height="260" viewBox="0 0 260 260" className="select-none">
                {/* Outer Ring */}
                <circle cx={center} cy={center} r={radius} fill="none" stroke="#334155" strokeWidth="1.5" />
                <circle cx={center} cy={center} r={radius - 12} fill="none" stroke="#1e293b" strokeWidth="1" />
                <circle cx={center} cy={center} r="3" fill="#38bdf8" />

                {/* Cardinal Points */}
                <text x={center} y={center - radius + 15} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="monospace">N</text>
                <text x={center + radius - 15} y={center + 4} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">E</text>
                <text x={center} y={center + radius - 7} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">S</text>
                <text x={center - radius + 15} y={center + 4} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">W</text>

                {/* Tick marks every 30 degrees */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const deg = i * 30;
                  const rad = toRad(deg - 90);
                  const x1 = center + (radius - 5) * Math.cos(rad);
                  const y1 = center + (radius - 5) * Math.sin(rad);
                  const x2 = center + radius * Math.cos(rad);
                  const y2 = center + radius * Math.sin(rad);
                  return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="1.5" />;
                })}

                {/* Desired Track Line (Cyan Dashed) */}
                <line
                  x1={center}
                  y1={center}
                  x2={trackX}
                  y2={trackY}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />

                {/* True Heading Line with Arrow (Emerald Solid) */}
                <line
                  x1={center}
                  y1={center}
                  x2={headingX}
                  y2={headingY}
                  stroke="#34d399"
                  strokeWidth="2.5"
                />
                {/* Airplane silhouette or triangle at heading tip */}
                <circle cx={headingX} cy={headingY} r="3.5" fill="#34d399" />

                {/* Wind Arrow Vector (Amber) */}
                {windSpeed > 0 && (
                  <g>
                    <line
                      x1={windStartX}
                      y1={windStartY}
                      x2={center + (radius - 20) * Math.cos(windFromRad)}
                      y2={center + (radius - 20) * Math.sin(windFromRad)}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      markerEnd="url(#wind-arrow)"
                    />
                    <circle cx={windStartX} cy={windStartY} r="4" fill="#f59e0b" />
                  </g>
                )}
              </svg>
            </div>

            {/* Flight Legs Estimate Table */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center font-mono">
              <div className="bg-slate-950/60 rounded p-2 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Tempo 25 NM</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {result.groundSpeed > 0 ? `${Math.round((25 / result.groundSpeed) * 60)} min` : '--'}
                </div>
              </div>
              <div className="bg-slate-950/60 rounded p-2 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Tempo 50 NM</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {result.groundSpeed > 0 ? `${Math.round((50 / result.groundSpeed) * 60)} min` : '--'}
                </div>
              </div>
              <div className="bg-slate-950/60 rounded p-2 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase">Tempo 100 NM</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {result.groundSpeed > 0
                    ? `${Math.floor((100 / result.groundSpeed) * 60)}m ${Math.round(((100 / result.groundSpeed) * 60) % 60)}s`
                    : '--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
