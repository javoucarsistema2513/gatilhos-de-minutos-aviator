import React, { useState } from 'react';
import {
  HourlyPayoutMapResult,
  HourlyPayoutStats,
  HourlyAnalysisFilter,
} from '../types';
import {
  Clock,
  Sparkles,
  Flame,
  Crown,
  Star,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Sun,
  Moon,
  Sunset,
  Sunrise,
} from 'lucide-react';

interface BestPayoutHoursMapProps {
  hourlyData: HourlyPayoutMapResult;
  currentMinute: number;
}

export const BestPayoutHoursMap: React.FC<BestPayoutHoursMapProps> = ({
  hourlyData,
  currentMinute,
}) => {
  const [filter, setFilter] = useState<HourlyAnalysisFilter>('ALL');
  const [selectedHour, setSelectedHour] = useState<HourlyPayoutStats>(
    hourlyData.currentHourData || hourlyData.hours[0]
  );

  const topHour = hourlyData.topOverallHours[0] || hourlyData.hours[21];
  const topPinkHour = hourlyData.topPinkHours[0] || hourlyData.hours[21];

  // Identificar taxa para a barra visual com base no filtro
  const getBarValue = (h: HourlyPayoutStats) => {
    if (filter === 'PINK_ONLY') return h.pinkRate;
    if (filter === 'PURPLE_ONLY') return h.purpleRate;
    return h.payingRate;
  };

  const getMaxBarValue = () => {
    if (filter === 'PINK_ONLY') return 25; // max pink % scale
    if (filter === 'PURPLE_ONLY') return 45; // max purple % scale
    return 65; // max paying % scale
  };

  const getBarColor = (h: HourlyPayoutStats) => {
    const isSelected = selectedHour.hour === h.hour;
    const isCurrent = h.isCurrentHour;

    if (filter === 'PINK_ONLY') {
      if (h.pinkRate >= 18) {
        return isSelected
          ? 'bg-gradient-to-t from-fuchsia-600 to-rose-500 ring-2 ring-fuchsia-300'
          : 'bg-gradient-to-t from-fuchsia-700 to-rose-600 hover:from-fuchsia-600 hover:to-rose-500';
      }
      if (h.pinkRate >= 14) {
        return isSelected
          ? 'bg-fuchsia-700 ring-2 ring-fuchsia-400'
          : 'bg-fuchsia-800/90 hover:bg-fuchsia-700';
      }
      return isSelected
        ? 'bg-slate-700 ring-2 ring-slate-400'
        : 'bg-slate-800 hover:bg-slate-700';
    }

    if (filter === 'PURPLE_ONLY') {
      if (h.purpleRate >= 36) {
        return isSelected
          ? 'bg-gradient-to-t from-purple-700 to-indigo-500 ring-2 ring-purple-300'
          : 'bg-gradient-to-t from-purple-800 to-indigo-600 hover:from-purple-700 hover:to-indigo-500';
      }
      if (h.purpleRate >= 30) {
        return isSelected
          ? 'bg-purple-800 ring-2 ring-purple-400'
          : 'bg-purple-900/90 hover:bg-purple-800';
      }
      return isSelected
        ? 'bg-slate-700 ring-2 ring-slate-400'
        : 'bg-slate-800 hover:bg-slate-700';
    }

    // Default: ALL (Paying = Purple + Pink)
    if (h.score >= 90) {
      return isSelected
        ? 'bg-gradient-to-t from-purple-700 via-rose-600 to-amber-400 ring-2 ring-amber-300 shadow-md shadow-rose-900/50'
        : 'bg-gradient-to-t from-purple-800 via-rose-600 to-orange-500 hover:brightness-110';
    }
    if (h.score >= 80) {
      return isSelected
        ? 'bg-gradient-to-t from-purple-800 to-rose-600 ring-2 ring-rose-400'
        : 'bg-gradient-to-t from-purple-900 to-rose-700 hover:brightness-110';
    }
    if (h.score >= 65) {
      return isSelected
        ? 'bg-purple-800 ring-2 ring-purple-400'
        : 'bg-purple-950/90 border border-purple-800/40 hover:bg-purple-900/80';
    }
    return isSelected
      ? 'bg-slate-700 ring-2 ring-slate-400'
      : 'bg-slate-800/80 hover:bg-slate-700';
  };

  const getPeriodIcon = (key: string) => {
    switch (key) {
      case 'MADRUGADA':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'MANHA':
        return <Sunrise className="w-3.5 h-3.5 text-amber-400" />;
      case 'TARDE':
        return <Sun className="w-3.5 h-3.5 text-orange-400" />;
      case 'NOITE':
      default:
        return <Sunset className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div
      id="best-payout-hours-map"
      className="rounded-2xl border border-slate-800 bg-[#0C101C]/85 p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4"
    >
      {/* Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 border border-rose-500/30 text-rose-400 shadow-sm">
            <Clock className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                Mapeamento de Melhores Horários
              </h3>
              <span className="rounded bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.5 text-[10px] font-black text-rose-300 uppercase">
                Roxas &amp; Rosas 24h
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Densidade e picos estatísticos do Aviator no Betão por hora do dia
            </p>
          </div>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filter === 'ALL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-300" />
            <span>Todas Pagadoras (≥2x)</span>
          </button>
          <button
            onClick={() => setFilter('PINK_ONLY')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filter === 'PINK_ONLY'
                ? 'bg-fuchsia-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-fuchsia-300" />
            <span>Rosas (10x+)</span>
          </button>
          <button
            onClick={() => setFilter('PURPLE_ONLY')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filter === 'PURPLE_ONLY'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-purple-300" />
            <span>Roxas (2x+)</span>
          </button>
        </div>
      </div>

      {/* 3 Top Summary Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Melhor Horário Geral */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-900/80 border border-amber-500/30 flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Melhor Horário Geral
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
              Pico Máximo
            </span>
          </div>
          <div>
            <span className="text-xl font-black text-white block">
              {topHour.timeRange}
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5">
              <strong className="text-amber-300 font-bold">{topHour.payingRate}% de velas pagadoras</strong>{' '}
              ({topHour.pinkRate}% rosas • {topHour.purpleRate}% roxas)
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>Minutos de Ouro:</span>
            {topHour.goldenMinutes.map((m) => (
              <span
                key={m}
                className="px-1 py-0.2 rounded bg-black/60 font-mono text-amber-300 font-bold"
              >
                :{String(m).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>

        {/* Card 2: Horário Quente para Velas Rosas */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-fuchsia-950/40 via-slate-900/80 to-slate-900/80 border border-fuchsia-500/30 flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              Pico de Velas Rosas (10x+)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-black border border-fuchsia-500/40">
              {topPinkHour.pinkRate}% de Rosas
            </span>
          </div>
          <div>
            <span className="text-xl font-black text-white block">
              {topPinkHour.timeRange}
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Maior probabilidade de explosão de vela alta (10x, 25x, 50x+) no Betão.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span>Minutos Chave:</span>
            {topPinkHour.goldenMinutes.slice(0, 4).map((m) => (
              <span
                key={m}
                className="px-1 py-0.2 rounded bg-black/60 font-mono text-fuchsia-300 font-bold"
              >
                :{String(m).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>

        {/* Card 3: Status do Horário Atual */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-rose-950/30 border border-slate-700/60 flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              Diagnóstico Horário Atual
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                hourlyData.currentHourData.score >= 85
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : hourlyData.currentHourData.score >= 70
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-700/40 text-slate-300 border-slate-600'
              }`}
            >
              {hourlyData.currentHourData.score >= 85
                ? 'Mesa Muito Quente 🔥'
                : hourlyData.currentHourData.score >= 70
                ? 'Zona Favorável ⚖️'
                : 'Fluxo Moderado ❄️'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-white">
                {hourlyData.currentHourData.hourLabel} ({hourlyData.currentHourData.timeRange})
              </span>
              <span className="text-xs font-mono font-bold text-rose-400">
                {hourlyData.currentHourData.payingRate}% Pagadoras
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
              {hourlyData.nextHotWindow.strategyNote}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="text-rose-400 font-bold">Próximo Pico:</span>
            <span>{hourlyData.nextHotWindow.timeRange}</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Visual Bar & Heatmap Chart */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            Distribuição 24 Horas (Clique em um horário para detalhes):
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hora Atual
            </span>
            <span className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
              Top Picos
            </span>
          </div>
        </div>

        {/* 24 Columns Chart Grid */}
        <div className="p-3 rounded-2xl bg-black/40 border border-slate-800/80 overflow-x-auto no-scrollbar">
          <div className="min-w-[640px] grid grid-cols-24 gap-1 sm:gap-1.5 items-end h-36 pt-4 pb-1">
            {hourlyData.hours.map((h) => {
              const val = getBarValue(h);
              const maxVal = getMaxBarValue();
              const heightPercent = Math.max(16, Math.min(100, Math.round((val / maxVal) * 100)));
              const isSelected = selectedHour.hour === h.hour;
              const isCurrent = h.isCurrentHour;

              return (
                <button
                  key={h.hour}
                  type="button"
                  onClick={() => setSelectedHour(h)}
                  className={`group relative flex flex-col items-center justify-end h-full w-full rounded-lg transition-all focus:outline-none ${
                    isSelected ? 'scale-105 z-10' : 'hover:scale-105'
                  }`}
                  title={`${h.timeRange} | ${h.payingRate}% pagadoras (${h.pinkRate}% rosas)`}
                >
                  {/* Top Badge for Top/Current */}
                  <div className="absolute -top-4 flex items-center justify-center pointer-events-none">
                    {h.isTopHour && (
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400 drop-shadow-md" />
                    )}
                    {!h.isTopHour && h.isTopPinkHour && (
                      <Sparkles className="w-2.5 h-2.5 text-fuchsia-400" />
                    )}
                    {isCurrent && !h.isTopHour && !h.isTopPinkHour && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>

                  {/* Visual Bar Column */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 flex flex-col justify-between items-center py-1 text-[9px] font-mono ${getBarColor(
                      h
                    )} ${
                      isCurrent
                        ? 'border-2 border-emerald-400 shadow-md shadow-emerald-500/40'
                        : ''
                    }`}
                  >
                    <span className="font-bold text-white leading-none opacity-90 group-hover:opacity-100">
                      {val}%
                    </span>
                  </div>

                  {/* Hour Label */}
                  <span
                    className={`mt-1 text-[10px] font-mono leading-none ${
                      isCurrent
                        ? 'text-emerald-300 font-extrabold'
                        : isSelected
                        ? 'text-white font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {String(h.hour).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Hour Details Inspector */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Análise Detalhada:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-600/20 text-rose-300 font-mono text-xs font-extrabold border border-rose-500/40">
              {selectedHour.timeRange}
            </span>
            {selectedHour.isCurrentHour && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HORÁRIO ATUAL
              </span>
            )}
            {selectedHour.isTopHour && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                TOP 3 PAGADORAS
              </span>
            )}
            {selectedHour.isTopPinkHour && (
              <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-bold border border-fuchsia-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-fuchsia-400" />
                PICO DE ROSAS (10x+)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-300">
              Score: <strong className="text-white">{selectedHour.score}/100</strong>
            </span>
            <span className="text-slate-300">
              Mult. Médio: <strong className="text-amber-300">{selectedHour.avgMultiplier.toFixed(2)}x</strong>
            </span>
          </div>
        </div>

        {/* Stats Grid of Selected Hour */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Velas Pagadoras (≥2x)
            </span>
            <span className="text-lg font-black text-rose-400 font-mono">
              {selectedHour.payingRate}%
            </span>
            <span className="text-[10px] text-slate-400 block">
              {selectedHour.payingCount} de {selectedHour.totalRounds} rodadas
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Velas Rosas (10x+)
            </span>
            <span className="text-lg font-black text-fuchsia-400 font-mono">
              {selectedHour.pinkRate}%
            </span>
            <span className="text-[10px] text-slate-400 block">
              {selectedHour.pinkCount} rosas registradas
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Velas Roxas (2x - 9.99x)
            </span>
            <span className="text-lg font-black text-purple-400 font-mono">
              {selectedHour.purpleRate}%
            </span>
            <span className="text-[10px] text-slate-400 block">
              {selectedHour.purpleCount} roxas registradas
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Minutos de Ouro da Hora
            </span>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {selectedHour.goldenMinutes.map((m) => (
                <span
                  key={m}
                  className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-200 font-mono text-[11px] font-bold"
                >
                  :{String(m).padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Periods Breakdown (Madrugada, Manhã, Tarde, Noite) */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-rose-400" />
          Desempenho por Turnos do Dia no Betão:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {hourlyData.periods.map((p) => (
            <div
              key={p.key}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getPeriodIcon(p.key)}
                  <span className="text-xs font-bold text-white">{p.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{p.hoursRange}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300">
                  Pagadoras:{' '}
                  <strong className="text-rose-400 font-bold font-mono">{p.payingRate}%</strong>
                </span>
                <span className="text-xs text-slate-300">
                  Rosas:{' '}
                  <strong className="text-fuchsia-400 font-bold font-mono">{p.pinkRate}%</strong>
                </span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2">{p.description}</p>

              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Pico:</span>
                <span className="font-mono text-amber-300 font-bold">{p.bestHourInPeriod}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
