/**
 * Test Fase 1 — normalizer.js
 * Esegui: node tests/fase1_normalizer.test.js
 */

const { detectNestedColumns, normalizeColumn, normalizeData } = require('../Backend/services/ocelService/normalizer.js');
const path = require('path');
const fs   = require('fs');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n── ${title}`);
}

function loadDataset(name) {
  const p = path.join(__dirname, 'input_data', name);
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return (Array.isArray(raw) ? raw : Object.values(raw)).filter(r => Object.keys(r).length > 0);
}

// ─── Dataset fixture sintetici ────────────────────────────────────────────────

const SIMPLE = [
  { hash: '0xAAA', activity: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] },
  { hash: '0xBBB', activity: 'approve',  inputs: [{ name: 'spender', type: 'address' }] },
  { hash: '0xCCC', activity: 'transfer', inputs: [] },
  { hash: '0xDDD', activity: 'swap',     inputs: null },
];

const PRIMITIVE_ARRAY = [
  { hash: '0x1', activity: 'mint', tags: ['a', 'b', 'c'] },
  { hash: '0x2', activity: 'burn', tags: ['x'] },
];

// ─── 1. detectNestedColumns ────────────────────────────────────────────────────

section('detectNestedColumns — fixture sintetica');

{
  const { nested, flat } = detectNestedColumns(SIMPLE);
  assert('rileva "inputs" come nested', nested.includes('inputs'));
  assert('rileva "hash" come flat',     flat.includes('hash'));
  assert('rileva "activity" come flat', flat.includes('activity'));
  assert('nessun falso positivo nested', !nested.includes('activity'));
}

{
  const { nested, flat } = detectNestedColumns([]);
  assert('array vuoto → nested=[], flat=[]', nested.length === 0 && flat.length === 0);
}

// ─── 2. normalizeColumn ────────────────────────────────────────────────────────

section('normalizeColumn — oggetti dentro array');

{
  const rows = normalizeColumn(SIMPLE, 'inputs', ['hash', 'activity']);
  assert('produce righe solo da record con array non vuoto', rows.length === 3);
  assert('prefisso corretto sui campi array', rows[0].hasOwnProperty('inputs_name'));
  assert('meta-campo "hash" propagato',       rows[0].hasOwnProperty('hash'));
  assert('campo "__id" presente',             rows[0].hasOwnProperty('inputs__id'));
}

section('normalizeColumn — ID deterministico');

{
  const rows = normalizeColumn(SIMPLE, 'inputs', ['hash', 'activity']);
  const ids  = rows.map(r => r['inputs__id']);
  assert('primo ID = inputs_0xAAA_1',   ids[0] === 'inputs_0xAAA_1',  `got: ${ids[0]}`);
  assert('secondo ID = inputs_0xAAA_2', ids[1] === 'inputs_0xAAA_2',  `got: ${ids[1]}`);
  assert('terzo ID = inputs_0xBBB_1',   ids[2] === 'inputs_0xBBB_1',  `got: ${ids[2]}`);
  assert('ID unici', new Set(ids).size === ids.length);
}

section('normalizeColumn — edge cases');

{
  const rows = normalizeColumn(SIMPLE, 'inputs', ['hash']);
  assert('array vuoto ([]) → riga saltata', rows.every(r => r.hash !== '0xCCC'));
  assert('valore null → riga saltata',      rows.every(r => r.hash !== '0xDDD'));
}

{
  const rows = normalizeColumn(PRIMITIVE_ARRAY, 'tags', ['hash', 'activity']);
  assert('array di primitivi → campo "{col}_value"', rows[0].hasOwnProperty('tags_value'));
  assert('valore primitivo corretto', rows[0]['tags_value'] === 'a');
  assert('3 righe da primo record',   rows.filter(r => r.hash === '0x1').length === 3);
}

// ─── 3. normalizeData ─────────────────────────────────────────────────────────

section('normalizeData — fixture sintetica');

{
  const result = normalizeData(SIMPLE, [0]);
  assert('ritorna oggetto con "normalized"', result !== null && Array.isArray(result.normalized));
  assert('righe corrette (solo non-vuote)',  result.normalized.length === 3);
}

{
  assert('records vuoti → null',          normalizeData([], [0]) === null);
  assert('nessuna colonna nested → null', normalizeData([{ a: 1, b: 2 }], [0]) === null);
  assert('indice fuori range → null',     normalizeData(SIMPLE, [99]) === null);
}

// ─── 4. Dataset reale — pancake100txs.json (100 tx PancakeSwap) ───────────────

section('Dataset reale — pancake100txs.json (100 tx)');

{
  const records = loadDataset('pancake100txs.json');
  assert('100 record caricati', records.length === 100, `got ${records.length}`);

  const { nested, flat } = detectNestedColumns(records);
  assert('"inputs" tra le colonne nested',      nested.includes('inputs'),      `nested: ${nested}`);
  assert('"events" tra le colonne nested',      nested.includes('events'),      `nested: ${nested}`);
  assert('"internalTxs" tra le colonne nested', nested.includes('internalTxs'), `nested: ${nested}`);
  assert('"txHash" tra i campi flat',           flat.includes('txHash'),        `flat: ${flat}`);
  assert('"activity" tra i campi flat',         flat.includes('activity'),      `flat: ${flat}`);
  assert('"timestamp" tra i campi flat',        flat.includes('timestamp'),     `flat: ${flat}`);

  const inputsIdx = nested.indexOf('inputs');
  const result = normalizeData(records, [inputsIdx]);
  assert('normalizzazione "inputs" non null', result !== null);
  if (result) {
    assert('produce più righe dei record originali (espansione)', result.normalized.length > records.length);
    const ids = result.normalized.map(r => r['inputs__id']);
    assert('tutti gli ID presenti', ids.every(id => id !== undefined));
    assert('tutti gli ID unici',    new Set(ids).size === ids.length);

    const firstRow = result.normalized[0];
    assert('campo "inputs_inputName" presente', firstRow.hasOwnProperty('inputs_inputName'), `campi: ${Object.keys(firstRow).join(', ')}`);
    assert('campo "txHash" propagato',          firstRow.hasOwnProperty('txHash'));
    assert('campo "activity" propagato',        firstRow.hasOwnProperty('activity'));

    console.log(`\n  📊 pancake100txs — inputs:`);
    console.log(`     record originali: ${records.length}`);
    console.log(`     righe normalizzate: ${result.normalized.length}`);
    console.log(`     ID esempio: ${ids[0]}`);
  }
}

// ─── 5. Dataset reale — pancake1000.json (1000 tx PancakeSwap) ───────────────

section('Dataset reale — pancake1000.json (1000 tx)');

{
  const records = loadDataset('pancake1000.json');
  assert('~1000 record caricati', records.length > 900, `got ${records.length}`);

  const { nested } = detectNestedColumns(records);
  const inputsIdx  = nested.indexOf('inputs');
  const eventsIdx  = nested.indexOf('events');

  const r1 = normalizeData(records, [inputsIdx]);
  assert('normalizzazione "inputs" su 1000 tx non null', r1 !== null);
  if (r1) {
    assert('espansione inputs su 1000 tx', r1.normalized.length > records.length);
    console.log(`\n  📊 pancake1000 — inputs: ${records.length} record → ${r1.normalized.length} righe`);
  }

  const r2 = normalizeData(records, [eventsIdx]);
  assert('normalizzazione "events" su 1000 tx non null', r2 !== null);
  if (r2) {
    console.log(`  📊 pancake1000 — events: ${records.length} record → ${r2.normalized.length} righe`);
  }

  // Più colonne insieme
  const r3 = normalizeData(records, [inputsIdx, eventsIdx]);
  assert('normalizzazione inputs+events insieme non null', r3 !== null);
  if (r3 && r1 && r2) {
    assert('concat inputs+events = somma separati', r3.normalized.length === r1.normalized.length + r2.normalized.length,
      `got ${r3.normalized.length}, atteso ${r1.normalized.length + r2.normalized.length}`);
  }
}

// ─── 6. Dataset reale — fantom100.json (100 tx Fantom) ───────────────────────

section('Dataset reale — fantom100.json (100 tx Fantom)');

{
  const records = loadDataset('fantom100.json');
  assert('100 record Fantom caricati', records.length === 100, `got ${records.length}`);

  const { nested, flat } = detectNestedColumns(records);
  assert('ha colonne nested', nested.length > 0, `nested: ${nested}`);

  const result = normalizeData(records, [0]);
  assert('normalizzazione Fantom non null', result !== null);
  if (result) {
    const ids = result.normalized.map(r => r[`${nested[0]}__id`]);
    assert('ID unici su dataset Fantom', new Set(ids).size === ids.length);
    console.log(`\n  📊 fantom100 — ${nested[0]}: ${records.length} record → ${result.normalized.length} righe`);
  }
}

// ─── Risultato finale ─────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Risultato: ${passed} passati, ${failed} falliti`);
if (failed > 0) process.exit(1);
