// Conversão dos jogos recolhidos em resultados.fpf.pt (pelo bookmarklet, ver bookmarklet.js)
// em linhas de public.jogos. Sem dependências; usado pela app e pelos testes.
//
// Cada jogo recolhido tem a forma:
//   { fixtureId: '684350', matchId: '2709570' | '', home: 'Vilafranquense', away: 'Carregado',
//     score: '1 - 12' | '', schedule: '1 nov 09:00', stadium: 'Pavilhão …', competicao: '1ª FASE · SÉRIE 1' }
// Jogos ainda por jogar não têm matchId (o site só cria o link da ficha depois do jogo),
// por isso a chave estável é a jornada + equipas: ver gameKey().

export const FPF_ORIGIN = 'https://resultados.fpf.pt';

const MONTHS = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };

/** Texto com espaços normalizados. */
export function text(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
}

export function normalizeName(s) {
    return text(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Chave estável de um jogo na FPF (public.jogos.fpf_id): jornada + equipa da casa + equipa de fora. */
export function gameKey(fixtureId, home, away) {
    return `f${fixtureId}:${normalizeName(home)}|${normalizeName(away)}`.slice(0, 250);
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

/** Converte um jogo recolhido numa linha de public.jogos, ou null se a equipa não joga / dados inválidos. */
export function toJogo(match, team, { today }) {
    if (!match || !/^\d{1,12}$/.test(String(match.fixtureId || ''))) return null;
    const matchId = String(match.matchId || '');
    if (matchId && !/^\d{1,12}$/.test(matchId)) return null;
    const t = normalizeName(team);
    const home = text(match.home);
    const away = text(match.away);
    const casa = normalizeName(home) === t;
    const fora = normalizeName(away) === t;
    if (!casa && !fora) return null;
    const adversario = casa ? away : home;
    if (!adversario || /^isento\b/i.test(adversario)) return null;

    const schedule = text(match.schedule);
    const score = text(match.score);
    const both = `${schedule} ${score}`;
    const dm = /(\d{1,2})\s+([a-zç]{3})/i.exec(both);
    const month = dm ? MONTHS[dm[2].toLowerCase()] : null;
    if (!dm || !month) return null;
    const day = Number(dm[1]);
    if (day < 1 || day > 31) return null;
    const year = inferYear(month, today);
    const data = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const hm = /\b(\d{1,2}):(\d{2})\b/.exec(both);
    const sc = /^(\d+)\s*-\s*(\d+)$/.exec(score);
    return {
        fpf_id: gameKey(match.fixtureId, home, away),
        data,
        hora: hm ? `${hm[1].padStart(2, '0')}:${hm[2]}` : null,
        adversario: adversario.slice(0, 100),
        casa,
        local: text(match.stadium).slice(0, 150),
        competicao: text(match.competicao).slice(0, 100),
        resultado: sc ? `${sc[1]}-${sc[2]}` : '',
        fpf_url: matchId ? `${FPF_ORIGIN}/Match/GetMatchInformation?matchId=${matchId}` : null,
        // Não é coluna da tabela: usado para converter jogos importados com a chave antiga (só matchId)
        _legacyId: matchId || null,
    };
}

export const PAYLOAD_VERSION = 2;

/**
 * Descodifica o payload do bookmarklet (base64url de JSON).
 * Devolve null se inválido, { outdated: true } se veio de um favorito de versão anterior.
 */
export function decodePayload(encoded) {
    try {
        const b64 = String(encoded).replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const obj = JSON.parse(new TextDecoder().decode(bytes));
        if (!obj || typeof obj.v !== 'number') return null;
        if (obj.v < PAYLOAD_VERSION) return { outdated: true };
        if (obj.v !== PAYLOAD_VERSION || !Array.isArray(obj.matches)) return null;
        return obj;
    } catch {
        return null;
    }
}
