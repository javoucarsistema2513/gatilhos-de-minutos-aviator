import React, { useState, useId } from 'react';
import { AltitudePerformanceInput, PressureUnit } from '../types/aviation';
import { calculateAltitudePerformance } from '../utils/aviationFormulas';
import { Activity, Thermometer, Gauge, AlertTriangle, ArrowUpRight, CloudSun } from 'lucide-react';

export const AltitudePerformanceCalculator: React.FC = () => {
  const [indicatedAlt, setIndicatedAlt] = useState<number>(3000);
  const [qnhUnit, setQnhUnit] = useState<PressureUnit>('hPa');
  const [qnhHpa, setQnhHpa] = useState<number>(1013);
  const [qnhInHg, setQnhInHg] = useState<number>(29.92);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [oatCelsius, setOatCelsius] = useState<number>(25);
  const [casKt, setCasKt] = useState<number>(110);

  const rawAltId = useId();
  const rawQnhId = useId();
  const rawOatId = useId();
  const rawCasId = useId();

  // Convert QNH based on unit
  const activeQnh = qnhUnit === 'hPa' ? qnhHpa : qnhInHg;

  const input: AltitudePerformanceInput = {
    indicatedAltitude: indicatedAlt,
    qnh: activeQnh,
    qnhUnit,
    oatCelsius,
    casKt,
  };

  const result = calculateAltitudePerformance(input);

  // High density altitude warning
  const isHighDensityAltitude = result.densityAltitude > 4000;
  const isExtremeDensityAltitude = result.densityAltitude > 7000;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Altitudes & Performance Aerodinâmica (TAS / Mach / DA)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Altitude de Pressão, Altitude Densidade, True Airspeed e desvio ISA em tempo real.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => {
                setIndicatedAlt(0);
                setQnhHpa(1013.25);
                setQnhInHg(29.92);
                setOatCelsius(15);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px]"
            >
              Atmosfera Padrão ISA
            </button>
            <button
              onClick={() => {
                setIndicatedAlt(5500);
                setQnhHpa(1008);
                setQnhInHg(29.77);
                setOatCelsius(32);
              }}
              className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800 font-mono text-[11px]"
            >
              Dia Quente / Alta DA
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" /> Condições Atmosféricas
          </h3>

          {/* Indicated Altitude */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawAltId} className="text-slate-300 font-medium">
                Altitude Indicada / Elevação
              </label>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {indicatedAlt.toLocaleString()} FT
              </span>
            </div>
            <input
              id={rawAltId}
              type="range"
              min="0"
              max="25000"
              step="100"
              value={indicatedAlt}
              onChange={(e) => setIndicatedAlt(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between items-center pt-1 text-xs">
              <div className="flex gap-1 text-[11px]">
                <button
                  onClick={() => setIndicatedAlt((a) => Math.max(0, a - 500))}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 font-mono"
                >
                  -500
                </button>
                <button
                  onClick={() => setIndicatedAlt((a) => a + 500)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 font-mono"
                >
                  +500
                </button>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="45000"
                  step="50"
                  value={indicatedAlt}
                  onChange={(e) => setIndicatedAlt(Math.max(0, Number(e.target.value) || 0))}
                  className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-400 font-mono">ft</span>
              </div>
            </div>
          </div>

          {/* QNH Altimeter Setting */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor={rawQnhId} className="text-slate-300 font-medium">
                Ajuste de Altímetro (QNH)
              </label>
              <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded border border-slate-700">
                <button
                  onClick={() => {
                    setQnhUnit('hPa');
                    setQnhHpa(Math.round(qnhInHg * 33.8639));
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    qnhUnit === 'hPa' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  hPa
                </button>
                <button
                  onClick={() => {
                    setQnhUnit('inHg');
                    setQnhInHg(Math.round((qnhHpa / 33.8639) * 100) / 100);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    qnhUnit === 'inHg' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  inHg
                </button>
              </div>
            </div>

            {qnhUnit === 'hPa' ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Pressão atmosférica</span>
                  <span className="text-cyan-400 font-bold">{qnhHpa} hPa</span>
                </div>
                <input
                  id={rawQnhId}
                  type="range"
                  min="950"
                  max="1050"
                  step="1"
                  value={qnhHpa}
                  onChange={(e) => setQnhHpa(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Pressão em polegadas de Hg</span>
                  <span className="text-cyan-400 font-bold">{qnhInHg.toFixed(2)} inHg</span>
                </div>
                <input
                  id={rawQnhId}
                  type="range"
                  min="28.00"
                  max="31.50"
                  step="0.01"
                  value={qnhInHg}
                  onChange={(e) => setQnhInHg(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Outside Air Temperature (OAT) */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor={rawOatId} className="text-slate-300 font-medium flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                Temperatura Externa (OAT)
              </label>
              <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded border border-slate-700">
                <button
                  onClick={() => setTempUnit('C')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    tempUnit === 'C' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  °C
                </button>
                <button
                  onClick={() => setTempUnit('F')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    tempUnit === 'F' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  °F
                </button>
              </div>
            </div>

            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">
                {tempUnit === 'C'
                  ? `${oatCelsius}°C (${Math.round((oatCelsius * 9) / 5 + 32)}°F)`
                  : `${Math.round((oatCelsius * 9) / 5 + 32)}°F (${oatCelsius}°C)`}
              </span>
              <span className="text-amber-400 font-bold">{oatCelsius}°C</span>
            </div>
            <input
              id={rawOatId}
              type="range"
              min="-40"
              max="50"
              value={oatCelsius}
              onChange={(e) => setOatCelsius(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Calibrated Airspeed (CAS / IAS) */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawCasId} className="text-slate-300 font-medium">
                Velocidade Calibrada / Indicada (CAS / IAS)
              </label>
              <span className="font-mono text-emerald-400 font-bold text-sm">{casKt} KT</span>
            </div>
            <input
              id={rawCasId}
              type="range"
              min="40"
              max="350"
              value={casKt}
              onChange={(e) => setCasKt(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        {/* Right Column: Calculations & Aviation Diagnostics (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Density Altitude Warning Banner */}
          {isHighDensityAltitude && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                isExtremeDensityAltitude
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                  : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm">
                  {isExtremeDensityAltitude
                    ? 'ALERTA CRÍTICO: ALTITUDE DENSIDADE EXTREMA'
                    : 'ATENÇÃO: ALTA ALTITUDE DENSIDADE (HIGH DENSITY ALTITUDE)'}
                </div>
                <p className="text-slate-300 leading-relaxed">
                  A aeronave se comportará como se estivesse a{' '}
                  <span className="font-bold text-white">{result.densityAltitude.toLocaleString()} pés</span>.{' '}
                  Distância de decolagem estimada +{result.takeoffRollIncreasePct}% maior e razão de subida
                  reduzida em -{result.rateOfClimbDegradationPct}%.
                </p>
              </div>
            </div>
          )}

          {/* Core Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Pressure Altitude */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Alt. Pressão (PA)</div>
              <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                {result.pressureAltitude.toLocaleString()} <span className="text-xs font-normal">FT</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Nível 1013.25 hPa</div>
            </div>

            {/* Density Altitude */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Alt. Densidade (DA)</div>
              <div
                className={`text-2xl font-mono font-bold mt-1 ${
                  result.densityAltitude > 5000
                    ? 'text-rose-400'
                    : result.densityAltitude > 3000
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {result.densityAltitude.toLocaleString()} <span className="text-xs font-normal">FT</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {result.densityAltitude > indicatedAlt
                  ? `+${result.densityAltitude - indicatedAlt} ft acima do indicado`
                  : `${result.densityAltitude - indicatedAlt} ft`}
              </div>
            </div>

            {/* ISA Deviation */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Atmosfera ISA</div>
              <div
                className={`text-2xl font-mono font-bold mt-1 ${
                  result.isaDeviation > 0 ? 'text-amber-400' : 'text-cyan-400'
                }`}
              >
                {result.isaDeviation > 0 ? `+${result.isaDeviation}°C` : `${result.isaDeviation}°C`}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Temp ISA Padrão: {result.isaTemp}°C
              </div>
            </div>

            {/* True Airspeed (TAS) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">True Airspeed (TAS)</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                {result.trueAirspeed} <span className="text-xs font-normal text-emerald-500">KT</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {result.trueAirspeedKmh} km/h (CAS {casKt} kt)
              </div>
            </div>

            {/* Mach Number */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Número Mach</div>
              <div className="text-2xl font-mono font-bold text-cyan-300 mt-1">
                M {result.machNumber.toFixed(3)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Vel. do Som: {result.speedOfSound} KT
              </div>
            </div>

            {/* Performance Impact */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Impacto em Pista</div>
              <div className="text-2xl font-mono font-bold text-amber-300 mt-1">
                +{result.takeoffRollIncreasePct}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Corrida de decolagem estimada
              </div>
            </div>
          </div>

          {/* Visual Density Altitude vs Sea Level Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Escala de Densidade do Ar & Rendimento do Motor
              </span>
              <span className="font-mono text-cyan-400">
                Densidade: {Math.max(0, 100 - result.densityAltitude / 200).toFixed(0)}% da MSL
              </span>
            </div>

            <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
              {/* Visual colored scale */}
              <div className="w-1/4 bg-emerald-500/80 h-full border-r border-slate-900" title="Ideal (0-2000ft)" />
              <div className="w-1/4 bg-cyan-500/80 h-full border-r border-slate-900" title="Normal (2000-5000ft)" />
              <div className="w-1/4 bg-amber-500/80 h-full border-r border-slate-900" title="Atenção (5000-8000ft)" />
              <div className="w-1/4 bg-rose-500/80 h-full" title="Crítico (>8000ft)" />
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 ft (Nível do Mar)</span>
              <span>3.000 ft</span>
              <span>6.000 ft</span>
              <span>10.000+ ft</span>
            </div>

            <div className="pt-2 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80">
              💡 <strong className="text-slate-300">Dica Prática:</strong> A cada 1.000 pés de altitude densidade adicional, o ar se torna menos denso, diminuindo a sustentação das asas, o empuxo da hélice e a potência de motores aspirados em cerca de 3% a 4%.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
