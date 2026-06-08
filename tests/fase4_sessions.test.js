/**
 * Test Fase 4 — sessionStore.js + integrazione pipeline API
 * Esegui: node tests/fase4_sessions.test.js
 */

const { createSession, getSessionOcel, updateSessionOcel, deleteSession, sessionExists, SESSION_TTL_MS } = require('../Backend/services/ocelService/sessionStore');
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

// ─── 1. createSession ────────────────────────────────────────────────────────

section('createSession');
{
  const ocel = { events: [{ id: '0' }], objects: [] };
  const id = createSession(ocel);

  assert('restituisce stringa non vuota', typeof id === 'string' && id.length > 0);
  assert('id inizia con "ocel_"', id.startsWith('ocel_'));
  assert('sessione esiste dopo creazione', sessionExists(id));
  assert('getSessionOcel restituisce OCEL corretto', getSessionOcel(id) === ocel);

  deleteSession(id); // pulizia
}

// ─── 2. createSession — ID univoci ───────────────────────────────────────────

section('createSession -- ID univoci');
{
  const ocel = { events: [], objects: [] };
  const ids = new Set();
  for (let i = 0; i < 50; i++) {
    const id = createSession(ocel);
    ids.add(id);
    deleteSession(id);
  }
  assert('50 sessioni generate con ID tutti univoci', ids.size === 50);
}

// ─── 3. getSessionOcel — sessione inesistente ────────────────────────────────

section('getSessionOcel -- sessione inesistente');
{
  assert('restituisce null per ID inesistente', getSessionOcel('ocel_nonexistent') === null);
  assert('sessionExists false per ID inesistente', !sessionExists('ocel_fake_id'));
}

// ─── 4. updateSessionOcel ────────────────────────────────────────────────────

section('updateSessionOcel');
{
  const ocel1 = { events: [{ id: '0' }], objects: [] };
  const ocel2 = { events: [{ id: '0' }, { id: '1' }], objects: [{ id: 'A' }] };
  const id = createSession(ocel1);

  assert('update restituisce true', updateSessionOcel(id, ocel2) === true);
  assert('OCEL aggiornato correttamente', getSessionOcel(id) === ocel2);
  assert('update su ID inesistente restituisce false', updateSessionOcel('fake', ocel2) === false);

  deleteSession(id);
}

// ─── 5. deleteSession ────────────────────────────────────────────────────────

section('deleteSession');
{
  const id = createSession({ events: [], objects: [] });
  assert('sessione esiste prima della delete', sessionExists(id));
  deleteSession(id);
  assert('sessione non esiste dopo la delete', !sessionExists(id));
  assert('getSessionOcel dopo delete restituisce null', getSessionOcel(id) === null);
  // delete su ID inesistente non lancia eccezione
  let threw = false;
  try { deleteSession('nonexistent'); } catch (_) { threw = true; }
  assert('deleteSession su ID inesistente non lancia eccezioni', !threw);
}

// ─── 6. TTL_MS ───────────────────────────────────────────────────────────────

section('SESSION_TTL_MS');
{
  assert('TTL è 30 minuti (1800000 ms)', SESSION_TTL_MS === 30 * 60 * 1000);
}

// ─── 7. sessioni multiple indipendenti ───────────────────────────────────────

section('sessioni multiple indipendenti');
{
  const o1 = { events: [{ id: 'ev1' }], objects: [] };
  const o2 = { events: [{ id: 'ev2' }], objects: [] };
  const id1 = createSession(o1);
  const id2 = createSession(o2);

  assert('ID diversi per OCEL diversi', id1 !== id2);
  assert('sessione 1 restituisce OCEL corretto', getSessionOcel(id1) === o1);
  assert('sessione 2 restituisce OCEL corretto', getSessionOcel(id2) === o2);

  deleteSession(id1);
  assert('sessione 1 cancellata non influenza sessione 2', getSessionOcel(id2) === o2);

  deleteSession(id2);
}

// ─── 8. Pipeline completa simulando gli endpoint fase 4 ──────────────────────
//
// Replica esattamente il flusso:
//   POST /api/ocel/build → POST /api/ocel/e2o-qualifiers →
//   POST /api/ocel/o2o-enrich → POST /api/ocel/o2o-qualifiers →
//   GET  /api/ocel/session/:id

section('Pipeline completa simulazione endpoint fase 4 -- fixture sintetica');
{
  const rows = [
    { activity: 'approve',  timestamp: '1000', inputs_inputValue: '0xAAA', sender: '0xS1' },
    { activity: 'transfer', timestamp: '1001', inputs_inputValue: '0xBBB', sender: '0xS1' },
    { activity: 'approve',  timestamp: '1003', inputs_inputValue: '0xAAA', sender: '0xS2' },
  ];

  // ── build (simula POST /api/ocel/build) ──────────────────────────────────
  let ocel = buildOcel(rows, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue', 'sender'],
    eventAttrs: [], objectAttrs: {},
  });
  const sessionId = createSession(ocel);
  assert('sessione creata dopo build', sessionExists(sessionId));
  assert('OCEL in sessione ha eventi', getSessionOcel(sessionId).events.length === 3);

  // ── e2o-combinations (simula POST /api/ocel/e2o-combinations) ────────────
  const combos = getE2OCombinations(getSessionOcel(sessionId));
  assert('combos rilevate dalla sessione', combos.length > 0);

  // ── e2o-qualifiers (simula POST /api/ocel/e2o-qualifiers) ────────────────
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  const afterE2O = applyE2OQualifiers(getSessionOcel(sessionId), e2oMap);
  updateSessionOcel(sessionId, afterE2O);
  assert('OCEL aggiornato dopo E2O', getSessionOcel(sessionId).relations.every(r => r.qualifier !== ''));

  // ── o2o-enrich (simula POST /api/ocel/o2o-enrich) ────────────────────────
  const afterEnrich = buildO2OEnrichment(getSessionOcel(sessionId));
  updateSessionOcel(sessionId, afterEnrich);
  const pairs = getO2OPairs(getSessionOcel(sessionId));
  assert('coppie O2O generate in sessione', pairs.length > 0, `got ${pairs.length}`);

  // ── o2o-qualifiers (simula POST /api/ocel/o2o-qualifiers) ────────────────
  const o2oMap = {};
  if (pairs.length > 0) o2oMap[`${pairs[0].oid}|${pairs[0].oid_2}`] = 'co_occurrence';
  const afterO2O = applyO2OQualifiers(getSessionOcel(sessionId), o2oMap);
  updateSessionOcel(sessionId, afterO2O);
  assert('O2O qualifiers applicati in sessione', getSessionOcel(sessionId).o2o.length <= 1);

  // ── GET /api/ocel/session/:id ─────────────────────────────────────────────
  const finalOcel = getSessionOcel(sessionId);
  assert('OCEL finale recuperato dalla sessione', finalOcel !== null);
  assert('OCEL finale ha eventi', finalOcel.events.length === 3);
  assert('OCEL finale ha relazioni E2O con qualifier', finalOcel.relations.every(r => r.qualifier && r.qualifier !== ''));

  // ── DELETE /api/ocel/session/:id ──────────────────────────────────────────
  deleteSession(sessionId);
  assert('sessione eliminata dopo reset', !sessionExists(sessionId));
}

// ─── 9. Pipeline con dataset reale pancake100txs ──────────────────────────────

section('Pipeline fase 4 -- dataset reale pancake100txs');
{
  const raw     = JSON.parse(fs.readFileSync(path.join(__dirname, 'input_data', 'pancake100txs.json')));
  const records = raw.filter(r => Object.keys(r).length > 0);
  const { nested } = detectNestedColumns(records);
  const norm = normalizeData(records, [nested.indexOf('inputs')]);

  const ocel = buildOcel(norm.normalized, {
    activity: 'activity', timestamp: 'timestamp',
    objectTypes: ['inputs_inputValue'], eventAttrs: ['txHash', 'gasUsed'], objectAttrs: {},
  });

  const id = createSession(ocel);
  assert('sessione creata con dataset reale', sessionExists(id));
  assert('OCEL in sessione ha eventi > 0', getSessionOcel(id).events.length > 0);

  // aggiorna con E2O qualifiers
  const combos = getE2OCombinations(getSessionOcel(id));
  const e2oMap = {};
  for (const c of combos) e2oMap[`${c.objectType}|${c.activity}`] = `${c.activity}_qual`;
  updateSessionOcel(id, applyE2OQualifiers(getSessionOcel(id), e2oMap));
  assert('sessione aggiornata con E2O qualifiers', updateSessionOcel(id, getSessionOcel(id)));

  deleteSession(id);
  assert('sessione ripulita', !sessionExists(id));
}

// ─── Risultato ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Risultato: ${passed} passati, ${failed} falliti`);
if (failed > 0) process.exit(1);
