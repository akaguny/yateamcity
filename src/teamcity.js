const xml2js = require('xml2js').parseString,
  fetch = require('node-fetch'),
  base64Encode = require('base64url'),
  eslintTeamcityReporter = require('eslint-teamcity'),
  utils = require('./utils'),
  main = {},
  /**
* Реквизиты доступа
* @typedef {Object} Creditials
* @property {String} login - логин
* @property {String} pasword - пароль
* @property {String} [buildTypeId] - id для поиска сборки
* @property {String} [host] - url сервера teamcity
*/

  /**
* @type {Creditials}
*/
  creditials = {
    username: '',
    password: '',
    host: ''
  },
  TeamcityError = require('./errors').teamcity,
  debug = require('debug')('yateamcity');

module.exports = {
  setBuildStatus,
  setBuildProblem,
  reportStatus,
  setBuildName,
  getBuildArtifact,
  getBuildStatistics,
  prepareEslintReportForTeamcity,
  init,
  getBranches,
  getProperties,
  isTeamcity
};

let buildId = '';

/**
 * Инициализация
 * @param {Creditials} _creditials - реквизиты доступа
 * @param {String|Function} [branch=master] - имя master ветки
 * @return {Promise} - статус инициализации
 */
async function init(_creditials, branch) {
  let pending = [],
    _branches;
  setCreditials(_creditials);
  _branches = await getBranches(_creditials.buildTypeId);
  pending.push(setLatestSuccessfullBuildId(encodeURIComponent(
    typeof branch === 'string'
      ? branch
      : calculateMasterBranch(branch, _branches))));

  return Promise.all(pending);
}

/**
 * @param {Function} [branch] - функция вычисления мастер ветки
 * @param {Array} [_branches] - массив имён веток
 * @return {String} - имя мастер ветки
 */
function calculateMasterBranch(branch, _branches) {
  return typeof branch === 'function'
    ? branch(_branches.map((branch) => branch.internalName))
    : 'master';
}

/**
 * Установка реквизитов доступа
 * @param {Creditials} _creditials - реквизиты доступа
 */
function setCreditials(_creditials) {
  ['host', 'username', 'password', 'buildTypeId'].forEach(item => {
    if (_creditials[item]) {
      creditials[item] = _creditials[item];
    } else {
      throw new Error(`No much argument ${item} from creditials`);
    }
  });
}

/**
 * Выставление статуса
 * @param {String} currentMode - текущий режим
 * @param {Boolean} isSuccess - флаг статуса
 * @param {String} [reason=''] - причина
 */
function reportStatus(currentMode, isSuccess, reason) {
  let _reason;

  switch (currentMode) {
    case 'teamcity':
      if (!isSuccess) {
        setBuildProblem(reason, reason);
      }
      break;
    default:
      _reason = reason ? `=== Reason: ${reason}` : '';
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
 * Получение артефакта сборки
 */
function getBuildArtifact(options) {
  const url = `${creditials.host}/repository/download/${creditials.buildTypeId}/${buildId}:id/reports.zip%21/eslint.json`,
    fetchOpt = {
      method: 'GET',
      headers: headers(creditials.username, creditials.password)
    }

  debug(`getBuildArtifact, ${url}, ${options}`);
  return fetch(options.url, options).then(function (response) {
    return response.ok ? response.json() : Promise.reject(response);
  })
};

/**
 * Установка номера последней удачной сборки
 * @param {String} masterBranchName - имя master ветки
 */
function setLatestSuccessfullBuildId(masterBranchName) {
  return getBuildIdByBuildName(masterBranchName).then((_buildId) => {
    buildId = _buildId;
  });
}

/**
 * Id сборки по имени конфигурации и мастер ветке
 * @param {String} masterBranchName - имя master ветки
 * @return {Promise.<String>} - id последней удачной сборки по заданным
 * параметрам
 */
function getBuildIdByBuildName(masterBranchName) {
  const options = {
    method: 'GET',
    url: `${creditials.host}/httpAuth/app/rest/builds?locator=buildType:${creditials.buildTypeId},branch:name:${masterBranchName},count:1,status:SUCCESS,state:finished`,
    headers: headers(creditials.username, creditials.password)
  };

  debug('\n\noptions.url', options.url, '\n\n');
  return fetch(options.url, options).then(function (response) {
    return response.ok ? response.text() : Promise.reject(response);
  }).then(result => {
    let buildId;
    xml2js(result, function (err, parsed) {
      if (err) {
        process.stdout.write('\n\nError, when send request', '\n\n');
        throw new Error(err);
      } else if (!parsed.builds.build) {
        throw new Error(`No much any successfull build for buildType:${creditials.buildTypeId} and branch:${masterBranchName}`);
      } else {
        buildId = parsed.builds.build[0].$.id;
      }
    });

    return buildId;
  }).catch(function (err) {
    throw new Error(err);
  });
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
 * Установка проблем сборки
 * @param {String} problemDescription - текстовое описание проблемы
 * @param {String} problemTypeId - идентификатор проблемы
 */
function setBuildProblem(problemDescription, problemTypeId) {
  process.stdout.write(`##teamcity[buildProblem description='${problemDescription}' identity='${problemTypeId || ''}']`);
}

/**
 * Установка имени сборки
 * @param {String} buildName - имя сборки
 */
function setBuildName(buildName) {
  process.stdout.write(`##teamcity[buildNumber '${buildName}']`);
}

/**
 * Получить статистику по сборке
 * @param {String} [statisticsParameterName] - название параметра статистики
 * @param {String} [buildId=buildId] - идентификатор сборки
 * @return {Promise<Object[]>|Promise<Object>} - значение параметра или вся статистика
 */
function getBuildStatistics(statisticsParameterName, _buildId = buildId) {
  const options = {
    method: 'GET',
    url: `${creditials.host}/app/rest/builds/buildId:${_buildId}/statistics`,
    headers: headers(creditials.username, creditials.password)
  };

  return fetch(options.url, options).then(function (response) {
    return response.ok ? response.json() : Promise.reject(response);
  }).then(result => {
    let buildStatisticsParameters = statisticsParameterName
      ? utils.findObjectInArrayByPropertyName(result.property, 'name', statisticsParameterName)
      : result.property;
    return buildStatisticsParameters;
  }).catch(function (err) {
    throw new Error(err);
  });
}

/**
 * Получение активных веток в сборке
 * @param {String} [buildTypeId=creditials.buildTypeId] - идентификатор конфигурации сборки
 * @returns {Promise<Array>} объект с набором веток
 */
function getBranches(buildTypeId = creditials.buildTypeId) {
  const url = `${creditials.host}/app/rest/buildTypes/id:${encodeURIComponent(buildTypeId)}/branches?locator=policy:ALL_BRANCHES&fields=branch(internalName,default,active)`,
    fetchOpt = {
      method: 'GET',
      headers: headers(creditials.username, creditials.password)
    };

  return fetch(url, fetchOpt)
    .then(function (response) {
      return response.ok ? response.json() : Promise.reject(response);
    })
    .then((branches) => {
      return branches.branch;
    }).catch(function (err) {
      throw new Error(err);
    });
}

/**
 * Получаем опции teamCity
 * @returns {object} объект свойств
 */
function getProperties() {
  const fs = require('fs'),
    REGEXP_PROPERTY = /^([^#\s].*?)=(.*)$/,
    stringToProps = (src) => {
      return src.split('\n')
        .reduce((result, prop) => {
          if (REGEXP_PROPERTY.test(prop)) {
            // Какой-то треш в тимсити. Экранирует все :
            result[RegExp.$1] = RegExp.$2.replace('\\:', ':');
          }
          return result;
        }, {});
    };

  let buildProps,
    runnerProps,
    configProps;

  buildProps = stringToProps(fs.readFileSync(process.env.TEAMCITY_BUILD_PROPERTIES_FILE, 'utf8'));
  runnerProps = stringToProps(fs.readFileSync(buildProps['teamcity.runner.properties.file'], 'utf8'));
  configProps = stringToProps(fs.readFileSync(buildProps['teamcity.configuration.properties.file'], 'utf8'));

  return Object.assign(buildProps, runnerProps, configProps);
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
    'accept': 'application/json',
    'Authorization': 'Basic ' + base64Encode.encode(`${login}:${password}`)
  };
}

/**
 * Запуск выполнен в окружении teamcity
 * @return {boolean} находимся ли в окружени teamcity
 */
function isTeamcity() {
  return !!process.env.TEAMCITY_VERSION;
}
