/**
 * Umbra Hub — Sentry Error Tracking
 *
 * Ativa com: VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx no .env
 * Se o DSN não estiver definido, todas as funções são no-op silenciosas.
 *
 * Painel: https://sentry.io
 */
import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export const initSentry = (): void => {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment:       import.meta.env.MODE,          // 'production' | 'development'
    release:           import.meta.env.VITE_APP_VERSION ?? 'umbra-hub@1.0.0',
    tracesSampleRate:  0.1,   // 10% das transações — ajuste conforme volume
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false }),
    ],
  });
};

export const setSentryUser = (id: string, email: string, tier: string): void => {
  if (!DSN) return;
  Sentry.setUser({ id, email, tier } as Sentry.User & { tier: string });
};

export const clearSentryUser = (): void => {
  if (!DSN) return;
  Sentry.setUser(null);
};

export const captureError = (error: unknown, context?: Record<string, unknown>): void => {
  if (!DSN) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, unknown>): void => {
  if (!DSN) return;
  Sentry.addBreadcrumb({ message, category, data, level: 'info' });
};

// Re-exporta ErrorBoundary para uso direto nos componentes
export { Sentry };
