// api/payments/webhook.js
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || 'sua-chave-secreta-aqui';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { action, data } = req.body;
    
    if (action !== 'payment.created') {
        return res.status(200).json({ message: 'Ignored' });
    }
    
    const userId = data.external_reference;
    const amount = data.transaction_amount;
    
    if (!userId) {
        return res.status(400).json({ error: 'Missing user reference' });
    }
    
    try {
        const { data: user } = await supabase
            .from('usuarios')
            .select('creditos')
            .eq('uid', userId)
            .single();
        
        const novoSaldo = (user?.creditos || 0) + amount;
        
        await supabase
            .from('usuarios')
            .update({ creditos: novoSaldo })
            .eq('uid', userId);
        
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Internal error' });
    }
}
