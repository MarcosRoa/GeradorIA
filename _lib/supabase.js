// ============================================
// BLOCO: SUPABASE CLIENT (SERVICE ROLE)
// FUNÇÃO: Conexão com Supabase usando Service Role
// SEGURANÇA: NUNCA exponha no frontend!
// ============================================
// api/_lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
}

// Cliente com Service Role (apenas para backend)
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Função para buscar ou criar usuário
export async function getOrCreateUser(uid, email = null, nome = null) {
    const { data: user, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();
    
    if (user) return user;
    
    if (error && error.code !== 'PGRST116') throw error;
    
    const { PRO_FIXED_EMAIL, DEFAULT_CREDITS, PRO_CREDITS } = await import('./constants.js');
    
    const userEmail = email || `${uid}@temp.com`;
    const userName = nome || userEmail.split('@')[0];
    const isProFixed = userEmail === PRO_FIXED_EMAIL;
    
    const { data: newUser, error: insertError } = await supabase
        .from('usuarios')
        .insert({
            uid,
            nome: userName,
            email: userEmail,
            creditos: isProFixed ? PRO_CREDITS : DEFAULT_CREDITS,
            is_pro: isProFixed,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
    
    if (insertError) throw insertError;
    return newUser;
}
