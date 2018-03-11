const path = require('path');
const parse = require('lodash.get');

const agentPathMatcher = { teamcity: /.*teamcity-agent\/work\/[0-9a-z]+\// };
const utils = {};

/**
 * Удалить специфичный для окружения путь
 * @param {String} specificPath - путь
 * @param {RegExp|String} patternForEnv - шаблон в виде RegExp характеризующий часть пути окружения или сосбственно часть пути
 * @return {String} путь без специфичной составляющей
 */
function deleteSpecificPathForEnviroment(specificPath, patternForEnv) {
  let resultPath = '';
  let matchedStr = '';
  matchedStr = patternForEnv instanceof RegExp ? patternForEnv.exec(specificPath)[0] : patternForEnv;
  resultPath = specificPath.slice(specificPath.indexOf(matchedStr) + matchedStr.length);

  return resultPath;
}

/**
 * Совместить путь из другого окружения и текущего
 * FIXME: расчитывается на то, что скрипты запускаются из корня проекта
 * @param {String} currentBasePath - текущий путь запуска скрипта
 * @param {String} pathFromAnotherEnv - путь сформированный в другом окружении
 * @param {String} env - окружение
 * @param {RegExp} [customEnvPathMatcher] - заданный матчер постоянной составляющей пути окружения
 * @return {String} результирующий путь
 */
function mergePathFromAnotherEnv(currentBasePath, pathFromAnotherEnv, env, customEnvPathMatcher) {
  if (typeof agentPathMatcher[env] === 'undefined' && typeof customEnvPathMatcher === 'undefined') {
    throw new Error(`Параметр env ${env ? `${env} не поддерживается` : 'не задан'}`);
  }
  return path.join(currentBasePath, deleteSpecificPathForEnviroment(pathFromAnotherEnv, customEnvPathMatcher || agentPathMatcher[env]));
}

/**
 * Режим расширенного логирования
 * @returns {boolean} режим расширенного логирования включен
 */
function isVerboseMode() {
  return process.argv.indexOf('--verbose') !== -1;
}

/**
 * Получить значение из массива объектов
 * @param {Array} array - массив для извлечения
 * @param {String} property - свойство со значением которого будем сравнивать
 * @param {String} exeptPropertyValue - значение свойства, с которым мы будем сравнивать
 * @return {Object} - извлечённое значение
 */
function findObjectInArrayByPropertyName(array, property, exeptPropertyValue) {
  return array.find(item => parse(item, property) === exeptPropertyValue);
}

utils.findObjectInArrayByPropertyName = findObjectInArrayByPropertyName;

module.exports = utils;
