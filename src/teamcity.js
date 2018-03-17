const fetch = require('node-fetch');
const base64Encode = require('base64url');
const eslintTeamcityReporter = require('eslint-teamcity');
const utils = require('./utils');
const get = require('lodash.get');
const debug = require('debug')('yateamcity');
const fs = require('fs');

/**
 * @typedef Options - options, not all of them need for all of methods
 * @property {string} serverUrl base url teamcity with protocol
 * @property {string} login login
 * @property {string} password password
 * @property {string} buildTypeId build type id
 * @property {string|function} branch branch name or function what return that
 */

/**
 * set build problem
 * @param {String} problemDescription - problem description
 * @param {String} problemTypeId - problem id, in future you can what problem trend in teamcity interface
 */
function setBuildProblem(problemDescription, problemTypeId) {
  process.stdout.write(`##teamcity[buildProblem description='${problemDescription}' identity='${problemTypeId || ''}']`);
}

/**
 * Выставление статуса
 * @param {String} currentMode - текущий режим
 * @param {Boolean} isSuccess - флаг статуса
 * @param {String} [reason=''] - причина
 */
function reportStatus(currentMode, isSuccess, _reason) {
  let reason = _reason || '';

  switch (currentMode) {
    case 'teamcity':
      if (!isSuccess) {
        setBuildProblem(reason, reason);
      }
      break;
    default:
      reason = reason ? `=== Reason: ${reason}` : '';
      process.stdout.write(`\n\n=== Build ${isSuccess}\n${_reason}`);
  }
}

/**
 * set build status
 * @param {String} status - build status
 * @param {String} [reason] - reason
 */
function setBuildStatus(status, reason) {
  process.stdout.write(`##teamcity[buildStatus status='${status}' text='${reason}']`);
}

/**
 * prepare eslint report for teamcity
 * https://confluence.jetbrains.com/display/TCD10/Build+Script+Interaction+with+TeamCity#BuildScriptInteractionwithTeamCity-ReportingTests
 * @param {Object} eslintReport - parsed object of eslint results
 */
function prepareEslintReportForTeamcity(eslintReport) {
  process.stdout.write(eslintTeamcityReporter(eslintReport));
}

/**
 * set build number
 * @param {String} buildName - build number, that string will be show in history of branch builds
 */
function setBuildName(buildName) {
  process.stdout.write(`##teamcity[buildNumber '${buildName}']`);
}

/**
 * make standart headers for request to teamcity
 * @param {string} login - login
 * @param {string} password - password
 * @returns {object} {{'cache-control': string, 'accept': 'application/json', 'Authorization': string}} - object what can
 */
function headers(login, password) {
  return {
    'cache-control': 'no-cache',
    accept: 'application/json',
    Authorization: `Basic ${base64Encode.encode(`${login}:${password}`)}`,
  };
}

/**
 * get branches from teamcity build
 * @param {Options} options options object
 * @returns {Promise<Array>} - list of branches
 */
function getBranches(options) {
  const url = `${options.host}/app/rest/buildTypes/id:${encodeURIComponent(options.buildTypeId)}/branches?locator=policy:ALL_BRANCHES&fields=branch(internalName,default,active)`;
  const fetchOpt = {
    method: 'GET',
    headers: headers(options.username, options.password),
  };

  return fetch(url, fetchOpt)
    .then(response => (response.ok ? response.json() : Promise.reject(response)))
    .then(branches => branches.branch);
}

/**
 * get normalize build options
 * @param {Options} options - options object
 * @returns {PromiseLike<object> | Promise<object>} normalized options
 */
function normalizeBuildOptions(options) {
  let result;

  if (typeof options.branch === 'function') {
    result = getBranches(options)
      .then(branches => options.branch(branches.branch.map(branch => branch.internalName)))
      .then(branch => Object.assign({}, options, { branch }));
  } else {
    result = Promise.resolve(options);
  }

  return result;
}

/**
 * get build artifacts
 */
async function getBuildArtifact(_options) {
  const options = await normalizeBuildOptions(_options);
  const url = `${options.host}/repository/download/${encodeURIComponent(options.buildTypeId)}/${encodeURIComponent(options.buildId)}:id/${encodeURIComponent(options.artifact)}`;
  const fetchOpt = {
    method: 'GET',
    headers: headers(options.username, options.password),
  };

  debug(`getBuildArtifact, ${url}, ${options}`);
  return fetch(url, fetchOpt).then(response => (response.ok ? response.json() : Promise.reject(response)));
}

/**
 * get latest successfully build
 * @param {Object} _options
 * @return {Promise.<String>} - id latest successful build
 */
async function getLatestSuccessBuildId(_options) {
  const options = await normalizeBuildOptions(_options);
  const url = `${options.host}/httpAuth/app/rest/builds?locator=buildType:${options.buildTypeId},branch:name:${options.branch},count:1,status:SUCCESS,state:finished`;
  const fetchOpt = {
    method: 'GET',
    headers: headers(options.username, options.password),
  };

  return fetch(url, fetchOpt).then(response => (response.ok ? response.text() : Promise.reject(response)))
    .then(parsed => (parsed.builds.build ?
      get(parsed, 'builds.build[0].$.id') :
      Promise.reject(Error(`No much any successfull build for buildType:${options.buildTypeId} and branch:${options.branch}`))));
}

/**
 * get build statistics
 * @param {String} [statisticsParameterName] - name of the parameter
 * @param {String} [buildId=buildId] - build if
 * @return {Promise<Object[]>|Promise<Object>} - parameter value or all parameters values if name of the parametr dont send as argument
 */
function getBuildStatistics(options) {
  const url = `${options.host}/app/rest/builds/buildId:${options.buildId}/statistics`;
  const fetchOpt = {
    method: 'GET',
    headers: headers(options.username, options.password),
  };

  return fetch(url, fetchOpt).then(response => (response.ok ? response.json() : Promise.reject(response))).then((result) => {
    const buildStatisticsParameters = options.statisticsParameterName
      ? utils.findObjectInArrayByPropertyName(result.property, 'name', options.statisticsParameterName)
      : result.property;
    return buildStatisticsParameters;
  }).catch((err) => {
    throw new Error(err);
  });
}

/**
 * get all availeble options from teamCity
 */
function getProperties() {
  const REGEXP_PROPERTY = /^([^#\s].*?)=(.*)$/;
  const stringToProps = src => src.split('\n')
    .reduce((_result, prop) => {
      const result = Object.assign({}, _result);
      if (REGEXP_PROPERTY.test(prop)) {
        result[RegExp.$1] = RegExp.$2.replace('\\:', ':');
      }
      return result;
    }, {});

  const buildProps = stringToProps(fs.readFileSync(process.env.TEAMCITY_BUILD_PROPERTIES_FILE, 'utf8'));
  const runnerProps = stringToProps(fs.readFileSync(buildProps['teamcity.runner.properties.file'], 'utf8'));
  const configProps = stringToProps(fs.readFileSync(buildProps['teamcity.configuration.properties.file'], 'utf8'));

  return Object.assign(buildProps, runnerProps, configProps);
}

/**
 * check where script was running
 * @return {boolean} - is script running in teamcity
 */
function isTeamcity() {
  return !!process.env.TEAMCITY_VERSION;
}

module.exports = {
  setBuildStatus,
  setBuildProblem,
  reportStatus,
  setBuildName,
  getBuildArtifact,
  getBuildStatistics,
  prepareEslintReportForTeamcity,
  getBranches,
  getProperties,
  getLatestSuccessBuildId,
  isTeamcity,
};
