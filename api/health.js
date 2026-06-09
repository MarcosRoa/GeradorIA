// api/health.js
import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
    let dbStatus = 'down';
    
    try {
        const { error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
        if (!error) dbStatus = 'up';
    } catch (err) {
        console.error('Health check error:', err);
    }
    
    res.status(dbStatus === 'up' ? 200 : 503).json({
        status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbStatus
    });
}
