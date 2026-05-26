/**
 * Test Fase 3 — e2oQualifiers.js, o2oEnrichment.js, o2oQualifiers.js
 * Esegui: node tests/fase3_qualifiers.test.js
 */

const { buildOcel } = require('../Backend/services/ocelService/ocelBuilder');
const { normalizeData, detectNestedColumns } = require('../Backend/services/ocelService/normalizer');
const { applyE2OQualifiers, getE2OCombinations } = require('../Backend/services/ocelService/e2oQualifiers');
const { buildO2OEnrichment, getO2OPairs } = require('../Backend/services/ocelService/o2oEnrichment');
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

// ─── Fixture sintetica ────────────────────────────────────────────────────────
//
// Tre eventi, ognuno con 2 oggetti (indirizzo + sender) → coppie O2O possibili
//
//  Ev0: activity=approve,   obj=0xAAA (inputs_inputValue), sender=0xS1
//  Ev1: activity=transfer,  obj=0xBBB (inputs_inputValue), sender=0xS1  ← sender condiviso
//  Ev2: activity=transfer,  obj=100   (scartato = numero), sender=0xS2
//  Ev3: activity=approve,   obj=0xAAA (inputs_inputValue), sender=0xS2

const NORMALIZED = [
  { activity: 'approve',  timestamp: '1000', inputs_inputValue: '0xAAA', sender: '0xS1' },
  { activity: 'transfer', timestamp: '1001', inputs_inputValue: '0xBBB', sender: '0xS1' },
  { activity: 'transfer', timestamp: '1002', inputs_inputValue: 100,     sender: '0xS2' }, // numero → scartato da inputs_inputValue
  { activity: 'approve',  timestamp: '1003', inputs_inputValue: '0xAAA', sender: '0xS2' },
];

const PARAMS_ONE = {
  activity: 'activity', timestamp: 'timestamp',
  objectTypes: ['inputs_inputValue'], eventAttrs: [], objectAttrs: {},
};

const PARAMS_TWO = {
  activity: 'activity', timestamp: 'timestamp',
  objectTypes: ['inputs_inputValue', 'sender'], eventAttrs: [], objectAttrs: {},
};

// ─── 1. getE2OCombinations ────────────────────────────────────────────────────

section('getE2OCombinations');
{
  const ocel = buildOcel(NORMALIZED, PARAMS_ONE);
  const combos = getE2OCombinations(ocel);
  assert('ritorna array', Array.isArray(combos));
  assert('2 combo (approve+inputs, transfer+inputs)', combos.length === 2, `got ${combos.length}`);
  assert('ogni combo ha objectType e activity', combos.every(c => c.objectType && c.activity));
  const keys = combos.map(c => `${c.objectType}|${c.activity}`).sort();
  assert('contiene inputs_inputValue|approve',  keys.includes('inputs_inputValue|approve'));
  assert('contiene inputs_inputValue|transfer', keys.includes('inputs_inputValue|transfer'));
}

// ─── 2. applyE2OQualifiers — mapping completo ─────────────────────────────────

section('applyE2OQualifiers -- mapping completo');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_ONE);
  const map = {
    'inputs_inputValue|approve':  'spender_approval',
    'inputs_inputValue|transfer': 'token_recipient',
  };
  ocel = applyE2OQualifiers(ocel, map);

  const approveRels  = ocel.relations.filter(r => r.activity === 'approve');
  const transferRels = ocel.relations.filter(r => r.activity === 'transfer');

  assert('relazioni approve hanno qualifier spender_approval',
    approveRels.every(r => r.qualifier === 'spender_approval'), `qualifiers: ${approveRels.map(r=>r.qualifier)}`);
  assert('relazioni transfer hanno qualifier token_recipient',
    transferRels.every(r => r.qualifier === 'token_recipient'), `qualifiers: ${transferRels.map(r=>r.qualifier)}`);
  assert('nessuna relazione eliminata (tutti mappati)',
    ocel.relations.length === 3, `got ${ocel.relations.length}`); // 0xAAA x2 + 0xBBB x1
}

// ─── 3. applyE2OQualifiers — mapping parziale ─────────────────────────────────

section('applyE2OQualifiers -- mapping parziale (solo approve)');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_ONE);
  const map = { 'inputs_inputValue|approve': 'spender_approval' };
  ocel = applyE2OQualifiers(ocel, map);

  const approveRels  = ocel.relations.filter(r => r.activity === 'approve');
  const transferRels = ocel.relations.filter(r => r.activity === 'transfer');

  assert('approve → qualifier aggiornato', approveRels.every(r => r.qualifier === 'spender_approval'));
  // transfer non mappato → mantiene "" (stringa vuota, default ocelBuilder)
  assert('transfer non mappato → qualifier ""', transferRels.every(r => r.qualifier === ''));
  assert('nessuna relazione eliminata (stringa vuota non è null)',
    ocel.relations.length === 3, `got ${ocel.relations.length}`);
}

// ─── 4. applyE2OQualifiers — relazioni null rimosse ──────────────────────────

section('applyE2OQualifiers -- relazioni con qualifier null rimosse');
{
  // Costruiamo un OCEL con qualifier null iniettato manualmente
  let ocel = buildOcel(NORMALIZED, PARAMS_ONE);
  // Forza qualifier null su alcune relazioni
  ocel = {
    ...ocel,
    relations: ocel.relations.map((r, i) => ({ ...r, qualifier: i === 0 ? null : r.qualifier }))
  };
  // map vuoto → mantiene tutti i qualifier esistenti; il null verrà rimosso
  ocel = applyE2OQualifiers(ocel, {});
  assert('relazione con qualifier null rimossa', ocel.relations.length === 2, `got ${ocel.relations.length}`);
}

// ─── 5. applyE2OQualifiers — eventi aggiornati ───────────────────────────────

section('applyE2OQualifiers -- relationships dentro gli eventi aggiornate');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_ONE);
  const map = { 'inputs_inputValue|approve': 'Q_APPROVE' };
  ocel = applyE2OQualifiers(ocel, map);

  const approveEvs = ocel.events.filter(e => e.type === 'approve');
  assert('eventi approve hanno qualifier Q_APPROVE nelle relationships',
    approveEvs.every(e => e.relationships.every(r => r.qualifier === 'Q_APPROVE')));
}

// ─── 6. buildO2OEnrichment — struttura output ─────────────────────────────────

section('buildO2OEnrichment -- struttura output');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_TWO);
  ocel = buildO2OEnrichment(ocel);

  assert('ocel.o2o è un array', Array.isArray(ocel.o2o));
  assert('ogni coppia ha oid, oid_2, qualifier', ocel.o2o.every(p => 'oid' in p && 'oid_2' in p && 'qualifier' in p));
  assert('qualifier inizializzato a null', ocel.o2o.every(p => p.qualifier === null));
}

// ─── 7. buildO2OEnrichment — coppie corrette ──────────────────────────────────

section('buildO2OEnrichment -- coppie generate correttamente');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_TWO);
  ocel = buildO2OEnrichment(ocel);

  // Ev0: 0xAAA + 0xS1 → (0xAAA,0xS1) e (0xS1,0xAAA)
  // Ev1: 0xBBB + 0xS1 → (0xBBB,0xS1) e (0xS1,0xBBB)
  // Ev2: 100(skip) + 0xS2 → 1 solo oggetto → nessuna coppia
  // Ev3: 0xAAA + 0xS2 → (0xAAA,0xS2) e (0xS2,0xAAA)
  // Coppie uniche: (0xAAA,0xS1),(0xS1,0xAAA),(0xBBB,0xS1),(0xS1,0xBBB),(0xAAA,0xS2),(0xS2,0xAAA) = 6
  assert('6 coppie O2O (coppie ordinate deduplicate)', ocel.o2o.length === 6, `got ${ocel.o2o.length}`);

  const keys = new Set(ocel.o2o.map(p => `${p.oid}||${p.oid_2}`));
  assert('(0xAAA, 0xS1) presente', keys.has('0xAAA||0xS1'));
  assert('(0xS1, 0xAAA) presente — coppie ordinate', keys.has('0xS1||0xAAA'));
  assert('(0xBBB, 0xS2) assente — non co-occorrono', !keys.has('0xBBB||0xS2'));
}

// ─── 8. buildO2OEnrichment — deduplicazione ───────────────────────────────────

section('buildO2OEnrichment -- deduplicazione coppie identiche');
{
  // Due eventi con gli stessi due oggetti → coppia appare una sola volta
  const rows = [
    { activity: 'approve',  timestamp: '1', inputs_inputValue: '0xAAA', sender: '0xS1' },
    { activity: 'transfer', timestamp: '2', inputs_inputValue: '0xAAA', sender: '0xS1' },
  ];
  let ocel = buildOcel(rows, PARAMS_TWO);
  ocel = buildO2OEnrichment(ocel);
  // Entrambi gli eventi generano (0xAAA,0xS1) e (0xS1,0xAAA) → dedup → 2 coppie
  assert('coppie duplicate deduplicate tra eventi diversi', ocel.o2o.length === 2, `got ${ocel.o2o.length}`);
}

// ─── 9. buildO2OEnrichment — evento con 1 solo oggetto ───────────────────────

section('buildO2OEnrichment -- evento con 1 solo oggetto non genera coppie');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_ONE); // 1 solo objectType
  ocel = buildO2OEnrichment(ocel);
  // inputs_inputValue solo → max 1 oggetto per evento → 0 coppie
  assert('0 coppie con 1 solo objectType', ocel.o2o.length === 0, `got ${ocel.o2o.length}`);
}

// ─── 10. getO2OPairs ──────────────────────────────────────────────────────────

section('getO2OPairs');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_TWO);
  ocel = buildO2OEnrichment(ocel);
  const pairs = getO2OPairs(ocel);
  assert('ritorna array', Array.isArray(pairs));
  assert('ogni elemento ha oid e oid_2', pairs.every(p => p.oid && p.oid_2));
  assert('stessa lunghezza di ocel.o2o', pairs.length === ocel.o2o.length);
}

// ─── 11. applyO2OQualifiers — mapping e filtro ────────────────────────────────

section('applyO2OQualifiers -- mapping e filtro null/empty');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_TWO);
  ocel = buildO2OEnrichment(ocel);

  // Mappa solo la coppia (0xAAA, 0xS1)
  const map = { '0xAAA|0xS1': 'approves' };
  ocel = applyO2OQualifiers(ocel, map);

  assert('solo 1 relazione O2O rimasta (non mappate hanno qualifier null → rimosse)',
    ocel.o2o.length === 1, `got ${ocel.o2o.length}`);
  assert('qualifier corretto', ocel.o2o[0].qualifier === 'approves');
  assert('oid e oid_2 corretti', ocel.o2o[0].oid === '0xAAA' && ocel.o2o[0].oid_2 === '0xS1');
}

// ─── 12. applyO2OQualifiers — stringa vuota rimossa ──────────────────────────

section('applyO2OQualifiers -- stringa vuota rimossa (differenza da E2O)');
{
  let ocel = buildOcel(NORMALIZED, PARAMS_TWO);
  ocel = buildO2OEnrichment(ocel);
  // Forza qualifier "" su una coppia
  ocel = { ...ocel, o2o: ocel.o2o.map((p, i) => i === 0 ? { ...p, qualifier: '' } : p) };
  ocel = applyO2OQualifiers(ocel, {});
  assert('coppia con qualifier "" rimossa', ocel.o2o.length === 0, `got ${ocel.o2o.length}`);
}

// ─── 13. Test con dataset reale pancake100txs ─────────────────────────────────

section('Pipeline completa fase 3 -- pancake100txs');
{
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'input_data', 'pancake100txs.json')));
  const records = raw.filter(r => Object.keys(r).length > 0);
  const { nested } = detectNestedColumns(records);
  const norm = normalizeData(records, [nested.indexOf('inputs')]);

  let ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'], eventAttrs: [], objectAttrs: {},
  });

  const combos = getE2OCombinations(ocel);
  assert('combos rilevati (dataset reale)', combos.length > 0, `got ${combos.length}`);

  // E2O: mappa tutte le combo
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  ocel = applyE2OQualifiers(ocel, e2oMap);
  assert('relazioni E2O non azzerate dopo qualifier', ocel.relations.length > 0);

  // O2O enrichment
  ocel = buildO2OEnrichment(ocel);
  assert('coppie O2O generate (2 objectType)', ocel.o2o.length > 0, `got ${ocel.o2o.length}`);

  const pairs = getO2OPairs(ocel);
  assert('getO2OPairs restituisce tutte le coppie', pairs.length === ocel.o2o.length);

  // O2O qualifiers: mappa prima coppia
  const o2oMap = {};
  if (pairs.length > 0) o2oMap[`${pairs[0].oid}|${pairs[0].oid_2}`] = 'co_occurrence';
  ocel = applyO2OQualifiers(ocel, o2oMap);
  assert('O2O qualifiers applicati', ocel.o2o.length <= 1);

  console.log(`\n  STATS: ${norm.normalized.length} righe norm, ${getO2OPairs(buildO2OEnrichment(buildOcel(norm.normalized, {activity:'activity',timestamp:'timestamp',objectTypes:['inputs_inputValue','sender'],eventAttrs:[],objectAttrs:{}}))).length} coppie O2O`);
}

// ─── Risultato ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Risultato: ${passed} passati, ${failed} falliti`);
if (failed > 0) process.exit(1);
