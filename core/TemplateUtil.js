/**
 * @license
 * Copyright 2013 Google Inc. All Rights Reserved.
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

/**
 * Simple template system modelled after JSP's.
 *
 * Syntax:
 *    <% code %>: code inserted into template, but nothing implicitly output
 *    <%= comma-separated-values %>: all values are appended to template output
 *    <%# expression %>: dynamic (auto-updating) expression is output
 *    \<new-line>: ignored
 *    %%value(<whitespace>|<): output a single value to the template output
 *    $$feature(<whitespace>|<): output the View or Action for the current Value
 */

MODEL({
  name: 'TemplateParser',
  extendsModel: 'grammar',

  methods: {
    START: sym('markup'),

    markup: repeat0(alt(
      sym('comment'),
      sym('foamTag'),
      sym('create child'),
      sym('simple value'),
      sym('live value tag'),
      sym('raw values tag'),
      sym('values tag'),
      sym('code tag'),
      sym('ignored newline'),
      sym('newline'),
      sym('single quote'),
      sym('text')
    )),

    'comment': seq1(1, '<!--', repeat0(not('-->', anyChar)), '-->'),

    'foamTag': sym('foamTag_'),
    'foamTag_': function() { }, // placeholder until gets filled in after HTMLParser is built

    'create child': seq(
      '$$',
      repeat(notChars(' $\n<{')),
      optional(JSONParser.export('objAsString'))),

    'simple value': seq('%%', repeat(notChars(' -"\n<'))),

    'live value tag': seq('<%#', repeat(not('%>', anyChar)), '%>'),

    'raw values tag': alt(
      seq('<%=', repeat(not('%>', anyChar)), '%>'),
      seq('{{{', repeat(not('}}}', anyChar)), '}}}')
    ),

    'values tag': seq('{{', repeat(not('}}', anyChar)), '}}'),

    'code tag': seq('<%', repeat(not('%>', anyChar)), '%>'),
    'ignored newline': literal('\\\n'),
    newline: literal('\n'),
    'single quote': literal("'"),
    text: anyChar
  }
});


var TemplateOutput = {
  /**
   * obj - Parent object.  If objects are output and have an initHTML() method, then they
   * are added to the parent by calling obj.addChild().
   **/
  // TODO(kgr): redesign, I think this is actually broken.  If we call appendHTML() of
  // a sub-view then it will be added to the wrong parent.
  create: function(obj) {
    var buf = '';
    var f = function(/* arguments */) {
      for ( var i = 0 ; i < arguments.length ; i++ ) {
        var o = arguments[i];
        if ( typeof o === 'string' ) {
          buf += o;
        } else {
          if ( o && o.toView_ ) o = o.toView_();
          if ( ! ( o === null || o === undefined ) ) {
            if ( o.appendHTML ) {
              o.appendHTML(this);
            } else if ( o.toHTML ) {
              buf += o.toHTML();
            } else {
              buf += o;
            }
            if ( o.initHTML && obj.addChild ) obj.addChild(o);
          }
        }
      }
    };

    f.toString = function() { return buf; };

    return f;
  }
};


// Called from generated template code.
function elementFromString(str) {
  return str.element || ( str.element = HTMLParser.create().parseString(str).children[0] );
}

var ConstantTemplate = function(str) {
  var f = function(opt_out) {
    var out = opt_out ? opt_out : TemplateOutput.create(this);
    out(str);
    return out.toString();
  };

  f.toString = function() {
    return 'function(opt_out) { var out = opt_out ? opt_out : TemplateOutput.create(this);\n  out("' + str.replace(/\n/g, "\\n").replace(/"/g, '\\"') + '");\n  return out.toString(); }';
  }

  return f;
};

var TemplateCompiler = {
  __proto__: TemplateParser,

  out: [],

  simple: true, // True iff the template is just one string literal.

  push: function() { this.simple = false; this.pushSimple.apply(this, arguments); },

  pushSimple: function() { this.out.push.apply(this.out, arguments); },

  header: 'var self = this; var X = this.X; var Y = this.Y; var escapeHTML = XMLUtil.escape;' +
    'var out = opt_out ? opt_out : TemplateOutput.create(this);' +
    "out('",

  footer: "');" +
    "return out.toString();"

}.addActions({
  markup: function (v) {
    var wasSimple = this.simple;
    var ret = wasSimple ? null : this.header + this.out.join('') + this.footer ;
    this.out = [];
    this.simple = true;
    return [wasSimple, ret];
  },

  'create child': function(v) {
    var name = v[1].join('');
    this.push(
      "', self.createTemplateView('", name, "'",
      v[2] ? ', ' + v[2] : '',
      "),\n'");
  },
  foamTag: function(e) {
    // A Feature
    var fName = e.getAttribute('f');
    if ( fName ) {
      this.push("', self.createTemplateView('", fName, "',{}).fromElement(FOAM(");
      this.push(JSONUtil.where(NOT_TRANSIENT).stringify(e));
      this.push('))');
    }
    // A Model
    else {
      this.push("', X.foam.ui.FoamTagView.create({element: FOAM(");
      this.push(JSONUtil.where(NOT_TRANSIENT).stringify(e));
      this.push(')}, Y.sub({data: this.data}))'); // TODO(kgr): this seems a litt
    }

    this.push(",\n'");
  },
  'simple value': function(v) { this.push("',\n self.", v[1].join(''), ",\n'"); },
  'raw values tag': function (v) { this.push("',\n", v[1].join(''), ",\n'"); },
  'values tag':     function (v) { this.push("',\nescapeHTML(", v[1].join(''), "),\n'"); },
  'live value tag': function (v) { this.push("',\nself.dynamicTag('span', function() { return ", v[1].join(''), "; }.bind(this)),\n'"); },
  'code tag': function (v) { this.push("');\n", v[1].join(''), ";out('"); },
  'single quote': function () { this.pushSimple("\\'"); },
  newline: function () { this.pushSimple('\\n'); },
  text: function(v) { this.pushSimple(v); }
});


MODEL({
  name: 'TemplateUtil',

  methods: {
    /** Create a method which only compiles the template when first used. **/
    lazyCompile: function(t) {
      var delegate;

      var f = function() {
        if ( ! delegate ) {
          if ( t.code )
            delegate = t.code;
          else if ( ! t.template )
            throw 'Must arequire() template model before use for ' + this.name_ + '.' + t.name;
          else
            delegate = TemplateUtil.compile(Template.isInstance(t) ? t : Template.create(t));
        }

        return delegate.apply(this, arguments);
      };

      f.toString = function() { return delegate ? delegate.toString() : t; };

      return f;
    },

    compile_: function(t, code) {
      var args = ['opt_out'];
      for ( var i = 0 ; i < t.args.length ; i++ ) {
        args.push(t.args[i].name);
      }
      return eval('(function(' + args.join(',') + '){' + code + '})');
    },
    compile: function(t) {
      if ( t.code ) return t.code;

      // console.time('parse-template-' + t.name);
      var code = TemplateCompiler.parseString(t.template);
      // console.timeEnd('parse-template-' + t.name);

      // Simple case, just a string literal
      if ( code[0] ) return ConstantTemplate(t.template);

      // Need to compile an actual method
      try {
        return this.compile_(t, code[1]);
      } catch (err) {
        console.log('Template Error: ', err);
        console.log(code);
        return function() {};
      }
    },

    /**
     * Combinator which takes a template which expects an output parameter and
     * converts it into a function which returns a string.
     */
    stringifyTemplate: function (template) {
      return function() {
        var buf = [];

        this.output(buf.push.bind(buf), obj);

        return buf.join('');
      };
    },

    expandTemplate: function(self, t, opt_X) {
      /*
       * If a template is supplied as a function, treat it as a multiline string.
       * Parse function arguments to populate template.args.
       * Load template from file if external.
       * Setup template future.
       */
      var X = opt_X || self.X;

      if ( typeof t === 'function' ) {
        t = X.Template.create({
          name: t.name,
          // ignore first argument, which should be 'opt_out'
          args: t.toString().match(/\((.*?)\)/)[1].split(',').slice(1).map(function(a) {
            return X.Arg.create({name: a.trim()});
          }),
          template: multiline(t)});
      } else if ( typeof t === 'string' ) {
        t = docTemplate = X.Template.create({
          name: 'body',
          template: t
        });
      } else if ( ! t.template && ! t.code ) {
        var future = afuture();
        var path   = self.sourcePath;

        t.futureTemplate = future.get;
        path = path.substring(0, path.lastIndexOf('/')+1);
        path += self.name + '_' + t.name + '.ft';

        var xhr = new XMLHttpRequest();
        xhr.open("GET", path);
        xhr.asend(function(data) {
          t.template = data;
          future.set(Template.create(t));
        });
      } else if ( typeof t.template === 'function' ) {
        t.template = multiline(t.template);
      }

      if ( ! t.futureTemplate ) t.futureTemplate = aconstant(t);

      // We haven't FOAMalized the template, and there's no crazy multiline functions.
      // Note that Model and boostrappy models must use this case, as Template is not
      // yet defined at bootstrap time. Use a Template object definition with a bare
      // string template body in those cases.
      if ( ! t.template$ ) {
        t = ( typeof X.Template !== 'undefined' ) ? JSONUtil.mapToObj(X, t, X.Template) : t ;
      }

      return t;
    },

    expandModelTemplates: function(self) {
      var templates = self.templates;
      for ( var i = 0; i < templates.length; i++ ) {
        templates[i] = TemplateUtil.expandTemplate(self, templates[i]);
      }
    }
  }
});


/** Is actually synchronous but is replaced in ChromeApp with an async version. **/
var aeval = function(src) {
  return aconstant(eval('(' + src + ')'));
};

var aevalTemplate = function(t, model) {
  return aseq(
    t.futureTemplate,
    function(ret, t) {
      ret(TemplateUtil.lazyCompile(t));
    });
};
