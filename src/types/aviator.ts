export type CandleColor = 'blue' | 'purple' | 'pink' | 'gold';

export interface AviatorCandle {
  id: string;
  multiplier: number;
  timestamp: Date;
  minuteString: string; // e.g., "19:14"
  timeString: string; // e.g., "19:14:22"
  isPink: boolean;
}

export interface MinutagemProjection {
  targetMinute: string; // "19:22"
  deltaMinutes: number; // +4 min
  secondsRemaining: number;
  confidence: 'Alta' | 'Média' | 'Normal';
  reason: string;
}

export interface MinutagemStats {
  totalCandles: number;
  pinkCandlesCount: number;
  purpleCandlesCount: number;
  blueCandlesCount: number;
  lastPinkMinute: string | null;
  lastPinkTime: string | null;
  lastPinkMultiplier: number | null;
  averagePinkIntervalMin: number;
  minIntervalMin: number;
  maxIntervalMin: number;
  pinkEndingsFrequency: Record<number, number>; // minute ending digit (0-9)
  currentConsecutiveBlues: number;
  marketState: 'Pagador' | 'Neutro' | 'Recolhedor / Frio';
}
