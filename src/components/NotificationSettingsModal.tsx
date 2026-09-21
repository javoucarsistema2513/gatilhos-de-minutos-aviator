import React, { useState } from 'react';
import { NotificationLog, NotificationSettings } from '../types';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Radio,
  Send,
  Volume2,
  Webhook,
  X,
} from 'lucide-react';

interface NotificationSettingsModalProps {
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  logs: NotificationLog[];
  onTestTelegram: (token: string, chatId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onTestWebhook: (url: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onRequestBrowserPermissions: () => Promise<boolean>;
  browserPermission: NotificationPermission | 'unsupported';
  isOpen?: boolean;
  onClose?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  logs,
  onTestTelegram,
  onTestWebhook,
  onRequestBrowserPermissions,
  browserPermission,
  isOpen = true,
  onClose,
}) => {
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success?: boolean; text?: string } | null>(null);

  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{ success?: boolean; text?: string } | null>(null);

  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  const handleTelegramTest = async () => {
    if (!settings.telegram.botToken || !settings.telegram.chatId) {
      setTelegramStatus({ success: false, text: 'Preencha o Bot Token e o Chat ID primeiro.' });
      return;
    }
    setTestingTelegram(true);
    setTelegramStatus(null);
    const res = await onTestTelegram(settings.telegram.botToken, settings.telegram.chatId);
    setTestingTelegram(false);
    setTelegramStatus({
      success: res.success,
      text: res.success ? (res.message || 'Mensagem enviada com sucesso ao Telegram!') : (res.error || 'Erro ao conectar ao Telegram.'),
    });
  };

  const handleWebhookTest = async () => {
    if (!settings.webhook.url) {
      setWebhookStatus({ success: false, text: 'Preencha a URL do Webhook primeiro.' });
      return;
    }
    setTestingWebhook(true);
    setWebhookStatus(null);
    const res = await onTestWebhook(settings.webhook.url);
    setTestingWebhook(false);
    setWebhookStatus({
      success: res.success,
      text: res.success ? (res.message || 'Webhook testado com sucesso!') : (res.error || 'Erro ao conectar ao webhook.'),
    });
  };

  if (onClose && !isOpen) return null;

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-600/30 text-pink-400 border border-pink-500/40">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Central de Notificações Instantâneas via API
            </h2>
            <p className="text-xs text-slate-400">
              Conecte o bot do Telegram, Webhook do Discord ou notificações Push no celular/PWA para receber sinais no exato segundo em que o radar identificar uma vela rosa ou roxa.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grid: Telegram API & Webhooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telegram API Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">API do Telegram Bot</h3>
                <p className="text-[11px] text-slate-400">Disparo instantâneo em canais ou no privado</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.telegram.enabled}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    telegram: { ...settings.telegram, enabled: e.target.checked },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Bot Token (API Token)</label>
                <button
                  type="button"
                  onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                  className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Como criar bot grátis?
                </button>
              </div>
              <input
                type="password"
                placeholder="Ex: 7281928392:AAH9f_KzL981j..."
                value={settings.telegram.botToken}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    telegram: { ...settings.telegram, botToken: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chat ID (Seu ID ou ID do Canal / Grupo)
              </label>
              <input
                type="text"
                placeholder="Ex: 123456789 ou -100192837482"
                value={settings.telegram.chatId}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    telegram: { ...settings.telegram, chatId: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none font-mono"
              />
            </div>

            {/* Telegram Guide Accordion */}
            {showTelegramGuide && (
              <div className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5 text-sky-400">
                  <Send className="w-3.5 h-3.5" />
                  Passo a passo rápido (Leva 1 minuto):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                  <li>
                    Abra o Telegram e converse com o <strong>@BotFather</strong>.
                  </li>
                  <li>
                    Envie o comando <code>/newbot</code>, escolha um nome e usuário (terminando em bot).
                  </li>
                  <li>
                    O BotFather enviará seu <strong>HTTP API Token</strong>. Cole-o no campo acima.
                  </li>
                  <li>
                    Dê <code>/start</code> no seu novo bot. Para saber seu Chat ID, consulte o bot <strong>@userinfobot</strong> ou adicione o bot ao seu grupo e use o ID do grupo.
                  </li>
                </ol>
              </div>
            )}

            {/* Signal Filters */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Disparar Notificação Quando:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 rounded-lg bg-slate-950/60 p-2 border border-slate-800/80 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.telegram.notifyOnPink}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        telegram: { ...settings.telegram, notifyOnPink: e.target.checked },
                      })
                    }
                    className="rounded border-slate-700 text-pink-600 focus:ring-pink-500"
                  />
                  <span>🌸 Vela Rosa (10x+)</span>
                </label>

                <label className="flex items-center gap-2 rounded-lg bg-slate-950/60 p-2 border border-slate-800/80 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.telegram.notifyOnPurple}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        telegram: { ...settings.telegram, notifyOnPurple: e.target.checked },
                      })
                    }
                    className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span>🟣 Vela Roxa (2x+)</span>
                </label>

                <label className="flex items-center gap-2 rounded-lg bg-slate-950/60 p-2 border border-slate-800/80 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.telegram.notifyOnSlots !== false}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        telegram: { ...settings.telegram, notifyOnSlots: e.target.checked },
                      })
                    }
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <span>🎰 Slots Assertivos</span>
                </label>
              </div>
            </div>

            {/* Test button & status */}
            <div className="pt-2">
              <button
                id="btn-test-telegram"
                type="button"
                onClick={handleTelegramTest}
                disabled={testingTelegram}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingTelegram ? 'Testando Conexão...' : 'Enviar Mensagem de Teste ao Telegram'}</span>
              </button>

              {telegramStatus && (
                <div
                  className={`mt-2 flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                    telegramStatus.success
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {telegramStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{telegramStatus.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Webhook API & Browser Push Card */}
        <div className="space-y-6">
          {/* Webhook Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <Webhook className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Webhook Personalizado / Discord</h3>
                  <p className="text-[11px] text-slate-400">Integração com Discord, n8n, Zapier ou Servidor Próprio</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.webhook.enabled}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      webhook: { ...settings.webhook, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                URL do Webhook (POST JSON)
              </label>
              <input
                type="text"
                placeholder="https://discord.com/api/webhooks/... ou https://seu-endpoint.com"
                value={settings.webhook.url}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    webhook: { ...settings.webhook, url: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Disparar Webhook Quando:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 rounded-lg bg-slate-950/60 p-2 border border-slate-800/80 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.webhook.notifyOnPink}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        webhook: { ...settings.webhook, notifyOnPink: e.target.checked },
                      })
                    }
                    className="rounded border-slate-700 text-pink-600 focus:ring-pink-500"
                  />
                  <span>🌸 Vela Rosa</span>
                </label>

                <label className="flex items-center gap-2 rounded-lg bg-slate-950/60 p-2 border border-slate-800/80 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.webhook.notifyOnPurple}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        webhook: { ...settings.webhook, notifyOnPurple: e.target.checked },
                      })
                    }
                    className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span>🟣 Vela Roxa</span>
                </label>

                <label className="flex items-center gap-2 rounded-lg bg-slate-950/60 p-2 border border-slate-800/80 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.webhook.notifyOnSlots !== false}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        webhook: { ...settings.webhook, notifyOnSlots: e.target.checked },
                      })
                    }
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <span>🎰 Slots Assertivos</span>
                </label>
              </div>
            </div>

            <button
              id="btn-test-webhook"
              type="button"
              onClick={handleWebhookTest}
              disabled={testingWebhook}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 py-2.5 text-xs font-bold text-white hover:bg-purple-600 transition disabled:opacity-50"
            >
              <Webhook className="w-3.5 h-3.5" />
              <span>{testingWebhook ? 'Despachando...' : 'Testar Disparo do Webhook'}</span>
            </button>

            {webhookStatus && (
              <div
                className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                  webhookStatus.success
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                }`}
              >
                {webhookStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{webhookStatus.text}</span>
              </div>
            )}
          </div>

          {/* Browser / PWA Push Notification Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Notificações no Dispositivo (PWA)</h3>
                  <p className="text-[11px] text-slate-400">Alertas na barra de notificações e vibração</p>
                </div>
              </div>

              <span
                className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                  browserPermission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {browserPermission === 'granted' ? 'Autorizado' : 'Requer Permissão'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-300">
                Permitir notificações do sistema operacional quando o app estiver minimizado.
              </div>

              <button
                onClick={onRequestBrowserPermissions}
                className="shrink-0 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 transition"
              >
                {browserPermission === 'granted' ? 'Permitido ✅' : 'Ativar Notificações'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Histórico de Alertas Despachados em Tempo Real
              </h3>
              <p className="text-[11px] text-slate-400">
                Registro de todas as notificações enviadas para Telegram, Webhook e Dispositivo
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Total: {logs.length} disparos
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhuma notificação enviada ainda. Assim que uma vela rosa ou roxa acionar o radar, os registros aparecerão aqui.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-3 py-2">Horário</th>
                  <th className="px-3 py-2">Canal</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Título do Sinal</th>
                  <th className="px-3 py-2">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          log.channel === 'telegram'
                            ? 'bg-sky-500/20 text-sky-300'
                            : log.channel === 'webhook'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-pink-500/20 text-pink-300'
                        }`}
                      >
                        {log.channel}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Enviado
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">
                      {log.title}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 truncate max-w-xs">
                      {log.message.replace(/<[^>]*>?/gm, '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
