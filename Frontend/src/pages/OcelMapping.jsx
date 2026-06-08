import React, { useState, useRef } from 'react';
import {
    Alert, Box, Button, Chip, Divider, FormControl, IconButton,
    InputLabel, MenuItem, Select, Stack, TextField, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PageLayout from '../layouts/PageLayout';
import useDataContext from '../context/useDataContext';
import {
    _ocelDetect, _ocelBuild,
    _ocelE2OCombinations, _ocelE2OQualifiers,
    _ocelO2OEnrich, _ocelO2OQualifiers,
    _ocelGetSession, _ocelDeleteSession, _ocelExport,
} from '../api/services';

function OcelMapping() {
    const { setOcel } = useDataContext();
    const fileInputRef = useRef();

    const [step, setStep] = useState('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // file & detection
    const [records, setRecords] = useState(null);
    const [fileName, setFileName] = useState('');
    const [nestedCols, setNestedCols] = useState([]);
    const [flatCols, setFlatCols] = useState([]);
    const [normalizedColumns, setNormalizedColumns] = useState({});

    // config selections
    const [selectedNesteds, setSelectedNesteds] = useState([]);
    const [selectedObjectTypes, setSelectedObjectTypes] = useState([]);
    const [activityCol, setActivityCol] = useState('activity');
    const [timestampCol, setTimestampCol] = useState('timestamp');

    // phase 2 result
    const [stats, setStats] = useState(null);
    const [normalizedRows, setNormalizedRows] = useState(0);
    const [ocelData, setOcelData] = useState(null); // copia locale per download fase 2 e Contract Logs
    const [sessionId, setSessionId] = useState(null);

    // phase 3a — E2O rules: [{ activity, objectType, qualifier }]
    const [e2oCombinations, setE2OCombinations] = useState([]);
    const [e2oRules, setE2ORules] = useState([]);

    // phase 3b/c — O2O rules: [{ type1, type2, qualifier }]
    const [o2oPairs, setO2OPairs] = useState([]);
    const [o2oDistinctTypes, setO2ODistinctTypes] = useState([]);
    const [o2oRules, setO2ORules] = useState([]);
    const [o2oCount, setO2OCount] = useState(null);

    // ── file upload ─────────────────────────────────────────────────────────────

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setError(null);
        setLoading(true);
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const arr = Array.isArray(parsed) ? parsed : Object.values(parsed);
            const filtered = arr.filter(r => Object.keys(r).length > 0);
            setRecords(filtered);
            setFileName(file.name);

            const res = await _ocelDetect(filtered);
            if (res.status !== 200) throw new Error(res.data?.error || 'Column detection failed');

            setNestedCols(res.data.nested);
            setFlatCols(res.data.flat);
            setNormalizedColumns(res.data.normalizedColumns || {});
            setSelectedNesteds([]);
            setSelectedObjectTypes([]);

            const eventCandidates = ['activity', 'functionName', 'method', 'action', 'eventName'];
            setActivityCol(eventCandidates.find(c => res.data.flat.includes(c)) || res.data.flat[0] || 'activity');

            const tsCandidates = ['timestamp', 'timeStamp', 'time', 'blockTimestamp', 'date'];
            setTimestampCol(tsCandidates.find(c => res.data.flat.includes(c)) || 'timestamp');

            setStep('config');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── config helpers ───────────────────────────────────────────────────────────

    const toggleNested = (col) =>
        setSelectedNesteds(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);

    const toggleObjectType = (col) =>
        setSelectedObjectTypes(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);

    const objectTypeOptions = [
        ...selectedNesteds.flatMap(n => normalizedColumns[n] || []),
        ...flatCols.filter(c => c !== activityCol && c !== timestampCol),
    ];

    // ── build (phase 2) ──────────────────────────────────────────────────────────

    const handleBuild = async () => {
        if (!selectedNesteds.length || !selectedObjectTypes.length) return;
        setLoading(true);
        setError(null);
        try {
            const res = await _ocelBuild(records, selectedNesteds, selectedObjectTypes, activityCol, timestampCol);
            if (res.status !== 200) throw new Error(res.data?.error || 'OCEL build failed');
            setStats(res.data.stats);
            setNormalizedRows(res.data.normalizedRows);
            setOcel(res.data.ocel);
            setOcelData(res.data.ocel); // tenuto solo per download fase 2 e Contract Logs
            setSessionId(res.data.sessionId);
            setStep('result');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── phase 3a setup ───────────────────────────────────────────────────────────

    const handleGoToFase3 = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await _ocelE2OCombinations(sessionId);
            if (res.status !== 200) throw new Error(res.data?.error || 'E2O combinations failed');
            setE2OCombinations(res.data.combinations);
            setE2ORules([]);
            setStep('e2oQual');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── E2O rule helpers ─────────────────────────────────────────────────────────

    const e2oActivities = [...new Set(e2oCombinations.map(c => c.activity))];
    const e2oObjectTypes = [...new Set(e2oCombinations.map(c => c.objectType))];

    const addE2ORule = () =>
        setE2ORules(prev => [...prev, { activity: e2oActivities[0] || '', objectType: e2oObjectTypes[0] || '', qualifier: '' }]);

    const updateE2ORule = (i, field, value) =>
        setE2ORules(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

    const removeE2ORule = (i) =>
        setE2ORules(prev => prev.filter((_, idx) => idx !== i));

    const handleApplyE2O = async () => {
        setLoading(true);
        setError(null);
        try {
            const qualifierMap = {};
            for (const r of e2oRules) {
                if (r.qualifier.trim()) qualifierMap[`${r.objectType}|${r.activity}`] = r.qualifier.trim();
            }
            const res = await _ocelE2OQualifiers(sessionId, qualifierMap);
            if (res.status !== 200) throw new Error(res.data?.error || 'E2O qualifiers failed');
            setStats(res.data.stats);

            const enrichRes = await _ocelO2OEnrich(sessionId);
            if (enrichRes.status !== 200) throw new Error(enrichRes.data?.error || 'O2O enrichment failed');
            setO2OPairs(enrichRes.data.pairs);

            // tipi distinti: derivati dalle combinations già caricate
            const types = [...new Set(e2oCombinations.map(c => c.objectType))];
            setO2ODistinctTypes(types);
            setO2ORules([]);
            setStep('o2oQual');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── O2O rule helpers ─────────────────────────────────────────────────────────

    const addO2ORule = () =>
        setO2ORules(prev => [...prev, { type1: o2oDistinctTypes[0] || '', type2: o2oDistinctTypes[1] || o2oDistinctTypes[0] || '', qualifier: '' }]);

    const updateO2ORule = (i, field, value) =>
        setO2ORules(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

    const removeO2ORule = (i) =>
        setO2ORules(prev => prev.filter((_, idx) => idx !== i));

    const handleApplyO2O = async () => {
        setLoading(true);
        setError(null);
        try {
            // risolvi tipo di ogni coppia dalle combinations (non serve più ocelData.objects)
            const objTypeMap = {};
            for (const c of e2oCombinations) {
                // le combinations hanno objectType ma non i singoli oid:
                // usiamo ocelData (snapshot fase 2) per la mappa id→type
            }
            for (const obj of (ocelData?.objects ?? [])) objTypeMap[obj.id] = obj.type;

            const qualifierMap = {};
            for (const pair of o2oPairs) {
                const t1 = objTypeMap[pair.oid] || '';
                const t2 = objTypeMap[pair.oid_2] || '';
                const rule = o2oRules.find(r => r.type1 === t1 && r.type2 === t2);
                if (rule && rule.qualifier.trim()) {
                    qualifierMap[`${pair.oid}|${pair.oid_2}`] = rule.qualifier.trim();
                }
            }
            const res = await _ocelO2OQualifiers(sessionId, qualifierMap);
            if (res.status !== 200) throw new Error(res.data?.error || 'O2O qualifiers failed');
            setO2OCount(res.data.o2oCount);

            // recupera OCEL finale dalla sessione per aggiornare il Contract Logs panel
            const finalRes = await _ocelGetSession(sessionId);
            if (finalRes.status === 200) {
                setOcel(finalRes.data.ocel);
                setOcelData(finalRes.data.ocel);
            }
            setStep('done');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── download ─────────────────────────────────────────────────────────────────

    const triggerDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Fase 2: scarica snapshot locale (OCEL non ancora modificato dalla fase 3)
    const handleDownloadPhase2 = () => {
        if (!ocelData) return;
        const blob = new Blob([JSON.stringify(ocelData, null, 2)], { type: 'application/json' });
        const baseName = fileName.replace(/\.json$/i, '');
        triggerDownload(blob, `ocel_${baseName}_phase2.json`);
    };

    // Fase 3+: scarica dalla sessione nel formato scelto via endpoint /api/ocel/export
    const handleExport = async (format) => {
        if (!sessionId) return;
        const res = await _ocelExport(sessionId, format);
        if (!res.data) return;
        const baseName = fileName.replace(/\.json$/i, '');
        const ext = format === 'csv' ? 'csv' : format === 'jsonocel' ? 'jsonocel' : 'json';
        triggerDownload(res.data, `ocel_${baseName}.${ext}`);
    };

    // ── reset ────────────────────────────────────────────────────────────────────

    const reset = () => {
        if (sessionId) _ocelDeleteSession(sessionId);
        setStep('upload');
        setRecords(null); setFileName(''); setStats(null); setOcelData(null); setError(null);
        setSessionId(null);
        setSelectedNesteds([]); setSelectedObjectTypes([]);
        setE2OCombinations([]); setE2ORules([]);
        setO2OPairs([]); setO2ODistinctTypes([]); setO2ORules([]); setO2OCount(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── render ───────────────────────────────────────────────────────────────────

    return (
        <PageLayout loading={loading}>
            <Box display="flex" justifyContent="center" paddingTop={4}>
                <Box width={640}>
                    <Typography variant="h4" gutterBottom>OCEL Mapping</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Phase 1 (normalization) → Phase 2 (OCEL 2.0) → Phase 3 (Qualifiers)
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* ── Upload ── */}
                    {step === 'upload' && (
                        <Box>
                            <Typography variant="body1" mb={3}>
                                Upload a JSON file of blockchain transactions.
                            </Typography>
                            <input ref={fileInputRef} type="file" accept=".json" hidden onChange={handleFileChange} />
                            <Button variant="contained" size="large" startIcon={<UploadFileIcon />}
                                onClick={() => fileInputRef.current.click()}>
                                Upload JSON file
                            </Button>
                        </Box>
                    )}

                    {/* ── Config ── */}
                    {step === 'config' && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                <strong>{fileName}</strong> — {records.length} transactions
                            </Alert>

                            {/* Nested columns */}
                            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Nested columns</Typography>
                            <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">
                                {nestedCols.map(c => (
                                    <Chip key={c} label={c}
                                        color={selectedNesteds.includes(c) ? 'primary' : 'default'}
                                        onClick={() => toggleNested(c)} sx={{ mb: 1 }} />
                                ))}
                                {nestedCols.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">No nested columns detected</Typography>
                                )}
                            </Stack>

                            {/* Event column */}
                            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Event column</Typography>
                            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                                {flatCols.map(c => (
                                    <Chip key={c} label={c} size="small"
                                        color={activityCol === c ? 'success' : 'default'}
                                        onClick={() => setActivityCol(c)} sx={{ mb: 1 }} />
                                ))}
                            </Stack>

                            {/* Timestamp column */}
                            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Timestamp column</Typography>
                            <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">
                                {flatCols.map(c => (
                                    <Chip key={c} label={c} size="small"
                                        color={timestampCol === c ? 'success' : 'default'}
                                        onClick={() => setTimestampCol(c)} sx={{ mb: 1 }} />
                                ))}
                            </Stack>

                            <Divider sx={{ mb: 3 }} />

                            {/* Object type columns */}
                            <Typography variant="subtitle1" fontWeight="bold" mb={0.5}>Object type columns</Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Select columns containing Ethereum addresses. Multiple selection allowed.
                            </Typography>

                            {selectedNesteds.length > 0 && (
                                <>
                                    <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                                        From nested: <strong>{selectedNesteds.join(', ')}</strong>
                                    </Typography>
                                    <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
                                        {selectedNesteds.flatMap(n => normalizedColumns[n] || []).map(c => (
                                            <Chip key={c} label={c}
                                                color={selectedObjectTypes.includes(c) ? 'secondary' : 'default'}
                                                onClick={() => toggleObjectType(c)} sx={{ mb: 1 }} />
                                        ))}
                                    </Stack>
                                </>
                            )}

                            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Flat columns</Typography>
                            <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
                                {flatCols.filter(c => c !== activityCol && c !== timestampCol).map(c => (
                                    <Chip key={c} label={c}
                                        color={selectedObjectTypes.includes(c) ? 'secondary' : 'default'}
                                        onClick={() => toggleObjectType(c)} sx={{ mb: 1 }} />
                                ))}
                            </Stack>

                            {selectedObjectTypes.length > 0 && (
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Selected: {selectedObjectTypes.join(', ')}
                                </Typography>
                            )}

                            <Stack direction="row" spacing={2} mt={2}>
                                <Button variant="outlined" onClick={reset}>Change file</Button>
                                <Button variant="contained"
                                    disabled={!selectedNesteds.length || !selectedObjectTypes.length}
                                    onClick={handleBuild}>
                                    Build OCEL
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {/* ── Phase 2 Result ── */}
                    {step === 'result' && stats && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>OCEL Phase 2 built successfully</Alert>

                            <Stack spacing={1.5} mb={3}>
                                {[
                                    ['Transactions loaded', records.length],
                                    ['Rows after normalization', normalizedRows],
                                    ['OCEL events', stats.events],
                                    ['Unique objects', stats.objects],
                                    ['E2O relations', stats.relations],
                                ].map(([label, value]) => (
                                    <Box key={label} display="flex" justifyContent="space-between" borderBottom="1px solid #eee" pb={1}>
                                        <Typography color="text.secondary">{label}</Typography>
                                        <Typography fontWeight="bold">{value}</Typography>
                                    </Box>
                                ))}
                            </Stack>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary" mb={1}>Event Types</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {stats.eventTypes.map(t => <Chip key={t} label={t} size="small" sx={{ mb: 1 }} />)}
                                </Stack>
                            </Box>

                            <Box mb={3}>
                                <Typography variant="body2" color="text.secondary" mb={1}>Object Types</Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {stats.objectTypes.map(t => <Chip key={t} label={t} size="small" sx={{ mb: 1 }} />)}
                                </Stack>
                            </Box>

                            <Stack direction="row" spacing={2}>
                                <Button variant="outlined" onClick={reset}>Change file</Button>
                                <Button variant="outlined" onClick={handleDownloadPhase2}>Download JSON</Button>
                                <Button variant="contained" onClick={handleGoToFase3}>Configure Phase 3</Button>
                            </Stack>
                        </Box>
                    )}

                    {/* ── Phase 3a — E2O Qualifiers ── */}
                    {step === 'e2oQual' && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Phase 3a — E2O Qualifiers</Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Define qualifier rules for event → object relationships. Relations without a matching rule keep an empty qualifier.
                            </Typography>

                            <Stack spacing={2} mb={2}>
                                {e2oRules.map((rule, i) => (
                                    <Box key={i} display="flex" alignItems="center" gap={1.5}>
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <InputLabel>Event</InputLabel>
                                            <Select value={rule.activity} label="Event"
                                                onChange={e => updateE2ORule(i, 'activity', e.target.value)}>
                                                {e2oActivities.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                                            </Select>
                                        </FormControl>

                                        <Typography variant="body2" color="text.secondary">→</Typography>

                                        <FormControl size="small" sx={{ minWidth: 180 }}>
                                            <InputLabel>Object</InputLabel>
                                            <Select value={rule.objectType} label="Object"
                                                onChange={e => updateE2ORule(i, 'objectType', e.target.value)}>
                                                {e2oObjectTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                            </Select>
                                        </FormControl>

                                        <TextField size="small" label="Qualifier"
                                            placeholder='e.g. "spender"'
                                            value={rule.qualifier}
                                            onChange={e => updateE2ORule(i, 'qualifier', e.target.value)}
                                            sx={{ flex: 1 }} />

                                        <IconButton size="small" onClick={() => removeE2ORule(i)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>

                            <Button startIcon={<AddIcon />} onClick={addE2ORule} sx={{ mb: 3 }}>
                                Add rule
                            </Button>

                            <Stack direction="row" spacing={2}>
                                <Button variant="outlined" onClick={() => setStep('result')}>Back</Button>
                                <Button variant="outlined" onClick={handleDownloadPhase2}>Download JSON (Phase 2)</Button>
                                <Button variant="contained" onClick={handleApplyE2O}>Apply & go to O2O</Button>
                            </Stack>
                        </Box>
                    )}

                    {/* ── Phase 3b/c — O2O Qualifiers ── */}
                    {step === 'o2oQual' && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Phase 3b/c — O2O Enrichment + Qualifiers</Typography>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                                O2O pairs generated: <strong>{o2oPairs.length}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Define qualifier rules for object → object relationships. Pairs without a matching rule will be removed.
                            </Typography>

                            {o2oPairs.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    No O2O pairs generated. Select at least 2 object types to generate pairs.
                                </Alert>
                            ) : (
                                <>
                                    <Stack spacing={2} mb={2}>
                                        {o2oRules.map((rule, i) => (
                                            <Box key={i} display="flex" alignItems="center" gap={1.5}>
                                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                                    <InputLabel>Object type 1</InputLabel>
                                                    <Select value={rule.type1} label="Object type 1"
                                                        onChange={e => updateO2ORule(i, 'type1', e.target.value)}>
                                                        {o2oDistinctTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                                    </Select>
                                                </FormControl>

                                                <Typography variant="body2" color="text.secondary">→</Typography>

                                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                                    <InputLabel>Object type 2</InputLabel>
                                                    <Select value={rule.type2} label="Object type 2"
                                                        onChange={e => updateO2ORule(i, 'type2', e.target.value)}>
                                                        {o2oDistinctTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                                    </Select>
                                                </FormControl>

                                                <TextField size="small" label="Qualifier"
                                                    placeholder='e.g. "approves"'
                                                    value={rule.qualifier}
                                                    onChange={e => updateO2ORule(i, 'qualifier', e.target.value)}
                                                    sx={{ flex: 1 }} />

                                                <IconButton size="small" onClick={() => removeO2ORule(i)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Stack>

                                    <Button startIcon={<AddIcon />} onClick={addO2ORule} sx={{ mb: 3 }}>
                                        Add rule
                                    </Button>
                                </>
                            )}

                            <Stack direction="row" spacing={2}>
                                <Button variant="outlined" onClick={() => setStep('e2oQual')}>Back</Button>
                                <Button variant="outlined" onClick={() => handleExport('json')}>Download JSON (Phase 3a)</Button>
                                <Button variant="contained" onClick={handleApplyO2O}>Apply O2O Qualifiers</Button>
                            </Stack>
                        </Box>
                    )}

                    {/* ── Done ── */}
                    {step === 'done' && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>Phase 3 pipeline completed</Alert>

                            <Stack spacing={1.5} mb={3}>
                                {[
                                    ['OCEL events', stats?.events],
                                    ['Unique objects', stats?.objects],
                                    ['E2O relations (with qualifier)', stats?.relations],
                                    ['O2O pairs (with qualifier)', o2oCount],
                                ].map(([label, value]) => (
                                    <Box key={label} display="flex" justifyContent="space-between" borderBottom="1px solid #eee" pb={1}>
                                        <Typography color="text.secondary">{label}</Typography>
                                        <Typography fontWeight="bold">{value ?? '—'}</Typography>
                                    </Box>
                                ))}
                            </Stack>

                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <Button variant="outlined" onClick={reset}>Load another file</Button>
                                <Button variant="contained" onClick={() => handleExport('json')}>
                                    Download JSON
                                </Button>
                                <Button variant="contained" onClick={() => handleExport('jsonocel')}
                                    sx={{ backgroundColor: '#5316ec', '&:hover': { backgroundColor: '#3d0fb5' } }}>
                                    Download JSONOCEL
                                </Button>
                                <Button variant="contained" onClick={() => handleExport('csv')}
                                    sx={{ backgroundColor: '#38a651', '&:hover': { backgroundColor: '#2f6749' } }}>
                                    Download CSV
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Box>
            </Box>
        </PageLayout>
    );
}

export default OcelMapping;
