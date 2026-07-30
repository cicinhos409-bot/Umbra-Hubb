/**
 * Umbra Hub — PostHog Analytics
 *
 * Ativa com: VITE_POSTHOG_KEY=phc_xxxx no .env
 * Se a chave não estiver definida, todas as funções são no-op silenciosas.
 *
 * Painel: https://app.posthog.com
 */
import posthog from 'posthog-js';

const KEY  = import.meta.env.VITE_POSTHOG_KEY  as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

let initialized = false;

export const initAnalytics = (): void => {
  if (!KEY || initialized) return;
  posthog.init(KEY, {
    api_host: HOST,
    autocapture: false,          // só captura eventos explícitos
    capture_pageview: false,     // controlamos manualmente
    persistence: 'localStorage',
    loaded: () => { initialized = true; },
  });
};

export const identifyUser = (userId: string, properties: {
  email: string;
  tier: string;
  createdAt?: string;
}): void => {
  if (!KEY) return;
  posthog.identify(userId, {
    email:       properties.email,
    tier:        properties.tier,
    created_at:  properties.createdAt,
  });
};

export const resetUser = (): void => {
  if (!KEY) return;
  posthog.reset();
};

export const track = (event: string, properties?: Record<string, unknown>): void => {
  if (!KEY) return;
  posthog.capture(event, properties);
};

// ─── Eventos padronizados ─────────────────────────────────────────────────────

export const trackSignIn  = (tier: string) => track('user_signed_in',  { tier });
export const trackSignOut = ()             => track('user_signed_out');

export const trackToolOpened = (toolId: string, toolName: string, tier: string) =>
  track('tool_opened', { tool_id: toolId, tool_name: toolName, tier });

export const trackTranscriptionCompleted = (fileSizeMb: number) =>
  track('transcription_completed', { file_size_mb: fileSizeMb });

export const trackChannelCreated = () => track('channel_created');
export const trackScriptUploaded = () => track('script_uploaded');
export const trackScriptCopied   = () => track('script_copied');

export const trackSearch = (queryLength: number, resultCount: number) =>
  track('search_performed', { query_length: queryLength, result_count: resultCount });

export const trackExportBackup  = () => track('backup_exported');
export const trackImportBackup  = () => track('backup_imported');

export const trackOnboardingCompleted = () => track('onboarding_completed');
export const trackOnboardingSkipped   = () => track('onboarding_skipped');
