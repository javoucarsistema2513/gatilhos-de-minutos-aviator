import { GoogleGenAI, Type } from '@google/genai';

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
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY não configurada no ambiente.',
    });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { horizon = '7H', scheduledSignals = [], latestCandles = [] } = body || {};

    const promptText = `
Você é o Auditor Mestre de Algoritmos da 82b e Spribe Aviator.
Analise a grade futura de horários de velas rosas/altas previstas para o horizonte de ${horizon}.
Velas recentes do histórico da mesa: ${latestCandles.slice(-8).map((c: any) => `${c.multiplier?.toFixed(2)}x`).join(', ') || 'Sem dados recentes'}.
Grade de sinais agendados (amostra dos próximos 10): ${JSON.stringify(scheduledSignals.slice(0, 10))}.

Emita uma auditoria profunda contendo:
1. "overallConfidence": índice geral de assertividade da grade futura (ex: 98.4%).
2. "bestHotZones": 3 janelas horárias com maior probabilidade de velas 50x+ e 100x+.
3. "trapAlerts": momentos de recolhe iminente ou pós-pague que devem ser evitados.
4. "mentoriaKeyAdvice": conselho direto do Mestre Ronaldo Torres para este turno operacional.
5. "recommendedStrategy": instrução de stake e auto-cashout (1ª mão 1.49x, 2ª mão buscar rosa).
`;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
                overallConfidence: { type: Type.NUMBER, description: 'Porcentagem de confiança geral (ex: 98.7)' },
                bestHotZones: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'As 3 melhores janelas horárias de ouro',
                },
                trapAlerts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Horários de risco ou armadilhas da casa',
                },
                mentoriaKeyAdvice: { type: Type.STRING, description: 'Conselho prático da Mentoria Pai do Aviator' },
                recommendedStrategy: { type: Type.STRING, description: 'Estratégia de banca e saídas recomendada' },
              },
              required: ['overallConfidence', 'bestHotZones', 'trapAlerts', 'mentoriaKeyAdvice', 'recommendedStrategy'],
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
    res.status(200).json({ success: true, audit: parsed });
  } catch (err: unknown) {
    console.error('Erro na auditoria de previsões futuras pelo Gemini:', err);
    res.status(500).json({
      error: 'Falha ao processar a auditoria de previsões com a IA.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
