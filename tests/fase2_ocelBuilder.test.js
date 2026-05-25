/**
 * Test Fase 2 — ocelBuilder.js
 * Esegui: node tests/fase2_ocelBuilder.test.js
 */

const { buildOcel, getOcelStats } = require('../Backend/services/ocelService/ocelBuilder.js');
const { normalizeData, detectNestedColumns } = require('../Backend/services/ocelService/normalizer.js');
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

function loadDataset(name) {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'input_data', name)));
  return (Array.isArray(raw) ? raw : Object.values(raw)).filter(r => Object.keys(r).length > 0);
}

function loadGroundTruth(name) {
  const p = path.join(__dirname, 'ground_truth', `${name}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p)) : null;
}

// ─── Fixture sintetica ────────────────────────────────────────────────────────

// Nota: objectTypes sono ora colonne VALORE (non __id), come pm4py
const NORMALIZED = [
  { activity: 'transfer', timestamp: '1000', inputs_inputName: 'to',      inputs_inputValue: '0xAAA', inputs__id: 'inputs_transfer_1' },
  { activity: 'transfer', timestamp: '1001', inputs_inputName: 'amount',  inputs_inputValue: 100,     inputs__id: 'inputs_transfer_2' }, // numero → scartato
  { activity: 'approve',  timestamp: '1002', inputs_inputName: 'spender', inputs_inputValue: '0xBBB', inputs__id: 'inputs_approve_1'  },
  { activity: 'transfer', timestamp: '1003', inputs_inputName: 'to',      inputs_inputValue: '0xAAA', inputs__id: 'inputs_transfer_3' }, // duplicato
];

const PARAMS = {
  activity:    'activity',
  timestamp:   'timestamp',
  objectTypes: ['inputs_inputValue'],   // colonna valore, come pm4py
  eventAttrs:  [],
  objectAttrs: {},
};

// ─── 1. Struttura output ──────────────────────────────────────────────────────

section('Struttura output buildOcel');
{
  const ocel = buildOcel(NORMALIZED, PARAMS);
  assert('ritorna events',      Array.isArray(ocel.events));
  assert('ritorna objects',     Array.isArray(ocel.objects));
  assert('ritorna relations',   Array.isArray(ocel.relations));
  assert('ritorna eventTypes',  Array.isArray(ocel.eventTypes));
  assert('ritorna objectTypes', Array.isArray(ocel.objectTypes));
}

// ─── 2. Events ────────────────────────────────────────────────────────────────

section('Events');
{
  const ocel = buildOcel(NORMALIZED, PARAMS);
  assert('4 eventi (uno per riga)', ocel.events.length === 4, `got ${ocel.events.length}`);
  const e = ocel.events[0];
  assert('evento ha id',   !!e.id);
  assert('evento ha type', e.type === 'transfer');
  assert('evento ha time', e.time === '1000');
}

// ─── 3. Objects e deduplicazione ──────────────────────────────────────────────

section('Objects -- deduplicazione per valore (come pm4py)');
{
  const ocel = buildOcel(NORMALIZED, PARAMS);
  // 0xAAA appare 2 volte ma e' 1 oggetto; 100 (numero) scartato; 0xBBB = 1 oggetto → tot 2
  assert('2 oggetti unici (dedup + skip numeri)', ocel.objects.length === 2, `got ${ocel.objects.length}`);
  assert('object ID = valore raw (non prefissato)', ocel.objects.some(o => o.id === '0xAAA'));
  assert('object type = nome colonna', ocel.objects[0].type === 'inputs_inputValue');
}

// ─── 4. Relations ─────────────────────────────────────────────────────────────

section('Relations E2O');
{
  const ocel = buildOcel(NORMALIZED, PARAMS);
  // 4 righe: 0xAAA, 100(skip), 0xBBB, 0xAAA → 3 relazioni
  assert('3 relazioni (numero scartato)', ocel.relations.length === 3, `got ${ocel.relations.length}`);
  assert('qualifier stringa vuota (default pm4py)', ocel.relations[0].qualifier === '');
}

// ─── 5. EventTypes / ObjectTypes ──────────────────────────────────────────────

section('EventTypes e ObjectTypes');
{
  const ocel = buildOcel(NORMALIZED, PARAMS);
  const etNames = ocel.eventTypes.map(t => t.name).sort();
  assert('2 eventTypes (transfer, approve)', ocel.eventTypes.length === 2);
  assert('transfer presente', etNames.includes('transfer'));
  assert('approve presente',  etNames.includes('approve'));
  assert('1 objectType',      ocel.objectTypes.length === 1);
  assert('objectType = nome colonna', ocel.objectTypes[0].name === 'inputs_inputValue');
}

// ─── 6. Edge cases ────────────────────────────────────────────────────────────

section('Edge cases');
{
  const rows = [
    { activity: null,       timestamp: '1000', inputs_inputValue: '0xAAA' },
    { activity: 'transfer', timestamp: null,   inputs_inputValue: '0xBBB' },
    { activity: 'transfer', timestamp: '1000', inputs_inputValue: null    },
    { activity: 'transfer', timestamp: '1000', inputs_inputValue: 12345   }, // numero
    { activity: 'transfer', timestamp: '1000', inputs_inputValue: ''      }, // stringa vuota
  ];
  const ocel = buildOcel(rows, PARAMS);
  assert('righe senza activity/timestamp saltate', ocel.events.length === 3, `got ${ocel.events.length}`);
  assert('null/number/empty → nessun oggetto',     ocel.objects.length === 0);
  assert('null/number/empty → nessuna relazione',  ocel.relations.length === 0);
}

// ─── 7. Confronto con ground truth Python ─────────────────────────────────────

section('Confronto con ground truth Python -- pancake100txs (100 tx)');
{
  const gt = loadGroundTruth('pancake100');
  if (!gt) {
    console.log('  SKIP ground truth non disponibile -- esegui prima python_ground_truth.py');
  } else {
    const records = loadDataset('pancake100txs.json');
    const { nested } = detectNestedColumns(records);
    const norm = normalizeData(records, [nested.indexOf('inputs')]);
    const ocel = buildOcel(norm.normalized, {
      activity: 'activity', timestamp: 'timestamp',
      objectTypes: ['inputs_inputValue'], eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
    });
    const stats = getOcelStats(ocel);

    assert(`events = ${gt.events}`,    stats.events    === gt.events,    `got ${stats.events}`);
    assert(`objects = ${gt.objects}`,  stats.objects   === gt.objects,   `got ${stats.objects}`);
    assert(`relations = ${gt.relations}`, stats.relations === gt.relations, `got ${stats.relations}`);
    assert('eventTypes identici a Python', stats.eventTypes.sort().join(',') === gt.event_types.sort().join(','));
    assert('sample object IDs identici', gt.sample_object_ids.every(id => ocel.objects.some(o => o.id === id)));

    console.log(`\n  STATS pancake100: ${stats.events} ev, ${stats.objects} obj, ${stats.relations} rel`);
  }
}

section('Confronto con ground truth Python -- pancake1000 (1000 tx)');
{
  const gt = loadGroundTruth('pancake1000');
  if (!gt) {
    console.log('  SKIP ground truth non disponibile');
  } else {
    const records = loadDataset('pancake1000.json');
    const { nested } = detectNestedColumns(records);
    const norm = normalizeData(records, [nested.indexOf('inputs')]);
    const ocel = buildOcel(norm.normalized, {
      activity: 'activity', timestamp: 'timestamp',
      objectTypes: ['inputs_inputValue'], eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
    });
    const stats = getOcelStats(ocel);

    assert(`events = ${gt.events}`,       stats.events    === gt.events,    `got ${stats.events}`);
    assert(`objects = ${gt.objects}`,     stats.objects   === gt.objects,   `got ${stats.objects}`);
    assert(`relations = ${gt.relations}`, stats.relations === gt.relations, `got ${stats.relations}`);
    assert('eventTypes identici a Python', stats.eventTypes.sort().join(',') === gt.event_types.sort().join(','));

    console.log(`\n  STATS pancake1000: ${stats.events} ev, ${stats.objects} obj, ${stats.relations} rel`);
  }
}

section('Confronto con ground truth Python -- fantom100 (100 tx)');
{
  const gt = loadGroundTruth('fantom100');
  if (!gt) {
    console.log('  SKIP ground truth non disponibile');
  } else {
    const records = loadDataset('fantom100.json');
    const { nested } = detectNestedColumns(records);
    const norm = normalizeData(records, [nested.indexOf('inputs')]);
    const ocel = buildOcel(norm.normalized, {
      activity: 'activity', timestamp: 'timestamp',
      objectTypes: ['inputs_inputValue'], eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
    });
    const stats = getOcelStats(ocel);

    assert(`events = ${gt.events}`,       stats.events    === gt.events,    `got ${stats.events}`);
    assert(`objects = ${gt.objects}`,     stats.objects   === gt.objects,   `got ${stats.objects}`);
    assert(`relations = ${gt.relations}`, stats.relations === gt.relations, `got ${stats.relations}`);

    console.log(`\n  STATS fantom100: ${stats.events} ev, ${stats.objects} obj, ${stats.relations} rel`);
  }
}

// ─── Risultato ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Risultato: ${passed} passati, ${failed} falliti`);
if (failed > 0) process.exit(1);
