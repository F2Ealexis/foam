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
  name: 'AbstractMetricsReportingDAO',
  package: 'com.google.analytics',
  extendsModel: 'AbstractDAO',

  properties: [
    {
      model_: 'StringProperty',
      name: 'propertyId'
    },
    {
      model_: 'StringProperty',
      name: 'clientId'
    },
    {
      model_: 'StringProperty',
      name: 'appName'
    },
    {
      model_: 'StringProperty',
      name: 'appId'
    },
    {
      model_: 'StringProperty',
      name: 'appVersion'
    },
    {
      model_: 'StringProperty',
      name: 'endpoint',
      defaultValue: 'http://www.google-analytics.com/collect'
    }
  ],

  methods: {
    put: function(o, sink) {
      var data = [
        'v=1',
        'tid=' + this.propertyId,
        'cid=' + this.clientId
      ];

      if ( this.appName ) {
        data.push('an=' + this.appName);
      }
      if ( this.appId ) {
        data.push('aid=' + this.appId);
      }
      if ( this.appVersion ) {
        data.push('av=' + this.appVersion);
      }

      if ( o.type === 'timing' ) {
        data.push('t=timing');
        data.push('utc=' + encodeURIComponent(o.subType));
        data.push('utv=' + encodeURIComponent(o.name));
        data.push('utt=' + o.value);
      } else if ( o.type === 'error' ) {
        data.push('t=exception');
        data.push('exd=' + o.name);
      } else {
        data.push('t=event');
        data.push('ec=' + encodeURIComponent(o.subType));
        data.push('ea=' + encodeURIComponent(o.name));
        data.push('ev=' + o.value);
      }

      if ( ! o.interactive ) {
        data.push('ni=1');
      }

      data.push("z=" + Math.floor(Math.random() * 10000).toString(10));

      data = data.join('&');

      this.send_(o, data, sink);
    }
  }
});
