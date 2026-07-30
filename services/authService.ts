import { supabase } from './supabaseClient';
export { supabase };
import type { User } from '@supabase/supabase-js';
import { ToolTier } from '../types';

const getRedirectUrl = () => {
    const isElectron = typeof window !== 'undefined' && ((window as any).electron || window.location.protocol === 'file:');
    return isElectron ? 'http://localhost:3001/auth-callback' : window.location.origin;
};

export interface UserProfile {
    id: string;
    email: string;
    tier: ToolTier;
    updated_at: string;
    nickname?: string;
    avatar_url?: string;
    bio?: string;
    dob?: string;
    banner_color?: string;
    notif_settings?: {
        sound: boolean;
        email: boolean;
        mentions: boolean;
        replies: boolean;
    };
    deactivated?: boolean;
    member_since?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: User;
}

/**
 * Cria uma nova conta com email e senha
 */
export const signUpWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: getRedirectUrl(),
            },
        });

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: 'Conta criada! Verifique seu email para confirmar.',
            user: data.user ?? undefined,
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao criar conta. Tente novamente.',
        };
    }
};

/**
 * Faz login com email e senha
 */
export const signInWithPassword = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: 'Login realizado com sucesso!',
            user: data.user ?? undefined,
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao fazer login. Tente novamente.',
        };
    }
};

/**
 * Faz login com Google OAuth
 */
export const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: getRedirectUrl(),
            },
        });

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: 'Redirecionando para Google...',
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao autenticar com Google. Tente novamente.',
        };
    }
};

/**
 * Envia um magic link para o email do usuário
 */
export const signInWithEmail = async (email: string): Promise<AuthResponse> => {
    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: getRedirectUrl(),
            },
        });

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: 'Magic link enviado! Verifique seu email.',
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao enviar magic link. Tente novamente.',
        };
    }
};

// Chaves de localStorage com dados do usuário que devem ser limpas no logout (seção 8 — LGPD)
const USER_STORAGE_KEYS = [
    'umbra_hub_meus_canais_v5',
    'umbra_prompts_vault_v2',
    'umbra_scout_collections',
    'umbra_scout_config',
    'umbra_search_config_v1',
    'umbra_audios_usage_v2',
    'umbra_active_tab',
];

/**
 * Faz logout do usuário atual e limpa dados locais sensíveis
 */
export const signOut = async (): Promise<AuthResponse> => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, message: error.message };
        }

        // Remove dados do usuário do localStorage (conformidade LGPD)
        USER_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));

        return { success: true, message: 'Logout realizado com sucesso.' };
    } catch (error) {
        return { success: false, message: 'Erro ao fazer logout.' };
    }
};

/**
 * Retorna o usuário atualmente autenticado
 */
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        return null;
    }
};

/**
 * Listener para mudanças no estado de autenticação
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
};

/**
 * Obtém a sessão atual
 */
export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

/**
 * Obtém o perfil do usuário do banco de dados (Comunidade Umbra Z)
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Erro ao buscar perfil:', error.message);
            return null;
        }

        return data as UserProfile;
    } catch (error) {
        return null;
    }
};

/**
 * Atualiza ou cria o perfil do usuário (Comunidade Umbra Z)
 */
export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({ 
                id: userId,
                ...data,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        return !error;
    } catch (error) {
        return false;
    }
};
