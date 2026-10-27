// Testes do leitor da FPF: node --test supabase/functions/importar-fpf/parse.test.mjs
// O excerto abaixo segue a marcação real de resultados.fpf.pt (Competition/Details, out/2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCompetition, parseMatches, sectionHasTeam, toJogo, inferYear, text } from './parse.js';

const PAGE = `
<div class="accordion-item open">
  <div class="accordion-title col-md-12">
    <div class="col-md-12 no-padding"> 1ª FASE <span class="arrow"></span> </div>
  </div>
  <div class="accordion-content">
    <div class="game-results col-md-4" id="htmlSerieId_100559">
      <div class="tag"><div class="row"><div class="col-md-12 text-center"><span>SÉRIE 1</span></div></div></div>
      <a class="text-center current" data-ajax="true" href="https://resultados.fpf.pt/Competition/GetClassificationAndMatchesByFixture?fixtureId=684349">1</a>
      <a class="text-center" data-ajax="true" href="https://resultados.fpf.pt/Competition/GetClassificationAndMatchesByFixture?fixtureId=684350">2</a>
      <div id="classificationMatchSection_100559">
        <div class="game classification no-gutters ">
          <div class="col-md-1 col-sm-1 col-xs-1 text-left no-padding"><span>12</span></div>
          <div class="col-md-4 col-sm-4 col-xs-4 no-padding">Carregado</div>
        </div>
        <div id="matches">
          <a class="game-link" href="https://resultados.fpf.pt/Match/GetMatchInformation?matchId=2709503">
            <div class="game" style="min-height: 31px">
              <div class="home-team  col-md-4 col-sm-4 col-xs-4 no-padding text-left">Carregado</div>
              <div class="score col-md-4 col-sm-4 col-xs-4 no-padding text-center">
                <span>
                    1 - 12                            </span>
                    <span class="game-schedule">
                        24 out
                    </span>
              </div>
              <div class="away-team winner col-md-4 col-sm-4 col-xs-4 no-padding text-right">Patameiras "B"</div>
            </div>
            <div class="game-list-stadium" style="padding: 4px 4px 15px">
              <small style="color: #000;">Pavilhão Associação Desportiva Carregado</small>
            </div>
          </a>
          <a class="game-link" href="https://resultados.fpf.pt/Match/GetMatchInformation?matchId=2709505">
            <div class="game">
              <div class="home-team  col-md-4 no-padding text-left">Cabanas Chão</div>
              <div class="score col-md-4 no-padding text-center"><span>2 - 2</span><span class="game-schedule">24 out</span></div>
              <div class="away-team  col-md-4 no-padding text-right">Gd Pirescôxe</div>
            </div>
            <small>Pavilhão Cimr Cabanas Chão | Alenquer</small>
          </a>
        </div>
      </div>
    </div>
    <div class="game-results col-md-4" id="htmlSerieId_100560">
      <div class="tag"><div class="row"><div class="col-md-12 text-center"><span>SÉRIE 2</span></div></div></div>
      <div class="game classification no-gutters "><div class="col-md-4 no-padding">Outra Equipa</div></div>
    </div>
  </div>
</div>`;

const TODAY = new Date('2026-10-27T12:00:00Z');

test('parseCompetition: séries, fase e jornadas', () => {
    const series = parseCompetition(PAGE);
    assert.deepEqual(series.map(s => [s.serieId, s.fase, s.serie, s.fixtureIds]), [
        ['100559', '1ª FASE', 'SÉRIE 1', ['684349', '684350']],
        ['100560', '1ª FASE', 'SÉRIE 2', []],
    ]);
});

test('sectionHasTeam: nome exato, sem acentos/maiúsculas, sem falsos positivos', () => {
    const [s1, s2] = parseCompetition(PAGE);
    assert.equal(sectionHasTeam(s1.html, 'carregado'), true);
    assert.equal(sectionHasTeam(s1.html, 'Carregad'), false);
    assert.equal(sectionHasTeam(s2.html, 'Carregado'), false);
});

test('parseMatches + toJogo: jogo em casa com resultado', () => {
    const matches = parseMatches(PAGE);
    assert.equal(matches.length, 2);
    const jogos = matches.map(m => toJogo(m, 'Carregado', { competicao: '1ª FASE · SÉRIE 1', today: TODAY })).filter(Boolean);
    assert.deepEqual(jogos, [{
        fpf_id: '2709503',
        data: '2026-10-24',
        hora: null,
        adversario: 'Patameiras "B"',
        casa: true,
        local: 'Pavilhão Associação Desportiva Carregado',
        competicao: '1ª FASE · SÉRIE 1',
        resultado: '1-12',
        fpf_url: 'https://resultados.fpf.pt/Match/GetMatchInformation?matchId=2709503',
    }]);
});

test('toJogo: jogo fora ainda por jogar com hora; isento ignorado', () => {
    const fora = toJogo({ matchId: '1', url: 'u', home: 'Gd Pirescôxe', away: 'Carregado', score: '15:30', schedule: '7 nov', stadium: 'X' },
        'Carregado', { competicao: 'c', today: TODAY });
    assert.equal(fora.casa, false);
    assert.equal(fora.adversario, 'Gd Pirescôxe');
    assert.equal(fora.data, '2026-11-07');
    assert.equal(fora.hora, '15:30');
    assert.equal(fora.resultado, '');
    assert.equal(toJogo({ matchId: '2', url: 'u', home: 'Carregado', away: 'Isento (DS)', score: '', schedule: '7 nov', stadium: '' },
        'Carregado', { competicao: 'c', today: TODAY }), null);
});

test('inferYear: época de agosto a julho', () => {
    assert.equal(inferYear(10, TODAY), 2026);
    assert.equal(inferYear(1, TODAY), 2027);
    assert.equal(inferYear(9, new Date('2027-02-01')), 2026);
    assert.equal(inferYear(3, new Date('2027-02-01')), 2027);
});

test('text: entidades HTML', () => {
    assert.equal(text('Patameiras &quot;B&quot; &amp; Co &#233;'), 'Patameiras "B" & Co é');
});
