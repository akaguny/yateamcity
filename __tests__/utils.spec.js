const utils = require('../src/utils');

describe('utils', () => {

  describe('findObjectInArrayByPropertyName', () => {
    let exampleArrayOfObjects;
    beforeAll(() => {
      exampleArrayOfObjects = [{a: 'a'}, {a: 'b'}, 'c'];
    });

    it('success > value', () => {
      expect(utils.findObjectInArrayByPropertyName(exampleArrayOfObjects,
        'a', 'a')).toEqual(exampleArrayOfObjects[0]);
    });

    it('fail > undefined', () => {
      expect(utils.findObjectInArrayByPropertyName(exampleArrayOfObjects,
        'a', 'd')).toBeUndefined();
    });
  });
});
