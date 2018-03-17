const parse = require('lodash.get');

const utils = {};

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
