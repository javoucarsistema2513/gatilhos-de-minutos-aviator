export type CandleColor = 'blue' | 'purple' | 'pink';

export interface Candle {
  id: string;
  roundId: number;
  multiplier: number;
  timestamp: number; // millisecond timestamp
  timeFormatted: string; // HH:mm:ss
  minute: number; // 0-59
  seconds: number; // 0-59
  color: CandleColor;
  hash: string;
}

export type SignalPhase = 'ANALYZING' | 'PREPARING' | 'ACTIVE_ENTRY' | 'GALE_PROTECTION' | 'WIN' | 'STANDBY';

export type CandlePrediction = 'ROXA' | 'ROSA' | 'SUPER_ROSA';

export type StudyMethod = 
  | 'AUTO_BEST'
  | 'SUBTRACAO_DECIMAIS'   // Módulo 5 pág 3 & Módulo 3 pág 7 (ex: 37.89 -> 7-3=4, 9-8=1 -> 4+1=5min)
  | 'DIGITO_APOS_PONTO'    // Módulo 5 pág 4 & pág 33 (ex: 10.79x -> +7min, 7.39x -> +3min)
  | 'MINUTO_MAIS_DECIMAL'  // Módulo 4 pág 44-47 (ex: 09:59 + ,08 = 10:07)
  | 'DIGITO_RODADA'        // Módulo 5 pág 1 & Módulo 2 pág 5 (Hora + dígito final do ID)
  | 'VELAS_ESPECIAIS'      // Módulo 4 pág 9, 26, 27 (1.00x, 1.37x, 1.11x, 1.88x, 1.99x)
  | 'CICLO_MINUTOS';       // +3m (2x), +10m (5x), +20m (10x), +30m (50x/100x)

export interface TriggerCheck {
  isTrigger: boolean;
  triggerType: 'SPECIAL_100' | 'SPECIAL_137' | 'SPECIAL_188' | 'SPECIAL_111' | 'SPECIAL_199' | 'TRIGGER_5X' | 'TRIGGER_10X' | 'RESET_100' | 'PAIR_TRIGGER' | 'NONE';
  title: string;
  expectedTarget: string; // "5x ou mais", "10x ou mais", "2x"
  recommendedEntries: number; // usually 5 entries
  protectionCashout: string; // "1.49x" or "2.00x"
}

export interface FinalCheck {
  finalDigit: number; // last digit of multiplier, e.g. 7 in 2.37
  type: 'RED_ALERT_7' | 'GREEN_2X_1' | 'PURPLE_2X_5' | 'NEUTRAL';
  description: string;
}

export interface StudyCalculation {
  methodUsed: StudyMethod;
  methodName: string;
  formulaDisplay: string; // e.g. "37,89x: (7-3=4) + (9-8=1) = +5 min => 17:07:55"
  baseTimeFormatted: string; // HH:mm:ss
  targetTimeFormatted: string; // HH:mm:ss
  targetSecondsOffset: number; // exact second: 00 to 59
  multiplierTarget: string; // "2.00x a 3.50x", "5.00x+", "10.00x+"
  suggestedEntries: number; // 2 to 5 entries
  protectionCashout: '1.49x' | '2.00x';
  triggerInfo?: TriggerCheck;
  finalDigitInfo?: FinalCheck;
  rule13Active?: {
    highCandleMultiplier: number;
    remainingHouses: number;
    isOddHouse: boolean;
  };
}

export interface DecimalAnalysis {
  lastMultiplier: number;
  integerPart: number;
  decimalPart: number;
  digitsSum: number; // sum of digits, e.g. 2.45 -> 2 + 4 + 5 = 11
  sumLast3Multipliers: number; // e.g. 1.34 + 2.18 + 4.82 = 8.34
  sumLast3Decimals: number; // e.g. 34 + 18 + 82 = 134
  retentionStatus: 'EXPANSAO_ALTA' | 'ESTAVEL_PAGANDO' | 'RETENCAO_CUIDADO';
  retentionLabel: string;
  antiQuebraScore: number;
}

export interface RadarSignal {
  id: string;
  targetMinute: number; // minute 0-59
  galeMinute: number; // targetMinute + 1
  targetHour: number; // hour 0-23
  targetTimeStr: string; // e.g. "17:37"
  targetSeconds: number; // exact calculated second of entry (0-59)
  targetTimestamp: number; // Exact millisecond when the window starts
  patternMinutes?: number;
  candleType: CandlePrediction; // ROXA, ROSA or SUPER_ROSA
  targetMultiplier: string;
  confidence: number;
  triggerName: string;
  instructions: string;
  protectionAdvice: string;
  galeAdvice: string;
  phase: SignalPhase;
  secondsRemaining: number;
  activeSecondsOfMinute: number;
  decimalAnalysis: DecimalAnalysis;
  studyCalculation: StudyCalculation;
  resultCandle?: Candle;
}

export interface StatsData {
  total: number;
  blues: number;
  purples: number;
  pinks: number;
  bluePct: number;
  purplePct: number;
  pinkPct: number;
  highestMultiplier: number;
  lastPinkMinutesAgo: number;
  lastPinkMultiplier: number;
  lastPinkTime: string;
  averagePinkIntervalMinutes: number;
}

export interface LiveCandlePreview {
  multiplierEntered: number;
  targetCandle: CandlePrediction;
  targetMultiplier: string;
  targetTimeFormatted: string; // HH:mm:ss
  targetMinute: number;
  targetSeconds: number;
  formulaDisplay: string;
  triggerTitle?: string;
  protectionAdvice: string;
}

export interface CandleRoundDetail {
  roundNumber?: string;
  multiplier: number;
  fullText: string;
  integerPart: number;
  decimalPart: number;
  finalDigit: number;
  finalDigitAnalysis: string;
  parity?: 'PAR' | 'ÍMPAR';
  color: 'AZUL' | 'ROXA' | 'ROSA';
}

export interface DecimalFormulaAnalysis {
  sourceCandle: number;
  integerPart: number;
  decimalPart: number;
  subtractionMath: string;
  projectedMinute: string;
  explanation: string;
}

export interface RoundVerificationData {
  latestRoundId?: string;
  totalRoundsDetected: number;
  roundParity?: 'PAR' | 'ÍMPAR' | 'MISTO';
  imparAdvantageRule: string;
  decimalsValidated: boolean;
  auditVerdict: string;
}

export interface AIChartAnalysis {
  extractedCandles: number[];
  tableState: string;
  dominantPattern: string;
  targetCandle: 'ROXA' | 'ROSA' | 'SUPER_ROSA';
  targetMultiplier: string;
  projectedTime: string;
  confidence: number;
  keyFindings: string[];
  entryStrategy: string;
  protectionAdvice: string;
  warningAlert?: string;
  roundDetails?: CandleRoundDetail[];
  decimalFormula?: DecimalFormulaAnalysis;
  roundVerification?: RoundVerificationData;
}

export type ForecastHorizon = '7H' | '12H' | '24H' | 'ALL';
export type FuturePinkCategory = 'SUPER_ROSA_100X' | 'ULTRA_ROSA_500X' | 'ROSA_ESPECIAL';

export interface FuturePinkSignal {
  id: string;
  targetTimestamp: number;
  targetTimeFormatted: string; // HH:mm:ss
  targetHour: number;
  targetMinute: number;
  targetSeconds: number;
  horizon: '7H' | '12H' | '24H';
  category: FuturePinkCategory;
  categoryLabel: string;
  targetMultiplierLabel: string;
  minMultiplier: number;
  maxMultiplier?: number;
  confidence: number;
  patternRule: string;
  patternDetails: string;
  recommendedEntryMinute: string;
  protectionStrategy: string;
  alarmActive: boolean;
  status: 'AGUARDANDO' | 'JANELA_PROXIMA' | 'EM_ANDAMENTO' | 'FINALIZADO';
  timeRemainingStr?: string;
  minutesRemaining: number;
}

export interface FutureForecastSummary {
  totalPredicted: number;
  superRosas100x: number;
  ultraRosas500x: number;
  rosasEspeciais: number;
  nextUpcoming?: FuturePinkSignal;
  highProbabilityHours: string[];
}

export interface AIForecastAudit {
  goldenHours: {
    timeRange: string;
    expectedTarget: string;
    assertividade: number;
    motivo: string;
  }[];
  generalAdvice: string;
  riskWarning: string;
}
