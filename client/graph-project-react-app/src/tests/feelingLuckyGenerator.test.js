import { getFeelingLuckyQuery } from '../utils/feelingLuckyGenerator';

const originalGenAIKey = process.env.REACT_APP_GOOGLE_GENAI_API_KEY;

beforeAll(() => {
  delete process.env.REACT_APP_GOOGLE_GENAI_API_KEY;
});

afterAll(() => {
  if (originalGenAIKey !== undefined) {
    process.env.REACT_APP_GOOGLE_GENAI_API_KEY = originalGenAIKey;
  } else {
    delete process.env.REACT_APP_GOOGLE_GENAI_API_KEY;
  }
});

describe(`"I'm feeling lucky" generator`, () => {
  test('returns varied, non-empty topics over multiple invocations', async () => {
    const generated = [];
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      generated.push(await getFeelingLuckyQuery());
    }

    // All suggestions must be usable search strings
    expect(generated.every((q) => typeof q === 'string' && q.trim().length > 0)).toBe(true);

    // Ensure we are no longer stuck on a single fallback like "machine learning"
    expect(generated.some((topic) => topic !== 'machine learning')).toBe(true);
  });
});


