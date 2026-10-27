// Leitura das páginas HTML de resultados.fpf.pt (sem dependências; usado pela Edge Function e pelos testes).
//
// Estrutura observada (Competition/Details):
//   <div class="accordion-title">…1ª FASE…</div>
//   <div class="game-results" id="htmlSerieId_100559"> … <span>SÉRIE 1</span> …
//     <a … href=".../Competition/GetClassificationAndMatchesByFixture?fixtureId=684349">1</a> …
//     <div id="classificationMatchSection_100559"> classificação + jogos da jornada atual </div>
// Jogos (Competition/GetClassificationAndMatchesByFixture e secção acima):
//   <a class="game-link" href=".../Match/GetMatchInformation?matchId=2709503">
//     <div class="home-team …">Carregado</div>
//     <div class="score …"><span>1 - 12</span><span class="game-schedule">24 out</span></div>
//     <div class="away-team …">Patameiras "B"</div>
//     <small …>Pavilhão …</small>
//   </a>

export const FPF_ORIGIN = 'https://resultados.fpf.pt';

const MONTHS = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
        if (e[0] === '#') {
            const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : m;
        }
        return ENTITIES[e.toLowerCase()] ?? m;
    });
}

/** Texto visível de um fragmento HTML, com espaços normalizados. */
export function text(html) {
    return decodeEntities(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function normalizeName(s) {
    return text(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Séries da página da competição: [{ serieId, fase, serie, fixtureIds, html }]. */
export function parseCompetition(html) {
    const starts = [...html.matchAll(/id="htmlSerieId_(\d+)"/g)].map(m => ({ id: m[1], index: m.index }));
    return starts.map((s, i) => {
        const section = html.slice(s.index, i + 1 < starts.length ? starts[i + 1].index : html.length);
        const before = html.slice(0, s.index);
        const faseMatches = [...before.matchAll(/class="accordion-title[^"]*"[^>]*>([\s\S]*?)<span class="arrow"/g)];
        const serieMatch = /<div class="tag">[\s\S]*?<span>([\s\S]*?)<\/span>/.exec(section);
        const fixtureIds = [...new Set([...section.matchAll(/GetClassificationAndMatchesByFixture\?fixtureId=(\d+)/g)].map(m => m[1]))];
        return {
            serieId: s.id,
            fase: faseMatches.length ? text(faseMatches[faseMatches.length - 1][1]) : '',
            serie: serieMatch ? text(serieMatch[1]) : '',
            fixtureIds,
            html: section,
        };
    });
}

/** A equipa aparece na classificação/jogos desta série? (comparação exata do nome) */
export function sectionHasTeam(sectionHtml, team) {
    const target = normalizeName(team);
    return [...sectionHtml.matchAll(/<div class="[^"]*\b(?:home-team|away-team|no-padding)\b[^"]*"[^>]*>([^<]*)<\/div>/g)]
        .some(m => normalizeName(m[1]) === target);
}

/** Jogos de um fragmento HTML: [{ matchId, url, home, away, score, schedule, stadium }]. */
export function parseMatches(html) {
    return [...html.matchAll(/<a class="game-link" href="([^"]*GetMatchInformation\?matchId=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)]
        .map(([, href, matchId, body]) => {
            const pick = re => { const m = re.exec(body); return m ? text(m[1]) : ''; };
            return {
                matchId,
                url: `${FPF_ORIGIN}/Match/GetMatchInformation?matchId=${matchId}`,
                home: pick(/class="home-team[^"]*"[^>]*>([\s\S]*?)<\/div>/),
                away: pick(/class="away-team[^"]*"[^>]*>([\s\S]*?)<\/div>/),
                score: pick(/class="score[^"]*"[^>]*>\s*<span>([\s\S]*?)<\/span>/),
                schedule: pick(/class="game-schedule"[^>]*>([\s\S]*?)<\/span>/),
                stadium: pick(/<small[^>]*>([\s\S]*?)<\/small>/),
            };
        });
}

/**
 * Ano de um "dd mmm" sem ano: as épocas vão de agosto a julho.
 * `today` = Date de referência (a época em curso é a que contém `today`).
 */
export function inferYear(month, today) {
    const y = today.getFullYear();
    const seasonStart = today.getMonth() + 1 >= 8 ? y : y - 1;
    return month >= 8 ? seasonStart : seasonStart + 1;
}

/** Converte um jogo da FPF numa linha de public.jogos, ou null se a equipa não joga / sem data. */
export function toJogo(match, team, { competicao, today }) {
    const t = normalizeName(team);
    const casa = normalizeName(match.home) === t;
    const fora = normalizeName(match.away) === t;
    if (!casa && !fora) return null;
    const adversario = casa ? match.away : match.home;
    if (!adversario || /^isento\b/i.test(adversario)) return null;

    const both = `${match.schedule} ${match.score}`;
    const dm = /(\d{1,2})\s+([a-zç]{3})/i.exec(both);
    const month = dm ? MONTHS[dm[2].toLowerCase()] : null;
    if (!dm || !month) return null;
    const day = Number(dm[1]);
    const year = inferYear(month, today);
    const data = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const hm = /\b(\d{1,2}):(\d{2})\b/.exec(both);
    const sc = /^(\d+)\s*-\s*(\d+)$/.exec(match.score);
    return {
        fpf_id: match.matchId,
        data,
        hora: hm ? `${hm[1].padStart(2, '0')}:${hm[2]}` : null,
        adversario: adversario.slice(0, 100),
        casa,
        local: match.stadium.slice(0, 150),
        competicao: competicao.slice(0, 100),
        resultado: sc ? `${sc[1]}-${sc[2]}` : '',
        fpf_url: match.url,
    };
}
