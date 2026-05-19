/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { blocks } from './blocks/text';
import 'blockly/javascript';
import { toolbox } from './toolbox';
import { javascriptGenerator } from 'blockly/javascript';
import DarkTheme from '@blockly/theme-dark';

console.log('File B loaded')
// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);

// Rule block
javascriptGenerator.forBlock['coblock_rule'] = function (block: Blockly.Block) {
  const ruleStart = javascriptGenerator.statementToCode(block, 'RULE_START');
  return `${ruleStart}`.replace(/\(\s+/g, '(');
};

// Transaction block
javascriptGenerator.forBlock['coblock_tx'] = function (block: Blockly.Block) {
  const txName = block.getFieldValue('TXNAME');
  const fields = javascriptGenerator.statementToCode(block, 'FIELDS');
  const attrs = javascriptGenerator.statementToCode(block, 'ATTRS');
  const calls = javascriptGenerator.statementToCode(block, 'CALLS');
  
  const mulTxs = block.getFieldValue('tx_card')
  const cfTxs = block.getFieldValue('cf_tx') == "X" ? " dr > 0 seconds " : " r > 0 seconds "
  let textTx = ""
  if (mulTxs > 1)
    for (let i = 0; i < mulTxs; i++) {
      textTx += `${txName}(${fields}${attrs}${calls})`; 
      if (i < (mulTxs - 1))
        textTx += cfTxs 
    }
  else
    textTx += `${txName}(${fields}${attrs}${calls})`;
  return textTx
};

// Field blocks
javascriptGenerator.forBlock['tx_field_leaf'] = function (block: Blockly.Block) {
  const f = block.getFieldValue('F');
  const comp = block.getFieldValue('COMP');
  const v = block.getFieldValue('VALUE');
  return `${f} ${comp} ${v}`;
};

javascriptGenerator.forBlock['tx_field_logic'] = function (block: Blockly.Block) {
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

// Attribute blocks
javascriptGenerator.forBlock['attr_leaf'] = function (block: Blockly.Block) {
  const a = block.getFieldValue('A');
  const cond = javascriptGenerator.statementToCode(block, 'COND');
  return `${a}(${cond})`;
};

javascriptGenerator.forBlock['attr_logic'] = function (block: Blockly.Block) {
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

javascriptGenerator.forBlock['cond_leaf'] = function (block: Blockly.Block) {
  const name = block.getFieldValue('NAME');
  const comp = block.getFieldValue('COMP');
  const value = block.getFieldValue('VALUE');
  return ` ${name} ${comp} ${value}`;
};

javascriptGenerator.forBlock['cond_logic'] = function (block: Blockly.Block) {
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

javascriptGenerator.forBlock['coblock_call'] = function (block: Blockly.Block) {
  const callName = block.getFieldValue('CALLNAME');
  const fields = javascriptGenerator.statementToCode(block, 'CALLFIELD');
  const attrs = javascriptGenerator.statementToCode(block, 'ATTR');
  const calls = javascriptGenerator.statementToCode(block, 'CALL');
  return `${callName}(${fields}${attrs}${calls})`;
};

javascriptGenerator.forBlock['call_field_leaf'] = function (block: Blockly.Block) {
  const f = block.getFieldValue('F');
  const comp = block.getFieldValue('COMP');
  const v = block.getFieldValue('VALUE');
  return `${f} ${comp} ${v}`;
};

javascriptGenerator.forBlock['call_field_logic'] = function (block: Blockly.Block) {
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

javascriptGenerator.forBlock['call_logic'] = function (block: Blockly.Block) {
  const a = javascriptGenerator.statementToCode(block, 'A');
  const op = block.getFieldValue('OP');
  const b = javascriptGenerator.statementToCode(block, 'B');
  return `(${a} ${op} ${b})`;
};

javascriptGenerator.forBlock['coblock_control_unary'] = function (block: Blockly.Block) {
  const cf = block.getFieldValue('CFU');
  return ` ${cf}`;
};

javascriptGenerator.forBlock['coblock_interval'] = function (block: Blockly.Block) {
  const comp = block.getFieldValue('COMP');
  const v = block.getFieldValue('VALUE');
  const unit = block.getFieldValue('UNIT');
  return ` ${comp} ${v} ${unit}`;
};

javascriptGenerator.forBlock['coblock_control_binary'] = function (block: Blockly.Block) {
  const cf = block.getFieldValue('CFB');
  const ti = javascriptGenerator.statementToCode(block, 'INTERVAL');
  if (ti.length == 0)
    return ` ${cf} > 0 seconds `;  
  return ` ${cf} ${ti} `;
};


let ws: Blockly.WorkspaceSvg; // workspace globale per questo file

export function initBlocklyEditor(isDarkMode: boolean) {
  const blocklyDiv = document.getElementById('blocklyDiv');

  if (!blocklyDiv) {
    console.error(`div with id 'blocklyDiv' not found.`);
    return;
  }
  
  if(ws) {
      console.log("Blockly già inizializzato.");
      ws.setTheme(isDarkMode ? DarkTheme : Blockly.Themes.Classic);
      return;
  }

  ws = Blockly.inject(blocklyDiv, { 
    toolbox: toolbox,
    theme: isDarkMode ? DarkTheme : Blockly.Themes.Classic
  });

  setTimeout(() => {
    Blockly.svgResize(ws);
  }, 100);

  // Register custom blocks/toolbar
  var ruleFlyoutCallback = function () {
    return [
      { kind: 'block', type: 'coblock_rule' },
      { kind: 'block', type: 'coblock_tx' }
    ];
  };
  ws.registerToolboxCategoryCallback('RULE', ruleFlyoutCallback);

  var fieldsFlyoutCallback = function () {
    return [
      { kind: 'block', type: 'tx_field_leaf' },
      { kind: 'block', type: 'tx_field_logic' }
    ];
  };
  ws.registerToolboxCategoryCallback('FIELDS', fieldsFlyoutCallback);

  var attrsFlyoutCallback = function () {
    return [
      { kind: 'block', type: 'attr_leaf' },
      { kind: 'block', type: 'attr_logic' },
      { kind: 'block', type: 'cond_leaf' },
      { kind: 'block', type: 'cond_logic' }
    ];
  };
  ws.registerToolboxCategoryCallback('ATTRS', attrsFlyoutCallback);

  var callsFlyoutCallback = function () {
    return [
      { kind: 'block', type: 'coblock_call' },
      { kind: 'block', type: 'call_logic' },
      { kind: 'block', type: 'call_field_leaf' },
      { kind: 'block', type: 'call_field_logic' },
    ];
  };
  ws.registerToolboxCategoryCallback('CALLS', callsFlyoutCallback);

  var cfFlyoutCallback = function () {
    return [
      { kind: 'block', type: 'coblock_control_unary' },
      { kind: 'block', type: 'coblock_control_binary' },
      { kind: 'block', type: 'coblock_interval' },
    ];
  };
  ws.registerToolboxCategoryCallback('CF', cfFlyoutCallback);

  console.log("...adding event listener - COBLOCKLY (Avviato da React)")
  const button = document.getElementById('generateBtn');
  if (button) {
    button.addEventListener('click', () => {
      console.log('Button clicked!');
      sendRuleToBackend();
    });
  } else {
    console.error('Button with ID "generateBtn" not found.');
  }
}

// Generate and send rule string
function generateRuleString(): string {
  console.log("Workspace to code")
  if (javascriptGenerator && ws) {
    const code = javascriptGenerator.workspaceToCode(ws);
    console.log('Generated Code:', code);
    return code;
  } else {
    console.error('javascriptGenerator or workspace not loaded');
    return '';
  }
}

export function sendRuleToBackend() {
  console.log("Retrieving rule from Blockly")
  const rule = generateRuleString();
  console.log('Generated Rule:', rule);

  var divOutput = document.getElementById("outputCoBlockly")
  if (divOutput) {
    const textEl = document.createElement('p') as HTMLParagraphElement;
    divOutput.innerHTML = '';
    textEl.innerText = rule;
    divOutput.appendChild(textEl);
  }

  var divRule = document.getElementById("rule") as HTMLInputElement;
  if (divRule) {
    divRule.value = (rule) ? (rule).trim().replace(/\s+/g, ' ') : "";
  }

  if (divRule?.value) {
    const button = document.getElementById('parserButton') as HTMLButtonElement;
    if(button) button.click();
  }
}