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

var $documents = [];

if ( window ) $documents.push(window.document);

// TODO: clean this up, hide $WID__ in closure
var $WID__ = 0;
function $addWindow(w) {
   w.window.$WID = $WID__++;
   $documents.push(w.document);
}
function $removeWindow(w) {
  for ( var i = $documents.length - 1 ; i >= 0 ; i-- ) {
    if ( ! $documents[i].defaultView || $documents[i].defaultView === w )
      $documents.splice(i,1);
  }
}

/** Replacement for getElementById **/
// TODO(kgr): remove this is deprecated, use X.$ instead()
var $ = function (id) {
  console.log('Deprecated use of GLOBAL.$.');
  for ( var i = 0 ; i < $documents.length ; i++ ) {
    if ( document.FOAM_OBJECTS && document.FOAM_OBJECTS[id] )
      return document.FOAM_OBJECTS[id];

    var ret = $documents[i].getElementById(id);

    if ( ret ) return ret;
  }
  return undefined;
};
/** Replacement for getElementByClassName **/
// TODO(kgr): remove this is deprecated, use X.$$ instead()
var $$ = function (cls) {
  console.log('Deprecated use of GLOBAL.$$.');
  for ( var i = 0 ; i < $documents.length ; i++ ) {
    var ret = $documents[i].getElementsByClassName(cls);

    if ( ret.length > 0 ) return ret;
  }
  return [];
};


var FOAM = function(map, opt_X, seq) {
   var obj = JSONUtil.mapToObj(opt_X || X, map, undefined, seq);
   return obj;
};

/**
 * Register a lazy factory for the specified name within a
 * specified context.
 * The first time the name is looked up, the factory will be invoked
 * and its value will be stored in the named slot and then returned.
 * Future lookups to the same slot will return the originally created
 * value.
 **/
FOAM.putFactory = function(ctx, name, factory) {
  ctx.__defineGetter__(name, function() {
    console.log('Bouncing Factory: ', name);
    delete ctx[name];
    return ctx[name] = factory();
  });
};


var   USED_MODELS = {};
var UNUSED_MODELS = {};
var NONMODEL_INSTANCES = {}; // for things such as interfaces

FOAM.browse = function(model, opt_dao, opt_X) {
   var Y = opt_X || X.sub(undefined, "FOAM BROWSER");

   if ( typeof model === 'string' ) model = Y[model];

   var dao = opt_dao || Y[model.name + 'DAO'] || Y[model.plural];

   if ( ! dao ) {
      dao = Y.StorageDAO.create({ model: model });
      Y[model.name + 'DAO'] = dao;
   }

   var ctrl = Y.DAOController.create({
     model:     model,
     dao:       dao,
     useSearchView: false
   });

  if ( ! Y.stack ) {
    var w = opt_X ? opt_X.window : window;
    Y.stack = Y.StackView.create();
    var win = Y.foam.ui.layout.Window.create({ window: w, data: Y.stack }, Y);
    document.body.insertAdjacentHTML('beforeend', win.toHTML());
    win.initHTML();
    Y.stack.setTopView(ctrl);
  } else {
    Y.stack.pushView(ctrl);
  }
};


function arequire(modelName, opt_X) {
  var X = opt_X || GLOBAL.X;
  var model = X.lookup(modelName);
  if ( ! model ) {
    if ( ! X.ModelDAO ) {
      if ( modelName !== 'Template' ) console.warn('Unknown Model in arequire: ', modelName);
      return aconstant();
    }

    // check whether we have already hit the ModelDAO to load the model
    if ( ! GLOBAL.X.arequire$ModelLoadsInProgress ) {
      GLOBAL.X.set('arequire$ModelLoadsInProgress', {} );
    } else {
      if ( GLOBAL.X.arequire$ModelLoadsInProgress[modelName] ) {
        return GLOBAL.X.arequire$ModelLoadsInProgress[modelName];
      }
    }

    var future = afuture();
    GLOBAL.X.arequire$ModelLoadsInProgress[modelName] = future.get;

    X.ModelDAO.find(modelName, {
      put: function(m) {
        var m = X.lookup(modelName);
        delete GLOBAL.X.arequire$ModelLoadsInProgress[modelName];
        arequireModel(m, X)(future.set);
      },
      error: function() {
        var args = argsToArray(arguments);
        console.warn.apply(console, ['Could not load model: ', modelName].concat(args));
        delete GLOBAL.X.arequire$ModelLoadsInProgress[modelName];
        future.set(undefined);
      }
    });

    return future.get;
  }

  /** This is so that if the model is arequire'd concurrently the
   *  initialization isn't done more than once.
   **/
  if ( ! model ) { console.log(modelName, 'not found'); return; }

  return arequireModel(model, X);
}


function arequireModel(model, param_X) {
  if ( ! model.required__ ) {
    var args = [];
    var future = afuture();

    model.required__ = future.get;

    var opt_X = param_X || X;

// To debug a dependency cycle, uncomment the CYCLE DEBUG sections below.
// Run your code, and when it hangs examine the unsatisfied models in
// X.arequire$ModelRequiresInProgress

// CYCLE DEBUG
var modelName = model.id.clone();
var dbgX = X;
console.log("areqModel ", modelName, "X param: ", param_X && param_X.$UID, " dbgX: ", dbgX.$UID);
if ( ! dbgX.arequire$ModelRequiresInProgress ) {
  dbgX.set('arequire$ModelRequiresInProgress', {} );
}
if ( ! dbgX.arequire$ModelRequiresInProgress[modelName] ) {
  dbgX.arequire$ModelRequiresInProgress[modelName] = { uid: model.$UID, extendsModel: "", traits: {}, requires: {} };
  future.get(function(m) {
    delete dbgX.arequire$ModelRequiresInProgress[m.id];
  });
}
// CYCLE DEBUG

    if ( model.extendsModel ) args.push(arequire(model.extendsModel, opt_X));

// CYCLE DEBUG
if ( model.extendsModel ) {
  dbgX.arequire$ModelRequiresInProgress[modelName].extendsModel = model.extendsModel;
  arequire(model.extendsModel, opt_X)(function(m) {
    dbgX.arequire$ModelRequiresInProgress[modelName].extendsModel = "";
  });
}
// CYCLE DEBUG

    // TODO(kgr): eventually this should just call the arequire() method on the Model
    var i;
    if ( model.traits ) {
      for ( i = 0; i < model.traits.length; i++ ) {
        args.push(arequire(model.traits[i], opt_X));
// CYCLE DEBUG
var trait = model.traits[i].clone();
dbgX.arequire$ModelRequiresInProgress[modelName].traits[trait] = true;
arequire(trait, opt_X)(function(m) {
  delete dbgX.arequire$ModelRequiresInProgress[modelName].traits[m.id];
});
// CYCLE DEBUG
      }
    }
    if ( model.templates ) for ( i = 0 ; i < model.templates.length ; i++ ) {
      var t = model.templates[i];
      args.push(
        aevalTemplate(model.templates[i], model),
        (function(t) { return function(ret, m) {
          model.getPrototype()[t.name] = m;
          ret();
        };})(t)
      );
    }
    if ( args.length ) args = [aseq.apply(null, args)];

    // Also arequire required Models.
    if ( model.requires ) {
      for ( var i = 0 ; i < model.requires.length ; i++ ) {
        var r = model.requires[i];
        var m = r.split(' as ');
        if ( m[0] == model.id ) {
          console.warn("Model requires itself: " + model.id);
        } else {
          args.push(arequire(m[0], opt_X));
// CYCLE DEBUG
var require = m[0].clone();
dbgX.arequire$ModelRequiresInProgress[modelName].requires[require] = true;
arequire(require, opt_X)(function(m) {
  delete dbgX.arequire$ModelRequiresInProgress[modelName].requires[m.id];
});
// CYCLE DEBUG
        }
      }
    }

    aseq(
        apar.apply(apar, args),
        (opt_X && opt_X.i18nModel && opt_X.i18nModel.bind(this, model, opt_X)) ||
            aconstant(model))(function(m) {
              m.finished__ = true;
              future.set(m);
            });
  } else {
    opt_X && opt_X.i18nModel && opt_X.i18nModel(model, opt_X);
  }

  return model.required__;
}


var FOAM_POWERED = '<a style="text-decoration:none;" href="https://github.com/foam-framework/foam/" target="_blank">\
<font size=+1 face="catull" style="text-shadow:rgba(64,64,64,0.3) 3px 3px 4px;">\
<font color="#3333FF">F</font><font color="#FF0000">O</font><font color="#FFCC00">A</font><font color="#33CC00">M</font>\
<font color="#555555" > POWERED</font></font></a>';

/** Lookup a '.'-separated package path, creating sub-packages as required. **/
function packagePath(X, path) {
  function packagePath_(Y, path, i) {
    if ( i === path.length ) return Y;
    if ( ! Y[path[i]] ) {
      Y[path[i]] = {};
      // console.log('************ Creating sub-path: ', path[i]);
      if ( i == 0 ) GLOBAL[path[i]] = Y[path[i]];
    }
    return packagePath_(Y[path[i]], path, i+1);
  }
  return path ? packagePath_(X, path.split('.'), 0) : GLOBAL;
}


function registerModel(model, opt_name) {
  var root    = model.package ? this : GLOBAL;
  var name    = model.name;
  var package = model.package;

  if ( opt_name ) {
    var a = opt_name.split('.');
    name = a.pop();
    package = a.join('.');
  }

  var path = packagePath(root, package);
  Object.defineProperty(path, name, { value: model, configurable: true });

  // TODO: this is broken
  // update the cache if this model was already FOAM.lookup'd
  if ( root.hasOwnProperty('lookupCache_') ) {
    var cache = root.lookupCache_;
    var modelRegName = (package ? package + '.' : '') + name;
    if ( cache[modelRegName] ) {
      console.log("registerModel: in lookupCache_, replaced model ", modelRegName );
      cache[modelRegName] = model;
    }
  }

  this.onRegisterModel(model);
}


function LOAD_CLASS(m) {
  var _ROOT_X = GLOBAL.X;

  /** Register a factory to register the model when given a context. **/
  if ( ! _ROOT_X.LOAD_CLASS$modelFactories ) _ROOT_X.LOAD_CLASS$modelFactories = {};

  var id = m.package ? m.package + '.' + m.name : m.name;
  _ROOT_X.LOAD_CLASS$modelFactories[id] = function(opt_X) {
    var X = opt_X || _ROOT_X;
    var path = packagePath(X, m.package);
    Object.defineProperty(path, m.name, {
      get: function () {
        // console.time('registerModel: ' + id);
        USED_MODELS[id] = true;
        delete UNUSED_MODELS[id];
        Object.defineProperty(path, m.name, {value: null, configurable: true});

        var work = [];
        // console.time('buildModel: ' + id);
        if ( _ROOT_X.LOAD_CLASS$modelFactories[id].sourcePath ) { 
          m.sourcePath = _ROOT_X.LOAD_CLASS$modelFactories[id].sourcePath;
        }
        var model = JSONUtil.mapToObj(X, m, Model, work);
        // console.timeEnd('buildModel: ' + id);
        if ( work.length > 0 && model.required__ )
          model.required__ = aseq(
            aseq.apply(null, work),
            model.required__); 
        X.registerModel(model);

        // console.timeEnd('registerModel: ' + id);
        return this[m.name];
      },
      configurable: true
    });
  };
  if ( document && document.currentScript ) {
    _ROOT_X.LOAD_CLASS$modelFactories[id].sourcePath = document.currentScript.src;
  }
  
}


function CLASS(m) {

  /** Lazily create and register Model first time it's accessed. **/
  function registerModelLatch(path, m) {
    var id = m.package ? m.package + '.' + m.name : m.name;

    UNUSED_MODELS[id] = true;

    // TODO(adamvy): Remove this once we no longer have code depending on models to being in the global scope.
    if ( ! m.package )
      Object.defineProperty(GLOBAL, m.name, { get: function() { return path[m.name]; }, configurable: true });

    //console.log("Model Getting defined: ", m.name, X.NAME);
    Object.defineProperty(path, m.name, {
      get: function () {
        // console.time('registerModel: ' + id);
        USED_MODELS[id] = true;
        delete UNUSED_MODELS[id];
        Object.defineProperty(path, m.name, {value: null, configurable: true});

        var work = [];
        // console.time('buildModel: ' + id);
        var model = JSONUtil.mapToObj(X, m, Model, work);
        // console.timeEnd('buildModel: ' + id);
        if ( work.length > 0 && model.required__ ) {
          model.required__ = aseq(
            aseq.apply(null, work),
            model.required__);
        }

        X.registerModel(model);

        // console.timeEnd('registerModel: ' + id);
        return model;
      },
      configurable: true
    });
  }

  if ( document && document.currentScript ) m.sourcePath = document.currentScript.src;

  registerModelLatch(packagePath(X, m.package), m);
}

var MODEL = CLASS;

function INTERFACE(imodel) {
  // Unless in DEBUG mode, just discard interfaces as they're only used for type checking.
  // if ( ! DEBUG ) return;
  var i = JSONUtil.mapToObj(X, imodel, Interface);
  packagePath(X, i.package)[i.name] = i;

  var id = i.package ? i.package + '.' + i.name : i.name;
  NONMODEL_INSTANCES[id] = true;
}


/** Called when a Model is registered. **/
function onRegisterModel(m) {
  // NOP
}
