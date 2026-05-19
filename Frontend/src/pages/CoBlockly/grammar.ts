// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: undefined,
  ParserRules: [
    {"name": "RULE", "symbols": ["TX", "_", "CFu"], "postprocess": d => [d[0], d[2]]},
    {"name": "RULE", "symbols": ["RULEb"], "postprocess": id},
    {"name": "RULEb", "symbols": ["TX", "_", "CFb", "_", "TI", "_", "TX"], "postprocess": d => [d[0], d[2], d[4], d[6]]},
    {"name": "RULEb", "symbols": ["TX", "_", "CFb", "_", "TI", "_", "RULEb"], "postprocess": d => [d[0], d[2], d[4], d[6]]},
    {"name": "TX", "symbols": ["word", "_", {"literal":"("}, "_", "OPT_FIELD", "OPT_ATTR", "OPT_CALL", {"literal":")"}], "postprocess":  
        d => ({ 
            type: "tx", 
            name: d[0], 
            field: d[4], 
            attr: d[5], 
            call: d[6] 
        }) 
        },
    {"name": "OPT_FIELD", "symbols": ["FIELD", "_"], "postprocess": d => d[0]},
    {"name": "OPT_FIELD", "symbols": [], "postprocess": () => null},
    {"name": "OPT_CALLFIELD", "symbols": ["CALLFIELD", "_"], "postprocess": d => d[0]},
    {"name": "OPT_CALLFIELD", "symbols": [], "postprocess": () => null},
    {"name": "OPT_ATTR", "symbols": ["ATTR", "_"], "postprocess": d => d[0]},
    {"name": "OPT_ATTR", "symbols": [], "postprocess": () => null},
    {"name": "OPT_CALL", "symbols": ["CALL", "_"], "postprocess": d => d[0]},
    {"name": "OPT_CALL", "symbols": [], "postprocess": () => null},
    {"name": "FIELD$string$1", "symbols": [{"literal":"O"}, {"literal":"R"}], "postprocess": (d) => d.join('')},
    {"name": "FIELD", "symbols": ["FIELD", "_", "FIELD$string$1", "_", "FIELD_AND"], "postprocess": d => ({ op: "OR", left: d[0], right: d[4] })},
    {"name": "FIELD", "symbols": ["FIELD_AND"], "postprocess": id},
    {"name": "FIELD_AND$string$1", "symbols": [{"literal":"A"}, {"literal":"N"}, {"literal":"D"}], "postprocess": (d) => d.join('')},
    {"name": "FIELD_AND", "symbols": ["FIELD_AND", "_", "FIELD_AND$string$1", "_", "FIELD_ATOM"], "postprocess": d => ({ op: "AND", left: d[0], right: d[4] })},
    {"name": "FIELD_AND", "symbols": ["FIELD_ATOM"], "postprocess": id},
    {"name": "FIELD_ATOM", "symbols": ["F"], "postprocess": id},
    {"name": "FIELD_ATOM$string$1", "symbols": [{"literal":"t"}, {"literal":"r"}, {"literal":"u"}, {"literal":"e"}], "postprocess": (d) => d.join('')},
    {"name": "FIELD_ATOM", "symbols": ["FIELD_ATOM$string$1"], "postprocess": () => true},
    {"name": "FIELD_ATOM", "symbols": [{"literal":"("}, "_", "FIELD", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "F$string$1", "symbols": [{"literal":"f"}, {"literal":"u"}, {"literal":"n"}, {"literal":"c"}, {"literal":"t"}, {"literal":"i"}, {"literal":"o"}, {"literal":"n"}], "postprocess": (d) => d.join('')},
    {"name": "F", "symbols": ["F$string$1", "_", "OP", "_", "VAL"], "postprocess": d => ({ field: "function", op: d[2], val: d[4] })},
    {"name": "F$string$2", "symbols": [{"literal":"c"}, {"literal":"o"}, {"literal":"n"}, {"literal":"t"}, {"literal":"r"}, {"literal":"a"}, {"literal":"c"}, {"literal":"t"}], "postprocess": (d) => d.join('')},
    {"name": "F", "symbols": ["F$string$2", "_", "OP", "_", "VAL"], "postprocess": d => ({ field: "contract", op: d[2], val: d[4] })},
    {"name": "F$string$3", "symbols": [{"literal":"b"}, {"literal":"l"}, {"literal":"o"}, {"literal":"c"}, {"literal":"k"}], "postprocess": (d) => d.join('')},
    {"name": "F", "symbols": ["F$string$3", "_", "COMP", "_", "int"], "postprocess": d => ({ field: "block", op: d[2], val: d[4] })},
    {"name": "F$string$4", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"n"}, {"literal":"d"}, {"literal":"e"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "F", "symbols": ["F$string$4", "_", "OP", "_", "VAL"], "postprocess": d => ({ field: "sender", op: d[2], val: d[4] })},
    {"name": "F$string$5", "symbols": [{"literal":"t"}, {"literal":"i"}, {"literal":"m"}, {"literal":"e"}, {"literal":"s"}, {"literal":"t"}, {"literal":"a"}, {"literal":"m"}, {"literal":"p"}], "postprocess": (d) => d.join('')},
    {"name": "F", "symbols": ["F$string$5", "_", "COMP", "_", "VAL"], "postprocess": d => ({ field: "timestamp", op: d[2], val: d[4] })},
    {"name": "F$string$6", "symbols": [{"literal":"g"}, {"literal":"a"}, {"literal":"s"}, {"literal":"L"}, {"literal":"i"}, {"literal":"m"}, {"literal":"i"}, {"literal":"t"}], "postprocess": (d) => d.join('')},
    {"name": "F", "symbols": ["F$string$6", "_", "COMP", "_", "int"], "postprocess": d => ({ field: "gasLimit", op: d[2], val: d[4] })},
    {"name": "F$string$7", "symbols": [{"literal":"g"}, {"literal":"a"}, {"literal":"s"}, {"literal":"U"}, {"literal":"s"}, {"literal":"e"}, {"literal":"d"}], "postprocess": (d) => d.join('')},
    {"name": "F", "symbols": ["F$string$7", "_", "COMP", "_", "int"], "postprocess": d => ({ field: "gasUsed", op: d[2], val: d[4] })},
    {"name": "F$string$8", "symbols": [{"literal":"v"}, {"literal":"a"}, {"literal":"l"}, {"literal":"u"}, {"literal":"e"}], "postprocess": (d) => d.join('')},
    {"name": "F", "symbols": ["F$string$8", "_", "COMP", "_", "int"], "postprocess": d => ({ field: "value", op: d[2], val: d[4] })},
    {"name": "ATTR$string$1", "symbols": [{"literal":"O"}, {"literal":"R"}], "postprocess": (d) => d.join('')},
    {"name": "ATTR", "symbols": ["ATTR", "_", "ATTR$string$1", "_", "ATTR_AND"], "postprocess": d => ({ op: "OR", left: d[0], right: d[4] })},
    {"name": "ATTR", "symbols": ["ATTR_AND"], "postprocess": id},
    {"name": "ATTR_AND$string$1", "symbols": [{"literal":"A"}, {"literal":"N"}, {"literal":"D"}], "postprocess": (d) => d.join('')},
    {"name": "ATTR_AND", "symbols": ["ATTR_AND", "_", "ATTR_AND$string$1", "_", "ATTR_ATOM"], "postprocess": d => ({ op: "AND", left: d[0], right: d[4] })},
    {"name": "ATTR_AND", "symbols": ["ATTR_ATOM"], "postprocess": id},
    {"name": "ATTR_ATOM", "symbols": ["A", {"literal":"("}, "_", "COND", "_", {"literal":")"}], "postprocess": d => ({ type: "attr", name: d[0], cond: d[3] })},
    {"name": "ATTR_ATOM$string$1", "symbols": [{"literal":"t"}, {"literal":"r"}, {"literal":"u"}, {"literal":"e"}], "postprocess": (d) => d.join('')},
    {"name": "ATTR_ATOM", "symbols": ["ATTR_ATOM$string$1"], "postprocess": () => true},
    {"name": "ATTR_ATOM", "symbols": [{"literal":"("}, "_", "ATTR", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "A$string$1", "symbols": [{"literal":"s"}, {"literal":"v"}], "postprocess": (d) => d.join('')},
    {"name": "A", "symbols": ["A$string$1"]},
    {"name": "A$string$2", "symbols": [{"literal":"i"}, {"literal":"n"}, {"literal":"p"}, {"literal":"u"}, {"literal":"t"}], "postprocess": (d) => d.join('')},
    {"name": "A", "symbols": ["A$string$2"]},
    {"name": "A$string$3", "symbols": [{"literal":"e"}, {"literal":"v"}, {"literal":"e"}, {"literal":"n"}, {"literal":"t"}], "postprocess": (d) => d.join('')},
    {"name": "A", "symbols": ["A$string$3"], "postprocess": id},
    {"name": "COND$string$1", "symbols": [{"literal":"O"}, {"literal":"R"}], "postprocess": (d) => d.join('')},
    {"name": "COND", "symbols": ["COND", "_", "COND$string$1", "_", "COND_AND"], "postprocess": d => ({ op: "OR", left: d[0], right: d[4] })},
    {"name": "COND", "symbols": ["COND_AND"], "postprocess": id},
    {"name": "COND_AND$string$1", "symbols": [{"literal":"A"}, {"literal":"N"}, {"literal":"D"}], "postprocess": (d) => d.join('')},
    {"name": "COND_AND", "symbols": ["COND_AND", "_", "COND_AND$string$1", "_", "COND_ATOM"], "postprocess": d => ({ op: "AND", left: d[0], right: d[4] })},
    {"name": "COND_AND", "symbols": ["COND_ATOM"], "postprocess": id},
    {"name": "COND_ATOM", "symbols": ["word", "_", "COMP", "_", "VAL"], "postprocess": d => ({ left: d[0], op: d[2], right: d[4] })},
    {"name": "COND_ATOM", "symbols": ["word"], "postprocess": id},
    {"name": "COND_ATOM", "symbols": [{"literal":"!"}, "word"], "postprocess": d => ({ op: "NOT", val: d[1] })},
    {"name": "COND_ATOM$string$1", "symbols": [{"literal":"t"}, {"literal":"r"}, {"literal":"u"}, {"literal":"e"}], "postprocess": (d) => d.join('')},
    {"name": "COND_ATOM", "symbols": ["COND_ATOM$string$1"], "postprocess": () => true},
    {"name": "COND_ATOM", "symbols": [{"literal":"("}, "_", "COND", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "CALL$string$1", "symbols": [{"literal":"O"}, {"literal":"R"}], "postprocess": (d) => d.join('')},
    {"name": "CALL", "symbols": ["CALL", "_", "CALL$string$1", "_", "CALL_AND"], "postprocess": d => ({ op: "OR", left: d[0], right: d[4] })},
    {"name": "CALL", "symbols": ["CALL_AND"], "postprocess": id},
    {"name": "CALL_AND$string$1", "symbols": [{"literal":"A"}, {"literal":"N"}, {"literal":"D"}], "postprocess": (d) => d.join('')},
    {"name": "CALL_AND", "symbols": ["CALL_AND", "_", "CALL_AND$string$1", "_", "CALL_ATOM"], "postprocess": d => ({ op: "AND", left: d[0], right: d[4] })},
    {"name": "CALL_AND", "symbols": ["CALL_ATOM"], "postprocess": id},
    {"name": "CALL_ATOM", "symbols": ["word", {"literal":"("}, "_", "OPT_CALLFIELD", "OPT_ATTR", "OPT_CALL", {"literal":")"}], "postprocess":  
        d => ({ 
            type: "internal_call", 
            name: d[0],      
            fields: d[3], 
            attr: d[4], 
            inner: d[5] 
        }) 
        },
    {"name": "CALL_ATOM", "symbols": [{"literal":"("}, "_", "CALL", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "CALLFIELD$string$1", "symbols": [{"literal":"O"}, {"literal":"R"}], "postprocess": (d) => d.join('')},
    {"name": "CALLFIELD", "symbols": ["CALLFIELD", "_", "CALLFIELD$string$1", "_", "CALLFIELD_AND"], "postprocess": d => ({ op: "OR", left: d[0], right: d[4] })},
    {"name": "CALLFIELD", "symbols": ["CALLFIELD_AND"], "postprocess": id},
    {"name": "CALLFIELD_AND$string$1", "symbols": [{"literal":"A"}, {"literal":"N"}, {"literal":"D"}], "postprocess": (d) => d.join('')},
    {"name": "CALLFIELD_AND", "symbols": ["CALLFIELD_AND", "_", "CALLFIELD_AND$string$1", "_", "CALLFIELD_ATOM"], "postprocess": d => ({ op: "AND", left: d[0], right: d[4] })},
    {"name": "CALLFIELD_AND", "symbols": ["CALLFIELD_ATOM"], "postprocess": id},
    {"name": "CALLFIELD_ATOM", "symbols": ["CALLF"], "postprocess": id},
    {"name": "CALLFIELD_ATOM$string$1", "symbols": [{"literal":"t"}, {"literal":"r"}, {"literal":"u"}, {"literal":"e"}], "postprocess": (d) => d.join('')},
    {"name": "CALLFIELD_ATOM", "symbols": ["CALLFIELD_ATOM$string$1"], "postprocess": () => true},
    {"name": "CALLFIELD_ATOM", "symbols": [{"literal":"("}, "_", "CALLFIELD", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "CALLF$string$1", "symbols": [{"literal":"t"}, {"literal":"y"}, {"literal":"p"}, {"literal":"e"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$1", "_", "OP", "_", "VAL"], "postprocess": d => ({ field: "type", op: d[2], val: d[4] })},
    {"name": "CALLF$string$2", "symbols": [{"literal":"f"}, {"literal":"u"}, {"literal":"n"}, {"literal":"c"}, {"literal":"t"}, {"literal":"i"}, {"literal":"o"}, {"literal":"n"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$2", "_", "OP", "_", "VAL"], "postprocess": d => ({ field: "function", op: d[2], val: d[4] })},
    {"name": "CALLF$string$3", "symbols": [{"literal":"f"}, {"literal":"r"}, {"literal":"o"}, {"literal":"m"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$3", "_", "OP", "_", "VAL"], "postprocess": d => ({ field: "from", op: d[2], val: d[4] })},
    {"name": "CALLF$string$4", "symbols": [{"literal":"t"}, {"literal":"o"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$4", "_", "OP", "_", "VAL"], "postprocess": d => ({ field: "to", op: d[2], val: d[4] })},
    {"name": "CALLF$string$5", "symbols": [{"literal":"g"}, {"literal":"a"}, {"literal":"s"}, {"literal":"L"}, {"literal":"i"}, {"literal":"m"}, {"literal":"i"}, {"literal":"t"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$5", "_", "COMP", "_", "int"], "postprocess": d => ({ field: "gasLimit", op: d[2], val: d[4] })},
    {"name": "CALLF$string$6", "symbols": [{"literal":"g"}, {"literal":"a"}, {"literal":"s"}, {"literal":"U"}, {"literal":"s"}, {"literal":"e"}, {"literal":"d"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$6", "_", "COMP", "_", "int"], "postprocess": d => ({ field: "gasUsed", op: d[2], val: d[4] })},
    {"name": "CALLF$string$7", "symbols": [{"literal":"v"}, {"literal":"a"}, {"literal":"l"}, {"literal":"u"}, {"literal":"e"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$7", "_", "COMP", "_", "int"], "postprocess": d => ({ field: "value", op: d[2], val: d[4] })},
    {"name": "CALLF$string$8", "symbols": [{"literal":"o"}, {"literal":"u"}, {"literal":"t"}, {"literal":"p"}, {"literal":"u"}, {"literal":"t"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$8", "_", "OP", "_", "VAL"], "postprocess": d => ({ field: "output", op: d[2], val: d[4] })},
    {"name": "CALLF$string$9", "symbols": [{"literal":"d"}, {"literal":"e"}, {"literal":"p"}, {"literal":"t"}, {"literal":"h"}], "postprocess": (d) => d.join('')},
    {"name": "CALLF", "symbols": ["CALLF$string$9", "_", "COMP", "_", "int"], "postprocess": d => ({ field: "depth", op: d[2], val: d[4] })},
    {"name": "CFu$string$1", "symbols": [{"literal":"o"}, {"literal":"c"}, {"literal":"c"}], "postprocess": (d) => d.join('')},
    {"name": "CFu", "symbols": ["CFu$string$1"]},
    {"name": "CFu$string$2", "symbols": [{"literal":"n"}, {"literal":"o"}, {"literal":"c"}, {"literal":"c"}], "postprocess": (d) => d.join('')},
    {"name": "CFu", "symbols": ["CFu$string$2"]},
    {"name": "CFu$string$3", "symbols": [{"literal":"i"}, {"literal":"n"}, {"literal":"i"}, {"literal":"t"}], "postprocess": (d) => d.join('')},
    {"name": "CFu", "symbols": ["CFu$string$3"]},
    {"name": "CFu$string$4", "symbols": [{"literal":"e"}, {"literal":"n"}, {"literal":"d"}], "postprocess": (d) => d.join('')},
    {"name": "CFu", "symbols": ["CFu$string$4"], "postprocess": id},
    {"name": "CFb$string$1", "symbols": [{"literal":"e"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$1"]},
    {"name": "CFb", "symbols": [{"literal":"r"}]},
    {"name": "CFb$string$2", "symbols": [{"literal":"e"}, {"literal":"d"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$2"]},
    {"name": "CFb$string$3", "symbols": [{"literal":"d"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$3"]},
    {"name": "CFb$string$4", "symbols": [{"literal":"e"}, {"literal":"n"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$4"]},
    {"name": "CFb$string$5", "symbols": [{"literal":"n"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$5"]},
    {"name": "CFb$string$6", "symbols": [{"literal":"e"}, {"literal":"n"}, {"literal":"d"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$6"]},
    {"name": "CFb$string$7", "symbols": [{"literal":"n"}, {"literal":"d"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$7"]},
    {"name": "CFb$string$8", "symbols": [{"literal":"w"}, {"literal":"p"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$8"]},
    {"name": "CFb$string$9", "symbols": [{"literal":"s"}, {"literal":"p"}, {"literal":"r"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$9"]},
    {"name": "CFb", "symbols": [{"literal":"c"}]},
    {"name": "CFb$string$10", "symbols": [{"literal":"e"}, {"literal":"x"}], "postprocess": (d) => d.join('')},
    {"name": "CFb", "symbols": ["CFb$string$10"], "postprocess": id},
    {"name": "TI$string$1", "symbols": [{"literal":"s"}, {"literal":"e"}, {"literal":"c"}, {"literal":"o"}, {"literal":"n"}, {"literal":"d"}, {"literal":"s"}], "postprocess": (d) => d.join('')},
    {"name": "TI", "symbols": ["COMP", "_", "int", "_", "TI$string$1"], "postprocess": d => ({ op: d[0], val: d[2], unit: "seconds" })},
    {"name": "TI$string$2", "symbols": [{"literal":"b"}, {"literal":"l"}, {"literal":"o"}, {"literal":"c"}, {"literal":"k"}, {"literal":"s"}], "postprocess": (d) => d.join('')},
    {"name": "TI", "symbols": ["COMP", "_", "int", "_", "TI$string$2"], "postprocess": d => ({ op: d[0], val: d[2], unit: "blocks" })},
    {"name": "OP$string$1", "symbols": [{"literal":"="}, {"literal":"="}], "postprocess": (d) => d.join('')},
    {"name": "OP", "symbols": ["OP$string$1"]},
    {"name": "OP$string$2", "symbols": [{"literal":"!"}, {"literal":"="}], "postprocess": (d) => d.join('')},
    {"name": "OP", "symbols": ["OP$string$2"], "postprocess": id},
    {"name": "COMP", "symbols": ["OP"]},
    {"name": "COMP", "symbols": [{"literal":"<"}]},
    {"name": "COMP", "symbols": [{"literal":">"}]},
    {"name": "COMP$string$1", "symbols": [{"literal":"<"}, {"literal":"="}], "postprocess": (d) => d.join('')},
    {"name": "COMP", "symbols": ["COMP$string$1"]},
    {"name": "COMP$string$2", "symbols": [{"literal":">"}, {"literal":"="}], "postprocess": (d) => d.join('')},
    {"name": "COMP", "symbols": ["COMP$string$2"], "postprocess": id},
    {"name": "VAL", "symbols": ["int"]},
    {"name": "VAL", "symbols": ["word"]},
    {"name": "VAL", "symbols": ["dotted_word"], "postprocess": id},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function() {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "int$ebnf$1", "symbols": ["int$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "int$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "int$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$2", "symbols": ["int$ebnf$2", /[0-9]/], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "int", "symbols": ["int$ebnf$1", "int$ebnf$2"], "postprocess": 
        function(d) {
            if (d[0]) {
                return parseInt(d[0][0]+d[1].join(""));
            } else {
                return parseInt(d[1].join(""));
            }
        }
        },
    {"name": "word$ebnf$1", "symbols": []},
    {"name": "word$ebnf$1", "symbols": ["word$ebnf$1", /[a-zA-Z0-9_\-:+]/], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "word", "symbols": [/[a-zA-Z0-9_]/, "word$ebnf$1"], "postprocess": (d) => d[0] + d[1].join('')},
    {"name": "dotted_word$ebnf$1", "symbols": []},
    {"name": "dotted_word$ebnf$1$subexpression$1", "symbols": [{"literal":"."}, "word"]},
    {"name": "dotted_word$ebnf$1", "symbols": ["dotted_word$ebnf$1", "dotted_word$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "dotted_word", "symbols": ["word", "dotted_word$ebnf$1"], "postprocess": (d) => d.join('')}
  ],
  ParserStart: "RULE",
};

export default grammar;
