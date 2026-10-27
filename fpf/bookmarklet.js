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

        // Jogos já disputados vêm dentro de <a class="game-link" href="…matchId=…">;
        // jogos por jogar são só <div class="game"> (sem link nem resultado, com "1 nov<br>09:00").
        const matchesOf = root => [...root.querySelectorAll('#matches .game')].map(g => {
            const link = g.closest('a.game-link');
            const id = link && /matchId=(\d+)/.exec(link.getAttribute('href') || '');
            const next = g.nextElementSibling;
            const sched = g.querySelector('.game-schedule');
            return {
                matchId: id ? id[1] : '',
                home: txt(g.querySelector('.home-team')),
                away: txt(g.querySelector('.away-team')),
                score: txt(g.querySelector('.score > span:not(.game-schedule)')),
                schedule: sched ? sched.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '',
                stadium: next && next.classList.contains('game-list-stadium') ? txt(next) : '',
            };
        });

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
            for (let i = 0; i < urls.length; i++) {
                say(`a ler ${competicao} — jornada ${i + 1} de ${urls.length}…`);
                const fixtureId = (/fixtureId=(\d+)/.exec(urls[i]) || [])[1];
                // Um pedido de cada vez, com pausa, como ao clicar nas jornadas à mão
                if (i > 0) await new Promise(r => setTimeout(r, 800));
                const res = await fetch(urls[i], { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                if (res.status === 403 || res.status === 429) {
                    throw new Error(`o site da FPF recusou os pedidos (HTTP ${res.status}), provavelmente por limite de pedidos. Espera 10–15 minutos e tenta de novo.`);
                }
                if (!res.ok) throw new Error(`a FPF respondeu HTTP ${res.status}.`);
                const root = new DOMParser().parseFromString(await res.text(), 'text/html');
                for (const m of matchesOf(root)) {
                    if (norm(m.home) !== target && norm(m.away) !== target) continue;
                    const key = `${fixtureId}|${norm(m.home)}|${norm(m.away)}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    matches.push({ ...m, fixtureId, competicao });
                }
            }
        }

        const json = JSON.stringify({ v: 2, team: TEAM, series, matches });
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
