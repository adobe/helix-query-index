/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */
/* eslint-disable no-param-reassign */

const assert = require('assert');
const visit = require('../src/visitor');

describe('Visitor Unit Tests', () => {
  it('Turns an object uppercase', () => {
    const before = {
      foo: 'bar',
      baz: [
        'zip',
        'zap',
      ],
    };

    const after = {
      foo: 'BAR',
      baz: [
        'ZIP',
        'ZAP',
      ],
    };

    visit(before, (key, value, obj) => {
      if (typeof value === 'string') {
        obj[key] = value.toUpperCase();
      }
    });

    assert.deepEqual(before, after);
  });

  it('Turns an array uppercase', () => {
    const before = [{
      foo: 'bar',
      baz: [
        'zip',
        'zap',
      ],
    }];

    const after = [{
      foo: 'BAR',
      baz: [
        'ZIP',
        'ZAP',
      ],
    }];

    visit(before, (key, value, obj) => {
      if (typeof value === 'string') {
        obj[key] = value.toUpperCase();
      }
    });

    assert.deepEqual(before, after);
  });
});
