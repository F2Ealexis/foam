/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

LOAD_CLASS({
  name: 'Element',
  package: 'foam.flow',
  extendsModel: 'foam.ui.View',

  requires: [
    'foam.Name'
  ],

  properties: [
    {
      model_: 'ViewFactoryProperty',
      name: 'inner'
    }
  ],

  methods: {
    init: function() {
      this.SUPER.apply(this, arguments);
      this.tagName = this.getTagName();
    },

    getTagName: function() {
      if (this.ELEMENT_NAME) return this.ELEMENT_NAME;
      var Name = this.X.lookup('foam.Name');
      if (Name) return Name.create({ initial: this.name_ }).toTagName();
      return 'foam-flow-element';
    },

    replaceAll: function(str, a, b) {
      var next = str, prev = '';
      while ( prev !== next) {
        prev = next;
        next = next.replace(a, b);
      }
      return next;
    },

    installInDocument: function(X, document) {
      this.SUPER.apply(this, arguments);
      this.X.registerElement(
          this.getTagName(),
          this.model_.package + '.' + this.name_);
    },

    /** Allow inner to be optional when defined using HTML. **/
    fromElement: function(e) {
      // Import nodes that model properties.
      this.SUPER(e);
      // Remove nodes that model properties.
      if ( e.children.length !== 1 || e.children[0].nodeName !== 'inner' ) {
        var childrenToRemove = [];
        for ( var i = 0; i < e.children.length; ++i ) {
          var child = e.children[i];
          for ( var j = 0; j < this.model_.properties_.length; ++j ) {
            var prop = this.model_.properties_[j];
            if ( child.nodeName === prop.name ) {
              childrenToRemove.push(child);
              break;
            }
          }
        }
        for ( i = 0; i < childrenToRemove.length; ++i ) {
          e.removeChild(childrenToRemove[i]);
        }
        this.inner = e.innerHTML;
      }

      return this;
    }
  },

  templates: [
    function toInnerHTML() {/*<%= this.inner() %>*/}
  ]
});
