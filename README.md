# Helix Query Index

> Run queries against an Algolia index on Adobe I/O Runtime

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-index-query.svg)](https://codecov.io/gh/adobe/helix-query-index)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/helix-query-index.svg)](https://circleci.com/gh/adobe/helix-query-index)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-query-index.svg)](https://github.com/adobe/helix-query-index/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-query-index.svg)](https://github.com/adobe/helix-query-index/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/helix-query-index.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/helix-query-index)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) 

## Installation

## Usage

```bash
curl https://adobeioruntime.net/api/v1/web/helix/helix-services/query-index@v1
```

For more, see the [API documentation](docs/API.md).

## Development

### Deploying Helix Service

Deploying Helix Query Index requires the `wsk` command line client, authenticated to a namespace of your choice. For Project Helix, we use the `helix` namespace.

All commits to main that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get commited as `/helix-services/query-index@ci<num>` and tagged with the CI build number.

