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
const { wrap } = require('@adobe/openwhisk-action-utils');
const { logger } = require('@adobe/openwhisk-action-logger');
const { wrap: status } = require('@adobe/helix-status');
const { epsagon } = require('@adobe/helix-epsagon');
const { qb } = require('@adobe/helix-querybuilder');
const fetchAPI = require('@adobe/helix-fetch');
const { IndexConfig } = require('@adobe/helix-shared');

const { fetch } = process.env.HELIX_FETCH_FORCE_HTTP1
  /* istanbul ignore next */
  ? fetchAPI.context({
    userAgent: 'helix-fetch', // static user-agent for recorded tests
    alpnProtocols: [fetchAPI.ALPN_HTTP1_1],
  })
  /* istanbul ignore next */
  : fetchAPI;

function getIndex(i, name) {
  const [myindex] = i.indices.filter((idx) => idx.name === name);
  return myindex;
}

function getURL(target, query, paramlist, params) {
  const embedurl = new URL('https://adobeioruntime.net/api/v1/web/helix/helix-services/data-embed@v1');

  const searchparams = qb.url(query, 'hlx_');
  searchparams.forEach((value, name) => {
    searchparams.set(name, IndexConfig.evaluate(value, paramlist, params));
  });

  searchparams.append('src', target);

  embedurl.search = searchparams;

  return embedurl.href;
}

/**
 * This is the main function
 * @param {string} name name of the person to greet
 * @returns {object} a greeting
 */
async function main(params) {
  const { __ow_logger: log } = params;
  const cleanparams = Object.entries(params).reduce((clean, [key, value]) => {
    if (!key.startsWith('__')) {
      // eslint-disable-next-line no-param-reassign
      clean[key] = value;
    }
    return clean;
  }, {});

  const path = params.__ow_path || '';
  const [, index, query] = path.split('/');
  /* eslint-disable no-underscore-dangle */
  const owner = params.__hlx_owner;
  const repo = params.__hlx_repo;
  const ref = params.__hlx_ref;
  /* eslint-enable no-underscore-dangle */

  if (!(index && query && owner && repo && ref)) {
    log.warn(`Missing parameters for ${index}/${query} and ${owner}/${repo}/${ref}`);
    return {
      statusCode: 404,
      body: 'Invalid index or query or missing owner, repo, and ref.',
      headers: {
        'Cache-Control': 's-maxage=600',
      },
    };
  }

  const resp = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/helix-query.yaml`);
  if (resp.status !== 200) {
    log.warn(`Missing index config for ${owner}/${repo}/${ref}`);
    return {
      statusCode: 404,
      body: 'Index configuration does not exist',
      headers: {
        'Cache-Control': 's-maxage=600',
      },
    };
  }

  const yamltext = await resp.text();
  const config = await new IndexConfig().withSource(yamltext).init();

  const i = getIndex(config, index);
  const q = config.getQuery(index, query);
  if (q
    && typeof q.query !== 'string'
    && i.target
    && (i.target.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/.*/)
    || i.target.match(/^https:\/\/.*\.sharepoint\.com\//))) {
    return {
      statusCode: 307,
      headers: {
        Location: getURL(i.target, q.query, q.parameters, cleanparams),
        'X-Content-Type': 'application/json',
        'X-Static': 'Raw/Query',
        'Cache-Control': `s-maxage=${config.getQueryCache(index, query)}`,
      },
    };
  }

  const location = config.getQueryURL(index, query, owner, repo, cleanparams);
  if (!location) {
    log.warn(`Unknown query ${index}/${query} for ${owner}/${repo}/${ref}`);
    return {
      statusCode: 404,
      body: 'Specified index not found in index configuration',
      headers: {
        'Cache-Control': 's-maxage=600',
      },
    };
  }

  return {
    statusCode: 307,
    headers: {
      // indexname, queryname, owner, repo, urlparams)
      Location: config.getQueryURL(index, query, owner, repo, cleanparams),
      'X-Content-Type': 'application/json',
      'X-Static': 'Raw/Query',
      'Cache-Control': `s-maxage=${config.getQueryCache(index, query)}`,
    },
  };
}

module.exports.main = wrap(main)
  .with(epsagon)
  .with(status)
  .with(logger.trace)
  .with(logger);
