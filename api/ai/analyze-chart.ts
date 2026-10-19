import { GoogleGenAI, Type } from '@google/genai';

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

export default async function handler(req: any, res: any) {
  // Setup CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      success: false,
      error: 'A chave GEMINI_API_KEY não está configurada no painel da Vercel. Por favor, adicione GEMINI_API_KEY em Project Settings > Environment Variables no Vercel.',
    });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // fallback
      }
    }

    const { imageBase64, mimeType = 'image/jpeg' } = body || {};

    if (!imageBase64) {
      res.status(400).json({ success: false, error: 'Nenhuma imagem enviada para análise.' });
      return;
    }

    // Clean data URL prefix safely regardless of mime format
    const cleanBase64 = imageBase64.includes(';base64,')
      ? imageBase64.split(';base64,')[1]
      : imageBase64.replace(/^data:[^;]+;base64,/, '');

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Vercel Serverless analyze-chart] Modelo ${modelName} falhou:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Não foi possível obter resposta da IA após tentativas.');
    }

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

    res.status(200).json({ success: true, analysis: parsedJson });
  } catch (err: unknown) {
    console.error('Erro na análise multimodal de imagem na função Vercel:', err);
    res.status(500).json({
      success: false,
      error: 'Falha ao processar a análise da imagem do gráfico.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
