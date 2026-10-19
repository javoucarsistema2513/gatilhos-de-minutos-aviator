import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable large payloads for screenshot base64 uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Express JSON body-parser error handling (prevents HTML error pages on payload/syntax errors)
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      success: false,
      error: 'A imagem enviada excedeu o limite de tamanho. O aplicativo agora comprime imagens automaticamente.',
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: 'Requisição inválida enviada ao servidor.',
      details: err.message || String(err),
    });
  }
  next();
});

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System knowledge base from Modules 1 to 5 & Mentoria Pai do Aviator (Ronaldo Torres)
const AVIATOR_KNOWLEDGE_PROMPT = `
Você é o Assistente Especialista de Inteligência Artificial do Radar Aviator 82b.
Você domina os 5 Módulos dos Segredos do Aviator e a Mentoria Avançada (Pai do Aviator):

REGRAS DE ANÁLISE:
1. Composição do Gráfico: 60% Azul (<2.00x), 30% Roxo (2.00x a 9.99x), 10% Rosa (>=10.00x).
2. Velas Especiais:
   - 1.00x (Reset): Puxa 5x+ e 10x em até 10 casas (5ª casa é a mais forte!). Duas 1.00x juntas puxam Rosa em 5 entradas.
   - 1.37x: Mais de 90% de assertividade para puxar 5x+ ou Rosa! O padrão 1.00x + 1.37x + 1.00x é gatilho de Rosa imediata.
   - 1.88x: Especial! 5 entradas fixas com proteção no 1.49x buscando 5x e 10x.
   - 1.11x e 1.99x: Puxam velas de 2x+ e 5x+.
3. Dica de Ouro 2 (Finais de Vela):
   - Final 7 (centésimo 7, ex: 2.37x, 1.77x, 4.17x): 80% DE CHANCE DE RED! Alerte o usuário para NÃO entrar ou ter cautela máxima.
   - Final 1 (centésimo 1, ex: 2.31x, 3.11x): 80% de puxar vela Roxa 2x+.
   - Final 5 (centésimo 5, ex: 1.45x, 2.75x): Puxa Roxo 2x+.
4. Regra dos 13 & Casas Ímpares:
   - Após vela de 30x+ ou 100x+, a plataforma paga outra vela alta em até 13 casas.
   - Casas ÍMPARES (1, 3, 5, 7, 9, 11, 13) pagam vela alta em 95% das vezes!
5. Subtração de Velas e Decimais (Módulo 5 pág. 3):
   - Vela alta X.YZ -> subtrai dígitos da parte inteira e decimal -> soma dos resultados dá o minuto da próxima vela.
6. Gerenciamento de Banca:
   - Proteção sempre no 1.49x ou 2.00x.
   - Máximo 2 gales (G1 e G2) ou entradas no minuto exato.
   - Nunca insista em momentos de recolhe. Metas diárias: R$ 20, R$ 30 ou R$ 50.
`;

// 1. POST /api/ai/analyze-chart: Multimodal Chart Screenshot Analysis
app.post('/api/ai/analyze-chart', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/png', currentTableCandles = [] } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Nenhuma imagem enviada para análise.' });
      return;
    }

    // Clean data URL prefix safely regardless of mime format
    const cleanBase64 = imageBase64.includes(';base64,')
      ? imageBase64.split(';base64,')[1]
      : imageBase64.replace(/^data:[^;]+;base64,/, '');

    const promptText = `
Analise minuciosamente esta imagem do gráfico / histórico de rodadas do Aviator (82b / Spribe).
Aplique com o máximo de rigor os ensinamentos dos Módulos dos Segredos do Aviator e Mentoria Pai do Aviator:

1. VERIFICAÇÃO OBRIGATÓRIA DA RODADA:
   - Identifique e extraia o NÚMERO / ID DA RODADA se visível na imagem (ex: número da rodada no topo, no histórico, provably fair ou sequência ordinal das rodadas).
   - Verifique a PARIDADE DA RODADA (Par ou Ímpar): Segundo a Regra dos 13 da 82B, Casas ÍMPARES (1, 3, 5, 7, 9, 11, 13) pagam velas altas em 95% dos ciclos!

2. VERIFICAÇÃO OBRIGATÓRIA DOS DECIMAIS (CASA DECIMAL E CENTÉSIMO):
   - Extraia cada multiplicador com seu DECIMAL EXATO até os centésimos (ex: 2.37x, 14.82x, 1.11x, 1.77x, 10.45x). NÃO ARREDONDE!
   - Separe a parte inteira e a parte decimal de cada vela.
   - Analise o CENTÉSIMO (último dígito decimal) de cada vela:
     * Final 7 (ex: 2.37x, 1.77x): 80% CHANCE DE RED (Recolhe). Se a última vela tiver final 7, emita warningAlert de cautela máxima!
     * Final 1 (ex: 2.31x, 3.11x): 80% de puxar vela Roxa 2.00x+.
     * Final 5 (ex: 1.45x, 2.75x): Puxa vela Roxa 2.00x+.
   - Aplique a Regra da SUBTRAÇÃO DECIMAL (Módulo 5 pág. 3) na última vela alta para prever o próximo minuto exato:
     * Fórmula: |Parte Inteira - Parte Decimal| -> se der 2 dígitos, somar os algarismos -> minuto resultante da entrada.

3. Identifique os padrões 82b presentes:
   - Velas especiais (1.00x reset, 1.37x, 1.88x, 1.11x, 1.99x).
   - Gatilhos de 5x (1.64-1.69x, 1.02x, 1.04x) e 10x (1.21-1.29x, pares 1.94+1.18).
   - Estado da mesa: PAGUE, RECOLHE ou FALSO_PAGUE.

4. Determine com precisão a próxima vela alvo:
   - VELA ROXA (2.00x+), VELA ROSA (10.00x+) ou SUPER ROSA (50x/100x+).
   - Forneça probabilidade percentual (ex: 98.4%).
   - Indique estratégia de saída (1ª Mão no 1.49x, 2ª Mão buscar alvo).
`;

    // Fast, high-capacity models with immediate availability and multimodal support
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
    let lastError: any = null;
    let responseText = '';

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const geminiResponse = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: AVIATOR_KNOWLEDGE_PROMPT },
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType,
                    },
                  },
                  { text: promptText },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  extractedCandles: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: 'Lista de multiplicadores lidos na imagem com decimais exatos (ex: [2.45, 1.37, 10.50, 1.12])',
                  },
                  tableState: {
                    type: Type.STRING,
                    description: 'Estado da mesa: PAGUE, RECOLHE, FALSO_PAGUE ou ALTA_EXPANSAO',
                  },
                  dominantPattern: {
                    type: Type.STRING,
                    description: 'Padrão ou gatilho predominante detectado na imagem',
                  },
                  targetCandle: {
                    type: Type.STRING,
                    description: 'Vela alvo recomendada: ROXA, ROSA ou SUPER_ROSA',
                  },
                  targetMultiplier: {
                    type: Type.STRING,
                    description: 'Multiplicador alvo (ex: 2.00x a 3.50x ou 10.00x+)',
                  },
                  projectedTime: {
                    type: Type.STRING,
                    description: 'Previsão de horário/minuto da entrada (ex: Minuto :35 com tolerância no :36)',
                  },
                  confidence: {
                    type: Type.NUMBER,
                    description: 'Probabilidade de acerto em porcentagem (ex: 98.5)',
                  },
                  keyFindings: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Principais conclusões e gatilhos detectados no gráfico',
                  },
                  entryStrategy: {
                    type: Type.STRING,
                    description: 'Como fazer a entrada (quantas mãos, casas recomendadas)',
                  },
                  protectionAdvice: {
                    type: Type.STRING,
                    description: 'Instrução de auto cashout seguro (1.49x ou 2.00x)',
                  },
                  warningAlert: {
                    type: Type.STRING,
                    description: 'Alerta de risco (ex: cuidado com final 7 ou mesa em recolhe), se houver',
                  },
                  roundDetails: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        roundNumber: {
                          type: Type.STRING,
                          description: 'Identificador ou número da rodada (ex: #84920 ou Rodada 1)',
                        },
                        multiplier: {
                          type: Type.NUMBER,
                          description: 'Multiplicador numérico exato com 2 casas decimais',
                        },
                        fullText: {
                          type: Type.STRING,
                          description: 'Texto completo da vela (ex: "14.82x")',
                        },
                        integerPart: {
                          type: Type.NUMBER,
                          description: 'Parte inteira da vela (ex: 14)',
                        },
                        decimalPart: {
                          type: Type.NUMBER,
                          description: 'Parte decimal da vela (ex: 82)',
                        },
                        finalDigit: {
                          type: Type.NUMBER,
                          description: 'Último dígito centésimo (ex: 2)',
                        },
                        finalDigitAnalysis: {
                          type: Type.STRING,
                          description: 'Diagnóstico do final decimal (ex: Final 7: 80% RED ou Final 1: 80% Roxo)',
                        },
                        parity: {
                          type: Type.STRING,
                          description: 'Paridade da rodada/casa: PAR ou ÍMPAR',
                        },
                        color: {
                          type: Type.STRING,
                          description: 'Cor da vela: AZUL, ROXA ou ROSA',
                        },
                      },
                    },
                    description: 'Detalhamento exato de cada rodada e seus decimais extraídos da imagem',
                  },
                  decimalFormula: {
                    type: Type.OBJECT,
                    properties: {
                      sourceCandle: {
                        type: Type.NUMBER,
                        description: 'Vela de referência usada no cálculo decimal (ex: 14.82)',
                      },
                      integerPart: {
                        type: Type.NUMBER,
                        description: 'Parte inteira da vela de referência',
                      },
                      decimalPart: {
                        type: Type.NUMBER,
                        description: 'Parte decimal da vela de referência',
                      },
                      subtractionMath: {
                        type: Type.STRING,
                        description: 'Cálculo de subtração decimal (ex: |14 - 82| = 68 -> 6 + 8 = 14)',
                      },
                      projectedMinute: {
                        type: Type.STRING,
                        description: 'Minuto exato projetado pela fórmula decimal',
                      },
                      explanation: {
                        type: Type.STRING,
                        description: 'Explicação detalhada da regra de subtração decimal',
                      },
                    },
                    description: 'Análise da fórmula de subtração decimal do Módulo 5',
                  },
                  roundVerification: {
                    type: Type.OBJECT,
                    properties: {
                      latestRoundId: {
                        type: Type.STRING,
                        description: 'ID da última rodada identificada na imagem',
                      },
                      totalRoundsDetected: {
                        type: Type.NUMBER,
                        description: 'Total de rodadas identificadas',
                      },
                      roundParity: {
                        type: Type.STRING,
                        description: 'Paridade da rodada: PAR ou ÍMPAR',
                      },
                      imparAdvantageRule: {
                        type: Type.STRING,
                        description: 'Aplicação da regra 82b de casas ímpares',
                      },
                      decimalsValidated: {
                        type: Type.BOOLEAN,
                        description: 'Verdadeiro se os decimais foram checados dígito a dígito',
                      },
                      auditVerdict: {
                        type: Type.STRING,
                        description: 'Veredito da verificação da rodada e decimais',
                      },
                    },
                    description: 'Relatório de verificação da rodada e dos decimais',
                  },
                },
                required: [
                  'extractedCandles',
                  'tableState',
                  'dominantPattern',
                  'targetCandle',
                  'targetMultiplier',
                  'projectedTime',
                  'confidence',
                  'keyFindings',
                  'entryStrategy',
                  'protectionAdvice',
                ],
              },
            },
          });

          responseText = geminiResponse.text?.trim() || '';
          if (responseText) {
            break; // Success!
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini API analyze-chart] Tentativa ${attempt} com ${modelName} falhou:`, err?.message || err);
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      }
      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('Não foi possível obter resposta da IA após tentativas.');
    }

    // Safely parse JSON from model output
    let cleanJsonStr = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsedJson: any;

    try {
      parsedJson = JSON.parse(cleanJsonStr);
    } catch {
      const match = cleanJsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        parsedJson = JSON.parse(match[0]);
      } else {
        throw new Error('A resposta do leitor de IA não continha um JSON válido.');
      }
    }

    res.json({ success: true, analysis: parsedJson });
  } catch (err: unknown) {
    console.error('Erro na análise multimodal de imagem pelo Gemini:', err);
    res.status(500).json({
      success: false,
      error: 'Falha ao processar a análise da imagem do gráfico.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// 2. POST /api/ai/chat-assistant: Conversational Assistant for Aviator strategy
app.post('/api/ai/chat-assistant', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history = [], currentCandles = [], currentSignal = null } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Mensagem vazia.' });
      return;
    }

    const contextText = `
MOMENTO ATUAL DO RADAR:
- Últimas velas registradas: ${currentCandles.slice(-6).map((c: { multiplier: number; color: string }) => `${c.multiplier.toFixed(2)}x (${c.color})`).join(', ') || 'Nenhuma vela registrada'}
- Sinal ativo no momento: ${currentSignal ? `${currentSignal.candleType} alvo ${currentSignal.targetMultiplier} no horário ${currentSignal.targetTimeStr} (Método: ${currentSignal.triggerName})` : 'Nenhum sinal ativo'}

Responda em português brasileiro de forma direta, motivadora e estritamente técnica, baseando-se nos 5 Módulos e na Mentoria Avançada Pai do Aviator. Seja claro se o momento é seguro para entrar ou se é melhor aguardar.
`;

    const contentsPayload = [
      {
        role: 'user',
        parts: [{ text: `${AVIATOR_KNOWLEDGE_PROMPT}\n\n${contextText}` }],
      },
      ...history.map((h: { role: string; content?: string; text?: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content || h.text || '' }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    let responseText = '';
    const chatModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
    for (const m of chatModels) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: contentsPayload,
        });
        responseText = response.text || '';
        if (responseText) break;
      } catch (chatErr) {
        console.warn(`[chat-assistant] Fallback do modelo ${m}:`, chatErr);
      }
    }

    if (!responseText) {
      throw new Error('Não foi possível obter resposta do assistente no momento.');
    }

    res.json({ success: true, reply: responseText });
  } catch (err: unknown) {
    console.error('Erro no assistente de IA Gemini:', err);
    res.status(500).json({
      error: 'Falha ao consultar o assistente de IA.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// 3. POST /api/ai/forecast-analysis: AI Audit of 7h/12h/24h High Multiplier Predictions (100x+)
app.post('/api/ai/forecast-analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    const { horizon = '24H', scheduledSignals = [], latestCandles = [] } = req.body;

    const top100xSignals = scheduledSignals.filter((s: { minMultiplier: number }) => s.minMultiplier >= 100);

    const promptText = `
Você é o Especialista de IA em Velas Altas (100x a 1000x+) do Aviator 82b.
Faça uma auditoria técnica profunda do cronograma de velas futuras para o horizonte de ${horizon}.

DADOS DO CRONOGRAMA:
- Total de janelas mapeadas: ${scheduledSignals.length}
- Total de Super Rosas (100x+): ${top100xSignals.length}
- Próximas janelas de 100x+: ${top100xSignals.slice(0, 8).map((s: { targetTimeFormatted: string; targetMultiplierLabel: string; patternRule: string }) => `${s.targetTimeFormatted} [${s.targetMultiplierLabel}] via ${s.patternRule}`).join('; ')}
- Últimas velas registradas na 82b: ${latestCandles.slice(-6).map((c: { multiplier: number }) => `${c.multiplier}x`).join(', ') || 'Nenhuma vela recente'}

TAREFA:
Identifique os 3 Melhores Horários de Ouro (maior probabilidade de soltura de vela 100x a 1000x) nas próximas horas.
Forneça a assertividade estimada para cada uma, o motivo técnico baseado nos ciclos da 82B (Módulos 1 a 5 e Pai do Aviator), e dicas práticas de gerenciamento de banca para o jogador.
`;

    let responseText = '';
    const forecastModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
    for (const m of forecastModels) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: [
            {
              role: 'user',
              parts: [
                { text: AVIATOR_KNOWLEDGE_PROMPT },
                { text: promptText },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                goldenHours: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timeRange: { type: Type.STRING, description: 'Intervalo do horário de ouro (ex: 15:20 às 15:45)' },
                      expectedTarget: { type: Type.STRING, description: 'Alvo esperado (ex: 100x a 350x)' },
                      assertividade: { type: Type.NUMBER, description: 'Porcentagem de probabilidade (ex: 97.4)' },
                      motivo: { type: Type.STRING, description: 'Justificativa baseada nos ciclos e módulos da 82b' },
                    },
                    required: ['timeRange', 'expectedTarget', 'assertividade', 'motivo'],
                  },
                  description: 'Os 3 principais horários de ouro para velas 100x+',
                },
                generalAdvice: {
                  type: Type.STRING,
                  description: 'Recomendação técnica geral para alavancagem de 100x',
                },
                riskWarning: {
                  type: Type.STRING,
                  description: 'Aviso crucial de proteção de capital e saída 1.49x/2.00x',
                },
              },
              required: ['goldenHours', 'generalAdvice', 'riskWarning'],
            },
          },
        });
        responseText = response.text?.trim() || '';
        if (responseText) break;
      } catch (fErr) {
        console.warn(`[forecast-analysis] Fallback do modelo ${m}:`, fErr);
      }
    }

    if (!responseText) {
      throw new Error('Não foi possível auditar os horários de ouro no momento.');
    }

    const parsed = JSON.parse(responseText);
    res.json({ success: true, audit: parsed });
  } catch (err: unknown) {
    console.error('Erro na auditoria de previsões futuras pelo Gemini:', err);
    res.status(500).json({
      error: 'Falha ao processar a auditoria de previsões com a IA.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'calculo-aviator-server',
    time: new Date().toISOString(),
  });
});

// Serve Vite in development, static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server full-stack running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
