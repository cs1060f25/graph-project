// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Globally mock APIHandlerInterface to avoid importing server-only cache code (firebase-admin)
// Individual tests can override instance behavior as needed
jest.mock('./handlers/api-handler/APIHandlerInterface', () => {
	return jest.fn().mockImplementation(() => ({
		makeQuery: jest.fn().mockResolvedValue([]),
	}));
});
