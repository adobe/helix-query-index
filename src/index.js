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
const { fetch } = require('@adobe/helix-fetch');
const { IndexConfig } = require('@adobe/helix-shared');

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
