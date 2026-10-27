// Testes da conversão de jogos da FPF: node --test fpf/parse.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toJogo, inferYear, decodePayload, text, gameKey } from './parse.js';

const TODAY = new Date('2026-10-27T12:00:00Z');
const C = '1ª FASE · SÉRIE 1';

test('toJogo: jogo em casa já jogado (marcação real da FPF, jornada 1)', () => {
    const jogo = toJogo({
        fixtureId: '684349', matchId: '2709503', home: 'Carregado', away: 'Patameiras "B"', score: '1 - 12',
        schedule: '24 out', stadium: 'Pavilhão Associação Desportiva Carregado', competicao: C,
    }, 'carregado', { today: TODAY });
    assert.deepEqual(jogo, {
        fpf_id: 'f684349:carregado|patameiras "b"',
        data: '2026-10-24',
        hora: null,
        adversario: 'Patameiras "B"',
        casa: true,
        local: 'Pavilhão Associação Desportiva Carregado',
        competicao: C,
        resultado: '1-12',
        fpf_url: 'https://resultados.fpf.pt/Match/GetMatchInformation?matchId=2709503',
        _legacyId: '2709503',
    });
});

test('toJogo: jogo fora por jogar, sem link nem resultado (marcação real da FPF, jornada 2)', () => {
    const jogo = toJogo({
        fixtureId: '684350', matchId: '', home: 'Vilafranquense', away: 'Carregado', score: '',
        schedule: '1 nov 09:30', stadium: 'Pav Jose Mario Cerejo (Vilafranquense)', competicao: C,
    }, 'Carregado', { today: TODAY });
    assert.equal(jogo.fpf_id, 'f684350:vilafranquense|carregado');
    assert.equal(jogo.casa, false);
    assert.equal(jogo.adversario, 'Vilafranquense');
    assert.equal(jogo.data, '2026-11-01');
    assert.equal(jogo.hora, '09:30');
    assert.equal(jogo.resultado, '');
    assert.equal(jogo.fpf_url, null);
    assert.equal(jogo._legacyId, null);
});

test('gameKey: estável com acentos/maiúsculas/espaços', () => {
    assert.equal(gameKey('1', ' Gd  Pirescôxe ', 'CARREGADO'), 'f1:gd pirescoxe|carregado');
});

test('toJogo: isento, outras equipas e dados inválidos não passam', () => {
    const base = { fixtureId: '684351', matchId: '', score: '', schedule: '7 nov', stadium: '', competicao: C };
    assert.equal(toJogo({ ...base, home: 'Carregado', away: 'Isento (DS)' }, 'Carregado', { today: TODAY }), null);
    assert.equal(toJogo({ ...base, home: 'Cabanas Chão', away: 'Gd Pirescôxe' }, 'Carregado', { today: TODAY }), null);
    assert.equal(toJogo({ ...base, fixtureId: 'x', home: 'Carregado', away: 'X' }, 'Carregado', { today: TODAY }), null);
    assert.equal(toJogo({ ...base, matchId: 'abc', home: 'Carregado', away: 'X' }, 'Carregado', { today: TODAY }), null);
    assert.equal(toJogo({ ...base, schedule: 'sem data', home: 'Carregado', away: 'X' }, 'Carregado', { today: TODAY }), null);
    assert.equal(toJogo({ ...base, schedule: '40 nov', home: 'Carregado', away: 'X' }, 'Carregado', { today: TODAY }), null);
    const longo = toJogo({ ...base, home: 'Carregado', away: 'A'.repeat(300), stadium: 'B'.repeat(300), competicao: 'C'.repeat(300) }, 'Carregado', { today: TODAY });
    assert.equal(longo.adversario.length, 100);
    assert.equal(longo.local.length, 150);
    assert.equal(longo.competicao.length, 100);
    assert.ok(longo.fpf_id.length <= 250);
});

test('inferYear: época de agosto a julho', () => {
    assert.equal(inferYear(10, TODAY), 2026);
    assert.equal(inferYear(1, TODAY), 2027);
    assert.equal(inferYear(9, new Date('2027-02-01')), 2026);
    assert.equal(inferYear(3, new Date('2027-02-01')), 2027);
});

test('decodePayload: base64url do bookmarklet (v2), com acentos; v1 = desatualizado; inválidos devolvem null', () => {
    const obj = { v: 2, team: 'Carregado', series: ['1ª FASE · SÉRIE 1'], matches: [{ fixtureId: '1', home: 'Gd Pirescôxe' }] };
    const b64 = Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
    assert.deepEqual(decodePayload(b64), obj);
    assert.equal(decodePayload('%%%'), null);
    assert.deepEqual(decodePayload(Buffer.from('{"v":1,"matches":[]}').toString('base64url')), { outdated: true });
    assert.equal(decodePayload(Buffer.from('{"v":3,"matches":[]}').toString('base64url')), null);
    assert.equal(decodePayload(Buffer.from('{"matches":[]}').toString('base64url')), null);
    assert.equal(decodePayload(Buffer.from('{"v":2,"matches":"x"}').toString('base64url')), null);
});

test('text: normaliza espaços', () => {
    assert.equal(text('  Patameiras\n  "B"  '), 'Patameiras "B"');
});
