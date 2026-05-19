interface Constraint {
  [key: string]: any;
}

interface Transaction {
  txId: string;
  constraint: Constraint;
}

interface ControlFlow {
  cfb?: string;
  cfu?: string;
  comp?: string;
  val?: number;
  unit?: string;
}

interface BBCR {
  [key: string]: Transaction | ControlFlow;
}

function cleanData(data: any): any {
    console.log(data);
    
    // 1. Handle Strings: Remove commas
    if (typeof data === 'string') {
        return data.replace(/,/g, '');
    }

    // 2. Handle Arrays: Recursively clean each item, then join (if that is your goal)
    // NOTE: Based on your previous request, I assume you want to JOIN arrays of strings.
    // If you want to keep the array structure but clean the items inside, see the alternative below.
    if (Array.isArray(data)) {
        return data.map(item => cleanData(item)).join('');
    }

    // 3. Handle Objects: Recursively clean each value within the object
    if (typeof data === 'object' && data !== null) {
        const cleanedObject: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                cleanedObject[key] = cleanData(data[key]);
            }
        }
        return cleanedObject;
    }

    // 4. Return everything else (numbers, boolean, null) as is
    return data;
}

// Helper to merge field constraints into the main constraint object
function mergeField(field: any, constraint: Constraint): void {
  if (!field || field === true) {
    return;
  }
  
  if (field.op === 'OR' || field.op === 'AND') {
    // Handle logical operators - store as nested structure
    if (!constraint.field_logic) {
      constraint.field_logic = [];
    }
    constraint.field_logic.push({
      op: cleanData(field.op),
      left: cleanData(field.left),
      right: cleanData(field.right)
    });
  } else if (field.field) {
    // Base field: { field: "function", op: "==", val: "transfer" }
    constraint[field.field] = {
      op: cleanData(field.op),
      value: cleanData(field.val)
    };
  }
}

// Helper to process ATTR structure
function processAttr(attr: any): any {
  if (!attr || attr === true) {
    return null;
  }
  
  if (attr.op === 'OR' || attr.op === 'AND') {
    // Logical operators on attributes
    return {
      op: attr.op,
      left: processAttr(attr.left),
      right: processAttr(attr.right)
    };
  }
  
  // ATTR_ATOM: { type: "attr", name: "sv", cond: {...} }
  if (attr.type === 'attr') {
    return {
      type: cleanData(attr.name), // sv, input, or event
      condition: processCond(attr.cond)
    };
  }
  
  return null;
}

// Helper to process COND structure inside attributes
function processCond(cond: any): any {
  if (!cond || cond === true) {
    return true;
  }
  
  if (cond.op === 'OR' || cond.op === 'AND') {
    return {
      op: cleanData(cond.op),
      left: processCond(cond.left),
      right: processCond(cond.right)
    };
  }
  /*
  if (cond.op === 'NOT') {
    return {
      op: 'NOT',
      value: cond.val
    };
  }
  */
  // COND_ATOM: { left: "amount", op: ">", right: 1000 }
  if (cond.left && cond.op && cond.right !== undefined) {
    return {
      field: cleanData(cond.left),
      op: cleanData(cond.op),
      value: cleanData(cond.right)
    };
  }
  
  // Just a word identifier
  return cond;
}

// Helper to process CALL structure
function processCall(call: any): any {
  if (!call) {
    return null;
  }
  
  if (call.op === 'OR' || call.op === 'AND') {
    return {
      op: cleanData(call.op),
      left: processCall(call.left),
      right: processCall(call.right)
    };
  }
  
  // CALL_ATOM: { type: "internal_call", name: "contract", fields: {...}, attr: {...}, inner: {...} }
  if (call.type === 'internal_call') {
    const result: any = {
      type: 'internal_call',
      name: cleanData(call.name)
    };
    
    if (call.fields) {
      result.fields = processCallField(call.fields);
    }
    
    if (call.attr) {
      result.attr = processAttr(call.attr);
    }
    
    if (call.inner) {
      result.inner = processCall(call.inner);
    }
    
    return result;
  }
  
  return null;
}

// Helper to process CALLFIELD structure
function processCallField(field: any): any {
  if (!field || field === true) {
    return null;
  }
  
  if (field.op === 'OR' || field.op === 'AND') {
    return {
      op: cleanData(field.op),
      left: processCallField(field.left),
      right: processCallField(field.right)
    };
  }
  
  // CALLF: { field: "type", op: "==", val: "CALL" }
  if (field.field) {
    return {
      [field.field]: {
        op: cleanData(field.op),
        value: cleanData(field.val)
      }
    };
  }
  
  return null;
}

// Main interpreter function
export function interpretRule(
  parseResult: any,
  counterTx: number = 0,
  counterCf: number = 0
): BBCR {
  const bbcr: BBCR = {};
    
  // Unary rule: [TX, CFu]
  // TX = { type: "tx", name: "Transfer", field: {...}, attr: {...}, call: {...} }
  // CFu = "occ" | "nocc" | "init" | "end"
  if (parseResult.length === 2) {
    const [tx, cfu] = parseResult;
    
    const constraint: Constraint = {};
    
    // Process fields
    if (tx.field) {
      mergeField(tx.field, constraint);
    }
    
    // Process attributes
    if (tx.attr) {
      const attrResult = processAttr(tx.attr);
      if (attrResult) {
        constraint.attr = attrResult;
      }
    }
    
    // Process calls
    if (tx.call) {
      const callResult = processCall(tx.call);
      if (callResult) {
        constraint.call = callResult;
      }
    }
    
    bbcr[`tx${counterTx}`] = {
      txId: cleanData(tx.name),
      constraint
    };
    
    bbcr[`cf${counterCf}`] = { cfu };
    
    return bbcr;
  }
  
  // Binary rule: [TX, CFb, TI, TX/RULEb]
  // CFb = "er" | "r" | "edr" | "dr" | "enr" | "nr" | "endr" | "ndr" | "wpr" | "spr" | "c" | "ex"
  // TI = { op: "<", val: 100, unit: "seconds" | "blocks" }
  if (parseResult.length === 4) {
    const [tx1, cfb, ti, nextRule] = parseResult;
    
    const constraint1: Constraint = {};
    
    // Process first transaction
    if (tx1.field) {
      mergeField(tx1.field, constraint1);
    }
    
    if (tx1.attr) {
      const attrResult = processAttr(tx1.attr);
      if (attrResult) {
        constraint1.attr = attrResult;
      }
    }
    
    if (tx1.call) {
      const callResult = processCall(tx1.call);
      if (callResult) {
        constraint1.call = callResult;
      }
    }
    
    bbcr[`tx${counterTx}`] = {
      txId: cleanData(tx1.name),
      constraint: constraint1
    };
    
    // Add control flow with time interval
    bbcr[`cf${counterCf}`] = {
      cfb,
      comp: cleanData(ti.op),
      val: ti.val,
      unit: ti.unit
    };
    
    // Process next part: could be a TX or another RULEb (nested binary rule)
    // Check if nextRule is an array (RULEb) or an object with type 'tx' (TX)
    if (Array.isArray(nextRule)) {
      // It's a nested RULEb (another binary rule), recursively process it
      const nextBbcr = interpretRule(nextRule, counterTx + 1, counterCf + 1);
      Object.assign(bbcr, nextBbcr);
    } else if (nextRule.type === 'tx') {
      // It's a simple TX object
      const constraint2: Constraint = {};
      
      if (nextRule.field) {
        mergeField(nextRule.field, constraint2);
      }
      
      if (nextRule.attr) {
        const attrResult = processAttr(nextRule.attr);
        if (attrResult) {
          constraint2.attr = attrResult;
        }
      }
      
      if (nextRule.call) {
        const callResult = processCall(nextRule.call);
        if (callResult) {
          constraint2.call = callResult;
        }
      }
      
      bbcr[`tx${counterTx + 1}`] = {
        txId: cleanData(nextRule.name),
        constraint: constraint2
      };
    }
    
    return bbcr;
  }
  
  return bbcr;
}