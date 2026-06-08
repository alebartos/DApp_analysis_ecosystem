/**
 * Test Fase 5 — ocelExporter.js (toOcel2Json, toFlatCsv)
 * Esegui: node tests/fase5_exporter.test.js
 */

const { toOcel2Json, toFlatCsv } = require('../Backend/services/ocelService/ocelExporter');
const { buildOcel } = require('../Backend/services/ocelService/ocelBuilder');
const { normalizeData, detectNestedColumns } = require('../Backend/services/ocelService/normalizer');
const { applyE2OQualifiers, getE2OCombinations } = require('../Backend/services/ocelService/e2oQualifiers');
const { buildO2OEnrichment } = require('../Backend/services/ocelService/o2oEnrichment');
const { applyO2OQualifiers } = require('../Backend/services/ocelService/o2oQualifiers');
const path = require('path');
const fs   = require('fs');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  OK  ${label}`);
    passed++;
  } else {
    console.log(`  ERR ${label}${detail ? ' -- ' + detail : ''}`);
    failed++;
  }
}

function section(title) { console.log(`\n-- ${title}`); }

// ─── Fixture comune ───────────────────────────────────────────────────────────

const ROWS = [
  { activity: 'approve',  timestamp: '1000', inputs_inputValue: '0xAAA', sender: '0xS1', txHash: '0xTX1' },
  { activity: 'transfer', timestamp: '1001', inputs_inputValue: '0xBBB', sender: '0xS1', txHash: '0xTX2' },
  { activity: 'approve',  timestamp: '1003', inputs_inputValue: '0xAAA', sender: '0xS2', txHash: '0xTX3' },
];

const PARAMS_TWO = {
  activity: 'activity', timestamp: 'timestamp',
  objectTypes: ['inputs_inputValue', 'sender'],
  eventAttrs: ['txHash'], objectAttrs: {},
};

// ─── toOcel2Json — struttura ──────────────────────────────────────────────────

section('toOcel2Json -- struttura output');
{
  const ocel = buildOcel(ROWS, PARAMS_TWO);
  const out  = toOcel2Json(ocel);

  assert('output ha objectTypes', Array.isArray(out.objectTypes));
  assert('output ha eventTypes',  Array.isArray(out.eventTypes));
  assert('output ha objects',     Array.isArray(out.objects));
  assert('output ha events',      Array.isArray(out.events));
  assert('output NON ha relations (campo interno omesso)', !('relations' in out));
  assert('output NON ha o2o (campo interno omesso)',       !('o2o' in out));
}

// ─── toOcel2Json — eventi invariati ───────────────────────────────────────────

section('toOcel2Json -- eventi preservati invariati');
{
  const ocel = buildOcel(ROWS, PARAMS_TWO);
  const out  = toOcel2Json(ocel);

  assert('numero eventi uguale', out.events.length === ocel.events.length, `got ${out.events.length}`);
  assert('ogni evento ha id',   out.events.every(e => 'id'   in e));
  assert('ogni evento ha type', out.events.every(e => 'type' in e));
  assert('ogni evento ha time', out.events.every(e => 'time' in e));
  assert('ogni evento ha relationships', out.events.every(e => Array.isArray(e.relationships)));
}

// ─── toOcel2Json — oggetti con relationships vuote senza O2O ─────────────────

section('toOcel2Json -- oggetti senza O2O hanno relationships: []');
{
  const ocel = buildOcel(ROWS, PARAMS_TWO);
  const out  = toOcel2Json(ocel);

  assert('ogni oggetto ha id',            out.objects.every(o => 'id'   in o));
  assert('ogni oggetto ha type',          out.objects.every(o => 'type' in o));
  assert('ogni oggetto ha relationships', out.objects.every(o => Array.isArray(o.relationships)));
  assert('relationships vuote senza O2O', out.objects.every(o => o.relationships.length === 0));
}

// ─── toOcel2Json — O2O incorporato negli oggetti ──────────────────────────────

section('toOcel2Json -- relazioni O2O incorporate negli oggetti');
{
  let ocel = buildOcel(ROWS, PARAMS_TWO);
  ocel = buildO2OEnrichment(ocel);
  ocel = applyO2OQualifiers(ocel, { '0xAAA|0xS1': 'approves' });

  const out = toOcel2Json(ocel);

  // La coppia (0xAAA, 0xS1) deve comparire nelle relationships di entrambi gli oggetti
  const objAAA = out.objects.find(o => o.id === '0xAAA');
  const objS1  = out.objects.find(o => o.id === '0xS1');

  assert('0xAAA trovato negli oggetti',   !!objAAA);
  assert('0xS1  trovato negli oggetti',   !!objS1);
  assert('0xAAA ha relationship verso 0xS1',
    objAAA?.relationships.some(r => r.objectId === '0xS1' && r.qualifier === 'approves'));
  assert('0xS1 ha relationship verso 0xAAA (bidirezionale)',
    objS1?.relationships.some(r => r.objectId === '0xAAA' && r.qualifier === 'approves'));
}

// ─── toOcel2Json — senza coppie O2O, relationships sempre array ───────────────

section('toOcel2Json -- ocel senza campo o2o non lancia eccezioni');
{
  const ocel = buildOcel(ROWS, PARAMS_TWO);
  delete ocel.o2o; // simula OCEL pre-fase3b
  let threw = false;
  let out;
  try { out = toOcel2Json(ocel); } catch (_) { threw = true; }
  assert('nessuna eccezione con o2o undefined', !threw);
  assert('objects hanno comunque relationships: []', out?.objects.every(o => Array.isArray(o.relationships)));
}

// ─── toOcel2Json — compatibilità struttura OCEL 2.0 ─────────────────────────

section('toOcel2Json -- struttura compatibile OCEL 2.0 standard');
{
  let ocel = buildOcel(ROWS, PARAMS_TWO);
  ocel = applyE2OQualifiers(ocel, { 'inputs_inputValue|approve': 'spender', 'sender|approve': 'from' });
  const out = toOcel2Json(ocel);

  // eventTypes: [{name, attributes:[{name,type}]}]
  assert('eventTypes[0] ha name e attributes',
    out.eventTypes.every(et => et.name && Array.isArray(et.attributes)));
  // objectTypes: [{name, attributes:[{name,type}]}]
  assert('objectTypes[0] ha name e attributes',
    out.objectTypes.every(ot => ot.name && Array.isArray(ot.attributes)));
  // events: [{id, type, time, attributes, relationships}]
  assert('events[0] ha tutte le chiavi OCEL 2.0',
    out.events.every(e => 'id' in e && 'type' in e && 'time' in e && 'attributes' in e && 'relationships' in e));
  // objects: [{id, type, attributes, relationships}]
  assert('objects[0] ha tutte le chiavi OCEL 2.0',
    out.objects.every(o => 'id' in o && 'type' in o && 'attributes' in o && 'relationships' in o));
  // relationships eventi: [{objectId, qualifier}]
  const relsWithContent = out.events.flatMap(e => e.relationships);
  assert('relationships eventi hanno objectId e qualifier',
    relsWithContent.every(r => 'objectId' in r && 'qualifier' in r));
}

// ─── toFlatCsv — struttura header ─────────────────────────────────────────────

section('toFlatCsv -- struttura header');
{
  const ocel = buildOcel(ROWS, PARAMS_TWO);
  const csv  = toFlatCsv(ocel);
  const lines = csv.trim().split('\n');
  const header = lines[0];

  assert('CSV non vuoto', csv.length > 0);
  assert('header contiene event_id',    header.includes('event_id'));
  assert('header contiene event_type',  header.includes('event_type'));
  assert('header contiene event_time',  header.includes('event_time'));
  assert('header contiene object_id',   header.includes('object_id'));
  assert('header contiene object_type', header.includes('object_type'));
  assert('header contiene qualifier',   header.includes('qualifier'));
}

// ─── toFlatCsv — numero righe ─────────────────────────────────────────────────

section('toFlatCsv -- numero righe = numero relazioni E2O');
{
  const ocel = buildOcel(ROWS, PARAMS_TWO);
  const csv  = toFlatCsv(ocel);
  const dataLines = csv.trim().split('\n').slice(1); // senza header

  assert('una riga per relazione E2O',
    dataLines.length === ocel.relations.length,
    `CSV rows=${dataLines.length}, relations=${ocel.relations.length}`);
}

// ─── toFlatCsv — attributi evento nelle colonne ───────────────────────────────

section('toFlatCsv -- attributi evento presenti come colonne');
{
  const ocel = buildOcel(ROWS, PARAMS_TWO); // txHash come eventAttr
  const csv  = toFlatCsv(ocel);
  const header = csv.split('\n')[0];

  assert('colonna txHash presente nell\'header', header.includes('txHash'));
}

// ─── toFlatCsv — escape RFC 4180 ─────────────────────────────────────────────

section('toFlatCsv -- escape valori con virgole e doppi apici');
{
  const rowsSpecial = [
    { activity: 'approve, test', timestamp: '1000', addr: 'say "hello"' },
  ];
  const ocel = buildOcel(rowsSpecial, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['addr'], eventAttrs: [], objectAttrs: {},
  });
  const csv = toFlatCsv(ocel);
  // ogni cella è racchiusa in doppi apici
  assert('prima riga dati racchiusa in apici', csv.split('\n')[1].startsWith('"'));
  // virgola interna nell'attività non spezza le colonne
  const dataLine = csv.split('\n')[1];
  const cols = [];
  let inQuote = false, cur = '';
  for (const ch of dataLine) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { cols.push(cur); cur = ''; }
    else { cur += ch; }
  }
  cols.push(cur);
  assert('numero colonne corretto nonostante virgola nel valore', cols.length === 6, `got ${cols.length}`);
  assert('doppi apici escaped ("")', csv.includes('""'));
}

// ─── toFlatCsv — OCEL senza relazioni ────────────────────────────────────────

section('toFlatCsv -- OCEL senza relazioni restituisce solo header');
{
  const emptyOcel = { events: [], objects: [], relations: [], eventTypes: [], objectTypes: [] };
  const csv = toFlatCsv(emptyOcel);
  const lines = csv.trim().split('\n');
  assert('solo header se nessuna relazione', lines.length === 1);
  assert('header sempre presente', lines[0].includes('event_id'));
}

// ─── toFlatCsv — dopo E2O qualifiers ─────────────────────────────────────────

section('toFlatCsv -- qualifier aggiornato nei dati CSV');
{
  let ocel = buildOcel(ROWS, PARAMS_TWO);
  ocel = applyE2OQualifiers(ocel, { 'inputs_inputValue|approve': 'spender_approval' });
  const csv = toFlatCsv(ocel);
  assert('qualifier "spender_approval" presente nel CSV', csv.includes('spender_approval'));
}

// ─── Test con dataset reale pancake100txs ─────────────────────────────────────

section('Pipeline completa fase 5 -- pancake100txs');
{
  const raw     = JSON.parse(fs.readFileSync(path.join(__dirname, 'input_data', 'pancake100txs.json')));
  const records = raw.filter(r => Object.keys(r).length > 0);
  const { nested } = detectNestedColumns(records);
  const norm = normalizeData(records, [nested.indexOf('inputs')]);

  let ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'],
    eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
  });

  const combos = getE2OCombinations(ocel);
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  ocel = applyE2OQualifiers(ocel, e2oMap);
  ocel = buildO2OEnrichment(ocel);
  ocel = applyO2OQualifiers(ocel, {});

  // toOcel2Json
  const json = toOcel2Json(ocel);
  assert('JSON: nessun campo interno', !('relations' in json) && !('o2o' in json));
  assert('JSON: events > 0', json.events.length > 0);
  assert('JSON: objects > 0', json.objects.length > 0);
  assert('JSON: tutti gli oggetti hanno relationships array',
    json.objects.every(o => Array.isArray(o.relationships)));

  // toFlatCsv
  const csv = toFlatCsv(ocel);
  const csvLines = csv.trim().split('\n');
  assert('CSV: almeno header + 1 riga dati', csvLines.length > 1);
  assert('CSV: header con colonne obbligatorie',
    csvLines[0].includes('event_id') && csvLines[0].includes('object_id'));
  assert('CSV: numero righe = numero relazioni E2O',
    csvLines.length - 1 === ocel.relations.length,
    `CSV=${csvLines.length - 1}, relations=${ocel.relations.length}`);

  console.log(`\n  STATS: ${json.events.length} eventi, ${json.objects.length} oggetti, ${ocel.relations.length} rel E2O`);
}

// ─── Risultato ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Risultato: ${passed} passati, ${failed} falliti`);
if (failed > 0) process.exit(1);
