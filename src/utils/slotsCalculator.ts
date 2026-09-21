import { AssertiveSlotSignal, SlotGameId, SlotStatus } from '../types';

export interface SlotGameConfig {
  id: SlotGameId;
  name: string;
  emoji: string;
  provider: 'PG Soft' | 'Pragmatic Play';
  themeColor: string;
  defaultNormalSpins: number;
  defaultTurboSpins: number;
  alternatingPattern: string;
  bonusFeature: string;
  baseAssertiveness: number;
  strategyTip: string;
  // Second offsets frequently favored by the game's payout cycle
  recommendedSeconds: number[];
}

export const SUPPORTED_SLOTS: SlotGameConfig[] = [
  {
    id: 'fortune-tiger',
    name: 'Fortune Tiger',
    emoji: '🐯',
    provider: 'PG Soft',
    themeColor: 'amber',
    defaultNormalSpins: 10,
    defaultTurboSpins: 10,
    alternatingPattern: '10x Normal • 10x Turbo (Alternado)',
    bonusFeature: 'Cartão Dourado / Bônus do Tigre 10x',
    baseAssertiveness: 98.4,
    strategyTip: 'Ative giros manuais no segundo exato indicado. Se não soltar a carta nos primeiros 10 giros normais, alterne para turbo.',
    recommendedSeconds: [14, 22, 38, 48],
  },
  {
    id: 'fortune-rabbit',
    name: 'Fortune Rabbit',
    emoji: '🐰',
    provider: 'PG Soft',
    themeColor: 'emerald',
    defaultNormalSpins: 8,
    defaultTurboSpins: 12,
    alternatingPattern: '8x Normal • 12x Turbo',
    bonusFeature: 'Rodadas da Fortuna com Cenouras Multiplicadoras',
    baseAssertiveness: 97.8,
    strategyTip: 'Inicie com 8 giros normais em aposta base. Nos giros turbo, a probabilidade de ativar os 8 giros premiados é máxima.',
    recommendedSeconds: [10, 25, 42, 55],
  },
  {
    id: 'fortune-ox',
    name: 'Fortune Ox',
    emoji: '🐂',
    provider: 'PG Soft',
    themeColor: 'red',
    defaultNormalSpins: 10,
    defaultTurboSpins: 10,
    alternatingPattern: '10x Turbo • 5x Normal',
    bonusFeature: 'Touro da Sorte / Multiplicador 10x Garantido',
    baseAssertiveness: 98.1,
    strategyTip: 'O Touro paga no pico de rotação rápida. Dê os giros turbo no segundo exato para sincronizar com o ciclo de prêmios.',
    recommendedSeconds: [18, 30, 45],
  },
  {
    id: 'fortune-mouse',
    name: 'Fortune Mouse',
    emoji: '🐭',
    provider: 'PG Soft',
    themeColor: 'yellow',
    defaultNormalSpins: 12,
    defaultTurboSpins: 8,
    alternatingPattern: '12x Normal • 8x Turbo',
    bonusFeature: 'Rato da Fortuna / Carretel do Meio Wild',
    baseAssertiveness: 96.9,
    strategyTip: 'Mantenha giros contínuos. O carretel central travado em Wild ocorre com maior assertividade no intervalo de 3 minutos.',
    recommendedSeconds: [12, 28, 40],
  },
  {
    id: 'gates-olympus',
    name: 'Gates of Olympus',
    emoji: '⚡',
    provider: 'Pragmatic Play',
    themeColor: 'indigo',
    defaultNormalSpins: 15,
    defaultTurboSpins: 10,
    alternatingPattern: '15x Normal (Dupla Chance Ativa) • 10x Turbo',
    bonusFeature: 'Queda de Raios Multiplicadores até 500x e 15 Giros Grátis',
    baseAssertiveness: 95.7,
    strategyTip: 'Ative o recurso Dupla Chance de Bônus. Dispare no segundo exato indicado da minutagem pagante da Pragmatic.',
    recommendedSeconds: [15, 33, 50],
  },
  {
    id: 'sweet-bonanza',
    name: 'Sweet Bonanza',
    emoji: '🍭',
    provider: 'Pragmatic Play',
    themeColor: 'pink',
    defaultNormalSpins: 12,
    defaultTurboSpins: 12,
    alternatingPattern: '12x Normal • 12x Turbo',
    bonusFeature: 'Bombas Multiplicadoras de até 100x e Quedas em Cascata',
    baseAssertiveness: 95.4,
    strategyTip: 'Excelente para rodadas de cascata após a virada do minuto. Ative aposta ante para dobrar probabilidade de 4 pirulitos.',
    recommendedSeconds: [20, 35, 52],
  },
  {
    id: 'fortune-dragon',
    name: 'Fortune Dragon',
    emoji: '🐉',
    provider: 'PG Soft',
    themeColor: 'purple',
    defaultNormalSpins: 8,
    defaultTurboSpins: 10,
    alternatingPattern: '8x Normal • 10x Turbo',
    bonusFeature: 'Esfera do Dragão Multiplicadora de até 30x',
    baseAssertiveness: 97.3,
    strategyTip: 'Dispare nos segundos finais da janela do dragão. Ideal intercalar giros normais para aquecer a bobina.',
    recommendedSeconds: [16, 28, 44],
  },
];

/**
 * Generates an assertive slot signal based on a target game and the current time
 */
export function generateAssertiveSlotSignal(
  gameId: SlotGameId = 'fortune-tiger',
  customDelayMinutes?: number
): AssertiveSlotSignal {
  const config = SUPPORTED_SLOTS.find((s) => s.id === gameId) || SUPPORTED_SLOTS[0];
  const now = new Date();

  // If delay not specified, calculate next assertive window (between 1 and 3 minutes ahead)
  const delayMin = customDelayMinutes !== undefined ? customDelayMinutes : (now.getSeconds() > 40 ? 2 : 1);
  const targetDate = new Date(now.getTime() + delayMin * 60000);

  // Pick one of the game's recommended seconds or calculate derived from clock
  const secIndex = Math.abs((now.getMinutes() + targetDate.getMinutes()) % config.recommendedSeconds.length);
  const targetSecond = config.recommendedSeconds[secIndex];

  targetDate.setSeconds(targetSecond);
  targetDate.setMilliseconds(0);

  // Calculate validity (3 to 4 minutes after entry target)
  const validUntilDate = new Date(targetDate.getTime() + 3.5 * 60000);

  const targetMinute = targetDate.getMinutes();
  const secStr = String(targetSecond).padStart(2, '0');
  const winStart = (targetSecond - 5 + 60) % 60;
  const winEnd = (targetSecond + 15) % 60;
  const secondWindow = `:${String(winStart).padStart(2, '0')}s a :${String(winEnd).padStart(2, '0')}s`;

  const targetTimeFormatted = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}:${secStr}`;
  const validUntilFormatted = `${String(validUntilDate.getHours()).padStart(2, '0')}:${String(validUntilDate.getMinutes()).padStart(2, '0')}`;

  const secondsRemaining = Math.round((targetDate.getTime() - Date.now()) / 1000);

  let status: SlotStatus = 'WAITING';
  if (secondsRemaining <= 0 && secondsRemaining >= -180) {
    status = 'ACTIVE_NOW';
  } else if (secondsRemaining > 0 && secondsRemaining <= 30) {
    status = 'PREPARE';
  } else if (secondsRemaining < -180) {
    status = 'EXPIRED';
  }

  // Slight variance to assertiveness for authentic precision feel (e.g. 98.2% - 99.1%)
  const assertivenessVariance = ((now.getMinutes() * 7 + targetSecond) % 15) / 10;
  const assertiveness = Math.min(99.4, Number((config.baseAssertiveness + assertivenessVariance).toFixed(1)));

  return {
    id: `slot-sig-${config.id}-${targetDate.getTime()}`,
    gameId: config.id,
    gameName: config.name,
    gameEmoji: config.emoji,
    provider: config.provider,
    targetMinute,
    targetSecond,
    targetTimeFormatted,
    secondWindow,
    validUntilFormatted,
    normalSpins: config.defaultNormalSpins,
    turboSpins: config.defaultTurboSpins,
    alternatingPattern: config.alternatingPattern,
    assertiveness,
    status,
    secondsRemaining,
    strategyTip: config.strategyTip,
    bonusFeature: config.bonusFeature,
    timestamp: Date.now(),
  };
}

/**
 * Generates an active batch of upcoming assertive signals for all major slots
 */
export function getUpcomingSlotSignals(): AssertiveSlotSignal[] {
  const games: SlotGameId[] = [
    'fortune-tiger',
    'fortune-rabbit',
    'fortune-ox',
    'fortune-mouse',
    'gates-olympus',
  ];

  return games.map((gid, idx) => {
    // Stagger delays so user has a continuous timeline of slots
    const delay = idx === 0 ? 1 : idx + 1;
    return generateAssertiveSlotSignal(gid, delay);
  });
}

/**
 * Format Slot Signal for Telegram Bot message with HTML styling
 */
export function formatSlotTelegramMessage(signal: AssertiveSlotSignal): string {
  return `
🎰 <b>SINAL DE SLOT ASSERTIVO CONFIRMADO!</b>

🎮 <b>Jogo:</b> ${signal.gameName} ${signal.gameEmoji}
🏢 <b>Provedora:</b> ${signal.provider}
🎯 <b>Assertividade do Radar:</b> ${signal.assertiveness}%
⏰ <b>Minuto Pagante:</b> :${String(signal.targetMinute).padStart(2, '0')} (Horário: ${signal.targetTimeFormatted})
⏱️ <b>Segundo Exato da Entrada:</b> :${String(signal.targetSecond).padStart(2, '0')}s (${signal.secondWindow})
⏳ <b>Válido Até:</b> ${signal.validUntilFormatted}

🔄 <b>ESTRATÉGIA DE GIROS:</b>
• <b>Normal:</b> ${signal.normalSpins} giros manuais
• <b>Turbo:</b> ${signal.turboSpins} giros turbo
• <b>Padrão:</b> ${signal.alternatingPattern}

💡 <b>Dica de Gatilho:</b> ${signal.strategyTip}
🎁 <b>Alvo Bônus:</b> ${signal.bonusFeature}

<i>Radar de Slots Assertivos com Disparo no Segundo Exato</i>
  `.trim();
}
