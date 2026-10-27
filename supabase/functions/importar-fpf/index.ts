// Edge Function: importa os jogos da equipa a partir de resultados.fpf.pt.
//
// Chamada pela app (editor com sessão iniciada): POST /functions/v1/importar-fpf
//   1. Confirma que quem chama é editor (public.is_editor()).
//   2. Lê definicoes.fpf_equipa_url (página da competição) e fpf_equipa_nome.
//   3. Descobre as séries onde a equipa aparece e lê todas as jornadas dessas séries.
//   4. Cria/atualiza public.jogos por fpf_id (matchId da FPF), com a sessão do editor
//      (RLS e histórico aplicam-se normalmente). Lanches ligados acompanham a data do jogo.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { FPF_ORIGIN, parseCompetition, parseMatches, sectionHasTeam, toJogo } from './parse.js';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const FETCH_TIMEOUT_MS = 15_000;
const MAX_FIXTURES = 60;

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function fetchFpf(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'LanchesFutsal/1.0 (importacao de calendario)', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`FPF respondeu HTTP ${res.status} (${new URL(url).pathname})`);
    return await res.text();
}

/** Só páginas de competição de resultados.fpf.pt (evita pedidos a outros servidores). */
function competitionUrl(raw: string | null): string | null {
    try {
        const u = new URL(raw ?? '');
        if (u.origin !== FPF_ORIGIN || u.pathname !== '/Competition/Details') return null;
        if (!u.searchParams.get('competitionId')) return null;
        return u.href;
    } catch {
        return null;
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    if (req.method !== 'POST') return json({ error: 'Método não suportado.' }, 405);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
        auth: { persistSession: false },
    });

    const { data: isEditor, error: authError } = await db.rpc('is_editor');
    if (authError || isEditor !== true) return json({ error: 'Sem permissão.' }, 403);

    const { data: def, error: defError } = await db.from('definicoes')
        .select('fpf_equipa_url, fpf_equipa_nome').eq('id', 1).single();
    if (defError) return json({ error: 'Não foi possível ler as definições.' }, 500);

    const url = competitionUrl(def.fpf_equipa_url);
    const team = (def.fpf_equipa_nome ?? '').trim();
    if (!url) return json({ error: 'O link FPF tem de ser uma página de competição de resultados.fpf.pt.' }, 400);
    if (!team) return json({ error: 'Define o nome da equipa na FPF nas Opções.' }, 400);

    try {
        const series = parseCompetition(await fetchFpf(url)).filter(s => sectionHasTeam(s.html, team));
        if (!series.length) return json({ error: `A equipa "${team}" não foi encontrada em nenhuma série desta competição.` }, 404);

        const today = new Date();
        const found = new Map<string, Record<string, unknown>>();
        let fixtures = 0;
        for (const s of series) {
            const competicao = [s.fase, s.serie].filter(Boolean).join(' · ');
            for (const fixtureId of s.fixtureIds) {
                if (++fixtures > MAX_FIXTURES) break;
                const html = await fetchFpf(`${FPF_ORIGIN}/Competition/GetClassificationAndMatchesByFixture?fixtureId=${fixtureId}`);
                for (const m of parseMatches(html)) {
                    const jogo = toJogo(m, team, { competicao, today });
                    if (jogo) found.set(jogo.fpf_id as string, jogo);
                }
            }
        }
        const rows = [...found.values()];
        if (!rows.length) return json({ criados: 0, atualizados: 0, series: series.map(s => s.serie) });

        // Mantém a hora já conhecida quando a FPF ainda não a publica
        const { data: existing, error: exError } = await db.from('jogos')
            .select('id, fpf_id, hora').in('fpf_id', rows.map(r => r.fpf_id));
        if (exError) throw exError;
        const byFpf = new Map(existing.map(e => [e.fpf_id, e]));
        rows.forEach(r => { if (!r.hora && byFpf.get(r.fpf_id)?.hora) r.hora = byFpf.get(r.fpf_id)!.hora; });

        const { data: saved, error: upError } = await db.from('jogos')
            .upsert(rows, { onConflict: 'fpf_id' }).select('id, data');
        if (upError) throw upError;

        for (const j of saved) {
            const { error } = await db.from('lanches').update({ data: j.data }).eq('jogo_id', j.id).neq('data', j.data);
            if (error) throw error;
        }

        return json({
            criados: rows.length - byFpf.size,
            atualizados: byFpf.size,
            series: series.map(s => [s.fase, s.serie].filter(Boolean).join(' · ')),
        });
    } catch (err) {
        console.error('importar-fpf:', err);
        return json({ error: 'Falha ao importar da FPF. Tenta mais tarde.' }, 502);
    }
});
