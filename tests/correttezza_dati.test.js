/**
 * Test di correttezza dati — pipeline completa Fasi 1-5 su dataset reali
 *
 * Non testa solo la struttura ma verifica i VALORI concreti di output:
 * - conteggi esatti (eventi, oggetti, relazioni, coppie O2O)
 * - qualifier corretti su ogni relazione E2O
 * - relazioni O2O incorporate correttamente nel JSON esportato
 * - righe CSV corrispondenti 1:1 alle relazioni E2O
 * - confronto con ground truth Python (se disponibile)
 *
 * Esegui: node tests/correttezza_dati.test.js
 */

const { buildOcel }                                     = require('../Backend/services/ocelService/ocelBuilder');
const { normalizeData, detectNestedColumns }             = require('../Backend/services/ocelService/normalizer');
const { applyE2OQualifiers, getE2OCombinations }         = require('../Backend/services/ocelService/e2oQualifiers');
const { buildO2OEnrichment, getO2OPairs }                = require('../Backend/services/ocelService/o2oEnrichment');
const { applyO2OQualifiers }                             = require('../Backend/services/ocelService/o2oQualifiers');
const { createSession, getSessionOcel, updateSessionOcel, deleteSession } = require('../Backend/services/ocelService/sessionStore');
const { toOcel2Json, toFlatCsv }                        = require('../Backend/services/ocelService/ocelExporter');
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

// ─── Valori attesi calcolati dalla pipeline JS (deterministici) ───────────────

const EXPECTED = {
  pancake100: {
    file: 'pancake100txs.json',
    // 1 objectType (confronto con ground truth Python)
    events_1obj: 228, objects_1obj: 50, relations_1obj: 114,
    // 2 objectType (pipeline fase 3-5)
    events_2obj: 228, objects_2obj: 133, relations_2obj: 342, o2o_pairs: 200,
    combos: 6,
    qualifiers: ['approve_qual', 'sendFrom_qual', 'transfer_qual'],
    first_object_id: '152649eA73beAb28c5b49B26eb48f7EAD6d4c898',
  },
  pancake1000: {
    file: 'pancake1000.json',
    events_1obj: 2261, objects_1obj: 228, relations_1obj: 1133,
    events_2obj: 2261, objects_2obj: 848, relations_2obj: 3394, o2o_pairs: 1838,
    combos: 10,
    qualifiers: ['approve_qual', 'sendFrom_qual', 'transferFrom_qual', 'transferOwnership_qual', 'transfer_qual'],
    first_object_id: '46A15B0b27311cedF172AB29E4f4766fbE7F4364',
  },
  fantom100: {
    file: 'fantom100.json',
    events_1obj: 84, objects_1obj: 10, relations_1obj: 84,
    events_2obj: 84, objects_2obj: 20, relations_2obj: 168, o2o_pairs: 22,
    combos: 4,
    qualifiers: ['buyEggs_qual', 'hatchEggs_qual'],
    first_object_id: '8De512bfE297e6b9D5f267dF714343471b0408fb',
  },
};

// ─── Helper: carica e normalizza un dataset ───────────────────────────────────

function loadAndNormalize(file) {
  const raw     = JSON.parse(fs.readFileSync(path.join(__dirname, 'input_data', file)));
  const records = (Array.isArray(raw) ? raw : Object.values(raw)).filter(r => Object.keys(r).length > 0);
  const { nested } = detectNestedColumns(records);
  const norm = normalizeData(records, [nested.indexOf('inputs')]);
  return { records, norm };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCCO 1 — Confronto con ground truth Python (Fasi 1+2, 1 objectType)
// ═══════════════════════════════════════════════════════════════════════════════

section('Confronto con ground truth Python — Fase 1+2 (1 objectType)');

for (const [name, exp] of Object.entries(EXPECTED)) {
  const gtPath = path.join(__dirname, 'ground_truth', `${name}.json`);
  if (!fs.existsSync(gtPath)) {
    console.log(`  SKIP [${name}] ground truth non trovato — esegui python_ground_truth.py`);
    continue;
  }
  const gt = JSON.parse(fs.readFileSync(gtPath));
  const { norm } = loadAndNormalize(exp.file);
  const ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue'], eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
  });

  assert(`[${name}] eventi == Python (${gt.events})`,      ocel.events.length    === gt.events,    `JS=${ocel.events.length}`);
  assert(`[${name}] oggetti == Python (${gt.objects})`,    ocel.objects.length   === gt.objects,   `JS=${ocel.objects.length}`);
  assert(`[${name}] relazioni == Python (${gt.relations})`,ocel.relations.length === gt.relations, `JS=${ocel.relations.length}`);

  const jsTypes  = ocel.events.map(e => e.type);
  const missingTypes = gt.event_types.filter(t => !jsTypes.includes(t));
  assert(`[${name}] eventTypes corrispondono a Python`, missingTypes.length === 0, `mancanti: ${missingTypes}`);

  const jsObjIds = new Set(ocel.objects.map(o => o.id));
  const missingIds = gt.sample_object_ids.filter(id => !jsObjIds.has(id));
  assert(`[${name}] sample object IDs Python presenti in JS`, missingIds.length === 0, `mancanti: ${missingIds}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCCO 2 — Conteggi esatti Fase 2 (2 objectType)
// ═══════════════════════════════════════════════════════════════════════════════

section('Conteggi esatti Fase 2 -- 2 objectType');

for (const [name, exp] of Object.entries(EXPECTED)) {
  const { norm } = loadAndNormalize(exp.file);
  const ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'], eventAttrs: [], objectAttrs: {},
  });

  assert(`[${name}] eventi = ${exp.events_2obj}`,    ocel.events.length    === exp.events_2obj,    `got ${ocel.events.length}`);
  assert(`[${name}] oggetti = ${exp.objects_2obj}`,  ocel.objects.length   === exp.objects_2obj,   `got ${ocel.objects.length}`);
  assert(`[${name}] relazioni = ${exp.relations_2obj}`, ocel.relations.length === exp.relations_2obj, `got ${ocel.relations.length}`);
  assert(`[${name}] primo oggetto ID = ${exp.first_object_id}`,
    ocel.objects[0]?.id === exp.first_object_id, `got ${ocel.objects[0]?.id}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCCO 3 — Correttezza qualifier E2O (ogni relazione ha il qualifier giusto)
// ═══════════════════════════════════════════════════════════════════════════════

section('Correttezza qualifier E2O -- ogni relazione ha il qualifier corretto');

for (const [name, exp] of Object.entries(EXPECTED)) {
  const { norm } = loadAndNormalize(exp.file);
  let ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'], eventAttrs: [], objectAttrs: {},
  });

  const combos = getE2OCombinations(ocel);
  assert(`[${name}] numero combinazioni = ${exp.combos}`, combos.length === exp.combos, `got ${combos.length}`);

  // mappa deterministica: objectType|activity → activity_qual
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  ocel = applyE2OQualifiers(ocel, e2oMap);

  // TUTTE le relazioni devono avere qualifier = "{activity}_qual"
  const wrongQual = ocel.relations.filter(r => r.qualifier !== `${r.activity}_qual`);
  assert(`[${name}] TUTTE le relazioni hanno qualifier "{activity}_qual"`,
    wrongQual.length === 0, `${wrongQual.length} relazioni con qualifier errato`);

  // qualifier presenti corrispondono agli activity nel dataset
  const foundQuals = [...new Set(ocel.relations.map(r => r.qualifier))].sort();
  const expectedQuals = exp.qualifiers.slice().sort();
  assert(`[${name}] set di qualifier = ${expectedQuals.join(', ')}`,
    JSON.stringify(foundQuals) === JSON.stringify(expectedQuals),
    `got: ${foundQuals.join(', ')}`);

  // qualifier negli eventi (relationships) devono corrispondere alle relations
  let evRelMismatch = 0;
  for (const ev of ocel.events) {
    for (const rel of ev.relationships) {
      const expected = `${ev.type}_qual`;
      if (rel.qualifier !== expected) evRelMismatch++;
    }
  }
  assert(`[${name}] qualifier negli eventi.relationships concordano con relations`,
    evRelMismatch === 0, `${evRelMismatch} disallineamenti`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCCO 4 — Correttezza O2O enrichment e qualifiers
// ═══════════════════════════════════════════════════════════════════════════════

section('Correttezza O2O enrichment e qualifiers');

for (const [name, exp] of Object.entries(EXPECTED)) {
  const { norm } = loadAndNormalize(exp.file);
  let ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'], eventAttrs: [], objectAttrs: {},
  });
  const combos = getE2OCombinations(ocel);
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  ocel = applyE2OQualifiers(ocel, e2oMap);
  ocel = buildO2OEnrichment(ocel);

  const pairs = getO2OPairs(ocel);
  assert(`[${name}] coppie O2O generate = ${exp.o2o_pairs}`, pairs.length === exp.o2o_pairs, `got ${pairs.length}`);

  // tutte le coppie hanno qualifier null prima di applyO2OQualifiers
  assert(`[${name}] tutti i qualifier O2O inizialmente null`,
    ocel.o2o.every(p => p.qualifier === null));

  // mappa tutte le coppie → "co_occurrence"
  const o2oMap = {};
  for (const p of pairs) o2oMap[`${p.oid}|${p.oid_2}`] = 'co_occurrence';
  ocel = applyO2OQualifiers(ocel, o2oMap);

  assert(`[${name}] coppie O2O dopo qualifiers = ${exp.o2o_pairs}`,
    ocel.o2o.length === exp.o2o_pairs, `got ${ocel.o2o.length}`);
  assert(`[${name}] tutte le coppie O2O hanno qualifier "co_occurrence"`,
    ocel.o2o.every(p => p.qualifier === 'co_occurrence'));

  // coppie senza qualifier → rimosse
  const noQual = ocel.o2o.filter(p => !p.qualifier);
  assert(`[${name}] nessuna coppia O2O senza qualifier`, noQual.length === 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCCO 5 — Correttezza sessione (Fase 4): pipeline via session store
// ═══════════════════════════════════════════════════════════════════════════════

section('Correttezza sessione Fase 4 -- OCEL evolve correttamente ad ogni step');

{
  const exp = EXPECTED.pancake100;
  const { norm } = loadAndNormalize(exp.file);
  let ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'], eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
  });

  const sid = createSession(ocel);

  // dopo build: qualifier tutti ""
  assert('dopo build: tutte le relations hanno qualifier ""',
    getSessionOcel(sid).relations.every(r => r.qualifier === ''));
  assert('dopo build: o2o assente',
    !('o2o' in getSessionOcel(sid)));

  // applica e2o qualifiers
  const combos = getE2OCombinations(getSessionOcel(sid));
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  updateSessionOcel(sid, applyE2OQualifiers(getSessionOcel(sid), e2oMap));

  assert('dopo e2o-qualifiers: nessuna relation con qualifier ""',
    getSessionOcel(sid).relations.every(r => r.qualifier !== ''));
  assert('dopo e2o-qualifiers: conteggio relations invariato',
    getSessionOcel(sid).relations.length === exp.relations_2obj,
    `got ${getSessionOcel(sid).relations.length}`);

  // o2o enrichment
  updateSessionOcel(sid, buildO2OEnrichment(getSessionOcel(sid)));

  assert('dopo o2o-enrich: o2o presente',
    Array.isArray(getSessionOcel(sid).o2o));
  assert(`dopo o2o-enrich: ${exp.o2o_pairs} coppie O2O`,
    getSessionOcel(sid).o2o.length === exp.o2o_pairs,
    `got ${getSessionOcel(sid).o2o.length}`);
  assert('dopo o2o-enrich: relations invariate',
    getSessionOcel(sid).relations.length === exp.relations_2obj);

  // o2o qualifiers (mappa tutto)
  const pairs = getO2OPairs(getSessionOcel(sid));
  const o2oMap = {};
  for (const p of pairs) o2oMap[`${p.oid}|${p.oid_2}`] = 'co_occurrence';
  updateSessionOcel(sid, applyO2OQualifiers(getSessionOcel(sid), o2oMap));

  assert(`dopo o2o-qualifiers: ${exp.o2o_pairs} coppie con qualifier`,
    getSessionOcel(sid).o2o.length === exp.o2o_pairs);
  assert('dopo o2o-qualifiers: qualifier corretto su tutte le coppie',
    getSessionOcel(sid).o2o.every(p => p.qualifier === 'co_occurrence'));

  deleteSession(sid);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCCO 6 — Correttezza export JSON (Fase 5): valori nel file esportato
// ═══════════════════════════════════════════════════════════════════════════════

section('Correttezza export JSON Fase 5 -- valori corretti nel file OCEL 2.0');

for (const [name, exp] of Object.entries(EXPECTED)) {
  const { norm } = loadAndNormalize(exp.file);
  let ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'], eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
  });
  const combos = getE2OCombinations(ocel);
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  ocel = applyE2OQualifiers(ocel, e2oMap);
  ocel = buildO2OEnrichment(ocel);
  const o2oMap = {};
  for (const p of getO2OPairs(ocel)) o2oMap[`${p.oid}|${p.oid_2}`] = 'co_occurrence';
  ocel = applyO2OQualifiers(ocel, o2oMap);

  const out = toOcel2Json(ocel);

  // conteggi
  assert(`[${name}] JSON: eventi = ${exp.events_2obj}`,
    out.events.length === exp.events_2obj, `got ${out.events.length}`);
  assert(`[${name}] JSON: oggetti = ${exp.objects_2obj}`,
    out.objects.length === exp.objects_2obj, `got ${out.objects.length}`);

  // campi interni assenti
  assert(`[${name}] JSON: relations assente`, !('relations' in out));
  assert(`[${name}] JSON: o2o assente`,       !('o2o'       in out));

  // qualifier eventi: ogni relationship deve avere qualifier corretto
  const badEvRel = out.events.flatMap(e =>
    e.relationships.filter(r => r.qualifier !== `${e.type}_qual`)
  );
  assert(`[${name}] JSON: qualifier nelle relationships degli eventi corretti`,
    badEvRel.length === 0, `${badEvRel.length} relationship con qualifier errato`);

  // O2O incorporato negli oggetti: totale relationships negli oggetti = 2 × o2o_pairs
  const totalObjRels = out.objects.reduce((s, o) => s + o.relationships.length, 0);
  assert(`[${name}] JSON: O2O incorporato negli oggetti (tot = 2×${exp.o2o_pairs})`,
    totalObjRels === 2 * exp.o2o_pairs,
    `got ${totalObjRels}, atteso ${2 * exp.o2o_pairs}`);

  // ogni relationship negli oggetti ha qualifier "co_occurrence"
  const badObjRel = out.objects.flatMap(o =>
    o.relationships.filter(r => r.qualifier !== 'co_occurrence')
  );
  assert(`[${name}] JSON: O2O relationships negli oggetti hanno qualifier "co_occurrence"`,
    badObjRel.length === 0, `${badObjRel.length} con qualifier errato`);

  // primo oggetto ID corretto
  assert(`[${name}] JSON: primo oggetto ID = ${exp.first_object_id}`,
    out.objects[0]?.id === exp.first_object_id, `got ${out.objects[0]?.id}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCCO 7 — Correttezza export CSV (Fase 5): righe e valori
// ═══════════════════════════════════════════════════════════════════════════════

section('Correttezza export CSV Fase 5 -- righe e valori corretti');

for (const [name, exp] of Object.entries(EXPECTED)) {
  const { norm } = loadAndNormalize(exp.file);
  let ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'], eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
  });
  const combos = getE2OCombinations(ocel);
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  ocel = applyE2OQualifiers(ocel, e2oMap);

  const csv   = toFlatCsv(ocel);
  const lines = csv.trim().split('\n');
  const dataRows = lines.length - 1; // escluso header

  assert(`[${name}] CSV: righe dati = relazioni E2O (${exp.relations_2obj})`,
    dataRows === exp.relations_2obj, `got ${dataRows}`);

  // header obbligatorio
  const header = lines[0];
  assert(`[${name}] CSV: header ha event_id, object_id, qualifier, txHash`,
    ['event_id','object_id','qualifier','txHash'].every(c => header.includes(c)));

  // ogni riga dati contiene uno dei qualifier attesi
  const qualSet = new Set(exp.qualifiers);
  const rowsWithBadQual = lines.slice(1).filter(row => {
    return ![...qualSet].some(q => row.includes(q));
  });
  assert(`[${name}] CSV: ogni riga ha un qualifier atteso`,
    rowsWithBadQual.length === 0, `${rowsWithBadQual.length} righe con qualifier non atteso`);

  // tutte le righe hanno lo stesso numero di colonne dell'header
  const headerCols = header.split(',').length;
  const wrongColCount = lines.slice(1).filter(row => {
    let inQ = false, cols = 1;
    for (const ch of row) {
      if (ch === '"') inQ = !inQ;
      else if (ch === ',' && !inQ) cols++;
    }
    return cols !== headerCols;
  });
  assert(`[${name}] CSV: tutte le righe hanno ${headerCols} colonne`,
    wrongColCount.length === 0, `${wrongColCount.length} righe con numero colonne errato`);
}

// ─── Risultato ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Risultato: ${passed} passati, ${failed} falliti`);
if (failed > 0) process.exit(1);
