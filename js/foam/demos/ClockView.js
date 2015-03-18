/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
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

LOAD_CLASS({
  name:  'ClockView',
  package: 'foam.demos',
  
  extendsModel: 'foam.graphics.CView',
  
  requires: ['foam.graphics.Circle', 'foam.ui.IntFieldView'],
  
  label: 'Clock',

  properties: [
    {
      name:  'color',
      type:  'String',
      defaultValue: 'yellow'
    },
    {
      name:  'lid',
      type:  'foam.graphics.Circle',
      paint: true,
      factory: function() {
        return this.Circle.create({r:this.r,color:this.color});  
      }
    },
    {
      name:  'white',
      type:  'foam.graphics.Circle',
      paint: true,
      factory: function() {
        return this.Circle.create({r:this.r-3,color:'white'});  
      }
    },
    {
      name:  'r',
      label: 'Radius',
      type:  'int',
      view:  'foam.ui.IntFieldView',
      defaultValue: 100
    },
    {
      name:  'a',
      label: 'Rotation',
      type:  'float',
      view:  'foam.ui.IntFieldView',
      defaultValue: 0
    },
    {
      name:  'hourHand',
      type:  'Hand',
      paint: true,
      factory: function() {
        return this.Hand.create({r:this.r-15,width:7,color:'green'});
      }
    },
    {
      name:  'minuteHand',
      type:  'Hand',
      paint: true,
      factory: function() {
        return this.Hand.create({r:this.r-6,width:5,color:'blue'});
      }
    },
    {
      name:  'secondHand',
      type:  'Hand',
      paint: true,
      factory: function() {
        return this.Hand.create({r:this.r-6,width:3,color:'red'});
      }
    }

  ],

  methods: {
    init: function() {
      this.SUPER();
      this.construct();
    },
    
    construct: function() {
      this.SUPER();
      
      this.addChild(this.lid);
      this.addChild(this.white);
      this.addChild(this.hourHand);
      this.addChild(this.minuteHand);
      this.addChild(this.secondHand);
    },

    paintSelf: function() {
      this.canvas.save();

      this.canvas.rotate(this.a);

      var date = new Date();

      //this.secondHand.x = this.hourHand.x = this.minuteHand.x = this.lid.x = this.white.x = this.x;
      //this.secondHand.y = this.hourHand.y = this.minuteHand.y = this.lid.y = this.white.y = this.y;

      this.secondHand.a = Math.PI/2 - Math.PI*2 * date.getSeconds() / 60 ;
      this.minuteHand.a = Math.PI/2 - Math.PI*2 * date.getMinutes() / 60 ;
      this.hourHand.a   = Math.PI/2 - Math.PI*2 * (date.getHours() % 12) / 12;

      this.lid.paint();
      this.white.paint();
      this.hourHand.paint();
      this.minuteHand.paint();
      this.secondHand.paint();

      this.canvas.restore();
    }
  },

  models: [
    FOAM({
      model_: 'Model',
      name: 'Hand',
      label: 'Clock Hand',
      extendsModel: 'foam.graphics.CView',
      properties:
      [
        {
          model_: 'Property',
          name: 'color',
          type: 'String',
          defaultValue: 'blue'
        },
        {
          model_: 'Property',
          name: 'width',
          type: 'int',
          view: 'foam.ui.IntFieldView',
          defaultValue: 5
        },
        {
          model_: 'Property',
          name: 'r',
          label: 'Radius',
          type: 'int',
          view: 'foam.ui.IntFieldView',
          defaultValue: 100
        },
        {
          model_: 'Property',
          name: 'a',
          label: 'Rotation',
          type: 'int',
          view: 'foam.ui.IntFieldView',
          defaultValue: 100
        }
      ],
      methods:
      [
        {
          model_: 'Method',
          name: 'paint',
          code: function ()
          {
            var canvas = this.parent.canvas;

            canvas.beginPath();
            canvas.moveTo(0,0);
            canvas.lineTo(this.r*Math.cos(this.a),-this.r*Math.sin(this.a));
            canvas.closePath();

            canvas.lineWidth = this.width;
            canvas.strokeStyle = this.color;
            canvas.stroke();
          }
        }
      ]
    })
  ]
});


