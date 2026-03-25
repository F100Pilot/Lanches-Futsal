/**
 * ============================================
 * LANCHES FUTSAL — Google Apps Script API
 * ============================================
 *
 * INSTRUÇÕES RÁPIDAS:
 *
 * 1. Cria uma Google Sheet com a linha de cabeçalho:
 *    A=ID  B=Nome do Atleta  C=Data  D=Entregue  E=Observações
 *
 * 2. Na Sheet: Extensions → Apps Script
 *    Cola este código, guarda (Ctrl+S), nomeia "LanchesFutsalAPI"
 *
 * 3. Deploy → New deployment → Web app
 *    Execute as: Me  |  Who has access: Anyone
 *    → Copia a URL gerada e cola no site
 *
 * ENDPOINTS:
 *   GET  ?action=read          → lista todos os registos
 *   POST action=create         → cria registo (nome, data, entregue, observacoes)
 *   POST action=update         → atualiza registo (id, entregue, ...)
 *   POST action=delete         → elimina registo (id)
 * ============================================
 */

const SHEET_NAME = 'Sheet1';

// ── HANDLER GET ──────────────────────────────────────────
function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'read';
    let result;
    if (action === 'read') {
      result = readData();
    } else {
      result = { success: false, error: 'Ação não reconhecida: ' + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message });
  }
}

// ── HANDLER POST ─────────────────────────────────────────
function doPost(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || '';
    let result;

    switch (action) {
      case 'create': result = createData(params); break;
      case 'update': result = updateData(params); break;
      case 'delete': result = deleteData(params); break;
      default:       result = { success: false, error: 'Ação não reconhecida: ' + action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SHEET HELPER ─────────────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const header = sheet.getRange(1, 1, 1, 5);
    header.setValues([['ID', 'Nome do Atleta', 'Data', 'Entregue', 'Observações']]);
    header.setFontWeight('bold')
          .setBackground('#1e3a8a')
          .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function nextId(sheet) {
  const last = sheet.getLastRow();
  if (last <= 1) return 1;
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues().flat();
  const nums = ids.filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

/**
 * Converte um valor de célula de data para string "YYYY-MM-DD".
 * Necessário porque o Google Sheets devolve datas como objetos Date,
 * não como strings, quando o tipo da coluna é Date.
 */
function dateToStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val);
}

// ── READ ─────────────────────────────────────────────────
function readData() {
  const sheet = getSheet();
  const last  = sheet.getLastRow();
  if (last <= 1) return { success: true, data: [], count: 0 };

  const rows = sheet.getRange(2, 1, last - 1, 5).getValues();
  const data = rows
    .filter(r => r[0] !== '' && r[0] !== null)
    .map(r => ({
      id:          r[0],
      nome:        r[1] || '',
      data:        dateToStr(r[2]),   // ← correção crítica
      entregue:    r[3] || 'Não',
      observacoes: r[4] || ''
    }));

  return { success: true, data: data, count: data.length };
}

// ── CREATE ────────────────────────────────────────────────
function createData(p) {
  if (!p.nome || !p.data) {
    return { success: false, error: 'Os campos "nome" e "data" são obrigatórios.' };
  }
  const sheet = getSheet();
  const id    = nextId(sheet);
  sheet.appendRow([id, p.nome, p.data, p.entregue || 'Não', p.observacoes || '']);
  return {
    success: true,
    message: 'Registo criado com sucesso.',
    data: { id, nome: p.nome, data: p.data, entregue: p.entregue || 'Não', observacoes: p.observacoes || '' }
  };
}

// ── UPDATE ────────────────────────────────────────────────
function updateData(p) {
  if (!p.id) return { success: false, error: 'O campo "id" é obrigatório.' };

  const sheet = getSheet();
  const last  = sheet.getLastRow();
  if (last <= 1) return { success: false, error: 'Sem registos para atualizar.' };

  const ids = sheet.getRange(2, 1, last - 1, 1).getValues().flat();
  const idx = ids.findIndex(v => String(v) === String(p.id));
  if (idx === -1) return { success: false, error: 'Registo não encontrado (id=' + p.id + ').' };

  const row = idx + 2; // +1 header +1 índice base-0
  if (p.entregue    !== undefined) sheet.getRange(row, 4).setValue(p.entregue);
  if (p.nome        !== undefined) sheet.getRange(row, 2).setValue(p.nome);
  if (p.data        !== undefined) sheet.getRange(row, 3).setValue(p.data);
  if (p.observacoes !== undefined) sheet.getRange(row, 5).setValue(p.observacoes);

  const updated = sheet.getRange(row, 1, 1, 5).getValues()[0];
  return {
    success: true,
    message: 'Registo atualizado.',
    data: { id: updated[0], nome: updated[1], data: dateToStr(updated[2]), entregue: updated[3], observacoes: updated[4] || '' }
  };
}

// ── DELETE ────────────────────────────────────────────────
function deleteData(p) {
  if (!p.id) return { success: false, error: 'O campo "id" é obrigatório.' };

  const sheet = getSheet();
  const last  = sheet.getLastRow();
  if (last <= 1) return { success: false, error: 'Sem registos para eliminar.' };

  const ids = sheet.getRange(2, 1, last - 1, 1).getValues().flat();
  const idx = ids.findIndex(v => String(v) === String(p.id));
  if (idx === -1) return { success: false, error: 'Registo não encontrado (id=' + p.id + ').' };

  sheet.deleteRow(idx + 2);
  return { success: true, message: 'Registo eliminado.', deletedId: p.id };
}

// ── UTILITÁRIOS (executar manualmente para testar) ────────
function testAPI() {
  Logger.log('=== READ ===');
  Logger.log(JSON.stringify(readData()));

  Logger.log('=== CREATE ===');
  const c = createData({ nome: 'Teste Script', data: '2025-01-01', entregue: 'Não', observacoes: 'Teste' });
  Logger.log(JSON.stringify(c));

  if (c.success) {
    Logger.log('=== UPDATE ===');
    Logger.log(JSON.stringify(updateData({ id: c.data.id, entregue: 'Sim' })));
    Logger.log('=== DELETE ===');
    Logger.log(JSON.stringify(deleteData({ id: c.data.id })));
  }
}

function clearAllData() {
  const sheet = getSheet();
  const last  = sheet.getLastRow();
  if (last > 1) sheet.deleteRows(2, last - 1);
  Logger.log('Dados limpos.');
}
