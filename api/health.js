// api/health.js
// api/health.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    let dbStatus = 'down';
    let latency = 0;
    
    try {
        const start = Date.now();
        const { error } = await supabase
            .from('usuarios')
            .select('count', { count: 'exact', head: true });
        
        latency = Date.now() - start;
        if (!error) dbStatus = 'up';
    } catch (err) {
        console.error('Health check error:', err);
    }
    
    res.status(dbStatus === 'up' ? 200 : 503).json({
        status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: { status: dbStatus, latency },
        api: { status: 'up' }
    });
}
