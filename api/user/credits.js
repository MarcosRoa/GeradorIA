// ============================================
// api/user/credits.js
// ENDPOINT: GET /api/user/credits
// ============================================
// api/user/credits.js
import { supabase, getOrCreateUser } from '../_lib/supabase.js';
import { PRO_FIXED_EMAIL, PRO_CREDITS } from '../_lib/constants.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ALLOWED_ORIGIN || 'https://loterias-ia.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    
    const uid = req.query.uid || req.headers['x-user-id'];
    if (!uid) return res.status(400).json({ error: 'UID é obrigatório' });
    
    try {
        const user = await getOrCreateUser(uid, req.headers['x-user-email'], req.headers['x-user-name']);
        
        let credits = user.creditos;
        let isPro = user.is_pro;
        
        // Usuário PRO fixo
        if (user.email === PRO_FIXED_EMAIL) {
            isPro = true;
            if (credits !== PRO_CREDITS) {
                await supabase
                    .from('usuarios')
                    .update({ creditos: PRO_CREDITS, is_pro: true, updated_at: new Date().toISOString() })
                    .eq('uid', uid);
                credits = PRO_CREDITS;
            }
        }
        
        return res.status(200).json({ success: true, credits, isPro });
        
    } catch (error) {
        console.error('Erro em credits:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
