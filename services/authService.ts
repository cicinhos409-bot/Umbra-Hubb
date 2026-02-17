import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

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
                redirectTo: window.location.origin,
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
