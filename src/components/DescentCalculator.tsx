import React, { useState, useId } from 'react';
import { DescentInput } from '../types/aviation';
import { calculateDescent } from '../utils/aviationFormulas';
import { Plane, TrendingDown, Clock, Navigation, Compass, ArrowDownRight } from 'lucide-react';

export const DescentCalculator: React.FC = () => {
  const [cruiseAlt, setCruiseAlt] = useState<number>(8500);
  const [targetAlt, setTargetAlt] = useState<number>(2500);
  const [groundSpeed, setGroundSpeed] = useState<number>(140);
  const [descentAngle, setDescentAngle] = useState<number>(3.0);
  const [mode, setMode] = useState<'angle' | 'rate'>('angle');
  const [targetVsi, setTargetVsi] = useState<number>(700);

  const rawCruiseId = useId();
  const rawTargetId = useId();
  const rawGsId = useId();
  const rawAngleId = useId();
  const rawVsiId = useId();

  const input: DescentInput = {
    cruiseAltitude: cruiseAlt,
    targetAltitude: targetAlt,
    groundSpeed: groundSpeed,
    descentAngleDeg: descentAngle,
    targetRateFpm: mode === 'rate' ? targetVsi : undefined,
  };

  const result = calculateDescent(input);

  // Quick Rules of Thumb for Pilots
  const ruleOfThreeDistNm = Math.round(((cruiseAlt - targetAlt) / 1000) * 3 * 10) / 10;
  const ruleOfThumbVsi = Math.round(groundSpeed * 5);

  // SVG dimensions for vertical profile
  const svgWidth = 560;
  const svgHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // X coords: Cruise starts at 0, TOD is at chartW * 0.35, Target fix is at chartW * 0.95
  const todX = paddingLeft + chartW * 0.35;
  const targetX = paddingLeft + chartW * 0.92;
  const cruiseY = paddingTop + 10;
  const targetY = paddingTop + chartH;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              Planejamento de Descida & Top of Descent (TOD)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo de ponto ideal de descida, razão de descida vertical (VSI) e tempo estimado.
            </p>
          </div>

          {/* Mode Switch */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setMode('angle')}
              className={`px-3 py-1 rounded font-mono ${
                mode === 'angle' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ângulo de Planeio (3°)
            </button>
            <button
              onClick={() => setMode('rate')}
              className={`px-3 py-1 rounded font-mono ${
                mode === 'rate' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Razão Fixa (FPM)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" /> Parâmetros do Perfil
          </h3>

          {/* Cruise Altitude */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawCruiseId} className="text-slate-300 font-medium">
                Altitude de Cruzeiro
              </label>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {cruiseAlt.toLocaleString()} FT
              </span>
            </div>
            <input
              id={rawCruiseId}
              type="range"
              min="2000"
              max="45000"
              step="500"
              value={cruiseAlt}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCruiseAlt(val);
                if (targetAlt >= val) setTargetAlt(Math.max(500, val - 1000));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Target Altitude */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawTargetId} className="text-slate-300 font-medium">
                Altitude Alvo (Circuito / FAF / Fix)
              </label>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {targetAlt.toLocaleString()} FT
              </span>
            </div>
            <input
              id={rawTargetId}
              type="range"
              min="0"
              max={Math.max(1000, cruiseAlt - 500)}
              step="500"
              value={targetAlt}
              onChange={(e) => setTargetAlt(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="text-[11px] text-slate-400 font-mono text-right">
              Altitude a perder: {(cruiseAlt - targetAlt).toLocaleString()} ft
            </div>
          </div>

          {/* Ground Speed in Descent */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawGsId} className="text-slate-300 font-medium">
                Velocidade no Solo em Descida (GS)
              </label>
              <span className="font-mono text-amber-400 font-bold text-sm">{groundSpeed} KT</span>
            </div>
            <input
              id={rawGsId}
              type="range"
              min="60"
              max="450"
              value={groundSpeed}
              onChange={(e) => setGroundSpeed(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Angle or Rate Controller */}
          {mode === 'angle' ? (
            <div className="space-y-1.5 border-t border-slate-800 pt-4">
              <div className="flex justify-between text-xs">
                <label htmlFor={rawAngleId} className="text-slate-300 font-medium">
                  Ângulo de Trajetória (Glide Path Angle)
                </label>
                <span className="font-mono text-cyan-400 font-bold text-sm">{descentAngle.toFixed(1)}°</span>
              </div>
              <input
                id={rawAngleId}
                type="range"
                min="1.5"
                max="6.0"
                step="0.1"
                value={descentAngle}
                onChange={(e) => setDescentAngle(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2.5° Suave</span>
                <span>3.0° Padrão IFR/ILS</span>
                <span>4.0° Íngreme</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 border-t border-slate-800 pt-4">
              <div className="flex justify-between text-xs">
                <label htmlFor={rawVsiId} className="text-slate-300 font-medium">
                  Razão Desejada (VSI)
                </label>
                <span className="font-mono text-cyan-400 font-bold text-sm">{targetVsi} FPM</span>
              </div>
              <input
                id={rawVsiId}
                type="range"
                min="300"
                max="2500"
                step="50"
                value={targetVsi}
                onChange={(e) => setTargetVsi(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          )}
        </div>

        {/* Right Column: Telemetry & Graphical Profile (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Output Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* TOD Distance */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Distância do TOD</div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400 mt-1">
                {result.todDistanceNm} <span className="text-xs font-normal">NM</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Antes do ponto alvo</div>
            </div>

            {/* Required VSI */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Razão (VSI)</div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">
                {result.requiredVsiFpm} <span className="text-xs font-normal">FPM</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Pés por minuto</div>
            </div>

            {/* Descent Time */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Tempo de Descida</div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 mt-1">
                {Math.floor(result.descentTimeMin)}m{' '}
                <span className="text-sm font-normal">
                  {String(Math.round((result.descentTimeMin % 1) * 60)).padStart(2, '0')}s
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Até nivelamento</div>
            </div>

            {/* Gradient */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Gradiente</div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-indigo-300 mt-1">
                {result.gradientFtPerNm} <span className="text-xs font-normal">FT/NM</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{result.gradientPct.toFixed(1)}% rampa</div>
            </div>
          </div>

          {/* Visual Flight Profile SVG */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center">
            <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Perfil Vertical de Voo (Corte Transversal)
              </span>
              <span className="font-mono text-cyan-400">
                ΔAlt: {(cruiseAlt - targetAlt).toLocaleString()} ft | Dist: {result.todDistanceNm} NM
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="min-w-[480px]">
                {/* Background gridlines */}
                <line x1={paddingLeft} y1={cruiseY} x2={svgWidth - paddingRight} y2={cruiseY} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={paddingLeft} y1={targetY} x2={svgWidth - paddingRight} y2={targetY} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

                {/* Altitude Labels */}
                <text x={paddingLeft - 8} y={cruiseY + 4} textAnchor="end" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                  {cruiseAlt} ft
                </text>
                <text x={paddingLeft - 8} y={targetY + 4} textAnchor="end" fill="#34d399" fontSize="10" fontFamily="monospace">
                  {targetAlt} ft
                </text>

                {/* Ground Line */}
                <line x1={paddingLeft} y1={svgHeight - 15} x2={svgWidth - paddingRight} y2={svgHeight - 15} stroke="#1e293b" strokeWidth="2" />
                <text x={svgWidth - paddingRight} y={svgHeight - 4} textAnchor="end" fill="#475569" fontSize="9" fontFamily="monospace">
                  Solo / Terreno
                </text>

                {/* Flight Path Polyline */}
                <path
                  d={`M ${paddingLeft} ${cruiseY} L ${todX} ${cruiseY} L ${targetX} ${targetY} L ${svgWidth - paddingRight} ${targetY}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />

                {/* Shaded Area under descent slope */}
                <path
                  d={`M ${todX} ${cruiseY} L ${targetX} ${targetY} L ${targetX} ${svgHeight - 15} L ${todX} ${svgHeight - 15} Z`}
                  fill="rgba(56, 189, 248, 0.06)"
                />

                {/* Top of Descent (TOD) Marker */}
                <circle cx={todX} cy={cruiseY} r="5" fill="#38bdf8" />
                <line x1={todX} y1={cruiseY} x2={todX} y2={svgHeight - 15} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x={todX} y={cruiseY - 12} textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  TOD ({result.todDistanceNm} NM)
                </text>

                {/* Target Fix Marker */}
                <circle cx={targetX} cy={targetY} r="5" fill="#34d399" />
                <line x1={targetX} y1={targetY} x2={targetX} y2={svgHeight - 15} stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x={targetX} y={targetY + 22} textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  Ponto Alvo (0 NM)
                </text>

                {/* Midpoint Altitude Tag */}
                {(() => {
                  const midX = (todX + targetX) / 2;
                  const midY = (cruiseY + targetY) / 2;
                  const midAlt = Math.round((cruiseAlt + targetAlt) / 2);
                  return (
                    <g>
                      <circle cx={midX} cy={midY} r="3" fill="#f59e0b" />
                      <text x={midX + 6} y={midY - 4} fill="#f59e0b" fontSize="9" fontFamily="monospace">
                        50%: {midAlt} ft
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Pilot Rules of Thumb Summary */}
            <div className="w-full mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                <span className="text-slate-400">Regra dos 3 (Piloto Clássico):</span>
                <div className="text-cyan-300 font-bold mt-0.5">
                  ΔAlt {((cruiseAlt - targetAlt) / 1000).toFixed(0)}k × 3 = {ruleOfThreeDistNm} NM
                </div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                <span className="text-slate-400">Estimativa VSI (GS × 5):</span>
                <div className="text-emerald-300 font-bold mt-0.5">
                  {groundSpeed} kt × 5 = ~{ruleOfThumbVsi} FPM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
