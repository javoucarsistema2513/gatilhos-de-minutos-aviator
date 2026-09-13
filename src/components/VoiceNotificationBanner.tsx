import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { notificationService, NotificationStatus } from '../utils/notifications';
import { soundEffects } from '../utils/audio';

interface VoiceNotificationBannerProps {
  onUnlockAudio: () => void;
}

export const VoiceNotificationBanner: React.FC<VoiceNotificationBannerProps> = ({
  onUnlockAudio,
}) => {
  const [notifStatus, setNotifStatus] = useState<NotificationStatus>('default');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(soundEffects.voiceEnabled);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [showDismiss, setShowDismiss] = useState<boolean>(false);

  useEffect(() => {
    setNotifStatus(notificationService.getStatus());
  }, []);

  const handleRequestNotif = async () => {
    const status = await notificationService.requestPermission();
    setNotifStatus(status);
    // Também desbloqueia a voz no mesmo clique do usuário
    onUnlockAudio();
  };

  const handleTestVoiceAndAudio = () => {
    setIsTesting(true);
    onUnlockAudio();
    soundEffects.playPrepareWarning();
    soundEffects.speakVoice('Atenção: Teste de voz do Betão! Entrada confirmada no minuto alvo.');
    setTimeout(() => setIsTesting(false), 2000);
  };

  const handleTestBackgroundNotif = () => {
    notificationService.sendNotification({
      title: '🎯 [TESTE BETÃO] Notificação em 2º Plano Ativa!',
      body: 'Perfeito! Seus alertas chegarão aqui na tela mesmo quando você estiver jogando no Betão.',
      tag: 'betao-test-notif',
      requireInteraction: true,
      renotify: true,
    });
  };

  const isGranted = notifStatus === 'granted';

  return (
    <div
      id="voice-notification-banner"
      className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-[#1A1208]/90 via-[#15100B]/90 to-[#120F1C]/90 p-3.5 sm:p-4 shadow-xl backdrop-blur-md"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Lado Esquerdo: Info e Status */}
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
              isGranted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
            }`}
          >
            {isGranted ? (
              <Bell className="w-5 h-5 text-emerald-400" />
            ) : (
              <Smartphone className="w-5 h-5 text-amber-400" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Alertas em Segundo Plano & Voz Ativa
              </span>

              {isGranted ? (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  SEGUNDO PLANO ATIVADO
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  PERMISSÃO PENDENTE
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Receba os alertas sonoros, fala por voz e notificações na tela do celular/PC mesmo enquanto estiver na aba do Betão!
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {/* Botão de Ativar Notificação se ainda não permitido */}
          {!isGranted ? (
            <button
              id="enable-notifications-btn"
              onClick={handleRequestNotif}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/30 active:scale-95 transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ativar Notificações 2º Plano</span>
            </button>
          ) : (
            <button
              id="test-notification-btn"
              onClick={handleTestBackgroundNotif}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
              title="Testar notificação nativa"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              <span>Testar Notificação</span>
            </button>
          )}

          {/* Botão Testar / Desbloquear Voz */}
          <button
            id="test-voice-btn"
            onClick={handleTestVoiceAndAudio}
            disabled={isTesting}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition flex items-center gap-1.5"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
            <span>{isTesting ? 'Falando...' : '🔊 Testar Voz do Betão'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
