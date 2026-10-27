// Testes da conversão de jogos da FPF: node --test fpf/parse.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toJogo, inferYear, decodePayload, text } from './parse.js';

const TODAY = new Date('2026-10-27T12:00:00Z');
const C = '1ª FASE · SÉRIE 1';

test('toJogo: jogo em casa já jogado (marcação real da FPF, jornada 1)', () => {
    const jogo = toJogo({
        matchId: '2709503', home: 'Carregado', away: 'Patameiras "B"', score: '1 - 12',
        schedule: '24 out', stadium: 'Pavilhão Associação Desportiva Carregado', competicao: C,
    }, 'carregado', { today: TODAY });
    assert.deepEqual(jogo, {
        fpf_id: '2709503',
        data: '2026-10-24',
        hora: null,
        adversario: 'Patameiras "B"',
        casa: true,
        local: 'Pavilhão Associação Desportiva Carregado',
        competicao: C,
        resultado: '1-12',
        fpf_url: 'https://resultados.fpf.pt/Match/GetMatchInformation?matchId=2709503',
    });
});

test('toJogo: jogo fora ainda por jogar com hora; outros ignorados', () => {
    const fora = toJogo({ matchId: '1', home: 'Gd Pirescôxe', away: 'Carregado', score: '15:30', schedule: '7 nov', stadium: 'X', competicao: C },
        'Carregado', { today: TODAY });
    assert.equal(fora.casa, false);
    assert.equal(fora.adversario, 'Gd Pirescôxe');
    assert.equal(fora.data, '2026-11-07');
    assert.equal(fora.hora, '15:30');
    assert.equal(fora.resultado, '');
    assert.equal(toJogo({ matchId: '2', home: 'Carregado', away: 'Isento (DS)', score: '', schedule: '7 nov', stadium: '', competicao: C }, 'Carregado', { today: TODAY }), null);
    assert.equal(toJogo({ matchId: '3', home: 'Cabanas Chão', away: 'Gd Pirescôxe', score: '2 - 2', schedule: '24 out', stadium: '', competicao: C }, 'Carregado', { today: TODAY }), null);
});

test('toJogo: dados inválidos não passam', () => {
    assert.equal(toJogo({ matchId: 'abc', home: 'Carregado', away: 'X', score: '', schedule: '7 nov' }, 'Carregado', { today: TODAY }), null);
    assert.equal(toJogo({ matchId: '4', home: 'Carregado', away: 'X', score: '', schedule: 'sem data' }, 'Carregado', { today: TODAY }), null);
    assert.equal(toJogo({ matchId: '5', home: 'Carregado', away: 'X', score: '', schedule: '40 nov' }, 'Carregado', { today: TODAY }), null);
    const longo = toJogo({ matchId: '6', home: 'Carregado', away: 'A'.repeat(300), score: '', schedule: '7 nov', stadium: 'B'.repeat(300), competicao: 'C'.repeat(300) }, 'Carregado', { today: TODAY });
    assert.equal(longo.adversario.length, 100);
    assert.equal(longo.local.length, 150);
    assert.equal(longo.competicao.length, 100);
});

test('inferYear: época de agosto a julho', () => {
    assert.equal(inferYear(10, TODAY), 2026);
    assert.equal(inferYear(1, TODAY), 2027);
    assert.equal(inferYear(9, new Date('2027-02-01')), 2026);
    assert.equal(inferYear(3, new Date('2027-02-01')), 2027);
});

test('decodePayload: base64url do bookmarklet, com acentos; inválidos devolvem null', () => {
    const obj = { v: 1, team: 'Carregado', series: ['1ª FASE · SÉRIE 1'], matches: [{ matchId: '1', home: 'Gd Pirescôxe' }] };
    const b64 = Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
    assert.deepEqual(decodePayload(b64), obj);
    assert.equal(decodePayload('%%%'), null);
    assert.equal(decodePayload(Buffer.from('{"v":2}').toString('base64url')), null);
    assert.equal(decodePayload(Buffer.from('{"v":1,"matches":"x"}').toString('base64url')), null);
});

test('text: normaliza espaços', () => {
    assert.equal(text('  Patameiras\n  "B"  '), 'Patameiras "B"');
});
