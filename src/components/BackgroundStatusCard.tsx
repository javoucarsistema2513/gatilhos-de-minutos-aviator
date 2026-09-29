import React, { useState, useEffect } from 'react';
import { Bell, BellRing, BellOff, Shield, Smartphone, Zap, CheckCircle2 } from 'lucide-react';
import { backgroundService } from '../utils/backgroundNotificationService';

interface BackgroundStatusCardProps {
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

export const BackgroundStatusCard: React.FC<BackgroundStatusCardProps> = ({
  notificationsEnabled,
  onToggleNotifications,
}) => {
  const [isKeepAliveActive, setIsKeepAliveActive] = useState(backgroundService.getIsKeepAliveActive());
  const [testSent, setTestSent] = useState(false);

  const handleToggleKeepAlive = () => {
    const nextState = !isKeepAliveActive;
    const success = backgroundService.toggleBackgroundKeepAlive(nextState);
    setIsKeepAliveActive(success);
  };

  const handleSendTestNotification = () => {
    if (!notificationsEnabled) {
      onToggleNotifications();
      return;
    }
    backgroundService.sendNotification(
      '🚀 Teste de Notificação Radar 82b',
      'As notificações em segundo plano estão ativas e funcionando perfeitamente no seu dispositivo!',
      `test-${Date.now()}`
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="w-full rounded-xl bg-[#0e071e] border border-rose-950/80 p-3.5 sm:p-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Status info */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            notificationsEnabled 
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
          }`}>
            {notificationsEnabled ? (
              <BellRing className="w-4 h-4 animate-bounce" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                Alertas em Segundo Plano:
              </span>
              <span className={`px-2 py-0.2 rounded-full font-mono font-bold text-[10px] ${
                notificationsEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {notificationsEnabled ? 'ATIVADO' : 'DESATIVADO'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {notificationsEnabled 
                ? 'Você recebe notificações com som e vibração antes de cada entrada, mesmo jogando na 82b ou com tela bloqueada.'
                : 'Ative para receber o aviso das velas previstas quando estiver na tela da 82b ou em outro app.'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!notificationsEnabled ? (
            <button
              onClick={onToggleNotifications}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ativar Notificações</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendTestNotification}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                title="Enviar notificação de teste agora"
              >
                {testSent ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Enviado!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-rose-400" />
                    <span>Testar Notificação</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleKeepAlive}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                  isKeepAliveActive
                    ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Mantém o radar 100% acordado no celular ao alternar para o app da 82b"
              >
                <Smartphone className="w-3 h-3 text-purple-400" />
                <span>{isKeepAliveActive ? 'Anti-Pausa Ativo' : 'Anti-Pausa'}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
