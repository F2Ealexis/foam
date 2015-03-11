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

LOAD_CLASS({
  name: 'CalcView',
  package: 'foam.apps.calc',
  extendsModel: 'foam.ui.View',
  requires: [
    'foam.apps.calc.HistoryCitationView',
    'foam.ui.SlidePanel',
    'foam.apps.calc.MainButtonsView',
    'foam.apps.calc.SecondaryButtonsView',
    'foam.apps.calc.TertiaryButtonsView',
    'foam.apps.calc.CalcButton',
    'foam.apps.calc.CalcSpeechView',
    'foam.apps.calc.Fonts'
    
    // 'foam.chromeapp.ui.ZoomView'
  ],
  exports: [
    'data'
  ],
  templates: [
    function CSS() {/*
    * {
      box-sizing: border-box;
      outline: none;
    }

    html {
      height: 100%;
      margin: 0;
      overflow: initial;
      padding: 0;
      width: 100%;
    }

    body {
      -webkit-user-select: none;
      -webkit-font-smoothing: antialiased;
      font-family: RobotoDraft, 'Helvetica Neue', Helvetica, Arial;
      font-size: 30px;
      font-weight: 300;
      height: 100%;
      position: fixed;
      margin: 0;
      overflow: hidden;
      padding: 0;
      width: 100%;
    }

    ::-webkit-scrollbar {
      display: none;
    }

    ::-webkit-scrollbar-thumb {
      display: none;
    }

    .calc {
      background-color: #eee;
      border: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      margin: 0;
      padding: 0px;
    }

    .deg, .rad {
      background-color: #eee;
      color: #111;
      font-size: 22px;
      font-weight: 400;
      opacity: 0;
      padding-left: 8px;
      padding-right: 10px;
      transition: opacity 0.8s;
    }

    .active {
      opacity: 1;
      z-index: 2;
    }

    .calc-display, .calc-display:focus {
      border: none;
      letter-spacing: 1px;
      line-height: 36px;
      margin: 0;
      min-width: 140px;
      padding: 0 25pt 2pt 25pt;
      text-align: right;
      -webkit-user-select: text;
      overflow-y: scroll;
      overflow-x: hidden;
    }

    .edge {
      background: linear-gradient(to bottom, rgba(240,240,240,1) 0%,
                                             rgba(240,240,240,0) 100%);
      height: 20px;
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 1;
    }

    .calc .buttons {
      flex: 1 1 100%;
      width: 100%;
      height: 252px;
    }

    .button-row {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      flex: 1 1 100%;
      justify-content: space-between;
    }

    .button {
      flex-grow: 1;
      justify-content: center;
      display: flex;
      align-items: center;
      background-color: #4b4b4b;
    }

    .rhs-ops {
      border-left-width: 1px;
      border-left-style: solid;
      border-left-color: rgb(68, 68, 68);
      background: #777;
    }

    .rhs-ops .button {
      background-color: #777;
    }

    .button-column {
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
    }

    .inner-calc-display {
      position: absolute;
      right: 20pt;
      top: 100%;
      xxxbottom: 5px;
      width: 100%;
      padding-left: 50px;
      padding-bottom: 11px;
    }

    .calc-display {
      flex-grow: 5;
      position: relative;
    }

    .secondaryButtons {
      padding-left: 30px;
      background: rgb(52, 153, 128);
    }

    .secondaryButtons .button {
      background: rgb(52, 153, 128);
    }

    .tertiaryButtons {
      padding-left: 35px;
      background: rgb(29, 233, 182);
    }

    .tertiaryButtons .button {
      background: rgb(29, 233, 182);
    }

    .keypad {
      flex-grow: 0;
      flex-shrink: 0;
      margin-bottom: -4px;
      z-index: 5;
    }

    .alabel {
      font-size: 30px;
    }

    hr {
      border-style: outset;
      opacity: 0.5;
    }
  */},
    {
      name: 'toHTML',
      template: function() {/*
        <%= this.CalcSpeechView.create({calc: this.data}) %>
        <!-- <%= this.ZoomView.create() %> -->
        <% X.registerModel(this.CalcButton, 'foam.ui.ActionButton'); %>
        <div style="position: relative;z-index: 100;">
          <div tabindex="1" style="position: absolute;">
            <span aria-label="{{{Calc.RAD.label}}}" style="top: 10;left: 0;position: absolute;" id="<%= this.setClass('active', function() { return ! this.data.degreesMode; }) %>" class="rad" title="{{{Calc.RAD.label}}}"></span>
            <span aria-label="{{{Calc.DEG.label}}}" style="top: 10;left: 0;position: absolute;" id="<%= this.setClass('active', function() { return   this.data.degreesMode; }) %>" class="deg" title="{{{Calc.DEG.label}}}"></span>
          </div>
        </div>

        <div class="edge"></div>
        <div id="%%id" class="calc">
          <div class="calc-display">
            <div class="inner-calc-display">
              $$history{ rowView: 'foam.apps.calc.HistoryCitationView' }
              <div>$$row1{mode: 'read-only', tabIndex: 3, escapeHTML: false}</div>
            </div>
          </div>
          <div class="keypad">
          <div class="edge2"></div>
          <%= this.SlidePanel.create({
            data: this.data,
            minWidth: 310,
            minPanelWidth: 320,
            panelRatio: 0.55,
            mainView: 'foam.apps.calc.MainButtonsView',
            stripWidth: 30,
            panelView: {
              factory_: 'foam.ui.SlidePanel',
              stripWidth: 30,
              minWidth: 320,
              minPanelWidth: 220,
              panelRatio: 3/7,
              mainView: 'foam.apps.calc.SecondaryButtonsView',
              panelView: 'foam.apps.calc.TertiaryButtonsView'
            }
           }) %>
          </div>
        </div>
        <%
          // This block causes the calc-display to scroll when updated.
          // To remove this feature replace the .inner-calc-display 'transition:' and
          // 'top:' styles with 'bottom: 0'.
          var move = EventService.framed(EventService.framed(function() {
            if ( ! this.$ ) return;
            var inner$ = this.$.querySelector('.inner-calc-display');
            var outer$ = this.$.querySelector('.calc-display');
            var value = DOMValue.create({element: outer$, property: 'scrollTop' });
            Movement.animate(200, function() { value.value = inner$.clientHeight; })();
          }.bind(this)));
          Events.dynamic(function() { this.data.op; this.data.history; this.data.a1; this.data.a2; }.bind(this), move);
          this.X.window.addEventListener('resize', move);
          // Prevent scrolling above history output
          this.addInitializer(function() {
            var outer$ = this.$.querySelector('.calc-display');
            outer$.addEventListener('scroll', function(e) {
              if ( outer$.scrollTop < outer$.clientHeight )
                outer$.scrollTop = outer$.clientHeight;
            });
            this.$.querySelector('.keypad').addEventListener('mousedown', function(e) { e.preventDefault(); return false; });
          }.bind(this));
        %>
      */}
    }
  ]
});
