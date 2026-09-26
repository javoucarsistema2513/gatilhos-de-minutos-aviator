import React, { useState } from 'react';
import { Clock, Plane, FileText, ArrowRightLeft, ShieldAlert, Check, Copy } from 'lucide-react';

export const FlightLogMinutagem: React.FC = () => {
  // Conversion sexagesimal to decimal
  const [inputHours, setInputHours] = useState<number>(1);
  const [inputMins, setInputMins] = useState<number>(45);

  // Decimal to sexagesimal
  const [decimalHours, setDecimalHours] = useState<number>(1.75);

  // Flight log chock-to-chock times (HH:MM in UTC)
  const [outTime, setOutTime] = useState<string>('14:10'); // Chocks out
  const [offTime, setOffTime] = useState<string>('14:25'); // Wheels off (Takeoff)
  const [onTime, setOnTime] = useState<string>('16:05');  // Wheels on (Landing)
  const [inTime, setInTime] = useState<string>('16:15');  // Chocks in

  // Copied feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Helper to parse HH:MM to total minutes
  const parseTimeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 60 + m;
  };

  const outMin = parseTimeToMinutes(outTime);
  const offMin = parseTimeToMinutes(offTime);
  const onMin = parseTimeToMinutes(onTime);
  const inMin = parseTimeToMinutes(inTime);

  // Calculate block time (Out to In)
  let blockMinutes = inMin - outMin;
  if (blockMinutes < 0) blockMinutes += 24 * 60; // Cross midnight

  // Calculate flight time (Off to On)
  let flightMinutes = onMin - offMin;
  if (flightMinutes < 0) flightMinutes += 24 * 60;

  // Taxi times
  const taxiOutMinutes = Math.max(0, offMin - outMin);
  const taxiInMinutes = Math.max(0, inMin - onMin);

  // Decimal block and flight times
  const blockHoursDecimal = Math.round((blockMinutes / 60) * 100) / 100;
  const flightHoursDecimal = Math.round((flightMinutes / 60) * 100) / 100;

  // Format HH:MM from minutes
  const formatHhMm = (totalMin: number) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Convert input sexagesimal to decimal
  const calculatedDecimal = Math.round((inputHours + inputMins / 60) * 100) / 100;

  // Convert decimal to hours and minutes
  const calculatedSexaHours = Math.floor(decimalHours);
  const calculatedSexaMins = Math.round((decimalHours - calculatedSexaHours) * 60);

  const handleCopySummary = () => {
    const text = `REGISTRO DE VOO / MINUTAGEM:
Partida dos Calços (Out): ${outTime}Z
Decolagem (Off): ${offTime}Z
Pouso (On): ${onTime}Z
Corte nos Calços (In): ${inTime}Z
-------------------------
Tempo de Bloco (Calço a Calço): ${formatHhMm(blockMinutes)} (${blockHoursDecimal}h decimal)
Tempo de Voo (Ar): ${formatHhMm(flightMinutes)} (${flightHoursDecimal}h decimal)
Tempo de Táxi: ${taxiOutMinutes + taxiInMinutes} min`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Minutagem de Voo & Diário de Bordo (CIV / ANAC)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cálculo de tempos de calço a calço (tempo de bloco), tempo de voo e conversão para horas decimais/centesimais.
          </p>
        </div>
        <button
          onClick={handleCopySummary}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'COPIADO!' : 'COPIAR REGISTRO'}</span>
        </button>
      </div>

      {/* Grid: Flight Times Calculator & Decimal Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flight Times / Block Times */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Tempos de Bloco e Voo (Out, Off, On, In)
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Horário UTC (Zulu)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Saída Calços (Out)</label>
              <input
                type="time"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">Início do táxi</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Decolagem (Off)</label>
              <input
                type="time"
                value={offTime}
                onChange={(e) => setOffTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">Pneus deixam a pista</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Pouso (On)</label>
              <input
                type="time"
                value={onTime}
                onChange={(e) => setOnTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">Toque na pista</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Corte Calços (In)</label>
              <input
                type="time"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">Motores desligados</span>
            </div>
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Block Time */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Tempo de Bloco (Calço a Calço)
              </div>
              <div className="text-2xl font-mono font-bold text-cyan-300 mt-1">
                {formatHhMm(blockMinutes)}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Decimal: <strong className="text-white">{blockHoursDecimal}h</strong>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Para remuneração e horas totais
              </div>
            </div>

            {/* Flight Time */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Tempo de Voo (Ar / Decolagem-Pouso)
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                {formatHhMm(flightMinutes)}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Decimal: <strong className="text-white">{flightHoursDecimal}h</strong>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Para células e motores (Airframe)
              </div>
            </div>

            {/* Taxi Time */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Tempo de Táxi
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                {taxiOutMinutes + taxiInMinutes} <span className="text-sm font-normal">min</span>
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Saída: {taxiOutMinutes}m | Chegada: {taxiInMinutes}m
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Consumo de solo
              </div>
            </div>
          </div>
        </div>

        {/* Decimal / Centesimal Converter */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" /> Conversor Horas : Minutos ↔ Centesimal
          </h3>

          {/* Sexagesimal to Decimal */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">
              Horas e Minutos (HH:MM)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Horas</label>
                <input
                  type="number"
                  min="0"
                  value={inputHours}
                  onChange={(e) => setInputHours(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Minutos</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputMins}
                  onChange={(e) => setInputMins(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-white"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Equivalente Centesimal:</span>
              <span className="text-base font-bold text-cyan-300">{calculatedDecimal} h</span>
            </div>
          </div>

          {/* Decimal to Sexagesimal */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs text-slate-300 font-medium block">
              Horas Decimais (ex: 2.75)
            </label>
            <input
              type="number"
              step="0.05"
              value={decimalHours}
              onChange={(e) => setDecimalHours(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-white"
            />
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Equivalente Sexagesimal:</span>
              <span className="text-base font-bold text-emerald-300">
                {calculatedSexaHours}h {calculatedSexaMins}min
              </span>
            </div>
          </div>

          {/* Quick Table */}
          <div className="text-[10px] text-slate-400 font-mono pt-1">
            <div className="grid grid-cols-4 gap-1 text-center bg-slate-950 p-2 rounded-lg border border-slate-800">
              <div>06m = 0.1h</div>
              <div>12m = 0.2h</div>
              <div>15m = 0.25h</div>
              <div>30m = 0.5h</div>
              <div>45m = 0.75h</div>
              <div>48m = 0.8h</div>
              <div>54m = 0.9h</div>
              <div>60m = 1.0h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
