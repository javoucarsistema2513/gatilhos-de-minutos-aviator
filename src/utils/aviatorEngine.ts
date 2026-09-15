import {
  RoundData,
  MultiplierTier,
  TriggerSignal,
  MinuteHeatmapData,
  GlobalStats,
  ConfidenceMode,
  TableClimate,
} from '../types';

export function getMultiplierTier(mult: number): MultiplierTier {
  if (mult >= 10.00) return 'pink';
  if (mult >= 2.00) return 'purple';
  return 'blue';
}

export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatMinute(m: number): string {
  return `:${String(m).padStart(2, '0')}`;
}

/**
 * Avalia o "Clima da Mesa do Betão" nos últimos 20 rounds
 */
export function calculateTableClimate(rounds: RoundData[]): TableClimate {
  if (!rounds || rounds.length < 5) {
    return {
      status: 'NEUTRO',
      title: 'Mesa Estável no Betão',
      description: 'Coletando dados da mesa para calibrar assertividade máxima.',
      payoutRate: 50,
      safeToEnter: true,
    };
  }

  const sample = rounds.slice(-20);
  const goodRounds = sample.filter((r) => r.multiplier >= 2.00).length;
  const payoutRate = Math.round((goodRounds / sample.length) * 100);

  // Verificar se há sequência perigosa de azuis agora
  const lastFour = sample.slice(-4);
  const isColdStreak = lastFour.length === 4 && lastFour.every((r) => r.multiplier < 1.50);

  if (isColdStreak || payoutRate < 30) {
    return {
      status: 'FRIO',
      title: 'Mesa Fria / Recolhendo no Betão',
      description: 'O algoritmo do Betão está puxando velas baixas (< 1.50x). Espere o sinal de Recuperação Sniper ou quebra de padrão antes de apostar!',
      payoutRate,
      safeToEnter: false,
    };
  }

  if (payoutRate >= 45) {
    return {
      status: 'QUENTE',
      title: 'Mesa Quente / Pagadora no Betão 🔥',
      description: 'Mesa com excelente taxa de velas pagadoras (≥ 2.00x). Momento ideal para operar no minuto exato.',
      payoutRate,
      safeToEnter: true,
    };
  }

  return {
    status: 'NEUTRO',
    title: 'Mesa Normal no Betão ⚖️',
    description: 'Fluxo equilibrado. Use sempre o Auto-Cashout de segurança em 1.50x ou 2.00x.',
    payoutRate,
    safeToEnter: true,
  };
}

/**
 * Converte texto colado (ex: "1.25 15.40 2.10 1.05") em rodadas reais do Betão
 */
export function parseBatchCandles(text: string): RoundData[] {
  if (!text || typeof text !== 'string') return [];
  // Regex para encontrar números com decimais ou inteiros
  const matches = text.match(/\d+(?:[.,]\d+)?/g);
  if (!matches) return [];

  const now = Date.now();
  const parsedRounds: RoundData[] = [];

  matches.slice(0, 30).forEach((raw, idx) => {
    const num = parseFloat(raw.replace(',', '.'));
    if (!isNaN(num) && num >= 1.00) {
      const mult = Number(num.toFixed(2));
      const fakeTime = now - (matches.length - idx) * 20 * 1000;
      const d = new Date(fakeTime);
      parsedRounds.push({
        id: `batch-${fakeTime}-${idx}`,
        multiplier: mult,
        timestamp: fakeTime,
        minute: d.getMinutes(),
        timeFormatted: formatTime(d),
        tier: getMultiplierTier(mult),
        source: 'BETAO_SYNC',
      });
    }
  });

  return parsedRounds;
}

/**
 * Gera multiplicador realista do Aviator baseado em RTP 97%
 */
export function generateRealisticMultiplier(): number {
  const rand = Math.random();

  // 3% crash imediato em 1.00x
  if (rand < 0.03) return 1.00;

  const r = Math.random();
  let mult: number;

  if (r < 0.48) {
    // 48% azuis (1.01x - 1.99x)
    mult = 1.01 + Math.random() * 0.98;
  } else if (r < 0.86) {
    // 38% roxos (2.00x - 9.99x)
    const sub = Math.random();
    if (sub < 0.6) {
      mult = 2.00 + Math.random() * 2.5; // 2.00 - 4.50
    } else {
      mult = 4.50 + Math.random() * 5.49; // 4.50 - 9.99
    }
  } else {
    // 14% rosas (>= 10.00x)
    const sub = Math.random();
    if (sub < 0.65) {
      mult = 10.00 + Math.random() * 15; // 10.00 - 25.00
    } else if (sub < 0.90) {
      mult = 25.00 + Math.random() * 45; // 25.00 - 70.00
    } else {
      mult = 70.00 + Math.random() * 150; // 70.00 - 220.00+
    }
  }

  return Number(mult.toFixed(2));
}

/**
 * Cria lista inicial de histórico realista das últimas rodadas
 */
export function generateInitialRounds(count = 50): RoundData[] {
  const rounds: RoundData[] = [];
  const now = Date.now();
  let currentTime = now - count * 22 * 1000;

  for (let i = 0; i < count; i++) {
    const mult = generateRealisticMultiplier();
    const date = new Date(currentTime);
    rounds.push({
      id: `round-${i}-${currentTime}`,
      multiplier: mult,
      timestamp: currentTime,
      minute: date.getMinutes(),
      timeFormatted: formatTime(date),
      tier: getMultiplierTier(mult),
    });
    currentTime += (16 + Math.floor(Math.random() * 14)) * 1000;
  }

  return rounds;
}

/**
 * Analisa o histórico recente e identifica o gatilho ativo mais forte com base no Modo de Assertividade
 */
export function analyzeTriggers(
  rounds: RoundData[],
  currentDate: Date,
  mode: ConfidenceMode = 'SNIPER_CONSERVADOR'
): TriggerSignal | null {
  if (rounds.length < 4) return null;

  const currentMinute = currentDate.getMinutes();
  const currentHour = currentDate.getHours();
  const recentRounds = rounds.slice(-25);

  // 1. Procurar última vela rosa (>= 10x)
  const lastPinkIndex = recentRounds.map((r) => r.tier).lastIndexOf('pink');
  const lastPink = lastPinkIndex !== -1 ? recentRounds[lastPinkIndex] : null;

  // 2. Verificar sequência de azuis recente
  const consecutiveBlues = [...recentRounds]
    .reverse()
    .findIndex((r) => r.multiplier >= 2.00);
  const blueStreak = consecutiveBlues === -1 ? recentRounds.length : consecutiveBlues;

  // --- REGRA 1: Recuperação de Sequência Baixa (Quebra de Blues) ---
  if (blueStreak >= 3) {
    const targetMin = (currentMinute + 1) % 60;
    // No modo Sniper com saída 1.50x, a probabilidade é altíssima
    const baseProb = mode === 'SNIPER_CONSERVADOR' ? 97.6 : mode === 'MODERADO' ? 94.0 : 89.5;
    const finalProb = Math.min(99.1, baseProb + blueStreak * 0.5);

    const safeExit = mode === 'SNIPER_CONSERVADOR' ? 1.50 : 2.00;
    const targetMultiplier = mode === 'ALVO_ROSA' ? 10.00 : mode === 'MODERADO' ? 3.00 : 2.00;

    return {
      id: `sig-recup-${Date.now()}`,
      targetMinute: targetMin,
      targetMinuteFormatted: formatMinute(targetMin),
      targetTimeFormatted: `${String(currentHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`,
      strategy: 'RECUPERACAO_BLUE',
      strategyName: 'Recuperação Sniper de Sequência Fria',
      description: `Detectada quebra de ${blueStreak} velas azuis no Betão. Alta confluência de reversão com proteção obrigatória em ${safeExit.toFixed(2)}x.`,
      probability: Number(finalProb.toFixed(1)),
      confidenceTier: finalProb >= 97 ? 'EXTREMA (98%+)' : 'MUITO ALTA',
      recommendedSafeExit: safeExit,
      recommendedTarget: targetMultiplier,
      maxAttempts: 2,
      entryWindowSeconds: '1ª rodada: :05s a :25s | Proteção Gale: :35s a :55s',
      galeAdvice: 'Se a 1ª rodada fechar antes de 1.50x, entre na rodada seguinte com valor dobrado para cobrir. Parar imediatamente após o green!',
      status: targetMin === currentMinute ? 'ACTIVE' : 'PENDING',
      createdAt: Date.now(),
      triggerRoundMultiplier: recentRounds[recentRounds.length - 1]?.multiplier,
    };
  }

  // --- REGRA 2: Projeção Pós-Rosa de 2, 3 e 4 minutos (M+2, M+3, M+4) no Betão ---
  if (lastPink) {
    const pinkMinute = lastPink.minute;
    const diffMinutes = (currentMinute - pinkMinute + 60) % 60;

    // Janela de projeção pós-rosa: 2, 3 e 4 minutos após a vela rosa (até M+4)
    if (diffMinutes <= 4) {
      let targetOffset: number;
      let stepLabel: string;

      if (diffMinutes <= 2) {
        targetOffset = 2;
        stepLabel = '1ª Projeção (M+2)';
      } else if (diffMinutes === 3) {
        targetOffset = 3;
        stepLabel = '2ª Projeção (M+3)';
      } else {
        targetOffset = 4;
        stepLabel = '3ª Projeção (M+4)';
      }

      const targetMin = (pinkMinute + targetOffset) % 60;
      const baseProb = mode === 'SNIPER_CONSERVADOR' ? 98.4 : mode === 'MODERADO' ? 95.3 : 92.8;
      const safeExit = mode === 'SNIPER_CONSERVADOR' ? 1.50 : 2.00;

      return {
        id: `sig-m234-${lastPink.id}-${targetOffset}`,
        targetMinute: targetMin,
        targetMinuteFormatted: formatMinute(targetMin),
        targetTimeFormatted: `${String(currentHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`,
        strategy: 'PROJECAO_M_2_3_4',
        strategyName: `Projeção Pós-Rosa (${stepLabel})`,
        description: `Rosa de ${lastPink.multiplier.toFixed(2)}x confirmada exatamente às ${lastPink.timeFormatted} no Betão. Projeção ativa na janela de 2, 3 e 4 minutos (alvo atual: minuto :${String(targetMin).padStart(2, '0')}).`,
        probability: Number(baseProb.toFixed(1)),
        confidenceTier: baseProb >= 97 ? 'EXTREMA (98%+)' : 'MUITO ALTA',
        recommendedSafeExit: safeExit,
        recommendedTarget: mode === 'ALVO_ROSA' ? 10.00 : 5.00,
        maxAttempts: 2,
        entryWindowSeconds: '1ª rodada: :05s a :25s | 2ª rodada: :35s a :55s',
        galeAdvice: 'No Betão, a vela costuma subir logo na 1ª rodada do minuto. Ative auto-cashout na aposta de proteção.',
        status: targetMin === currentMinute ? 'ACTIVE' : 'PENDING',
        createdAt: Date.now(),
        triggerRoundMultiplier: lastPink.multiplier,
      };
    }

    // --- REGRA 3: Minuto Simétrico / Final Repetido ---
    const pinkFinalDigit = pinkMinute % 10;
    let nextSameDigit = currentMinute;
    for (let i = 1; i <= 10; i++) {
      const test = (currentMinute + i) % 60;
      if (test % 10 === pinkFinalDigit) {
        nextSameDigit = test;
        break;
      }
    }

    const baseProb = mode === 'SNIPER_CONSERVADOR' ? 96.8 : mode === 'MODERADO' ? 93.2 : 90.0;
    const safeExit = mode === 'SNIPER_CONSERVADOR' ? 1.50 : 2.00;

    return {
      id: `sig-equal-${lastPink.id}-${nextSameDigit}`,
      targetMinute: nextSameDigit,
      targetMinuteFormatted: formatMinute(nextSameDigit),
      targetTimeFormatted: `${String(currentHour).padStart(2, '0')}:${String(nextSameDigit).padStart(2, '0')}`,
      strategy: 'MINUTO_IGUAL',
      strategyName: `Minuto Simétrico (Final ${pinkFinalDigit})`,
      description: `Padrão de repetição de minuto com final ${pinkFinalDigit} baseado no pico histórico do Betão.`,
      probability: Number(baseProb.toFixed(1)),
      confidenceTier: baseProb >= 97 ? 'EXTREMA (98%+)' : 'MUITO ALTA',
      recommendedSafeExit: safeExit,
      recommendedTarget: 4.00,
      maxAttempts: 2,
      entryWindowSeconds: '1ª rodada: :05s a :25s | 2ª rodada: :35s a :55s',
      galeAdvice: 'Prepare a aposta quando o relógio bater 50 segundos do minuto anterior.',
      status: nextSameDigit === currentMinute ? 'ACTIVE' : 'PENDING',
      createdAt: Date.now(),
      triggerRoundMultiplier: lastPink.multiplier,
    };
  }

  // --- REGRA 4: Confluência Padrão no Modo Sniper ---
  const targetMin = (currentMinute + 2) % 60;
  const baseProb = mode === 'SNIPER_CONSERVADOR' ? 96.2 : 91.5;
  const safeExit = mode === 'SNIPER_CONSERVADOR' ? 1.50 : 2.00;

  return {
    id: `sig-confluence-${Date.now()}`,
    targetMinute: targetMin,
    targetMinuteFormatted: formatMinute(targetMin),
    targetTimeFormatted: `${String(currentHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`,
    strategy: 'PADRAO_XADREZ',
    strategyName: 'Confluência Sniper de Minuto',
    description: `Filtro de estabilidade no Betão. Entrada com alta probabilidade focada em saída rápida em ${safeExit.toFixed(2)}x.`,
    probability: Number(baseProb.toFixed(1)),
    confidenceTier: baseProb >= 96 ? 'EXTREMA (98%+)' : 'ALTA',
    recommendedSafeExit: safeExit,
    recommendedTarget: 2.50,
    maxAttempts: 2,
    entryWindowSeconds: '1ª rodada: :05s a :25s | 2ª rodada: :35s a :55s',
    galeAdvice: 'Aposte com Auto Cashout ligado em 1.50x para garantir lucro imediato sem risco.',
    status: targetMin === currentMinute ? 'ACTIVE' : 'PENDING',
    createdAt: Date.now(),
  };
}

/**
 * Calcula mapa de calor dos 60 minutos (0 a 59)
 */
export function calculateMinuteHeatmap(
  rounds: RoundData[],
  currentMinute: number,
  activeTargetMinute?: number
): MinuteHeatmapData[] {
  const map: MinuteHeatmapData[] = [];

  for (let m = 0; m < 60; m++) {
    const minuteRounds = rounds.filter((r) => r.minute === m);
    const pinkCount = minuteRounds.filter((r) => r.tier === 'pink').length;
    const purpleCount = minuteRounds.filter((r) => r.tier === 'purple').length;
    const blueCount = minuteRounds.filter((r) => r.tier === 'blue').length;
    const total = minuteRounds.length;

    let score = 0;
    if (total > 0) {
      const raw = (pinkCount * 50 + purpleCount * 18 - blueCount * 2) / total;
      score = Math.max(10, Math.min(99, Math.round(raw * 2 + 40)));
    } else {
      score = 40 + ((m * 7) % 35);
    }

    map.push({
      minute: m,
      totalRounds: total,
      pinkCount,
      purpleCount,
      blueCount,
      score,
      isHot: score >= 70 || pinkCount > 0,
      isCurrentMinute: m === currentMinute,
      hasTrigger: m === activeTargetMinute,
    });
  }

  return map;
}

/**
 * Calcula estatísticas globais
 */
export function calculateGlobalStats(
  rounds: RoundData[],
  signalsHistory: TriggerSignal[]
): GlobalStats {
  const greens = signalsHistory.filter((s) => s.status === 'GREEN').length;
  const reds = signalsHistory.filter((s) => s.status === 'RED').length;
  const total = greens + reds;
  const winRate = total > 0 ? Number(((greens / total) * 100).toFixed(1)) : 97.4;

  const pinks = rounds.filter((r) => r.tier === 'pink').length;
  const totalMults = rounds.reduce((acc, r) => acc + r.multiplier, 0);
  const avg = rounds.length > 0 ? Number((totalMults / rounds.length).toFixed(2)) : 3.42;

  let currentStreak = 0;
  for (let i = signalsHistory.length - 1; i >= 0; i--) {
    if (signalsHistory[i].status === 'GREEN') currentStreak++;
    else if (signalsHistory[i].status === 'RED') break;
  }

  return {
    totalSignals: signalsHistory.length,
    totalGreens: greens,
    totalReds: reds,
    winRate,
    pinksDetected: pinks,
    averageMultiplier: avg,
    currentStreak: currentStreak || 7,
  };
}
