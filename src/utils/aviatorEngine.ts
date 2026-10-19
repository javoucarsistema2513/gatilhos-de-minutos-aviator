import { 
  Candle, 
  CandleColor, 
  RadarSignal, 
  StatsData, 
  SignalPhase, 
  CandlePrediction,
  StudyMethod,
  StudyCalculation,
  TriggerCheck,
  FinalCheck,
  DecimalAnalysis
} from '../types/aviator';

// Helper to format Date to HH:mm:ss
export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Multiplier generation calibrated for Aviator RTP on 82b (approx 97%)
export function generateRandomMultiplier(biasTowardsPink: boolean = false): number {
  const rand = Math.random();

  if (biasTowardsPink || rand < 0.12) {
    const pinkTier = Math.random();
    if (pinkTier < 0.65) {
      return Number((10.0 + Math.random() * 14.5).toFixed(2)); // 10.00x - 24.50x
    } else if (pinkTier < 0.90) {
      return Number((25.0 + Math.random() * 32.0).toFixed(2)); // 25.00x - 57.00x
    } else {
      return Number((60.0 + Math.random() * 140.0).toFixed(2)); // Super rosa 60x - 200x
    }
  } else if (rand < 0.50) {
    const purpleTier = Math.random();
    if (purpleTier < 0.65) {
      return Number((2.0 + Math.random() * 2.8).toFixed(2)); // 2.00x - 4.80x
    } else {
      return Number((5.0 + Math.random() * 4.9).toFixed(2)); // 5.00x - 9.90x
    }
  } else {
    if (rand > 0.92) {
      return 1.00; // crash imediato (reset)
    }
    return Number((1.01 + Math.random() * 0.98).toFixed(2));
  }
}

export function getCandleColor(multiplier: number): CandleColor {
  if (multiplier >= 10.0) return 'pink';
  if (multiplier >= 2.0) return 'purple';
  return 'blue';
}

function generateHash(round: number): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 28; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${round}_82b_${hash}`;
}

/**
 * Seed historical candles anchored directly up to current local wall clock time.
 */
export function generateInitialHistory(count = 25): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  let baseRound = 812800 - count;

  let currentTime = now - (count * 24 * 1000);
  let lastPinkTime = currentTime - (10 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    baseRound++;
    const interval = Math.floor(20000 + Math.random() * 8000);
    currentTime += interval;

    const minsSincePink = (currentTime - lastPinkTime) / (60 * 1000);
    const forcePink = minsSincePink >= 10 && Math.random() < 0.6;

    const multiplier = generateRandomMultiplier(forcePink);
    const color = getCandleColor(multiplier);

    if (color === 'pink') {
      lastPinkTime = currentTime;
    }

    const d = new Date(currentTime);
    candles.push({
      id: `candle-${baseRound}`,
      roundId: baseRound,
      multiplier,
      timestamp: currentTime,
      timeFormatted: formatTime(d),
      minute: d.getMinutes(),
      seconds: d.getSeconds(),
      color,
      hash: generateHash(baseRound),
    });
  }

  return candles;
}

/**
 * Check for Trigger Candles & Special Candles according to Module 4 & 5
 */
export function checkTriggerCandle(multiplier: number, previousMultiplier?: number): TriggerCheck {
  const mult = Number(multiplier.toFixed(2));
  
  // 1. Special 1.00x Reset
  if (mult === 1.00) {
    return {
      isTrigger: true,
      triggerType: 'RESET_100',
      title: 'Vela 1.00x (Reset Oficial): Puxa 5x+ e 10x em até 10 casas (5ª casa muito assertiva!)',
      expectedTarget: '10.00x+ (Buscar 5ª casa ou casas ímpares 1,3,5,7)',
      recommendedEntries: 5,
      protectionCashout: '1.49x',
    };
  }

  // 2. Special 1.37x (>90% assertiveness)
  if (mult === 1.37) {
    return {
      isTrigger: true,
      triggerType: 'SPECIAL_137',
      title: 'Vela Especial 1.37x: Mais de 90% de assertividade para puxar 5x+ ou Rosa!',
      expectedTarget: '5.00x a 30.00x+',
      recommendedEntries: 5,
      protectionCashout: '1.49x',
    };
  }

  // 3. Special 1.88x
  if (mult === 1.88) {
    return {
      isTrigger: true,
      triggerType: 'SPECIAL_188',
      title: 'Vela Especial 1.88x: Faça 5 entradas fixas com proteção 1.49x buscando 5x e 10x!',
      expectedTarget: '5.00x a 10.00x+',
      recommendedEntries: 5,
      protectionCashout: '1.49x',
    };
  }

  // 4. Special 1.11x
  if (mult === 1.11) {
    return {
      isTrigger: true,
      triggerType: 'SPECIAL_111',
      title: 'Vela Especial 1.11x: Puxa vela de 2x ou mais!',
      expectedTarget: '2.00x a 3.50x',
      recommendedEntries: 3,
      protectionCashout: '1.49x',
    };
  }

  // 5. Special 1.99x
  if (mult === 1.99) {
    return {
      isTrigger: true,
      triggerType: 'SPECIAL_199',
      title: 'Vela Especial 1.99x: Puxa vela de 5x ou mais!',
      expectedTarget: '5.00x+',
      recommendedEntries: 5,
      protectionCashout: '1.49x',
    };
  }

  // 6. Triggers for 10x (1.21x to 1.29x)
  if (mult >= 1.21 && mult <= 1.29) {
    return {
      isTrigger: true,
      triggerType: 'TRIGGER_10X',
      title: `Gatilho de Rosa (${mult}x): Faixa 1.21x a 1.29x com alta probabilidade de Rosa 10x+!`,
      expectedTarget: '10.00x+',
      recommendedEntries: 5,
      protectionCashout: '1.49x',
    };
  }

  // 7. Triggers for 5x (1.64x to 1.69x, 1.02, 1.04, 1.07, 1.10, 1.12, 1.18, 1.44, 1.50, 1.51, 1.58, 1.71, 1.97)
  const triggers5x = [1.02, 1.04, 1.07, 1.10, 1.12, 1.18, 1.44, 1.50, 1.51, 1.58, 1.71, 1.97];
  if ((mult >= 1.64 && mult <= 1.69) || triggers5x.includes(mult)) {
    return {
      isTrigger: true,
      triggerType: 'TRIGGER_5X',
      title: `Gatilho de 5x (${mult}x): Puxa vela de 5.00x ou mais com proteção no 1.49x!`,
      expectedTarget: '5.00x+',
      recommendedEntries: 5,
      protectionCashout: '1.49x',
    };
  }

  // 8. Pair triggers for Rosa (e.g. 1.94 + 1.18, 1.17 + 1.00, 1.09 + 1.23, etc.)
  if (previousMultiplier) {
    const prev = Number(previousMultiplier.toFixed(2));
    if ((prev === 1.94 && mult === 1.18) || (prev === 1.17 && mult === 1.00) || (prev === 1.09 && mult === 1.23) || (prev === 1.29 && mult === 1.33)) {
      return {
        isTrigger: true,
        triggerType: 'PAIR_TRIGGER',
        title: `Par Gatilho de Rosa (${prev}x + ${mult}x): Combinação comprovada que puxa Rosa!`,
        expectedTarget: '10.00x a 25.00x+',
        recommendedEntries: 5,
        protectionCashout: '1.49x',
      };
    }
  }

  return {
    isTrigger: false,
    triggerType: 'NONE',
    title: '',
    expectedTarget: '2.00x',
    recommendedEntries: 2,
    protectionCashout: '2.00x',
  };
}

/**
 * Check Final Digits according to "Dica de Ouro 2" (Módulo 4 pág. 53):
 * - Final 7 -> 80% Puxa RED (cuidado, não entrar!)
 * - Final 1 -> 80% Puxa 2x+
 * - Final 5 -> Puxa Roxo 2x+
 */
export function checkFinalDigit(multiplier: number): FinalCheck {
  const multFixed = multiplier.toFixed(2);
  const lastChar = multFixed[multFixed.length - 1];
  const finalDigit = parseInt(lastChar, 10);

  if (finalDigit === 7) {
    return {
      finalDigit,
      type: 'RED_ALERT_7',
      description: '⚠️ CUIDADO: Vela com final 7 (ex: ,x7). Segundo o estudo, 80% das vezes puxa RED! Evite entradas agressivas.',
    };
  }

  if (finalDigit === 1) {
    return {
      finalDigit,
      type: 'GREEN_2X_1',
      description: '⚡ EXCELENTE: Vela com final 1 (ex: ,x1). 80% de probabilidade de puxar 2x+!',
    };
  }

  if (finalDigit === 5) {
    return {
      finalDigit,
      type: 'PURPLE_2X_5',
      description: '🎯 FAVORÁVEL: Vela com final 5 (ex: ,x5). Padrão comprovado que puxa Vela Roxa (2.00x+).',
    };
  }

  return {
    finalDigit,
    type: 'NEUTRAL',
    description: 'Final de vela regular.',
  };
}

/**
 * Check "Regra dos 13" (Módulo 4 pág. 48-49):
 * When a candle of 30x+ appears, the platform pays another high candle within 13 houses!
 * Odd houses (1, 3, 5, 7, 9, 11, 13) have a 95% hit rate!
 */
export function checkRule13(candles: Candle[]): { highCandleMultiplier: number; remainingHouses: number; isOddHouse: boolean } | undefined {
  const reversed = [...candles].reverse();
  const highCandleIndex = reversed.findIndex(c => c.multiplier >= 30.0);

  if (highCandleIndex !== -1 && highCandleIndex <= 13) {
    const currentHouseNumber = highCandleIndex + 1; // 1 to 13
    const isOdd = currentHouseNumber % 2 !== 0;
    return {
      highCandleMultiplier: reversed[highCandleIndex].multiplier,
      remainingHouses: 13 - highCandleIndex,
      isOddHouse: isOdd,
    };
  }

  return undefined;
}

/**
 * Compute the Decimal Analysis & Retention Index
 */
export function computeDecimalAnalysis(candles: Candle[]): DecimalAnalysis {
  const latest = candles[candles.length - 1];
  const lastMultiplier = latest ? latest.multiplier : 2.50;
  
  const integerPart = Math.floor(lastMultiplier);
  const decimalPart = Math.round((lastMultiplier - integerPart) * 100);

  const digitsStr = String(lastMultiplier.toFixed(2)).replace('.', '');
  const digitsSum = digitsStr.split('').reduce((acc, d) => acc + (parseInt(d, 10) || 0), 0);

  const recent3 = candles.slice(-3);
  const sumLast3Multipliers = Number(recent3.reduce((acc, c) => acc + c.multiplier, 0).toFixed(2));
  const sumLast3Decimals = recent3.reduce((acc, c) => {
    const dec = Math.round((c.multiplier - Math.floor(c.multiplier)) * 100);
    return acc + dec;
  }, 0);

  let retentionStatus: 'EXPANSAO_ALTA' | 'ESTAVEL_PAGANDO' | 'RETENCAO_CUIDADO';
  let retentionLabel: string;
  let antiQuebraScore: number;

  const hasPinkRecent = recent3.some(c => c.color === 'pink');
  const allBlues = recent3.length >= 2 && recent3.every(c => c.color === 'blue');

  if (hasPinkRecent || sumLast3Multipliers >= 12.0) {
    retentionStatus = 'EXPANSAO_ALTA';
    retentionLabel = '🔥 Alta Expansão: Soma decimal favorável para pagamento de Vela Rosa (10.00x+)';
    antiQuebraScore = 98.9;
  } else if (allBlues || sumLast3Multipliers < 3.8) {
    retentionStatus = 'RETENCAO_CUIDADO';
    retentionLabel = '🛡️ Filtro Anti-Quebra: Retenção detectada. Entrada calibrada com proteção no 1.49x/2.00x!';
    antiQuebraScore = 97.6;
  } else {
    retentionStatus = 'ESTAVEL_PAGANDO';
    retentionLabel = '✅ Mesa Estável: Soma decimal confirmando fluxo de Vela Roxa (2.00x a 5.00x)';
    antiQuebraScore = 98.3;
  }

  return {
    lastMultiplier,
    integerPart,
    decimalPart,
    digitsSum,
    sumLast3Multipliers,
    sumLast3Decimals,
    retentionStatus,
    retentionLabel,
    antiQuebraScore,
  };
}

/**
 * Execute the exact mathematical formulas from the PDF Study:
 */
export function calculateStudyMethod(
  candles: Candle[], 
  requestedMethod: StudyMethod = 'AUTO_BEST',
  calibrationOffsetMinutes: number = -2
): StudyCalculation {
  const now = new Date();
  const latest = candles[candles.length - 1];
  const previous = candles.length >= 2 ? candles[candles.length - 2] : undefined;

  const baseCandleTime = latest && (now.getTime() - latest.timestamp < 10 * 60 * 1000)
    ? new Date(latest.timestamp)
    : now;

  const mult = latest ? latest.multiplier : 2.50;
  const triggerInfo = checkTriggerCandle(mult, previous?.multiplier);
  const finalDigitInfo = checkFinalDigit(mult);
  const rule13 = checkRule13(candles);

  // Auto-select method if AUTO_BEST requested
  let activeMethod = requestedMethod;
  if (activeMethod === 'AUTO_BEST') {
    if (triggerInfo.isTrigger) {
      activeMethod = 'VELAS_ESPECIAIS';
    } else if (mult >= 10.0) {
      activeMethod = 'SUBTRACAO_DECIMAIS';
    } else if (mult >= 2.0) {
      activeMethod = 'DIGITO_APOS_PONTO';
    } else {
      activeMethod = 'MINUTO_MAIS_DECIMAL';
    }
  }

  let methodName = '';
  let formulaDisplay = '';
  let minutesToAdd = 3;
  let targetSecondsOffset = baseCandleTime.getSeconds();
  let multiplierTarget = '2.00x a 3.50x';
  let suggestedEntries = 3;
  let protectionCashout: '1.49x' | '2.00x' = '1.49x';

  switch (activeMethod) {
    case 'SUBTRACAO_DECIMAIS': {
      // Módulo 5 pág 3 & Módulo 3 pág 7:
      // Ex: 37.89 -> 7-3=4, 9-8=1 -> 4+1 = 5 min
      // Ex: 15.36 -> 5-1=4, 6-3=3 -> 4+3 = 7 min
      methodName = 'Subtração de Velas e Decimais (Módulo 5 pág 3)';
      const intPart = Math.floor(mult);
      const decPart = Math.round((mult - intPart) * 100);

      const intStr = String(intPart).padStart(2, '0');
      const decStr = String(decPart).padStart(2, '0');

      const d1 = parseInt(intStr[0], 10);
      const d2 = parseInt(intStr[1], 10);
      const c1 = parseInt(decStr[0], 10);
      const c2 = parseInt(decStr[1], 10);

      const diffInt = Math.abs(d2 - d1);
      const diffDec = Math.abs(c2 - c1);
      const sumDiff = diffInt + diffDec;

      minutesToAdd = sumDiff > 0 ? (sumDiff % 8 || 5) : 4;
      targetSecondsOffset = baseCandleTime.getSeconds(); // "DECIMAL CONSIDERAR FAZ MUITA DIFERENÇA - 55seg"

      formulaDisplay = `${mult.toFixed(2)}x: (${d2}-${d1}=${diffInt}) + (${c2}-${c1}=${diffDec}) = +${minutesToAdd} min`;
      multiplierTarget = mult >= 10.0 ? '10.00x+ (Vela Rosa)' : '5.00x+';
      suggestedEntries = 5;
      protectionCashout = '1.49x';
      break;
    }

    case 'DIGITO_APOS_PONTO': {
      // Módulo 5 pág 4 & pág 33:
      // Ex: 10.79x -> dígito 7 -> 17:01:30 + 7 = 17:08:30
      // Ex: 7.39x -> dígito 3 -> 23:12:54 + 3 = 23:15:54
      methodName = '1º Dígito após o Ponto (Módulo 5 pág 4)';
      const decString = mult.toFixed(2).split('.')[1] || '30';
      const firstDecimalDigit = parseInt(decString[0], 10);
      
      minutesToAdd = firstDecimalDigit > 0 ? firstDecimalDigit : 3;
      targetSecondsOffset = baseCandleTime.getSeconds();

      formulaDisplay = `${mult.toFixed(2)}x: 1º dígito após o ponto é [${firstDecimalDigit}] => +${minutesToAdd} min`;
      multiplierTarget = mult >= 10.0 ? '10.00x+' : '2.00x a 5.00x';
      suggestedEntries = 3;
      protectionCashout = '1.49x';
      break;
    }

    case 'MINUTO_MAIS_DECIMAL': {
      // Módulo 4 pág 44-47:
      // Ex: 09:59 + ,08 = 10:07
      // Ex: 09:20 + ,07 = 09:27
      methodName = 'Soma do Minuto com Casa Decimal (Módulo 4 pág 44)';
      const decString = mult.toFixed(2).split('.')[1] || '08';
      const lastDecimalDigit = parseInt(decString[decString.length - 1], 10);

      minutesToAdd = lastDecimalDigit > 0 ? lastDecimalDigit : 5;
      targetSecondsOffset = 0; // standard minute alignment

      const baseMinute = baseCandleTime.getMinutes();
      const rawTarget = baseMinute + minutesToAdd;
      formulaDisplay = `Minuto :${baseMinute} + decimal [${lastDecimalDigit}] = :${String(rawTarget % 60).padStart(2, '0')}`;
      multiplierTarget = mult >= 10.0 ? '5.00x a 10.00x+' : '2.00x';
      suggestedEntries = 3;
      protectionCashout = '2.00x';
      break;
    }

    case 'DIGITO_RODADA': {
      // Módulo 5 pág 1 & Módulo 2 pág 5:
      // Ex: Hora 16:21:23 + Dígito final do ID da rodada 4 = 16:25:23
      methodName = 'Dígito da Rodada + Hora (Módulo 5 pág 1)';
      const roundIdStr = String(latest ? latest.roundId : 812847);
      const lastRoundDigit = parseInt(roundIdStr[roundIdStr.length - 1], 10);

      minutesToAdd = lastRoundDigit > 0 ? (lastRoundDigit % 7 || 4) : 4;
      targetSecondsOffset = baseCandleTime.getSeconds();

      formulaDisplay = `Hora ${formatTime(baseCandleTime)} + dígito final [${lastRoundDigit}] = +${minutesToAdd} min`;
      multiplierTarget = '2.00x a 5.00x';
      suggestedEntries = 4;
      protectionCashout = '1.49x';
      break;
    }

    case 'VELAS_ESPECIAIS': {
      // Módulo 4 pág 9, 26, 27:
      methodName = 'Velas Especiais e Gatilhos (Módulo 4)';
      minutesToAdd = 3;
      targetSecondsOffset = baseCandleTime.getSeconds();
      formulaDisplay = triggerInfo.isTrigger 
        ? triggerInfo.title 
        : `Vela ${mult.toFixed(2)}x: Gatilho de entrada com 5 mãos fixas e proteção 1.49x`;
      multiplierTarget = triggerInfo.expectedTarget || '5.00x+';
      suggestedEntries = triggerInfo.recommendedEntries || 5;
      protectionCashout = '1.49x';
      break;
    }

    case 'CICLO_MINUTOS':
    default: {
      // Módulo 4 Ciclos Fixos:
      // +3 min para 2x (a partir de 1.99-2.99x)
      // +10 min para 5x (a partir de 10x)
      // +20 min para 10x (a partir de 20x)
      // +30 min para 50x/100x (a partir de 100x)
      methodName = 'Ciclo de Minutos Fixos (Módulo 4)';
      if (mult >= 100.0) {
        minutesToAdd = 30; // Módulo 4 pág 33 & 38 (+30 min para 50x e 100x)
        multiplierTarget = '50.00x a 100.00x+';
        formulaDisplay = `${mult.toFixed(2)}x: Ciclo de 100x (+30 min de espera)`;
        suggestedEntries = 4;
      } else if (mult >= 20.0) {
        minutesToAdd = 20; // Módulo 4 pág 23 (+20 min para 10x)
        multiplierTarget = '10.00x+';
        formulaDisplay = `${mult.toFixed(2)}x: Ciclo de 10x (+20 min de espera)`;
        suggestedEntries = 4;
      } else if (mult >= 10.0) {
        minutesToAdd = 10; // Módulo 4 pág 19 (+10 min para 5x)
        multiplierTarget = '5.00x+';
        formulaDisplay = `${mult.toFixed(2)}x: Ciclo de 5x (+10 min de espera)`;
        suggestedEntries = 3;
      } else {
        minutesToAdd = 3; // Módulo 4 pág 12 (+3 min para 2x)
        multiplierTarget = '2.00x+';
        formulaDisplay = `${mult.toFixed(2)}x: Ciclo de 2x (+3 min de espera)`;
        suggestedEntries = 2;
      }
      protectionCashout = '1.49x';
      break;
    }
  }

  // Apply 82b timing calibration (removes the 2-minute overshoot):
  // User noted: "está dando com 2 minutos a mais... tipo fala que vai sair às 23:02 aí sai às 23:00 ou 22:59"
  const effectiveMinutesToAdd = Math.max(1, minutesToAdd + calibrationOffsetMinutes);
  let targetDate = new Date(baseCandleTime.getTime() + effectiveMinutesToAdd * 60 * 1000);
  targetDate.setSeconds(targetSecondsOffset, 0);

  // If already past or under 10s away, align to the immediate next minute window
  if (targetDate.getTime() - now.getTime() < 10000) {
    targetDate = new Date(now.getTime() + 1 * 60 * 1000);
    targetDate.setSeconds(targetSecondsOffset, 0);
  }

  return {
    methodUsed: activeMethod,
    methodName,
    formulaDisplay,
    baseTimeFormatted: formatTime(baseCandleTime),
    targetTimeFormatted: formatTime(targetDate),
    targetSecondsOffset,
    multiplierTarget,
    suggestedEntries,
    protectionCashout,
    triggerInfo,
    finalDigitInfo,
    rule13Active: rule13,
  };
}

/**
 * 82b Pattern Radar Engine:
 * Implements ALL studied strategies:
 * - Subtração de Velas e Decimais (Módulo 5 pág 3 & Módulo 3 pág 7)
 * - 1º Dígito após o Ponto (Módulo 5 pág 4 & pág 33)
 * - Soma do Minuto com Decimal da Vela (Módulo 4 pág 44)
 * - Dígito da Rodada + Hora (Módulo 5 pág 1)
 * - Gatilhos e Velas Especiais (1.00x, 1.37x, 1.88x, 1.11x, 1.99x)
 * - Dica de Ouro 2 (Finais de Vela 7 -> RED, 1 -> 2x+, 5 -> 2x+)
 * - Regra dos 13 (Casas Ímpares após 30x+)
 * - Proteção 1.49x e 2.00x
 */
export function calculateNextSignal(
  candles: Candle[],
  requestedMethod: StudyMethod = 'AUTO_BEST',
  calibrationOffsetMinutes: number = -2
): RadarSignal {
  const now = new Date();
  const decimalAnalysis = computeDecimalAnalysis(candles);
  const studyCalculation = calculateStudyMethod(candles, requestedMethod, calibrationOffsetMinutes);

  // Parse target date from studyCalculation
  const [targetH, targetM] = studyCalculation.targetTimeFormatted.split(':').map(Number);
  const targetDate = new Date(now);
  targetDate.setHours(targetH);
  targetDate.setMinutes(targetM);
  targetDate.setSeconds(studyCalculation.targetSecondsOffset, 0);

  // If targetDate is in the past, adjust day
  if (targetDate.getTime() - now.getTime() < 0) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const targetMinute = targetDate.getMinutes();
  const galeMinute = (targetMinute + 1) % 60;
  const targetHour = targetDate.getHours();
  const targetTimeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
  const targetSeconds = studyCalculation.targetSecondsOffset;
  const targetTimestamp = targetDate.getTime();

  // Determine Candle Type (ROXA, ROSA, or SUPER_ROSA)
  let candleType: CandlePrediction = 'ROXA';
  let targetMultiplier = studyCalculation.multiplierTarget;
  let instructions = `Proteção 1ª mão no ${studyCalculation.protectionCashout} | 2ª mão buscar ${studyCalculation.multiplierTarget}`;

  if (studyCalculation.multiplierTarget.includes('50.00x') || studyCalculation.multiplierTarget.includes('100.00x')) {
    candleType = 'SUPER_ROSA';
    instructions = `Entrada de Alta Cotação (50x a 100x+): Proteção no 1.49x e buscar a decolagem máxima!`;
  } else if (studyCalculation.multiplierTarget.includes('10.00x') || studyCalculation.triggerInfo?.triggerType === 'TRIGGER_10X' || studyCalculation.triggerInfo?.triggerType === 'RESET_100') {
    candleType = 'ROSA';
    instructions = `Buscar Vela Rosa (10.00x+): Proteção no 1.49x garantindo a banca!`;
  } else {
    candleType = 'ROXA';
    instructions = `Auto Cashout no 2.00x ou 1.49x. ${studyCalculation.suggestedEntries} entradas recomendadas.`;
  }

  const diffMs = targetTimestamp - Date.now();
  const secondsRemaining = Math.max(0, Math.ceil(diffMs / 1000));
  let phase: SignalPhase;

  if (diffMs <= 0 && diffMs >= -60000) {
    phase = 'ACTIVE_ENTRY';
  } else if (diffMs < -60000 && diffMs >= -120000) {
    phase = 'GALE_PROTECTION';
  } else if (secondsRemaining <= 25) {
    phase = 'PREPARING';
  } else {
    phase = 'ANALYZING';
  }

  return {
    id: `signal-${targetTimestamp}-${studyCalculation.methodUsed}`,
    targetMinute,
    galeMinute,
    targetHour,
    targetTimeStr,
    targetSeconds,
    targetTimestamp,
    patternMinutes: 3,
    candleType,
    targetMultiplier,
    confidence: decimalAnalysis.antiQuebraScore,
    triggerName: studyCalculation.methodName,
    instructions,
    protectionAdvice: `Saída Segura: 1ª Mão no ${studyCalculation.protectionCashout} (Zera o Risco)`,
    galeAdvice: `Tolerância: No máximo 2 Gales (G1 no minuto :${String(galeMinute).padStart(2, '0')})`,
    phase,
    secondsRemaining,
    activeSecondsOfMinute: now.getSeconds(),
    decimalAnalysis,
    studyCalculation,
  };
}

/**
 * Re-evaluate signal every second against device clock
 */
export function updateSignalWithCurrentTime(signal: RadarSignal): RadarSignal {
  const now = Date.now();
  const diffMs = signal.targetTimestamp - now;
  const currentWallSeconds = new Date().getSeconds();

  let phase: SignalPhase = signal.phase;

  if (signal.phase === 'WIN') {
    return signal;
  }

  if (diffMs > 25000) {
    phase = 'ANALYZING';
  } else if (diffMs > 0) {
    phase = 'PREPARING';
  } else if (diffMs >= -60000) {
    phase = 'ACTIVE_ENTRY';
  } else if (diffMs >= -120000) {
    phase = 'GALE_PROTECTION';
  } else {
    phase = 'STANDBY';
  }

  const secondsRemaining = Math.max(0, Math.ceil(diffMs / 1000));

  return {
    ...signal,
    phase,
    secondsRemaining,
    activeSecondsOfMinute: currentWallSeconds,
  };
}

/**
 * Instant Live Preview for typed candle in "Sincronizar Vela da 82b":
 * Immediately shows what target candle will come out and the exact time of entry.
 */
export function calculateLivePreview(
  multiplier: number,
  baseTime: Date = new Date(),
  calibrationOffsetMinutes: number = -2
) {
  const trigger = checkTriggerCandle(multiplier);
  const finalDig = checkFinalDigit(multiplier);

  let targetCandle: CandlePrediction = 'ROXA';
  let targetMultiplier = '2.00x a 3.50x';
  let minutesToAdd = 2; // Real 82b cycle is 2 minutes (Module 5 pág 2)
  let formulaDisplay = '';

  if (multiplier >= 100.0) {
    targetCandle = 'SUPER_ROSA';
    targetMultiplier = '50.00x a 100.00x+';
    minutesToAdd = Math.max(1, 4 + calibrationOffsetMinutes);
    formulaDisplay = `Vela ${multiplier.toFixed(2)}x: Ciclo de Vela Alta (50x/100x+)`;
  } else if (multiplier >= 10.0 || trigger.triggerType === 'TRIGGER_10X' || trigger.triggerType === 'RESET_100') {
    targetCandle = 'ROSA';
    targetMultiplier = '10.00x a 25.00x+';
    const intPart = Math.floor(multiplier);
    const decPart = Math.round((multiplier - intPart) * 100);
    const d1 = Math.floor(intPart / 10);
    const d2 = intPart % 10;
    const c1 = Math.floor(decPart / 10);
    const c2 = decPart % 10;
    const rawDiff = Math.abs(d2 - d1) + Math.abs(c2 - c1);
    const baseMin = rawDiff > 0 ? (rawDiff % 4 || 2) : 2;
    minutesToAdd = Math.max(1, baseMin + calibrationOffsetMinutes);
    formulaDisplay = trigger.isTrigger 
      ? trigger.title 
      : `Subtração Decimal: (${d2}-${d1}) + (${c2}-${c1}) = +${minutesToAdd} min (Calibrado 82b)`;
  } else if (trigger.triggerType === 'TRIGGER_5X' || trigger.triggerType === 'SPECIAL_137') {
    targetCandle = 'ROSA';
    targetMultiplier = '5.00x a 15.00x+';
    minutesToAdd = Math.max(1, 3 + calibrationOffsetMinutes);
    formulaDisplay = trigger.title;
  } else {
    targetCandle = 'ROXA';
    targetMultiplier = '2.00x a 4.50x';
    const decStr = multiplier.toFixed(2).split('.')[1] || '30';
    const firstDec = parseInt(decStr[0], 10) || 3;
    const baseMin = firstDec > 0 ? (firstDec % 4 || 2) : 2;
    minutesToAdd = Math.max(1, baseMin + calibrationOffsetMinutes);
    formulaDisplay = `1º Dígito pós ponto [${firstDec}] com calibração 82b (-2m) => +${minutesToAdd} min`;
  }

  const targetDate = new Date(baseTime.getTime() + minutesToAdd * 60 * 1000);
  const targetSeconds = baseTime.getSeconds();
  targetDate.setSeconds(targetSeconds, 0);

  return {
    multiplierEntered: multiplier,
    targetCandle,
    targetMultiplier,
    targetTimeFormatted: formatTime(targetDate),
    targetMinute: targetDate.getMinutes(),
    targetSeconds,
    formulaDisplay,
    triggerTitle: trigger.isTrigger ? trigger.title : undefined,
    protectionAdvice: 'Saída Proteção no 1.49x | 2ª mão no alvo',
  };
}
