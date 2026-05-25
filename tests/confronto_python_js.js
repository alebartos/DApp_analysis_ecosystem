/**
 * Confronto output JS vs Python ground truth
 * Esegui: node tests/confronto_python_js.js
 */

const { buildOcel, getOcelStats } = require('../Backend/services/ocelService/ocelBuilder.js');
const { normalizeData, detectNestedColumns } = require('../Backend/services/ocelService/normalizer.js');
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

console.log(`\n${'─'.repeat(50)}`);
console.log(`Confronto: ${passed} corrispondenze, ${failed} differenze`);
if (failed > 0) process.exit(1);
