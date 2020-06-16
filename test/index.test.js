/*
 * Copyright 2019 Adobe. All rights reserved.
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

'use strict';

const assert = require('assert');
const path = require('path');
const NodeHttpAdapter = require('@pollyjs/adapter-node-http');
const { setupMocha: setupPolly } = require('@pollyjs/core');
const FSPersister = require('@pollyjs/persister-fs');
const index = require('../src/index.js').main;

describe('Index Tests', () => {
  it('index function is present', async () => {
    const result = await index({});
    assert.equal(result.statusCode, 404);
  });

  it('index function returns an object', async () => {
    const result = await index();
    assert.equal(typeof result, 'object');
  });
});

describe('Helix-Demo Query Generation', () => {
  setupPolly({
    recordIfMissing: true,
    recordFailedRequests: true,
    logging: false,
    adapters: [NodeHttpAdapter],
    persister: FSPersister,
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, 'fixtures/recordings'),
      },
    },
    matchRequestsBy: {
      headers: {
        exclude: ['user-agent'],
      },
    },
  });

  it('non-existing repo looks good', async () => {
    const result = await index({
      __ow_path: '/blog-posts/all',
      __hlx_owner: 'trieloff',
      __hlx_repo: 'helix-foo',
      __hlx_ref: '3aea5fd4cd4d40f5f7c6ce3d74c6f20999903cd3',
    });
    assert.equal(result.statusCode, 404);
  });

  it('non-existing query looks good', async () => {
    const result = await index({
      __ow_path: '/blog-posts/unknown',
      __hlx_owner: 'trieloff',
      __hlx_repo: 'helix-demo',
      __hlx_ref: 'ade6426d0ff01b543bfa06841bb184997924336a',
    });
    assert.equal(result.statusCode, 404);
  });

  it('all query URL looks good', async () => {
    const result = await index({
      __ow_path: '/blog-posts/all',
      __hlx_owner: 'trieloff',
      __hlx_repo: 'helix-demo',
      __hlx_ref: 'ade6426d0ff01b543bfa06841bb184997924336a',
    });

    assert.equal(result.statusCode, 307);
    assert.equal(result.headers['X-Content-Type'], 'application/json');
    assert.equal(result.headers['Cache-Control'], 's-maxage=600');
    assert.equal(result.headers.Location, '/1/indexes/trieloff--helix-demo--blog-posts?query=*&hitsPerPage=25');
  });

  it('by-author query URL looks good', async () => {
    const result = await index({
      __ow_path: '/blog-posts/by-author',
      __hlx_owner: 'trieloff',
      __hlx_repo: 'helix-demo',
      __hlx_ref: 'ade6426d0ff01b543bfa06841bb184997924336a',
      author: 'Lars',
    });

    assert.equal(result.statusCode, 307);
    assert.equal(result.headers['X-Content-Type'], 'application/json');
    assert.equal(result.headers['Cache-Control'], 's-maxage=300');
    assert.equal(result.headers.Location, '/1/indexes/trieloff--helix-demo--blog-posts?query=*&hitsPerPage=25&filters=author%3ALars');
  });
});
