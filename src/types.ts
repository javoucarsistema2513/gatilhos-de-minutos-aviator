/**
 * Types and interfaces for Aviator Candle Radar & PWA Notification System
 */

export type CandleColor = 'blue' | 'purple' | 'pink';

export interface AviatorCandle {
  id: string;
  multiplier: number;
  timestamp: number;
  color: CandleColor;
  roundNumber: number;
  payingMinute: number; // 0 - 59
}

export interface CandleStatistics {
  total: number;
  blueCount: number;
  purpleCount: number;
  pinkCount: number;
  bluePct: number;
  purplePct: number;
  pinkPct: number;
  currentStreakColor: CandleColor;
  currentStreakCount: number;
  roundsSinceLastPink: number;
  roundsSinceLastPurple: number;
  avgPinkInterval: number;
  maxPinkGap: number;
  minPinkGap: number;
  highestMultiplier: number;
  averageMultiplier: number;
}

export type SignalType =
  | 'PINK_RADAR'
  | 'SUPER_PINK_50X'
  | 'PURPLE_WAVE'
  | 'CHESS_ALTERNATION'
  | 'DUAL_BREAKOUT'
  | 'STANDBY';

export interface SuperPinkAnalysis {
  roundsSinceLastSuperPink: number;
  lastSuperPinkMultiplier: number;
  lastSuperPinkMinute: number;
  lastSuperPinkTimestamp: number;
  superPinkCount: number;
  probabilityScore: number; // 0 - 100
  isInCriticalZone: boolean;
  predictedMinutes: number[];
  criticalThreshold: number;
  recommendedStrategy: string;
  platformCalibration: '82B_GAME' | 'SPRIBE_AUTO';
}

export interface RadarSignal {
  id: string;
  type: SignalType;
  level: 'HIGH' | 'MEDIUM' | 'EXTREME' | 'INFO';
  title: string;
  targetMultiplier: string;
  confidence: number; // 0 - 100
  triggerReason: string;
  stopGain: string;
  protectionGale: string;
  timestamp: number;
  suggestedCashout: number;
  secondaryCashout?: number; // Ex: 10x ou 50x no alvo duplo
  calibrationPlatform?: '82B_GAME' | 'SPRIBE_AUTO';
  isSuperPink50x?: boolean;
  payingMinuteTarget: string;
  targetSecond?: number;
  payingSecondTarget?: string;
  targetTimeFormatted?: string;
}

export interface PayingMinuteAnalysis {
  minute: number;
  pinkCount: number;
  purpleCount: number;
  lastSeenRoundsAgo: number;
  heatScore: number; // 0 - 100
}

export interface NotificationSettings {
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
    notifyOnPurple: boolean;
    notifyOnPink: boolean;
    notifyOnSuperPink: boolean;
    notifyOnSlots?: boolean;
    minConfidence: number;
  };
  webhook: {
    enabled: boolean;
    url: string;
    notifyOnPurple: boolean;
    notifyOnPink: boolean;
    notifyOnSlots?: boolean;
  };
  browser: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    desktopNotifications: boolean;
    slotsVoiceAlert?: boolean;
  };
}

export interface NotificationLog {
  id: string;
  timestamp: number;
  channel: 'telegram' | 'webhook' | 'browser';
  status: 'sent' | 'failed' | 'simulated';
  title: string;
  message: string;
  multiplier?: number;
}

export type MinutePatternInterval = 4 | 5 | 12 | 2 | 3;

export type SurgicalTargetStatus =
  | 'WAITING'
  | 'PREPARE'
  | 'ACTIVE_SHOOTING'
  | 'VALIDATED_HIT'
  | 'EXPIRED_MISS';

export type TargetValidationOutcome =
  | 'EXACT_PURPLE_HIT'          // Alvo Roxa pagou Roxa (2.00x - 9.99x)
  | 'EXACT_PINK_HIT'            // Alvo Rosa pagou Rosa (10.00x+)
  | 'SUPERAVIT_PINK_ON_PURPLE'  // Alvo Roxa pagou Rosa (Subida de vela / Superavit)
  | 'PROTECTION_PURPLE_ON_PINK' // Alvo Rosa pagou Roxa (Mão 1 salva em 2.00x)
  | 'MISS_BLUE';                // Pagou Azul (< 2.00x)

export interface SurgicalTarget {
  id: string;
  interval: MinutePatternInterval; // +4m, +5m, +12m
  targetColor: 'purple' | 'pink'; // Distinção obrigatória: Roxa (2x-9.99x) ou Rosa (10x+)
  isSuperPink50x?: boolean;
  sourceCandleId: string;
  sourceMultiplier: number;
  sourceTimestamp: number;
  sourceMinute: number;
  targetMinute: number; // 0 - 59
  targetSecond: number; // 0 - 59 (segundo exato previsto)
  targetTimestamp: number;
  targetTimeFormatted: string; // ex: "14:25:18"
  secondWindow: string; // ex: ":12s a :25s"
  secondsRemaining: number;
  status: SurgicalTargetStatus;
  confidence: number; // 0 - 100
  targetMultiplier: string;
  protectionGale: string;
  hasConfluence: boolean;
  confluenceIntervals?: MinutePatternInterval[];
  validatedMultiplier?: number;
  validationOutcome?: TargetValidationOutcome;
  houseRuleTip?: string; // Dica cirúrgica baseada nos padrões do 82b.game
}

export interface MinutePatternStat {
  interval: MinutePatternInterval;
  targetColor: 'purple' | 'pink';
  name: string;
  label: string;
  description: string;
  totalTested: number;
  hitsCount: number;
  pinkHits: number;
  purpleHits: number;
  missCount: number;
  accuracyRate: number; // 0 - 100%
  avgMultiplierOnHit: number;
  status: 'HOT' | 'STABLE' | 'COOLING';
  idealTarget: string;
}

export interface SurgicalConfluenceAlert {
  id: string;
  targetMinute: number;
  targetTimeFormatted: string;
  patterns: MinutePatternInterval[];
  sourcesCount: number;
  confidence: number;
  secondsRemaining: number;
  status: SurgicalTargetStatus;
  highestSourceMultiplier: number;
}

export type SlotGameId =
  | 'fortune-tiger'
  | 'fortune-rabbit'
  | 'fortune-ox'
  | 'fortune-mouse'
  | 'gates-olympus'
  | 'sweet-bonanza'
  | 'fortune-dragon';

export type SlotStatus = 'WAITING' | 'PREPARE' | 'ACTIVE_NOW' | 'EXPIRED';

export interface AssertiveSlotSignal {
  id: string;
  gameId: SlotGameId;
  gameName: string;
  gameEmoji: string;
  provider: 'PG Soft' | 'Pragmatic Play';
  targetMinute: number; // 0 - 59
  targetSecond: number; // 0 - 59
  targetTimeFormatted: string; // ex: "14:32:15"
  secondWindow: string; // ex: ":10s a :25s"
  validUntilFormatted: string;
  normalSpins: number;
  turboSpins: number;
  alternatingPattern: string; // ex: "10x Normal • 10x Turbo"
  assertiveness: number; // e.g. 98.4
  status: SlotStatus;
  secondsRemaining: number;
  strategyTip: string;
  bonusFeature: string;
  timestamp: number;
}

