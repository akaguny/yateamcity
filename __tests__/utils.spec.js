const utils = require('../src/utils');

describe('utils', () => {
  it('есть нужные функции', () => {
    expect(typeof utils.mergePathsFromAnyEnv === 'function').toBeTruthy();
  });

  describe('mergePathsFromAnyEnv', () => {
    it('env не задан', () => {
      expect(utils.mergePathsFromAnyEnv).toThrowError('Параметр env не задан');
    });

    it('env задан', () => {
      let path = utils.mergePathsFromAnyEnv('/home/alexey/IdeaProjects/sfa',
        '/opt/teamcity-agent/work/89d8f1306cb75ef7/devTools/js/grunt-config/clean.js', 'teamcity');

      expect(path.replace(/\\/g, '/')).toEqual('/home/alexey/IdeaProjects/sfa/devTools/js/grunt-config/clean.js');
    });
  });

  describe('isVerboseMode', () => {
    it('true', () => {
      process.argv.push('--verbose');

      expect(utils.isVerboseMode()).toBeTruthy();
      process.argv.pop();
    });

    it('false', () => {
      expect(utils.isVerboseMode()).toBeFalsy();
    });
  });

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
