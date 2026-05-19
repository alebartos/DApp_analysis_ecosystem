/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Create a custom blocks

// 1) Top‐level container for a rule
const rule_block =
{
  type: "coblock_rule",
  message0: "Rule %1",
  args0: [
    { type: "field_input", name: "RULENAME", text: "ruleId" }
  ],
  message1: "%1",
  args1: [
    { type: "input_statement", name: "RULE_START", check: "TRANSACTION" }
  ],
  colour: 195,
  // TODO
  tooltip: "Container for CoBLOCK rule parts (transactions + control‐flow).",
  helpUrl: ""
}

// 2) Transaction definition (TX)
const tx_block =
{
  type: "coblock_tx",
  message0: "%1 %2 %3 %4 Transaction %5 %6 Fields %7 %8 Attrs %9 %10 Calls %11 %12",
  args0: [
    {
      "type": "field_dropdown",
      "name": "comp_tx",
      "options": [
        ["==", "=="], ["!=", "!="], ["<", "<"], ["<=", "<="], [">", ">"], [">=", ">="]
      ]
    },
    {
      "type": "field_number",
      "name": "tx_card",
      "value": 1,
      "min": 1,
      "max": 999,
      "precision": 1
    },
    {
      "type": "field_dropdown",
      "name": "cf_tx",
      "options": [
        [
          "     ",
          "default"
        ],
        [
          "Directly",
          "X"
        ],
        [
          "Eventually",
          "F"
        ]
      ]
    },
    { "type": "input_end_row"},
    { type: "field_input", name: "TXNAME", text: "txId" },
    { "type": "input_end_row"},
    // Only accepts Transaction Fields (<FIELD>)
    {
      "type": "field_image",
      "src": "https://singlecolorimage.com/get/935ba5/200x100",
      "width": 40,
      "height": 20,
      "alt": "*",
      "flipRtl": "FALSE"
    },
    { type: "input_value", name: "FIELDS", check: ["TX_FIELD"], align: "RIGHT" },
    // Only accepts Attributes (<ATTR>)
    {
      "type": "field_image",
      "src": "https://singlecolorimage.com/get/a4805b/200x100",  // a5a55b
      "width": 40,
      "height": 20,
      "alt": "*",
      "flipRtl": "FALSE"
    },
    { type: "input_value", name: "ATTRS", check: ["ATTR"], align: "RIGHT" },
    // Only accepts Internal Calls (<CALL>)
    {
      "type": "field_image",
      "src": "https://singlecolorimage.com/get/5b6da5/200x100",
      "width": 40,
      "height": 20,
      "alt": "*",
      "flipRtl": "FALSE"
    },
    { type: "input_value", name: "CALLS", check: ["CALL"], align: "RIGHT" }
  ],
  // Can be the start of a Rule, or follow a Binary Control Flow
  previousStatement: ["TRANSACTION", "CF_BINARY_LINK"],
  // Must be followed by a Control Flow (Unary or Binary)
  nextStatement: ["CF_UNARY", "CF_BINARY"], 
  colour: 180,
  tooltip: "Define a transaction pattern with optional FIELD ATTR and CALL filters.",
  helpUrl: "",
  inputsInline: false
}

// --- 3. Transaction Fields (<F> inside <FIELD>) ---
const tx_field_block =
{
  type: "tx_field_leaf",
  message0: "%1 %2 %3",
  args0: [
    {
      type: "field_dropdown", name: "F",
      options: [
        ["function", "function"],
        ["contract", "contract"],
        ["block", "block"],
        ["sender", "sender"],
        ["timestamp", "timestamp"],
        ["gasLimit", "gasLimit"],
        ["gasUsed", "gasUsed"],
        ["value", "value"],
      ]
    },
    {
      type: "field_dropdown", name: "COMP",
      options: [
        ["==", "=="], ["!=", "!="], ["<", "<"], ["<=", "<="], [">", ">"], [">=", ">="]
      ]
    },
    {
      type: "field_input", name: "VALUE", text: "value",
    }
  ],
  output: "TX_FIELD",
  colour: 285,
  tooltip: "Atomic field for Transactions (<F>)",
  helpUrl: "",
  inputsInline: true
}

const tx_field_logic = {
  type: "tx_field_logic",
  message0: "(%1 %2 %3)",
  args0: [
    { type: "input_value", name: "A", check: "TX_FIELD" },
    {
      type: "field_dropdown", name: "OP",
      options: [["AND", "AND"], ["OR", "OR"]]
    },
    { type: "input_value", name: "B", check: "TX_FIELD" }
  ],
  output: "TX_FIELD",
  colour: 285,
  inputsInline: true,
  tooltip: "Logic for Transaction Fields"
};

// --- 5. Attributes (<ATTR>) ---
const category_attr_block =
// 3) FIELD blocks (all go into FIELDS)
{
  type: "attr_leaf",
  message0: "%1(%2 %3)",
  args0: [
    {
      type: "field_dropdown", name: "A",
      options: [
        ["sv", "sv"],
        ["input", "input"],
        ["event", "event"],
      ]
    },
    {
      "type": "field_image",
      "src": "https://singlecolorimage.com/get/a5a55b/100x100",
      "width": 20,
      "height": 20,
      "alt": "*",
      "flipRtl": "FALSE"
    },
    {
      type: "input_value",
      name: "COND",
      check: "COND"
    }, // Requires Condition Block a5a55b
  ],
  output: "ATTR",
  colour: 30,
  tooltip: "Filter by smart contract address.",
  helpUrl: "",
  inputsInline: true
}

const attr_logic = {
  type: "attr_logic",
  message0: "(%1 %2 %3)",
  args0: [
    { type: "input_value", name: "A", check: "ATTR" },
    {
      type: "field_dropdown", name: "OP",
      options: [["AND", "AND"], ["OR", "OR"]]
    },
    { type: "input_value", name: "B", check: "ATTR" }
  ],
  output: "ATTR",
  colour: 30,
  inputsInline: true
};

const cond_block =
{
  type: "cond_leaf",
  message0: "%1 %2 %3",
  args0: [
    {
      "type": "field_input",
      "name": "NAME",
      "text": "name"
    },
    {
      type: "field_dropdown", name: "COMP",
      options: [
        ["==", "=="], ["!=", "!="], ["<", "<"], ["<=", "<="], [">", ">"], [">=", ">="]
      ]
    },
    {
      "type": "field_input",
      "name": "VALUE",
      "text": "value"
    }
  ],
  output: "COND",
  colour: 60,
  tooltip: "Filter by smart contract address.",
  helpUrl: "",
  inputsInline: true
}

const cond_logic = {
  type: "cond_logic",
  message0: "(%1 %2 %3)",
  args0: [
    { type: "input_value", name: "A", check: "COND" },
    {
      type: "field_dropdown", name: "OP",
      options: [["AND", "AND"], ["OR", "OR"]]
    },
    { type: "input_value", name: "B", check: "COND" }
  ],
  output: "COND",
  colour: 60,
  inputsInline: true
};

// --- 7. Internal Calls (<CALL>) ---
const call_block =
// 2) Transaction definition (TX)
{
  type: "coblock_call",
  message0: "Call %1 %2 Fields %3 %4 Attrs %5 %6 Calls %7 %8",
  args0: [
    { type: "field_input", name: "CALLNAME", text: "callId" },
    { "type": "input_end_row" },
    {
      "type": "field_image",
      "src": "https://singlecolorimage.com/get/5b80a5/200x100",  // a5a55b
      "width": 40,
      "height": 20,
      "alt": "*",
      "flipRtl": "FALSE"
    },
    { type: "input_value", name: "CALLFIELD", check: "CALL_FIELD", align: "RIGHT" },
    {
      "type": "field_image",
      "src": "https://singlecolorimage.com/get/a4805b/200x100",  // a5a55b
      "width": 40,
      "height": 20,
      "alt": "*",
      "flipRtl": "FALSE"
    },
    { type: "input_value", name: "ATTR", check: "ATTR", align: "RIGHT" },
    {
      "type": "field_image",
      "src": "https://singlecolorimage.com/get/5b6da5/200x100",  // a5a55b
      "width": 40,
      "height": 20,
      "alt": "*",
      "flipRtl": "FALSE"
    },
    { type: "input_value", name: "CALL", check: "CALL", align: "RIGHT" }
  ],
  output: "CALL",
  colour: 225,
  tooltip: "Define a transaction pattern with optional FIELD and ATTR filters.",
  helpUrl: "",
  inputsInline: false,
}

// --- 4. Call Fields (<CALLF> inside <CALLFIELD>) ---
// Defined separately because <CALLF> has different options than <F>
const call_field_block = {
  type: "call_field_leaf",
  message0: "%1 %2 %3",
  args0: [
    {
      type: "field_dropdown", name: "F",
      options: [
        ["type", "type"], // Specific to Call
        ["function", "function"],
        ["from", "from"], // Specific to Call
        ["to", "to"],     // Specific to Call
        ["gasLimit", "gasLimit"],
        ["gasUsed", "gasUsed"],
        ["value", "value"],
        ["output", "output"], // Specific to Call
        ["depth", "depth"]    // Specific to Call
      ]
    },
    {
      type: "field_dropdown", name: "COMP",
      options: [
        ["==", "=="], ["!=", "!="], ["<", "<"], ["<=", "<="], [">", ">"], [">=", ">="]
      ]
    },
    { type: "field_input", name: "VALUE", text: "value" }
  ],
  output: "CALL_FIELD",
  colour: 210, // Different color to distinguish from TX fields
  tooltip: "Atomic field for Internal Calls (<CALLF>)",
  helpUrl: ""
};

const call_field_logic = {
  type: "call_field_logic",
  message0: "(%1 %2 %3)",
  args0: [
    { type: "input_value", name: "A", check: "CALL_FIELD" },
    {
      type: "field_dropdown", name: "OP",
      options: [["AND", "AND"], ["OR", "OR"]]
    },
    { type: "input_value", name: "B", check: "CALL_FIELD" }
  ],
  output: "CALL_FIELD",
  colour: 210,
  inputsInline: true
};

const call_logic = {
  type: "call_logic",
  message0: "(%1 %2 %3)",
  args0: [
    { type: "input_value", name: "A", check: "CALL" },
    {
      type: "field_dropdown", name: "OP",
      options: [["AND", "AND"], ["OR", "OR"]]
    },
    { type: "input_value", name: "B", check: "CALL" }
  ],
  output: "CALL",
  colour: 225,
  inputsInline: true
};

// 5) Control‐flow: unary (occ/nocc)
const cfu_block =
{
  type: "coblock_control_unary",
  message0: "%1",
  args0: [
    {
      type: "field_dropdown", name: "CFU",
      options: [
        ["occurrence (occ)", "occ"],
        ["not occurrence (nocc)", "nocc"],
        ["init", "init"],
        ["end", "end"]
      ]
    }
  ],
  // Snaps to the bottom of a Transaction
  previousStatement: ["CF_UNARY", "CF_BINARY"],
  // No next statement (ends the rule)
  //nextStatement: null, 
  colour: 135,
  tooltip: "Unary control‐flow: must (not) occur.",
  helpUrl: ""
}

// 6) Interval (seconds | blocks)
const ti_block =
{
  type: "coblock_interval",
  message0: "%1 %2 %3",
  args0: [
    {
      type: "field_dropdown", name: "COMP",
      options: [
        ["<", "<"], ["≤", "<="], ["=", "="], ["≠", "!="], [">", ">"], ["≥", ">="]
      ]
    },
    { type: "field_input", name: "VALUE", text: "value", check: "Number" },
    {
      type: "field_dropdown", name: "UNIT",
      options: [
        ["seconds", "seconds"],
        ["blocks", "blocks"]
      ]
    }
  ],
  output: "INTERVAL",
  colour: 75,
  tooltip: "Define interval in seconds or blocks.",
  helpUrl: ""
}

// 7) Control‐flow: binary (ef|df|nef|ndf)
const cfb_block =
{
  type: "coblock_control_binary",
  message0: "%1 %2 %3",
  args0: [
    {
      type: "field_dropdown", name: "CFB",
      options: [
        ["eventually response (er)","er"], 
        ["response (r)","r"], 
        ["eventually direct response (edr)","edr"], 
        ["direct response (dr)","dr"], 
        ["eventually not response (enr)","enr"], 
        ["not response (nr)","nr"], 
        ["eventually not direct response (endr)","endr"], 
        ["not direct response (ndr)","ndr"],
        ["weak pairwise response (wpr)","wpr"], 
        ["strong pairwise response (spr)","spr"], 
        ["choice (ch)","ch"],
        ["exclusive choice (ex)","ex"],
      ]
    },
    {
      "type": "field_image",
      "src": "https://singlecolorimage.com/get/93a55b/200x100",  // a5a55b
      "width": 40,
      "height": 20,
      "alt": "*",
      "flipRtl": "FALSE"
    },
    { type: "input_value", name: "INTERVAL", check: "INTERVAL" },
  ],
  // Snaps to the bottom of a Transaction 93a55b
  previousStatement: ["CF_UNARY", "CF_BINARY"],
  // Must be followed by another Transaction to continue the chain
  nextStatement: "CF_BINARY_LINK",
  colour: 135,
  tooltip: "Binary control‐flow between two transactions.",
  helpUrl: ""
}


// Create the block definitions for the JSON-only blocks.
// This does not register their definitions with Blockly.
// This file has no side effects!
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  rule_block,
  tx_block,
  tx_field_block,
  tx_field_logic,
  //c_block,
  //b_block,
  //g_block,
  //s_block,
  //fun_block,
  //time_block,
  category_attr_block,
  attr_logic,
  cond_block,
  cond_logic,
  // sv_block,
  // call_block,
  // //inputCall_block,
  // input_block,
  // event_block,
  // ed_block,
  call_block,
  call_logic,
  call_field_block,
  call_field_logic,
  //
  ti_block,
  cfu_block,
  cfb_block
]);