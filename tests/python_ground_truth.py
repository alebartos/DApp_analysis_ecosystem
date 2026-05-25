"""
Ground truth Python: esegue la stessa pipeline del codice originale di Mengascini
e salva i risultati in JSON per confronto con l'implementazione JS.

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


def run_pipeline(filepath, dataset_name):
    print(f'\n=== {dataset_name} ===')
    svc = DataService()
    svc.load_dataframe(filepath)

    print(f'  record caricati: {len(svc.df)}')
    print(f'  nested:  {svc.nested_columns}')
    print(f'  flat:    {svc.not_nested_columns}')

    # Indice della colonna "inputs"
    if 'inputs' not in svc.nested_columns:
        print('  ⚠️  colonna "inputs" non trovata')
        return None

    inputs_idx = svc.nested_columns.index('inputs')
    svc.normalize_data([inputs_idx])

    if svc.df_normalized is None:
        print('  ⚠️  normalizzazione fallita')
        return None

    print(f'  righe normalizzate: {len(svc.df_normalized)}')
    print(f'  colonne dopo norm: {list(svc.df_normalized.columns)}')

    # Verifica che inputs_inputValue esista
    obj_types = [c for c in PARAMS['object_types'] if c in svc.df_normalized.columns]
    if not obj_types:
        print(f'  ⚠️  colonne objectType non trovate: {PARAMS["object_types"]}')
        print(f'       colonne disponibili: {list(svc.df_normalized.columns)}')
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

    # Estrai statistiche comparabili con JS
    n_events   = len(ocel.events)
    n_objects  = len(ocel.objects)
    n_relations = len(ocel.relations)
    event_types  = sorted(ocel.events['ocel:activity'].unique().tolist())
    object_types_found = sorted(ocel.objects['ocel:type'].unique().tolist())

    # Campione oggetti (prime 5 IDs)
    sample_obj_ids = ocel.objects['ocel:oid'].head(5).tolist()
    # Campione relazioni
    sample_rels = ocel.relations[['ocel:eid','ocel:oid','ocel:type','ocel:qualifier']].head(3).to_dict('records')

    result = {
        'dataset':      dataset_name,
        'records':      len(svc.df),
        'normalized_rows': len(svc.df_normalized),
        'normalized_columns': list(svc.df_normalized.columns),
        'events':       n_events,
        'objects':      n_objects,
        'relations':    n_relations,
        'event_types':  event_types,
        'object_types': object_types_found,
        'sample_object_ids': sample_obj_ids,
        'sample_relations':  sample_rels,
    }

    print(f'  eventi:     {n_events}')
    print(f'  oggetti:    {n_objects}')
    print(f'  relazioni:  {n_relations}')
    print(f'  eventTypes: {event_types}')
    print(f'  objectTypes: {object_types_found}')

    out_path = os.path.join(OUTPUT_DIR, f'{dataset_name}.json')
    with open(out_path, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    print(f'  OK salvato: {out_path}')

    return result


if __name__ == '__main__':
    results = {}
    for filename, name in DATASETS:
        filepath = os.path.join(INPUT_DIR, filename)
        r = run_pipeline(filepath, name)
        if r:
            results[name] = r

    print('\n\n=== RIEPILOGO ===')
    for name, r in results.items():
        print(f'{name}: {r["records"]} tx → {r["normalized_rows"]} righe → '
              f'{r["events"]} eventi, {r["objects"]} oggetti, {r["relations"]} rel')
