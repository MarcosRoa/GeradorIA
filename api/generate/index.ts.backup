// api/generate/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://fuiaikymhsjdgdhojjhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aWFpa3ltaHNqZGdkaG9qamhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODI1NTEsImV4cCI6MjA5MzY1ODU1MX0.X9Qa1eJ6ut-QdKEZdjX2Ttm2STgJqOkEdNyohDpH3bk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOTTERY_CONFIGS: Record<string, { maxNumero: number; numerosPadrao: number; incluiZero: boolean }> = {
    megasena: { maxNumero: 60, numerosPadrao: 6, incluiZero: false },
    quina: { maxNumero: 80, numerosPadrao: 5, incluiZero: false },
    lotofacil: { maxNumero: 25, numerosPadrao: 15, incluiZero: false },
    lotomania: { maxNumero: 99, numerosPadrao: 50, incluiZero: true },
    duplasena: { maxNumero: 50, numerosPadrao: 6, incluiZero: false },
    timemania: { maxNumero: 80, numerosPadrao: 10, incluiZero: false },
    milionaria: { maxNumero: 50, numerosPadrao: 6, incluiZero: false },
    loteca: { maxNumero: 3, numerosPadrao: 14, incluiZero: true },
    diadesorte: { maxNumero: 31, numerosPadrao: 7, incluiZero: false },
    supersete: { maxNumero: 9, numerosPadrao: 7, incluiZero: true }
};

const lotteryCache = new Map<string, number[][]>();

class SimpleLotteryAI {
    private dados: number[][];
    private maxNumero: number;
    private treinado: boolean = false;

    constructor(dados: number[][], maxNumero: number) {
        this.dados = dados;
        this.maxNumero = maxNumero;
    }

    treinar(): boolean {
        this.treinado = this.dados.length >= 10;
        return this.treinado;
    }

    predizerIAEspecialista(qtd: number, usarDispersao: boolean, windowDispersao: number, seed: number): number[] {
        const numeros = new Set<number>();
        const minNumero = 1;
        
        while (numeros.size < qtd) {
            const num = Math.floor(Math.random() * (this.maxNumero - minNumero + 1)) + minNumero;
            numeros.add(num);
        }
        
        return Array.from(numeros).sort((a, b) => a - b);
    }
}

async function loadLotteryData(lottery: string): Promise<number[][]> {
    if (lotteryCache.has(lottery)) {
        return lotteryCache.get(lottery)!;
    }
    
    try {
        const response = await fetch(`https://loterias-ia.vercel.app/csv/${lottery}.csv`);
        if (!response.ok) return [];
        
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('Data'));
        const sep = lines[0]?.includes(';') ? ';' : ',';
        const dados: number[][] = [];
        
        for (const line of lines) {
            const cols = line.split(sep);
            let startIdx = 0;
            
            for (let i = 0; i < cols.length; i++) {
                if (/^\d{2}\/\d{2}\/\d{4}/.test(cols[i].trim())) {
                    startIdx = i + 1;
                    break;
                }
            }
            
            const numeros: number[] = [];
            for (let i = startIdx; i < cols.length; i++) {
                const num = parseInt(cols[i].trim());
                if (!isNaN(num)) numeros.push(num);
            }
            
            if (numeros.length > 0) {
                dados.push(numeros);
            }
        }
        
        lotteryCache.set(lottery, dados);
        return dados;
        
    } catch (error) {
        console.error(`Erro ao carregar ${lottery}:`, error);
        return [];
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const uid = req.body.uid || req.headers['x-user-id'];
    if (!uid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { lottery, quantity, mode, extraNumbers } = req.body;
    
    if (!lottery || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (quantity < 1 || quantity > 20) {
        return res.status(400).json({ error: 'Quantity must be between 1 and 20' });
    }
    
    const config = LOTTERY_CONFIGS[lottery];
    if (!config) {
        return res.status(400).json({ error: 'Invalid lottery' });
    }
    
    try {
        const { data: user, error: userError } = await supabase
            .from('usuarios')
            .select('is_pro, creditos')
            .eq('uid', uid)
            .single();
        
        if (userError && userError.code !== 'PGRST116') {
            return res.status(500).json({ error: 'Database error' });
        }
        
        const numerosPorJogo = extraNumbers || config.numerosPadrao;
        const isBolao = numerosPorJogo > config.numerosPadrao;
        
        if (isBolao && (!user || !user.is_pro)) {
            return res.status(403).json({ error: 'Modo Bolão é exclusivo para assinantes PRO' });
        }
        
        const lotteryData = await loadLotteryData(lottery);
        const ai = new SimpleLotteryAI(lotteryData, config.maxNumero);
        ai.treinar();
        
        const jogosGerados: number[][] = [];
        for (let i = 0; i < quantity; i++) {
            const numeros = ai.predizerIAEspecialista(numerosPorJogo, true, 15, i);
            jogosGerados.push(numeros.sort((a, b) => a - b));
        }
        
        const cost = quantity * 3;
        const idempotencyKey = crypto
            .createHash('sha256')
            .update(`${uid}-${lottery}-${quantity}-${Date.now()}`)
            .digest('hex');
        
        const { data: rpcResult, error: rpcError } = await supabase.rpc('generate_game', {
            p_user_uid: uid,
            p_lottery: lottery,
            p_games: jogosGerados,
            p_cost: cost,
            p_mode: mode || 'ia_especialista',
            p_extra_numbers: numerosPorJogo,
            p_idempotency_key: idempotencyKey
        });
        
        if (rpcError) {
            if (rpcError.message?.includes('Saldo insuficiente')) {
                return res.status(402).json({ error: rpcError.message });
            }
            return res.status(500).json({ error: 'Erro ao processar geração' });
        }
        
        return res.status(200).json({
            success: true,
            games: jogosGerados,
            creditsSpent: cost,
            creditsRemaining: rpcResult.new_balance,
            gameId: rpcResult.game_id,
            idempotencyKey
        });
        
    } catch (error) {
        console.error('Error in /generate:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
