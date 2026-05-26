import React, { useState, useRef } from 'react';
import {
    Alert, Box, Button, Chip, Divider, Stack, Typography
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PageLayout from '../layouts/PageLayout';
import useDataContext from '../context/useDataContext';
import { _ocelDetect, _ocelBuild } from '../api/services';

function OcelMapping() {
    const { setOcel } = useDataContext();
    const fileInputRef = useRef();

    const [step, setStep] = useState('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [records, setRecords] = useState(null);
    const [fileName, setFileName] = useState('');
    const [nestedCols, setNestedCols] = useState([]);
    const [flatCols, setFlatCols] = useState([]);
    const [normalizedColumns, setNormalizedColumns] = useState({});

    const [selectedNested, setSelectedNested] = useState('');
    const [selectedObjectType, setSelectedObjectType] = useState('');
    const [activityCol, setActivityCol] = useState('activity');
    const [timestampCol, setTimestampCol] = useState('timestamp');

    const [stats, setStats] = useState(null);
    const [normalizedRows, setNormalizedRows] = useState(0);

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
            if (res.status !== 200) throw new Error(res.data?.error || 'Rilevamento colonne fallito');

            setNestedCols(res.data.nested);
            setFlatCols(res.data.flat);
            setNormalizedColumns(res.data.normalizedColumns || {});

            const firstNested = res.data.nested[0] || '';
            setSelectedNested(firstNested);
            setSelectedObjectType('');

            // auto-detect activity column
            const activityCandidates = ['activity', 'functionName', 'method', 'action', 'eventName'];
            const detectedActivity = activityCandidates.find(c => res.data.flat.includes(c)) || res.data.flat[0] || 'activity';
            setActivityCol(detectedActivity);

            // auto-detect timestamp column
            const tsCandidates = ['timestamp', 'timeStamp', 'time', 'blockTimestamp', 'date'];
            const detectedTs = tsCandidates.find(c => res.data.flat.includes(c)) || 'timestamp';
            setTimestampCol(detectedTs);

            setStep('config');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBuild = async () => {
        if (!selectedNested || !selectedObjectType) return;
        setLoading(true);
        setError(null);
        try {
            const res = await _ocelBuild(records, selectedNested, selectedObjectType, activityCol, timestampCol);
            if (res.status !== 200) throw new Error(res.data?.error || 'Costruzione OCEL fallita');
            setStats(res.data.stats);
            setNormalizedRows(res.data.normalizedRows);
            setOcel(res.data.ocel);
            setStep('result');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep('upload');
        setRecords(null);
        setFileName('');
        setStats(null);
        setError(null);
        setSelectedNested('');
        setSelectedObjectType('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const objectTypeCols = selectedNested ? (normalizedColumns[selectedNested] || []) : [];

    return (
        <PageLayout loading={loading}>
            <Box display="flex" justifyContent="center" paddingTop={4}>
                <Box width={580}>
                    <Typography variant="h4" gutterBottom>OCEL Mapping</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Fase 1 (normalizzazione) + Fase 2 (costruzione OCEL 2.0)
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <Box>
                            <Typography variant="body1" mb={3}>
                                Carica un file JSON di transazioni blockchain.
                            </Typography>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                hidden
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<UploadFileIcon />}
                                onClick={() => fileInputRef.current.click()}
                            >
                                Carica file JSON
                            </Button>
                        </Box>
                    )}

                    {/* Step 2: Config */}
                    {step === 'config' && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                <strong>{fileName}</strong> — {records.length} transazioni
                            </Alert>

                            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                Colonne nested rilevate
                            </Typography>
                            <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">
                                {nestedCols.map(c => (
                                    <Chip
                                        key={c}
                                        label={c}
                                        color={selectedNested === c ? 'primary' : 'default'}
                                        onClick={() => { setSelectedNested(c); setSelectedObjectType(''); }}
                                        sx={{ mb: 1 }}
                                    />
                                ))}
                                {nestedCols.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">Nessuna colonna nested rilevata</Typography>
                                )}
                            </Stack>

                            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                Colonna activity
                            </Typography>
                            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                                {flatCols.map(c => (
                                    <Chip
                                        key={c}
                                        label={c}
                                        size="small"
                                        color={activityCol === c ? 'success' : 'default'}
                                        onClick={() => setActivityCol(c)}
                                        sx={{ mb: 1 }}
                                    />
                                ))}
                            </Stack>

                            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                Colonna timestamp
                            </Typography>
                            <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">
                                {flatCols.map(c => (
                                    <Chip
                                        key={c}
                                        label={c}
                                        size="small"
                                        color={timestampCol === c ? 'success' : 'default'}
                                        onClick={() => setTimestampCol(c)}
                                        sx={{ mb: 1 }}
                                    />
                                ))}
                            </Stack>

                            <Divider sx={{ mb: 3 }} />

                            {selectedNested && objectTypeCols.length > 0 && (
                                <>
                                    <Typography variant="subtitle1" fontWeight="bold" mb={0.5}>
                                        Colonna objectType
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Seleziona quale colonna di <strong>{selectedNested}</strong> contiene i valori degli oggetti OCEL (tipicamente la colonna con gli indirizzi Ethereum).
                                    </Typography>
                                    <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">
                                        {objectTypeCols.map(c => (
                                            <Chip
                                                key={c}
                                                label={c}
                                                color={selectedObjectType === c ? 'secondary' : 'default'}
                                                onClick={() => setSelectedObjectType(c)}
                                                sx={{ mb: 1 }}
                                            />
                                        ))}
                                    </Stack>
                                </>
                            )}

                            {selectedNested && objectTypeCols.length === 0 && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    Nessuna colonna valore rilevata per <strong>{selectedNested}</strong>.
                                </Alert>
                            )}

                            <Stack direction="row" spacing={2} mt={2}>
                                <Button variant="outlined" onClick={reset}>Cambia file</Button>
                                <Button
                                    variant="contained"
                                    disabled={!selectedNested || !selectedObjectType}
                                    onClick={handleBuild}
                                >
                                    Costruisci OCEL
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {/* Step 3: Result */}
                    {step === 'result' && stats && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>OCEL costruito con successo</Alert>

                            <Stack spacing={1.5} mb={3}>
                                {[
                                    ['Transazioni caricate', records.length],
                                    ['Righe dopo normalizzazione', normalizedRows],
                                    ['Eventi OCEL', stats.events],
                                    ['Oggetti unici', stats.objects],
                                    ['Relazioni E2O', stats.relations],
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

                            <Button variant="outlined" onClick={reset}>Carica un altro file</Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </PageLayout>
    );
}

export default OcelMapping;
