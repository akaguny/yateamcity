const util = require('util');
const xml2js = util.promisify(require('xml2js').parseString);
const fetch = require('node-fetch');
const base64Encode = require('base64url');
const eslintTeamcityReporter = require('eslint-teamcity');
const utils = require('./utils');
const get = require('lodash.get');
const debug = require('debug')('yateamcity');
const fs = require('fs');

/**
 * Установка проблем сборки
 * @param {String} problemDescription - текстовое описание проблемы
 * @param {String} problemTypeId - идентификатор проблемы
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
 * Установка статуса сборки
 * @param {String} status - статус сборки
 * @param {String} [reason] - причина
 */
function setBuildStatus(status, reason) {
  process.stdout.write(`##teamcity[buildStatus status='${status}' text='${reason}']`);
}

/**
 * представление результатов проверки eslint в виде teamcity test
 * https://confluence.jetbrains.com/display/TCD10/Build+Script+Interaction+with+TeamCity#BuildScriptInteractionwithTeamCity-ReportingTests
 * @param {Object} eslintJsonReport - данные JSON объекта
 */
function prepareEslintReportForTeamcity(eslintJsonReport) {
  process.stdout.write(eslintTeamcityReporter(eslintJsonReport));
}

/**
 * Установка имени сборки
 * @param {String} buildName - имя сборки
 */
function setBuildName(buildName) {
  process.stdout.write(`##teamcity[buildNumber '${buildName}']`);
}

/**
 * Make standart headers for request to teamcity
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
 * Получение активных веток в сборке
 * @param {object} options объект опций
 * @param {string} options.serverUrl базовый url teamcity
 * @param {string} options.login логин
 * @param {string} options.password пароль
 * @param {string} options.buildTypeId build type id
 * @returns {Promise<Array>} объект с набором веток
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
 * Получение нормализованых опций
 * @param {object} options объект опций
 * @param {string} options.serverUrl базовый url teamcity
 * @param {string} options.login логин
 * @param {string} options.password пароль
 * @param {string} options.buildTypeId build type id
 * @param {string|function} options.branch имя ветки
 * @returns {PromiseLike<object> | Promise<object>} набор нормализованных опций,
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
 * Получение артефакта сборки
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
 * Id сборки по имени конфигурации и ветке
 * @param {Object} _options - имя master ветки
 * @return {Promise.<String>} - id последней удачной сборки по заданным
 * параметрам
 */
async function getLatestSuccessBuildId(_options) {
  const options = await normalizeBuildOptions(_options);
  const url = `${options.host}/httpAuth/app/rest/builds?locator=buildType:${options.buildTypeId},branch:name:${options.branch},count:1,status:SUCCESS,state:finished`;
  const fetchOpt = {
    method: 'GET',
    headers: headers(options.username, options.password),
  };

  return fetch(url, fetchOpt).then(response => (response.ok ? response.text() : Promise.reject(response)))
    .then(xml2js)
    .then(parsed => (parsed.builds.build ?
      get(parsed, 'builds.build[0].$.id') :
      Promise.reject(Error(`No much any successfull build for buildType:${options.buildTypeId} and branch:${options.branch}`))));
}

/**
 * Получить статистику по сборке
 * @param {String} [statisticsParameterName] - название параметра статистики
 * @param {String} [buildId=buildId] - идентификатор сборки
 * @return {Promise<Object[]>|Promise<Object>} - значение параметра или вся статистика
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
 * Получаем опции teamCity
 * @returns {object} объект свойств
 */
function getProperties() {
  const REGEXP_PROPERTY = /^([^#\s].*?)=(.*)$/;
  const stringToProps = src => src.split('\n')
    .reduce((_result, prop) => {
      const result = Object.assign({}, _result);
      if (REGEXP_PROPERTY.test(prop)) {
        // Какой-то треш в тимсити. Экранирует все :
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
 * Запуск выполнен в окружении teamcity
 * @return {boolean} находимся ли в окружени teamcity
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
