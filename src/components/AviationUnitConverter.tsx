import React, { useState } from 'react';
import { ArrowRightLeft, Gauge, Compass, Thermometer, Fuel, Layers } from 'lucide-react';

export const AviationUnitConverter: React.FC = () => {
  // Speed values (base: knots)
  const [knots, setKnots] = useState<number>(120);

  // Distance / Altitude (base: nautical miles)
  const [nm, setNm] = useState<number>(100);
  const [feet, setFeet] = useState<number>(10000);

  // Pressure (base: hPa)
  const [hpa, setHpa] = useState<number>(1013.25);

  // Fuel (Avgas 100LL: 6.0 lbs/gal, 0.72 kg/L)
  const [gallons, setGallons] = useState<number>(50);
  const [fuelType, setFuelType] = useState<'avgas' | 'jetA1'>('avgas');

  // Temperature
  const [celsius, setCelsius] = useState<number>(15);

  // Helpers for Speed
  const handleKnotsChange = (val: number) => setKnots(val);
  const handleKmhChange = (val: number) => setKnots(Math.round((val / 1.852) * 10) / 10);
  const handleMphChange = (val: number) => setKnots(Math.round((val / 1.15078) * 10) / 10);
  const handleMsChange = (val: number) => setKnots(Math.round(val * 1.94384 * 10) / 10);

  // Fuel density factors:
  // Avgas 100LL: 6.01 lbs/gal, 0.721 kg/L, 3.78541 L/gal
  // Jet-A1: 6.70 lbs/gal, 0.804 kg/L, 3.78541 L/gal
  const lbsPerGal = fuelType === 'avgas' ? 6.01 : 6.70;
  const kgPerLiter = fuelType === 'avgas' ? 0.721 : 0.804;
  const litersPerGal = 3.78541;

  const currentLiters = Math.round(gallons * litersPerGal * 10) / 10;
  const currentLbs = Math.round(gallons * lbsPerGal * 10) / 10;
  const currentKg = Math.round(currentLiters * kgPerLiter * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
              Conversor Rápido de Unidades Aeronáuticas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Conversão bidirecional instantânea entre unidades padrão da aviação civil e internacional.
            </p>
          </div>
        </div>
      </div>

      {/* Converter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Velocidades */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" /> Velocidade Aeronáutica
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Nós (Knots / KT)</label>
              <input
                type="number"
                value={knots}
                onChange={(e) => handleKnotsChange(Number(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Quilômetros/hora (km/h)</label>
              <input
                type="number"
                value={Math.round(knots * 1.852 * 10) / 10}
                onChange={(e) => handleKmhChange(Number(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Milhas por hora (mph)</label>
              <input
                type="number"
                value={Math.round(knots * 1.15078 * 10) / 10}
                onChange={(e) => handleMphChange(Number(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Metros por segundo (m/s)</label>
              <input
                type="number"
                value={Math.round((knots / 1.94384) * 10) / 10}
                onChange={(e) => handleMsChange(Number(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Pressão Barométrica */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" /> Pressão Barométrica (QNH)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Hectopascais / Milibares (hPa / mb)</label>
              <input
                type="number"
                step="0.1"
                value={hpa}
                onChange={(e) => setHpa(Number(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Polegadas de Hg (inHg)</label>
              <input
                type="number"
                step="0.01"
                value={Math.round((hpa / 33.863886) * 100) / 100}
                onChange={(e) => setHpa(Math.round((Number(e.target.value) || 0) * 33.863886 * 10) / 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Milímetros de Hg (mmHg)</label>
              <input
                type="number"
                step="0.1"
                value={Math.round(hpa * 0.750062 * 10) / 10}
                onChange={(e) => setHpa(Math.round(((Number(e.target.value) || 0) / 0.750062) * 10) / 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Libras/pol² (PSI)</label>
              <input
                type="number"
                step="0.01"
                value={Math.round(hpa * 0.0145038 * 100) / 100}
                readOnly
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded px-2.5 py-1.5 text-sm font-mono text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 3. Altitude e Distância */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> Altitude & Distância
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Pés (Feet / FT)</label>
              <input
                type="number"
                value={feet}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setFeet(val);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Metros (m)</label>
              <input
                type="number"
                value={Math.round(feet * 0.3048 * 10) / 10}
                onChange={(e) => setFeet(Math.round(((Number(e.target.value) || 0) / 0.3048)))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Milhas Náuticas (NM)</label>
              <input
                type="number"
                value={nm}
                onChange={(e) => setNm(Number(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Quilômetros (km)</label>
              <input
                type="number"
                value={Math.round(nm * 1.852 * 10) / 10}
                onChange={(e) => setNm(Math.round(((Number(e.target.value) || 0) / 1.852) * 10) / 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Combustível & Massa */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-400" /> Combustível & Massa
            </h3>
            <div className="flex bg-slate-800 p-0.5 rounded border border-slate-700 text-xs">
              <button
                onClick={() => setFuelType('avgas')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  fuelType === 'avgas' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Avgas 100LL
              </button>
              <button
                onClick={() => setFuelType('jetA1')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  fuelType === 'jetA1' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Jet A-1
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Galões US (Gal)</label>
              <input
                type="number"
                value={gallons}
                onChange={(e) => setGallons(Number(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Litros (L)</label>
              <input
                type="number"
                value={currentLiters}
                onChange={(e) => setGallons(Math.round(((Number(e.target.value) || 0) / litersPerGal) * 10) / 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Libras de Peso (lbs)</label>
              <input
                type="number"
                value={currentLbs}
                onChange={(e) => setGallons(Math.round(((Number(e.target.value) || 0) / lbsPerGal) * 10) / 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Quilogramas (kg)</label>
              <input
                type="number"
                value={currentKg}
                onChange={(e) => {
                  const kgVal = Number(e.target.value) || 0;
                  const litVal = kgVal / kgPerLiter;
                  setGallons(Math.round((litVal / litersPerGal) * 10) / 10);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* 5. Temperatura */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4 md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400" /> Temperatura
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Graus Celsius (°C)</label>
              <input
                type="number"
                value={celsius}
                onChange={(e) => setCelsius(Number(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Graus Fahrenheit (°F)</label>
              <input
                type="number"
                value={Math.round(((celsius * 9) / 5 + 32) * 10) / 10}
                onChange={(e) => setCelsius(Math.round(((((Number(e.target.value) || 0) - 32) * 5) / 9) * 10) / 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Kelvin (K)</label>
              <input
                type="number"
                value={Math.round((celsius + 273.15) * 10) / 10}
                onChange={(e) => setCelsius(Math.round(((Number(e.target.value) || 0) - 273.15) * 10) / 10)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
