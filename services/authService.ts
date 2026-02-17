import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: User;
}

/**
 * Envia um magic link para o email do usuário
 */
export const signInWithEmail = async (email: string): Promise<AuthResponse> => {
    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
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

/**
 * Faz logout do usuário atual
 */
export const signOut = async (): Promise<AuthResponse> => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        return {
            success: true,
            message: 'Logout realizado com sucesso.',
        };
    } catch (error) {
        return {
            success: false,
            message: 'Erro ao fazer logout.',
        };
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
