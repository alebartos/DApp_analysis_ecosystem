"""
Ground truth Python: esegue la stessa pipeline del codice originale di Mengascini
e salva i risultati in JSON per confronto con l'implementazione JS.

Fase 1+2: normalizzazione + costruzione OCEL → ground_truth/{dataset}.json
Fase 3:   E2O qualifiers + O2O enrichment + O2O qualifiers → ground_truth/{dataset}_phase3.json

Esegui: python tests/python_ground_truth.py
"""

import sys
import json
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__),
    '..', '..', 'Log_to_ocel-Web_app (1)', 'Log_to_ocel-Web_app'))

from app.services.data_service import DataService

INPUT_DIR = os.path.join(os.path.dirname(__file__), 'input_data')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'ground_truth')
os.makedirs(OUTPUT_DIR, exist_ok=True)

DATASETS = [
    ('pancake100txs.json',  'pancake100'),
    ('pancake1000.json',    'pancake1000'),
    ('fantom100.json',      'fantom100'),
]

# Parametri identici a quelli usati nei test JS
PARAMS = {
    'activity':    'activity',
    'timestamp':   'timestamp',
    'object_types': ['inputs_inputValue'],   # colonna valore, non __id
    'events_attrs': ['txHash', 'gasUsed'],
    'object_attrs': {},
}


def _load_and_normalize(filepath):
    """Carica e normalizza il dataset; restituisce (svc, inputs_idx) o None."""
    svc = DataService()
    svc.load_dataframe(filepath)
    if 'inputs' not in svc.nested_columns:
        print('  ⚠️  colonna "inputs" non trovata')
        return None
    inputs_idx = svc.nested_columns.index('inputs')
    svc.normalize_data([inputs_idx])
    if svc.df_normalized is None:
        print('  ⚠️  normalizzazione fallita')
        return None
    return svc


def run_pipeline(filepath, dataset_name):
    """Fase 1+2: normalizzazione + costruzione OCEL."""
    print(f'\n=== {dataset_name} (fase 1+2) ===')
    svc = _load_and_normalize(filepath)
    if svc is None:
        return None

    print(f'  record caricati: {len(svc.df)}')
    print(f'  righe normalizzate: {len(svc.df_normalized)}')
    print(f'  colonne dopo norm: {list(svc.df_normalized.columns)}')

    obj_types = [c for c in PARAMS['object_types'] if c in svc.df_normalized.columns]
    if not obj_types:
        print(f'  ⚠️  colonne objectType non trovate: {PARAMS["object_types"]}')
        return None

    try:
        svc.set_ocel_parameters(
            activity=PARAMS['activity'],
            timestamp=PARAMS['timestamp'],
            object_types=obj_types,
            events_attrs=PARAMS['events_attrs'],
            object_attrs=PARAMS['object_attrs'],
        )
    except Exception as e:
        print(f'  ⚠️  set_ocel_parameters fallito: {e}')
        return None

    ocel = svc.ocel
    n_events    = len(ocel.events)
    n_objects   = len(ocel.objects)
    n_relations = len(ocel.relations)
    event_types        = sorted(ocel.events['ocel:activity'].unique().tolist())
    object_types_found = sorted(ocel.objects['ocel:type'].unique().tolist())
    sample_obj_ids     = ocel.objects['ocel:oid'].head(5).tolist()
    sample_rels        = ocel.relations[['ocel:eid','ocel:oid','ocel:type','ocel:qualifier']].head(3).to_dict('records')

    result = {
        'dataset':            dataset_name,
        'records':            len(svc.df),
        'normalized_rows':    len(svc.df_normalized),
        'normalized_columns': list(svc.df_normalized.columns),
        'events':             n_events,
        'objects':            n_objects,
        'relations':          n_relations,
        'event_types':        event_types,
        'object_types':       object_types_found,
        'sample_object_ids':  sample_obj_ids,
        'sample_relations':   sample_rels,
    }

    print(f'  eventi:      {n_events}')
    print(f'  oggetti:     {n_objects}')
    print(f'  relazioni:   {n_relations}')
    print(f'  eventTypes:  {event_types}')
    print(f'  objectTypes: {object_types_found}')

    out_path = os.path.join(OUTPUT_DIR, f'{dataset_name}.json')
    with open(out_path, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    print(f'  OK salvato: {out_path}')
    return result


def run_phase3_pipeline(filepath, dataset_name):
    """
    Fase 3: E2O qualifiers, O2O enrichment, O2O qualifiers.
    Usa objectTypes=['inputs_inputValue', 'sender'] per generare coppie O2O
    (stesso setup della sezione 13 di fase3_qualifiers.test.js).
    """
    print(f'\n=== {dataset_name} (fase 3) ===')
    svc = _load_and_normalize(filepath)
    if svc is None:
        return None

    obj_types = [c for c in ['inputs_inputValue', 'sender'] if c in svc.df_normalized.columns]
    if len(obj_types) < 2:
        print(f'  ⚠️  meno di 2 objectType disponibili per O2O: {obj_types}')
        return None

    try:
        svc.set_ocel_parameters(
            activity='activity',
            timestamp='timestamp',
            object_types=obj_types,
            events_attrs=['txHash', 'gasUsed'],
            object_attrs={},
        )
    except Exception as e:
        print(f'  ⚠️  set_ocel_parameters fallito: {e}')
        return None

    # 3a — E2O qualifiers: mappa ogni combo (objectType|activity) → "{activity}_qual"
    #      identico alla logica del test JS sezione 13
    combos_df = svc.ocel.relations[['ocel:type', 'ocel:activity']].drop_duplicates()
    e2o_map = {
        f'{row["ocel:type"]}|{row["ocel:activity"]}': f'{row["ocel:activity"]}_qual'
        for _, row in combos_df.iterrows()
    }
    svc.set_e2o_relationship_qualifiers(e2o_map)
    relations_after_e2o = len(svc.ocel.relations)
    print(f'  relazioni dopo E2O qualifier: {relations_after_e2o}')

    # 3b — O2O enrichment (object interaction graph)
    try:
        svc.o2o_enrichment()
    except Exception as e:
        print(f'  ⚠️  o2o_enrichment fallito: {e}')
        return None

    o2o_pairs_count = len(svc.ocel_o2o.o2o)
    print(f'  coppie O2O generate: {o2o_pairs_count}')

    # 3c — O2O qualifiers: mappa la prima coppia → "co_occurrence"
    #      identico alla logica del test JS sezione 13
    o2o_map = {}
    if o2o_pairs_count > 0:
        first = svc.ocel_o2o.o2o.iloc[0]
        o2o_map[f'{first["ocel:oid"]}|{first["ocel:oid_2"]}'] = 'co_occurrence'
    svc.set_o2o_relationship_qualifiers(o2o_map)
    o2o_after_qualifiers = len(svc.ocel_o2o.o2o)
    print(f'  coppie O2O dopo qualifier: {o2o_after_qualifiers}')

    result = {
        'dataset':               dataset_name,
        'object_types_used':     obj_types,
        'relations_after_e2o':   relations_after_e2o,
        'o2o_pairs':             o2o_pairs_count,
        'o2o_after_qualifiers':  o2o_after_qualifiers,
    }

    out_path = os.path.join(OUTPUT_DIR, f'{dataset_name}_phase3.json')
    with open(out_path, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    print(f'  OK salvato: {out_path}')
    return result


if __name__ == '__main__':
    results_p2  = {}
    results_p3  = {}

    for filename, name in DATASETS:
        filepath = os.path.join(INPUT_DIR, filename)
        r2 = run_pipeline(filepath, name)
        if r2:
            results_p2[name] = r2
        r3 = run_phase3_pipeline(filepath, name)
        if r3:
            results_p3[name] = r3

    print('\n\n=== RIEPILOGO FASE 1+2 ===')
    for name, r in results_p2.items():
        print(f'{name}: {r["records"]} tx → {r["normalized_rows"]} righe → '
              f'{r["events"]} eventi, {r["objects"]} oggetti, {r["relations"]} rel')

    print('\n=== RIEPILOGO FASE 3 ===')
    for name, r in results_p3.items():
        print(f'{name}: E2O→{r["relations_after_e2o"]} rel, '
              f'O2O pairs→{r["o2o_pairs"]}, dopo qualifier→{r["o2o_after_qualifiers"]}')
