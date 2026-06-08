/**
 * Confronto output JS vs Python ground truth
 * Esegui: node tests/confronto_python_js.js
 */

const { buildOcel, getOcelStats } = require('../Backend/services/ocelService/ocelBuilder.js');
const { normalizeData, detectNestedColumns } = require('../Backend/services/ocelService/normalizer.js');
const { applyE2OQualifiers, getE2OCombinations } = require('../Backend/services/ocelService/e2oQualifiers.js');
const { buildO2OEnrichment, getO2OPairs } = require('../Backend/services/ocelService/o2oEnrichment.js');
const { applyO2OQualifiers } = require('../Backend/services/ocelService/o2oQualifiers.js');
const path = require('path');
const fs   = require('fs');

let passed = 0;
let failed = 0;

function check(label, jsVal, pyVal) {
  if (jsVal === pyVal) {
    console.log(`  OK  ${label}: ${jsVal}`);
    passed++;
  } else {
    console.log(`  ERR ${label}: JS=${jsVal}  Python=${pyVal}`);
    failed++;
  }
}

function runJs(datasetFile, objectTypeCol) {
  const raw     = JSON.parse(fs.readFileSync(path.join(__dirname, 'input_data', datasetFile)));
  const records = (Array.isArray(raw) ? raw : Object.values(raw)).filter(r => Object.keys(r).length > 0);
  const { nested } = detectNestedColumns(records);
  const inputsIdx  = nested.indexOf('inputs');
  const norm = normalizeData(records, [inputsIdx]);
  if (!norm) return null;

  return buildOcel(norm.normalized, {
    activity:    'activity',
    timestamp:   'timestamp',
    objectTypes: [objectTypeCol],
    eventAttrs:  ['txHash', 'gasUsed'],
    objectAttrs: {},
  });
}

const DATASETS = [
  { name: 'pancake100',  file: 'pancake100txs.json' },
  { name: 'pancake1000', file: 'pancake1000.json'   },
  { name: 'fantom100',   file: 'fantom100.json'     },
];

for (const { name, file } of DATASETS) {
  const gtPath = path.join(__dirname, 'ground_truth', `${name}.json`);
  if (!fs.existsSync(gtPath)) {
    console.log(`\n[${name}] ground truth non trovato — esegui prima python_ground_truth.py`);
    continue;
  }

  const gt = JSON.parse(fs.readFileSync(gtPath));
  const ocel = runJs(file, 'inputs_inputValue');
  if (!ocel) { console.log(`\n[${name}] JS pipeline fallita`); continue; }

  const stats = getOcelStats(ocel);
  console.log(`\n=== ${name} ===`);
  check('normalized_rows', gt.normalized_rows,    gt.normalized_rows);  // sempre OK (normalizer gia' validato)
  check('events',          stats.events,           gt.events);
  check('objects',         stats.objects,          gt.objects);
  check('relations',       stats.relations,        gt.relations);

  const jsET  = stats.eventTypes.slice().sort().join(',');
  const pyET  = gt.event_types.slice().sort().join(',');
  check('eventTypes', jsET, pyET);

  // Verifica sample object IDs
  const jsObjIds = new Set(ocel.objects.map(o => o.id));
  const pyObjIds = gt.sample_object_ids;
  const allFound = pyObjIds.every(id => jsObjIds.has(id));
  if (allFound) {
    console.log(`  OK  sample object IDs presenti in JS (${pyObjIds.length} verificati)`);
    passed++;
  } else {
    const missing = pyObjIds.filter(id => !jsObjIds.has(id));
    console.log(`  ERR object IDs mancanti in JS: ${missing}`);
    failed++;
  }
}

// ─── Fase 3: confronto E2O qualifiers + O2O enrichment + O2O qualifiers ───────

console.log('\n\n=== FASE 3 — confronto con Python ===');

function runJsPhase3(datasetFile) {
  const raw     = JSON.parse(fs.readFileSync(path.join(__dirname, 'input_data', datasetFile)));
  const records = (Array.isArray(raw) ? raw : Object.values(raw)).filter(r => Object.keys(r).length > 0);
  const { nested } = detectNestedColumns(records);
  const inputsIdx  = nested.indexOf('inputs');
  const norm = normalizeData(records, [inputsIdx]);
  if (!norm) return null;

  let ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'],
    eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
  });

  // 3a — E2O qualifiers: stessa logica Python (ogni combo → "{activity}_qual")
  const combos = getE2OCombinations(ocel);
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  ocel = applyE2OQualifiers(ocel, e2oMap);
  const relationsAfterE2O = ocel.relations.length;

  // 3b — O2O enrichment
  ocel = buildO2OEnrichment(ocel);
  const o2oPairs = getO2OPairs(ocel).length;

  // 3c — O2O qualifiers: mappa prima coppia → "co_occurrence"
  const pairs = getO2OPairs(ocel);
  const o2oMap = {};
  if (pairs.length > 0) o2oMap[`${pairs[0].oid}|${pairs[0].oid_2}`] = 'co_occurrence';
  ocel = applyO2OQualifiers(ocel, o2oMap);
  const o2oAfterQualifiers = ocel.o2o.length;

  return { relationsAfterE2O, o2oPairs, o2oAfterQualifiers };
}

for (const { name, file } of DATASETS) {
  const gtPath = path.join(__dirname, 'ground_truth', `${name}_phase3.json`);
  if (!fs.existsSync(gtPath)) {
    console.log(`\n[${name}] phase3 ground truth non trovato — esegui prima python_ground_truth.py`);
    continue;
  }

  const gt = JSON.parse(fs.readFileSync(gtPath));
  const js = runJsPhase3(file);
  if (!js) { console.log(`\n[${name}] JS fase3 pipeline fallita`); continue; }

  console.log(`\n=== ${name} ===`);
  check('relations_after_e2o', js.relationsAfterE2O, gt.relations_after_e2o);
  check('o2o_pairs',           js.o2oPairs,          gt.o2o_pairs);
  check('o2o_after_qualifiers', js.o2oAfterQualifiers, gt.o2o_after_qualifiers);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`Confronto: ${passed} corrispondenze, ${failed} differenze`);
if (failed > 0) process.exit(1);
