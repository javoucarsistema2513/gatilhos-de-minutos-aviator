import React, { useState, useId } from 'react';
import { RunwayWindInput } from '../types/aviation';
import { calculateRunwayWind, normalizeHeading, toRad } from '../utils/aviationFormulas';
import { ShieldAlert, Wind, CheckCircle2, AlertTriangle, XCircle, ArrowRightLeft } from 'lucide-react';

interface RunwayCrosswindCalculatorProps {
  maxCrosswindLimit?: number;
}

export const RunwayCrosswindCalculator: React.FC<RunwayCrosswindCalculatorProps> = ({
  maxCrosswindLimit = 15,
}) => {
  const [runwayHeading, setRunwayHeading] = useState<number>(90);
  const [windDirection, setWindDirection] = useState<number>(60);
  const [windSpeed, setWindSpeed] = useState<number>(18);
  const [windGust, setWindGust] = useState<number>(24);
  const [aircraftLimit, setAircraftLimit] = useState<number>(maxCrosswindLimit);

  const rawRwyId = useId();
  const rawWindDirId = useId();
  const rawWindSpeedId = useId();
  const rawWindGustId = useId();
  const rawLimitId = useId();

  // Primary Runway Result
  const input: RunwayWindInput = {
    runwayHeading,
    windDirection,
    windSpeed,
    windGust: windGust > windSpeed ? windGust : undefined,
    maxCrosswindLimit: aircraftLimit,
  };
  const result = calculateRunwayWind(input);

  // Reciprocal Runway (180 degrees opposite)
  const reciprocalHeading = normalizeHeading(runwayHeading + 180);
  const reciprocalInput: RunwayWindInput = {
    runwayHeading: reciprocalHeading,
    windDirection,
    windSpeed,
    windGust: windGust > windSpeed ? windGust : undefined,
    maxCrosswindLimit: aircraftLimit,
  };
  const reciprocalResult = calculateRunwayWind(reciprocalInput);

  // Runway number (e.g., 09 for 090°, 27 for 270°)
  const rwyNumber = String(Math.round(runwayHeading / 10) || 36).padStart(2, '0');
  const reciprocalRwyNumber = String(Math.round(reciprocalHeading / 10) || 36).padStart(2, '0');

  // Recommendation: Which runway gives better headwind?
  const isPrimaryBetter = result.headwind >= reciprocalResult.headwind;
  const recommendedRwy = isPrimaryBetter ? `RWY ${rwyNumber}` : `RWY ${reciprocalRwyNumber}`;

  // Drawing the runway canvas
  const canvasSize = 280;
  const center = canvasSize / 2;
  const runwayAngle = runwayHeading; // Runway points towards runwayHeading

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Analisador de Vento de Pista & Vento Cruzado
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo imediato de vento cruzado, vento de proa/cauda e limites operacionais demonstrados.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Pista Favorável:</span>
            <span className="text-emerald-400 font-bold">{recommendedRwy}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" /> Dados da Pista & Vento METAR
          </h3>

          {/* Runway Heading */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawRwyId} className="text-slate-300 font-medium">
                Rumo da Pista (Runway Heading)
              </label>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                RWY {rwyNumber} ({String(runwayHeading).padStart(3, '0')}°)
              </span>
            </div>
            <input
              id={rawRwyId}
              type="range"
              min="10"
              max="360"
              step="10"
              value={runwayHeading}
              onChange={(e) => setRunwayHeading(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between items-center pt-1 text-xs">
              <div className="flex gap-1 text-[11px]">
                <button
                  onClick={() => setRunwayHeading((h) => (h === 10 ? 360 : h - 10))}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 font-mono"
                >
                  -10°
                </button>
                <button
                  onClick={() => setRunwayHeading((h) => (h === 360 ? 10 : h + 10))}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 font-mono"
                >
                  +10°
                </button>
                <button
                  onClick={() => setRunwayHeading(reciprocalHeading)}
                  className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 font-mono flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3 h-3" /> Inverter
                </button>
              </div>
              <span className="font-mono text-slate-400">Oposta: RWY {reciprocalRwyNumber}</span>
            </div>
          </div>

          {/* Wind Direction */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawWindDirId} className="text-slate-300 font-medium">
                Direção do Vento (Soprando de)
              </label>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {String(windDirection).padStart(3, '0')}°
              </span>
            </div>
            <input
              id={rawWindDirId}
              type="range"
              min="0"
              max="360"
              value={windDirection}
              onChange={(e) => setWindDirection(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Wind Speed & Gust */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label htmlFor={rawWindSpeedId} className="text-slate-300 font-medium">
                  Velocidade
                </label>
                <span className="font-mono text-amber-400 font-bold">{windSpeed} KT</span>
              </div>
              <input
                id={rawWindSpeedId}
                type="number"
                min="0"
                max="80"
                value={windSpeed}
                onChange={(e) => setWindSpeed(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label htmlFor={rawWindGustId} className="text-slate-300 font-medium">
                  Rajada (Gust)
                </label>
                <span className="font-mono text-amber-300 font-bold">{windGust} KT</span>
              </div>
              <input
                id={rawWindGustId}
                type="number"
                min="0"
                max="100"
                value={windGust}
                onChange={(e) => setWindGust(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Aircraft Limit */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawLimitId} className="text-slate-300 font-medium">
                Vento Cruzado Máx. Demonstrado da Aeronave
              </label>
              <span className="font-mono text-cyan-400 font-bold">{aircraftLimit} KT</span>
            </div>
            <input
              id={rawLimitId}
              type="range"
              min="5"
              max="40"
              value={aircraftLimit}
              onChange={(e) => setAircraftLimit(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>C172: 15kt</span>
              <span>PA28: 17kt</span>
              <span>Baron: 22kt</span>
              <span>Jet: 30kt+</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Runway Graph & Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Alert Cards */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
              result.isCrosswindExceeded
                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                : result.isTailwindAlert
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {result.isCrosswindExceeded ? (
              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : result.isTailwindAlert ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}

            <div className="text-xs space-y-1">
              <div className="font-bold text-sm">
                {result.isCrosswindExceeded
                  ? 'LIMITE DE VENTO CRUZADO EXCEDIDO'
                  : result.isTailwindAlert
                  ? 'ATENÇÃO: COMPONENTE DE VENTO DE CAUDA'
                  : 'OPERAÇÃO DENTRO DOS LIMITES DE SEGURANÇA'}
              </div>
              <p className="text-slate-300">
                {result.isCrosswindExceeded
                  ? `O vento cruzado com rajadas atinge ${result.gustCrosswind || result.crosswind} kt, ultrapassando o limite demonstrado de ${aircraftLimit} kt!`
                  : result.isTailwindAlert
                  ? `Vento de cauda de ${Math.abs(result.headwind)} kt aumenta substancialmente a distância de pouso/decolagem. Considere a RWY ${reciprocalRwyNumber}.`
                  : `Vento cruzado de ${result.crosswind} kt (${result.crosswindSide === 'left' ? 'pela esquerda' : result.crosswindSide === 'right' ? 'pela direita' : 'alinhado'}) e vento de proa favorável de ${result.headwind} kt.`}
              </p>
            </div>
          </div>

          {/* Runway Component Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Vento Cruzado</div>
              <div
                className={`text-2xl font-mono font-bold mt-1 ${
                  result.isCrosswindExceeded ? 'text-rose-400' : 'text-slate-100'
                }`}
              >
                {result.crosswind} <span className="text-xs font-normal text-slate-400">KT</span>
              </div>
              {result.gustCrosswind && (
                <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                  Rajada: {result.gustCrosswind} KT
                </div>
              )}
              <div className="text-[11px] text-slate-400 mt-1">
                {result.crosswindSide === 'left'
                  ? '← Pela Esquerda'
                  : result.crosswindSide === 'right'
                  ? 'Pela Direita →'
                  : 'Alinhado'}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Proa / Cauda</div>
              <div
                className={`text-2xl font-mono font-bold mt-1 ${
                  result.headwind >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {Math.abs(result.headwind)} <span className="text-xs font-normal">KT</span>
              </div>
              {result.gustHeadwind !== undefined && (
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Rajada: {Math.abs(result.gustHeadwind)} KT
                </div>
              )}
              <div className="text-[11px] text-slate-400 mt-1">
                {result.headwind >= 0 ? 'Vento de Proa (Headwind)' : 'Vento de Cauda (Tailwind)'}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Margem de Limite</div>
              <div className="text-2xl font-mono font-bold mt-1 text-cyan-400">
                {Math.max(0, aircraftLimit - (result.gustCrosswind || result.crosswind))} <span className="text-xs font-normal">KT</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${
                    result.isCrosswindExceeded
                      ? 'bg-rose-500'
                      : (result.gustCrosswind || result.crosswind) / aircraftLimit > 0.8
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, ((result.gustCrosswind || result.crosswind) / aircraftLimit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Runway Visualizer SVG */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center">
            <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Visualização Gráfica da Pista
              </span>
              <span className="font-mono text-cyan-400">
                RWY {rwyNumber} / RWY {reciprocalRwyNumber}
              </span>
            </div>

            <div className="relative">
              <svg width={canvasSize} height={canvasSize} viewBox={`0 0 ${canvasSize} ${canvasSize}`}>
                {/* Background Compass Ring */}
                <circle cx={center} cy={center} r={center - 15} fill="#020617" stroke="#1e293b" strokeWidth="1.5" />

                {/* Cardinal Points */}
                <text x={center} y={20} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold" fontFamily="monospace">N 360°</text>
                <text x={canvasSize - 20} y={center + 4} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold" fontFamily="monospace">E 090°</text>
                <text x={center} y={canvasSize - 10} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold" fontFamily="monospace">S 180°</text>
                <text x={22} y={center + 4} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold" fontFamily="monospace">W 270°</text>

                {/* Runway representation (rotated by runwayHeading) */}
                <g transform={`rotate(${runwayAngle - 90}, ${center}, ${center})`}>
                  {/* Asphalt Strip */}
                  <rect
                    x={center - 95}
                    y={center - 18}
                    width="190"
                    height="36"
                    rx="3"
                    fill="#334155"
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  {/* Centerline dashed */}
                  <line
                    x1={center - 80}
                    y1={center}
                    x2={center + 80}
                    y2={center}
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="10 8"
                  />
                  {/* Runway designator text on both thresholds */}
                  <text
                    x={center + 70}
                    y={center + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    transform={`rotate(90, ${center + 70}, ${center + 4})`}
                  >
                    {rwyNumber}
                  </text>
                  <text
                    x={center - 70}
                    y={center + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    transform={`rotate(-90, ${center - 70}, ${center + 4})`}
                  >
                    {reciprocalRwyNumber}
                  </text>
                </g>

                {/* Wind Arrow (Pointing towards center from wind direction) */}
                {windSpeed > 0 && (
                  <g>
                    {(() => {
                      const windRad = toRad(windDirection - 90);
                      const arrowDist = center - 25;
                      const x1 = center + arrowDist * Math.cos(windRad);
                      const y1 = center + arrowDist * Math.sin(windRad);
                      const x2 = center + (arrowDist - 55) * Math.cos(windRad);
                      const y2 = center + (arrowDist - 55) * Math.sin(windRad);

                      return (
                        <g>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#f59e0b"
                            strokeWidth="3.5"
                          />
                          <circle cx={x1} cy={y1} r="4" fill="#f59e0b" />
                          <circle cx={x2} cy={y2} r="5" fill="#f59e0b" />
                        </g>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>

            <div className="text-[11px] text-slate-400 font-mono mt-2">
              Seta amarela indica direção de onde o vento sopra ({windDirection}° a {windSpeed} kt)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
