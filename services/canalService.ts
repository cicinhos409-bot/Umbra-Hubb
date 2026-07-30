/**
 * Canal Service — sincronização cloud + export/import de Meus Canais
 *
 * Para ativar sincronização cloud, execute este SQL no Supabase Dashboard:
 *
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS canais_data JSONB;
 *
 * Sem isso, o app continua funcionando 100% via localStorage (fallback automático).
 */
import { supabase } from './supabaseClient';

export interface CanalData {
  folders: unknown[];
  channels: unknown[];
}

// ─── Cloud Sync ──────────────────────────────────────────────────────────────

export const saveToCloud = async (userId: string, data: CanalData): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, canais_data: data, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    if (error) console.warn('[CanalService] Cloud save falhou (coluna canais_data existe?):', error.message);
    return !error;
  } catch {
    return false;
  }
};

export const loadFromCloud = async (userId: string): Promise<CanalData | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('canais_data')
      .eq('id', userId)
      .single();

    if (error || !data?.canais_data) return null;
    return data.canais_data as CanalData;
  } catch {
    return null;
  }
};

// ─── Export / Import JSON ────────────────────────────────────────────────────

export const exportJSON = (data: CanalData): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `umbra-canais-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importJSON = (file: File): Promise<CanalData> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data.folders) || !Array.isArray(data.channels)) {
          throw new Error('Formato inválido');
        }
        resolve(data as CanalData);
      } catch {
        reject(new Error('Arquivo inválido. Use um backup exportado pelo Umbra Hub.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsText(file);
  });
