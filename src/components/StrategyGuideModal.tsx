import React from 'react';
import { X, BookOpen, ShieldCheck, Sparkles, Zap, Radio, CheckCircle, AlertTriangle, Calculator, Clock, Award } from 'lucide-react';

interface StrategyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyGuideModal: React.FC<StrategyGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#120824] border border-rose-500/40 p-5 sm:p-7 shadow-2xl relative text-white scrollbar-thin scrollbar-thumb-rose-950">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-rose-950/80">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 via-purple-700 to-amber-600 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-[#120824] rounded-[14px] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-rose-400" />
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-white flex items-center gap-2">
              <span>Segredos do Aviator (Módulos I a V)</span>
              <span className="text-[10px] bg-rose-600/30 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-mono">
                Mentoria Avançada
              </span>
            </h3>
            <p className="text-xs text-rose-300">
              Estudos matemáticos com decimais, gatilhos especiais e regras de ouro
            </p>
          </div>
        </div>

        {/* Modules Section */}
        <div className="mt-5 space-y-4 text-xs">
          
          {/* Module 5 & 3: Subtração de Velas e Decimais */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-purple-500/40 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
              <Calculator className="w-4 h-4 text-purple-400" />
              <span>1. Subtração de Velas e Decimais (Módulo 5 pág. 3 & Módulo 3 pág. 7)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Para calcular o minuto exato com segundos: subtraia os dígitos da parte inteira e os dígitos da parte decimal da última vela alta, e some os resultados.
            </p>
            <div className="p-2.5 rounded-lg bg-[#140828] border border-purple-900/60 font-mono text-purple-200 text-[11px] space-y-1">
              <div>• <strong>Exemplo 1 (Vela 37.89x às 17:02:55):</strong> (7 - 3 = 4) + (9 - 8 = 1) = <strong>+5 minutos</strong> ➔ Entrada às <strong>17:07:55</strong>! Bateu 37.44x às 17:08:40. <em>&quot;Considerar o segundo (55s) faz muita diferença!&quot;</em></div>
              <div>• <strong>Exemplo 2 (Vela 15.36x às 01:05:25):</strong> (5 - 1 = 4) + (6 - 3 = 3) = <strong>+7 minutos</strong> ➔ 01:05 + 7 = <strong>01:12:25</strong>. Bateu 20.45x às 01:12:14!</div>
            </div>
          </div>

          {/* Module 5: 1º Dígito após o Ponto e Dígito da Rodada */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-indigo-500/40 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>2. 1º Dígito após o Ponto & Dígito da Rodada (Módulo 5 pág. 1 e 4)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e0824] border border-indigo-900/60 font-mono text-indigo-200 text-[11px] space-y-1">
              <div>• <strong>1º Dígito após o Ponto:</strong> Vela <strong>10.79x</strong> às 17:01:30 ➔ 1º dígito é <strong>7</strong> ➔ 17:01:30 + 7 min = <strong>17:08:30</strong>! (Bateu 37.44x).</div>
              <div>• <strong>Vela 7.39x às 23:12:54:</strong> 1º dígito é <strong>3</strong> ➔ 23:12:54 + 3 min = <strong>23:15:54</strong>! (Bateu 100.62x às 23:15:55!).</div>
              <div>• <strong>Dígito da Rodada:</strong> Vela 12.56x na Rodada 4310524 (dígito final <strong>4</strong>) às 16:21:23 ➔ 16:21:23 + 4 min = <strong>16:25:23</strong>!</div>
            </div>
          </div>

          {/* Module 4: Tabela de Velas Especiais e Gatilhos */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-rose-500/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>3. Lista de Velas Especiais e Gatilhos (Módulo 4 pág. 9, 26, 27)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              O estudo classifica 5 velas essenciais que quando surgem no gráfico disparam entradas quase automáticas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-[#150725] border border-rose-900/60 text-slate-200">
                <strong className="text-rose-400">• 1.37x:</strong> Mais de 90% de assertividade! Puxa 5x+ e Rosa. O combo <strong>1.00x + 1.37x + 1.00x</strong> puxa Rosa imediata!
              </div>
              <div className="p-2 rounded bg-[#150725] border border-rose-900/60 text-slate-200">
                <strong className="text-amber-400">• 1.00x (Reset):</strong> Puxa 5x+ e 10x em até 10 casas (5ª casa muito assertiva). Duas 1.00x juntas puxam Rosa em 5 entradas!
              </div>
              <div className="p-2 rounded bg-[#150725] border border-rose-900/60 text-slate-200">
                <strong className="text-purple-400">• 1.88x:</strong> Vela especial! Sempre que aparecer fazer 5 entradas fixas com proteção 1.49x buscando 5x e 10x!
              </div>
              <div className="p-2 rounded bg-[#150725] border border-rose-900/60 text-slate-200">
                <strong className="text-sky-400">• 1.11x e 1.99x:</strong> Puxam velas de 2x e 5x+ respectivamente!
              </div>
            </div>
          </div>

          {/* Dica de Ouro 2: Finais de Vela */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>4. Dica de Ouro 2: Análise dos Finais de Vela (Módulo 4 pág. 53)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#180f08] border border-amber-900/60 text-[11px] space-y-1.5 leading-relaxed">
              <div className="text-red-300">• <strong>1. Velas com final 7 (ex: ,x7 como 2.37, 4.17):</strong> 80% de chance de puxar REDs! Não arrisque sua banca após um final 7.</div>
              <div className="text-emerald-300">• <strong>2. Velas com final 1 (ex: ,x1 como 2.31, 3.11):</strong> 80% de chance de puxar 2x+!</div>
              <div className="text-purple-300">• <strong>3. Velas com final 5 (ex: ,x5 como 1.45, 2.75):</strong> Puxa Vela Roxa 2x+!</div>
            </div>
          </div>

          {/* Regra dos 13 & Casas Ímpares */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-teal-500/40 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
              <Award className="w-4 h-4 text-teal-400" />
              <span>5. Regra dos 13 & Casas Ímpares (Módulo 4 pág. 48-49)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Quando sai uma vela alta de <strong>+30x ou 100x+</strong> no Aviator, a plataforma precisa pagar outra vela alta em até <strong>13 casas</strong>.
            </p>
            <div className="p-2.5 rounded-lg bg-[#07161b] border border-teal-900/60 font-mono text-teal-200 text-[11px]">
              • <strong>Casas Ímpares (1, 3, 5, 7, 9, 11, 13):</strong> Têm tendência 95% MAIOR de pagar a vela alta em relação às casas pares!
            </div>
          </div>

          {/* Gestão de Banca e Tabela de Metas */}
          <div className="p-4 rounded-xl bg-[#0a0515] border border-emerald-500/40 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>6. Gestão de Banca Oficial & Saídas no 1.49x e 2.00x</span>
            </div>
            <div className="text-slate-300 leading-relaxed space-y-1">
              <p>• <strong>1ª Entrada (Proteção):</strong> Configure auto-cashout no <strong>1.49x</strong> (se colocou 2x o valor da segunda mão) ou <strong>2.00x</strong> (se valores iguais). Cobre o custo e elimina o risco.</p>
              <p>• <strong>2ª Entrada (Alvo):</strong> Deixe subir no alvo de 5x, 10x ou além.</p>
              <p>• <strong>Máximo 2 Gales:</strong> Nunca insista além de 2 proteções. O gerenciamento de banca é a sua empresa!</p>
              <p>• <strong>Tabela de Metas do Estudo:</strong> R$ 20/dia (R$ 600/mês), R$ 30/dia (R$ 900/mês) ou R$ 50/dia (R$ 1.500/mês).</p>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-rose-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Estudos baseados nas apostilas TNT Telecom & Mentoria Avançada Pai do Aviator</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer"
          >
            Entendi, Voltar ao Radar
          </button>
        </div>

      </div>
    </div>
  );
};
