const parse = require('lodash.get');

const utils = {};

/**
 * Filter array of object by passing property
 * @param {Array} array - array of objects
 * @param {String} property - property what we match
 * @param {String} exeptPropertyValue - property value with what we compare
 * @return {Object} - executed value
 */
function findObjectInArrayByPropertyName(array, property, exeptPropertyValue) {
  return array.find(item => parse(item, property) === exeptPropertyValue);
}

utils.findObjectInArrayByPropertyName = findObjectInArrayByPropertyName;

module.exports = utils;
