// /**
//  * @license
//  * Copyright 2023 Google LLC
//  * SPDX-License-Identifier: Apache-2.0
//  */

// export const toolbox = {
//     kind: 'categoryToolbox',
//     contents: [
//         {
//             kind: 'category',
//             name: 'Rule',
//             categorystyle: 'math_category',
//             custom: 'RULE',
//             contents: [
//                 // 1) Rule container
//                 {
//                     kind: 'block',
//                     type: 'coblock_rule',
//                 },
//                 // 2) Transaction pattern
//                 {
//                     kind: 'block',
//                     type: 'coblock_tx',
//                 }
//             ]
//         },
//         // 3) FIELD filters
//         {
//             kind: 'category',
//             custom: 'FIELDS',
//             name: 'Fields',
//             categorystyle: 'procedure_category',
//             contents: [
//                 {
//                     kind: 'block', type: 'tx_field_leaf'
//                 },
//                 {
//                     kind: 'block', type: 'tx_field_logic'
//                 }
//             ]
//         },
//         // 4) ATTR filters
//         {
//             kind: 'category',
//             custom: 'ATTRS',
//             name: 'Attrs',
//             categorystyle: 'loop_category',
//             contents: [
//                 {
//                     kind: 'block', type: 'attr_leaf'
//                 },
//                 {
//                     kind: 'block', type: 'attr_logic'
//                 },
//                 {
//                     kind: 'block', type: 'cond_leaf'
//                 },
//                 {
//                     kind: 'block', type: 'cond_logic'
//                 }
//             ]
//         },
//         // 5) Internal calls
//         {
//             kind: 'category',
//             custom: 'CALLS',
//             name: 'Internal calls',
//             categorystyle: 'math_category',
//             contents: [
//                 {
//                     kind: 'block', type: 'coblock_call'
//                 },
//                 {
//                     kind: 'block', type: 'call_logic'
//                 },
//                 {
//                     kind: 'block', type: 'call_field_leaf'
//                 },
//                 {
//                     kind: 'block', type: 'call_field_logic'
//                 },
//             ]
//         },
//         // 5) Control-flow: unary and interval
//         {
//             kind: 'category',
//             custom: 'CF',
//             name: 'Control-flow',
//             categorystyle: 'text_category',
//             contents: [
//                 {
//                     kind: 'block', type: 'coblock_control_unary'
//                 },
//                 // 6) Control-flow: binary
//                 {
//                     kind: 'block', type: 'coblock_control_binary'
//                 },
//                 {
//                     kind: 'block', type: 'coblock_interval'
//                 },
//             ]
//         }
//     ]
// }
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const toolbox = {
    kind: 'categoryToolbox',
    contents: [
        {
            kind: 'category',
            name: 'Rule',
            colour: '#5ba5a5', // Custom Blue
            custom: 'RULE',
            contents: [
                { kind: 'block', type: 'coblock_rule' },
                { kind: 'block', type: 'coblock_tx' }
            ]
        },
        {
            kind: 'category',
            name: 'Fields',
            colour: '#935ba5', // Custom Orange
            custom: 'FIELDS',
            contents: [
                { kind: 'block', type: 'tx_field_leaf' },
                { kind: 'block', type: 'tx_field_logic' }
            ]
        },
        {
            kind: 'category',
            name: 'Attrs',
            colour: '#a4805b', // Custom Green
            custom: 'ATTRS',
            contents: [
                { kind: 'block', type: 'attr_leaf' },
                { kind: 'block', type: 'attr_logic' },
                { kind: 'block', type: 'cond_leaf' },
                { kind: 'block', type: 'cond_logic' }
            ]
        },
        {
            kind: 'category',
            name: 'Internal calls',
            colour: '#5b6da5', // Custom Purple
            custom: 'CALLS',
            contents: [
                { kind: 'block', type: 'coblock_call' },
                { kind: 'block', type: 'call_logic' },
                { kind: 'block', type: 'call_field_leaf' },
                { kind: 'block', type: 'call_field_logic' }
            ]
        },
        {
            kind: 'category',
            name: 'Control-flow',
            colour: '#5ba56d', // Custom Red
            custom: 'CF',
            contents: [
                { kind: 'block', type: 'coblock_control_unary' },
                { kind: 'block', type: 'coblock_control_binary' },
                { kind: 'block', type: 'coblock_interval' }
            ]
        }
    ]
};