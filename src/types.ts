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
  recommendedSafeExit: number; // ex: 1.50 ou 2.00
  recommendedTarget: number; // ex: 5.00 ou 10.00
  maxAttempts: number; // até 2 tentativas no minuto
  entryWindowSeconds: string; // ex: "1ª rodada: :05s a :25s | 2ª rodada: :35s a :55s"
  galeAdvice: string; // orientação de proteção no Betão
  status: SignalStatus;
  createdAt: number;
  resultMultiplier?: number;
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
