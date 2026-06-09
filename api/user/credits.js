// ============================================
// api/user/credits.js
// ENDPOINT: GET /api/user/credits
// ============================================
// api/user/credits.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    
    const uid = req.query.uid || req.headers['x-user-id'];
    if (!uid) return res.status(400).json({ error: 'UID é obrigatório' });
    
    try {
        let { data: user, error } = await supabase
            .from('usuarios')
            .select('creditos, is_pro, email')
            .eq('uid', uid)
            .single();
        
        if (error && error.code === 'PGRST116') {
            const email = req.headers['x-user-email'] || `${uid}@temp.com`;
            const nome = req.headers['x-user-name'] || email.split('@')[0];
            
            const { data: newUser, error: insertError } = await supabase
                .from('usuarios')
                .insert({
                    uid, nome, email,
                    creditos: 5,
                    is_pro: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select('creditos, is_pro, email')
                .single();
            
            if (insertError) throw insertError;
            user = newUser;
        } else if (error) {
            throw error;
        }
        
        const PRO_FIXED_EMAIL = 'mresquadriasaluminio@gmail.com';
        let credits = user.creditos;
        let isPro = user.is_pro;
        
        if (user.email === PRO_FIXED_EMAIL) {
            isPro = true;
            if (credits !== 100) {
                await supabase
                    .from('usuarios')
                    .update({ creditos: 100, is_pro: true, updated_at: new Date().toISOString() })
                    .eq('uid', uid);
                credits = 100;
            }
        }
        
        return res.status(200).json({ success: true, credits, isPro });
        
    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({ error: error.message });
    }
}
