import { capitalizeText } from '../capitalize-text';

describe('FUNC:capitalizeText', () => {
  it('capitalize1', () => {
    const text = 'the BEST';
    const formatted = capitalizeText(text);
    expect(formatted).toEqual('The Best');
  });

  it('capitalize2', () => {
    const text = 'THE Best   ___ of Wor LD';
    const formatted = capitalizeText(text);
    expect(formatted).toEqual('The Best   ___ Of Wor Ld');
  });
});
