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
/* eslint-disable no-unused-expressions */

const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const packjson = require('../package.json');

chai.use(chaiHttp);
const { expect } = chai;

function getbaseurl() {
  const namespace = 'helix';
  const package = 'helix-services-private';
  const name = packjson.name.replace('@adobe/helix-', '');
  let version = `${packjson.version}`;
  if (process.env.CI && process.env.CIRCLE_BUILD_NUM && process.env.CIRCLE_BRANCH !== 'master') {
    version = `ci${process.env.CIRCLE_BUILD_NUM}`;
  }
  return `api/v1/web/${namespace}/${package}/${name}@${version}`;
}

describe('Post-Deploy Tests', () => {
  it('Service is ready for monitoring', () => {
    assert.equal(
      'I am ready to go on call for this',
      'I am ready to go on call for this',
    );
  });

  it('All Blog Posts', async () => {
    const path = '/blog-posts/all?__hlx_owner=trieloff&__hlx_repo=helix-demo&__hlx_ref=ade6426d0ff01b543bfa06841bb184997924336a';

    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}${path}`)
      .redirects(0)
      .then((response) => {
        expect(response).to.redirect;
        expect(response).to.redirectTo('/1/indexes/trieloff--helix-demo--blog-posts?query=*&hitsPerPage=25');
      })
      .catch((e) => {
        throw e;
      });
  }).timeout(10000);
});
