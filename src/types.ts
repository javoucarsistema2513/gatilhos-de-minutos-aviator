/**
 * Tipos e Interfaces para o Gatilhos de Minutos Aviator
 */

export type MultiplierTier = 'blue' | 'purple' | 'pink';

export type ConfidenceMode = 'SNIPER_CONSERVADOR' | 'MODERADO' | 'ALVO_ROSA';

export interface TableClimate {
  status: 'QUENTE' | 'NEUTRO' | 'FRIO';
  title: string;
  description: string;
  payoutRate: number; // % de velas >= 2x recentes
  safeToEnter: boolean;
}

export interface RoundData {
  id: string;
  multiplier: number;
  timestamp: number; // unix timestamp ms
  minute: number; // 0 - 59
  timeFormatted: string; // HH:mm:ss
  tier: MultiplierTier;
  source?: 'BETAO_LIVE' | 'BETAO_SYNC' | 'BETAO_AUTO';
}

export type TriggerStrategy = 
  | 'MINUTO_IGUAL'     // Repetição do mesmo minuto ou dígito final (ex: :14 -> :24, :34)
  | 'PROJECAO_M_2_3_4' // Gatilho pós-rosa 2, 3 e 4 minutos (M+2, M+3, M+4)
  | 'PROJECAO_M_2_3'   // Legado para compatibilidade
  | 'PROJECAO_M_5'     // Legado para compatibilidade
  | 'MINUTO_ESPELHO'   // Inversão de dígitos (ex: :12 -> :21)
  | 'RECUPERACAO_BLUE' // Quebra de sequência fria (4+ azuis)
  | 'PADRAO_XADREZ';   // Alternância consistente

export type SignalStatus = 'PENDING' | 'ACTIVE' | 'GREEN' | 'RED';

export type ExpectedCandleTier = 'purple' | 'pink';

export interface TriggerSignal {
  id: string;
  targetMinute: number; // minuto da entrada (ex: 47)
  targetMinuteFormatted: string; // ex: ":47"
  targetTimeFormatted: string; // ex: "19:47"
  strategy: TriggerStrategy;
  strategyName: string;
  description: string;
  probability: number; // porcentagem de assertividade ex: 98.4
  confidenceTier: 'ALTA' | 'MUITO ALTA' | 'EXTREMA (98%+)';
  recommendedSafeExit: number; // 2.00x para cima (mínimo de 2.00x)
  recommendedTarget: number; // ex: 3.50 para roxa ou 10.00 para rosa
  expectedTier: ExpectedCandleTier; // 'purple' = Vela Roxa (2.00x a 9.99x) | 'pink' = Vela Rosa (10.00x+)
  expectedTierLabel: string; // "Vela Roxa (2.00x - 9.99x)" ou "Vela Rosa (10.00x+)"
  maxAttempts: number; // até 2 tentativas no minuto
  entryWindowSeconds: string; // ex: "1ª rodada: :05s a :25s | 2ª rodada: :35s a :55s"
  galeAdvice: string; // orientação de proteção no Betão
  status: SignalStatus;
  createdAt: number;
  resultMultiplier?: number;
  resultTier?: 'blue' | 'purple' | 'pink';
  triggerRoundMultiplier?: number;
}

export interface MinuteHeatmapData {
  minute: number;
  totalRounds: number;
  pinkCount: number;
  purpleCount: number;
  blueCount: number;
  score: number; // 0 to 100
  isHot: boolean;
  isCurrentMinute: boolean;
  hasTrigger: boolean;
}

export interface GlobalStats {
  totalSignals: number;
  totalGreens: number;
  totalReds: number;
  winRate: number; // porcentagem de acertos
  pinksDetected: number;
  averageMultiplier: number;
  currentStreak: number;
}

export type HourlyAnalysisFilter = 'ALL' | 'PINK_ONLY' | 'PURPLE_ONLY';

export interface HourlyPayoutStats {
  hour: number; // 0 a 23
  hourLabel: string; // "00h", "01h", ..., "23h"
  timeRange: string; // "14:00 - 14:59"
  totalRounds: number;
  purpleCount: number;
  pinkCount: number;
  blueCount: number;
  payingCount: number; // purpleCount + pinkCount
  payingRate: number; // % velas >= 2.00x
  pinkRate: number; // % velas >= 10.00x
  purpleRate: number; // % velas 2.00x a 9.99x
  score: number; // 0 a 100
  intensity: 'PICO_MAXIMO' | 'ALTA' | 'MEDIA' | 'MODERADA';
  isCurrentHour: boolean;
  isTopHour: boolean;
  isTopPinkHour: boolean;
  goldenMinutes: number[]; // minutos mais pagadores desta hora
  avgMultiplier: number;
}

export interface PeriodSummary {
  key: 'MADRUGADA' | 'MANHA' | 'TARDE' | 'NOITE';
  label: string;
  hoursRange: string;
  payingRate: number;
  pinkRate: number;
  status: 'QUENTE' | 'ESTAVEL' | 'RECOLHENDO';
  description: string;
  bestHourInPeriod: string;
}

export interface HourlyPayoutMapResult {
  hours: HourlyPayoutStats[];
  topOverallHours: HourlyPayoutStats[];
  topPinkHours: HourlyPayoutStats[];
  topPurpleHours: HourlyPayoutStats[];
  currentHourData: HourlyPayoutStats;
  nextHotWindow: {
    timeRange: string;
    strategyNote: string;
    expectedPayoutRate: number;
  };
  periods: PeriodSummary[];
  overallGoldenMinutes: { minute: number; pinkCount: number; purpleCount: number; score: number }[];
}

