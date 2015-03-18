/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

// TODO: Use this font for timer: http://www.dafont.com/digital-7.font
LOAD_CLASS({
  package: 'com.google.sweeper',
  name: 'Game',

  extendsModel: 'foam.ui.View',

  requires: [ 'com.google.sweeper.Board' ],

  properties: [
    {
      model: 'IntProperty',
      name: 'time'
    },
    {
      name: 'board',
      lazyFactory: function() { return this.Board.create(); }
    }
  ],

  methods: {
    init: function() {
      this.SUPER();
      this.tick();
    }
  },

  listeners: [
    {
      name: 'tick',
      isMerged: 1000,
      code: function() {
        this.time++;
        this.tick();
      }
    }
  ],

  templates: [
    function CSS() {/*
      body {
        -webkit-user-select: none;
      }

    */},
    function toHTML() {/*
      $$time{mode: 'read-only'}
      <br>
      %%board
    */}
  ]

});
