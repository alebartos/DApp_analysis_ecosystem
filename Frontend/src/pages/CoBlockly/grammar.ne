@preprocessor typescript

# Root Rule
RULE -> TX _ CFu {% d => [d[0], d[2]] %}
      | RULEb    {% id %}

# Recursive Rule
RULEb -> TX _ CFb _ TI _ TX    {% d => [d[0], d[2], d[4], d[6]] %}
       | TX _ CFb _ TI _ RULEb {% d => [d[0], d[2], d[4], d[6]] %}

# Transaction: name( [FIELD] [ATTR] [CALL] )
TX -> word _ "(" _ OPT_FIELD OPT_ATTR OPT_CALL ")" {% 
    d => ({ 
        type: "tx", 
        name: d[0], 
        field: d[4], 
        attr: d[5], 
        call: d[6] 
    }) 
%}

# ==========================================
# 0. OPTIONAL HELPERS
# ==========================================

OPT_FIELD -> FIELD _ {% d => d[0] %} 
           | null    {% () => null %}

OPT_CALLFIELD -> CALLFIELD _ {% d => d[0] %} 
               | null        {% () => null %}

OPT_ATTR  -> ATTR _  {% d => d[0] %} 
           | null    {% () => null %}

OPT_CALL  -> CALL _  {% d => d[0] %} 
           | null    {% () => null %}

# ==========================================
# 1. FIELD LOGIC
# ==========================================
FIELD -> FIELD _ "OR" _ FIELD_AND {% d => ({ op: "OR", left: d[0], right: d[4] }) %}
       | FIELD_AND                {% id %}

FIELD_AND -> FIELD_AND _ "AND" _ FIELD_ATOM {% d => ({ op: "AND", left: d[0], right: d[4] }) %}
           | FIELD_ATOM                     {% id %}

FIELD_ATOM -> F               {% id %}
            | "true"          {% () => true %}
            | "(" _ FIELD _ ")" {% d => d[2] %}

F -> "function"  _ OP   _ VAL {% d => ({ field: "function", op: d[2], val: d[4] }) %}
   | "contract"  _ OP   _ VAL {% d => ({ field: "contract", op: d[2], val: d[4] }) %}
   | "block"     _ COMP _ int {% d => ({ field: "block", op: d[2], val: d[4] }) %}
   | "sender"    _ OP   _ VAL {% d => ({ field: "sender", op: d[2], val: d[4] }) %}
   | "timestamp" _ COMP _ VAL {% d => ({ field: "timestamp", op: d[2], val: d[4] }) %}
   | "gasLimit"  _ COMP _ int {% d => ({ field: "gasLimit", op: d[2], val: d[4] }) %}
   | "gasUsed"   _ COMP _ int {% d => ({ field: "gasUsed", op: d[2], val: d[4] }) %}
   | "value"     _ COMP _ int {% d => ({ field: "value", op: d[2], val: d[4] }) %}

# ==========================================
# 2. ATTRIBUTE LOGIC
# ==========================================
ATTR -> ATTR _ "OR" _ ATTR_AND {% d => ({ op: "OR", left: d[0], right: d[4] }) %}
      | ATTR_AND               {% id %}

ATTR_AND -> ATTR_AND _ "AND" _ ATTR_ATOM {% d => ({ op: "AND", left: d[0], right: d[4] }) %}
          | ATTR_ATOM                    {% id %}

ATTR_ATOM -> A "(" _ COND _ ")" {% d => ({ type: "attr", name: d[0], cond: d[3] }) %}
           | "true"             {% () => true %}
           | "(" _ ATTR _ ")"   {% d => d[2] %}

A -> "sv" | "input" | "event" {% id %}

# ==========================================
# 3. CONDITION LOGIC
# ==========================================
COND -> COND _ "OR" _ COND_AND {% d => ({ op: "OR", left: d[0], right: d[4] }) %}
      | COND_AND               {% id %}

COND_AND -> COND_AND _ "AND" _ COND_ATOM {% d => ({ op: "AND", left: d[0], right: d[4] }) %}
          | COND_ATOM                    {% id %}

COND_ATOM -> word _ COMP _ VAL {% d => ({ left: d[0], op: d[2], right: d[4] }) %}
           | word              {% id %}
           | "!" word          {% d => ({ op: "NOT", val: d[1] }) %}
           | "true"            {% () => true %}
           | "(" _ COND _ ")"  {% d => d[2] %}

# ==========================================
# 4. CALL LOGIC
# ==========================================
CALL -> CALL _ "OR" _ CALL_AND {% d => ({ op: "OR", left: d[0], right: d[4] }) %}
      | CALL_AND               {% id %}

CALL_AND -> CALL_AND _ "AND" _ CALL_ATOM {% d => ({ op: "AND", left: d[0], right: d[4] }) %}
          | CALL_ATOM                    {% id %}

CALL_ATOM -> word "(" _ OPT_CALLFIELD OPT_ATTR OPT_CALL ")" {% 
    d => ({ 
        type: "internal_call", 
        name: d[0],      
        fields: d[3], 
        attr: d[4], 
        inner: d[5] 
    }) 
%}
           | "(" _ CALL _ ")" {% d => d[2] %}

# ==========================================
# 5. CALLFIELD LOGIC
# ==========================================
CALLFIELD -> CALLFIELD _ "OR" _ CALLFIELD_AND {% d => ({ op: "OR", left: d[0], right: d[4] }) %}
           | CALLFIELD_AND                    {% id %}

CALLFIELD_AND -> CALLFIELD_AND _ "AND" _ CALLFIELD_ATOM {% d => ({ op: "AND", left: d[0], right: d[4] }) %}
               | CALLFIELD_ATOM                        {% id %}

CALLFIELD_ATOM -> CALLF     {% id %}
                | "true"    {% () => true %}
                | "(" _ CALLFIELD _ ")" {% d => d[2] %}

CALLF -> "type"     _ OP   _ VAL {% d => ({ field: "type", op: d[2], val: d[4] }) %}
       | "function" _ OP   _ VAL {% d => ({ field: "function", op: d[2], val: d[4] }) %}
       | "from"     _ OP   _ VAL {% d => ({ field: "from", op: d[2], val: d[4] }) %}
       | "to"       _ OP   _ VAL {% d => ({ field: "to", op: d[2], val: d[4] }) %}
       | "gasLimit" _ COMP _ int {% d => ({ field: "gasLimit", op: d[2], val: d[4] }) %}
       | "gasUsed"  _ COMP _ int {% d => ({ field: "gasUsed", op: d[2], val: d[4] }) %}
       | "value"    _ COMP _ int {% d => ({ field: "value", op: d[2], val: d[4] }) %}
       | "output"   _ OP   _ VAL {% d => ({ field: "output", op: d[2], val: d[4] }) %}
       | "depth"    _ COMP _ int {% d => ({ field: "depth", op: d[2], val: d[4] }) %}

# ==========================================
# Temporal & Logic Operators
# ==========================================

CFu -> "occ" | "nocc" | "init" | "end" {% id %}

CFb -> "er" | "r" | "edr" | "dr" | "enr" | "nr" | "endr" | "ndr" 
     | "wpr" | "spr" | "c" | "ex" {% id %}

TI -> COMP _ int _ "seconds" {% d => ({ op: d[0], val: d[2], unit: "seconds" }) %}
    | COMP _ int _ "blocks"  {% d => ({ op: d[0], val: d[2], unit: "blocks" }) %}

OP   -> "==" | "!=" {% id %}
COMP -> OP | "<" | ">" | "<=" | ">=" {% id %}

# ==========================================
# Primitives & Helpers
# ==========================================

VAL -> int | word | dotted_word {% id %}

_  -> wschar:* {% function(d) {return null;} %}
wschar -> [ \t\n\v\f] {% id %}

int -> ("-"|"+"):? [0-9]:+ {%
    function(d) {
        if (d[0]) {
            return parseInt(d[0][0]+d[1].join(""));
        } else {
            return parseInt(d[1].join(""));
        }
    }
%}

# word -> ["_"]:* [a-zA-Z0-9] [a-zA-Z0-9]:* {% (d) => d.join('') %}
word -> [a-zA-Z0-9_] [a-zA-Z0-9_\-:+]:* {% (d) => d[0] + d[1].join('') %}

dotted_word -> word ("." word):* {% (d) => d.join('') %}