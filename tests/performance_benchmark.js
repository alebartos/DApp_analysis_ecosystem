/**
 * Benchmark performance pipeline OCEL — dataset reali BlockchainDataset
 * Esegui: node tests/performance_benchmark.js
 */

const { detectNestedColumns, normalizeData } = require('../Backend/services/ocelService/normalizer');
const { buildOcel } = require('../Backend/services/ocelService/ocelBuilder');
const { getE2OCombinations, applyE2OQualifiers } = require('../Backend/services/ocelService/e2oQualifiers');
const { buildO2OEnrichment } = require('../Backend/services/ocelService/o2oEnrichment');
const { applyO2OQualifiers } = require('../Backend/services/ocelService/o2oQualifiers');
const { toOcel2Json, toFlatCsv } = require('../Backend/services/ocelService/ocelExporter');
const fs   = require('fs');
const path = require('path');

const RUNS = 5;
const INPUT_DIR = path.join(__dirname, 'input_data');

// ─── Preprocessing dataset BlockchainDataset ──────────────────────────────────
// Normalizza il formato MongoDB verso quello atteso dalla pipeline

function preprocessRecords(raw) {
  return raw
    .filter(r => r && Object.keys(r).length > 0)
    .map(r => {
      const ts = r.timestamp?.$date ?? r.timestamp ?? null;
      return {
        ...r,
        activity:  r.functionName ?? r.activity ?? null,
        timestamp: typeof ts === 'string' ? ts : (ts ? new Date(ts).toISOString() : null),
      };
    })
    .filter(r => r.activity && r.timestamp);
}

// ─── Esecuzione pipeline completa ────────────────────────────────────────────

function runPipeline(records) {
  const t = {};

  let t0 = performance.now();
  const { nested } = detectNestedColumns(records);
  t.detect = performance.now() - t0;

  const nestedIndexes = nested.map((_, i) => i);

  t0 = performance.now();
  const { normalized } = normalizeData(records, nestedIndexes);
  t.normalize = performance.now() - t0;

  t0 = performance.now();
  let ocel = buildOcel(normalized, {
    activity:    'activity',
    timestamp:   'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'],
    eventAttrs:  ['transactionHash', 'gasUsed'],
    objectAttrs: {},
  });
  t.build = performance.now() - t0;

  t0 = performance.now();
  const combos = getE2OCombinations(ocel);
  t.e2oCombos = performance.now() - t0;

  t0 = performance.now();
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  ocel = applyE2OQualifiers(ocel, e2oMap);
  t.e2oQual = performance.now() - t0;

  t0 = performance.now();
  ocel = buildO2OEnrichment(ocel);
  t.o2oEnrich = performance.now() - t0;

  t0 = performance.now();
  ocel = applyO2OQualifiers(ocel, {});
  t.o2oQual = performance.now() - t0;

  t0 = performance.now();
  toOcel2Json(ocel);
  t.exportJson = performance.now() - t0;

  t0 = performance.now();
  toFlatCsv(ocel);
  t.exportCsv = performance.now() - t0;

  t.total = Object.values(t).reduce((a, b) => a + b, 0);

  return { t, stats: {
    txInput:   records.length,
    normRows:  normalized.length,
    events:    ocel.events.length,
    objects:   ocel.objects.length,
    relations: ocel.relations.length,
    o2oPairs:  ocel.o2o?.length ?? 0,
    combos:    combos.length,
  }};
}

// ─── Media di N run ──────────────────────────────────────────────────────────

function benchmark(label, records) {
  console.log(`\nBenchmark: ${label} (${records.length} tx input)`);
  const allT = [];
  let stats;
  for (let i = 0; i < RUNS; i++) {
    const res = runPipeline(records);
    allT.push(res.t);
    stats = res.stats;
    process.stdout.write('.');
  }
  console.log();

  const phases = Object.keys(allT[0]);
  const avg = {};
  for (const p of phases) {
    avg[p] = allT.reduce((s, t) => s + t[p], 0) / RUNS;
  }

  return { label, avg, stats };
}

// ─── Stampa risultati ─────────────────────────────────────────────────────────

function printResult(r) {
  const { label, avg, stats } = r;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Dataset: ${label}`);
  console.log(`  tx input: ${stats.txInput} | righe norm: ${stats.normRows} | eventi: ${stats.events} | oggetti: ${stats.objects}`);
  console.log(`  relazioni E2O: ${stats.relations} | coppie O2O: ${stats.o2oPairs} | combos E2O: ${stats.combos}`);
  console.log(`\n  Fase                  Tempo medio (${RUNS} run)`);
  console.log(`  ${'─'.repeat(40)}`);
  const labels = {
    detect:     '1a detectNestedColumns',
    normalize:  '1b normalizeData      ',
    build:      '2  buildOcel          ',
    e2oCombos:  '3a getE2OCombinations ',
    e2oQual:    '3a applyE2OQualifiers ',
    o2oEnrich:  '3b buildO2OEnrichment ',
    o2oQual:    '3c applyO2OQualifiers ',
    exportJson: '5  toOcel2Json        ',
    exportCsv:  '5  toFlatCsv          ',
    total:      '   TOTALE             ',
  };
  for (const [k, lbl] of Object.entries(labels)) {
    if (k === 'total') console.log(`  ${'─'.repeat(40)}`);
    console.log(`  ${lbl}  ${avg[k].toFixed(2).padStart(8)} ms`);
  }
}

// ─── Dataset da testare ───────────────────────────────────────────────────────

const datasets = [
  // Dataset esistenti
  { file: 'pancake100txs.json', label: 'pancake100txs',  preprocess: false },
  { file: 'pancake1000.json',   label: 'pancake1000',    preprocess: false },
  { file: 'fantom100.json',     label: 'fantom100',      preprocess: false },
  // Dataset BlockchainDataset (OSF)
  { file: 'beanstalk.json',     label: 'beanstalk',      preprocess: true  },
  { file: '0x06012c.json',      label: 'cryptokitties',  preprocess: true  },
  { file: '0xb4e16d.json',      label: '0xb4e16d',       preprocess: true  },
  { file: '0x323a76.json',      label: '0x323a76',       preprocess: true  },
  { file: '0xb1690c.json',      label: '0xb1690c',       preprocess: true  },
  { file: '0x5efda5.json',      label: '0x5efda5',       preprocess: true  },
  { file: '0x219ab5.json',      label: '0x219ab5',       preprocess: true  },
  { file: '0x556b93.json',      label: '0x556b93',       preprocess: true  },
  { file: '0xd90e2f_large.json',label: '0xd90e2f LARGE', preprocess: true  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`Performance Benchmark — Pipeline OCEL 2.0`);
console.log(`Node.js ${process.version} | ${RUNS} run per dataset | media aritmetica`);

const results = [];
for (const ds of datasets) {
  const filePath = path.join(INPUT_DIR, ds.file);
  if (!fs.existsSync(filePath)) { console.log(`\nSKIP ${ds.file} (non trovato)`); continue; }
  console.log(`\nCaricamento ${ds.file}...`);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const records = ds.preprocess ? preprocessRecords(Array.isArray(raw) ? raw : [raw]) : raw.filter(r => Object.keys(r).length > 0);
  if (records.length === 0) { console.log(`  SKIP — nessun record valido`); continue; }
  results.push(benchmark(ds.label, records));
}

for (const r of results) printResult(r);

// ─── Tabella riepilogativa ────────────────────────────────────────────────────

console.log(`\n\n${'═'.repeat(90)}`);
console.log('RIEPILOGO COMPARATIVO');
console.log(`${'═'.repeat(90)}`);
console.log('Dataset'.padEnd(35) + 'Tx input'.padStart(10) + 'Norm rows'.padStart(12) + 'Relazioni'.padStart(12) + 'Totale'.padStart(12));
console.log('─'.repeat(90));
for (const r of results) {
  console.log(
    r.label.padEnd(35) +
    String(r.stats.txInput).padStart(10) +
    String(r.stats.normRows).padStart(12) +
    String(r.stats.relations).padStart(12) +
    `${r.avg.total.toFixed(1)} ms`.padStart(12)
  );
}
