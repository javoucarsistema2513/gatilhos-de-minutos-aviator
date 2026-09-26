import React, { useState, useId } from 'react';
import { FuelPlanningInput, FuelUnit, FuelType } from '../types/aviation';
import { calculateFuel } from '../utils/aviationFormulas';
import { Sparkles, Fuel, Gauge, AlertTriangle, CheckCircle2, Clock, MapPin } from 'lucide-react';

export const FuelPlanningCalculator: React.FC = () => {
  const [fuelOnBoard, setFuelOnBoard] = useState<number>(48);
  const [burnRate, setBurnRate] = useState<number>(9.5);
  const [distanceNm, setDistanceNm] = useState<number>(280);
  const [groundSpeed, setGroundSpeed] = useState<number>(120);
  const [fuelUnit, setFuelUnit] = useState<FuelUnit>('gal');
  const [fuelType, setFuelType] = useState<FuelType>('avgas');
  const [reserveMinutes, setReserveMinutes] = useState<number>(45);

  const rawFuelId = useId();
  const rawBurnId = useId();
  const rawDistId = useId();
  const rawGsId = useId();

  const input: FuelPlanningInput = {
    fuelOnBoard,
    fuelUnit,
    fuelType,
    fuelBurnRatePerHour: burnRate,
    distanceNm,
    groundSpeed,
    reserveMinutes,
  };

  const result = calculateFuel(input);

  // Remaining fuel percentage
  const remainingPct = fuelOnBoard > 0 ? Math.max(0, (result.fuelRemainingAtDestination / fuelOnBoard) * 100) : 0;
  const reservePct = fuelOnBoard > 0 ? Math.min(100, (result.reserveFuelRequired / fuelOnBoard) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-400" />
              Consumo, Autonomia & Combustível Regulamentar
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cálculo de autonomia total (Endurance), tempo em rota (ETE), queima de combustível e reserva.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setReserveMinutes(30)}
              className={`px-2.5 py-1 rounded font-mono ${
                reserveMinutes === 30 ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              VFR Dia (30 min)
            </button>
            <button
              onClick={() => setReserveMinutes(45)}
              className={`px-2.5 py-1 rounded font-mono ${
                reserveMinutes === 45 ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              VFR Noite / IFR (45 min)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" /> Abastecimento & Consumo
            </h3>

            {/* Unit selector */}
            <div className="flex bg-slate-800 p-0.5 rounded border border-slate-700 text-xs">
              <button
                onClick={() => setFuelUnit('gal')}
                className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                  fuelUnit === 'gal' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Gal (US)
              </button>
              <button
                onClick={() => setFuelUnit('liters')}
                className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                  fuelUnit === 'liters' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Litros
              </button>
              <button
                onClick={() => setFuelUnit('lbs')}
                className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                  fuelUnit === 'lbs' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Lbs
              </button>
            </div>
          </div>

          {/* Fuel on Board */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawFuelId} className="text-slate-300 font-medium">
                Combustível Total a Bordo
              </label>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {fuelOnBoard} {fuelUnit.toUpperCase()}
              </span>
            </div>
            <input
              id={rawFuelId}
              type="range"
              min="5"
              max={fuelUnit === 'liters' ? 800 : fuelUnit === 'lbs' ? 2500 : 250}
              step="1"
              value={fuelOnBoard}
              onChange={(e) => setFuelOnBoard(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Fuel Burn Rate */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawBurnId} className="text-slate-300 font-medium">
                Consumo Horário (Flow Rate)
              </label>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {burnRate} {fuelUnit.toUpperCase()}/h
              </span>
            </div>
            <input
              id={rawBurnId}
              type="range"
              min="2"
              max={fuelUnit === 'liters' ? 250 : fuelUnit === 'lbs' ? 800 : 80}
              step="0.5"
              value={burnRate}
              onChange={(e) => setBurnRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Distance of Flight */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawDistId} className="text-slate-300 font-medium">
                Distância da Rota / Etapa
              </label>
              <span className="font-mono text-emerald-400 font-bold text-sm">{distanceNm} NM</span>
            </div>
            <input
              id={rawDistId}
              type="range"
              min="10"
              max="1500"
              step="10"
              value={distanceNm}
              onChange={(e) => setDistanceNm(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Ground Speed */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between text-xs">
              <label htmlFor={rawGsId} className="text-slate-300 font-medium">
                Velocidade no Solo em Rota (GS)
              </label>
              <span className="font-mono text-cyan-400 font-bold text-sm">{groundSpeed} KT</span>
            </div>
            <input
              id={rawGsId}
              type="range"
              min="50"
              max="450"
              value={groundSpeed}
              onChange={(e) => setGroundSpeed(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        {/* Right Column: Telemetry & Visual Fuel Gauge (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              result.isFuelExhausted
                ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
                : !result.isReserveIntact
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {result.isFuelExhausted ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : !result.isReserveIntact ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}

            <div className="text-xs space-y-1">
              <div className="font-bold text-sm">
                {result.isFuelExhausted
                  ? 'PANE SECA ESTIMADA: COMBUSTÍVEL INSUFICIENTE!'
                  : !result.isReserveIntact
                  ? 'ATENÇÃO: POUSO COM USO DA RESERVA REGULAMENTAR'
                  : 'PLANEJAMENTO DE COMBUSTÍVEL DENTRO DOS PADRÕES'}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {result.isFuelExhausted
                  ? `A rota exige ${result.tripFuelBurn} ${fuelUnit}, mas há apenas ${fuelOnBoard} ${fuelUnit} a bordo. Reabasteça antes do voo!`
                  : !result.isReserveIntact
                  ? `Combustível remanescente no pouso (${result.fuelRemainingAtDestination} ${fuelUnit}) é menor que a reserva de segurança de ${reserveMinutes} min (${result.reserveFuelRequired} ${fuelUnit}).`
                  : `Combustível na chegada previsto em ${result.fuelRemainingAtDestination} ${fuelUnit}, mantendo a reserva mínima intacta.`}
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Endurance */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Autonomia Total</div>
              <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                {result.totalEnduranceString}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Até esgotamento</div>
            </div>

            {/* ETE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Tempo de Voo (ETE)</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                {result.eteString}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Rota {distanceNm} NM</div>
            </div>

            {/* Trip Fuel Burn */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Consumo Previsto</div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                {result.tripFuelBurn} <span className="text-xs font-normal">{fuelUnit}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Queima na etapa</div>
            </div>

            {/* Fuel Remaining */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Sobra no Pouso</div>
              <div
                className={`text-2xl font-mono font-bold mt-1 ${
                  result.isFuelExhausted
                    ? 'text-rose-400'
                    : !result.isReserveIntact
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {result.fuelRemainingAtDestination} <span className="text-xs font-normal">{fuelUnit}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Reserva requerida: {result.reserveFuelRequired} {fuelUnit}
              </div>
            </div>
          </div>

          {/* Visual Tank Gauge Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-300">
                Visualizador de Tanque & Divisão de Combustível
              </span>
              <span className="font-mono text-cyan-400">
                Alcance Máximo: {result.maxRangeNm} NM
              </span>
            </div>

            {/* Tank Capacity Graphic */}
            <div className="w-full bg-slate-950 h-7 rounded-lg overflow-hidden border border-slate-800 flex relative">
              {/* Trip Burned portion */}
              <div
                className="bg-slate-700/60 h-full border-r border-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400"
                style={{ width: `${Math.min(100, (result.tripFuelBurn / fuelOnBoard) * 100)}%` }}
                title="Consumo na Rota"
              >
                {((result.tripFuelBurn / fuelOnBoard) * 100).toFixed(0)}% ROTA
              </div>

              {/* Remaining portion */}
              <div
                className={`h-full flex items-center justify-center text-[10px] font-mono font-bold text-white transition-all ${
                  result.isFuelExhausted
                    ? 'bg-rose-600'
                    : !result.isReserveIntact
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, remainingPct))}%` }}
                title="Sobra no Destino"
              >
                {remainingPct.toFixed(0)}% SOBRA
              </div>
            </div>

            <div className="flex justify-between text-xs font-mono text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-slate-700 rounded-sm"></span>
                <span>Queima Etapa: {result.tripFuelBurn} {fuelUnit}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span>
                <span>Reserva {reserveMinutes}m: {result.reserveFuelRequired} {fuelUnit}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
                <span>Remanescente: {result.fuelRemainingAtDestination} {fuelUnit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
