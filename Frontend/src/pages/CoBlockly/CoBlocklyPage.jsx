import React, { useEffect, useRef } from 'react';
import './style.css';
import './blockly_style.css';
import 'jsoneditor/dist/jsoneditor.min.css';
import { startCoBlockly } from './main.ts';
import { initBlocklyEditor } from './coblockly.ts'
import 'bootstrap/dist/css/bootstrap.min.css';
import { useColorScheme } from '@mui/material/styles';

export default function CoBlocklyPage() {
  // ref per agganciare Blockly in modo sicuro
  const blocklyDivRef = useRef(null);

  const { mode } = useColorScheme();
  const isDarkMode = mode == 'dark';

  useEffect(() => {
    initBlocklyEditor(isDarkMode);
    startCoBlockly();
  }, [isDarkMode]);

  return (
    <div className="container" data-bs-theme={isDarkMode ? 'dark' : 'light'}>
      <header className="mb-2">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
          <div className="container-fluid">
            <a className="navbar-brand d-flex align-items-center" href="#">
              <div>
                <span className="fw-bold">Blockchain Compliance Checking Framework</span>
              </div>
            </a>
          </div>
        </nav>
      </header>

      {/* -----------------------------Blockchain Log Handling--------------------------------------- */}
      <div className="row mb-2">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title">Log Upload</h5>
                  <span className="form-text">Accepted format: .xes, .csv</span>
                </div>
              </div>
              <form id="logForm">
                <div className="mb-4">
                  <input type="file" className="form-control" id="logInput" accept=".xes" />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button type="submit" className="btn btn-primary">
                    Upload Log
                  </button>
                  <div id="spinner-container-log" className="spinner-container" style={{ display: 'none' }}>
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span id="logPhase">Uploading blockchain log...</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* -- Log Statistics Setion --*/}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title">Log Statistics</h5>
                  <span id="logLoaded" className="badge bg-secondary">No log loaded</span>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <div className="text-center p-3 border rounded">
                    <div className="text-muted mb-1">Events Loaded</div>
                    <div id="eventsLoaded" className="fs-4 fw-bold text-primary">0</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center p-3 border rounded">
                    <div className="text-muted mb-1">Traces Loaded</div>
                    <div id="tracesLoaded" className="fs-4 fw-bold text-primary">0</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -----------------------------------Blockchain Log Mapping------------------------------------------------- */}
      <div className="row mb-2">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex" style={{ justifyContent: 'space-between' }}>
                <h5 className="card-title mb-3">Blockchain Log Mapping</h5>
                <span className="small">Scroll horizontally to view all mapping fields</span>
              </div>
              <div className="overflow-auto" style={{ maxHeight: '200px', overflowX: 'auto', overflowY: 'hidden' }}>
                <div className="d-flex flex-nowrap gap-1 pb-1">
                  
                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="fun" className="form-label fw-semibold mb-2">Function</label>
                    <select id="fun" className="form-select log-columns"><option>activity</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="ca" className="form-label fw-semibold mb-2">Contract</label>
                    <select id="ca" className="form-select log-columns"><option>receivingContract</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="b" className="form-label fw-semibold mb-2">Block</label>
                    <select id="b" className="form-select log-columns"><option>blockNumber</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="s" className="form-label fw-semibold mb-2">Sender</label>
                    <select id="s" className="form-select log-columns"><option>requester</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="time" className="form-label fw-semibold mb-2">Timestamp</label>
                    <select id="time" className="form-select log-columns"><option>timestamp</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="gL" className="form-label fw-semibold mb-2">Gas Limit</label>
                    <select id="gL" className="form-select log-columns"><option>gasLimit</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="gU" className="form-label fw-semibold mb-2">Gas Used</label>
                    <select id="gU" className="form-select log-columns"><option>gasUsed</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="V" className="form-label fw-semibold mb-2">Value</label>
                    <select id="V" className="form-select log-columns"><option>value</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="sv" className="form-label fw-semibold mb-2">Storage Variables</label>
                    <select id="sv" className="form-select log-columns"><option>stateVariable</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="call" className="form-label fw-semibold mb-2">Internal Txs</label>
                    <select id="call" className="form-select log-columns"><option>internalTxs</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="i" className="form-label fw-semibold mb-2">Inputs</label>
                    <select id="i" className="form-select log-columns"><option>inputs</option></select>
                  </div>

                  <div className="d-flex flex-column" style={{ minWidth: '140px', flex: '0 0 140px' }}>
                    <label htmlFor="e" className="form-label fw-semibold mb-2">Events</label>
                    <select id="e" className="form-select log-columns"><option>events</option></select>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -----------------------------------CoBlockly------------------------------------------------- */}
      <div className="row mb-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">CoBlockly</h5>
              </div>
              <button type="button" className="btn btn-primary" id="generateBtn">
                Translate Rule
              </button>
            </div>

            <div className="card-body p-0">
              {/* Nessun position absolute/relative, diamo solo altezza e larghezza al div direttamente */}
              <div 
                ref={blocklyDivRef} 
                id="blocklyDiv" 
                style={{ width: '100%', height: '400px' }}
              ></div>
            </div>

            <div className="card-footer text-muted small">
              Drag and drop blocks to model your rule, then click "Translate Rule" to generate the textual rule
            </div>
          </div>
        </div>
      </div>

      {/* -----------------------------------Blockchain-based compliance rules------------------------------------------------- */}
      <div className="row mb-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">CoBlock</h5>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="mb-1">
                <label htmlFor="rule" className="form-label fw-semibold d-flex align-items-center">
                  <span>Textual Rule</span>
                </label>
                <form id="compileRule">
                  <div className="input-group">
                    <input 
                      id="rule" 
                      type="text" 
                      className="form-control form-control-lg"
                      placeholder="e.g., tx1(function == approveOrder AND sender == 0x123) occ"
                      aria-describedby="ruleHelp" 
                    />
                    <button type="submit" id="parserButton" className="btn btn-primary px-4">
                      Parse Rule
                    </button>
                  </div>
                </form>
              </div>
              <div id="errorParser"></div>{/*-- Dynamic message will appear here--*/}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------Apply rule------------------------------------------------- */}
      <div className="row mb-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Checking Results</h5>
              </div>
              <div id="spinner-container-rule" className="spinner-container" style={{ display: 'none' }}>
                <div className="d-flex align-items-center">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span id="phase">Checking rule over log...</span>
                </div>
              </div>
              <form id="verifyRule">
                <button type="submit" className="btn btn-primary">Check rule over blockchain log</button>
              </form>
            </div>
            
            <div className="row p-4">
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-muted mb-1" style={{ color: 'darkgreen' }}>Compliant Traces</div>
                  <div id="ct" className="fs-4 fw-bold text-success">0</div>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-muted mb-1">Non-compliant Traces</div>
                  <div id="nct" className="fs-4 fw-bold text-danger">0</div>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-muted mb-1">Ignored Traces</div>
                  <div id="it" className="fs-4 fw-bold">0</div>
                </div>
              </div>
            </div>

            <div className="row mb-4 px-4">
              <div className="col-6">
                <h5>[preview] Compliant traces - <a id="downloadLinkC" href="#">Download full JSON</a></h5>
                <div id="jsoneditorC"></div>
              </div>
              <div className="col-6">
                <h5>[preview] Non-compliant traces - <a id="downloadLinkNC" href="#">Download full JSON</a></h5>
                <div id="jsoneditorNC"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}