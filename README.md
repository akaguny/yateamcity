# yateamcity
yet another teamcity library for nodejs
## install
```sh
npm i yateamcity
```
```js
const teamcity = require('yateamcity');
```

[![npm version](https://badge.fury.io/js/yateamcity.svg)](https://www.npmjs.com/package/yateamcity)
[![Build Status](https://travis-ci.org/akaguny/yateamcity.svg?branch=master)](https://travis-ci.org/akaguny/yateamcity)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [API](#api)
- [Contributing](#contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
## API
<!-- START jsdoc-md-embedded -->
<a name="module_yateamcity"></a>

### yateamcity : <code>Object</code>

* [yateamcity](#module_yateamcity) : <code>Object</code>
    * _static_
        * [.setBuildStatus](#module_yateamcity.setBuildStatus)
        * [.setBuildProblem](#module_yateamcity.setBuildProblem)
        * [.setBuildName](#module_yateamcity.setBuildName)
        * [.getBuildArtifact](#module_yateamcity.getBuildArtifact) ⇒ <code>Promise.&lt;Any&gt;</code>
        * [.getBuildStatistics](#module_yateamcity.getBuildStatistics) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> \| <code>Promise.&lt;Object&gt;</code>
        * [.prepareEslintReportForTeamcity](#module_yateamcity.prepareEslintReportForTeamcity)
        * [.getBranches](#module_yateamcity.getBranches) ⇒ <code>Promise.&lt;Array&gt;</code>
        * [.getProperties](#module_yateamcity.getProperties)
        * [.getLatestSuccessBuildId](#module_yateamcity.getLatestSuccessBuildId) ⇒ <code>Promise.&lt;String&gt;</code>
        * [.isTeamcity](#module_yateamcity.isTeamcity) ⇒ <code>boolean</code>
    * _inner_
        * [~normalizeBuildOptions(options)](#module_yateamcity..normalizeBuildOptions) ⇒ <code>PromiseLike.&lt;object&gt;</code> \| <code>Promise.&lt;object&gt;</code>
        * [~Options](#module_yateamcity..Options)

<a name="module_yateamcity.setBuildStatus"></a>

#### yateamcity.setBuildStatus
set build status

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  

| Param | Type | Description |
| --- | --- | --- |
| status | <code>String</code> | build status |
| [reason] | <code>String</code> | reason |

<a name="module_yateamcity.setBuildProblem"></a>

#### yateamcity.setBuildProblem
set build problem

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  

| Param | Type | Description |
| --- | --- | --- |
| problemDescription | <code>String</code> | problem description |
| problemTypeId | <code>String</code> | problem id, in future you can what problem trend in teamcity interface |

<a name="module_yateamcity.setBuildName"></a>

#### yateamcity.setBuildName
set build number

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  

| Param | Type | Description |
| --- | --- | --- |
| buildName | <code>String</code> | build number, that string will be show in history of branch builds |

<a name="module_yateamcity.getBuildArtifact"></a>

#### yateamcity.getBuildArtifact ⇒ <code>Promise.&lt;Any&gt;</code>
get build artifacts

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  
**Returns**: <code>Promise.&lt;Any&gt;</code> - - id latest successful build  

| Param | Type | Description |
| --- | --- | --- |
| _options | <code>Options</code> | options object |

<a name="module_yateamcity.getBuildStatistics"></a>

#### yateamcity.getBuildStatistics ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> \| <code>Promise.&lt;Object&gt;</code>
get build statistics

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> \| <code>Promise.&lt;Object&gt;</code> - - parameter value or all parameters values if name of the parametr dont send as argument  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [statisticsParameterName] | <code>String</code> |  | name of the parameter |
| [buildId] | <code>String</code> | <code>buildId</code> | build if |

<a name="module_yateamcity.prepareEslintReportForTeamcity"></a>

#### yateamcity.prepareEslintReportForTeamcity
prepare eslint report for teamcity

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  
**See**: [https://confluence.jetbrains.com/display/TCD10/Build+Script+Interaction+with+TeamCity#BuildScriptInteractionwithTeamCity-ReportingTests](https://confluence.jetbrains.com/display/TCD10/Build+Script+Interaction+with+TeamCity#BuildScriptInteractionwithTeamCity-ReportingTests)  

| Param | Type | Description |
| --- | --- | --- |
| eslintReport | <code>Object</code> | parsed object of eslint results |

<a name="module_yateamcity.getBranches"></a>

#### yateamcity.getBranches ⇒ <code>Promise.&lt;Array&gt;</code>
get branches from teamcity build

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - - list of branches  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> | options object |

<a name="module_yateamcity.getProperties"></a>

#### yateamcity.getProperties
get all availeble options from teamCity

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  
<a name="module_yateamcity.getLatestSuccessBuildId"></a>

#### yateamcity.getLatestSuccessBuildId ⇒ <code>Promise.&lt;String&gt;</code>
get latest successfully build

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  
**Returns**: <code>Promise.&lt;String&gt;</code> - - id latest successful build  

| Param | Type | Description |
| --- | --- | --- |
| _options | <code>Options</code> | options object |

<a name="module_yateamcity.isTeamcity"></a>

#### yateamcity.isTeamcity ⇒ <code>boolean</code>
check where script was running

**Kind**: static property of [<code>yateamcity</code>](#module_yateamcity)  
**Returns**: <code>boolean</code> - - is script running in teamcity  
<a name="module_yateamcity..normalizeBuildOptions"></a>

#### yateamcity~normalizeBuildOptions(options) ⇒ <code>PromiseLike.&lt;object&gt;</code> \| <code>Promise.&lt;object&gt;</code>
get normalize build options

**Kind**: inner method of [<code>yateamcity</code>](#module_yateamcity)  
**Returns**: <code>PromiseLike.&lt;object&gt;</code> \| <code>Promise.&lt;object&gt;</code> - normalized options  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> | options object |

<a name="module_yateamcity..Options"></a>

#### yateamcity~Options
**Kind**: inner typedef of [<code>yateamcity</code>](#module_yateamcity)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| serverUrl | <code>string</code> | base url teamcity with protocol |
| login | <code>string</code> | login |
| password | <code>string</code> | password |
| buildTypeId | <code>string</code> | build type id |
| branch | <code>string</code> \| <code>function</code> | branch name or function what return that |


<!-- END jsdoc-md-embedded -->

## Contributing
we use [Conventional Commits](https://conventionalcommits.org) for best changelog and version control

Develop:
* for tests run `npm test`
* for codestyle checks run `npm style`
* for doc generate run `npm run docs`
* for release(generate changelog, add version tag) run `npm run release`. We use package named [standart-version](https://www.npmjs.com/package/standard-version) and you can use this features

### TODO
* add doctoc, jsdoc generation for Readme
* add deploy on npm with travis
* improove coverage
* add yaspell checks for readme
```
-------------|----------|----------|----------|----------|
File         |  % Stmts | % Branch |  % Funcs |  % Lines |
-------------|----------|----------|----------|----------|
All files    |    52.44 |    19.44 |    51.61 |    52.63 |
 teamcity.js |    53.85 |    26.92 |    53.85 |       55 |
 utils.js    |    47.06 |        0 |       40 |    43.75 |
-------------|----------|----------|----------|----------|
```