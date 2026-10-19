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

export async function runClientImageAnalysis(imageBase64: string, mimeType: string = 'image/jpeg') {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

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
   - Identifique e extraia o NÚMERO / ID DA RODADA se visível na imagem.
   - Verifique a PARIDADE DA RODADA (Par ou Ímpar): Casas ÍMPARES (1, 3, 5, 7, 9, 11, 13) pagam velas altas em 95% dos ciclos!

2. VERIFICAÇÃO OBRIGATÓRIA DOS DECIMAIS (CASA DECIMAL E CENTÉSIMO):
   - Extraia cada multiplicador com seu DECIMAL EXATO até os centésimos (ex: 2.37x, 14.82x, 1.11x, 1.77x, 10.45x). NÃO ARREDONDE!
   - Separe a parte inteira e a parte decimal de cada vela.
   - Analise o CENTÉSIMO (último dígito decimal):
     * Final 7: 80% CHANCE DE RED (Recolhe).
     * Final 1: 80% de puxar vela Roxa 2.00x+.
     * Final 5: Puxa vela Roxa 2.00x+.
   - Aplique a Regra da SUBTRAÇÃO DECIMAL (Módulo 5 pág. 3) na última vela alta para prever o próximo minuto exato:
     * Fórmula: |Parte Inteira - Parte Decimal| -> se der 2 dígitos, somar os algarismos -> minuto resultante da entrada.
`;

  const models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
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
                description: 'Lista de multiplicadores lidos na imagem',
              },
              tableState: { type: Type.STRING },
              dominantPattern: { type: Type.STRING },
              targetCandle: { type: Type.STRING },
              targetMultiplier: { type: Type.STRING },
              projectedTime: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              keyFindings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              entryStrategy: { type: Type.STRING },
              protectionAdvice: { type: Type.STRING },
              warningAlert: { type: Type.STRING },
              roundDetails: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    roundNumber: { type: Type.STRING },
                    multiplier: { type: Type.NUMBER },
                    fullText: { type: Type.STRING },
                    integerPart: { type: Type.NUMBER },
                    decimalPart: { type: Type.NUMBER },
                    finalDigit: { type: Type.NUMBER },
                    finalDigitAnalysis: { type: Type.STRING },
                    parity: { type: Type.STRING },
                    color: { type: Type.STRING },
                  },
                },
              },
              decimalFormula: {
                type: Type.OBJECT,
                properties: {
                  sourceCandle: { type: Type.NUMBER },
                  integerPart: { type: Type.NUMBER },
                  decimalPart: { type: Type.NUMBER },
                  subtractionMath: { type: Type.STRING },
                  projectedMinute: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
              },
              roundVerification: {
                type: Type.OBJECT,
                properties: {
                  latestRoundId: { type: Type.STRING },
                  totalRoundsDetected: { type: Type.NUMBER },
                  roundParity: { type: Type.STRING },
                  imparAdvantageRule: { type: Type.STRING },
                  decimalsValidated: { type: Type.BOOLEAN },
                  auditVerdict: { type: Type.STRING },
                },
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

      const text = response.text?.trim() || '';
      if (text) {
        return JSON.parse(text);
      }
    } catch (e) {
      console.warn(`[ClientGeminiFallback] Modelo ${model} falhou:`, e);
    }
  }

  return null;
}
