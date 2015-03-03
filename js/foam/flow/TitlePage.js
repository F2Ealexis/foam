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

CLASS({
  name: 'TitlePage',
  package: 'foam.flow',
  extendsModel: 'foam.flow.Element',

  templates: [
    function toHTML() {/*
      <flow-title-page id="%%id"><%= this.inner() %></flow-book-title>
    */},
    function CSS() {/*
      flow-title-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }

      flow-title-page > * {
        display: block;
      }

      @media print {

        flow-title-page {
          page-break-after: always;
        }

      }
    */}
  ]
});
