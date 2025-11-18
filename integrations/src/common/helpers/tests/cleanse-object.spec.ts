import { cleanseObject } from '../cleanse-object';

describe('FUNC:cleanseObject', () => {
  it('cleanseObject', () => {
    const obj = {
      prop1: 1,
      prop2: 'text',
      nested: {
        nested: {
          prop1: 1,
          prop2: -2,
        },
        prop1: -3,
        prop2: 0,
      },
    };

    const newObj = cleanseObject(obj);
    expect(newObj).toEqual({
      prop1: 1,
      prop2: 'text',
      nested: {
        nested: {
          prop1: 1,
        },
        prop2: 0,
      },
    });
  });
});
