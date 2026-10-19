import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Candle, RadarSignal, AIChartAnalysis } from '../types/aviator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIAssistantPanelProps {
  candles: Candle[];
  currentSignal: RadarSignal;
  onOpenImageScanner: () => void;
  onApplyAIPrediction?: (analysis: AIChartAnalysis) => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  candles,
  currentSignal,
  onOpenImageScanner,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Sou o seu Assistente de IA especialista nos 5 Módulos dos Segredos do Aviator e Mentoria Avançada 82b. Estou monitorando cada rodada em tempo real para aumentar sua assertividade de velas Roxas e Rosas. Como posso ajudar ou prefere que eu faça um diagnóstico agora?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Quick automatic diagnosis of recent table candles
  const analyzeTableWithAI = async (customPrompt?: string) => {
    setIsLoading(true);
    const userPrompt = customPrompt || 'Faça uma análise técnica completa da mesa atual da 82b: identifique o estado (pague/recolhe), gatilhos ativos (como 1.00x, 1.37x, 1.88x ou finais de vela), e qual a probabilidade e o melhor momento para pegar Vela Roxa ou Rosa agora.';

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          currentCandles: candles.slice(-10),
          currentSignal,
        }),
      });

      if (response.status === 404) {
        throw new Error('Serviço de IA não encontrado no servidor (HTTP 404). As funções serverless foram preparadas em /api.');
      }

      const rawText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Serviço de IA temporariamente indisponível. Tente novamente em instantes.');
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Falha ao consultar o assistente de IA.');
      }

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Análise concluída com sucesso.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLastAnalysisTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: unknown) {
      console.error('Erro na resposta do assistente:', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Ocorreu uma oscilação na conexão com a IA. Por favor, tente novamente em alguns instantes.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    const msg = inputMessage.trim();
    setInputMessage('');
    analyzeTableWithAI(msg);
  };

  // Quick prompt chips
  const quickChips = [
    { label: '📊 Analisar Momento da Mesa', prompt: 'Qual é o diagnóstico das últimas rodadas da 82b? A mesa está pagando ou recolhendo?' },
    { label: '🌸 Previsão de Vela Rosa (10x+)', prompt: 'Com base no histórico e ciclo de minutos, qual a probabilidade e o horário estimado para a próxima Vela Rosa?' },
    { label: '⚠️ Alerta de Risco / Final 7', prompt: 'Existe algum padrão de perigo ativo (como final 7 ou onda de azuis) nas últimas rodadas?' },
    { label: '🎯 Estratégia de Mão e Cashout', prompt: 'Como devo fazer a entrada na próxima rodada: quantas mãos, valor e em qual multiplicador colocar o auto cashout?' },
  ];

  // Dynamic status badges
  const recentMultipliers = candles.slice(-5).map((c) => c.multiplier);
  const purpleOrPinkCount = recentMultipliers.filter((m) => m >= 2.0).length;
  const isPayingTable = purpleOrPinkCount >= 2;

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#120726] to-[#0b0417] border border-purple-500/50 shadow-2xl overflow-hidden transition-all duration-300">
      
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-purple-900/60 bg-[#16092e]/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#110521] rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide flex items-center gap-1.5">
                <span>Assistente de IA Especialista</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
                  Gemini 3.8
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-purple-300 font-mono">
              Análise em tempo real dos 5 Módulos e Mentoria Pai do Aviator (82b)
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Direct Button to Send Chart Image */}
          <button
            onClick={onOpenImageScanner}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer transition"
            title="Enviar foto ou print do gráfico real para a IA analisar"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar Print do Gráfico</span>
            <span className="sm:hidden">Print</span>
          </button>

          {/* Minimize / Maximize */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer"
            title={isExpanded ? 'Recolher Assistente' : 'Expandir Assistente'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Real-time Status Card & Image Upload Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Box 1: Estado da Mesa */}
            <div className="p-3 rounded-xl bg-[#0f0520] border border-purple-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Diagnóstico da Mesa</span>
                <span className={`text-sm font-black font-mono ${isPayingTable ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isPayingTable ? '● MESA PAGANTE (FLUXO)' : '⚠️ TRANSIÇÃO / CAUTELA'}
                </span>
              </div>
              <TrendingUp className={`w-5 h-5 ${isPayingTable ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>

            {/* Box 2: Probabilidade IA */}
            <div className="p-3 rounded-xl bg-[#0f0520] border border-purple-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Confiança do Padrão</span>
                <span className="text-sm font-black font-mono text-pink-400">
                  {currentSignal.confidence}% de Assertividade
                </span>
              </div>
              <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>

            {/* Box 3: Botão de Leitor de Imagem */}
            <div 
              onClick={onOpenImageScanner}
              className="p-3 rounded-xl bg-gradient-to-r from-rose-950/60 to-purple-950/60 border border-rose-500/50 hover:border-rose-400 flex items-center justify-between cursor-pointer transition group"
            >
              <div>
                <span className="text-[10px] uppercase font-mono text-rose-300 font-bold block">
                  Leitor de Imagem IA
                </span>
                <span className="text-xs font-bold text-white group-hover:text-pink-300 transition">
                  Analisar Print Real da 82b
                </span>
              </div>
              <Camera className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            </div>

          </div>

          {/* Quick Questions Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-purple-900">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => analyzeTableWithAI(chip.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-[#180b33] hover:bg-purple-900/60 border border-purple-700/50 text-[11px] font-medium text-slate-200 hover:text-white whitespace-nowrap transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="rounded-xl bg-[#0a0314] border border-purple-950 p-3 sm:p-4 max-h-64 sm:max-h-72 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-purple-900">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-pink-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-rose-600 text-white rounded-br-sm'
                      : 'bg-[#150a29] text-slate-200 border border-purple-900/60 rounded-bl-sm shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-line font-sans">{msg.content}</div>
                  <div className="text-[9px] opacity-60 text-right mt-1 font-mono">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-xs text-purple-300">
                <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 text-pink-400 animate-spin" />
                </div>
                <div className="bg-[#150a29] border border-purple-900/60 px-3.5 py-2 rounded-2xl text-xs flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-pink-400 animate-ping"></span>
                  <span>A IA está analisando as velas e calculando as probabilidades...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input & Analyze Button */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Pergunte à IA sobre as rodadas, velas ou estratégias..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#14082b] border border-purple-600/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-sans"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enviar</span>
            </button>

            <button
              type="button"
              onClick={() => analyzeTableWithAI()}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-[#1d0b38] hover:bg-[#250f47] border border-purple-500/60 text-pink-300 font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
              title="Pedir diagnóstico geral automático da IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden md:inline">Análise Geral</span>
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
