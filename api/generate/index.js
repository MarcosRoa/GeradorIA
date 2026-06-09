// api/generate/index.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LOTTERY_CONFIGS = {
    megasena: { maxNumero: 60, numerosPadrao: 6 },
    quina: { maxNumero: 80, numerosPadrao: 5 },
    lotofacil: { maxNumero: 25, numerosPadrao: 15 },
    lotomania: { maxNumero: 99, numerosPadrao: 50 },
    duplasena: { maxNumero: 50, numerosPadrao: 6 },
    timemania: { maxNumero: 80, numerosPadrao: 10 },
    milionaria: { maxNumero: 50, numerosPadrao: 6 },
    loteca: { maxNumero: 3, numerosPadrao: 14 },
    diadesorte: { maxNumero: 31, numerosPadrao: 7 },
    supersete: { maxNumero: 9, numerosPadrao: 7 }
};

function gerarJogo(config, quantidade) {
    const numeros = new Set();
    const min = 1;
    const max = config.maxNumero;
    
    while (numeros.size < quantidade) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        numeros.add(num);
    }
    return Array.from(numeros).sort((a, b) => a - b);
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { uid, lottery, quantity, extraNumbers } = req.body;
    
    if (!uid || !lottery || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const config = LOTTERY_CONFIGS[lottery];
    if (!config) {
        return res.status(400).json({ error: 'Invalid lottery' });
    }
    
    try {
        // Buscar usuário
        const { data: user, error: userError } = await supabase
            .from('usuarios')
            .select('creditos, is_pro, email')
            .eq('uid', uid)
            .single();
        
        if (userError) throw userError;
        
        const numerosPorJogo = extraNumbers || config.numerosPadrao;
        const isProFixed = user.email === 'mresquadriasaluminio@gmail.com';
        const custoPorJogo = isProFixed ? 0 : (user.is_pro ? 2 : 3);
        const custoTotal = quantity * custoPorJogo;
        
        // Verificar saldo
        if (custoTotal > 0 && user.creditos < custoTotal) {
            return res.status(402).json({ error: 'Saldo insuficiente' });
        }
        
        // Gerar jogos
        const jogos = [];
        for (let i = 0; i < quantity; i++) {
            jogos.push(gerarJogo(config, numerosPorJogo));
        }
        
        // Atualizar créditos
        let novoSaldo = user.creditos;
        if (custoTotal > 0) {
            novoSaldo = user.creditos - custoTotal;
            await supabase
                .from('usuarios')
                .update({ creditos: novoSaldo, updated_at: new Date().toISOString() })
                .eq('uid', uid);
        }
        
        return res.status(200).json({
            success: true,
            games: jogos,
            creditsSpent: custoTotal,
            creditsRemaining: novoSaldo
        });
        
    } catch (error) {
        console.error('Erro:', error);
        return res.status(500).json({ error: error.message });
    }
}
