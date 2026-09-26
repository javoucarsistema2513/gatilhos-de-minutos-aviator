import React, { useState } from 'react';
import { AircraftPreset, WeightStation } from '../types/aviation';
import { AIRCRAFT_PRESETS } from '../utils/aviationFormulas';
import { Scale, AlertTriangle, CheckCircle2, XCircle, Info, RefreshCw } from 'lucide-react';

interface WeightAndBalanceCalculatorProps {
  selectedPreset: AircraftPreset;
}

export const WeightAndBalanceCalculator: React.FC<WeightAndBalanceCalculatorProps> = ({
  selectedPreset: initialPreset,
}) => {
  const [currentPreset, setCurrentPreset] = useState<AircraftPreset>(initialPreset);
  const [stations, setStations] = useState<WeightStation[]>(initialPreset.stations);

  // When user switches preset
  const handleSelectPreset = (preset: AircraftPreset) => {
    setCurrentPreset(preset);
    setStations(preset.stations.map((s) => ({ ...s })));
  };

  // Update station weight
  const updateStationWeight = (id: string, weight: number) => {
    setStations((prev) =>
      prev.map((st) => (st.id === id ? { ...st, weight: Math.max(0, weight) } : st))
    );
  };

  // Real-time calculations:
  // Total Weight = Sum of all station weights
  const totalWeightLbs = stations.reduce((acc, st) => acc + st.weight, 0);
  // Total Moment = Sum of (weight * arm)
  const totalMoment = stations.reduce((acc, st) => acc + st.weight * st.arm, 0);
  // Center of Gravity (CG) = Total Moment / Total Weight
  const cgArm = totalWeightLbs > 0 ? totalMoment / totalWeightLbs : 0;

  // Limits verification:
  const isOverweight = totalWeightLbs > currentPreset.mtowLbs;
  const isCgForward = cgArm < currentPreset.cgForwardLimit;
  const isCgAft = cgArm > currentPreset.cgAftLimit;
  const isCgSafe = !isCgForward && !isCgAft && !isOverweight;

  // Envelope SVG Dimensions
  const svgWidth = 420;
  const svgHeight = 260;
  const padL = 50;
  const padR = 30;
  const padT = 25;
  const padB = 40;

  const chartW = svgWidth - padL - padR;
  const chartH = svgHeight - padT - padB;

  // Coordinate scales for the aircraft envelope
  const minArm = currentPreset.cgForwardLimit - 4;
  const maxArm = currentPreset.cgAftLimit + 4;
  const minWeight = currentPreset.bewLbs - 200;
  const maxWeight = currentPreset.mtowLbs + 300;

  // Convert Arm to X
  const armToX = (arm: number) => padL + ((arm - minArm) / (maxArm - minArm)) * chartW;
  // Convert Weight to Y (higher weight = higher up, smaller Y)
  const weightToY = (wt: number) => padT + chartH - ((wt - minWeight) / (maxWeight - minWeight)) * chartH;

  const currentCgX = armToX(cgArm);
  const currentCgY = weightToY(totalWeightLbs);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              Peso & Balanceamento (Envelope de CG)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo instantâneo de peso total de decolagem, momentos e projeção no envelope de voo.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Modelo:</span>
            <select
              value={currentPreset.id}
              onChange={(e) => {
                const found = AIRCRAFT_PRESETS.find((p) => p.id === e.target.value);
                if (found) handleSelectPreset(found);
              }}
              className="bg-slate-950 border border-slate-700 text-cyan-300 text-xs rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500"
            >
              {AIRCRAFT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stations Input Column (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Estações de Carga (Stations)
            </h3>
            <span className="text-xs font-mono text-slate-400">Braço (pol) & Peso (lbs)</span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
            {stations.map((st) => {
              const isBEW = st.id === 'bew';
              return (
                <div key={st.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-medium">{st.name}</span>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-slate-500 text-[11px]">Braço: {st.arm}"</span>
                      <span className="text-cyan-400 font-bold">{st.weight} lbs</span>
                    </div>
                  </div>

                  {!isBEW ? (
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="range"
                        min="0"
                        max={st.maxWeight || 500}
                        step="5"
                        value={st.weight}
                        onChange={(e) => updateStationWeight(st.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max={st.maxWeight || 1000}
                        value={st.weight}
                        onChange={(e) => updateStationWeight(st.id, Number(e.target.value) || 0)}
                        className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-xs font-mono text-cyan-300"
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-mono italic">
                      Configuração fixa da aeronave selecionada
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => handleSelectPreset(currentPreset)}
            className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restaurar Carga Padrão
          </button>
        </div>

        {/* Right Column: Calculations & 2D CG Envelope (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isCgSafe
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/50 border-rose-500/60 text-rose-200'
            }`}
          >
            {isCgSafe ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            )}

            <div className="text-xs space-y-1">
              <div className="font-bold text-sm">
                {isCgSafe
                  ? 'PESO E BALANCEAMENTO DENTRO DO ENVELOPE'
                  : isOverweight
                  ? 'AERONAVE COM PESO MÁXIMO ULTRAPASSADO!'
                  : isCgForward
                  ? 'CENTRO DE GRAVIDADE MUITO ADIANTADO!'
                  : 'CENTRO DE GRAVIDADE MUITO ATRASADO!'}
              </div>
              <p className="text-slate-300">
                {isCgSafe
                  ? `Peso Total de ${totalWeightLbs} lbs (MTOW ${currentPreset.mtowLbs} lbs) e CG em ${cgArm.toFixed(2)}" dentro dos limites (${currentPreset.cgForwardLimit}" a ${currentPreset.cgAftLimit}").`
                  : isOverweight
                  ? `Excesso de ${totalWeightLbs - currentPreset.mtowLbs} lbs acima do MTOW. Reduza combustível ou bagagens.`
                  : isCgForward
                  ? `CG em ${cgArm.toFixed(2)}" está à frente do limite dianteiro (${currentPreset.cgForwardLimit}"). Reduza peso nos bancos dianteiros ou adicione no bagageiro.`
                  : `CG em ${cgArm.toFixed(2)}" está atrás do limite traseiro (${currentPreset.cgAftLimit}"). Risco severo de perda de estabilidade longitudinal e stall irrecuperável!`}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Peso Total</div>
              <div
                className={`text-xl font-mono font-bold mt-1 ${
                  isOverweight ? 'text-rose-400' : 'text-slate-100'
                }`}
              >
                {totalWeightLbs} <span className="text-xs font-normal">LBS</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                MTOW: {currentPreset.mtowLbs} lbs
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Posição do CG</div>
              <div
                className={`text-xl font-mono font-bold mt-1 ${
                  isCgSafe ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {cgArm.toFixed(2)}"
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Faixa: {currentPreset.cgForwardLimit}" - {currentPreset.cgAftLimit}"
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Carga Útil</div>
              <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                {Math.max(0, currentPreset.mtowLbs - currentPreset.bewLbs)} <span className="text-xs font-normal">LBS</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Disponível: {currentPreset.mtowLbs - totalWeightLbs} lbs
              </div>
            </div>
          </div>

          {/* 2D CG Envelope Visualizer SVG */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Gráfico do Envelope de CG
              </span>
              <span className="font-mono text-cyan-400">
                Momento Total: {Math.round(totalMoment).toLocaleString()} lb-in
              </span>
            </div>

            <div className="relative w-full overflow-x-auto flex justify-center">
              <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                {/* Axes lines */}
                <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#475569" strokeWidth="1.5" />
                <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#475569" strokeWidth="1.5" />

                {/* Y Axis Labels (Weight) */}
                <text x={padL - 6} y={weightToY(currentPreset.mtowLbs) + 4} textAnchor="end" fill="#f87171" fontSize="9" fontFamily="monospace">
                  {currentPreset.mtowLbs} (MTOW)
                </text>
                <text x={padL - 6} y={weightToY(currentPreset.bewLbs) + 4} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  {currentPreset.bewLbs} (BEW)
                </text>

                {/* X Axis Labels (Arm) */}
                <text x={armToX(currentPreset.cgForwardLimit)} y={padT + chartH + 15} textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                  {currentPreset.cgForwardLimit}"
                </text>
                <text x={armToX(currentPreset.cgAftLimit)} y={padT + chartH + 15} textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                  {currentPreset.cgAftLimit}"
                </text>

                {/* CG Safe Envelope Polygon */}
                {(() => {
                  const xFwd = armToX(currentPreset.cgForwardLimit);
                  const xAft = armToX(currentPreset.cgAftLimit);
                  const yBew = weightToY(currentPreset.bewLbs);
                  const yMtow = weightToY(currentPreset.mtowLbs);

                  return (
                    <polygon
                      points={`${xFwd},${yBew} ${xFwd},${yMtow} ${xAft},${yMtow} ${xAft},${yBew}`}
                      fill="rgba(52, 211, 153, 0.12)"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  );
                })()}

                {/* Current Aircraft CG Point */}
                <circle
                  cx={currentCgX}
                  cy={currentCgY}
                  r="6"
                  fill={isCgSafe ? '#10b981' : '#ef4444'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className={!isCgSafe ? 'animate-ping' : ''}
                />
                <circle
                  cx={currentCgX}
                  cy={currentCgY}
                  r="5"
                  fill={isCgSafe ? '#10b981' : '#ef4444'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* Crosshairs to axes */}
                <line x1={padL} y1={currentCgY} x2={currentCgX} y2={currentCgY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1={currentCgX} y1={currentCgY} x2={currentCgX} y2={padT + chartH} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

                {/* Label near point */}
                <text
                  x={currentCgX + 10}
                  y={currentCgY - 6}
                  fill={isCgSafe ? '#34d399' : '#f87171'}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  CG: {cgArm.toFixed(1)}" ({totalWeightLbs} lbs)
                </text>
              </svg>
            </div>

            <div className="text-[11px] text-slate-400 font-mono text-center mt-2">
              Área verde representa o envelope aprovado no manual de voo (POH)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
