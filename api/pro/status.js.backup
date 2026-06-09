// ============================================
// api/pro/status.js
// ENDPOINT: GET /api/pro/status
// ============================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fuiaikymhsjdgdhojjhq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aWFpa3ltaHNqZGdkaG9qamhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODI1NTEsImV4cCI6MjA5MzY1ODU1MX0.X9Qa1eJ6ut-QdKEZdjX2Ttm2STgJqOkEdNyohDpH3bk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const uid = req.query.uid || req.headers['x-user-id'];
    if (!uid) {
        return res.status(400).json({ error: 'UID é obrigatório' });
    }

    try {
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('is_pro, pro_expires_at, email')
            .eq('uid', uid)
            .single();

        if (error) {
            // Usuário não encontrado, retorna padrão
            return res.status(200).json({
                success: true,
                isPro: false,
                daysLeft: 0
            });
        }

        const PRO_FIXED_EMAIL = 'mresquadriasaluminio@gmail.com';
        const isProFixed = user.email === PRO_FIXED_EMAIL;

        if (isProFixed) {
            return res.status(200).json({
                success: true,
                isPro: true,
                daysLeft: 365
            });
        }

        let daysLeft = 0;
        if (user.is_pro && user.pro_expires_at) {
            const expiresAt = new Date(user.pro_expires_at);
            const now = new Date();
            daysLeft = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
        }

        return res.status(200).json({
            success: true,
            isPro: user.is_pro || false,
            daysLeft: daysLeft
        });

    } catch (error) {
        console.error('Erro em /pro/status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
