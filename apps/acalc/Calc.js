/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if ( ! 'log10' in Math ) Math.log10 = function(a) { return Math.log(a) / Math.LN10; };

function gamma(z) {
  return Math.sqrt(2 * Math.PI / z) * Math.pow((1 / Math.E) * (z + 1 / (12 * z - 1 / (10 * z))), z);
}

function trigFn(f) {
  return function(a) {
    return f(this.degreesMode ? a * Math.PI / 180 : a);
  };
}

function invTrigFn(f) {
  return function(a) {
    return this.degreesMode ? f(a) / Math.PI * 180 : f(a);
  };
}

function createTranslatedAction(action, opt_longName) {
  if ( opt_longName ) action.translationHint =
      'short form for mathematical function: "' + opt_longName + '"';
  return Action.create(action);
}

// TODO(kgr): model binaryOp and unaryOp as new types of Actions
// this will allow the model to be serialized and edited in a FOAM IDE
/** Make a Binary Action. **/
function binaryOp(name, keys, f, sym, opt_longName, opt_speechLabel) {
  var longName = opt_longName || name;
  var speechLabel = opt_speechLabel || sym;
  f.binary = true;
  f.speechLabel = speechLabel;
  var action = createTranslatedAction({
    name: name,
    label: sym,
    translationHint: 'binary operator: ' + longName,
    speechLabel: speechLabel,
    keyboardShortcuts: keys,
    action: function() {
      if ( this.a2 == '' ) {
        // the previous operation should be replaced, since we can't
        // finish this one without a second arg. The user probably hit one
        // binay op, followed by another.
        this.replace(f);
      } else {
        if ( this.op != DEFAULT_OP ) this.equals();
        this.push('', f);
        this.editable = true;
      }
    }
  }, opt_longName);
  f.toString = function() { return '<span aria-label="' + action.speechLabel + '">' + action.label + '</span>'; };
  return action;
}

function unaryOp(name, keys, f, opt_sym, opt_longName, opt_speechLabel) {
  var sym = opt_sym || name;
  var longName = opt_longName || name;
  var speechLabel = opt_speechLabel || sym;
  f.unary = true;
  f.speechLabel = speechLabel;
  var action = createTranslatedAction({
    name: name,
    label: sym,
    translationHint: 'short form for mathematical function: "' + longName + '"',
    speechLabel: speechLabel,
    keyboardShortcuts: keys,
    action: function() {
      this.op = f;
      this.push(f.call(this, this.a2));
      this.editable = false;
    }
  }, opt_longName);
  f.toString = function() { return action.label; };
  return action;
}

/** Make a 0-9 Number Action. **/
function num(n) {
  return {
    name: n.toString(),
    keyboardShortcuts: [48+n /* 0 */ , 96+n /* keypad-0 */],
    action: function() {
      if ( ! this.editable ) {
        this.push(n);
        this.editable = true;
      } else {
        if ( this.a2 == '0' && ! n ) return;
        if ( this.a2.length >= 18 ) return;
        this.a2 = this.a2 == '0' ? n : this.a2.toString() + n;
      }
    }
  };
}


var DEFAULT_OP = function(a1, a2) { return a2; };
DEFAULT_OP.toString = function() { return ''; };

CLASS({
  name: 'Calc',
  translationHint: 'Calculator',

  requires: [
    'foam.apps.calc.CalcView',
    'foam.apps.calc.History',
    'foam.apps.calc.NumberFormatter',
    'foam.graphics.ActionButtonCView',
    'foam.graphics.CViewView',
    'foam.input.touch.GestureManager',
    'foam.input.touch.TouchManager',
    'foam.ui.animated.Label',
    'foam.ui.md.Flare'
  ],

  exports: [
    'gestureManager',
    'touchManager'
  ],

  properties: [
    { name: 'degreesMode', defaultValue: false },
    { name: 'memory', defaultValue: 0 },
    { name: 'a1', defaultValue: 0 },
    { name: 'a2', defaultValue: '' },
    { name: 'editable', defaultValue: true },
    {
      name: 'op',
      defaultValue: DEFAULT_OP
    },
    {
      model_: 'ArrayProperty',
      name: 'history',
      view: 'DAOListView',
      factory: function() { return [].sink; }
    },
    {
      model_: 'StringProperty',
      name: 'row1',
      view: 'foam.ui.animated.Label'
    },
    {
      name: 'touchManager',
      factory: function() {
        // TODO(braden): HACK This should be just exporting the property, but
        // the context is not properly passed into views created using <foam>
        // tags right now. Clean up this and gestureManager below.
        var tm = this.TouchManager.create();
        window.X.touchManager = tm;
        return tm;
      }
    },
    {
      name: 'gestureManager',
      factory: function() {
        var gm = this.GestureManager.create();
        window.X.gestureManager = gm;
        return gm;
      }
    }
  ],

  methods: {
    factorial: function(n) {
      if ( n > 170 ) {
        this.error();
        return 1/0;
      }
      n = parseFloat(n);
      if ( ! Number.isInteger(n) ) return gamma(n+1);
      var r = 1;
      while ( n > 0 ) r *= n--;
      return r;
    },
    permutation: function(n, r) { return this.factorial(n) / this.factorial(n-r); },
    combination: function(n, r) { return this.permutation(n, r) / this.factorial(r); },
    error: function() {
      if ( $$('calc-display')[0] ) setTimeout(this.Flare.create({
        element: $$('calc-display')[0],
        color: '#f44336' /* red */
      }).fire, 100);
      this.history.put(this.History.create(this));
      this.a1 = 0;
      this.a2 = '';
      this.op = DEFAULT_OP;
      this.row1 = '';
      this.editable = true;
    },
    init: function() {
      this.SUPER();

      Events.dynamic(function() { this.op; this.a2; }.bind(this), EventService.framed(function() {
        if ( Number.isNaN(this.a2) ) this.error();
        var a2 = this.NumberFormatter.formatNumber(this.a2);
        this.row1 = this.op + ( a2 !== '' ? '&nbsp;' + a2 : '' );
      }.bind(this)));
    },
    push: function(a2, opt_op) {
      if ( a2 != this.a2 ||
           ( opt_op || DEFAULT_OP ) != this.op )
        this.row1 = '';
      this.history.put(this.History.create(this));
      this.a1 = this.a2;
      this.op = opt_op || DEFAULT_OP;
      this.a2 = a2;
    },
    replace: function(op) {
      this.op = op || DEFAULT_OP;
    }
  },

  actions: [
    num(1), num(2), num(3), num(4), num(5), num(6), num(7), num(8), num(9), num(0),
    binaryOp('div',   [111, 191],         function(a1, a2) { return a1 / a2; }, '\u00F7', 'divide', 'divide'),
    binaryOp('mult',  [106, 'shift-56'],  function(a1, a2) { return a1 * a2; }, '\u00D7', 'multiply', 'multiply'),
    binaryOp('plus',  [107, 'shift-187'], function(a1, a2) { return a1 + a2; }, '+'),
    binaryOp('minus', [109, 189],         function(a1, a2) { return a1 - a2; }, '–', 'minus', 'minus'),
    {
      name: 'ac',
      label: 'AC',
      speechLabel: 'all clear',
      translationHint: 'all clear (calculator button label)',
      // help: 'All Clear.',

      keyboardShortcuts: [ 'a', 'c' ],
      action: function() {
        this.row1 = '';
        this.a1 = '0';
        this.a2 = '';
        this.editable = true;
        this.op = DEFAULT_OP;
        this.history = [].sink;
        if ( $$('calc-display')[0] ) {
          var now = Date.now();
          if ( this.lastFlare_ && now-this.lastFlare_ < 1000 ) return;
          this.lastFlare_ = now;
          this.Flare.create({
            element: $$('calc-display')[0],
            color: '#2196F3' /* blue */
          }).fire();
          this.X.window.getSelection().removeAllRanges();
        }
      }
    },
    {
      name: 'sign',
      label: '+/-',
      speechLabel: 'negate',
      keyboardShortcuts: [ 'n' ],
      action: function() { this.a2 = - this.a2; }
    },
    {
      name: 'point',
      label: '.',
      speechLabel: 'point',
      keyboardShortcuts: [ 110, 190 ],
      action: function() {
        if ( ! this.editable ) {
          this.push('0.');
          this.editable = true;
        } else if ( this.a2.toString().indexOf('.') == -1 ) {
          this.a2 = (this.a2 ? this.a2 : '0') + '.';
          this.editable = true;
        }
      }
    },
    {
      name: 'equals',
      label: '=',
      speechLabel: 'equals',
      keyboardShortcuts: [ 187 /* '=' */, 13 /* <enter> */ ],
      action: function() {
        if ( typeof(this.a2) === 'string' && this.a2 == '' ) return; // do nothing if the user hits '=' prematurely
        if ( this.op == DEFAULT_OP ) {
          var last = this.history[this.history.length-1];
          if ( ! last ) return;
          if ( last.op.binary ) {
            this.push(this.a2);
            this.a2 = last.a2;
          } else {
            this.a1 = this.a2;
          }
          this.op = last.op;
        }
        this.push(this.op(parseFloat(this.a1), parseFloat(this.a2)));
        this.editable = false;
      }
    },
    {
      name: 'backspace',
      label: '⌫',
      speechLabel: 'backspace',
      translationHint: 'delete one input character',
      keyboardShortcuts: [ 8 /* backspace */ ],
      action: function() {
        // This block will make backspace act like all-clear if the user has done a ctrl-A
        // to select all of the text.
        var selection = this.X.window.getSelection().toString();
        if ( selection && selection.split('\n').length == this.history.length + 1 ) {
          this.ac();
          return;
        }

        if ( ! this.editable ) return;

        if ( this.a2.toString().length ) {
          this.a2 = this.a2.toString().substring(0, this.a2.length-1);
        } else {
          this.op = DEFAULT_OP;
        }
      }
    },
    {
      name: 'pi',
      label: 'π',
      keyboardShortcuts: ['p'],
      action: function() { this.a2 = Math.PI; }
    },
    {
      name: 'e',
      label: 'e',
      keyboardShortcuts: ['e'],
      action: function() { this.a2 = Math.E; }
    },
    {
      name: 'percent',
      label: '%',
      speechLabel: 'percent',
      keyboardShortcuts: [ 'shift-53' /* % */ ],
      action: function() { this.a2 /= 100.0; }
    },

    unaryOp('inv',    ['i'], function(a) { return 1.0/a; }, '1/x', undefined, 'inverse'),
    unaryOp('sqroot', [], Math.sqrt, '√', 'square root'),
    unaryOp('square', ['shift-50' /* @ */], function(a) { return a*a; }, 'x²', 'x squared', 'x squared'),
    unaryOp('ln',     [], Math.log, 'ln', 'natural logarithm', 'natural logarithm'),
    unaryOp('exp',    [], Math.exp, 'eⁿ', undefined, 'e to the power of n'),
    unaryOp('log',    [], function(a) { return Math.log(a) / Math.LN10; }, 'log', 'logarithm', 'log base 10'),
    binaryOp('root',  [], function(a1, a2) { return Math.pow(a2, 1/a1); }, '\u207F \u221AY', undefined, 'the enth root of y'),
    binaryOp('pow',   ['^'], Math.pow, 'yⁿ', undefined, 'y to the power of n'),

    unaryOp('sin',    [], trigFn(Math.sin), 'sin', 'sine',    'sine'),
    unaryOp('cos',    [], trigFn(Math.cos), 'cos', 'cosine',  'cosine'),
    unaryOp('tan',    [], trigFn(Math.tan), 'tan', 'tangent', 'tangent'),

    {
      name: 'deg',
      speechLabel: 'switch to degrees',
      keyboardShortcuts: [],
      translationHint: 'short form for "degrees" calculator mode',
      action: function() { this.degreesMode = true; }
    },
    {
      name: 'rad',
      speechLabel: 'switch to radians',
      keyboardShortcuts: [],
      translationHint: 'short form for "radians" calculator mode',
      action: function() { this.degreesMode = false; }
    },

    unaryOp('asin',   [], invTrigFn(Math.asin), 'asin', 'inverse-sine',    'arcsine'),
    unaryOp('acos',   [], invTrigFn(Math.acos), 'acos', 'inverse-cosine',  'arccosine'),
    unaryOp('atan',   [], invTrigFn(Math.atan), 'atan', 'inverse-tangent', 'arctangent'),

    unaryOp('fact',   [ 'shift-49' /* ! */], function(n) { return this.factorial(n); }, 'x!', 'factorial', 'factorial'),
    binaryOp('mod',   [],         function(a1, a2) { return a1 % a2; }, 'mod', 'modulo', 'modulo'),
    binaryOp('p',     [],         function(n,r) { return this.permutation(n,r); }, 'nPr', 'permutations (n permute r)', 'permutation'),
    binaryOp('c',     [],         function(n,r) { return this.combination(n,r); }, 'nCr', 'combinations (n combine r))', 'combination'),
    unaryOp('round',  [], Math.round, 'rnd', 'round', 'round'),
    {
      name: 'rand',
      label: 'rand',
      speechLabel: 'random',
      keyboardShortcuts: [],
      action: function() { this.a2 = Math.random(); }
    },
    unaryOp('store',   [], function(n) { this.memory = n; return n; }, 'a=', 'store in memory', 'store in memory'),
    {
      name: 'fetch',
      label: 'a',
      speechLabel: 'fetch from memory',
      keyboardShortcuts: [],
      action: function() { this.a2 = this.memory; }
    },
  ]
});
