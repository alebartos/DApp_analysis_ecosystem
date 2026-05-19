import axios, { AxiosResponse } from 'axios';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.min.css';

import * as nearley from "nearley";
import grammar from "./grammar"; // The module declaration allows this import
import { interpretRule as ir } from "./parser";

let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar),);
let parserResult: String = ""

interface Mapping {
  function: string;
  contract: string;
  block: string;
  sender: string;
  timestamp: string;
  gasLimit: string;
  gasUsed: string;
  value: string;
  SV: string;
  CALL: string;
  I: string;
  E: string;
}

export function startCoBlockly() {
  console.log("...adding event listener")
  
  const errDiv = document.getElementById('errorParser') as HTMLElement;
  const spinnerContainerRule = document.getElementById('spinner-container-rule') as HTMLDivElement;
  const spinnerContainerLog = document.getElementById('spinner-container-log') as HTMLDivElement;
  const divC = document.getElementById('jsoneditorC') as HTMLElement;
  const divNC = document.getElementById('jsoneditorNC') as HTMLElement;
  const options = {};

  // pulisco il div prima di iniettare
  if(divC) divC.innerHTML = '';
  if(divNC) divNC.innerHTML = '';
  
  const jsonC = new JSONEditor(divC, options);
  const jsonNC = new JSONEditor(divNC, options);

  function showSpinner(spinnerContainer: HTMLDivElement) {
    spinnerContainer.style.display = 'flex';
  }

  function hideSpinner(spinnerContainer: HTMLDivElement) {
    spinnerContainer.style.display = 'none';
  }

  // ----------- load log from file
  const formLog = document.getElementById('logForm') as HTMLElement;
  if(formLog) {
      formLog.addEventListener('submit', event => {
        event.preventDefault()
        const fileInput = document.getElementById("logInput") as HTMLInputElement;
        const file = fileInput.files?.[0]; if (!file) { alert('Please select a file to upload'); return; }

        const formData = new FormData();
        formData.append('file', file);

        showSpinner(spinnerContainerLog)
        axios.post('http://127.0.0.1:8001/api/uploadLog', formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        ).then(response => {
          initLog(response)
          hideSpinner(spinnerContainerLog)
        }).catch(error => {
          console.error('Error uploading file:', error);
        });
      });
  }

  // --------------- parse rule
  const compileRule = document.getElementById('compileRule') as HTMLElement;
  if(compileRule) {
      compileRule.addEventListener('submit', event => {
        event.preventDefault();
        console.log("Verifying rule with parser...");
        
        //-------------- retrieve rule -------------------------------
        const rule: string = (document.getElementById("rule") as HTMLSelectElement).value;

        // rimosso l'alert pop up
        if (rule.length == 0) { 
          errDiv.className = 'alert alert-danger'; 
          errDiv.style.cssText = ''; 
          errDiv.innerText = 'Please insert a rule to compile!'; 
          return; 
        }

        console.log(rule);

        try {
      parser.feed(rule);

      if (parser.results.length > 0) {
        parserResult = JSON.stringify(ir(parser.results[0]), null, 2);
        console.log(parserResult);
        
        errDiv.className = 'alert alert-success'; 
        errDiv.style.cssText = ''; 
        errDiv.innerText = `Rule "${rule}" successfully compiled!`
      } else {
        errDiv.className = 'alert alert-warning'; 
        errDiv.style.cssText = '';
        errDiv.innerText = `Rule "${rule}" correct so far, but incomplete!`
      }

    } catch (error) {
      console.log(error)
      errDiv.className = 'alert alert-danger'; 
      errDiv.style.cssText = '';
      errDiv.innerHTML = `<pre style="color: inherit; background: transparent; border: none; padding: 0;">${String(error)}</pre>`
    } finally {
      parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    }
      });
  }

  const downloadC = document.getElementById('downloadLinkC') as HTMLLinkElement;
  const downloadNC = document.getElementById('downloadLinkNC') as HTMLLinkElement;

  const verifyRule = document.getElementById('verifyRule') as HTMLElement;
  if(verifyRule) {
      verifyRule.addEventListener('submit', event => {
        event.preventDefault();
        showSpinner(spinnerContainerRule);
        console.log("Applying rule to event log...");
        
        const text: string = (document.getElementById("rule") as HTMLSelectElement).value;
        console.log(`processing... ${text}`);

        var fun = (document.getElementById(`fun`) as HTMLSelectElement).value
        var ca = (document.getElementById(`ca`) as HTMLSelectElement).value
        var b = (document.getElementById(`b`) as HTMLSelectElement).value
        var s = (document.getElementById(`s`) as HTMLSelectElement).value
        var time = (document.getElementById(`time`) as HTMLSelectElement).value
        var gL = (document.getElementById(`gL`) as HTMLSelectElement).value
        var gU = (document.getElementById(`gU`) as HTMLSelectElement).value
        var v = (document.getElementById(`V`) as HTMLSelectElement).value
        var sv = (document.getElementById(`sv`) as HTMLSelectElement).value
        var call = (document.getElementById(`call`) as HTMLSelectElement).value
        var i = (document.getElementById(`i`) as HTMLSelectElement).value
        var e = (document.getElementById(`e`) as HTMLSelectElement).value

        const mapping: Mapping = {
          function: fun, contract: ca, block: b, sender: s, timestamp: time,
          gasLimit: gL, gasUsed: gU, value: v, SV: sv, CALL: call, I: i, E: e,
        }
        const rule: any = { rule: parserResult }
        
        console.log(`processing... ${mapping}`);
        axios.post('http://127.0.0.1:8001/api/verifyRule', { rule: rule, mapping: mapping })
          .then(response => {
            console.log(response.status)

            const c = response.data.compliant;
            const nc = response.data.noncompliant;

            const urlC = window.URL.createObjectURL(new Blob([JSON.stringify(c)]));
            downloadC.href = urlC;
            downloadC.setAttribute('download', 'compliant_set.json');

            const urlNC = window.URL.createObjectURL(new Blob([JSON.stringify(nc)]));
            downloadNC.href = urlNC;
            downloadNC.setAttribute('download', 'non-compliant_set.json');

            jsonC.set(Object.fromEntries(Object.entries(c).slice(0, 20)));
            jsonNC.set(Object.fromEntries(Object.entries(nc).slice(0, 20)));

            (document.getElementById('ct') as HTMLDivElement).innerText = c.length;
            (document.getElementById('nct') as HTMLDivElement).innerText = nc.length;
            (document.getElementById('it') as HTMLDivElement).innerText = String(Number((document.getElementById('tracesLoaded') as HTMLDivElement).textContent) - (c.length + nc.length));
          })
          .catch(error => console.error('Error submitting data:', error))
          .finally(() => { hideSpinner(spinnerContainerRule); });
      });
  }
}

function initLog(response: AxiosResponse<any, any>) {
  (document.getElementById('logLoaded') as HTMLDivElement).innerText = response.data.logName;
  (document.getElementById('logLoaded') as HTMLDivElement).classList.add('bg-success');
  (document.getElementById('eventsLoaded') as HTMLDivElement).innerText = response.data.numEvents;
  (document.getElementById('tracesLoaded') as HTMLDivElement).innerText = response.data.numTraces;
  const selectorColumns: NodeListOf<HTMLElement> = document.querySelectorAll('.log-columns');
  selectorColumns.forEach(function (sel) {
    emptySelect(sel);
    var nulloption = document.createElement("option");
    nulloption.text = "";
    nulloption.value = "null";
    (sel as HTMLSelectElement).add(nulloption)
    response.data.columns.forEach((c: string) => {
      var newoption = document.createElement("option");
      newoption.text = c;
      newoption.value = c;
      (sel as HTMLSelectElement).add(newoption);
    })
  })
}

function emptySelect(selector: HTMLElement) {
  while ((selector as HTMLSelectElement).options.length > 0) {
    (selector as HTMLSelectElement).remove(0);
  }
}