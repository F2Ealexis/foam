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
  name: 'EMailView',
  package: 'com.google.mail',
  extendsModel: 'foam.ui.UpdateDetailView',
  properties: [
  ],
  requires: [
    "foam.ui.WebView",
    'foam.ui.md.MonogramStringView',
    'foam.ui.RelativeDateTimeFieldView',
    'foam.ui.ImageBooleanView',
    'foam.ui.ActionSheetView',
    'foam.ui.StringArrayView'
  ],
  actions: [
    {
      name: 'back',
      isAvailable: function() { return true; },
      label: '',
      iconUrl: 'images/ic_arrow_back_24dp.png'
    },
    {
      name: 'moreActions',
      label: '',
      isEnabled: function() { return true; },
      iconUrl: 'icons/ic_more_horiz_white_24dp.png',
      action: function() {
        var actionSheet = this.ActionSheetView.create({
          data: this.data,
          actions: this.data.model_.actions,
        }, this.Y);
        this.X.stack.slideView(actionSheet);
      },
    },
  ],
  templates: [
    function CSS() {/*
      .actionButtonCView-moreActions {
        margin-right: 10px;
      }
    */},
    function toHTML() {/*
      <% this.destroy(); %>
      <div id="<%= this.id %>" class="email-view">
        <div class="header">
          $$back{radius: 22, className: 'backButton'}
          $$subject{mode: 'read-only', className: 'subject'}
          $$archive{iconUrl: 'icons/ic_archive_white_24dp.png'}
          $$moveToInbox{iconUrl: 'icons/ic_inbox_white_24dp.png'}
          $$trash{iconUrl: 'icons/ic_delete_white_24dp.png'}
          $$moreActions
        </div>
        <div class="content">
          <div style="display: flex; display: -webkit-flex">
            $$from{model_: 'foam.ui.md.MonogramStringView'}
            <div style='flex: 1; -webkit-flex: 1'>
              $$from{mode: 'read-only', className: 'from', escapeHTML: true}
              <div class='details'>
                $$to{mode: 'read-only'}
                $$cc{mode: 'read-only'}
                <br>
                $$timestamp{ model_: 'foam.ui.RelativeDateTimeFieldView', mode: 'read-only', className: 'timestamp' }
              </div>
            </div>
            $$starred{
              model_: 'foam.ui.ImageBooleanView',
              className:  'actionButton',
              trueImage:  'images/ic_star_24dp.png',
              falseImage: 'images/ic_star_outline_24dp.png'
            }
          </div>
          $$body{ model_: 'foam.ui.WebView', className: 'body' }
        </div>
      </div>
    */}
  ]
});
