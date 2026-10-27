// Bookmarklet "Importar para Lanches Futsal".
//
// Corre no browser do editor, na página da competição em resultados.fpf.pt
// (o site só responde a browsers; a leitura é feita com a sessão normal do utilizador).
// A app gera o link javascript: a partir desta função, com TEAM e APP preenchidos
// (ver index.html → buildBookmarklet), e o editor arrasta-o para a barra de favoritos.
//
// O que faz: encontra as séries onde a equipa aparece, lê todas as jornadas dessas séries
// (os mesmos pedidos que a página faz ao clicar nas jornadas), guarda só os jogos da equipa
// e abre a app com os dados no fragmento do URL (#fpf=…). A app pede confirmação antes de gravar.
async function importarParaLanches(TEAM, APP) {
    const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const txt = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
    const target = norm(TEAM);

    const status = document.createElement('div');
    status.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#0B1220;color:#A3E635;font:600 15px system-ui,sans-serif;padding:12px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.4)';
    const say = m => { status.textContent = 'Lanches Futsal: ' + m; };
    document.body.appendChild(status);

    try {
        if (location.hostname !== 'resultados.fpf.pt') {
            throw new Error('Abre primeiro a página da competição em resultados.fpf.pt.');
        }
        const sections = [...document.querySelectorAll('[id^="htmlSerieId_"]')].filter(s =>
            [...s.querySelectorAll('.game.classification div, .home-team, .away-team')].some(d => norm(d.textContent) === target));
        if (!sections.length) {
            throw new Error(`A equipa "${TEAM}" não aparece nesta página. Confirma o link da competição e o nome da equipa nas Opções da app.`);
        }

        const matchesOf = root => [...root.querySelectorAll('a.game-link')].map(a => {
            const id = /matchId=(\d+)/.exec(a.getAttribute('href') || '');
            return id && {
                matchId: id[1],
                home: txt(a.querySelector('.home-team')),
                away: txt(a.querySelector('.away-team')),
                score: txt(a.querySelector('.score > span')),
                schedule: txt(a.querySelector('.game-schedule')),
                stadium: txt(a.querySelector('small')),
            };
        }).filter(Boolean);

        const matches = [];
        const seen = new Set();
        const series = [];
        for (const s of sections) {
            const serie = txt(s.querySelector('.tag span'));
            const item = s.closest('.accordion-item');
            const fase = txt(item && item.querySelector('.accordion-title'));
            const competicao = [fase, serie].filter(Boolean).join(' · ');
            series.push(competicao);
            const urls = [...new Set([...s.querySelectorAll('a[href*="GetClassificationAndMatchesByFixture"]')].map(a => a.href))];
            const pages = [s, ...urls];
            for (let i = 0; i < pages.length; i++) {
                say(`a ler ${competicao} — jornada ${i} de ${urls.length}…`);
                let root = pages[i];
                if (typeof root === 'string') {
                    const res = await fetch(root, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                    if (!res.ok) throw new Error(`a FPF respondeu HTTP ${res.status}.`);
                    root = new DOMParser().parseFromString(await res.text(), 'text/html');
                }
                for (const m of matchesOf(root)) {
                    if (seen.has(m.matchId) || (norm(m.home) !== target && norm(m.away) !== target)) continue;
                    seen.add(m.matchId);
                    matches.push({ ...m, competicao });
                }
            }
        }

        const json = JSON.stringify({ v: 1, team: TEAM, series, matches });
        const bytes = new TextEncoder().encode(json);
        let bin = '';
        bytes.forEach(b => { bin += String.fromCharCode(b); });
        const payload = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        say(`${matches.length} jogos encontrados, a abrir a app…`);
        location.href = `${APP}#fpf=${payload}`;
    } catch (err) {
        status.remove();
        alert('Lanches Futsal — não foi possível importar: ' + (err && err.message ? err.message : err));
    }
}
