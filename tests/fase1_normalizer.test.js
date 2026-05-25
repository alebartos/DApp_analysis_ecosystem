/**
 * Test Fase 1 — normalizer.js
 * Esegui: node tests/fase1_normalizer.test.js
 */

const { detectNestedColumns, normalizeColumn, normalizeData } = require('../Backend/services/ocelService/normalizer.js');
const path = require('path');
const fs = require('fs');

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

// ─── Dataset fixture ───────────────────────────────────────────────────────────

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

const EMPTY_RECORDS = [];

const ONLY_FLAT = [
  { hash: '0x1', activity: 'transfer', value: 100 },
  { hash: '0x2', activity: 'approve',  value: 200 },
];

// ─── 1. detectNestedColumns ────────────────────────────────────────────────────

section('detectNestedColumns');

{
  const { nested, flat } = detectNestedColumns(SIMPLE);
  assert('rileva "inputs" come nested', nested.includes('inputs'));
  assert('rileva "hash" come flat',     flat.includes('hash'));
  assert('rileva "activity" come flat', flat.includes('activity'));
  assert('nessun falso positivo nested', !nested.includes('activity'));
}

{
  const { nested, flat } = detectNestedColumns(EMPTY_RECORDS);
  assert('array vuoto → nested=[], flat=[]', nested.length === 0 && flat.length === 0);
}

{
  const { nested } = detectNestedColumns(ONLY_FLAT);
  assert('nessuna colonna nested su record piatti', nested.length === 0);
}

// ─── 2. normalizeColumn ────────────────────────────────────────────────────────

section('normalizeColumn — oggetti dentro array');

{
  const rows = normalizeColumn(SIMPLE, 'inputs', ['hash', 'activity']);

  assert('produce righe solo da record con array non vuoto', rows.length === 3);
  assert('prefisso corretto sui campi array', rows[0].hasOwnProperty('inputs_name'));
  assert('meta-campo "hash" propagato',       rows[0].hasOwnProperty('hash'));
  assert('meta-campo "activity" propagato',   rows[0].hasOwnProperty('activity'));
  assert('campo "__id" presente',             rows[0].hasOwnProperty('inputs__id'));
}

section('normalizeColumn — ID deterministico');

{
  const rows = normalizeColumn(SIMPLE, 'inputs', ['hash', 'activity']);
  const ids = rows.map(r => r['inputs__id']);

  assert('primo ID = inputs_0xAAA_1',  ids[0] === 'inputs_0xAAA_1', `got: ${ids[0]}`);
  assert('secondo ID = inputs_0xAAA_2', ids[1] === 'inputs_0xAAA_2', `got: ${ids[1]}`);
  assert('terzo ID = inputs_0xBBB_1',  ids[2] === 'inputs_0xBBB_1', `got: ${ids[2]}`);
  assert('ID unici', new Set(ids).size === ids.length);
}

section('normalizeColumn — edge cases');

{
  const rows = normalizeColumn(SIMPLE, 'inputs', ['hash']);
  assert('array vuoto ([]) → riga saltata',  rows.every(r => r.hash !== '0xCCC'));
  assert('valore null → riga saltata',       rows.every(r => r.hash !== '0xDDD'));
}

{
  const rows = normalizeColumn(PRIMITIVE_ARRAY, 'tags', ['hash', 'activity']);
  assert('array di primitivi → campo "{col}_value"', rows[0].hasOwnProperty('tags_value'));
  assert('valore primitivo corretto', rows[0]['tags_value'] === 'a');
  assert('3 righe da primo record', rows.filter(r => r.hash === '0x1').length === 3);
}

// ─── 3. normalizeData ─────────────────────────────────────────────────────────

section('normalizeData');

{
  const result = normalizeData(SIMPLE, [0]);
  assert('ritorna oggetto con "normalized"', result !== null && Array.isArray(result.normalized));
  assert('ritorna nestedColumns',            Array.isArray(result.nestedColumns));
  assert('ritorna flatColumns',              Array.isArray(result.flatColumns));
  assert('righe corrette (solo non-vuote)',  result.normalized.length === 3);
}

{
  const result = normalizeData(EMPTY_RECORDS, [0]);
  assert('records vuoti → null', result === null);
}

{
  const result = normalizeData(ONLY_FLAT, [0]);
  assert('nessuna colonna nested → null', result === null);
}

{
  const result = normalizeData(SIMPLE, [99]);
  assert('indice fuori range → null', result === null);
}

// ─── 4. Test su dataset reale PancakeSwap ──────────────────────────────────────

section('Dataset reale — pancakeSwap.json');

{
  const dataPath = path.join(__dirname, '../Backend/pancakeSwap.json');
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const records = (Array.isArray(raw) ? raw : Object.values(raw)).filter(r => Object.keys(r).length > 0);

  const { nested, flat } = detectNestedColumns(records);
  assert('rileva colonne nested nel dataset reale', nested.length > 0);
  assert('"inputNames" presente tra nested',        nested.includes('inputNames'));
  assert('"events" presente tra nested',            nested.includes('events'));
  assert('"activity" presente tra flat',            flat.includes('activity'));
  assert('"timestamp" presente tra flat',           flat.includes('timestamp'));

  const result = normalizeData(records, [0]);
  assert('normalizzazione dataset reale non null',  result !== null);
  assert('produce almeno 10 righe',                 result !== null && result.normalized.length >= 10);

  if (result) {
    const ids = result.normalized.map(r => r[`${nested[0]}__id`]);
    assert('tutti gli ID presenti',  ids.every(id => id !== undefined));
    assert('tutti gli ID unici',     new Set(ids).size === ids.length);
  }
}

// ─── Risultato finale ─────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Risultato: ${passed} passati, ${failed} falliti`);
if (failed > 0) process.exit(1);
