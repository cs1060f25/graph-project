import { getFeelingLuckyQuery } from '../utils/feelingLuckyGenerator';

describe(`"I'm feeling lucky" generator`, () => {
  test('returns varied, non-empty topics over multiple invocations', () => {
    const generated = [];
    for (let i = 0; i < 10; i += 1) {
      generated.push(getFeelingLuckyQuery());
    }

    // All suggestions must be usable search strings
    expect(generated.every((q) => typeof q === 'string' && q.trim().length > 0)).toBe(true);

    // Desired behaviour: at least one suggestion should differ from the default "machine learning"
    // This expectation FAILS today because the generator always returns "machine learning".
    expect(generated.some((topic) => topic !== 'machine learning')).toBe(true);
  });
});


