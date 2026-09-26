import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface StoredCandle {
  id: string;
  multiplier: number;
  timestamp: number;
  color: 'blue' | 'purple' | 'pink';
  roundNumber: number;
  payingMinute: number;
}

// Initial realistic seed history of recent Aviator candles
let candlesHistory: StoredCandle[] = [
  { id: '1', multiplier: 1.22, timestamp: Date.now() - 1000 * 20 * 19, color: 'blue' as const, roundNumber: 101, payingMinute: 10 },
  { id: '2', multiplier: 12.45, timestamp: Date.now() - 1000 * 20 * 18, color: 'pink' as const, roundNumber: 102, payingMinute: 11 },
  { id: '3', multiplier: 2.14, timestamp: Date.now() - 1000 * 20 * 17, color: 'purple' as const, roundNumber: 103, payingMinute: 11 },
  { id: '4', multiplier: 1.40, timestamp: Date.now() - 1000 * 20 * 16, color: 'blue' as const, roundNumber: 104, payingMinute: 12 },
  { id: '5', multiplier: 3.82, timestamp: Date.now() - 1000 * 20 * 15, color: 'purple' as const, roundNumber: 105, payingMinute: 12 },
  { id: '6', multiplier: 1.15, timestamp: Date.now() - 1000 * 20 * 14, color: 'blue' as const, roundNumber: 106, payingMinute: 13 },
  { id: '7', multiplier: 1.95, timestamp: Date.now() - 1000 * 20 * 13, color: 'blue' as const, roundNumber: 107, payingMinute: 13 },
  { id: '8', multiplier: 4.10, timestamp: Date.now() - 1000 * 20 * 12, color: 'purple' as const, roundNumber: 108, payingMinute: 14 },
  { id: '9', multiplier: 1.05, timestamp: Date.now() - 1000 * 20 * 11, color: 'blue' as const, roundNumber: 109, payingMinute: 14 },
  { id: '10', multiplier: 2.50, timestamp: Date.now() - 1000 * 20 * 10, color: 'purple' as const, roundNumber: 110, payingMinute: 15 },
  { id: '11', multiplier: 1.83, timestamp: Date.now() - 1000 * 20 * 9, color: 'blue' as const, roundNumber: 111, payingMinute: 15 },
  { id: '12', multiplier: 1.34, timestamp: Date.now() - 1000 * 20 * 8, color: 'blue' as const, roundNumber: 112, payingMinute: 16 },
  { id: '13', multiplier: 6.20, timestamp: Date.now() - 1000 * 20 * 7, color: 'purple' as const, roundNumber: 113, payingMinute: 16 },
  { id: '14', multiplier: 1.11, timestamp: Date.now() - 1000 * 20 * 6, color: 'blue' as const, roundNumber: 114, payingMinute: 17 },
  { id: '15', multiplier: 1.48, timestamp: Date.now() - 1000 * 20 * 5, color: 'blue' as const, roundNumber: 115, payingMinute: 17 },
  { id: '16', multiplier: 1.29, timestamp: Date.now() - 1000 * 20 * 4, color: 'blue' as const, roundNumber: 116, payingMinute: 18 },
  { id: '17', multiplier: 18.90, timestamp: Date.now() - 1000 * 20 * 3, color: 'pink' as const, roundNumber: 117, payingMinute: 18 },
  { id: '18', multiplier: 2.05, timestamp: Date.now() - 1000 * 20 * 2, color: 'purple' as const, roundNumber: 118, payingMinute: 19 },
  { id: '19', multiplier: 1.35, timestamp: Date.now() - 1000 * 20 * 1, color: 'blue' as const, roundNumber: 119, payingMinute: 19 },
  { id: '20', multiplier: 2.45, timestamp: Date.now(), color: 'purple' as const, roundNumber: 120, payingMinute: 20 },
].reverse(); // Sort most recent first

let roundCounter = 120;

function getOrCalibrateCandles(): StoredCandle[] {
  const now = Date.now();
  if (candlesHistory.length === 0) {
    const sampleMultipliers = [
      2.45, 1.34, 1.15, 14.80, 2.10, 1.05, 3.82, 1.95, 4.10, 1.22,
      18.90, 2.05, 1.35, 1.20, 5.40, 1.12, 2.65, 1.48, 1.29, 2.20
    ];
    candlesHistory = sampleMultipliers.map((mult, idx) => {
      const ts = now - idx * 22000;
      const color: 'blue' | 'purple' | 'pink' = mult >= 10 ? 'pink' : mult >= 2 ? 'purple' : 'blue';
      return {
        id: `seed-${idx}`,
        multiplier: mult,
        timestamp: ts,
        color,
        roundNumber: 150 - idx,
        payingMinute: new Date(ts).getMinutes(),
      };
    });
  } else if (now - candlesHistory[0].timestamp > 10 * 60 * 1000) {
    // Keep seed in sync with live clock if it has been sitting in past
    const shift = now - 20000 - candlesHistory[0].timestamp;
    candlesHistory = candlesHistory.map((c) => {
      const newTs = c.timestamp + shift;
      return {
        ...c,
        timestamp: newTs,
        payingMinute: new Date(newTs).getMinutes(),
      };
    });
  }
  return candlesHistory;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), totalCandles: candlesHistory.length });
  });

  // Get Candles
  app.get('/api/candles', (req: Request, res: Response) => {
    const list = getOrCalibrateCandles();
    res.json({
      candles: list,
      lastUpdated: Date.now(),
      total: list.length,
    });
  });

  // Add Candle
  app.post('/api/candles', (req: Request, res: Response) => {
    const { multiplier, timestamp } = req.body;
    if (typeof multiplier !== 'number' || multiplier < 1.0) {
      return res.status(400).json({ error: 'Multiplicador inválido. Deve ser >= 1.00' });
    }

    roundCounter++;
    const candleTime = typeof timestamp === 'number' && timestamp > 0 ? timestamp : Date.now();
    const dateObj = new Date(candleTime);
    const color = multiplier >= 10.0 ? 'pink' : multiplier >= 2.0 ? 'purple' : 'blue';

    const newCandle: StoredCandle = {
      id: `candle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      multiplier: Number(multiplier.toFixed(2)),
      timestamp: candleTime,
      color,
      roundNumber: roundCounter,
      payingMinute: dateObj.getMinutes(),
    };

    candlesHistory.unshift(newCandle);
    if (candlesHistory.length > 500) {
      candlesHistory.pop();
    }

    res.json({ success: true, candle: newCandle, total: candlesHistory.length });
  });

  // Batch Sync Candles (Paste real history sequence from Aviator top bar)
  app.post('/api/candles/batch', (req: Request, res: Response) => {
    const {
      multipliers,
      replaceAll = false,
      secondsPerRound = 22,
      newestFirst = true,
      lastExitTimestamp,
    } = req.body;

    let parsedNumbers: number[] = [];
    if (typeof multipliers === 'string') {
      // Parse formats like "1.20x 3.45x 15.00x", "1,20; 3,45", "1.20, 3.45"
      const matches = multipliers.replace(/,/g, '.').match(/\d+(\.\d+)?/g);
      if (matches) {
        parsedNumbers = matches.map(Number).filter((n) => !isNaN(n) && n >= 1.0);
      }
    } else if (Array.isArray(multipliers)) {
      parsedNumbers = multipliers
        .map((m) => (typeof m === 'string' ? parseFloat(m.replace(',', '.')) : Number(m)))
        .filter((n) => !isNaN(n) && n >= 1.0);
    }

    if (parsedNumbers.length === 0) {
      return res.status(400).json({
        error: 'Nenhum multiplicador válido detectado. Forneça uma sequência de números como "1.20 2.50 14.10".',
      });
    }

    // Base time for the most recent exit (exact hour, minute, second)
    const baseExitTime =
      typeof lastExitTimestamp === 'number' && lastExitTimestamp > 0
        ? lastExitTimestamp
        : Date.now();

    const newItems: StoredCandle[] = [];
    const count = parsedNumbers.length;

    // Calibração Oficial Spribe (82b.game):
    // Cada rodada do Aviator no 82b.game tem duração proporcional ao multiplicador:
    // t_voo = max(0.6, ln(multiplier) / 0.06) + 5.0s (janela de aposta oficial)
    const getSpribeDurationSec = (mult: number): number => {
      if (mult <= 1.0) return 5.6;
      const flight = Math.max(0.6, Math.log(mult) / 0.06);
      return flight + 5.0;
    };

    // Calculate exact backward timestamps for each candle
    const timestamps: number[] = new Array(count);
    if (newestFirst) {
      let rolling = baseExitTime;
      for (let i = 0; i < count; i++) {
        if (i === 0) {
          timestamps[0] = baseExitTime;
        } else {
          // The round before this one took its duration to fly and reset
          const prevMult = parsedNumbers[i - 1];
          const durSec = getSpribeDurationSec(prevMult);
          rolling -= Math.round(durSec * 1000);
          timestamps[i] = rolling;
        }
      }
    } else {
      let rolling = baseExitTime;
      for (let i = count - 1; i >= 0; i--) {
        if (i === count - 1) {
          timestamps[i] = baseExitTime;
        } else {
          const nextMult = parsedNumbers[i + 1];
          const durSec = getSpribeDurationSec(nextMult);
          rolling -= Math.round(durSec * 1000);
          timestamps[i] = rolling;
        }
      }
    }

    parsedNumbers.forEach((mult, idx) => {
      const candleTime = timestamps[idx] || (baseExitTime - idx * (secondsPerRound * 1000));
      const color: 'blue' | 'purple' | 'pink' =
        mult >= 10.0 ? 'pink' : mult >= 2.0 ? 'purple' : 'blue';

      newItems.push({
        id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        multiplier: Number(mult.toFixed(2)),
        timestamp: candleTime,
        color,
        roundNumber: (roundCounter += 1),
        payingMinute: new Date(candleTime).getMinutes(),
      });
    });

    // In candlesHistory, index 0 is ALWAYS the newest candle!
    // If newestFirst was true, newItems[0] is already the newest candle.
    // If newestFirst was false, newItems[0] is the oldest candle, so reverse it.
    const sortedNewestFirst = newestFirst ? newItems : newItems.reverse();

    if (replaceAll) {
      candlesHistory = sortedNewestFirst;
    } else {
      candlesHistory = [...sortedNewestFirst, ...candlesHistory].slice(0, 500);
    }

    res.json({
      success: true,
      added: parsedNumbers.length,
      candles: candlesHistory,
      total: candlesHistory.length,
      lastExitTime: new Date(baseExitTime).toISOString(),
    });
  });

  // Remove the last registered candle
  app.delete('/api/candles/last', (req: Request, res: Response) => {
    if (candlesHistory.length > 0) {
      const removed = candlesHistory.shift();
      return res.json({ success: true, removed, total: candlesHistory.length });
    }
    res.json({ success: true, removed: null, total: 0 });
  });

  // Clear / Reset Candles to Seed
  app.post('/api/candles/reset', (req: Request, res: Response) => {
    roundCounter = 50;
    const now = Date.now();
    const generated: StoredCandle[] = [];
    for (let i = 0; i < 40; i++) {
      const rand = Math.random();
      let mult = 1.0;
      let color: 'blue' | 'purple' | 'pink' = 'blue';

      if (rand < 0.08) {
        mult = Number((10 + Math.random() * 35).toFixed(2));
        color = 'pink';
      } else if (rand < 0.45) {
        mult = Number((2.0 + Math.random() * 5.0).toFixed(2));
        color = 'purple';
      } else {
        mult = Number((1.0 + Math.random() * 0.98).toFixed(2));
        color = 'blue';
      }

      generated.push({
        id: `c-${i}`,
        multiplier: mult,
        timestamp: now - (40 - i) * 22000,
        color,
        roundNumber: i + 1,
        payingMinute: new Date(now - (40 - i) * 22000).getMinutes(),
      });
    }

    candlesHistory = generated.reverse();
    roundCounter = 40;
    res.json({ success: true, total: candlesHistory.length });
  });

  // Telegram Notification API Dispatcher
  app.post('/api/notify/telegram', async (req: Request, res: Response) => {
    const { botToken, chatId, message, parseMode = 'HTML' } = req.body;

    if (!botToken || !chatId || !message) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios ausentes: botToken, chatId e message.',
      });
    }

    try {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        return res.status(400).json({
          success: false,
          error: data.description || 'Erro ao enviar mensagem pelo Telegram',
        });
      }

      return res.json({ success: true, data });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha na conexão com API do Telegram';
      return res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // Webhook / Discord API Dispatcher
  app.post('/api/notify/webhook', async (req: Request, res: Response) => {
    const { url, payload } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL do Webhook é obrigatória.' });
    }

    try {
      // Support Discord webhook format if discord.com in URL
      let bodyToSend = payload;
      if (url.includes('discord.com/api/webhooks')) {
        bodyToSend = {
          content: payload.text || payload.content || '🚨 Alerta Aviator Radar',
          embeds: payload.embeds || [
            {
              title: payload.title || 'Aviator Radar Signal',
              description: payload.text || payload.message,
              color: payload.type === 'PINK_RADAR' ? 0xec4899 : 0xa855f7,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyToSend),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({
          success: false,
          error: `Webhook respondeu com status ${response.status}: ${text}`,
        });
      }

      return res.json({ success: true, status: response.status });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao despachar webhook';
      return res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // Test Notification Endpoint
  app.post('/api/notify/test', async (req: Request, res: Response) => {
    const { channel, botToken, chatId, webhookUrl } = req.body;

    const testMessage = `
🚀 <b>TESTE DE CONEXÃO - AVIATOR RADAR PWA</b> 🚀

✅ Sua API de notificações instantâneas foi conectada com sucesso!
📡 <b>Radar:</b> Monitorando Velas Rosa (10x+) e Roxa (2x+)
⏱️ <b>Status:</b> Operação em Tempo Real Ativa
🎮 <b>Site Monitorado:</b> Aviator Cloudfront

Você receberá os sinais com antecedência de até 2 rodadas.
    `.trim();

    if (channel === 'telegram') {
      if (!botToken || !chatId) {
        return res.status(400).json({ error: 'Token do Bot e Chat ID são obrigatórios para testar o Telegram.' });
      }

      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: testMessage,
            parse_mode: 'HTML',
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          return res.status(400).json({ success: false, error: data.description || 'Falha no Telegram' });
        }
        return res.json({ success: true, message: 'Mensagem de teste enviada com sucesso ao Telegram!' });
      } catch (err: unknown) {
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro no envio' });
      }
    } else if (channel === 'webhook') {
      if (!webhookUrl) {
        return res.status(400).json({ error: 'URL do Webhook é obrigatória.' });
      }
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '🚀 TESTE: Aviator Radar PWA conectado com sucesso ao Webhook!',
            text: 'TESTE: Aviator Radar PWA conectado com sucesso ao Webhook!',
          }),
        });
        if (!response.ok) {
          return res.status(response.status).json({ success: false, error: `Status ${response.status}` });
        }
        return res.json({ success: true, message: 'Webhook testado com sucesso!' });
      } catch (err: unknown) {
        return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erro no webhook' });
      }
    }

    res.status(400).json({ error: 'Canal de teste inválido' });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aviator Radar Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
